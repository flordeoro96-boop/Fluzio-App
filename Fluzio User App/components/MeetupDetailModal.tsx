import React, { useState, useEffect } from 'react';
import { X, MapPin, Clock, Users, Award, Sparkles, Star, Calendar, Navigation, CheckCircle, XCircle, TrendingUp, Lock, MessageCircle } from 'lucide-react';
import { Meetup, User, MeetupParticipant } from '../types';
import { joinMeetup, leaveMeetup, checkInToMeetup } from '../services/meetupService';
import { getMeetupChat, createMeetupChat, MeetupChat } from '../services/meetupChatService';
import { MeetupChatModal } from './MeetupChatModal';
import { useToast } from '../hooks/useToast';
import { calculateDistance } from '../hooks/useLocation';
import { useTranslation } from 'react-i18next';

interface MeetupDetailModalProps {
  meetup: Meetup;
  user: any; // Accept either User or UserProfile
  userLocation?: { latitude: number; longitude: number };
  onClose: () => void;
  onJoinSuccess?: () => void;
}

export function MeetupDetailModal({ meetup, user, userLocation, onClose, onJoinSuccess }: MeetupDetailModalProps) {
  const { showToast } = useToast();
  const { t } = useTranslation();
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [chat, setChat] = useState<MeetupChat | null>(null);
  const [showChat, setShowChat] = useState(false);

  // Load chat if it exists
  const loadChat = async () => {
    const existingChat = await getMeetupChat(meetup.id);
    if (existingChat) {
      setChat(existingChat);
    }
  };

  useEffect(() => {
    loadChat();
  }, [meetup.id]);

  const isParticipant = meetup.participants.some(p => p.userId === user.id);
  const currentParticipant = meetup.participants.find(p => p.userId === user.id);
  const seatsRemaining = meetup.capacity - meetup.participants.length;
  const isFull = seatsRemaining === 0;
  const canJoin = !isParticipant && !isFull && user.level >= meetup.levelRequired;
  const isLive = meetup.status === 'live';
  const isUpcoming = meetup.status === 'upcoming';

  // Calculate distance if location available
  const distance = userLocation && meetup.location 
    ? calculateDistance(
        { latitude: userLocation.latitude, longitude: userLocation.longitude },
        { latitude: meetup.location.latitude, longitude: meetup.location.longitude }
      ) / 1000 // Convert to km
    : null;

  const handleJoin = async () => {
    setIsJoining(true);
    try {
      const result = await joinMeetup(meetup.id, user);
      if (result.success) {
        showToast(t('meetups.joinSuccess'), 'success');
        
        // Create chat if this is the 2nd+ participant and chat doesn't exist
        if (meetup.participants.length >= 1 && !chat) {
          const participants = [
            ...meetup.participants.map(p => ({
              userId: p.userId,
              userName: p.userName,
              userAvatar: p.userAvatar
            })),
            {
              userId: user.id,
              userName: user.name,
              userAvatar: user.avatarUrl
            }
          ];
          
          const chatResult = await createMeetupChat(meetup.id, participants);
          if (chatResult.success) {
            await loadChat();
          }
        }
        
        onJoinSuccess?.();
        onClose();
      } else {
        showToast(result.error || t('meetups.joinFailed'), 'error');
      }
    } catch (error) {
      showToast(t('errors.unknownError'), 'error');
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeave = async () => {
    setIsLeaving(true);
    try {
      const result = await leaveMeetup(meetup.id, user.id);
      if (result.success) {
        showToast(t('meetups.leaveSuccess'), 'info');
        onJoinSuccess?.();
        onClose();
      } else {
        showToast(result.error || t('meetups.leaveFailed'), 'error');
      }
    } catch (error) {
      showToast(t('errors.unknownError'), 'error');
    } finally {
      setIsLeaving(false);
    }
  };

  const handleCheckIn = async () => {
    if (!userLocation) {
      showToast(t('meetups.locationRequired'), 'error');
      return;
    }

    setIsCheckingIn(true);
    try {
      const result = await checkInToMeetup(meetup.id, user.id, userLocation);
      if (result.success) {
        showToast(t('meetups.checkInSuccess'), 'success');
        onJoinSuccess?.();
      } else {
        showToast(result.error || t('meetups.checkInFailed'), 'error');
      }
    } catch (error) {
      showToast(t('errors.unknownError'), 'error');
    } finally {
      setIsCheckingIn(false);
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', { 
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDuration = () => {
    const start = new Date(meetup.startTime);
    const end = new Date(meetup.endTime);
    const durationMs = end.getTime() - start.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}m`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header with Cover Image */}
        <div className="relative h-48 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500">
          <img 
            src={meetup.businessLogo} 
            alt={meetup.businessName}
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transition-all shadow-lg"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>

          {/* Status Badge */}
          <div className="absolute top-4 left-4">
            {isLive && (
              <span className="px-3 py-1.5 bg-red-500 text-white text-sm font-bold rounded-full flex items-center gap-1 animate-pulse">
                <div className="w-2 h-2 bg-white rounded-full" />
                {t('meetups.liveNow')}
              </span>
            )}
            {isUpcoming && (
              <span className="px-3 py-1.5 bg-blue-500 text-white text-sm font-bold rounded-full">
                {t('meetups.upcoming')}
              </span>
            )}
          </div>

          {/* Business Info Overlay */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center gap-3">
              <img 
                src={meetup.businessLogo} 
                alt={meetup.businessName}
                className="w-16 h-16 rounded-xl border-4 border-white shadow-lg object-cover bg-white"
              />
              <div className="flex-1">
                <h2 className="text-white font-bold text-xl drop-shadow-lg">{meetup.title}</h2>
                <div className="flex items-center gap-2">
                  <p className="text-white/90 text-sm drop-shadow">{meetup.businessName}</p>
                  {meetup.businessIsPartner && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/90 text-purple-700 text-xs font-medium rounded-full">
                      <Star className="w-3 h-3 fill-current" />
                      {t('meetups.partner')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Description */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">{t('meetups.aboutThisMeetup')}</h3>
            <p className="text-gray-700 leading-relaxed">{meetup.description}</p>
          </div>

          {/* Key Details Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-purple-600 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-medium uppercase">{t('meetups.when')}</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">{formatTime(meetup.startTime)}</p>
              <p className="text-xs text-gray-600 mt-1">{t('meetups.duration', { duration: formatDuration() })}</p>
            </div>

            <div className="bg-pink-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-pink-600 mb-1">
                <MapPin className="w-4 h-4" />
                <span className="text-xs font-medium uppercase">{t('meetups.where')}</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">{meetup.location.address}</p>
              <p className="text-xs text-gray-600 mt-1">
                {meetup.location.district}, {meetup.location.city}
                {distance && ` • ${t('meetups.kmAway', { km: distance.toFixed(1) })}`}
              </p>
            </div>

            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-orange-600 mb-1">
                <Users className="w-4 h-4" />
                <span className="text-xs font-medium uppercase">{t('meetups.participantsLabel')}</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {t('meetups.participantsJoined', { count: meetup.participants.length, max: 4 })}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {seatsRemaining === 0 ? t('meetups.meetupFull') : t('meetups.seatsRemaining', { count: seatsRemaining })}
              </p>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-medium uppercase">{t('meetups.interest')}</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">{t('meetups.views', { count: meetup.viewCount })}</p>
              <p className="text-xs text-gray-600 mt-1">{t('meetups.joinRequests', { count: meetup.joinRequestCount })}</p>
            </div>
          </div>

          {/* Level Requirement */}
          {meetup.levelRequired > 1 && (
            <div className={`mb-6 p-3 rounded-lg border ${
              user.level >= meetup.levelRequired
                ? 'bg-green-50 border-green-300'
                : 'bg-red-50 border-red-300'
            }`}>
              <div className="flex items-center gap-2">
                {user.level >= meetup.levelRequired ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <Lock className="w-5 h-5 text-red-600" />
                )}
                <span className={`text-sm font-medium ${
                  user.level >= meetup.levelRequired ? 'text-green-900' : 'text-red-900'
                }`}>
                  {user.level >= meetup.levelRequired
                    ? t('meetups.levelRequirementMet', { level: meetup.levelRequired })
                    : t('meetups.levelRequirementNotMet', { level: meetup.levelRequired, user: user.level })}
                </span>
              </div>
            </div>
          )}

          {/* Rewards & Benefits (Partner Only) */}
          {meetup.businessIsPartner && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-600" />
                {t('meetups.rewardsBenefits')}
              </h3>
              <div className="space-y-2">
                {meetup.rewardTitle && (
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <Award className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">{meetup.rewardTitle}</p>
                      <p className="text-xs text-green-700">{t('meetups.unlockedAfterCheckIn')}</p>
                    </div>
                  </div>
                )}
                {meetup.xpReward > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-900">+{meetup.xpReward} XP</p>
                      <p className="text-xs text-blue-700">{t('meetups.experiencePointsReward')}</p>
                    </div>
                  </div>
                )}
                {meetup.stamp && (
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="text-2xl">🎫</div>
                    <div>
                      <p className="font-medium text-purple-900">{meetup.stamp}</p>
                      <p className="text-xs text-purple-700">{t('meetups.passportStampCollection')}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Participants List */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">{t('meetups.participantsHeader', { count: meetup.participants.length, max: 4 })}</h3>
            <div className="space-y-2">
              {meetup.participants.map((participant) => (
                <ParticipantRow key={participant.userId} participant={participant} />
              ))}
              {/* Empty Seats */}
              {Array.from({ length: seatsRemaining }).map((_, idx) => (
                <div key={`empty-${idx}`} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 border-dashed">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <Users className="w-5 h-5 text-gray-400" />
                  </div>
                  <span className="text-sm text-gray-500 italic">{t('meetups.availableSeat')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Missions (if any) */}
          {meetup.missions && meetup.missions.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">{t('meetups.missionsAvailableHeader')}</h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  {t('meetups.completeMissionsDuring', { count: meetup.missions.length })}
                </p>
              </div>
            </div>
          )}

          {/* Group Chat Info */}
          {isParticipant && chat && (
            <div className="mb-6">
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-300 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-6 h-6 text-purple-600" />
                  <div className="flex-1">
                    <p className="font-semibold text-purple-900">{t('meetups.groupChatActive')}</p>
                    <p className="text-sm text-purple-700">{t('meetups.connectWithParticipants')}</p>
                  </div>
                  <button
                    onClick={() => setShowChat(true)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all font-medium text-sm"
                  >
                    {t('meetups.openChat')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Check-in Status */}
          {isParticipant && currentParticipant && (
            <div className="mb-6">
              {currentParticipant.checkedIn ? (
                <div className="bg-green-50 border border-green-300 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-900">{t('meetups.checkedInLabel')}</span>
                  </div>
                </div>
              ) : isLive ? (
                <div className="bg-orange-50 border border-orange-300 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Navigation className="w-5 h-5 text-orange-600" />
                      <span className="font-semibold text-orange-900">{t('meetups.readyToCheckIn')}</span>
                    </div>
                    <button
                      onClick={handleCheckIn}
                      disabled={isCheckingIn}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all disabled:opacity-50"
                    >
                      {isCheckingIn ? t('meetups.checkingIn') : t('meetups.checkIn')}
                    </button>
                  </div>
                  <p className="text-sm text-orange-700 mt-2">{t('meetups.checkInRequirement')}</p>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-300 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-blue-900">{t('meetups.checkInAvailableWhenStarts')}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          {isParticipant ? (
            <div className="flex gap-3">
              <button
                onClick={handleLeave}
                disabled={isLeaving}
                className="flex-1 py-3 border-2 border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-all font-medium disabled:opacity-50"
              >
                {isLeaving ? t('meetups.leaving') : t('meetups.leaveMeetup')}
              </button>
              {chat && (
                <button
                  onClick={() => setShowChat(true)}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium shadow-md"
                >
                  {t('meetups.openGroupChat')}
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={handleJoin}
              disabled={!canJoin || isJoining}
              className={`w-full py-3 rounded-lg font-medium transition-all shadow-md ${
                canJoin
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isJoining
                ? t('meetups.joining')
                : isFull
                  ? t('meetups.meetupFull')
                  : user.level < meetup.levelRequired
                    ? t('meetups.levelRequiredBtn', { level: meetup.levelRequired })
                    : t('meetups.joinMeetup')}
            </button>
          )}
        </div>
      </div>

      {/* Chat Modal */}
      {showChat && chat && (
        <MeetupChatModal
          chat={chat}
          onClose={() => setShowChat(false)}
        />
      )}
    </div>
  );
}

interface ParticipantRowProps {
  participant: MeetupParticipant;
}

function ParticipantRow({ participant }: ParticipantRowProps) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
        {participant.userAvatar ? (
          <img src={participant.userAvatar} alt={participant.userName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-400 to-pink-400 text-white font-bold">
            {participant.userName.charAt(0)}
          </div>
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">{participant.userName}</span>
          {participant.checkedIn && (
            <CheckCircle className="w-4 h-4 text-green-600" />
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <span>{t('meetups.levelTag', { level: participant.userLevel })}</span>
          {participant.missionsCompleted.length > 0 && (
            <>
              <span>•</span>
              <span>{t('meetups.missionsCompleted', { count: participant.missionsCompleted.length })}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
