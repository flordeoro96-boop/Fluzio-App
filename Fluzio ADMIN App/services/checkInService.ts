/**
 * Check-In Service
 * Handles QR code generation and scanning for business check-ins
 */

import { trackEvent } from './trackingService';

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

    // Track the check-in event
    const result = await trackEvent({
      userId,
      businessId,
      eventType: 'CHECK_IN',
      metadata: {}
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }

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
 * Process a GPS-based check-in
 */
export async function processGPSCheckIn(
  userId: string,
  businessId: string,
  userLat: number,
  userLon: number,
  businessLat: number,
  businessLon: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if user is within 100 meters
    const isNearby = checkProximity(userLat, userLon, businessLat, businessLon, 100);

    if (!isNearby) {
      return { 
        success: false, 
        error: 'You must be within 100 meters of the business to check in' 
      };
    }

    // Track the check-in event
    const result = await trackEvent({
      userId,
      businessId,
      eventType: 'CHECK_IN',
      metadata: {} as any
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    return { success: true };
  } catch (error) {
    console.error('[checkInService] Error processing GPS check-in:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
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
