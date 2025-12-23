/**
 * Business Ranking Card Component
 * Displays business ranking and leaderboard stats on dashboard
 */

import React, { useEffect, useState } from 'react';
import { Trophy, TrendingUp, Award, Users, Target, ChevronRight, Loader2 } from 'lucide-react';
import { getBusinessStats, getNearbyCompetitors, BusinessLeaderboardEntry } from '../../services/businessLeaderboardService';

interface BusinessRankingCardProps {
  businessId: string;
  businessName: string;
  city?: string;
  onNavigateToLeaderboard?: () => void;
}

export const BusinessRankingCard: React.FC<BusinessRankingCardProps> = ({
  businessId,
  businessName,
  city,
  onNavigateToLeaderboard
}) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    rank: number;
    percentile: number;
    totalBusinesses: number;
    activeMissions: number;
    totalCustomers: number;
    engagementScore: number;
  } | null>(null);
  const [competitors, setCompetitors] = useState<BusinessLeaderboardEntry[]>([]);

  useEffect(() => {
    loadRankingData();
  }, [businessId, city]);

  const loadRankingData = async () => {
    setLoading(true);
    try {
      const [statsData, competitorsData] = await Promise.all([
        getBusinessStats(businessId),
        city ? getNearbyCompetitors(businessId, city, 3) : Promise.resolve([])
      ]);
      setStats(statsData);
      setCompetitors(competitorsData);
    } catch (error) {
      console.error('[BusinessRankingCard] Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'from-yellow-400 to-yellow-600';
    if (rank === 2) return 'from-gray-300 to-gray-500';
    if (rank === 3) return 'from-orange-400 to-orange-600';
    return 'from-blue-400 to-blue-600';
  };

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '🏆';
  };

  const getPercentileMessage = (percentile: number) => {
    if (percentile >= 90) return 'Elite Top 10%';
    if (percentile >= 75) return 'Top Performer';
    if (percentile >= 50) return 'Above Average';
    return 'Growing Business';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 text-[#00E5FF] animate-spin" />
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getRankColor(stats.rank)} flex items-center justify-center text-2xl shadow-lg`}>
            {getRankEmoji(stats.rank)}
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#1E0E62]">Your Ranking</h3>
            <p className="text-sm text-[#8F8FA3]">{city || 'Local'} Leaderboard</p>
          </div>
        </div>
        {onNavigateToLeaderboard && (
          <button
            onClick={onNavigateToLeaderboard}
            className="flex items-center gap-1 text-sm font-bold text-[#00E5FF] hover:text-[#6C4BFF] transition-colors"
          >
            View All
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Rank Display */}
      <div className="bg-gradient-to-r from-[#00E5FF]/10 to-[#6C4BFF]/10 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-4xl font-clash font-bold text-[#1E0E62] mb-1">
              #{stats.rank}
            </div>
            <div className="text-sm text-[#8F8FA3]">
              out of {stats.totalBusinesses} businesses
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-[#00E5FF]">
              Top {100 - stats.percentile}%
            </div>
            <div className="text-xs text-[#8F8FA3] font-bold uppercase tracking-wide">
              {getPercentileMessage(stats.percentile)}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <Target className="w-5 h-5 text-green-600 mx-auto mb-1" />
          <div className="text-lg font-bold text-[#1E0E62]">{stats.activeMissions}</div>
          <div className="text-[10px] text-gray-600 uppercase font-bold">Missions</div>
        </div>
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <Users className="w-5 h-5 text-blue-600 mx-auto mb-1" />
          <div className="text-lg font-bold text-[#1E0E62]">{stats.totalCustomers}</div>
          <div className="text-[10px] text-gray-600 uppercase font-bold">Customers</div>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <Award className="w-5 h-5 text-purple-600 mx-auto mb-1" />
          <div className="text-lg font-bold text-[#1E0E62]">{stats.engagementScore}</div>
          <div className="text-[10px] text-gray-600 uppercase font-bold">Score</div>
        </div>
      </div>

      {/* Nearby Competitors */}
      {competitors.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            Nearby Competition
          </h4>
          <div className="space-y-2">
            {competitors.slice(0, 3).map((competitor) => (
              <div
                key={competitor.businessId}
                className={`flex items-center justify-between p-2 rounded-lg ${
                  competitor.businessId === businessId
                    ? 'bg-[#00E5FF]/10 border border-[#00E5FF]'
                    : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-500">
                    #{competitor.rank}
                  </span>
                  {competitor.avatarUrl ? (
                    <img
                      src={competitor.avatarUrl}
                      alt={competitor.name}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#00E5FF] to-[#6C4BFF] flex items-center justify-center text-white text-xs font-bold">
                      {competitor.name.charAt(0)}
                    </div>
                  )}
                  <span className="text-sm font-medium text-[#1E0E62] truncate max-w-[120px]">
                    {competitor.businessId === businessId ? 'You' : competitor.name}
                  </span>
                </div>
                <div className="text-sm font-bold text-[#00E5FF]">
                  {competitor.score}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Call to Action */}
      <button
        onClick={onNavigateToLeaderboard}
        className="w-full mt-4 py-2.5 bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white rounded-lg font-bold text-sm hover:shadow-lg transition-all flex items-center justify-center gap-2"
      >
        <Trophy className="w-4 h-4" />
        Climb the Leaderboard
      </button>
    </div>
  );
};
