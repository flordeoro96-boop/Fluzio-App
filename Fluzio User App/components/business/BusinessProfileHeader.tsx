import React, { useEffect, useState } from 'react';
import { User, SubscriptionLevel } from '../../types';
import { MapPin, Star, Shield, Award, TrendingUp } from 'lucide-react';
import { getBusinessLevelData, getLevelName, getLevelDisplay } from '../../src/lib/levels/businessLevel';

interface BusinessProfileHeaderProps {
  business: User;
  isOwner?: boolean;
}

export const BusinessProfileHeader: React.FC<BusinessProfileHeaderProps> = ({ business, isOwner = false }) => {
  const [levelData, setLevelData] = useState<{
    level: number;
    subLevel: number;
    xp: number;
    levelName: string;
  } | null>(null);

  // Load business level data
  useEffect(() => {
    const loadLevel = async () => {
      const data = await getBusinessLevelData(business.id);
      if (data) {
        setLevelData({
          level: data.businessLevel,
          subLevel: data.businessSubLevel,
          xp: data.businessXp,
          levelName: getLevelName(data.businessLevel)
        });
      }
    };
    loadLevel();
  }, [business.id]);

  const tierColors = {
    [SubscriptionLevel.FREE]: 'bg-gray-100 text-gray-700 border-gray-300',
    [SubscriptionLevel.SILVER]: 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-400',
    [SubscriptionLevel.GOLD]: 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-900 border-yellow-500',
    [SubscriptionLevel.PLATINUM]: 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-900 border-purple-500'
  };

  const tierEmojis = {
    [SubscriptionLevel.FREE]: '🆓',
    [SubscriptionLevel.SILVER]: '🥈',
    [SubscriptionLevel.GOLD]: '🥇',
    [SubscriptionLevel.PLATINUM]: '💎'
  };

  // Level badge colors based on main level
  const levelColors = {
    1: 'bg-gray-50 text-gray-700 border-gray-300',        // Explorer
    2: 'bg-green-50 text-green-700 border-green-300',     // Builder
    3: 'bg-blue-50 text-blue-700 border-blue-300',        // Operator
    4: 'bg-purple-50 text-purple-700 border-purple-300',  // Growth Leader
    5: 'bg-orange-50 text-orange-700 border-orange-300',  // Expert
    6: 'bg-gradient-to-r from-yellow-100 to-pink-100 text-pink-700 border-pink-400' // Elite
  };

  const levelEmojis = {
    1: '🔰', // Explorer
    2: '🛠️', // Builder
    3: '⚙️', // Operator
    4: '🚀', // Growth Leader
    5: '🎯', // Expert
    6: '👑'  // Elite
  };

  return (
    <div className="bg-white rounded-3xl shadow-lg overflow-hidden mb-6">
      {/* Cover Image */}
      <div className="h-32 bg-gradient-to-br from-[#6C4BFF] via-[#00E5FF] to-[#FFB86C]"></div>
      
      {/* Profile Content */}
      <div className="px-6 pb-6">
        {/* Logo - Overlaps cover */}
        <div className="flex items-end -mt-12 mb-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-white border-4 border-white shadow-xl overflow-hidden">
              <img 
                src={business.avatarUrl} 
                alt={business.name}
                className="w-full h-full object-cover"
              />
            </div>
            {business.isVerified && (
              <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1 border-2 border-white shadow-lg">
                <Shield className="w-4 h-4 text-white" fill="currentColor" />
              </div>
            )}
          </div>
          
          {/* Badges: Tier + Level */}
          <div className="ml-4 mb-2 flex flex-col gap-2">
            {/* Tier Badge */}
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold border-2 ${tierColors[business.subscriptionLevel]}`}>
              <span>{tierEmojis[business.subscriptionLevel]}</span>
              <span>{business.subscriptionLevel}</span>
            </div>
            
            {/* Level Badge */}
            {levelData && (
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold border-2 ${levelColors[levelData.level as keyof typeof levelColors]}`}>
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{levelEmojis[levelData.level as keyof typeof levelEmojis]}</span>
                <span>Level {getLevelDisplay(levelData.level, levelData.subLevel)}</span>
                <span className="text-xs opacity-75">({levelData.levelName})</span>
              </div>
            )}
          </div>
        </div>

        {/* Business Name & Category */}
        <div className="mb-3">
          <h1 className="text-2xl font-clash font-bold text-[#1E0E62] mb-1">
            {business.name}
          </h1>
          <div className="flex items-center gap-3 flex-wrap">
            {business.category && (
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-sm font-semibold border border-purple-200">
                {business.category}
              </span>
            )}
            {business.homeCity && (
              <div className="flex items-center gap-1 text-sm text-[#8F8FA3]">
                <MapPin className="w-4 h-4" />
                <span>{business.homeCity}</span>
              </div>
            )}
          </div>
        </div>

        {/* Tagline/Bio Preview */}
        {business.bio && (
          <p className="text-[#8F8FA3] text-base leading-relaxed mb-4 line-clamp-2">
            {business.bio}
          </p>
        )}

        {/* Quick Stats */}
        {(business.rating || business.collabsCompleted) && (
          <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
            {business.rating && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500" fill="currentColor" />
                <span className="font-bold text-[#1E0E62]">{business.rating.toFixed(1)}</span>
                <span className="text-xs text-[#8F8FA3]">({business.reviewsCount || 0})</span>
              </div>
            )}
            {business.collabsCompleted && (
              <div className="flex items-center gap-1">
                <Award className="w-4 h-4 text-purple-500" />
                <span className="font-bold text-[#1E0E62]">{business.collabsCompleted}</span>
                <span className="text-xs text-[#8F8FA3]">collabs</span>
              </div>
            )}
            {business.creatorFavorites && (
              <div className="flex items-center gap-1">
                <span className="text-base">❤️</span>
                <span className="font-bold text-[#1E0E62]">{business.creatorFavorites}</span>
                <span className="text-xs text-[#8F8FA3]">favorites</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
