import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, TrendingUp, Sparkles, Filter, List, Map as MapIcon, Star, Award, Clock, Navigation, MessageCircle, SlidersHorizontal } from 'lucide-react';
import { MobileFilterDrawer } from './MobileFilterDrawer';
import { Meetup, MeetupCategory, User, PassportStamp } from '../types';
import { getRecommendedMeetups, getTrendingMeetups, getMeetupsByCategory } from '../services/meetupService';
import { useAuth } from '../services/AuthContext';
import { useToast } from '../hooks/useToast';
import { MeetupDetailModal } from './MeetupDetailModal';
import { MeetupSummaryModal } from './MeetupSummaryModal';
import { PassportStampsModal } from './PassportStampsModal';
import { UserStatsBar } from './UserStatsBar';
import { PremiumEvents } from './PremiumEvents';
import { useGeolocation } from '../hooks/useLocation';
import { getUserProgression } from '../services/progressionService';
import { createNotification } from '../services/notificationService';
import { getUsersByRole } from '../services/userService';
import { UserRole } from '../types';
import { findBusinessMatchesForMeetup } from '../services/openaiService';
import { SkeletonLoader, PullToRefresh } from './SkeletonLoader';
import { useTranslation } from 'react-i18next';
import { collection, getDocs, query, where, orderBy, limit, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/AuthContext';
import { createConversation, getConversationData } from '../services/conversationService';
import { 
  findOrCreateCustomerSquad, 
  getSquadMembers, 
  getSquadMeetups,
  confirmMeetupAttendance,
  CustomerSquad,
  SquadMember,
  SquadMeetup
} from '../services/customerSquadService';

type ViewMode = 'list' | 'map';
type InternalTab = 'squads' | 'collaborate' | 'events';
type MeetupTypeFilter = 'ALL' | 'CREATOR' | 'COMMUNITY' | 'PARTNER' | 'ONLINE';
type DateFilter = 'TODAY' | 'THIS_WEEK' | 'CHOOSE_DATE' | 'ALL';

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

interface MeetupsScreenProps {
  initialTab?: InternalTab;
  onOpenChat?: (chatId: string) => void;
}

export function MeetupsScreen({ initialTab, onOpenChat }: MeetupsScreenProps = {}) {
  const { user, userProfile } = useAuth();
  const { showToast } = useToast();
  const { location } = useGeolocation();
  const { t } = useTranslation();
  const [internalTab, setInternalTab] = useState<InternalTab>(initialTab || 'events');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedCategory, setSelectedCategory] = useState<MeetupCategory | 'ALL'>('ALL');
  const [meetupTypeFilter, setMeetupTypeFilter] = useState<MeetupTypeFilter>('ALL');
  const [dateFilter, setDateFilter] = useState<DateFilter>('ALL');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [cityFilter, setCityFilter] = useState<string>('');
  const [meetups, setMeetups] = useState<Meetup[]>([]);
  const [userJoinedMeetups, setUserJoinedMeetups] = useState<Meetup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMeetup, setSelectedMeetup] = useState<Meetup | null>(null);
  const [summaryMeetup, setSummaryMeetup] = useState<Meetup | null>(null);
  const [showPassport, setShowPassport] = useState(false);
  const [collectedStamps, setCollectedStamps] = useState<PassportStamp[]>([]);
  const [requestingAI, setRequestingAI] = useState(false);
  const [showFindCollaborators, setShowFindCollaborators] = useState(false);
  
  // Squad state
  const [customerSquad, setCustomerSquad] = useState<CustomerSquad | null>(null);
  const [squadMembers, setSquadMembers] = useState<SquadMember[]>([]);
  const [squadMeetups, setSquadMeetups] = useState<SquadMeetup[]>([]);
  const [loadingSquad, setLoadingSquad] = useState(false);
  const [genderPreference, setGenderPreference] = useState<'all-girls' | 'mixed'>('mixed');

  // Real collaboration data from Firestore
  const [collabOffers, setCollabOffers] = useState<any[]>([]);
  const [creatorRequests, setCreatorRequests] = useState<any[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);

  // Load collaboration data
  const loadCollaborationData = async () => {
    if (!userProfile) return;

    try {
      const userCity = userProfile.currentCity || location?.city;
      
      let offersCount = 0;
      let requestsCount = 0;
      let usersCount = 0;
      
      // Load collaboration offers (only if we have a city)
      if (userCity) {
        const offersQuery = query(
          collection(db, 'collaboration_offers'),
          where('status', '==', 'open'),
          where('city', '==', userCity),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
        const offersSnapshot = await getDocs(offersQuery);
        const offers = offersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCollabOffers(offers);
        offersCount = offers.length;
      } else {
        setCollabOffers([]);
      }

      // Load collaboration requests (for creators)
      if (userProfile.creatorMode) {
        const requestsQuery = query(
          collection(db, 'collaboration_requests'),
          where('receiverId', '==', userProfile.id),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
        const requestsSnapshot = await getDocs(requestsQuery);
        const requests = requestsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCreatorRequests(requests);
        requestsCount = requests.length;
      }

      // Load suggested users (only if we have a city)
      if (userCity) {
        const usersQuery = query(
          collection(db, 'users'),
          where('currentCity', '==', userCity),
          limit(20)
        );
        const usersSnapshot = await getDocs(usersQuery);
        const users = usersSnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter(u => u.id !== userProfile.id)
          .slice(0, 4);
        setSuggestedUsers(users);
        usersCount = users.length;
      } else {
        setSuggestedUsers([]);
      }

      console.log('[MeetupsScreen] Loaded collaboration data:', {
        city: userCity,
        offers: offersCount,
        requests: requestsCount,
        users: usersCount
      });
    } catch (error) {
      console.error('[MeetupsScreen] Error loading collaboration data:', error);
    }
  };

  useEffect(() => {
    loadMeetups();
    loadUserStamps();
    loadCollaborationData();
  }, [meetupTypeFilter, dateFilter, selectedCategory, userProfile]);

  useEffect(() => {
    // Set initial city filter from location or user profile
    if (!cityFilter && (location?.city || userProfile?.currentCity)) {
      setCityFilter(location?.city || userProfile?.currentCity || '');
    }
  }, [location, userProfile]);

  useEffect(() => {
    if (internalTab === 'squads' && userProfile?.id) {
      loadSquadData();
    }
  }, [internalTab, userProfile?.id, genderPreference]);

  const loadSquadData = async () => {
    if (!userProfile?.id) return;
    
    console.log('[MeetupsScreen] 🔄 Loading squad data for user:', userProfile.name, 'preference:', genderPreference);
    setLoadingSquad(true);
    try {
      // Find or create squad with gender preference
      const squad = await findOrCreateCustomerSquad(userProfile.id, genderPreference);
      console.log('[MeetupsScreen] 📦 Received squad:', squad);
      if (squad) {
        setCustomerSquad(squad);
        console.log('[MeetupsScreen] 👥 Loading squad members...');
        
        // Load squad members
        const members = await getSquadMembers(squad.members);
        console.log('[MeetupsScreen] ✅ Loaded', members.length, 'members:', members.map(m => m.name));
        setSquadMembers(members);
        
        // Load squad meetups
        const meetups = await getSquadMeetups(squad.id);
        console.log('[MeetupsScreen] 📅 Loaded', meetups.length, 'meetups');
        setSquadMeetups(meetups);
      } else {
        console.log('[MeetupsScreen] ⚠️ No squad returned from service');
      }
    } catch (error) {
      console.error('[MeetupsScreen] ❌ Error loading squad data:', error);
      showToast('Failed to load squad data', 'error');
    } finally {
      console.log('[MeetupsScreen] ✅ Squad loading complete');
      setLoadingSquad(false);
    }
  };

  const handleConfirmAttendance = async (meetupId: string) => {
    if (!customerSquad || !userProfile?.id) return;
    
    const success = await confirmMeetupAttendance(customerSquad.id, meetupId, userProfile.id);
    if (success) {
      showToast('Attendance confirmed!', 'success');
      loadSquadData(); // Reload to get updated data
    } else {
      showToast('Failed to confirm attendance', 'error');
    }
  };

  const handleOpenSquadChat = async () => {
    if (!customerSquad || !userProfile?.id || !squadMembers.length) return;
    
    let chatId = customerSquad.chatId;
    
    // Check if conversation exists (could have chatId but conversation was deleted)
    if (chatId) {
      const existingConversation = await getConversationData(chatId);
      if (!existingConversation) {
        console.log('⚠️ Chat ID exists but conversation missing, recreating...');
        chatId = null; // Force recreation
      }
    }
    
    // Create group chat if it doesn't exist
    if (!chatId) {
      console.log('🆕 Creating squad group chat with members:', squadMembers.map(m => m.name));
      
      const participantIds = squadMembers.map(m => m.id);
      const participantNames: Record<string, string> = {};
      const participantAvatars: Record<string, string> = {};
      const participantRoles: Record<string, string> = {};
      
      squadMembers.forEach(member => {
        participantNames[member.id] = member.name;
        participantAvatars[member.id] = member.avatarUrl || '';
        participantRoles[member.id] = 'CUSTOMER';
      });
      
      // Create the conversation in Firestore
      chatId = await createConversation(
        participantIds,
        participantNames,
        participantAvatars,
        participantRoles,
        `${customerSquad.city} Squad Chat`
      );
      
      console.log('✅ Created group chat:', chatId);
      
      // Update squad with chatId
      await updateDoc(doc(db, 'customerSquads', customerSquad.id), {
        chatId: chatId
      });
    }
    
    // Open chat in inbox
    if (onOpenChat) {
      onOpenChat(chatId);
    }
  };

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
        'squad', // Current context (using 'squad' as default for matching)
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
      // Load real meetups from Firestore
      const realMeetups: Meetup[] = [];
      try {
        const meetupsQuery = query(
          collection(db, 'meetups'),
          where('status', '==', 'upcoming'),
          orderBy('startTime', 'asc'),
          limit(50)
        );
        const meetupsSnapshot = await getDocs(meetupsQuery);
        
        meetupsSnapshot.forEach(doc => {
          realMeetups.push({
            id: doc.id,
            ...doc.data()
          } as Meetup);
        });
        
        console.log('[MeetupsScreen] Loaded real meetups:', realMeetups.length);
      } catch (error) {
        console.error('[MeetupsScreen] Error loading meetups:', error);
      }
      
      // Load admin events from Firestore
      const adminEvents: Meetup[] = [];
      try {
        console.log('[MeetupsScreen] Loading admin events from Firestore...');
        console.log('[MeetupsScreen] User role:', userProfile?.role);
        console.log('[MeetupsScreen] User subscription:', userProfile?.subscriptionLevel);
        
        // Try simple query first without orderBy to avoid index issues
        const eventsQuery = query(
          collection(db, 'adminEvents'),
          where('status', '==', 'PUBLISHED')
        );
        const eventsSnapshot = await getDocs(eventsQuery);
        
        console.log('[MeetupsScreen] Found events:', eventsSnapshot.size);
        
        eventsSnapshot.forEach(doc => {
          const event = doc.data();
          console.log('[MeetupsScreen] Event data:', {
            id: doc.id,
            title: event.title,
            targetAudience: event.targetAudience,
            type: event.type,
            status: event.status
          });
          
          // Check if event matches user's target audience
          const isTargeted = 
            event.targetAudience === 'ALL' ||
            (event.targetAudience === 'BUSINESSES' && userProfile?.role === 'BUSINESS') ||
            (event.targetAudience === 'CREATORS' && userProfile?.role !== 'BUSINESS') ||
            (event.targetAudience === 'PREMIUM' && ['GOLD', 'PLATINUM'].includes(userProfile?.subscriptionLevel || ''));
          
          console.log('[MeetupsScreen] Event targeted:', isTargeted, 'for audience:', event.targetAudience);
          
          if (isTargeted) {
            // Convert admin event to Meetup format
            adminEvents.push({
              id: doc.id,
              title: event.title,
              description: event.description,
              category: mapEventTypeToCategory(event.type),
              date: event.date,
              time: event.time,
              location: event.location,
              address: event.address || event.city,
              businessId: 'admin',
              businessName: 'Fluzio Events',
              businessLogo: '🎉',
              capacity: event.maxAttendees || 100,
              participants: [],
              businessIsPartner: true,
              partnerPriority: 100, // High priority for admin events
              vibeTags: [event.type, event.duration || '1-day'],
              image: event.imageUrl,
              startTime: event.time || '',
              endTime: event.endTime || '',
              levelRequired: 1,
              missions: [],
              hostId: 'admin',
              photos: [],
              isPremium: false,
              isPartnerEvent: true,
              attendees: [],
              createdAt: event.createdAt || new Date().toISOString(),
              xpReward: 0,
              status: 'UPCOMING' as const,
              aiGenerated: false,
              distanceLimit: 10000,
              dynamicLocation: false,
              estimatedDuration: 60,
            } as unknown as Meetup);
          }
        });
        
        console.log('[MeetupsScreen] Loaded admin events:', adminEvents.length);
        console.log('[MeetupsScreen] Admin events:', adminEvents.map(e => ({ id: e.id, title: e.title, category: e.category })));
      } catch (error) {
        console.error('[MeetupsScreen] Error loading admin events:', error);
      }
      
      // Combine real meetups and admin events
      let allMeetups = [...realMeetups, ...adminEvents];
      console.log('[MeetupsScreen] Total meetups before filtering:', allMeetups.length, '(real:', realMeetups.length, ', admin:', adminEvents.length, ')');
      
      // Filter by meetup type
      if (meetupTypeFilter !== 'ALL') {
        allMeetups = allMeetups.filter(m => {
          if (meetupTypeFilter === 'CREATOR' && userProfile?.creatorMode) return true;
          if (meetupTypeFilter === 'COMMUNITY') return !m.isPartnerEvent && m.capacity !== 4;
          if (meetupTypeFilter === 'PARTNER') return m.isPartnerEvent || m.businessIsPartner;
          if (meetupTypeFilter === 'ONLINE') return m.venue?.toLowerCase().includes('online');
          return true;
        });
      }

      // Filter by date
      if (dateFilter !== 'ALL') {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);

        allMeetups = allMeetups.filter(m => {
          const meetupDate = new Date(m.startTime);
          const meetupDay = new Date(meetupDate.getFullYear(), meetupDate.getMonth(), meetupDate.getDate());
          
          if (dateFilter === 'TODAY') return meetupDay.getTime() === today.getTime();
          if (dateFilter === 'THIS_WEEK') return meetupDay <= nextWeek;
          return true;
        });
      }
      
      // Filter by category if selected
      if (selectedCategory !== 'ALL') {
        allMeetups = allMeetups.filter(m => m.category === selectedCategory);
      }

      // Sort by partner priority first (featured), then by date
      allMeetups.sort((a, b) => {
        const priorityA = a.partnerPriority || 0;
        const priorityB = b.partnerPriority || 0;
        if (priorityA !== priorityB) return priorityB - priorityA;
        
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
      });

      setMeetups(allMeetups);

      // Get user's joined meetups (filter from all meetups)
      const joined = allMeetups.filter(m => 
        m.participants.includes(userProfile?.id || '') || 
        m.attendees?.includes(userProfile?.id || '')
      );
      setUserJoinedMeetups(joined);
    } catch (error) {
      showToast('Failed to load meetups', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to map event type to meetup category
  const mapEventTypeToCategory = (eventType: string): MeetupCategory => {
    const mapping: Record<string, MeetupCategory> = {
      'NETWORKING': 'BUSINESS',
      'WORKSHOP': 'BUSINESS',
      'CONFERENCE': 'BUSINESS',
      'TRAINING': 'BUSINESS',
      'RETREAT': 'WELLNESS',
      'BOOTCAMP': 'FITNESS',
      'CAMP': 'WELLNESS',
      'MEETUP': 'COFFEE',
      'SOCIAL': 'NIGHTLIFE'
    };
    return mapping[eventType] || 'BUSINESS';
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

  // Helper: Group meetups by date
  const groupMeetupsByDate = (meetups: Meetup[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const groups: { label: string; meetups: Meetup[] }[] = [
      { label: 'Today', meetups: [] },
      { label: 'Tomorrow', meetups: [] },
      { label: 'This Week', meetups: [] },
      { label: 'Later', meetups: [] }
    ];

    meetups.forEach(meetup => {
      const meetupDate = new Date(meetup.startTime);
      const meetupDay = new Date(meetupDate.getFullYear(), meetupDate.getMonth(), meetupDate.getDate());

      if (meetupDay.getTime() === today.getTime()) {
        groups[0].meetups.push(meetup);
      } else if (meetupDay.getTime() === tomorrow.getTime()) {
        groups[1].meetups.push(meetup);
      } else if (meetupDay <= nextWeek) {
        groups[2].meetups.push(meetup);
      } else {
        groups[3].meetups.push(meetup);
      }
    });

    return groups.filter(g => g.meetups.length > 0);
  };

  // Helper: Get meetup type badge
  const getMeetupTypeBadge = (meetup: Meetup) => {
    if (meetup.isPartnerEvent) return { label: '🤝 Partner Event', color: 'bg-blue-100 text-blue-700' };
    if (meetup.capacity === 4) return { label: '👥 Squad-only', color: 'bg-purple-100 text-purple-700' };
    if (userProfile?.creatorMode) return { label: '✨ Creator Only', color: 'bg-cyan-100 text-cyan-700' };
    return { label: '🌟 Open to all', color: 'bg-green-100 text-green-700' };
  };

  // Helper: Get cost badge
  const getCostBadge = (meetup: Meetup) => {
    if (meetup.xpReward > 0) return `Free with ${meetup.xpReward} points`;
    if (meetup.isPremium) return 'VIP only';
    return 'Free';
  };

  // EventCard Component for new layout
  const EventCard = ({ meetup, onClick, onJoin, isFeatured = false, compact = false }: {
    meetup: Meetup;
    onClick: () => void;
    onJoin: () => void;
    isFeatured?: boolean;
    compact?: boolean;
  }) => {
    const typeBadge = getMeetupTypeBadge(meetup);
    const seatsLeft = meetup.capacity - meetup.participants.length;
    const isFull = seatsLeft === 0;

    return (
      <div
        onClick={onClick}
        className={`bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all cursor-pointer overflow-hidden ${
          isFeatured ? 'shadow-md' : ''
        } ${compact ? 'flex gap-4' : ''}`}
      >
        {/* Image */}
        {meetup.image && (
          <div className={`relative ${compact ? 'w-32 h-32 flex-shrink-0' : 'w-full h-48'}`}>
            <img
              src={meetup.image}
              alt={meetup.title}
              className="w-full h-full object-cover"
            />
            {isFeatured && (
              <div className="absolute top-2 left-2 px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center gap-1">
                <Star className="w-3 h-3" fill="currentColor" />
                Featured
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className={`p-4 ${compact ? 'flex-1' : ''}`}>
          {/* Title */}
          <h3 className={`font-bold text-gray-900 mb-2 ${compact ? 'text-base' : 'text-lg'}`}>
            {meetup.title}
          </h3>

          {/* Host */}
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <span className="text-gray-800 font-medium">
              Hosted by {meetup.businessIsPartner ? meetup.businessName : 'Fluzio'}
            </span>
          </div>

          {/* Date + Time */}
          <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>{formatTime(meetup.startTime)}</span>
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 text-sm text-gray-700 mb-3">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span className="truncate">{meetup.venue}</span>
          </div>

          {/* Badges Row */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {/* Type Badge */}
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${typeBadge.color}`}>
              {typeBadge.label}
            </span>

            {/* Cost Badge */}
            <span className="text-xs px-2 py-1 rounded-full font-medium bg-gray-100 text-gray-700">
              💰 {getCostBadge(meetup)}
            </span>

            {/* Spots Left */}
            {!isFull && seatsLeft <= 5 && (
              <span className="text-xs px-2 py-1 rounded-full font-medium bg-orange-100 text-orange-700">
                {seatsLeft} spots left
              </span>
            )}
          </div>

          {/* Tags */}
          {meetup.vibeTags && meetup.vibeTags.length > 0 && !compact && (
            <div className="flex gap-1 mb-3 flex-wrap">
              {meetup.vibeTags.slice(0, 3).map(tag => (
                <span key={tag} className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* CTA Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onJoin();
            }}
            disabled={isFull}
            className={`w-full py-2.5 rounded-lg font-semibold transition-all ${
              isFull
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 shadow-sm'
            }`}
          >
            {isFull ? 'Meetup Full' : meetup.xpReward > 0 ? 'Use Points' : 'Join'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-blue-50 via-cyan-50 to-sky-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-7 h-7 text-blue-600" />
              {t('meetups.title')}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              What can you join in {cityFilter || location?.city || userProfile?.currentCity || 'your city'}?
            </p>
          </div>
        </div>

        {/* Internal Tab Navigation - Segmented Control */}
        <div className="flex items-center gap-2 mb-4 bg-gradient-to-r from-blue-50 to-cyan-50 p-1.5 rounded-2xl border border-blue-100">
          <button
            onClick={() => setInternalTab('squads')}
            className={`flex-1 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
              internalTab === 'squads'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                : 'text-blue-600 hover:bg-white/70'
            }`}
          >
            Squads
          </button>
          <button
            onClick={() => setInternalTab('collaborate')}
            className={`flex-1 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
              internalTab === 'collaborate'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                : 'text-blue-600 hover:bg-white/70'
            }`}
          >
            Collaborate
          </button>
          <button
            onClick={() => setInternalTab('events')}
            className={`flex-1 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
              internalTab === 'events'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                : 'text-blue-600 hover:bg-white/70'
            }`}
          >
            Events
          </button>
        </div>

        {/* Filters removed with meetups tab */}
        {false && (
          <div className="space-y-3">
            {/* Mobile: Single Filter Button */}
            <div className="flex items-center gap-3 md:hidden">
              <button
                onClick={() => setShowFilters(true)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all"
              >
                <SlidersHorizontal className="w-5 h-5" />
                <span>Filters</span>
                {(meetupTypeFilter !== 'ALL' || dateFilter !== 'ALL' || cityFilter) && (
                  <span className="ml-1 px-2 py-0.5 bg-white/30 rounded-full text-xs">
                    Active
                  </span>
                )}
              </button>
              
              <button
                onClick={() => setShowPassport(true)}
                className="px-4 py-3 bg-white border-2 border-gray-200 rounded-xl font-semibold hover:border-[#00E5FF] transition-all flex items-center gap-2"
              >
                <span>🎫</span>
                <span className="hidden sm:inline">Passport</span>
                <span className="text-[#6C4BFF]">({collectedStamps.length}/10)</span>
              </button>
            </div>

            {/* Desktop: Inline Filters */}
            <div className="hidden md:flex items-center gap-3 flex-wrap">
              {/* City Filter */}
              <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl">
                <MapPin className="w-4 h-4 text-blue-600" />
                <input
                  type="text"
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  placeholder={location?.city || userProfile?.currentCity || 'Munich'}
                  className="text-sm font-medium outline-none bg-transparent w-32"
                />
              </div>

              {/* Date Filter */}
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium cursor-pointer hover:border-blue-400 transition-colors"
              >
                <option value="ALL">All dates</option>
                <option value="TODAY">Today</option>
                <option value="THIS_WEEK">This week</option>
                <option value="CHOOSE_DATE">Choose date...</option>
              </select>

              {/* Type Filter Chips */}
              <div className="flex items-center gap-2">
                {(['ALL', 'CREATOR', 'COMMUNITY', 'PARTNER', 'ONLINE'] as MeetupTypeFilter[]).map(type => (
                  <button
                    key={type}
                    onClick={() => setMeetupTypeFilter(type)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                      meetupTypeFilter === type
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {type === 'ALL' ? 'All Types' : 
                     type === 'CREATOR' ? '✨ Creator Event' :
                     type === 'COMMUNITY' ? '👥 Community' :
                     type === 'PARTNER' ? '🤝 Partner Event' :
                     '💻 Online'}
                  </button>
                ))}
              </div>

              {/* Passport Stamps Button */}
              <button
                onClick={() => setShowPassport(true)}
                className="ml-auto px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 shadow-sm flex items-center gap-1"
              >
                🎫 Passport ({collectedStamps.length}/10)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Content - Conditional rendering based on internal tab */}
      
      {/* Squads Tab Content */}
      {internalTab === 'squads' && (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto space-y-6">
            
            {/* Gender Preference Toggle */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">👥</div>
                  <div>
                    <div className="font-semibold text-gray-900">Squad Preference</div>
                    <p className="text-xs text-gray-600">Choose your squad type</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setGenderPreference('mixed')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      genderPreference === 'mixed'
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    🌈 Mixed Squad
                  </button>
                  {(userProfile?.gender === 'female' || userProfile?.gender === 'FEMALE') && (
                    <button
                      onClick={() => setGenderPreference('all-girls')}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        genderPreference === 'all-girls'
                          ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      👭 All-Girls Squad
                    </button>
                  )}
                </div>
              </div>
            </div>

            {loadingSquad ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
              </div>
            ) : !customerSquad ? (
              <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-200">
                <div className="text-5xl mb-4">👥</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Squad Yet</h3>
                <p className="text-gray-600 mb-4">
                  We're finding the perfect squad members for you in {userProfile?.currentCity || location?.city || 'your city'}
                </p>
                <button 
                  onClick={loadSquadData}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all"
                >
                  Find My Squad
                </button>
              </div>
            ) : (
              <>
                {/* Squad Header */}
                <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl p-6 text-white shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold mb-1">Your Squad</h2>
                      <p className="text-blue-100 text-sm">Connect with customers in {customerSquad.city}</p>
                      {customerSquad.genderPreference === 'all-girls' && (
                        <div className="flex items-center gap-1 mt-1 text-xs bg-cyan-500/30 rounded-full px-2 py-1 w-fit">
                          <span>👭</span>
                          <span>All-Girls Squad</span>
                        </div>
                      )}
                      {customerSquad.sharedInterests && customerSquad.sharedInterests.length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {customerSquad.sharedInterests.map((interest, idx) => (
                            <span key={idx} className="text-xs bg-white/20 rounded-full px-2 py-1">
                              ✨ {interest}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
                      <Users className="w-8 h-8" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🔥</span>
                      <div>
                        <div className="font-bold">{userProfile?.streak || 0} Days</div>
                        <div className="text-xs text-blue-100">Streak</div>
                      </div>
                    </div>
                    <div className="w-px h-10 bg-white/30"></div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">⭐</span>
                      <div>
                        <div className="font-bold">Level {userProfile?.level || 1}</div>
                        <div className="text-xs text-blue-100">Squad Member</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Squad Members - Real Data */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-600" />
                      Squad Members ({squadMembers.length}/{Math.max(squadMembers.length, 4)})
                    </h3>
                  </div>
                  
                  <div className="space-y-3">
                    {squadMembers.map((member) => (
                      <div 
                        key={member.id}
                        className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                          member.id === userProfile?.id 
                            ? 'bg-blue-50 border border-blue-200' 
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <img 
                          src={member.avatarUrl}
                          alt={member.name}
                          className={`w-12 h-12 rounded-full ${member.id === userProfile?.id ? 'border-2 border-blue-400' : ''}`}
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">
                            {member.name} {member.id === userProfile?.id && '(You)'}
                          </div>
                          <div className="text-xs text-gray-600">
                            Level {member.level} • {member.interests.slice(0, 2).join(', ') || 'Explorer'}
                          </div>
                        </div>
                        {member.id === customerSquad.leaderId && (
                          <div className="text-xs px-2 py-1 bg-blue-200 text-blue-700 rounded-full font-medium">
                            Squad Leader
                          </div>
                        )}
                        {member.id !== userProfile?.id && (
                          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <MessageCircle className="w-4 h-4 text-gray-600" />
                          </button>
                        )}
                      </div>
                    ))}
                    
                    {squadMembers.length < 4 && (
                      <div className="p-4 border-2 border-dashed border-gray-300 rounded-xl text-center">
                        <p className="text-sm text-gray-600">
                          Looking for {4 - squadMembers.length} more member{4 - squadMembers.length !== 1 ? 's' : ''} in {customerSquad.city}
                        </p>
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={handleOpenSquadChat}
                    className="w-full mt-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    {customerSquad.chatId ? 'Open Squad Chat' : 'Create Squad Chat'}
                  </button>
                </div>

                {/* Squad Meetups Schedule - Real Data */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-lg text-gray-900">Squad Meetups</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Meet with your squad twice a month: 1 fun activity + 1 skill-sharing session
                  </p>
                  
                  {squadMeetups.length > 0 ? (
                    <div className="space-y-3">
                      {squadMeetups.filter(m => m.status === 'scheduled').map((meetup) => (
                        <div 
                          key={meetup.id}
                          className={`p-4 rounded-xl border ${
                            meetup.type === 'fun' 
                              ? 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200' 
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold ${
                                meetup.type === 'fun' ? 'bg-blue-600' : 'bg-orange-500'
                              }`}>
                                {meetup.type === 'fun' ? <Calendar className="w-6 h-6" /> : <TrendingUp className="w-6 h-6" />}
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-900">{meetup.title}</h4>
                                <p className="text-xs text-gray-600">
                                  {meetup.type === 'fun' ? 'Fun Activity' : 'Skill-Sharing Session'}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-700 mb-3">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {meetup.date} {meetup.time}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {meetup.location}
                            </span>
                          </div>
                          {meetup.attendees.includes(userProfile?.id || '') ? (
                            <div className="py-2 bg-green-100 text-green-700 rounded-lg font-semibold text-center text-sm">
                              ✓ You're attending
                            </div>
                          ) : (
                            <button 
                              onClick={() => handleConfirmAttendance(meetup.id)}
                              className="w-full py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                            >
                              Confirm Attendance
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 rounded-xl text-center">
                      <p className="text-sm text-gray-600 mb-3">No upcoming meetups scheduled yet</p>
                    </div>
                  )}

                  <button className="w-full mt-4 py-2 text-blue-600 font-semibold hover:text-blue-700 flex items-center justify-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Propose New Meetup
                  </button>
                </div>

                {/* Squad Challenges - Real Data */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <Award className="w-5 h-5 text-orange-600" />
                    <h3 className="font-bold text-lg text-gray-900">Squad Challenges</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Complete challenges together to earn bonus XP and rewards
                  </p>
                  
                  <div className="space-y-3">
                    {customerSquad.challenges.map((challenge) => (
                      <div 
                        key={challenge.id}
                        className={`p-4 rounded-xl border ${
                          challenge.status === 'completed' 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">{challenge.title}</h4>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            challenge.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}>
                            {challenge.progress}/{challenge.target} Complete
                          </span>
                        </div>
                        <div className={`w-full rounded-full h-2 mb-2 ${
                          challenge.status === 'completed' ? 'bg-green-200' : 'bg-orange-200'
                        }`}>
                          <div 
                            className={`h-2 rounded-full ${
                              challenge.status === 'completed' ? 'bg-green-600' : 'bg-orange-600'
                            }`}
                            style={{ width: `${(challenge.progress / challenge.target) * 100}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-600">+{challenge.xpReward} XP each when completed</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* How Squads Work */}
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-200">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-2">How Squads Work</h4>
                      <ul className="space-y-2 text-sm text-gray-700">
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 mt-0.5">•</span>
                          <span>Get matched with 3-4 customers in your city with similar interests</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 mt-0.5">•</span>
                          <span>Meet twice a month: 1 fun activity + 1 skill-sharing session</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 mt-0.5">•</span>
                          <span>Complete squad challenges together for bonus rewards</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 mt-0.5">•</span>
                          <span>Build lasting friendships and grow your local network</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Collaborate Tab Content */}
      {internalTab === 'collaborate' && (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto space-y-6">
            
            {/* Block 1: Find Collaborators (Available to all) */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900 mb-1">Find Collaborators</h3>
                  <p className="text-sm text-gray-600">
                    Find people to join your meetups or missions
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowFindCollaborators(true)}
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all shadow-sm"
              >
                Find Collaborators
              </button>
            </div>

            {/* Block 2: Collab Offers (Available to all) */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-cyan-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900 mb-2">Collab Offers</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Browse collaboration opportunities from other users
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                {collabOffers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">No collaboration offers yet</p>
                    <p className="text-xs mt-1">Check back soon for new opportunities!</p>
                  </div>
                ) : (
                  collabOffers.map(offer => (
                    <div 
                      key={offer.id}
                      className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-blue-300 transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{offer.title}</h4>
                        <span className="text-xs text-gray-500">{offer.city}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{offer.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {new Date(offer.createdAt).toLocaleDateString()}
                        </span>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg font-medium hover:bg-blue-700 transition-colors">
                          Request to Join
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Block 3: Your Collaboration Requests (Creator-only) */}
            {userProfile?.creatorMode ? (
              <div className="bg-gradient-to-br from-orange-50 to-pink-50 rounded-2xl p-6 border border-orange-200">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Award className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900 mb-1">Your Collaboration Requests</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Manage incoming collaboration requests
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {creatorRequests.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">No collaboration requests yet</p>
                      <p className="text-xs mt-1">When creators reach out, they'll appear here</p>
                    </div>
                  ) : (
                    creatorRequests.map(request => (
                    <div 
                      key={request.id}
                      className="p-4 bg-white rounded-xl border border-gray-200"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <img 
                            src={request.requesterAvatar}
                            alt={request.requesterName}
                            className="w-10 h-10 rounded-full"
                          />
                          <div>
                            <h4 className="font-semibold text-gray-900">{request.requesterName}</h4>
                            <p className="text-xs text-gray-500">{request.projectTitle}</p>
                          </div>
                        </div>
                        <span 
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            request.status === 'Pending' 
                              ? 'bg-yellow-100 text-yellow-700'
                              : request.status === 'Accepted'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {request.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{request.message}</p>
                      <span className="text-xs text-gray-500">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-200 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-blue-600" />
                </div>
                <h4 className="font-bold text-gray-900 mb-2">Unlock Creator Tools</h4>
                <p className="text-sm text-gray-600">
                  Turn on Creator Mode in your profile to unlock creator collaboration tools
                </p>
              </div>
            )}

          </div>
        </div>
      )}

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
            // Navigate to meetups recommendations
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

      {/* Find Collaborators Modal */}
      {showFindCollaborators && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-xl">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Find Collaborators</h2>
              <button 
                onClick={() => setShowFindCollaborators(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-100px)]">
              <p className="text-sm text-gray-600 mb-6">
                Connect with these users to collaborate on meetups or missions
              </p>

              <div className="space-y-4">
                {suggestedUsers.map(user => (
                  <div 
                    key={user.id}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-blue-300 transition-all"
                  >
                    <img 
                      src={user.avatarUrl}
                      alt={user.name}
                      className="w-14 h-14 rounded-full"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{user.name}</h4>
                      <p className="text-sm text-gray-600">{user.handle}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-blue-600 font-medium">Level {user.level}</span>
                        <span className="text-gray-300">•</span>
                        <div className="flex gap-1">
                          {user.vibeTags?.slice(0, 2).map(tag => (
                            <span 
                              key={tag}
                              className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-sm rounded-lg font-medium hover:from-blue-700 hover:to-cyan-700 transition-all shadow-sm">
                      Invite
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Filter Drawer */}
      <MobileFilterDrawer
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        maxDistance={50}
        onDistanceChange={() => {}}
        sortBy={meetupTypeFilter}
        onSortChange={(value) => setMeetupTypeFilter(value as MeetupTypeFilter)}
        selectedCategory={dateFilter}
        onCategoryChange={(value) => setDateFilter(value as DateFilter)}
        categories={['ALL', 'TODAY', 'THIS_WEEK', 'CHOOSE_DATE']}
      />

      {/* Events Tab Content */}
      {internalTab === 'events' && userProfile && (
        <div className="flex-1 overflow-y-auto">
          <PremiumEvents user={{
            id: userProfile.uid,
            name: userProfile.displayName || userProfile.email || 'User',
            email: userProfile.email || '',
            role: userProfile.role || 'CUSTOMER',
            points: userProfile.points || 0,
            avatarUrl: userProfile.photoURL || undefined,
          } as any} />
        </div>
      )}

      {/* TODO: Add PassportModal component */}
      {/* TODO: Add MeetupCompletionSummary component */}
      {/* TODO: Add CollaboratorFinderModal component */}
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
                : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 shadow-sm'
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


