/**
 * Business Leaderboard View Component
 * Shows business rankings and competition statistics
 */

import React, { useEffect, useState } from 'react';
import { Trophy, TrendingUp, Award, Users, Target, MapPin, Star, Crown, Medal, Loader2, ChevronDown } from 'lucide-react';
import {
  getBusinessLeaderboard,
  getBusinessRank,
  BusinessLeaderboardEntry,
  BusinessLeaderboardMetric,
  BusinessLeaderboardPeriod
} from '../../services/businessLeaderboardService';

interface BusinessLeaderboardViewProps {
  businessId: string;
  businessCity?: string;
}

const BusinessLeaderboardView: React.FC<BusinessLeaderboardViewProps> = ({ businessId, businessCity }) => {
  const [entries, setEntries] = useState<BusinessLeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<BusinessLeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState<BusinessLeaderboardMetric>('engagement');
  const [period, setPeriod] = useState<BusinessLeaderboardPeriod>('all-time');
  const [viewType, setViewType] = useState<'global' | 'local'>('local');

  useEffect(() => {
    loadLeaderboard();
  }, [metric, period, viewType, businessCity]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const city = viewType === 'local' ? businessCity : undefined;
      const data = await getBusinessLeaderboard(metric, period, 50, city);
      setEntries(data);

      // Find current business in leaderboard
      const current = data.find(e => e.businessId === businessId);
      setUserRank(current || null);
    } catch (error) {
      console.error('[BusinessLeaderboardView] Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '';
  };

  const getMetricLabel = (m: BusinessLeaderboardMetric) => {
    switch (m) {
      case 'missions': return 'Missions';
      case 'customers': return 'Customers';
      case 'rating': return 'Rating';
      case 'engagement': return 'Engagement';
      default: return 'Score';
    }
  };

  const getMetricValue = (entry: BusinessLeaderboardEntry) => {
    switch (metric) {
      case 'missions': return entry.activeMissions + entry.completedMissions;
      case 'customers': return entry.totalCustomers;
      case 'rating': return entry.rating.toFixed(1);
      case 'engagement': return entry.score;
      default: return entry.score;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Trophy className="w-8 h-8" />
            <h1 className="text-2xl font-bold">Business Leaderboard</h1>
          </div>

          {/* Period Selector */}
          <div className="flex gap-2 mb-4 overflow-x-auto">
            {(['all-time', 'monthly', 'weekly'] as BusinessLeaderboardPeriod[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                  period === p
                    ? 'bg-white text-purple-600'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {p === 'all-time' ? 'All Time' : p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>

          {/* Metric Selector */}
          <div className="flex gap-2 overflow-x-auto">
            {(['engagement', 'missions', 'customers', 'rating'] as BusinessLeaderboardMetric[]).map((m) => (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                  metric === m
                    ? 'bg-white text-purple-600'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {getMetricLabel(m)}
              </button>
            ))}
          </div>

          {/* View Type Toggle */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setViewType('global')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                viewType === 'global'
                  ? 'bg-white text-purple-600'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <Trophy className="w-4 h-4" />
              Global
            </button>
            <button
              onClick={() => setViewType('local')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                viewType === 'local'
                  ? 'bg-white text-purple-600'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
              disabled={!businessCity}
            >
              <MapPin className="w-4 h-4" />
              {businessCity || 'Local'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-6">
        {/* User Rank Card */}
        {userRank && (
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl shadow-lg p-6 mb-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-3xl">
                  {getRankEmoji(userRank.rank) || '🏆'}
                </div>
                <div>
                  <div className="text-sm opacity-90">Your Rank</div>
                  <div className="text-3xl font-bold flex items-center gap-2">
                    #{userRank.rank}
                  </div>
                  <div className="text-sm opacity-75">{businessCity || 'Global'}</div>
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
              <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Loading rankings...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="p-8 text-center">
              <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No rankings available yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {entries.map((entry, index) => {
                const isCurrentBusiness = entry.businessId === businessId;
                const isPodium = entry.rank <= 3;

                return (
                  <div
                    key={entry.businessId}
                    className={`p-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                      isCurrentBusiness ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      {/* Rank */}
                      <div className="w-12 text-center">
                        {isPodium ? (
                          <span className="text-2xl">{getRankEmoji(entry.rank)}</span>
                        ) : (
                          <span className="text-lg font-bold text-gray-500">#{entry.rank}</span>
                        )}
                      </div>

                      {/* Avatar */}
                      {entry.avatarUrl ? (
                        <img
                          src={entry.avatarUrl}
                          alt={entry.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white font-bold">
                          {entry.name.charAt(0)}
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900 truncate">
                            {isCurrentBusiness ? `${entry.name} (You)` : entry.name}
                          </h3>
                          {entry.subscriptionLevel && entry.subscriptionLevel !== 'STARTER' && (
                            <Crown className="w-4 h-4 text-yellow-500" />
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          {entry.city && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {entry.city}
                            </span>
                          )}
                          {entry.businessType && (
                            <span>{entry.businessType}</span>
                          )}
                        </div>
                      </div>

                      {/* Score */}
                      <div className="text-right">
                        <div className="text-2xl font-bold text-purple-600">
                          {getMetricValue(entry)}
                        </div>
                        <div className="text-xs text-gray-500">{getMetricLabel(metric)}</div>
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
                <div className="text-2xl font-bold text-gray-900">{entries.length}</div>
                <div className="text-sm text-gray-500">Total Businesses</div>
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
};

export default BusinessLeaderboardView;
