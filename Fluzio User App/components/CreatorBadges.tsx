/**
 * Creator Badges Display Component
 * 
 * Shows badges earned by creators (Verified, Top Rated, Rising Talent, etc.)
 */

import React from 'react';
import { 
  Shield, 
  Star, 
  TrendingUp, 
  Award, 
  Zap, 
  Sparkles,
  LucideIcon
} from 'lucide-react';
import { CreatorBadge, BadgeType } from '../services/creatorReviewService';

interface CreatorBadgesDisplayProps {
  badges: CreatorBadge[];
  size?: 'small' | 'medium' | 'large';
  showDescription?: boolean;
}

const badgeIcons: Record<string, LucideIcon> = {
  'shield-check': Shield,
  'star': Star,
  'trending-up': TrendingUp,
  'award': Award,
  'zap': Zap,
  'sparkles': Sparkles
};

const badgeColors: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-700 border-blue-300',
  gold: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  green: 'bg-green-100 text-green-700 border-green-300',
  purple: 'bg-purple-100 text-purple-700 border-purple-300',
  orange: 'bg-orange-100 text-orange-700 border-orange-300',
  pink: 'bg-pink-100 text-pink-700 border-pink-300'
};

export const CreatorBadgesDisplay: React.FC<CreatorBadgesDisplayProps> = ({
  badges,
  size = 'medium',
  showDescription = false
}) => {
  if (badges.length === 0) return null;

  const sizeClasses = {
    small: 'px-2 py-1 text-xs',
    medium: 'px-3 py-1.5 text-sm',
    large: 'px-4 py-2 text-base'
  };

  const iconSizes = {
    small: 'w-3 h-3',
    medium: 'w-4 h-4',
    large: 'w-5 h-5'
  };

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badge) => {
        const Icon = badgeIcons[badge.icon] || Award;
        const colorClass = badgeColors[badge.color] || badgeColors.blue;
        
        return (
          <div
            key={badge.id}
            className={`inline-flex items-center gap-2 rounded-full border ${colorClass} ${sizeClasses[size]} font-medium`}
            title={showDescription ? undefined : badge.description}
          >
            <Icon className={iconSizes[size]} />
            <span>{badge.name}</span>
            {showDescription && (
              <span className="text-xs opacity-75 ml-1">- {badge.description}</span>
            )}
          </div>
        );
      })}
    </div>
  );
};

/**
 * Single Badge Component for detailed display
 */
interface BadgeCardProps {
  badge: CreatorBadge;
}

export const BadgeCard: React.FC<BadgeCardProps> = ({ badge }) => {
  const Icon = badgeIcons[badge.icon] || Award;
  const colorClass = badgeColors[badge.color] || badgeColors.blue;
  
  const gradients: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600',
    gold: 'from-yellow-500 to-yellow-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    pink: 'from-pink-500 to-pink-600'
  };
  
  const gradient = gradients[badge.color] || gradients.blue;
  
  return (
    <div className={`bg-white rounded-xl shadow-md p-4 border-2 ${colorClass.split(' ')[2]}`}>
      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center mb-3`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="font-bold text-gray-900 mb-1">{badge.name}</h3>
      <p className="text-sm text-gray-600">{badge.description}</p>
      {badge.earnedAt && (
        <p className="text-xs text-gray-500 mt-2">
          Earned {badge.earnedAt.toDate().toLocaleDateString()}
        </p>
      )}
    </div>
  );
};
