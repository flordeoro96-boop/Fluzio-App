/**
 * Points Marketplace Service
 * Handle business points spending, purchases, and transactions
 */

import { db } from './AuthContext';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  increment,
  runTransaction
} from 'firebase/firestore';
import {
  PointsProduct,
  PointsPurchase,
  PointsTransaction,
  POINTS_MARKETPLACE_PRODUCTS,
  POINTS_CONVERSION_RATES
} from '../types/pointsMarketplace';
import { createNotification } from './notificationService';

// ============================================================================
// MARKETPLACE PRODUCTS
// ============================================================================

/**
 * Get all available marketplace products
 */
export const getMarketplaceProducts = (): PointsProduct[] => {
  return POINTS_MARKETPLACE_PRODUCTS.filter(p => p.available);
};

/**
 * Get products by category
 */
export const getProductsByCategory = (category: string): PointsProduct[] => {
  return POINTS_MARKETPLACE_PRODUCTS.filter(
    p => p.available && p.category === category
  );
};

/**
 * Get product by ID
 */
export const getProductById = (productId: string): PointsProduct | undefined => {
  return POINTS_MARKETPLACE_PRODUCTS.find(p => p.id === productId);
};

// ============================================================================
// PURCHASE MANAGEMENT
// ============================================================================

/**
 * Purchase a product with points
 */
export const purchaseProduct = async (
  businessId: string,
  businessName: string,
  productId: string,
  metadata?: Record<string, any>
): Promise<{ success: boolean; purchaseId?: string; error?: string }> => {
  try {
    const product = getProductById(productId);
    if (!product) {
      return { success: false, error: 'Product not found' };
    }

    // Get business current points
    const userRef = doc(db, 'users', businessId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return { success: false, error: 'Business not found' };
    }

    const currentPoints = userSnap.data().points || 0;

    if (currentPoints < product.pointsCost) {
      return {
        success: false,
        error: `Insufficient points. You have ${currentPoints}, need ${product.pointsCost}`
      };
    }

    // Calculate expiration if applicable
    let expiresAt = null;
    if (product.duration && product.duration !== 'permanent') {
      const now = new Date();
      if (product.duration.includes('week')) {
        const weeks = parseInt(product.duration);
        expiresAt = new Date(now.getTime() + weeks * 7 * 24 * 60 * 60 * 1000);
      } else if (product.duration.includes('month')) {
        const months = parseInt(product.duration);
        expiresAt = new Date(now.setMonth(now.getMonth() + months));
      }
    }

    // Create purchase record
    const purchasesRef = collection(db, 'points_purchases');
    const purchaseDoc = await addDoc(purchasesRef, {
      businessId,
      businessName,
      productId,
      productName: product.name,
      pointsSpent: product.pointsCost,
      purchasedAt: Timestamp.now(),
      expiresAt: expiresAt ? Timestamp.fromDate(expiresAt) : null,
      status: 'ACTIVE',
      metadata: metadata || {}
    });

    // Deduct points from business
    await updateDoc(userRef, {
      points: increment(-product.pointsCost)
    });

    // Log transaction
    await logPointsTransaction(
      businessId,
      'SPEND',
      -product.pointsCost,
      `marketplace_${productId}`,
      `Purchased: ${product.name}`,
      currentPoints,
      currentPoints - product.pointsCost,
      { purchaseId: purchaseDoc.id, productId }
    );

    // Send notification to business
    await createNotification(businessId, {
      type: 'POINTS_ACTIVITY',
      title: 'Purchase Successful! 🛍️',
      message: `You've purchased "${product.name}" for ${product.pointsCost} points.${expiresAt ? ` Expires ${expiresAt.toLocaleDateString()}` : ''}`,
      actionLink: `/marketplace/purchases`
    }).catch(err => console.error('Failed to send purchase notification:', err));

    return { success: true, purchaseId: purchaseDoc.id };
  } catch (error) {
    console.error('[PointsMarketplace] Error purchasing product:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Purchase failed'
    };
  }
};

/**
 * Get business purchases
 */
export const getBusinessPurchases = async (
  businessId: string
): Promise<PointsPurchase[]> => {
  try {
    const purchasesRef = collection(db, 'points_purchases');
    const q = query(
      purchasesRef,
      where('businessId', '==', businessId),
      orderBy('purchasedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      purchasedAt: doc.data().purchasedAt?.toDate(),
      expiresAt: doc.data().expiresAt?.toDate()
    })) as PointsPurchase[];
  } catch (error) {
    console.error('[PointsMarketplace] Error getting purchases:', error);
    return [];
  }
};

/**
 * Get active purchases (not expired)
 */
export const getActivePurchases = async (
  businessId: string
): Promise<PointsPurchase[]> => {
  const purchases = await getBusinessPurchases(businessId);
  const now = new Date();
  
  return purchases.filter(p => {
    if (p.status !== 'ACTIVE') return false;
    if (!p.expiresAt) return true;
    return p.expiresAt > now;
  });
};

// ============================================================================
// POINTS CONVERSION
// ============================================================================

/**
 * Convert points to subscription credits
 */
export const convertPointsToCredits = async (
  businessId: string,
  businessName: string,
  pointsAmount: number
): Promise<{ success: boolean; creditAmount?: number; error?: string }> => {
  try {
    // Validate amount
    if (pointsAmount < POINTS_CONVERSION_RATES.MINIMUM_CONVERSION) {
      return {
        success: false,
        error: `Minimum conversion is ${POINTS_CONVERSION_RATES.MINIMUM_CONVERSION} points`
      };
    }

    // Check monthly limit
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const conversionsRef = collection(db, 'points_transactions');
    const q = query(
      conversionsRef,
      where('userId', '==', businessId),
      where('type', '==', 'CONVERSION'),
      where('timestamp', '>=', Timestamp.fromDate(thisMonth))
    );

    const snapshot = await getDocs(q);
    const monthlyTotal = snapshot.docs.reduce(
      (sum, doc) => sum + Math.abs(doc.data().amount),
      0
    );

    if (monthlyTotal + pointsAmount > POINTS_CONVERSION_RATES.MAXIMUM_MONTHLY_CONVERSION) {
      return {
        success: false,
        error: `Monthly conversion limit reached. You can convert ${
          POINTS_CONVERSION_RATES.MAXIMUM_MONTHLY_CONVERSION - monthlyTotal
        } more points this month`
      };
    }

    // Get current points
    const userRef = doc(db, 'users', businessId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return { success: false, error: 'Business not found' };
    }

    const currentPoints = userSnap.data().points || 0;

    if (currentPoints < pointsAmount) {
      return {
        success: false,
        error: `Insufficient points. You have ${currentPoints}`
      };
    }

    // Calculate credit amount
    const creditAmount = pointsAmount / POINTS_CONVERSION_RATES.POINTS_TO_USD;

    // Deduct points
    await updateDoc(userRef, {
      points: increment(-pointsAmount),
      subscriptionCredits: increment(creditAmount)
    });

    // Log transaction
    await logPointsTransaction(
      businessId,
      'CONVERSION',
      -pointsAmount,
      'points_to_credits',
      `Converted ${pointsAmount} points to $${creditAmount.toFixed(2)} credits`,
      currentPoints,
      currentPoints - pointsAmount,
      { creditAmount }
    );

    return { success: true, creditAmount };
  } catch (error) {
    console.error('[PointsMarketplace] Error converting points:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Conversion failed'
    };
  }
};

// ============================================================================
// TRANSACTIONS & LOGGING
// ============================================================================

/**
 * Log a points transaction
 */
export const logPointsTransaction = async (
  userId: string,
  type: 'EARN' | 'SPEND' | 'REFUND' | 'CONVERSION',
  amount: number,
  source: string,
  description: string,
  balanceBefore: number,
  balanceAfter: number,
  metadata?: Record<string, any>
): Promise<void> => {
  try {
    const transactionsRef = collection(db, 'points_transactions');
    await addDoc(transactionsRef, {
      userId,
      type,
      amount,
      source,
      description,
      timestamp: Timestamp.now(),
      balanceBefore,
      balanceAfter,
      metadata: metadata || {}
    });
  } catch (error) {
    console.error('[PointsMarketplace] Error logging transaction:', error);
  }
};

/**
 * Get user's points transaction history
 */
export const getPointsTransactions = async (
  userId: string,
  limit?: number
): Promise<PointsTransaction[]> => {
  try {
    const transactionsRef = collection(db, 'points_transactions');
    let q = query(
      transactionsRef,
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );

    const snapshot = await getDocs(q);
    const transactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate()
    })) as PointsTransaction[];

    return limit ? transactions.slice(0, limit) : transactions;
  } catch (error) {
    console.error('[PointsMarketplace] Error getting transactions:', error);
    return [];
  }
};

/**
 * Get points analytics
 */
export const getPointsAnalytics = async (
  userId: string
): Promise<{
  totalEarned: number;
  totalSpent: number;
  totalConverted: number;
  currentBalance: number;
  thisMonthEarned: number;
  thisMonthSpent: number;
}> => {
  try {
    const transactions = await getPointsTransactions(userId);
    
    const totalEarned = transactions
      .filter(t => t.type === 'EARN')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalSpent = transactions
      .filter(t => t.type === 'SPEND')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const totalConverted = transactions
      .filter(t => t.type === 'CONVERSION')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const thisMonthTransactions = transactions.filter(
      t => t.timestamp >= thisMonth
    );

    const thisMonthEarned = thisMonthTransactions
      .filter(t => t.type === 'EARN')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const thisMonthSpent = thisMonthTransactions
      .filter(t => t.type === 'SPEND')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Get current balance
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    const currentBalance = userSnap.exists() ? userSnap.data().points || 0 : 0;

    return {
      totalEarned,
      totalSpent,
      totalConverted,
      currentBalance,
      thisMonthEarned,
      thisMonthSpent
    };
  } catch (error) {
    console.error('[PointsMarketplace] Error getting analytics:', error);
    return {
      totalEarned: 0,
      totalSpent: 0,
      totalConverted: 0,
      currentBalance: 0,
      thisMonthEarned: 0,
      thisMonthSpent: 0
    };
  }
};

// ============================================================================
// MISSION FUNDING WITH POINTS
// ============================================================================

/**
 * Fund a mission creation with points
 */
export const fundMissionWithPoints = async (
  businessId: string,
  businessName: string,
  missionTitle: string,
  rewardPoints: number,
  maxParticipants: number
): Promise<{ success: boolean; transactionId?: string; error?: string }> => {
  try {
    // Calculate total cost
    const basePoints = 50; // Base creation cost
    const rewardPool = rewardPoints * maxParticipants;
    const platformFee = Math.ceil(rewardPool * 0.2); // 20% platform fee
    const totalCost = basePoints + rewardPool + platformFee;

    // Get current points
    const userRef = doc(db, 'users', businessId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return { success: false, error: 'Business not found' };
    }

    const currentPoints = userSnap.data().points || 0;

    if (currentPoints < totalCost) {
      return {
        success: false,
        error: `Insufficient points. You have ${currentPoints}, need ${totalCost}`
      };
    }

    // Deduct points
    await updateDoc(userRef, {
      points: increment(-totalCost)
    });

    // Log transaction
    await logPointsTransaction(
      businessId,
      'SPEND',
      -totalCost,
      'mission_creation',
      `Created mission: ${missionTitle}`,
      currentPoints,
      currentPoints - totalCost,
      {
        missionTitle,
        rewardPoints,
        maxParticipants,
        breakdown: {
          basePoints,
          rewardPool,
          platformFee,
          totalCost
        }
      }
    );

    return { success: true };
  } catch (error) {
    console.error('[PointsMarketplace] Error funding mission:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fund mission'
    };
  }
};

/**
 * Refund points to a user
 * Used for mission cancellations, participation rejections, or error corrections
 */
export const refundPoints = async (
  userId: string,
  amount: number,
  source: string,
  description: string,
  metadata?: Record<string, any>
): Promise<{ success: boolean; newBalance?: number; error?: string }> => {
  try {
    if (amount <= 0) {
      return { success: false, error: 'Refund amount must be positive' };
    }

    // Get current points
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return { success: false, error: 'User not found' };
    }

    const currentPoints = userSnap.data().points || 0;
    const newBalance = currentPoints + amount;

    // Add points back
    await updateDoc(userRef, {
      points: increment(amount)
    });

    // Log refund transaction
    await logPointsTransaction(
      userId,
      'REFUND',
      amount,
      source,
      description,
      currentPoints,
      newBalance,
      metadata || {}
    );

    console.log(`[PointsMarketplace] ✅ Refunded ${amount} points to user ${userId}. New balance: ${newBalance}`);

    return { success: true, newBalance };
  } catch (error) {
    console.error('[PointsMarketplace] Error refunding points:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to refund points'
    };
  }
};
