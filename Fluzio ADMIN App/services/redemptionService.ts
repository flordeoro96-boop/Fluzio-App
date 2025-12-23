import { db } from './AuthContext';
import { collection, addDoc, updateDoc, doc, increment, Timestamp } from 'firebase/firestore';

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
    expiryDays = 30
  } = params;

  try {
    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    // Generate voucher code
    const voucherCode = generateVoucherCode(rewardId, userId);

    // Create redeemed reward record
    const redeemedRewardRef = await addDoc(collection(db, 'redeemedRewards'), {
      rewardId,
      userId,
      businessId,
      businessName,
      title,
      description,
      costPoints,
      type,
      voucherCode,
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(voucherCode)}`,
      redeemedAt: Timestamp.now(),
      expiresAt: Timestamp.fromDate(expiresAt),
      usedAt: null,
      status: 'active',
      terms,
      imageUrl,
      deleted: false
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
      remaining: increment(-1)
    });

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
