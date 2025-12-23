import { db } from './AuthContext';
import { doc, setDoc, deleteDoc, getDoc, collection, query, where, getDocs, serverTimestamp, updateDoc, increment } from 'firebase/firestore';

/**
 * Follow a business
 */
export const followBusiness = async (
  userId: string,
  businessId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const followId = `${userId}_${businessId}`;
    const followRef = doc(db, 'businessFollows', followId);
    
    await setDoc(followRef, {
      userId,
      businessId,
      createdAt: serverTimestamp()
    });

    // Increment business favorites count
    const businessRef = doc(db, 'users', businessId);
    const businessSnap = await getDoc(businessRef);
    if (businessSnap.exists()) {
      const currentFavorites = businessSnap.data().creatorFavorites || 0;
      await updateDoc(businessRef, {
        creatorFavorites: currentFavorites + 1
      });
    }

    console.log('[businessService] Business followed:', followId);
    return { success: true };
  } catch (error) {
    console.error('[businessService] Error following business:', error);
    return { success: false, error: 'Failed to follow business' };
  }
};

/**
 * Unfollow a business
 */
export const unfollowBusiness = async (
  userId: string,
  businessId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const followId = `${userId}_${businessId}`;
    const followRef = doc(db, 'businessFollows', followId);
    
    await deleteDoc(followRef);

    // Decrement business favorites count
    const businessRef = doc(db, 'users', businessId);
    const businessSnap = await getDoc(businessRef);
    if (businessSnap.exists()) {
      const currentFavorites = businessSnap.data().creatorFavorites || 0;
      await updateDoc(businessRef, {
        creatorFavorites: Math.max(0, currentFavorites - 1)
      });
    }

    console.log('[businessService] Business unfollowed:', followId);
    return { success: true };
  } catch (error) {
    console.error('[businessService] Error unfollowing business:', error);
    return { success: false, error: 'Failed to unfollow business' };
  }
};

/**
 * Check if user is following a business
 */
export const isFollowingBusiness = async (
  userId: string,
  businessId: string
): Promise<boolean> => {
  try {
    const followId = `${userId}_${businessId}`;
    const followRef = doc(db, 'businessFollows', followId);
    const followSnap = await getDoc(followRef);
    
    return followSnap.exists();
  } catch (error) {
    console.error('[businessService] Error checking follow status:', error);
    return false;
  }
};

/**
 * Get all businesses a user is following
 */
export const getFollowedBusinesses = async (userId: string): Promise<string[]> => {
  try {
    const followsRef = collection(db, 'businessFollows');
    const q = query(followsRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => doc.data().businessId);
  } catch (error) {
    console.error('[businessService] Error fetching followed businesses:', error);
    return [];
  }
};

/**
 * Get all followers of a business
 */
export const getBusinessFollowers = async (businessId: string): Promise<string[]> => {
  try {
    const followsRef = collection(db, 'businessFollows');
    const q = query(followsRef, where('businessId', '==', businessId));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => doc.data().userId);
  } catch (error) {
    console.error('[businessService] Error fetching business followers:', error);
    return [];
  }
};
