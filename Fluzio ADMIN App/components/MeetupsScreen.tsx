import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, TrendingUp, Sparkles, Filter, List, Map as MapIcon, Star, Award, Clock, Navigation } from 'lucide-react';
import { Meetup, MeetupCategory, User, PassportStamp } from '../types';
import { getMockMeetups } from '../services/mockMeetupData';
import { getRecommendedMeetups, getTrendingMeetups, getMeetupsByCategory } from '../services/meetupService';
import { useAuth } from '../services/AuthContext';
import { useToast } from '../hooks/useToast';
import { MeetupDetailModal } from './MeetupDetailModal';
import { MeetupSummaryModal } from './MeetupSummaryModal';
import { PassportStampsModal } from './PassportStampsModal';
import { UserStatsBar } from './UserStatsBar';
import { useGeolocation } from '../hooks/useLocation';
import { getUserProgression } from '../services/progressionService';
import { createNotification } from '../services/notificationService';
import { getUsersByRole } from '../services/userService';
import { UserRole } from '../types';
import { findBusinessMatchesForMeetup } from '../services/openaiService';
import { SkeletonLoader, PullToRefresh } from './SkeletonLoader';
import { useTranslation } from 'react-i18next';

type ViewMode = 'list' | 'map';
type MeetupTab = 'squad' | 'browse';

const CATEGORY_ICONS: Record<MeetupCategory, string> = {
  COFFEE: '☕',
  DINNER: '🍽️',
  CREATIVE: '🎨',
  FITNESS: '💪',
  PET: '🐾',
  INTERNATIONAL: '🌍',
  BUSINESS: '💼',
  WELLNESS: '🧘',
  NIGHTLIFE: '🌙',
  CULTURE: '🎭'
};

const CATEGORY_LABELS: Record<MeetupCategory, string> = {
  COFFEE: 'Coffee',
  DINNER: 'Dining',
  CREATIVE: 'Creative',
  FITNESS: 'Fitness',
  PET: 'Pet Friendly',
  INTERNATIONAL: 'International',
  BUSINESS: 'Business',
  WELLNESS: 'Wellness',
  NIGHTLIFE: 'Nightlife',
  CULTURE: 'Culture'
};

export function MeetupsScreen() {
  const { user, userProfile } = useAuth();
  const { showToast } = useToast();
  const { location } = useGeolocation();
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [activeTab, setActiveTab] = useState<MeetupTab>('squad');
  const [selectedCategory, setSelectedCategory] = useState<MeetupCategory | 'ALL'>('ALL');
  const [meetups, setMeetups] = useState<Meetup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMeetup, setSelectedMeetup] = useState<Meetup | null>(null);
  const [summaryMeetup, setSummaryMeetup] = useState<Meetup | null>(null);
  const [showPassport, setShowPassport] = useState(false);
  const [collectedStamps, setCollectedStamps] = useState<PassportStamp[]>([]);
  const [requestingAI, setRequestingAI] = useState(false);

  useEffect(() => {
    loadMeetups();
    loadUserStamps();
  }, [activeTab, selectedCategory]);

  const loadUserStamps = async () => {
    if (userProfile?.id) {
      const progression = await getUserProgression(userProfile.id);
      if (progression) {
        setCollectedStamps(progression.passportStamps);
      }
    }
  };

  const handleAIRecommendations = async () => {
    if (!userProfile || !location) {
      showToast(t('meetups.enableLocation'), 'error');
      return;
    }

    setRequestingAI(true);
    try {
      // Get all businesses in the user's city
      const businesses = await getUsersByRole(UserRole.BUSINESS, location.city);
      
      if (businesses.length === 0) {
        showToast(t('meetups.noBusinesses'), 'info');
        setRequestingAI(false);
        return;
      }

      console.log('[AI Recommendations] Using OpenAI to match businesses...');
      
      // Use AI-powered matching
      const aiMatches = await findBusinessMatchesForMeetup(
        {
          id: userProfile.id,
          name: userProfile.name,
          vibeTags: userProfile.vibeTags || [],
          interests: userProfile.vibeTags || [],
          city: location.city,
          recentActivity: [], // Could pull from activity history
          favoriteCategories: [] // Could pull from user stats
        },
        businesses.map(b => ({
          id: b.id,
          name: b.name,
          businessType: b.businessType || b.category || 'Business',
          vibeTags: b.vibeTags || [],
          category: b.category,
          city: b.city || location.city,
          bio: b.bio
        })),
        activeTab,
        5 // Top 5 matches
      );

      if (aiMatches.length === 0) {
        showToast(t('meetups.noMatches'), 'info');
        setRequestingAI(false);
        return;
      }

      // Send personalized notifications to matched businesses
      const notificationPromises = aiMatches.map(match => {
        const business = businesses.find(b => b.id === match.businessId);
        if (!business) return Promise.resolve();
        
        return createNotification(
          business.id,
          {
            type: 'MEETUP_REQUEST',
            title: '🎲 AI-Matched Meetup Request',
            message: match.personalizedPitch,
            actionLink: `/meetups?requester=${userProfile.id}&score=${match.matchScore}`
          }
        );
      });

      await Promise.all(notificationPromises);

      // Log AI match details
      console.log('[AI Recommendations] Matched businesses:', aiMatches.map(m => ({
        business: businesses.find(b => b.id === m.businessId)?.name,
        score: m.matchScore,
        reason: m.reason
      })));

      showToast(
        t('meetups.aiMatchedSuccess', { count: aiMatches.length }),
        'success'
      );
      
    } catch (error) {
      console.error('[AI Recommendations] Error:', error);
      showToast(t('meetups.aiFailed'), 'error');
    } finally {
      setRequestingAI(false);
    }
  };

  const loadMeetups = async () => {
    setLoading(true);
    try {
      // Using mock data for now
      const mockData = getMockMeetups();
      
      // Filter by tab: squad (4-person meetups) or browse (all other meetups)
      let filtered = activeTab === 'squad'
        ? mockData.filter(m => m.capacity === 4) // Squad: 4-person meetups
        : mockData; // Browse: All meetups
      
      // Further filter by category if selected
      if (selectedCategory !== 'ALL') {
        filtered = filtered.filter(m => m.category === selectedCategory);
      }

      // Sort squad meetups by partner priority and match
      if (activeTab === 'squad') {
        filtered.sort((a, b) => {
          const scoreA = a.partnerPriority + (a.businessIsPartner ? 20 : 0);
          const scoreB = b.partnerPriority + (b.businessIsPartner ? 20 : 0);
          return scoreB - scoreA;
        });
      } else {
        // Sort browse by spots available and trending
        filtered.sort((a, b) => {
          const spotsA = a.capacity - a.participants.length;
          const spotsB = b.capacity - b.participants.length;
          return spotsB - spotsA;
        });
      }

      setMeetups(filtered);
    } catch (error) {
      showToast(t('meetups.loadFailed'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const timeStr = date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });

    if (date.toDateString() === today.toDateString()) {
      return `Today ${timeStr}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow ${timeStr}`;
    } else {
      return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${timeStr}`;
    }
  };

  const getSeatsRemaining = (meetup: Meetup) => {
    return meetup.capacity - meetup.participants.length;
  };

  const handleJoinMeetup = (meetupId: string) => {
    const meetup = meetups.find(m => m.id === meetupId);
    if (meetup) {
      setSelectedMeetup(meetup);
    }
  };

  const handleModalClose = () => {
    setSelectedMeetup(null);
    loadMeetups(); // Refresh meetups after modal closes
  };

  const handleTestCompletion = (meetup: Meetup) => {
    // Test function to show completion summary
    setSummaryMeetup(meetup);
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-7 h-7 text-purple-600" />
              {t('meetups.title')}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {t('meetups.subtitle')}
            </p>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-4 h-4" />
              <span className="text-sm font-medium">{t('meetups.viewList')}</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all ${
                viewMode === 'map'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <MapIcon className="w-4 h-4" />
              <span className="text-sm font-medium">{t('meetups.viewMap')}</span>
            </button>
          </div>
        </div>

        {/* Meetup Type Tabs */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setActiveTab('squad')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all flex-1 ${
              activeTab === 'squad'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border border-gray-300 hover:border-purple-400'
            }`}
          >
            <Users className="w-5 h-5" />
            <div className="text-left">
              <div className="font-bold">{t('meetups.squadMeetups')}</div>
              <div className="text-xs opacity-90">{t('meetups.squadDesc')}</div>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('browse')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all flex-1 ${
              activeTab === 'browse'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border border-gray-300 hover:border-purple-400'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <div className="text-left">
              <div className="font-bold">{t('meetups.browse')}</div>
              <div className="text-xs opacity-90">{t('meetups.browseDesc')}</div>
            </div>
          </button>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              selectedCategory === 'ALL'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:border-purple-400'
            }`}
          >
            {t('common.all')}
          </button>
          {Object.entries(CATEGORY_ICONS).map(([category, icon]) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category as MeetupCategory)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === category
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-purple-400'
              }`}
            >
              {icon} {CATEGORY_LABELS[category as MeetupCategory]}
            </button>
          ))}
          
          {/* Passport Stamps Button */}
          <button
            onClick={() => setShowPassport(true)}
            className="ml-auto px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-sm flex items-center gap-1"
          >
            🎫 {t('meetups.passport')} ({collectedStamps.length}/10)
          </button>
        </div>
      </div>

      {/* Content */}
      <PullToRefresh onRefresh={async () => {
        await loadMeetups();
        showToast(t('meetups.refreshed'), 'success');
      }}>
        <div className="flex-1 overflow-y-auto p-6">
          {/* User Stats Bar */}
          {userProfile?.id && (
            <div className="mb-6">
              <UserStatsBar 
                userId={userProfile.id} 
                onViewPassport={() => setShowPassport(true)}
              />
            </div>
          )}

          {loading ? (
            <div className="space-y-4">
              <SkeletonLoader type="meetup" count={activeTab === 'squad' ? 4 : 6} />
            </div>
          ) : meetups.length === 0 ? (
          <div className="space-y-6">
            {/* Zero State Message */}
            <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center">
              <div className="text-6xl mb-4">
                {activeTab === 'squad' ? '🎲' : '📅'}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {activeTab === 'squad' 
                  ? t('meetups.noSquadMeetups') 
                  : t('meetups.noMeetups')}
              </h3>
              <p className="text-gray-600 mb-2">
                {activeTab === 'squad'
                  ? t('meetups.noSquadInCity', { city: location?.city || t('meetups.yourArea') })
                  : t('meetups.noMeetupsInCity', { city: location?.city || t('meetups.yourArea') })}
              </p>
              <p className="text-sm text-gray-500 mb-6">
                {activeTab === 'squad'
                  ? t('meetups.beFirstOrWait')
                  : t('meetups.changeFilters')}
              </p>
              
              {/* Current Cycle Info */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-700 mb-6">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">November Cycle</span>
                <span className="text-purple-500">•</span>
                <span>6 days remaining</span>
              </div>
            </div>

            {/* AI Suggestions Card */}
            <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 rounded-2xl border border-purple-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-lg text-gray-900">{t('meetups.aiSuggestions')}</h4>
                  <p className="text-sm text-gray-600">{t('meetups.aiSuggestionsDesc')}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white/80 rounded-lg p-3 text-center">
                  <div className="text-2xl mb-1">☕</div>
                  <div className="text-xs font-medium text-gray-700">{t('meetups.categories.coffeeChats')}</div>
                </div>
                <div className="bg-white/80 rounded-lg p-3 text-center">
                  <div className="text-2xl mb-1">🍽️</div>
                  <div className="text-xs font-medium text-gray-700">{t('meetups.categories.dinnerClubs')}</div>
                </div>
                <div className="bg-white/80 rounded-lg p-3 text-center">
                  <div className="text-2xl mb-1">🎨</div>
                  <div className="text-xs font-medium text-gray-700">{t('meetups.categories.creativeSpaces')}</div>
                </div>
                <div className="bg-white/80 rounded-lg p-3 text-center">
                  <div className="text-2xl mb-1">💪</div>
                  <div className="text-xs font-medium text-gray-700">{t('meetups.categories.fitnessGroups')}</div>
                </div>
              </div>
              
              <button
                onClick={handleAIRecommendations}
                disabled={requestingAI}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {requestingAI ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>{t('meetups.matchingBusiness')}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    {t('meetups.getAIRecommendations')}
                  </>
                )}
              </button>
            </div>

            {/* Popular Categories Suggestion */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-orange-600" />
                {t('meetups.popularIn', { city: location?.city || t('meetups.yourCity') })}
              </h4>
              <div className="space-y-2">
                {['COFFEE', 'DINNER', 'CREATIVE', 'FITNESS'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat as MeetupCategory)}
                    className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-between"
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-2xl">{CATEGORY_ICONS[cat as MeetupCategory]}</span>
                      <span className="font-medium text-gray-700">
                        {CATEGORY_LABELS[cat as MeetupCategory]}
                      </span>
                    </span>
                    <span className="text-xs text-gray-500">{t('common.seeAll')}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {activeTab === 'squad' && (
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-300 rounded-xl p-4 mb-2">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <span className="font-semibold text-purple-900">{t('meetups.aiPoweredRecs')}</span>
                </div>
                <p className="text-sm text-purple-800">
                  {t('meetups.aiPoweredRecsDesc')}
                </p>
              </div>
            )}

            {meetups.map((meetup) => (
              <MeetupCard 
                key={meetup.id} 
                meetup={meetup}
                onJoin={handleJoinMeetup}
                onTestComplete={handleTestCompletion}
                formatTime={formatTime}
                getSeatsRemaining={getSeatsRemaining}
              />
            ))}
          </div>
        )}
        </div>
      </PullToRefresh>

      {/* Meetup Detail Modal */}
      {selectedMeetup && userProfile && (
        <MeetupDetailModal
          meetup={selectedMeetup}
          user={userProfile as any}
          userLocation={location || undefined}
          onClose={handleModalClose}
          onJoinSuccess={handleModalClose}
        />
      )}

      {/* Meetup Summary Modal */}
      {summaryMeetup && (
        <MeetupSummaryModal
          meetup={summaryMeetup}
          xpEarned={summaryMeetup.xpReward || 0}
          stampEarned={summaryMeetup.stamp}
          rewardUnlocked={summaryMeetup.businessIsPartner && !!summaryMeetup.rewardId}
          onClose={() => setSummaryMeetup(null)}
          onViewRecommendations={() => {
            setSummaryMeetup(null);
            setActiveTab('squad');
          }}
          onViewPassport={() => {
            setSummaryMeetup(null);
            setShowPassport(true);
          }}
        />
      )}

      {/* Passport Stamps Modal */}
      {showPassport && (
        <PassportStampsModal
          collectedStamps={collectedStamps}
          onClose={() => setShowPassport(false)}
        />
      )}
    </div>
  );
}

interface MeetupCardProps {
  meetup: Meetup;
  onJoin: (meetupId: string) => void;
  onTestComplete?: (meetup: Meetup) => void;
  formatTime: (time: string) => string;
  getSeatsRemaining: (meetup: Meetup) => number;
}

function MeetupCard({ meetup, onJoin, onTestComplete, formatTime, getSeatsRemaining }: MeetupCardProps) {
  const seatsRemaining = getSeatsRemaining(meetup);
  const isAlmostFull = seatsRemaining === 1;
  const isFull = seatsRemaining === 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-3 flex-1">
            {/* Business Logo */}
            <img 
              src={meetup.businessLogo} 
              alt={meetup.businessName}
              className="w-12 h-12 rounded-lg object-cover"
            />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-lg">{meetup.title}</h3>
              <p className="text-sm text-gray-600 flex items-center gap-1">
                {meetup.businessName}
                {meetup.businessIsPartner && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full ml-2">
                    <Star className="w-3 h-3 fill-current" />
                    Partner
                  </span>
                )}
              </p>
            </div>
          </div>
          
          {/* Category Badge */}
          <div className="text-2xl">{CATEGORY_ICONS[meetup.category]}</div>
        </div>

        <p className="text-sm text-gray-700 line-clamp-2">{meetup.description}</p>
      </div>

      {/* Details */}
      <div className="p-4 bg-gray-50">
        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* Time */}
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700 font-medium">{formatTime(meetup.startTime)}</span>
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700">{meetup.location.district}</span>
          </div>
        </div>

        {/* Participants */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {meetup.participants.slice(0, 3).map((participant, idx) => (
                <div
                  key={participant.userId}
                  className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-gray-200"
                  style={{ zIndex: 3 - idx }}
                >
                  {participant.userAvatar && (
                    <img src={participant.userAvatar} alt={participant.userName} className="w-full h-full object-cover" />
                  )}
                </div>
              ))}
              {/* Empty seats */}
              {Array.from({ length: Math.min(seatsRemaining, 3) }).map((_, idx) => (
                <div
                  key={`empty-${idx}`}
                  className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center"
                  style={{ zIndex: 3 - meetup.participants.length - idx }}
                >
                  <Users className="w-4 h-4 text-gray-400" />
                </div>
              ))}
            </div>
            <div className="text-sm">
              <span className="font-semibold text-gray-900">{meetup.participants.length}</span>
              <span className="text-gray-600">/4 joined</span>
            </div>
          </div>

          {isAlmostFull && !isFull && (
            <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full animate-pulse">
              🔥 1 seat left!
            </span>
          )}
          {isFull && (
            <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs font-medium rounded-full">
              Full
            </span>
          )}
        </div>

        {/* Rewards & XP */}
        {meetup.businessIsPartner && (
          <div className="flex items-center gap-2 mb-3">
            {meetup.rewardTitle && (
              <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                <Award className="w-3 h-3" />
                {meetup.rewardTitle}
              </div>
            )}
            {meetup.xpReward > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                <Sparkles className="w-3 h-3" />
                +{meetup.xpReward} XP
              </div>
            )}
            {meetup.stamp && (
              <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                🎫 {meetup.stamp}
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <div className="flex gap-2">
          <button
            onClick={() => onJoin(meetup.id)}
            disabled={isFull}
            className={`flex-1 py-2.5 rounded-lg font-medium transition-all ${
              isFull
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-sm'
            }`}
          >
            {isFull ? 'Meetup Full' : 'Join Meetup'}
          </button>
          {/* Test Complete Button - Only for partner meetups */}
          {onTestComplete && meetup.businessIsPartner && meetup.xpReward > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTestComplete(meetup);
              }}
              className="px-3 py-2.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-all text-xs font-medium"
              title="Test completion summary"
            >
              ✓ Test
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
