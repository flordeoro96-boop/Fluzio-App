/**
 * Creator Review Submission Modal Component
 * 
 * Allows businesses to submit reviews for creators after project completion
 * Includes ratings for multiple aspects and text feedback
 */

import React, { useState } from 'react';
import { X, Star, Send, Loader, AlertCircle } from 'lucide-react';
import { submitCreatorReview } from '../services/creatorReviewService';
import { useAuth } from '../services/AuthContext';

interface CreatorReviewSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  creatorId: string;
  creatorName: string;
  projectId: string;
  projectTitle?: string;
  onSubmitSuccess?: () => void;
}

interface RatingAspect {
  key: 'rating' | 'communication' | 'quality' | 'professionalism' | 'timeliness';
  label: string;
  description: string;
}

const ratingAspects: RatingAspect[] = [
  {
    key: 'rating',
    label: 'Overall Rating',
    description: 'Your overall experience working with this creator'
  },
  {
    key: 'communication',
    label: 'Communication',
    description: 'Responsiveness and clarity of communication'
  },
  {
    key: 'quality',
    label: 'Quality of Work',
    description: 'Quality and attention to detail in deliverables'
  },
  {
    key: 'professionalism',
    label: 'Professionalism',
    description: 'Professional conduct and work ethic'
  },
  {
    key: 'timeliness',
    label: 'Timeliness',
    description: 'Met deadlines and delivered on time'
  }
];

export const CreatorReviewSubmissionModal: React.FC<CreatorReviewSubmissionModalProps> = ({
  isOpen,
  onClose,
  creatorId,
  creatorName,
  projectId,
  projectTitle,
  onSubmitSuccess
}) => {
  const { userProfile } = useAuth();
  const [ratings, setRatings] = useState({
    rating: 0,
    communication: 0,
    quality: 0,
    professionalism: 0,
    timeliness: 0
  });
  const [reviewText, setReviewText] = useState('');
  const [wouldHireAgain, setWouldHireAgain] = useState(false);
  const [hoveredRating, setHoveredRating] = useState<{ [key: string]: number }>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleRatingClick = (aspect: string, value: number) => {
    setRatings(prev => ({ ...prev, [aspect]: value }));
  };

  const handleSubmit = async () => {
    try {
      // Validation
      if (ratings.rating === 0) {
        setError('Please provide an overall rating');
        return;
      }
      
      if (ratings.communication === 0 || ratings.quality === 0 || 
          ratings.professionalism === 0 || ratings.timeliness === 0) {
        setError('Please rate all aspects');
        return;
      }
      
      if (reviewText.trim().length < 20) {
        setError('Please write at least 20 characters in your review');
        return;
      }
      
      setSubmitting(true);
      setError('');
      
      await submitCreatorReview({
        creatorId,
        creatorName,
        businessId: userProfile?.uid || '',
        businessName: userProfile?.businessName || userProfile?.name || 'Anonymous Business',
        projectId,
        projectTitle,
        rating: ratings.rating,
        communication: ratings.communication,
        quality: ratings.quality,
        professionalism: ratings.professionalism,
        timeliness: ratings.timeliness,
        reviewText: reviewText.trim(),
        wouldHireAgain
      });
      
      // Success
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
      
      // Reset and close
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setRatings({
        rating: 0,
        communication: 0,
        quality: 0,
        professionalism: 0,
        timeliness: 0
      });
      setReviewText('');
      setWouldHireAgain(false);
      setError('');
      onClose();
    }
  };

  const isFormValid = () => {
    return ratings.rating > 0 &&
      ratings.communication > 0 &&
      ratings.quality > 0 &&
      ratings.professionalism > 0 &&
      ratings.timeliness > 0 &&
      reviewText.trim().length >= 20;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Write a Review</h2>
            <p className="text-sm text-gray-600 mt-1">
              For {creatorName} {projectTitle && `• ${projectTitle}`}
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={submitting}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Rating Aspects */}
          <div className="space-y-5">
            {ratingAspects.map(aspect => {
              const currentRating = ratings[aspect.key];
              const hovered = hoveredRating[aspect.key] || 0;
              const displayRating = hovered || currentRating;
              
              return (
                <div key={aspect.key} className="space-y-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{aspect.label}</h3>
                    <p className="text-xs text-gray-600">{aspect.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleRatingClick(aspect.key, star)}
                        onMouseEnter={() => setHoveredRating(prev => ({ ...prev, [aspect.key]: star }))}
                        onMouseLeave={() => setHoveredRating(prev => ({ ...prev, [aspect.key]: 0 }))}
                        className="transition-transform hover:scale-110 focus:outline-none"
                        disabled={submitting}
                      >
                        <Star
                          className={`w-8 h-8 transition-colors ${
                            star <= displayRating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300 hover:text-yellow-200'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      {currentRating > 0 ? `${currentRating}.0` : 'Not rated'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Review Text */}
          <div className="space-y-2">
            <label className="block font-semibold text-gray-900">
              Your Review
            </label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your experience working with this creator. What did they do well? Any areas for improvement?"
              disabled={submitting}
              className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6C4BFF] focus:border-transparent resize-none disabled:opacity-50"
              maxLength={1000}
            />
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{reviewText.length}/1000 characters</span>
              <span className={reviewText.length >= 20 ? 'text-green-600' : 'text-red-600'}>
                {reviewText.length < 20 ? `${20 - reviewText.length} more characters needed` : '✓ Minimum reached'}
              </span>
            </div>
          </div>

          {/* Would Hire Again */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="wouldHireAgain"
              checked={wouldHireAgain}
              onChange={(e) => setWouldHireAgain(e.target.checked)}
              disabled={submitting}
              className="w-5 h-5 text-[#6C4BFF] border-gray-300 rounded focus:ring-[#6C4BFF] disabled:opacity-50"
            />
            <label htmlFor="wouldHireAgain" className="flex-1 cursor-pointer">
              <span className="font-medium text-gray-900">I would hire this creator again</span>
              <p className="text-xs text-gray-600 mt-0.5">
                Recommend this creator to other businesses on Beevvy
              </p>
            </label>
          </div>

          {/* Guidelines */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">Review Guidelines</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Be honest and constructive</li>
              <li>• Focus on your working experience</li>
              <li>• Avoid personal attacks or discriminatory language</li>
              <li>• Reviews are public and cannot be edited after submission</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex items-center justify-end gap-3">
          <button
            onClick={handleClose}
            disabled={submitting}
            className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isFormValid() || submitting}
            className="px-6 py-2 bg-[#6C4BFF] text-white rounded-lg hover:bg-[#5a3dd9] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Review</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
