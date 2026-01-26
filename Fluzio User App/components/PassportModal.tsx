/**
 * Passport Modal Component
 * Digital passport showing user's meetup check-ins and event attendance
 */

import React from 'react';
import { X, MapPin, Calendar, Trophy, Star } from 'lucide-react';

interface PassportStamp {
  id: string;
  eventName: string;
  eventType: string;
  location: string;
  date: Date;
  points?: number;
}

interface PassportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userAvatar?: string;
  stamps: PassportStamp[];
  totalEvents: number;
  totalPoints: number;
}

export const PassportModal: React.FC<PassportModalProps> = ({
  isOpen,
  onClose,
  userName,
  userAvatar,
  stamps,
  totalEvents,
  totalPoints
}) => {
  if (!isOpen) return null;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#6C4BFF] to-[#00E5FF] p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm border-4 border-white/30 overflow-hidden">
              {userAvatar ? (
                <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-bold">
                  {userName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-1">Event Passport</h2>
              <p className="text-white/90">{userName}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="w-4 h-4" />
                <span className="text-sm opacity-90">Events Attended</span>
              </div>
              <p className="text-2xl font-bold">{totalEvents}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Star className="w-4 h-4" />
                <span className="text-sm opacity-90">Points Earned</span>
              </div>
              <p className="text-2xl font-bold">{totalPoints}</p>
            </div>
          </div>
        </div>

        {/* Stamps Grid */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-280px)]">
          {stamps.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-semibold mb-2">No Stamps Yet</p>
              <p className="text-gray-400 text-sm">
                Attend events and meetups to collect stamps in your passport!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stamps.map((stamp) => (
                <div
                  key={stamp.id}
                  className="relative bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all"
                >
                  {/* Stamp Badge */}
                  <div className="absolute top-2 right-2 w-12 h-12 bg-gradient-to-br from-[#FFB86C] to-[#FF6B9D] rounded-full flex items-center justify-center shadow-lg transform rotate-12">
                    <Star className="w-6 h-6 text-white" />
                  </div>

                  {/* Event Info */}
                  <div className="pr-14">
                    <h3 className="font-bold text-[#1E0E62] mb-2 line-clamp-2">
                      {stamp.eventName}
                    </h3>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(stamp.date)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">{stamp.location}</span>
                      </div>
                      
                      {stamp.points && stamp.points > 0 && (
                        <div className="flex items-center gap-2 text-sm font-semibold text-[#00E5FF]">
                          <Star className="w-4 h-4 fill-current" />
                          <span>+{stamp.points} points</span>
                        </div>
                      )}
                    </div>

                    {/* Event Type Badge */}
                    <div className="mt-3">
                      <span className="inline-block text-xs px-2 py-1 bg-gradient-to-r from-[#6C4BFF]/10 to-[#00E5FF]/10 text-[#6C4BFF] rounded-full font-medium">
                        {stamp.eventType}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Keep collecting stamps to unlock exclusive rewards!
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gradient-to-r from-[#6C4BFF] to-[#00E5FF] text-white rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
