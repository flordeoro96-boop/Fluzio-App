import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Award, Sparkles, TrendingUp, Star, Users, CheckCircle, ChevronRight, Calendar, MapPin } from 'lucide-react';
import { Meetup } from '../types';

interface MeetupSummaryModalProps {
  meetup: Meetup;
  xpEarned: number;
  stampEarned?: string;
  rewardUnlocked?: boolean;
  onClose: () => void;
  onViewRecommendations?: () => void;
  onViewPassport?: () => void;
}

export function MeetupSummaryModal({ 
  meetup, 
  xpEarned, 
  stampEarned, 
  rewardUnlocked,
  onClose,
  onViewRecommendations,
  onViewPassport
}: MeetupSummaryModalProps) {
  const { t } = useTranslation();
  const [showConfetti, setShowConfetti] = useState(true);
  const [animateXP, setAnimateXP] = useState(false);
  const [animateStamp, setAnimateStamp] = useState(false);
  const [animateReward, setAnimateReward] = useState(false);

  useEffect(() => {
    // Trigger animations in sequence
    setTimeout(() => setAnimateXP(true), 300);
    setTimeout(() => setAnimateStamp(true), 800);
    setTimeout(() => setAnimateReward(true), 1300);
    setTimeout(() => setShowConfetti(false), 3000);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Confetti Effect */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10%',
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            >
              {['🎉', '⭐', '✨', '🎊', '💫'][Math.floor(Math.random() * 5)]}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header with Gradient */}
        <div className="relative bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 p-8 text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all backdrop-blur-sm"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <div className="mb-4">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">{t('meetups.summary.amazing')}</h2>
            <p className="text-white/90 text-lg">{t('meetups.summary.completedTitle')}</p>
          </div>

          {/* Meetup Info */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 mt-4">
            <div className="flex items-center gap-3">
              <img 
                src={meetup.businessLogo} 
                alt={meetup.businessName}
                className="w-12 h-12 rounded-lg object-cover border-2 border-white/30"
              />
              <div className="flex-1 text-left">
                <p className="font-semibold text-white text-sm">{meetup.title}</p>
                <p className="text-white/80 text-xs">{meetup.businessName}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Rewards Content */}
        <div className="p-6 space-y-4">
          {/* XP Earned */}
          <div className={`transform transition-all duration-500 ${
            animateXP ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'
          }`}>
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-600 font-medium">{t('meetups.summary.experiencePoints')}</p>
                    <p className="text-2xl font-bold text-blue-900">{t('meetups.summary.plusXp', { xp: xpEarned })}</p>
                  </div>
                </div>
                <div className="text-3xl animate-pulse">✨</div>
              </div>
              <div className="mt-3 bg-blue-100 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 animate-progress"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>

          {/* Stamp Collected */}
          {stampEarned && (
            <div className={`transform transition-all duration-500 ${
              animateStamp ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'
            }`}>
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-2xl">
                      🎫
                    </div>
                    <div>
                      <p className="text-sm text-purple-600 font-medium">{t('meetups.summary.passportStamp')}</p>
                      <p className="text-lg font-bold text-purple-900">{stampEarned}</p>
                    </div>
                  </div>
                  <div className="text-3xl animate-bounce">🎉</div>
                </div>
                <div className="mt-2 text-xs text-purple-700 bg-purple-100 rounded-lg p-2">
                  {t('meetups.summary.addedToPassport')}
                </div>
                {onViewPassport && (
                  <button
                    onClick={() => {
                      onViewPassport();
                      onClose();
                    }}
                    className="mt-2 w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all text-sm font-medium"
                  >
                    {t('meetups.summary.viewAllStamps')}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Reward Unlocked */}
          {rewardUnlocked && meetup.rewardTitle && (
            <div className={`transform transition-all duration-500 ${
              animateReward ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'
            }`}>
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-green-600 font-medium">{t('meetups.summary.rewardUnlocked')}</p>
                      <p className="text-lg font-bold text-green-900">{meetup.rewardTitle}</p>
                    </div>
                  </div>
                  <div className="text-3xl animate-spin-slow">🎁</div>
                </div>
                <div className="mt-2 text-xs text-green-700 bg-green-100 rounded-lg p-2">
                  {t('meetups.summary.showToRedeem', { business: meetup.businessName })}
                </div>
              </div>
            </div>
          )}

          {/* Stats Summary */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gray-600" />
              {t('meetups.summary.yourProgress')}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
                <p className="text-2xl font-bold text-purple-600">{meetup.participants.length}</p>
                <p className="text-xs text-gray-600">{t('meetups.summary.peopleMet')}</p>
              </div>
              <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
                <p className="text-2xl font-bold text-orange-600">{meetup.missions?.length || 0}</p>
                <p className="text-xs text-gray-600">{t('meetups.summary.missionsDone')}</p>
              </div>
            </div>
          </div>

          {/* Social Sharing */}
          <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <Star className="w-5 h-5 text-orange-600" />
              <p className="font-semibold text-orange-900">{t('meetups.summary.shareAchievement')}</p>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 py-2 bg-white border border-orange-300 rounded-lg text-sm font-medium text-orange-700 hover:bg-orange-50 transition-all">
                📸 {t('meetups.summary.story')}
              </button>
              <button className="flex-1 py-2 bg-white border border-orange-300 rounded-lg text-sm font-medium text-orange-700 hover:bg-orange-50 transition-all">
                📱 {t('meetups.summary.share')}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            {onViewRecommendations && (
              <button
                onClick={() => {
                  onViewRecommendations();
                  onClose();
                }}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium shadow-md flex items-center justify-center gap-2"
              >
                <Calendar className="w-5 h-5" />
                {t('meetups.summary.discoverMoreMeetups')}
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti 3s linear forwards;
          font-size: 1.5rem;
        }
        @keyframes progress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
        .animate-progress {
          animation: progress 1.5s ease-out forwards;
        }
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </div>
  );
}
