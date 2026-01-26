/**
 * Beevvy Extended User Schema with Subscription Tiers
 * 
 * TypeScript interfaces for the complete business model
 */

import { Timestamp } from '../../../services/firestoreCompat';

export type SubscriptionTier = 'BASIC' | 'SILVER' | 'GOLD' | 'PLATINUM';
export type BusinessLevel = 1 | 2 | 3 | 4 | 5 | 6;
export type BillingCycle = 'MONTHLY' | 'ANNUAL';
export type SubscriptionStatus = 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'TRIAL' | 'PAUSED';

// ============================================================================
// EXTENDED USER SCHEMA
// ============================================================================

export interface UserSubscription {
  // Current Subscription
  tier: SubscriptionTier;
  billingCycle: BillingCycle;
  status: SubscriptionStatus;
  
  // Pricing
  monthlyPrice: number; // EUR
  annualPrice: number;  // EUR (if annual)
  nextBillingDate: Timestamp;
  subscriptionStartDate: Timestamp;
  
  // Payment
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  paymentMethod?: string; // Last 4 digits of card
  
  // Trial
  isTrialing: boolean;
  trialEndsAt?: Timestamp;
  
  // Cancellation
  cancelAtPeriodEnd: boolean;
  canceledAt?: Timestamp;
  cancellationReason?: string;
}

export interface GrowthCreditsAccount {
  // Current Balance
  available: number;
  used: number;
  totalEarned: number;
  totalPurchased: number;
  
  // Monthly Allocation
  monthlyAllocation: number;
  lastAllocationDate: Timestamp;
  nextAllocationDate: Timestamp;
  
  // Annual Bonus
  annualBonusActive: boolean;
  annualBonusPercentage: number; // 10, 20, or 30%
  
  // Purchase History (last 5)
  recentPurchases: {
    credits: number;
    price: number;
    date: Timestamp;
    pack: string; // 'Starter', 'Growth', 'Boost', 'Scale', 'Enterprise'
  }[];
  
  // Usage Tracking
  usageThisMonth: number;
  usageLastMonth: number;
}

export interface MissionUsage {
  // Monthly Limits
  missionsCreatedThisMonth: number;
  missionsCreatedLastMonth: number;
  maxMissionsPerMonth: number; // -1 = unlimited
  
  // Current Active Missions
  activeMissions: number;
  
  // Participant Tracking
  totalParticipantsThisMonth: number;
  maxParticipantsPerMission: number; // -1 = unlimited
  
  // Boosts
  boostsAvailableThisMonth: number;
  boostsUsedThisMonth: number;
  boostResetDate: Timestamp;
  
  // Geographic Reach
  geographicReach: 'SAME_CITY' | 'NEARBY_CITIES' | 'COUNTRY' | 'MULTI_COUNTRY' | 'GLOBAL';
  
  // Features
  priorityMatching: boolean;
  premiumTemplates: boolean;
  collabMissions: boolean;
  influencerMissions: boolean;
  automatedCampaigns: boolean;
}

export interface MeetupUsage {
  // Hosting Limits
  meetupsHostedThisMonth: number;
  maxHostPerMonth: number; // -1 = unlimited
  
  // Joining
  meetupsJoinedThisMonth: number;
  maxJoinPerMonth: number; // -1 = unlimited
  
  // Features
  featuredInCity: boolean;
  vipAccess: boolean;
  globalMatching: boolean;
}

export interface UserPerks {
  // Analytics
  analyticsLevel: 'NONE' | 'BASIC' | 'ADVANCED' | 'PREMIUM';
  
  // Events & Workshops
  freeEventsRemainingThisMonth: number;
  freeEventsPerMonth: number;
  workshopsRemainingThisYear: number;
  workshopsPerYear: number;
  
  // Promotions
  cityPromotionAvailable: boolean;
  cityPromotionsUsed: number;
  
  // Speaking & Networking
  speakerOpportunities: boolean;
  retreatAccess: boolean;
  vipConcierge: boolean;
  
  // Badge
  verifiedBadge: boolean;
  verifiedBadgeApprovedAt?: Timestamp;
  verifiedBadgeApprovedBy?: string; // Admin UID
  
  // Discounts
  discountOnEvents: number; // Percentage (0, 10, 20, 30)
  discountOnGrowthCredits: number; // Percentage (0, 10, 20, 30)
}

export interface RewardPointsAccount {
  // Current Balance
  available: number;
  earned: number;
  spent: number;
  pending: number;
  
  // Lifetime Stats
  totalEarned: number;
  totalSpent: number;
  totalRedeemed: number;
  
  // Recent Transactions (last 10)
  recentTransactions: {
    type: 'EARNED' | 'SPENT' | 'REFUNDED' | 'EXPIRED';
    amount: number;
    reason: string;
    relatedId?: string; // Mission ID, reward ID, etc.
    timestamp: Timestamp;
  }[];
  
  // Multipliers
  streakMultiplier: number; // 1.0, 1.1, 1.2, etc.
  tierBonus: number; // Percentage bonus (0, 5, 10, 15)
  
  // Expiry Tracking
  pointsExpiringThisMonth: number;
  nextExpiryDate?: Timestamp;
}

export interface LevelProgression {
  // Current Level
  currentLevel: BusinessLevel;
  
  // XP System (from previous implementation)
  businessSubLevel: number; // 1-9
  businessXp: number;
  
  // Upgrade Requests
  upgradeRequested: boolean;
  upgradeRequestedAt?: Timestamp;
  
  // Activity Metrics for Level Requirements
  totalMissionsCreated: number;
  totalMeetupsAttended: number;
  totalSquadsJoined: number;
  totalGrowthCreditsUsed: number;
  
  // Quality Metrics
  averageRating: number; // 0-5 stars
  totalReviews: number;
  violations: number;
  
  // Verification (required for Level 4+)
  businessVerified: boolean;
  businessVerificationDate?: Timestamp;
  businessRegistrationNumber?: string;
  businessTaxId?: string;
  
  // Level History
  levelUpHistory: {
    level: BusinessLevel;
    achievedAt: Timestamp;
    approvedBy?: string; // Admin UID (for levels requiring approval)
  }[];
}

// ============================================================================
// COMPLETE USER DOCUMENT
// ============================================================================

export interface BeevvyBusinessUser {
  // Basic Info (existing fields)
  uid: string;
  email: string;
  name: string;
  role: 'BUSINESS' | 'CUSTOMER' | 'ADMIN';
  
  // NEW: Subscription & Billing
  subscription: UserSubscription;
  
  // NEW: Growth Credits
  growthCredits: GrowthCreditsAccount;
  
  // NEW: Reward Points
  rewardPoints: RewardPointsAccount;
  
  // NEW: Usage Tracking
  missionUsage: MissionUsage;
  meetupUsage: MeetupUsage;
  
  // NEW: Perks & Benefits
  perks: UserPerks;
  
  // Extended: Level System
  levelProgression: LevelProgression;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt: Timestamp;
}

// ============================================================================
// FIRESTORE COLLECTIONS
// ============================================================================

/**
 * Collection: subscriptionPlans
 * 
 * Document ID: "level{1-6}_tier{BASIC|SILVER|GOLD|PLATINUM}"
 * Example: "level2_tierSILVER"
 */
export interface SubscriptionPlan {
  level: BusinessLevel;
  tier: SubscriptionTier;
  
  // Pricing
  monthlyPrice: number;
  annualPrice: number;
  annualMonthsToPay: number; // 10 or 9
  
  // Growth Credits
  monthlyGrowthCredits: number;
  annualGrowthCreditsBonus: number; // Percentage
  
  // Limits
  maxMissionsPerMonth: number;
  maxParticipantsPerMission: number;
  maxMeetupsHostPerMonth: number;
  maxMeetupsJoinPerMonth: number;
  
  // Features
  features: {
    geographicReach: string;
    priorityMatching: boolean;
    premiumTemplates: boolean;
    collabMissions: boolean;
    influencerMissions: boolean;
    automatedCampaigns: boolean;
    analytics: string;
    verifiedBadgeEligible: boolean;
  };
  
  // Perks
  perks: {
    freeEventsPerMonth: number;
    workshopsPerYear: number;
    cityPromotion: boolean;
    speakerOpportunities: boolean;
    retreatAccess: boolean;
    vipConcierge: boolean;
    discountOnEvents: number;
    discountOnGrowthCredits: number;
  };
  
  // Metadata
  active: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Collection: growthCreditTransactions
 * 
 * Subcollection of users/{userId}/growthCreditTransactions
 */
export interface GrowthCreditTransaction {
  userId: string;
  type: 'PURCHASE' | 'ALLOCATION' | 'USAGE' | 'REFUND' | 'BONUS';
  
  // Amount
  credits: number; // Positive for add, negative for use
  balanceBefore: number;
  balanceAfter: number;
  
  // Details
  description: string;
  relatedTo?: string; // Mission ID, Meetup ID, etc.
  
  // Purchase Info (if type === 'PURCHASE')
  pack?: string; // 'Starter', 'Growth', etc.
  price?: number; // EUR paid
  discount?: number; // Percentage discount applied
  stripePaymentId?: string;
  
  // Metadata
  createdAt: Timestamp;
}

/**
 * Collection: levelRequirements
 * 
 * Document ID: "level{2-6}"
 * Defines what's needed to reach each level
 */
export interface LevelRequirement {
  level: BusinessLevel;
  name: string; // 'Builder', 'Operator', etc.
  
  // Activity Requirements
  minMissionsCreated: number;
  minMeetupsAttended: number;
  minSquadsJoined: number;
  minGrowthCreditsUsed: number;
  
  // Quality Requirements
  minAverageRating: number; // e.g., 4.5
  maxViolations: number; // e.g., 0
  
  // Verification
  requiresBusinessVerification: boolean;
  
  // Approval
  requiresAdminApproval: boolean;
  autoApproveIfMetrics: boolean; // Auto-approve if all metrics met
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Collection: campaignTemplates
 * 
 * Pre-built campaign templates for automated growth
 */
export interface CampaignTemplate {
  id: string;
  name: string;
  description: string;
  
  // Requirements
  minLevel: BusinessLevel;
  minTier: SubscriptionTier;
  
  // Configuration
  durationDays: number;
  targetFollowers: number;
  estimatedCreditsNeeded: number;
  
  // Actions
  dailyActions: {
    growthCreditsToUse: number;
    targetsPerDay: number;
    messageTemplate?: string;
  };
  
  // Metadata
  category: 'FOLLOWER_GROWTH' | 'CITY_LAUNCH' | 'INFLUENCER_BURST' | 'CROSS_PLATFORM';
  popular: boolean;
  successRate: number; // Percentage
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Collection: activeCampaigns
 * 
 * Subcollection of users/{userId}/activeCampaigns
 */
export interface ActiveCampaign {
  userId: string;
  templateId: string;
  
  // Status
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELED';
  startedAt: Timestamp;
  endsAt: Timestamp;
  
  // Progress
  creditsUsed: number;
  creditsRemaining: number;
  followersGained: number;
  targetFollowers: number;
  
  // Daily Execution
  lastExecutedAt?: Timestamp;
  nextExecutionAt?: Timestamp;
  daysCompleted: number;
  totalDays: number;
  
  // Results
  successRate: number;
  engagementRate: number;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

export interface SubscriptionChangeRequest {
  userId: string;
  currentTier: SubscriptionTier;
  newTier: SubscriptionTier;
  billingCycle: BillingCycle;
  immediateChange: boolean;
  prorationAmount?: number; // EUR
  effectiveDate: Timestamp;
}

export interface LevelUpEligibility {
  eligible: boolean;
  currentLevel: BusinessLevel;
  nextLevel: BusinessLevel;
  
  // What's Met
  meetsActivityRequirements: boolean;
  meetsQualityRequirements: boolean;
  meetsVerificationRequirements: boolean;
  
  // What's Missing (if not eligible)
  missingRequirements?: {
    missions?: number; // How many more needed
    meetups?: number;
    squads?: number;
    rating?: number;
    verification?: boolean;
  };
  
  // Approval Needed
  requiresAdminApproval: boolean;
  canAutoApprove: boolean;
}

export interface UsageLimits {
  missions: {
    remaining: number;
    max: number;
    unlimited: boolean;
  };
  meetupsHost: {
    remaining: number;
    max: number;
    unlimited: boolean;
  };
  meetupsJoin: {
    remaining: number;
    max: number;
    unlimited: boolean;
  };
  missionBoosts: {
    remaining: number;
    max: number;
    unlimited: boolean;
  };
  growthCredits: {
    available: number;
  };
}

export default {
  // Types are exported above
};
