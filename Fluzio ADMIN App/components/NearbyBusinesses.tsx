import React, { useState, useEffect } from 'react';
import { MapPin, Award, CheckCircle, Loader } from 'lucide-react';
import { trackCheckIn } from '../services/customerTrackingService';
import { getUsersByRole, SearchableUser } from '../services/userService';
import { useAuth } from '../services/AuthContext';

interface NearbyBusinessesProps {
  userId: string;
  userLatitude: number;
  userLongitude: number;
  onBusinessClick?: (businessId: string) => void;
}

type BusinessWithDistance = SearchableUser & {
  distance: number;
  canCheckIn: boolean;
};

export const NearbyBusinesses: React.FC<NearbyBusinessesProps> = ({
  userId,
  userLatitude,
  userLongitude,
  onBusinessClick
}) => {
  const { refreshUserProfile } = useAuth();
  const [nearbyBusinesses, setNearbyBusinesses] = useState<BusinessWithDistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState<string | null>(null);

  useEffect(() => {
    loadNearbyBusinesses();
  }, [userLatitude, userLongitude]);

  const loadNearbyBusinesses = async () => {
    try {
      setLoading(true);
      const businesses = await getUsersByRole('BUSINESS', userId, 100);
      
      // Filter to physical/hybrid businesses with geo location
      const physicalBusinesses = businesses.filter(b => 
        b.geo && (b.businessMode === 'PHYSICAL' || b.businessMode === 'HYBRID')
      );

      // Calculate distances and filter to within 250m
      const businessesWithDistance = physicalBusinesses
        .map(business => {
          if (!business.geo) return null;
          
          const distance = calculateDistance(
            userLatitude,
            userLongitude,
            business.geo.latitude,
            business.geo.longitude
          );

          return {
            ...business,
            distance,
            canCheckIn: distance <= 250
          } as BusinessWithDistance;
        })
        .filter((b): b is BusinessWithDistance => b !== null)
        .filter(b => b.distance <= 250)
        .sort((a, b) => a.distance - b.distance);

      setNearbyBusinesses(businessesWithDistance);
    } catch (error) {
      console.error('Error loading nearby businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (business: BusinessWithDistance) => {
    if (!business.geo || checkingIn) return;

    try {
      setCheckingIn(business.id);
      
      const result = await trackCheckIn(
        userId,
        business.id,
        userLatitude,
        userLongitude,
        business.geo.latitude,
        business.geo.longitude
      );

      if (result.success) {
        // Refresh user profile to get updated points
        await refreshUserProfile();
        
        // Show success message with points
        const pointsMessage = result.points ? `\n\n🎁 +${result.points} points earned!` : '';
        alert(`✅ ${result.message}\n\n🎯 Check-in #${result.checkInCount} at ${business.name}${pointsMessage}`);
        
        // Refresh nearby list
        await loadNearbyBusinesses();
      } else {
        alert(`❌ ${result.message}`);
      }
    } catch (error) {
      console.error('Error checking in:', error);
      alert('Error processing check-in');
    } finally {
      setCheckingIn(null);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-center py-8">
          <Loader className="w-6 h-6 animate-spin text-purple-600" />
        </div>
      </div>
    );
  }

  if (nearbyBusinesses.length === 0) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
        <div className="text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <MapPin className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="font-bold text-gray-900 mb-1">No Nearby Businesses</h3>
          <p className="text-sm text-gray-600">
            Move closer to businesses (within 250m) to check in and earn points!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-purple-600" />
          Nearby ({nearbyBusinesses.length})
        </h2>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          Within 250m
        </span>
      </div>

      <div className="space-y-2">
        {nearbyBusinesses.map((business) => (
          <div
            key={business.id}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3">
              {/* Business Image */}
              <div 
                className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer"
                onClick={() => onBusinessClick?.(business.id)}
              >
                <img
                  src={business.photoUrl || `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100&h=100&fit=crop`}
                  alt={business.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100&h=100&fit=crop`;
                  }}
                />
              </div>

              {/* Business Info */}
              <div className="flex-1 min-w-0">
                <h3 
                  className="font-bold text-gray-900 text-sm truncate cursor-pointer hover:text-purple-600"
                  onClick={() => onBusinessClick?.(business.id)}
                >
                  {business.name}
                </h3>
                <div className="flex items-center gap-2 text-xs text-gray-600 mt-0.5">
                  <MapPin className="w-3 h-3" />
                  <span>{Math.round(business.distance)}m away</span>
                  {business.category && (
                    <>
                      <span className="text-gray-300">•</span>
                      <span>{business.category}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Check-in Button */}
              <button
                onClick={() => handleCheckIn(business)}
                disabled={!business.canCheckIn || checkingIn === business.id}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 ${
                  checkingIn === business.id
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : business.canCheckIn
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg active:scale-95'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {checkingIn === business.id ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span className="hidden sm:inline">...</span>
                  </>
                ) : business.canCheckIn ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">Check In</span>
                  </>
                ) : (
                  <>
                    <Award className="w-4 h-4" />
                    <span className="hidden sm:inline">Too Far</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-100">
        <div className="flex items-start gap-2">
          <Award className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-gray-700">
            <p className="font-semibold text-purple-900 mb-1">Earn Points by Checking In!</p>
            <p>1st check-in: <strong>+10 pts</strong> • 5th: <strong>+25 pts</strong> • 10th: <strong>+50 pts</strong></p>
            <p className="text-gray-600 mt-1">Check-ins must be 30+ minutes apart</p>
          </div>
        </div>
      </div>
    </div>
  );
};
