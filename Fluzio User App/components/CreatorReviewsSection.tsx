/**
 * Creator Reviews Section Component
 * 
 * Displays creator reviews, ratings, and badges on their profile
 * Shows rating distribution, recent reviews, and response from creator
 */

import React, { useState, useEffect } from 'react';
import { 
  Star, 
  TrendingUp, 
  MessageSquare, 
  ThumbsUp, 
  Calendar,
  Award,
  CheckCircle,
  Shield
} from 'lucide-react';
import {
  getCreatorReviews,
  calculateCreatorRatingStats,
  getCreatorBadges,
  markReviewHelpful,
  CreatorReview,
  CreatorRatingStats,
  CreatorBadge
} from '../services/creatorReviewService';
// import { CreatorBadgesDisplay } from './CreatorBadges'; // TODO: Create this component

interface CreatorReviewsSectionProps {
  creatorId: string;
  creatorName: string;
}

export const CreatorReviewsSection: React.FC<CreatorReviewsSectionProps> = ({
  creatorId,
  creatorName
}) => {
  const [reviews, setReviews] = useState<CreatorReview[]>([]);
  const [stats, setStats] = useState<CreatorRatingStats | null>(null);
  const [badges, setBadges] = useState<CreatorBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 5 | 4 | 3 | 2 | 1>('all');

  useEffect(() => {
    loadReviewsAndStats();
  }, [creatorId]);

  const loadReviewsAndStats = async () => {
    try {
      setLoading(true);
      const [reviewsData, statsData, badgesData] = await Promise.all([
        getCreatorReviews(creatorId),
        calculateCreatorRatingStats(creatorId),
        getCreatorBadges(creatorId)
      ]);
      
      setReviews(reviewsData);
      setStats(statsData);
      setBadges(badgesData);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkHelpful = async (reviewId: string) => {
    try {
      await markReviewHelpful(reviewId);
      // Update local state
      setReviews(prev => prev.map(r => 
        r.id === reviewId ? { ...r, helpful: r.helpful + 1 } : r
      ));
    } catch (error) {
      console.error('Error marking review as helpful:', error);
    }
  };

  const filteredReviews = selectedFilter === 'all' 
    ? reviews 
    : reviews.filter(r => r.rating === selectedFilter);

  const formatDate = (timestamp: any): string => {
    if (!timestamp) return 'Recently';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-40 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!stats || stats.totalReviews === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reviews Yet</h3>
        <p className="text-gray-600">
          This creator hasn't received any reviews yet. Be the first to work with them!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rating Overview */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Reviews & Ratings</h2>
        
        {/* Badges */}
        {badges.length > 0 && (
          <div className="mb-6">
            {/* <CreatorBadgesDisplay badges={badges} /> */}
          </div>
        )}
        
        {/* Main Rating Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Left: Average Rating */}
          <div className="flex items-start gap-4">
            <div className="text-center">
              <div className="text-5xl font-bold text-gray-900">
                {stats.averageRating.toFixed(1)}
              </div>
              <div className="flex items-center justify-center gap-1 my-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star 
                    key={star}
                    className={`w-5 h-5 ${
                      star <= Math.round(stats.averageRating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-gray-600">
                {stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}
              </p>
              {stats.verifiedReviews > 0 && (
                <div className="flex items-center justify-center gap-1 mt-2 text-xs text-green-600">
                  <CheckCircle className="w-3 h-3" />
                  <span>{stats.verifiedReviews} verified</span>
                </div>
              )}
            </div>

            {/* Rating Distribution */}
            <div className="flex-1 space-y-2">
              {[5, 4, 3, 2, 1].map(rating => {
                const count = stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution];
                const percentage = (count / stats.totalReviews) * 100;
                
                return (
                  <div key={rating} className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 w-8">{rating}★</span>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-yellow-400 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Aspect Ratings */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 mb-3">Performance Breakdown</h3>
            
            {[
              { key: 'communication', label: 'Communication', icon: MessageSquare },
              { key: 'quality', label: 'Quality', icon: Award },
              { key: 'professionalism', label: 'Professionalism', icon: Shield },
              { key: 'timeliness', label: 'Timeliness', icon: Calendar }
            ].map(aspect => {
              const rating = stats.aspectRatings[aspect.key as keyof typeof stats.aspectRatings];
              const Icon = aspect.icon;
              
              return (
                <div key={aspect.key} className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700 flex-1">{aspect.label}</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-semibold text-gray-900">
                      {rating.toFixed(1)}
                    </span>
                  </div>
                </div>
              );
            })}
            
            {/* Would Hire Again */}
            <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-900">Would Hire Again</span>
                <span className="text-lg font-bold text-green-700">
                  {Math.round(stats.wouldHireAgainPercentage)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedFilter === 'all'
                ? 'bg-[#6C4BFF] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({stats.totalReviews})
          </button>
          {[5, 4, 3, 2, 1].map(rating => {
            const count = stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution];
            if (count === 0) return null;
            
            return (
              <button
                key={rating}
                onClick={() => setSelectedFilter(rating as 5 | 4 | 3 | 2 | 1)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  selectedFilter === rating
                    ? 'bg-[#6C4BFF] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {rating}★ ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <p className="text-gray-600">No reviews match your filter</p>
          </div>
        ) : (
          filteredReviews.map(review => (
            <div key={review.id} className="bg-white rounded-xl shadow-sm p-6">
              {/* Review Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900">{review.businessName}</h4>
                    {review.verified && (
                      <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        Verified
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>{formatDate(review.createdAt)}</span>
                    {review.projectTitle && (
                      <>
                        <span>•</span>
                        <span className="text-gray-600">{review.projectTitle}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star 
                      key={star}
                      className={`w-4 h-4 ${
                        star <= review.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Review Text */}
              <p className="text-gray-700 mb-3">{review.reviewText}</p>

              {/* Would Hire Again Badge */}
              {review.wouldHireAgain && (
                <div className="inline-flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-1 rounded-full mb-3">
                  <TrendingUp className="w-4 h-4" />
                  Would hire again
                </div>
              )}

              {/* Creator Response */}
              {review.response && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border-l-4 border-[#6C4BFF]">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-[#6C4BFF]" />
                    <span className="text-sm font-medium text-gray-900">Response from {creatorName}</span>
                  </div>
                  <p className="text-sm text-gray-700">{review.response}</p>
                </div>
              )}

              {/* Helpful Button */}
              <div className="mt-4 flex items-center gap-4 pt-3 border-t border-gray-100">
                <button
                  onClick={() => handleMarkHelpful(review.id)}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#6C4BFF] transition-colors"
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>Helpful ({review.helpful})</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
