import React, { useState, useEffect } from 'react';
import { X, UserPlus, UserCheck, MessageCircle, MapPin, Award, Target, Calendar, Gift, Users, Share2, Flag, Sparkles, Heart, Trophy } from 'lucide-react';
import * as socialService from '../services/socialService';
import * as userService from '../services/userService';
import { formatDistanceToNow } from 'date-fns';

interface UserProfileViewProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  currentUserId: string;
  onMessage?: (userId: string) => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  isOpen,
  onClose,
  userId,
  currentUserId,
  onMessage
}) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFriend, setIsFriend] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      loadUserProfile();
    }
  }, [isOpen, userId]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      
      // Load user details
      const userDetails = await userService.getUserById(userId);
      if (!userDetails) {
        console.error('User not found:', userId);
        onClose();
        return;
      }
      setUser(userDetails);

      // Check friendship status
      const friends = await socialService.getFriends(currentUserId);
      setIsFriend(friends.includes(userId));

      // Check pending request
      const pendingRequests = await socialService.getPendingRequests(userId);
      const sentRequests = await socialService.getSentRequests(currentUserId);
      const hasPending = sentRequests.some(req => req.toUserId === userId) || 
                        pendingRequests.some(req => req.fromUserId === currentUserId);
      setHasPendingRequest(hasPending);
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = async () => {
    if (sendingRequest || isFriend || hasPendingRequest) return;

    try {
      setSendingRequest(true);
      const result = await socialService.sendFriendRequest(currentUserId, userId);
      
      if (result.success) {
        setHasPendingRequest(true);
        // Keep the button disabled and showing "Request Sent"
      } else {
        alert(result.error || 'Failed to send friend request');
        setSendingRequest(false);
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      alert('Failed to send friend request');
      setSendingRequest(false);
    }
    // Don't reset sendingRequest on success - keep it true to show "Request Sent"
  };

  const handleMessage = () => {
    if (onMessage) {
      onMessage(userId);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[120] p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-zoom-in-95">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading profile...</p>
          </div>
        ) : user ? (
          <>
            {/* Header with Cover */}
            <div className="relative">
              <div className="h-32 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600"></div>
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition"
              >
                <X className="w-6 h-6 text-white" />
              </button>
              
              {/* Profile Picture */}
              <div className="absolute -bottom-16 left-6">
                <div className="w-32 h-32 rounded-full border-4 border-white bg-white shadow-lg overflow-hidden">
                  {user.photoUrl ? (
                    <img 
                      src={user.photoUrl} 
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                      <span className="text-4xl font-bold text-white">
                        {user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Content */}
            <div className="pt-20 px-6 pb-6">
              {/* Name and Location */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{user.name}</h2>
                {user.city && (
                  <p className="text-gray-600 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {user.city}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mb-6">
                {!isFriend && !hasPendingRequest && !sendingRequest && (
                  <button
                    onClick={handleAddFriend}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg py-3 font-semibold hover:shadow-lg transition flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-5 h-5" />
                    Add Friend
                  </button>
                )}
                
                {(hasPendingRequest || sendingRequest) && !isFriend && (
                  <div className="flex-1 bg-gray-100 text-gray-600 rounded-lg py-3 font-semibold flex items-center justify-center gap-2 cursor-not-allowed">
                    <UserCheck className="w-5 h-5" />
                    Request Sent
                  </div>
                )}

                {isFriend && (
                  <div className="flex-1 bg-green-100 text-green-700 rounded-lg py-3 font-semibold flex items-center justify-center gap-2">
                    <UserCheck className="w-5 h-5" />
                    Friends
                  </div>
                )}

                {onMessage && (
                  <button
                    onClick={handleMessage}
                    className="flex-1 bg-white border-2 border-gray-300 text-gray-700 rounded-lg py-3 font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Message
                  </button>
                )}

                <button
                  className="px-4 bg-white border-2 border-gray-300 text-gray-700 rounded-lg py-3 font-semibold hover:bg-gray-50 transition"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>

              {/* Bio */}
              {user.bio && (
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <p className="text-gray-700 leading-relaxed">{user.bio}</p>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Target className="w-6 h-6 text-purple-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{user.missionsCompleted || 0}</p>
                  <p className="text-xs text-gray-600">Missions</p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Gift className="w-6 h-6 text-pink-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{user.rewardsRedeemed || 0}</p>
                  <p className="text-xs text-gray-600">Rewards</p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{user.meetupsAttended || 0}</p>
                  <p className="text-xs text-gray-600">Events</p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Trophy className="w-6 h-6 text-yellow-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{user.level || 1}</p>
                  <p className="text-xs text-gray-600">Level</p>
                </div>
              </div>

              {/* Badges */}
              {user.badges && user.badges.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Award className="w-5 h-5 text-purple-600" />
                    Badges ({user.badges.length})
                  </h3>
                  <div className="grid grid-cols-5 gap-3">
                    {user.badges.slice(0, 10).map((badge: any, index: number) => (
                      <div
                        key={index}
                        className="aspect-square bg-gradient-to-br from-yellow-100 to-orange-100 rounded-xl flex items-center justify-center border-2 border-yellow-200"
                        title={badge.name || `Badge ${index + 1}`}
                      >
                        <Award className="w-6 h-6 text-yellow-600" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Interests/Vibe Tags */}
              {user.vibeTags && user.vibeTags.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    Interests
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {user.vibeTags.map((tag: string, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Activity */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  Activity
                </h3>
                <div className="space-y-2">
                  {user.recentActivity && user.recentActivity.length > 0 ? (
                    user.recentActivity.slice(0, 5).map((activity: any, index: number) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3 flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Target className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                          <p className="text-xs text-gray-600">
                            {activity.timestamp && formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-600 text-center py-4">No recent activity</p>
                  )}
                </div>
              </div>

              {/* Report Button */}
              <div className="mt-6 pt-6 border-t">
                <button className="text-sm text-gray-500 hover:text-red-600 transition flex items-center gap-1 mx-auto">
                  <Flag className="w-4 h-4" />
                  Report User
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-12 text-center">
            <p className="text-gray-600">User not found</p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
