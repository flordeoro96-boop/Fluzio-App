import React, { useState, useEffect } from 'react';
import { Trophy, Gift, TrendingUp, Heart, MessageCircle, Share2, Loader2, Users, Star } from 'lucide-react';
import { getActivityFeed, type ActivityFeedItem } from '../services/socialService';
import { useAuth } from '../services/AuthContext';
import { formatDistanceToNow } from 'date-fns';

export const SocialFeed: React.FC = () => {
  const { userProfile } = useAuth();
  const [activities, setActivities] = useState<ActivityFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'missions' | 'rewards' | 'levels'>('all');

  useEffect(() => {
    loadFeed();
  }, [userProfile?.id]);

  const loadFeed = async () => {
    if (!userProfile?.id) return;

    setLoading(true);
    try {
      const feed = await getActivityFeed(userProfile.id, 50);
      setActivities(feed);
    } catch (error) {
      console.error('Error loading activity feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: ActivityFeedItem['type']) => {
    switch (type) {
      case 'mission_completed':
        return <Trophy className="w-5 h-5 text-[#6C4BFF]" />;
      case 'reward_redeemed':
        return <Gift className="w-5 h-5 text-pink-600" />;
      case 'level_up':
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'meetup_joined':
        return <Users className="w-5 h-5 text-blue-600" />;
      case 'achievement_unlocked':
        return <Star className="w-5 h-5 text-yellow-600" />;
      default:
        return <Heart className="w-5 h-5 text-red-600" />;
    }
  };

  const getActivityColor = (type: ActivityFeedItem['type']) => {
    switch (type) {
      case 'mission_completed':
        return 'from-[#6C4BFF]/10 to-[#00E5FF]/10 border-[#6C4BFF]/20';
      case 'reward_redeemed':
        return 'from-pink-50 to-rose-50 border-pink-200';
      case 'level_up':
        return 'from-green-50 to-emerald-50 border-green-200';
      case 'meetup_joined':
        return 'from-blue-50 to-cyan-50 border-blue-200';
      case 'achievement_unlocked':
        return 'from-yellow-50 to-amber-50 border-yellow-200';
      default:
        return 'from-gray-50 to-slate-50 border-gray-200';
    }
  };

  const filteredActivities = activities.filter(activity => {
    if (filter === 'all') return true;
    if (filter === 'missions') return activity.type === 'mission_completed';
    if (filter === 'rewards') return activity.type === 'reward_redeemed';
    if (filter === 'levels') return activity.type === 'level_up';
    return true;
  });

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-[#00E5FF] animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#1E0E62]">Activity Feed</h2>
          <p className="text-sm text-gray-500 mt-1">See what your friends are up to</p>
        </div>
        
        {/* Filter Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              filter === 'all'
                ? 'bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('missions')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              filter === 'missions'
                ? 'bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Missions
          </button>
          <button
            onClick={() => setFilter('rewards')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              filter === 'rewards'
                ? 'bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Rewards
          </button>
          <button
            onClick={() => setFilter('levels')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              filter === 'levels'
                ? 'bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Levels
          </button>
        </div>
      </div>

      {filteredActivities.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900">No activity yet</p>
          <p className="text-sm text-gray-500 mt-2">
            {filter === 'all' 
              ? "Your friends' activities will appear here" 
              : "No activities found for this filter"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredActivities.map((activity) => (
            <div
              key={activity.id}
              className={`relative bg-gradient-to-r ${getActivityColor(activity.type)} border rounded-xl p-4 hover:shadow-md transition-all`}
            >
              <div className="flex items-start gap-4">
                {/* User Avatar */}
                <img
                  src={activity.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(activity.userName)}&background=random`}
                  alt={activity.userName}
                  className="w-12 h-12 rounded-full border-2 border-white shadow-md"
                />

                {/* Activity Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-[#1E0E62]">{activity.userName}</h3>
                    <span className="text-xs text-gray-500">
                      {activity.createdAt && formatDistanceToNow(activity.createdAt, { addSuffix: true })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    {getActivityIcon(activity.type)}
                    <p className="text-sm font-semibold text-gray-700">{activity.title}</p>
                  </div>

                  <p className="text-sm text-gray-600">{activity.description}</p>

                  {activity.points && activity.points > 0 && (
                    <div className="inline-flex items-center gap-1 mt-2 px-3 py-1 bg-gradient-to-r from-[#00E5FF]/20 to-[#6C4BFF]/20 rounded-full">
                      <Star className="w-4 h-4 text-[#6C4BFF]" />
                      <span className="text-sm font-bold text-[#6C4BFF]">+{activity.points} XP</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-white/50 rounded-full transition-colors">
                    <Heart className="w-5 h-5 text-gray-400 hover:text-red-500" />
                  </button>
                  <button className="p-2 hover:bg-white/50 rounded-full transition-colors">
                    <MessageCircle className="w-5 h-5 text-gray-400 hover:text-blue-500" />
                  </button>
                  <button className="p-2 hover:bg-white/50 rounded-full transition-colors">
                    <Share2 className="w-5 h-5 text-gray-400 hover:text-green-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredActivities.length > 0 && (
        <button
          onClick={loadFeed}
          className="w-full mt-6 py-3 bg-gradient-to-r from-[#00E5FF]/10 to-[#6C4BFF]/10 hover:from-[#00E5FF]/20 hover:to-[#6C4BFF]/20 text-[#6C4BFF] font-semibold rounded-lg transition-all"
        >
          Load More
        </button>
      )}
    </div>
  );
};
