import React from 'react';
import { User } from '../../types';
import { Star, Award, Heart, Zap, Shield } from 'lucide-react';

interface CollabStatsProps {
  business: User;
}

export const CollabStats: React.FC<CollabStatsProps> = ({ business }) => {
  const stats = [];

  if (business.rating) {
    stats.push({
      icon: Star,
      label: 'Rating',
      value: business.rating.toFixed(1),
      suffix: business.reviewsCount ? `(${business.reviewsCount} reviews)` : '',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50'
    });
  }

  if (business.collabsCompleted) {
    stats.push({
      icon: Award,
      label: 'Collabs Completed',
      value: business.collabsCompleted.toString(),
      suffix: '',
      color: 'text-purple-500',
      bgColor: 'bg-purple-50'
    });
  }

  if (business.creatorFavorites) {
    stats.push({
      icon: Heart,
      label: 'Creator Favorites',
      value: business.creatorFavorites.toString(),
      suffix: '',
      color: 'text-pink-500',
      bgColor: 'bg-pink-50'
    });
  }

  if (business.responseTime) {
    stats.push({
      icon: Zap,
      label: 'Response Time',
      value: business.responseTime,
      suffix: '',
      color: 'text-green-500',
      bgColor: 'bg-green-50'
    });
  }

  if (business.isVerified) {
    stats.push({
      icon: Shield,
      label: 'Verified Business',
      value: '✓',
      suffix: '',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50'
    });
  }

  if (stats.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
      <h2 className="text-xl font-clash font-bold text-[#1E0E62] mb-4">Collaboration Stats</h2>
      
      <div className="grid grid-cols-1 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
            <div className={`w-10 h-10 rounded-full ${stat.bgColor} flex items-center justify-center flex-shrink-0`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div className="flex-1">
              <div className="text-xs text-[#8F8FA3] font-medium mb-0.5">{stat.label}</div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-[#1E0E62]">{stat.value}</span>
                {stat.suffix && (
                  <span className="text-xs text-[#8F8FA3]">{stat.suffix}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
