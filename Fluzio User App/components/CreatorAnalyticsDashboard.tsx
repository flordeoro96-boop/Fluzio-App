/**
 * Creator Analytics Dashboard
 * Shows performance metrics, insights, and recommendations for creators
 */

import React, { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, Target, Eye, Clock, Star,
  CheckCircle, XCircle, AlertCircle, Lightbulb, Award, Users,
  BarChart3, Calendar, Zap, ThumbsUp, MessageSquare, Briefcase,
  Loader2, RefreshCw, ArrowRight, Activity
} from 'lucide-react';
import {
  getCreatorAnalytics,
  generateCreatorInsights,
  generateCreatorRecommendations,
  type CreatorStats,
  type CreatorInsight,
  type CreatorRecommendation
} from '../services/creatorAnalyticsService';

interface CreatorAnalyticsDashboardProps {
  creatorId: string;
  creatorName: string;
}

export const CreatorAnalyticsDashboard: React.FC<CreatorAnalyticsDashboardProps> = ({
  creatorId,
  creatorName
}) => {
  const [stats, setStats] = useState<CreatorStats | null>(null);
  const [insights, setInsights] = useState<CreatorInsight[]>([]);
  const [recommendations, setRecommendations] = useState<CreatorRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, [creatorId]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await getCreatorAnalytics(creatorId);
      setStats(data);
      
      const generatedInsights = generateCreatorInsights(data);
      setInsights(generatedInsights);
      
      const generatedRecommendations = generateCreatorRecommendations(data);
      setRecommendations(generatedRecommendations);
      
    } catch (error) {
      console.error('[CreatorAnalytics] Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200 text-green-900';
      case 'warning': return 'bg-orange-50 border-orange-200 text-orange-900';
      case 'info': return 'bg-blue-50 border-blue-200 text-blue-900';
      default: return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

  const getPriorityBadge = (priority: string) => {
    const styles = {
      high: 'bg-red-50 text-red-700 border-red-200',
      medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      low: 'bg-blue-50 text-blue-700 border-blue-200'
    };
    return styles[priority as keyof typeof styles] || styles.low;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">No analytics data available yet</p>
        <p className="text-sm text-gray-500 mt-1">Start applying to projects to see your stats!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#1E0E62]">Creator Analytics</h2>
          <p className="text-sm text-gray-600 mt-1">Track your performance and growth</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Success Rate */}
        <div className="bg-white rounded-xl p-4 border-2 border-gray-100">
          <div className="flex items-center gap-2 mb-2 text-green-600">
            <Target className="w-4 h-4" />
            <span className="text-xs font-bold uppercase">Success Rate</span>
          </div>
          <div className="text-3xl font-bold text-[#1E0E62]">{stats.applicationSuccessRate}%</div>
          <div className="text-xs text-gray-600 mt-1">
            {stats.acceptedApplications}/{stats.totalApplications} accepted
          </div>
        </div>

        {/* Monthly Earnings */}
        <div className="bg-white rounded-xl p-4 border-2 border-gray-100">
          <div className="flex items-center gap-2 mb-2 text-green-600">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs font-bold uppercase">Monthly Earnings</span>
          </div>
          <div className="text-3xl font-bold text-[#1E0E62]">${stats.monthlyEarnings}</div>
          <div className="text-xs text-gray-600 mt-1">${stats.totalEarnings} total</div>
        </div>

        {/* Profile Views */}
        <div className="bg-white rounded-xl p-4 border-2 border-gray-100">
          <div className="flex items-center gap-2 mb-2 text-blue-600">
            <Eye className="w-4 h-4" />
            <span className="text-xs font-bold uppercase">Profile Views</span>
          </div>
          <div className="text-3xl font-bold text-[#1E0E62]">{stats.profileViewsThisMonth}</div>
          <div className="text-xs text-gray-600 mt-1">This month</div>
        </div>

        {/* Avg Rating */}
        <div className="bg-white rounded-xl p-4 border-2 border-gray-100">
          <div className="flex items-center gap-2 mb-2 text-yellow-600">
            <Star className="w-4 h-4 fill-current" />
            <span className="text-xs font-bold uppercase">Rating</span>
          </div>
          <div className="text-3xl font-bold text-[#1E0E62]">{stats.averageRating}</div>
          <div className="text-xs text-gray-600 mt-1">{stats.totalReviews} reviews</div>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200">
        <h3 className="font-bold text-lg mb-4 text-purple-900">Performance Overview</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Completed Projects</span>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.completedProjects}</div>
            <div className="text-xs text-gray-500 mt-1">{stats.completionRate}% completion rate</div>
          </div>

          <div className="bg-white rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Response Time</span>
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.averageResponseTime}h</div>
            <div className="text-xs text-gray-500 mt-1">{stats.responseRate}% response rate</div>
          </div>

          <div className="bg-white rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Hire Again Rate</span>
              <ThumbsUp className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.hireAgainRate}%</div>
            <div className="text-xs text-gray-500 mt-1">Clients love you!</div>
          </div>
        </div>
      </div>

      {/* Key Insights */}
      {insights.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-lg text-gray-900">Key Insights</h3>
          </div>
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl border-2 ${getInsightColor(insight.type)}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{insight.icon}</span>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{insight.title}</h4>
                    <p className="text-sm opacity-80">{insight.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-lg text-gray-900">Recommended Actions</h3>
          </div>
          <div className="space-y-3">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className="flex gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100"
              >
                <div className={`px-2 py-1 rounded-lg text-xs font-semibold border h-fit ${getPriorityBadge(rec.priority)}`}>
                  {rec.priority.toUpperCase()}
                </div>
                <div className="flex-1">
                  <h5 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                    {rec.action}
                    <ArrowRight className="w-4 h-4 text-purple-600" />
                  </h5>
                  <p className="text-sm text-gray-600">{rec.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Skills */}
      {stats.topSkills.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-lg text-gray-900">Top Performing Skills</h3>
          </div>
          <div className="space-y-3">
            {stats.topSkills.map((skill, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{skill.skill}</div>
                    <div className="text-sm text-gray-600">{skill.projectCount} projects</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">${skill.earnings}</div>
                  <div className="text-xs text-gray-500">earned</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Earnings Timeline */}
      <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-purple-600" />
          <h3 className="font-bold text-lg text-gray-900">Earnings Timeline (Last 6 Months)</h3>
        </div>
        <div className="flex items-end justify-between gap-2 h-48">
          {stats.earningsTimeline.map((month, index) => {
            const maxEarnings = Math.max(...stats.earningsTimeline.map(m => m.amount));
            const height = (month.amount / maxEarnings) * 100;
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div className="text-xs font-semibold text-gray-600">${month.amount}</div>
                <div 
                  className="w-full bg-gradient-to-t from-purple-600 to-pink-600 rounded-t-lg transition-all hover:opacity-80"
                  style={{ height: `${height}%` }}
                />
                <div className="text-xs text-gray-500">{month.month}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Empty State */}
      {stats.totalApplications === 0 && (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 border-2 border-gray-200 text-center">
          <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-700 mb-2">Start Your Creator Journey</h3>
          <p className="text-gray-600 mb-4">
            Apply to projects to start tracking your performance and earnings
          </p>
          <button className="px-6 py-3 bg-[#6C4BFF] text-white rounded-xl font-semibold hover:bg-[#5a3de6] transition-colors">
            Browse Opportunities
          </button>
        </div>
      )}
    </div>
  );
};
