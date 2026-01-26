import { db } from './apiService';
import { collection, addDoc, updateDoc, doc, increment, Timestamp, getDoc } from '../services/firestoreCompat';
import { 
  generateQRCode, 
  generateAlphanumericCode, 
  generateValidationToken,
  checkRedemptionFrequency 
} from './rewardValidationService';
import { checkRedemptionEligibility } from './customerLevelService';
import { RewardValidationType, RedemptionFrequency } from '../types/rewards';

interface RedeemRewardParams {
  rewardId: string;
  userId: string;
  businessId: string;
  businessName: string;
  title: string;
  description: string;
  costPoints: number;
  type: 'DISCOUNT' | 'FREE_ITEM' | 'VOUCHER' | 'EXPERIENCE' | 'CASHBACK';
  imageUrl?: string;
  terms?: string;
  expiryDays?: number; // How many days until expiry (default 30)
  validationType?: RewardValidationType; // NEW: Physical or Online validation
  redemptionFrequency?: RedemptionFrequency; // NEW: Frequency control
}

/**
 * Redeem a reward and create a redeemed reward record
 */
export const redeemReward = async (params: RedeemRewardParams): Promise<string> => {
  const {
    rewardId,
    userId,
    businessId,
    businessName,
    title,
    description,
    costPoints,
    type,
    imageUrl,
    terms,
    expiryDays = 30,
    validationType = 'PHYSICAL', // Default to physical QR code
    redemptionFrequency = 'unlimited' // Default to unlimited
  } = params;

  try {
    // ============ CHECK CUSTOMER LEVEL ELIGIBILITY ============
    // Check if user's level allows this redemption (daily/weekly/business limits)
    const eligibilityCheck = await checkRedemptionEligibility(
      userId,
      rewardId,
      businessId
    );
    
    if (!eligibilityCheck.canRedeem) {
      // Return human-readable message (NEVER raw numbers)
      throw new Error(eligibilityCheck.message);
    }
    // ============ END LEVEL CHECK ============

    // ============ CHECK REDEMPTION FREQUENCY ============
    // Verify user hasn't exceeded redemption limits
    const frequencyCheck = await checkRedemptionFrequency(
      userId,
      rewardId,
      redemptionFrequency
    );
    
    if (!frequencyCheck.canRedeem) {
      throw new Error(frequencyCheck.reason || 'Cannot redeem at this time');
    }
    // ============ END FREQUENCY CHECK ============

    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    // Generate legacy voucher code (backward compatibility)
    const legacyVoucherCode = generateVoucherCode(rewardId, userId);

    // ============ GENERATE ONE-TIME VALIDATION CODES ============
    let qrCode: string | undefined;
    let alphanumericCode: string | undefined;
    let validationToken: string;
    
    // Create temporary redemption ID for code generation
    const tempRedemptionId = `temp_${Date.now()}_${userId.substring(0, 8)}`;
    
    if (validationType === 'PHYSICAL') {
      // Generate QR code for in-store scanning
      qrCode = await generateQRCode(tempRedemptionId, userId, businessId);
      validationToken = await generateValidationToken(tempRedemptionId, qrCode);
      
      console.log(`[Redemption] Generated QR code for physical validation`);
    } else {
      // Generate alphanumeric code for online validation
      alphanumericCode = generateAlphanumericCode(tempRedemptionId);
      validationToken = await generateValidationToken(tempRedemptionId, alphanumericCode);
      
      console.log(`[Redemption] Generated alphanumeric code: ${alphanumericCode}`);
    }
    // ============ END CODE GENERATION ============

    // Create redeemed reward record with validation codes
    const redeemedRewardRef = await addDoc(collection(db, 'redeemedRewards'), {
      rewardId,
      userId,
      businessId,
      businessName,
      title,
      description,
      costPoints,
      type,
      
      // Legacy fields (backward compatibility)
      voucherCode: legacyVoucherCode,
      
      // NEW: One-time validation codes
      qrCode,
      alphanumericCode,
      validationToken,
      validationType,
      
      // NEW: Validation status
      validated: false, // Not yet used
      validatedAt: null,
      validatedBy: null,
      validationMethod: null,
      
      // Timestamps
      redeemedAt: Timestamp.now(),
      expiresAt: Timestamp.fromDate(expiresAt),
      usedAt: null,
      
      status: 'PENDING', // Changed from 'active' to match new status enum
      terms,
      imageUrl,
      deleted: false,
      
      // NEW: Redemption frequency tracking
      redemptionFrequency
    });

    // Deduct points from user
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      points: increment(-costPoints),
      'stats.totalRewardsRedeemed': increment(1)
    });

    // Decrement reward remaining count
    const rewardRef = doc(db, 'rewards', rewardId);
    await updateDoc(rewardRef, {
      remaining: increment(-1),
      claimed: increment(1) // Track total claimed
    });

    // ============ BUSINESS WALLET CREDIT (Points Recycling Loop) ============
    // Credit the redeemed points to the business wallet
    try {
      const { onCustomerRedemption } = await import('./businessPointsWalletService');
      
      const walletResult = await onCustomerRedemption(
        userId,
        businessId,
        costPoints,
        title
      );
      
      if (walletResult) {
        console.log(`[Redemption] ✅ Credited ${costPoints} points to business ${businessId} wallet`);
      } else {
        console.error('[Redemption] ⚠️ Failed to credit business wallet (non-blocking)');
      }
    } catch (walletError) {
      console.error('[Redemption] ⚠️ Business wallet credit failed (non-blocking):', walletError);
      // Don't fail redemption if wallet credit fails
    }
    // ============ END BUSINESS WALLET CREDIT ============

    return redeemedRewardRef.id;
  } catch (error) {
    console.error('Failed to redeem reward:', error);
    throw error;
  }
};

/**
 * Generate a unique voucher code
 */
const generateVoucherCode = (rewardId: string, userId: string): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  const rewardPart = rewardId.substring(0, 4).toUpperCase();
  
  return `${rewardPart}-${randomPart}-${timestamp}`;
};

/**
 * Mark a redeemed reward as used
 */
export const markRewardAsUsed = async (redeemedRewardId: string): Promise<void> => {
  try {
    const rewardRef = doc(db, 'redeemedRewards', redeemedRewardId);
    await updateDoc(rewardRef, {
      status: 'used',
      usedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Failed to mark reward as used:', error);
    throw error;
  }
};

/**
 * Check if user can afford a reward
 */
export const canAffordReward = (userPoints: number, rewardCost: number): boolean => {
  return userPoints >= rewardCost;
};

/**
 * Calculate expiry urgency (hours remaining)
 */
export const getExpiryUrgency = (expiresAt: Date): {
  hoursRemaining: number;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  color: string;
} => {
  const now = new Date();
  const diff = expiresAt.getTime() - now.getTime();
  const hoursRemaining = diff / (1000 * 60 * 60);

  if (hoursRemaining <= 0) {
    return { hoursRemaining: 0, urgency: 'critical', color: 'text-red-600' };
  } else if (hoursRemaining <= 24) {
    return { hoursRemaining, urgency: 'critical', color: 'text-red-500' };
  } else if (hoursRemaining <= 72) {
    return { hoursRemaining, urgency: 'high', color: 'text-orange-500' };
  } else if (hoursRemaining <= 168) {
    return { hoursRemaining, urgency: 'medium', color: 'text-yellow-600' };
  } else {
    return { hoursRemaining, urgency: 'low', color: 'text-gray-500' };
  }
};
