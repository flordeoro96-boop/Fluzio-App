import { db } from './AuthContext';
import { doc, updateDoc, getDoc, setDoc, Timestamp } from 'firebase/firestore';

export type Level2Tier = 'FREE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export interface Level2Benefits {
  // Mission Limits
  maxActiveMissions: number; // -1 = unlimited (with fair use)
  maxParticipantsPerMonth: number;
  maxParticipantsPerMission: number;
  
  // Mission Types Access
  visitCheckInMissions: boolean;
  instagramFollowMissions: boolean;
  instagramStoryMissions: boolean;
  instagramFeedMissions: boolean;
  videoMissions: boolean;
  googleReviewMissions: boolean;
  referralMissions: boolean;
  
  // Google Review Limits (Safety Rules)
  googleReviewMonthlyLimit: number; // 0 = locked
  googleReviewCooldownHours: number;
  googleReviewMinVisitVerification: boolean;
  
  // Referral Limits (Safety Rules)
  referralMissionsPerMonth: number; // 0 = locked
  referralDelayedRewardHours: number;
  
  // Events Access
  eventsAccess: boolean;
  eventsPayPerUse: boolean;
  freeEventsPerMonth: number;
  freeEventsPerQuarter: number;
  
  // Features
  mySquadAccess: boolean;
  basicAnalytics: boolean;
  enhancedAnalytics: boolean;
  priorityPlacement: boolean;
  prioritySupport: boolean;
  verificationBadge: boolean;
  
  // Visibility
  cityLevelVisibility: boolean;
}

// Benefits configuration for each Level 2 tier
export const LEVEL2_TIER_BENEFITS: Record<Level2Tier, Level2Benefits> = {
  FREE: {
    // Mission Limits
    maxActiveMissions: 1,
    maxParticipantsPerMonth: 20,
    maxParticipantsPerMission: 10,
    
    // Mission Types - Very Basic
    visitCheckInMissions: true,
    instagramFollowMissions: false,
    instagramStoryMissions: false,
    instagramFeedMissions: false,
    videoMissions: false,
    googleReviewMissions: false,
    referralMissions: false,
    
    // Google Review Limits
    googleReviewMonthlyLimit: 0,
    googleReviewCooldownHours: 0,
    googleReviewMinVisitVerification: true,
    
    // Referral Limits
    referralMissionsPerMonth: 0,
    referralDelayedRewardHours: 72,
    
    // Events
    eventsAccess: false,
    eventsPayPerUse: false,
    freeEventsPerMonth: 0,
    freeEventsPerQuarter: 0,
    
    // Features
    mySquadAccess: true,
    basicAnalytics: true,
    enhancedAnalytics: false,
    priorityPlacement: false,
    prioritySupport: false,
    verificationBadge: true,
    
    // Visibility
    cityLevelVisibility: true
  },
  
  SILVER: {
    // Mission Limits
    maxActiveMissions: 3,
    maxParticipantsPerMonth: 40,
    maxParticipantsPerMission: 20,
    
    // Mission Types
    visitCheckInMissions: true,
    instagramFollowMissions: true,
    instagramStoryMissions: true,
    instagramFeedMissions: false,
    videoMissions: false,
    googleReviewMissions: false,
    referralMissions: false,
    
    // Google Review Limits
    googleReviewMonthlyLimit: 0,
    googleReviewCooldownHours: 0,
    googleReviewMinVisitVerification: true,
    
    // Referral Limits
    referralMissionsPerMonth: 0,
    referralDelayedRewardHours: 72,
    
    // Events
    eventsAccess: true,
    eventsPayPerUse: true,
    freeEventsPerMonth: 0,
    freeEventsPerQuarter: 0,
    
    // Features
    mySquadAccess: true,
    basicAnalytics: true,
    enhancedAnalytics: false,
    priorityPlacement: false,
    prioritySupport: false,
    verificationBadge: true,
    
    // Visibility
    cityLevelVisibility: true
  },
  
  GOLD: {
    // Mission Limits
    maxActiveMissions: 6,
    maxParticipantsPerMonth: 120,
    maxParticipantsPerMission: 30,
    
    // Mission Types
    visitCheckInMissions: true,
    instagramFollowMissions: true,
    instagramStoryMissions: true,
    instagramFeedMissions: true,
    videoMissions: false,
    googleReviewMissions: true, // LIMITED
    referralMissions: true, // LOW CAP
    
    // Google Review Limits (Hard Caps)
    googleReviewMonthlyLimit: 10,
    googleReviewCooldownHours: 168, // 7 days
    googleReviewMinVisitVerification: true,
    
    // Referral Limits
    referralMissionsPerMonth: 3,
    referralDelayedRewardHours: 48,
    
    // Events
    eventsAccess: true,
    eventsPayPerUse: true,
    freeEventsPerMonth: 0,
    freeEventsPerQuarter: 1,
    
    // Features
    mySquadAccess: true,
    basicAnalytics: true,
    enhancedAnalytics: true,
    priorityPlacement: false,
    prioritySupport: false,
    verificationBadge: true,
    
    // Visibility
    cityLevelVisibility: true
  },
  
  PLATINUM: {
    // Mission Limits
    maxActiveMissions: -1, // Unlimited with fair use
    maxParticipantsPerMonth: 300,
    maxParticipantsPerMission: 50,
    
    // Mission Types
    visitCheckInMissions: true,
    instagramFollowMissions: true,
    instagramStoryMissions: true,
    instagramFeedMissions: true,
    videoMissions: true,
    googleReviewMissions: true, // STILL CAPPED
    referralMissions: true, // STILL CAPPED
    
    // Google Review Limits (Still Protected)
    googleReviewMonthlyLimit: 20,
    googleReviewCooldownHours: 120, // 5 days
    googleReviewMinVisitVerification: true,
    
    // Referral Limits
    referralMissionsPerMonth: 6,
    referralDelayedRewardHours: 24,
    
    // Events
    eventsAccess: true,
    eventsPayPerUse: true, // Pay for events beyond free quota
    freeEventsPerMonth: 1, // 1 free event per month
    freeEventsPerQuarter: 1, // 1 bonus premium event per quarter
    
    // Features
    mySquadAccess: true,
    basicAnalytics: true,
    enhancedAnalytics: true,
    priorityPlacement: true,
    prioritySupport: true,
    verificationBadge: true,
    
    // Visibility
    cityLevelVisibility: true
  }
};

// Tier pricing in EUR
export const LEVEL2_TIER_PRICING: Record<Level2Tier, number> = {
  FREE: 0,
  SILVER: 29,
  GOLD: 59,
  PLATINUM: 99
};

export interface Level2Subscription {
  userId: string;
  tier: Level2Tier;
  status: 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'TRIAL';
  startDate: Date;
  nextBillingDate?: Date;
  canceledAt?: Date;
  
  // Usage tracking
  activeMissionsCount: number;
  participantsThisMonth: number;
  googleReviewsThisMonth: number;
  referralMissionsThisMonth: number;
  eventsAttendedThisMonth: number;
  freeEventsUsedThisMonth: number;
  eventsAttendedThisQuarter: number;
  freeEventsUsedThisQuarter: number;
  
  // Last user actions (for cooldown tracking)
  lastGoogleReviewMissionCreated?: Date;
  
  // Reset dates
  lastMonthlyReset: Date;
  lastQuarterlyReset: Date;
  
  // Payment
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

/**
 * Get Level 2 subscription for a business
 */
export const getLevel2Subscription = async (userId: string): Promise<Level2Subscription | null> => {
  try {
    const subDoc = await getDoc(doc(db, 'level2Subscriptions', userId));
    
    if (!subDoc.exists()) {
      // Create default FREE subscription
      const defaultSub: Level2Subscription = {
        userId,
        tier: 'FREE',
        status: 'ACTIVE',
        startDate: new Date(),
        activeMissionsCount: 0,
        participantsThisMonth: 0,
        googleReviewsThisMonth: 0,
        referralMissionsThisMonth: 0,
        eventsAttendedThisMonth: 0,
        freeEventsUsedThisMonth: 0,
        eventsAttendedThisQuarter: 0,
        freeEventsUsedThisQuarter: 0,
        lastMonthlyReset: new Date(),
        lastQuarterlyReset: new Date()
      };
      
      await setDoc(doc(db, 'level2Subscriptions', userId), defaultSub);
      return defaultSub;
    }
    
    return subDoc.data() as Level2Subscription;
  } catch (error) {
    console.error('[getLevel2Subscription] Error:', error);
    return null;
  }
};

/**
 * Update Level 2 subscription tier
 */
export const updateLevel2Tier = async (
  userId: string,
  newTier: Level2Tier
): Promise<{ success: boolean; error?: string }> => {
  try {
    const subRef = doc(db, 'level2Subscriptions', userId);
    const subDoc = await getDoc(subRef);
    
    if (!subDoc.exists()) {
      // Create new subscription
      const newSub: Level2Subscription = {
        userId,
        tier: newTier,
        status: 'ACTIVE',
        startDate: new Date(),
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        activeMissionsCount: 0,
        participantsThisMonth: 0,
        googleReviewsThisMonth: 0,
        referralMissionsThisMonth: 0,
        eventsAttendedThisMonth: 0,
        freeEventsUsedThisMonth: 0,
        eventsAttendedThisQuarter: 0,
        freeEventsUsedThisQuarter: 0,
        lastMonthlyReset: new Date(),
        lastQuarterlyReset: new Date()
      };
      
      await setDoc(subRef, newSub);
    } else {
      // Update existing subscription
      await updateDoc(subRef, {
        tier: newTier,
        status: 'ACTIVE',
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
    }
    
    // Update user document
    await updateDoc(doc(db, 'users', userId), {
      subscriptionLevel: newTier,
      updatedAt: Timestamp.now()
    });
    
    return { success: true };
  } catch (error) {
    console.error('[updateLevel2Tier] Error:', error);
    return { success: false, error: 'Failed to update subscription' };
  }
};

/**
 * Check if user can create a new mission
 */
export const canCreateMission = async (
  userId: string,
  missionType: string
): Promise<{ allowed: boolean; reason?: string }> => {
  try {
    const subscription = await getLevel2Subscription(userId);
    if (!subscription) {
      return { allowed: false, reason: 'No subscription found' };
    }
    
    const benefits = LEVEL2_TIER_BENEFITS[subscription.tier];
    
    // Check active missions limit
    if (benefits.maxActiveMissions !== -1 && 
        subscription.activeMissionsCount >= benefits.maxActiveMissions) {
      return {
        allowed: false,
        reason: `You've reached your limit of ${benefits.maxActiveMissions} active mission(s). Upgrade for more!`
      };
    }
    
    // Check mission type access
    if (missionType === 'VISIT' && !benefits.visitCheckInMissions) {
      return { allowed: false, reason: 'Visit missions require SILVER or higher' };
    }
    if (missionType === 'INSTAGRAM_FOLLOW' && !benefits.instagramFollowMissions) {
      return { allowed: false, reason: 'Instagram follow missions require SILVER or higher' };
    }
    if (missionType === 'INSTAGRAM_STORY' && !benefits.instagramStoryMissions) {
      return { allowed: false, reason: 'Instagram story missions require SILVER or higher' };
    }
    if (missionType === 'INSTAGRAM_FEED' && !benefits.instagramFeedMissions) {
      return { allowed: false, reason: 'Instagram feed missions require GOLD or higher' };
    }
    if (missionType === 'VIDEO' && !benefits.videoMissions) {
      return { allowed: false, reason: 'Video missions require PLATINUM' };
    }
    if (missionType === 'GOOGLE_REVIEW' && !benefits.googleReviewMissions) {
      return { allowed: false, reason: 'Google review missions require GOLD or higher' };
    }
    if (missionType === 'REFERRAL' && !benefits.referralMissions) {
      return { allowed: false, reason: 'Referral missions require GOLD or higher' };
    }
    
    // Check Google Review limits (Safety Rules)
    if (missionType === 'GOOGLE_REVIEW') {
      if (subscription.googleReviewsThisMonth >= benefits.googleReviewMonthlyLimit) {
        return {
          allowed: false,
          reason: `Monthly Google review limit reached (${benefits.googleReviewMonthlyLimit}). Resets next month.`
        };
      }
      
      // Check cooldown
      if (subscription.lastGoogleReviewMissionCreated) {
        const hoursSinceLastReview = 
          (Date.now() - subscription.lastGoogleReviewMissionCreated.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastReview < benefits.googleReviewCooldownHours) {
          const hoursLeft = Math.ceil(benefits.googleReviewCooldownHours - hoursSinceLastReview);
          return {
            allowed: false,
            reason: `Cooldown active. Wait ${hoursLeft} more hours before creating another Google review mission.`
          };
        }
      }
    }
    
    // Check Referral limits (Safety Rules)
    if (missionType === 'REFERRAL') {
      if (subscription.referralMissionsThisMonth >= benefits.referralMissionsPerMonth) {
        return {
          allowed: false,
          reason: `Monthly referral limit reached (${benefits.referralMissionsPerMonth}). Upgrade or wait until next month.`
        };
      }
    }
    
    return { allowed: true };
  } catch (error) {
    console.error('[canCreateMission] Error:', error);
    return { allowed: false, reason: 'Error checking eligibility' };
  }
};

/**
 * Record mission creation
 */
export const recordMissionCreation = async (
  userId: string,
  missionType: string
): Promise<void> => {
  try {
    const subRef = doc(db, 'level2Subscriptions', userId);
    const updates: any = {
      activeMissionsCount: (await getLevel2Subscription(userId))?.activeMissionsCount || 0 + 1
    };
    
    if (missionType === 'GOOGLE_REVIEW') {
      updates.googleReviewsThisMonth = 
        ((await getLevel2Subscription(userId))?.googleReviewsThisMonth || 0) + 1;
      updates.lastGoogleReviewMissionCreated = new Date();
    }
    
    if (missionType === 'REFERRAL') {
      updates.referralMissionsThisMonth = 
        ((await getLevel2Subscription(userId))?.referralMissionsThisMonth || 0) + 1;
    }
    
    await updateDoc(subRef, updates);
  } catch (error) {
    console.error('[recordMissionCreation] Error:', error);
  }
};

/**
 * Record mission completion (decrement active count)
 */
export const recordMissionCompletion = async (userId: string): Promise<void> => {
  try {
    const subscription = await getLevel2Subscription(userId);
    if (subscription && subscription.activeMissionsCount > 0) {
      await updateDoc(doc(db, 'level2Subscriptions', userId), {
        activeMissionsCount: subscription.activeMissionsCount - 1
      });
    }
  } catch (error) {
    console.error('[recordMissionCompletion] Error:', error);
  }
};

/**
 * Get benefits for a specific tier
 */
export const getBenefitsForTier = (tier: Level2Tier): Level2Benefits => {
  return LEVEL2_TIER_BENEFITS[tier];
};

/**
 * Get tier pricing
 */
export const getTierPricing = (tier: Level2Tier): number => {
  return LEVEL2_TIER_PRICING[tier];
};

/**
 * Check if user has a specific benefit
 */
export const hasBenefit = async (
  userId: string,
  benefit: keyof Level2Benefits
): Promise<boolean> => {
  try {
    const subscription = await getLevel2Subscription(userId);
    if (!subscription) return false;
    
    const benefits = LEVEL2_TIER_BENEFITS[subscription.tier];
    return Boolean(benefits[benefit]);
  } catch (error) {
    console.error('[hasBenefit] Error:', error);
    return false;
  }
};

/**
 * Check if user can join an event (Level 2 businesses)
 */
export const canJoinEvent = async (
  userId: string,
  isFreeEvent: boolean = false
): Promise<{ allowed: boolean; reason?: string; requiresPayment?: boolean }> => {
  try {
    const subscription = await getLevel2Subscription(userId);
    if (!subscription) {
      return { allowed: false, reason: 'No subscription found' };
    }
    
    const benefits = LEVEL2_TIER_BENEFITS[subscription.tier];
    
    // Check if they have events access at all
    if (!benefits.eventsAccess) {
      return {
        allowed: false,
        reason: 'Upgrade to Silver or higher to access business events',
        requiresPayment: true
      };
    }
    
    // Check monthly free events (PLATINUM gets 1/month)
    if (isFreeEvent && benefits.freeEventsPerMonth > 0) {
      if (subscription.freeEventsUsedThisMonth >= benefits.freeEventsPerMonth) {
        // Check quarterly bonus
        if (benefits.freeEventsPerQuarter > 0 && subscription.freeEventsUsedThisQuarter < benefits.freeEventsPerQuarter) {
          return { allowed: true }; // Use quarterly bonus
        }
        return {
          allowed: false,
          reason: `You've used your ${benefits.freeEventsPerMonth} free event(s) this month. Quarterly bonus: ${subscription.freeEventsUsedThisQuarter}/${benefits.freeEventsPerQuarter}`,
          requiresPayment: true
        };
      }
      return { allowed: true }; // Use monthly free event
    }
    
    // Check quarterly free events (GOLD gets 1/quarter)
    if (isFreeEvent && benefits.freeEventsPerQuarter > 0) {
      if (subscription.freeEventsUsedThisQuarter >= benefits.freeEventsPerQuarter) {
        return {
          allowed: false,
          reason: `You've used your ${benefits.freeEventsPerQuarter} free event(s) this quarter`,
          requiresPayment: true
        };
      }
      return { allowed: true };
    }
    
    // Pay-per-use events (SILVER, GOLD, PLATINUM beyond free quota)
    if (benefits.eventsPayPerUse) {
      return {
        allowed: true,
        requiresPayment: !isFreeEvent
      };
    }
    
    return { allowed: true };
  } catch (error) {
    console.error('[canJoinEvent] Error:', error);
    return { allowed: false, reason: 'Error checking eligibility' };
  }
};

/**
 * Record event attendance (for tracking free event usage)
 */
export const recordEventAttendance = async (
  userId: string,
  isFreeEvent: boolean = false
): Promise<void> => {
  try {
    const subRef = doc(db, 'level2Subscriptions', userId);
    const subscription = await getLevel2Subscription(userId);
    
    if (!subscription) return;
    
    const benefits = LEVEL2_TIER_BENEFITS[subscription.tier];
    
    const updates: any = {
      eventsAttendedThisMonth: (subscription.eventsAttendedThisMonth || 0) + 1,
      eventsAttendedThisQuarter: (subscription.eventsAttendedThisQuarter || 0) + 1
    };
    
    // Only count free events against quota
    if (isFreeEvent) {
      // PLATINUM: Check monthly quota first, then quarterly bonus
      if (benefits.freeEventsPerMonth > 0) {
        if ((subscription.freeEventsUsedThisMonth || 0) < benefits.freeEventsPerMonth) {
          updates.freeEventsUsedThisMonth = (subscription.freeEventsUsedThisMonth || 0) + 1;
        } else if ((subscription.freeEventsUsedThisQuarter || 0) < benefits.freeEventsPerQuarter) {
          updates.freeEventsUsedThisQuarter = (subscription.freeEventsUsedThisQuarter || 0) + 1;
        }
      }
      // GOLD: Only quarterly quota
      else if (benefits.freeEventsPerQuarter > 0) {
        updates.freeEventsUsedThisQuarter = (subscription.freeEventsUsedThisQuarter || 0) + 1;
      }
    }
    
    await updateDoc(subRef, updates);
  } catch (error) {
    console.error('[recordEventAttendance] Error:', error);
  }
};
