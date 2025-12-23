import { db } from './AuthContext';
import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';

/**
 * Creator Plus Subscription Service
 * 
 * Creator Plus Benefits:
 * 1. Reduced commission: 8% (vs 12% for free)
 * 2. Early access to opportunities (24h head start)
 * 3. Priority matching (AI boost)
 * 4. Advanced insights (selection feedback)
 * 5. Faster payouts / priority support
 */

export interface CreatorPlusSubscription {
  userId: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  tier: 'CREATOR_PLUS';
  startDate: string;
  expiryDate: string;
  commissionRate: number; // 0.08 for Creator Plus, 0.12 for free
  autoRenew: boolean;
  paymentMethod?: string;
  lastPaymentDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatorPlusFeatures {
  commissionRate: number;
  earlyAccessHours: number;
  priorityMatching: boolean;
  advancedInsights: boolean;
  fasterPayouts: boolean;
  prioritySupport: boolean;
}

// Get standard features for free creators
export const getFreeCreatorFeatures = (): CreatorPlusFeatures => ({
  commissionRate: 0.12, // 12%
  earlyAccessHours: 0,
  priorityMatching: false,
  advancedInsights: false,
  fasterPayouts: false,
  prioritySupport: false
});

// Get features for Creator Plus subscribers
export const getCreatorPlusFeatures = (): CreatorPlusFeatures => ({
  commissionRate: 0.08, // 8%
  earlyAccessHours: 24,
  priorityMatching: true,
  advancedInsights: true,
  fasterPayouts: true,
  prioritySupport: true
});

/**
 * Check if user has active Creator Plus subscription
 */
export const hasCreatorPlus = async (userId: string): Promise<boolean> => {
  try {
    const subRef = doc(db, 'creatorPlusSubscriptions', userId);
    const subDoc = await getDoc(subRef);
    
    if (!subDoc.exists()) return false;
    
    const data = subDoc.data() as CreatorPlusSubscription;
    
    // Check if subscription is active and not expired
    if (data.status !== 'ACTIVE') return false;
    
    const now = new Date();
    const expiryDate = new Date(data.expiryDate);
    
    return now < expiryDate;
  } catch (error) {
    console.error('[CreatorPlusService] Error checking subscription:', error);
    return false;
  }
};

/**
 * Get subscription details for user
 */
export const getSubscription = async (userId: string): Promise<CreatorPlusSubscription | null> => {
  try {
    const subRef = doc(db, 'creatorPlusSubscriptions', userId);
    const subDoc = await getDoc(subRef);
    
    if (!subDoc.exists()) return null;
    
    return subDoc.data() as CreatorPlusSubscription;
  } catch (error) {
    console.error('[CreatorPlusService] Error getting subscription:', error);
    return null;
  }
};

/**
 * Get features for user (Creator Plus or Free)
 */
export const getUserFeatures = async (userId: string): Promise<CreatorPlusFeatures> => {
  const isPlusUser = await hasCreatorPlus(userId);
  return isPlusUser ? getCreatorPlusFeatures() : getFreeCreatorFeatures();
};

/**
 * Get commission rate for user
 */
export const getCommissionRate = async (userId: string): Promise<number> => {
  const features = await getUserFeatures(userId);
  return features.commissionRate;
};

/**
 * Calculate net payment after commission
 */
export const calculateNetPayment = async (
  userId: string,
  grossAmount: number
): Promise<{ gross: number; commission: number; net: number; rate: number }> => {
  const rate = await getCommissionRate(userId);
  const commission = grossAmount * rate;
  const net = grossAmount - commission;
  
  return {
    gross: grossAmount,
    commission,
    net,
    rate
  };
};

/**
 * Subscribe user to Creator Plus
 */
export const subscribeToCreatorPlus = async (
  userId: string,
  durationMonths: number = 1,
  paymentMethod: string = 'stripe'
): Promise<{ success: boolean; error?: string }> => {
  try {
    const now = new Date();
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + durationMonths);
    
    const subscription: CreatorPlusSubscription = {
      userId,
      status: 'ACTIVE',
      tier: 'CREATOR_PLUS',
      startDate: now.toISOString(),
      expiryDate: expiryDate.toISOString(),
      commissionRate: 0.08,
      autoRenew: true,
      paymentMethod,
      lastPaymentDate: now.toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };
    
    const subRef = doc(db, 'creatorPlusSubscriptions', userId);
    await setDoc(subRef, subscription);
    
    // Update user profile to reflect Creator Plus status
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      'subscription.tier': 'CREATOR_PLUS',
      'subscription.status': 'ACTIVE',
      updatedAt: Timestamp.now()
    });
    
    console.log('[CreatorPlusService] Subscription created for user:', userId);
    return { success: true };
  } catch (error) {
    console.error('[CreatorPlusService] Error creating subscription:', error);
    return { success: false, error: 'Failed to create subscription' };
  }
};

/**
 * Cancel subscription
 */
export const cancelSubscription = async (userId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const subRef = doc(db, 'creatorPlusSubscriptions', userId);
    await updateDoc(subRef, {
      status: 'CANCELLED',
      autoRenew: false,
      updatedAt: new Date().toISOString()
    });
    
    // Update user profile
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      'subscription.status': 'CANCELLED',
      updatedAt: Timestamp.now()
    });
    
    console.log('[CreatorPlusService] Subscription cancelled for user:', userId);
    return { success: true };
  } catch (error) {
    console.error('[CreatorPlusService] Error cancelling subscription:', error);
    return { success: false, error: 'Failed to cancel subscription' };
  }
};

/**
 * Calculate savings with Creator Plus
 * Returns monthly savings based on earnings
 */
export const calculateSavings = (monthlyEarnings: number): number => {
  const freeCommission = monthlyEarnings * 0.12;
  const plusCommission = monthlyEarnings * 0.08;
  return freeCommission - plusCommission;
};

/**
 * Get breakeven point for Creator Plus
 * Returns minimum monthly earnings where Creator Plus makes financial sense
 */
export const getBreakevenPoint = (monthlySubscriptionCost: number = 9.99): number => {
  // Free: 12% commission, Plus: 8% commission
  // Difference: 4% savings
  // Breakeven: subscriptionCost / 0.04
  return monthlySubscriptionCost / 0.04;
};
