import React, { useState, useEffect } from 'react';
import { User, PremiumEvent, UserRole } from '../types';
import { Calendar, MapPin, Users, Sparkles, Clock, Star, TrendingUp, Loader2 } from 'lucide-react';
import { db } from '../services/apiService';
import { collection, query, where, getDocs, orderBy, addDoc, doc, updateDoc, increment } from '../services/firestoreCompat';

interface PremiumEventsProps {
  user: User;
}

const EVENT_CATEGORIES = [
  // Core Business & Professional
  { id: 'NETWORKING', emoji: '🤝', label: 'Networking', color: 'from-purple-500 to-pink-500' },
  { id: 'BUSINESS', emoji: '💼', label: 'Business Growth', color: 'from-gray-700 to-slate-900' },
  { id: 'ENTREPRENEURSHIP', emoji: '🚀', label: 'Entrepreneurship', color: 'from-orange-600 to-red-600' },
  { id: 'LEADERSHIP', emoji: '👔', label: 'Leadership', color: 'from-blue-700 to-indigo-800' },
  { id: 'CONFERENCE', emoji: '🎤', label: 'Conferences', color: 'from-indigo-500 to-violet-500' },
  { id: 'WORKSHOP', emoji: '🎓', label: 'Workshops', color: 'from-blue-500 to-cyan-500' },
  
  // Marketing & Digital
  { id: 'MARKETING', emoji: '📣', label: 'Marketing & Sales', color: 'from-pink-600 to-rose-600' },
  { id: 'CONTENT_CREATION', emoji: '📸', label: 'Content Creation', color: 'from-purple-500 to-fuchsia-500' },
  { id: 'SOCIAL_MEDIA', emoji: '📱', label: 'Social Media', color: 'from-cyan-500 to-blue-500' },
  { id: 'BRANDING', emoji: '🎯', label: 'Branding & Strategy', color: 'from-violet-600 to-purple-700' },
  { id: 'TECH', emoji: '💻', label: 'Technology', color: 'from-blue-600 to-indigo-600' },
  { id: 'INNOVATION', emoji: '💡', label: 'Innovation', color: 'from-yellow-500 to-orange-600' },
  
  // Personal Growth
  { id: 'PERSONAL_DEVELOPMENT', emoji: '🌟', label: 'Personal Development', color: 'from-yellow-600 to-amber-600' },
  { id: 'CAREER', emoji: '📈', label: 'Career Development', color: 'from-indigo-600 to-blue-700' },
  { id: 'FINANCE', emoji: '💰', label: 'Finance & Investing', color: 'from-green-600 to-emerald-700' },
  { id: 'CREATIVITY', emoji: '✨', label: 'Creativity', color: 'from-pink-400 to-rose-500' },
  
  // Health & Wellness
  { id: 'WELLNESS', emoji: '🧘', label: 'Wellness', color: 'from-teal-500 to-cyan-500' },
  { id: 'FITNESS', emoji: '💪', label: 'Fitness & Training', color: 'from-red-500 to-orange-500' },
  { id: 'MINDFULNESS', emoji: '🧠', label: 'Mindfulness', color: 'from-teal-600 to-cyan-700' },
  { id: 'YOGA', emoji: '🧘‍♀️', label: 'Yoga', color: 'from-purple-400 to-pink-400' },
  
  // Major Sports
  { id: 'SPORTS', emoji: '⚽', label: 'Sports', color: 'from-green-500 to-emerald-500' },
  { id: 'SOCCER', emoji: '⚽', label: 'Soccer/Football', color: 'from-green-600 to-lime-600' },
  { id: 'BASKETBALL', emoji: '🏀', label: 'Basketball', color: 'from-orange-600 to-amber-600' },
  { id: 'TENNIS', emoji: '🎾', label: 'Tennis', color: 'from-yellow-600 to-green-600' },
  { id: 'GOLF', emoji: '⛳', label: 'Golf', color: 'from-green-700 to-emerald-800' },
  { id: 'RUNNING', emoji: '🏃', label: 'Running & Marathons', color: 'from-blue-600 to-cyan-600' },
  
  // Active & Adventure
  { id: 'CYCLING', emoji: '🚴', label: 'Cycling', color: 'from-teal-600 to-green-700' },
  { id: 'SWIMMING', emoji: '🏊', label: 'Swimming', color: 'from-blue-500 to-sky-500' },
  { id: 'HIKING', emoji: '🥾', label: 'Hiking', color: 'from-green-800 to-teal-800' },
  { id: 'ADVENTURE', emoji: '🧗', label: 'Adventure Sports', color: 'from-orange-700 to-red-700' },
  { id: 'SKIING', emoji: '⛷️', label: 'Skiing & Winter Sports', color: 'from-blue-400 to-cyan-400' },
  { id: 'MARTIAL_ARTS', emoji: '🥋', label: 'Martial Arts', color: 'from-red-700 to-orange-700' },
  
  // Social & Entertainment
  { id: 'COMMUNITY', emoji: '🌍', label: 'Community Building', color: 'from-green-700 to-teal-700' },
  { id: 'FOOD', emoji: '🍽️', label: 'Food & Dining', color: 'from-yellow-500 to-orange-500' },
  { id: 'COOKING', emoji: '👨‍🍳', label: 'Cooking & Culinary', color: 'from-red-600 to-orange-600' },
  { id: 'WINE_TASTING', emoji: '🍷', label: 'Wine Tasting', color: 'from-purple-700 to-red-700' },
  { id: 'GAMING', emoji: '🎮', label: 'Gaming & Esports', color: 'from-indigo-600 to-purple-600' },
  { id: 'MUSIC', emoji: '🎵', label: 'Music', color: 'from-purple-600 to-pink-600' },
  { id: 'DANCING', emoji: '💃', label: 'Dancing', color: 'from-rose-500 to-pink-600' },
  { id: 'COMEDY', emoji: '😂', label: 'Comedy & Entertainment', color: 'from-yellow-500 to-amber-500' },
  
  // Arts & Lifestyle
  { id: 'ART', emoji: '🎨', label: 'Arts & Culture', color: 'from-pink-500 to-rose-500' },
  { id: 'PHOTOGRAPHY', emoji: '📷', label: 'Photography', color: 'from-gray-600 to-slate-700' },
  { id: 'TRAVEL', emoji: '✈️', label: 'Travel', color: 'from-sky-500 to-blue-500' },
  { id: 'SAILING', emoji: '⛵', label: 'Sailing & Boating', color: 'from-blue-700 to-cyan-700' },
  { id: 'OUTDOORS', emoji: '🏔️', label: 'Outdoors', color: 'from-emerald-600 to-teal-600' },
  { id: 'RETREAT', emoji: '🏖️', label: 'Retreats', color: 'from-orange-500 to-red-500' },
];

export const PremiumEvents: React.FC<PremiumEventsProps> = ({ user }) => {
  const [events, setEvents] = useState<PremiumEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filteredEvents, setFilteredEvents] = useState<PremiumEvent[]>([]);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [priceFilter, setPriceFilter] = useState<'all' | 'affordable' | 'premium'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'upcoming' | 'this-month' | 'next-month'>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'filling-fast'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [registeredEvents, setRegisteredEvents] = useState<PremiumEvent[]>([]);
  const [loadingRegistered, setLoadingRegistered] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<PremiumEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);

  useEffect(() => {
    fetchEvents();
    fetchRegisteredEvents();
  }, []);

  useEffect(() => {
    let filtered = [...events];

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(e => e.category === selectedCategory);
    }

    // City filter
    if (selectedCity) {
      filtered = filtered.filter(e => e.location.city === selectedCity);
    }

    // Price filter (based on points)
    if (priceFilter === 'affordable') {
      filtered = filtered.filter(e => (e.pricing?.points || 0) <= (user.points || 0));
    } else if (priceFilter === 'premium') {
      filtered = filtered.filter(e => (e.pricing?.points || 0) > 3000);
    }

    // Date filter
    const now = new Date();
    const oneMonthLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const twoMonthsLater = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

    if (dateFilter === 'upcoming') {
      filtered = filtered.filter(e => new Date(e.dates.start) > now);
    } else if (dateFilter === 'this-month') {
      filtered = filtered.filter(e => {
        const start = new Date(e.dates.start);
        return start > now && start < oneMonthLater;
      });
    } else if (dateFilter === 'next-month') {
      filtered = filtered.filter(e => {
        const start = new Date(e.dates.start);
        return start > oneMonthLater && start < twoMonthsLater;
      });
    }

    // Availability filter
    if (availabilityFilter === 'available') {
      filtered = filtered.filter(e => e.status === 'REGISTRATION_OPEN' && e.registered < e.capacity);
    } else if (availabilityFilter === 'filling-fast') {
      filtered = filtered.filter(e => {
        const spotsLeft = e.capacity - e.registered;
        return spotsLeft < 10 && spotsLeft > 0;
      });
    }

    setFilteredEvents(filtered);
  }, [selectedCategory, selectedCity, priceFilter, dateFilter, availabilityFilter, events, user.points]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const eventsRef = collection(db, 'premium_events');
      // Fetch all events and filter/sort in JavaScript to avoid index requirement
      const snapshot = await getDocs(eventsRef);
      
      let eventsList: PremiumEvent[] = [];
      snapshot.forEach(doc => {
        eventsList.push({ id: doc.id, ...doc.data() } as PremiumEvent);
      });

      // Filter by status
      eventsList = eventsList.filter(event => 
        event.status === 'UPCOMING' || event.status === 'REGISTRATION_OPEN'
      );
      
      // Load admin events from Firestore
      try {
        console.log('[PremiumEvents] Loading admin events...');
        const adminEventsQuery = query(
          collection(db, 'adminEvents'),
          where('status', '==', 'PUBLISHED')
        );
        const adminSnapshot = await getDocs(adminEventsQuery);
        
        console.log('[PremiumEvents] Found admin events:', adminSnapshot.size);
        
        adminSnapshot.forEach(doc => {
          const event = doc.data();
          
          console.log('[PremiumEvents] Event data:', event.title, 'targetAudience:', event.targetAudience);
          
          // Filter by targetAudience based on user role
          const isBusinessUser = user.role === UserRole.BUSINESS;
          const isCreatorUser = user.role === UserRole.MEMBER;
          
          // Business users see BUSINESSES and ALL events
          // Creator/Customer users see CREATORS and ALL events
          const shouldShow = 
            event.targetAudience === 'ALL' ||
            (isBusinessUser && event.targetAudience === 'BUSINESSES') ||
            (isCreatorUser && event.targetAudience === 'CREATORS');
          
          if (!shouldShow) {
            console.log('[PremiumEvents] Filtering out event:', event.title, 'for role:', user.role);
            return; // Skip this event
          }
          
          // Convert admin event to PremiumEvent format
          eventsList.push({
            id: doc.id,
            title: event.title,
            description: event.description,
            category: event.type || 'WORKSHOP',
            location: {
              city: event.city || '',
              country: '',
              venue: event.location || '',
              address: event.address || ''
            },
            dates: {
              start: event.date + 'T' + (event.time || '09:00') + ':00Z',
              end: event.date + 'T' + (event.endTime || '18:00') + ':00Z',
              duration: event.duration === '1-day' ? 1 : event.duration === '3-day' ? 3 : event.duration === '7-day' ? 7 : 1
            },
            pricing: {
              points: event.pricing?.pointsCost || 0,
              cash: event.pricing?.moneyCost || 0
            },
            capacity: event.maxAttendees || 100,
            registered: 0,
            registrants: [],
            images: event.imageUrl ? [event.imageUrl] : [],
            includes: event.pricing?.pointsCost || event.pricing?.moneyCost ? ['Official Beevvy Event', 'Networking opportunity'] : ['Official Beevvy Event', 'Free to attend', 'Networking opportunity'],
            schedule: [
              {
                day: 1,
                title: event.title,
                activities: ['Registration', 'Main Event', 'Networking']
              }
            ],
            createdBy: 'ADMIN',
            status: 'REGISTRATION_OPEN',
            highlights: event.pricing?.pointsCost || event.pricing?.moneyCost ? ['Official Beevvy Event'] : ['Official Beevvy Event', 'Free to attend'],
            whatToBring: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          } as PremiumEvent);
        });
        
        console.log('[PremiumEvents] Total events after adding admin:', eventsList.length);
      } catch (error) {
        console.error('[PremiumEvents] Error loading admin events:', error);
      }

      // Sort by start date ascending
      eventsList.sort((a, b) => {
        const aStart = a.dates?.start;
        const bStart = b.dates?.start;
        
        let aDate: Date;
        if (aStart && typeof aStart === 'object' && aStart !== null) {
          const aObj = aStart as Record<string, any>;
          aDate = 'toDate' in aObj ? aObj.toDate() : new Date(0);
        } else {
          aDate = new Date((aStart as any) || 0);
        }
        
        let bDate: Date;
        if (bStart && typeof bStart === 'object' && bStart !== null) {
          const bObj = bStart as Record<string, any>;
          bDate = 'toDate' in bObj ? bObj.toDate() : new Date(0);
        } else {
          bDate = new Date((bStart as any) || 0);
        }
        
        return aDate.getTime() - bDate.getTime();
      });

      setEvents(eventsList);
      setFilteredEvents(eventsList);
    } catch (error) {
      console.error('Error fetching premium events:', error);
      // Show mock data for demo
      const mockEvents = getMockEvents();
      setEvents(mockEvents);
      setFilteredEvents(mockEvents);
    } finally {
      setLoading(false);
    }
  };

  const fetchRegisteredEvents = async () => {
    setLoadingRegistered(true);
    try {
      // Fetch user's event registrations
      const registrationsQuery = query(
        collection(db, 'eventRegistrations'),
        where('userId', '==', user.id),
        where('status', '==', 'confirmed')
      );
      const registrationsSnapshot = await getDocs(registrationsQuery);
      
      const eventIds = registrationsSnapshot.docs.map(doc => doc.data().eventId);
      
      if (eventIds.length === 0) {
        setRegisteredEvents([]);
        setLoadingRegistered(false);
        return;
      }

      // Fetch full event details for registered events
      const userEvents: PremiumEvent[] = [];
      
      // Check both premium_events and adminEvents collections
      for (const eventId of eventIds) {
        // Try adminEvents first
        const adminEventsQuery = query(
          collection(db, 'adminEvents'),
          where('__name__', '==', eventId)
        );
        const adminSnapshot = await getDocs(adminEventsQuery);
        
        if (!adminSnapshot.empty) {
          const doc = adminSnapshot.docs[0];
          const event = doc.data();
          userEvents.push({
            id: doc.id,
            title: event.title,
            description: event.description,
            category: event.type || 'WORKSHOP',
            location: {
              city: event.city || '',
              country: '',
              venue: event.location || '',
              address: event.address || ''
            },
            dates: {
              start: event.date + 'T' + (event.time || '09:00') + ':00Z',
              end: event.date + 'T' + (event.endTime || '18:00') + ':00Z',
              duration: event.duration === '1-day' ? 1 : event.duration === '3-day' ? 3 : event.duration === '7-day' ? 7 : 1
            },
            pricing: {
              points: event.pricing?.pointsCost || 0,
              cash: event.pricing?.moneyCost || 0
            },
            capacity: event.maxAttendees || 100,
            registered: 0,
            images: event.imageUrl ? [event.imageUrl] : [],
            includes: [],
            schedule: [],
            createdBy: 'ADMIN',
            status: 'REGISTRATION_OPEN',
            highlights: [],
            whatToBring: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          } as PremiumEvent);
        }
      }
      
      setRegisteredEvents(userEvents);
    } catch (error) {
      console.error('Error fetching registered events:', error);
      setRegisteredEvents([]);
    } finally {
      setLoadingRegistered(false);
    }
  };

  const getMockEvents = (): PremiumEvent[] => [
    {
      id: '1',
      title: '3-Day Marketing Workshop in Croatia',
      description: 'Intensive hands-on workshop covering digital marketing strategies, social media growth, and content creation. Network with fellow entrepreneurs while enjoying the beautiful Croatian coast.',
      category: 'WORKSHOP',
      location: {
        city: 'Split',
        country: 'Croatia',
        venue: 'Radisson Blu Resort',
        address: 'Put Trstenika 19, 21000 Split, Croatia'
      },
      dates: {
        start: '2025-06-15T09:00:00Z',
        end: '2025-06-17T18:00:00Z',
        duration: 3
      },
      pricing: {
        points: 5000,
        cash: 500
      },
      capacity: 30,
      registered: 12,
      images: ['https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=800'],
      includes: ['Accommodation (2 nights)', 'All meals', 'Workshop materials', 'Networking dinners', 'Beach activities'],
      schedule: [
        {
          day: 1,
          title: 'Digital Marketing Foundations',
          activities: ['Welcome breakfast', 'SEO & SEM basics', 'Social media strategy', 'Networking dinner']
        },
        {
          day: 2,
          title: 'Content Creation & Growth',
          activities: ['Content workshop', 'Influencer marketing', 'Analytics deep-dive', 'Beach sunset session']
        },
        {
          day: 3,
          title: 'Advanced Tactics & Implementation',
          activities: ['Email marketing', 'Conversion optimization', 'Action plan creation', 'Closing ceremony']
        }
      ],
      createdBy: 'ADMIN',
      status: 'REGISTRATION_OPEN',
      highlights: ['Hands-on workshops', 'Expert speakers', 'Networking opportunities', 'Beautiful location'],
      whatToBring: ['Laptop', 'Swimwear', 'Business cards', 'Notebook'],
      requiresAdminApproval: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '2',
      title: 'Entrepreneurs Sports Weekend',
      description: 'Build connections while staying active! Join fellow entrepreneurs for a weekend of team sports, wellness activities, and strategic networking sessions.',
      category: 'SPORTS',
      location: {
        city: 'Barcelona',
        country: 'Spain',
        venue: 'Olympic Sports Center',
        address: 'Avinguda de l\'Estadi 60, 08038 Barcelona, Spain'
      },
      dates: {
        start: '2025-05-20T08:00:00Z',
        end: '2025-05-22T18:00:00Z',
        duration: 3
      },
      pricing: {
        points: 3000,
        cash: 300
      },
      capacity: 40,
      registered: 28,
      images: ['https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800'],
      includes: ['2 nights accommodation', 'All meals', 'Sports equipment', 'Professional coaching', 'Team jerseys'],
      schedule: [
        {
          day: 1,
          title: 'Team Building',
          activities: ['Morning yoga', 'Team formation', 'Football tournament', 'BBQ dinner']
        },
        {
          day: 2,
          title: 'Competition Day',
          activities: ['Volleyball tournament', 'Swimming relay', 'Rock climbing', 'Awards ceremony']
        },
        {
          day: 3,
          title: 'Wellness & Recovery',
          activities: ['Spa session', 'Wellness workshop', 'Networking brunch', 'Closing remarks']
        }
      ],
      createdBy: 'ADMIN',
      status: 'REGISTRATION_OPEN',
      highlights: ['Multiple sports activities', 'Team building exercises', 'Wellness focus', 'Networking'],
      requiresAdminApproval: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '3',
      title: 'B2B Mega-Meetup: Barcelona',
      description: 'The biggest B2B networking event of the year! Connect with 200+ entrepreneurs, attend masterclasses, explore partnership opportunities, and celebrate entrepreneurship.',
      category: 'NETWORKING',
      location: {
        city: 'Barcelona',
        country: 'Spain',
        venue: 'W Barcelona Hotel',
        address: 'Plaça de la Rosa dels Vents 1, 08039 Barcelona, Spain'
      },
      dates: {
        start: '2025-07-10T09:00:00Z',
        end: '2025-07-10T22:00:00Z',
        duration: 1
      },
      pricing: {
        points: 2000,
        cash: 200
      },
      capacity: 200,
      registered: 156,
      images: ['https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'],
      includes: ['All-day access', 'Lunch & refreshments', 'Masterclass sessions', 'Networking cocktail', 'Swag bag'],
      schedule: [
        {
          day: 1,
          title: 'Full Day Networking',
          activities: [
            'Registration & breakfast',
            'Opening keynote',
            'Speed networking sessions',
            'Lunch buffet',
            'Masterclass tracks (Marketing, Sales, Operations)',
            'Partnership marketplace',
            'Evening cocktail party',
            'Closing remarks'
          ]
        }
      ],
      createdBy: 'ADMIN',
      status: 'REGISTRATION_OPEN',
      highlights: ['200+ entrepreneurs', 'Expert masterclasses', 'Partnership opportunities', 'Premium venue'],
      requiresAdminApproval: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-4" />
        <p className="text-gray-600 font-medium">Loading premium events...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            <h2 className="text-2xl font-bold text-[#1E0E62]">Premium Events</h2>
          </div>
          <p className="text-gray-600">Exclusive multi-day experiences for entrepreneurs</p>
        </div>
        <div className="bg-purple-50 px-5 py-3 rounded-xl border border-purple-200">
          <div className="text-xs text-gray-600 mb-1">Your Points Balance</div>
          <div className="font-bold text-2xl text-purple-600">{(user.points || 0).toLocaleString()}</div>
        </div>
      </div>

      {/* My Registered Events Section */}
      {!loadingRegistered && registeredEvents.length > 0 && (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-purple-900 flex items-center gap-2">
                <Star className="w-5 h-5 text-purple-600" fill="currentColor" />
                My Registered Events
              </h3>
              <p className="text-sm text-purple-700 mt-1">
                You're registered for {registeredEvents.length} upcoming event{registeredEvents.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {registeredEvents.map((event) => {
              const startDate = new Date(event.dates.start);
              return (
                <div
                  key={event.id}
                  className="bg-white rounded-xl p-4 border-2 border-purple-200 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-bold text-gray-900 text-sm line-clamp-2 flex-1">
                      {event.title}
                    </h4>
                    <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-bold whitespace-nowrap">
                      ✓ Confirmed
                    </span>
                  </div>
                  <div className="space-y-2 text-xs text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-purple-500" />
                      <span>{startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-purple-500" />
                      <span className="line-clamp-1">{event.location.city}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-purple-500" />
                      <span>{event.dates.duration} Day{event.dates.duration > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter Toggle Button */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-white border-2 border-gray-200 rounded-xl font-bold text-gray-700 hover:border-purple-300 transition-all flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
          {(selectedCategory || selectedCity || priceFilter !== 'all' || dateFilter !== 'all' || availabilityFilter !== 'all') && (
            <button
              onClick={() => {
                setSelectedCategory(null);
                setSelectedCity(null);
                setPriceFilter('all');
                setDateFilter('all');
                setAvailabilityFilter('all');
              }}
              className="px-4 py-2 bg-red-50 border-2 border-red-200 rounded-xl font-bold text-red-700 hover:bg-red-100 transition-all"
            >
              Clear All
            </button>
          )}
        </div>
        <div className="text-sm text-gray-600">
          Showing <span className="font-bold text-purple-600">{filteredEvents.length}</span> of {events.length} events
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white rounded-2xl p-6 border border-gray-200 mb-6 space-y-6">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">Category</label>
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2.5 rounded-xl border-2 transition-all whitespace-nowrap text-sm ${
                  selectedCategory === null
                    ? 'border-purple-500 bg-purple-50 text-purple-700 font-bold'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                All Categories
              </button>
              {EVENT_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2.5 rounded-xl border-2 transition-all whitespace-nowrap text-sm ${
                    selectedCategory === cat.id
                      ? 'border-purple-500 bg-purple-50 text-purple-700 font-bold'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* City Filter */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">Location</label>
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedCity(null)}
                className={`px-4 py-2.5 rounded-xl border-2 transition-all whitespace-nowrap text-sm ${
                  selectedCity === null
                    ? 'border-purple-500 bg-purple-50 text-purple-700 font-bold'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                All Cities
              </button>
              {Array.from(new Set(events.map(e => e.location.city))).map((city) => (
                <button
                  key={city}
                  onClick={() => setSelectedCity(city)}
                  className={`px-4 py-2.5 rounded-xl border-2 transition-all whitespace-nowrap text-sm ${
                    selectedCity === city
                      ? 'border-purple-500 bg-purple-50 text-purple-700 font-bold'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>

          {/* Price & Date Row */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Price Filter */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">Price Range</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setPriceFilter('all')}
                  className={`px-3 py-2.5 rounded-xl border-2 transition-all text-sm ${
                    priceFilter === 'all'
                      ? 'border-purple-500 bg-purple-50 text-purple-700 font-bold'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  All Prices
                </button>
                <button
                  onClick={() => setPriceFilter('affordable')}
                  className={`px-3 py-2.5 rounded-xl border-2 transition-all text-sm ${
                    priceFilter === 'affordable'
                      ? 'border-green-500 bg-green-50 text-green-700 font-bold'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  I Can Afford
                </button>
                <button
                  onClick={() => setPriceFilter('premium')}
                  className={`px-3 py-2.5 rounded-xl border-2 transition-all text-sm ${
                    priceFilter === 'premium'
                      ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  Premium
                </button>
              </div>
            </div>

            {/* Date Filter */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">Timeframe</label>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setDateFilter('all')}
                  className={`px-4 py-2.5 rounded-xl border-2 transition-all text-sm ${
                    dateFilter === 'all'
                      ? 'border-purple-500 bg-purple-50 text-purple-700 font-bold'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  All Dates
                </button>
                <button
                  onClick={() => setDateFilter('upcoming')}
                  className={`px-4 py-2.5 rounded-xl border-2 transition-all text-sm ${
                    dateFilter === 'upcoming'
                      ? 'border-purple-500 bg-purple-50 text-purple-700 font-bold'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  Upcoming
                </button>
                <button
                  onClick={() => setDateFilter('this-month')}
                  className={`px-4 py-2.5 rounded-xl border-2 transition-all text-sm ${
                    dateFilter === 'this-month'
                      ? 'border-purple-500 bg-purple-50 text-purple-700 font-bold'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  This Month
                </button>
                <button
                  onClick={() => setDateFilter('next-month')}
                  className={`px-4 py-2.5 rounded-xl border-2 transition-all text-sm ${
                    dateFilter === 'next-month'
                      ? 'border-purple-500 bg-purple-50 text-purple-700 font-bold'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  Next Month
                </button>
              </div>
            </div>
          </div>

          {/* Availability Filter */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">Availability</label>
            <div className="flex gap-2">
              <button
                onClick={() => setAvailabilityFilter('all')}
                className={`flex-1 px-4 py-2 rounded-xl border-2 transition-all ${
                  availabilityFilter === 'all'
                    ? 'border-purple-500 bg-purple-50 text-purple-700 font-bold'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                All Events
              </button>
              <button
                onClick={() => setAvailabilityFilter('available')}
                className={`flex-1 px-4 py-2 rounded-xl border-2 transition-all ${
                  availabilityFilter === 'available'
                    ? 'border-green-500 bg-green-50 text-green-700 font-bold'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                ✓ Available
              </button>
              <button
                onClick={() => setAvailabilityFilter('filling-fast')}
                className={`flex-1 px-4 py-2 rounded-xl border-2 transition-all ${
                  availabilityFilter === 'filling-fast'
                    ? 'border-orange-500 bg-orange-50 text-orange-700 font-bold'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                🔥 Filling Fast
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <div className="bg-gray-50 rounded-2xl p-12 text-center">
          <div className="text-5xl mb-4">📅</div>
          <h3 className="font-bold text-lg text-gray-900 mb-2">No Events Found</h3>
          <p className="text-gray-600">Check back soon for new premium events!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {filteredEvents.map((event) => (
            <PremiumEventCard 
              key={event.id} 
              event={event} 
              userPoints={user.points} 
              userId={user.id}
              user={user}
              onViewDetails={() => {
                setSelectedEvent(event);
                setShowEventModal(true);
              }}
            />
          ))}
        </div>
      )}

      {/* Event Details Modal */}
      {showEventModal && selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          onClose={() => {
            setShowEventModal(false);
            setSelectedEvent(null);
          }}
          user={user}
        />
      )}
    </div>
  );
};

// Premium Event Card Component
const PremiumEventCard: React.FC<{ event: PremiumEvent; userPoints: number; userId: string; onViewDetails: () => void; user: User }> = ({ event, userPoints, userId, onViewDetails, user }) => {
  const [registering, setRegistering] = React.useState(false);
  const [paymentMethod, setPaymentMethod] = React.useState<'points' | 'cash'>('points');
  const canAffordPoints = userPoints >= (event.pricing?.points || 0);
  const spotsLeft = event.capacity - event.registered;
  const category = EVENT_CATEGORIES.find(c => c.id === event.category);
  const startDate = new Date(event.dates.start);
  const isSoldOut = event.status === 'SOLD_OUT' || spotsLeft === 0;

  const handleRegister = async () => {
    // Check level restrictions
    if (!event.isForEveryone && event.allowedLevels && event.allowedLevels.length > 0) {
      const userLevel = user.level || 1;
      if (!event.allowedLevels.includes(userLevel)) {
        alert(
          `This event is restricted to Level ${event.allowedLevels.join(', ')} users.\n\n` +
          `Your current level: ${userLevel}\n\n` +
          `Please upgrade your level to join this event.`
        );
        return;
      }
    }

    if (paymentMethod === 'points' && !canAffordPoints) {
      alert(`You need ${(event.pricing?.points || 0) - userPoints} more points to register for this event.`);
      return;
    }

    const approvalText = event.requiresAdminApproval 
      ? '\n\n⚠️ Note: Your registration will be pending admin approval.'
      : '';

    const confirmed = confirm(
      `Register for ${event.title}?\n\n` +
      `Payment: ${paymentMethod === 'points' ? `${(event.pricing?.points || 0).toLocaleString()} points` : `€${event.pricing?.cash || 0}`}\n` +
      `Duration: ${event.dates.duration} day${event.dates.duration > 1 ? 's' : ''}\n` +
      `Location: ${event.location.city}, ${event.location.country}` +
      approvalText
    );

    if (!confirmed) return;

    setRegistering(true);
    try {
      const registrationStatus = event.requiresAdminApproval ? 'pending' : 'confirmed';

      // Deduct points if paying with points (only if no approval required)
      if (paymentMethod === 'points' && !event.requiresAdminApproval) {
        const pointsCost = event.pricing?.points || 0;
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          points: increment(-pointsCost)
        });
      }

      // Save registration to Firestore
      await addDoc(collection(db, 'eventRegistrations'), {
        userId: userId,
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.dates.start,
        paymentMethod: paymentMethod,
        amountPaid: paymentMethod === 'points' ? (event.pricing?.points || 0) : (event.pricing?.cash || 0),
        registeredAt: new Date().toISOString(),
        status: registrationStatus,
        requiresApproval: event.requiresAdminApproval
      });

      // If requires approval, add to pending approvals
      if (event.requiresAdminApproval) {
        const eventRef = doc(db, 'adminEvents', event.id);
        await updateDoc(eventRef, {
          pendingApprovals: [...(event.pendingApprovals || []), userId]
        });
        
        alert(
          `📩 Registration submitted for ${event.title}!\n\n` +
          `Status: Pending Admin Approval\n` +
          `Payment: ${paymentMethod === 'points' ? `${(event.pricing?.points || 0).toLocaleString()} points (will be deducted upon approval)` : `€${event.pricing?.cash || 0} (will be charged upon approval)`}\n\n` +
          `You will be notified once your registration is reviewed by the admin team.`
        );
      } else {
        // Update event registered count (only if no approval required)
        const eventRef = doc(db, 'adminEvents', event.id);
        await updateDoc(eventRef, {
          registered: increment(1)
        });

        alert(
          `✅ Successfully registered for ${event.title}!\n\n` +
          `Payment: ${paymentMethod === 'points' ? `${(event.pricing?.points || 0).toLocaleString()} points deducted` : `€${event.pricing?.cash || 0} will be charged`}\n` +
          `Location: ${event.location.city}, ${event.location.country}\n` +
          `Start Date: ${startDate.toLocaleDateString()}\n\n` +
          `Spots remaining: ${Math.max(0, (event.capacity || 0) - (event.registered || 0) - 1)}\n\n` +
          `Check your email for event details and confirmation.`
        );
      }

    } catch (error) {
      console.error('Registration error:', error);
      alert('Failed to register. Please check your connection and try again.');
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-gray-200 hover:shadow-2xl hover:border-purple-300 transition-all duration-300">
      {/* Event Image */}
      <div className="relative h-56 cursor-pointer" onClick={onViewDetails}>
        <img
          src={event.images[0]}
          alt={event.title}
          className="w-full h-full object-cover"
        />
        {/* Duration Badge */}
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur px-3 py-2 rounded-full flex items-center gap-2 shadow-lg">
          <Clock className="w-4 h-4 text-purple-600" />
          <span className="font-bold text-sm">{event.dates.duration} Day{event.dates.duration > 1 ? 's' : ''}</span>
        </div>
        {/* Category Badge */}
        {category && (
          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur px-3 py-2 rounded-full shadow-lg">
            <span className="text-lg">{category.emoji}</span>
          </div>
        )}
        {/* Sold Out Overlay */}
        {isSoldOut && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <div className="bg-red-500 text-white px-6 py-3 rounded-full font-bold text-lg">
              SOLD OUT
            </div>
          </div>
        )}
      </div>

      {/* Event Details */}
      <div className="p-6">
        <h3 className="font-bold text-xl text-[#1E0E62] mb-3 line-clamp-2 cursor-pointer hover:text-purple-600 transition-colors" onClick={onViewDetails}>
          {event.title}
        </h3>

        {/* Location & Date */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4 text-purple-500" />
            <span>{event.location.city}, {event.location.country}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4 text-purple-500" />
            <span>{startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-700 leading-relaxed mb-4 line-clamp-3">
          {event.description}
        </p>

        {/* Includes */}
        {event.includes && event.includes.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-bold text-gray-500 uppercase mb-2">Includes</div>
            <div className="flex flex-wrap gap-1">
              {event.includes.slice(0, 3).map((item, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium"
                >
                  ✓ {item}
                </span>
              ))}
              {event.includes.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                  +{event.includes.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Pricing */}
        {(event.pricing?.points || 0) > 0 || (event.pricing?.cash || 0) > 0 ? (
          <div className="flex gap-3 mb-4">
            {(event.pricing?.points || 0) > 0 && (
              <div className={`flex-1 p-3 rounded-xl border-2 transition-all ${
                canAffordPoints ? 'border-purple-200 bg-purple-50' : 'border-gray-200 bg-gray-50 opacity-50'
              }`}>
                <div className="text-xs text-gray-600 mb-1">With Points</div>
                <div className={`font-bold text-lg ${canAffordPoints ? 'text-purple-600' : 'text-gray-500'}`}>
                  {(event.pricing?.points || 0).toLocaleString()} pts
                </div>
                {!canAffordPoints && (
                  <div className="text-xs text-red-500 mt-1">Insufficient points</div>
                )}
              </div>
            )}
            {(event.pricing?.cash || 0) > 0 && (
              <div className="flex-1 p-3 rounded-xl border-2 border-pink-200 bg-pink-50">
                <div className="text-xs text-gray-600 mb-1">With Cash</div>
                <div className="font-bold text-lg text-pink-600">
                  €{event.pricing?.cash || 0}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mb-4 p-3 rounded-xl bg-green-50 border-2 border-green-200 text-center">
            <div className="text-lg font-bold text-green-600">🎉 FREE EVENT</div>
          </div>
        )}

        {/* Capacity */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">Capacity</span>
            <span className={`font-bold ${spotsLeft < 10 ? 'text-red-600' : 'text-gray-700'}`}>
              {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                spotsLeft < 10 ? 'bg-red-500' : 'bg-purple-500'
              }`}
              style={{ width: `${(event.registered / event.capacity) * 100}%` }}
            />
          </div>
        </div>

        {/* Payment Method Selector */}
        {!isSoldOut && (
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              onClick={() => setPaymentMethod('points')}
              className={`px-3 py-2 rounded-lg border-2 transition-all text-sm font-bold ${
                paymentMethod === 'points'
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              💜 Pay with Points
            </button>
            <button
              onClick={() => setPaymentMethod('cash')}
              className={`px-3 py-2 rounded-lg border-2 transition-all text-sm font-bold ${
                paymentMethod === 'cash'
                  ? 'border-pink-500 bg-pink-50 text-pink-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              💳 Pay with Cash
            </button>
          </div>
        )}

        {/* CTA Button */}
        <button
          onClick={handleRegister}
          disabled={isSoldOut || registering || (paymentMethod === 'points' && !canAffordPoints)}
          className={`w-full py-3 rounded-xl font-bold transition-all ${
            isSoldOut || (paymentMethod === 'points' && !canAffordPoints)
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg hover:scale-105'
          }`}
        >
          {registering ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </span>
          ) : isSoldOut ? (
            'Sold Out'
          ) : paymentMethod === 'points' && !canAffordPoints ? (
            `Need ${(event.pricing?.points || 0) - userPoints} more points`
          ) : (
            `Register for ${paymentMethod === 'points' ? `${(event.pricing?.points || 0).toLocaleString()} pts` : `€${event.pricing?.cash || 0}`}`
          )}
        </button>
      </div>
    </div>
  );
};

// Event Details Modal Component
const EventDetailsModal: React.FC<{ event: PremiumEvent; onClose: () => void; user: User }> = ({ event, onClose, user }) => {
  const startDate = new Date(event.dates.start);
  const endDate = new Date(event.dates.end);
  const category = EVENT_CATEGORIES.find(c => c.id === event.category);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header with Image */}
        <div className="relative h-64 md:h-80">
          <img
            src={event.images[0]}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center hover:bg-white transition-all shadow-lg"
          >
            <span className="text-2xl text-gray-700">×</span>
          </button>

          {/* Title Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex items-center gap-2 mb-2">
              {category && (
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium flex items-center gap-2">
                  <span>{category.emoji}</span>
                  <span>{category.label}</span>
                </span>
              )}
              <span className="px-3 py-1 bg-purple-500/90 backdrop-blur-sm rounded-full text-white text-sm font-bold">
                {event.dates.duration} Day{event.dates.duration > 1 ? 's' : ''}
              </span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">{event.title}</h2>
            <div className="flex items-center gap-4 text-white/90 text-sm">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                <span>{event.location.city}, {event.location.country}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>{startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">About This Event</h3>
            <p className="text-gray-700 leading-relaxed">{event.description}</p>
          </div>

          {/* Location Details */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Location</h3>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="font-semibold text-gray-900">{event.location.venue}</div>
              <div className="text-sm text-gray-600">{event.location.address}</div>
              <div className="text-sm text-gray-600">{event.location.city}, {event.location.country}</div>
            </div>
          </div>

          {/* Schedule */}
          {event.schedule && event.schedule.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Event Schedule</h3>
              <div className="space-y-4">
                {event.schedule.map((day, index) => (
                  <div key={index} className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border-l-4 border-purple-500">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {day.day}
                      </span>
                      <h4 className="font-bold text-gray-900">{day.title}</h4>
                    </div>
                    <ul className="space-y-1.5 ml-10">
                      {day.activities.map((activity, actIndex) => (
                        <li key={actIndex} className="text-sm text-gray-700 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                          {activity}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* What's Included */}
          {event.includes && event.includes.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">What's Included</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {event.includes.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">✓</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* What to Bring */}
          {event.whatToBring && event.whatToBring.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">What to Bring</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {event.whatToBring.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs">📦</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Highlights */}
          {event.highlights && event.highlights.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Event Highlights</h3>
              <div className="flex flex-wrap gap-2">
                {event.highlights.map((highlight, index) => (
                  <span key={index} className="px-3 py-1.5 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full text-sm font-medium">
                    ⭐ {highlight}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Capacity */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Availability</h3>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Registered Attendees</span>
                <span className="font-bold text-lg text-gray-900">
                  {event.registered} / {event.capacity}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    event.capacity - event.registered < 10 ? 'bg-red-500' : 'bg-purple-500'
                  }`}
                  style={{ width: `${(event.registered / event.capacity) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 mt-2">
                {event.capacity - event.registered} spots remaining
              </p>
            </div>
          </div>

          {/* Pricing */}
          {((event.pricing?.points || 0) > 0 || (event.pricing?.cash || 0) > 0) && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Pricing</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(event.pricing?.points || 0) > 0 && (
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border-2 border-purple-200">
                    <div className="text-sm text-purple-700 mb-1">Pay with Points</div>
                    <div className="text-3xl font-bold text-purple-600">
                      {(event.pricing?.points || 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-purple-600 mt-1">Beevvy Points</div>
                  </div>
                )}
                {(event.pricing?.cash || 0) > 0 && (
                  <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-4 border-2 border-pink-200">
                    <div className="text-sm text-pink-700 mb-1">Pay with Cash</div>
                    <div className="text-3xl font-bold text-pink-600">
                      €{event.pricing?.cash || 0}
                    </div>
                    <div className="text-sm text-pink-600 mt-1">EUR</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CTA Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
            >
              Close
            </button>
            <button
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
              onClick={onClose}
            >
              Register for Event →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
