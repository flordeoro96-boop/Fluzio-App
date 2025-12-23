import { GeoPoint, User } from '../types';
import { api } from './apiService';

/**
 * Reverse geocoding to get city name from coordinates
 * Uses OpenStreetMap Nominatim API (free, no API key required)
 */
export async function reverseGeocode(latitude: number, longitude: number): Promise<{
  city: string;
  address: string;
  country: string;
  district?: string;
}> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'Fluzio-App/1.0'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Geocoding failed');
    }
    
    const data = await response.json();
    const address = data.address || {};
    
    // Extract city from various possible fields
    const city = address.city || 
                 address.town || 
                 address.village || 
                 address.municipality || 
                 address.county || 
                 'Unknown';
    
    const country = address.country || 'Unknown';
    const district = address.suburb || address.neighbourhood || address.district;
    
    return {
      city,
      address: data.display_name || 'Unknown Address',
      country,
      district
    };
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Reverse geocoding error:', error);
    }
    // Return fallback
    return {
      city: 'Unknown',
      address: 'Unknown Address',
      country: 'Unknown'
    };
  }
}

/**
 * Get current live location with city information
 */
export async function getCurrentLocation(): Promise<GeoPoint | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Geolocation not supported');
      }
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Get city name from coordinates
        const locationInfo = await reverseGeocode(latitude, longitude);
        
        const geoPoint: GeoPoint = {
          latitude,
          longitude,
          address: locationInfo.address,
          city: locationInfo.city,
          district: locationInfo.district
        };
        
        resolve(geoPoint);
      },
      (error) => {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Geolocation error:', error.message);
        }
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // Cache for 5 minutes
      }
    );
  });
}

/**
 * Update user's location in the system
 */
export async function updateUserLocation(userId: string): Promise<GeoPoint | null> {
  const location = await getCurrentLocation();
  
  if (location) {
    // Update user in Firestore
    try {
      await api.updateUser(userId, {
        geo: location,
        homeCity: location.city,
        location: location.city
      });
      
      // Save to localStorage for caching
      localStorage.setItem(`user_location_${userId}`, JSON.stringify(location));
      localStorage.setItem(`user_location_timestamp_${userId}`, Date.now().toString());
    } catch (error) {
      console.error('[locationService] Failed to update user location:', error);
    }
  }
  
  return location;
}

/**
 * Get cached location if recent, otherwise fetch new
 */
export async function getUserLocation(userId: string, maxAgeMinutes: number = 30): Promise<GeoPoint | null> {
  // Check cache first
  const cachedLocation = localStorage.getItem(`user_location_${userId}`);
  const cachedTimestamp = localStorage.getItem(`user_location_timestamp_${userId}`);
  
  if (cachedLocation && cachedTimestamp) {
    const age = Date.now() - parseInt(cachedTimestamp);
    const maxAge = maxAgeMinutes * 60 * 1000;
    
    if (age < maxAge) {
      return JSON.parse(cachedLocation);
    }
  }
  
  // Fetch fresh location
  return await updateUserLocation(userId);
}

/**
 * Watch user location for continuous updates
 */
export function watchUserLocation(
  userId: string,
  onUpdate: (location: GeoPoint) => void,
  onError?: (error: string) => void
): number | null {
  if (!navigator.geolocation) {
    onError?.('Geolocation not supported');
    return null;
  }

  return navigator.geolocation.watchPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      const locationInfo = await reverseGeocode(latitude, longitude);
      
      const geoPoint: GeoPoint = {
        latitude,
        longitude,
        address: locationInfo.address,
        city: locationInfo.city,
        district: locationInfo.district
      };
      
      // Update user in Firestore
      try {
        await api.updateUser(userId, {
          geo: geoPoint,
          homeCity: geoPoint.city,
          location: geoPoint.city
        });
        
        // Save to localStorage
        localStorage.setItem(`user_location_${userId}`, JSON.stringify(geoPoint));
        localStorage.setItem(`user_location_timestamp_${userId}`, Date.now().toString());
        
        onUpdate(geoPoint);
      } catch (error) {
        console.error('[locationService] Failed to update watched location:', error);
      }
    },
    (error) => {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Watch position error:', error.message);
      }
      onError?.(error.message);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000
    }
  );
}

/**
 * Stop watching user location
 */
export function stopWatchingLocation(watchId: number): void {
  navigator.geolocation.clearWatch(watchId);
}

/**
 * Request location permission
 */
export async function requestLocationPermission(): Promise<boolean> {
  try {
    const result = await navigator.permissions.query({ name: 'geolocation' });
    return result.state === 'granted';
  } catch {
    // Fallback: try to get location directly
    const location = await getCurrentLocation();
    return location !== null;
  }
}

/**
 * Calculate distance between two points in kilometers using Haversine formula
 */
export function calculateDistance(point1: GeoPoint, point2: GeoPoint): number {
  const R = 6371; // Earth's radius in km
  const φ1 = point1.latitude * Math.PI / 180;
  const φ2 = point2.latitude * Math.PI / 180;
  const Δφ = (point2.latitude - point1.latitude) * Math.PI / 180;
  const Δλ = (point2.longitude - point1.longitude) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Format distance for display
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
}

/**
 * Estimate walk time in minutes
 */
export function estimateWalkTime(km: number): number {
  const speedKmPerHour = 5; // Average walking speed
  return Math.ceil((km / speedKmPerHour) * 60);
}
