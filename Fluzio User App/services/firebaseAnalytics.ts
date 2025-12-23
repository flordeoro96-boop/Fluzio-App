import { getAnalytics, logEvent, setUserId, setUserProperties } from 'firebase/analytics';
import { auth } from './AuthContext';

// Initialize Analytics (lazy loaded)
let analytics: any = null;

export const initAnalytics = () => {
  if (typeof window !== 'undefined' && !analytics) {
    try {
      analytics = getAnalytics();
      console.log('[Analytics] Firebase Analytics initialized');
    } catch (error) {
      console.error('[Analytics] Failed to initialize:', error);
    }
  }
  return analytics;
};

// Track page views
export const trackPageView = (pageName: string, pageTitle?: string) => {
  try {
    const analyticsInstance = initAnalytics();
    if (analyticsInstance) {
      logEvent(analyticsInstance, 'page_view', {
        page_name: pageName,
        page_title: pageTitle || pageName,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('[Analytics] trackPageView error:', error);
  }
};

// Track reward redemptions
export const trackRewardRedemption = (rewardId: string, rewardTitle: string, pointsCost: number, businessId: string) => {
  try {
    const analyticsInstance = initAnalytics();
    if (analyticsInstance) {
      logEvent(analyticsInstance, 'reward_redeemed', {
        reward_id: rewardId,
        reward_title: rewardTitle,
        points_cost: pointsCost,
        business_id: businessId,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('[Analytics] trackRewardRedemption error:', error);
  }
};

// Track mission creation
export const trackMissionCreated = (missionId: string, missionType: string, pointsOffered: number) => {
  try {
    const analyticsInstance = initAnalytics();
    if (analyticsInstance) {
      logEvent(analyticsInstance, 'mission_created', {
        mission_id: missionId,
        mission_type: missionType,
        points_offered: pointsOffered,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('[Analytics] trackMissionCreated error:', error);
  }
};

// Track points spent
export const trackPointsSpent = (amount: number, type: 'reward' | 'marketplace', itemId: string) => {
  try {
    const analyticsInstance = initAnalytics();
    if (analyticsInstance) {
      logEvent(analyticsInstance, 'points_spent', {
        amount,
        spend_type: type,
        item_id: itemId,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('[Analytics] trackPointsSpent error:', error);
  }
};

// Track daily streak claimed
export const trackDailyStreakClaimed = (streakDays: number, pointsAwarded: number, milestoneReached?: string) => {
  try {
    const analyticsInstance = initAnalytics();
    if (analyticsInstance) {
      logEvent(analyticsInstance, 'daily_streak_claimed', {
        streak_days: streakDays,
        points_awarded: pointsAwarded,
        milestone_reached: milestoneReached || 'none',
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('[Analytics] trackDailyStreakClaimed error:', error);
  }
};

// Track AI reward generation
export const trackAIRewardGenerated = (businessId: string, selectedSuggestion: boolean) => {
  try {
    const analyticsInstance = initAnalytics();
    if (analyticsInstance) {
      logEvent(analyticsInstance, 'ai_reward_generated', {
        business_id: businessId,
        selected_suggestion: selectedSuggestion,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('[Analytics] trackAIRewardGenerated error:', error);
  }
};

// Track sign ups
export const trackSignUp = (method: string, role: 'CREATOR' | 'BUSINESS') => {
  try {
    const analyticsInstance = initAnalytics();
    if (analyticsInstance) {
      logEvent(analyticsInstance, 'sign_up', {
        method,
        role,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('[Analytics] trackSignUp error:', error);
  }
};

// Track logins
export const trackLogin = (method: string) => {
  try {
    const analyticsInstance = initAnalytics();
    if (analyticsInstance) {
      logEvent(analyticsInstance, 'login', {
        method,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('[Analytics] trackLogin error:', error);
  }
};

// Set user ID for analytics
export const setAnalyticsUserId = (userId: string) => {
  try {
    const analyticsInstance = initAnalytics();
    if (analyticsInstance) {
      setUserId(analyticsInstance, userId);
    }
  } catch (error) {
    console.error('[Analytics] setAnalyticsUserId error:', error);
  }
};

// Set user properties
export const setAnalyticsUserProperties = (properties: { role?: string; city?: string; planTier?: string; [key: string]: any }) => {
  try {
    const analyticsInstance = initAnalytics();
    if (analyticsInstance) {
      setUserProperties(analyticsInstance, properties);
    }
  } catch (error) {
    console.error('[Analytics] setAnalyticsUserProperties error:', error);
  }
};

// Track conversion events
export const trackConversion = (conversionType: string, value?: number) => {
  try {
    const analyticsInstance = initAnalytics();
    if (analyticsInstance) {
      logEvent(analyticsInstance, 'conversion', {
        conversion_type: conversionType,
        value: value || 0,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('[Analytics] trackConversion error:', error);
  }
};

// Track errors
export const trackError = (errorName: string, errorMessage: string, errorContext?: string) => {
  try {
    const analyticsInstance = initAnalytics();
    if (analyticsInstance) {
      logEvent(analyticsInstance, 'error_occurred', {
        error_name: errorName,
        error_message: errorMessage,
        error_context: errorContext || 'unknown',
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('[Analytics] trackError error:', error);
  }
};
