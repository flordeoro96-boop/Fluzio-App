/**
 * AI Performance Insights Component
 * Shows AI-powered analytics, recommendations, and performance score
 * WITH SMART CACHING: Caches results for 4 hours to save API costs
 */

import React, { useState, useEffect } from 'react';
import {
  Brain, TrendingUp, TrendingDown, AlertTriangle, Info, CheckCircle,
  Sparkles, Loader2, RefreshCw, Target, Users, Award, Zap,
  ChevronRight, Clock
} from 'lucide-react';
import { analyzeBusinessPerformance } from '../services/openaiService';

interface AIPerformanceInsightsProps {
  businessId: string;
  businessName: string;
  businessType: string;
  websiteUrl?: string;
  metrics: {
    totalMissions: number;
    activeMissions: number;
    completedMissions: number;
    totalParticipations: number;
    approvedParticipations: number;
    rejectedParticipations: number;
    totalPointsAwarded: number;
    totalRewards: number;
    redeemedRewards: number;
    newCustomers: number;
    returningCustomers: number;
    topPerformingMissions?: Array<{ title: string; completions: number }>;
  };
  period?: 'week' | 'month' | 'quarter';
}

export const AIPerformanceInsights: React.FC<AIPerformanceInsightsProps> = ({
  businessId,
  businessName,
  businessType,
  websiteUrl,
  metrics,
  period = 'month'
}) => {
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Cache configuration
  const cacheKey = `ai_insights_${businessId}_${period}`;
  const CACHE_DURATION = 4 * 60 * 60 * 1000; // 4 hours

  useEffect(() => {
    loadInsights(false);
  }, [businessId, period]);

  const loadInsights = async (forceRefresh: boolean = false) => {
    try {
      setLoading(!forceRefresh);
      setError(null);

      // Try cache first
      if (!forceRefresh) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          try {
            const { data, timestamp } = JSON.parse(cached);
            const age = Date.now() - timestamp;
            
            if (age < CACHE_DURATION) {
              setAnalysis(data);
              setLastUpdated(new Date(timestamp));
              setLoading(false);
              console.log(`[AIInsights] Using cache (${Math.round(age / 1000 / 60)}m old)`);
              return;
            }
          } catch (e) {
            console.warn('[AIInsights] Invalid cache');
          }
        }
      }

      // Fetch fresh data
      const result = await analyzeBusinessPerformance({
        businessId,
        businessName,
        businessType,
        websiteUrl,
        period,
        data: metrics
      });

      setAnalysis(result);
      const now = Date.now();
      setLastUpdated(new Date(now));

      // Save to cache
      localStorage.setItem(cacheKey, JSON.stringify({ data: result, timestamp: now }));

    } catch (err) {
      console.error('[AIPerformanceInsights] Error:', err);
      setError('Unable to load AI insights');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadInsights(true);
    setRefreshing(false);
  };

  const getTimeAgo = (date: Date | null): string => {
    if (!date) return '';
    const minutes = Math.floor((Date.now() - date.getTime()) / 1000 / 60);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Great';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Needs Improvement';
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
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
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-100">
        <div className="flex items-center justify-center gap-3 text-purple-600">
          <Brain className="w-6 h-6 animate-pulse" />
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="font-semibold">AI analyzing your performance...</span>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
        <div className="text-center">
          <Brain className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 mb-3">{error || 'No insights available'}</p>
          <button
            onClick={() => loadInsights(true)}
            className="text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Card with Score */}
      <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Brain className="w-6 h-6" />
            <h3 className="text-xl font-bold">AI Performance Analysis</h3>
          </div>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-purple-100 text-sm">
                {getTimeAgo(lastUpdated)}
              </span>
            )}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Refresh insights"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Performance Score */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-purple-100 text-sm mb-1">Overall Performance</p>
            <p className="text-2xl font-bold mb-2">{getScoreLabel(analysis.score)}</p>
            <p className="text-purple-100 text-sm">{analysis.summary}</p>
          </div>
          <div className="text-center">
            <div className="text-5xl font-bold">{analysis.score}</div>
            <div className="text-purple-100 text-sm">/ 100</div>
          </div>
        </div>
      </div>

      {/* Key Insights */}
      {analysis.insights && analysis.insights.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h4 className="font-semibold text-gray-900">Key Insights</h4>
          </div>
          <div className="space-y-3">
            {analysis.insights.map((insight: any, index: number) => (
              <div
                key={index}
                className="flex gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100"
              >
                {getInsightIcon(insight.type)}
                <div className="flex-1">
                  <h5 className="font-semibold text-gray-900 mb-1">{insight.title}</h5>
                  <p className="text-sm text-gray-600">{insight.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {analysis.recommendations && analysis.recommendations.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-purple-600" />
            <h4 className="font-semibold text-gray-900">Recommended Actions</h4>
          </div>
          <div className="space-y-3">
            {analysis.recommendations.map((rec: any, index: number) => (
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
                    <ChevronRight className="w-4 h-4 text-purple-600" />
                  </h5>
                  <p className="text-sm text-gray-600">{rec.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Badge with Manual Refresh */}
      <div className="flex items-center justify-center gap-2 text-sm text-gray-500 flex-wrap">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4" />
          <span>Powered by AI · Updates every {period}{lastUpdated && ' · Cached for 4 hours'}</span>
        </div>
        <button
          onClick={handleRefresh}
          className="text-purple-600 hover:text-purple-700 font-medium"
          disabled={refreshing}
        >
          {refreshing ? 'Refreshing...' : 'Refresh now'}
        </button>
      </div>
    </div>
  );
};
