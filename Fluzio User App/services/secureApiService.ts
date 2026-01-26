import { getAuth } from './authCompat';

const auth = getAuth();

const FUNCTIONS_URL = 'https://us-central1-fluzio-13af2.cloudfunctions.net';

/**
 * Secure API Service for protected backend operations
 * All points/rewards operations go through Cloud Functions to enforce security
 */

const getAuthToken = async (): Promise<string> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  return await user.getIdToken();
};

export const secureApi = {
  /**
   * Redeem a reward (secure backend operation)
   */
  redeemReward: async (rewardId: string, userName: string) => {
    try {
      const token = await getAuthToken();
      
      const response = await fetch(`${FUNCTIONS_URL}/redeemreward`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rewardId, userName })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to redeem reward');
      }

      return data;
    } catch (error: any) {
      console.error('[SecureAPI] Redeem reward error:', error);
      throw error;
    }
  },

  /**
   * Purchase marketplace product (secure backend operation)
   */
  purchaseProduct: async (productId: string, productName: string, pointsCost: number, duration?: number) => {
    try {
      const token = await getAuthToken();
      
      const response = await fetch(`${FUNCTIONS_URL}/purchaseproduct`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId, productName, pointsCost, duration })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to purchase product');
      }

      return data;
    } catch (error: any) {
      console.error('[SecureAPI] Purchase product error:', error);
      throw error;
    }
  },

  /**
   * Fund mission with points (secure backend operation)
   */
  fundMission: async (missionId: string, rewardPoints: number, maxParticipants: number) => {
    try {
      const token = await getAuthToken();
      
      const response = await fetch(`${FUNCTIONS_URL}/fundmission`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ missionId, rewardPoints, maxParticipants })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fund mission');
      }

      return data;
    } catch (error: any) {
      console.error('[SecureAPI] Fund mission error:', error);
      throw error;
    }
  }
};
