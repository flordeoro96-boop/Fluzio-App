import React, { useState, useEffect } from 'react';
import { X, Heart, MessageCircle, MapPin, Star, Award, Calendar, Share2, Flag, Building2, ExternalLink, Phone, Mail, Globe, ShoppingBag, Bookmark } from 'lucide-react';
import * as businessService from '../services/businessService';
import * as userService from '../services/userService';
import { trackCheckIn, trackFollow, trackFavorite, trackMessage } from '../services/customerTrackingService';

interface BusinessProfileViewProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
  currentUserId: string;
  onMessage?: (businessId: string) => void;
}

export const BusinessProfileView: React.FC<BusinessProfileViewProps> = ({
  isOpen,
  onClose,
  businessId,
  currentUserId,
  onMessage
}) => {
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(false);

  useEffect(() => {
    if (isOpen && businessId) {
      loadBusinessProfile();
    }
  }, [isOpen, businessId]);

  const loadBusinessProfile = async () => {
    try {
      setLoading(true);
      
      // Load business details
      const businessDetails = await userService.getUserById(businessId);
      if (!businessDetails) {
        console.error('Business not found:', businessId);
        onClose();
        return;
      }
      setBusiness(businessDetails);

      // Check if already following
      const following = await businessService.isFollowingBusiness(currentUserId, businessId);
      setIsFollowing(following);
    } catch (error) {
      console.error('Error loading business profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (followingLoading) return;

    try {
      setFollowingLoading(true);
      
      if (isFollowing) {
        const result = await businessService.unfollowBusiness(currentUserId, businessId);
        if (result.success) {
          setIsFollowing(false);
          await trackFollow(currentUserId, businessId, false);
        } else {
          alert(result.error || 'Failed to unfollow business');
        }
      } else {
        const result = await businessService.followBusiness(currentUserId, businessId);
        if (result.success) {
          setIsFollowing(true);
          await trackFollow(currentUserId, businessId, true);
        } else {
          alert(result.error || 'Failed to follow business');
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      alert('Failed to update follow status');
    } finally {
      setFollowingLoading(false);
    }
  };

  const handleMessage = () => {
    if (onMessage) {
      trackMessage(currentUserId, businessId);
      onMessage(businessId);
      onClose();
    }
  };

  const handleFavoriteToggle = async () => {
    const newFavoriteState = !isFavorited;
    setIsFavorited(newFavoriteState);
    await trackFavorite(currentUserId, businessId, newFavoriteState);
  };

  const handleVisitShop = () => {
    if (business.website) {
      window.open(business.website, '_blank');
    } else {
      alert('This business hasn\'t added their website yet');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-zoom-in-95 relative z-[10000]">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading business...</p>
          </div>
        ) : business ? (
          <>
            {/* Header with Cover */}
            <div className="relative">
              <div className="h-32 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600"></div>
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition"
              >
                <X className="w-6 h-6 text-white" />
              </button>
              
              {/* Profile Picture */}
              <div className="absolute -bottom-16 left-6">
                <div className="w-32 h-32 rounded-full border-4 border-white bg-white shadow-lg overflow-hidden">
                  {business.photoUrl ? (
                    <img 
                      src={business.photoUrl} 
                      alt={business.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                      <Building2 className="w-16 h-16 text-white" />
                    </div>
                  )}
                </div>
                {business.category && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                      {business.category}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Content */}
            <div className="pt-20 px-6 pb-6">
              {/* Name and Location */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{business.name}</h2>
                {business.city && (
                  <p className="text-gray-600 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {business.city}
                  </p>
                )}
                {business.tagline && (
                  <p className="text-gray-700 mt-2 italic">{business.tagline}</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  onClick={handleFollowToggle}
                  disabled={followingLoading}
                  className={`rounded-lg py-3 font-semibold transition flex items-center justify-center gap-2 ${
                    isFollowing
                      ? 'bg-pink-100 text-pink-700 hover:bg-pink-200'
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isFollowing ? 'fill-current' : ''}`} />
                  {followingLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
                </button>

                {(business.businessMode === 'ONLINE' || business.businessMode === 'HYBRID') && (
                  <button
                    onClick={handleVisitShop}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg py-3 font-semibold hover:shadow-lg transition flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    Visit Shop
                  </button>
                )}

                {onMessage && (
                  <button
                    onClick={handleMessage}
                    className="bg-white border-2 border-gray-300 text-gray-700 rounded-lg py-3 font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Message
                  </button>
                )}

                <button
                  onClick={handleFavoriteToggle}
                  className={`rounded-lg py-3 font-semibold transition flex items-center justify-center gap-2 ${
                    isFavorited
                      ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                      : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Bookmark className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
                  {isFavorited ? 'Saved' : 'Save'}
                </button>
              </div>

              {/* Share Button (Full Width) */}
              <button 
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: business.name,
                      text: `Check out ${business.name} on Fluzio!`,
                      url: window.location.href
                    });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Link copied to clipboard!');
                  }
                }}
                className="w-full bg-white border-2 border-gray-300 text-gray-700 rounded-lg py-2.5 font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-2 mb-6"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                {business.rating && (
                  <div className="text-center">
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Star className="w-6 h-6 text-yellow-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{business.rating.toFixed(1)}</p>
                    <p className="text-xs text-gray-600">Rating</p>
                  </div>
                )}
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Award className="w-6 h-6 text-purple-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{business.collabsCompleted || 0}</p>
                  <p className="text-xs text-gray-600">Collabs</p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Heart className="w-6 h-6 text-pink-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{business.creatorFavorites || 0}</p>
                  <p className="text-xs text-gray-600">Followers</p>
                </div>
                
                {business.yearFounded && (
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Calendar className="w-6 h-6 text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{business.yearFounded}</p>
                    <p className="text-xs text-gray-600">Founded</p>
                  </div>
                )}
              </div>

              {/* Bio/Mission */}
              {(business.bio || business.mission) && (
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  {business.mission && (
                    <div className="mb-3">
                      <h3 className="font-semibold text-gray-900 mb-1">Our Mission</h3>
                      <p className="text-gray-700 leading-relaxed">{business.mission}</p>
                    </div>
                  )}
                  {business.bio && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">About</h3>
                      <p className="text-gray-700 leading-relaxed">{business.bio}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Contact Information */}
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-purple-600" />
                  Contact Information
                </h3>
                <div className="space-y-2">
                  {business.phone && (
                    <a
                      href={`tel:${business.phone}`}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                    >
                      <Phone className="w-5 h-5 text-gray-600" />
                      <span className="text-gray-900">{business.phone}</span>
                    </a>
                  )}
                  {business.email && (
                    <a
                      href={`mailto:${business.email}`}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                    >
                      <Mail className="w-5 h-5 text-gray-600" />
                      <span className="text-gray-900">{business.email}</span>
                    </a>
                  )}
                  {business.website && (
                    <a
                      href={business.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                    >
                      <Globe className="w-5 h-5 text-gray-600" />
                      <span className="text-gray-900 flex-1">{business.website}</span>
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                    </a>
                  )}
                  {business.address && (
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <MapPin className="w-5 h-5 text-gray-600 mt-0.5" />
                      <span className="text-gray-900">{business.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* What We Offer */}
              {business.offers && business.offers.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-lg mb-3">What We Offer Creators</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {business.offers.map((offer: string, index: number) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg text-sm"
                      >
                        <div className="w-1.5 h-1.5 bg-purple-600 rounded-full flex-shrink-0"></div>
                        <span className="text-gray-700">{offer}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Languages */}
              {business.languages && business.languages.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-lg mb-3">Languages</h3>
                  <div className="flex flex-wrap gap-2">
                    {business.languages.map((lang: string, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Vibe Tags */}
              {business.vibeTags && business.vibeTags.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-lg mb-3">Vibe</h3>
                  <div className="flex flex-wrap gap-2">
                    {business.vibeTags.map((tag: string, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Report Button */}
              <div className="mt-6 pt-6 border-t">
                <button className="text-sm text-gray-500 hover:text-red-600 transition flex items-center gap-1 mx-auto">
                  <Flag className="w-4 h-4" />
                  Report Business
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-12 text-center">
            <p className="text-gray-600">Business not found</p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
