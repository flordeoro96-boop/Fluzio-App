import React, { useState, useEffect } from 'react';
import { Loader2, Calendar, MapPin, QrCode, X, CheckCircle, Clock, XCircle, Trophy } from 'lucide-react';
import type { EventTicket } from '../types/events';
import { ENDPOINTS } from '../config/firebaseFunctions';

interface MyEventsProps {
  businessId: string;
}

/**
 * MyEvents Component
 * 
 * View registered events and tickets
 * - Shows upcoming, past, and cancelled tickets
 * - Displays QR codes for check-in
 * - Cancel registration
 * - Shows credit usage status
 */
const MyEvents: React.FC<MyEventsProps> = ({ businessId }) => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming');
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [entitlement, setEntitlement] = useState<any>(null);

  useEffect(() => {
    fetchTickets();
    fetchEntitlement();
  }, [businessId]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${ENDPOINTS.getMyTickets}?businessId=${businessId}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch tickets');
      }

      const data = await response.json();

      if (data.success) {
        setTickets(data.tickets);
      } else {
        setError(data.error || 'Failed to fetch tickets');
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
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

  const getFilteredTickets = () => {
    const now = new Date();

    return tickets.filter(ticket => {
      const eventDate = new Date(ticket.event.startDateTime);
      
      if (filter === 'upcoming') {
        return ticket.status !== 'CANCELLED' && eventDate >= now;
      } else if (filter === 'past') {
        return ticket.status !== 'CANCELLED' && eventDate < now;
      } else if (filter === 'cancelled') {
        return ticket.status === 'CANCELLED';
      }
      
      return true;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'text-green-600 bg-green-100';
      case 'CHECKED_IN': return 'text-blue-600 bg-blue-100';
      case 'RESERVED': return 'text-yellow-600 bg-yellow-100';
      case 'CANCELLED': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return <CheckCircle className="w-4 h-4" />;
      case 'CHECKED_IN': return <CheckCircle className="w-4 h-4" />;
      case 'RESERVED': return <Clock className="w-4 h-4" />;
      case 'CANCELLED': return <XCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  const handleCancelTicket = async (ticketId: string) => {
    if (!confirm('Are you sure you want to cancel this registration?')) {
      return;
    }

    try {
      const response = await fetch(
        ENDPOINTS.cancelEventRegistration,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ businessId, ticketId })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to cancel registration');
      }

      const data = await response.json();

      if (data.success) {
        alert('Registration cancelled successfully!');
        fetchTickets();
        fetchEntitlement();
      } else {
        alert(data.error || 'Failed to cancel registration');
      }
    } catch (err) {
      console.error('Error cancelling ticket:', err);
      alert('Failed to cancel registration');
    }
  };

  const filteredTickets = getFilteredTickets();

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Events</h1>
        <p className="text-gray-600">View and manage your event registrations</p>
      </div>

      {/* Credits Widget */}
      {entitlement && (
        <div className="mb-6 p-4 bg-white border border-purple-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">Event Credits Available</h3>
              <p className="text-xs text-gray-500">
                {entitlement.periodType === 'MONTHLY' ? 'Resets monthly' : 'Resets quarterly'} • 
                Period ends {new Date(entitlement.periodEnd).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {entitlement.standardCreditsRemaining}/{entitlement.standardCreditsAllowed}
                </p>
                <p className="text-xs text-gray-600">Standard</p>
              </div>
              {entitlement.premiumCreditsAllowed > 0 && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">
                    {entitlement.premiumCreditsRemaining}/{entitlement.premiumCreditsAllowed}
                  </p>
                  <p className="text-xs text-gray-600">Premium</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        {[
          { key: 'upcoming', label: 'Upcoming' },
          { key: 'past', label: 'Past' },
          { key: 'cancelled', label: 'Cancelled' }
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === key
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {label} ({tickets.filter(t => {
              const eventDate = new Date(t.event.startDateTime);
              const now = new Date();
              if (key === 'upcoming') return t.status !== 'CANCELLED' && eventDate >= now;
              if (key === 'past') return t.status !== 'CANCELLED' && eventDate < now;
              return t.status === 'CANCELLED';
            }).length})
          </button>
        ))}
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

      {/* Tickets List */}
      {!loading && filteredTickets.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No events found</h3>
          <p className="text-gray-600">
            {filter === 'upcoming' && 'Register for events to see them here'}
            {filter === 'past' && 'No past events yet'}
            {filter === 'cancelled' && 'No cancelled registrations'}
          </p>
        </div>
      )}

      {!loading && filteredTickets.length > 0 && (
        <div className="space-y-4">
          {filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    {ticket.event.title}
                    {ticket.event.isPremium && (
                      <Trophy className="w-5 h-5 text-yellow-500" />
                    )}
                  </h3>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(ticket.event.startDateTime)} at {formatTime(ticket.event.startDateTime)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{ticket.event.venue}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                    {getStatusIcon(ticket.status)}
                    {ticket.status}
                  </span>
                  
                  {ticket.paymentType === 'FREE_CREDIT' && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      Free Credit Used
                    </span>
                  )}
                </div>
              </div>

              {/* Ticket Number */}
              <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
                <p className="text-xs text-gray-600 mb-1">Ticket Number</p>
                <p className="font-mono text-sm font-semibold text-gray-900">{ticket.ticketNumber}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {(ticket.status === 'CONFIRMED' || ticket.status === 'RESERVED') && (
                  <>
                    <button
                      onClick={() => setSelectedTicket(ticket.id)}
                      className="flex-1 px-4 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <QrCode className="w-4 h-4" />
                      Show QR Code
                    </button>
                    
                    <button
                      onClick={() => handleCancelTicket(ticket.id)}
                      className="px-4 py-2 border border-red-300 text-red-700 text-sm rounded hover:bg-red-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                )}

                {ticket.status === 'CHECKED_IN' && (
                  <div className="flex-1 px-4 py-2 bg-blue-50 text-blue-700 text-sm rounded text-center">
                    ✓ Checked In
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QR Code Modal */}
      {selectedTicket && (
        <QRCodeModal
          ticket={tickets.find(t => t.id === selectedTicket)!}
          onClose={() => setSelectedTicket(null)}
        />
      )}
    </div>
  );
};

/**
 * QR Code Modal
 */
interface QRCodeModalProps {
  ticket: any;
  onClose: () => void;
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({ ticket, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Event Ticket</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Event Info */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{ticket.event.title}</h3>
            <p className="text-sm text-gray-600">
              {new Date(ticket.event.startDateTime).toLocaleDateString()} at {new Date(ticket.event.startDateTime).toLocaleTimeString()}
            </p>
            <p className="text-sm text-gray-600">{ticket.event.venue}</p>
          </div>

          {/* QR Code */}
          <div className="mb-6 p-8 bg-white border-2 border-purple-600 rounded-lg">
            <div className="aspect-square bg-white flex items-center justify-center">
              {/* QR Code would be generated here using a library like qrcode.react */}
              <div className="text-center">
                <QrCode className="w-32 h-32 mx-auto text-purple-600 mb-4" />
                <p className="font-mono text-sm font-semibold text-gray-900 break-all">
                  {ticket.qrCode}
                </p>
              </div>
            </div>
          </div>

          <p className="text-xs text-center text-gray-600">
            Show this QR code at the event entrance for check-in
          </p>
        </div>
      </div>
    </div>
  );
};

export default MyEvents;
