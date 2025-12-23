import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Crown, Users, TrendingUp, Target, Zap, MapPin, Loader2, Star } from 'lucide-react';
import { getLeaderboard, getFriendLeaderboard, getUserRank, type LeaderboardEntry, type LeaderboardPeriod, type LeaderboardMetric } from '../services/leaderboardService';
import { getFriends } from '../services/socialService';
import { useAuth } from '../services/AuthContext';

export const Leaderboard: React.FC = () => {
  const { userProfile } = useAuth();
  const [leaderboardType, setLeaderboardType] = useState<'global' | 'friends' | 'local'>('global');
  const [period, setPeriod] = useState<LeaderboardPeriod>('all-time');
  const [metric, setMetric] = useState<LeaderboardMetric>('points');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<{ rank: number; total: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, [leaderboardType, period, metric, userProfile?.id]);

  const loadLeaderboard = async () => {
    if (!userProfile?.id) return;

    setLoading(true);
    try {
      let data: LeaderboardEntry[] = [];

      if (leaderboardType === 'friends') {
        const friendIds = await getFriends(userProfile.id);
        data = await getFriendLeaderboard(userProfile.id, friendIds, metric);
      } else if (leaderboardType === 'local') {
        data = await getLeaderboard(period, metric, 50, userProfile.city);
      } else {
        data = await getLeaderboard(period, metric, 50);
      }

      setEntries(data);

      // Get user's rank
      const rank = await getUserRank(
        userProfile.id, 
        metric, 
        leaderboardType === 'local' ? userProfile.city : undefined
      );
      setUserRank(rank);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return <span className="text-lg font-bold text-gray-400">#{rank}</span>;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'from-yellow-100 to-amber-100 border-yellow-300';
    if (rank === 2) return 'from-gray-100 to-slate-100 border-gray-300';
    if (rank === 3) return 'from-amber-100 to-orange-100 border-amber-300';
    return 'from-white to-gray-50 border-gray-200';
  };

  const getMetricIcon = (m: LeaderboardMetric) => {
    if (m === 'points') return <Star className="w-4 h-4" />;
    if (m === 'missions') return <Target className="w-4 h-4" />;
    if (m === 'level') return <TrendingUp className="w-4 h-4" />;
    return null;
  };

  const getMetricValue = (entry: LeaderboardEntry, m: LeaderboardMetric) => {
    if (m === 'points') return entry.points.toLocaleString();
    if (m === 'missions') return entry.missionsCompleted;
    if (m === 'level') return `Level ${entry.level}`;
    return '';
  };

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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">Leaderboard</h2>
              <p className="text-sm opacity-90">Compete with the best</p>
            </div>
          </div>
          
          {userRank && (
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 text-center">
              <div className="text-xs opacity-90">Your Rank</div>
              <div className="text-2xl font-bold">#{userRank.rank}</div>
              <div className="text-xs opacity-90">of {userRank.total}</div>
            </div>
          )}
        </div>

        {/* Leaderboard Type Selector */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setLeaderboardType('global')}
            className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
              leaderboardType === 'global'
                ? 'bg-white text-[#6C4BFF]'
                : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            <Trophy className="w-4 h-4 inline mr-2" />
            Global
          </button>
          <button
            onClick={() => setLeaderboardType('friends')}
            className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
              leaderboardType === 'friends'
                ? 'bg-white text-[#6C4BFF]'
                : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Friends
          </button>
          <button
            onClick={() => setLeaderboardType('local')}
            className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
              leaderboardType === 'local'
                ? 'bg-white text-[#6C4BFF]'
                : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            <MapPin className="w-4 h-4 inline mr-2" />
            Local
          </button>
        </div>

        {/* Metric Selector */}
        <div className="flex gap-2">
          <button
            onClick={() => setMetric('points')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
              metric === 'points'
                ? 'bg-white text-[#6C4BFF]'
                : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            <Star className="w-3 h-3 inline mr-1" />
            Points
          </button>
          <button
            onClick={() => setMetric('missions')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
              metric === 'missions'
                ? 'bg-white text-[#6C4BFF]'
                : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            <Target className="w-3 h-3 inline mr-1" />
            Missions
          </button>
          <button
            onClick={() => setMetric('level')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
              metric === 'level'
                ? 'bg-white text-[#6C4BFF]'
                : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            <TrendingUp className="w-3 h-3 inline mr-1" />
            Level
          </button>
        </div>
      </div>

      {/* Top 3 Podium */}
      {entries.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 px-4">
          {/* Second Place */}
          <div className="flex flex-col items-center pt-12">
            <div className="relative">
              <img
                src={entries[1].avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(entries[1].userName)}&background=C0C0C0`}
                alt={entries[1].userName}
                className="w-20 h-20 rounded-full border-4 border-gray-400 shadow-lg"
              />
              <div className="absolute -top-3 -right-3 bg-gray-400 rounded-full p-2">
                <Medal className="w-5 h-5 text-white" />
              </div>
            </div>
            <h3 className="font-bold text-gray-900 mt-3 text-center">{entries[1].userName}</h3>
            <div className="flex items-center gap-1 text-gray-600 mt-1">
              {getMetricIcon(metric)}
              <span className="text-sm font-semibold">{getMetricValue(entries[1], metric)}</span>
            </div>
            <div className="w-full bg-gray-400/20 rounded-t-xl h-20 mt-4 flex items-center justify-center">
              <span className="text-3xl font-bold text-gray-400">2</span>
            </div>
          </div>

          {/* First Place */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <img
                src={entries[0].avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(entries[0].userName)}&background=FFD700`}
                alt={entries[0].userName}
                className="w-24 h-24 rounded-full border-4 border-yellow-500 shadow-lg"
              />
              <div className="absolute -top-3 -right-3 bg-yellow-500 rounded-full p-2">
                <Crown className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="font-bold text-[#1E0E62] mt-3 text-center">{entries[0].userName}</h3>
            <div className="flex items-center gap-1 text-[#6C4BFF] mt-1">
              {getMetricIcon(metric)}
              <span className="text-sm font-bold">{getMetricValue(entries[0], metric)}</span>
            </div>
            <div className="w-full bg-gradient-to-b from-yellow-400 to-amber-500 rounded-t-xl h-32 mt-4 flex items-center justify-center shadow-lg">
              <span className="text-4xl font-bold text-white">1</span>
            </div>
          </div>

          {/* Third Place */}
          <div className="flex flex-col items-center pt-12">
            <div className="relative">
              <img
                src={entries[2].avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(entries[2].userName)}&background=CD7F32`}
                alt={entries[2].userName}
                className="w-20 h-20 rounded-full border-4 border-amber-600 shadow-lg"
              />
              <div className="absolute -top-3 -right-3 bg-amber-600 rounded-full p-2">
                <Medal className="w-5 h-5 text-white" />
              </div>
            </div>
            <h3 className="font-bold text-gray-900 mt-3 text-center">{entries[2].userName}</h3>
            <div className="flex items-center gap-1 text-amber-600 mt-1">
              {getMetricIcon(metric)}
              <span className="text-sm font-semibold">{getMetricValue(entries[2], metric)}</span>
            </div>
            <div className="w-full bg-amber-600/20 rounded-t-xl h-16 mt-4 flex items-center justify-center">
              <span className="text-3xl font-bold text-amber-600">3</span>
            </div>
          </div>
        </div>
      )}

      {/* Rest of Leaderboard */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-[#1E0E62] mb-4">
          {entries.length > 3 ? 'Full Rankings' : 'Rankings'}
        </h3>

        {entries.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900">No rankings yet</p>
            <p className="text-sm text-gray-500 mt-2">Start completing missions to climb the leaderboard!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.slice(entries.length >= 3 ? 3 : 0).map((entry) => (
              <div
                key={entry.userId}
                className={`flex items-center gap-4 p-4 bg-gradient-to-r ${getRankColor(entry.rank)} border rounded-xl hover:shadow-md transition-all ${
                  entry.userId === userProfile?.id ? 'ring-2 ring-[#00E5FF]' : ''
                }`}
              >
                {/* Rank */}
                <div className="w-12 flex items-center justify-center">
                  {getRankIcon(entry.rank)}
                </div>

                {/* Avatar */}
                <img
                  src={entry.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(entry.userName)}&background=random`}
                  alt={entry.userName}
                  className="w-12 h-12 rounded-full border-2 border-white shadow-md"
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[#1E0E62] truncate">
                    {entry.userName}
                    {entry.userId === userProfile?.id && (
                      <span className="ml-2 text-xs font-normal text-[#00E5FF]">(You)</span>
                    )}
                  </h3>
                  {entry.city && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                      <MapPin className="w-3 h-3" />
                      <span>{entry.city}</span>
                    </div>
                  )}
                </div>

                {/* Metric Value */}
                <div className="flex items-center gap-2 bg-white/50 px-4 py-2 rounded-lg">
                  {getMetricIcon(metric)}
                  <span className="font-bold text-[#6C4BFF]">
                    {getMetricValue(entry, metric)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
