import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, Award, Lock, CheckCircle, TrendingUp } from 'lucide-react';
import { PassportStamp } from '../types';

interface PassportStampsModalProps {
  collectedStamps: PassportStamp[];
  onClose: () => void;
}

const ALL_STAMPS: { stamp: PassportStamp; icon: string; description: string; color: string }[] = [
  { 
    stamp: 'Coffee Explorer', 
    icon: '☕', 
    description: 'Complete your first coffee meetup',
    color: 'from-amber-500 to-orange-500'
  },
  { 
    stamp: 'Dinner Socializer', 
    icon: '🍽️', 
    description: 'Join a dinner experience',
    color: 'from-red-500 to-pink-500'
  },
  { 
    stamp: 'Creative Mind', 
    icon: '🎨', 
    description: 'Attend a creative workshop',
    color: 'from-purple-500 to-indigo-500'
  },
  { 
    stamp: 'Fitness Enthusiast', 
    icon: '💪', 
    description: 'Join a fitness meetup',
    color: 'from-green-500 to-emerald-500'
  },
  { 
    stamp: 'Pet Lover', 
    icon: '🐾', 
    description: 'Meet fellow pet owners',
    color: 'from-yellow-500 to-amber-500'
  },
  { 
    stamp: 'International Friend', 
    icon: '🌍', 
    description: 'Connect with international community',
    color: 'from-blue-500 to-cyan-500'
  },
  { 
    stamp: 'Business Networker', 
    icon: '💼', 
    description: 'Attend a business networking event',
    color: 'from-gray-700 to-gray-900'
  },
  { 
    stamp: 'Wellness Warrior', 
    icon: '🧘', 
    description: 'Join a wellness or meditation session',
    color: 'from-teal-500 to-green-500'
  },
  { 
    stamp: 'Night Owl', 
    icon: '🌙', 
    description: 'Experience nightlife meetups',
    color: 'from-indigo-600 to-purple-600'
  },
  { 
    stamp: 'Culture Vulture', 
    icon: '🎭', 
    description: 'Explore cultural events',
    color: 'from-pink-500 to-rose-500'
  }
];

export function PassportStampsModal({ collectedStamps, onClose }: PassportStampsModalProps) {
  const { t } = useTranslation();
  const progress = (collectedStamps.length / ALL_STAMPS.length) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all backdrop-blur-sm"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <div className="text-center">
            <div className="text-6xl mb-3">🎫</div>
            <h2 className="text-3xl font-bold text-white mb-2">{t('passport.title')}</h2>
            <p className="text-white/90">{t('passport.subtitle')}</p>
          </div>

          {/* Progress Bar */}
          <div className="mt-6 bg-white/20 backdrop-blur-sm rounded-full p-1">
            <div className="flex items-center justify-between mb-2 px-2">
              <span className="text-white/90 text-sm font-medium">{t('passport.progress')}</span>
              <span className="text-white font-bold">{collectedStamps.length}/{ALL_STAMPS.length}</span>
            </div>
            <div className="bg-white/30 rounded-full h-3 overflow-hidden">
              <div 
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stamps Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {progress === 100 && (
            <div className="mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="text-4xl">🏆</div>
                <div>
                  <p className="font-bold text-yellow-900 text-lg">{t('passport.complete.title')}</p>
                  <p className="text-yellow-700 text-sm">{t('passport.complete.desc')}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {ALL_STAMPS.map((stampInfo) => {
              const isCollected = collectedStamps.includes(stampInfo.stamp);
              
              return (
                <div
                  key={stampInfo.stamp}
                  className={`relative rounded-xl overflow-hidden transition-all ${
                    isCollected 
                      ? 'shadow-lg hover:shadow-xl transform hover:-translate-y-1' 
                      : 'opacity-50 grayscale'
                  }`}
                >
                  {/* Card Background */}
                  <div className={`bg-gradient-to-br ${stampInfo.color} p-4 h-full`}>
                    {/* Collected Badge */}
                    {isCollected && (
                      <div className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                    )}

                    {/* Lock Icon for Uncollected */}
                    {!isCollected && (
                      <div className="absolute top-2 right-2 w-8 h-8 bg-black/30 rounded-full flex items-center justify-center">
                        <Lock className="w-4 h-4 text-white" />
                      </div>
                    )}

                    {/* Stamp Icon */}
                    <div className="text-center mb-3">
                      <div className={`text-5xl mb-2 ${isCollected ? 'animate-bounce-slow' : ''}`}>
                        {stampInfo.icon}
                      </div>
                    </div>

                    {/* Stamp Info */}
                    <div className="text-center">
                      <h3 className="font-bold text-white text-sm mb-1">
                        {t(`passport.stamps.${stampInfo.stamp}.name`, { defaultValue: stampInfo.stamp })}
                      </h3>
                      <p className="text-white/80 text-xs leading-tight">
                        {t(`passport.stamps.${stampInfo.stamp}.desc`, { defaultValue: stampInfo.description })}
                      </p>
                    </div>

                    {/* Stamp Pattern Background */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none">
                      <div className="absolute top-0 left-0 text-white text-9xl transform -rotate-12">
                        {stampInfo.icon}
                      </div>
                      <div className="absolute bottom-0 right-0 text-white text-9xl transform rotate-12">
                        {stampInfo.icon}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tips Section */}
          <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-blue-600 mt-1" />
              <div>
                <p className="font-semibold text-blue-900 mb-1">{t('passport.tips.title')}</p>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• {t('passport.tips.tip1')}</li>
                  <li>• {t('passport.tips.tip2')}</li>
                  <li>• {t('passport.tips.tip3')}</li>
                  <li>• {t('passport.tips.tip4')}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-purple-600">{collectedStamps.length}</p>
              <p className="text-xs text-purple-700">{t('passport.stats.collected')}</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-orange-600">{ALL_STAMPS.length - collectedStamps.length}</p>
              <p className="text-xs text-orange-700">{t('passport.stats.remaining')}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-600">{Math.round(progress)}%</p>
              <p className="text-xs text-green-700">{t('passport.stats.complete')}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium shadow-md"
          >
            {t('common.close')}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
