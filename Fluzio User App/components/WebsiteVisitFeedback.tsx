import React, { useState } from 'react';
import { X, MessageSquare, TrendingUp, Lightbulb, Send, CheckCircle } from 'lucide-react';

interface WebsiteVisitFeedbackProps {
  businessId: string;
  businessName: string;
  businessLogo?: string;
  missionId: string;
  onClose: () => void;
  onSubmit: (feedback: WebsiteFeedback) => Promise<void>;
}

export interface WebsiteFeedback {
  businessId: string;
  missionId: string;
  rating: number;
  whatToImprove: string;
  whatNeeded: string;
  timestamp: Date;
}

export const WebsiteVisitFeedback: React.FC<WebsiteVisitFeedbackProps> = ({
  businessId,
  businessName,
  businessLogo,
  missionId,
  onClose,
  onSubmit
}) => {
  const [rating, setRating] = useState<number>(0);
  const [whatToImprove, setWhatToImprove] = useState('');
  const [whatNeeded, setWhatNeeded] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0 || !whatToImprove.trim() || !whatNeeded.trim()) {
      alert('Please complete all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        businessId,
        missionId,
        rating,
        whatToImprove: whatToImprove.trim(),
        whatNeeded: whatNeeded.trim(),
        timestamp: new Date()
      });
      setSubmitted(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-[#1E0E62] mb-2">Thank You!</h2>
          <p className="text-gray-600 mb-4">
            Your honest feedback has been submitted and you've earned <span className="font-bold text-[#00E5FF]">+50 points</span>!
          </p>
          <p className="text-sm text-gray-500">
            {businessName} will review your feedback to improve their service.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white p-6 rounded-t-3xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Share Your Honest Feedback</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            {businessLogo && (
              <img
                src={businessLogo}
                alt={businessName}
                className="w-12 h-12 rounded-full border-2 border-white"
              />
            )}
            <div>
              <p className="text-sm opacity-90">Feedback for</p>
              <p className="font-bold text-lg">{businessName}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Points Reward Banner */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-[#1E0E62]">Earn +50 Points</p>
                <p className="text-sm text-gray-600">Complete this feedback to earn bonus points!</p>
              </div>
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-bold text-[#1E0E62] mb-2">
              Overall Experience
            </label>
            <p className="text-sm text-gray-600 mb-3">
              How was your experience visiting their website?
            </p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all ${
                    star <= rating
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-500 scale-110 shadow-lg'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  ⭐
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-gray-500 mt-2">
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </p>
            )}
          </div>

          {/* What to Improve */}
          <div>
            <label className="block text-sm font-bold text-[#1E0E62] mb-2 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#00E5FF]" />
              What would you improve?
            </label>
            <p className="text-sm text-gray-600 mb-3">
              Share your honest thoughts on what could be better about their website or offering.
            </p>
            <textarea
              value={whatToImprove}
              onChange={(e) => setWhatToImprove(e.target.value)}
              placeholder="E.g., The website was hard to navigate, I couldn't find pricing information, the images were low quality..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent resize-none"
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              {whatToImprove.length}/500
            </p>
          </div>

          {/* What's Needed */}
          <div>
            <label className="block text-sm font-bold text-[#1E0E62] mb-2 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-[#00E5FF]" />
              What do you need to become a customer?
            </label>
            <p className="text-sm text-gray-600 mb-3">
              Tell them what would make you actually buy from them or visit their store.
            </p>
            <textarea
              value={whatNeeded}
              onChange={(e) => setWhatNeeded(e.target.value)}
              placeholder="E.g., Better prices, more product variety, clearer return policy, a physical store near me, free shipping..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent resize-none"
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              {whatNeeded.length}/500
            </p>
          </div>

          {/* Privacy Notice */}
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <p className="text-sm text-gray-700">
              <span className="font-bold text-[#6C4BFF]">🔒 Your feedback is anonymous</span>
              <br />
              The business will receive your feedback but won't see your name or profile.
              This encourages honest, constructive criticism.
            </p>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0 || !whatToImprove.trim() || !whatNeeded.trim()}
            className="w-full bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white px-6 py-4 rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Submit Feedback & Earn +50 Points
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
