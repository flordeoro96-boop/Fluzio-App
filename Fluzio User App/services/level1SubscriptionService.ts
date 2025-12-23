import { db } from './AuthContext';
import { doc, updateDoc, getDoc, collection, query, where, getDocs, Timestamp, setDoc } from 'firebase/firestore';

export type Level1Tier = 'FREE' | 'SILVER' | 'GOLD';

export interface Level1Benefits {
  monthlySquadMeetups: number;
  eventsAccess: boolean;
  freeEventsPerQuarter: number;
  freeEventsPerMonth: number;
  unlimitedEvents: boolean;
  earlyAccessCityLaunches: boolean;
  level2Preview: boolean;
  priorityCityAccess: boolean;
  betaFeaturesAccess: boolean;
  earlyBuilderBadge: boolean;
  missionPreviewOnly: boolean; // Read-only missions
  publicCityFeedAccess: boolean;
}

// Benefits configuration for each tier
export const LEVEL1_TIER_BENEFITS: Record<Level1Tier, Level1Benefits> = {
  FREE: {
    monthlySquadMeetups: 1,
    eventsAccess: false,
    freeEventsPerQuarter: 0,
    freeEventsPerMonth: 0,
    unlimitedEvents: false,
    earlyAccessCityLaunches: false,
    level2Preview: false,
    priorityCityAccess: false,
    betaFeaturesAccess: false,
    earlyBuilderBadge: false,
    missionPreviewOnly: true, // Can only preview missions
    publicCityFeedAccess: true
  },
  SILVER: {
    monthlySquadMeetups: 1,
    eventsAccess: true,
    freeEventsPerQuarter: 1,
    freeEventsPerMonth: 0,
    unlimitedEvents: false,
    earlyAccessCityLaunches: true,
    level2Preview: true,
    priorityCityAccess: false,
    betaFeaturesAccess: false,
    earlyBuilderBadge: false,
    missionPreviewOnly: true,
    publicCityFeedAccess: true
  },
  GOLD: {
    monthlySquadMeetups: 3, // 2-3 meetups
    eventsAccess: true,
    freeEventsPerQuarter: 0,
    freeEventsPerMonth: 1,
    unlimitedEvents: true,
    earlyAccessCityLaunches: true,
    level2Preview: true,
    priorityCityAccess: true,
    betaFeaturesAccess: true,
    earlyBuilderBadge: true,
    missionPreviewOnly: true,
    publicCityFeedAccess: true
  }
};

export interface Level1Subscription {
  userId: string;
  tier: Level1Tier;
  status: 'ACTIVE' | 'CANCELED' | 'PAST_DUE';
  startDate: Date;
  nextBillingDate?: Date;
  canceledAt?: Date;
  
  // Usage tracking
  squadMeetupsAttendedThisMonth: number;
  eventsAttendedThisMonth: number;
  eventsAttendedThisQuarter: number;
  freeEventsUsedThisMonth: number;
  freeEventsUsedThisQuarter: number;
  
  // Reset dates
  lastMonthlyReset: Date;
  lastQuarterlyReset: Date;
  
  // Payment
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

/**
 * Get Level 1 subscription for a user
 */
export const getLevel1Subscription = async (userId: string): Promise<Level1Subscription | null> => {
  try {
    const subDoc = await getDoc(doc(db, 'level1Subscriptions', userId));
    
    if (!subDoc.exists()) {
      // Create default FREE subscription
      const defaultSub: Level1Subscription = {
        userId,
        tier: 'FREE',
        status: 'ACTIVE',
        startDate: new Date(),
        squadMeetupsAttendedThisMonth: 0,
        eventsAttendedThisMonth: 0,
        eventsAttendedThisQuarter: 0,
        freeEventsUsedThisMonth: 0,
        freeEventsUsedThisQuarter: 0,
        lastMonthlyReset: new Date(),
        lastQuarterlyReset: new Date()
      };
      
      await setDoc(doc(db, 'level1Subscriptions', userId), defaultSub);
      return defaultSub;
    }
    
    return subDoc.data() as Level1Subscription;
  } catch (error) {
    console.error('[getLevel1Subscription] Error:', error);
    return null;
  }
};

/**
 * Update Level 1 subscription tier
 */
export const updateLevel1Tier = async (
  userId: string,
  newTier: Level1Tier
): Promise<{ success: boolean; error?: string }> => {
  try {
    const subRef = doc(db, 'level1Subscriptions', userId);
    const subDoc = await getDoc(subRef);
    
    if (!subDoc.exists()) {
      // Create new subscription
      const newSub: Level1Subscription = {
        userId,
        tier: newTier,
        status: 'ACTIVE',
        startDate: new Date(),
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
        squadMeetupsAttendedThisMonth: 0,
        eventsAttendedThisMonth: 0,
        eventsAttendedThisQuarter: 0,
        freeEventsUsedThisMonth: 0,
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
    
    // Also update user document
    await updateDoc(doc(db, 'users', userId), {
      subscriptionLevel: newTier,
      updatedAt: Timestamp.now()
    });
    
    return { success: true };
  } catch (error) {
    console.error('[updateLevel1Tier] Error:', error);
    return { success: false, error: 'Failed to update subscription' };
  }
};

/**
 * Check if user can attend a squad meetup this month
 */
export const canAttendSquadMeetup = async (userId: string): Promise<{ allowed: boolean; reason?: string }> => {
  try {
    const subscription = await getLevel1Subscription(userId);
    if (!subscription) {
      return { allowed: false, reason: 'No subscription found' };
    }
    
    const benefits = LEVEL1_TIER_BENEFITS[subscription.tier];
    
    if (subscription.squadMeetupsAttendedThisMonth >= benefits.monthlySquadMeetups) {
      return {
        allowed: false,
        reason: `You've reached your monthly limit of ${benefits.monthlySquadMeetups} meetup(s). Upgrade to Gold for more!`
      };
    }
    
    return { allowed: true };
  } catch (error) {
    console.error('[canAttendSquadMeetup] Error:', error);
    return { allowed: false, reason: 'Error checking eligibility' };
  }
};

/**
 * Check if user can attend a business event
 */
export const canAttendBusinessEvent = async (
  userId: string,
  isFreeEvent: boolean = false
): Promise<{ allowed: boolean; reason?: string; requiresPayment?: boolean }> => {
  try {
    const subscription = await getLevel1Subscription(userId);
    if (!subscription) {
      return { allowed: false, reason: 'No subscription found' };
    }
    
    const benefits = LEVEL1_TIER_BENEFITS[subscription.tier];
    
    // Check if they have events access at all
    if (!benefits.eventsAccess) {
      return {
        allowed: false,
        reason: 'Upgrade to Silver or Gold to access business events',
        requiresPayment: true
      };
    }
    
    // If unlimited events, always allow
    if (benefits.unlimitedEvents) {
      return { allowed: true };
    }
    
    // Check free event quotas
    if (isFreeEvent) {
      // Monthly free events (Gold tier)
      if (benefits.freeEventsPerMonth > 0) {
        if (subscription.freeEventsUsedThisMonth >= benefits.freeEventsPerMonth) {
          return {
            allowed: false,
            reason: `You've used your ${benefits.freeEventsPerMonth} free event(s) this month`
          };
        }
        return { allowed: true };
      }
      
      // Quarterly free events (Silver tier)
      if (benefits.freeEventsPerQuarter > 0) {
        if (subscription.freeEventsUsedThisQuarter >= benefits.freeEventsPerQuarter) {
          return {
            allowed: false,
            reason: `You've used your ${benefits.freeEventsPerQuarter} free event(s) this quarter`
          };
        }
        return { allowed: true };
      }
    }
    
    // Paid event - allow if they have events access
    return { allowed: true, requiresPayment: !isFreeEvent };
  } catch (error) {
    console.error('[canAttendBusinessEvent] Error:', error);
    return { allowed: false, reason: 'Error checking eligibility' };
  }
};

/**
 * Record squad meetup attendance
 */
export const recordSquadMeetupAttendance = async (userId: string): Promise<void> => {
  try {
    const subRef = doc(db, 'level1Subscriptions', userId);
    const subDoc = await getDoc(subRef);
    
    if (subDoc.exists()) {
      const data = subDoc.data() as Level1Subscription;
      await updateDoc(subRef, {
        squadMeetupsAttendedThisMonth: (data.squadMeetupsAttendedThisMonth || 0) + 1
      });
    }
  } catch (error) {
    console.error('[recordSquadMeetupAttendance] Error:', error);
  }
};

/**
 * Record business event attendance
 */
export const recordBusinessEventAttendance = async (
  userId: string,
  isFreeEvent: boolean = false
): Promise<void> => {
  try {
    const subRef = doc(db, 'level1Subscriptions', userId);
    const subDoc = await getDoc(subRef);
    
    if (subDoc.exists()) {
      const data = subDoc.data() as Level1Subscription;
      const updates: any = {
        eventsAttendedThisMonth: (data.eventsAttendedThisMonth || 0) + 1,
        eventsAttendedThisQuarter: (data.eventsAttendedThisQuarter || 0) + 1
      };
      
      if (isFreeEvent) {
        updates.freeEventsUsedThisMonth = (data.freeEventsUsedThisMonth || 0) + 1;
        updates.freeEventsUsedThisQuarter = (data.freeEventsUsedThisQuarter || 0) + 1;
      }
      
      await updateDoc(subRef, updates);
    }
  } catch (error) {
    console.error('[recordBusinessEventAttendance] Error:', error);
  }
};

/**
 * Reset monthly counters (should be called by a Cloud Function on 1st of each month)
 */
export const resetMonthlyCounters = async (): Promise<void> => {
  try {
    const subsSnapshot = await getDocs(collection(db, 'level1Subscriptions'));
    
    const batch: any[] = [];
    subsSnapshot.forEach((doc) => {
      batch.push(
        updateDoc(doc.ref, {
          squadMeetupsAttendedThisMonth: 0,
          eventsAttendedThisMonth: 0,
          freeEventsUsedThisMonth: 0,
          lastMonthlyReset: new Date()
        })
      );
    });
    
    await Promise.all(batch);
    console.log('[resetMonthlyCounters] Reset counters for', subsSnapshot.size, 'subscriptions');
  } catch (error) {
    console.error('[resetMonthlyCounters] Error:', error);
  }
};

/**
 * Get benefits for a specific tier
 */
export const getBenefitsForTier = (tier: Level1Tier): Level1Benefits => {
  return LEVEL1_TIER_BENEFITS[tier];
};

/**
 * Check if user has a specific benefit
 */
export const hasBenefit = async (
  userId: string,
  benefit: keyof Level1Benefits
): Promise<boolean> => {
  try {
    const subscription = await getLevel1Subscription(userId);
    if (!subscription) return false;
    
    const benefits = LEVEL1_TIER_BENEFITS[subscription.tier];
    return Boolean(benefits[benefit]);
  } catch (error) {
    console.error('[hasBenefit] Error:', error);
    return false;
  }
};

// Export aliases for consistency with Level2
export { canAttendBusinessEvent as canJoinEvent, recordBusinessEventAttendance as recordEventAttendance };
