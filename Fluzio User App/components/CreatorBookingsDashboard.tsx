/**
 * Creator Bookings Dashboard Component
 * 
 * Displays and manages creator's bookings
 * - View all bookings with status filtering
 * - Booking statistics
 * - Accept/reject bookings
 * - Update booking status
 * - Payment tracking
 */

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  DollarSign,
  Check,
  X,
  Loader,
  Eye,
  AlertCircle,
  TrendingUp,
  Package,
  ChevronRight,
  Filter
} from 'lucide-react';
import {
  getCreatorBookings,
  getCreatorBookingStats,
  Booking,
  BookingStatus,
  confirmBooking,
  startBooking,
  completeBooking,
  cancelBooking
} from '../services/creatorBookingService';

interface CreatorBookingsDashboardProps {
  creatorId: string;
  creatorName: string;
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  paid: 'bg-green-100 text-green-800 border-green-200',
  'in-progress': 'bg-purple-100 text-purple-800 border-purple-200',
  completed: 'bg-gray-100 text-gray-800 border-gray-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  refunded: 'bg-orange-100 text-orange-800 border-orange-200'
};

const statusLabels = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  paid: 'Paid',
  'in-progress': 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  refunded: 'Refunded'
};

export const CreatorBookingsDashboard: React.FC<CreatorBookingsDashboardProps> = ({
  creatorId,
  creatorName
}) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<BookingStatus | 'all'>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    loadData();
  }, [creatorId, filterStatus]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [bookingsData, statsData] = await Promise.all([
        filterStatus === 'all' 
          ? getCreatorBookings(creatorId)
          : getCreatorBookings(creatorId, filterStatus),
        getCreatorBookingStats(creatorId)
      ]);
      setBookings(bookingsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (bookingId: string) => {
    try {
      await confirmBooking(bookingId);
      await loadData();
    } catch (error) {
      console.error('Error confirming booking:', error);
    }
  };

  const handleStart = async (bookingId: string) => {
    try {
      await startBooking(bookingId);
      await loadData();
    } catch (error) {
      console.error('Error starting booking:', error);
    }
  };

  const handleComplete = async (bookingId: string) => {
    try {
      await completeBooking(bookingId);
      await loadData();
    } catch (error) {
      console.error('Error completing booking:', error);
    }
  };

  const handleCancel = async (bookingId: string, reason: string) => {
    try {
      await cancelBooking(bookingId, reason);
      await loadData();
    } catch (error) {
      console.error('Error cancelling booking:', error);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-[#6C4BFF]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Bookings</h2>
        <p className="text-gray-600">Manage your service bookings and projects</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-8 h-8 opacity-80" />
              <div className="bg-white/20 px-2 py-1 rounded-full text-xs font-semibold">
                Total
              </div>
            </div>
            <div className="text-3xl font-bold">{stats.total}</div>
            <div className="text-sm opacity-80">All Bookings</div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 opacity-80" />
              <div className="bg-white/20 px-2 py-1 rounded-full text-xs font-semibold">
                Pending
              </div>
            </div>
            <div className="text-3xl font-bold">{stats.pending}</div>
            <div className="text-sm opacity-80">Awaiting Confirmation</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Package className="w-8 h-8 opacity-80" />
              <div className="bg-white/20 px-2 py-1 rounded-full text-xs font-semibold">
                Active
              </div>
            </div>
            <div className="text-3xl font-bold">
              {stats.paid + stats.inProgress}
            </div>
            <div className="text-sm opacity-80">In Progress</div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 opacity-80" />
              <div className="bg-white/20 px-2 py-1 rounded-full text-xs font-semibold">
                Revenue
              </div>
            </div>
            <div className="text-3xl font-bold">${stats.totalEarnings.toLocaleString()}</div>
            <div className="text-sm opacity-80">Total Earnings</div>
          </div>
        </div>
      )}

      {/* Upcoming Bookings */}
      {stats && stats.upcomingBookings.length > 0 && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border-2 border-indigo-200">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            Upcoming Bookings
          </h3>
          <div className="space-y-3">
            {stats.upcomingBookings.map((booking: Booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-gray-900">{booking.businessName}</div>
                  <div className="text-sm text-gray-600">
                    {booking.packageName} • {booking.startDate.toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">${booking.price}</div>
                  <div className={`text-xs px-2 py-1 rounded-full border ${statusColors[booking.status]}`}>
                    {statusLabels[booking.status]}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          <Filter className="w-4 h-4 text-gray-600 flex-shrink-0" />
          {(['all', 'pending', 'confirmed', 'paid', 'in-progress', 'completed'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                filterStatus === status
                  ? 'bg-[#6C4BFF] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? 'All' : statusLabels[status]}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings List */}
      {bookings.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No bookings yet</h3>
          <p className="text-gray-600">
            {filterStatus === 'all' 
              ? 'Your bookings will appear here once businesses book your services'
              : `No ${statusLabels[filterStatus as BookingStatus].toLowerCase()} bookings`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map(booking => (
            <div
              key={booking.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">
                        {booking.businessName}
                      </h3>
                      <div className={`text-xs px-3 py-1 rounded-full border font-semibold ${statusColors[booking.status]}`}>
                        {statusLabels[booking.status]}
                      </div>
                    </div>
                    <div className="text-gray-600">{booking.packageName}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">${booking.price}</div>
                    <div className="text-sm text-gray-600">{booking.currency}</div>
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Start Date</div>
                    <div className="font-semibold text-gray-900">
                      {booking.startDate.toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Delivery Date</div>
                    <div className="font-semibold text-gray-900">
                      {booking.deliveryDate.toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Deposit</div>
                    <div className="font-semibold text-gray-900">
                      ${booking.depositAmount}
                      {booking.depositPaid && (
                        <span className="ml-2 text-green-600">✓</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Final Payment</div>
                    <div className="font-semibold text-gray-900">
                      ${booking.remainingAmount}
                      {booking.finalPaymentPaid && (
                        <span className="ml-2 text-green-600">✓</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Requirements */}
                {booking.requirements && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-xs font-semibold text-gray-700 mb-2">
                      Requirements
                    </div>
                    <div className="text-sm text-gray-900 whitespace-pre-wrap">
                      {booking.requirements.slice(0, 200)}
                      {booking.requirements.length > 200 && '...'}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                  {booking.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleConfirm(booking.id)}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-semibold"
                      >
                        <Check className="w-4 h-4" />
                        Accept Booking
                      </button>
                      <button
                        onClick={() => handleCancel(booking.id, 'Declined by creator')}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  
                  {booking.status === 'paid' && !booking.depositPaid && (
                    <div className="flex-1 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2 text-sm text-yellow-900">
                      <AlertCircle className="w-4 h-4" />
                      Awaiting deposit payment from business
                    </div>
                  )}
                  
                  {booking.status === 'paid' && booking.depositPaid && (
                    <button
                      onClick={() => handleStart(booking.id)}
                      className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 font-semibold"
                    >
                      <ChevronRight className="w-4 h-4" />
                      Start Work
                    </button>
                  )}
                  
                  {booking.status === 'in-progress' && (
                    <button
                      onClick={() => handleComplete(booking.id)}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-semibold"
                    >
                      <Check className="w-4 h-4" />
                      Mark Complete
                    </button>
                  )}
                  
                  <button
                    onClick={() => setSelectedBooking(booking)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Details Modal */}
      {selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
        />
      )}
    </div>
  );
};

/**
 * Booking Details Modal Component
 */
interface BookingDetailsModalProps {
  booking: Booking;
  onClose: () => void;
}

const BookingDetailsModal: React.FC<BookingDetailsModalProps> = ({ booking, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Booking Details</h2>
            <p className="text-gray-600 mt-1">ID: {booking.id.slice(0, 8)}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status */}
          <div>
            <div className="text-sm font-semibold text-gray-700 mb-2">Status</div>
            <div className={`inline-block px-4 py-2 rounded-full border font-semibold ${statusColors[booking.status]}`}>
              {statusLabels[booking.status]}
            </div>
          </div>

          {/* Business Info */}
          <div>
            <div className="text-sm font-semibold text-gray-700 mb-2">Business</div>
            <div className="text-lg font-bold text-gray-900">{booking.businessName}</div>
          </div>

          {/* Package Info */}
          <div>
            <div className="text-sm font-semibold text-gray-700 mb-2">Package</div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="font-bold text-gray-900 mb-2">{booking.packageName}</div>
              <div className="text-sm text-gray-600 mb-3">
                {booking.packageTier.charAt(0).toUpperCase() + booking.packageTier.slice(1)} Tier
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="text-xs font-semibold text-gray-700">Features:</div>
                {booking.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    {feature}
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-gray-700">Deliverables:</div>
                {booking.deliverables.map((deliverable, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <Package className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    {deliverable}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-2">Start Date</div>
              <div className="text-gray-900">
                {booking.startDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-2">Delivery Date</div>
              <div className="text-gray-900">
                {booking.deliveryDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>

          {/* Requirements */}
          {booking.requirements && (
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-2">Requirements</div>
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-900 whitespace-pre-wrap">
                {booking.requirements}
              </div>
            </div>
          )}

          {/* Payment Info */}
          <div>
            <div className="text-sm font-semibold text-gray-700 mb-2">Payment Details</div>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Deposit (50%)</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">${booking.depositAmount}</span>
                  {booking.depositPaid ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <Check className="w-4 h-4" />
                      Paid
                    </span>
                  ) : (
                    <span className="text-gray-500">Pending</span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Final Payment (50%)</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">${booking.remainingAmount}</span>
                  {booking.finalPaymentPaid ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <Check className="w-4 h-4" />
                      Paid
                    </span>
                  ) : (
                    <span className="text-gray-500">Pending</span>
                  )}
                </div>
              </div>
              <div className="border-t border-gray-200 pt-3 mt-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="text-xl font-bold text-gray-900">${booking.price}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
