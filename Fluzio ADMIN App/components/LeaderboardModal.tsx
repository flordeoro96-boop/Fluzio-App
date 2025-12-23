/**
 * LeaderboardModal Component
 * 
 * Shows leaderboards for friends, city, and global rankings
 */

import React, { useState, useEffect } from 'react';
import { X, Trophy, Users, MapPin, Globe, Medal, Award, Zap, Crown, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  LeaderboardEntry,
  getGlobalLeaderboard,
  getCityLeaderboard,
  getFriendsLeaderboard
} from '../services/gamificationService';
import { useAuth } from '../services/AuthContext';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ isOpen, onClose }) => {
  const { userProfile } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'GLOBAL' | 'CITY' | 'FRIENDS'>('CITY');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && userProfile) {
      loadLeaderboard();
    }
  }, [isOpen, userProfile, activeTab]);

  const loadLeaderboard = async () => {
    if (!userProfile) return;
    
    setLoading(true);
    try {
      let data: LeaderboardEntry[] = [];
      
      switch (activeTab) {
        case 'GLOBAL':
          data = await getGlobalLeaderboard(100);
          break;
        case 'CITY':
          if (userProfile.city) {
            data = await getCityLeaderboard(userProfile.city, 100);
          }
          break;
        case 'FRIENDS':
          data = await getFriendsLeaderboard(userProfile.id);
          break;
      }
      
      setLeaderboard(data);
      
      // Find user's rank
      const userEntry = data.find(entry => entry.userId === userProfile.id);
      setUserRank(userEntry?.rank || null);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#FFB86C] to-[#00E5FF] text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{t('leaderboard.title')}</h2>
                <p className="text-sm text-white/80">
                  {userRank ? t('leaderboard.youRank', { rank: userRank }) : t('leaderboard.compete')}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('CITY')}
              className={`flex-1 py-2 px-3 rounded-lg font-semibold transition-all text-sm ${
                activeTab === 'CITY'
                  ? 'bg-white text-[#00E5FF]'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <div className="flex items-center justify-center gap-1">
                <MapPin className="w-4 h-4" />
                {userProfile?.city || t('leaderboard.city')}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('GLOBAL')}
              className={`flex-1 py-2 px-3 rounded-lg font-semibold transition-all text-sm ${
                activeTab === 'GLOBAL'
                  ? 'bg-white text-[#6C4BFF]'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <div className="flex items-center justify-center gap-1">
                <Globe className="w-4 h-4" />
                {t('leaderboard.tabs.global')}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('FRIENDS')}
              className={`flex-1 py-2 px-3 rounded-lg font-semibold transition-all text-sm ${
                activeTab === 'FRIENDS'
                  ? 'bg-white text-[#00E5FF]'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <div className="flex items-center justify-center gap-1">
                <Users className="w-4 h-4" />
                {t('leaderboard.tabs.friends')}
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-220px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E5FF]"></div>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-12 px-6">
              <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">{t('leaderboard.empty.title')}</p>
              <p className="text-gray-400 text-sm mt-2">
                {activeTab === 'FRIENDS' 
                  ? t('leaderboard.empty.addFriends') 
                  : t('leaderboard.empty.beFirst')}
              </p>
            </div>
          ) : (
            <>
              {/* Top 3 Podium */}
              {leaderboard.length >= 3 && (
                <div className="bg-gradient-to-b from-yellow-50 to-white p-6 border-b-2 border-yellow-100">
                  <div className="flex items-end justify-center gap-4 max-w-md mx-auto">
                    {/* 2nd Place */}
                    <div className="flex-1 text-center">
                      <LeaderCard 
                        entry={leaderboard[1]} 
                        isPodium 
                        isCurrentUser={leaderboard[1].userId === userProfile?.id}
                      />
                      <div className="mt-3 bg-gradient-to-r from-gray-300 to-gray-400 rounded-t-lg h-20 flex items-center justify-center">
                        <Medal className="w-8 h-8 text-white" />
                      </div>
                    </div>

                    {/* 1st Place */}
                    <div className="flex-1 text-center">
                      <div className="mb-2">
                        <Crown className="w-8 h-8 text-yellow-500 mx-auto animate-bounce" />
                      </div>
                      <LeaderCard 
                        entry={leaderboard[0]} 
                        isPodium 
                        isCurrentUser={leaderboard[0].userId === userProfile?.id}
                      />
                      <div className="mt-3 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-t-lg h-28 flex items-center justify-center">
                        <Trophy className="w-10 h-10 text-white" />
                      </div>
                    </div>

                    {/* 3rd Place */}
                    <div className="flex-1 text-center">
                      <LeaderCard 
                        entry={leaderboard[2]} 
                        isPodium 
                        isCurrentUser={leaderboard[2].userId === userProfile?.id}
                      />
                      <div className="mt-3 bg-gradient-to-r from-orange-300 to-orange-400 rounded-t-lg h-16 flex items-center justify-center">
                        <Award className="w-7 h-7 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Rest of Rankings */}
              <div className="p-4 space-y-2">
                {leaderboard.slice(3).map((entry) => (
                  <LeaderboardRow
                    key={entry.userId}
                    entry={entry}
                    isCurrentUser={entry.userId === userProfile?.id}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

interface LeaderCardProps {
  entry: LeaderboardEntry;
  isPodium?: boolean;
  isCurrentUser: boolean;
}

const LeaderCard: React.FC<LeaderCardProps> = ({ entry, isPodium, isCurrentUser }) => {
  const { t } = useTranslation();
  return (
    <div className={`${isPodium ? 'mb-2' : ''}`}>
      <div className={`w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center font-bold text-white text-xl ${
        isCurrentUser 
          ? 'bg-gradient-to-br from-[#00E5FF] to-[#6C4BFF] ring-4 ring-pink-200'
          : 'bg-gradient-to-br from-gray-400 to-gray-500'
      }`}>
        {entry.userName.charAt(0).toUpperCase()}
      </div>
      <div className="text-sm font-bold text-[#1E0E62] truncate px-2">
        {isCurrentUser ? t('leaderboard.you') : entry.userName}
      </div>
      <div className="text-xs text-gray-600 flex items-center justify-center gap-1 mt-1">
        <Zap className="w-3 h-3 text-yellow-500" />
        {entry.totalXP.toLocaleString()} {t('leaderboard.xp')}
      </div>
    </div>
  );
};

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
}

const LeaderboardRow: React.FC<LeaderboardRowProps> = ({ entry, isCurrentUser }) => {
  const { t } = useTranslation();
  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-500';
    if (rank === 2) return 'text-gray-400';
    if (rank === 3) return 'text-orange-400';
    return 'text-gray-600';
  };

  const getRankBg = (rank: number) => {
    if (rank <= 10) return 'bg-gradient-to-r from-yellow-50 to-orange-50';
    return 'bg-white';
  };

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
      isCurrentUser 
        ? 'border-pink-300 bg-gradient-to-r from-pink-50 to-purple-50 shadow-md' 
        : `border-gray-200 ${getRankBg(entry.rank)} hover:border-gray-300`
    }`}>
      {/* Rank */}
      <div className={`w-8 text-center font-bold text-lg ${getRankColor(entry.rank)}`}>
        #{entry.rank}
      </div>

      {/* Avatar */}
      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${
        isCurrentUser 
          ? 'bg-gradient-to-br from-[#00E5FF] to-[#6C4BFF]'
          : 'bg-gradient-to-br from-gray-400 to-gray-500'
      }`}>
        {entry.userName.charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-[#1E0E62] truncate">
          {isCurrentUser ? `${entry.userName} (${t('leaderboard.you')})` : entry.userName}
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-600">
          <span className="flex items-center gap-1">
            <Trophy className="w-3 h-3" />
            {t('leaderboard.level')} {entry.level}
          </span>
          {entry.badges > 0 && (
            <span className="flex items-center gap-1">
              <Award className="w-3 h-3" />
              {t('leaderboard.badges', { count: entry.badges })}
            </span>
          )}
        </div>
      </div>

      {/* XP */}
      <div className="text-right">
        <div className="font-bold text-[#00E5FF] flex items-center gap-1">
          <Zap className="w-4 h-4 text-yellow-500" />
          {entry.totalXP.toLocaleString()}
        </div>
        {entry.weeklyXP > 0 && (
          <div className="text-xs text-green-600 flex items-center gap-1 justify-end">
            <TrendingUp className="w-3 h-3" />
            {t('leaderboard.thisWeekXP', { xp: entry.weeklyXP })}
          </div>
        )}
      </div>
    </div>
  );
};
