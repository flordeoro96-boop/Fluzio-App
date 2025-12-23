/**
 * Bring a Friend Mission Service
 * 
 * Handles the dual QR scanning flow where:
 * 1. Referrer (existing customer) initiates the mission
 * 2. Friend (new customer) scans the same QR code
 * 3. System verifies both are at location
 * 4. Rewards both users after 3-day verification period
 */

import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  query, 
  where, 
  getDocs, 
  Timestamp,
  updateDoc,
  increment
} from 'firebase/firestore';
import { db } from './AuthContext';
import { createNotification } from './notificationService';
import { logPointsTransaction } from './pointsMarketplaceService';
import { api } from './apiService';

// ============================================================================
// TYPES
// ============================================================================

export interface BringAFriendSession {
  id: string;
  missionId: string;
  businessId: string;
  businessName: string;
  referrerId: string;
  referrerName: string;
  friendId?: string;
  friendName?: string;
  status: 'WAITING_FOR_FRIEND' | 'BOTH_SCANNED' | 'VERIFIED' | 'EXPIRED';
  referrerScanTime: Timestamp;
  friendScanTime?: Timestamp;
  rewardPoints: number;
  rewardUnlockDate?: Timestamp;
  createdAt: Timestamp;
  completedAt?: Timestamp;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SCAN_WINDOW_MINUTES = 30; // Friend must scan within 30 minutes
const VERIFICATION_DAYS = 3; // Reward unlocks after 3 days
const MIN_ENGAGEMENT_SECONDS = 300; // 5 minutes minimum
const RATE_LIMIT_PER_MONTH = 20;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if friend is a first-time visitor to this business
 */
async function isFriendNewToBusinessExceptCurrentSession(
  friendId: string, 
  businessId: string,
  currentSessionId?: string
): Promise<boolean> {
  try {
    // Check participations collection for any prior visits
    const participationsRef = collection(db, 'participations');
    const q = query(
      participationsRef,
      where('userId', '==', friendId),
      where('businessId', '==', businessId),
      where('status', 'in', ['APPROVED', 'PENDING'])
    );
    
    const snapshot = await getDocs(q);
    
    // Filter out the current session's participation if it exists
    const priorVisits = snapshot.docs.filter(doc => {
      if (!currentSessionId) return true;
      return doc.id !== currentSessionId;
    });
    
    if (priorVisits.length > 0) {
      console.log(`[BringAFriend] Friend ${friendId} has ${priorVisits.length} prior visits to business ${businessId}`);
      return false;
    }

    // Check bring-a-friend sessions where friend completed before
    const sessionsRef = collection(db, 'bringAFriendSessions');
    const qSessions = query(
      sessionsRef,
      where('friendId', '==', friendId),
      where('businessId', '==', businessId),
      where('status', '==', 'VERIFIED')
    );
    
    const sessionSnapshot = await getDocs(qSessions);
    
    // Filter out current session
    const priorSessions = sessionSnapshot.docs.filter(doc => doc.id !== currentSessionId);
    
    if (priorSessions.length > 0) {
      console.log(`[BringAFriend] Friend ${friendId} has already been brought to business ${businessId} before`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('[BringAFriend] Error checking friend visit history:', error);
    return false;
  }
}

/**
 * Check rate limiting for referrer
 */
async function checkRateLimit(userId: string, businessId: string): Promise<boolean> {
  try {
    const sessionsRef = collection(db, 'bringAFriendSessions');
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
    
    const q = query(
      sessionsRef,
      where('referrerId', '==', userId),
      where('businessId', '==', businessId),
      where('createdAt', '>=', Timestamp.fromDate(oneMonthAgo))
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.docs.length >= RATE_LIMIT_PER_MONTH) {
      console.log(`[BringAFriend] User ${userId} has reached rate limit (${snapshot.docs.length}/${RATE_LIMIT_PER_MONTH})`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('[BringAFriend] Error checking rate limit:', error);
    return false;
  }
}

/**
 * Get user details
 */
async function getUserDetails(userId: string): Promise<{ name: string; points: number } | null> {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return null;
    }
    
    const userData = userDoc.data();
    return {
      name: userData.name || 'User',
      points: userData.points || 0
    };
  } catch (error) {
    console.error('[BringAFriend] Error getting user details:', error);
    return null;
  }
}

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * Referrer initiates the bring-a-friend mission by scanning QR
 */
export async function initiateReferral(
  missionId: string,
  businessId: string,
  businessName: string,
  referrerId: string,
  rewardPoints: number
): Promise<{ success: boolean; sessionId?: string; error?: string }> {
  try {
    console.log('[BringAFriend] Referrer initiating:', {
      missionId,
      businessId,
      referrerId,
      rewardPoints
    });

    // Check rate limit
    const withinLimit = await checkRateLimit(referrerId, businessId);
    if (!withinLimit) {
      return {
        success: false,
        error: 'You have reached the maximum number of friend referrals this month (20).'
      };
    }

    // Get referrer details
    const referrerDetails = await getUserDetails(referrerId);
    if (!referrerDetails) {
      return {
        success: false,
        error: 'Could not find your user account.'
      };
    }

    // Check for existing active session
    const sessionsRef = collection(db, 'bringAFriendSessions');
    const existingQuery = query(
      sessionsRef,
      where('referrerId', '==', referrerId),
      where('businessId', '==', businessId),
      where('status', '==', 'WAITING_FOR_FRIEND')
    );
    
    const existingSnapshot = await getDocs(existingQuery);
    
    // If there's an existing waiting session, check if it's expired
    if (!existingSnapshot.empty) {
      const existingSession = existingSnapshot.docs[0];
      const sessionData = existingSession.data();
      const scanTime = sessionData.referrerScanTime.toDate();
      const now = new Date();
      const minutesElapsed = (now.getTime() - scanTime.getTime()) / 1000 / 60;
      
      if (minutesElapsed < SCAN_WINDOW_MINUTES) {
        // Session still active
        return {
          success: true,
          sessionId: existingSession.id
        };
      } else {
        // Session expired, mark as expired
        await updateDoc(doc(db, 'bringAFriendSessions', existingSession.id), {
          status: 'EXPIRED'
        });
      }
    }

    // Create new session
    const sessionRef = doc(collection(db, 'bringAFriendSessions'));
    const sessionData: BringAFriendSession = {
      id: sessionRef.id,
      missionId,
      businessId,
      businessName,
      referrerId,
      referrerName: referrerDetails.name,
      status: 'WAITING_FOR_FRIEND',
      referrerScanTime: Timestamp.now(),
      rewardPoints,
      createdAt: Timestamp.now()
    };

    await setDoc(sessionRef, sessionData);

    console.log('[BringAFriend] ✅ Referral session created:', sessionRef.id);

    // Notify referrer
    await createNotification(referrerId, {
      type: 'MISSION_POSTED',
      title: '👥 Waiting for Your Friend',
      message: `Your friend has 30 minutes to scan the QR code at ${businessName}. Both of you will earn ${rewardPoints} points!`,
      actionLink: `/missions/${missionId}`
    });

    return {
      success: true,
      sessionId: sessionRef.id
    };
  } catch (error) {
    console.error('[BringAFriend] Error initiating referral:', error);
    return {
      success: false,
      error: 'An error occurred. Please try again.'
    };
  }
}

/**
 * Friend scans QR code to complete the referral
 */
export async function completeFriendScan(
  sessionId: string,
  friendId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[BringAFriend] Friend scanning:', { sessionId, friendId });

    // Get session
    const sessionRef = doc(db, 'bringAFriendSessions', sessionId);
    const sessionDoc = await getDoc(sessionRef);

    if (!sessionDoc.exists()) {
      return {
        success: false,
        error: 'Session not found. Your friend may need to scan first.'
      };
    }

    const session = sessionDoc.data() as BringAFriendSession;

    // Validate session status
    if (session.status !== 'WAITING_FOR_FRIEND') {
      return {
        success: false,
        error: 'This referral session is no longer active.'
      };
    }

    // Check if scan is within time window
    const scanTime = session.referrerScanTime.toDate();
    const now = new Date();
    const minutesElapsed = (now.getTime() - scanTime.getTime()) / 1000 / 60;

    if (minutesElapsed > SCAN_WINDOW_MINUTES) {
      await updateDoc(sessionRef, { status: 'EXPIRED' });
      return {
        success: false,
        error: `Time window expired. Your friend scanned ${Math.floor(minutesElapsed)} minutes ago (limit: ${SCAN_WINDOW_MINUTES} minutes).`
      };
    }

    // Prevent self-referral
    if (friendId === session.referrerId) {
      return {
        success: false,
        error: 'You cannot bring yourself as a friend!'
      };
    }

    // Check if friend is new to this business (excluding current session)
    const isNew = await isFriendNewToBusinessExceptCurrentSession(
      friendId, 
      session.businessId,
      sessionId
    );
    
    if (!isNew) {
      return {
        success: false,
        error: 'This friend has already visited this business before. Bring someone new!'
      };
    }

    // Get friend details
    const friendDetails = await getUserDetails(friendId);
    if (!friendDetails) {
      return {
        success: false,
        error: 'Could not find friend user account.'
      };
    }

    // Calculate reward unlock date (3 days from now)
    const unlockDate = new Date();
    unlockDate.setDate(unlockDate.getDate() + VERIFICATION_DAYS);

    // Update session
    await updateDoc(sessionRef, {
      friendId,
      friendName: friendDetails.name,
      friendScanTime: Timestamp.now(),
      status: 'BOTH_SCANNED',
      rewardUnlockDate: Timestamp.fromDate(unlockDate)
    });

    console.log('[BringAFriend] ✅ Both users scanned. Rewards locked until:', unlockDate);

    // Create pending participations for both users
    // These will be used to track the mission completion
    const participationsRef = collection(db, 'participations');
    
    // Referrer participation
    const referrerParticipationRef = doc(participationsRef);
    await setDoc(referrerParticipationRef, {
      missionId: session.missionId,
      userId: session.referrerId,
      businessId: session.businessId,
      status: 'PENDING',
      appliedAt: Timestamp.now(),
      metadata: {
        type: 'BRING_A_FRIEND_REFERRER',
        sessionId,
        friendId,
        rewardUnlockDate: Timestamp.fromDate(unlockDate)
      }
    });

    // Friend participation
    const friendParticipationRef = doc(participationsRef);
    await setDoc(friendParticipationRef, {
      missionId: session.missionId,
      userId: friendId,
      businessId: session.businessId,
      status: 'PENDING',
      appliedAt: Timestamp.now(),
      metadata: {
        type: 'BRING_A_FRIEND_REFEREE',
        sessionId,
        referrerId: session.referrerId,
        rewardUnlockDate: Timestamp.fromDate(unlockDate)
      }
    });

    // Notify both users
    await createNotification(session.referrerId, {
      type: 'MISSION_APPROVED',
      title: '🎉 Friend Verified!',
      message: `${friendDetails.name} scanned successfully! You'll both receive ${session.rewardPoints} points in ${VERIFICATION_DAYS} days.`,
      actionLink: `/missions/${session.missionId}`
    });

    await createNotification(friendId, {
      type: 'MISSION_APPROVED',
      title: '👥 Welcome!',
      message: `${session.referrerName} brought you to ${session.businessName}! You'll both receive ${session.rewardPoints} points in ${VERIFICATION_DAYS} days.`,
      actionLink: `/missions/${session.missionId}`
    });

    return { success: true };
  } catch (error) {
    console.error('[BringAFriend] Error completing friend scan:', error);
    return {
      success: false,
      error: 'An error occurred. Please try again.'
    };
  }
}

/**
 * Get active session for a user at a business
 */
export async function getActiveSession(
  userId: string,
  businessId: string
): Promise<BringAFriendSession | null> {
  try {
    const sessionsRef = collection(db, 'bringAFriendSessions');
    const q = query(
      sessionsRef,
      where('referrerId', '==', userId),
      where('businessId', '==', businessId),
      where('status', '==', 'WAITING_FOR_FRIEND')
    );

    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }

    const sessionDoc = snapshot.docs[0];
    const session = sessionDoc.data() as BringAFriendSession;

    // Check if expired
    const scanTime = session.referrerScanTime.toDate();
    const now = new Date();
    const minutesElapsed = (now.getTime() - scanTime.getTime()) / 1000 / 60;

    if (minutesElapsed > SCAN_WINDOW_MINUTES) {
      await updateDoc(doc(db, 'bringAFriendSessions', sessionDoc.id), {
        status: 'EXPIRED'
      });
      return null;
    }

    return session;
  } catch (error) {
    console.error('[BringAFriend] Error getting active session:', error);
    return null;
  }
}

/**
 * Check if rewards should be unlocked and distribute them
 * This should be called by a Cloud Function on a schedule
 */
export async function unlockPendingRewards(): Promise<void> {
  try {
    const sessionsRef = collection(db, 'bringAFriendSessions');
    const now = Timestamp.now();
    
    const q = query(
      sessionsRef,
      where('status', '==', 'BOTH_SCANNED'),
      where('rewardUnlockDate', '<=', now)
    );

    const snapshot = await getDocs(q);

    console.log(`[BringAFriend] Processing ${snapshot.docs.length} pending rewards`);

    for (const sessionDoc of snapshot.docs) {
      const session = sessionDoc.data() as BringAFriendSession;

      try {
        // Award points to referrer
        const referrerUser = await getUserDetails(session.referrerId);
        if (referrerUser) {
          const newReferrerPoints = referrerUser.points + session.rewardPoints;
          await api.updateUser(session.referrerId, { points: newReferrerPoints });
          await logPointsTransaction(
            session.referrerId,
            'EARN',
            session.rewardPoints,
            'MISSION',
            `Brought ${session.friendName} to ${session.businessName}`,
            referrerUser.points,
            newReferrerPoints
          );

          await createNotification(session.referrerId, {
            type: 'POINTS_ACTIVITY',
            title: '🎉 Reward Unlocked!',
            message: `You earned ${session.rewardPoints} points for bringing ${session.friendName} to ${session.businessName}!`,
            actionLink: `/wallet`
          });
        }

        // Award points to friend
        if (session.friendId) {
          const friendUser = await getUserDetails(session.friendId);
          if (friendUser) {
            const newFriendPoints = friendUser.points + session.rewardPoints;
            await api.updateUser(session.friendId, { points: newFriendPoints });
            await logPointsTransaction(
              session.friendId,
              'EARN',
              session.rewardPoints,
              'MISSION',
              `Visited ${session.businessName} with ${session.referrerName}`,
              friendUser.points,
              newFriendPoints
            );

            await createNotification(session.friendId, {
              type: 'POINTS_ACTIVITY',
              title: '🎉 Reward Unlocked!',
              message: `You earned ${session.rewardPoints} points for visiting ${session.businessName}!`,
              actionLink: `/wallet`
            });
          }
        }

        // Update session status
        await updateDoc(doc(db, 'bringAFriendSessions', sessionDoc.id), {
          status: 'VERIFIED',
          completedAt: Timestamp.now()
        });

        // Update participations
        const participationsRef = collection(db, 'participations');
        const participationsQuery = query(
          participationsRef,
          where('metadata.sessionId', '==', sessionDoc.id)
        );
        const participationsSnapshot = await getDocs(participationsQuery);
        
        for (const participationDoc of participationsSnapshot.docs) {
          await updateDoc(doc(db, 'participations', participationDoc.id), {
            status: 'APPROVED',
            approvedAt: Timestamp.now()
          });
        }

        console.log(`[BringAFriend] ✅ Rewards distributed for session ${sessionDoc.id}`);
      } catch (error) {
        console.error(`[BringAFriend] Error distributing rewards for session ${sessionDoc.id}:`, error);
      }
    }
  } catch (error) {
    console.error('[BringAFriend] Error unlocking pending rewards:', error);
  }
}
