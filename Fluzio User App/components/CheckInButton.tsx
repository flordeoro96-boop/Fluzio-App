/**
 * CheckInButton Component
 * 
 * Displays a check-in button with geofence validation.
 * Shows distance, handles GPS permissions, and displays rewards.
 */

import React, { useState } from 'react';
import { MapPin, Award, AlertCircle, Loader } from 'lucide-react';
import { processGPSCheckIn, getUserLocation } from '../services/checkInService';
import { User } from '../types';

interface CheckInButtonProps {
  business: {
    id: string;
    name: string;
    geo?: {
      latitude: number;
      longitude: number;
    };
  };
  currentUser: User;
  onSuccess?: (points: number, distance: number) => void;
  onError?: (error: string) => void;
}

export const CheckInButton: React.FC<CheckInButtonProps> = ({
  business,
  currentUser,
  onSuccess,
  onError
}) => {
  const [loading, setLoading] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleCheckIn = async () => {
    if (!business.geo) {
      const errorMsg = 'Business location not available';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Get user's current location
      const location = await getUserLocation();
      
      // Calculate distance first to show user
      const R = 6371000;
      const φ1 = location.lat * Math.PI / 180;
      const φ2 = business.geo.latitude * Math.PI / 180;
      const Δφ = (business.geo.latitude - location.lat) * Math.PI / 180;
      const Δλ = (business.geo.longitude - location.lon) * Math.PI / 180;
      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const calculatedDistance = Math.round(R * c);
      
      setDistance(calculatedDistance);

      // Attempt check-in
      const result = await processGPSCheckIn({
        userId: currentUser.id,
        userName: currentUser.name,
        userAvatar: currentUser.avatarUrl,
        userLevel: currentUser.level,
        businessId: business.id,
        businessName: business.name,
        userLat: location.lat,
        userLon: location.lon,
        businessLat: business.geo.latitude,
        businessLon: business.geo.longitude,
        accuracy: 20 // Default accuracy
      });

      if (result.success && result.checkIn) {
        setSuccess(true);
        setDistance(result.distance || calculatedDistance);
        onSuccess?.(result.checkIn.pointsEarned, result.distance || calculatedDistance);
        
        // Auto-hide success message after 5 seconds
        setTimeout(() => setSuccess(false), 5000);
      } else {
        const errorMsg = result.error || 'Check-in failed';
        setError(errorMsg);
        onError?.(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to get your location';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="check-in-success">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <Award className="text-green-600 flex-shrink-0 mt-0.5" size={24} />
            <div className="flex-1">
              <h4 className="font-semibold text-green-900 mb-1">
                ✅ Checked in successfully!
              </h4>
              <p className="text-sm text-green-700">
                You earned <strong>+10 points</strong>
              </p>
              {distance !== null && (
                <p className="text-xs text-green-600 mt-1">
                  Distance: {distance}m from business
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="check-in-button-container">
      <button
        onClick={handleCheckIn}
        disabled={loading}
        className="check-in-button w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
      >
        {loading ? (
          <>
            <Loader className="animate-spin" size={20} />
            <span>Checking location...</span>
          </>
        ) : (
          <>
            <MapPin size={20} />
            <span>Check In Here</span>
          </>
        )}
      </button>

      {distance !== null && !error && !success && (
        <p className="text-sm text-gray-600 mt-2 text-center">
          📍 You are <strong>{distance}m</strong> away
        </p>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
            <div className="flex-1">
              <p className="text-sm text-red-700">{error}</p>
              {error.includes('100m') && distance && (
                <p className="text-xs text-red-600 mt-1">
                  Current distance: {distance}m
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="check-in-info mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600">
          💡 <strong>Tip:</strong> You must be within 100 meters of this business to check in and earn points.
        </p>
      </div>
    </div>
  );
};
