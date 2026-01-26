/**
 * Business Insights Dashboard - Comprehensive Home View
 * Shows everything a business needs: insights, recommendations, performance, alerts
 */

import React, { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, AlertCircle, Lightbulb, ThumbsUp, Star,
  Target, Users, MapPin, Zap, Brain, ArrowRight, RefreshCw, Loader2,
  MessageSquare, Gift, Clock, BarChart3, Award, CheckCircle, XCircle
} from 'lucide-react';
import { analyzeReviewsWithAI, getReviewStats, ReviewInsights } from '../services/reviewService';
import { getBusinessStats } from '../services/businessLeaderboardService';
// import { AIPerformanceInsights } from './AIPerformanceInsights'; // TODO: Create this component
import { AICollaborationSuggestionsCard } from './AICollaborationSuggestionsCard';

interface BusinessInsightsDashboardProps {
  businessId: string;
  businessName: string;
  websiteUrl?: string;
  businessCity?: string;
  stats: {
    activeMissions: number;
    completedMissions: number;
    totalApplications: number;
    pendingReviews: number;
    storeCheckIns: number;
    socialReach: number;
    activeAmbassadors: number;
    followerGrowth: number;
    localRank: number;
    districtName: string;
  };
  onNavigate?: (route: string) => void;
}

export const BusinessInsightsDashboard: React.FC<BusinessInsightsDashboardProps> = ({
  businessId,
  businessName,
  websiteUrl,
  businessCity,
  stats,
  onNavigate
}) => {
  const [reviewInsights, setReviewInsights] = useState<ReviewInsights | null>(null);
  const [reviewStats, setReviewStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadInsights();
  }, [businessId]);

  const loadInsights = async () => {
    try {
      setLoading(true);
      
      // Load review stats
      const stats = await getReviewStats(businessId);
      setReviewStats(stats);

      // Load AI insights if there are enough reviews
      if (stats && stats.total >= 3) {
        // Analyze reviews for this business
        const insights = await analyzeReviewsWithAI(businessId);
        setReviewInsights(insights);
      }
    } catch (error) {
      console.error('[BusinessInsights] Error loading:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadInsights();
    setRefreshing(false);
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-50';
      case 'negative': return 'text-red-600 bg-red-50';
      default: return 'text-yellow-600 bg-yellow-50';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'text-green-600';
      case 'declining': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-6 h-6 text-purple-600" />
          <h2 className="text-xl font-bold text-[#1E0E62]">Business Insights</h2>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
        </div>
      ) : (
        <>
          {/* AI Performance Insights */}
          {/* TODO: Create AIPerformanceInsights component
          <AIPerformanceInsights
            businessId={businessId}
            businessName={businessName}
            businessType="Restaurant"
            websiteUrl={websiteUrl}
            metrics={{
              totalMissions: stats.activeMissions + stats.completedMissions,
              activeMissions: stats.activeMissions,
              completedMissions: stats.completedMissions,
              totalParticipations: stats.totalApplications,
              approvedParticipations: Math.floor(stats.totalApplications * 0.7),
              rejectedParticipations: Math.floor(stats.totalApplications * 0.3),
              totalPointsAwarded: stats.totalApplications * 50,
              totalRewards: 20,
              redeemedRewards: 12,
              newCustomers: Math.floor(stats.storeCheckIns * 0.4),
              returningCustomers: Math.floor(stats.storeCheckIns * 0.6)
            }}
            period="month"
          /> */}

          {/* Customer Sentiment Overview */}
          {reviewInsights && reviewStats && reviewStats.total > 0 && (
            <div className={`rounded-2xl p-6 border-2 ${getSentimentColor(reviewInsights.overallSentiment)}`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg mb-1">Customer Sentiment</h3>
                  <p className="text-sm opacity-80">Based on {reviewStats.total} reviews</p>
                </div>
                <div className={`flex items-center gap-2 font-bold ${getTrendColor(reviewInsights.trendingSentiment)}`}>
                  {reviewInsights.trendingSentiment === 'improving' && <TrendingUp className="w-5 h-5" />}
                  {reviewInsights.trendingSentiment === 'declining' && <TrendingDown className="w-5 h-5" />}
                  {reviewInsights.trendingSentiment === 'stable' && <ArrowRight className="w-5 h-5" />}
                  {reviewInsights.trendingSentiment}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold">{reviewInsights.sentimentScore}%</div>
                <div className="flex-1">
                  <div className="h-3 bg-white/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-current rounded-full transition-all"
                      style={{ width: `${reviewInsights.sentimentScore}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Key Insights - Always Show */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-6 h-6 text-blue-600" />
              <h3 className="font-bold text-lg text-blue-900">Key Insights</h3>
            </div>
            <div className="space-y-3">
              {reviewInsights && reviewStats && reviewStats.total > 0 ? (
                <>
                  <div className="bg-white rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                      <span className="font-semibold text-gray-900">Customer Satisfaction</span>
                    </div>
                    <p className="text-gray-700 text-sm">
                      Your business has a <span className="font-bold text-blue-600">{reviewStats.averageRating.toFixed(1)}/5.0</span> rating 
                      from {reviewStats.total} reviews with <span className="font-bold">{reviewInsights.sentimentScore}%</span> positive sentiment.
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Users className="w-5 h-5 text-orange-500" />
                      <span className="font-semibold text-gray-900">Community Engagement</span>
                    </div>
                    <p className="text-gray-700 text-sm">
                      You have <span className="font-bold text-orange-600">{stats.activeAmbassadors} active ambassadors</span> and 
                      <span className="font-bold"> {stats.storeCheckIns} check-ins</span>, building strong local presence.
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <TrendingUp className="w-5 h-5 text-green-500" />
                      <span className="font-semibold text-gray-900">Growth Trend</span>
                    </div>
                    <p className="text-gray-700 text-sm">
                      Your sentiment is <span className="font-bold text-green-600">{reviewInsights.trendingSentiment}</span> with 
                      <span className="font-bold"> {(stats.socialReach / 1000).toFixed(1)}k</span> social reach potential.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-white rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Users className="w-5 h-5 text-orange-500" />
                      <span className="font-semibold text-gray-900">Community Engagement</span>
                    </div>
                    <p className="text-gray-700 text-sm">
                      You have <span className="font-bold text-orange-600">{stats.activeAmbassadors} active ambassadors</span> and 
                      <span className="font-bold"> {stats.totalApplications} total applications</span>.
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <MapPin className="w-5 h-5 text-teal-500" />
                      <span className="font-semibold text-gray-900">Store Visits</span>
                    </div>
                    <p className="text-gray-700 text-sm">
                      Your business has received <span className="font-bold text-teal-600">{stats.storeCheckIns} check-ins</span>, 
                      showing strong customer interest.
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Zap className="w-5 h-5 text-blue-500" />
                      <span className="font-semibold text-gray-900">Social Reach</span>
                    </div>
                    <p className="text-gray-700 text-sm">
                      Your campaigns can reach up to <span className="font-bold text-blue-600">{(stats.socialReach / 1000).toFixed(1)}k followers</span> through 
                      your ambassador network.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Recommended Actions - Always Show */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-6 h-6 text-purple-600" />
              <h3 className="font-bold text-lg text-purple-900">Recommended Actions</h3>
              <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded-full">PRIORITY</span>
            </div>
            <div className="space-y-3">
              {reviewInsights && reviewInsights.actionableRecommendations.length > 0 ? (
                // AI-generated recommendations when available
                reviewInsights.actionableRecommendations.slice(0, 3).map((rec, index) => (
                  <div key={index} className="bg-white rounded-xl p-4 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <p className="text-gray-900 flex-1">{rec}</p>
                  </div>
                ))
              ) : (
                // Fallback recommendations based on metrics
                <>
                  {stats.pendingReviews > 0 && (
                    <div className="bg-white rounded-xl p-4 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                        1
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-900 font-semibold mb-1">Review Pending Submissions</p>
                        <p className="text-gray-600 text-sm">You have {stats.pendingReviews} missions waiting for approval. Quick reviews keep ambassadors engaged.</p>
                      </div>
                    </div>
                  )}
                  {stats.activeMissions === 0 && (
                    <div className="bg-white rounded-xl p-4 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                        {stats.pendingReviews > 0 ? '2' : '1'}
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-900 font-semibold mb-1">Launch a New Mission</p>
                        <p className="text-gray-600 text-sm">Create engaging missions to boost customer participation and grow your brand presence.</p>
                      </div>
                    </div>
                  )}
                  {(!reviewStats || reviewStats.total < 5) && (
                    <div className="bg-white rounded-xl p-4 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                        {(stats.pendingReviews > 0 ? 1 : 0) + (stats.activeMissions === 0 ? 1 : 0) + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-900 font-semibold mb-1">Collect Customer Reviews</p>
                        <p className="text-gray-600 text-sm">Get at least 5 reviews to unlock AI-powered insights and personalized recommendations.</p>
                      </div>
                    </div>
                  )}
                  {stats.activeAmbassadors < 10 && (
                    <div className="bg-white rounded-xl p-4 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                        {(stats.pendingReviews > 0 ? 1 : 0) + (stats.activeMissions === 0 ? 1 : 0) + ((!reviewStats || reviewStats.total < 5) ? 1 : 0) + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-900 font-semibold mb-1">Grow Your Ambassador Network</p>
                        <p className="text-gray-600 text-sm">You have {stats.activeAmbassadors} ambassadors. Aim for 10+ to maximize your local reach and impact.</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Performance Metrics Grid */}
          <div>
            <h3 className="font-bold text-lg text-[#1E0E62] mb-4">Key Metrics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Average Rating */}
              {reviewStats && reviewStats.total > 0 && (
                <div className="bg-white rounded-2xl p-4 border-2 border-gray-100">
                  <div className="flex items-center gap-2 mb-2 text-yellow-500">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-xs font-bold uppercase">Rating</span>
                  </div>
                  <div className="text-3xl font-bold text-[#1E0E62]">
                    {reviewStats.averageRating.toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">{reviewStats.total} reviews</div>
                </div>
              )}

              {/* Check-ins */}
              <div className="bg-white rounded-2xl p-4 border-2 border-gray-100">
                <div className="flex items-center gap-2 mb-2 text-teal-500">
                  <MapPin className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase">Check-ins</span>
                </div>
                <div className="text-3xl font-bold text-[#1E0E62]">{stats.storeCheckIns}</div>
                <div className="text-xs text-gray-600 mt-1">Total visits</div>
              </div>

              {/* Active Tribe */}
              <div className="bg-white rounded-2xl p-4 border-2 border-gray-100">
                <div className="flex items-center gap-2 mb-2 text-orange-500">
                  <Users className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase">Active Tribe</span>
                </div>
                <div className="text-3xl font-bold text-[#1E0E62]">{stats.activeAmbassadors}</div>
                <div className="text-xs text-gray-600 mt-1">{stats.totalApplications} total</div>
              </div>

              {/* Social Reach */}
              <div className="bg-white rounded-2xl p-4 border-2 border-gray-100">
                <div className="flex items-center gap-2 mb-2 text-blue-500">
                  <Zap className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase">Reach</span>
                </div>
                <div className="text-3xl font-bold text-[#1E0E62]">
                  {(stats.socialReach / 1000).toFixed(1)}k
                </div>
                <div className="text-xs text-gray-600 mt-1">Followers</div>
              </div>
            </div>
          </div>

          {/* What's Working Well */}
          {reviewInsights && reviewInsights.strengths.length > 0 && (
            <div className="bg-green-50 rounded-2xl p-6 border-2 border-green-200">
              <div className="flex items-center gap-2 mb-4">
                <ThumbsUp className="w-5 h-5 text-green-600" />
                <h3 className="font-bold text-lg text-green-900">What Customers Love</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {reviewInsights.strengths.slice(0, 4).map((strength, index) => (
                  <div key={index} className="flex items-start gap-2 text-green-800">
                    <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{strength}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Areas to Improve */}
          {reviewInsights && reviewInsights.improvements.length > 0 && (
            <div className="bg-orange-50 rounded-2xl p-6 border-2 border-orange-200">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                <h3 className="font-bold text-lg text-orange-900">Areas to Improve</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {reviewInsights.improvements.slice(0, 4).map((improvement, index) => (
                  <div key={index} className="flex items-start gap-2 text-orange-800">
                    <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{improvement}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Common Themes */}
          {reviewInsights && reviewInsights.commonThemes.length > 0 && (
            <div className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5 text-gray-700" />
                <h3 className="font-bold text-lg text-gray-900">What Customers Are Saying</h3>
              </div>
              <div className="space-y-3">
                {reviewInsights.commonThemes.slice(0, 3).map((theme, index) => (
                  <div key={index} className="bg-white rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{theme.theme}</h4>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          theme.sentiment === 'positive' ? 'bg-green-100 text-green-700' :
                          theme.sentiment === 'negative' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {theme.sentiment}
                        </span>
                        <span className="text-sm text-gray-600">{theme.mentions} mentions</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Collaboration Suggestions */}
          <AICollaborationSuggestionsCard
            businessId={businessId}
            businessName={businessName}
            city={businessCity}
            onMessageBusiness={(partnerBusinessId, partnerName) => {
              console.log('[BusinessInsights] Message partner:', partnerName);
              onNavigate?.(`/chat/${partnerBusinessId}`);
            }}
          />

          {/* Action Items */}
          <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-[#00E5FF]" />
              <h3 className="font-bold text-lg text-[#1E0E62]">Suggested Actions</h3>
            </div>
            <div className="space-y-3">
              {stats.pendingReviews > 0 && (
                <button
                  onClick={() => onNavigate?.('/missions')}
                  className="w-full p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl text-left hover:bg-yellow-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-yellow-600" />
                      <div>
                        <div className="font-semibold text-yellow-900">Review {stats.pendingReviews} Pending Submissions</div>
                        <div className="text-sm text-yellow-700">Approve completed missions</div>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-yellow-600" />
                  </div>
                </button>
              )}

              {stats.activeMissions === 0 && (
                <button
                  onClick={() => onNavigate?.('/missions')}
                  className="w-full p-4 bg-purple-50 border-2 border-purple-200 rounded-xl text-left hover:bg-purple-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Target className="w-5 h-5 text-purple-600" />
                      <div>
                        <div className="font-semibold text-purple-900">Create Your First Mission</div>
                        <div className="text-sm text-purple-700">Start engaging with customers</div>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-purple-600" />
                  </div>
                </button>
              )}

              {reviewStats && reviewStats.total < 5 && (
                <button
                  onClick={() => onNavigate?.('/reviews')}
                  className="w-full p-4 bg-blue-50 border-2 border-blue-200 rounded-xl text-left hover:bg-blue-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Star className="w-5 h-5 text-blue-600" />
                      <div>
                        <div className="font-semibold text-blue-900">Get More Reviews</div>
                        <div className="text-sm text-blue-700">Encourage customers to share feedback</div>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-blue-600" />
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* No Reviews State */}
          {(!reviewStats || reviewStats.total === 0) && (
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 border-2 border-gray-200 text-center">
              <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-700 mb-2">No Reviews Yet</h3>
              <p className="text-gray-600 mb-4">
                Start collecting customer feedback to unlock AI-powered insights
              </p>
              <button
                onClick={() => onNavigate?.('/missions')}
                className="px-6 py-3 bg-[#00E5FF] text-white rounded-xl font-semibold hover:bg-[#00C8E0] transition-colors"
              >
                Create Review Mission
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
