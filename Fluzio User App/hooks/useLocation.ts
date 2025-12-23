import { useState, useEffect } from 'react';
import { GeoPoint } from '../types';
import { getCurrentLocation } from '../services/locationService';

export const useGeolocation = () => {
  const [location, setLocation] = useState<GeoPoint | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchLocation = async () => {
      try {
        const loc = await getCurrentLocation();
        if (mounted) {
          if (loc) {
            setLocation(loc);
          } else {
            setError('Unable to get location');
          }
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Location error');
          setLoading(false);
        }
      }
    };

    fetchLocation();

    return () => {
      mounted = false;
    };
  }, []);

  return { location, error, loading };
};

/**
 * Calculates distance between two points in meters using Haversine formula
 */
export const calculateDistance = (point1: GeoPoint, point2: GeoPoint): number => {
  const R = 6371e3; // metres
  const φ1 = point1.latitude * Math.PI/180; // φ, λ in radians
  const φ2 = point2.latitude * Math.PI/180;
  const Δφ = (point2.latitude-point1.latitude) * Math.PI/180;
  const Δλ = (point2.longitude-point1.longitude) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
};

export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
};

export const estimateWalkTime = (meters: number): number => {
  const speedMetersPerMin = 80; // Average walking speed
  return Math.ceil(meters / speedMetersPerMin);
};