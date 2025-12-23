/**
 * Reward Service - Firestore Integration
 * 
 * Handles all reward-related database operations.
 */

import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  getDoc,
  doc,
  addDoc, 
  updateDoc,
  deleteDoc,
  Timestamp,
  DocumentData
} from 'firebase/firestore';
import { db } from '../../services/AuthContext';
import { Reward } from '../types/models';

// ============================================================================
// COLLECTION REFERENCE
// ============================================================================

const rewardsCol = collection(db, 'rewards');

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert Firestore document to Reward object
 */
const docToReward = (docData: DocumentData, docId: string): Reward => {
  return {
    id: docId,
    businessId: docData.businessId,
    businessName: docData.businessName,
    title: docData.title,
    description: docData.description,
    costPoints: docData.costPoints,
    city: docData.city,
    district: docData.district,
    imageUrl: docData.imageUrl,
    type: docData.type,
    discountPercent: docData.discountPercent,
    totalAvailable: docData.totalAvailable,
    remaining: docData.remaining,
    terms: docData.terms,
    status: docData.status,
    createdAt: docData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    expiresAt: docData.expiresAt?.toDate?.()?.toISOString(),
    updatedAt: docData.updatedAt?.toDate?.()?.toISOString()
  };
};

// ============================================================================
// PUBLIC FUNCTIONS
// ============================================================================

/**
 * Get all rewards for a specific city
 * 
 * @param city - City name
 * @returns Array of rewards
 */
export const getRewardsForCity = async (city: string): Promise<Reward[]> => {
  try {
    const q = query(
      rewardsCol,
      where('city', '==', city),
      where('status', '==', 'ACTIVE'),
      orderBy('costPoints', 'asc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => docToReward(doc.data(), doc.id));
  } catch (error) {
    console.error('[RewardService] Error fetching rewards for city:', error);
    throw error;
  }
};

/**
 * Get rewards a user can afford
 * 
 * @param city - User's city
 * @param userPoints - User's current points balance
 * @returns Array of affordable rewards
 */
export const getAffordableRewards = async (
  city: string, 
  userPoints: number
): Promise<Reward[]> => {
  try {
    const q = query(
      rewardsCol,
      where('city', '==', city),
      where('status', '==', 'ACTIVE'),
      where('costPoints', '<=', userPoints),
      orderBy('costPoints', 'asc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => docToReward(doc.data(), doc.id));
  } catch (error) {
    console.error('[RewardService] Error fetching affordable rewards:', error);
    throw error;
  }
};

/**
 * Get a single reward by ID
 * 
 * @param rewardId - Reward document ID
 * @returns Reward object or null if not found
 */
export const getRewardById = async (rewardId: string): Promise<Reward | null> => {
  try {
    const docRef = doc(rewardsCol, rewardId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return docToReward(docSnap.data(), docSnap.id);
  } catch (error) {
    console.error('[RewardService] Error fetching reward by ID:', error);
    throw error;
  }
};

/**
 * Get rewards created by a specific business
 * 
 * @param businessId - Business document ID
 * @returns Array of rewards
 */
export const getRewardsByBusiness = async (businessId: string): Promise<Reward[]> => {
  try {
    const q = query(
      rewardsCol,
      where('businessId', '==', businessId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => docToReward(doc.data(), doc.id));
  } catch (error) {
    console.error('[RewardService] Error fetching rewards by business:', error);
    throw error;
  }
};

/**
 * Create a new reward
 * 
 * @param data - Reward data without ID
 * @returns New reward document ID
 */
export const createReward = async (data: Omit<Reward, 'id'>): Promise<string> => {
  try {
    const rewardData = {
      businessId: data.businessId,
      businessName: data.businessName,
      title: data.title,
      description: data.description,
      costPoints: data.costPoints,
      city: data.city,
      district: data.district,
      imageUrl: data.imageUrl,
      type: data.type,
      discountPercent: data.discountPercent,
      totalAvailable: data.totalAvailable,
      remaining: data.remaining ?? data.totalAvailable,
      terms: data.terms,
      status: data.status || 'ACTIVE',
      createdAt: Timestamp.now(),
      expiresAt: data.expiresAt ? Timestamp.fromDate(new Date(data.expiresAt)) : null,
      updatedAt: Timestamp.now()
    };

    const docRef = await addDoc(rewardsCol, rewardData);
    return docRef.id;
  } catch (error) {
    console.error('[RewardService] Error creating reward:', error);
    throw error;
  }
};

/**
 * Update an existing reward
 * 
 * @param rewardId - Reward document ID
 * @param updates - Partial reward data to update
 */
export const updateReward = async (
  rewardId: string, 
  updates: Partial<Omit<Reward, 'id'>>
): Promise<void> => {
  try {
    const docRef = doc(rewardsCol, rewardId);
    
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now()
    };

    // Convert date strings to Timestamps if present
    if (updates.expiresAt) {
      updateData.expiresAt = Timestamp.fromDate(new Date(updates.expiresAt));
    }

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('[RewardService] Error updating reward:', error);
    throw error;
  }
};

/**
 * Delete a reward
 * 
 * @param rewardId - Reward document ID
 */
export const deleteReward = async (rewardId: string): Promise<void> => {
  try {
    const docRef = doc(rewardsCol, rewardId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('[RewardService] Error deleting reward:', error);
    throw error;
  }
};

/**
 * Get active rewards (shortcut for common query)
 * 
 * @returns Array of active rewards
 */
export const getActiveRewards = async (): Promise<Reward[]> => {
  try {
    const q = query(
      rewardsCol,
      where('status', '==', 'ACTIVE'),
      orderBy('costPoints', 'asc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => docToReward(doc.data(), doc.id));
  } catch (error) {
    console.error('[RewardService] Error fetching active rewards:', error);
    throw error;
  }
};

/**
 * Decrement reward remaining count (when someone redeems)
 * 
 * @param rewardId - Reward document ID
 * @returns Updated remaining count
 */
export const decrementRewardRemaining = async (rewardId: string): Promise<number> => {
  try {
    const reward = await getRewardById(rewardId);
    
    if (!reward) {
      throw new Error('Reward not found');
    }

    if (reward.remaining === undefined || reward.remaining <= 0) {
      throw new Error('Reward out of stock');
    }

    const newRemaining = reward.remaining - 1;
    const docRef = doc(rewardsCol, rewardId);

    const updates: any = {
      remaining: newRemaining,
      updatedAt: Timestamp.now()
    };

    // If no remaining, mark as out of stock
    if (newRemaining === 0) {
      updates.status = 'OUT_OF_STOCK';
    }

    await updateDoc(docRef, updates);
    return newRemaining;
  } catch (error) {
    console.error('[RewardService] Error decrementing reward remaining:', error);
    throw error;
  }
};
