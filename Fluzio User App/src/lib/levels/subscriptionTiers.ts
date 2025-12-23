/**
 * Fluzio Subscription Tiers & Pricing System
 * 
 * Implements the complete 6-level × 4-tier pricing model with:
 * - Dynamic pricing per level
 * - Growth Credits (FGC) allocation
 * - Mission creation rules
 * - Meetup hosting limits
 * - Perks and rewards
 * - Annual discounts
 * - Level-based purchase discounts
 */

// ============================================================================
// SUBSCRIPTION TIERS
// ============================================================================

export type SubscriptionTier = 'BASIC' | 'SILVER' | 'GOLD' | 'PLATINUM';
export type BusinessLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface TierPricing {
  monthly: number;  // EUR per month
  annual: number;   // EUR per year (with discount)
  annualMonths: number; // How many months you pay for annual
}

// ============================================================================
// PRICING MATRIX (EUR)
// ============================================================================

export const TIER_PRICING: Record<BusinessLevel, Record<SubscriptionTier, TierPricing>> = {
  1: {
    BASIC: { monthly: 0, annual: 0, annualMonths: 0 },
    SILVER: { monthly: 0, annual: 0, annualMonths: 0 }, // Not available
    GOLD: { monthly: 0, annual: 0, annualMonths: 0 },
    PLATINUM: { monthly: 0, annual: 0, annualMonths: 0 }
  },
  2: {
    BASIC: { monthly: 0, annual: 0, annualMonths: 0 },
    SILVER: { monthly: 19, annual: 190, annualMonths: 10 },
    GOLD: { monthly: 39, annual: 390, annualMonths: 10 },
    PLATINUM: { monthly: 79, annual: 711, annualMonths: 9 }
  },
  3: {
    BASIC: { monthly: 0, annual: 0, annualMonths: 0 },
    SILVER: { monthly: 39, annual: 390, annualMonths: 10 },
    GOLD: { monthly: 79, annual: 790, annualMonths: 10 },
    PLATINUM: { monthly: 149, annual: 1341, annualMonths: 9 }
  },
  4: {
    BASIC: { monthly: 0, annual: 0, annualMonths: 0 },
    SILVER: { monthly: 59, annual: 590, annualMonths: 10 },
    GOLD: { monthly: 119, annual: 1190, annualMonths: 10 },
    PLATINUM: { monthly: 199, annual: 1791, annualMonths: 9 }
  },
  5: {
    BASIC: { monthly: 0, annual: 0, annualMonths: 0 },
    SILVER: { monthly: 79, annual: 790, annualMonths: 10 },
    GOLD: { monthly: 149, annual: 1490, annualMonths: 10 },
    PLATINUM: { monthly: 249, annual: 2241, annualMonths: 9 }
  },
  6: {
    BASIC: { monthly: 0, annual: 0, annualMonths: 0 },
    SILVER: { monthly: 119, annual: 1190, annualMonths: 10 },
    GOLD: { monthly: 199, annual: 1990, annualMonths: 10 },
    PLATINUM: { monthly: 349, annual: 3141, annualMonths: 9 }
  }
};

// ============================================================================
// GROWTH CREDITS (FGC) ALLOCATION
// ============================================================================

export const GROWTH_CREDITS: Record<BusinessLevel, Record<SubscriptionTier, number>> = {
  1: {
    BASIC: 0,
    SILVER: 0,
    GOLD: 0,
    PLATINUM: 0
  },
  2: {
    BASIC: 0,
    SILVER: 200,
    GOLD: 500,
    PLATINUM: 1000
  },
  3: {
    BASIC: 50,
    SILVER: 300,
    GOLD: 800,
    PLATINUM: 1500
  },
  4: {
    BASIC: 100,
    SILVER: 500,
    GOLD: 1000,
    PLATINUM: 2000
  },
  5: {
    BASIC: 200,
    SILVER: 700,
    GOLD: 1500,
    PLATINUM: 2500
  },
  6: {
    BASIC: 300,
    SILVER: 1000,
    GOLD: 2000,
    PLATINUM: 3000
  }
};

// ============================================================================
// GROWTH CREDIT PURCHASE PACKS
// ============================================================================

export interface GrowthCreditPack {
  credits: number;
  price: number; // Base price in EUR
  name: string;
}

export const GROWTH_CREDIT_PACKS: GrowthCreditPack[] = [
  { credits: 100, price: 5, name: 'Starter' },
  { credits: 500, price: 19, name: 'Growth' },
  { credits: 1000, price: 29, name: 'Boost' },
  { credits: 3000, price: 59, name: 'Scale' },
  { credits: 10000, price: 149, name: 'Enterprise' }
];

// Level-based discounts on Growth Credit purchases
export const GROWTH_CREDIT_DISCOUNTS: Record<BusinessLevel, number> = {
  1: 0,
  2: 0,
  3: 0,
  4: 0.10, // 10% off
  5: 0.20, // 20% off
  6: 0.30  // 30% off
};

// ============================================================================
// MISSION CREATION RULES
// ============================================================================

export interface MissionLimits {
  maxMissionsPerMonth: number;
  maxParticipants: number;
  geographicReach: 'SAME_CITY' | 'NEARBY_CITIES' | 'COUNTRY' | 'MULTI_COUNTRY' | 'GLOBAL';
  priorityMatching: boolean;
  missionBoosts: number; // Free boosts per month
  premiumTemplates: boolean;
  collabMissions: boolean;
  influencerMissions: boolean;
  automatedCampaigns: boolean;
}

export const MISSION_LIMITS: Record<BusinessLevel, Record<SubscriptionTier, MissionLimits>> = {
  1: {
    BASIC: {
      maxMissionsPerMonth: 0,
      maxParticipants: 0,
      geographicReach: 'SAME_CITY',
      priorityMatching: false,
      missionBoosts: 0,
      premiumTemplates: false,
      collabMissions: false,
      influencerMissions: false,
      automatedCampaigns: false
    },
    SILVER: { maxMissionsPerMonth: 0, maxParticipants: 0, geographicReach: 'SAME_CITY', priorityMatching: false, missionBoosts: 0, premiumTemplates: false, collabMissions: false, influencerMissions: false, automatedCampaigns: false },
    GOLD: { maxMissionsPerMonth: 0, maxParticipants: 0, geographicReach: 'SAME_CITY', priorityMatching: false, missionBoosts: 0, premiumTemplates: false, collabMissions: false, influencerMissions: false, automatedCampaigns: false },
    PLATINUM: { maxMissionsPerMonth: 0, maxParticipants: 0, geographicReach: 'SAME_CITY', priorityMatching: false, missionBoosts: 0, premiumTemplates: false, collabMissions: false, influencerMissions: false, automatedCampaigns: false }
  },
  2: {
    BASIC: {
      maxMissionsPerMonth: 2,
      maxParticipants: 10,
      geographicReach: 'SAME_CITY',
      priorityMatching: false,
      missionBoosts: 0,
      premiumTemplates: false,
      collabMissions: false,
      influencerMissions: false,
      automatedCampaigns: false
    },
    SILVER: {
      maxMissionsPerMonth: 10,
      maxParticipants: 30,
      geographicReach: 'NEARBY_CITIES',
      priorityMatching: false,
      missionBoosts: 0,
      premiumTemplates: false,
      collabMissions: false,
      influencerMissions: false,
      automatedCampaigns: false
    },
    GOLD: {
      maxMissionsPerMonth: 30,
      maxParticipants: 100,
      geographicReach: 'MULTI_COUNTRY',
      priorityMatching: false,
      missionBoosts: 1,
      premiumTemplates: true,
      collabMissions: false,
      influencerMissions: false,
      automatedCampaigns: false
    },
    PLATINUM: {
      maxMissionsPerMonth: -1, // Unlimited
      maxParticipants: -1, // Unlimited
      geographicReach: 'GLOBAL',
      priorityMatching: true,
      missionBoosts: 3,
      premiumTemplates: true,
      collabMissions: true,
      influencerMissions: false,
      automatedCampaigns: false
    }
  },
  3: {
    BASIC: {
      maxMissionsPerMonth: 5,
      maxParticipants: 20,
      geographicReach: 'SAME_CITY',
      priorityMatching: false,
      missionBoosts: 1,
      premiumTemplates: false,
      collabMissions: false,
      influencerMissions: false,
      automatedCampaigns: false
    },
    SILVER: {
      maxMissionsPerMonth: 20,
      maxParticipants: 50,
      geographicReach: 'COUNTRY',
      priorityMatching: false,
      missionBoosts: 1,
      premiumTemplates: true,
      collabMissions: true,
      influencerMissions: true,
      automatedCampaigns: false
    },
    GOLD: {
      maxMissionsPerMonth: 50,
      maxParticipants: 200,
      geographicReach: 'MULTI_COUNTRY',
      priorityMatching: true,
      missionBoosts: 2,
      premiumTemplates: true,
      collabMissions: true,
      influencerMissions: true,
      automatedCampaigns: false
    },
    PLATINUM: {
      maxMissionsPerMonth: -1,
      maxParticipants: -1,
      geographicReach: 'GLOBAL',
      priorityMatching: true,
      missionBoosts: 5,
      premiumTemplates: true,
      collabMissions: true,
      influencerMissions: true,
      automatedCampaigns: false
    }
  },
  4: {
    BASIC: {
      maxMissionsPerMonth: 10,
      maxParticipants: 30,
      geographicReach: 'NEARBY_CITIES',
      priorityMatching: false,
      missionBoosts: 1,
      premiumTemplates: false,
      collabMissions: false,
      influencerMissions: true,
      automatedCampaigns: false
    },
    SILVER: {
      maxMissionsPerMonth: 30,
      maxParticipants: 100,
      geographicReach: 'COUNTRY',
      priorityMatching: true,
      missionBoosts: 2,
      premiumTemplates: true,
      collabMissions: true,
      influencerMissions: true,
      automatedCampaigns: false
    },
    GOLD: {
      maxMissionsPerMonth: -1,
      maxParticipants: -1,
      geographicReach: 'GLOBAL',
      priorityMatching: true,
      missionBoosts: 3,
      premiumTemplates: true,
      collabMissions: true,
      influencerMissions: true,
      automatedCampaigns: true
    },
    PLATINUM: {
      maxMissionsPerMonth: -1,
      maxParticipants: -1,
      geographicReach: 'GLOBAL',
      priorityMatching: true,
      missionBoosts: 10,
      premiumTemplates: true,
      collabMissions: true,
      influencerMissions: true,
      automatedCampaigns: true
    }
  },
  5: {
    BASIC: {
      maxMissionsPerMonth: 20,
      maxParticipants: 50,
      geographicReach: 'COUNTRY',
      priorityMatching: false,
      missionBoosts: 2,
      premiumTemplates: true,
      collabMissions: true,
      influencerMissions: true,
      automatedCampaigns: false
    },
    SILVER: {
      maxMissionsPerMonth: -1,
      maxParticipants: -1,
      geographicReach: 'GLOBAL',
      priorityMatching: true,
      missionBoosts: 3,
      premiumTemplates: true,
      collabMissions: true,
      influencerMissions: true,
      automatedCampaigns: false
    },
    GOLD: {
      maxMissionsPerMonth: -1,
      maxParticipants: -1,
      geographicReach: 'GLOBAL',
      priorityMatching: true,
      missionBoosts: 5,
      premiumTemplates: true,
      collabMissions: true,
      influencerMissions: true,
      automatedCampaigns: true
    },
    PLATINUM: {
      maxMissionsPerMonth: -1,
      maxParticipants: -1,
      geographicReach: 'GLOBAL',
      priorityMatching: true,
      missionBoosts: -1, // Unlimited
      premiumTemplates: true,
      collabMissions: true,
      influencerMissions: true,
      automatedCampaigns: true
    }
  },
  6: {
    BASIC: {
      maxMissionsPerMonth: -1,
      maxParticipants: -1,
      geographicReach: 'GLOBAL',
      priorityMatching: true,
      missionBoosts: 3,
      premiumTemplates: true,
      collabMissions: true,
      influencerMissions: true,
      automatedCampaigns: false
    },
    SILVER: {
      maxMissionsPerMonth: -1,
      maxParticipants: -1,
      geographicReach: 'GLOBAL',
      priorityMatching: true,
      missionBoosts: 5,
      premiumTemplates: true,
      collabMissions: true,
      influencerMissions: true,
      automatedCampaigns: true
    },
    GOLD: {
      maxMissionsPerMonth: -1,
      maxParticipants: -1,
      geographicReach: 'GLOBAL',
      priorityMatching: true,
      missionBoosts: -1,
      premiumTemplates: true,
      collabMissions: true,
      influencerMissions: true,
      automatedCampaigns: true
    },
    PLATINUM: {
      maxMissionsPerMonth: -1,
      maxParticipants: -1,
      geographicReach: 'GLOBAL',
      priorityMatching: true,
      missionBoosts: -1,
      premiumTemplates: true,
      collabMissions: true,
      influencerMissions: true,
      automatedCampaigns: true
    }
  }
};

// ============================================================================
// MEETUP HOSTING LIMITS
// ============================================================================

export interface MeetupLimits {
  maxJoinPerMonth: number;
  maxHostPerMonth: number;
  featuredInCity: boolean;
  vipAccess: boolean;
  globalMatching: boolean;
}

export const MEETUP_LIMITS: Record<BusinessLevel, Record<SubscriptionTier, MeetupLimits>> = {
  1: {
    BASIC: { maxJoinPerMonth: 2, maxHostPerMonth: 0, featuredInCity: false, vipAccess: false, globalMatching: false },
    SILVER: { maxJoinPerMonth: 2, maxHostPerMonth: 0, featuredInCity: false, vipAccess: false, globalMatching: false },
    GOLD: { maxJoinPerMonth: 2, maxHostPerMonth: 0, featuredInCity: false, vipAccess: false, globalMatching: false },
    PLATINUM: { maxJoinPerMonth: 2, maxHostPerMonth: 0, featuredInCity: false, vipAccess: false, globalMatching: false }
  },
  2: {
    BASIC: { maxJoinPerMonth: -1, maxHostPerMonth: 1, featuredInCity: false, vipAccess: false, globalMatching: false },
    SILVER: { maxJoinPerMonth: -1, maxHostPerMonth: 2, featuredInCity: false, vipAccess: false, globalMatching: false },
    GOLD: { maxJoinPerMonth: -1, maxHostPerMonth: 3, featuredInCity: false, vipAccess: false, globalMatching: false },
    PLATINUM: { maxJoinPerMonth: -1, maxHostPerMonth: 5, featuredInCity: true, vipAccess: false, globalMatching: false }
  },
  3: {
    BASIC: { maxJoinPerMonth: -1, maxHostPerMonth: 2, featuredInCity: false, vipAccess: false, globalMatching: false },
    SILVER: { maxJoinPerMonth: -1, maxHostPerMonth: 3, featuredInCity: false, vipAccess: false, globalMatching: false },
    GOLD: { maxJoinPerMonth: -1, maxHostPerMonth: 4, featuredInCity: true, vipAccess: false, globalMatching: false },
    PLATINUM: { maxJoinPerMonth: -1, maxHostPerMonth: -1, featuredInCity: true, vipAccess: false, globalMatching: false }
  },
  4: {
    BASIC: { maxJoinPerMonth: -1, maxHostPerMonth: 3, featuredInCity: false, vipAccess: false, globalMatching: false },
    SILVER: { maxJoinPerMonth: -1, maxHostPerMonth: -1, featuredInCity: true, vipAccess: false, globalMatching: false },
    GOLD: { maxJoinPerMonth: -1, maxHostPerMonth: -1, featuredInCity: true, vipAccess: false, globalMatching: true },
    PLATINUM: { maxJoinPerMonth: -1, maxHostPerMonth: -1, featuredInCity: true, vipAccess: true, globalMatching: true }
  },
  5: {
    BASIC: { maxJoinPerMonth: -1, maxHostPerMonth: -1, featuredInCity: true, vipAccess: false, globalMatching: false },
    SILVER: { maxJoinPerMonth: -1, maxHostPerMonth: -1, featuredInCity: true, vipAccess: true, globalMatching: true },
    GOLD: { maxJoinPerMonth: -1, maxHostPerMonth: -1, featuredInCity: true, vipAccess: true, globalMatching: true },
    PLATINUM: { maxJoinPerMonth: -1, maxHostPerMonth: -1, featuredInCity: true, vipAccess: true, globalMatching: true }
  },
  6: {
    BASIC: { maxJoinPerMonth: -1, maxHostPerMonth: -1, featuredInCity: true, vipAccess: true, globalMatching: true },
    SILVER: { maxJoinPerMonth: -1, maxHostPerMonth: -1, featuredInCity: true, vipAccess: true, globalMatching: true },
    GOLD: { maxJoinPerMonth: -1, maxHostPerMonth: -1, featuredInCity: true, vipAccess: true, globalMatching: true },
    PLATINUM: { maxJoinPerMonth: -1, maxHostPerMonth: -1, featuredInCity: true, vipAccess: true, globalMatching: true }
  }
};

// ============================================================================
// PERKS & REWARDS
// ============================================================================

export interface LevelPerks {
  analytics: 'NONE' | 'BASIC' | 'ADVANCED' | 'PREMIUM';
  freeEventsPerMonth: number;
  workshopsPerYear: number;
  cityPromotion: boolean;
  speakerOpportunities: boolean;
  retreatAccess: boolean;
  vipConcierge: boolean;
  verifiedBadge: boolean;
  discountOnEvents: number; // Percentage
  discountOnGrowthCredits: number; // Percentage
}

export const LEVEL_PERKS: Record<BusinessLevel, Record<SubscriptionTier, LevelPerks>> = {
  1: {
    BASIC: { analytics: 'NONE', freeEventsPerMonth: 0, workshopsPerYear: 0, cityPromotion: false, speakerOpportunities: false, retreatAccess: false, vipConcierge: false, verifiedBadge: false, discountOnEvents: 0, discountOnGrowthCredits: 0 },
    SILVER: { analytics: 'NONE', freeEventsPerMonth: 0, workshopsPerYear: 0, cityPromotion: false, speakerOpportunities: false, retreatAccess: false, vipConcierge: false, verifiedBadge: false, discountOnEvents: 0, discountOnGrowthCredits: 0 },
    GOLD: { analytics: 'NONE', freeEventsPerMonth: 0, workshopsPerYear: 0, cityPromotion: false, speakerOpportunities: false, retreatAccess: false, vipConcierge: false, verifiedBadge: false, discountOnEvents: 0, discountOnGrowthCredits: 0 },
    PLATINUM: { analytics: 'NONE', freeEventsPerMonth: 0, workshopsPerYear: 0, cityPromotion: false, speakerOpportunities: false, retreatAccess: false, vipConcierge: false, verifiedBadge: false, discountOnEvents: 0, discountOnGrowthCredits: 0 }
  },
  2: {
    BASIC: { analytics: 'NONE', freeEventsPerMonth: 0, workshopsPerYear: 0, cityPromotion: false, speakerOpportunities: false, retreatAccess: false, vipConcierge: false, verifiedBadge: false, discountOnEvents: 0, discountOnGrowthCredits: 0 },
    SILVER: { analytics: 'BASIC', freeEventsPerMonth: 0, workshopsPerYear: 0, cityPromotion: false, speakerOpportunities: false, retreatAccess: false, vipConcierge: false, verifiedBadge: false, discountOnEvents: 0, discountOnGrowthCredits: 0 },
    GOLD: { analytics: 'BASIC', freeEventsPerMonth: 0, workshopsPerYear: 1, cityPromotion: false, speakerOpportunities: false, retreatAccess: false, vipConcierge: false, verifiedBadge: false, discountOnEvents: 0, discountOnGrowthCredits: 0 },
    PLATINUM: { analytics: 'ADVANCED', freeEventsPerMonth: 1, workshopsPerYear: 2, cityPromotion: true, speakerOpportunities: false, retreatAccess: false, vipConcierge: false, verifiedBadge: false, discountOnEvents: 0, discountOnGrowthCredits: 0 }
  },
  3: {
    BASIC: { analytics: 'BASIC', freeEventsPerMonth: 0, workshopsPerYear: 0, cityPromotion: false, speakerOpportunities: false, retreatAccess: false, vipConcierge: false, verifiedBadge: false, discountOnEvents: 0, discountOnGrowthCredits: 0 },
    SILVER: { analytics: 'BASIC', freeEventsPerMonth: 0, workshopsPerYear: 1, cityPromotion: false, speakerOpportunities: false, retreatAccess: false, vipConcierge: false, verifiedBadge: false, discountOnEvents: 0, discountOnGrowthCredits: 0 },
    GOLD: { analytics: 'ADVANCED', freeEventsPerMonth: 1, workshopsPerYear: 2, cityPromotion: true, speakerOpportunities: false, retreatAccess: false, vipConcierge: false, verifiedBadge: false, discountOnEvents: 0, discountOnGrowthCredits: 0 },
    PLATINUM: { analytics: 'PREMIUM', freeEventsPerMonth: 2, workshopsPerYear: 4, cityPromotion: true, speakerOpportunities: true, retreatAccess: false, vipConcierge: false, verifiedBadge: false, discountOnEvents: 10, discountOnGrowthCredits: 0 }
  },
  4: {
    BASIC: { analytics: 'BASIC', freeEventsPerMonth: 0, workshopsPerYear: 1, cityPromotion: false, speakerOpportunities: false, retreatAccess: false, vipConcierge: false, verifiedBadge: false, discountOnEvents: 10, discountOnGrowthCredits: 10 },
    SILVER: { analytics: 'ADVANCED', freeEventsPerMonth: 1, workshopsPerYear: 2, cityPromotion: true, speakerOpportunities: false, retreatAccess: false, vipConcierge: false, verifiedBadge: false, discountOnEvents: 10, discountOnGrowthCredits: 10 },
    GOLD: { analytics: 'PREMIUM', freeEventsPerMonth: 2, workshopsPerYear: 4, cityPromotion: true, speakerOpportunities: true, retreatAccess: false, vipConcierge: false, verifiedBadge: false, discountOnEvents: 10, discountOnGrowthCredits: 10 },
    PLATINUM: { analytics: 'PREMIUM', freeEventsPerMonth: 3, workshopsPerYear: 6, cityPromotion: true, speakerOpportunities: true, retreatAccess: false, vipConcierge: false, verifiedBadge: false, discountOnEvents: 10, discountOnGrowthCredits: 10 }
  },
  5: {
    BASIC: { analytics: 'ADVANCED', freeEventsPerMonth: 1, workshopsPerYear: 2, cityPromotion: true, speakerOpportunities: true, retreatAccess: false, vipConcierge: false, verifiedBadge: false, discountOnEvents: 20, discountOnGrowthCredits: 20 },
    SILVER: { analytics: 'PREMIUM', freeEventsPerMonth: 2, workshopsPerYear: 4, cityPromotion: true, speakerOpportunities: true, retreatAccess: false, vipConcierge: false, verifiedBadge: false, discountOnEvents: 20, discountOnGrowthCredits: 20 },
    GOLD: { analytics: 'PREMIUM', freeEventsPerMonth: 3, workshopsPerYear: 6, cityPromotion: true, speakerOpportunities: true, retreatAccess: false, vipConcierge: false, verifiedBadge: true, discountOnEvents: 20, discountOnGrowthCredits: 20 },
    PLATINUM: { analytics: 'PREMIUM', freeEventsPerMonth: 5, workshopsPerYear: 12, cityPromotion: true, speakerOpportunities: true, retreatAccess: true, vipConcierge: false, verifiedBadge: true, discountOnEvents: 20, discountOnGrowthCredits: 20 }
  },
  6: {
    BASIC: { analytics: 'PREMIUM', freeEventsPerMonth: 2, workshopsPerYear: 4, cityPromotion: true, speakerOpportunities: true, retreatAccess: false, vipConcierge: false, verifiedBadge: false, discountOnEvents: 30, discountOnGrowthCredits: 30 },
    SILVER: { analytics: 'PREMIUM', freeEventsPerMonth: 3, workshopsPerYear: 6, cityPromotion: true, speakerOpportunities: true, retreatAccess: false, vipConcierge: false, verifiedBadge: true, discountOnEvents: 30, discountOnGrowthCredits: 30 },
    GOLD: { analytics: 'PREMIUM', freeEventsPerMonth: 5, workshopsPerYear: 12, cityPromotion: true, speakerOpportunities: true, retreatAccess: true, vipConcierge: true, verifiedBadge: true, discountOnEvents: 30, discountOnGrowthCredits: 30 },
    PLATINUM: { analytics: 'PREMIUM', freeEventsPerMonth: -1, workshopsPerYear: -1, cityPromotion: true, speakerOpportunities: true, retreatAccess: true, vipConcierge: true, verifiedBadge: true, discountOnEvents: 30, discountOnGrowthCredits: 30 }
  }
};

// ============================================================================
// ANNUAL SUBSCRIPTION BONUSES
// ============================================================================

export interface AnnualBonus {
  creditBonus: number; // Percentage bonus on monthly credits
  cityPromotions: number; // Free city promotions
  retreatTickets: number; // Free retreat tickets
  premiumOnboarding: boolean;
}

export const ANNUAL_BONUSES: Record<SubscriptionTier, AnnualBonus> = {
  BASIC: {
    creditBonus: 0,
    cityPromotions: 0,
    retreatTickets: 0,
    premiumOnboarding: false
  },
  SILVER: {
    creditBonus: 10, // +10% Growth Credits
    cityPromotions: 0,
    retreatTickets: 0,
    premiumOnboarding: false
  },
  GOLD: {
    creditBonus: 20, // +20% Growth Credits
    cityPromotions: 1,
    retreatTickets: 0,
    premiumOnboarding: false
  },
  PLATINUM: {
    creditBonus: 30, // +30% Growth Credits
    cityPromotions: 2,
    retreatTickets: 1, // Only for Level 5+
    premiumOnboarding: true
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get pricing for a specific level and tier
 */
export function getPricing(level: BusinessLevel, tier: SubscriptionTier): TierPricing {
  return TIER_PRICING[level][tier];
}

/**
 * Get monthly Growth Credits for a level/tier
 */
export function getMonthlyGrowthCredits(level: BusinessLevel, tier: SubscriptionTier, isAnnual: boolean = false): number {
  const baseCredits = GROWTH_CREDITS[level][tier];
  if (isAnnual && tier !== 'BASIC') {
    const bonus = ANNUAL_BONUSES[tier].creditBonus / 100;
    return Math.floor(baseCredits * (1 + bonus));
  }
  return baseCredits;
}

/**
 * Calculate Growth Credit pack price with level discount
 */
export function getGrowthCreditPackPrice(pack: GrowthCreditPack, level: BusinessLevel): number {
  const discount = GROWTH_CREDIT_DISCOUNTS[level];
  return pack.price * (1 - discount);
}

/**
 * Get mission limits for a level/tier
 */
export function getMissionLimits(level: BusinessLevel, tier: SubscriptionTier): MissionLimits {
  return MISSION_LIMITS[level][tier];
}

/**
 * Get meetup limits for a level/tier
 */
export function getMeetupLimits(level: BusinessLevel, tier: SubscriptionTier): MeetupLimits {
  return MEETUP_LIMITS[level][tier];
}

/**
 * Get perks for a level/tier
 */
export function getLevelPerks(level: BusinessLevel, tier: SubscriptionTier): LevelPerks {
  return LEVEL_PERKS[level][tier];
}

/**
 * Check if a tier is available for a level
 */
export function isTierAvailable(level: BusinessLevel, tier: SubscriptionTier): boolean {
  if (level === 1) return tier === 'BASIC';
  return TIER_PRICING[level][tier].monthly > 0 || tier === 'BASIC';
}

/**
 * Get all available tiers for a level
 */
export function getAvailableTiers(level: BusinessLevel): SubscriptionTier[] {
  if (level === 1) return ['BASIC'];
  return ['BASIC', 'SILVER', 'GOLD', 'PLATINUM'];
}

/**
 * Check if verified badge is available
 */
export function canGetVerifiedBadge(level: BusinessLevel, tier: SubscriptionTier): boolean {
  if (level === 5 && (tier === 'GOLD' || tier === 'PLATINUM')) return true;
  if (level === 6 && tier !== 'BASIC') return true;
  return false;
}

/**
 * Check if automated campaigns are available
 */
export function canUseAutomatedCampaigns(level: BusinessLevel, tier: SubscriptionTier): boolean {
  if (level === 4 && tier === 'GOLD') return true;
  if (level >= 4 && tier === 'PLATINUM') return true;
  if (level >= 5 && (tier === 'GOLD' || tier === 'PLATINUM')) return true;
  if (level === 6 && tier !== 'BASIC') return true;
  return false;
}

export default {
  TIER_PRICING,
  GROWTH_CREDITS,
  GROWTH_CREDIT_PACKS,
  MISSION_LIMITS,
  MEETUP_LIMITS,
  LEVEL_PERKS,
  ANNUAL_BONUSES,
  getPricing,
  getMonthlyGrowthCredits,
  getGrowthCreditPackPrice,
  getMissionLimits,
  getMeetupLimits,
  getLevelPerks,
  isTierAvailable,
  getAvailableTiers,
  canGetVerifiedBadge,
  canUseAutomatedCampaigns
};
