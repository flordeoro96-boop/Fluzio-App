/**
 * Tracking Service
 * Handles creator and regular customer tracking for businesses
 */

import { db, auth } from './AuthContext';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  increment,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { CreatorInsight, RegularInsight } from '../types';

interface TrackEventData {
  userId: string;
  businessId: string;
  eventType: 'VISIT' | 'CHECK_IN' | 'MISSION_COMPLETED' | 'CONVERSION' | 'REFERRAL';
  metadata?: {
    missionId?: string;
    missionType?: string;
    productId?: string;
    orderValue?: number;
    referredUserId?: string;
  };
}

/**
 * Track an event (visit, mission, conversion, etc.)
 */
export async function trackEvent(data: TrackEventData): Promise<{ success: boolean; error?: string }> {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const token = await user.getIdToken();
    
    const response = await fetch(
      'https://us-central1-fluzio-13af2.cloudfunctions.net/trackevent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      }
    );

    const result = await response.json();
    
    if (!response.ok) {
      return { success: false, error: result.error || 'Failed to track event' };
    }

    return { success: true };
  } catch (error) {
    console.error('[trackingService] trackEvent error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get top creators for a business
 */
export async function getTopCreators(
  businessId: string, 
  limitCount: number = 10
): Promise<{ success: boolean; creators?: CreatorInsight[]; error?: string }> {
  try {
    console.log('[trackingService] getTopCreators called for businessId:', businessId);
    
    // Get all participations for this business
    const participationsRef = collection(db, 'participations');
    const q = query(participationsRef, where('businessId', '==', businessId));
    const participationsSnapshot = await getDocs(q);
    console.log('[trackingService] Found', participationsSnapshot.size, 'participations');
    
    // Get all check-ins for this business
    const checkInsRef = collection(db, 'checkIns');
    const checkInsQuery = query(checkInsRef, where('businessId', '==', businessId));
    const checkInsSnapshot = await getDocs(checkInsQuery);
    console.log('[trackingService] Found', checkInsSnapshot.size, 'check-ins');
    
    // Aggregate data by user
    const userStats = new Map<string, {
      missionsCompleted: number;
      checkIns: number;
      lastActivity: Date;
      missionIds: Set<string>;
    }>();
    
    participationsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.status === 'APPROVED') {
        const userId = data.userId;
        const stats = userStats.get(userId) || {
          missionsCompleted: 0,
          checkIns: 0,
          lastActivity: new Date(0),
          missionIds: new Set()
        };
        
        stats.missionsCompleted++;
        stats.missionIds.add(data.missionId);
        const activityDate = data.completedAt?.toDate() || data.createdAt?.toDate() || new Date();
        if (activityDate > stats.lastActivity) {
          stats.lastActivity = activityDate;
        }
        
        userStats.set(userId, stats);
      }
    });
    
    checkInsSnapshot.forEach(doc => {
      const data = doc.data();
      const userId = data.userId;
      const stats = userStats.get(userId) || {
        missionsCompleted: 0,
        checkIns: 0,
        lastActivity: new Date(0),
        missionIds: new Set()
      };
      
      stats.checkIns++;
      const checkInDate = data.timestamp?.toDate() || new Date();
      if (checkInDate > stats.lastActivity) {
        stats.lastActivity = checkInDate;
      }
      
      userStats.set(userId, stats);
    });
    
    // Get user details for top performers
    const creators: CreatorInsight[] = [];
    const sortedUsers = Array.from(userStats.entries())
      .sort((a, b) => b[1].missionsCompleted - a[1].missionsCompleted)
      .slice(0, limitCount);
    
    for (const [userId, stats] of sortedUsers) {
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Calculate reach from social accounts
          let totalReach = 0;
          if (userData.socialAccounts?.instagram?.followers) {
            totalReach += userData.socialAccounts.instagram.followers;
          }
          if (userData.socialAccounts?.tiktok?.followers) {
            totalReach += userData.socialAccounts.tiktok.followers;
          }
          if (userData.followersCount) {
            totalReach += userData.followersCount;
          }
          
          creators.push({
            userId,
            name: userData.name || 'Unknown User',
            handle: userData.handle || `@${userData.name?.toLowerCase().replace(/\s/g, '')}`,
            avatarUrl: userData.avatarUrl || userData.photoURL,
            visitsCount: stats.checkIns,
            missionsCompleted: stats.missionsCompleted,
            checkInsCount: stats.checkIns,
            lastActivityAt: stats.lastActivity.toISOString(),
            referralsCount: userData.referralsCount || 0,
            totalReach,
            avgEngagement: userData.avgEngagement || 0,
            postsCreated: stats.missionsCompleted, // Each mission typically results in a post
            conversionsGenerated: 0 // Would need separate tracking
          });
        }
      } catch (err) {
        console.error(`[trackingService] Error fetching user ${userId}:`, err);
      }
    }

    console.log('[trackingService] Returning', creators.length, 'creators');
    return { success: true, creators };
  } catch (error) {
    console.error('[trackingService] getTopCreators error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get top regulars for a business
 */
export async function getTopRegulars(
  businessId: string, 
  limitCount: number = 10
): Promise<{ success: boolean; regulars?: RegularInsight[]; error?: string }> {
  try {
    console.log('[trackingService] getTopRegulars called for businessId:', businessId);
    
    // Get all check-ins for this business
    const checkInsRef = collection(db, 'checkIns');
    const checkInsQuery = query(checkInsRef, where('businessId', '==', businessId));
    const checkInsSnapshot = await getDocs(checkInsQuery);
    console.log('[trackingService] getTopRegulars found', checkInsSnapshot.size, 'check-ins');
    
    // Get all participations for mission completion count
    const participationsRef = collection(db, 'participations');
    const participationsQuery = query(participationsRef, where('businessId', '==', businessId));
    const participationsSnapshot = await getDocs(participationsQuery);
    console.log('[trackingService] getTopRegulars found', participationsSnapshot.size, 'participations');
    
    // Aggregate data by user
    const userStats = new Map<string, {
      checkIns: number;
      missionsCompleted: number;
      lastVisit: Date;
      firstVisit: Date;
    }>();
    
    // Process check-ins
    checkInsSnapshot.forEach(doc => {
      const data = doc.data();
      const userId = data.userId;
      const visitDate = data.timestamp?.toDate() || new Date();
      
      const stats = userStats.get(userId) || {
        checkIns: 0,
        missionsCompleted: 0,
        lastVisit: new Date(0),
        firstVisit: visitDate
      };
      
      stats.checkIns++;
      if (visitDate > stats.lastVisit) {
        stats.lastVisit = visitDate;
      }
      if (visitDate < stats.firstVisit) {
        stats.firstVisit = visitDate;
      }
      
      userStats.set(userId, stats);
    });
    
    // Process participations
    participationsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.status === 'APPROVED') {
        const userId = data.userId;
        const completedAt = data.completedAt?.toDate() || data.createdAt?.toDate() || new Date();
        
        const stats = userStats.get(userId) || {
          checkIns: 0,
          missionsCompleted: 0,
          lastVisit: completedAt,
          firstVisit: completedAt
        };
        
        stats.missionsCompleted++;
        
        // Update visit dates based on participation activity
        if (completedAt > stats.lastVisit) {
          stats.lastVisit = completedAt;
        }
        if (completedAt < stats.firstVisit) {
          stats.firstVisit = completedAt;
        }
        
        userStats.set(userId, stats);
      }
    });
    
    // Get user details for top regulars (sorted by check-ins + missions)
    const regulars: RegularInsight[] = [];
    const sortedUsers = Array.from(userStats.entries())
      .filter(([_, stats]) => stats.checkIns > 0 || stats.missionsCompleted > 0) // Include users with either activity
      .sort((a, b) => {
        // Sort by total engagement (check-ins + missions)
        const aTotal = a[1].checkIns + a[1].missionsCompleted;
        const bTotal = b[1].checkIns + b[1].missionsCompleted;
        return bTotal - aTotal;
      })
      .slice(0, limitCount);
    
    for (const [userId, stats] of sortedUsers) {
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          regulars.push({
            userId,
            name: userData.name || 'Unknown User',
            handle: userData.handle,
            avatarUrl: userData.avatarUrl || userData.photoURL,
            visitsCount: stats.checkIns,
            missionsCompleted: stats.missionsCompleted,
            checkInsCount: stats.checkIns,
            lastVisitAt: stats.lastVisit.toISOString(),
            lastActivityAt: stats.lastVisit.toISOString(),
            referralsCount: userData.referralsCount || 0,
            customerNotes: userData.customerNotes || '',
            preferredProducts: userData.preferredProducts || [],
            totalSpend: userData.totalSpend,
            ordersInfluenced: 0 // Would need separate tracking
          });
        }
      } catch (err) {
        console.error(`[trackingService] Error fetching user ${userId}:`, err);
      }
    }

    console.log('[trackingService] Returning', regulars.length, 'regulars');
    return { success: true, regulars };
  } catch (error) {
    console.error('[trackingService] getTopRegulars error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Update customer notes for a regular
 */
export async function updateCustomerNotes(
  businessId: string,
  userId: string,
  notes: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const regularRef = doc(db, 'regularInsights', `${businessId}_${userId}`);
    await setDoc(regularRef, {
      customerNotes: notes,
      updatedAt: serverTimestamp()
    }, { merge: true });

    return { success: true };
  } catch (error) {
    console.error('[trackingService] updateCustomerNotes error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
