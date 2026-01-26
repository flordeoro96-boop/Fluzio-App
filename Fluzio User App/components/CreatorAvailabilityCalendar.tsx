/**
 * Creator Availability Calendar Component
 * 
 * Interactive calendar for creators to manage their availability
 * - View monthly calendar
 * - Click dates to toggle availability
 * - Set recurring patterns
 * - Bulk select dates
 */

import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon,
  ChevronLeft, 
  ChevronRight, 
  Check, 
  X, 
  Loader,
  Settings,
  Repeat,
  Clock,
  Info
} from 'lucide-react';
import {
  getAvailabilityRange,
  setDateAvailability,
  setBulkAvailability,
  getRecurringAvailability,
  setRecurringAvailability,
  getAvailabilitySettings,
  updateAvailabilitySettings,
  AvailabilityRange,
  RecurringAvailability,
  AvailabilitySettings
} from '../services/creatorAvailabilityService';

interface CreatorAvailabilityCalendarProps {
  creatorId: string;
  onClose?: () => void;
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const CreatorAvailabilityCalendar: React.FC<CreatorAvailabilityCalendarProps> = ({
  creatorId,
  onClose
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availabilityData, setAvailabilityData] = useState<AvailabilityRange | null>(null);
  const [recurringPatterns, setRecurringPatterns] = useState<RecurringAvailability[]>([]);
  const [settings, setSettings] = useState<AvailabilitySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState<'available' | 'unavailable' | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showRecurring, setShowRecurring] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAvailability();
  }, [creatorId, currentMonth]);

  const loadAvailability = async () => {
    try {
      setLoading(true);
      
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      const startDate = firstDay.toISOString().split('T')[0];
      const endDate = lastDay.toISOString().split('T')[0];
      
      const [availability, recurring, settingsData] = await Promise.all([
        getAvailabilityRange(creatorId, startDate, endDate),
        getRecurringAvailability(creatorId),
        getAvailabilitySettings(creatorId)
      ]);
      
      setAvailabilityData(availability);
      setRecurringPatterns(recurring);
      setSettings(settingsData);
    } catch (error) {
      console.error('Error loading availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = async (dateStr: string) => {
    if (selectionMode) {
      // In selection mode - add to batch
      if (selectedDates.includes(dateStr)) {
        setSelectedDates(selectedDates.filter(d => d !== dateStr));
      } else {
        setSelectedDates([...selectedDates, dateStr]);
      }
    } else {
      // Single date toggle
      const isCurrentlyAvailable = availabilityData?.availableDates.includes(dateStr);
      const newStatus = isCurrentlyAvailable ? 'unavailable' : 'available';
      
      try {
        setSaving(true);
        await setDateAvailability(creatorId, dateStr, newStatus);
        await loadAvailability();
      } catch (error) {
        console.error('Error toggling date:', error);
      } finally {
        setSaving(false);
      }
    }
  };

  const handleBulkSave = async () => {
    if (selectedDates.length === 0 || !selectionMode) return;
    
    try {
      setSaving(true);
      await setBulkAvailability(creatorId, selectedDates, selectionMode);
      setSelectedDates([]);
      setSelectionMode(null);
      await loadAvailability();
    } catch (error) {
      console.error('Error saving bulk availability:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleRecurringToggle = async (dayOfWeek: number) => {
    try {
      const existing = recurringPatterns.find(p => p.dayOfWeek === dayOfWeek);
      
      if (existing) {
        // Toggle existing pattern
        await setRecurringAvailability(
          creatorId,
          dayOfWeek,
          !existing.isAvailable,
          new Date()
        );
      } else {
        // Create new pattern
        await setRecurringAvailability(
          creatorId,
          dayOfWeek,
          false, // Make unavailable by default when first setting
          new Date()
        );
      }
      
      await loadAvailability();
    } catch (error) {
      console.error('Error toggling recurring:', error);
    }
  };

  const renderCalendarDays = () => {
    if (!availabilityData) return null;
    
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const days: React.ReactElement[] = [];
    
    // Empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square" />);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];
      const isToday = dateStr === new Date().toISOString().split('T')[0];
      const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
      
      const isAvailable = availabilityData.availableDates.includes(dateStr);
      const isBooked = availabilityData.bookedDates.includes(dateStr);
      const isSelected = selectedDates.includes(dateStr);
      
      let bgColor = 'bg-white hover:bg-gray-50';
      let textColor = 'text-gray-900';
      let border = 'border border-gray-200';
      
      if (isPast) {
        bgColor = 'bg-gray-100';
        textColor = 'text-gray-400';
      } else if (isBooked) {
        bgColor = 'bg-red-100 border-red-300';
        textColor = 'text-red-900';
      } else if (isAvailable) {
        bgColor = 'bg-green-50 border-green-300 hover:bg-green-100';
        textColor = 'text-green-900';
      } else {
        bgColor = 'bg-gray-50 border-gray-300 hover:bg-gray-100';
        textColor = 'text-gray-600';
      }
      
      if (isSelected) {
        border = 'border-2 border-[#6C4BFF]';
      }
      
      if (isToday) {
        border = 'border-2 border-[#00E5FF]';
      }
      
      days.push(
        <button
          key={day}
          onClick={() => !isPast && handleDateClick(dateStr)}
          disabled={isPast || saving}
          className={`aspect-square rounded-lg ${bgColor} ${border} ${textColor} 
            flex flex-col items-center justify-center transition-all relative
            disabled:cursor-not-allowed disabled:opacity-50`}
        >
          <span className="text-sm font-medium">{day}</span>
          {isBooked && (
            <div className="absolute top-1 right-1">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            </div>
          )}
          {isSelected && (
            <div className="absolute bottom-1">
              <Check className="w-3 h-3 text-[#6C4BFF]" />
            </div>
          )}
        </button>
      );
    }
    
    return days;
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-[#6C4BFF]" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#6C4BFF] to-[#00E5FF] text-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <CalendarIcon className="w-6 h-6" />
            <h2 className="text-2xl font-bold">Manage Availability</h2>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRecurring(!showRecurring)}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Repeat className="w-4 h-4" />
            Recurring
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>
      </div>

      {/* Selection Mode Bar */}
      {selectionMode && (
        <div className="bg-[#6C4BFF] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-medium">
              {selectedDates.length} date{selectedDates.length !== 1 ? 's' : ''} selected
            </span>
            <span className="text-sm text-white/80">
              Mark as {selectionMode}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkSave}
              disabled={selectedDates.length === 0 || saving}
              className="px-4 py-2 bg-white text-[#6C4BFF] rounded-lg font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Save
            </button>
            <button
              onClick={() => {
                setSelectionMode(null);
                setSelectedDates([]);
              }}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Bulk Selection Buttons */}
      {!selectionMode && (
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
          <span className="text-sm text-gray-600 mr-2">Bulk select:</span>
          <button
            onClick={() => setSelectionMode('available')}
            className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
          >
            Set Available
          </button>
          <button
            onClick={() => setSelectionMode('unavailable')}
            className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
          >
            Set Unavailable
          </button>
        </div>
      )}

      {/* Calendar */}
      <div className="p-6">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={previousMonth}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="text-lg font-bold text-gray-900">
            {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h3>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {DAYS_OF_WEEK.map(day => (
            <div key={day} className="text-center text-sm font-semibold text-gray-600">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {renderCalendarDays()}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-6 border-t border-gray-200 flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-50 border border-green-300 rounded"></div>
            <span className="text-gray-700">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-50 border border-gray-300 rounded"></div>
            <span className="text-gray-700">Unavailable</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
            <span className="text-gray-700">Booked</span>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">How it works:</p>
            <ul className="space-y-1 text-blue-800">
              <li>• Click individual dates to toggle availability</li>
              <li>• Use bulk select to change multiple dates at once</li>
              <li>• Set recurring patterns for regular schedules</li>
              <li>• Booked dates cannot be changed</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Recurring Patterns Modal */}
      {showRecurring && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Recurring Availability</h3>
              <button
                onClick={() => setShowRecurring(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Set which days of the week you're typically unavailable
            </p>
            <div className="space-y-2">
              {DAYS_OF_WEEK.map((day, index) => {
                const pattern = recurringPatterns.find(p => p.dayOfWeek === index);
                const isUnavailable = pattern && !pattern.isAvailable;
                
                return (
                  <button
                    key={day}
                    onClick={() => handleRecurringToggle(index)}
                    className={`w-full p-3 rounded-lg border-2 transition-all flex items-center justify-between ${
                      isUnavailable
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <span className="font-medium">{day}</span>
                    {isUnavailable && (
                      <X className="w-5 h-5 text-red-600" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
