import React, { useState, useEffect } from 'react';
import { Trophy, Medal, TrendingUp, Users, Target, Zap, MapPin, Award } from 'lucide-react';
import { getLeaderboard, LeaderboardEntry, LeaderboardPeriod, LeaderboardMetric } from '../../services/leaderboardService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/AuthContext';

interface LeaderboardViewProps {
  userId: string;
}

export default function LeaderboardView({ userId }: LeaderboardViewProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<LeaderboardPeriod>('weekly');
  const [metric, setMetric] = useState<LeaderboardMetric>('points');
  const [viewType, setViewType] = useState<'global' | 'nearby'>('global');
  const [userCity, setUserCity] = useState<string>('');

  useEffect(() => {
    loadUserCity();
  }, [userId]);

  useEffect(() => {
    loadLeaderboard();
  }, [period, metric, viewType, userCity]);

  const loadUserCity = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        setUserCity(userDoc.data().city || '');
      }
    } catch (error) {
      console.error('Error loading user city:', error);
    }
  };

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const cityFilter = viewType === 'nearby' ? userCity : undefined;
      const leaderboardData = await getLeaderboard(period, metric, 100, cityFilter);
      setEntries(leaderboardData);

      // Find current user's rank
      const currentUserEntry = leaderboardData.find(entry => entry.userId === userId);
      setUserRank(currentUserEntry || null);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  const getMetricIcon = (metricType: LeaderboardMetric) => {
    switch (metricType) {
      case 'points':
        return <Trophy className="w-5 h-5" />;
      case 'missions':
        return <Target className="w-5 h-5" />;
      case 'level':
        return <TrendingUp className="w-5 h-5" />;
      default:
        return <Trophy className="w-5 h-5" />;
    }
  };

  const getMetricValue = (entry: LeaderboardEntry) => {
    switch (metric) {
      case 'points':
        return entry.points.toLocaleString();
      case 'missions':
        return entry.missionsCompleted.toLocaleString();
      case 'level':
        return `Level ${entry.level}`;
      default:
        return entry.points.toLocaleString();
    }
  };

  const getMetricLabel = (metricType: LeaderboardMetric) => {
    switch (metricType) {
      case 'points':
        return 'Points';
      case 'missions':
        return 'Missions';
      case 'level':
        return 'Level';
      default:
        return 'Points';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Trophy className="w-8 h-8" />
            <h1 className="text-2xl font-bold">Leaderboard</h1>
          </div>

          {/* Period Selector */}
          <div className="flex gap-2 mb-4 overflow-x-auto">
            {(['weekly', 'monthly', 'all-time'] as LeaderboardPeriod[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                  period === p
                    ? 'bg-white text-blue-600'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {p === 'all-time' ? 'All Time' : p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>

          {/* Metric Selector */}
          <div className="flex gap-2 overflow-x-auto">
            {(['points', 'missions', 'level'] as LeaderboardMetric[]).map((m) => (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                  metric === m
                    ? 'bg-white text-blue-600'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {getMetricIcon(m)}
                <span>{getMetricLabel(m)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-4">
        {/* View Type Toggle */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setViewType('global')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                viewType === 'global'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Users className="w-4 h-4" />
              Global
            </button>
            <button
              onClick={() => setViewType('nearby')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                viewType === 'nearby'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              disabled={!userCity}
            >
              <MapPin className="w-4 h-4" />
              Nearby
            </button>
          </div>
        </div>

        {/* User Rank Card */}
        {userRank && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl shadow-lg p-4 mb-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  {userRank.avatarUrl ? (
                    <img
                      src={userRank.avatarUrl}
                      alt={userRank.userName}
                      className="w-16 h-16 rounded-full border-4 border-white"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-white/20 border-4 border-white flex items-center justify-center">
                      <span className="text-2xl font-bold">
                        {userRank.userName?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  {userRank.badge && (
                    <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-yellow-900 text-xs px-2 py-0.5 rounded-full font-bold">
                      {userRank.badge}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-sm opacity-90">Your Rank</div>
                  <div className="text-2xl font-bold flex items-center gap-2">
                    {getMedalEmoji(userRank.rank)}
                    #{userRank.rank}
                  </div>
                  <div className="text-sm opacity-75">{userRank.city || 'Unknown City'}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm opacity-90">{getMetricLabel(metric)}</div>
                <div className="text-3xl font-bold">{getMetricValue(userRank)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard List */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading leaderboard...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="p-8 text-center">
              <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No rankings available yet</p>
              <p className="text-sm text-gray-400 mt-2">
                Complete missions to appear on the leaderboard!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {entries.map((entry, index) => {
                const isCurrentUser = entry.userId === userId;
                const medal = getMedalEmoji(entry.rank);

                return (
                  <div
                    key={entry.userId}
                    className={`p-4 transition-colors ${
                      isCurrentUser ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Rank */}
                      <div className="w-12 text-center">
                        {medal ? (
                          <span className="text-3xl">{medal}</span>
                        ) : (
                          <span className="text-xl font-bold text-gray-400">
                            {entry.rank}
                          </span>
                        )}
                      </div>

                      {/* Avatar */}
                      <div className="relative">
                        {entry.avatarUrl ? (
                          <img
                            src={entry.avatarUrl}
                            alt={entry.userName}
                            className="w-12 h-12 rounded-full"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                            <span className="text-white text-lg font-bold">
                              {entry.userName?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        {entry.badge && (
                          <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-yellow-900 text-xs px-1.5 py-0.5 rounded-full font-bold">
                            {entry.badge}
                          </div>
                        )}
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 truncate">
                          {entry.userName}
                          {isCurrentUser && (
                            <span className="ml-2 text-xs text-blue-600 font-normal">
                              (You)
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          {entry.city && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {entry.city}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            Level {entry.level}
                          </span>
                        </div>
                      </div>

                      {/* Score */}
                      <div className="text-right">
                        <div className="text-xl font-bold text-gray-900">
                          {getMetricValue(entry)}
                        </div>
                        {metric === 'points' && (
                          <div className="text-xs text-gray-500">
                            {entry.missionsCompleted} missions
                          </div>
                        )}
                        {metric === 'missions' && (
                          <div className="text-xs text-gray-500">
                            {entry.points.toLocaleString()} pts
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Stats Footer */}
        {!loading && entries.length > 0 && (
          <div className="mt-6 bg-white rounded-xl shadow-md p-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {entries.length}
                </div>
                <div className="text-sm text-gray-500">Total Players</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {entries[0] ? getMetricValue(entries[0]) : '-'}
                </div>
                <div className="text-sm text-gray-500">Top Score</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {userRank ? `#${userRank.rank}` : '-'}
                </div>
                <div className="text-sm text-gray-500">Your Rank</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
