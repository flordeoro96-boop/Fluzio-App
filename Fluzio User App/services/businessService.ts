import { db } from './apiService';
import { doc, setDoc, deleteDoc, getDoc, collection, query, where, getDocs, serverTimestamp, updateDoc, increment, addDoc, Timestamp } from '../services/firestoreCompat';

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

    // Check for FOLLOW_BUSINESS_APP mission and auto-complete
    await checkAndCompleteFollowMission(userId, businessId);

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

/**
 * Check and complete FOLLOW_BUSINESS_APP mission
 */
const checkAndCompleteFollowMission = async (
  userId: string,
  businessId: string
): Promise<void> => {
  try {
    // Check for active FOLLOW_BUSINESS_APP missions
    const followMissionQuery = query(
      collection(db, 'missions'),
      where('businessId', '==', businessId),
      where('type', '==', 'FOLLOW_BUSINESS_APP'),
      where('status', '==', 'active')
    );
    const followMissions = await getDocs(followMissionQuery);

    if (followMissions.empty) {
      return;
    }

    for (const missionDoc of followMissions.docs) {
      const missionId = missionDoc.id;

      // Check if user already completed this mission
      const existingParticipationQuery = query(
        collection(db, 'participations'),
        where('userId', '==', userId),
        where('missionId', '==', missionId),
        where('status', 'in', ['COMPLETED', 'PENDING'])
      );
      const existingParticipations = await getDocs(existingParticipationQuery);
      
      if (!existingParticipations.empty) {
        console.log('[businessService] User already participated in follow mission');
        continue;
      }

      const points = 50; // FOLLOW_BUSINESS_APP reward

      // Create participation
      await addDoc(collection(db, 'participations'), {
        userId,
        businessId,
        missionId,
        status: 'COMPLETED',
        pointsEarned: points,
        submittedAt: Timestamp.now(),
        completedAt: Timestamp.now()
      });

      // Award points
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        points: increment(points),
        totalPointsEarned: increment(points)
      });

      // Create points transaction
      await addDoc(collection(db, 'pointsTransactions'), {
        userId,
        amount: points,
        type: 'EARN',
        reason: 'Follow Business Completed',
        missionId,
        createdAt: Timestamp.now()
      });

      // Send notification
      await addDoc(collection(db, 'notifications'), {
        userId,
        type: 'MISSION_COMPLETED',
        title: '🎉 Mission Completed!',
        message: `You earned ${points} points for following!`,
        read: false,
        createdAt: Timestamp.now()
      });

      console.log(`[businessService] ✅ Follow mission ${missionId} completed, +${points} points`);
    }

  } catch (error) {
    console.error('[businessService] Error checking follow missions:', error);
  }
};
