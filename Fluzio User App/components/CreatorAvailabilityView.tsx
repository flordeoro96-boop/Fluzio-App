/**
 * Creator Availability View Component
 * 
 * Displays creator's availability to businesses viewing their profile
 * Shows next available dates and calendar overview
 */

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  X,
  ChevronRight,
  Loader
} from 'lucide-react';
import {
  getNextAvailableDates,
  getAvailabilityRange,
  calculateAvailabilityPercentage
} from '../services/creatorAvailabilityService';

interface CreatorAvailabilityViewProps {
  creatorId: string;
  compact?: boolean; // Compact view for cards/lists
}

export const CreatorAvailabilityView: React.FC<CreatorAvailabilityViewProps> = ({
  creatorId,
  compact = false
}) => {
  const [nextDates, setNextDates] = useState<string[]>([]);
  const [availabilityPercentage, setAvailabilityPercentage] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [showFullCalendar, setShowFullCalendar] = useState(false);

  useEffect(() => {
    loadAvailability();
  }, [creatorId]);

  const loadAvailability = async () => {
    try {
      setLoading(true);
      
      // Get next available dates
      const dates = await getNextAvailableDates(creatorId, 5);
      setNextDates(dates);
      
      // Calculate availability for next 30 days
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + 30);
      
      const percentage = await calculateAvailabilityPercentage(
        creatorId,
        today.toISOString().split('T')[0],
        futureDate.toISOString().split('T')[0]
      );
      setAvailabilityPercentage(percentage);
    } catch (error) {
      console.error('Error loading availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dateOnly = date.toISOString().split('T')[0];
    const todayOnly = today.toISOString().split('T')[0];
    const tomorrowOnly = tomorrow.toISOString().split('T')[0];
    
    if (dateOnly === todayOnly) return 'Today';
    if (dateOnly === tomorrowOnly) return 'Tomorrow';
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className={`${compact ? 'p-3' : 'p-6'} bg-white rounded-lg border border-gray-200`}>
        <div className="flex items-center justify-center">
          <Loader className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (compact) {
    // Compact view for creator cards/lists
    return (
      <div className="flex items-center gap-2 text-sm">
        {nextDates.length > 0 ? (
          <>
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-gray-700">
              Available {formatDate(nextDates[0])}
            </span>
          </>
        ) : (
          <>
            <Clock className="w-4 h-4 text-orange-600" />
            <span className="text-gray-700">Limited availability</span>
          </>
        )}
      </div>
    );
  }

  // Full view for profile pages
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#6C4BFF]/10 to-[#00E5FF]/10 p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#6C4BFF] rounded-full flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Availability</h3>
              <p className="text-sm text-gray-600">
                {Math.round(availabilityPercentage)}% available in next 30 days
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {nextDates.length > 0 ? (
          <>
            {/* Next Available Dates */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Next Available Dates</h4>
              <div className="space-y-2">
                {nextDates.map((date, index) => (
                  <div
                    key={date}
                    className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{formatDate(date)}</p>
                        <p className="text-xs text-gray-600">
                          {new Date(date).toLocaleDateString('en-US', { 
                            month: 'long', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    {index === 0 && (
                      <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                        Soonest
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* View Full Calendar Button */}
            <button
              onClick={() => setShowFullCalendar(true)}
              className="w-full px-4 py-3 bg-[#6C4BFF] text-white rounded-lg font-medium hover:bg-[#5a3dd9] transition-colors flex items-center justify-center gap-2"
            >
              <Calendar className="w-5 h-5" />
              View Full Calendar
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        ) : (
          /* No Availability */
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Limited Availability</h4>
            <p className="text-sm text-gray-600 mb-4">
              This creator doesn't have available dates in the near future.
            </p>
            <button
              onClick={() => setShowFullCalendar(true)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Check Full Calendar
            </button>
          </div>
        )}

        {/* Availability Stats */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(availabilityPercentage)}%
              </p>
              <p className="text-xs text-gray-600 mt-1">Available (30 days)</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">
                {nextDates.length}
              </p>
              <p className="text-xs text-gray-600 mt-1">Upcoming Dates</p>
            </div>
          </div>
        </div>

        {/* Info Note */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-900">
            💡 Availability is updated in real-time. Contact the creator to discuss project timelines.
          </p>
        </div>
      </div>

      {/* Full Calendar Modal (placeholder - would integrate CreatorAvailabilityCalendar in view-only mode) */}
      {showFullCalendar && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Full Availability Calendar</h3>
              <button
                onClick={() => setShowFullCalendar(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              View-only calendar showing available, booked, and unavailable dates
            </p>
            
            {/* In a full implementation, this would render a view-only version of CreatorAvailabilityCalendar */}
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Calendar view would be displayed here</p>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowFullCalendar(false)}
                className="px-6 py-2 bg-[#6C4BFF] text-white rounded-lg font-medium hover:bg-[#5a3dd9] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Compact Availability Badge Component
 * For use in lists, cards, etc.
 */
export const AvailabilityBadge: React.FC<{ creatorId: string }> = ({ creatorId }) => {
  const [nextDate, setNextDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNext = async () => {
      try {
        const dates = await getNextAvailableDates(creatorId, 1);
        setNextDate(dates[0] || null);
      } catch (error) {
        console.error('Error loading next date:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadNext();
  }, [creatorId]);

  if (loading) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
        <Clock className="w-3 h-3" />
        Loading...
      </span>
    );
  }

  if (!nextDate) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
        <Clock className="w-3 h-3" />
        Limited availability
      </span>
    );
  }

  const formatShort = (dateStr: string): string => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dateOnly = date.toISOString().split('T')[0];
    const todayOnly = today.toISOString().split('T')[0];
    const tomorrowOnly = tomorrow.toISOString().split('T')[0];
    
    if (dateOnly === todayOnly) return 'Today';
    if (dateOnly === tomorrowOnly) return 'Tomorrow';
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded-full">
      <CheckCircle className="w-3 h-3" />
      Available {formatShort(nextDate)}
    </span>
  );
};
