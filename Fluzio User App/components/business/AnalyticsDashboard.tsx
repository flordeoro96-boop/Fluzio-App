import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, Users, Target, Gift, Euro, Award, Clock, Calendar,
  Download, Filter, RefreshCw, ChevronDown, BarChart3, PieChart, Activity,
  Eye, MousePointer, DollarSign, MapPin, Star
} from 'lucide-react';
import { getBusinessAnalytics, type BusinessAnalytics } from '../../services/analyticsService';

interface AnalyticsDashboardProps {
  businessId: string;
  businessName: string;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  businessId,
  businessName
}) => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [analytics, setAnalytics] = useState<BusinessAnalytics | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [businessId, timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const data = await getBusinessAnalytics(businessId, timeRange);
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
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
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#00E5FF] border-t-transparent"></div>
      </div>
    );
  }

  if (!analytics) {
    return null;
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
              onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d' | 'all')}
              className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent bg-white"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
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
          {/* Total Customers */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-3">
              <Users className="w-8 h-8" />
              <span className="text-blue-100 text-sm">Customers</span>
            </div>
            <div className="text-3xl font-bold mb-1">{analytics.totalCustomers}</div>
            <div className="text-blue-100 text-sm flex items-center gap-1">
              {analytics.customerGrowth >= 0 ? (
                <><TrendingUp className="w-4 h-4" /> +{analytics.customerGrowth.toFixed(1)}% growth</>
              ) : (
                <><TrendingDown className="w-4 h-4" /> {analytics.customerGrowth.toFixed(1)}% decline</>
              )}
            </div>
          </div>

          {/* Active Missions */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-3">
              <Target className="w-8 h-8" />
              <span className="text-purple-100 text-sm">Active Missions</span>
            </div>
            <div className="text-3xl font-bold mb-1">{analytics.activeMissions}</div>
            <div className="text-purple-100 text-sm flex items-center gap-1">
              {analytics.missionGrowth >= 0 ? (
                <><TrendingUp className="w-4 h-4" /> +{analytics.missionGrowth.toFixed(1)}% growth</>
              ) : (
                <><TrendingDown className="w-4 h-4" /> {analytics.missionGrowth.toFixed(1)}% decline</>
              )}
            </div>
          </div>

          {/* Rewards Redeemed */}
          <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-3">
              <Gift className="w-8 h-8" />
              <span className="text-pink-100 text-sm">Rewards Redeemed</span>
            </div>
            <div className="text-3xl font-bold mb-1">{analytics.rewardsRedeemed}</div>
            <div className="text-pink-100 text-sm flex items-center gap-1">
              {analytics.redemptionGrowth >= 0 ? (
                <><TrendingUp className="w-4 h-4" /> +{analytics.redemptionGrowth.toFixed(1)}% growth</>
              ) : (
                <><TrendingDown className="w-4 h-4" /> {analytics.redemptionGrowth.toFixed(1)}% decline</>
              )}
            </div>
          </div>

          {/* Estimated Revenue */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-3">
              <DollarSign className="w-8 h-8" />
              <span className="text-green-100 text-sm">Est. Revenue</span>
            </div>
            <div className="text-3xl font-bold mb-1">€{analytics.estimatedRevenue.toFixed(2)}</div>
            <div className="text-green-100 text-sm flex items-center gap-1">
              {analytics.revenueGrowth >= 0 ? (
                <><TrendingUp className="w-4 h-4" /> +{analytics.revenueGrowth.toFixed(1)}% growth</>
              ) : (
                <><TrendingDown className="w-4 h-4" /> {analytics.revenueGrowth.toFixed(1)}% decline</>
              )}
            </div>
          </div>
        </div>

        {/* Engagement Metrics */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <h2 className="text-xl font-bold text-[#1E0E62] mb-4 flex items-center gap-2">
            <Activity className="w-6 h-6 text-[#00E5FF]" />
            Engagement Metrics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <div className="text-sm text-gray-600 mb-1">Profile Views</div>
              <div className="text-2xl font-bold text-blue-600 flex items-center gap-2">
                <Eye className="w-5 h-5" />
                {analytics.profileViews.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Business profile visits
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Mission Applications</div>
              <div className="text-2xl font-bold text-purple-600 flex items-center gap-2">
                <MousePointer className="w-5 h-5" />
                {analytics.missionApplications.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Users started missions
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Completions</div>
              <div className="text-2xl font-bold text-green-600">
                {analytics.missionCompletions.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {analytics.completionRate.toFixed(1)}% completion rate
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Avg Rating</div>
              <div className="text-2xl font-bold text-yellow-600 flex items-center gap-2">
                <Star className="w-5 h-5 fill-yellow-600" />
                {analytics.avgRating.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Customer satisfaction
              </div>
            </div>
          </div>
        </div>

        {/* Customer & Performance Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Customer Metrics */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#1E0E62] flex items-center gap-2">
                <Users className="w-6 h-6 text-[#00E5FF]" />
                Customer Metrics
              </h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl">
                <div>
                  <div className="text-sm text-gray-600">Active Customers</div>
                  <div className="text-2xl font-bold text-[#1E0E62]">
                    {analytics.activeCustomers}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Engaged this period
                  </div>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-500" />
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                <div>
                  <div className="text-sm text-gray-600">Retention Rate</div>
                  <div className="text-2xl font-bold text-[#1E0E62]">
                    {analytics.retentionRate.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Customers returning
                  </div>
                </div>
                <Award className="w-8 h-8 text-purple-500" />
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                <div>
                  <div className="text-sm text-gray-600">Avg Engagement Time</div>
                  <div className="text-2xl font-bold text-[#1E0E62]">
                    {analytics.avgEngagementTime.toFixed(1)}m
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Per session average
                  </div>
                </div>
                <Clock className="w-8 h-8 text-green-500" />
              </div>
            </div>
          </div>

          {/* Top Performing Missions */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-[#1E0E62] mb-4 flex items-center gap-2">
              <Target className="w-6 h-6 text-[#00E5FF]" />
              Top Performing Missions
            </h2>

            {analytics.topMissions.length > 0 ? (
              <div className="space-y-3">
                {analytics.topMissions.slice(0, 5).map((mission, index) => (
                  <div key={mission.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-8 h-8 bg-gradient-to-br from-[#00E5FF] to-[#6C4BFF] rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-[#1E0E62] truncate">
                        {mission.title}
                      </div>
                      <div className="text-xs text-gray-500">
                        {mission.completions} completions • {mission.engagementRate.toFixed(1)}% engagement
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                No mission data available yet
              </div>
            )}
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-[#1E0E62] mb-4 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-[#00E5FF]" />
            Geographic Distribution
          </h2>

          {analytics.topCities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analytics.topCities.slice(0, 6).map((city, index) => (
                <div key={index} className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-lg font-bold text-[#1E0E62]">{city.name}</div>
                    <div className="text-sm font-semibold text-[#00E5FF]">
                      {city.percentage.toFixed(1)}%
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">
                    {city.customers} customers
                  </div>
                  <div className="mt-2 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] h-full"
                      style={{ width: `${city.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              No geographic data available yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
