import React, { useState, useEffect } from 'react';
import { User, PremiumEvent } from '../types';
import { Calendar, MapPin, Users, Sparkles, Clock, Star, TrendingUp, Loader2 } from 'lucide-react';
import { db } from '../services/AuthContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

interface PremiumEventsProps {
  user: User;
}

// Cloud Function URL
const REGISTER_EVENT_FUNCTION_URL = 'https://us-central1-fluzio-13af2.cloudfunctions.net/registerForPremiumEvent';

const EVENT_CATEGORIES = [
  { id: 'WORKSHOP', emoji: '🎓', label: 'Workshops', color: 'from-blue-500 to-cyan-500' },
  { id: 'SPORTS', emoji: '⚽', label: 'Sports Events', color: 'from-green-500 to-emerald-500' },
  { id: 'NETWORKING', emoji: '🤝', label: 'Networking', color: 'from-purple-500 to-pink-500' },
  { id: 'RETREAT', emoji: '🏖️', label: 'Retreats', color: 'from-orange-500 to-red-500' },
  { id: 'CONFERENCE', emoji: '🎤', label: 'Conferences', color: 'from-indigo-500 to-violet-500' },
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

  useEffect(() => {
    fetchEvents();
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
      filtered = filtered.filter(e => e.pricing.points <= user.points);
    } else if (priceFilter === 'premium') {
      filtered = filtered.filter(e => e.pricing.points > 3000);
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

      // Sort by start date ascending
      eventsList.sort((a, b) => {
        const aDate = typeof a.dates?.start === 'string' ? new Date(a.dates.start) : (a.dates?.start || new Date(0));
        const bDate = typeof b.dates?.start === 'string' ? new Date(b.dates.start) : (b.dates?.start || new Date(0));
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
          <div className="font-bold text-2xl text-purple-600">{user.points.toLocaleString()}</div>
        </div>
      </div>

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
                className={`px-4 py-2 rounded-full border-2 transition-all whitespace-nowrap ${
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
                  className={`px-4 py-2 rounded-full border-2 transition-all whitespace-nowrap flex items-center gap-2 ${
                    selectedCategory === cat.id
                      ? 'border-purple-500 bg-purple-50 text-purple-700 font-bold'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
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
                className={`px-4 py-2 rounded-full border-2 transition-all whitespace-nowrap ${
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
                  className={`px-4 py-2 rounded-full border-2 transition-all whitespace-nowrap ${
                    selectedCity === city
                      ? 'border-purple-500 bg-purple-50 text-purple-700 font-bold'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  📍 {city}
                </button>
              ))}
            </div>
          </div>

          {/* Price & Date Row */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Price Filter */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">Price Range</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setPriceFilter('all')}
                  className={`flex-1 px-4 py-2 rounded-xl border-2 transition-all ${
                    priceFilter === 'all'
                      ? 'border-purple-500 bg-purple-50 text-purple-700 font-bold'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  All Prices
                </button>
                <button
                  onClick={() => setPriceFilter('affordable')}
                  className={`flex-1 px-4 py-2 rounded-xl border-2 transition-all ${
                    priceFilter === 'affordable'
                      ? 'border-green-500 bg-green-50 text-green-700 font-bold'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  💚 I Can Afford
                </button>
                <button
                  onClick={() => setPriceFilter('premium')}
                  className={`flex-1 px-4 py-2 rounded-xl border-2 transition-all ${
                    priceFilter === 'premium'
                      ? 'border-pink-500 bg-pink-50 text-pink-700 font-bold'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  💎 Premium
                </button>
              </div>
            </div>

            {/* Date Filter */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">Timeframe</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setDateFilter('all')}
                  className={`px-4 py-2 rounded-xl border-2 transition-all ${
                    dateFilter === 'all'
                      ? 'border-purple-500 bg-purple-50 text-purple-700 font-bold'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  All Dates
                </button>
                <button
                  onClick={() => setDateFilter('upcoming')}
                  className={`px-4 py-2 rounded-xl border-2 transition-all ${
                    dateFilter === 'upcoming'
                      ? 'border-purple-500 bg-purple-50 text-purple-700 font-bold'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  Upcoming
                </button>
                <button
                  onClick={() => setDateFilter('this-month')}
                  className={`px-4 py-2 rounded-xl border-2 transition-all ${
                    dateFilter === 'this-month'
                      ? 'border-purple-500 bg-purple-50 text-purple-700 font-bold'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  This Month
                </button>
                <button
                  onClick={() => setDateFilter('next-month')}
                  className={`px-4 py-2 rounded-xl border-2 transition-all ${
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
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <PremiumEventCard key={event.id} event={event} userPoints={user.points} userId={user.id} />
          ))}
        </div>
      )}
    </div>
  );
};

// Premium Event Card Component
const PremiumEventCard: React.FC<{ event: PremiumEvent; userPoints: number; userId: string }> = ({ event, userPoints, userId }) => {
  const [registering, setRegistering] = React.useState(false);
  const [paymentMethod, setPaymentMethod] = React.useState<'points' | 'cash'>('points');
  const canAffordPoints = userPoints >= event.pricing.points;
  const spotsLeft = event.capacity - event.registered;
  const category = EVENT_CATEGORIES.find(c => c.id === event.category);
  const startDate = new Date(event.dates.start);
  const isSoldOut = event.status === 'SOLD_OUT' || spotsLeft === 0;

  const handleRegister = async () => {
    if (paymentMethod === 'points' && !canAffordPoints) {
      alert(`You need ${event.pricing.points - userPoints} more points to register for this event.`);
      return;
    }

    const confirmed = confirm(
      `Register for ${event.title}?\n\n` +
      `Payment: ${paymentMethod === 'points' ? `${event.pricing.points.toLocaleString()} points` : `€${event.pricing.cash}`}\n` +
      `Duration: ${event.dates.duration} day${event.dates.duration > 1 ? 's' : ''}\n` +
      `Location: ${event.location.city}, ${event.location.country}`
    );

    if (!confirmed) return;

    setRegistering(true);
    try {
      const response = await fetch(REGISTER_EVENT_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          eventId: event.id,
          paymentMethod: paymentMethod
        })
      });

      const data = await response.json();

      if (!data.success) {
        alert(`❌ Registration failed: ${data.error}`);
        return;
      }

      alert(
        `✅ Successfully registered for ${event.title}!\n\n` +
        `Payment: ${paymentMethod === 'points' ? `${event.pricing.points.toLocaleString()} points deducted` : `€${event.pricing.cash} charged`}\n` +
        `Location: ${event.location.city}, ${event.location.country}\n` +
        `Start Date: ${startDate.toLocaleDateString()}\n\n` +
        `Check your email for event details and confirmation.`
      );
      
      // Refresh the page to update points balance and event capacity
      window.location.reload();
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
      <div className="relative h-56">
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
        <h3 className="font-bold text-xl text-[#1E0E62] mb-3 line-clamp-2">
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
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className={`p-3 rounded-xl border-2 transition-all ${
            canAffordPoints ? 'border-purple-200 bg-purple-50' : 'border-gray-200 bg-gray-50 opacity-50'
          }`}>
            <div className="text-xs text-gray-600 mb-1">With Points</div>
            <div className={`font-bold text-lg ${canAffordPoints ? 'text-purple-600' : 'text-gray-500'}`}>
              {event.pricing.points.toLocaleString()} pts
            </div>
            {!canAffordPoints && (
              <div className="text-xs text-red-500 mt-1">Insufficient points</div>
            )}
          </div>
          <div className="p-3 rounded-xl border-2 border-pink-200 bg-pink-50">
            <div className="text-xs text-gray-600 mb-1">With Cash</div>
            <div className="font-bold text-lg text-pink-600">
              €{event.pricing.cash}
            </div>
          </div>
        </div>

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
            `Need ${event.pricing.points - userPoints} more points`
          ) : (
            `Register for ${paymentMethod === 'points' ? `${event.pricing.points.toLocaleString()} pts` : `€${event.pricing.cash}`}`
          )}
        </button>
      </div>
    </div>
  );
};
