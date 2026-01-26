import { getCurrentLocation } from './locationService';
import { getUsersByRole, SearchableUser } from './userService';
import { doc, getDoc } from '../services/firestoreCompat';
import { db } from './apiService';

/**
 * Geofencing Service - Background Location Tracking
 * Checks user location every 5 minutes and sends notifications for nearby businesses
 * Only runs when user has enabled location tracking in settings
 */

interface GeofenceCheck {
  businessId: string;
  businessName: string;
  distance: number;
  category?: string;
}

interface GeofencingState {
  isActive: boolean;
  intervalId: number | null;
  lastKnownLocation: { latitude: number; longitude: number } | null;
  lastCheckTime: Date | null;
  notifiedBusinesses: Set<string>; // Track which businesses we've notified about recently
}

const state: GeofencingState = {
  isActive: false,
  intervalId: null,
  lastKnownLocation: null,
  lastCheckTime: null,
  notifiedBusinesses: new Set()
};

const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const GEOFENCE_RADIUS_METERS = 250;
const NOTIFICATION_COOLDOWN_MS = 2 * 60 * 60 * 1000; // Don't notify about same business for 2 hours

/**
 * Calculate distance between two points in meters using Haversine formula
 */
function calculateDistanceInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Check if user has recently checked in at this business
 */
async function hasRecentCheckIn(userId: string, businessId: string): Promise<boolean> {
  try {
    const interactionRef = doc(db, 'customerInteractions', `${userId}_${businessId}`);
    const interactionDoc = await getDoc(interactionRef);

    if (!interactionDoc.exists()) {
      return false;
    }

    const data = interactionDoc.data();
    const lastCheckIn = data.lastCheckIn?.toDate?.() || new Date(data.lastCheckIn);
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    // Don't notify if checked in within last 30 minutes
    return lastCheckIn > thirtyMinutesAgo;
  } catch (error) {
    console.error('[Geofencing] Error checking recent check-in:', error);
    return false;
  }
}

/**
 * Find nearby businesses within geofence radius
 */
async function findNearbyBusinesses(
  userId: string,
  userLat: number,
  userLng: number
): Promise<GeofenceCheck[]> {
  try {
    // Get all businesses (cached or fresh)
    const businesses = await getUsersByRole('BUSINESS', userId, 500);

    // Filter to physical/hybrid businesses with geo location
    const physicalBusinesses = businesses.filter(
      b => b.geo && (b.businessMode === 'PHYSICAL' || b.businessMode === 'HYBRID')
    );

    const nearbyBusinesses: GeofenceCheck[] = [];

    for (const business of physicalBusinesses) {
      if (!business.geo) continue;

      const distance = calculateDistanceInMeters(
        userLat,
        userLng,
        business.geo.latitude,
        business.geo.longitude
      );

      // Within geofence radius
      if (distance <= GEOFENCE_RADIUS_METERS) {
        // Check if we should notify about this business
        const recentlyNotified = state.notifiedBusinesses.has(business.id);
        const hasRecentCheckInResult = await hasRecentCheckIn(userId, business.id);

        if (!recentlyNotified && !hasRecentCheckInResult) {
          nearbyBusinesses.push({
            businessId: business.id,
            businessName: business.name,
            distance: Math.round(distance),
            category: business.category
          });

          // Mark as notified to prevent spam
          state.notifiedBusinesses.add(business.id);

          // Remove from notified set after cooldown period
          setTimeout(() => {
            state.notifiedBusinesses.delete(business.id);
          }, NOTIFICATION_COOLDOWN_MS);
        }
      }
    }

    return nearbyBusinesses;
  } catch (error) {
    console.error('[Geofencing] Error finding nearby businesses:', error);
    return [];
  }
}

/**
 * Send push notification for nearby business
 */
async function sendGeofenceNotification(business: GeofenceCheck): Promise<void> {
  // Check if browser supports notifications
  if (!('Notification' in window)) {
    console.warn('[Geofencing] Browser does not support notifications');
    return;
  }

  // Check permission
  if (Notification.permission !== 'granted') {
    console.warn('[Geofencing] Notification permission not granted');
    return;
  }

  try {
    const notification = new Notification(`📍 You're near ${business.businessName}!`, {
      body: `${business.distance}m away • Check in to earn points`,
      icon: '/fluzio-icon.png',
      badge: '/fluzio-badge.png',
      tag: `geofence-${business.businessId}`, // Prevent duplicate notifications
      requireInteraction: false,
      data: {
        businessId: business.businessId,
        url: `/?action=checkin&businessId=${business.businessId}`
      }
    });

    notification.onclick = function(event) {
      event.preventDefault();
      window.focus();
      notification.close();
      
      // Navigate to business profile or home with check-in prompt
      const data = (event.target as Notification).data;
      if (data?.url) {
        window.location.href = data.url;
      }
    };

    console.log(`[Geofencing] Notification sent for ${business.businessName}`);
  } catch (error) {
    console.error('[Geofencing] Error sending notification:', error);
  }
}

/**
 * Perform a single geofence check
 */
async function performGeofenceCheck(userId: string): Promise<void> {
  try {
    console.log('[Geofencing] Performing check...');

    // Get current location
    const location = await getCurrentLocation();
    if (!location) {
      console.warn('[Geofencing] Could not get current location');
      return;
    }

    state.lastKnownLocation = {
      latitude: location.latitude,
      longitude: location.longitude
    };
    state.lastCheckTime = new Date();

    // Find nearby businesses
    const nearbyBusinesses = await findNearbyBusinesses(
      userId,
      location.latitude,
      location.longitude
    );

    console.log(`[Geofencing] Found ${nearbyBusinesses.length} nearby businesses`);

    // Send notifications for each nearby business
    for (const business of nearbyBusinesses) {
      await sendGeofenceNotification(business);
    }
  } catch (error) {
    console.error('[Geofencing] Error during check:', error);
  }
}

/**
 * Start geofencing for a user
 */
export async function startGeofencing(userId: string): Promise<boolean> {
  try {
    // Don't start if already active
    if (state.isActive) {
      console.log('[Geofencing] Already active');
      return true;
    }

    // Request notification permission if not granted
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('[Geofencing] Notification permission denied');
        return false;
      }
    }

    // Perform initial check immediately
    await performGeofenceCheck(userId);

    // Set up interval for periodic checks
    const intervalId = window.setInterval(() => {
      performGeofenceCheck(userId);
    }, CHECK_INTERVAL_MS);

    state.isActive = true;
    state.intervalId = intervalId;

    console.log('[Geofencing] Started - checking every 5 minutes');
    return true;
  } catch (error) {
    console.error('[Geofencing] Error starting:', error);
    return false;
  }
}

/**
 * Stop geofencing
 */
export function stopGeofencing(): void {
  if (state.intervalId !== null) {
    clearInterval(state.intervalId);
    state.intervalId = null;
  }

  state.isActive = false;
  state.notifiedBusinesses.clear();

  console.log('[Geofencing] Stopped');
}

/**
 * Check if geofencing is currently active
 */
export function isGeofencingActive(): boolean {
  return state.isActive;
}

/**
 * Get geofencing status
 */
export function getGeofencingStatus() {
  return {
    isActive: state.isActive,
    lastCheckTime: state.lastCheckTime,
    lastKnownLocation: state.lastKnownLocation,
    checkIntervalMinutes: CHECK_INTERVAL_MS / 60000,
    geofenceRadiusMeters: GEOFENCE_RADIUS_METERS
  };
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('[Geofencing] Browser does not support notifications');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('[Geofencing] Error requesting permission:', error);
    return 'denied';
  }
}

/**
 * Check if browser supports geofencing
 */
export function isGeofencingSupported(): boolean {
  return (
    'Notification' in window &&
    'geolocation' in navigator &&
    typeof window.setInterval === 'function'
  );
}
