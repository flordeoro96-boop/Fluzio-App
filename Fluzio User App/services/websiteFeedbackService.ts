import { collection, addDoc, query, where, getDocs, orderBy, Timestamp } from '../services/firestoreCompat';
import { db } from './apiService';
import { WebsiteFeedback } from '../components/WebsiteVisitFeedback';

export interface WebsiteFeedbackData extends WebsiteFeedback {
  userId: string;
  isAnonymous: boolean;
}

/**
 * Submit website visit feedback
 */
export const submitWebsiteFeedback = async (
  userId: string,
  feedback: WebsiteFeedback
): Promise<void> => {
  try {
    const feedbackData: WebsiteFeedbackData = {
      ...feedback,
      userId,
      isAnonymous: true,
      timestamp: new Date()
    };

    await addDoc(collection(db, 'websiteFeedback'), {
      ...feedbackData,
      timestamp: Timestamp.fromDate(feedbackData.timestamp)
    });

    console.log('[WebsiteFeedbackService] Feedback submitted successfully');
  } catch (error) {
    console.error('[WebsiteFeedbackService] Failed to submit feedback:', error);
    throw error;
  }
};

/**
 * Get all feedback for a business
 */
export const getBusinessFeedback = async (businessId: string): Promise<WebsiteFeedbackData[]> => {
  try {
    const q = query(
      collection(db, 'websiteFeedback'),
      where('businessId', '==', businessId),
      orderBy('timestamp', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        timestamp: data.timestamp?.toDate() || new Date()
      } as WebsiteFeedbackData;
    });
  } catch (error) {
    console.error('[WebsiteFeedbackService] Failed to get feedback:', error);
    return [];
  }
};

/**
 * Get feedback statistics for a business
 */
export const getFeedbackStats = async (businessId: string) => {
  try {
    const feedback = await getBusinessFeedback(businessId);
    
    if (feedback.length === 0) {
      return {
        totalFeedback: 0,
        averageRating: 0,
        commonImprovements: [],
        commonNeeds: []
      };
    }

    const averageRating = feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length;

    // Extract common words from feedback (simple analysis)
    const improvementWords = feedback
      .flatMap(f => f.whatToImprove.toLowerCase().split(/\s+/))
      .filter(word => word.length > 4);
    
    const needWords = feedback
      .flatMap(f => f.whatNeeded.toLowerCase().split(/\s+/))
      .filter(word => word.length > 4);

    return {
      totalFeedback: feedback.length,
      averageRating: Math.round(averageRating * 10) / 10,
      recentFeedback: feedback.slice(0, 5),
      improvementWords,
      needWords
    };
  } catch (error) {
    console.error('[WebsiteFeedbackService] Failed to get feedback stats:', error);
    return {
      totalFeedback: 0,
      averageRating: 0,
      commonImprovements: [],
      commonNeeds: []
    };
  }
};
