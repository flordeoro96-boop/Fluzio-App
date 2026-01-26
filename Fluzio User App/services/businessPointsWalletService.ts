/**
 * Business Points Wallet Service
 * 
 * Implements a recycling loop where:
 * 1. Customers earn points by completing missions
 * 2. Customers redeem rewards using points
 * 3. Redeemed points are credited to the BUSINESS wallet
 * 4. Businesses can spend points on:
 *    - Extra participants (MAX 40% of monthly pool)
 *    - Visibility boosts
 *    - Premium features
 * 
 * HARD RULE: First 60% of participant pool must be organic.
 * Points can only unlock the remaining 40%.
 */

import { db } from './apiService';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  Timestamp,
  runTransaction,
  query,
  where,
  getDocs,
  addDoc
} from '../services/firestoreCompat';

// Business wallet interface
export interface BusinessPointsWallet {
  businessId: string;
  balance: number; // Current points balance
  totalEarned: number; // Lifetime earnings from customer redemptions
  totalSpent: number; // Lifetime spending on features
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Transaction types
export type WalletTransactionType = 
  | 'EARNED_FROM_REDEMPTION'  // Customer redeemed reward
  | 'SPENT_ON_PARTICIPANTS'   // Purchased extra participants
  | 'SPENT_ON_VISIBILITY'     // Purchased visibility boost
  | 'SPENT_ON_PREMIUM'        // Purchased premium feature
  | 'REFUND';                 // Transaction refunded

// Wallet transaction record
export interface WalletTransaction {
  businessId: string;
  type: WalletTransactionType;
  amount: number; // Positive for earnings, negative for spending
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  metadata?: any;
  timestamp: Timestamp;
}

// Participant purchase limits
export interface ParticipantPurchaseLimits {
  organicLimit: number;      // 60% of monthly pool (must be used first)
  paidLimit: number;         // 40% of monthly pool (unlockable with points)
  organicUsed: number;       // Currently used organic slots
  paidUsed: number;          // Currently used paid slots
  organicRemaining: number;  // Organic slots available
  paidRemaining: number;     // Paid slots available (locked until organic depleted)
  paidUnlocked: boolean;     // Can purchase paid slots?
  totalAvailable: number;    // Total slots available right now
}

// Points pricing
export const POINTS_PRICING = {
  EXTRA_PARTICIPANT_SLOT: 50,      // 50 points per extra participant
  VISIBILITY_BOOST_24H: 200,       // 200 points for 24h visibility boost
  VISIBILITY_BOOST_7D: 1000,       // 1000 points for 7-day visibility boost
  PREMIUM_ANALYTICS_30D: 500,      // 500 points for premium analytics (30 days)
  FEATURED_PLACEMENT_24H: 300,     // 300 points for featured placement (24h)
  PRIORITY_SUPPORT_30D: 400        // 400 points for priority support (30 days)
};

const walletsCol = collection(db, 'businessPointsWallets');
const transactionsCol = collection(db, 'walletTransactions');

/**
 * Initialize business wallet
 */
export async function initializeBusinessWallet(businessId: string): Promise<BusinessPointsWallet> {
  const now = Timestamp.now();
  
  const wallet: BusinessPointsWallet = {
    businessId,
    balance: 0,
    totalEarned: 0,
    totalSpent: 0,
    createdAt: now,
    updatedAt: now
  };
  
  const walletRef = doc(walletsCol, businessId);
  await setDoc(walletRef, wallet);
  
  console.log(`[BusinessWallet] ✅ Initialized wallet for ${businessId}`);
  return wallet;
}

/**
 * Get business wallet (auto-creates if missing)
 */
export async function getBusinessWallet(businessId: string): Promise<BusinessPointsWallet> {
  const walletRef = doc(walletsCol, businessId);
  const walletSnap = await getDoc(walletRef);
  
  if (!walletSnap.exists()) {
    return await initializeBusinessWallet(businessId);
  }
  
  return walletSnap.data() as BusinessPointsWallet;
}

/**
 * Credit points to business wallet (from customer redemption)
 */
export async function creditBusinessWallet(
  businessId: string,
  points: number,
  description: string,
  metadata?: any
): Promise<{ success: boolean; newBalance: number; error?: string }> {
  const walletRef = doc(walletsCol, businessId);
  
  try {
    const result = await runTransaction(db, async (transaction) => {
      const walletSnap = await transaction.get(walletRef);
      
      let wallet: BusinessPointsWallet;
      if (!walletSnap.exists()) {
        // Initialize wallet
        wallet = {
          businessId,
          balance: 0,
          totalEarned: 0,
          totalSpent: 0,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };
        transaction.set(walletRef, wallet);
      } else {
        wallet = walletSnap.data() as BusinessPointsWallet;
      }
      
      const newBalance = wallet.balance + points;
      const newTotalEarned = wallet.totalEarned + points;
      
      // Update wallet
      transaction.update(walletRef, {
        balance: newBalance,
        totalEarned: newTotalEarned,
        updatedAt: Timestamp.now()
      });
      
      // Log transaction
      const txRef = doc(transactionsCol);
      transaction.set(txRef, {
        businessId,
        type: 'EARNED_FROM_REDEMPTION',
        amount: points,
        balanceBefore: wallet.balance,
        balanceAfter: newBalance,
        description,
        metadata: metadata || {},
        timestamp: Timestamp.now()
      });
      
      return { success: true, newBalance };
    });
    
    console.log(`[BusinessWallet] ✅ Credited ${points} points to ${businessId}. New balance: ${result.newBalance}`);
    return result;
    
  } catch (error) {
    console.error('[BusinessWallet] ❌ Failed to credit points:', error);
    return {
      success: false,
      newBalance: 0,
      error: error instanceof Error ? error.message : 'Failed to credit points'
    };
  }
}

/**
 * Debit points from business wallet (for purchases)
 */
export async function debitBusinessWallet(
  businessId: string,
  points: number,
  type: WalletTransactionType,
  description: string,
  metadata?: any
): Promise<{ success: boolean; newBalance: number; error?: string }> {
  const walletRef = doc(walletsCol, businessId);
  
  try {
    const result = await runTransaction(db, async (transaction) => {
      const walletSnap = await transaction.get(walletRef);
      
      if (!walletSnap.exists()) {
        throw new Error('Wallet not found');
      }
      
      const wallet = walletSnap.data() as BusinessPointsWallet;
      
      // Check sufficient balance
      if (wallet.balance < points) {
        throw new Error(`Insufficient balance. Need ${points}, have ${wallet.balance}`);
      }
      
      const newBalance = wallet.balance - points;
      const newTotalSpent = wallet.totalSpent + points;
      
      // Update wallet
      transaction.update(walletRef, {
        balance: newBalance,
        totalSpent: newTotalSpent,
        updatedAt: Timestamp.now()
      });
      
      // Log transaction
      const txRef = doc(transactionsCol);
      transaction.set(txRef, {
        businessId,
        type,
        amount: -points,
        balanceBefore: wallet.balance,
        balanceAfter: newBalance,
        description,
        metadata: metadata || {},
        timestamp: Timestamp.now()
      });
      
      return { success: true, newBalance };
    });
    
    console.log(`[BusinessWallet] ✅ Debited ${points} points from ${businessId}. New balance: ${result.newBalance}`);
    return result;
    
  } catch (error) {
    console.error('[BusinessWallet] ❌ Failed to debit points:', error);
    return {
      success: false,
      newBalance: 0,
      error: error instanceof Error ? error.message : 'Failed to debit points'
    };
  }
}

/**
 * Calculate participant purchase limits (60/40 rule)
 */
export async function calculateParticipantLimits(
  businessId: string,
  monthlyLimit: number,
  currentOrganicUsage: number
): Promise<ParticipantPurchaseLimits> {
  // 60% must be organic, 40% can be paid
  const organicLimit = Math.floor(monthlyLimit * 0.6);
  const paidLimit = Math.floor(monthlyLimit * 0.4);
  
  const organicUsed = Math.min(currentOrganicUsage, organicLimit);
  const organicRemaining = Math.max(0, organicLimit - organicUsed);
  
  // Paid slots only unlock when organic is depleted
  const paidUnlocked = organicRemaining === 0;
  
  // Get current paid usage from metadata
  const poolRef = doc(db, 'participantPools', businessId);
  const poolSnap = await getDoc(poolRef);
  const paidUsed = poolSnap.exists() ? (poolSnap.data().paidParticipantsUsed || 0) : 0;
  
  const paidRemaining = paidUnlocked ? Math.max(0, paidLimit - paidUsed) : 0;
  
  const totalAvailable = organicRemaining + (paidUnlocked ? paidRemaining : 0);
  
  return {
    organicLimit,
    paidLimit,
    organicUsed,
    paidUsed,
    organicRemaining,
    paidRemaining,
    paidUnlocked,
    totalAvailable
  };
}

/**
 * Purchase extra participant slots with points
 * ENFORCES: 60% organic, 40% paid rule
 */
export async function purchaseParticipantSlots(
  businessId: string,
  slotsCount: number
): Promise<{ 
  success: boolean; 
  slotsPurchased: number; 
  pointsSpent: number; 
  newBalance: number;
  error?: string 
}> {
  try {
    // Get participant pool to check limits
    const { getParticipantPool } = await import('./participantPoolService');
    const pool = await getParticipantPool(businessId);
    
    if (!pool) {
      return { success: false, slotsPurchased: 0, pointsSpent: 0, newBalance: 0, error: 'Participant pool not found' };
    }
    
    // Calculate limits
    const limits = await calculateParticipantLimits(
      businessId,
      pool.monthlyParticipantLimit,
      pool.currentUsage - (pool.paidParticipantsUsed || 0) // Subtract paid usage to get organic
    );
    
    // RULE ENFORCEMENT: Can only purchase if organic pool is depleted
    if (!limits.paidUnlocked) {
      return {
        success: false,
        slotsPurchased: 0,
        pointsSpent: 0,
        newBalance: 0,
        error: `You must use all ${limits.organicLimit} organic slots before purchasing extra slots. You have ${limits.organicRemaining} organic slots remaining.`
      };
    }
    
    // Check if requesting more than allowed
    if (slotsCount > limits.paidRemaining) {
      return {
        success: false,
        slotsPurchased: 0,
        pointsSpent: 0,
        newBalance: 0,
        error: `Cannot purchase ${slotsCount} slots. Maximum allowed: ${limits.paidRemaining} (40% of your monthly pool).`
      };
    }
    
    // Calculate cost
    const totalCost = slotsCount * POINTS_PRICING.EXTRA_PARTICIPANT_SLOT;
    
    // Debit wallet
    const debitResult = await debitBusinessWallet(
      businessId,
      totalCost,
      'SPENT_ON_PARTICIPANTS',
      `Purchased ${slotsCount} extra participant slots`,
      { slotsCount, costPerSlot: POINTS_PRICING.EXTRA_PARTICIPANT_SLOT }
    );
    
    if (!debitResult.success) {
      return {
        success: false,
        slotsPurchased: 0,
        pointsSpent: 0,
        newBalance: debitResult.newBalance,
        error: debitResult.error
      };
    }
    
    // Update participant pool with paid slots
    const poolRef = doc(db, 'participantPools', businessId);
    await runTransaction(db, async (transaction) => {
      const poolSnap = await transaction.get(poolRef);
      const poolData = poolSnap.data();
      
      const currentPaidUsed = poolData?.paidParticipantsUsed || 0;
      const currentPaidPurchased = poolData?.paidParticipantsPurchased || 0;
      
      transaction.update(poolRef, {
        paidParticipantsPurchased: currentPaidPurchased + slotsCount,
        remaining: (poolData?.remaining || 0) + slotsCount,
        monthlyParticipantLimit: (poolData?.monthlyParticipantLimit || 0) + slotsCount,
        updatedAt: Timestamp.now()
      });
    });
    
    console.log(`[BusinessWallet] ✅ Purchased ${slotsCount} participant slots for ${totalCost} points`);
    
    return {
      success: true,
      slotsPurchased: slotsCount,
      pointsSpent: totalCost,
      newBalance: debitResult.newBalance
    };
    
  } catch (error) {
    console.error('[BusinessWallet] ❌ Failed to purchase participant slots:', error);
    return {
      success: false,
      slotsPurchased: 0,
      pointsSpent: 0,
      newBalance: 0,
      error: error instanceof Error ? error.message : 'Failed to purchase slots'
    };
  }
}

/**
 * Purchase visibility boost
 */
export async function purchaseVisibilityBoost(
  businessId: string,
  duration: '24H' | '7D'
): Promise<{ success: boolean; expiresAt: Date; pointsSpent: number; newBalance: number; error?: string }> {
  const cost = duration === '24H' 
    ? POINTS_PRICING.VISIBILITY_BOOST_24H 
    : POINTS_PRICING.VISIBILITY_BOOST_7D;
  
  const hours = duration === '24H' ? 24 : 168; // 7 days = 168 hours
  const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
  
  try {
    // Debit wallet
    const debitResult = await debitBusinessWallet(
      businessId,
      cost,
      'SPENT_ON_VISIBILITY',
      `Purchased visibility boost (${duration})`,
      { duration, expiresAt: Timestamp.fromDate(expiresAt) }
    );
    
    if (!debitResult.success) {
      return {
        success: false,
        expiresAt: new Date(),
        pointsSpent: 0,
        newBalance: debitResult.newBalance,
        error: debitResult.error
      };
    }
    
    // Apply visibility boost
    const businessRef = doc(db, 'users', businessId);
    await updateDoc(businessRef, {
      visibilityBoost: {
        active: true,
        expiresAt: Timestamp.fromDate(expiresAt),
        purchasedAt: Timestamp.now()
      }
    });
    
    console.log(`[BusinessWallet] ✅ Purchased ${duration} visibility boost for ${cost} points`);
    
    return {
      success: true,
      expiresAt,
      pointsSpent: cost,
      newBalance: debitResult.newBalance
    };
    
  } catch (error) {
    console.error('[BusinessWallet] ❌ Failed to purchase visibility boost:', error);
    return {
      success: false,
      expiresAt: new Date(),
      pointsSpent: 0,
      newBalance: 0,
      error: error instanceof Error ? error.message : 'Failed to purchase boost'
    };
  }
}

/**
 * Get wallet transaction history
 */
export async function getWalletTransactions(
  businessId: string,
  limit: number = 50
): Promise<WalletTransaction[]> {
  const q = query(
    transactionsCol,
    where('businessId', '==', businessId)
  );
  
  const snapshot = await getDocs(q);
  const transactions = snapshot.docs
    .map(doc => doc.data() as WalletTransaction)
    .sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis())
    .slice(0, limit);
  
  return transactions;
}

/**
 * Get wallet balance summary
 */
export async function getWalletSummary(businessId: string): Promise<{
  balance: number;
  totalEarned: number;
  totalSpent: number;
  canPurchaseSlots: boolean;
  canPurchaseBoost: boolean;
}> {
  const wallet = await getBusinessWallet(businessId);
  
  return {
    balance: wallet.balance,
    totalEarned: wallet.totalEarned,
    totalSpent: wallet.totalSpent,
    canPurchaseSlots: wallet.balance >= POINTS_PRICING.EXTRA_PARTICIPANT_SLOT,
    canPurchaseBoost: wallet.balance >= POINTS_PRICING.VISIBILITY_BOOST_24H
  };
}

/**
 * Hook: When customer redeems reward, credit business
 */
export async function onCustomerRedemption(
  customerId: string,
  businessId: string,
  pointsRedeemed: number,
  rewardTitle: string
): Promise<boolean> {
  try {
    const result = await creditBusinessWallet(
      businessId,
      pointsRedeemed,
      `Customer reward redemption: ${rewardTitle}`,
      { customerId, rewardTitle }
    );
    
    if (result.success) {
      console.log(`[BusinessWallet] ✅ Customer ${customerId} redeemed ${pointsRedeemed} points at business ${businessId}`);
      return true;
    }
    
    return false;
    
  } catch (error) {
    console.error('[BusinessWallet] ❌ Failed to process customer redemption:', error);
    return false;
  }
}

/**
 * Check if business can purchase more participant slots
 */
export async function canPurchaseMoreSlots(
  businessId: string
): Promise<{ canPurchase: boolean; reason?: string; maxAvailable: number }> {
  try {
    const { getParticipantPool } = await import('./participantPoolService');
    const pool = await getParticipantPool(businessId);
    
    if (!pool) {
      return { canPurchase: false, reason: 'Participant pool not found', maxAvailable: 0 };
    }
    
    const limits = await calculateParticipantLimits(
      businessId,
      pool.monthlyParticipantLimit,
      pool.currentUsage - (pool.paidParticipantsUsed || 0)
    );
    
    if (!limits.paidUnlocked) {
      return {
        canPurchase: false,
        reason: `Must use all ${limits.organicLimit} organic slots first. ${limits.organicRemaining} remaining.`,
        maxAvailable: 0
      };
    }
    
    if (limits.paidRemaining === 0) {
      return {
        canPurchase: false,
        reason: 'Maximum paid slots already purchased (40% of monthly pool).',
        maxAvailable: 0
      };
    }
    
    return {
      canPurchase: true,
      maxAvailable: limits.paidRemaining
    };
    
  } catch (error) {
    console.error('[BusinessWallet] ❌ Failed to check purchase eligibility:', error);
    return { canPurchase: false, reason: 'Error checking eligibility', maxAvailable: 0 };
  }
}
