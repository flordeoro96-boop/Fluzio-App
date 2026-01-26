import React, { useState } from 'react';
import { User, SubscriptionLevel } from '../types';
import { MapPin, X, Globe, Clock, Check } from 'lucide-react';
import { db } from '../services/apiService';
import { doc, updateDoc } from '../services/firestoreCompat';

interface LocationChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onLocationChanged?: (newCity: string) => void;
}

const POPULAR_CITIES = [
  { name: 'Barcelona', country: 'Spain', emoji: '🇪🇸' },
  { name: 'Berlin', country: 'Germany', emoji: '🇩🇪' },
  { name: 'Paris', country: 'France', emoji: '🇫🇷' },
  { name: 'London', country: 'UK', emoji: '🇬🇧' },
  { name: 'Amsterdam', country: 'Netherlands', emoji: '🇳🇱' },
  { name: 'Milan', country: 'Italy', emoji: '🇮🇹' },
  { name: 'Lisbon', country: 'Portugal', emoji: '🇵🇹' },
  { name: 'Vienna', country: 'Austria', emoji: '🇦🇹' },
  { name: 'Prague', country: 'Czech Republic', emoji: '🇨🇿' },
  { name: 'Copenhagen', country: 'Denmark', emoji: '🇩🇰' },
  { name: 'Stockholm', country: 'Sweden', emoji: '🇸🇪' },
  { name: 'Dublin', country: 'Ireland', emoji: '🇮🇪' },
];

export const LocationChangeModal: React.FC<LocationChangeModalProps> = ({
  isOpen,
  onClose,
  user,
  onLocationChanged
}) => {
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [customCity, setCustomCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Check if user is Platinum
  const isPlatinum = user.subscriptionLevel === SubscriptionLevel.PLATINUM;

  const handleSetLocation = async () => {
    const cityToSet = selectedCity || customCity;
    if (!cityToSet.trim()) {
      setError('Please select or enter a city');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

      const temporaryLocation = {
        city: cityToSet.trim(),
        setAt: now.toISOString(),
        expiresAt: expiresAt.toISOString()
      };

      await updateDoc(doc(db, 'users', user.id), {
        temporaryLocation
      });

      onLocationChanged?.(cityToSet.trim());
      onClose();
    } catch (err: any) {
      console.error('Error setting temporary location:', err);
      setError(err.message || 'Failed to update location');
    } finally {
      setLoading(false);
    }
  };

  const handleResetLocation = async () => {
    setLoading(true);
    setError(null);

    try {
      await updateDoc(doc(db, 'users', user.id), {
        temporaryLocation: null
      });

      onLocationChanged?.(user.homeCity || '');
      onClose();
    } catch (err: any) {
      console.error('Error resetting location:', err);
      setError(err.message || 'Failed to reset location');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-3xl">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-[#1E0E62]">Explore Other Cities</h2>
              </div>
              <p className="text-sm text-gray-600">
                Discover partnership opportunities in different locations
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Platinum Badge */}
          {isPlatinum && (
            <div className="mt-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 w-fit">
              <span className="text-lg">💎</span>
              <span className="font-bold text-sm">Platinum Feature</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {!isPlatinum ? (
            // Non-Platinum Users
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="w-10 h-10 text-purple-500" />
              </div>
              <h3 className="font-bold text-xl text-[#1E0E62] mb-2">
                Unlock Location Freedom
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Upgrade to Platinum to explore businesses and partnerships in any city worldwide. 
                Perfect for expanding your network beyond your home location.
              </p>
              <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-all">
                Upgrade to Platinum
              </button>
            </div>
          ) : (
            <>
              {/* Current Location */}
              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-purple-700 uppercase mb-1">
                      Current Exploration City
                    </div>
                    <div className="font-bold text-lg text-purple-900">
                      {user.temporaryLocation?.city || user.homeCity || 'Not set'}
                    </div>
                    {user.temporaryLocation && (
                      <div className="flex items-center gap-1 text-xs text-purple-600 mt-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          Expires {new Date(user.temporaryLocation.expiresAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                  {user.temporaryLocation && (
                    <button
                      onClick={handleResetLocation}
                      disabled={loading}
                      className="px-4 py-2 bg-white border border-purple-200 text-purple-700 rounded-xl text-sm font-bold hover:bg-purple-50 transition-colors disabled:opacity-50"
                    >
                      Reset to Home
                    </button>
                  )}
                </div>
              </div>

              {/* Popular Cities */}
              <div className="mb-6">
                <h3 className="font-bold text-sm text-gray-700 uppercase mb-3">
                  Popular Cities
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {POPULAR_CITIES.map((city) => (
                    <button
                      key={city.name}
                      onClick={() => {
                        setSelectedCity(city.name);
                        setCustomCity('');
                      }}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        selectedCity === city.name
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300 bg-white'
                      }`}
                    >
                      <div className="text-2xl mb-1">{city.emoji}</div>
                      <div className="font-bold text-sm text-[#1E0E62]">{city.name}</div>
                      <div className="text-xs text-gray-500">{city.country}</div>
                      {selectedCity === city.name && (
                        <Check className="w-4 h-4 text-purple-600 absolute top-2 right-2" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom City */}
              <div className="mb-6">
                <h3 className="font-bold text-sm text-gray-700 uppercase mb-3">
                  Or Enter Custom City
                </h3>
                <input
                  type="text"
                  value={customCity}
                  onChange={(e) => {
                    setCustomCity(e.target.value);
                    setSelectedCity('');
                  }}
                  placeholder="e.g., Tokyo, New York, Sydney..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors font-medium"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                  <p className="text-sm text-red-600 font-medium">{error}</p>
                </div>
              )}

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <div className="flex gap-3">
                  <div className="text-blue-500 text-xl">ℹ️</div>
                  <div>
                    <div className="font-bold text-sm text-blue-900 mb-1">
                      How it works
                    </div>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li>• Your temporary location lasts for 30 days</li>
                      <li>• You'll see businesses and matches from the selected city</li>
                      <li>• Reset anytime to return to your home city</li>
                      <li>• Perfect for travel planning or exploring new markets</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSetLocation}
                  disabled={loading || (!selectedCity && !customCity)}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Updating...' : 'Set Location'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
