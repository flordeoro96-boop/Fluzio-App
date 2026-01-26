/**
 * Creator Review Service
 * 
 * Handles creator rating and review functionality:
 * - Submit reviews from businesses after project completion
 * - Fetch and aggregate creator ratings
 * - Calculate badge eligibility (Verified, Top Rated, Rising Talent)
 * - Review verification and moderation
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  Timestamp,
  writeBatch
} from '../services/firestoreCompat';
import { db } from './apiService';

// ============================================================================
// TYPES
// ============================================================================

export interface CreatorReview {
  id: string;
  creatorId: string;
  creatorName: string;
  businessId: string;
  businessName: string;
  projectId: string;
  projectTitle?: string;
  rating: number; // 1-5
  communication: number; // 1-5
  quality: number; // 1-5
  professionalism: number; // 1-5
  timeliness: number; // 1-5
  reviewText: string;
  wouldHireAgain: boolean;
  helpful: number; // How many found this review helpful
  verified: boolean; // Is this from a completed project?
  response?: string; // Creator's response to review
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreatorRatingStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  aspectRatings: {
    communication: number;
    quality: number;
    professionalism: number;
    timeliness: number;
  };
  wouldHireAgainPercentage: number;
  verifiedReviews: number;
  badges: CreatorBadge[];
}

export interface CreatorBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earnedAt: Timestamp;
}

export type BadgeType = 'verified' | 'top_rated' | 'rising_talent' | 'veteran' | 'responsive' | 'perfectionist';

// ============================================================================
// REVIEW SUBMISSION
// ============================================================================

/**
 * Submit a review for a creator after project completion
 */
export const submitCreatorReview = async (review: Omit<CreatorReview, 'id' | 'createdAt' | 'updatedAt' | 'helpful' | 'verified'>): Promise<string> => {
  try {
    // Validate project exists and is completed
    const projectRef = doc(db, 'projects', review.projectId);
    const projectSnap = await getDoc(projectRef);
    
    if (!projectSnap.exists()) {
      throw new Error('Project not found');
    }
    
    const projectData = projectSnap.data();
    if (projectData.status !== 'completed') {
      throw new Error('Can only review completed projects');
    }
    
    // Check if review already exists
    const existingReviewQuery = query(
      collection(db, 'creatorReviews'),
      where('projectId', '==', review.projectId),
      where('businessId', '==', review.businessId)
    );
    const existingReviews = await getDocs(existingReviewQuery);
    
    if (!existingReviews.empty) {
      throw new Error('You have already reviewed this creator for this project');
    }
    
    // Create review
    const reviewData: Omit<CreatorReview, 'id'> = {
      ...review,
      helpful: 0,
      verified: true, // Verified because it's from a completed project
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    const reviewRef = await addDoc(collection(db, 'creatorReviews'), reviewData);
    
    // Update creator's rating stats
    await updateCreatorRatingStats(review.creatorId);
    
    // Check and award badges
    await checkAndAwardBadges(review.creatorId);
    
    console.log('✅ Review submitted successfully:', reviewRef.id);
    return reviewRef.id;
  } catch (error) {
    console.error('❌ Error submitting review:', error);
    throw error;
  }
};

/**
 * Update a creator's aggregated rating statistics
 */
const updateCreatorRatingStats = async (creatorId: string): Promise<void> => {
  try {
    const stats = await calculateCreatorRatingStats(creatorId);
    
    // Update creator profile with latest stats
    const creatorRef = doc(db, 'users', creatorId);
    await updateDoc(creatorRef, {
      'creatorStats.averageRating': stats.averageRating,
      'creatorStats.totalReviews': stats.totalReviews,
      'creatorStats.ratingDistribution': stats.ratingDistribution,
      'creatorStats.aspectRatings': stats.aspectRatings,
      'creatorStats.wouldHireAgainPercentage': stats.wouldHireAgainPercentage,
      'creatorStats.verifiedReviews': stats.verifiedReviews,
      'updatedAt': Timestamp.now()
    });
    
    console.log('✅ Creator rating stats updated');
  } catch (error) {
    console.error('❌ Error updating rating stats:', error);
    throw error;
  }
};

// ============================================================================
// REVIEW FETCHING
// ============================================================================

/**
 * Get all reviews for a creator
 */
export const getCreatorReviews = async (creatorId: string, limitCount: number = 50): Promise<CreatorReview[]> => {
  try {
    const reviewsQuery = query(
      collection(db, 'creatorReviews'),
      where('creatorId', '==', creatorId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const reviewsSnap = await getDocs(reviewsQuery);
    
    return reviewsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as CreatorReview));
  } catch (error) {
    console.error('❌ Error fetching reviews:', error);
    return [];
  }
};

/**
 * Get reviews with pagination
 */
export const getCreatorReviewsPaginated = async (
  creatorId: string, 
  pageSize: number = 10,
  lastReviewId?: string
): Promise<{ reviews: CreatorReview[], hasMore: boolean }> => {
  try {
    let reviewsQuery = query(
      collection(db, 'creatorReviews'),
      where('creatorId', '==', creatorId),
      orderBy('createdAt', 'desc'),
      limit(pageSize + 1) // Fetch one extra to check if more exist
    );
    
    const reviewsSnap = await getDocs(reviewsQuery);
    const reviews = reviewsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as CreatorReview));
    
    const hasMore = reviews.length > pageSize;
    if (hasMore) {
      reviews.pop(); // Remove the extra item
    }
    
    return { reviews, hasMore };
  } catch (error) {
    console.error('❌ Error fetching paginated reviews:', error);
    return { reviews: [], hasMore: false };
  }
};

/**
 * Calculate comprehensive rating statistics for a creator
 */
export const calculateCreatorRatingStats = async (creatorId: string): Promise<CreatorRatingStats> => {
  try {
    const reviews = await getCreatorReviews(creatorId, 1000); // Get all reviews
    
    if (reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        aspectRatings: {
          communication: 0,
          quality: 0,
          professionalism: 0,
          timeliness: 0
        },
        wouldHireAgainPercentage: 0,
        verifiedReviews: 0,
        badges: []
      };
    }
    
    // Calculate distribution
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      distribution[review.rating as keyof typeof distribution]++;
    });
    
    // Calculate averages
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const totalCommunication = reviews.reduce((sum, r) => sum + r.communication, 0);
    const totalQuality = reviews.reduce((sum, r) => sum + r.quality, 0);
    const totalProfessionalism = reviews.reduce((sum, r) => sum + r.professionalism, 0);
    const totalTimeliness = reviews.reduce((sum, r) => sum + r.timeliness, 0);
    
    const wouldHireAgainCount = reviews.filter(r => r.wouldHireAgain).length;
    const verifiedCount = reviews.filter(r => r.verified).length;
    
    return {
      averageRating: totalRating / reviews.length,
      totalReviews: reviews.length,
      ratingDistribution: distribution,
      aspectRatings: {
        communication: totalCommunication / reviews.length,
        quality: totalQuality / reviews.length,
        professionalism: totalProfessionalism / reviews.length,
        timeliness: totalTimeliness / reviews.length
      },
      wouldHireAgainPercentage: (wouldHireAgainCount / reviews.length) * 100,
      verifiedReviews: verifiedCount,
      badges: [] // Populated separately
    };
  } catch (error) {
    console.error('❌ Error calculating rating stats:', error);
    throw error;
  }
};

// ============================================================================
// BADGE SYSTEM
// ============================================================================

/**
 * Check and award badges based on creator performance
 */
export const checkAndAwardBadges = async (creatorId: string): Promise<void> => {
  try {
    const stats = await calculateCreatorRatingStats(creatorId);
    const creatorRef = doc(db, 'users', creatorId);
    const creatorSnap = await getDoc(creatorRef);
    
    if (!creatorSnap.exists()) return;
    
    const creatorData = creatorSnap.data();
    const currentBadges = creatorData.badges || [];
    const newBadges: BadgeType[] = [];
    
    // Verified Badge - 5+ verified reviews
    if (stats.verifiedReviews >= 5 && !currentBadges.includes('verified')) {
      newBadges.push('verified');
    }
    
    // Top Rated Badge - 4.5+ rating with 10+ reviews
    if (stats.averageRating >= 4.5 && stats.totalReviews >= 10 && !currentBadges.includes('top_rated')) {
      newBadges.push('top_rated');
    }
    
    // Rising Talent Badge - 3+ reviews with 4.0+ rating in last 30 days
    const recentReviews = await getRecentReviews(creatorId, 30);
    if (recentReviews.length >= 3) {
      const recentAvg = recentReviews.reduce((sum, r) => sum + r.rating, 0) / recentReviews.length;
      if (recentAvg >= 4.0 && !currentBadges.includes('rising_talent')) {
        newBadges.push('rising_talent');
      }
    }
    
    // Veteran Badge - 50+ completed projects
    if (creatorData.creatorStats?.completedProjects >= 50 && !currentBadges.includes('veteran')) {
      newBadges.push('veteran');
    }
    
    // Responsive Badge - Response rate > 95% with response time < 2 hours
    if (creatorData.creatorStats?.responseRate >= 95 && 
        creatorData.creatorStats?.responseTime < 120 && 
        !currentBadges.includes('responsive')) {
      newBadges.push('responsive');
    }
    
    // Perfectionist Badge - 5.0 rating with 20+ reviews
    if (stats.averageRating === 5.0 && stats.totalReviews >= 20 && !currentBadges.includes('perfectionist')) {
      newBadges.push('perfectionist');
    }
    
    // Award new badges
    if (newBadges.length > 0) {
      const updatedBadges = [...new Set([...currentBadges, ...newBadges])];
      await updateDoc(creatorRef, {
        badges: updatedBadges,
        'updatedAt': Timestamp.now()
      });
      
      console.log(`✅ Awarded badges to creator ${creatorId}:`, newBadges);
    }
  } catch (error) {
    console.error('❌ Error checking badges:', error);
  }
};

/**
 * Get reviews from the last N days
 */
const getRecentReviews = async (creatorId: string, days: number): Promise<CreatorReview[]> => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const reviewsQuery = query(
      collection(db, 'creatorReviews'),
      where('creatorId', '==', creatorId),
      where('createdAt', '>=', Timestamp.fromDate(cutoffDate)),
      orderBy('createdAt', 'desc')
    );
    
    const reviewsSnap = await getDocs(reviewsQuery);
    
    return reviewsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as CreatorReview));
  } catch (error) {
    console.error('❌ Error fetching recent reviews:', error);
    return [];
  }
};

/**
 * Get badge information
 */
export const getBadgeInfo = (badgeType: BadgeType): CreatorBadge => {
  const badges: Record<BadgeType, Omit<CreatorBadge, 'earnedAt' | 'id'>> = {
    verified: {
      name: 'Verified Creator',
      description: 'Completed 5+ verified projects',
      icon: 'shield-check',
      color: 'blue'
    },
    top_rated: {
      name: 'Top Rated',
      description: '4.5+ stars with 10+ reviews',
      icon: 'star',
      color: 'gold'
    },
    rising_talent: {
      name: 'Rising Talent',
      description: 'Strong recent performance',
      icon: 'trending-up',
      color: 'green'
    },
    veteran: {
      name: 'Veteran',
      description: '50+ completed projects',
      icon: 'award',
      color: 'purple'
    },
    responsive: {
      name: 'Responsive',
      description: 'Responds quickly and reliably',
      icon: 'zap',
      color: 'orange'
    },
    perfectionist: {
      name: 'Perfectionist',
      description: 'Perfect 5.0 rating',
      icon: 'sparkles',
      color: 'pink'
    }
  };
  
  return {
    id: badgeType,
    ...badges[badgeType],
    earnedAt: Timestamp.now()
  };
};

// ============================================================================
// REVIEW ACTIONS
// ============================================================================

/**
 * Mark review as helpful
 */
export const markReviewHelpful = async (reviewId: string): Promise<void> => {
  try {
    const reviewRef = doc(db, 'creatorReviews', reviewId);
    const reviewSnap = await getDoc(reviewRef);
    
    if (!reviewSnap.exists()) {
      throw new Error('Review not found');
    }
    
    const currentHelpful = reviewSnap.data().helpful || 0;
    
    await updateDoc(reviewRef, {
      helpful: currentHelpful + 1
    });
    
    console.log('✅ Review marked as helpful');
  } catch (error) {
    console.error('❌ Error marking review as helpful:', error);
    throw error;
  }
};

/**
 * Add creator response to a review
 */
export const addCreatorResponse = async (reviewId: string, creatorId: string, response: string): Promise<void> => {
  try {
    const reviewRef = doc(db, 'creatorReviews', reviewId);
    const reviewSnap = await getDoc(reviewRef);
    
    if (!reviewSnap.exists()) {
      throw new Error('Review not found');
    }
    
    const reviewData = reviewSnap.data();
    if (reviewData.creatorId !== creatorId) {
      throw new Error('You can only respond to your own reviews');
    }
    
    if (reviewData.response) {
      throw new Error('You have already responded to this review');
    }
    
    await updateDoc(reviewRef, {
      response,
      updatedAt: Timestamp.now()
    });
    
    console.log('✅ Creator response added');
  } catch (error) {
    console.error('❌ Error adding response:', error);
    throw error;
  }
};

/**
 * Get creator's badge list
 */
export const getCreatorBadges = async (creatorId: string): Promise<CreatorBadge[]> => {
  try {
    const creatorRef = doc(db, 'users', creatorId);
    const creatorSnap = await getDoc(creatorRef);
    
    if (!creatorSnap.exists()) return [];
    
    const badges = creatorSnap.data().badges || [];
    return badges.map((badgeType: BadgeType) => getBadgeInfo(badgeType));
  } catch (error) {
    console.error('❌ Error fetching badges:', error);
    return [];
  }
};

/**
 * Check if a business can review a creator (completed project exists)
 */
export const canReviewCreator = async (businessId: string, creatorId: string, projectId: string): Promise<boolean> => {
  try {
    // Check if project exists and is completed
    const projectRef = doc(db, 'projects', projectId);
    const projectSnap = await getDoc(projectRef);
    
    if (!projectSnap.exists()) return false;
    
    const projectData = projectSnap.data();
    
    // Project must be completed and involve this business and creator
    if (projectData.status !== 'completed') return false;
    if (projectData.businessId !== businessId) return false;
    if (projectData.creatorId !== creatorId) return false;
    
    // Check if already reviewed
    const existingReviewQuery = query(
      collection(db, 'creatorReviews'),
      where('projectId', '==', projectId),
      where('businessId', '==', businessId)
    );
    const existingReviews = await getDocs(existingReviewQuery);
    
    return existingReviews.empty;
  } catch (error) {
    console.error('❌ Error checking review eligibility:', error);
    return false;
  }
};
