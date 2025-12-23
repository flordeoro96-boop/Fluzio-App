import React, { useEffect, useState } from 'react';
import { Sparkles, Check, Crown, TrendingUp, Users, Globe, Zap, ArrowRight } from 'lucide-react';

interface LevelRevealScreenProps {
  level: 'FREE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  onContinue: () => void;
}

const LEVEL_INFO = {
  FREE: {
    name: 'Explorer',
    emoji: '🌱',
    color: 'from-gray-400 to-gray-600',
    benefits: [
      'Create missions in your city',
      'Connect with local creators',
      'Access to basic analytics',
      'Community support'
    ],
    message: 'Perfect for validating your idea and getting started!'
  },
  SILVER: {
    name: 'Rising Star',
    emoji: '🥈',
    color: 'from-gray-300 to-gray-500',
    benefits: [
      'Everything in Explorer',
      'Priority mission visibility',
      'Advanced targeting options',
      'Email support',
      'Collaborate with other businesses'
    ],
    message: 'Great for growing businesses building momentum!'
  },
  GOLD: {
    name: 'Established',
    emoji: '🥇',
    color: 'from-yellow-400 to-orange-500',
    benefits: [
      'Everything in Rising Star',
      'Multi-city campaigns',
      'Premium analytics & insights',
      'Dedicated account manager',
      'Priority matching',
      'Squad access'
    ],
    message: 'Perfect for scaling businesses ready to expand!'
  },
  PLATINUM: {
    name: 'Elite Leader',
    emoji: '💎',
    color: 'from-purple-500 to-pink-600',
    benefits: [
      'Everything in Established',
      'Nationwide campaigns',
      'White-glove service',
      'Custom integrations',
      'Early access to new features',
      'VIP community access',
      'International expansion support'
    ],
    message: 'The ultimate tier for market leaders!'
  }
};

export const LevelRevealScreen: React.FC<LevelRevealScreenProps> = ({ level, onContinue }) => {
  const [revealed, setRevealed] = useState(false);
  const info = LEVEL_INFO[level];

  useEffect(() => {
    const timer = setTimeout(() => setRevealed(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900 flex items-center justify-center p-4 overflow-hidden relative">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      <div className="max-w-2xl w-full relative z-10">
        {/* Reveal Animation */}
        <div className={`text-center transition-all duration-1000 ${revealed ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          {/* Sparkle Icon */}
          <div className="mb-6 animate-pulse">
            <Sparkles className="w-16 h-16 text-yellow-300 mx-auto" />
          </div>

          <h1 className="text-white text-2xl font-medium mb-4">Welcome to</h1>
          
          {/* Level Badge */}
          <div className={`inline-block bg-gradient-to-r ${info.color} rounded-3xl p-8 mb-8 shadow-2xl`}>
            <div className="text-6xl mb-4">{info.emoji}</div>
            <h2 className="text-5xl font-black text-white mb-2 font-clash">{level}</h2>
            <p className="text-2xl text-white/90 font-medium">{info.name}</p>
          </div>

          {/* Message */}
          <p className="text-xl text-white/90 mb-8 max-w-md mx-auto">
            {info.message}
          </p>

          {/* Benefits */}
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 mb-8">
            <h3 className="text-white text-xl font-bold mb-6 flex items-center justify-center gap-2">
              <Crown className="w-6 h-6 text-yellow-300" />
              Here's what this unlocks for you
            </h3>
            <div className="space-y-3">
              {info.benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 text-left"
                  style={{
                    animation: 'slideInLeft 0.5s ease-out forwards',
                    animationDelay: `${index * 100}ms`,
                    opacity: 0
                  }}
                >
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white/90 font-medium">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Continue Button */}
          <button
            onClick={onContinue}
            className="bg-white text-purple-900 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gray-100 transition-all duration-200 hover:scale-105 flex items-center gap-2 mx-auto shadow-xl"
          >
            Continue to Your Dashboard
            <ArrowRight className="w-5 h-5" />
          </button>

          <p className="text-white/60 text-sm mt-6">
            ✨ You can always upgrade or downgrade your plan later
          </p>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
          }
        }
        
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};
