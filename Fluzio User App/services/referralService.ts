/**
 * Referral Service - Mission-Based Implementation
 * 
 * Flow:
 * 1. User generates unique referral link
 * 2. Friend clicks link and makes account + first purchase ($25+ minimum)
 * 3. System tracks referral via cookie/localStorage
 * 4. Friend's purchase verified
 * 5. After 14-day verification period, referrer gets bonus points
 * 6. Friend also gets welcome bonus
 * 
 * Anti-Cheat:
 * - 50 referrals/month max
 * - Unique device tracking
 * - Friend must make qualifying purchase ($25+)
 * - 14-day reward delay (prevents refund fraud)
 * - Cannot refer yourself
 * - GOLD tier required
 */

import { db } from './AuthContext';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs, 
  getDoc,
  Timestamp,
  increment 
} from 'firebase/firestore';
import { createNotification } from './notificationService';
import { logPointsTransaction } from './pointsMarketplaceService';

// ============================================================================
// TYPES
// ============================================================================

export type ReferralStatus = 
  | 'PENDING'       // Friend signed up, no purchase yet
  | 'QUALIFIED'     // Friend made qualifying purchase
  | 'COMPLETED'     // Referrer rewarded
  | 'EXPIRED'       // Friend didn't purchase within time limit
  | 'REJECTED';     // Fraud detected

export interface ReferralLink {
  id?: string;
  referrerId: string;
  referrerName: string;
  missionId: string;
  businessId: string;
  businessName: string;
  
  // Referral Code
  referralCode: string; // Unique 8-char code
  referralUrl: string;  // Full URL with code
  
  // Tracking
  clicks: number;
  signups: number;
  conversions: number; // Paid customers
  
  // Status
  isActive: boolean;
  createdAt: Timestamp;
  expiresAt?: Timestamp;
}

export interface Referral {
  id?: string;
  referralCode: string;
  referrerId: string;
  referrerName: string;
  missionId: string;
  businessId: string;
  businessName: string;
  
  // Referred User
  friendId: string;
  friendName: string;
  friendEmail?: string;
  
  // Purchase Details
  purchaseAmount?: number;
  orderNumber?: string;
  purchaseDate?: Timestamp;
  
  // Status
  status: ReferralStatus;
  
  // Rewards
  referrerRewardPoints: number;
  friendWelcomeBonus: number;
  referrerPointsAwarded: boolean;
  friendBonusAwarded: boolean;
  rewardUnlockDate?: Timestamp; // 14 days after purchase
  
  // Tracking
  signupDate: Timestamp;
  qualifiedDate?: Timestamp;
  completedDate?: Timestamp;
  createdAt: Timestamp;
  
  // Anti-fraud
  ipAddress?: string;
  deviceFingerprint?: string;
}

// ============================================================================
// REFERRAL LINK GENERATION
// ============================================================================

/**
 * Generate unique referral code
 */
function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Create or get referral link for user
 */
export async function createReferralLink(
  userId: string,
  userName: string,
  missionId: string,
  businessId: string,
  businessName: string
): Promise<{ success: boolean; link?: ReferralLink; error?: string }> {
  
  try {
    // Check if user already has active link for this mission
    const existingQuery = query(
      collection(db, 'referralLinks'),
      where('referrerId', '==', userId),
      where('missionId', '==', missionId),
      where('businessId', '==', businessId),
      where('isActive', '==', true)
    );
    
    const existingSnap = await getDocs(existingQuery);
    
    if (!existingSnap.empty) {
      const existing = existingSnap.docs[0];
      return {
        success: true,
        link: {
          id: existing.id,
          ...existing.data()
        } as ReferralLink
      };
    }
    
    // Generate unique code
    let referralCode = generateReferralCode();
    let isUnique = false;
    
    // Ensure code is unique
    while (!isUnique) {
      const codeQuery = query(
        collection(db, 'referralLinks'),
        where('referralCode', '==', referralCode)
      );
      const codeSnap = await getDocs(codeQuery);
      
      if (codeSnap.empty) {
        isUnique = true;
      } else {
        referralCode = generateReferralCode();
      }
    }
    
    // Create referral link
    const referralUrl = `${window.location.origin}/join?ref=${referralCode}`;
    
    const link: ReferralLink = {
      referrerId: userId,
      referrerName: userName,
      missionId,
      businessId,
      businessName,
      referralCode,
      referralUrl,
      clicks: 0,
      signups: 0,
      conversions: 0,
      isActive: true,
      createdAt: Timestamp.now()
    };
    
    const docRef = await addDoc(collection(db, 'referralLinks'), link);
    
    console.log('[ReferralService] Created referral link:', docRef.id);
    
    return {
      success: true,
      link: {
        id: docRef.id,
        ...link
      }
    };
    
  } catch (error: any) {
    console.error('[ReferralService] Error creating referral link:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Track referral link click
 */
export async function trackReferralClick(referralCode: string): Promise<void> {
  try {
    const q = query(
      collection(db, 'referralLinks'),
      where('referralCode', '==', referralCode),
      where('isActive', '==', true)
    );
    
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const linkDoc = snapshot.docs[0];
      await updateDoc(doc(db, 'referralLinks', linkDoc.id), {
        clicks: increment(1)
      });
      
      console.log('[ReferralService] Tracked click for:', referralCode);
    }
  } catch (error) {
    console.error('[ReferralService] Error tracking click:', error);
  }
}

// ============================================================================
// REFERRAL TRACKING
// ============================================================================

/**
 * Check monthly referral limit
 */
async function checkReferralLimit(referrerId: string): Promise<{ allowed: boolean; count: number }> {
  try {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    
    const q = query(
      collection(db, 'referrals'),
      where('referrerId', '==', referrerId),
      where('createdAt', '>=', Timestamp.fromDate(monthStart)),
      where('status', 'in', ['QUALIFIED', 'COMPLETED'])
    );
    
    const snapshot = await getDocs(q);
    const count = snapshot.size;
    
    const MAX_REFERRALS = 50;
    
    return {
      allowed: count < MAX_REFERRALS,
      count
    };
    
  } catch (error) {
    console.error('[ReferralService] Error checking referral limit:', error);
    return { allowed: false, count: 0 };
  }
}

/**
 * Create referral when friend signs up
 */
export async function createReferral(
  referralCode: string,
  friendId: string,
  friendName: string,
  friendEmail: string,
  ipAddress?: string,
  deviceFingerprint?: string
): Promise<{ success: boolean; referralId?: string; error?: string }> {
  
  try {
    // Find referral link
    const linkQuery = query(
      collection(db, 'referralLinks'),
      where('referralCode', '==', referralCode),
      where('isActive', '==', true)
    );
    
    const linkSnap = await getDocs(linkQuery);
    
    if (linkSnap.empty) {
      return { success: false, error: 'Invalid referral code' };
    }
    
    const linkDoc = linkSnap.docs[0];
    const link = linkDoc.data() as ReferralLink;
    
    // Check if user is trying to refer themselves
    if (link.referrerId === friendId) {
      return { success: false, error: 'Cannot refer yourself' };
    }
    
    // Check referral limit
    const limitCheck = await checkReferralLimit(link.referrerId);
    if (!limitCheck.allowed) {
      return { 
        success: false, 
        error: 'Referrer has reached monthly limit (50 referrals)' 
      };
    }
    
    // Check if friend was already referred by this user
    const existingQuery = query(
      collection(db, 'referrals'),
      where('referrerId', '==', link.referrerId),
      where('friendId', '==', friendId)
    );
    
    const existingSnap = await getDocs(existingQuery);
    
    if (!existingSnap.empty) {
      return { 
        success: false, 
        error: 'You were already referred by this user' 
      };
    }
    
    // Create referral record
    const referral: Referral = {
      referralCode,
      referrerId: link.referrerId,
      referrerName: link.referrerName,
      missionId: link.missionId,
      businessId: link.businessId,
      businessName: link.businessName,
      friendId,
      friendName,
      friendEmail,
      status: 'PENDING',
      referrerRewardPoints: 500, // From mission template
      friendWelcomeBonus: 100,   // Welcome bonus for friend
      referrerPointsAwarded: false,
      friendBonusAwarded: false,
      signupDate: Timestamp.now(),
      createdAt: Timestamp.now(),
      ipAddress,
      deviceFingerprint
    };
    
    const docRef = await addDoc(collection(db, 'referrals'), referral);
    
    // Update referral link stats
    await updateDoc(doc(db, 'referralLinks', linkDoc.id), {
      signups: increment(1)
    });
    
    console.log('[ReferralService] Created referral:', docRef.id);
    
    // Award friend welcome bonus immediately
    const friendRef = doc(db, 'users', friendId);
    const friendSnap = await getDoc(friendRef);
    
    if (friendSnap.exists()) {
      const friendData = friendSnap.data();
      const currentPoints = friendData.points || 0;
      const newPoints = currentPoints + referral.friendWelcomeBonus;
      
      await updateDoc(friendRef, {
        points: newPoints
      });
      
      await logPointsTransaction(
        friendId,
        'EARN',
        referral.friendWelcomeBonus,
        'REFERRAL',
        'Welcome bonus from referral',
        currentPoints,
        newPoints
      );
      
      await updateDoc(doc(db, 'referrals', docRef.id), {
        friendBonusAwarded: true
      });
    }
    
    // Notify referrer
    await createNotification(
      link.referrerId,
      {
        type: 'MISSION_APPROVED',
        title: '👥 Friend Signed Up!',
        message: `${friendName} joined using your referral link! You'll earn 500 points when they make their first purchase.`,
        actionLink: '/referrals'
      }
    );
    
    // Notify friend
    await createNotification(
      friendId,
      {
        type: 'POINTS_ACTIVITY',
        title: '🎉 Welcome Bonus!',
        message: `You've received ${referral.friendWelcomeBonus} points as a welcome bonus! Make a purchase at ${link.businessName} to give your friend 500 points!`,
        actionLink: '/wallet'
      }
    );
    
    return { success: true, referralId: docRef.id };
    
  } catch (error: any) {
    console.error('[ReferralService] Error creating referral:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Mark referral as qualified (friend made purchase)
 */
export async function qualifyReferral(
  referralId: string,
  purchaseAmount: number,
  orderNumber: string
): Promise<{ success: boolean; error?: string }> {
  
  try {
    const referralRef = doc(db, 'referrals', referralId);
    const referralSnap = await getDoc(referralRef);
    
    if (!referralSnap.exists()) {
      return { success: false, error: 'Referral not found' };
    }
    
    const referral = referralSnap.data() as Referral;
    
    const MIN_PURCHASE = 25;
    
    if (purchaseAmount < MIN_PURCHASE) {
      return { 
        success: false, 
        error: `Minimum purchase of $${MIN_PURCHASE} required for referral reward` 
      };
    }
    
    // Calculate reward unlock date (14 days)
    const rewardUnlockDate = new Date();
    rewardUnlockDate.setDate(rewardUnlockDate.getDate() + 14);
    
    // Update referral
    await updateDoc(referralRef, {
      status: 'QUALIFIED',
      purchaseAmount,
      orderNumber,
      purchaseDate: Timestamp.now(),
      qualifiedDate: Timestamp.now(),
      rewardUnlockDate: Timestamp.fromDate(rewardUnlockDate)
    });
    
    // Update referral link stats
    const linkQuery = query(
      collection(db, 'referralLinks'),
      where('referralCode', '==', referral.referralCode)
    );
    
    const linkSnap = await getDocs(linkQuery);
    
    if (!linkSnap.empty) {
      await updateDoc(doc(db, 'referralLinks', linkSnap.docs[0].id), {
        conversions: increment(1)
      });
    }
    
    console.log('[ReferralService] Referral qualified:', referralId);
    
    // Notify referrer
    await createNotification(
      referral.referrerId,
      {
        type: 'MISSION_APPROVED',
        title: '💰 Referral Qualified!',
        message: `${referral.friendName} made their first purchase! You'll earn ${referral.referrerRewardPoints} points in 14 days.`,
        actionLink: '/referrals'
      }
    );
    
    return { success: true };
    
  } catch (error: any) {
    console.error('[ReferralService] Error qualifying referral:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// REWARD DISTRIBUTION
// ============================================================================

/**
 * Unlock referral rewards
 * Called by scheduled Cloud Function after 14-day verification period
 */
export async function unlockReferralRewards(): Promise<{
  success: boolean;
  processed: number;
  errors: string[];
}> {
  
  try {
    const now = Timestamp.now();
    
    // Query qualified referrals where reward unlock date has passed
    const q = query(
      collection(db, 'referrals'),
      where('status', '==', 'QUALIFIED'),
      where('referrerPointsAwarded', '==', false),
      where('rewardUnlockDate', '<=', now)
    );
    
    const snapshot = await getDocs(q);
    let processed = 0;
    const errors: string[] = [];
    
    console.log(`[ReferralService] Found ${snapshot.size} referrals ready for reward unlock`);
    
    for (const docSnap of snapshot.docs) {
      try {
        const referral = docSnap.data() as Referral;
        const referralId = docSnap.id;
        
        // Get referrer
        const referrerRef = doc(db, 'users', referral.referrerId);
        const referrerSnap = await getDoc(referrerRef);
        
        if (!referrerSnap.exists()) {
          errors.push(`Referrer not found: ${referral.referrerId}`);
          continue;
        }
        
        const referrerData = referrerSnap.data();
        const currentPoints = referrerData.points || 0;
        const newPoints = currentPoints + referral.referrerRewardPoints;
        
        // Award points
        await updateDoc(referrerRef, {
          points: newPoints
        });
        
        // Log transaction
        await logPointsTransaction(
          referral.referrerId,
          'EARN',
          referral.referrerRewardPoints,
          'REFERRAL',
          `Referred ${referral.friendName} to ${referral.businessName}`,
          currentPoints,
          newPoints
        );
        
        // Update referral
        await updateDoc(doc(db, 'referrals', referralId), {
          status: 'COMPLETED',
          referrerPointsAwarded: true,
          completedDate: Timestamp.now()
        });
        
        // Notify referrer
        await createNotification(
          referral.referrerId,
          {
            type: 'POINTS_ACTIVITY',
            title: '🎉 Referral Reward Unlocked!',
            message: `You've earned ${referral.referrerRewardPoints} points for referring ${referral.friendName} to ${referral.businessName}!`,
            actionLink: '/wallet'
          }
        );
        
        processed++;
        console.log(`[ReferralService] Unlocked reward for referral ${referralId}`);
        
      } catch (error: any) {
        errors.push(`Error processing ${docSnap.id}: ${error.message}`);
      }
    }
    
    return { success: true, processed, errors };
    
  } catch (error: any) {
    console.error('[ReferralService] Error unlocking rewards:', error);
    return { success: false, processed: 0, errors: [error.message] };
  }
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get user's referrals
 */
export async function getUserReferrals(referrerId: string): Promise<Referral[]> {
  try {
    const q = query(
      collection(db, 'referrals'),
      where('referrerId', '==', referrerId)
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Referral));
    
  } catch (error) {
    console.error('[ReferralService] Error getting user referrals:', error);
    return [];
  }
}

/**
 * Get user's referral links
 */
export async function getUserReferralLinks(userId: string): Promise<ReferralLink[]> {
  try {
    const q = query(
      collection(db, 'referralLinks'),
      where('referrerId', '==', userId)
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ReferralLink));
    
  } catch (error) {
    console.error('[ReferralService] Error getting referral links:', error);
    return [];
  }
}

/**
 * Get referral stats for user (mission-based)
 */
export async function getReferralStats(referrerId: string): Promise<{
  totalReferrals: number;
  qualified: number;
  completed: number;
  pending: number;
  totalEarned: number;
  thisMonth: number;
  // Legacy compatibility
  referralCount: number;
  referralPoints: number;
}> {
  
  try {
    const referrals = await getUserReferrals(referrerId);
    
    const stats = {
      totalReferrals: referrals.length,
      qualified: referrals.filter(r => r.status === 'QUALIFIED').length,
      completed: referrals.filter(r => r.status === 'COMPLETED').length,
      pending: referrals.filter(r => r.status === 'PENDING').length,
      totalEarned: referrals
        .filter(r => r.referrerPointsAwarded)
        .reduce((sum, r) => sum + r.referrerRewardPoints, 0),
      thisMonth: 0,
      // Legacy compatibility
      referralCount: 0,
      referralPoints: 0
    };
    
    // Calculate this month's referrals
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    
    stats.thisMonth = referrals.filter(r => {
      const createdAt = r.createdAt.toDate();
      return createdAt >= monthStart;
    }).length;
    
    // Legacy compatibility values
    stats.referralCount = stats.completed; // Only count completed referrals
    stats.referralPoints = stats.totalEarned;
    
    return stats;
    
  } catch (error) {
    console.error('[ReferralService] Error getting referral stats:', error);
    return {
      totalReferrals: 0,
      qualified: 0,
      completed: 0,
      pending: 0,
      totalEarned: 0,
      thisMonth: 0,
      referralCount: 0,
      referralPoints: 0
    };
  }
}

// ============================================================================
// LEGACY COMPATIBILITY
// ============================================================================

/**
 * Legacy: Initialize referral code for a user
 * @deprecated Use createReferralLink instead
 */
export async function initializeReferralCode(uid: string, name?: string): Promise<string> {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists() && userSnap.data().referralCode) {
      return userSnap.data().referralCode;
    }

    // Generate simple code for basic referral tracking
    const referralCode = generateReferralCode();
    
    await updateDoc(userRef, {
      referralCode,
      referralCount: 0,
      referralPoints: 0
    });

    return referralCode;
  } catch (error) {
    console.error('[ReferralService] Error initializing referral code:', error);
    throw error;
  }
}

/**
 * Legacy: Process referral when a new user signs up
 * @deprecated Use createReferral instead for mission-based referrals
 */
export async function processReferral(newUserId: string, referralCode: string): Promise<boolean> {
  try {
    // Find user with this code
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('referralCode', '==', referralCode.toUpperCase()));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('[ReferralService] Invalid referral code');
      return false;
    }

    const referrerId = querySnapshot.docs[0].id;
    
    if (referrerId === newUserId) {
      console.log('[ReferralService] Self-referral not allowed');
      return false;
    }

    // Update new user
    const newUserRef = doc(db, 'users', newUserId);
    await updateDoc(newUserRef, {
      referredBy: referrerId,
      points: increment(50) // Legacy welcome bonus
    });

    // Update referrer
    const referrerRef = doc(db, 'users', referrerId);
    await updateDoc(referrerRef, {
      referralCount: increment(1),
      referralPoints: increment(100), // Legacy referral points
      points: increment(100)
    });

    console.log(`[ReferralService] Legacy referral processed: ${newUserId} referred by ${referrerId}`);
    return true;
  } catch (error) {
    console.error('[ReferralService] Error processing legacy referral:', error);
    return false;
  }
}

/**
 * Legacy configuration
 * @deprecated Use mission-based rewards instead
 */
export const REFERRAL_CONFIG = {
  POINTS_FOR_REFERRER: 100,
  POINTS_FOR_NEW_USER: 50
};
