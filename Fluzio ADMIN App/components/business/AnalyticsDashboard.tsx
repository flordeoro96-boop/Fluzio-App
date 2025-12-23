import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Users, Target, Gift, Euro, Award, Clock, Calendar,
  Download, Filter, RefreshCw, ChevronDown, BarChart3, PieChart, Activity
} from 'lucide-react';

interface AnalyticsDashboardProps {
  businessId: string;
  businessName: string;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  businessId,
  businessName
}) => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year' | 'all'>('month');
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    loadAnalytics();
  }, [businessId, timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // TODO: Import and call analytics service
      // For now, mock data
      setAnalytics({
        overview: {
          totalRevenue: 1250.50,
          totalCustomers: 142,
          totalMissions: 28,
          totalRewards: 12,
          pointsIssued: 125050,
          pointsRedeemed: 45000,
        },
        customers: {
          newThisWeek: 12,
          newThisMonth: 45,
          repeatRate: 68.5,
          averagePointsBalance: 3500,
          topCustomers: [],
        },
        missions: {
          totalPosted: 28,
          totalCompleted: 156,
          completionRate: 92.5,
          averageCompletionTime: 24.5,
          topPerforming: [],
        },
        rewards: {
          totalCreated: 12,
          totalRedeemed: 89,
          redemptionRate: 45.2,
          totalPointsSpent: 45000,
          popularRewards: [],
        },
        engagement: {
          peakHours: [
            { hour: 14, count: 45 },
            { hour: 18, count: 52 },
            { hour: 12, count: 38 },
          ],
          peakDays: [
            { day: 'Saturday', count: 95 },
            { day: 'Friday', count: 82 },
            { day: 'Sunday', count: 71 },
          ],
        },
      });
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (type: 'customers' | 'missions' | 'rewards') => {
    // TODO: Implement CSV export
    alert(`Exporting ${type} data...`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#F72585] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#1E0E62]">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-1">Performance insights for {businessName}</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Time Range Selector */}
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F72585] focus:border-transparent bg-white"
            >
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="year">Last Year</option>
              <option value="all">All Time</option>
            </select>

            {/* Refresh Button */}
            <button
              onClick={loadAnalytics}
              className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total Revenue */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-3">
              <Euro className="w-8 h-8" />
              <span className="text-green-100 text-sm">Revenue</span>
            </div>
            <div className="text-3xl font-bold mb-1">
              €{analytics.overview.totalRevenue.toFixed(2)}
            </div>
            <div className="text-green-100 text-sm">Net Points Value</div>
          </div>

          {/* Total Customers */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-3">
              <Users className="w-8 h-8" />
              <span className="text-blue-100 text-sm">Customers</span>
            </div>
            <div className="text-3xl font-bold mb-1">{analytics.overview.totalCustomers}</div>
            <div className="text-blue-100 text-sm">
              +{analytics.customers.newThisMonth} this month
            </div>
          </div>

          {/* Total Missions */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-3">
              <Target className="w-8 h-8" />
              <span className="text-purple-100 text-sm">Missions</span>
            </div>
            <div className="text-3xl font-bold mb-1">{analytics.overview.totalMissions}</div>
            <div className="text-purple-100 text-sm">
              {analytics.missions.completionRate.toFixed(1)}% completion rate
            </div>
          </div>

          {/* Total Rewards */}
          <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-3">
              <Gift className="w-8 h-8" />
              <span className="text-pink-100 text-sm">Rewards</span>
            </div>
            <div className="text-3xl font-bold mb-1">{analytics.overview.totalRewards}</div>
            <div className="text-pink-100 text-sm">
              {analytics.rewards.totalRedeemed} redemptions
            </div>
          </div>
        </div>

        {/* Points Economy */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <h2 className="text-xl font-bold text-[#1E0E62] mb-4 flex items-center gap-2">
            <Activity className="w-6 h-6 text-[#F72585]" />
            Points Economy
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-gray-600 mb-1">Points Issued</div>
              <div className="text-2xl font-bold text-green-600">
                {analytics.overview.pointsIssued.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                From missions completed
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Points Redeemed</div>
              <div className="text-2xl font-bold text-orange-600">
                {analytics.overview.pointsRedeemed.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                For rewards claimed
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Net Points</div>
              <div className="text-2xl font-bold text-blue-600">
                {(analytics.overview.pointsIssued - analytics.overview.pointsRedeemed).toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Outstanding balance
              </div>
            </div>
          </div>
        </div>

        {/* Customer Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Customer Metrics */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#1E0E62] flex items-center gap-2">
                <Users className="w-6 h-6 text-[#F72585]" />
                Customer Insights
              </h2>
              <button
                onClick={() => handleExport('customers')}
                className="text-sm text-[#F72585] hover:text-[#7209B7] flex items-center gap-1"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <div className="text-sm text-gray-600">New This Week</div>
                  <div className="text-2xl font-bold text-[#1E0E62]">
                    {analytics.customers.newThisWeek}
                  </div>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <div className="text-sm text-gray-600">Repeat Rate</div>
                  <div className="text-2xl font-bold text-[#1E0E62]">
                    {analytics.customers.repeatRate.toFixed(1)}%
                  </div>
                </div>
                <Award className="w-8 h-8 text-purple-500" />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <div className="text-sm text-gray-600">Avg Points Balance</div>
                  <div className="text-2xl font-bold text-[#1E0E62]">
                    {analytics.customers.averagePointsBalance.toLocaleString()}
                  </div>
                </div>
                <BarChart3 className="w-8 h-8 text-blue-500" />
              </div>
            </div>
          </div>

          {/* Peak Hours */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-[#1E0E62] mb-4 flex items-center gap-2">
              <Clock className="w-6 h-6 text-[#F72585]" />
              Peak Hours
            </h2>

            <div className="space-y-3">
              {analytics.engagement.peakHours.map((item: any, index: number) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-16 text-sm font-medium text-gray-600">
                    {item.hour}:00
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-100 rounded-full h-8 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#F72585] to-[#7209B7] h-full flex items-center justify-end pr-3 text-white text-sm font-bold"
                        style={{
                          width: `${(item.count / Math.max(...analytics.engagement.peakHours.map((h: any) => h.count))) * 100}%`,
                        }}
                      >
                        {item.count}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <h3 className="text-sm font-bold text-gray-700 mb-3">Peak Days</h3>
              <div className="flex gap-2 flex-wrap">
                {analytics.engagement.peakDays.slice(0, 3).map((item: any, index: number) => (
                  <div key={index} className="bg-gradient-to-r from-purple-100 to-pink-100 px-4 py-2 rounded-lg">
                    <div className="text-xs text-gray-600">{item.day}</div>
                    <div className="text-lg font-bold text-[#1E0E62]">{item.count}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Mission Performance */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[#1E0E62] flex items-center gap-2">
              <Target className="w-6 h-6 text-[#F72585]" />
              Mission Performance
            </h2>
            <button
              onClick={() => handleExport('missions')}
              className="text-sm text-[#F72585] hover:text-[#7209B7] flex items-center gap-1"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl">
              <div className="text-3xl font-bold text-[#1E0E62] mb-1">
                {analytics.missions.totalPosted}
              </div>
              <div className="text-sm text-gray-600">Total Posted</div>
            </div>

            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-teal-50 rounded-xl">
              <div className="text-3xl font-bold text-[#1E0E62] mb-1">
                {analytics.missions.totalCompleted}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>

            <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl">
              <div className="text-3xl font-bold text-[#1E0E62] mb-1">
                {analytics.missions.completionRate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Completion Rate</div>
            </div>

            <div className="text-center p-4 bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl">
              <div className="text-3xl font-bold text-[#1E0E62] mb-1">
                {analytics.missions.averageCompletionTime.toFixed(1)}h
              </div>
              <div className="text-sm text-gray-600">Avg Time</div>
            </div>
          </div>
        </div>

        {/* Rewards Performance */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[#1E0E62] flex items-center gap-2">
              <Gift className="w-6 h-6 text-[#F72585]" />
              Rewards Performance
            </h2>
            <button
              onClick={() => handleExport('rewards')}
              className="text-sm text-[#F72585] hover:text-[#7209B7] flex items-center gap-1"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl">
              <div className="text-3xl font-bold text-[#1E0E62] mb-1">
                {analytics.rewards.totalCreated}
              </div>
              <div className="text-sm text-gray-600">Total Created</div>
            </div>

            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
              <div className="text-3xl font-bold text-[#1E0E62] mb-1">
                {analytics.rewards.totalRedeemed}
              </div>
              <div className="text-sm text-gray-600">Redeemed</div>
            </div>

            <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl">
              <div className="text-3xl font-bold text-[#1E0E62] mb-1">
                {analytics.rewards.redemptionRate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Redemption Rate</div>
            </div>

            <div className="text-center p-4 bg-gradient-to-br from-pink-50 to-red-50 rounded-xl">
              <div className="text-3xl font-bold text-[#1E0E62] mb-1">
                {analytics.rewards.totalPointsSpent.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Points Spent</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
