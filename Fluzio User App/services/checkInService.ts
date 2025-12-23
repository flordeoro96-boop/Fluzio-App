/**
 * Check-In Service
 * Handles QR code and GPS-based check-ins with geofence validation
 * Rewards both customers and businesses for successful check-ins
 */

import { trackEvent } from './trackingService';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  increment
} from 'firebase/firestore';
import { db } from './AuthContext';
import { CheckIn } from '../types';

// ============================================================================
// CONSTANTS
// ============================================================================

const CHECK_IN_RADIUS_METERS = 100; // Must be within 100m of business
const CUSTOMER_CHECK_IN_POINTS = 10; // Points customer earns per check-in
const BUSINESS_CHECK_IN_POINTS = 5; // Points business earns per check-in
const MAX_CHECK_INS_PER_DAY = 5; // Prevent spam

/**
 * Generate a QR code data URL for a business
 * Uses QR Code API (qr-code-styling or similar)
 */
export function generateBusinessQRCode(businessId: string, businessName: string): string {
  // QR code contains business ID for scanning
  const qrData = JSON.stringify({
    type: 'FLUZIO_CHECK_IN',
    businessId,
    businessName,
    timestamp: Date.now()
  });

  // Use a free QR code API
  const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;
  
  return apiUrl;
}
/**
 * Scan and process a QR code check-in
 */
export async function processQRCheckIn(
  qrData: string,
  userId: string
): Promise<{ success: boolean; businessName?: string; error?: string }> {
  try {
    // Parse QR code data
    let checkInData;
    try {
      checkInData = JSON.parse(qrData);
    } catch {
      return { success: false, error: 'Invalid QR code' };
    }

    if (checkInData.type !== 'FLUZIO_CHECK_IN') {
      return { success: false, error: 'This is not a Fluzio check-in code' };
    }

    const { businessId, businessName } = checkInData;

    // Check mission's verification method (Visit & Check-In mission setting)
    const activationId = `${businessId}_VISIT_CHECKIN`;
    const activationDoc = await getDoc(doc(db, 'missionActivations', activationId));
    
    let verificationMethod: 'QR_ONLY' | 'GPS' | 'BOTH' = 'BOTH'; // Default to both if not set
    
    if (activationDoc.exists()) {
      const activationData = activationDoc.data();
      verificationMethod = activationData.config?.checkInMethod || 'BOTH';
    }
    
    // If mission requires GPS_ONLY, reject QR check-ins (rare case)
    if (verificationMethod === 'GPS') {
      return { 
        success: false,
        error: 'This business requires GPS verification to check in. Please enable location services.'
      };
    }

    // Check daily limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const limitQuery = query(
      collection(db, 'checkIns'),
      where('userId', '==', userId),
      where('businessId', '==', businessId),
      where('timestamp', '>=', today.toISOString())
    );
    
    const limitSnapshot = await getDocs(limitQuery);
    if (limitSnapshot.size >= 1) {
      return {
        success: false,
        error: 'You already checked in to this business today!'
      };
    }

    // Create check-in document
    const checkInDoc = {
      userId,
      businessId,
      businessName,
      timestamp: new Date().toISOString(),
      method: 'QR_SCAN',
      pointsEarned: CUSTOMER_CHECK_IN_POINTS,
      businessPointsEarned: BUSINESS_CHECK_IN_POINTS,
      verified: true
    };
    
    await addDoc(collection(db, 'checkIns'), checkInDoc);
    
    // Award points to customer
    await updateDoc(doc(db, 'users', userId), {
      points: increment(CUSTOMER_CHECK_IN_POINTS)
    });
    
    // Award points to business
    await updateDoc(doc(db, 'users', businessId), {
      points: increment(BUSINESS_CHECK_IN_POINTS)
    });

    // Track the check-in event
    await trackEvent({
      userId,
      businessId,
      eventType: 'CHECK_IN',
      metadata: { method: 'QR_SCAN', pointsEarned: CUSTOMER_CHECK_IN_POINTS } as any
    });

    console.log('[CheckIn] QR check-in successful:', {
      businessName,
      customerPoints: CUSTOMER_CHECK_IN_POINTS,
      businessPoints: BUSINESS_CHECK_IN_POINTS
    });

    return { success: true, businessName };
  } catch (error) {
    console.error('[checkInService] Error processing QR check-in:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Check if user is within proximity of a business location (GPS-based)
 */
export function checkProximity(
  userLat: number,
  userLon: number,
  businessLat: number,
  businessLon: number,
  radiusMeters: number = 100
): boolean {
  // Haversine formula to calculate distance
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (userLat * Math.PI) / 180;
  const φ2 = (businessLat * Math.PI) / 180;
  const Δφ = ((businessLat - userLat) * Math.PI) / 180;
  const Δλ = ((businessLon - userLon) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c; // Distance in meters

  return distance <= radiusMeters;
}

/**
 * Process a GPS-based check-in with rewards
 */
export async function processGPSCheckIn(params: {
  userId: string;
  userName: string;
  userAvatar?: string;
  userLevel: number;
  businessId: string;
  businessName: string;
  userLat: number;
  userLon: number;
  businessLat: number;
  businessLon: number;
  accuracy: number;
}): Promise<{ success: boolean; checkIn?: CheckIn; error?: string; distance?: number }> {
  try {
    // Check mission's verification method (Visit & Check-In mission setting)
    const activationId = `${params.businessId}_VISIT_CHECKIN`;
    const activationDoc = await getDoc(doc(db, 'missionActivations', activationId));
    
    let verificationMethod: 'QR_ONLY' | 'GPS' | 'BOTH' = 'BOTH'; // Default to both if not set
    
    if (activationDoc.exists()) {
      const activationData = activationDoc.data();
      verificationMethod = activationData.config?.checkInMethod || 'BOTH';
    }
    
    // If mission requires QR_ONLY, reject GPS check-ins
    if (verificationMethod === 'QR_ONLY') {
      return { 
        success: false,
        error: 'This business requires QR code scanning to check in. Please scan the QR code displayed at their location.'
      };
    }
    
    // Calculate distance
    const distance = calculateDistance(
      params.userLat, 
      params.userLon, 
      params.businessLat, 
      params.businessLon
    );
    
    // Check if user is within radius (stricter if GPS accuracy is poor)
    const requiredRadius = params.accuracy > 50 
      ? CHECK_IN_RADIUS_METERS / 2 
      : CHECK_IN_RADIUS_METERS;
    
    if (distance > requiredRadius) {
      return { 
        success: false,
        distance,
        error: `You must be within ${requiredRadius}m of the business. You are ${Math.round(distance)}m away.`
      };
    }

    // Check daily limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const limitQuery = query(
      collection(db, 'checkIns'),
      where('userId', '==', params.userId),
      where('timestamp', '>=', today.toISOString())
    );
    
    const limitSnapshot = await getDocs(limitQuery);
    if (limitSnapshot.size >= MAX_CHECK_INS_PER_DAY) {
      return {
        success: false,
        error: `You've reached the daily check-in limit of ${MAX_CHECK_INS_PER_DAY}. Try again tomorrow!`
      };
    }

    // Create check-in document
    const checkInData = {
      userId: params.userId,
      userName: params.userName,
      userAvatar: params.userAvatar || '',
      userLevel: params.userLevel,
      businessId: params.businessId,
      businessName: params.businessName,
      location: {
        latitude: params.userLat,
        longitude: params.userLon,
        accuracy: params.accuracy
      },
      distance: Math.round(distance),
      timestamp: new Date().toISOString(),
      pointsEarned: CUSTOMER_CHECK_IN_POINTS,
      businessPointsEarned: BUSINESS_CHECK_IN_POINTS,
      verified: true
    };
    
    const docRef = await addDoc(collection(db, 'checkIns'), checkInData);
    
    // Award points to customer
    await updateDoc(doc(db, 'users', params.userId), {
      points: increment(CUSTOMER_CHECK_IN_POINTS)
    });
    
    // Award points to business
    await updateDoc(doc(db, 'users', params.businessId), {
      points: increment(BUSINESS_CHECK_IN_POINTS)
    });
    
    // Track event
    await trackEvent({
      userId: params.userId,
      businessId: params.businessId,
      eventType: 'CHECK_IN',
      metadata: { distance, pointsEarned: CUSTOMER_CHECK_IN_POINTS } as any
    });

    console.log('[CheckIn] Success:', {
      checkInId: docRef.id,
      distance: Math.round(distance),
      customerPoints: CUSTOMER_CHECK_IN_POINTS,
      businessPoints: BUSINESS_CHECK_IN_POINTS
    });

    return {
      success: true,
      distance,
      checkIn: {
        id: docRef.id,
        ...checkInData
      }
    };
  } catch (error) {
    console.error('[checkInService] Error processing GPS check-in:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to check in'
    };
  }
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
}

/**
 * Get recent check-ins for a business
 */
export async function getBusinessCheckIns(
  businessId: string,
  limitCount: number = 50
): Promise<CheckIn[]> {
  try {
    const q = query(
      collection(db, 'checkIns'),
      where('businessId', '==', businessId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as CheckIn[];
    
  } catch (error) {
    console.error('[CheckIn] Error fetching business check-ins:', error);
    return [];
  }
}

/**
 * Get check-in stats for a business
 */
export async function getBusinessCheckInStats(businessId: string): Promise<{
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  uniqueCustomers: number;
}> {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const q = query(
      collection(db, 'checkIns'),
      where('businessId', '==', businessId),
      orderBy('timestamp', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const checkIns = snapshot.docs.map(doc => doc.data());
    
    const uniqueUsers = new Set(checkIns.map((c: any) => c.userId));
    
    return {
      total: checkIns.length,
      today: checkIns.filter((c: any) => new Date(c.timestamp) >= todayStart).length,
      thisWeek: checkIns.filter((c: any) => new Date(c.timestamp) >= weekStart).length,
      thisMonth: checkIns.filter((c: any) => new Date(c.timestamp) >= monthStart).length,
      uniqueCustomers: uniqueUsers.size
    };
    
  } catch (error) {
    console.error('[CheckIn] Error calculating stats:', error);
    return { total: 0, today: 0, thisWeek: 0, thisMonth: 0, uniqueCustomers: 0 };
  }
}

/**
 * Request user's current location
 */
export function getUserLocation(): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        });
      },
      (error) => {
        reject(new Error(`Location error: ${error.message}`));
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  });
}
