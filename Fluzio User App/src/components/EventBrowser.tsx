import React, { useState, useEffect } from 'react';
import { Loader2, Calendar, MapPin, Users, Trophy, DollarSign, Filter, Search, Tag } from 'lucide-react';
import type { Event } from '../types/events';
import { ENDPOINTS } from '../config/firebaseFunctions';

interface EventBrowserProps {
  businessId: string;
  onEventSelect?: (eventId: string) => void;
}

/**
 * EventBrowser Component
 * 
 * Browse and filter available events for businesses
 * - Shows only eligible events based on level and tier
 * - Displays event details with capacity and pricing
 * - Indicates if free credit can be used
 * - Filter by type and search
 */
const EventBrowser: React.FC<EventBrowserProps> = ({ businessId, onEventSelect }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [entitlement, setEntitlement] = useState<any>(null);

  useEffect(() => {
    fetchEvents();
    fetchEntitlement();
  }, [businessId]);

  useEffect(() => {
    applyFilters();
  }, [events, searchQuery, typeFilter]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${ENDPOINTS.getAvailableEvents}?businessId=${businessId}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }

      const data = await response.json();

      if (data.success) {
        setEvents(data.events);
      } else {
        setError(data.error || 'Failed to fetch events');
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const fetchEntitlement = async () => {
    try {
      const response = await fetch(
        `${ENDPOINTS.getMyEntitlements}?businessId=${businessId}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setEntitlement(data.entitlement);
        }
      }
    } catch (err) {
      console.error('Error fetching entitlement:', err);
    }
  };

  const applyFilters = () => {
    let filtered = [...events];

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.venue.toLowerCase().includes(query)
      );
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(event => event.eventType === typeFilter);
    }

    // Sort by date (upcoming first)
    filtered.sort((a, b) => 
      new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
    );

    setFilteredEvents(filtered);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays <= 7) return `In ${diffDays} days`;

    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  const canUseCredit = (event: Event) => {
    if (!entitlement) return false;

    if (event.isPremium) {
      return entitlement.premiumCreditsRemaining > 0;
    } else {
      return entitlement.standardCreditsRemaining > 0;
    }
  };

  const getCapacityStatus = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    
    if (percentage >= 100) return { text: 'Full', color: 'text-red-600', bgColor: 'bg-red-100' };
    if (percentage >= 90) return { text: 'Almost Full', color: 'text-orange-600', bgColor: 'bg-orange-100' };
    if (percentage >= 70) return { text: 'Filling Fast', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    return { text: 'Available', color: 'text-green-600', bgColor: 'bg-green-100' };
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Community Events</h1>
        <p className="text-gray-600">Discover and register for exclusive business events</p>
      </div>

      {/* Credits Widget */}
      {entitlement && (
        <div className="mb-6 p-4 bg-white border border-purple-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">Your Event Credits</h3>
              <p className="text-xs text-gray-500">
                {entitlement.periodType === 'MONTHLY' ? 'Resets monthly' : 'Resets quarterly'}
              </p>
            </div>
            <div className="flex gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {entitlement.standardCreditsRemaining}
                </p>
                <p className="text-xs text-gray-600">Standard Events</p>
              </div>
              {entitlement.premiumCreditsAllowed > 0 && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">
                    {entitlement.premiumCreditsRemaining}
                  </p>
                  <p className="text-xs text-gray-600">Premium Events</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="mb-6 space-y-3">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 border rounded-lg flex items-center gap-2 transition-colors ${
              showFilters ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-5 h-5" />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="p-4 bg-white border border-gray-200 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
            <div className="flex flex-wrap gap-2">
              {['all', 'NETWORKING', 'WORKSHOP', 'TRAINING', 'CONFERENCE', 'MEETUP', 'CELEBRATION', 'OTHER'].map(type => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    typeFilter === type
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type === 'all' ? 'All Types' : type}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
        </div>
      )}

      {/* Events Grid */}
      {!loading && filteredEvents.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No events found</h3>
          <p className="text-gray-600">
            {searchQuery || typeFilter !== 'all' 
              ? 'Try adjusting your filters'
              : 'Check back soon for upcoming events'
            }
          </p>
        </div>
      )}

      {!loading && filteredEvents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => {
            const capacityStatus = getCapacityStatus(event.currentAttendees, event.maxCapacity);
            const hasFreeCredit = canUseCredit(event);
            const isFull = event.currentAttendees >= event.maxCapacity;

            return (
              <div
                key={event.id}
                className={`bg-white border rounded-lg overflow-hidden hover:shadow-lg transition-shadow ${
                  isFull ? 'opacity-60' : 'cursor-pointer'
                }`}
                onClick={() => !isFull && (onEventSelect ? onEventSelect(event.id) : setSelectedEvent(event.id))}
              >
                {/* Event Image */}
                {event.imageUrl && (
                  <div className="h-40 bg-gray-200 overflow-hidden">
                    <img 
                      src={event.imageUrl} 
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 flex-1">
                      {event.title}
                    </h3>
                    {event.isPremium && (
                      <Trophy className="w-5 h-5 text-yellow-500 ml-2 flex-shrink-0" />
                    )}
                  </div>

                  {/* Date and Time */}
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(typeof event.startDateTime === 'string' ? event.startDateTime : event.startDateTime.toISOString())}</span>
                    <span className="text-gray-400">•</span>
                    <span>{formatTime(typeof event.startDateTime === 'string' ? event.startDateTime : event.startDateTime.toISOString())}</span>
                  </div>

                  {/* Venue */}
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{event.venue}</span>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{event.description}</p>

                  {/* Capacity */}
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">
                      {event.currentAttendees} / {event.maxCapacity} attending
                    </span>
                    <span className={`ml-auto px-2 py-1 rounded-full text-xs font-medium ${capacityStatus.bgColor} ${capacityStatus.color}`}>
                      {capacityStatus.text}
                    </span>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                      <Tag className="w-3 h-3 mr-1" />
                      {event.eventType}
                    </span>
                  </div>

                  {/* Pricing or Credit */}
                  {!isFull && (
                    <div className="pt-4 border-t border-gray-200">
                      {hasFreeCredit ? (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-green-600">
                            🎉 Use Free Credit
                          </span>
                          <button className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors">
                            Register Free
                          </button>
                        </div>
                      ) : event.pricePerTicket > 0 ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-gray-700">
                            <DollarSign className="w-4 h-4" />
                            <span className="font-semibold">{event.pricePerTicket}</span>
                            <span className="text-sm">{event.currency}</span>
                          </div>
                          <button className="px-4 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-colors">
                            Register
                          </button>
                        </div>
                      ) : (
                        <button className="w-full px-4 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-colors">
                          Register Free
                        </button>
                      )}
                    </div>
                  )}

                  {isFull && (
                    <div className="pt-4 border-t border-gray-200">
                      <button 
                        disabled
                        className="w-full px-4 py-2 bg-gray-300 text-gray-600 text-sm rounded cursor-not-allowed"
                      >
                        Event Full
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Event Registration Modal */}
      {selectedEvent && (
        <EventRegistrationModal
          businessId={businessId}
          eventId={selectedEvent}
          event={events.find(e => e.id === selectedEvent)!}
          entitlement={entitlement}
          onClose={() => setSelectedEvent(null)}
          onSuccess={() => {
            setSelectedEvent(null);
            fetchEvents();
            fetchEntitlement();
          }}
        />
      )}
    </div>
  );
};

/**
 * Event Registration Modal
 */
interface EventRegistrationModalProps {
  businessId: string;
  eventId: string;
  event: Event;
  entitlement: any;
  onClose: () => void;
  onSuccess: () => void;
}

const EventRegistrationModal: React.FC<EventRegistrationModalProps> = ({
  businessId,
  eventId,
  event,
  entitlement,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useCredit, setUseCredit] = useState(false);

  const canUseCredit = () => {
    if (!entitlement) return false;
    
    if (event.isPremium) {
      return entitlement.premiumCreditsRemaining > 0;
    } else {
      return entitlement.standardCreditsRemaining > 0;
    }
  };

  const hasCreditAvailable = canUseCredit();

  useEffect(() => {
    if (hasCreditAvailable) {
      setUseCredit(true);
    }
  }, [hasCreditAvailable]);

  const handleRegister = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        ENDPOINTS.registerForEvent,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessId,
            eventId,
            useCredit: useCredit && hasCreditAvailable
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to register for event');
      }

      const data = await response.json();

      if (data.success) {
        if (data.paymentRequired) {
          // TODO: Integrate Stripe payment
          alert('Payment required. Stripe integration coming soon.');
        } else {
          alert('Successfully registered! Check your email for confirmation.');
          onSuccess();
        }
      } else {
        setError(data.error || 'Failed to register');
      }
    } catch (err) {
      console.error('Error registering:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Register for Event</h2>

          {/* Event Details */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{event.title}</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {new Date(event.startDateTime).toLocaleDateString()} at {new Date(event.startDateTime).toLocaleTimeString()}
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {event.venue}
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Credit Option */}
          {hasCreditAvailable && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useCredit}
                  onChange={(e) => setUseCredit(e.target.checked)}
                  className="w-5 h-5 text-green-600"
                />
                <div>
                  <p className="font-medium text-green-900">
                    🎉 Use Free Credit
                  </p>
                  <p className="text-sm text-green-700">
                    You have {event.isPremium ? entitlement.premiumCreditsRemaining : entitlement.standardCreditsRemaining} {event.isPremium ? 'premium' : 'standard'} credits remaining
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* Pricing */}
          {(!hasCreditAvailable || !useCredit) && event.pricePerTicket > 0 && (
            <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Ticket Price:</span>
                <span className="text-2xl font-bold text-purple-600">
                  ${event.pricePerTicket} {event.currency}
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleRegister}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Registering...
                </>
              ) : (
                `Register ${useCredit && hasCreditAvailable ? 'Free' : ''}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventBrowser;
