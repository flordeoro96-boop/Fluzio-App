import React, { useState, useEffect } from 'react';
import { UserPlus, Loader2, MapPin, TrendingUp } from 'lucide-react';
import { getSuggestedUsers, followUser, isFollowing } from '../services/socialService';
import { useAuth } from '../services/AuthContext';

export const SuggestedUsers: React.FC = () => {
  const { userProfile } = useAuth();
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingStatus, setFollowingStatus] = useState<{ [key: string]: boolean }>({});
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    loadSuggestedUsers();
  }, [userProfile?.id]);

  const loadSuggestedUsers = async () => {
    if (!userProfile?.id) return;

    setLoading(true);
    try {
      const users = await getSuggestedUsers(userProfile.id, 5);
      setSuggestedUsers(users);

      // Check following status for each suggested user
      const statusChecks = await Promise.all(
        users.map(async (user) => ({
          userId: user.id,
          isFollowing: await isFollowing(userProfile.id, user.id)
        }))
      );

      const statusMap: { [key: string]: boolean } = {};
      statusChecks.forEach(({ userId, isFollowing: following }) => {
        statusMap[userId] = following;
      });
      setFollowingStatus(statusMap);
    } catch (error) {
      console.error('Error loading suggested users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (targetUserId: string) => {
    if (!userProfile?.id) return;

    setActionLoading(prev => ({ ...prev, [targetUserId]: true }));
    
    try {
      await followUser(userProfile.id, targetUserId);
      setFollowingStatus(prev => ({ ...prev, [targetUserId]: true }));
      
      // Remove from suggested list after following
      setTimeout(() => {
        setSuggestedUsers(prev => prev.filter(u => u.id !== targetUserId));
      }, 500);
    } catch (error) {
      console.error('Error following user:', error);
      alert('Failed to follow user');
    } finally {
      setActionLoading(prev => ({ ...prev, [targetUserId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 text-[#00E5FF] animate-spin" />
        </div>
      </div>
    );
  }

  if (suggestedUsers.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-[#00E5FF]" />
        <h2 className="text-xl font-bold text-[#1E0E62]">Suggested Users</h2>
      </div>
      <p className="text-sm text-gray-500 mb-6">People near you with similar interests</p>

      <div className="space-y-4">
        {suggestedUsers.map((user) => (
          <div
            key={user.id}
            className="flex items-center gap-3 p-4 bg-gradient-to-r from-[#00E5FF]/5 to-[#6C4BFF]/5 rounded-xl hover:shadow-md transition-all"
          >
            {/* Avatar */}
            <img
              src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
              alt={user.name}
              className="w-14 h-14 rounded-full border-2 border-[#00E5FF]"
            />

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-[#1E0E62] truncate">{user.name}</h3>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                <MapPin className="w-3 h-3" />
                <span>{user.location}</span>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs font-semibold text-[#6C4BFF]">
                  Level {user.level}
                </span>
                <span className="text-xs text-gray-400">
                  {user.followersCount || 0} followers
                </span>
              </div>
            </div>

            {/* Follow Button */}
            <button
              onClick={() => handleFollow(user.id)}
              disabled={actionLoading[user.id] || followingStatus[user.id]}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 ${
                followingStatus[user.id]
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white hover:shadow-lg hover:scale-105'
              }`}
            >
              {actionLoading[user.id] ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : followingStatus[user.id] ? (
                'Following'
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Follow
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
