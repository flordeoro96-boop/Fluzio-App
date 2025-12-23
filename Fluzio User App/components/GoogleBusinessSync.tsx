/**
 * Google Business Profile Sync Component
 * Allows businesses to sync their verified Google Business Profile data
 */

import React, { useState, useEffect } from 'react';
import { X, RefreshCw, CheckCircle, AlertCircle, Building2, MapPin, Phone, Globe, Star, Image, Clock, Award } from 'lucide-react';
import { googleBusinessService, SyncedGoogleData } from '../services/googleBusinessService';
import { socialAuthService } from '../services/socialAuthService';
import { useAuth } from '../services/AuthContext';

interface GoogleBusinessSyncProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  onSyncComplete?: (data: SyncedGoogleData) => void;
}

export const GoogleBusinessSync: React.FC<GoogleBusinessSyncProps> = ({
  isOpen,
  onClose,
  currentUserId,
  onSyncComplete
}) => {
  const { userProfile } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const [linking, setLinking] = useState(false);
  const [syncedData, setSyncedData] = useState<SyncedGoogleData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLinked, setIsLinked] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualPlaceId, setManualPlaceId] = useState('');
  const [savingManual, setSavingManual] = useState(false);

  // Check if Google is already connected when modal opens
  useEffect(() => {
    if (isOpen && userProfile?.socialAccounts?.google?.connected) {
      console.log('[GoogleSync] ✅ Google already connected, setting isLinked to true');
      setIsLinked(true);
    }
  }, [isOpen, userProfile]);

  if (!isOpen) return null;

  const handleLinkGoogle = async () => {
    setLinking(true);
    setError(null);

    try {
      const result = await socialAuthService.linkGoogle();
      
      if (!result.success) {
        setError(result.error || 'Failed to link Google account');
        return;
      }

      setIsLinked(true);
      console.log('[GoogleSync] Google account linked successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to link Google account');
      console.error('[GoogleSync] Link error:', err);
    } finally {
      setLinking(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setError(null);

    try {
      const data = await googleBusinessService.syncToProfile(currentUserId);
      setSyncedData(data);
      onSyncComplete?.(data);
      console.log('[GoogleSync] Sync completed:', data);
    } catch (err: any) {
      // Check for rate limit error
      if (err.message && err.message.includes('429')) {
        setError('API quota exceeded. You can enter your Place ID manually below instead.');
        setShowManualInput(true);
      } else if (err.message && err.message.includes('403')) {
        setError('Access denied. You can enter your Place ID manually below instead.');
        setShowManualInput(true);
      } else {
        setError(err.message || 'Failed to sync Google Business Profile');
      }
      console.error('[GoogleSync] Sync error:', err);
    } finally {
      setSyncing(false);
    }
  };

  const handleManualSave = async () => {
    if (!manualPlaceId.trim()) {
      setError('Please enter a valid Place ID');
      return;
    }

    setSavingManual(true);
    setError(null);

    try {
      const { api } = await import('../services/apiService');
      await api.updateUser(currentUserId, {
        googlePlaceId: manualPlaceId.trim()
      });

      setSyncedData({
        googlePlaceId: manualPlaceId.trim(),
        lastGoogleSync: new Date().toISOString()
      } as SyncedGoogleData);

      onSyncComplete?.({
        googlePlaceId: manualPlaceId.trim(),
        lastGoogleSync: new Date().toISOString()
      } as SyncedGoogleData);

      console.log('[GoogleSync] Manual Place ID saved:', manualPlaceId);
    } catch (err: any) {
      setError(err.message || 'Failed to save Place ID');
      console.error('[GoogleSync] Save error:', err);
    } finally {
      setSavingManual(false);
    }
  };

  const formatAddress = (address: any) => {
    if (!address) return '';
    const parts = [
      ...(address.addressLines || []),
      address.locality,
      address.administrativeArea,
      address.postalCode,
      address.regionCode
    ].filter(Boolean);
    return parts.join(', ');
  };

  const popularAttributes = syncedData?.googleAttributes 
    ? googleBusinessService.getPopularAttributes(syncedData.googleAttributes)
    : [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Google Business Profile</h2>
              <p className="text-sm text-gray-600">Sync verified business data from Google</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Benefits Section */}
          {!syncedData && (
            <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-600" />
                What You'll Get
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Verified address & contact info</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Opening hours & holiday hours</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Google Maps integration</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Official trust badges</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Business photos</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Real Google ratings & reviews</span>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">Sync Failed</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Manual Place ID Input */}
          {showManualInput && !syncedData && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-start gap-3 mb-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">Enter Your Google Place ID</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Find your Place ID by searching for your business on{' '}
                    <a 
                      href="https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-blue-800"
                    >
                      Google's Place ID Finder
                    </a>
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                <input
                  type="text"
                  value={manualPlaceId}
                  onChange={(e) => setManualPlaceId(e.target.value)}
                  placeholder="ChIJ..."
                  className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                
                <button
                  onClick={handleManualSave}
                  disabled={savingManual || !manualPlaceId.trim()}
                  className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {savingManual ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Save Place ID
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Link Google Account */}
          {!isLinked && !syncedData && (
            <button
              onClick={handleLinkGoogle}
              disabled={linking}
              className="w-full py-3 px-4 bg-white border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mb-4"
            >
              {linking ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Connect Google Account
                </>
              )}
            </button>
          )}

          {/* Sync Button */}
          {(isLinked || syncedData) && (
            <button
              onClick={handleSync}
              disabled={syncing}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-6"
            >
              {syncing ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  {syncedData ? 'Sync Again' : 'Sync Google Business Profile'}
                </>
              )}
            </button>
          )}

          {/* Synced Data Preview */}
          {syncedData && (
            <div className="space-y-4">
              {/* Success Banner */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-green-900">Successfully Synced!</p>
                  <p className="text-sm text-green-700 mt-1">
                    Your Google Business Profile data has been imported to Fluzio
                  </p>
                </div>
              </div>

              {/* Business Name */}
              {syncedData.googleBusinessName && (
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-1">
                    <Building2 className="w-4 h-4" />
                    Business Name
                  </div>
                  <p className="text-gray-900 font-semibold">{syncedData.googleBusinessName}</p>
                </div>
              )}

              {/* Address */}
              {syncedData.address && (
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-1">
                    <MapPin className="w-4 h-4" />
                    Address
                  </div>
                  <p className="text-gray-900">{formatAddress(syncedData.address)}</p>
                  {syncedData.googleMapsLink && (
                    <a 
                      href={syncedData.googleMapsLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-700 mt-1 inline-block"
                    >
                      View on Google Maps →
                    </a>
                  )}
                </div>
              )}

              {/* Contact */}
              <div className="grid grid-cols-2 gap-4">
                {syncedData.phone && (
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-1">
                      <Phone className="w-4 h-4" />
                      Phone
                    </div>
                    <p className="text-gray-900">{syncedData.phone}</p>
                  </div>
                )}
                {syncedData.website && (
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-1">
                      <Globe className="w-4 h-4" />
                      Website
                    </div>
                    <a 
                      href={syncedData.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 truncate block"
                    >
                      {syncedData.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
              </div>

              {/* Rating */}
              {syncedData.rating && (
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-1">
                    <Star className="w-4 h-4" />
                    Google Rating
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-gray-900">{syncedData.rating.toFixed(1)}</span>
                    <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                    {syncedData.reviewCount && (
                      <span className="text-sm text-gray-600">({syncedData.reviewCount} reviews)</span>
                    )}
                  </div>
                </div>
              )}

              {/* Attributes (Badges) */}
              {popularAttributes.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
                    <Award className="w-4 h-4" />
                    Official Google Badges
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {popularAttributes.map((attr, idx) => (
                      <span 
                        key={idx}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium flex items-center gap-1"
                      >
                        <CheckCircle className="w-3 h-3" />
                        {attr}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Photos */}
              {syncedData.googlePhotos && syncedData.googlePhotos.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
                    <Image className="w-4 h-4" />
                    Photos ({syncedData.googlePhotos.length})
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {syncedData.googlePhotos.slice(0, 6).map((photo, idx) => (
                      <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                        <img 
                          src={photo.url} 
                          alt={photo.description || 'Business photo'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                  {syncedData.googlePhotos.length > 6 && (
                    <p className="text-sm text-gray-600 mt-2">
                      +{syncedData.googlePhotos.length - 6} more photos
                    </p>
                  )}
                </div>
              )}

              {/* Opening Hours */}
              {syncedData.openingHours?.periods && syncedData.openingHours.periods.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
                    <Clock className="w-4 h-4" />
                    Opening Hours
                  </div>
                  <div className="space-y-1 text-sm">
                    {syncedData.openingHours.periods.slice(0, 3).map((period, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span className="text-gray-600">{period.openDay}</span>
                        <span className="text-gray-900">
                          {period.openTime} - {period.closeTime}
                        </span>
                      </div>
                    ))}
                    {syncedData.openingHours.periods.length > 3 && (
                      <p className="text-gray-500 italic">+{syncedData.openingHours.periods.length - 3} more days</p>
                    )}
                  </div>
                </div>
              )}

              {/* Last Sync */}
              {syncedData.lastGoogleSync && (
                <p className="text-xs text-gray-500 text-center pt-4">
                  Last synced: {new Date(syncedData.lastGoogleSync).toLocaleString()}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
