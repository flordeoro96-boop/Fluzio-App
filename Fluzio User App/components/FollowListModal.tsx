import React, { useState, useEffect } from 'react';
import { X, Users, UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { getFollowers, getFollowing, followUser, unfollowUser, isFollowing } from '../services/socialService';
import { useAuth } from '../services/AuthContext';

interface FollowListModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  initialTab?: 'followers' | 'following';
}

export const FollowListModal: React.FC<FollowListModalProps> = ({
  isOpen,
  onClose,
  userId,
  userName,
  initialTab = 'followers'
}) => {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initialTab);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingStatus, setFollowingStatus] = useState<{ [key: string]: boolean }>({});
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, userId, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'followers') {
        const data = await getFollowers(userId);
        setFollowers(data);
        
        // Check following status for each follower
        if (userProfile?.id) {
          const statusChecks = await Promise.all(
            data.map(async (user) => ({
              userId: user.id,
              isFollowing: await isFollowing(userProfile.id, user.id)
            }))
          );
          
          const statusMap: { [key: string]: boolean } = {};
          statusChecks.forEach(({ userId, isFollowing }) => {
            statusMap[userId] = isFollowing;
          });
          setFollowingStatus(statusMap);
        }
      } else {
        const data = await getFollowing(userId);
        setFollowing(data);
        
        // Check following status for each following
        if (userProfile?.id) {
          const statusChecks = await Promise.all(
            data.map(async (user) => ({
              userId: user.id,
              isFollowing: await isFollowing(userProfile.id, user.id)
            }))
          );
          
          const statusMap: { [key: string]: boolean } = {};
          statusChecks.forEach(({ userId, isFollowing }) => {
            statusMap[userId] = isFollowing;
          });
          setFollowingStatus(statusMap);
        }
      }
    } catch (error) {
      console.error('Error loading follow data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async (targetUserId: string) => {
    if (!userProfile?.id || targetUserId === userProfile.id) return;

    setActionLoading(prev => ({ ...prev, [targetUserId]: true }));
    
    try {
      const isCurrentlyFollowing = followingStatus[targetUserId];
      
      if (isCurrentlyFollowing) {
        await unfollowUser(userProfile.id, targetUserId);
        setFollowingStatus(prev => ({ ...prev, [targetUserId]: false }));
      } else {
        await followUser(userProfile.id, targetUserId);
        setFollowingStatus(prev => ({ ...prev, [targetUserId]: true }));
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      alert('Failed to update follow status');
    } finally {
      setActionLoading(prev => ({ ...prev, [targetUserId]: false }));
    }
  };

  const currentList = activeTab === 'followers' ? followers : following;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#1E0E62]">{userName}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('followers')}
            className={`flex-1 px-4 py-3 font-semibold transition-colors ${
              activeTab === 'followers'
                ? 'text-[#00E5FF] border-b-2 border-[#00E5FF]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Followers
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={`flex-1 px-4 py-3 font-semibold transition-colors ${
              activeTab === 'following'
                ? 'text-[#00E5FF] border-b-2 border-[#00E5FF]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Following
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-[#00E5FF] animate-spin" />
            </div>
          ) : currentList.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {activeTab === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {currentList.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  {/* Avatar */}
                  <img
                    src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                    alt={user.name}
                    className="w-12 h-12 rounded-full"
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[#1E0E62] truncate">{user.name}</h3>
                    <p className="text-sm text-gray-500 truncate">{user.bio || 'No bio'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400">Level {user.level}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-400">{user.followersCount || 0} followers</span>
                    </div>
                  </div>

                  {/* Follow Button */}
                  {userProfile?.id && user.id !== userProfile.id && (
                    <button
                      onClick={() => handleFollowToggle(user.id)}
                      disabled={actionLoading[user.id]}
                      className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 ${
                        followingStatus[user.id]
                          ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          : 'bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white hover:shadow-lg'
                      }`}
                    >
                      {actionLoading[user.id] ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : followingStatus[user.id] ? (
                        <>
                          <UserMinus className="w-4 h-4" />
                          Unfollow
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          Follow
                        </>
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
