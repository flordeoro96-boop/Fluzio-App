/**
 * Analytics Dashboard Component
 * 
 * Comprehensive analytics dashboard for business accounts showing:
 * - Engagement metrics (views, applications, completions)
 * - Mission performance tracking
 * - User demographics and insights
 * - Time series charts
 * - ROI tracking
 * - Export capabilities
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Eye,
  CheckCircle,
  Share2,
  Star,
  Download,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  DollarSign,
  Clock,
  Award,
  MapPin,
  Zap,
  Gift,
  RotateCcw
} from 'lucide-react';
import { 
  getAnalytics, 
  exportToCSV, 
  calculateSummary,
  type TimeSeriesData,
  type SummaryStats 
} from '../services/analyticsService';
import { useAuth } from '../services/AuthContext';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../services/AuthContext';

// ============================================================================
// TYPES
// ============================================================================

interface MetricCard {
  label: string;
  value: string | number;
  change?: number;
  icon: React.ComponentType<any>;
  color: string;
}

type PeriodType = '7d' | '30d' | '90d' | '1y';

// ============================================================================
// ANALYTICS DASHBOARD COMPONENT
// ============================================================================

// Additional interfaces for new widgets
interface RealtimeStats {
  todayRevenue: number; // Points earned today
  activeMissions: number;
  pendingRedemptions: number;
  totalRefunds: number;
  refundedPoints: number;
}

interface TopReward {
  id: string;
  title: string;
  redemptionCount: number;
  totalPoints: number;
  imageUrl?: string;
}

export const AnalyticsDashboard: React.FC = () => {
  const { user } = useAuth();
  const [period, setPeriod] = useState<PeriodType>('30d');
  const [loading, setLoading] = useState(true);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData | null>(null);
  const [summaryStats, setSummaryStats] = useState<SummaryStats | null>(null);
  const [selectedChart, setSelectedChart] = useState<'visits' | 'conversions' | 'missions'>('visits');
  const [realtimeStats, setRealtimeStats] = useState<RealtimeStats | null>(null);
  const [topRewards, setTopRewards] = useState<TopReward[]>([]);

  // Load analytics data
  useEffect(() => {
    loadAnalytics();
    loadRealtimeStats();
    loadTopRewards();
  }, [period, user]);

  const loadAnalytics = async () => {
    if (!user?.uid) return;

    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      const result = await getAnalytics(user.uid, startDate, endDate);
      
      if (result.success && result.data) {
        setTimeSeriesData(result.data);
        setSummaryStats(calculateSummary(result.data));
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (timeSeriesData) {
      const periodLabel = {
        '7d': '7_days',
        '30d': '30_days',
        '90d': '90_days',
        '1y': '1_year'
      }[period];
      exportToCSV(timeSeriesData, `fluzio_analytics_${periodLabel}_${new Date().toISOString().split('T')[0]}.csv`);
    }
  };

  // Load realtime stats (today's data)
  const loadRealtimeStats = async () => {
    if (!user?.uid) return;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTimestamp = Timestamp.fromDate(today);

      // Get today's redemptions to calculate revenue
      const redemptionsQuery = query(
        collection(db, 'redemptions'),
        where('businessId', '==', user.uid),
        where('redeemedAt', '>=', todayTimestamp),
        where('status', '==', 'USED')
      );
      const redemptionsSnap = await getDocs(redemptionsQuery);
      const todayRevenue = redemptionsSnap.docs.reduce((sum, doc) => {
        return sum + (doc.data().pointsSpent || 0);
      }, 0);

      // Get active missions
      const missionsQuery = query(
        collection(db, 'missions'),
        where('businessId', '==', user.uid),
        where('isActive', '==', true),
        where('lifecycleStatus', '==', 'ACTIVE')
      );
      const missionsSnap = await getDocs(missionsQuery);
      const activeMissions = missionsSnap.size;

      // Get pending redemptions
      const pendingRedemptionsQuery = query(
        collection(db, 'redemptions'),
        where('businessId', '==', user.uid),
        where('status', '==', 'PENDING')
      );
      const pendingSnap = await getDocs(pendingRedemptionsQuery);
      const pendingRedemptions = pendingSnap.size;

      // Get refund stats from transactions
      const refundTransactionsQuery = query(
        collection(db, 'points_transactions'),
        where('userId', '==', user.uid),
        where('type', '==', 'REFUND')
      );
      const refundSnap = await getDocs(refundTransactionsQuery);
      const totalRefunds = refundSnap.size;
      const refundedPoints = refundSnap.docs.reduce((sum, doc) => {
        return sum + (doc.data().amount || 0);
      }, 0);

      setRealtimeStats({
        todayRevenue,
        activeMissions,
        pendingRedemptions,
        totalRefunds,
        refundedPoints
      });
    } catch (error) {
      console.error('Error loading realtime stats:', error);
    }
  };

  // Load top rewards by redemption count
  const loadTopRewards = async () => {
    if (!user?.uid) return;

    try {
      // Get all redemptions for this business
      const redemptionsQuery = query(
        collection(db, 'redemptions'),
        where('businessId', '==', user.uid)
      );
      const redemptionsSnap = await getDocs(redemptionsQuery);

      // Group by reward and count
      const rewardMap = new Map<string, { title: string; count: number; totalPoints: number; imageUrl?: string }>();
      
      redemptionsSnap.docs.forEach(doc => {
        const data = doc.data();
        const rewardId = data.rewardId;
        const rewardTitle = data.rewardTitle || 'Unknown Reward';
        const pointsSpent = data.pointsSpent || 0;
        const imageUrl = data.rewardImageUrl;

        if (rewardMap.has(rewardId)) {
          const existing = rewardMap.get(rewardId)!;
          existing.count += 1;
          existing.totalPoints += pointsSpent;
        } else {
          rewardMap.set(rewardId, {
            title: rewardTitle,
            count: 1,
            totalPoints: pointsSpent,
            imageUrl
          });
        }
      });

      // Convert to array and sort by count
      const topRewardsList: TopReward[] = Array.from(rewardMap.entries())
        .map(([id, data]) => ({
          id,
          title: data.title,
          redemptionCount: data.count,
          totalPoints: data.totalPoints,
          imageUrl: data.imageUrl
        }))
        .sort((a, b) => b.redemptionCount - a.redemptionCount)
        .slice(0, 5); // Top 5 rewards

      setTopRewards(topRewardsList);
    } catch (error) {
      console.error('Error loading top rewards:', error);
    }
  };

  // Period labels
  const periodLabels = {
    '7d': 'Last 7 Days',
    '30d': 'Last 30 Days',
    '90d': 'Last 90 Days',
    '1y': 'Last Year'
  };

  // Calculate metric cards
  const getMetricCards = (): MetricCard[] => {
    if (!summaryStats) return [];

    return [
      {
        label: 'Total Visits',
        value: summaryStats.totalVisits.toLocaleString(),
        change: summaryStats.growthRate,
        icon: Eye,
        color: 'purple'
      },
      {
        label: 'Check-ins',
        value: summaryStats.totalCheckIns.toLocaleString(),
        icon: MapPin,
        color: 'blue'
      },
      {
        label: 'Missions Completed',
        value: summaryStats.totalMissions.toLocaleString(),
        icon: CheckCircle,
        color: 'green'
      },
      {
        label: 'Conversions',
        value: summaryStats.totalConversions.toLocaleString(),
        icon: TrendingUp,
        color: 'orange'
      },
      {
        label: 'Avg Daily Visits',
        value: summaryStats.avgVisitsPerDay.toFixed(1),
        icon: Activity,
        color: 'pink'
      },
      {
        label: 'Conversion Rate',
        value: `${summaryStats.avgConversionRate}%`,
        icon: Target,
        color: 'indigo'
      },
      {
        label: 'Top Performing Day',
        value: summaryStats.topDay,
        icon: Award,
        color: 'yellow'
      },
      {
        label: 'Growth Rate',
        value: `${summaryStats.growthRate > 0 ? '+' : ''}${summaryStats.growthRate}%`,
        change: summaryStats.growthRate,
        icon: summaryStats.growthRate >= 0 ? TrendingUp : TrendingDown,
        color: summaryStats.growthRate >= 0 ? 'green' : 'red'
      }
    ];
  };

  // Render metric card
  const renderMetricCard = (metric: MetricCard, index: number) => {
    const Icon = metric.icon;
    const colorClasses = {
      purple: 'bg-purple-50 text-purple-600',
      blue: 'bg-blue-50 text-blue-600',
      green: 'bg-green-50 text-green-600',
      orange: 'bg-orange-50 text-orange-600',
      pink: 'bg-pink-50 text-pink-600',
      indigo: 'bg-indigo-50 text-indigo-600',
      yellow: 'bg-yellow-50 text-yellow-600',
      red: 'bg-red-50 text-red-600'
    };

    return (
      <div
        key={index}
        className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
      >
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-lg ${colorClasses[metric.color as keyof typeof colorClasses]} flex items-center justify-center`}>
            <Icon className="w-6 h-6" />
          </div>
          {metric.change !== undefined && (
            <div className={`flex items-center gap-1 text-sm font-medium ${
              metric.change >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {metric.change >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>{Math.abs(metric.change)}%</span>
            </div>
          )}
        </div>
        <div className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</div>
        <div className="text-sm text-gray-600">{metric.label}</div>
      </div>
    );
  };

  // Render simple bar chart
  const renderChart = () => {
    if (!timeSeriesData) return null;

    const data = {
      visits: timeSeriesData.visits,
      conversions: timeSeriesData.conversions,
      missions: timeSeriesData.missionsCompleted
    }[selectedChart];

    const maxValue = Math.max(...data);
    const labels = timeSeriesData.labels;

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Trends Over Time</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedChart('visits')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedChart === 'visits'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Visits
            </button>
            <button
              onClick={() => setSelectedChart('conversions')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedChart === 'conversions'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Conversions
            </button>
            <button
              onClick={() => setSelectedChart('missions')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedChart === 'missions'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Missions
            </button>
          </div>
        </div>

        <div className="flex items-end justify-between gap-1 h-64">
          {data.map((value, index) => {
            const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
            const isHighlight = value === maxValue;

            return (
              <div key={index} className="flex flex-col items-center flex-1 gap-2">
                <div className="relative w-full flex items-end justify-center" style={{ height: '200px' }}>
                  <div
                    className={`w-full rounded-t-lg transition-all hover:opacity-80 cursor-pointer ${
                      isHighlight ? 'bg-purple-600' : 'bg-purple-400'
                    }`}
                    style={{ height: `${height}%` }}
                    title={`${labels[index]}: ${value}`}
                  >
                    {isHighlight && (
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                        {value}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-500 text-center transform -rotate-45 origin-top-left whitespace-nowrap">
                  {labels[index]}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-600">Loading analytics...</span>
          </div>
        </div>
      </div>
    );
  }

  const metricCards = getMetricCards();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
            <p className="text-gray-600">Track your business performance and insights</p>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            Export Data
          </button>
        </div>

        {/* Period selector */}
        <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1 w-fit">
          {(Object.keys(periodLabels) as PeriodType[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === p
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Realtime Stats - Today's Performance */}
      {realtimeStats && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Today's Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Today's Revenue */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6" />
                </div>
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Today</span>
              </div>
              <div className="text-3xl font-bold mb-1">{realtimeStats.todayRevenue.toLocaleString()}</div>
              <div className="text-sm opacity-90">Points Earned</div>
              <div className="mt-3 text-xs opacity-75">From customer redemptions</div>
            </div>

            {/* Active Missions */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6" />
                </div>
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Live</span>
              </div>
              <div className="text-3xl font-bold mb-1">{realtimeStats.activeMissions}</div>
              <div className="text-sm opacity-90">Active Missions</div>
              <div className="mt-3 text-xs opacity-75">Currently running</div>
            </div>

            {/* Pending Redemptions */}
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6" />
                </div>
                {realtimeStats.pendingRedemptions > 0 && (
                  <span className="text-xs bg-white/20 px-2 py-1 rounded-full animate-pulse">Action Needed</span>
                )}
              </div>
              <div className="text-3xl font-bold mb-1">{realtimeStats.pendingRedemptions}</div>
              <div className="text-sm opacity-90">Pending Redemptions</div>
              <div className="mt-3 text-xs opacity-75">Awaiting verification</div>
            </div>

            {/* Refund Analytics */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <RotateCcw className="w-6 h-6" />
                </div>
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full">All Time</span>
              </div>
              <div className="text-3xl font-bold mb-1">{realtimeStats.totalRefunds}</div>
              <div className="text-sm opacity-90">Total Refunds</div>
              <div className="mt-3 text-xs opacity-75">{realtimeStats.refundedPoints.toLocaleString()} points refunded</div>
            </div>
          </div>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metricCards.map((metric, index) => renderMetricCard(metric, index))}
      </div>

      {/* Chart */}
      <div className="mb-8">
        {renderChart()}
      </div>

      {/* Quick Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Performers */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-yellow-50 text-yellow-600 flex items-center justify-center">
              <Star className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Top Insights</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-purple-600 mt-2" />
              <div>
                <div className="font-medium text-gray-900">Peak Performance</div>
                <div className="text-sm text-gray-600">
                  Your best day was {summaryStats?.topDay} with highest visitor engagement
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-green-600 mt-2" />
              <div>
                <div className="font-medium text-gray-900">Conversion Success</div>
                <div className="text-sm text-gray-600">
                  {summaryStats?.avgConversionRate}% of visitors become engaged users
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-600 mt-2" />
              <div>
                <div className="font-medium text-gray-900">Growth Trend</div>
                <div className="text-sm text-gray-600">
                  {summaryStats && summaryStats.growthRate >= 0 ? (
                    <span className="text-green-600 font-medium">+{summaryStats.growthRate}% growth</span>
                  ) : (
                    <span className="text-red-600 font-medium">{summaryStats?.growthRate}% decline</span>
                  )} compared to previous period
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Activity Summary</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-purple-600" />
                <span className="text-gray-700">Total Views</span>
              </div>
              <span className="font-semibold text-gray-900">{summaryStats?.totalVisits.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-blue-600" />
                <span className="text-gray-700">Check-ins</span>
              </div>
              <span className="font-semibold text-gray-900">{summaryStats?.totalCheckIns.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-gray-700">Completed Missions</span>
              </div>
              <span className="font-semibold text-gray-900">{summaryStats?.totalMissions.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-orange-600" />
                <span className="text-gray-700">Conversions</span>
              </div>
              <span className="font-semibold text-gray-900">{summaryStats?.totalConversions.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Rewards by Redemptions */}
      {topRewards.length > 0 && (
        <div className="mt-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Top Rewards</h3>
                <p className="text-sm text-gray-600">Most redeemed rewards by customers</p>
              </div>
            </div>
            <div className="space-y-3">
              {topRewards.map((reward, index) => (
                <div
                  key={reward.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  {/* Rank Badge */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    index === 0 ? 'bg-yellow-500 text-white' :
                    index === 1 ? 'bg-gray-400 text-white' :
                    index === 2 ? 'bg-orange-600 text-white' :
                    'bg-gray-300 text-gray-700'
                  }`}>
                    {index + 1}
                  </div>

                  {/* Reward Image */}
                  {reward.imageUrl ? (
                    <img
                      src={reward.imageUrl}
                      alt={reward.title}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Gift className="w-6 h-6 text-white" />
                    </div>
                  )}

                  {/* Reward Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate">{reward.title}</h4>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm text-gray-600">
                        🎁 {reward.redemptionCount} redemptions
                      </span>
                      <span className="text-sm text-gray-600">
                        ⚡ {reward.totalPoints.toLocaleString()} points
                      </span>
                    </div>
                  </div>

                  {/* Badge for Top 3 */}
                  {index < 3 && (
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-gray-200 text-gray-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {index === 0 ? '🏆 Most Popular' : index === 1 ? '🥈 2nd Place' : '🥉 3rd Place'}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {topRewards.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Gift className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm">No reward redemptions yet</p>
                <p className="text-gray-400 text-xs mt-1">Create rewards to see top performers</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
