/**
 * Review Service - Internal Beevvy Reviews
 * Handles customer reviews with ratings, photos, and AI analysis
 */

import { db } from './apiService';
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  increment
} from '../services/firestoreCompat';
import { getStorage, ref, uploadBytes, getDownloadURL } from '../services/storageCompat';

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  businessId: string;
  businessName: string;
  rating: number; // 1-5 stars
  reviewText: string;
  photos?: string[]; // Photo URLs
  checkInId?: string; // Verification that user checked in
  helpful: number; // Upvote count
  response?: {
    text: string;
    businessName: string;
    timestamp: Date;
  };
  createdAt: Date;
  updatedAt: Date;
  status: 'ACTIVE' | 'FLAGGED' | 'HIDDEN';
}

export interface ReviewSubmission {
  userId: string;
  businessId: string;
  rating: number;
  reviewText: string;
  photos?: File[];
  checkInId?: string;
}

/**
 * Submit a new review after check-in
 */
export const submitReview = async (submission: ReviewSubmission): Promise<{ success: boolean; reviewId?: string; error?: string }> => {
  try {
    const { userId, businessId, rating, reviewText, photos, checkInId } = submission;

    // Validate rating
    if (rating < 1 || rating > 5) {
      return { success: false, error: 'Rating must be between 1 and 5 stars' };
    }

    // Validate review text
    if (!reviewText || reviewText.trim().length < 10) {
      return { success: false, error: 'Review must be at least 10 characters' };
    }

    // Verify check-in if provided
    if (checkInId) {
      const checkInDoc = await getDoc(doc(db, 'checkIns', checkInId));
      if (!checkInDoc.exists() || checkInDoc.data().userId !== userId || checkInDoc.data().businessId !== businessId) {
        return { success: false, error: 'Invalid check-in verification' };
      }
    }

    // Check if user already reviewed this business
    const existingReviewQuery = query(
      collection(db, 'reviews'),
      where('userId', '==', userId),
      where('businessId', '==', businessId),
      where('status', '==', 'ACTIVE')
    );
    const existingReviews = await getDocs(existingReviewQuery);
    
    if (!existingReviews.empty) {
      return { success: false, error: 'You have already reviewed this business' };
    }

    // Get user info
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();

    // Get business info
    const businessDoc = await getDoc(doc(db, 'users', businessId));
    const businessData = businessDoc.data();

    // Upload photos if provided
    let photoUrls: string[] = [];
    if (photos && photos.length > 0) {
      const storage = getStorage();
      const uploadPromises = photos.map(async (photo) => {
        const timestamp = Date.now();
        const storageRef = ref(storage, `reviews/${businessId}/${userId}/${timestamp}_${photo.name}`);
        await uploadBytes(storageRef, photo);
        return await getDownloadURL(storageRef);
      });
      photoUrls = await Promise.all(uploadPromises);
    }

    // Create review document
    const reviewData = {
      userId,
      userName: userData?.displayName || userData?.name || 'Anonymous',
      userAvatar: userData?.avatar || userData?.photoURL,
      businessId,
      businessName: businessData?.businessName || businessData?.displayName || 'Business',
      rating,
      reviewText: reviewText.trim(),
      photos: photoUrls,
      checkInId: checkInId || null,
      helpful: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      status: 'ACTIVE'
    };

    const reviewRef = await addDoc(collection(db, 'reviews'), reviewData);

    // Update business stats
    await updateBusinessRating(businessId);

    // Track user activity
    await updateDoc(doc(db, 'users', userId), {
      reviewsWritten: increment(1),
      lastReviewAt: Timestamp.now()
    });

    // Check for active review missions and auto-complete
    await checkAndCompleteMissions(userId, businessId, reviewRef.id, photoUrls.length > 0);

    console.log('[ReviewService] ✅ Review submitted:', reviewRef.id);

    return { success: true, reviewId: reviewRef.id };

  } catch (error) {
    console.error('[ReviewService] Error submitting review:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to submit review' 
    };
  }
};

/**
 * Get all reviews for a business
 */
export const getBusinessReviews = async (
  businessId: string,
  options?: {
    minRating?: number;
    withPhotos?: boolean;
    limit?: number;
  }
): Promise<Review[]> => {
  try {
    let q = query(
      collection(db, 'reviews'),
      where('businessId', '==', businessId),
      where('status', '==', 'ACTIVE'),
      orderBy('createdAt', 'desc')
    );

    if (options?.limit) {
      q = query(q, limit(options.limit));
    }

    const snapshot = await getDocs(q);
    let reviews = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
      response: doc.data().response ? {
        ...doc.data().response,
        timestamp: doc.data().response.timestamp?.toDate()
      } : undefined
    })) as Review[];

    // Filter by rating if specified
    if (options?.minRating) {
      reviews = reviews.filter(r => r.rating >= options.minRating!);
    }

    // Filter by photos if specified
    if (options?.withPhotos) {
      reviews = reviews.filter(r => r.photos && r.photos.length > 0);
    }

    return reviews;

  } catch (error) {
    console.error('[ReviewService] Error getting reviews:', error);
    return [];
  }
};

/**
 * Get reviews by a specific user
 */
export const getUserReviews = async (userId: string): Promise<Review[]> => {
  try {
    const q = query(
      collection(db, 'reviews'),
      where('userId', '==', userId),
      where('status', '==', 'ACTIVE'),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    })) as Review[];

  } catch (error) {
    console.error('[ReviewService] Error getting user reviews:', error);
    return [];
  }
};

/**
 * Check if user has reviewed a business
 */
export const hasUserReviewed = async (userId: string, businessId: string): Promise<boolean> => {
  try {
    const q = query(
      collection(db, 'reviews'),
      where('userId', '==', userId),
      where('businessId', '==', businessId),
      where('status', '==', 'ACTIVE')
    );

    const snapshot = await getDocs(q);
    return !snapshot.empty;

  } catch (error) {
    console.error('[ReviewService] Error checking review status:', error);
    return false;
  }
};

/**
 * Update business average rating
 */
export const updateBusinessRating = async (businessId: string): Promise<void> => {
  try {
    const reviews = await getBusinessReviews(businessId);
    
    if (reviews.length === 0) {
      await updateDoc(doc(db, 'users', businessId), {
        averageRating: 0,
        reviewCount: 0
      });
      return;
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    await updateDoc(doc(db, 'users', businessId), {
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      reviewCount: reviews.length,
      lastReviewedAt: Timestamp.now()
    });

    console.log(`[ReviewService] Updated rating for ${businessId}: ${averageRating.toFixed(1)} (${reviews.length} reviews)`);

  } catch (error) {
    console.error('[ReviewService] Error updating rating:', error);
  }
};

/**
 * Business responds to a review
 */
export const respondToReview = async (
  reviewId: string,
  businessId: string,
  responseText: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const reviewDoc = await getDoc(doc(db, 'reviews', reviewId));
    
    if (!reviewDoc.exists()) {
      return { success: false, error: 'Review not found' };
    }

    if (reviewDoc.data().businessId !== businessId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get business info
    const businessDoc = await getDoc(doc(db, 'users', businessId));
    const businessName = businessDoc.data()?.businessName || 'Business';

    await updateDoc(doc(db, 'reviews', reviewId), {
      response: {
        text: responseText.trim(),
        businessName,
        timestamp: Timestamp.now()
      },
      updatedAt: Timestamp.now()
    });

    return { success: true };

  } catch (error) {
    console.error('[ReviewService] Error responding to review:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to respond' 
    };
  }
};

/**
 * Mark review as helpful
 */
export const markReviewHelpful = async (reviewId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'reviews', reviewId), {
      helpful: increment(1)
    });
  } catch (error) {
    console.error('[ReviewService] Error marking helpful:', error);
  }
};

/**
 * Flag a review
 */
export const flagReview = async (
  reviewId: string,
  reason: string
): Promise<{ success: boolean }> => {
  try {
    await updateDoc(doc(db, 'reviews', reviewId), {
      status: 'FLAGGED',
      flagReason: reason,
      flaggedAt: Timestamp.now()
    });

    return { success: true };

  } catch (error) {
    console.error('[ReviewService] Error flagging review:', error);
    return { success: false };
  }
};

/**
 * Check and complete review missions
 */
const checkAndCompleteMissions = async (
  userId: string,
  businessId: string,
  reviewId: string,
  hasPhotos: boolean
): Promise<void> => {
  try {
    // Check for WRITE_REVIEW_APP missions
    const reviewMissionQuery = query(
      collection(db, 'missions'),
      where('businessId', '==', businessId),
      where('type', '==', 'WRITE_REVIEW_APP'),
      where('status', '==', 'active')
    );
    const reviewMissions = await getDocs(reviewMissionQuery);

    // Check for REVIEW_WITH_PHOTO_APP missions
    const photoReviewMissionQuery = query(
      collection(db, 'missions'),
      where('businessId', '==', businessId),
      where('type', '==', 'REVIEW_WITH_PHOTO_APP'),
      where('status', '==', 'active')
    );
    const photoReviewMissions = await getDocs(photoReviewMissionQuery);

    // Complete photo review mission first if applicable (higher reward)
    if (hasPhotos && !photoReviewMissions.empty) {
      for (const missionDoc of photoReviewMissions.docs) {
        await completeMission(userId, businessId, missionDoc.id, reviewId, 150, true);
      }
    } 
    // Otherwise complete regular review mission
    else if (!reviewMissions.empty) {
      for (const missionDoc of reviewMissions.docs) {
        await completeMission(userId, businessId, missionDoc.id, reviewId, 100, false);
      }
    }

  } catch (error) {
    console.error('[ReviewService] Error checking missions:', error);
  }
};

/**
 * Complete a mission and award points
 */
const completeMission = async (
  userId: string,
  businessId: string,
  missionId: string,
  reviewId: string,
  points: number,
  hasPhoto: boolean
): Promise<void> => {
  try {
    // Check if user already completed this mission
    const existingParticipationQuery = query(
      collection(db, 'participations'),
      where('userId', '==', userId),
      where('missionId', '==', missionId),
      where('status', 'in', ['COMPLETED', 'PENDING'])
    );
    const existingParticipations = await getDocs(existingParticipationQuery);
    
    if (!existingParticipations.empty) {
      console.log('[ReviewService] User already participated in this mission');
      return;
    }

    // Create participation
    await addDoc(collection(db, 'participations'), {
      userId,
      businessId,
      missionId,
      status: 'COMPLETED',
      reviewId,
      hasPhoto,
      pointsEarned: points,
      submittedAt: Timestamp.now(),
      completedAt: Timestamp.now()
    });

    // Award points
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      points: increment(points),
      totalPointsEarned: increment(points)
    });

    // Create points transaction
    await addDoc(collection(db, 'pointsTransactions'), {
      userId,
      amount: points,
      type: 'EARN',
      reason: hasPhoto ? 'Review with Photo Completed' : 'Review Completed',
      missionId,
      createdAt: Timestamp.now()
    });

    // Send notification
    await addDoc(collection(db, 'notifications'), {
      userId,
      type: 'MISSION_COMPLETED',
      title: '🎉 Mission Completed!',
      message: `You earned ${points} points for writing a ${hasPhoto ? 'photo ' : ''}review!`,
      read: false,
      createdAt: Timestamp.now()
    });

    console.log(`[ReviewService] ✅ Mission ${missionId} completed for user ${userId}, +${points} points`);

  } catch (error) {
    console.error('[ReviewService] Error completing mission:', error);
  }
};

/**
 * Get review statistics for a business
 */
export const getReviewStats = async (businessId: string) => {
  try {
    const reviews = await getBusinessReviews(businessId);

    const stats = {
      total: reviews.length,
      averageRating: 0,
      ratingDistribution: {
        5: 0,
        4: 0,
        3: 0,
        2: 0,
        1: 0
      },
      withPhotos: reviews.filter(r => r.photos && r.photos.length > 0).length,
      recentCount: reviews.filter(r => {
        const daysSince = (Date.now() - r.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        return daysSince <= 30;
      }).length
    };

    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      stats.averageRating = Math.round((totalRating / reviews.length) * 10) / 10;

      reviews.forEach(review => {
        stats.ratingDistribution[review.rating as keyof typeof stats.ratingDistribution]++;
      });
    }

    return stats;

  } catch (error) {
    console.error('[ReviewService] Error getting stats:', error);
    return null;
  }
};

/**
 * AI Review Analysis - Analyze reviews to provide business insights
 */
export interface ReviewInsights {
  overallSentiment: 'positive' | 'neutral' | 'negative';
  sentimentScore: number; // 0-100
  commonThemes: {
    theme: string;
    mentions: number;
    sentiment: 'positive' | 'neutral' | 'negative';
    examples: string[];
  }[];
  strengths: string[]; // What customers love
  improvements: string[]; // What needs work
  actionableRecommendations: string[];
  keyQuotes: {
    text: string;
    rating: number;
    theme: string;
  }[];
  trendingSentiment: 'improving' | 'stable' | 'declining';
}

export const analyzeReviewsWithAI = async (businessId: string): Promise<ReviewInsights | null> => {
  try {
    console.log('[ReviewService] Starting AI analysis for business:', businessId);

    // Get all reviews for the business
    const reviews = await getBusinessReviews(businessId);

    if (reviews.length === 0) {
      console.log('[ReviewService] No reviews to analyze');
      return null;
    }

    // Dynamically import OpenAI to avoid bundle issues
    const OpenAI = (await import('openai')).default;
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

    if (!apiKey || apiKey.includes('your_') || apiKey.includes('placeholder')) {
      console.warn('[ReviewService] OpenAI API key not configured');
      return generateMockInsights(reviews);
    }

    const openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true
    });

    // Prepare review data for analysis
    const reviewsText = reviews.map((r, i) => 
      `Review ${i + 1} (${r.rating}/5 stars): "${r.reviewText}"`
    ).join('\n\n');

    // Get review stats for trend analysis
    const stats = await getReviewStats(businessId);
    const recentReviews = reviews.filter(r => {
      const daysSince = (Date.now() - r.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 30;
    });
    const olderReviews = reviews.filter(r => {
      const daysSince = (Date.now() - r.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince > 30 && daysSince <= 90;
    });

    const recentAvg = recentReviews.length > 0 
      ? recentReviews.reduce((sum, r) => sum + r.rating, 0) / recentReviews.length 
      : 0;
    const olderAvg = olderReviews.length > 0 
      ? olderReviews.reduce((sum, r) => sum + r.rating, 0) / olderReviews.length 
      : 0;

    // Call OpenAI for analysis
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a business analytics expert specializing in customer feedback analysis. Analyze the reviews and provide actionable insights in JSON format.

Return a JSON object with this structure:
{
  "sentimentScore": <number 0-100>,
  "commonThemes": [
    {
      "theme": "<category name>",
      "mentions": <count>,
      "sentiment": "positive|neutral|negative",
      "examples": ["<quote 1>", "<quote 2>"]
    }
  ],
  "strengths": ["<strength 1>", "<strength 2>", ...],
  "improvements": ["<improvement 1>", "<improvement 2>", ...],
  "actionableRecommendations": ["<action 1>", "<action 2>", ...],
  "keyQuotes": [
    {
      "text": "<impactful quote>",
      "rating": <1-5>,
      "theme": "<theme>"
    }
  ]
}

Focus on:
- Service quality, atmosphere, product quality, cleanliness, value for money
- Be specific and actionable
- Quote directly from reviews
- Identify patterns across multiple reviews`
        },
        {
          role: 'user',
          content: `Analyze these ${reviews.length} customer reviews and provide insights:\n\n${reviewsText}`
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    });

    const aiResponse = JSON.parse(completion.choices[0].message.content || '{}');

    // Determine overall sentiment
    const sentimentScore = aiResponse.sentimentScore || stats?.averageRating * 20 || 50;
    const overallSentiment: 'positive' | 'neutral' | 'negative' = 
      sentimentScore >= 70 ? 'positive' : sentimentScore >= 40 ? 'neutral' : 'negative';

    // Determine trending sentiment
    let trendingSentiment: 'improving' | 'stable' | 'declining' = 'stable';
    if (recentAvg > 0 && olderAvg > 0) {
      if (recentAvg > olderAvg + 0.3) trendingSentiment = 'improving';
      else if (recentAvg < olderAvg - 0.3) trendingSentiment = 'declining';
    }

    const insights: ReviewInsights = {
      overallSentiment,
      sentimentScore,
      commonThemes: aiResponse.commonThemes || [],
      strengths: aiResponse.strengths || [],
      improvements: aiResponse.improvements || [],
      actionableRecommendations: aiResponse.actionableRecommendations || [],
      keyQuotes: aiResponse.keyQuotes || [],
      trendingSentiment
    };

    console.log('[ReviewService] ✅ AI analysis complete:', insights);
    return insights;

  } catch (error) {
    console.error('[ReviewService] Error in AI analysis:', error);
    // Fallback to mock insights
    const reviews = await getBusinessReviews(businessId);
    return generateMockInsights(reviews);
  }
};

/**
 * Generate mock insights when AI is unavailable
 */
const generateMockInsights = (reviews: Review[]): ReviewInsights => {
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const sentimentScore = avgRating * 20;
  const overallSentiment: 'positive' | 'neutral' | 'negative' = 
    sentimentScore >= 70 ? 'positive' : sentimentScore >= 40 ? 'neutral' : 'negative';

  return {
    overallSentiment,
    sentimentScore,
    commonThemes: [
      { theme: 'Service Quality', mentions: reviews.length, sentiment: 'positive', examples: [] },
      { theme: 'Atmosphere', mentions: Math.floor(reviews.length * 0.7), sentiment: 'positive', examples: [] }
    ],
    strengths: ['Great customer service', 'Nice atmosphere', 'Quality products'],
    improvements: ['Wait times could be shorter', 'More variety in menu'],
    actionableRecommendations: [
      'Continue focusing on customer service excellence',
      'Consider expanding product offerings',
      'Optimize operations to reduce wait times'
    ],
    keyQuotes: reviews.slice(0, 3).map(r => ({
      text: r.reviewText.substring(0, 100),
      rating: r.rating,
      theme: 'General'
    })),
    trendingSentiment: 'stable'
  };
};
