import { db } from './AuthContext';
import { doc, collection, addDoc, updateDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';

const GENERATE_LINK_URL = 'https://us-central1-fluzio-13af2.cloudfunctions.net/generateInstagramFollowLink';

export interface InstagramFollowVerification {
  id: string;
  token: string;
  fluzioUserId: string;
  businessId: string;
  missionId: string;
  status: 'PENDING' | 'VERIFYING' | 'VERIFIED' | 'FAILED';
  igsid?: string;
  createdAt: Date;
  verifiedAt?: Date;
  expiresAt: Date;
  error?: string;
}

export const InstagramFollowService = {
  /**
   * Generate Instagram follow verification link
   * This creates a unique tracking link for the user to follow the business
   */
  generateFollowLink: async (
    userId: string,
    businessId: string,
    missionId: string
  ): Promise<{ dmLink: string; token: string }> => {
    try {
      console.log('[InstagramFollow] Generating follow link for user:', userId);

      const response = await fetch(GENERATE_LINK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, businessId, missionId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      console.log('[InstagramFollow] ✅ Generated link:', data.dmLink);

      return {
        dmLink: data.dmLink,
        token: data.token,
      };
    } catch (error: any) {
      console.error('[InstagramFollow] ❌ Generate link failed:', error);
      throw error;
    }
  },

  /**
   * Check verification status
   * Polls the Firestore database to check if the follow has been verified
   */
  checkVerificationStatus: async (token: string): Promise<InstagramFollowVerification | null> => {
    try {
      const verificationsRef = collection(db, 'instagramFollowVerifications');
      const q = query(verificationsRef, where('token', '==', token));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
      } as InstagramFollowVerification;
    } catch (error) {
      console.error('[InstagramFollow] Error checking status:', error);
      return null;
    }
  },

  /**
   * Subscribe to verification status changes
   * Real-time listener for when the webhook updates the verification
   */
  subscribeToVerification: (
    token: string,
    onStatusChange: (verification: InstagramFollowVerification) => void
  ): (() => void) => {
    const verificationsRef = collection(db, 'instagramFollowVerifications');
    const q = query(verificationsRef, where('token', '==', token));

    // Set up real-time listener
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const verification = {
          id: doc.id,
          ...doc.data(),
        } as InstagramFollowVerification;

        onStatusChange(verification);
      }
    });

    return unsubscribe;
  },
};

// Import onSnapshot for real-time updates
import { onSnapshot } from 'firebase/firestore';
