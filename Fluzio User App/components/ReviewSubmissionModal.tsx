import React, { useState } from 'react';
import { X, Star, Camera, Upload, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { submitReview, ReviewSubmission } from '../services/reviewService';

interface ReviewSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  businessId: string;
  businessName: string;
  businessLogo?: string;
  checkInId?: string;
  onReviewSubmitted?: (reviewId: string) => void;
}

export const ReviewSubmissionModal: React.FC<ReviewSubmissionModalProps> = ({
  isOpen,
  onClose,
  userId,
  businessId,
  businessName,
  businessLogo,
  checkInId,
  onReviewSubmitted
}) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + photos.length > 5) {
      setError('Maximum 5 photos allowed');
      return;
    }

    setPhotos([...photos, ...files]);

    // Create previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
    setPhotoPreview(photoPreview.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (reviewText.trim().length < 10) {
      setError('Review must be at least 10 characters');
      return;
    }

    setSubmitting(true);
    setError('');

    const submission: ReviewSubmission = {
      userId,
      businessId,
      rating,
      reviewText,
      photos,
      checkInId
    };

    const result = await submitReview(submission);

    setSubmitting(false);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        onReviewSubmitted?.(result.reviewId!);
        onClose();
        // Reset form
        setRating(0);
        setReviewText('');
        setPhotos([]);
        setPhotoPreview([]);
        setSuccess(false);
      }, 2000);
    } else {
      setError(result.error || 'Failed to submit review');
    }
  };

  if (!isOpen) return null;

  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {success ? (
          // Success State
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-[#1E0E62] mb-2">Review Submitted! 🎉</h2>
            <p className="text-gray-600 mb-4">
              Thank you for sharing your experience with {businessName}
            </p>
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl p-4">
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-600" />
                <p className="font-bold text-[#1E0E62]">+{photos.length > 0 ? '150' : '100'} Points Earned!</p>
              </div>
            </div>
          </div>
        ) : (
          // Review Form
          <>
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white p-6 rounded-t-3xl">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-4">
                {businessLogo && (
                  <img 
                    src={businessLogo} 
                    alt={businessName}
                    className="w-16 h-16 rounded-2xl object-cover border-4 border-white/20"
                  />
                )}
                <div>
                  <h2 className="text-2xl font-bold mb-1">Write a Review</h2>
                  <p className="text-white/90">{businessName}</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Reward Banner */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-[#1E0E62]">
                      Earn {photos.length > 0 ? '150' : '100'} Points
                    </p>
                    <p className="text-sm text-gray-600">
                      {photos.length > 0 ? 'Review with photos!' : 'Add photos for +50 bonus points'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-bold text-[#1E0E62] mb-3">
                  How was your experience? *
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl transition-all transform ${
                        star <= (hoverRating || rating)
                          ? 'bg-gradient-to-r from-yellow-400 to-orange-500 scale-110 shadow-lg'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      <Star 
                        className={`w-8 h-8 ${
                          star <= (hoverRating || rating) 
                            ? 'fill-white text-white' 
                            : 'text-gray-400'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {(hoverRating || rating) > 0 && (
                  <p className="text-sm text-gray-600 mt-2 font-medium">
                    {ratingLabels[hoverRating || rating]}
                  </p>
                )}
              </div>

              {/* Review Text */}
              <div>
                <label className="block text-sm font-bold text-[#1E0E62] mb-2">
                  Share your experience *
                </label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="What did you like? What could be improved? Share your honest feedback..."
                  className="w-full h-32 px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-[#00E5FF] focus:outline-none resize-none"
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {reviewText.length}/500 characters (min. 10)
                </p>
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-bold text-[#1E0E62] mb-2">
                  Add Photos (Optional)
                </label>
                <p className="text-xs text-gray-600 mb-3">
                  📸 Add photos for +50 bonus points! (Max 5 photos)
                </p>

                {/* Photo Previews */}
                {photoPreview.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {photoPreview.map((preview, index) => (
                      <div key={index} className="relative">
                        <img 
                          src={preview} 
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-xl"
                        />
                        <button
                          onClick={() => removePhoto(index)}
                          className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Button */}
                {photos.length < 5 && (
                  <label className="flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-[#00E5FF] hover:bg-blue-50/50 transition-colors">
                    <Camera className="w-5 h-5 text-gray-500" />
                    <span className="text-sm font-medium text-gray-600">
                      {photos.length === 0 ? 'Add Photos' : `Add More (${5 - photos.length} remaining)`}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border-2 border-red-200 rounded-2xl">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={submitting || rating === 0 || reviewText.trim().length < 10}
                className="w-full py-4 bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white font-bold rounded-2xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Submit Review
                  </>
                )}
              </button>

              <p className="text-xs text-center text-gray-500">
                Your review will be visible on {businessName}'s profile
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
