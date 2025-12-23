/**
 * Shopify Visit Tracking Service
 * 
 * Handles visit tracking, verification, and analytics for Shopify store visits.
 */

import { db } from './AuthContext';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, Timestamp, orderBy, limit, increment } from 'firebase/firestore';

export interface ShopifyVisit {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  businessId: string;
  businessName: string;
  storeUrl: string;
  missionId?: string;
  
  // Tracking data
  visitStartTime: string; // ISO date
  visitEndTime?: string; // ISO date
  duration?: number; // seconds
  
  // Verification
  verified: boolean;
  verifiedAt?: string;
  minDurationRequired: number; // seconds (default 30)
  
  // UTM tracking
  utmSource: string; // 'fluzio'
  utmMedium: string; // 'mission' | 'profile' | 'direct'
  utmCampaign?: string;
  referralCode: string; // Unique code per visit
  
  // Analytics
  deviceType?: string; // 'mobile' | 'desktop' | 'tablet'
  browser?: string;
  ipAddress?: string; // Hashed for privacy
  
  // Rewards
  pointsAwarded: number;
  pointsClaimed: boolean;
  claimedAt?: string;
  
  timestamp: string; // ISO date
}

export interface VisitStats {
  totalVisits: number;
  uniqueVisitors: number;
  averageDuration: number; // seconds
  verifiedVisits: number;
  conversionRate: number; // percentage of visits that meet duration requirement
  totalPointsAwarded: number;
  todayVisits: number;
  weekVisits: number;
  monthVisits: number;
}

const VISIT_COLLECTION = 'shopifyVisits';
const MIN_DURATION_SECONDS = 30; // Minimum time to verify visit
const VISIT_POINTS = 20; // Points awarded for verified visit

/**
 * Generate tracking URL with UTM parameters
 */
export function generateTrackingUrl(
  storeUrl: string,
  userId: string,
  businessId: string,
  missionId?: string
): { url: string; referralCode: string } {
  const referralCode = `flz_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const baseUrl = storeUrl.startsWith('http') ? storeUrl : `https://${storeUrl}`;
  const url = new URL(baseUrl);
  
  // Add UTM parameters
  url.searchParams.set('utm_source', 'fluzio');
  url.searchParams.set('utm_medium', missionId ? 'mission' : 'profile');
  url.searchParams.set('utm_campaign', `user_${userId}`);
  url.searchParams.set('ref', referralCode);
  
  if (missionId) {
    url.searchParams.set('mission', missionId);
  }
  
  return {
    url: url.toString(),
    referralCode
  };
}

/**
 * Start tracking a visit
 */
export async function startVisitTracking(
  userId: string,
  userName: string,
  businessId: string,
  businessName: string,
  storeUrl: string,
  referralCode: string,
  missionId?: string,
  userAvatar?: string
): Promise<string> {
  try {
    const visitData: Omit<ShopifyVisit, 'id'> = {
      userId,
      userName,
      userAvatar,
      businessId,
      businessName,
      storeUrl,
      missionId,
      visitStartTime: new Date().toISOString(),
      verified: false,
      minDurationRequired: MIN_DURATION_SECONDS,
      utmSource: 'fluzio',
      utmMedium: missionId ? 'mission' : 'profile',
      referralCode,
      pointsAwarded: 0,
      pointsClaimed: false,
      timestamp: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, VISIT_COLLECTION), visitData);
    
    console.log('[Shopify Visit] Started tracking:', { businessId, storeUrl });

    return docRef.id;
  } catch (error) {
    console.error('Error starting visit tracking:', error);
    throw error;
  }
}

/**
 * End visit tracking and verify
 */
export async function endVisitTracking(
  referralCode: string,
  deviceInfo?: { deviceType?: string; browser?: string }
): Promise<{ 
  verified: boolean; 
  pointsAwarded: number; 
  duration: number;
  businessId?: string;
  missionId?: string;
  showFeedback?: boolean;
}> {
  try {
    // Find visit by referral code
    const visitsQuery = query(
      collection(db, VISIT_COLLECTION),
      where('referralCode', '==', referralCode),
      limit(1)
    );
    
    const snapshot = await getDocs(visitsQuery);
    
    if (snapshot.empty) {
      throw new Error('Visit not found');
    }

    const visitDoc = snapshot.docs[0];
    const visit = visitDoc.data() as ShopifyVisit;
    
    const endTime = new Date();
    const startTime = new Date(visit.visitStartTime);
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000); // seconds
    
    const verified = duration >= visit.minDurationRequired;
    const pointsAwarded = verified ? VISIT_POINTS : 0;

    // Update visit record
    await updateDoc(doc(db, VISIT_COLLECTION, visitDoc.id), {
      visitEndTime: endTime.toISOString(),
      duration,
      verified,
      verifiedAt: verified ? endTime.toISOString() : null,
      pointsAwarded,
      deviceType: deviceInfo?.deviceType,
      browser: deviceInfo?.browser
    });

    // Award points if verified
    if (verified) {
      await awardVisitPoints(visit.userId, pointsAwarded, visitDoc.id);
    }

    // Track analytics
    console.log('[Shopify Visit] Ended:', { businessId: visit.businessId, duration, verified, pointsAwarded });

    return { 
      verified, 
      pointsAwarded, 
      duration,
      // Return data needed for feedback modal
      businessId: visit.businessId,
      missionId: visit.missionId,
      showFeedback: verified // Only show feedback if visit was verified
    };
  } catch (error) {
    console.error('Error ending visit tracking:', error);
    throw error;
  }
}

/**
 * Award points to user for verified visit
 */
async function awardVisitPoints(userId: string, points: number, visitId: string): Promise<void> {
  try {
    // Award points directly via Firestore
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      points: increment(points)
    });

    // Mark as claimed
    await updateDoc(doc(db, VISIT_COLLECTION, visitId), {
      pointsClaimed: true,
      claimedAt: new Date().toISOString()
    });

    console.log('[Shopify Visit] Points awarded:', { userId, points, visitId });
  } catch (error) {
    console.error('Error awarding visit points:', error);
  }
}

/**
 * Get visit history for a business
 */
export async function getBusinessVisits(
  businessId: string,
  limitCount: number = 50
): Promise<ShopifyVisit[]> {
  try {
    const visitsQuery = query(
      collection(db, VISIT_COLLECTION),
      where('businessId', '==', businessId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(visitsQuery);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ShopifyVisit[];
  } catch (error) {
    console.error('Error getting business visits:', error);
    return [];
  }
}

/**
 * Get visit statistics for a business
 */
export async function getBusinessVisitStats(businessId: string): Promise<VisitStats> {
  try {
    const visitsQuery = query(
      collection(db, VISIT_COLLECTION),
      where('businessId', '==', businessId)
    );

    const snapshot = await getDocs(visitsQuery);
    const visits = snapshot.docs.map(doc => doc.data() as ShopifyVisit);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const uniqueVisitors = new Set(visits.map(v => v.userId)).size;
    const verifiedVisits = visits.filter(v => v.verified);
    const totalDuration = verifiedVisits.reduce((sum, v) => sum + (v.duration || 0), 0);
    const averageDuration = verifiedVisits.length > 0 ? totalDuration / verifiedVisits.length : 0;

    const todayVisits = visits.filter(v => new Date(v.timestamp) >= todayStart).length;
    const weekVisits = visits.filter(v => new Date(v.timestamp) >= weekStart).length;
    const monthVisits = visits.filter(v => new Date(v.timestamp) >= monthStart).length;

    const totalPointsAwarded = visits.reduce((sum, v) => sum + v.pointsAwarded, 0);
    const conversionRate = visits.length > 0 
      ? (verifiedVisits.length / visits.length) * 100 
      : 0;

    return {
      totalVisits: visits.length,
      uniqueVisitors,
      averageDuration,
      verifiedVisits: verifiedVisits.length,
      conversionRate,
      totalPointsAwarded,
      todayVisits,
      weekVisits,
      monthVisits
    };
  } catch (error) {
    console.error('Error getting visit stats:', error);
    return {
      totalVisits: 0,
      uniqueVisitors: 0,
      averageDuration: 0,
      verifiedVisits: 0,
      conversionRate: 0,
      totalPointsAwarded: 0,
      todayVisits: 0,
      weekVisits: 0,
      monthVisits: 0
    };
  }
}

/**
 * Get user's visit history
 */
export async function getUserVisits(userId: string): Promise<ShopifyVisit[]> {
  try {
    const visitsQuery = query(
      collection(db, VISIT_COLLECTION),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const snapshot = await getDocs(visitsQuery);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ShopifyVisit[];
  } catch (error) {
    console.error('Error getting user visits:', error);
    return [];
  }
}

/**
 * Check if user has already visited a store today
 */
export async function hasVisitedToday(userId: string, businessId: string): Promise<boolean> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const visitsQuery = query(
      collection(db, VISIT_COLLECTION),
      where('userId', '==', userId),
      where('businessId', '==', businessId),
      where('timestamp', '>=', today.toISOString())
    );

    const snapshot = await getDocs(visitsQuery);
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking visit status:', error);
    return false;
  }
}

/**
 * Format duration for display
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return `${hours}h ${remainingMinutes}m`;
}
