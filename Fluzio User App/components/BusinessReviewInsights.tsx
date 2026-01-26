/**
 * Business Review Insights - AI-Powered Review Analysis Dashboard
 * Shows sentiment analysis, themes, strengths, improvements, and recommendations
 */

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Lightbulb, 
  ThumbsUp, 
  AlertCircle,
  MessageSquare,
  Brain,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { analyzeReviewsWithAI, ReviewInsights } from '../services/reviewService';

interface BusinessReviewInsightsProps {
  businessId: string;
  businessName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const BusinessReviewInsights: React.FC<BusinessReviewInsightsProps> = ({
  businessId,
  businessName,
  isOpen,
  onClose
}) => {
  const [insights, setInsights] = useState<ReviewInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && businessId) {
      loadInsights();
    }
  }, [isOpen, businessId]);

  const loadInsights = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await analyzeReviewsWithAI(businessId);
      if (data) {
        setInsights(data);
      } else {
        setError('No reviews available for analysis');
      }
    } catch (err) {
      console.error('Error loading insights:', err);
      setError('Failed to analyze reviews');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-50 border-green-200';
      case 'negative': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'declining': return <TrendingDown className="w-5 h-5 text-red-500" />;
      default: return <Minus className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTrendText = (trend: string) => {
    switch (trend) {
      case 'improving': return 'Improving';
      case 'declining': return 'Declining';
      default: return 'Stable';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Brain className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Review Insights</h2>
                <p className="text-purple-100 text-sm">{businessName}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={loadInsights}
                disabled={loading}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Refresh analysis"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors text-2xl leading-none"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-purple-600 animate-spin mb-4" />
              <p className="text-gray-600">Analyzing reviews with AI...</p>
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <p className="text-gray-600">{error}</p>
            </div>
          )}

          {insights && !loading && (
            <div className="space-y-6">
              {/* Overall Sentiment */}
              <div className={`p-6 rounded-2xl border-2 ${getSentimentColor(insights.overallSentiment)}`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold mb-1">Overall Sentiment</h3>
                    <p className="text-sm opacity-80">Based on all customer reviews</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(insights.trendingSentiment)}
                    <span className="font-semibold">{getTrendText(insights.trendingSentiment)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-5xl font-bold">{insights.sentimentScore}%</div>
                  <div className="flex-1">
                    <div className="h-4 bg-white/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-current rounded-full transition-all"
                        style={{ width: `${insights.sentimentScore}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Common Themes */}
              {insights.commonThemes.length > 0 && (
                <div className="bg-gray-50 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <MessageSquare className="w-5 h-5 text-gray-700" />
                    <h3 className="text-lg font-bold text-gray-900">Common Themes</h3>
                  </div>
                  <div className="space-y-3">
                    {insights.commonThemes.map((theme, index) => (
                      <div key={index} className="bg-white rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">{theme.theme}</h4>
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSentimentColor(theme.sentiment)}`}>
                              {theme.sentiment}
                            </span>
                            <span className="text-sm text-gray-600">{theme.mentions} mentions</span>
                          </div>
                        </div>
                        {theme.examples.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {theme.examples.slice(0, 2).map((example, i) => (
                              <p key={i} className="text-sm text-gray-600 italic">"{example}"</p>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Strengths & Improvements */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Strengths */}
                {insights.strengths.length > 0 && (
                  <div className="bg-green-50 rounded-2xl p-6 border-2 border-green-200">
                    <div className="flex items-center gap-2 mb-4">
                      <ThumbsUp className="w-5 h-5 text-green-600" />
                      <h3 className="text-lg font-bold text-green-900">What Customers Love</h3>
                    </div>
                    <ul className="space-y-2">
                      {insights.strengths.map((strength, index) => (
                        <li key={index} className="flex items-start gap-2 text-green-800">
                          <span className="text-green-600 mt-1">✓</span>
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Improvements */}
                {insights.improvements.length > 0 && (
                  <div className="bg-orange-50 rounded-2xl p-6 border-2 border-orange-200">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertCircle className="w-5 h-5 text-orange-600" />
                      <h3 className="text-lg font-bold text-orange-900">Areas to Improve</h3>
                    </div>
                    <ul className="space-y-2">
                      {insights.improvements.map((improvement, index) => (
                        <li key={index} className="flex items-start gap-2 text-orange-800">
                          <span className="text-orange-600 mt-1">→</span>
                          <span>{improvement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Actionable Recommendations */}
              {insights.actionableRecommendations.length > 0 && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200">
                  <div className="flex items-center gap-2 mb-4">
                    <Lightbulb className="w-6 h-6 text-purple-600" />
                    <h3 className="text-lg font-bold text-purple-900">AI Recommendations</h3>
                  </div>
                  <div className="space-y-3">
                    {insights.actionableRecommendations.map((rec, index) => (
                      <div key={index} className="bg-white rounded-xl p-4 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                          {index + 1}
                        </div>
                        <p className="text-gray-900 flex-1">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Quotes */}
              {insights.keyQuotes.length > 0 && (
                <div className="bg-gray-50 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Notable Reviews</h3>
                  <div className="space-y-3">
                    {insights.keyQuotes.map((quote, index) => (
                      <div key={index} className="bg-white rounded-xl p-4 border-l-4 border-purple-500">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={i < quote.rating ? 'text-yellow-400' : 'text-gray-300'}>
                                ★
                              </span>
                            ))}
                          </div>
                          <span className="text-sm text-gray-600">• {quote.theme}</span>
                        </div>
                        <p className="text-gray-900 italic">"{quote.text}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Disclaimer */}
              <div className="text-center text-sm text-gray-500 pt-4 border-t">
                <p>✨ Insights powered by AI • Based on customer reviews • Updated in real-time</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
