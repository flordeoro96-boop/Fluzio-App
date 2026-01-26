// Supabase Analytics - Stub implementation for Firebase Analytics migration
// TODO: Implement proper analytics with Supabase or third-party service

// Initialize Analytics (stub)
let analytics: any = null;

export const initAnalytics = () => {
  console.log('[Analytics] Analytics stubbed - migrated from Firebase');
  return analytics;
};

// Track page views
export const trackPageView = (pageName: string, pageTitle?: string) => {
  console.log('[Analytics] Page view:', pageName, pageTitle);
};

// Track reward redemptions
export const trackRewardRedemption = (rewardId: string, rewardTitle: string, pointsCost: number, businessId: string) => {
  console.log('[Analytics] Reward redeemed:', { rewardId, rewardTitle, pointsCost, businessId });
};

// Track mission creation
export const trackMissionCreated = (missionId: string, missionType: string, pointsOffered: number) => {
  console.log('[Analytics] Mission created:', { missionId, missionType, pointsOffered });
};

// Track points spent
export const trackPointsSpent = (amount: number, type: 'reward' | 'marketplace', itemId: string) => {
  console.log('[Analytics] Points spent:', { amount, type, itemId });
};

// Track daily streak claimed
export const trackDailyStreakClaimed = (streakDays: number, pointsAwarded: number, milestoneReached?: string) => {
  console.log('[Analytics] Daily streak claimed:', { streakDays, pointsAwarded, milestoneReached });
};

// Track AI reward generation
export const trackAIRewardGenerated = (businessId: string, selectedSuggestion: boolean) => {
  console.log('[Analytics] AI reward generated:', { businessId, selectedSuggestion });
};

// Track sign ups
export const trackSignUp = (method: string, role: 'CREATOR' | 'BUSINESS' | 'MEMBER') => {
  console.log('[Analytics] Sign up:', { method, role });
};

// Track logins
export const trackLogin = (method: string) => {
  console.log('[Analytics] Login:', { method });
};

// Set user ID for analytics
export const setAnalyticsUserId = (userId: string) => {
  console.log('[Analytics] Set user ID:', userId);
};

// Set user properties
export const setAnalyticsUserProperties = (properties: { role?: string; city?: string; planTier?: string; [key: string]: any }) => {
  console.log('[Analytics] Set user properties:', properties);
};

// Track conversion events
export const trackConversion = (conversionType: string, value?: number) => {
  console.log('[Analytics] Conversion:', { conversionType, value });
};

// Track errors
export const trackError = (errorName: string, errorMessage: string, errorContext?: string) => {
  console.log('[Analytics] Error:', { errorName, errorMessage, errorContext });
};
