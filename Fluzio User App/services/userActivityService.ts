import { db } from './apiService';
import { doc, updateDoc, increment, arrayUnion, arrayRemove, getDoc } from '../services/firestoreCompat';

/**
 * Service for tracking user activity and stats
 */

export const userActivityService = {
  /**
   * Increment event attendance count
   */
  trackEventAttendance: async (userId: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        eventsAttended: increment(1)
      });
      console.log('[UserActivity] Event attendance tracked for user:', userId);
    } catch (error) {
      console.error('[UserActivity] Error tracking event attendance:', error);
      throw error;
    }
  },

  /**
   * Increment check-in count
   */
  trackCheckIn: async (userId: string, businessId: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        checkInsCount: increment(1)
      });
      
      // Log check-in activity
      console.log('[UserActivity] Check-in tracked for user:', userId, 'at business:', businessId);
    } catch (error) {
      console.error('[UserActivity] Error tracking check-in:', error);
      throw error;
    }
  },

  /**
   * Add business to saved places
   */
  savePlace: async (userId: string, businessId: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        savedPlaces: arrayUnion(businessId)
      });
      console.log('[UserActivity] Place saved for user:', userId, 'business:', businessId);
      return true;
    } catch (error) {
      console.error('[UserActivity] Error saving place:', error);
      throw error;
    }
  },

  /**
   * Remove business from saved places
   */
  unsavePlace: async (userId: string, businessId: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        savedPlaces: arrayRemove(businessId)
      });
      console.log('[UserActivity] Place unsaved for user:', userId, 'business:', businessId);
      return true;
    } catch (error) {
      console.error('[UserActivity] Error unsaving place:', error);
      throw error;
    }
  },

  /**
   * Check if a place is saved
   */
  isPlaceSaved: async (userId: string, businessId: string): Promise<boolean> => {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
      return userData?.savedPlaces?.includes(businessId) || false;
    } catch (error) {
      console.error('[UserActivity] Error checking saved place:', error);
      return false;
    }
  },

  /**
   * Increment missions completed count
   */
  trackMissionCompletion: async (userId: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        missionsCompleted: increment(1)
      });
      console.log('[UserActivity] Mission completion tracked for user:', userId);
    } catch (error) {
      console.error('[UserActivity] Error tracking mission completion:', error);
      throw error;
    }
  },

  /**
   * Increment rewards claimed count
   */
  trackRewardClaim: async (userId: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        rewardsClaimed: increment(1)
      });
      console.log('[UserActivity] Reward claim tracked for user:', userId);
    } catch (error) {
      console.error('[UserActivity] Error tracking reward claim:', error);
      throw error;
    }
  },

  /**
   * Get user activity stats
   */
  getActivityStats: async (userId: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();

      return {
        eventsAttended: userData?.eventsAttended || 0,
        checkInsCount: userData?.checkInsCount || 0,
        savedPlaces: userData?.savedPlaces?.length || 0,
        missionsCompleted: userData?.missionsCompleted || 0,
        rewardsClaimed: userData?.rewardsClaimed || 0
      };
    } catch (error) {
      console.error('[UserActivity] Error getting activity stats:', error);
      return {
        eventsAttended: 0,
        checkInsCount: 0,
        savedPlaces: 0,
        missionsCompleted: 0,
        rewardsClaimed: 0
      };
    }
  }
};
