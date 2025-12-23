import React, { useState } from 'react';
import { 
  Users, TrendingUp, ShoppingCart, Handshake, Megaphone, 
  Camera, Star, MapPin, MessageSquare, Award, ArrowRight, Check
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface BusinessGoalsScreenProps {
  onComplete: (goals: string[]) => void;
  onSkip?: () => void;
}

interface GoalOption {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
}

const GOAL_OPTIONS: GoalOption[] = [
  { 
    id: 'followers', 
    label: 'More Followers', 
    description: 'Grow your social media presence',
    icon: <Users className="w-7 h-7" />, 
    color: 'text-blue-600', 
    gradient: 'from-blue-500 to-cyan-500' 
  },
  { 
    id: 'foottraffic', 
    label: 'Increase Foot Traffic', 
    description: 'Bring more customers to your location',
    icon: <MapPin className="w-7 h-7" />, 
    color: 'text-red-600', 
    gradient: 'from-red-500 to-pink-500' 
  },
  { 
    id: 'sales', 
    label: 'Boost Sales', 
    description: 'Drive revenue and conversions',
    icon: <ShoppingCart className="w-7 h-7" />, 
    color: 'text-green-600', 
    gradient: 'from-green-500 to-emerald-500' 
  },
  { 
    id: 'awareness', 
    label: 'Build Brand Awareness', 
    description: 'Get your business noticed',
    icon: <Megaphone className="w-7 h-7" />, 
    color: 'text-purple-600', 
    gradient: 'from-purple-500 to-fuchsia-500' 
  },
  { 
    id: 'content', 
    label: 'Content Creation', 
    description: 'Get quality content for your brand',
    icon: <Camera className="w-7 h-7" />, 
    color: 'text-pink-600', 
    gradient: 'from-pink-500 to-rose-500' 
  },
  { 
    id: 'reviews', 
    label: 'Customer Reviews', 
    description: 'Build trust with testimonials',
    icon: <Star className="w-7 h-7" />, 
    color: 'text-yellow-600', 
    gradient: 'from-yellow-500 to-orange-500' 
  },
  { 
    id: 'networking', 
    label: 'Meet Other Businesses', 
    description: 'Connect and collaborate locally',
    icon: <Handshake className="w-7 h-7" />, 
    color: 'text-indigo-600', 
    gradient: 'from-indigo-500 to-purple-500' 
  },
  { 
    id: 'engagement', 
    label: 'Customer Engagement', 
    description: 'Build relationships with your audience',
    icon: <MessageSquare className="w-7 h-7" />, 
    color: 'text-teal-600', 
    gradient: 'from-teal-500 to-cyan-500' 
  },
  { 
    id: 'reputation', 
    label: 'Improve Reputation', 
    description: 'Strengthen your brand image',
    icon: <Award className="w-7 h-7" />, 
    color: 'text-orange-600', 
    gradient: 'from-orange-500 to-amber-500' 
  },
  { 
    id: 'growth', 
    label: 'Overall Growth', 
    description: 'Scale your business holistically',
    icon: <TrendingUp className="w-7 h-7" />, 
    color: 'text-emerald-600', 
    gradient: 'from-emerald-500 to-green-500' 
  },
];

export const BusinessGoalsScreen: React.FC<BusinessGoalsScreenProps> = ({ 
  onComplete, 
  onSkip 
}) => {
  const { t } = useTranslation();
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const toggleGoal = (goalId: string) => {
    setSelectedGoals(prev => {
      if (prev.includes(goalId)) {
        return prev.filter(id => id !== goalId);
      }
      return [...prev, goalId];
    });
  };

  const handleContinue = () => {
    if (selectedGoals.length > 0) {
      onComplete(selectedGoals);
    }
  };

  const isSelected = (id: string) => selectedGoals.includes(id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F9FE] via-white to-[#F8F9FE] flex items-center justify-center p-4">
      <div className="max-w-6xl w-full">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[#00E5FF] to-[#6C4BFF] mb-4 shadow-lg">
            <TrendingUp className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-[#1E0E62] mb-3">
            What are your business goals?
          </h1>
          <p className="text-lg text-[#8F8FA3] max-w-2xl mx-auto">
            Help us understand what you want to achieve. We'll match you with creators and missions that align with your objectives.
            <span className="block mt-1 text-sm text-[#00E5FF] font-semibold">
              Select at least 2 goals to get started 🎯
            </span>
          </p>
        </div>

        {/* Selected Count Indicator */}
        <div className="flex justify-center mb-6">
          <div className={`px-6 py-2 rounded-full transition-all duration-300 ${
            selectedGoals.length >= 2 
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg scale-105' 
              : 'bg-white border-2 border-gray-200 text-gray-600'
          }`}>
            <span className="font-bold">{selectedGoals.length}</span> goal{selectedGoals.length !== 1 ? 's' : ''} selected
            {selectedGoals.length >= 2 && (
              <Check className="w-4 h-4 inline ml-2" />
            )}
          </div>
        </div>

        {/* Goals Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {GOAL_OPTIONS.map((goal, index) => {
            const selected = isSelected(goal.id);
            const hovered = hoveredId === goal.id;
            
            return (
              <button
                key={goal.id}
                onClick={() => toggleGoal(goal.id)}
                onMouseEnter={() => setHoveredId(goal.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`
                  relative p-5 rounded-2xl border-2 transition-all duration-300 transform text-left
                  ${selected 
                    ? 'border-transparent shadow-2xl scale-105' 
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-lg hover:scale-102'
                  }
                `}
                style={{
                  animationDelay: `${index * 50}ms`,
                  backgroundImage: selected ? `linear-gradient(135deg, var(--tw-gradient-stops))` : undefined,
                }}
              >
                {/* Selection Check Mark */}
                {selected && (
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center animate-scale-in">
                    <Check className="w-5 h-5 text-green-600 font-bold" />
                  </div>
                )}

                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`
                    flex items-center justify-center w-14 h-14 rounded-xl transition-all duration-300 flex-shrink-0
                    ${selected 
                      ? 'bg-white/20 text-white' 
                      : `bg-gradient-to-br ${goal.gradient} text-white`
                    }
                    ${hovered && !selected ? 'scale-110' : ''}
                  `}>
                    {goal.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className={`
                      text-base font-bold mb-1 transition-colors duration-300
                      ${selected ? 'text-white' : 'text-[#1E0E62]'}
                    `}>
                      {goal.label}
                    </h3>
                    <p className={`
                      text-xs transition-colors duration-300
                      ${selected ? 'text-white/90' : 'text-[#8F8FA3]'}
                    `}>
                      {goal.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          {onSkip && (
            <button
              onClick={onSkip}
              className="px-6 py-3 rounded-xl text-[#8F8FA3] hover:text-[#1E0E62] transition-colors font-medium"
            >
              Skip for now
            </button>
          )}
          
          <button
            onClick={handleContinue}
            disabled={selectedGoals.length === 0}
            className={`
              px-8 py-4 rounded-xl font-bold text-white transition-all duration-300 transform
              flex items-center gap-2 shadow-lg
              ${selectedGoals.length > 0
                ? 'bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] hover:shadow-2xl hover:scale-105 cursor-pointer'
                : 'bg-gray-300 cursor-not-allowed opacity-50'
              }
            `}
          >
            {selectedGoals.length >= 2 ? "Let's Grow!" : 'Continue'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Helpful Tip */}
        {selectedGoals.length > 0 && selectedGoals.length < 2 && (
          <p className="text-center text-sm text-[#8F8FA3] mt-4 animate-fade-in">
            💡 Select {2 - selectedGoals.length} more goal{2 - selectedGoals.length !== 1 ? 's' : ''} to help us serve you better
          </p>
        )}
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes scale-in {
          from { transform: scale(0); }
          to { transform: scale(1); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        
        .animate-scale-in {
          animation: scale-in 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
      `}</style>
    </div>
  );
};
