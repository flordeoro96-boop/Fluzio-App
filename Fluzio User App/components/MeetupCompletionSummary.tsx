/**
 * Meetup Completion Summary Component
 * Shows summary and rewards after completing a meetup check-in
 */

import React from 'react';
import { CheckCircle, Star, Trophy, Users, MapPin, Zap } from 'lucide-react';

interface MeetupCompletionSummaryProps {
  isOpen: boolean;
  onClose: () => void;
  meetupName: string;
  meetupLocation: string;
  pointsEarned: number;
  attendeeCount: number;
  badgesEarned?: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
  }>;
  newLevel?: number;
  streakCount?: number;
}

export const MeetupCompletionSummary: React.FC<MeetupCompletionSummaryProps> = ({
  isOpen,
  onClose,
  meetupName,
  meetupLocation,
  pointsEarned,
  attendeeCount,
  badgesEarned = [],
  newLevel,
  streakCount
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-slideUp">
        {/* Success Header */}
        <div className="bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 p-8 text-white text-center relative overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>

          <div className="relative z-10">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <CheckCircle className="w-12 h-12" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Check-In Complete!</h2>
            <p className="text-white/90 text-sm">You attended the meetup</p>
          </div>
        </div>

        {/* Meetup Details */}
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-bold text-[#1E0E62] text-lg mb-2">{meetupName}</h3>
          <div className="flex items-center gap-2 text-gray-600 text-sm mb-3">
            <MapPin className="w-4 h-4" />
            <span>{meetupLocation}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600 text-sm">
            <Users className="w-4 h-4" />
            <span>{attendeeCount} attendees</span>
          </div>
        </div>

        {/* Rewards Summary */}
        <div className="p-6 space-y-4">
          {/* Points Earned */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                  <Star className="w-6 h-6 text-white fill-current" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Points Earned</p>
                  <p className="text-2xl font-bold text-[#1E0E62]">+{pointsEarned}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Level Up */}
          {newLevel && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-200 animate-slideIn">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#6C4BFF] to-[#00E5FF] rounded-full flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Level Up!</p>
                  <p className="text-xl font-bold text-[#6C4BFF]">You're now Level {newLevel}</p>
                </div>
              </div>
            </div>
          )}

          {/* Streak */}
          {streakCount && streakCount > 1 && (
            <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-4 border border-pink-200 animate-slideIn">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-rose-400 rounded-full flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Meetup Streak</p>
                  <p className="text-xl font-bold text-pink-600">{streakCount} events in a row!</p>
                </div>
              </div>
            </div>
          )}

          {/* Badges Earned */}
          {badgesEarned.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-600">Badges Unlocked</p>
              <div className="grid grid-cols-2 gap-2">
                {badgesEarned.map((badge) => (
                  <div
                    key={badge.id}
                    className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-3 text-center animate-fadeIn"
                  >
                    <div className="text-3xl mb-2">{badge.icon}</div>
                    <p className="text-xs font-semibold text-[#1E0E62] mb-1">{badge.name}</p>
                    <p className="text-xs text-gray-500">{badge.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t border-gray-100 space-y-3">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-[#6C4BFF] to-[#00E5FF] text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Awesome!
          </button>
          <p className="text-center text-sm text-gray-500">
            Share your achievement on social media
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.4s ease-out;
        }
        
        .animate-slideIn {
          animation: slideIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};
