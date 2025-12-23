/**
 * USER LEVEL MISSION LIMITS FOR FLUZIO
 * 
 * Defines mission participation limits and requirements based on user trust level.
 * Prevents spam, fraud, and abuse while rewarding trusted users with more freedom.
 * 
 * DESIGN PRINCIPLES:
 * 1. New users (Novice) are heavily restricted to prevent spam
 * 2. Referral missions unlock at Contributor (Level 3) to prevent self-referral fraud
 * 3. High-value missions require Trusted (Level 4) OR manual business confirmation
 * 4. Proof strictness DECREASES with trust level, not with reward amount
 * 5. Trust score gates access to sensitive missions (reviews, UGC, referrals)
 * 
 * ANTI-ABUSE MECHANISMS:
 * - Daily mission caps prevent grinding/farming
 * - Weekly high-value caps prevent coordinated fraud rings
 * - Monthly referral caps prevent self-referral networks
 * - Trust score requirements prevent bot accounts
 * - Proof strictness ensures quality submissions
 */

import type { ProofMethod } from '../types/missionSystem';

// ============================================================================
// USER LEVEL DEFINITIONS
// ============================================================================

export enum UserLevel {
  NOVICE = 1,        // 0-99 points
  EXPLORER = 2,      // 100-499 points
  CONTRIBUTOR = 3,   // 500-1499 points
  TRUSTED = 4,       // 1500-4999 points
  AMBASSADOR = 5,    // 5000-14999 points
  LEGEND = 6         // 15000+ points
}

export type ProofStrictness = 'HIGH' | 'MEDIUM' | 'LOW';

// ============================================================================
// USER LEVEL MISSION CONFIGURATION
// ============================================================================

export interface UserLevelConfig {
  level: UserLevel;
  levelName: string;
  pointsRequired: number;
  
  // DAILY LIMITS
  maxActiveMissionsPerDay: number;           // Total missions per 24hrs
  maxReviewMissionsPerDay: number;           // Google Reviews, social posts
  maxCheckInMissionsPerDay: number;          // Visit check-ins
  
  // WEEKLY LIMITS
  maxHighValueMissionsPerWeek: number;       // Purchases, consultations, high-reward missions
  maxUgcSubmissionsPerWeek: number;          // Photos, videos, stories
  
  // MONTHLY LIMITS
  maxReferralAttemptsPerMonth: number;       // Referral missions (both types)
  
  // TRUST & PROOF REQUIREMENTS
  minimumTrustScoreRequired: number;         // 0-100 scale from anti-cheat system
  proofStrictness: ProofStrictness;          // How thoroughly proofs are verified
  requiresManualApproval: boolean;           // Business must manually approve all submissions
  
  // MISSION TYPE RESTRICTIONS
  canAccessReferralMissions: boolean;        // Referrals unlocked at Contributor+
  canAccessHighValueMissions: boolean;       // Purchases, consultations unlocked at Trusted+
  canAccessUgcMissions: boolean;             // UGC unlocked at Explorer+
  canAccessReviewMissions: boolean;          // Reviews unlocked at Explorer+
  
  // COOLDOWN OVERRIDES
  minCooldownBetweenMissions: number;        // Minutes between any two missions
  canBypassBasicCooldowns: boolean;          // Trusted+ can skip short cooldowns
  
  // REWARDS & BENEFITS
  rewardMultiplier: number;                  // Bonus points multiplier (1.0 = normal)
  priorityReview: boolean;                   // Submissions reviewed faster
}

// ============================================================================
// LEVEL CONFIGURATION MATRIX
// ============================================================================

export const USER_LEVEL_MISSION_LIMITS: Record<UserLevel, UserLevelConfig> = {
  
  // ==========================================================================
  // LEVEL 1: NOVICE (0-99 points)
  // ==========================================================================
  // Brand new users. High risk of bots, spam, fraud.
  // Heavily restricted to prevent abuse while allowing genuine users to progress.
  
  [UserLevel.NOVICE]: {
    level: UserLevel.NOVICE,
    levelName: 'Novice',
    pointsRequired: 0,
    
    // DAILY LIMITS - Very restrictive
    maxActiveMissionsPerDay: 3,              // Only 3 missions per day
    maxReviewMissionsPerDay: 0,              // NO reviews (prevent fake review farms)
    maxCheckInMissionsPerDay: 2,             // Max 2 check-ins (prevent location fraud)
    
    // WEEKLY LIMITS
    maxHighValueMissionsPerWeek: 1,          // Only 1 purchase/consultation per week
    maxUgcSubmissionsPerWeek: 0,             // NO UGC (prevent spam, AI-generated content)
    
    // MONTHLY LIMITS
    maxReferralAttemptsPerMonth: 0,          // NO referrals (prevent self-referral networks)
    
    // TRUST & PROOF
    minimumTrustScoreRequired: 0,            // No minimum (everyone starts here)
    proofStrictness: 'HIGH',                 // Maximum verification on all submissions
    requiresManualApproval: true,            // ALL missions require business approval
    
    // RESTRICTIONS
    canAccessReferralMissions: false,        // Locked until Contributor
    canAccessHighValueMissions: true,        // Allow first purchase to progress
    canAccessUgcMissions: false,             // Locked until Explorer
    canAccessReviewMissions: false,          // Locked until Explorer
    
    // COOLDOWNS
    minCooldownBetweenMissions: 30,          // 30 min between missions (prevent rapid farming)
    canBypassBasicCooldowns: false,
    
    // REWARDS
    rewardMultiplier: 1.0,                   // Standard rewards
    priorityReview: false                    // Standard queue
  },
  
  // ==========================================================================
  // LEVEL 2: EXPLORER (100-499 points)
  // ==========================================================================
  // Users who have completed a few missions successfully.
  // Still relatively new, but showing genuine engagement.
  // Unlock reviews and basic UGC to encourage content creation.
  
  [UserLevel.EXPLORER]: {
    level: UserLevel.EXPLORER,
    levelName: 'Explorer',
    pointsRequired: 100,
    
    // DAILY LIMITS - Moderate restrictions
    maxActiveMissionsPerDay: 5,              // 5 missions per day
    maxReviewMissionsPerDay: 1,              // 1 review per day (prevent spam but allow participation)
    maxCheckInMissionsPerDay: 3,             // 3 check-ins per day
    
    // WEEKLY LIMITS
    maxHighValueMissionsPerWeek: 2,          // 2 purchases/consultations per week
    maxUgcSubmissionsPerWeek: 2,             // 2 photos/videos per week (test quality)
    
    // MONTHLY LIMITS
    maxReferralAttemptsPerMonth: 0,          // Still NO referrals (need more trust)
    
    // TRUST & PROOF
    minimumTrustScoreRequired: 30,           // Must have clean record (no fraud flags)
    proofStrictness: 'HIGH',                 // Still high verification (learning phase)
    requiresManualApproval: true,            // All high-value still need approval
    
    // RESTRICTIONS
    canAccessReferralMissions: false,        // Still locked
    canAccessHighValueMissions: true,        // Can make purchases
    canAccessUgcMissions: true,              // UNLOCKED - Can submit photos/videos
    canAccessReviewMissions: true,           // UNLOCKED - Can post reviews
    
    // COOLDOWNS
    minCooldownBetweenMissions: 20,          // 20 min between missions
    canBypassBasicCooldowns: false,
    
    // REWARDS
    rewardMultiplier: 1.05,                  // 5% bonus (encourage progression)
    priorityReview: false
  },
  
  // ==========================================================================
  // LEVEL 3: CONTRIBUTOR (500-1499 points)
  // ==========================================================================
  // Established users with proven track record.
  // Trust score should be 50+ (no fraud incidents).
  // Unlock referral missions - user has demonstrated they are real and engaged.
  
  [UserLevel.CONTRIBUTOR]: {
    level: UserLevel.CONTRIBUTOR,
    levelName: 'Contributor',
    pointsRequired: 500,
    
    // DAILY LIMITS - Relaxed
    maxActiveMissionsPerDay: 8,              // 8 missions per day
    maxReviewMissionsPerDay: 2,              // 2 reviews per day
    maxCheckInMissionsPerDay: 5,             // 5 check-ins per day
    
    // WEEKLY LIMITS
    maxHighValueMissionsPerWeek: 4,          // 4 purchases/consultations per week
    maxUgcSubmissionsPerWeek: 5,             // 5 photos/videos per week
    
    // MONTHLY LIMITS
    maxReferralAttemptsPerMonth: 3,          // UNLOCKED - 3 referrals per month (conservative start)
    
    // TRUST & PROOF
    minimumTrustScoreRequired: 50,           // Must be in "Cautious" tier or better
    proofStrictness: 'MEDIUM',               // Reduced verification (proven trustworthy)
    requiresManualApproval: false,           // Auto-approve low/medium value missions
    
    // RESTRICTIONS
    canAccessReferralMissions: true,         // UNLOCKED - Can refer friends
    canAccessHighValueMissions: true,
    canAccessUgcMissions: true,
    canAccessReviewMissions: true,
    
    // COOLDOWNS
    minCooldownBetweenMissions: 15,          // 15 min between missions
    canBypassBasicCooldowns: false,
    
    // REWARDS
    rewardMultiplier: 1.10,                  // 10% bonus
    priorityReview: false
  },
  
  // ==========================================================================
  // LEVEL 4: TRUSTED (1500-4999 points)
  // ==========================================================================
  // Highly trusted users with consistent history.
  // Trust score should be 70+ (Good tier).
  // Can access high-value missions without manual approval.
  // Lower proof strictness - system trusts their submissions.
  
  [UserLevel.TRUSTED]: {
    level: UserLevel.TRUSTED,
    levelName: 'Trusted',
    pointsRequired: 1500,
    
    // DAILY LIMITS - Generous
    maxActiveMissionsPerDay: 12,             // 12 missions per day
    maxReviewMissionsPerDay: 3,              // 3 reviews per day
    maxCheckInMissionsPerDay: 8,             // 8 check-ins per day
    
    // WEEKLY LIMITS
    maxHighValueMissionsPerWeek: 7,          // 7 purchases/consultations per week
    maxUgcSubmissionsPerWeek: 10,            // 10 photos/videos per week
    
    // MONTHLY LIMITS
    maxReferralAttemptsPerMonth: 5,          // 5 referrals per month
    
    // TRUST & PROOF
    minimumTrustScoreRequired: 70,           // Must be in "Good" tier
    proofStrictness: 'LOW',                  // Minimal verification (trust-based)
    requiresManualApproval: false,           // Auto-approve almost everything
    
    // RESTRICTIONS
    canAccessReferralMissions: true,
    canAccessHighValueMissions: true,        // No restrictions on high-value
    canAccessUgcMissions: true,
    canAccessReviewMissions: true,
    
    // COOLDOWNS
    minCooldownBetweenMissions: 10,          // 10 min between missions
    canBypassBasicCooldowns: true,           // Can skip cooldowns under 1 hour
    
    // REWARDS
    rewardMultiplier: 1.15,                  // 15% bonus
    priorityReview: true                     // Submissions reviewed first
  },
  
  // ==========================================================================
  // LEVEL 5: AMBASSADOR (5000-14999 points)
  // ==========================================================================
  // Elite users who are brand advocates.
  // Trust score should be 85+ (Excellent tier).
  // Maximum freedom with minimal restrictions.
  // Can be recruited as community moderators.
  
  [UserLevel.AMBASSADOR]: {
    level: UserLevel.AMBASSADOR,
    levelName: 'Ambassador',
    pointsRequired: 5000,
    
    // DAILY LIMITS - Very generous
    maxActiveMissionsPerDay: 20,             // 20 missions per day
    maxReviewMissionsPerDay: 5,              // 5 reviews per day
    maxCheckInMissionsPerDay: 15,            // 15 check-ins per day
    
    // WEEKLY LIMITS
    maxHighValueMissionsPerWeek: 12,         // 12 purchases/consultations per week
    maxUgcSubmissionsPerWeek: 20,            // 20 photos/videos per week
    
    // MONTHLY LIMITS
    maxReferralAttemptsPerMonth: 10,         // 10 referrals per month (power users)
    
    // TRUST & PROOF
    minimumTrustScoreRequired: 85,           // Must be "Excellent" tier
    proofStrictness: 'LOW',                  // Minimal verification
    requiresManualApproval: false,           // Full auto-approval
    
    // RESTRICTIONS
    canAccessReferralMissions: true,
    canAccessHighValueMissions: true,
    canAccessUgcMissions: true,
    canAccessReviewMissions: true,
    
    // COOLDOWNS
    minCooldownBetweenMissions: 5,           // 5 min between missions
    canBypassBasicCooldowns: true,
    
    // REWARDS
    rewardMultiplier: 1.25,                  // 25% bonus
    priorityReview: true
  },
  
  // ==========================================================================
  // LEVEL 6: LEGEND (15000+ points)
  // ==========================================================================
  // Platform legends with impeccable reputation.
  // Trust score must be 90+ (perfect or near-perfect record).
  // Essentially unlimited access with only anti-spam protections.
  // Eligible for special perks, beta features, business partnerships.
  
  [UserLevel.LEGEND]: {
    level: UserLevel.LEGEND,
    levelName: 'Legend',
    pointsRequired: 15000,
    
    // DAILY LIMITS - Maximum freedom
    maxActiveMissionsPerDay: 50,             // 50 missions per day (anti-spam only)
    maxReviewMissionsPerDay: 10,             // 10 reviews per day
    maxCheckInMissionsPerDay: 30,            // 30 check-ins per day
    
    // WEEKLY LIMITS
    maxHighValueMissionsPerWeek: 20,         // 20 purchases/consultations per week
    maxUgcSubmissionsPerWeek: 50,            // 50 photos/videos per week
    
    // MONTHLY LIMITS
    maxReferralAttemptsPerMonth: 20,         // 20 referrals per month
    
    // TRUST & PROOF
    minimumTrustScoreRequired: 90,           // Must be elite tier
    proofStrictness: 'LOW',                  // Trust-based only
    requiresManualApproval: false,           // Full automation
    
    // RESTRICTIONS
    canAccessReferralMissions: true,
    canAccessHighValueMissions: true,
    canAccessUgcMissions: true,
    canAccessReviewMissions: true,
    
    // COOLDOWNS
    minCooldownBetweenMissions: 0,           // No cooldowns
    canBypassBasicCooldowns: true,
    
    // REWARDS
    rewardMultiplier: 1.50,                  // 50% bonus (legendary status)
    priorityReview: true
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * GET USER LEVEL CONFIG
 */
export function getUserLevelConfig(level: UserLevel): UserLevelConfig {
  return USER_LEVEL_MISSION_LIMITS[level];
}

/**
 * CALCULATE USER LEVEL FROM POINTS
 */
export function calculateUserLevel(totalPoints: number): UserLevel {
  if (totalPoints >= 15000) return UserLevel.LEGEND;
  if (totalPoints >= 5000) return UserLevel.AMBASSADOR;
  if (totalPoints >= 1500) return UserLevel.TRUSTED;
  if (totalPoints >= 500) return UserLevel.CONTRIBUTOR;
  if (totalPoints >= 100) return UserLevel.EXPLORER;
  return UserLevel.NOVICE;
}

/**
 * GET NEXT LEVEL REQUIREMENTS
 */
export function getNextLevelRequirements(currentLevel: UserLevel, currentPoints: number): {
  nextLevel: UserLevel | null;
  pointsNeeded: number;
  percentComplete: number;
} {
  const nextLevel = currentLevel + 1;
  if (nextLevel > UserLevel.LEGEND) {
    return { nextLevel: null, pointsNeeded: 0, percentComplete: 100 };
  }
  
  const nextConfig = USER_LEVEL_MISSION_LIMITS[nextLevel as UserLevel];
  const currentConfig = USER_LEVEL_MISSION_LIMITS[currentLevel];
  
  const pointsNeeded = nextConfig.pointsRequired - currentPoints;
  const pointsInLevel = nextConfig.pointsRequired - currentConfig.pointsRequired;
  const pointsEarned = currentPoints - currentConfig.pointsRequired;
  const percentComplete = Math.min(100, (pointsEarned / pointsInLevel) * 100);
  
  return {
    nextLevel: nextLevel as UserLevel,
    pointsNeeded: Math.max(0, pointsNeeded),
    percentComplete
  };
}

// ============================================================================
// ENFORCEMENT LOGIC (PSEUDO-CODE)
// ============================================================================

/**
 * CHECK IF USER CAN START MISSION
 * 
 * Validates user level requirements before allowing mission participation.
 * Returns validation result with specific reasons for rejection.
 */
export interface MissionAccessValidation {
  canAccess: boolean;
  reasons: string[];
  requiredLevel?: UserLevel;
  requiredTrustScore?: number;
}

export function validateMissionAccess(
  userId: string,
  missionId: string,
  missionType: 'REVIEW' | 'CHECK_IN' | 'HIGH_VALUE' | 'UGC' | 'REFERRAL' | 'STANDARD',
  userLevel: UserLevel,
  userTrustScore: number,
  userPoints: number
): MissionAccessValidation {
  
  const config = getUserLevelConfig(userLevel);
  const reasons: string[] = [];
  
  // Check trust score requirement
  if (userTrustScore < config.minimumTrustScoreRequired) {
    reasons.push(`Trust score too low. Need ${config.minimumTrustScoreRequired}, have ${userTrustScore}.`);
  }
  
  // Check mission type restrictions
  switch (missionType) {
    case 'REFERRAL':
      if (!config.canAccessReferralMissions) {
        reasons.push(`Referral missions unlock at Contributor (Level 3). Current level: ${config.levelName}.`);
        return {
          canAccess: false,
          reasons,
          requiredLevel: UserLevel.CONTRIBUTOR,
          requiredTrustScore: 50
        };
      }
      break;
      
    case 'HIGH_VALUE':
      if (!config.canAccessHighValueMissions && config.requiresManualApproval) {
        reasons.push(`High-value missions require Trusted level OR manual business approval.`);
      }
      break;
      
    case 'UGC':
      if (!config.canAccessUgcMissions) {
        reasons.push(`UGC missions unlock at Explorer (Level 2). Current level: ${config.levelName}.`);
        return {
          canAccess: false,
          reasons,
          requiredLevel: UserLevel.EXPLORER,
          requiredTrustScore: 30
        };
      }
      break;
      
    case 'REVIEW':
      if (!config.canAccessReviewMissions) {
        reasons.push(`Review missions unlock at Explorer (Level 2). Current level: ${config.levelName}.`);
        return {
          canAccess: false,
          reasons,
          requiredLevel: UserLevel.EXPLORER,
          requiredTrustScore: 30
        };
      }
      break;
  }
  
  // Check daily/weekly/monthly limits (would need to query database)
  // This is pseudo-code showing the logic:
  /*
  const today = getStartOfDay();
  const thisWeek = getStartOfWeek();
  const thisMonth = getStartOfMonth();
  
  const missionsToday = await countUserMissions(userId, today);
  const highValueThisWeek = await countUserMissions(userId, thisWeek, 'HIGH_VALUE');
  const referralsThisMonth = await countUserMissions(userId, thisMonth, 'REFERRAL');
  const ugcThisWeek = await countUserMissions(userId, thisWeek, 'UGC');
  const reviewsToday = await countUserMissions(userId, today, 'REVIEW');
  
  if (missionsToday >= config.maxActiveMissionsPerDay) {
    reasons.push(`Daily mission limit reached (${config.maxActiveMissionsPerDay}). Reset at midnight.`);
  }
  
  if (missionType === 'HIGH_VALUE' && highValueThisWeek >= config.maxHighValueMissionsPerWeek) {
    reasons.push(`Weekly high-value limit reached (${config.maxHighValueMissionsPerWeek}). Reset Monday.`);
  }
  
  if (missionType === 'REFERRAL' && referralsThisMonth >= config.maxReferralAttemptsPerMonth) {
    reasons.push(`Monthly referral limit reached (${config.maxReferralAttemptsPerMonth}). Reset next month.`);
  }
  
  if (missionType === 'UGC' && ugcThisWeek >= config.maxUgcSubmissionsPerWeek) {
    reasons.push(`Weekly UGC limit reached (${config.maxUgcSubmissionsPerWeek}). Reset Monday.`);
  }
  
  if (missionType === 'REVIEW' && reviewsToday >= config.maxReviewMissionsPerDay) {
    reasons.push(`Daily review limit reached (${config.maxReviewMissionsPerDay}). Reset at midnight.`);
  }
  */
  
  return {
    canAccess: reasons.length === 0,
    reasons,
    requiredLevel: reasons.length > 0 ? undefined : undefined,
    requiredTrustScore: config.minimumTrustScoreRequired
  };
}

/**
 * GET PROOF VERIFICATION LEVEL
 * 
 * Determines how strictly to verify proof based on user level.
 * Lower trust users get stricter verification.
 */
export interface ProofVerificationConfig {
  strictness: ProofStrictness;
  requiresManualReview: boolean;
  aiConfidenceThreshold: number;      // 0-100, minimum AI confidence to auto-approve
  requiresBusinessApproval: boolean;
  allowAutoApproval: boolean;
  additionalChecks: string[];
}

export function getProofVerificationConfig(
  userLevel: UserLevel,
  userTrustScore: number,
  missionValue: number  // Points reward
): ProofVerificationConfig {
  
  const config = getUserLevelConfig(userLevel);
  
  // Base configuration from level
  let strictness = config.proofStrictness;
  let requiresManualReview = config.requiresManualApproval;
  let aiConfidenceThreshold = 85; // Default
  let additionalChecks: string[] = [];
  
  // Adjust based on strictness level
  switch (strictness) {
    case 'HIGH':
      aiConfidenceThreshold = 95;  // Very confident AI required
      additionalChecks = [
        'EXIF_METADATA_CHECK',
        'REVERSE_IMAGE_SEARCH',
        'GEOLOCATION_VERIFICATION',
        'TIMESTAMP_FRESHNESS',
        'AI_GENERATION_DETECTION',
        'DUPLICATE_SUBMISSION_CHECK'
      ];
      break;
      
    case 'MEDIUM':
      aiConfidenceThreshold = 85;
      additionalChecks = [
        'EXIF_METADATA_CHECK',
        'GEOLOCATION_VERIFICATION',
        'TIMESTAMP_FRESHNESS',
        'DUPLICATE_SUBMISSION_CHECK'
      ];
      break;
      
    case 'LOW':
      aiConfidenceThreshold = 75;  // More lenient
      additionalChecks = [
        'DUPLICATE_SUBMISSION_CHECK'  // Only check for duplicate fraud
      ];
      break;
  }
  
  // High-value missions ALWAYS get extra scrutiny regardless of user level
  if (missionValue >= 200) {
    strictness = 'HIGH';
    requiresManualReview = true;
    aiConfidenceThreshold = 95;
    if (!additionalChecks.includes('BUSINESS_FINAL_APPROVAL')) {
      additionalChecks.push('BUSINESS_FINAL_APPROVAL');
    }
  }
  
  // Trust score overrides (very low trust = always manual)
  if (userTrustScore < 30) {
    strictness = 'HIGH';
    requiresManualReview = true;
    additionalChecks.push('FRAUD_TEAM_REVIEW');
  }
  
  return {
    strictness,
    requiresManualReview,
    aiConfidenceThreshold,
    requiresBusinessApproval: requiresManualReview || missionValue >= 200,
    allowAutoApproval: !requiresManualReview && userTrustScore >= 70,
    additionalChecks
  };
}

/**
 * CHECK COOLDOWN ENFORCEMENT
 * 
 * Validates if user must wait between missions.
 * Higher level users can bypass short cooldowns.
 */
export function canBypassCooldown(
  userLevel: UserLevel,
  cooldownMinutes: number
): boolean {
  const config = getUserLevelConfig(userLevel);
  
  if (!config.canBypassBasicCooldowns) {
    return false;  // Must respect all cooldowns
  }
  
  // Trusted+ can bypass cooldowns under 60 minutes
  return cooldownMinutes < 60;
}

/**
 * CALCULATE EFFECTIVE REWARD
 * 
 * Applies level multiplier to base reward.
 */
export function calculateEffectiveReward(
  baseReward: number,
  userLevel: UserLevel
): number {
  const config = getUserLevelConfig(userLevel);
  return Math.round(baseReward * config.rewardMultiplier);
}

// ============================================================================
// MISSION TYPE CLASSIFIER
// ============================================================================

/**
 * Classify mission into category for limit enforcement
 */
export function classifyMissionType(missionId: string): 'REVIEW' | 'CHECK_IN' | 'HIGH_VALUE' | 'UGC' | 'REFERRAL' | 'STANDARD' {
  // Map mission IDs to categories
  const missionCategories: Record<string, 'REVIEW' | 'CHECK_IN' | 'HIGH_VALUE' | 'UGC' | 'REFERRAL' | 'STANDARD'> = {
    'GOOGLE_REVIEW_TEXT': 'REVIEW',
    'GOOGLE_REVIEW_PHOTOS': 'REVIEW',
    'VISIT_CHECKIN': 'CHECK_IN',
    'CONSULTATION_REQUEST': 'HIGH_VALUE',
    'REDEEM_OFFER': 'STANDARD',
    'FIRST_PURCHASE': 'HIGH_VALUE',
    'REFER_PAYING_CUSTOMER': 'REFERRAL',
    'BRING_A_FRIEND': 'REFERRAL',
    'UGC_PHOTO_UPLOAD': 'UGC',
    'UGC_VIDEO_UPLOAD': 'UGC',
    'STORY_POST_TAG': 'UGC',
    'FEED_REEL_POST_TAG': 'UGC',
    'REPEAT_PURCHASE_VISIT': 'HIGH_VALUE',
    'INSTAGRAM_FOLLOW': 'STANDARD'
  };
  
  return missionCategories[missionId] || 'STANDARD';
}

export const USER_LEVEL_MISSION_LIMITS_VERSION = '1.0.0';
