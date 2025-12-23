import React, { useState, useEffect } from 'react';
import { X, UserPlus, UserCheck, UserX, Users, Activity, TrendingUp, Award, Calendar, Gift, Search } from 'lucide-react';
import { User } from '../types';
import * as socialService from '../services/socialService';
import * as userService from '../services/userService';
import { formatDistanceToNow } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { UserProfileView } from './UserProfileView';

interface FriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
}

type Tab = 'friends' | 'requests' | 'feed' | 'discover';

interface FriendWithDetails extends userService.SearchableUser {
  friendshipDate?: Date;
}

interface RequestWithDetails extends socialService.FriendRequest {
  userName: string;
  userAvatar?: string;
}

export const FriendsModal: React.FC<FriendsModalProps> = ({
  isOpen,
  onClose,
  currentUser
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('friends');
  const [friends, setFriends] = useState<FriendWithDetails[]>([]);
  const [pendingRequests, setPendingRequests] = useState<RequestWithDetails[]>([]);
  const [sentRequests, setSentRequests] = useState<RequestWithDetails[]>([]);
  const [activityFeed, setActivityFeed] = useState<socialService.ActivityFeedItem[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<userService.SearchableUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'friends') {
        await loadFriends();
      } else if (activeTab === 'requests') {
        await loadRequests();
      } else if (activeTab === 'feed') {
        await loadActivityFeed();
      } else if (activeTab === 'discover') {
        await loadSuggestedUsers();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadFriends = async () => {
    const friendIds = await socialService.getFriends(currentUser.id);
    const friendDetails = await Promise.all(
      friendIds.map(id => userService.getUserById(id))
    );
    setFriends(friendDetails.filter(f => f !== null) as FriendWithDetails[]);
  };

  const loadRequests = async () => {
    const [pending, sent] = await Promise.all([
      socialService.getPendingRequests(currentUser.id),
      socialService.getSentRequests(currentUser.id)
    ]);

    // Fetch user details for requests
    const pendingWithDetails = await Promise.all(
      pending.map(async req => {
        const user = await userService.getUserById(req.fromUserId);
        return {
          ...req,
          userName: user?.name || 'Unknown User',
          userAvatar: user?.photoUrl
        };
      })
    );

    const sentWithDetails = await Promise.all(
      sent.map(async req => {
        const user = await userService.getUserById(req.toUserId);
        return {
          ...req,
          userName: user?.name || 'Unknown User',
          userAvatar: user?.photoUrl
        };
      })
    );

    setPendingRequests(pendingWithDetails);
    setSentRequests(sentWithDetails);
  };

  const loadActivityFeed = async () => {
    const activities = await socialService.getActivityFeed(currentUser.id, 50);
    setActivityFeed(activities);
  };

  const loadSuggestedUsers = async () => {
    // Get users in the same city
    const users = await userService.getUsersByRole('CREATOR', currentUser.id, 20);
    setSuggestedUsers(users);
  };

  const handleAcceptRequest = async (requestId: string) => {
    const result = await socialService.acceptFriendRequest(requestId);
    if (result.success) {
      await loadRequests();
      await loadFriends();
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    const result = await socialService.rejectFriendRequest(requestId);
    if (result.success) {
      await loadRequests();
    }
  };

  const handleSendRequest = async (userId: string) => {
    const result = await socialService.sendFriendRequest(currentUser.id, userId);
    if (result.success) {
      await loadSuggestedUsers();
    } else {
      alert(result.error);
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (confirm(t('friends.actions.removeConfirm'))) {
      const result = await socialService.removeFriend(currentUser.id, friendId);
      if (result.success) {
        await loadFriends();
      }
    }
  };

  const getActivityIcon = (type: socialService.ActivityFeedItem['type']) => {
    switch (type) {
      case 'mission_completed': return <Award className="w-5 h-5 text-purple-600" />;
      case 'reward_redeemed': return <Gift className="w-5 h-5 text-pink-600" />;
      case 'level_up': return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'meetup_joined': return <Calendar className="w-5 h-5 text-blue-600" />;
      case 'achievement_unlocked': return <Award className="w-5 h-5 text-yellow-600" />;
      default: return <Activity className="w-5 h-5 text-gray-600" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full sm:max-w-2xl bg-white sm:rounded-3xl shadow-2xl animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 duration-300 flex flex-col max-h-[90vh] sm:max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-clash font-bold text-gray-900">{t('friends.title')}</h2>
              <p className="text-sm text-gray-500">{t('friends.count', { count: friends.length })}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-6 py-4 border-b border-gray-100 overflow-x-auto">
          {[
            { id: 'friends', label: t('friends.tabs.friends'), count: friends.length },
            { id: 'requests', label: t('friends.tabs.requests'), count: pendingRequests.length },
            { id: 'feed', label: t('friends.tabs.feed'), count: null },
            { id: 'discover', label: t('friends.tabs.discover'), count: null }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
              {tab.count !== null && tab.count > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Friends Tab */}
              {activeTab === 'friends' && (
                <div className="space-y-3">
                  {friends.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-lg font-medium text-gray-900">{t('friends.empty.noFriends')}</p>
                      <p className="text-sm text-gray-500">{t('friends.empty.startConnecting')}</p>
                      <button
                        onClick={() => setActiveTab('discover')}
                        className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-full font-medium hover:bg-purple-700 transition-colors"
                      >
                        {t('friends.empty.discoverPeople')}
                      </button>
                    </div>
                  ) : (
                    friends.map(friend => (
                      <div
                        key={friend.id}
                        className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => setViewingUserId(friend.id)}
                      >
                        <img
                          src={friend.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.name)}`}
                          alt={friend.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{friend.name}</h3>
                          <p className="text-sm text-gray-500">{friend.city || t('friends.labels.locationUnknown')}</p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFriend(friend.id);
                          }}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        >
                          <UserX className="w-5 h-5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Requests Tab */}
              {activeTab === 'requests' && (
                <div className="space-y-6">
                  {pendingRequests.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">{t('friends.requests.pending')}</h3>
                      <div className="space-y-3">
                        {pendingRequests.map(request => (
                          <div
                            key={request.id}
                            className="flex items-center gap-4 p-4 bg-purple-50 rounded-2xl"
                          >
                            <img
                              src={request.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(request.userName)}`}
                              alt={request.userName}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900">{request.userName}</h3>
                              <p className="text-sm text-gray-500">
                                {formatDistanceToNow(request.createdAt, { addSuffix: true })}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAcceptRequest(request.id)}
                                className="px-4 py-2 bg-purple-600 text-white rounded-full text-sm font-medium hover:bg-purple-700 transition-colors"
                              >
                                {t('friends.requests.accept')}
                              </button>
                              <button
                                onClick={() => handleRejectRequest(request.id)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-300 transition-colors"
                              >
                                {t('friends.requests.decline')}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {sentRequests.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">{t('friends.requests.sent')}</h3>
                      <div className="space-y-3">
                        {sentRequests.map(request => (
                          <div
                            key={request.id}
                            className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl"
                          >
                            <img
                              src={request.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(request.userName)}`}
                              alt={request.userName}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900">{request.userName}</h3>
                              <p className="text-sm text-gray-500">{t('friends.requests.statusPending')}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {pendingRequests.length === 0 && sentRequests.length === 0 && (
                    <div className="text-center py-12">
                      <UserPlus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-lg font-medium text-gray-900">{t('friends.empty.noRequests')}</p>
                      <p className="text-sm text-gray-500">{t('friends.empty.allCaughtUp')}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Activity Feed Tab */}
              {activeTab === 'feed' && (
                <div className="space-y-3">
                  {activityFeed.length === 0 ? (
                    <div className="text-center py-12">
                      <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-lg font-medium text-gray-900">{t('friends.empty.noActivity')}</p>
                      <p className="text-sm text-gray-500">{t('friends.empty.activityHint')}</p>
                    </div>
                  ) : (
                    activityFeed.map(activity => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"
                      >
                        <img
                          src={activity.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(activity.userName)}`}
                          alt={activity.userName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {getActivityIcon(activity.type)}
                            <span className="font-semibold text-gray-900">{activity.userName}</span>
                            {activity.points && (
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                                +{activity.points} pts
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-700">{activity.title}</p>
                          {activity.description && (
                            <p className="text-xs text-gray-500 mt-1">{activity.description}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-2">
                            {formatDistanceToNow(activity.createdAt, { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Discover Tab */}
              {activeTab === 'discover' && (
                <div className="space-y-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t('friends.search.placeholder')}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    />
                  </div>

                  {/* Suggested Users */}
                  <div className="space-y-3">
                    {suggestedUsers
                      .filter(user => 
                        searchQuery === '' ||
                        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map(user => (
                        <div
                          key={user.id}
                          className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors cursor-pointer"
                          onClick={() => setViewingUserId(user.id)}
                        >
                          <img
                            src={user.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`}
                            alt={user.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{user.name}</h3>
                            <p className="text-sm text-gray-500">{user.city || t('friends.labels.locationUnknown')}</p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSendRequest(user.id);
                            }}
                            className="px-4 py-2 bg-purple-600 text-white rounded-full text-sm font-medium hover:bg-purple-700 transition-colors flex items-center gap-2"
                          >
                            <UserPlus className="w-4 h-4" />
                            {t('friends.actions.addFriend')}
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* User Profile View Modal */}
      {viewingUserId && (
        <UserProfileView
          isOpen={!!viewingUserId}
          onClose={() => setViewingUserId(null)}
          userId={viewingUserId}
          currentUserId={currentUser.id}
        />
      )}
    </div>
  );
};
