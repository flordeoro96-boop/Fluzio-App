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
    const creatorsRef = collection(db, 'creatorInsights');
    const q = query(
      creatorsRef,
      where('businessId', '==', businessId),
      orderBy('missionsCompleted', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    const creators: CreatorInsight[] = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      creators.push({
        userId: data.userId,
        name: data.name,
        handle: data.handle,
        avatarUrl: data.avatarUrl,
        visitsCount: data.visitsCount || 0,
        missionsCompleted: data.missionsCompleted || 0,
        checkInsCount: data.checkInsCount || 0,
        lastVisitAt: data.lastVisitAt?.toDate?.()?.toISOString(),
        lastActivityAt: data.lastActivityAt?.toDate?.()?.toISOString(),
        referralsCount: data.referralsCount || 0,
        favoriteMissionType: data.favoriteMissionType,
        totalReach: data.totalReach || 0,
        avgEngagement: data.avgEngagement || 0,
        postsCreated: data.postsCreated || 0,
        conversionsGenerated: data.conversionsGenerated
      });
    });

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
    const regularsRef = collection(db, 'regularInsights');
    const q = query(
      regularsRef,
      where('businessId', '==', businessId),
      orderBy('visitsCount', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    const regulars: RegularInsight[] = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      regulars.push({
        userId: data.userId,
        name: data.name,
        handle: data.handle,
        avatarUrl: data.avatarUrl,
        visitsCount: data.visitsCount || 0,
        missionsCompleted: data.missionsCompleted || 0,
        checkInsCount: data.checkInsCount || 0,
        lastVisitAt: data.lastVisitAt?.toDate?.()?.toISOString(),
        lastActivityAt: data.lastActivityAt?.toDate?.()?.toISOString(),
        referralsCount: data.referralsCount || 0,
        favoriteMissionType: data.favoriteMissionType,
        customerNotes: data.customerNotes,
        preferredProducts: data.preferredProducts,
        totalSpend: data.totalSpend,
        ordersInfluenced: data.ordersInfluenced
      });
    });

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
