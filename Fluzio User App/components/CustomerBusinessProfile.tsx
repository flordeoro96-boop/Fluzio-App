import React, { useState, useEffect } from 'react';
import {
  X, MapPin, Clock, Heart, Share2, Navigation, Phone, Mail, Globe,
  Star, Award, TrendingUp, Calendar, Users, Gift, Target, Zap,
  ExternalLink, Camera, Instagram, ChevronRight, CheckCircle, Flame,
  Trophy, Medal, Crown, ChevronLeft, Info
} from 'lucide-react';
import { doc, updateDoc, increment, addDoc, collection, Timestamp } from '../services/firestoreCompat';
import { db } from '../services/apiService';
import * as userService from '../services/userService';
import * as businessService from '../services/businessService';
import { getMissionsByBusiness } from '../services/missionService';
import { getBusinessRewards } from '../services/rewardsService';
import { trackCheckIn, trackFollow } from '../services/customerTrackingService';
import { hasUserReviewed, getBusinessReviews, getReviewStats, Review } from '../services/reviewService';
import { ReviewSubmissionModal } from './ReviewSubmissionModal';
import { BusinessReviewInsights } from './BusinessReviewInsights';
import { formatDistanceToNow } from 'date-fns';

interface CustomerBusinessProfileProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
  currentUserId: string;
  currentUserPoints?: number;
  onNavigateToMission?: (missionId: string) => void;
  onNavigateToReward?: (rewardId: string) => void;
  onMessage?: (businessId: string) => void;
}

interface Mission {
  id: string;
  title: string;
  description: string;
  points: number;
  category: string;
  expiresAt?: Date;
  participants?: number;
  imageUrl?: string;
}

interface Reward {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  category: string;
  imageUrl?: string;
  totalAvailable?: number;
  claimed?: number;
}

export const CustomerBusinessProfile: React.FC<CustomerBusinessProfileProps> = ({
  isOpen,
  onClose,
  businessId,
  currentUserId,
  currentUserPoints = 0,
  onNavigateToMission,
  onNavigateToReward,
  onMessage
}) => {
  const [business, setBusiness] = useState<any>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<'missions' | 'rewards' | 'reviews' | 'about' | 'activity'>('missions');
  const [userActivity, setUserActivity] = useState({
    pointsEarned: 0,
    missionsCompleted: 0,
    rewardsRedeemed: 0,
    lastVisit: null as Date | null,
    visitCount: 0,
    tier: 'Bronze' // Bronze, Silver, Gold, VIP
  });
  const [photoIndex, setPhotoIndex] = useState(0);
  const [canCheckIn, setCanCheckIn] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [lastCheckInId, setLastCheckInId] = useState<string | null>(null);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [showInsights, setShowInsights] = useState(false);

  useEffect(() => {
    if (isOpen && businessId) {
      loadBusinessProfile();
      checkDistance();
      checkIfUserReviewed();
    }
  }, [isOpen, businessId]);

  const checkIfUserReviewed = async () => {
    const reviewed = await hasUserReviewed(currentUserId, businessId);
    setHasReviewed(reviewed);
  };

  const loadBusinessProfile = async () => {
    setLoading(true);
    try {
      // Load business details
      const businessDetails = await userService.getUserById(businessId);
      if (!businessDetails) {
        console.error('Business not found:', businessId);
        onClose();
        return;
      }
      setBusiness(businessDetails);

      // Check if following
      const following = await businessService.isFollowingBusiness(currentUserId, businessId);
      setIsFollowing(following);

      // Debug: Log business type info
      console.log('[CustomerBusinessProfile] Business type info:', {
        businessType: businessDetails.businessType,
        subCategory: businessDetails.subCategory,
        category: businessDetails.category
      });

      // Load missions
      const businessMissions = await getMissionsByBusiness(businessId);
      const mappedMissions = businessMissions.map((m: any) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        points: m.points || m.pointsReward || 0,
        category: m.category,
        expiresAt: m.expiresAt,
        participants: m.participants,
        imageUrl: m.imageUrl
      }));
      setMissions(mappedMissions.slice(0, 6)); // Top 6 missions

      // Load rewards
      const businessRewards = await getBusinessRewards(businessId);
      setRewards(businessRewards.slice(0, 6)); // Top 6 rewards

      // Load reviews and stats
      const businessReviews = await getBusinessReviews(businessId);
      setReviews(businessReviews);
      
      const stats = await getReviewStats(businessId);
      setReviewStats(stats);

      // Load user activity (mock for now - replace with real data)
      // TODO: Fetch from Firestore participations and redemptions
      setUserActivity({
        pointsEarned: 450,
        missionsCompleted: 5,
        rewardsRedeemed: 2,
        lastVisit: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        visitCount: 12,
        tier: 'Silver'
      });
    } catch (error) {
      console.error('Error loading business profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkDistance = async () => {
    // TODO: Calculate distance from user's current location
    // For now, mock data
    setDistance(0.8); // 0.8 km away
    setCanCheckIn(true); // Within geofence
  };

  const handleCheckIn = async () => {
    try {
      // Create check-in document
      const checkInData = {
        userId: currentUserId,
        businessId,
        businessName: business.name,
        timestamp: Timestamp.now(),
        location: {
          latitude: business.latitude,
          longitude: business.longitude
        },
        pointsEarned: 10
      };

      const checkInRef = await addDoc(collection(db, 'checkIns'), checkInData);
      setLastCheckInId(checkInRef.id);

      // Award points for check-in
      const userRef = doc(db, 'users', currentUserId);
      await updateDoc(userRef, {
        points: increment(10)
      });

      // Track check-in
      await trackCheckIn(currentUserId, businessId);

      alert('✅ Checked in! +10 points earned');
      setUserActivity(prev => ({
        ...prev,
        pointsEarned: prev.pointsEarned + 10,
        visitCount: prev.visitCount + 1,
        lastVisit: new Date()
      }));

      // Prompt for review if they haven't reviewed yet
      if (!hasReviewed) {
        setTimeout(() => {
          setShowReviewModal(true);
        }, 500);
      }
    } catch (error) {
      console.error('Check-in failed:', error);
      alert('Failed to check in. Please try again.');
    }
  };

  const handleFollowToggle = async () => {
    try {
      if (isFollowing) {
        await businessService.unfollowBusiness(currentUserId, businessId);
        setIsFollowing(false);
      } else {
        await businessService.followBusiness(currentUserId, businessId);
        setIsFollowing(true);
        await trackFollow(currentUserId, businessId, true);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: business.name,
        text: `Check out ${business.name} on Beevvy and earn points!`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied! Share with friends and earn 25 bonus points when they join.');
    }
  };

  const getDirections = () => {
    if (business.latitude && business.longitude) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${business.latitude},${business.longitude}`, '_blank');
    } else if (business.address) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address)}`, '_blank');
    }
  };

  const isOpen24Hours = () => {
    // TODO: Check actual business hours
    return false;
  };

  const getCurrentStatus = () => {
    // TODO: Check if business is currently open
    const now = new Date();
    const hour = now.getHours();
    if (hour >= 9 && hour < 20) {
      return { open: true, text: 'Open Now', closesAt: '8:00 PM' };
    }
    return { open: false, text: 'Closed', opensAt: '9:00 AM' };
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Bronze': return 'from-orange-600 to-orange-800';
      case 'Silver': return 'from-gray-400 to-gray-600';
      case 'Gold': return 'from-yellow-400 to-yellow-600';
      case 'VIP': return 'from-purple-500 to-pink-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'Bronze': return Medal;
      case 'Silver': return Award;
      case 'Gold': return Trophy;
      case 'VIP': return Crown;
      default: return Award;
    }
  };

  if (!isOpen) return null;

  const status = getCurrentStatus();
  const businessPhotos = business?.photos || [business?.photoUrl];
  const TierIcon = getTierIcon(userActivity.tier);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-0 md:p-4 animate-fade-in">
      <div className="bg-white w-full h-full md:rounded-3xl md:max-w-4xl md:max-h-[95vh] overflow-y-auto animate-slide-up relative z-[10000]">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#00E5FF] border-t-transparent mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading business...</p>
          </div>
        ) : business ? (
          <>
            {/* Hero Section with Photo Carousel */}
            <div className="relative">
              <div className="relative h-64 md:h-80 bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] overflow-hidden">
                {businessPhotos.length > 0 && businessPhotos[0] ? (
                  <>
                    <img
                      src={businessPhotos[photoIndex] || businessPhotos[0]}
                      alt={business.name}
                      className="w-full h-full object-cover"
                    />
                    {businessPhotos.length > 1 && (
                      <>
                        <button
                          onClick={() => setPhotoIndex((photoIndex - 1 + businessPhotos.length) % businessPhotos.length)}
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white backdrop-blur-sm"
                        >
                          <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button
                          onClick={() => setPhotoIndex((photoIndex + 1) % businessPhotos.length)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white backdrop-blur-sm"
                        >
                          <ChevronRight className="w-6 h-6" />
                        </button>
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                          {businessPhotos.map((_, idx) => (
                            <div
                              key={idx}
                              className={`w-2 h-2 rounded-full transition-all ${
                                idx === photoIndex ? 'bg-white w-6' : 'bg-white/50'
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] flex items-center justify-center">
                    <Award className="w-24 h-24 text-white/50" />
                  </div>
                )}
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white backdrop-blur-sm"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Status Badge */}
              <div className="absolute top-4 left-4">
                <div className={`px-4 py-2 rounded-full backdrop-blur-md font-bold text-sm flex items-center gap-2 ${
                  status.open
                    ? 'bg-green-500/90 text-white'
                    : 'bg-gray-800/90 text-gray-200'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${status.open ? 'bg-white animate-pulse' : 'bg-gray-400'}`} />
                  {status.text}
                  {status.open && status.closesAt && (
                    <span className="text-xs opacity-90">• Closes {status.closesAt}</span>
                  )}
                </div>
              </div>

              {/* Business Logo */}
              <div className="absolute -bottom-16 left-6">
                <div className="w-32 h-32 rounded-2xl border-4 border-white bg-white shadow-xl overflow-hidden">
                  {business.photoUrl ? (
                    <img src={business.photoUrl} alt={business.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#00E5FF] to-[#6C4BFF] flex items-center justify-center">
                      <Award className="w-16 h-16 text-white" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Business Info Header */}
            <div className="pt-20 px-6 pb-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h1 className="text-2xl md:text-3xl font-bold text-[#1E0E62] mb-1">{business.name}</h1>
                  {(business.businessType || business.subCategory || business.category) && (
                    <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                      {business.businessType || business.subCategory || business.category}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mb-6">
                <button
                  onClick={handleFollowToggle}
                  className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                    isFollowing
                      ? 'bg-pink-100 text-pink-600 hover:bg-pink-200'
                      : 'bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white hover:shadow-lg'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isFollowing ? 'fill-current' : ''}`} />
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
                
                {canCheckIn && (
                  <button
                    onClick={handleCheckIn}
                    className="py-3 px-6 rounded-xl font-semibold bg-green-500 text-white hover:bg-green-600 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Check In
                  </button>
                )}

                {!hasReviewed && (
                  <button
                    onClick={() => setShowReviewModal(true)}
                    className="py-3 px-6 rounded-xl font-semibold bg-yellow-500 text-white hover:bg-yellow-600 transition-all flex items-center justify-center gap-2"
                  >
                    <Star className="w-5 h-5" />
                    Review
                  </button>
                )}
                
                <button
                  onClick={handleShare}
                  className="p-3 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>

              {/* User Tier Badge */}
              {userActivity.tier && (
                <div className={`mb-6 p-4 rounded-xl bg-gradient-to-r ${getTierColor(userActivity.tier)} text-white`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <TierIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-sm opacity-90">Your Status</div>
                        <div className="text-xl font-bold">{userActivity.tier} Member</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{userActivity.pointsEarned}</div>
                      <div className="text-xs opacity-90">Points Earned</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Location & Distance */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                {business.city && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {business.city}
                  </div>
                )}
                {distance !== null && (
                  <div className="flex items-center gap-1 text-[#00E5FF] font-medium">
                    <Navigation className="w-4 h-4" />
                    {distance.toFixed(1)} km away
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {(business.creatorFavorites || 0) + Math.floor(Math.random() * 50)} customers
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-4 gap-3 mb-6">
                <div className="text-center p-3 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl">
                  <div className="text-2xl font-bold text-[#1E0E62]">
                    {reviewStats?.averageRating ? reviewStats.averageRating.toFixed(1) : (business.rating?.toFixed(1) || '—')}
                  </div>
                  <div className="text-xs text-gray-600 flex items-center justify-center gap-1 mt-1">
                    <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                    Rating
                  </div>
                </div>
                <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
                  <div className="text-2xl font-bold text-[#1E0E62]">{missions.length}</div>
                  <div className="text-xs text-gray-600 flex items-center justify-center gap-1 mt-1">
                    <Target className="w-3 h-3" />
                    Missions
                  </div>
                </div>
                <div className="text-center p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                  <div className="text-2xl font-bold text-[#1E0E62]">{rewards.length}</div>
                  <div className="text-xs text-gray-600 flex items-center justify-center gap-1 mt-1">
                    <Gift className="w-3 h-3" />
                    Rewards
                  </div>
                </div>
                <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl">
                  <div className="text-2xl font-bold text-[#1E0E62]">{userActivity.visitCount}</div>
                  <div className="text-xs text-gray-600 flex items-center justify-center gap-1 mt-1">
                    <CheckCircle className="w-3 h-3" />
                    Visits
                  </div>
                </div>
              </div>

              {/* Google Business Attributes (Trust Badges) */}
              {business.googleAttributes && business.googleAttributes.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    Verified by Google
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {business.googleAttributes
                      .filter(attr => 
                        ['women_owned', 'lgbtq_friendly', 'black_owned', 'veteran_owned', 
                         'delivery', 'pickup', 'wheelchair_accessible', 'free_wifi'].includes(attr.key)
                      )
                      .slice(0, 6)
                      .map((attr, idx) => (
                        <span 
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-100"
                        >
                          <CheckCircle className="w-3 h-3" />
                          {attr.displayName}
                        </span>
                      ))}
                  </div>
                </div>
              )}

              {/* Google Maps Link */}
              {business.googleMapsLink && (
                <a
                  href={business.googleMapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mb-6 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100 hover:border-blue-200 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-blue-600" />
                      <div>
                        <div className="text-sm font-semibold text-gray-900">View on Google Maps</div>
                        <div className="text-xs text-gray-600">Get directions and see reviews</div>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-blue-600" />
                  </div>
                </a>
              )}
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 px-6">
              <div className="flex gap-6 overflow-x-auto">
                {[
                  { id: 'missions', label: 'Missions', count: missions.length },
                  { id: 'rewards', label: 'Rewards', count: rewards.length },
                  { id: 'reviews', label: 'Reviews', count: reviewStats?.total || 0 },
                  { id: 'about', label: 'About' },
                  { id: 'activity', label: 'Activity' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`pb-3 font-medium whitespace-nowrap transition-colors relative ${
                      activeTab === tab.id
                        ? 'text-[#00E5FF]'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {tab.label}
                    {tab.count !== undefined && (
                      <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                        {tab.count}
                      </span>
                    )}
                    {activeTab === tab.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00E5FF]" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {/* Missions Tab */}
              {activeTab === 'missions' && (
                <div className="space-y-4">
                  {missions.length === 0 ? (
                    <div className="text-center py-12">
                      <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-gray-600 mb-2">No Active Missions</h3>
                      <p className="text-gray-500">Check back soon for new ways to earn points!</p>
                    </div>
                  ) : (
                    missions.map((mission) => (
                      <div
                        key={mission.id}
                        className="bg-white border-2 border-gray-100 hover:border-[#00E5FF] rounded-2xl p-4 cursor-pointer transition-all hover:shadow-lg"
                        onClick={() => onNavigateToMission?.(mission.id)}
                      >
                        <div className="flex gap-4">
                          {mission.imageUrl && (
                            <img
                              src={mission.imageUrl}
                              alt={mission.title}
                              className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h3 className="font-bold text-[#1E0E62] line-clamp-1">{mission.title}</h3>
                              <div className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full text-sm font-bold flex-shrink-0">
                                <Award className="w-4 h-4" />
                                +{mission.points}
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2 mb-2">{mission.description}</p>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                                {mission.category}
                              </span>
                              {mission.expiresAt && (
                                <span className="flex items-center gap-1 text-orange-600">
                                  <Clock className="w-3 h-3" />
                                  Expires soon
                                </span>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 self-center" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Rewards Tab */}
              {activeTab === 'rewards' && (
                <div className="space-y-4">
                  {rewards.length === 0 ? (
                    <div className="text-center py-12">
                      <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-gray-600 mb-2">No Rewards Available</h3>
                      <p className="text-gray-500">This business hasn't created rewards yet.</p>
                    </div>
                  ) : (
                    rewards.map((reward) => {
                      const canAfford = currentUserPoints >= reward.pointsCost;
                      const almostThere = currentUserPoints >= reward.pointsCost * 0.75 && !canAfford;
                      const remaining = reward.totalAvailable ? reward.totalAvailable - (reward.claimed || 0) : null;

                      return (
                        <div
                          key={reward.id}
                          className={`bg-white border-2 rounded-2xl p-4 cursor-pointer transition-all hover:shadow-lg ${
                            canAfford
                              ? 'border-green-300 hover:border-green-500'
                              : almostThere
                              ? 'border-orange-300 hover:border-orange-500'
                              : 'border-gray-100 hover:border-[#00E5FF]'
                          }`}
                          onClick={() => onNavigateToReward?.(reward.id)}
                        >
                          <div className="flex gap-4">
                            {reward.imageUrl && (
                              <img
                                src={reward.imageUrl}
                                alt={reward.title}
                                className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h3 className="font-bold text-[#1E0E62] line-clamp-1">{reward.title}</h3>
                                <div className={`px-3 py-1 rounded-full text-sm font-bold flex-shrink-0 ${
                                  canAfford
                                    ? 'bg-green-500 text-white'
                                    : almostThere
                                    ? 'bg-orange-500 text-white'
                                    : 'bg-gray-200 text-gray-700'
                                }`}>
                                  {reward.pointsCost} pts
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 line-clamp-2 mb-2">{reward.description}</p>
                              <div className="flex items-center gap-3 text-xs">
                                <span className="px-2 py-1 bg-pink-100 text-pink-700 rounded-full">
                                  {reward.category}
                                </span>
                                {remaining !== null && remaining > 0 && (
                                  <span className="text-gray-500">
                                    {remaining} left
                                  </span>
                                )}
                                {canAfford && (
                                  <span className="text-green-600 font-medium flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    You can redeem!
                                  </span>
                                )}
                                {almostThere && (
                                  <span className="text-orange-600 font-medium">
                                    Almost there! {reward.pointsCost - currentUserPoints} pts more
                                  </span>
                                )}
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 self-center" />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Reviews Tab */}
              {activeTab === 'reviews' && (
                <div className="space-y-6">
                  {/* AI Insights Button */}
                  {reviewStats && reviewStats.total >= 3 && (
                    <button
                      onClick={() => setShowInsights(true)}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-6 rounded-2xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-3"
                    >
                      <Zap className="w-5 h-5" />
                      View AI-Powered Insights
                      <span className="text-xs bg-white/20 px-2 py-1 rounded-full">✨ Smart</span>
                    </button>
                  )}

                  {/* Rating Summary */}
                  {reviewStats && reviewStats.total > 0 && (
                    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-200">
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <div className="text-5xl font-bold text-[#1E0E62] mb-2">
                            {reviewStats.averageRating.toFixed(1)}
                          </div>
                          <div className="flex gap-1 mb-2 justify-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-5 h-5 ${
                                  star <= Math.round(reviewStats.averageRating)
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <div className="text-sm text-gray-600">
                            {reviewStats.total} {reviewStats.total === 1 ? 'review' : 'reviews'}
                          </div>
                        </div>

                        <div className="flex-1 space-y-2">
                          {[5, 4, 3, 2, 1].map((rating) => {
                            const count = reviewStats.ratingDistribution[rating] || 0;
                            const percentage = reviewStats.total > 0 ? (count / reviewStats.total) * 100 : 0;
                            return (
                              <div key={rating} className="flex items-center gap-3">
                                <div className="flex items-center gap-1 w-16">
                                  <span className="text-sm font-medium text-gray-700">{rating}</span>
                                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                </div>
                                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-yellow-400 rounded-full transition-all"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                                <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Reviews List */}
                  {reviews.length === 0 ? (
                    <div className="text-center py-12">
                      <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-gray-600 mb-2">No Reviews Yet</h3>
                      <p className="text-gray-500 mb-6">Be the first to share your experience!</p>
                      {!hasReviewed && (
                        <button
                          onClick={() => setShowReviewModal(true)}
                          className="px-6 py-3 bg-[#00E5FF] text-white rounded-xl font-semibold hover:bg-[#00C8E0] transition-colors"
                        >
                          Write a Review
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <div key={review.id} className="bg-white border-2 border-gray-100 rounded-2xl p-5">
                          {/* Review Header */}
                          <div className="flex items-start gap-4 mb-3">
                            {review.userAvatar ? (
                              <img
                                src={review.userAvatar}
                                alt={review.userName}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-lg">
                                {review.userName.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h4 className="font-bold text-gray-900">{review.userName}</h4>
                                <span className="text-sm text-gray-500">
                                  {new Date(review.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex gap-1 mt-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-4 h-4 ${
                                      star <= review.rating
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Review Text */}
                          <p className="text-gray-700 leading-relaxed mb-3">{review.reviewText}</p>

                          {/* Review Photos */}
                          {review.photos && review.photos.length > 0 && (
                            <div className="grid grid-cols-3 gap-2 mb-3">
                              {review.photos.slice(0, 3).map((photo, index) => (
                                <img
                                  key={index}
                                  src={photo}
                                  alt={`Review photo ${index + 1}`}
                                  className="w-full h-24 object-cover rounded-lg"
                                />
                              ))}
                              {review.photos.length > 3 && (
                                <div className="w-full h-24 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 font-semibold">
                                  +{review.photos.length - 3} more
                                </div>
                              )}
                            </div>
                          )}

                          {/* Business Response */}
                          {review.response && (
                            <div className="mt-4 pl-4 border-l-4 border-[#00E5FF] bg-gray-50 rounded-r-xl p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-full bg-[#00E5FF] flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">
                                    {business.name?.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <div className="font-semibold text-sm text-gray-900">{business.name}</div>
                                  <div className="text-xs text-gray-500">Business Owner</div>
                                </div>
                              </div>
                              <p className="text-gray-700 text-sm">{review.response.text}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* About Tab */}
              {activeTab === 'about' && (
                <div className="space-y-6">
                  {/* Description */}
                  {(business.bio || business.mission) && (
                    <div>
                      <h3 className="font-bold text-lg text-[#1E0E62] mb-3">About</h3>
                      <p className="text-gray-700 leading-relaxed">
                        {business.mission || business.bio}
                      </p>
                    </div>
                  )}

                  {/* Contact Info */}
                  <div>
                    <h3 className="font-bold text-lg text-[#1E0E62] mb-3">Contact</h3>
                    <div className="space-y-2">
                      {business.phone && (
                        <a
                          href={`tel:${business.phone}`}
                          className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                          <Phone className="w-5 h-5 text-[#00E5FF]" />
                          <span className="text-gray-900">{business.phone}</span>
                        </a>
                      )}
                      {business.email && (
                        <a
                          href={`mailto:${business.email}`}
                          className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                          <Mail className="w-5 h-5 text-[#00E5FF]" />
                          <span className="text-gray-900">{business.email}</span>
                        </a>
                      )}
                      {business.website && (
                        <a
                          href={business.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                          <Globe className="w-5 h-5 text-[#00E5FF]" />
                          <span className="text-gray-900 flex-1">{business.website}</span>
                          <ExternalLink className="w-4 h-4 text-gray-400" />
                        </a>
                      )}
                      {business.address && (
                        <button
                          onClick={getDirections}
                          className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-left"
                        >
                          <MapPin className="w-5 h-5 text-[#00E5FF] flex-shrink-0" />
                          <span className="text-gray-900 flex-1">{business.address}</span>
                          <Navigation className="w-4 h-4 text-[#00E5FF]" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Hours */}
                  <div>
                    <h3 className="font-bold text-lg text-[#1E0E62] mb-3">Hours</h3>
                    <div className="bg-gray-50 rounded-xl p-4">
                      {/* TODO: Display actual business hours */}
                      <div className="space-y-2 text-sm">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => (
                          <div key={day} className="flex justify-between">
                            <span className="text-gray-600">{day}</span>
                            <span className="font-medium text-gray-900">9:00 AM - 8:00 PM</span>
                          </div>
                        ))}
                        <div className="flex justify-between">
                          <span className="text-gray-600">Sat</span>
                          <span className="font-medium text-gray-900">10:00 AM - 6:00 PM</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Sun</span>
                          <span className="font-medium text-gray-900">Closed</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Instagram */}
                  {business.instagram && (
                    <div>
                      <h3 className="font-bold text-lg text-[#1E0E62] mb-3 flex items-center gap-2">
                        <Instagram className="w-5 h-5" />
                        Instagram
                      </h3>
                      <a
                        href={`https://instagram.com/${business.instagram.username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 rounded-xl transition-colors"
                      >
                        <span className="text-gray-900">@{business.instagram.username}</span>
                        <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Activity Tab */}
              {activeTab === 'activity' && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 text-center">
                    <Flame className="w-12 h-12 text-orange-500 mx-auto mb-3" />
                    <h3 className="font-bold text-xl text-[#1E0E62] mb-2">Activity Tracking</h3>
                    <p className="text-gray-600 mb-4">
                      Your detailed activity history, check-ins, and earned badges will appear here.
                    </p>
                    <div className="text-sm text-gray-500">Coming soon!</div>
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Bottom Action Bar (Mobile) */}
            <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 md:hidden">
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setActiveTab('missions')}
                  className="px-4 py-3 bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white rounded-xl font-bold text-sm hover:shadow-lg transition-all"
                >
                  <Target className="w-5 h-5 mx-auto mb-1" />
                  Missions
                </button>
                <button
                  onClick={() => setActiveTab('rewards')}
                  className="px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-sm hover:shadow-lg transition-all"
                >
                  <Gift className="w-5 h-5 mx-auto mb-1" />
                  Rewards
                </button>
                <button
                  onClick={handleShare}
                  className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all"
                >
                  <Share2 className="w-5 h-5 mx-auto mb-1" />
                  Share
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-12 text-center">
            <p className="text-gray-600">Business not found</p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2 bg-[#00E5FF] text-white rounded-xl hover:bg-[#d61f6f] transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>

      {/* Review Submission Modal */}
      <ReviewSubmissionModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        userId={currentUserId}
        businessId={businessId}
        businessName={business?.name || ''}
        businessLogo={business?.photoUrl}
        checkInId={lastCheckInId || undefined}
        onReviewSubmitted={(reviewId) => {
          setHasReviewed(true);
          setShowReviewModal(false);
          // Award mission points if applicable
          alert('🎉 Review submitted! Points will be awarded once verified.');
        }}
      />

      {/* Review Insights Modal */}
      <BusinessReviewInsights
        isOpen={showInsights}
        onClose={() => setShowInsights(false)}
        businessId={businessId}
        businessName={business?.name || ''}
      />
    </div>
  );
};
