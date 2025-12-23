/**
 * HomeScreen Component - ENHANCED VERSION
 * 
 * Main landing screen for customers showing personalized content:
 * - Hero section with stats, streak, and quick actions
 * - AI-powered "For You" recommendations
 * - Active missions widget
 * - Upcoming meetups widget
 * - Recent activity feed
 * - Achievements showcase
 * - Points & level progress
 * - Nearby opportunities
 */

import React, { useState, useEffect } from 'react';
import { 
  Target, Calendar, TrendingUp, AlertCircle, Loader, MapPin, Camera, MapPinned, 
  Star, MessageSquare, Gift, Zap, Trophy, Clock, Users, Navigation, Share2,
  Award, Flame, CheckCircle, ArrowRight, Plus, Map, Sparkles, TrendingDown
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Mission, Event, BusinessProfile } from '../types/models';
import { useAuth } from '../../services/AuthContext';
import { getActiveMissions, getMissionsForUser } from '../services/missionService';
import { getEventsForCity } from '../services/eventService';
import { getRecommendedMeetups } from '../../services/meetupService';
import { getUserProgression } from '../../services/progressionService';
import { generateMeetupRecommendationReason } from '../../services/openaiService';
import { updateLoginStreak, getUserGamification, claimStreakRewards } from '../../services/gamificationService';
import { claimDailyStreakReward, canClaimToday, getStreakStatusMessage, getNextMilestone } from '../../services/dailyStreakService';
import { trackDailyStreakClaimed } from '../../services/firebaseAnalytics';
import { DailyChallengesModal } from '../../components/DailyChallengesModal';
import { LeaderboardModal } from '../../components/LeaderboardModal';
import { DailyXPClaimModal } from '../../components/DailyXPClaimModal';
import { SkeletonMissionCard, SkeletonCard, SkeletonList } from '../../components/Skeleton';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { PullToRefreshIndicator } from '../../components/PullToRefreshIndicator';
import { store } from '../../services/mockStore';
import { UserRole } from '../../types';
import { Meetup } from '../../types';
import { NearbyBusinesses } from '../../components/NearbyBusinesses';
import { getCurrentLocation } from '../../services/locationService';

// ============================================================================
// TYPES
// ============================================================================

interface HomeScreenProps {
  onNavigate?: (screen: string, params?: any) => void;
}

// ============================================================================
// MISSION CARD COMPONENT
// ============================================================================

const getMissionIcon = (goal?: string, requirements?: any) => {
  if (goal === 'CONTENT' || requirements?.postType) return <Camera className="w-4 h-4" />;
  if (goal === 'TRAFFIC') return <MapPinned className="w-4 h-4" />;
  if (goal === 'GROWTH') return <Star className="w-4 h-4" />;
  if (requirements?.postType === 'REVIEW') return <MessageSquare className="w-4 h-4" />;
  return <Target className="w-4 h-4" />;
};

const getMissionTypeLabel = (goal?: string, requirements?: any) => {
  if (requirements?.postType) return requirements.postType.toLowerCase();
  if (goal === 'CONTENT') return 'Social';
  if (goal === 'TRAFFIC') return 'Visit';
  if (goal === 'GROWTH') return 'Review';
  return 'Mission';
};

interface MissionCardProps {
  mission: Mission;
  onClick: () => void;
}

const MissionCard: React.FC<MissionCardProps> = ({ mission, onClick }) => {
  const icon = getMissionIcon(mission.goal, mission.detailedRequirements);
  const typeLabel = getMissionTypeLabel(mission.goal, mission.detailedRequirements);
  const category = mission.category || typeLabel;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-100"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#F72585] to-[#7209B7] flex items-center justify-center text-white flex-shrink-0">
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="font-bold text-[#1E0E62] text-sm leading-tight mb-1 truncate">
            {mission.title}
          </h3>

          {/* Subtitle */}
          <p className="text-xs text-[#8F8FA3] mb-2 line-clamp-1">
            {mission.description}
          </p>

          {/* Info Row */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Category Tag */}
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700">
              {category}
            </span>

            {/* Business Name */}
            {mission.businessName && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-50 text-purple-700 truncate max-w-[120px]">
                {mission.businessName}
              </span>
            )}

            {/* Reward */}
            {mission.reward?.points && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-50 text-yellow-700">
                <Gift className="w-3 h-3" />
                +{mission.reward.points} pts
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// STUB SERVICE (until businessService is created)
// ============================================================================

/**
 * Stub function for trending businesses
 * TODO: Move to businessService.ts when implemented
 */
const getTrendingBusinessesForCity = async (city: string): Promise<BusinessProfile[]> => {
  // Stub implementation - returns empty array
  // Real implementation would query Firestore:
  // collection(db, 'businesses')
  //   .where('city', '==', city)
  //   .orderBy('rating', 'desc')
  //   .limit(5)
  console.log(`[HomeScreen] getTrendingBusinessesForCity called for: ${city}`);
  return [];
};

// ============================================================================
// COMPONENT
// ============================================================================

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate }) => {
  // ============================================================================
  // STATE & HOOKS
  // ============================================================================
  
  const { t } = useTranslation();
  const { userProfile, loading: authLoading } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [meetups, setMeetups] = useState<Meetup[]>([]);
  const [progression, setProgression] = useState<any>(null);
  const [activeMissions, setActiveMissions] = useState<Mission[]>([]);
  const [completedMissions, setCompletedMissions] = useState<Mission[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  
  const [loadingMissions, setLoadingMissions] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingBusinesses, setLoadingBusinesses] = useState(true);
  const [loadingMeetups, setLoadingMeetups] = useState(true);
  const [loadingProgression, setLoadingProgression] = useState(true);
  
  // Location state
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [viewingBusinessId, setViewingBusinessId] = useState<string | null>(null);
  
  // Gamification modals
  const [showChallengesModal, setShowChallengesModal] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [unclaimedStreakRewards, setUnclaimedStreakRewards] = useState(0);
  const [claimingStreak, setClaimingStreak] = useState(false);
  
  // Daily login streak
  const [claimingDailyStreak, setClaimingDailyStreak] = useState(false);
  const [dailyStreakClaimed, setDailyStreakClaimed] = useState(false);
  const [showXPClaimModal, setShowXPClaimModal] = useState(false);
  
  const [errorMissions, setErrorMissions] = useState<string | null>(null);
  const [errorEvents, setErrorEvents] = useState<string | null>(null);
  const [errorBusinesses, setErrorBusinesses] = useState<string | null>(null);
  const [errorMeetups, setErrorMeetups] = useState<string | null>(null);

  // Streak calculation
  const calculateStreak = () => {
    if (!progression?.lastMeetupDate) return 0;
    const lastDate = new Date(progression.lastMeetupDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 1) return progression.currentStreak || 0;
    return 0;
  };

  // Calculate level from points (using same formula as progression service)
  const calculateLevelFromPoints = (points: number): number => {
    return Math.floor(Math.sqrt(points / 100)) + 1;
  };

  // Calculate points needed for next level
  const getPointsForNextLevel = (currentLevel: number): number => {
    return (currentLevel * currentLevel) * 100;
  };

  // Calculate progress to next level
  const getLevelProgressFromPoints = (points: number, currentLevel: number) => {
    const currentLevelPoints = ((currentLevel - 1) * (currentLevel - 1)) * 100;
    const nextLevelPoints = (currentLevel * currentLevel) * 100;
    const pointsInCurrentLevel = points - currentLevelPoints;
    const pointsNeededForLevel = nextLevelPoints - currentLevelPoints;
    const progress = (pointsInCurrentLevel / pointsNeededForLevel) * 100;

    return {
      currentLevelPoints: pointsInCurrentLevel,
      nextLevelPoints: pointsNeededForLevel,
      progress: Math.min(100, Math.max(0, progress))
    };
  };

  const currentStreak = calculateStreak();
  const userPoints = userProfile?.points || 0;
  const calculatedLevel = calculateLevelFromPoints(userPoints);
  const levelProgress = getLevelProgressFromPoints(userPoints, calculatedLevel);

  // ============================================================================
  // PULL TO REFRESH
  // ============================================================================

  const handleRefresh = async () => {
    // Reload all data
    await Promise.all([
      loadProgression(),
      loadMissions(),
      loadMeetups(),
      loadEvents()
    ]);
  };

  const {
    containerRef,
    isPulling,
    isRefreshing,
    pullDistance,
    shouldTrigger
  } = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 80,
    resistance: 2.5
  });

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  const loadProgression = async () => {
    if (!userProfile) return;
    
    setLoadingProgression(true);
    try {
      const prog = await getUserProgression(userProfile.id);
      setProgression(prog);
      
      // Update login streak and get gamification data
      const gamificationData = await updateLoginStreak(userProfile.id);
      
      // Count unclaimed streak rewards
      const unclaimed = gamificationData.streakRewards?.filter(r => !r.claimed).length || 0;
      setUnclaimedStreakRewards(unclaimed);
      
      // Mock recent activity
      setRecentActivity([
        { type: 'mission', title: 'Coffee Shop Review', points: 50, time: '2h ago', icon: Target },
        { type: 'reward', title: 'Redeemed €10 Gift Card', points: -500, time: '5h ago', icon: Gift },
        { type: 'meetup', title: 'Coffee Meetup Completed', points: 100, time: 'Yesterday', icon: Users },
        { type: 'badge', title: 'Earned "Social Butterfly" Badge', points: 0, time: '2 days ago', icon: Award }
      ]);
    } catch (error) {
      console.error('[HomeScreen] Error loading progression:', error);
    } finally {
      setLoadingProgression(false);
    }
  };

  const loadMissions = async () => {
    if (!userProfile) return;
    
    setLoadingMissions(true);
    setErrorMissions(null);
    try {
      const allMissions = await getActiveMissions();
      console.log('[HomeScreen] Loaded missions:', allMissions.length);
      
      // Get user's participations to filter out completed/applied missions
      let userParticipations: any[] = [];
      if (userProfile?.uid) {
        try {
          const { getParticipationsForUser } = await import('../services/participationService');
          userParticipations = await getParticipationsForUser(userProfile.uid);
          console.log('[HomeScreen] User participations:', userParticipations.length);
        } catch (error) {
          console.error('[HomeScreen] Error loading participations:', error);
        }
      }
      
      // Filter out missions user has already applied to or completed
      const appliedMissionIds = new Set(userParticipations.map(p => p.missionId));
      const availableMissions = allMissions.filter(m => !appliedMissionIds.has(m.id));
      
      // Recommended missions (only show missions not yet applied to)
      setMissions(availableMissions.slice(0, 5));
      
      // Active missions (applied/in-progress - not yet approved)
      const activePending = userParticipations
        .filter(p => p.status === 'PENDING')
        .map(p => {
          const mission = allMissions.find(m => m.id === p.missionId);
          return mission ? { ...mission, participation: p } : null;
        })
        .filter(Boolean);
      
      setActiveMissions(activePending as any);
      console.log('[HomeScreen] Active missions:', activePending.length);
      
      // Completed missions (approved)
      const completedApproved = userParticipations
        .filter(p => p.status === 'APPROVED')
        .map(p => {
          const mission = allMissions.find(m => m.id === p.missionId);
          return mission ? { ...mission, participation: p } : null;
        })
        .filter(Boolean);
      
      setCompletedMissions(completedApproved as any);
      console.log('[HomeScreen] Completed missions:', completedApproved.length);
    } catch (error) {
      console.error('[HomeScreen] Error loading missions:', error);
      setErrorMissions('Failed to load missions');
    } finally {
      setLoadingMissions(false);
    }
  };

  const loadMeetups = async () => {
    if (!userProfile) return;
    
    setLoadingMeetups(true);
    setErrorMeetups(null);
    try {
      if (userProfile.currentCity) {
        const recommended = await getRecommendedMeetups(
          userProfile as any,
          { latitude: 48.1351, longitude: 11.5820 } // Mock location
        );
        setMeetups(recommended.slice(0, 3));
      }
    } catch (error) {
      console.error('[HomeScreen] Error loading meetups:', error);
      setErrorMeetups('Failed to load meetups');
    } finally {
      setLoadingMeetups(false);
    }
  };

  const loadEvents = async () => {
    if (!userProfile?.city) {
      setLoadingEvents(false);
      return;
    }
    
    setLoadingEvents(true);
    setErrorEvents(null);
    try {
      const cityEvents = await getEventsForCity(userProfile.city);
      // Filter to today's events
      const today = new Date().toISOString().split('T')[0];
      const todayEvents = cityEvents.filter(event => {
        const eventDate = event.date.split('T')[0];
        return eventDate === today;
      });
      setEvents(todayEvents.slice(0, 5));
    } catch (error) {
      console.error('[HomeScreen] Error loading events:', error);
      setErrorEvents('Failed to load events');
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => {
    if (!userProfile) return;

    // Load user progression (XP, level, badges, streaks)
    loadProgression();

    // Load missions
    loadMissions();

    // Load meetups
    loadMeetups();

    // Load events
    loadEvents();

    // Check if daily streak can be claimed
    const canClaim = canClaimToday(userProfile.lastStreakRewardClaimed);
    setDailyStreakClaimed(!canClaim);

    // Get user's current location
    const loadLocation = async () => {
      try {
        const location = await getCurrentLocation();
        if (location) {
          setUserLocation({ latitude: location.latitude, longitude: location.longitude });
        }
      } catch (error) {
        console.error('[HomeScreen] Error getting location:', error);
      }
    };
    loadLocation();

    // Load trending businesses
    const loadBusinesses = async () => {
      if (!userProfile.city) {
        setLoadingBusinesses(false);
        return;
      }
      
      setLoadingBusinesses(true);
      setErrorBusinesses(null);
      try {
        // Get businesses from mock store that match user's city
        const allBusinesses = store.getUsers().filter(
          (u) => u.role === UserRole.BUSINESS && u.currentCity === userProfile.city
        );
        
        console.log('[HomeScreen] Found businesses:', allBusinesses.length);
        // Temporarily store as empty until we create proper business service
        setBusinesses([]);
      } catch (error) {
        console.error('[HomeScreen] Error loading businesses:', error);
        setErrorBusinesses('Failed to load trending places');
      } finally {
        setLoadingBusinesses(false);
      }
    };

    loadBusinesses();
  }, [userProfile]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleMissionClick = (mission: Mission) => {
    if (onNavigate) {
      onNavigate('MissionDetail', { missionId: mission.id });
    }
  };

  const handleEventClick = (event: Event) => {
    if (onNavigate) {
      onNavigate('EventDetail', { eventId: event.id });
    }
  };

  const handleBusinessClick = (business: BusinessProfile) => {
    if (onNavigate) {
      onNavigate('BusinessProfile', { businessId: business.id });
    }
  };

  const handleViewAllMissions = () => {
    if (onNavigate) {
      onNavigate('Missions');
    }
  };

  const handleViewAllEvents = () => {
    if (onNavigate) {
      onNavigate('Events');
    }
  };

  const handleViewAllBusinesses = () => {
    if (onNavigate) {
      onNavigate('Discover');
    }
  };

  const handleClaimStreakRewards = async () => {
    if (claimingStreak || !userProfile) return;
    
    setClaimingStreak(true);
    try {
      const points = await claimStreakRewards(userProfile.id);
      if (points > 0) {
        alert(`🎉 Claimed ${points} streak points!`);
        setUnclaimedStreakRewards(0);
        // Reload gamification data
        const gamificationData = await getUserGamification(userProfile.id);
        if (gamificationData) {
          const unclaimed = gamificationData.streakRewards?.filter(r => !r.claimed).length || 0;
          setUnclaimedStreakRewards(unclaimed);
        }
      }
    } catch (error) {
      console.error('Error claiming streak rewards:', error);
    } finally {
      setClaimingStreak(false);
    }
  };

  const handleClaimDailyStreak = async () => {
    if (!userProfile?.id) return { success: false, message: 'No user ID' };
    
    try {
      const result = await claimDailyStreakReward(userProfile.id);
      
      if (result.success) {
        // Track analytics event
        trackDailyStreakClaimed(
          result.streak || 0,
          result.pointsAwarded || 0,
          result.milestoneReached ? 'Yes' : 'No'
        );
        
        setDailyStreakClaimed(true);
      }
      
      return result;
    } catch (error) {
      console.error('[HomeScreen] Error claiming daily streak:', error);
      return { success: false, message: t('home.errorClaimingStreak') };
    }
  };

  const handleQuickAction = (action: string) => {
    if (!onNavigate) return;
    
    switch (action) {
      case 'nearby':
        onNavigate('Missions', { filter: 'nearby' });
        break;
      case 'rewards':
        onNavigate('Rewards');
        break;
      case 'meetup':
        onNavigate('Events');
        break;
      case 'share':
        // Open share modal
        alert('Share & Earn feature coming soon!');
        break;
    }
  };

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (authLoading || !userProfile) {
    return (
      <div className="min-h-screen bg-[#F8F9FE] flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-[#F72585] animate-spin mx-auto mb-4" />
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-[#F8F9FE] pb-20 overflow-y-auto relative"
      style={{ touchAction: 'pan-y' }}
    >
      {/* Pull to Refresh Indicator */}
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        threshold={80}
        isRefreshing={isRefreshing}
      />

      {/* Hero Section with Streak */}
      <div className="bg-gradient-to-r from-[#F72585] to-[#7209B7] text-white p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-1">
              {t('home.welcomeBack')}, {userProfile.name || t('home.guest')} 👋
            </h1>
            {userProfile.city && (
              <p className="text-white/90 text-sm flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {userProfile.city}
              </p>
            )}
          </div>
          {/* Daily Login Streak */}
          <button
            onClick={() => setShowXPClaimModal(true)}
            className={`bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2 transition-all ${
              !dailyStreakClaimed
                ? 'hover:bg-white/30 cursor-pointer ring-2 ring-yellow-300 animate-pulse' 
                : 'cursor-default opacity-75'
            }`}
          >
            <Flame className={`w-5 h-5 ${!dailyStreakClaimed ? 'text-orange-400' : 'text-orange-200'}`} />
            <div className="text-right">
              <div className="text-xl font-bold">{userProfile.loginStreak || 0}</div>
              <div className="text-xs text-white/80">
                {dailyStreakClaimed 
                  ? t('home.streakClaimedToday')
                  : 'Tap to claim!'
                }
              </div>
            </div>
          </button>
        </div>
        
        {/* Points and Level */}
        <div className="flex items-center gap-3">
          <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-300" />
            <span className="font-semibold">{userPoints} pts</span>
          </div>
          <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-300" />
            <span className="font-semibold">{t('home.level')} {calculatedLevel}</span>
          </div>
        </div>

        {/* Points Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-white/80">{t('home.progressToLevel')} {calculatedLevel + 1}</span>
            <span className="text-white font-semibold">
              {Math.round(levelProgress.currentLevelPoints)} / {Math.round(levelProgress.nextLevelPoints)} pts
            </span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-yellow-300 to-orange-300 h-full rounded-full transition-all duration-500"
              style={{ width: `${levelProgress.progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="p-4 space-y-6 mt-4">
        
        {/* Quick Actions Bar */}
        <section>
          <div className="grid grid-cols-4 gap-3">
            <button
              onClick={() => handleQuickAction('nearby')}
              className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-2 border border-gray-100"
            >
              <div className="w-12 h-12 rounded-full bg-pink-50 flex items-center justify-center">
                <Navigation className="w-6 h-6 text-[#F72585]" />
              </div>
              <span className="text-xs font-semibold text-[#1E0E62] text-center">{t('home.findNearby')}</span>
            </button>
            
            <button
              onClick={() => handleQuickAction('rewards')}
              className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-2 border border-gray-100"
            >
              <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center">
                <Gift className="w-6 h-6 text-[#7209B7]" />
              </div>
              <span className="text-xs font-semibold text-[#1E0E62] text-center">{t('navigation.rewards')}</span>
            </button>
            
            <button
              onClick={() => handleQuickAction('meetup')}
              className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-2 border border-gray-100"
            >
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                <Users className="w-6 h-6 text-[#4361EE]" />
              </div>
              <span className="text-xs font-semibold text-[#1E0E62] text-center">Meetups</span>
            </button>
            
            <button
              onClick={() => handleQuickAction('share')}
              className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-2 border border-gray-100"
            >
              <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                <Share2 className="w-6 h-6 text-[#06D6A0]" />
              </div>
              <span className="text-xs font-semibold text-[#1E0E62] text-center">Share</span>
            </button>
          </div>
        </section>

        {/* Gamification Actions */}
        <section>
          <div className="grid grid-cols-2 gap-3">
            {/* Daily Challenges Button */}
            <button
              onClick={() => setShowChallengesModal(true)}
              className="bg-gradient-to-r from-[#F72585] to-[#7209B7] text-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Target className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold">{t('home.dailyChallenges')}</div>
                  <div className="text-xs text-white/80">{t('home.earnBonusXp')}</div>
                </div>
              </div>
              <ArrowRight className="w-5 h-5" />
            </button>

            {/* Leaderboard Button */}
            <button
              onClick={() => setShowLeaderboardModal(true)}
              className="bg-gradient-to-r from-[#FFC300] to-[#F72585] text-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Trophy className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold">{t('home.leaderboard')}</div>
                  <div className="text-xs text-white/80">{t('home.seeYourRank')}</div>
                </div>
              </div>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </section>

        {/* Nearby Businesses Section - Proximity Check-ins */}
        {userLocation && (
          <section>
            <NearbyBusinesses
              userId={userProfile.id}
              userLatitude={userLocation.latitude}
              userLongitude={userLocation.longitude}
              onBusinessClick={(businessId) => {
                if (onNavigate) {
                  onNavigate('BusinessProfile', { businessId });
                }
              }}
            />
          </section>
        )}

        {/* Active Missions Widget */}
        {activeMissions.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#F72585]" />
                <h2 className="text-lg font-bold text-[#1E0E62]">{t('missions.activeMissions')}</h2>
              </div>
            </div>
            
            <div className="space-y-2">
              {activeMissions.map((mission) => (
                <div 
                  key={mission.id}
                  onClick={() => handleMissionClick(mission)}
                  className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-[#1E0E62] text-sm">{mission.title}</h3>
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
                      {t('missions.inProgress')}
                    </span>
                  </div>
                  {mission.location && typeof mission.location === 'string' && (
                    <p className="text-xs text-gray-500 mb-2">{mission.location}</p>
                  )}
                  
                  {/* Mock Progress Bar */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-[#F72585] to-[#7209B7] h-full rounded-full"
                        style={{ width: '35%' }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-600">35%</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Completed Missions Widget */}
        {completedMissions.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h2 className="text-lg font-bold text-[#1E0E62]">{t('missions.completed')}</h2>
              </div>
            </div>
            
            <div className="space-y-2">
              {completedMissions.slice(0, 3).map((mission) => (
                <div 
                  key={mission.id}
                  onClick={() => handleMissionClick(mission)}
                  className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-[#1E0E62] text-sm">{mission.title}</h3>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      {t('missions.completed')}
                    </span>
                  </div>
                  {mission.location && typeof mission.location === 'string' && (
                    <p className="text-xs text-gray-500 mb-2">{mission.location}</p>
                  )}
                  
                  {/* Points Earned */}
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="font-semibold text-green-600">+{mission.reward?.points || 0} points earned</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Upcoming Meetups Widget */}
        {loadingMeetups ? (
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#4361EE]" />
                <h2 className="text-lg font-bold text-[#1E0E62]">{t('home.meetupsForYou')}</h2>
              </div>
            </div>
            <div className="overflow-x-auto -mx-4 px-4">
              <div className="flex gap-3 pb-2">
                <div className="flex-shrink-0 w-64">
                  <SkeletonList count={3} />
                </div>
              </div>
            </div>
          </section>
        ) : meetups.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#4361EE]" />
                <h2 className="text-lg font-bold text-[#1E0E62]">{t('home.meetupsForYou')}</h2>
              </div>
              <button
                onClick={() => onNavigate?.('Events')}
                className="text-sm text-[#4361EE] font-semibold hover:underline"
              >
                {t('common.seeAll')}
              </button>
            </div>
            
            <div className="overflow-x-auto -mx-4 px-4">
              <div className="flex gap-3 pb-2">
                {meetups.map((meetup) => (
                  <MeetupPreviewCard
                    key={meetup.id}
                    meetup={meetup}
                    onClick={() => onNavigate?.('MeetupDetail', { meetupId: meetup.id })}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Recent Activity Feed */}
        {recentActivity.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-[#FFC300]" />
              <h2 className="text-lg font-bold text-[#1E0E62]">{t('home.recentActivity')}</h2>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-100 shadow-sm divide-y divide-gray-100">
              {recentActivity.map((activity, idx) => (
                <div key={idx} className="p-3 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    activity.type === 'mission' ? 'bg-pink-50' :
                    activity.type === 'reward' ? 'bg-purple-50' :
                    activity.type === 'meetup' ? 'bg-blue-50' :
                    'bg-yellow-50'
                  }`}>
                    <activity.icon className={`w-5 h-5 ${
                      activity.type === 'mission' ? 'text-[#F72585]' :
                      activity.type === 'reward' ? 'text-[#7209B7]' :
                      activity.type === 'meetup' ? 'text-[#4361EE]' :
                      'text-[#FFC300]'
                    }`} />
                  </div>
                  
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#1E0E62]">{activity.title}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                  
                  {activity.points != null && activity.points !== 0 && (
                    <div className={`text-sm font-bold ${
                      activity.points > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {activity.points > 0 ? '+' : ''}{activity.points}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Achievements Showcase */}
        {progression && progression.badges && progression.badges.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[#FFC300]" />
                <h2 className="text-lg font-bold text-[#1E0E62]">Achievements</h2>
              </div>
              <button
                onClick={() => onNavigate?.('Profile')}
                className="text-sm text-[#FFC300] font-semibold hover:underline"
              >
                {t('common.viewAll')}
              </button>
            </div>
            
            <div className="bg-gradient-to-br from-[#FFC300]/10 to-[#F72585]/10 rounded-lg p-4 border border-[#FFC300]/20">
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2">
                {progression.badges.slice(0, 5).map((badge: any, idx: number) => (
                  <div key={idx} className="flex-shrink-0 text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FFC300] to-[#F72585] flex items-center justify-center mb-2 shadow-lg">
                      <Award className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-xs font-semibold text-[#1E0E62] w-16 truncate">
                      {badge.name || t('common.badge')}
                    </p>
                  </div>
                ))}
              </div>
              
              {progression.badges.length > 5 && (
                <p className="text-xs text-center text-gray-600 mt-2">
                  {t('common.moreBadges', { count: progression.badges.length - 5 })}
                </p>
              )}
            </div>
          </section>
        )}
        
        {/* AI-Powered Recommendations Section */}
        <section>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#F72585]" />
                <h2 className="text-lg font-bold text-[#1E0E62]">{t('home.forYou')}</h2>
              </div>
              <button
                onClick={handleViewAllMissions}
                className="text-sm text-[#F72585] font-semibold hover:underline"
              >
                {t('common.viewAll')}
              </button>
            </div>
            <p className="text-xs text-[#8F8FA3] ml-7">
              {t('home.aiCuratedMissions')}
            </p>
          </div>

          {loadingMissions ? (
            <div className="space-y-3">
              <SkeletonMissionCard />
              <SkeletonMissionCard />
              <SkeletonMissionCard />
            </div>
          ) : errorMissions ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-700 text-sm">{errorMissions}</p>
            </div>
          ) : missions.length === 0 ? (
            <div className="bg-white rounded-lg p-6 text-center">
              <p className="text-gray-500">{t('home.noMissionsAvailable')}</p>
              <p className="text-xs text-gray-400 mt-1">{t('home.checkBackSoon')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {missions.slice(0, 3).map((mission) => (
                <MissionCard
                  key={mission.id}
                  mission={mission}
                  onClick={() => handleMissionClick(mission)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Today's Events Section */}
        {events.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#7209B7]" />
                <h2 className="text-lg font-bold text-[#1E0E62]">Today's Events</h2>
              </div>
              <button
                onClick={handleViewAllEvents}
                className="text-sm text-[#7209B7] font-semibold hover:underline"
              >
                View All
              </button>
            </div>

            {loadingEvents ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="w-6 h-6 text-[#7209B7] animate-spin" />
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 px-4">
                <div className="flex space-x-3 pb-2">
                  {events.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onClick={() => handleEventClick(event)}
                    />
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Trending Places Section */}
        {businesses.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#FFC300]" />
                <h2 className="text-lg font-bold text-[#1E0E62]">Trending Places</h2>
              </div>
              <button
                onClick={handleViewAllBusinesses}
                className="text-sm text-[#FFC300] font-semibold hover:underline"
              >
                Discover
              </button>
            </div>

            {loadingBusinesses ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="w-6 h-6 text-[#FFC300] animate-spin" />
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 px-4">
                <div className="flex space-x-3 pb-2">
                  {businesses.map((business) => (
                    <BusinessCard
                      key={business.id}
                      business={business}
                      onClick={() => handleBusinessClick(business)}
                    />
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </div>

      {/* Gamification Modals */}
      <DailyChallengesModal 
        isOpen={showChallengesModal} 
        onClose={() => setShowChallengesModal(false)} 
      />
      <LeaderboardModal 
        isOpen={showLeaderboardModal} 
        onClose={() => setShowLeaderboardModal(false)} 
      />
      
      {/* Daily XP Claim Modal */}
      <DailyXPClaimModal
        isOpen={showXPClaimModal}
        onClose={() => setShowXPClaimModal(false)}
        onClaim={handleClaimDailyStreak}
        currentStreak={userProfile?.loginStreak || 0}
        canClaim={!dailyStreakClaimed && canClaimToday(userProfile?.lastStreakRewardClaimed)}
      />
    </div>
  );
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Event Card Component (Horizontal scrolling)
 */
const EventCard: React.FC<{
  event: Event;
  onClick: () => void;
}> = ({ event, onClick }) => {
  const { t } = useTranslation();
  const eventTime = new Date(event.date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  return (
    <div
      onClick={onClick}
      className="flex-shrink-0 w-64 bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-center space-x-2 mb-2">
        <Calendar className="w-4 h-4 text-[#7209B7]" />
        <span className="text-xs text-gray-500">{eventTime}</span>
      </div>
      <h3 className="font-bold text-[#1E0E62] mb-1 line-clamp-1">
        {event.title}
      </h3>
      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
        {event.description || t('meetups.joinUsForEvent', 'Join us for this event!')}
      </p>
      <div className="flex items-center justify-between text-xs">
        {event.isCreatorEvent && (
          <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">
            {t('meetups.creatorEvent', 'Creator Event')}
          </span>
        )}
        {event.attendeeCount !== undefined && (
          <span className="text-gray-500">
            {event.attendeeCount} {t('meetups.attending', 'attending')}
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * Meetup Preview Card Component (Horizontal scrolling)
 */
const MeetupPreviewCard: React.FC<{
  meetup: Meetup;
  onClick: () => void;
}> = ({ meetup, onClick }) => {
  const { t } = useTranslation();
  const meetupDate = new Date(meetup.startTime);
  const now = new Date();
  const isToday = meetupDate.toDateString() === now.toDateString();
  const isTomorrow = meetupDate.toDateString() === new Date(now.getTime() + 86400000).toDateString();
  
  const timeString = meetupDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  
  const dateLabel = isToday ? t('common.today') : isTomorrow ? t('common.tomorrow') : meetupDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div
      onClick={onClick}
      className="flex-shrink-0 w-72 bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-[#4361EE]" />
            <span className="text-xs font-semibold text-[#4361EE]">{meetup.category}</span>
          </div>
          <h3 className="font-bold text-[#1E0E62] text-sm line-clamp-1">
            {meetup.title}
          </h3>
        </div>
        {meetup.participants && (
          <div className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs font-semibold">
            {meetup.participants.length}/{meetup.capacity}
          </div>
        )}
      </div>
      
      <p className="text-xs text-gray-600 mb-3 line-clamp-2">
        {meetup.description}
      </p>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Clock className="w-3 h-3" />
          <span>{dateLabel} at {timeString}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <MapPin className="w-3 h-3" />
          <span className="line-clamp-1">{meetup.location.address}</span>
        </div>
      </div>
      
      {meetup.businessName && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#F72585] to-[#7209B7] flex items-center justify-center text-white text-xs font-bold">
            {meetup.businessName.charAt(0)}
          </div>
          <span className="text-xs text-gray-600">Hosted by {meetup.businessName}</span>
        </div>
      )}
    </div>
  );
};

/**
 * Business Card Component (Horizontal scrolling)
 */
const BusinessCard: React.FC<{
  business: BusinessProfile;
  onClick: () => void;
}> = ({ business, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="flex-shrink-0 w-48 bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="h-32 bg-gradient-to-br from-[#FFC300] to-[#F72585]" />
      <div className="p-3">
        <h3 className="font-bold text-[#1E0E62] text-sm mb-1 line-clamp-1">
          {business.name}
        </h3>
        <p className="text-xs text-gray-500 mb-2">
          {business.category}
        </p>
        {business.rating && (
          <div className="flex items-center space-x-1">
            <span className="text-yellow-500">⭐</span>
            <span className="text-xs font-semibold">{business.rating.toFixed(1)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// DATA FLOW EXPLANATION
// ============================================================================

/**
 * DATA FLOW IN HOMESCREEN:
 * 
 * 1. INITIALIZATION:
 *    - Component mounts and useAuth() hook provides userProfile from AuthContext
 *    - If no userProfile, shows loading spinner
 * 
 * 2. DATA LOADING (useEffect triggered when userProfile changes):
 *    a) Missions:
 *       - Calls getMissionsForUser(userProfile) from missionService
 *       - Service queries Firestore: filters by city, level, creator mode
 *       - If user has creatorMode, includes creator-specific missions
 *       - Returns Mission[] array with skill matching already applied
 *       - Component takes top 5 and stores in state
 * 
 *    b) Events:
 *       - Calls getEventsForCity(userProfile.city) from eventService
 *       - Service queries Firestore: where city = user.city
 *       - Filters to UPCOMING/ONGOING status
 *       - Component filters to today's date only
 *       - Stores top 5 in state
 * 
 *    c) Businesses:
 *       - Calls getTrendingBusinessesForCity(city) (currently stubbed)
 *       - When implemented, will query businesses collection
 *       - Order by rating/popularity
 *       - Returns BusinessProfile[] array
 * 
 * 3. RENDERING:
 *    - Each section renders independently with its own loading/error states
 *    - Mission cards show in vertical list
 *    - Event and Business cards scroll horizontally
 *    - Empty states shown when no data available
 * 
 * 4. USER INTERACTIONS:
 *    - Clicking cards calls onNavigate() callback with route params
 *    - "View All" buttons navigate to full screen versions
 *    - Parent component (App.tsx) handles actual navigation
 * 
 * 5. TYPE SAFETY:
 *    - All data typed with models from src/types/models.ts
 *    - UserProfile, Mission, Event, BusinessProfile interfaces
 *    - TypeScript enforces correct prop types throughout
 * 
 * 6. ERROR HANDLING:
 *    - Each data fetch wrapped in try/catch
 *    - Errors stored in separate state variables
 *    - UI shows error messages with AlertCircle icon
 *    - Non-blocking: one section failing doesn't break others
 */
