/**
 * Rewards Service - Firestore Integration
 * Manages rewards catalog and customer redemptions
 */

import { db } from './apiService';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  increment
} from '../services/firestoreCompat';
import { Reward, CustomerRedemption, RewardCategory } from '../types/rewards';
import { secureApi } from './secureApiService';
import { createNotification } from './notificationService';
import { logPointsTransaction } from './pointsMarketplaceService';
// Note: Direct Firestore writes to redemptions/transactions now done via Cloud Functions

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Safely convert Firestore Timestamp or Date to JavaScript Date
 */
const toSafeDate = (value: any): Date | undefined => {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  if (typeof value.toDate === 'function') return value.toDate();
  if (typeof value === 'string') return new Date(value);
  return undefined;
};

// ============================================================================
// REWARDS MANAGEMENT (Business Side)
// ============================================================================

/**
 * Create a new reward
 */
export const createReward = async (
  businessId: string,
  businessName: string,
  rewardData: Omit<Reward, 'id' | 'businessId' | 'businessName' | 'createdAt' | 'updatedAt' | 'claimed'>
): Promise<{ success: boolean; rewardId?: string; error?: string }> => {
  try {
    const rewardsRef = collection(db, 'rewards');
    const docRef = await addDoc(rewardsRef, {
      businessId,
      businessName,
      ...rewardData,
      claimed: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    return { success: true, rewardId: docRef.id };
  } catch (error) {
    console.error('[RewardsService] Error creating reward:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create reward'
    };
  }
};

/**
 * Get all rewards for a business
 */
export const getBusinessRewards = async (businessId: string): Promise<Reward[]> => {
  try {
    const rewardsRef = collection(db, 'rewards');
    const q = query(
      rewardsRef,
      where('businessId', '==', businessId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: toSafeDate(doc.data().createdAt),
      updatedAt: toSafeDate(doc.data().updatedAt),
      expiresAt: toSafeDate(doc.data().expiresAt),
      validFrom: toSafeDate(doc.data().validFrom),
      validUntil: toSafeDate(doc.data().validUntil)
    })) as Reward[];
  } catch (error) {
    console.error('[RewardsService] Error getting business rewards:', error);
    return [];
  }
};

/**
 * Update a reward
 */
export const updateReward = async (
  rewardId: string,
  updates: Partial<Reward>
): Promise<{ success: boolean; error?: string }> => {
  try {
    const rewardRef = doc(db, 'rewards', rewardId);
    await updateDoc(rewardRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });

    return { success: true };
  } catch (error) {
    console.error('[RewardsService] Error updating reward:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update reward'
    };
  }
};

/**
 * Delete a reward
 */
export const deleteReward = async (rewardId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const rewardRef = doc(db, 'rewards', rewardId);
    await deleteDoc(rewardRef);

    return { success: true };
  } catch (error) {
    console.error('[RewardsService] Error deleting reward:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete reward'
    };
  }
};

// ============================================================================
// CUSTOMER REDEMPTION
// ============================================================================

/**
 * Get all active rewards (for customer browsing)
 */
export const getActiveRewards = async (businessId?: string): Promise<Reward[]> => {
  try {
    console.log('[RewardsService] Fetching active rewards, businessId:', businessId);
    const rewardsRef = collection(db, 'rewards');
    
    // Simple query without index requirements - just get all rewards and filter in code
    const snapshot = await getDocs(rewardsRef);
    console.log('[RewardsService] Found', snapshot.docs.length, 'total rewards in Firestore');
    
    const now = new Date();
    
    const allRewards = snapshot.docs.map(doc => {
      const data = doc.data() as any;
      return {
        id: doc.id,
        ...data,
        createdAt: toSafeDate(data.createdAt),
        updatedAt: toSafeDate(data.updatedAt),
        expiresAt: toSafeDate(data.expiresAt),
        validFrom: toSafeDate(data.validFrom),
        validUntil: toSafeDate(data.validUntil)
      };
    });
    
    console.log('[RewardsService] All rewards before filtering:', allRewards);
    
    const filteredRewards = allRewards.filter((reward: Reward) => {
      // Filter by businessId if provided
      if (businessId && reward.businessId !== businessId) {
        return false;
      }
      
      // Filter inactive rewards
      if (!reward.active) {
        console.log('[RewardsService] Filtering out inactive reward:', reward.title);
        return false;
      }
      
      // Filter out expired or not yet valid rewards
      if (reward.expiresAt && reward.expiresAt < now) {
        console.log('[RewardsService] Filtering out expired reward:', reward.title);
        return false;
      }
      if (reward.validFrom && reward.validFrom > now) {
        console.log('[RewardsService] Filtering out not-yet-valid reward:', reward.title);
        return false;
      }
      if (reward.claimed >= reward.totalAvailable) {
        console.log('[RewardsService] Filtering out sold-out reward:', reward.title);
        return false;
      }
      return true;
    });
    
    // Sort by points cost manually
    const sortedRewards = filteredRewards.sort((a, b) => a.pointsCost - b.pointsCost);
    console.log('[RewardsService] Returning', sortedRewards.length, 'filtered rewards');
    
    return sortedRewards as Reward[];
  } catch (error) {
    console.error('[RewardsService] Error getting active rewards:', error);
    return [];
  }
};

/**
 * Redeem a reward
 */
export const redeemReward = async (
  userId: string,
  userName: string,
  rewardId: string
): Promise<{ success: boolean; redemptionId?: string; error?: string }> => {
  try {
    console.log('[RewardsService] Redeeming reward:', { userId, userName, rewardId });
    
    // Get reward details
    const rewardRef = doc(db, 'rewards', rewardId);
    const rewardSnap = await getDoc(rewardRef);
    
    if (!rewardSnap.exists()) {
      console.error('[RewardsService] Reward not found:', rewardId);
      return { success: false, error: 'Reward not found' };
    }

    const reward = {
      id: rewardSnap.id,
      ...rewardSnap.data()
    } as Reward;
    
    console.log('[RewardsService] Reward data:', reward);

    // Get user data for eligibility checks
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      console.error('[RewardsService] User not found:', userId);
      return { success: false, error: 'User not found' };
    }

    const userData = userSnap.data();
    const userCurrentPoints = userData.points || 0;
    const userLevel = userData.level || 0;
    
    console.log('[RewardsService] User points:', userCurrentPoints, 'Required:', reward.pointsCost);

    // Check if reward is active
    if (!reward.active) {
      return { success: false, error: 'Reward is no longer active' };
    }

    // Check availability (unless unlimited)
    if (!reward.unlimited && reward.claimed >= reward.totalAvailable) {
      return { success: false, error: 'Reward is no longer available' };
    }

    // Check if reward has expired
    if (reward.expiresAt) {
      const expiryDate = reward.expiresAt instanceof Date ? reward.expiresAt : new Date(reward.expiresAt);
      if (new Date() > expiryDate) {
        return { success: false, error: 'This reward has expired' };
      }
    }

    // Check valid days (1=Mon, 7=Sun)
    if (reward.validDays && reward.validDays.length > 0) {
      const currentDay = new Date().getDay(); // 0=Sun, 1=Mon, etc.
      const dayNum = currentDay === 0 ? 7 : currentDay; // Convert to 1-7 format
      if (!reward.validDays.includes(dayNum)) {
        const dayNames = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const validDayNames = reward.validDays.map(d => dayNames[d]).join(', ');
        return { success: false, error: `This reward is only valid on: ${validDayNames}` };
      }
    }

    // Check valid time range
    if (reward.validTimeStart && reward.validTimeEnd) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      if (currentTime < reward.validTimeStart || currentTime > reward.validTimeEnd) {
        return { success: false, error: `This reward is only valid between ${reward.validTimeStart} and ${reward.validTimeEnd}` };
      }
    }

    // Check minimum points balance requirement
    if (reward.minPointsRequired && userCurrentPoints < reward.minPointsRequired) {
      return { success: false, error: `You need at least ${reward.minPointsRequired} points balance to redeem this reward` };
    }

    // Check if user has enough points to redeem
    if (userCurrentPoints < reward.pointsCost) {
      return { success: false, error: `You need ${reward.pointsCost} points but only have ${userCurrentPoints}` };
    }

    // Check level requirement
    if (reward.levelRequired && userLevel < reward.levelRequired) {
      const levelNames = ['', 'Level 1', 'Level 2 (Premium)'];
      return { success: false, error: `This reward requires ${levelNames[reward.levelRequired]} or higher` };
    }

    // Note: minPurchaseAmount check would need to be done at checkout/validation time
    // since we don't track purchase amounts in redemption flow

    // Generate coupon code
    const couponCode = `${reward.businessName.substring(0, 3).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

    // Create redemption record
    const redemptionsRef = collection(db, 'redemptions');
    const redemptionDoc = await addDoc(redemptionsRef, {
      userId,
      userName,
      rewardId,
      reward: {
        title: reward.title,
        description: reward.description,
        businessId: reward.businessId,
        businessName: reward.businessName,
        category: reward.category
      },
      pointsSpent: reward.pointsCost,
      redeemedAt: Timestamp.now(),
      status: 'PENDING',
      couponCode,
      expiresAt: reward.validUntil ? Timestamp.fromDate(reward.validUntil) : null
    });

    // Increment claimed count (only if not unlimited)
    if (!reward.unlimited) {
      await updateDoc(rewardRef, {
        claimed: increment(1)
      });
    }

    // Deduct points from user and increment rewards claimed
    await updateDoc(userRef, {
      points: increment(-reward.pointsCost),
      rewardsClaimed: increment(1)
    });

    // Log customer transaction (spending points)
    await logPointsTransaction(
      userId,
      'SPEND',
      -reward.pointsCost,
      `reward_redemption_${rewardId}`,
      `Redeemed: ${reward.title}`,
      userCurrentPoints,
      userCurrentPoints - reward.pointsCost,
      { rewardId, redemptionId: redemptionDoc.id, businessId: reward.businessId }
    );

    // Add points to business (circular economy)
    const businessRef = doc(db, 'users', reward.businessId);
    const businessSnap = await getDoc(businessRef);
    const businessCurrentPoints = businessSnap.exists() ? businessSnap.data().points || 0 : 0;
    
    await updateDoc(businessRef, {
      points: increment(reward.pointsCost)
    });

    // Log business transaction (earning points)
    await logPointsTransaction(
      reward.businessId,
      'EARN',
      reward.pointsCost,
      `reward_redemption_${rewardId}`,
      `Customer redeemed: ${reward.title} (${userName})`,
      businessCurrentPoints,
      businessCurrentPoints + reward.pointsCost,
      { rewardId, redemptionId: redemptionDoc.id, customerId: userId, customerName: userName }
    );

    // Send notification to customer
    await createNotification(userId, {
      type: 'REWARD_REDEEMED',
      title: 'Reward Redeemed! 🎉',
      message: `You've redeemed "${reward.title}" from ${reward.businessName}. Your coupon code: ${couponCode}`,
      actionLink: '/rewards/redemptions',
    }).catch(err => console.error('Failed to send customer notification:', err));

    // Send notification to business
    await createNotification(reward.businessId, {
      type: 'REWARD_REDEEMED',
      title: 'New Reward Redemption 💰',
      message: `${userName} redeemed "${reward.title}" for ${reward.pointsCost} points. You earned ${reward.pointsCost} points!`,
      actionLink: '/redemptions',
    }).catch(err => console.error('Failed to send business notification:', err));

    return { success: true, redemptionId: redemptionDoc.id };
  } catch (error) {
    console.error('[RewardsService] Error redeeming reward:', error);
    console.error('[RewardsService] Error type:', typeof error);
    console.error('[RewardsService] Error details:', {
      message: error instanceof Error ? error.message : String(error),
      code: (error as any)?.code,
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to redeem reward'
    };
  }
};

/**
 * Get user's redemptions
 */
export const getUserRedemptions = async (userId: string): Promise<CustomerRedemption[]> => {
  try {
    const redemptionsRef = collection(db, 'redemptions');
    const q = query(
      redemptionsRef,
      where('userId', '==', userId),
      orderBy('redeemedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      redeemedAt: toSafeDate(doc.data().redeemedAt),
      usedAt: toSafeDate(doc.data().usedAt),
      expiresAt: toSafeDate(doc.data().expiresAt)
    })) as CustomerRedemption[];
  } catch (error) {
    console.error('[RewardsService] Error getting user redemptions:', error);
    return [];
  }
};

/**
 * Get business redemptions (for businesses to see who redeemed)
 */
export const getBusinessRedemptions = async (businessId: string): Promise<CustomerRedemption[]> => {
  try {
    const redemptionsRef = collection(db, 'redemptions');
    const q = query(
      redemptionsRef,
      where('reward.businessId', '==', businessId),
      orderBy('redeemedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      redeemedAt: toSafeDate(doc.data().redeemedAt),
      usedAt: toSafeDate(doc.data().usedAt),
      expiresAt: toSafeDate(doc.data().expiresAt)
    })) as CustomerRedemption[];
  } catch (error) {
    console.error('[RewardsService] Error getting business redemptions:', error);
    return [];
  }
};

/**
 * Mark redemption as used (business confirms)
 */
export const markRedemptionUsed = async (
  redemptionId: string,
  staffName: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const redemptionRef = doc(db, 'redemptions', redemptionId);
    await updateDoc(redemptionRef, {
      status: 'USED',
      usedAt: Timestamp.now(),
      usedBy: staffName
    });

    return { success: true };
  } catch (error) {
    console.error('[RewardsService] Error marking redemption as used:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update redemption'
    };
  }
};
