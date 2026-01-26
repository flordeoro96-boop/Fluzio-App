/**
 * Google Review Service
 * Handles automated Google Review verification and seamless customer experience
 */

import { db } from './apiService';
import { collection, doc, getDoc, updateDoc, addDoc, query, where, getDocs, orderBy, limit, Timestamp } from '../services/firestoreCompat';

interface GoogleReviewVerification {
  reviewerId: string;
  reviewerName: string;
  reviewText: string;
  rating: number;
  reviewTime: string;
  reviewUrl: string;
}

/**
 * Generate a direct Google Review link for customers
 * This makes it super easy - just one click to leave a review
 */
export const generateGoogleReviewLink = (placeId: string): string => {
  // Official Google review link format
  return `https://search.google.com/local/writereview?placeid=${placeId}`;
};

/**
 * Get simplified instructions for customers
 */
export const getCustomerInstructions = (businessName: string, reviewLink: string): {
  title: string;
  steps: string[];
  buttonText: string;
  buttonLink: string;
} => {
  return {
    title: `Leave a review for ${businessName}`,
    steps: [
      '📝 Click the button below to open Google',
      '⭐ Rate your experience (1-5 stars)',
      '✍️ Write a few words about what you liked',
      '✅ Submit - That\'s it! Points awarded automatically'
    ],
    buttonText: 'Write Review on Google',
    buttonLink: reviewLink
  };
};

/**
 * Poll Google My Business API to check for new reviews
 * This runs automatically after customer clicks "Write Review"
 */
export const checkForNewReview = async (
  businessId: string,
  userId: string,
  missionId: string,
  participationId: string
): Promise<{ success: boolean; review?: GoogleReviewVerification; error?: string }> => {
  try {
    console.log('[GoogleReviewService] Checking for new review:', { businessId, userId, participationId });

    // Get business Google connection details
    const businessDoc = await getDoc(doc(db, 'users', businessId));
    if (!businessDoc.exists()) {
      return { success: false, error: 'Business not found' };
    }

    const businessData = businessDoc.data();
    const googleConnection = businessData.socialAccounts?.google || businessData.integrations?.googleBusiness;

    if (!googleConnection?.connected || !googleConnection?.accountId) {
      return { success: false, error: 'Google Business Profile not connected' };
    }

    // Get customer's Google email to match reviewer
    const customerDoc = await getDoc(doc(db, 'users', userId));
    if (!customerDoc.exists()) {
      return { success: false, error: 'Customer not found' };
    }

    const customerData = customerDoc.data();
    const customerGoogleEmail = customerData.socialAccounts?.google?.email || customerData.email;

    // Call Cloud Function to fetch recent reviews from Google My Business API
    const response = await fetch(
      `https://us-central1-fluzio-13af2.cloudfunctions.net/checkGoogleReviews`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          accountId: googleConnection.accountId,
          locationId: googleConnection.locationId,
          customerEmail: customerGoogleEmail,
          since: Date.now() - 3600000 // Check last 1 hour
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message || 'Failed to check reviews' };
    }

    const result = await response.json();

    if (result.reviewFound) {
      // Review found! Auto-approve the participation
      console.log('[GoogleReviewService] ✅ Review found, auto-approving participation');
      
      await updateDoc(doc(db, 'participations', participationId), {
        status: 'COMPLETED',
        verifiedAt: Timestamp.now(),
        verificationMethod: 'GOOGLE_API',
        reviewDetails: result.review,
        approvedAt: Timestamp.now(),
        autoApproved: true,
        updatedAt: Timestamp.now()
      });

      // Award points
      const missionDoc = await getDoc(doc(db, 'missions', missionId));
      if (missionDoc.exists()) {
        const points = missionDoc.data().reward?.points || 150;
        await awardPoints(userId, points, 'Google Review Completed', missionId);
      }

      return { success: true, review: result.review };
    }

    return { success: false, error: 'Review not found yet' };

  } catch (error) {
    console.error('[GoogleReviewService] Error checking review:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to verify review' 
    };
  }
};

/**
 * Award points to customer
 */
const awardPoints = async (
  userId: string,
  points: number,
  reason: string,
  missionId: string
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const currentPoints = userDoc.data().points || 0;
      await updateDoc(userRef, {
        points: currentPoints + points,
        totalPointsEarned: (userDoc.data().totalPointsEarned || 0) + points,
        updatedAt: Timestamp.now()
      });

      // Create points transaction
      await addDoc(collection(db, 'pointsTransactions'), {
        userId,
        amount: points,
        type: 'EARN',
        reason,
        missionId,
        createdAt: Timestamp.now()
      });

      console.log(`[GoogleReviewService] ✅ Awarded ${points} points to user ${userId}`);
    }
  } catch (error) {
    console.error('[GoogleReviewService] Error awarding points:', error);
  }
};

/**
 * Start automatic review polling after customer clicks review link
 * Polls every 30 seconds for 10 minutes
 */
export const startReviewPolling = async (
  businessId: string,
  userId: string,
  missionId: string,
  participationId: string
): Promise<void> => {
  console.log('[GoogleReviewService] Starting review polling...');

  const maxAttempts = 20; // 10 minutes (20 * 30 seconds)
  let attempts = 0;

  const pollInterval = setInterval(async () => {
    attempts++;
    console.log(`[GoogleReviewService] Polling attempt ${attempts}/${maxAttempts}`);

    const result = await checkForNewReview(businessId, userId, missionId, participationId);

    if (result.success) {
      console.log('[GoogleReviewService] ✅ Review verified! Stopping polling.');
      clearInterval(pollInterval);
      
      // Notify customer
      await addDoc(collection(db, 'notifications'), {
        userId,
        type: 'REWARD_EARNED',
        title: '🎉 Review Verified!',
        message: 'Your Google review has been verified. Points awarded!',
        read: false,
        createdAt: Timestamp.now()
      });
    } else if (attempts >= maxAttempts) {
      console.log('[GoogleReviewService] ⏰ Polling timeout - falling back to manual verification');
      clearInterval(pollInterval);
      
      // Update participation to require manual proof
      await updateDoc(doc(db, 'participations', participationId), {
        status: 'PENDING_PROOF',
        requiresManualProof: true,
        updatedAt: Timestamp.now()
      });
      
      // Notify customer to submit screenshot
      await addDoc(collection(db, 'notifications'), {
        userId,
        type: 'ACTION_REQUIRED',
        title: 'Review Submission',
        message: 'We couldn\'t automatically verify your review. Please submit a screenshot.',
        createdAt: Timestamp.now()
      });
    }
  }, 30000); // Poll every 30 seconds
};

/**
 * Enhanced customer flow with direct link
 */
export const createGoogleReviewMission = async (
  businessId: string,
  userId: string,
  missionId: string
): Promise<{
  success: boolean;
  participationId?: string;
  reviewLink?: string;
  instructions?: any;
  error?: string;
}> => {
  try {
    // Get business Google place ID
    const businessDoc = await getDoc(doc(db, 'users', businessId));
    if (!businessDoc.exists()) {
      return { success: false, error: 'Business not found' };
    }

    const businessData = businessDoc.data();
    
    // Check multiple possible locations for Place ID
    const placeId = businessData.integrations?.googleBusiness?.placeId || 
                    businessData.socialAccounts?.google?.placeId ||
                    businessData.googlePlaceId;

    // Debug logging to help diagnose
    console.log('[GoogleReviewService] Looking for Place ID:', {
      hasIntegrations: !!businessData.integrations,
      hasGoogleBusiness: !!businessData.integrations?.googleBusiness,
      hasPlaceIdInIntegrations: !!businessData.integrations?.googleBusiness?.placeId,
      hasSocialAccounts: !!businessData.socialAccounts,
      hasGoogleSocial: !!businessData.socialAccounts?.google,
      hasPlaceIdInSocial: !!businessData.socialAccounts?.google?.placeId,
      hasDirectPlaceId: !!businessData.googlePlaceId,
      googleConnected: businessData.socialAccounts?.google?.connected,
      placeIdFound: !!placeId
    });

    if (!placeId) {
      console.error('[GoogleReviewService] Google Place ID not found for business:', businessId);
      
      // Check if Google is connected but just not synced
      const isGoogleConnected = businessData.socialAccounts?.google?.connected;
      
      if (isGoogleConnected) {
        return { 
          success: false, 
          error: 'Google account is connected but location not synced yet. Please go to Settings → Business Profile → Sync Location to complete setup.' 
        };
      } else {
        return { 
          success: false, 
          error: 'Google Business Profile not connected. Please connect in Settings → Integrations.' 
        };
      }
    }

    // Create participation
    const participationRef = await addDoc(collection(db, 'participations'), {
      userId,
      businessId,
      missionId,
      status: 'IN_PROGRESS',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    // Generate review link
    const reviewLink = generateGoogleReviewLink(placeId);
    const instructions = getCustomerInstructions(businessData.name, reviewLink);

    // Start polling for review (runs in background)
    startReviewPolling(businessId, userId, missionId, participationRef.id);

    return {
      success: true,
      participationId: participationRef.id,
      reviewLink,
      instructions
    };

  } catch (error) {
    console.error('[GoogleReviewService] Error creating review mission:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create mission'
    };
  }
};

/**
 * Get review status for customer
 */
export const getReviewStatus = async (participationId: string): Promise<{
  status: 'PENDING' | 'VERIFIED' | 'NEEDS_PROOF' | 'COMPLETED';
  message: string;
}> => {
  try {
    const participationDoc = await getDoc(doc(db, 'participations', participationId));
    
    if (!participationDoc.exists()) {
      return { status: 'PENDING', message: 'Checking for your review...' };
    }

    const data = participationDoc.data();

    if (data.status === 'COMPLETED') {
      return { status: 'COMPLETED', message: '✅ Review verified! Points awarded.' };
    }

    if (data.requiresManualProof) {
      return { status: 'NEEDS_PROOF', message: '📸 Please upload a screenshot of your review' };
    }

    return { status: 'PENDING', message: '🔍 Checking for your review...' };

  } catch (error) {
    console.error('[GoogleReviewService] Error getting status:', error);
    return { status: 'PENDING', message: 'Checking...' };
  }
};
