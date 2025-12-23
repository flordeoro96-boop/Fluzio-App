/**
 * Business Events Screen
 * Discover and join local entrepreneurship events
 */

import React, { useState, useEffect } from 'react';
import {
  Search,
  MapPin,
  Calendar,
  Clock,
  Users,
  Euro,
  ChevronRight,
  Sparkles,
  Filter,
  X
} from 'lucide-react';
import { User } from '../../types';
import { format } from 'date-fns';
import { getAllEvents } from '../../src/services/eventService';

interface BusinessEventsScreenProps {
  user: User;
  onNavigate: (route: string) => void;
}

interface BusinessEvent {
  id: string;
  title: string;
  type: 'meetup' | 'workshop' | 'conference' | 'networking';
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
}

interface EventAttendee {
  id: string;
  name: string;
  avatar: string;
}



const eventCategories = [
  'All',
  'Meetups',
  'Workshops',
  'Conferences',
  'Networking',
  'Webinars'
];

export const BusinessEventsScreen: React.FC<BusinessEventsScreenProps> = ({
  user,
  onNavigate
}) => {
  const [events, setEvents] = useState<BusinessEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeCity, setActiveCity] = useState('All Cities');
  const [showMoreCategories, setShowMoreCategories] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Advanced filters
  const [durationFilter, setDurationFilter] = useState('All');
  const [timeFilter, setTimeFilter] = useState('All');
  const [genderFilter, setGenderFilter] = useState('All');

  useEffect(() => {
    loadEvents();
  }, []); // Remove city dependency - we fetch all events

  const loadEvents = async () => {
    try {
      setLoading(true);
      
      // Fetch ALL events - business events are open to businesses from any city
      console.log('[BusinessEvents] Fetching all events');
      const firestoreEvents = await getAllEvents();
      console.log('[BusinessEvents] Found events:', firestoreEvents.length, firestoreEvents);
      
      // Convert to BusinessEvent format
      const businessEvents: BusinessEvent[] = firestoreEvents.map(event => ({
        id: event.id,
        title: event.title,
        type: (event as any).category?.toLowerCase() || 'networking',
        date: event.date,
        time: (event as any).time || 'TBD',
        location: typeof event.location === 'string' ? event.location : (event.location?.city || event.city || 'TBD'),
        description: event.description,
        image: event.imageUrl,
        price: (event as any).cost,
        isFree: !(event as any).cost || (event as any).cost === 0,
        isHighlighted: (event as any).isFeatured,
        attendeeCount: event.attendees?.length || 0,
        maxAttendees: event.maxAttendees
      }));
      
      console.log('[BusinessEvents] Converted to business events:', businessEvents.length);
      setEvents(businessEvents);
    } catch (error) {
      console.error('[BusinessEvents] Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  // Extract unique cities from events
  const cities = ['All Cities', ...Array.from(new Set(events.map(e => e.location.split(',')[0].trim()).filter(Boolean)))];

  // Dynamically extract available filter options from events
  const availableDurations = ['All'];
  const availableTimes = ['All'];
  const availableGenders = ['All'];

  events.forEach(event => {
    const eventText = `${event.title} ${event.description}`.toLowerCase();
    const eventTime = event.time?.toLowerCase() || '';
    
    // Check duration
    if (eventText.includes('multi-day') && !availableDurations.includes('Multi-Day')) {
      availableDurations.push('Multi-Day');
    }
    if ((eventText.includes('weekend') || event.title.toLowerCase().includes('weekend')) && !availableDurations.includes('Weekend')) {
      availableDurations.push('Weekend');
    }
    if (!eventText.includes('multi-day') && !availableDurations.includes('Single Day')) {
      availableDurations.push('Single Day');
    }
    
    // Check time
    if ((eventTime.includes('am') || eventText.includes('morning')) && !availableTimes.includes('Morning')) {
      availableTimes.push('Morning');
    }
    if ((eventTime.includes('pm') || eventText.includes('afternoon')) && !availableTimes.includes('Afternoon')) {
      availableTimes.push('Afternoon');
    }
    if ((eventText.includes('evening') || eventText.includes('night')) && !availableTimes.includes('Evening')) {
      availableTimes.push('Evening');
    }
    
    // Check gender/audience
    if ((eventText.includes('women') || eventText.includes('female')) && !availableGenders.includes('Women Only')) {
      availableGenders.push('Women Only');
    }
    if ((eventText.includes('men only') || eventText.includes('male only')) && !availableGenders.includes('Men Only')) {
      availableGenders.push('Men Only');
    }
    if (!eventText.includes('women only') && !eventText.includes('men only') && !availableGenders.includes('Mixed')) {
      availableGenders.push('Mixed');
    }
  });

  const filteredEvents = events.filter(event => {
    const matchesSearch = !searchQuery ||
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = activeCategory === 'All' ||
      event.type.toLowerCase() === activeCategory.toLowerCase();

    const eventCity = event.location.split(',')[0].trim();
    const matchesCity = activeCity === 'All Cities' || eventCity === activeCity;

    // Duration filter (extract from description or title)
    const matchesDuration = durationFilter === 'All' || 
      (durationFilter === 'Single Day' && !event.description.toLowerCase().includes('multi-day')) ||
      (durationFilter === 'Multi-Day' && event.description.toLowerCase().includes('multi-day')) ||
      (durationFilter === 'Weekend' && (event.description.toLowerCase().includes('weekend') || event.title.toLowerCase().includes('weekend')));

    // Time filter (extract from time field or description)
    const eventTime = event.time?.toLowerCase() || '';
    const matchesTime = timeFilter === 'All' ||
      (timeFilter === 'Morning' && (eventTime.includes('am') || eventTime.includes('morning'))) ||
      (timeFilter === 'Afternoon' && (eventTime.includes('pm') || eventTime.includes('afternoon'))) ||
      (timeFilter === 'Evening' && (eventTime.includes('evening') || eventTime.includes('night')));

    // Gender filter (extract from description or title)
    const eventText = `${event.title} ${event.description}`.toLowerCase();
    const matchesGender = genderFilter === 'All' ||
      (genderFilter === 'Women Only' && (eventText.includes('women') || eventText.includes('female'))) ||
      (genderFilter === 'Men Only' && (eventText.includes('men') || eventText.includes('male'))) ||
      (genderFilter === 'Mixed' && !eventText.includes('women only') && !eventText.includes('men only'));

    return matchesSearch && matchesCategory && matchesCity && matchesDuration && matchesTime && matchesGender;
  });

  const displayedCategories = showMoreCategories 
    ? eventCategories 
    : eventCategories.slice(0, 3);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white pb-24">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-[#1E0E62] mb-2">Events</h1>
          <p className="text-gray-600 flex items-center justify-center gap-1 flex-wrap px-4">
            Discover and join local entrepreneurship<br />events to grow your network
            <button className="text-purple-600 hover:text-purple-700">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </button>
          </p>
        </div>

        {/* Search Bar with Filter Button */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-700"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-5 py-4 rounded-2xl font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
              durationFilter !== 'All' || timeFilter !== 'All' || genderFilter !== 'All'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-5 h-5" />
            Filters
            {(durationFilter !== 'All' || timeFilter !== 'All' || genderFilter !== 'All') && (
              <span className="bg-white text-purple-600 px-2 py-0.5 rounded-full text-xs font-bold">
                {[durationFilter !== 'All', timeFilter !== 'All', genderFilter !== 'All'].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>

        {/* Filter Modal */}
        {showFilters && (
          <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 space-y-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-gray-900">Advanced Filters</h3>
              <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Duration Filter */}
            {availableDurations.length > 1 && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Event Duration</label>
                <div className="flex flex-wrap gap-2">
                  {availableDurations.map(duration => (
                    <button
                      key={duration}
                      onClick={() => setDurationFilter(duration)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        durationFilter === duration
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {duration}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Time of Day Filter */}
            {availableTimes.length > 1 && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Time of Day</label>
                <div className="flex flex-wrap gap-2">
                  {availableTimes.map(time => (
                    <button
                      key={time}
                      onClick={() => setTimeFilter(time)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                        timeFilter === time
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Clock className="w-4 h-4" />
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Gender Filter */}
            {availableGenders.length > 1 && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Audience</label>
                <div className="flex flex-wrap gap-2">
                  {availableGenders.map(gender => (
                    <button
                      key={gender}
                      onClick={() => setGenderFilter(gender)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        genderFilter === gender
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {gender}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Clear All Button */}
            <button
              onClick={() => {
                setDurationFilter('All');
                setTimeFilter('All');
                setGenderFilter('All');
              }}
              className="w-full py-3 text-purple-600 font-semibold hover:bg-purple-50 rounded-lg transition-all"
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* City Filter Tabs */}
        <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {cities.map((city) => (
              <button
                key={city}
                onClick={() => setActiveCity(city)}
                className={`px-5 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap transition-all ${
                  activeCity === city
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <MapPin className="w-4 h-4 inline-block mr-1 -mt-0.5" />
                {city}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide items-center">
          {displayedCategories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-6 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
                activeCategory === category
                  ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                  : 'bg-purple-50 text-gray-700 hover:bg-purple-100'
              }`}
            >
              {category}
            </button>
          ))}
          {!showMoreCategories && eventCategories.length > 3 && (
            <button
              onClick={() => setShowMoreCategories(true)}
              className="px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap text-purple-600 hover:bg-purple-50 transition-all flex items-center gap-1"
            >
              <Sparkles className="w-4 h-4" />
              +{eventCategories.length - 3} more
            </button>
          )}
        </div>

        {/* Events List */}
        <div className="space-y-4">
          {filteredEvents.map((event, idx) => {
            const isHighlighted = event.isHighlighted;

            return (
              <div
                key={event.id}
                className={`rounded-3xl overflow-hidden shadow-sm border transition-all hover:shadow-md ${
                  isHighlighted
                    ? 'bg-gradient-to-br from-blue-100 via-purple-100 to-purple-200 border-purple-300'
                    : 'bg-white border-gray-100'
                }`}
              >
                {/* Highlighted Badge */}
                {isHighlighted && (
                  <div className="px-6 pt-4 pb-2">
                    <span className="inline-block px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-full">
                      Highlighted
                    </span>
                  </div>
                )}

                {/* Event Image */}
                {event.image && (
                  <div className={isHighlighted ? 'px-4' : ''}>
                    <img
                      src={event.image}
                      alt={event.title}
                      className={`w-full object-cover ${
                        isHighlighted ? 'h-48 rounded-2xl' : 'h-32 rounded-t-3xl'
                      }`}
                    />
                  </div>
                )}

                {/* Event Content */}
                <div className="p-5">
                  <h3 className="text-xl font-bold text-[#1E0E62] mb-2">
                    {event.title}
                  </h3>

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

                  {/* Description */}
                  <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                    {event.description}
                  </p>

                  {/* Footer with Attendees and Action */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Attendee Avatars */}
                      {event.attendees && event.attendees.length > 0 && (
                        <div className="flex -space-x-2">
                          {event.attendees.slice(0, 4).map((attendee) => (
                            <img
                              key={attendee.id}
                              src={attendee.avatar}
                              alt={attendee.name}
                              className="w-8 h-8 rounded-full border-2 border-white object-cover"
                            />
                          ))}
                        </div>
                      )}

                      {/* Price Badge */}
                      {event.isFree ? (
                        <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-full border border-orange-200 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Free Event
                        </span>
                      ) : event.price ? (
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-full">
                          €{event.price} Ticket
                        </span>
                      ) : null}

                      {/* Additional Badges */}
                      {event.badges?.map((badge, badgeIdx) => (
                        <span
                          key={badgeIdx}
                          className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200 flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3" />
                          {badge}
                        </span>
                      ))}
                    </div>

                    {/* View Profile Button */}
                    <button
                      onClick={() => onNavigate(`/event/${event.id}`)}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-2.5 px-6 rounded-full hover:shadow-lg transition-all text-sm"
                    >
                      View Profile
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No events found</p>
            <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
};
