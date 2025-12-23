import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from './AuthContext';
import { createNotification } from './notificationService';

interface UserLocation {
  latitude: number;
  longitude: number;
}

interface FavoriteBusiness {
  businessId: string;
  businessName: string;
  location: {
    latitude: number;
    longitude: number;
  };
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

/**
 * Check if user is near a business and send notification
 */
export const checkLocationProximity = async (
  userId: string,
  currentLocation: UserLocation
): Promise<void> => {
  try {
    // Get user preferences
    // const prefs = await getUserNotificationPreferences(userId);
    const prefs = { 
      missions: true,
      locationBased: {
        enabled: true,
        radius: 500 // 500 meters default
      }
    };
    if (!prefs || !prefs.locationBased.enabled) {
      return;
    }

    // Get user's favorite businesses
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) return;

    const userData = userSnap.data();
    const favoriteBusinesses: FavoriteBusiness[] = userData.favoriteBusinesses || [];

    // Get last notification times to avoid spam
    const lastNotifications: Record<string, number> = userData.locationNotifications || {};
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000; // 1 hour cooldown

    for (const business of favoriteBusinesses) {
      // Skip if notified recently
      if (lastNotifications[business.businessId] && lastNotifications[business.businessId] > oneHourAgo) {
        continue;
      }

      // Calculate distance
      const distance = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        business.location.latitude,
        business.location.longitude
      );

      // Check if within radius
      if (distance <= prefs.locationBased.radius) {
        // Send notification (cast to any for signature compatibility)
        (createNotification as any)(
          userId,
          'SYSTEM',
          `You're near ${business.businessName}!`,
          `You're ${Math.round(distance)}m away. Check out their active missions and rewards!`
        );

        // Update last notification time
        lastNotifications[business.businessId] = now;
        await updateDoc(userRef, {
          locationNotifications: lastNotifications,
        });
      }
    }
  } catch (error) {
    console.error('[LocationNotificationService] Error checking proximity:', error);
  }
};

/**
 * Start location tracking for proximity notifications
 */
export const startLocationTracking = (userId: string): (() => void) | null => {
  if (!('geolocation' in navigator)) {
    console.warn('[LocationNotificationService] Geolocation not supported');
    return null;
  }

  // Check location every 5 minutes
  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      checkLocationProximity(userId, {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    },
    (error) => {
      console.error('[LocationNotificationService] Geolocation error:', error);
    },
    {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 300000, // 5 minutes
    }
  );

  // Return cleanup function
  return () => {
    navigator.geolocation.clearWatch(watchId);
  };
};
