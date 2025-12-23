/**
 * Level Progression Requirements
 * 
 * Defines XP and activity requirements for each level upgrade
 * Integrates with existing businessLevel system
 */

import type { BusinessLevel } from './subscriptionTypes';

export interface LevelRequirements {
  level: BusinessLevel;
  name: string;
  emoji: string;
  
  // Activity Requirements
  minMissionsCreated: number;
  minMeetupsAttended: number;
  minSquadsJoined: number;
  minGrowthCreditsUsed: number;
  
  // Quality Requirements
  minAverageRating: number; // 0-5 stars
  maxViolations: number;
  
  // Verification
  requiresBusinessVerification: boolean;
  verificationDocuments?: string[]; // Required document types
  
  // Approval
  requiresAdminApproval: boolean;
  autoApproveIfMetrics: boolean; // Auto-approve if all metrics met
  
  // Time Requirements
  minDaysSinceJoining?: number;
  minDaysSincePreviousLevel?: number;
  
  // Description
  description: string;
  benefits: string[];
}

// ============================================================================
// LEVEL REQUIREMENTS CONFIGURATION
// ============================================================================

export const LEVEL_REQUIREMENTS: Record<BusinessLevel, LevelRequirements> = {
  1: {
    level: 1,
    name: 'Explorer',
    emoji: '🌱',
    minMissionsCreated: 0,
    minMeetupsAttended: 0,
    minSquadsJoined: 0,
    minGrowthCreditsUsed: 0,
    minAverageRating: 0,
    maxViolations: 999,
    requiresBusinessVerification: false,
    requiresAdminApproval: false,
    autoApproveIfMetrics: true,
    description: 'ASPIRING ENTREPRENEURS ONLY - Idea stage, exploring opportunities. Users who selected "I want to start a business" during signup.',
    benefits: [
      'Join 2 beginner meetups/month',
      'Join 1 beginner squad',
      'Create business idea profile',
      'Access to Fluzio Academy beginner content',
      'Receive mentorship from Level 4-6',
      'Follow other businesses and creators'
    ]
  },
  
  2: {
    level: 2,
    name: 'Builder',
    emoji: '🔧',
    minMissionsCreated: 0,
    minMeetupsAttended: 2,
    minSquadsJoined: 1,
    minGrowthCreditsUsed: 0,
    minAverageRating: 0,
    maxViolations: 0,
    requiresBusinessVerification: false,
    requiresAdminApproval: false, // Auto-approve
    autoApproveIfMetrics: true,
    minDaysSinceJoining: 7, // Been on platform 1 week (for L1→L2 upgrade)
    description: 'STARTING POINT for existing businesses. Users who already have a business start here.',
    benefits: [
      'Create 1 mission/month (3 for paid tiers)',
      'Host 1 meetup/month (3 for paid tiers)',
      'Access to paid tiers (Silver/Gold/Platinum)',
      'Basic analytics',
      'Create business partnerships',
      'Appear in business matching'
    ]
  },
  
  3: {
    level: 3,
    name: 'Operator',
    emoji: '⚙️',
    minMissionsCreated: 5,
    minMeetupsAttended: 3,
    minSquadsJoined: 1,
    minGrowthCreditsUsed: 50, // Used at least 50 credits
    minAverageRating: 4.0,
    maxViolations: 0,
    requiresBusinessVerification: false,
    requiresAdminApproval: true, // Admin reviews
    autoApproveIfMetrics: false,
    minDaysSincePreviousLevel: 14, // 2 weeks at Level 2
    description: 'Running an active business',
    benefits: [
      'Country-wide matching',
      'Free basic analytics',
      '1 free mission boost/month',
      'Influencer missions',
      'Premium templates'
    ]
  },
  
  4: {
    level: 4,
    name: 'Growth Leader',
    emoji: '🚀',
    minMissionsCreated: 20,
    minMeetupsAttended: 10,
    minSquadsJoined: 2,
    minGrowthCreditsUsed: 500,
    minAverageRating: 4.3,
    maxViolations: 0,
    requiresBusinessVerification: true, // Must verify business
    verificationDocuments: [
      'Business registration',
      'Tax ID or VAT number',
      'Proof of address'
    ],
    requiresAdminApproval: true,
    autoApproveIfMetrics: false,
    minDaysSincePreviousLevel: 30, // 1 month at Level 3
    description: 'Scaling with proven track record',
    benefits: [
      'Unlimited meetups',
      'Featured in city search',
      '10% discount on events & credits',
      'Automated campaigns',
      'Priority matching'
    ]
  },
  
  5: {
    level: 5,
    name: 'Expert',
    emoji: '🧠',
    minMissionsCreated: 50,
    minMeetupsAttended: 25,
    minSquadsJoined: 3,
    minGrowthCreditsUsed: 2000,
    minAverageRating: 4.5,
    maxViolations: 0,
    requiresBusinessVerification: true,
    verificationDocuments: [
      'Business registration',
      'Tax documents',
      'Portfolio or case studies',
      'Client testimonials'
    ],
    requiresAdminApproval: true,
    autoApproveIfMetrics: false,
    minDaysSincePreviousLevel: 60, // 2 months at Level 4
    minDaysSinceJoining: 180, // 6 months total on platform
    description: 'Established expert or consultant',
    benefits: [
      'Free workshops',
      'Global visibility',
      '20% discount on credits',
      'Speaker opportunities',
      'Verified badge eligible',
      'VIP features'
    ]
  },
  
  6: {
    level: 6,
    name: 'Elite',
    emoji: '👑',
    minMissionsCreated: 100,
    minMeetupsAttended: 50,
    minSquadsJoined: 5,
    minGrowthCreditsUsed: 5000,
    minAverageRating: 4.7,
    maxViolations: 0,
    requiresBusinessVerification: true,
    verificationDocuments: [
      'Business registration',
      'Financial statements',
      'Media coverage or awards',
      'Professional references',
      'Portfolio of major clients'
    ],
    requiresAdminApproval: true,
    autoApproveIfMetrics: false,
    minDaysSincePreviousLevel: 90, // 3 months at Level 5
    minDaysSinceJoining: 365, // 1 year total on platform
    description: 'Top-tier: investors, major brands, established founders',
    benefits: [
      'Free events',
      '1 retreat/year (Platinum)',
      'VIP concierge',
      '30% discount on all credits',
      'Highest global priority',
      'Verified badge (Silver+)',
      'Unlimited campaigns'
    ]
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get requirements for a specific level
 */
export function getLevelRequirements(level: BusinessLevel): LevelRequirements {
  return LEVEL_REQUIREMENTS[level];
}

/**
 * Get requirements for the next level
 */
export function getNextLevelRequirements(currentLevel: BusinessLevel): LevelRequirements | null {
  if (currentLevel >= 6) return null;
  return LEVEL_REQUIREMENTS[(currentLevel + 1) as BusinessLevel];
}

/**
 * Check if user meets requirements for next level
 */
export interface EligibilityCheck {
  eligible: boolean;
  currentLevel: BusinessLevel;
  nextLevel: BusinessLevel | null;
  
  // What's met
  meetsActivityRequirements: boolean;
  meetsQualityRequirements: boolean;
  meetsTimeRequirements: boolean;
  meetsVerificationRequirements: boolean;
  
  // Missing requirements
  missingRequirements: {
    missions?: number;
    meetups?: number;
    squads?: number;
    creditsUsed?: number;
    rating?: number;
    violations?: number;
    daysRemaining?: number;
    verificationDocuments?: string[];
  };
  
  // Progress percentage (0-100)
  progressPercentage: number;
  
  // Approval status
  requiresAdminApproval: boolean;
  canRequestUpgrade: boolean;
}

export function checkLevelEligibility(
  currentLevel: BusinessLevel,
  userData: {
    missionsCreated: number;
    meetupsAttended: number;
    squadsJoined: number;
    growthCreditsUsed: number;
    averageRating: number;
    violations: number;
    accountCreatedAt: Date;
    lastLevelUpAt?: Date;
    businessVerified: boolean;
    upgradeRequested: boolean;
  }
): EligibilityCheck {
  
  const nextLevel = currentLevel >= 6 ? null : (currentLevel + 1) as BusinessLevel;
  
  if (!nextLevel) {
    return {
      eligible: false,
      currentLevel,
      nextLevel: null,
      meetsActivityRequirements: true,
      meetsQualityRequirements: true,
      meetsTimeRequirements: true,
      meetsVerificationRequirements: true,
      missingRequirements: {},
      progressPercentage: 100,
      requiresAdminApproval: false,
      canRequestUpgrade: false
    };
  }
  
  const requirements = LEVEL_REQUIREMENTS[nextLevel];
  const missing: EligibilityCheck['missingRequirements'] = {};
  
  // Check activity requirements
  let activityScore = 0;
  let activityMax = 4;
  
  if (userData.missionsCreated >= requirements.minMissionsCreated) {
    activityScore++;
  } else {
    missing.missions = requirements.minMissionsCreated - userData.missionsCreated;
  }
  
  if (userData.meetupsAttended >= requirements.minMeetupsAttended) {
    activityScore++;
  } else {
    missing.meetups = requirements.minMeetupsAttended - userData.meetupsAttended;
  }
  
  if (userData.squadsJoined >= requirements.minSquadsJoined) {
    activityScore++;
  } else {
    missing.squads = requirements.minSquadsJoined - userData.squadsJoined;
  }
  
  if (userData.growthCreditsUsed >= requirements.minGrowthCreditsUsed) {
    activityScore++;
  } else {
    missing.creditsUsed = requirements.minGrowthCreditsUsed - userData.growthCreditsUsed;
  }
  
  const meetsActivityRequirements = activityScore === activityMax;
  
  // Check quality requirements
  let qualityScore = 0;
  let qualityMax = 2;
  
  if (userData.averageRating >= requirements.minAverageRating) {
    qualityScore++;
  } else {
    missing.rating = requirements.minAverageRating - userData.averageRating;
  }
  
  if (userData.violations <= requirements.maxViolations) {
    qualityScore++;
  } else {
    missing.violations = userData.violations - requirements.maxViolations;
  }
  
  const meetsQualityRequirements = qualityScore === qualityMax;
  
  // Check time requirements
  let meetsTimeRequirements = true;
  const now = new Date();
  
  if (requirements.minDaysSinceJoining) {
    const daysSinceJoining = Math.floor(
      (now.getTime() - userData.accountCreatedAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceJoining < requirements.minDaysSinceJoining) {
      meetsTimeRequirements = false;
      missing.daysRemaining = requirements.minDaysSinceJoining - daysSinceJoining;
    }
  }
  
  if (requirements.minDaysSincePreviousLevel && userData.lastLevelUpAt) {
    const daysSinceLevelUp = Math.floor(
      (now.getTime() - userData.lastLevelUpAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceLevelUp < requirements.minDaysSincePreviousLevel) {
      meetsTimeRequirements = false;
      const remaining = requirements.minDaysSincePreviousLevel - daysSinceLevelUp;
      missing.daysRemaining = Math.max(missing.daysRemaining || 0, remaining);
    }
  }
  
  // Check verification requirements
  let meetsVerificationRequirements = true;
  if (requirements.requiresBusinessVerification && !userData.businessVerified) {
    meetsVerificationRequirements = false;
    missing.verificationDocuments = requirements.verificationDocuments;
  }
  
  // Calculate overall progress
  const totalChecks = activityMax + qualityMax + (requirements.minDaysSinceJoining ? 1 : 0) + 
                      (requirements.minDaysSincePreviousLevel ? 1 : 0) +
                      (requirements.requiresBusinessVerification ? 1 : 0);
  const passedChecks = activityScore + qualityScore + 
                       (meetsTimeRequirements ? (requirements.minDaysSinceJoining ? 1 : 0) + 
                        (requirements.minDaysSincePreviousLevel ? 1 : 0) : 0) +
                       (meetsVerificationRequirements ? 1 : 0);
  
  const progressPercentage = Math.floor((passedChecks / totalChecks) * 100);
  
  const eligible = meetsActivityRequirements && 
                   meetsQualityRequirements && 
                   meetsTimeRequirements && 
                   meetsVerificationRequirements;
  
  return {
    eligible,
    currentLevel,
    nextLevel,
    meetsActivityRequirements,
    meetsQualityRequirements,
    meetsTimeRequirements,
    meetsVerificationRequirements,
    missingRequirements: missing,
    progressPercentage,
    requiresAdminApproval: requirements.requiresAdminApproval,
    canRequestUpgrade: eligible && !userData.upgradeRequested
  };
}

/**
 * Calculate XP needed for next sub-level (from existing system)
 * This integrates with the existing businessLevel XP system
 */
export const SUB_LEVEL_XP_THRESHOLDS = [0, 20, 50, 90, 140, 200, 270, 350, 440];

export function getXpProgress(currentXp: number, currentSubLevel: number): {
  currentThreshold: number;
  nextThreshold: number;
  xpInCurrentLevel: number;
  xpNeededForNext: number;
  progressPercentage: number;
} {
  const currentThreshold = SUB_LEVEL_XP_THRESHOLDS[currentSubLevel - 1] || 0;
  const nextThreshold = SUB_LEVEL_XP_THRESHOLDS[currentSubLevel] || 440;
  const xpInCurrentLevel = currentXp - currentThreshold;
  const xpNeededForNext = nextThreshold - currentXp;
  const progressPercentage = currentSubLevel === 9 
    ? 100 
    : Math.floor((xpInCurrentLevel / (nextThreshold - currentThreshold)) * 100);
  
  return {
    currentThreshold,
    nextThreshold,
    xpInCurrentLevel,
    xpNeededForNext: Math.max(0, xpNeededForNext),
    progressPercentage
  };
}

export default {
  LEVEL_REQUIREMENTS,
  getLevelRequirements,
  getNextLevelRequirements,
  checkLevelEligibility,
  getXpProgress,
  SUB_LEVEL_XP_THRESHOLDS
};
