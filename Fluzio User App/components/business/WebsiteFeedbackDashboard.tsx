import React, { useState, useEffect } from 'react';
import { MessageSquare, TrendingDown, Lightbulb, Star, Filter, Calendar } from 'lucide-react';
import { getBusinessFeedback, getFeedbackStats, WebsiteFeedbackData } from '../../services/websiteFeedbackService';
import { formatDistanceToNow } from 'date-fns';

interface WebsiteFeedbackDashboardProps {
  businessId: string;
}

export const WebsiteFeedbackDashboard: React.FC<WebsiteFeedbackDashboardProps> = ({ businessId }) => {
  const [feedback, setFeedback] = useState<WebsiteFeedbackData[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState<number>(0); // 0 = all

  useEffect(() => {
    loadFeedback();
  }, [businessId]);

  const loadFeedback = async () => {
    setLoading(true);
    try {
      const [feedbackData, statsData] = await Promise.all([
        getBusinessFeedback(businessId),
        getFeedbackStats(businessId)
      ]);
      setFeedback(feedbackData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFeedback = filterRating === 0
    ? feedback
    : feedback.filter(f => f.rating === filterRating);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#00E5FF] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-purple-600 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Feedback</p>
                <p className="text-2xl font-bold text-[#1E0E62]">{stats.totalFeedback}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold text-[#1E0E62]">
                  {stats.averageRating.toFixed(1)} ⭐
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-emerald-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Recent Feedback</p>
                <p className="text-2xl font-bold text-[#1E0E62]">{stats.recentFeedback?.length || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-gray-500" />
          <p className="text-sm font-medium text-gray-700">Filter by rating:</p>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterRating(0)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                filterRating === 0
                  ? 'bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {[5, 4, 3, 2, 1].map((rating) => (
              <button
                key={rating}
                onClick={() => setFilterRating(rating)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  filterRating === rating
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {rating} ⭐
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Feedback List */}
      <div className="space-y-4">
        {filteredFeedback.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-600 mb-2">No feedback yet</h3>
            <p className="text-gray-500">
              Feedback will appear here when customers visit your website and share their thoughts.
            </p>
          </div>
        ) : (
          filteredFeedback.map((item, index) => (
            <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`text-2xl ${
                        star <= item.rating ? 'opacity-100' : 'opacity-20'
                      }`}
                    >
                      ⭐
                    </span>
                  ))}
                </div>
                <p className="text-sm text-gray-500">
                  {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                </p>
              </div>

              {/* What to Improve */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-4 h-4 text-orange-500" />
                  <p className="text-sm font-bold text-[#1E0E62]">What to Improve:</p>
                </div>
                <p className="text-gray-700 pl-6">{item.whatToImprove}</p>
              </div>

              {/* What's Needed */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-yellow-500" />
                  <p className="text-sm font-bold text-[#1E0E62]">What's Needed to Convert:</p>
                </div>
                <p className="text-gray-700 pl-6">{item.whatNeeded}</p>
              </div>

              {/* Anonymous Badge */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">
                  🔒 Anonymous Feedback
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
