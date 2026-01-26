/**
 * Business Events Screen - Enhanced Version
 * All improvements implemented
 */

import React, { useState, useEffect } from 'react';
import {
  Search, MapPin, Calendar, Clock, Users, Euro, ChevronRight, Sparkles, Filter, X,
  Bookmark, BookmarkCheck, Share2, Download, TrendingUp, Star, ArrowUpDown, CheckCircle2
} from 'lucide-react';
import { User } from '../../types';
import { format, isPast, isFuture } from 'date-fns';
import { getAllEvents } from '../../src/services/eventService';

interface BusinessEventsScreenProps {
  user: User;
  onNavigate: (route: string) => void;
}

interface BusinessEvent {
  id: string;
  title: string;
  type: 'meetup' | 'workshop' | 'conference' | 'networking' | 'webinars';
  date: string;
  time: string;
  location: string;
  description: string;
  image?: string;
  price?: number;
  isFree?: boolean;
  isHighlighted?: boolean;
  attendees?: EventAttendee[];
  attendeeCount?: number;
  maxAttendees?: number;
  badges?: string[];
  organizer?: string;
  paymentOptions?: {
    acceptMoney?: boolean;
    acceptPoints?: boolean;
    pointsPrice?: number;
  };
}

interface EventAttendee {
  id: string;
  name: string;
  avatar: string;
}

const categoryIcons: Record<string, string> = {
  'meetups': '🤝', 'workshops': '🎓', 'conferences': '🎤',
  'networking': '🌐', 'webinars': '💻', 'all': '🎯'
};

const eventCategories = ['All', 'Meetups', 'Workshops', 'Conferences', 'Networking', 'Webinars'];

const sortOptions = [
  { value: 'date-asc', label: 'Date (Soonest)' },
  { value: 'date-desc', label: 'Date (Latest)' },
  { value: 'price-asc', label: 'Price (Low to High)' },
  { value: 'price-desc', label: 'Price (High to Low)' },
  { value: 'attendees', label: 'Most Popular' }
];

export const BusinessEventsScreen: React.FC<BusinessEventsScreenProps> = ({ user, onNavigate }) => {
  const [events, setEvents] = useState<BusinessEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeCity, setActiveCity] = useState('All Cities');
  const [showMoreCategories, setShowMoreCategories] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<BusinessEvent | null>(null);
  const [savedEvents, setSavedEvents] = useState<Set<string>>(new Set());
  const [registeredEvents, setRegisteredEvents] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState('date-asc');
  const [showPastEvents, setShowPastEvents] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [durationFilter, setDurationFilter] = useState('All');
  const [timeFilter, setTimeFilter] = useState('All');
  const [genderFilter, setGenderFilter] = useState('All');

  useEffect(() => {
    loadEvents();
    loadSavedEvents();
    loadRegisteredEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const firestoreEvents = await getAllEvents();
      const businessEvents: BusinessEvent[] = firestoreEvents.map(event => {
        const ticketingPrice = (event as any).ticketing?.price || (event as any).cost || 0;
        return {
          id: event.id,
          title: event.title,
          type: (event as any).category?.toLowerCase() || 'networking',
          date: event.date,
          time: (event as any).time || 'TBD',
          location: typeof event.location === 'string' ? event.location : (event.location?.city || event.city || 'TBD'),
          description: event.description,
          image: event.imageUrl,
          price: ticketingPrice,
          isFree: (event as any).ticketing?.mode === 'FREE' || ticketingPrice === 0,
          isHighlighted: (event as any).isFeatured,
          attendeeCount: event.attendees?.length || 0,
          maxAttendees: event.maxAttendees,
          paymentOptions: (event as any).ticketing?.paymentOptions || {
            acceptMoney: true,
            acceptPoints: false
          }
        };
      });
      setEvents(businessEvents);
    } catch (error) {
      console.error('[BusinessEvents] Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedEvents = () => {
    const saved = localStorage.getItem('savedEvents');
    if (saved) setSavedEvents(new Set(JSON.parse(saved)));
  };

  const loadRegisteredEvents = () => {
    const registered = localStorage.getItem('registeredEvents');
    if (registered) setRegisteredEvents(new Set(JSON.parse(registered)));
  };

  const toggleSaveEvent = (eventId: string) => {
    const newSaved = new Set(savedEvents);
    if (newSaved.has(eventId)) {
      newSaved.delete(eventId);
    } else {
      newSaved.add(eventId);
    }
    setSavedEvents(newSaved);
    localStorage.setItem('savedEvents', JSON.stringify([...newSaved]));
  };

  const registerForEvent = (event: BusinessEvent) => {
    const newRegistered = new Set(registeredEvents);
    newRegistered.add(event.id);
    setRegisteredEvents(newRegistered);
    localStorage.setItem('registeredEvents', JSON.stringify([...newRegistered]));
    alert(`Successfully registered for ${event.title}! 🎉`);
    setSelectedEvent(null);
  };

  const shareEvent = async (event: BusinessEvent) => {
    const shareData = {
      title: event.title,
      text: `Check out: ${event.title}`,
      url: window.location.href
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {}
    } else {
      navigator.clipboard.writeText(`${event.title} - ${window.location.href}`);
      alert('Event link copied!');
    }
  };

  const downloadCalendarEvent = (event: BusinessEvent) => {
    const eventDate = new Date(event.date);
    const formatDate = (date: Date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${formatDate(eventDate)}
DTEND:${formatDate(new Date(eventDate.getTime() + 2 * 60 * 60 * 1000))}
SUMMARY:${event.title}
DESCRIPTION:${event.description}
LOCATION:${event.location}
END:VEVENT
END:VCALENDAR`;
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.title.replace(/\s+/g, '_')}.ics`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const cities = ['All Cities', ...Array.from(new Set(events.map(e => e.location.split(',')[0].trim()).filter(Boolean)))];

  const filteredEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    const isEventPast = isPast(eventDate);
    if (!showPastEvents && isEventPast) return false;
    if (showPastEvents && !isEventPast) return false;

    const matchesSearch = !searchQuery ||
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || event.type.toLowerCase() === activeCategory.toLowerCase();
    const eventCity = event.location.split(',')[0].trim();
    const matchesCity = activeCity === 'All Cities' || eventCity === activeCity;

    return matchesSearch && matchesCategory && matchesCity;
  });

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    switch (sortBy) {
      case 'date-asc': return new Date(a.date).getTime() - new Date(b.date).getTime();
      case 'date-desc': return new Date(b.date).getTime() - new Date(a.date).getTime();
      case 'price-asc': return (a.price || 0) - (b.price || 0);
      case 'price-desc': return (b.price || 0) - (a.price || 0);
      case 'attendees': return (b.attendeeCount || 0) - (a.attendeeCount || 0);
      default: return 0;
    }
  });

  const displayedCategories = showMoreCategories ? eventCategories : eventCategories.slice(0, 3);
  const upcomingCount = events.filter(e => isFuture(new Date(e.date))).length;
  const pastCount = events.filter(e => isPast(new Date(e.date))).length;

  const SkeletonCard = () => (
    <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 animate-pulse">
      <div className="h-32 bg-gray-200"></div>
      <div className="p-5 space-y-3">
        <div className="h-6 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white pb-24">
        <div className="p-6 space-y-6">
          <div className="text-center mb-6">
            <div className="h-8 bg-gray-200 rounded w-32 mx-auto mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-64 mx-auto animate-pulse"></div>
          </div>
          <div className="space-y-4">{[1, 2, 3].map(i => <SkeletonCard key={i} />)}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white pb-24">
      <div className="p-6 space-y-6">
        {/* Header with Stats */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-[#1E0E62] mb-2">Events</h1>
          <p className="text-gray-600 mb-4">Discover and join local events</p>
          <div className="flex gap-3 justify-center">
            <div className="bg-white px-4 py-2 rounded-xl border shadow-sm">
              <span className="text-purple-600 font-bold">{upcomingCount}</span>
              <span className="text-gray-600 text-sm ml-1">Upcoming</span>
            </div>
            <div className="bg-white px-4 py-2 rounded-xl border shadow-sm">
              <span className="text-gray-600 font-bold">{savedEvents.size}</span>
              <span className="text-gray-600 text-sm ml-1">Saved</span>
            </div>
            <div className="bg-white px-4 py-2 rounded-xl border shadow-sm">
              <span className="text-green-600 font-bold">{registeredEvents.size}</span>
              <span className="text-gray-600 text-sm ml-1">Registered</span>
            </div>
          </div>
        </div>

        {/* Past/Upcoming Toggle */}
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => setShowPastEvents(false)}
            className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              !showPastEvents ? 'bg-purple-600 text-white shadow-md' : 'bg-white text-gray-600 border'
            }`}>
            Upcoming ({upcomingCount})
          </button>
          <button
            onClick={() => setShowPastEvents(true)}
            className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              showPastEvents ? 'bg-purple-600 text-white shadow-md' : 'bg-white text-gray-600 border'
            }`}>
            Past ({pastCount})
          </button>
        </div>

        {/* Search with Sort */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="px-5 py-4 rounded-2xl font-semibold bg-white border hover:bg-gray-50 transition-all flex items-center gap-2">
              <ArrowUpDown className="w-5 h-5" />
              Sort
            </button>
            {showSortMenu && (
              <div className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border py-2 min-w-[200px] z-10">
                {sortOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => { setSortBy(option.value); setShowSortMenu(false); }}
                    className={`w-full text-left px-4 py-3 hover:bg-purple-50 ${
                      sortBy === option.value ? 'bg-purple-50 text-purple-700 font-semibold' : ''
                    }`}>
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* City Filter */}
        <div className="bg-white rounded-2xl p-2 shadow-sm border">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {cities.map(city => (
              <button
                key={city}
                onClick={() => setActiveCity(city)}
                className={`px-5 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap transition-all ${
                  activeCity === city
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}>
                <MapPin className="w-4 h-4 inline-block mr-1 -mt-0.5" />
                {city}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {displayedCategories.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-6 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
                activeCategory === category
                  ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                  : 'bg-purple-50 text-gray-700 hover:bg-purple-100'
              }`}>
              <span>{categoryIcons[category.toLowerCase()]}</span>
              {category}
            </button>
          ))}
          {!showMoreCategories && eventCategories.length > 3 && (
            <button
              onClick={() => setShowMoreCategories(true)}
              className="px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap text-purple-600 hover:bg-purple-50 flex items-center gap-1">
              <Sparkles className="w-4 h-4" />
              +{eventCategories.length - 3} more
            </button>
          )}
        </div>

        {/* Events List */}
        <div className="space-y-4">
          {sortedEvents.map((event, idx) => {
            const isSaved = savedEvents.has(event.id);
            const isRegistered = registeredEvents.has(event.id);

            return (
              <div
                key={event.id}
                className={`rounded-3xl overflow-hidden shadow-sm border transition-all hover:shadow-xl hover:scale-[1.02] duration-300 ${
                  event.isHighlighted
                    ? 'bg-gradient-to-br from-blue-100 via-purple-100 to-purple-200 border-purple-300'
                    : 'bg-white border-gray-100'
                }`}
                style={{ animationDelay: `${idx * 50}ms` }}>
                {event.isHighlighted && (
                  <div className="px-6 pt-4 pb-2">
                    <span className="inline-block px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-full">
                      ⭐ Featured
                    </span>
                  </div>
                )}

                {event.image && (
                  <div className={`relative ${event.isHighlighted ? 'px-4' : ''}`}>
                    <img
                      src={event.image}
                      alt={event.title}
                      className={`w-full object-cover ${event.isHighlighted ? 'h-48 rounded-2xl' : 'h-32 rounded-t-3xl'}`}
                      onError={(e) => {
                        console.warn(`[BusinessEvents] Failed to load image for event: ${event.title}`);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <div className="absolute top-2 right-2 flex gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleSaveEvent(event.id); }}
                        className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all shadow-lg">
                        {isSaved ? <BookmarkCheck className="w-5 h-5 text-purple-600" /> : <Bookmark className="w-5 h-5 text-gray-700" />}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); shareEvent(event); }}
                        className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all shadow-lg">
                        <Share2 className="w-5 h-5 text-gray-700" />
                      </button>
                    </div>
                    {isRegistered && (
                      <div className="absolute bottom-2 left-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Registered
                      </div>
                    )}
                  </div>
                )}

                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-[#1E0E62] flex-1">{event.title}</h3>
                    {!event.image && (
                      <div className="flex gap-2">
                        <button onClick={() => toggleSaveEvent(event.id)} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full">
                          {isSaved ? <BookmarkCheck className="w-5 h-5 text-purple-600" /> : <Bookmark className="w-5 h-5 text-gray-500" />}
                        </button>
                        <button onClick={() => shareEvent(event)} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full">
                          <Share2 className="w-5 h-5 text-gray-500" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 mb-3 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span>{format(new Date(event.date), 'EEEE, MMMM dd')} • {event.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span>{event.location}</span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-700 mb-4 leading-relaxed line-clamp-2">{event.description}</p>

                  {/* Spots Left Indicator */}
                  {event.maxAttendees && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-600 font-medium">
                          <Users className="w-3 h-3 inline mr-1" />
                          {event.attendeeCount || 0} / {event.maxAttendees} attendees
                        </span>
                        {event.maxAttendees && event.maxAttendees - (event.attendeeCount || 0) <= 10 && event.maxAttendees - (event.attendeeCount || 0) > 0 && (
                          <span className="text-orange-600 font-bold animate-pulse">
                            Only {event.maxAttendees - (event.attendeeCount || 0)} spots left!
                          </span>
                        )}
                        {event.maxAttendees && event.maxAttendees - (event.attendeeCount || 0) === 0 && (
                          <span className="text-red-600 font-bold">Sold Out</span>
                        )}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            ((event.attendeeCount || 0) / event.maxAttendees) * 100 > 90
                              ? 'bg-red-500'
                              : ((event.attendeeCount || 0) / event.maxAttendees) * 100 > 70
                              ? 'bg-orange-500'
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(((event.attendeeCount || 0) / event.maxAttendees) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {event.isFree ? (
                        <span className="px-3 py-1.5 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-200 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          Free
                        </span>
                      ) : (
                        <>
                          {event.paymentOptions?.acceptMoney && event.price && (
                            <span className="px-3 py-1.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full border border-blue-200 flex items-center gap-1">
                              <Euro className="w-3 h-3" />
                              €{event.price}
                            </span>
                          )}
                          {event.paymentOptions?.acceptPoints && event.paymentOptions?.pointsPrice && (
                            <span className="px-3 py-1.5 bg-purple-100 text-purple-700 text-xs font-bold rounded-full border border-purple-200 flex items-center gap-1">
                              <Star className="w-3 h-3" />
                              {event.paymentOptions.pointsPrice} pts
                            </span>
                          )}
                          {event.paymentOptions?.acceptMoney && event.paymentOptions?.acceptPoints && (
                            <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full">BOTH</span>
                          )}
                        </>
                      )}
                      {isRegistered && (
                        <span className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full">✓</span>
                      )}
                    </div>

                    <button
                      onClick={() => setSelectedEvent(event)}
                      disabled={event.maxAttendees && event.maxAttendees - (event.attendeeCount || 0) === 0}
                      className={`font-semibold py-2.5 px-6 rounded-full transition-all text-sm flex items-center gap-2 ${
                        event.maxAttendees && event.maxAttendees - (event.attendeeCount || 0) === 0
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg hover:scale-105'
                      }`}>
                      {event.maxAttendees && event.maxAttendees - (event.attendeeCount || 0) === 0 ? 'Sold Out' : 'View Details'}
                      {!(event.maxAttendees && event.maxAttendees - (event.attendeeCount || 0) === 0) && <ChevronRight className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {sortedEvents.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No events found</p>
          </div>
        )}
      </div>

      {/* Event Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedEvent(null)}>
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {selectedEvent.image && (
              <div className="relative h-64 w-full">
                <img 
                  src={selectedEvent.image} 
                  alt={selectedEvent.title} 
                  className="w-full h-full object-cover rounded-t-3xl"
                  onError={(e) => {
                    console.warn(`[BusinessEvents Modal] Failed to load image for event: ${selectedEvent.title}`);
                    e.currentTarget.parentElement!.style.display = 'none';
                  }}
                />
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100">
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute top-4 left-4 flex gap-2">
                  <button
                    onClick={() => toggleSaveEvent(selectedEvent.id)}
                    className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100">
                    {savedEvents.has(selectedEvent.id) ? <BookmarkCheck className="w-5 h-5 text-purple-600" /> : <Bookmark className="w-5 h-5" />}
                  </button>
                  <button onClick={() => shareEvent(selectedEvent)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100">
                    <Share2 className="w-5 h-5" />
                  </button>
                  <button onClick={() => downloadCalendarEvent(selectedEvent)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100">
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            <div className="p-6">
              <h2 className="text-2xl font-bold text-[#1E0E62] mb-4">{selectedEvent.title}</h2>

              {registeredEvents.has(selectedEvent.id) && (
                <div className="mb-4 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-900">You're Registered!</p>
                    <p className="text-sm text-green-700">We'll remind you before the event.</p>
                  </div>
                </div>
              )}

              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">Date & Time</p>
                    <p className="text-gray-700">{format(new Date(selectedEvent.date), 'EEEE, MMMM dd, yyyy')}</p>
                    <p className="text-gray-600">{selectedEvent.time}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">Location</p>
                    <p className="text-gray-700">{selectedEvent.location}</p>
                  </div>
                </div>

                {/* Price & Payment Options */}
                <div className="flex items-start gap-3">
                  <Euro className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Price & Payment</p>
                    {selectedEvent.isFree ? (
                      <p className="text-green-600 font-bold">Free Event</p>
                    ) : (
                      <div className="space-y-1">
                        {selectedEvent.paymentOptions?.acceptMoney && selectedEvent.price && (
                          <p className="text-gray-700 flex items-center gap-2">
                            <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                              <Euro className="w-4 h-4 text-blue-600" />
                            </span>
                            €{selectedEvent.price} (Cash/Card)
                          </p>
                        )}
                        {selectedEvent.paymentOptions?.acceptPoints && selectedEvent.paymentOptions?.pointsPrice && (
                          <p className="text-gray-700 flex items-center gap-2">
                            <span className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                              <Star className="w-4 h-4 text-purple-600" />
                            </span>
                            {selectedEvent.paymentOptions.pointsPrice} Points
                          </p>
                        )}
                        {selectedEvent.paymentOptions?.acceptMoney && selectedEvent.paymentOptions?.acceptPoints && (
                          <p className="text-xs text-amber-600 font-semibold mt-1">✨ Pay with either money or points</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Availability */}
                {selectedEvent.maxAttendees && (
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-purple-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">Availability</p>
                      <p className="text-gray-700">
                        {selectedEvent.attendeeCount || 0} / {selectedEvent.maxAttendees} registered
                      </p>
                      {selectedEvent.maxAttendees - (selectedEvent.attendeeCount || 0) <= 10 && selectedEvent.maxAttendees - (selectedEvent.attendeeCount || 0) > 0 && (
                        <p className="text-orange-600 font-bold text-sm mt-1 animate-pulse">⚠️ Only {selectedEvent.maxAttendees - (selectedEvent.attendeeCount || 0)} spots remaining!</p>
                      )}
                      {selectedEvent.maxAttendees - (selectedEvent.attendeeCount || 0) === 0 && (
                        <p className="text-red-600 font-bold text-sm mt-1">❌ Event is sold out</p>
                      )}
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            ((selectedEvent.attendeeCount || 0) / selectedEvent.maxAttendees) * 100 > 90
                              ? 'bg-red-500'
                              : ((selectedEvent.attendeeCount || 0) / selectedEvent.maxAttendees) * 100 > 70
                              ? 'bg-orange-500'
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(((selectedEvent.attendeeCount || 0) / selectedEvent.maxAttendees) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-6">
                <h3 className="font-bold text-lg text-gray-900 mb-2">About This Event</h3>
                <p className="text-gray-700 leading-relaxed">{selectedEvent.description}</p>
              </div>

              <div className="flex gap-3">
                {selectedEvent.maxAttendees && selectedEvent.maxAttendees - (selectedEvent.attendeeCount || 0) === 0 ? (
                  <button className="flex-1 bg-gray-400 text-white font-semibold py-3 px-6 rounded-full cursor-not-allowed" disabled>
                    ❌ Sold Out
                  </button>
                ) : !registeredEvents.has(selectedEvent.id) ? (
                  <button
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-full hover:shadow-lg transition-all"
                    onClick={() => registerForEvent(selectedEvent)}>
                    Register Now
                  </button>
                ) : (
                  <button className="flex-1 bg-green-500 text-white font-semibold py-3 px-6 rounded-full" disabled>
                    ✓ Registered
                  </button>
                )}
                <button className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-full hover:bg-gray-200" onClick={() => setSelectedEvent(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
    </div>
  );
};
