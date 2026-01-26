/**
 * Customer Level System
 * 
 * Four-tier system that defines DEFAULT reward redemption limits:
 * - Explorer (Entry level)
 * - Regular (Standard user)
 * - Insider (Engaged user)
 * - Ambassador (Power user)
 * 
 * Businesses can override these limits per reward.
 */

export enum CustomerLevel {
  EXPLORER = 'EXPLORER',
  REGULAR = 'REGULAR',
  INSIDER = 'INSIDER',
  AMBASSADOR = 'AMBASSADOR'
}

/**
 * Default redemption limits per customer level
 * Businesses can override these on a per-reward basis
 */
export interface LevelRedemptionLimits {
  perDay: number;              // Max redemptions per day (across all rewards)
  perWeek: number;             // Max redemptions per week
  repeatUsagePerBusiness: number; // How many times can redeem at SAME business
}

/**
 * Level progression requirements
 */
export interface LevelRequirements {
  minPoints: number;           // Minimum points earned (lifetime)
  minMissionsCompleted: number; // Minimum missions completed
  minRedemptions: number;      // Minimum rewards redeemed
  accountAgeDays: number;      // Account must be X days old
}

/**
 * Complete level definition
 */
export interface CustomerLevelDefinition {
  level: CustomerLevel;
  displayName: string;
  description: string;
  icon: string;
  redemptionLimits: LevelRedemptionLimits;
  requirements: LevelRequirements;
  benefits: string[];          // Human-readable benefits
}

/**
 * Default level definitions
 * These are the base limits - businesses can override per reward
 */
export const CUSTOMER_LEVELS: Record<CustomerLevel, CustomerLevelDefinition> = {
  [CustomerLevel.EXPLORER]: {
    level: CustomerLevel.EXPLORER,
    displayName: 'Explorer',
    description: 'Just getting started with Beevvy',
    icon: '🔍',
    redemptionLimits: {
      perDay: 1,                    // 1 reward per day
      perWeek: 3,                   // 3 rewards per week
      repeatUsagePerBusiness: 1     // Can only redeem once at same business
    },
    requirements: {
      minPoints: 0,
      minMissionsCompleted: 0,
      minRedemptions: 0,
      accountAgeDays: 0
    },
    benefits: [
      'Access to basic rewards',
      'Complete missions to earn points',
      'Unlock Regular level with activity'
    ]
  },
  
  [CustomerLevel.REGULAR]: {
    level: CustomerLevel.REGULAR,
    displayName: 'Regular',
    description: 'Active Beevvy member',
    icon: '⭐',
    redemptionLimits: {
      perDay: 2,                    // 2 rewards per day
      perWeek: 7,                   // 7 rewards per week
      repeatUsagePerBusiness: 2     // Can redeem twice at same business
    },
    requirements: {
      minPoints: 100,               // Earned 100 points
      minMissionsCompleted: 5,      // Completed 5 missions
      minRedemptions: 1,            // Redeemed at least 1 reward
      accountAgeDays: 7             // Account 7 days old
    },
    benefits: [
      'Redeem more rewards daily',
      'Repeat rewards at favorite businesses',
      'Priority in mission selection',
      'Unlock Insider with continued activity'
    ]
  },
  
  [CustomerLevel.INSIDER]: {
    level: CustomerLevel.INSIDER,
    displayName: 'Insider',
    description: 'Engaged community member',
    icon: '💎',
    redemptionLimits: {
      perDay: 5,                    // 5 rewards per day
      perWeek: 20,                  // 20 rewards per week
      repeatUsagePerBusiness: 5     // Can redeem 5 times at same business
    },
    requirements: {
      minPoints: 500,               // Earned 500 points
      minMissionsCompleted: 25,     // Completed 25 missions
      minRedemptions: 10,           // Redeemed 10 rewards
      accountAgeDays: 30            // Account 30 days old
    },
    benefits: [
      'Significantly higher redemption limits',
      'Frequent repeat usage at favorite spots',
      'Early access to new missions',
      'Exclusive Insider-only rewards',
      'Unlock Ambassador status with dedication'
    ]
  },
  
  [CustomerLevel.AMBASSADOR]: {
    level: CustomerLevel.AMBASSADOR,
    displayName: 'Ambassador',
    description: 'Elite Beevvy power user',
    icon: '👑',
    redemptionLimits: {
      perDay: 10,                   // 10 rewards per day
      perWeek: 50,                  // 50 rewards per week
      repeatUsagePerBusiness: 15    // Can redeem 15 times at same business
    },
    requirements: {
      minPoints: 2000,              // Earned 2000 points
      minMissionsCompleted: 100,    // Completed 100 missions
      minRedemptions: 50,           // Redeemed 50 rewards
      accountAgeDays: 90            // Account 90 days old
    },
    benefits: [
      'Maximum redemption freedom',
      'Unlimited repeat usage at favorite businesses',
      'VIP mission access',
      'Exclusive Ambassador rewards',
      'Priority customer support',
      'Special recognition badge'
    ]
  }
};

/**
 * Human-readable messages for redemption limits
 * NEVER show raw numbers to customers
 */
export interface RedemptionLimitMessage {
  canRedeem: boolean;
  message: string;
  upgradeMessage?: string;      // Message about upgrading level
  availableAt?: Date;           // When reward becomes available again
}

/**
 * Per-reward override limits (set by business)
 */
export interface RewardLevelOverride {
  level: CustomerLevel;
  perDay?: number;              // Override daily limit for this reward
  perWeek?: number;             // Override weekly limit for this reward
  repeatUsagePerBusiness?: number; // Override repeat usage limit
  customMessage?: string;       // Custom message from business
}

/**
 * Mission visibility states (customer-facing)
 * DO NOT show participant numbers or caps
 */
export enum MissionState {
  TRENDING = 'TRENDING',                      // Popular right now
  COMPLETED_THIS_MONTH = 'COMPLETED_THIS_MONTH', // You already did this
  RETURNING_SOON = 'RETURNING_SOON',          // Coming back with countdown
  STAFF_PICK = 'STAFF_PICK',                  // Recommended by Beevvy
  NEW = 'NEW',                                // Just launched
  ENDING_SOON = 'ENDING_SOON',                // Last chance
  EXCLUSIVE = 'EXCLUSIVE'                     // Special access
}

/**
 * Mission state display configuration
 */
export interface MissionStateDisplay {
  state: MissionState;
  badge: string;
  color: string;
  message: string;
  priority: number;             // Higher = shown first
}

export const MISSION_STATE_DISPLAYS: Record<MissionState, MissionStateDisplay> = {
  [MissionState.TRENDING]: {
    state: MissionState.TRENDING,
    badge: '🔥',
    color: '#FF6B6B',
    message: 'Trending now',
    priority: 90
  },
  [MissionState.STAFF_PICK]: {
    state: MissionState.STAFF_PICK,
    badge: '⭐',
    color: '#FFD93D',
    message: 'Staff Pick',
    priority: 85
  },
  [MissionState.NEW]: {
    state: MissionState.NEW,
    badge: '✨',
    color: '#6BCF7F',
    message: 'New Mission',
    priority: 80
  },
  [MissionState.ENDING_SOON]: {
    state: MissionState.ENDING_SOON,
    badge: '⏰',
    color: '#FF9F43',
    message: 'Ending soon',
    priority: 75
  },
  [MissionState.EXCLUSIVE]: {
    state: MissionState.EXCLUSIVE,
    badge: '💎',
    color: '#A55EEA',
    message: 'Exclusive access',
    priority: 70
  },
  [MissionState.COMPLETED_THIS_MONTH]: {
    state: MissionState.COMPLETED_THIS_MONTH,
    badge: '✅',
    color: '#45B7D1',
    message: 'Completed this month',
    priority: 50
  },
  [MissionState.RETURNING_SOON]: {
    state: MissionState.RETURNING_SOON,
    badge: '🔄',
    color: '#95A5A6',
    message: 'Returning soon',
    priority: 40
  }
};

/**
 * Premium service tiers (for businesses)
 */
export enum PremiumServiceTier {
  STARTER = 'STARTER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM'
}

/**
 * Premium services and their tier requirements
 */
export enum PremiumService {
  PROFESSIONAL_PHOTOSHOOT = 'PROFESSIONAL_PHOTOSHOOT',
  CREATOR_HIRING = 'CREATOR_HIRING',
  EVENT_HOSTING = 'EVENT_HOSTING',
  ADVANCED_AI_INSIGHTS = 'ADVANCED_AI_INSIGHTS',
  AI_AUTO_OPTIMIZE = 'AI_AUTO_OPTIMIZE',
  PRIORITY_SUPPORT = 'PRIORITY_SUPPORT',
  UNLIMITED_REWARDS = 'UNLIMITED_REWARDS'
}

/**
 * Service access by tier
 */
export interface PremiumServiceAccess {
  service: PremiumService;
  requiredTier: PremiumServiceTier;
  displayName: string;
  description: string;
  goldFeatures?: string[];      // What Gold gets
  platinumFeatures?: string[];  // What Platinum gets extra
}

export const PREMIUM_SERVICES: Record<PremiumService, PremiumServiceAccess> = {
  [PremiumService.PROFESSIONAL_PHOTOSHOOT]: {
    service: PremiumService.PROFESSIONAL_PHOTOSHOOT,
    requiredTier: PremiumServiceTier.GOLD,
    displayName: 'Professional Photoshoot',
    description: 'Professional content creation for your business',
    goldFeatures: ['1 photoshoot per month', 'Basic editing', '20 photos'],
    platinumFeatures: ['3 photoshoots per month', 'Advanced editing', '50 photos', 'Priority booking']
  },
  
  [PremiumService.CREATOR_HIRING]: {
    service: PremiumService.CREATOR_HIRING,
    requiredTier: PremiumServiceTier.GOLD,
    displayName: 'Creator Hiring',
    description: 'Hire content creators for campaigns',
    goldFeatures: ['Access to creator marketplace', 'Basic matching'],
    platinumFeatures: ['Priority creator access', 'Dedicated account manager', 'Campaign analytics']
  },
  
  [PremiumService.EVENT_HOSTING]: {
    service: PremiumService.EVENT_HOSTING,
    requiredTier: PremiumServiceTier.GOLD,
    displayName: 'Event Hosting',
    description: 'Host events through Beevvy platform',
    goldFeatures: ['2 events per month', 'Basic promotion'],
    platinumFeatures: ['Unlimited events', 'Premium promotion', 'Event analytics', 'Featured placement']
  },
  
  [PremiumService.ADVANCED_AI_INSIGHTS]: {
    service: PremiumService.ADVANCED_AI_INSIGHTS,
    requiredTier: PremiumServiceTier.GOLD,
    displayName: 'Advanced AI Insights',
    description: 'AI-powered analytics and recommendations',
    goldFeatures: ['Weekly insights', 'Basic predictions'],
    platinumFeatures: ['Daily insights', 'Advanced predictions', 'Competitor analysis', 'Custom reports']
  },
  
  [PremiumService.AI_AUTO_OPTIMIZE]: {
    service: PremiumService.AI_AUTO_OPTIMIZE,
    requiredTier: PremiumServiceTier.GOLD,
    displayName: 'AI Auto-Optimize',
    description: 'Let AI automatically optimize your campaigns',
    goldFeatures: ['Auto mission adjustments', 'Smart scheduling', 'Must approve changes'],
    platinumFeatures: ['Advanced optimization', 'Auto-publish (if enabled)', 'Real-time adjustments']
  },
  
  [PremiumService.PRIORITY_SUPPORT]: {
    service: PremiumService.PRIORITY_SUPPORT,
    requiredTier: PremiumServiceTier.GOLD,
    displayName: 'Priority Support',
    description: '24/7 priority customer support',
    goldFeatures: ['Priority email support', '24hr response time'],
    platinumFeatures: ['24/7 phone support', '1hr response time', 'Dedicated account manager']
  },
  
  [PremiumService.UNLIMITED_REWARDS]: {
    service: PremiumService.UNLIMITED_REWARDS,
    requiredTier: PremiumServiceTier.GOLD,
    displayName: 'Unlimited Rewards',
    description: 'Create unlimited rewards and missions',
    goldFeatures: ['Unlimited rewards', 'Unlimited missions'],
    platinumFeatures: ['All Gold features', 'Advanced reward types', 'Bulk import']
  }
};

/**
 * AI Auto-Optimize settings (optional toggle, Gold+)
 */
export interface AIAutoOptimizeSettings {
  enabled: boolean;
  autoPublish: boolean;         // If true, AI can publish changes (must be explicitly enabled)
  
  // What AI is allowed to do
  canPauseMissions: boolean;
  canAdjustRewards: boolean;
  canChangeMissionTypes: boolean;
  canAdjustParticipants: boolean;
  
  // Safety limits
  maxEnergyAdjustment: number;  // Max % AI can adjust energy cost
  maxPointAdjustment: number;   // Max % AI can adjust reward points
  requireApproval: boolean;     // Always require approval before changes
}

export const DEFAULT_AI_SETTINGS: AIAutoOptimizeSettings = {
  enabled: false,               // Disabled by default
  autoPublish: false,           // Never auto-publish without explicit consent
  canPauseMissions: true,
  canAdjustRewards: true,
  canChangeMissionTypes: false, // Conservative default
  canAdjustParticipants: true,
  maxEnergyAdjustment: 20,      // Max 20% adjustment
  maxPointAdjustment: 15,       // Max 15% adjustment
  requireApproval: true         // Always require approval
};

/**
 * AI optimization suggestion
 */
export interface AIOptimizationSuggestion {
  id: string;
  type: 'PAUSE_MISSION' | 'ADJUST_REWARD' | 'CHANGE_TYPE' | 'ADJUST_PARTICIPANTS';
  missionId?: string;
  rewardId?: string;
  currentValue: any;
  suggestedValue: any;
  reason: string;               // Human-readable explanation
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  reversible: boolean;          // Can this be undone?
  requiresConsent: boolean;     // Requires explicit approval
  createdAt: Date;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'APPLIED';
}
