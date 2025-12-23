/**
 * Level Up Modal Component
 * Celebration animation when user levels up
 */

import React, { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import {
  Trophy,
  Star,
  Zap,
  Award,
  Gift,
  TrendingUp,
  Users,
  Calendar,
  Share2,
  X
} from 'lucide-react';

interface LevelUpModalProps {
  visible: boolean;
  onClose: () => void;
  previousLevel: number;
  newLevel: number;
  newTier: 'BASIC' | 'SILVER' | 'GOLD' | 'PLATINUM';
  newPerks: string[];
  userId: string;
  userName: string;
}

const LEVEL_CONFIG = {
  1: { color: 'from-green-400 to-green-600', icon: Star, label: 'Explorer' },
  2: { color: 'from-blue-400 to-blue-600', icon: Zap, label: 'Connector' },
  3: { color: 'from-purple-400 to-purple-600', icon: Users, label: 'Networker' },
  4: { color: 'from-orange-400 to-orange-600', icon: TrendingUp, label: 'Influencer' },
  5: { color: 'from-indigo-400 to-indigo-600', icon: Award, label: 'Leader' },
  6: { color: 'from-yellow-400 to-amber-600', icon: Trophy, label: 'Elite' }
};

export const LevelUpModal: React.FC<LevelUpModalProps> = ({
  visible,
  onClose,
  previousLevel,
  newLevel,
  newTier,
  newPerks,
  userId,
  userName
}) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
    if (visible) {
      setShowConfetti(true);
      setAnimationPhase(0);

      // Animation sequence
      setTimeout(() => setAnimationPhase(1), 500);
      setTimeout(() => setAnimationPhase(2), 1500);
      setTimeout(() => setShowConfetti(false), 5000);

      // Auto-close after 10 seconds
      const timer = setTimeout(() => onClose(), 10000);

      // Handle window resize
      const handleResize = () => {
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      };
      window.addEventListener('resize', handleResize);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [visible, onClose]);

  const levelConfig = LEVEL_CONFIG[newLevel as keyof typeof LEVEL_CONFIG] || LEVEL_CONFIG[6];
  const LevelIcon = levelConfig.icon;

  const handleShare = () => {
    const text = `🎉 I just reached Level ${newLevel} (${levelConfig.label}) on Fluzio! Join me in connecting with businesses worldwide. #Fluzio #Level${newLevel}`;
    
    if (navigator.share) {
      navigator.share({
        title: `Level ${newLevel} Achievement!`,
        text,
        url: `https://fluzio-13af2.web.app/profile/${userId}`
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(text);
      alert('✅ Copied to clipboard! Share on social media.');
    }
  };

  if (!visible) return null;

  return (
    <>
      {/* Confetti Effect */}
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          numberOfPieces={newLevel * 100}
          recycle={false}
          colors={['#9333ea', '#ec4899', '#f59e0b', '#3b82f6', '#10b981']}
          gravity={0.3}
        />
      )}

      {/* Modal Overlay */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Modal Content */}
        <div className={`
          bg-white rounded-3xl max-w-2xl w-full overflow-hidden
          transform transition-all duration-700
          ${animationPhase >= 0 ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}
        `}>
          {/* Header with gradient */}
          <div className={`bg-gradient-to-r ${levelConfig.color} p-8 text-white text-center relative overflow-hidden`}>
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-white rounded-full blur-3xl animate-pulse delay-1000" />
            </div>

            {/* Content */}
            <div className="relative z-10">
              <div className={`
                transform transition-all duration-1000 delay-500
                ${animationPhase >= 1 ? 'scale-100 rotate-0' : 'scale-0 rotate-180'}
              `}>
                <div className="w-24 h-24 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <LevelIcon className="w-14 h-14" />
                </div>
              </div>

              <h1 className="text-4xl font-bold mb-2">Level Up!</h1>
              <p className="text-xl opacity-90">Congratulations, {userName}!</p>
            </div>
          </div>

          {/* Level Transition */}
          <div className="py-8 px-8">
            <div className="flex items-center justify-center gap-8 mb-8">
              {/* Previous Level */}
              <div className="text-center">
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-2">
                  <span className="text-3xl font-bold text-gray-600">L{previousLevel}</span>
                </div>
                <p className="text-sm text-gray-500">
                  {LEVEL_CONFIG[previousLevel as keyof typeof LEVEL_CONFIG]?.label}
                </p>
              </div>

              {/* Arrow */}
              <div className="flex-shrink-0">
                <div className="w-16 h-0.5 bg-gradient-to-r from-gray-300 to-purple-500 relative">
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-l-8 border-l-purple-500 border-t-4 border-t-transparent border-b-4 border-b-transparent" />
                </div>
              </div>

              {/* New Level */}
              <div className="text-center">
                <div className={`
                  w-24 h-24 bg-gradient-to-br ${levelConfig.color} rounded-full flex items-center justify-center mb-2 shadow-2xl
                  transform transition-all duration-1000 delay-700
                  ${animationPhase >= 2 ? 'scale-100' : 'scale-0'}
                `}>
                  <span className="text-4xl font-bold text-white">L{newLevel}</span>
                </div>
                <p className="text-sm font-semibold text-gray-700">{levelConfig.label}</p>
                <p className="text-xs text-gray-500">{newTier} Tier</p>
              </div>
            </div>

            {/* New Perks */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Gift className="w-5 h-5 text-purple-600" />
                New Benefits Unlocked
              </h3>
              <div className="space-y-2">
                {newPerks.slice(0, 5).map((perk, idx) => (
                  <div
                    key={idx}
                    className={`
                      flex items-start gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl
                      transform transition-all duration-500
                      ${animationPhase >= 2 ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}
                    `}
                    style={{ transitionDelay: `${idx * 100}ms` }}
                  >
                    <div className="flex-shrink-0 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                      <Star className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-sm text-gray-700 font-medium">{perk}</p>
                  </div>
                ))}
              </div>
              {newPerks.length > 5 && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  + {newPerks.length - 5} more benefits
                </p>
              )}
            </div>

            {/* Stats Preview */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <Calendar className="w-6 h-6 text-purple-600 mx-auto mb-1" />
                <p className="text-xs text-gray-600">Missions/Month</p>
                <p className="text-lg font-bold text-gray-800">
                  {newLevel === 2 ? '3' : newLevel === 3 ? '6' : newLevel === 4 ? '15' : newLevel === 5 ? '30' : '50'}
                </p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <Users className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                <p className="text-xs text-gray-600">Meetup Size</p>
                <p className="text-lg font-bold text-gray-800">
                  {newLevel <= 3 ? '5' : newLevel === 4 ? '10' : newLevel === 5 ? '20' : '50'}
                </p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <Zap className="w-6 h-6 text-amber-600 mx-auto mb-1" />
                <p className="text-xs text-gray-600">Credits Bonus</p>
                <p className="text-lg font-bold text-gray-800">
                  {newTier === 'PLATINUM' ? '+50%' : newTier === 'GOLD' ? '+30%' : newTier === 'SILVER' ? '+15%' : '+0%'}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleShare}
                className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 flex items-center justify-center gap-2"
              >
                <Share2 className="w-5 h-5" />
                Share Achievement
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:border-purple-500 hover:text-purple-600"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LevelUpModal;
