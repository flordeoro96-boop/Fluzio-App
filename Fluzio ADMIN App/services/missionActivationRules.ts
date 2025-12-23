/**
 * BUSINESS-SIDE MISSION ACTIVATION RULES FOR FLUZIO
 * 
 * Ensures businesses configure missions correctly to:
 * 1. Prioritize conversion over vanity metrics
 * 2. Prevent reward abuse
 * 3. Protect customer data and content rights
 * 4. Align incentives with business outcomes
 */

import type { Mission, BusinessNeed, ProofMethod } from '../types/missionSystem';

// ============================================================================
// MISSION ACTIVATION RULES
// ============================================================================

/**
 * CORE ACTIVATION REQUIREMENTS
 */

export interface MissionActivationRules {
  // Conversion requirement
  requiresConversionMission: boolean;           // Must have ≥1 CONVERSION mission
  minConversionMissions: number;                // Minimum number of conversion missions
  
  // Social vs Conversion balance
  maxSocialToConversionRatio: number;           // Social rewards ÷ Conversion rewards ≤ ratio
  
  // Reward delays by mission type
  defaultRewardDelays: {
    googleReview: number;                       // Days (cannot be 0)
    referral: number;                           // Days (must exceed refund window)
    purchase: number;                           // Days (refund protection)
    ugc: number;                                // Days (review period)
  };
  
  // Content rights
  ugcRequiresReuseConsent: boolean;             // Must explicitly enable reuse
  defaultUGCReuseConsent: boolean;              // Default value for consent
  
  // Rate limits
  defaultCooldowns: {
    perUser: number;                            // Days between same mission
    perBusiness: number;                        // Days before reactivating mission
  };
  
  // Caps
  defaultCaps: {
    maxParticipantsPerMission: number;          // Total completions allowed
    maxSubmissionsPerUser: number;              // Per user lifetime
    maxDailySubmissions: number;                // Per user per day
  };
}

/**
 * DEFAULT ACTIVATION RULES
 */

export const DEFAULT_ACTIVATION_RULES: MissionActivationRules = {
  requiresConversionMission: true,
  minConversionMissions: 1,
  maxSocialToConversionRatio: 0.5,              // Social rewards ≤ 50% of conversion rewards
  
  defaultRewardDelays: {
    googleReview: 7,                            // 7 days (allows deletion detection)
    referral: 14,                               // 14 days (standard refund window)
    purchase: 7,                                // 7 days (refund protection)
    ugc: 3,                                     // 3 days (quality review)
  },
  
  ugcRequiresReuseConsent: true,
  defaultUGCReuseConsent: false,                // Businesses must opt-in to reuse
  
  defaultCooldowns: {
    perUser: 30,                                // Once per month per mission
    perBusiness: 0,                             // No cooldown for reactivation
  },
  
  defaultCaps: {
    maxParticipantsPerMission: 1000,            // Reasonable limit
    maxSubmissionsPerUser: 1,                   // Most missions: one-time only
    maxDailySubmissions: 5,                     // Prevent spam
  },
};

// ============================================================================
// VALIDATION ERRORS
// ============================================================================

export enum MissionActivationError {
  // Conversion requirements
  NO_CONVERSION_MISSION = 'NO_CONVERSION_MISSION',
  INSUFFICIENT_CONVERSION_MISSIONS = 'INSUFFICIENT_CONVERSION_MISSIONS',
  
  // Social vs Conversion balance
  SOCIAL_REWARDS_EXCEED_CONVERSION = 'SOCIAL_REWARDS_EXCEED_CONVERSION',
  
  // Reward delay violations
  GOOGLE_REVIEW_NO_DELAY = 'GOOGLE_REVIEW_NO_DELAY',
  REFERRAL_DELAY_TOO_SHORT = 'REFERRAL_DELAY_TOO_SHORT',
  PURCHASE_DELAY_TOO_SHORT = 'PURCHASE_DELAY_TOO_SHORT',
  
  // Content rights
  UGC_MISSING_REUSE_CONSENT = 'UGC_MISSING_REUSE_CONSENT',
  
  // Configuration errors
  INVALID_REWARD_AMOUNT = 'INVALID_REWARD_AMOUNT',
  INVALID_COOLDOWN = 'INVALID_COOLDOWN',
  INVALID_CAP = 'INVALID_CAP',
  
  // Mission conflicts
  DUPLICATE_MISSION_TYPE = 'DUPLICATE_MISSION_TYPE',
  CONFLICTING_REQUIREMENTS = 'CONFLICTING_REQUIREMENTS',
}

export interface ValidationError {
  code: MissionActivationError;
  message: string;
  field?: string;
  suggestedFix?: string;
}

// ============================================================================
// ERROR MESSAGES (User-Friendly)
// ============================================================================

export const ACTIVATION_ERROR_MESSAGES: Record<MissionActivationError, {
  title: string;
  message: string;
  suggestedFix: string;
}> = {
  [MissionActivationError.NO_CONVERSION_MISSION]: {
    title: 'Missing Conversion Mission',
    message: 'You must activate at least one conversion mission that drives revenue or bookings.',
    suggestedFix: 'Add a "First Purchase", "Consultation Request", or "Redeem Offer" mission before activating social missions.',
  },
  
  [MissionActivationError.INSUFFICIENT_CONVERSION_MISSIONS]: {
    title: 'Not Enough Conversion Missions',
    message: 'Your mission mix should prioritize conversions over social engagement.',
    suggestedFix: 'Activate at least one more conversion mission (First Purchase, Repeat Visit, or Referral).',
  },
  
  [MissionActivationError.SOCIAL_REWARDS_EXCEED_CONVERSION]: {
    title: 'Social Rewards Too High',
    message: 'Social media missions cannot offer more total rewards than conversion missions. This ensures you\'re incentivizing real business outcomes.',
    suggestedFix: 'Either reduce social mission rewards or increase conversion mission rewards. Social rewards should be ≤50% of conversion rewards.',
  },
  
  [MissionActivationError.GOOGLE_REVIEW_NO_DELAY]: {
    title: 'Google Review Requires Delay',
    message: 'Google review rewards must have a minimum 7-day delay to detect fake or deleted reviews.',
    suggestedFix: 'Set reward delay to at least 7 days for Google review missions.',
  },
  
  [MissionActivationError.REFERRAL_DELAY_TOO_SHORT]: {
    title: 'Referral Delay Too Short',
    message: 'Referral rewards must have a minimum 14-day delay to account for refund windows and fraud detection.',
    suggestedFix: 'Set reward delay to at least 14 days for referral missions.',
  },
  
  [MissionActivationError.PURCHASE_DELAY_TOO_SHORT]: {
    title: 'Purchase Delay Recommended',
    message: 'Purchase missions should have a 7-day delay to protect against refund abuse.',
    suggestedFix: 'Set reward delay to at least 7 days for purchase missions.',
  },
  
  [MissionActivationError.UGC_MISSING_REUSE_CONSENT]: {
    title: 'UGC Reuse Consent Required',
    message: 'You must explicitly state whether you want to reuse user-generated photos/videos in your marketing.',
    suggestedFix: 'Check "I want to reuse this content" if you plan to use submissions in ads, or leave unchecked for private use only.',
  },
  
  [MissionActivationError.INVALID_REWARD_AMOUNT]: {
    title: 'Invalid Reward Amount',
    message: 'Reward amount must be between 25 and 500 points.',
    suggestedFix: 'Set reward between 25-500 points based on mission difficulty and value.',
  },
  
  [MissionActivationError.INVALID_COOLDOWN]: {
    title: 'Invalid Cooldown Period',
    message: 'Cooldown period must be between 0 and 365 days.',
    suggestedFix: 'Set cooldown between 0-365 days, or use default (30 days).',
  },
  
  [MissionActivationError.INVALID_CAP]: {
    title: 'Invalid Participation Cap',
    message: 'Participation cap must be at least 1 and at most 10,000.',
    suggestedFix: 'Set cap between 1-10,000 participants, or leave unlimited.',
  },
  
  [MissionActivationError.DUPLICATE_MISSION_TYPE]: {
    title: 'Duplicate Mission Type',
    message: 'You already have an active mission of this type. Deactivate the existing one first.',
    suggestedFix: 'Edit or deactivate your existing mission before creating a new one of the same type.',
  },
  
  [MissionActivationError.CONFLICTING_REQUIREMENTS]: {
    title: 'Conflicting Requirements',
    message: 'Mission configuration has conflicting requirements that cannot be satisfied.',
    suggestedFix: 'Review mission settings and resolve conflicts (e.g., instant reward + refund protection).',
  },
};

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * VALIDATE ENTIRE MISSION SET FOR A BUSINESS
 * 
 * Called when business tries to activate a new mission.
 * Checks entire mission portfolio to ensure compliance.
 */

export function validateMissionActivation(
  newMission: Mission,
  existingMissions: Mission[],
  rules: MissionActivationRules = DEFAULT_ACTIVATION_RULES
): ValidationError[] {
  
  const errors: ValidationError[] = [];
  
  // Combine new mission with existing active missions
  const allMissions = [...existingMissions.filter(m => m.status === 'ACTIVE'), newMission];
  
  // 1. CHECK: Must have at least one conversion mission
  errors.push(...validateConversionRequirement(allMissions, rules));
  
  // 2. CHECK: Social rewards cannot exceed conversion rewards
  errors.push(...validateSocialConversionBalance(allMissions, rules));
  
  // 3. CHECK: Reward delays are appropriate
  errors.push(...validateRewardDelays(newMission, rules));
  
  // 4. CHECK: UGC missions have explicit consent
  errors.push(...validateUGCConsent(newMission, rules));
  
  // 5. CHECK: Reward amount is valid
  errors.push(...validateRewardAmount(newMission));
  
  // 6. CHECK: Cooldowns are valid
  errors.push(...validateCooldowns(newMission));
  
  // 7. CHECK: Caps are valid
  errors.push(...validateCaps(newMission));
  
  // 8. CHECK: No duplicate mission types (optional, business-specific)
  errors.push(...validateNoDuplicates(newMission, existingMissions));
  
  return errors;
}

/**
 * 1. VALIDATE CONVERSION REQUIREMENT
 */

function validateConversionRequirement(
  missions: Mission[],
  rules: MissionActivationRules
): ValidationError[] {
  
  const errors: ValidationError[] = [];
  
  const conversionMissions = missions.filter(m => 
    m.businessNeed === 'CONVERSION'
  );
  
  if (conversionMissions.length < rules.minConversionMissions) {
    errors.push({
      code: MissionActivationError.NO_CONVERSION_MISSION,
      message: ACTIVATION_ERROR_MESSAGES[MissionActivationError.NO_CONVERSION_MISSION].message,
      suggestedFix: ACTIVATION_ERROR_MESSAGES[MissionActivationError.NO_CONVERSION_MISSION].suggestedFix,
    });
  }
  
  return errors;
}

/**
 * 2. VALIDATE SOCIAL VS CONVERSION BALANCE
 * 
 * Social missions (CONTENT) cannot offer more total rewards than conversion missions.
 * Example:
 * - Conversion missions: 300 + 200 = 500 points total
 * - Social missions: Must be ≤ 250 points total (50% ratio)
 */

function validateSocialConversionBalance(
  missions: Mission[],
  rules: MissionActivationRules
): ValidationError[] {
  
  const errors: ValidationError[] = [];
  
  // Calculate total rewards by type
  const conversionRewards = missions
    .filter(m => m.businessNeed === 'CONVERSION')
    .reduce((sum, m) => sum + m.rewardPoints, 0);
  
  const socialRewards = missions
    .filter(m => m.businessNeed === 'CONTENT')
    .reduce((sum, m) => sum + m.rewardPoints, 0);
  
  // Check ratio
  const maxAllowedSocial = conversionRewards * rules.maxSocialToConversionRatio;
  
  if (socialRewards > maxAllowedSocial && conversionRewards > 0) {
    errors.push({
      code: MissionActivationError.SOCIAL_REWARDS_EXCEED_CONVERSION,
      message: ACTIVATION_ERROR_MESSAGES[MissionActivationError.SOCIAL_REWARDS_EXCEED_CONVERSION].message,
      suggestedFix: `Reduce social rewards to ≤${Math.floor(maxAllowedSocial)} points (currently ${socialRewards} points).`,
    });
  }
  
  return errors;
}

/**
 * 3. VALIDATE REWARD DELAYS
 * 
 * Certain mission types MUST have minimum delays to prevent abuse.
 */

function validateRewardDelays(
  mission: Mission,
  rules: MissionActivationRules
): ValidationError[] {
  
  const errors: ValidationError[] = [];
  
  // Google Review: Must have minimum 7-day delay
  if (mission.name.toLowerCase().includes('google review') || 
      mission.name.toLowerCase().includes('review')) {
    
    if ((mission.rewardLockDelayDays ?? 0) < rules.defaultRewardDelays.googleReview) {
      errors.push({
        code: MissionActivationError.GOOGLE_REVIEW_NO_DELAY,
        message: ACTIVATION_ERROR_MESSAGES[MissionActivationError.GOOGLE_REVIEW_NO_DELAY].message,
        field: 'rewardLockDelayDays',
        suggestedFix: `Set delay to ${rules.defaultRewardDelays.googleReview} days.`,
      });
    }
  }
  
  // Referral: Must have minimum 14-day delay
  if (mission.businessNeed === 'REFERRAL') {
    if (mission.rewardLockDelayDays < rules.defaultRewardDelays.referral) {
      errors.push({
        code: MissionActivationError.REFERRAL_DELAY_TOO_SHORT,
        message: ACTIVATION_ERROR_MESSAGES[MissionActivationError.REFERRAL_DELAY_TOO_SHORT].message,
        field: 'rewardLockDelayDays',
        suggestedFix: `Set delay to ${rules.defaultRewardDelays.referral} days.`,
      });
    }
  }
  
  // Purchase: Recommended 7-day delay (warning, not error)
  if (mission.businessNeed === 'CONVERSION' && 
      mission.name.toLowerCase().includes('purchase')) {
    
    if (mission.rewardLockDelayDays < rules.defaultRewardDelays.purchase) {
      // This is a warning, not a hard error
      // Still push as error but with "RECOMMENDED" message
      errors.push({
        code: MissionActivationError.PURCHASE_DELAY_TOO_SHORT,
        message: ACTIVATION_ERROR_MESSAGES[MissionActivationError.PURCHASE_DELAY_TOO_SHORT].message,
        field: 'rewardLockDelayDays',
        suggestedFix: `Recommended: ${rules.defaultRewardDelays.purchase} days.`,
      });
    }
  }
  
  return errors;
}

/**
 * 4. VALIDATE UGC CONSENT
 * 
 * Photo/video missions MUST explicitly state reuse intent.
 */

function validateUGCConsent(
  mission: Mission,
  rules: MissionActivationRules
): ValidationError[] {
  
  const errors: ValidationError[] = [];
  
  if (!rules.ugcRequiresReuseConsent) {
    return errors; // Rule disabled
  }
  
  // Check if mission involves photo/video upload
  const isUGCMission = 
    mission.businessNeed === 'CONTENT' &&
    (mission.proofMethod === 'SCREENSHOT_AI' || 
     mission.name.toLowerCase().includes('photo') ||
     mission.name.toLowerCase().includes('video') ||
     mission.name.toLowerCase().includes('ugc'));
  
  if (isUGCMission) {
    // Check if business explicitly stated reuse consent
    // (This field would be added to Mission interface: contentReuseConsent?: boolean)
    const hasExplicitConsent = mission.hasOwnProperty('contentReuseConsent');
    
    if (!hasExplicitConsent) {
      errors.push({
        code: MissionActivationError.UGC_MISSING_REUSE_CONSENT,
        message: ACTIVATION_ERROR_MESSAGES[MissionActivationError.UGC_MISSING_REUSE_CONSENT].message,
        field: 'contentReuseConsent',
        suggestedFix: 'Select whether you want to reuse customer content in marketing.',
      });
    }
  }
  
  return errors;
}

/**
 * 5. VALIDATE REWARD AMOUNT
 */

function validateRewardAmount(mission: Mission): ValidationError[] {
  const errors: ValidationError[] = [];
  
  const MIN_REWARD = 25;
  const MAX_REWARD = 500;
  
  if (mission.rewardPoints < MIN_REWARD || mission.rewardPoints > MAX_REWARD) {
    errors.push({
      code: MissionActivationError.INVALID_REWARD_AMOUNT,
      message: ACTIVATION_ERROR_MESSAGES[MissionActivationError.INVALID_REWARD_AMOUNT].message,
      field: 'rewardPoints',
      suggestedFix: `Set reward between ${MIN_REWARD}-${MAX_REWARD} points.`,
    });
  }
  
  return errors;
}

/**
 * 6. VALIDATE COOLDOWNS
 */

function validateCooldowns(mission: Mission): ValidationError[] {
  const errors: ValidationError[] = [];
  
  const MIN_COOLDOWN = 0;
  const MAX_COOLDOWN = 365;
  
  if (mission.cooldownRules) {
    const cooldown = mission.cooldownRules.perUser || 0;
    
    if (cooldown < MIN_COOLDOWN || cooldown > MAX_COOLDOWN) {
      errors.push({
        code: MissionActivationError.INVALID_COOLDOWN,
        message: ACTIVATION_ERROR_MESSAGES[MissionActivationError.INVALID_COOLDOWN].message,
        field: 'cooldownRules.perUser',
        suggestedFix: `Set cooldown between ${MIN_COOLDOWN}-${MAX_COOLDOWN} hours.`,
      });
    }
  }
  
  return errors;
}

/**
 * 7. VALIDATE CAPS
 */

function validateCaps(mission: Mission): ValidationError[] {
  const errors: ValidationError[] = [];
  
  const MIN_CAP = 1;
  const MAX_CAP = 10000;
  
  // Check max participants
  if (mission.maxParticipants !== undefined && mission.maxParticipants !== null) {
    if (mission.maxParticipants < MIN_CAP || mission.maxParticipants > MAX_CAP) {
      errors.push({
        code: MissionActivationError.INVALID_CAP,
        message: ACTIVATION_ERROR_MESSAGES[MissionActivationError.INVALID_CAP].message,
        field: 'maxParticipants',
        suggestedFix: `Set cap between ${MIN_CAP}-${MAX_CAP}, or leave unlimited.`,
      });
    }
  }
  
  return errors;
}

/**
 * 8. VALIDATE NO DUPLICATES (Optional)
 * 
 * Businesses may want to prevent multiple active missions of the same type.
 * This is configurable per business.
 */

function validateNoDuplicates(
  newMission: Mission,
  existingMissions: Mission[]
): ValidationError[] {
  
  const errors: ValidationError[] = [];
  
  // Check if there's already an active mission with the same name/type
  const duplicates = existingMissions.filter(m => 
    m.status === 'ACTIVE' && 
    m.name.toLowerCase() === newMission.name.toLowerCase()
  );
  
  if (duplicates.length > 0) {
    errors.push({
      code: MissionActivationError.DUPLICATE_MISSION_TYPE,
      message: ACTIVATION_ERROR_MESSAGES[MissionActivationError.DUPLICATE_MISSION_TYPE].message,
      field: 'name',
      suggestedFix: 'Choose a different mission type or deactivate the existing one.',
    });
  }
  
  return errors;
}

// ============================================================================
// MISSION DEFAULTS (Applied When Business Creates Mission)
// ============================================================================

export interface MissionDefaults {
  businessNeed: BusinessNeed;
  defaultRewardPoints: number;
  defaultRewardDelay: number;
  defaultCooldown: number;
  defaultMaxParticipants: number | null;      // null = unlimited
  requiresBusinessConfirmation: boolean;
  contentReuseConsent: boolean | null;        // null = not applicable
}

/**
 * GET DEFAULT VALUES FOR MISSION TYPE
 * 
 * When business selects a mission type, these defaults are applied.
 */

export function getMissionDefaults(missionTemplate: string): MissionDefaults {
  
  switch (missionTemplate) {
    // REPUTATION MISSIONS
    
    case 'GOOGLE_REVIEW_TEXT':
      return {
        businessNeed: 'REPUTATION',
        defaultRewardPoints: 150,
        defaultRewardDelay: 7,                  // Required: 7-day delay
        defaultCooldown: 365,                   // Once per year
        defaultMaxParticipants: null,           // Unlimited
        requiresBusinessConfirmation: true,
        contentReuseConsent: null,              // Not applicable
      };
    
    case 'GOOGLE_REVIEW_PHOTOS':
      return {
        businessNeed: 'REPUTATION',
        defaultRewardPoints: 250,
        defaultRewardDelay: 7,                  // Required: 7-day delay
        defaultCooldown: 365,                   // Once per year
        defaultMaxParticipants: null,
        requiresBusinessConfirmation: true,
        contentReuseConsent: true,              // Default: allow reuse
      };
    
    // TRAFFIC MISSIONS
    
    case 'VISIT_CHECKIN':
      return {
        businessNeed: 'TRAFFIC',
        defaultRewardPoints: 50,
        defaultRewardDelay: 0,                  // Instant
        defaultCooldown: 7,                     // Once per week
        defaultMaxParticipants: null,
        requiresBusinessConfirmation: false,
        contentReuseConsent: null,
      };
    
    // CONVERSION MISSIONS
    
    case 'CONSULTATION_REQUEST':
      return {
        businessNeed: 'CONVERSION',
        defaultRewardPoints: 200,
        defaultRewardDelay: 3,                  // 3-day delay (after appointment)
        defaultCooldown: 90,                    // Once per quarter
        defaultMaxParticipants: null,
        requiresBusinessConfirmation: true,
        contentReuseConsent: null,
      };
    
    case 'REDEEM_OFFER':
      return {
        businessNeed: 'CONVERSION',
        defaultRewardPoints: 100,
        defaultRewardDelay: 0,                  // Instant (QR scan)
        defaultCooldown: 30,                    // Once per month
        defaultMaxParticipants: 500,            // Limited offer
        requiresBusinessConfirmation: false,
        contentReuseConsent: null,
      };
    
    case 'FIRST_PURCHASE':
      return {
        businessNeed: 'CONVERSION',
        defaultRewardPoints: 300,
        defaultRewardDelay: 7,                  // 7-day delay (refund protection)
        defaultCooldown: 0,                     // One-time only
        defaultMaxParticipants: null,
        requiresBusinessConfirmation: false,    // Webhook auto-confirms
        contentReuseConsent: null,
      };
    
    case 'REFER_PAYING_CUSTOMER':
      return {
        businessNeed: 'CONVERSION',
        defaultRewardPoints: 500,
        defaultRewardDelay: 14,                 // Required: 14-day delay
        defaultCooldown: 0,                     // Unlimited referrals
        defaultMaxParticipants: null,
        requiresBusinessConfirmation: true,     // Business verifies referral
        contentReuseConsent: null,
      };
    
    // REFERRAL MISSIONS
    
    case 'BRING_A_FRIEND':
      return {
        businessNeed: 'REFERRAL',
        defaultRewardPoints: 200,
        defaultRewardDelay: 3,                  // 3-day delay
        defaultCooldown: 7,                     // Once per week
        defaultMaxParticipants: null,
        requiresBusinessConfirmation: true,
        contentReuseConsent: null,
      };
    
    // CONTENT MISSIONS
    
    case 'UGC_PHOTO_UPLOAD':
      return {
        businessNeed: 'CONTENT',
        defaultRewardPoints: 100,
        defaultRewardDelay: 3,                  // 3-day review period
        defaultCooldown: 30,                    // Once per month
        defaultMaxParticipants: null,
        requiresBusinessConfirmation: true,
        contentReuseConsent: false,             // Default: no reuse (must opt-in)
      };
    
    case 'UGC_VIDEO_UPLOAD':
      return {
        businessNeed: 'CONTENT',
        defaultRewardPoints: 200,
        defaultRewardDelay: 7,                  // 7-day review period
        defaultCooldown: 30,                    // Once per month
        defaultMaxParticipants: null,
        requiresBusinessConfirmation: true,
        contentReuseConsent: false,             // Default: no reuse (must opt-in)
      };
    
    case 'STORY_POST_TAG':
      return {
        businessNeed: 'CONTENT',
        defaultRewardPoints: 75,
        defaultRewardDelay: 7,                  // 7-day delay (verify not deleted)
        defaultCooldown: 7,                     // Once per week
        defaultMaxParticipants: null,
        requiresBusinessConfirmation: true,
        contentReuseConsent: false,             // Story is temporary
      };
    
    case 'FEED_REEL_POST_TAG':
      return {
        businessNeed: 'CONTENT',
        defaultRewardPoints: 200,
        defaultRewardDelay: 14,                 // 14-day delay (high value)
        defaultCooldown: 30,                    // Once per month
        defaultMaxParticipants: null,
        requiresBusinessConfirmation: true,
        contentReuseConsent: true,              // Default: allow reuse (permanent post)
      };
    
    // LOYALTY MISSIONS
    
    case 'REPEAT_PURCHASE_VISIT':
      return {
        businessNeed: 'LOYALTY',
        defaultRewardPoints: 400,
        defaultRewardDelay: 0,                  // Instant (reward loyalty immediately)
        defaultCooldown: 30,                    // Once per month
        defaultMaxParticipants: null,
        requiresBusinessConfirmation: false,
        contentReuseConsent: null,
      };
    
    case 'INSTAGRAM_FOLLOW':
      return {
        businessNeed: 'CONTENT',
        defaultRewardPoints: 50,
        defaultRewardDelay: 3,                  // 3-day delay to prevent unfollow
        defaultCooldown: 0,                     // One-time per business
        defaultMaxParticipants: null,
        requiresBusinessConfirmation: false,
        contentReuseConsent: null,
      };
    
    // DEFAULT (Unknown mission type)
    default:
      return {
        businessNeed: 'TRAFFIC',
        defaultRewardPoints: 50,
        defaultRewardDelay: 0,
        defaultCooldown: 30,
        defaultMaxParticipants: null,
        requiresBusinessConfirmation: true,
        contentReuseConsent: null,
      };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * AUTO-FIX MISSION CONFIGURATION
 * 
 * Attempts to automatically fix common validation errors.
 */

export function autoFixMissionConfiguration(
  mission: Mission,
  rules: MissionActivationRules = DEFAULT_ACTIVATION_RULES
): Mission {
  
  const fixed = { ...mission };
  
  // Fix Google Review delay
  if (mission.name.toLowerCase().includes('google review') || 
      mission.name.toLowerCase().includes('review')) {
    if (fixed.rewardLockDelayDays < rules.defaultRewardDelays.googleReview) {
      fixed.rewardLockDelayDays = rules.defaultRewardDelays.googleReview;
    }
  }
  
  // Fix Referral delay
  if (mission.businessNeed === 'REFERRAL') {
    if (fixed.rewardLockDelayDays < rules.defaultRewardDelays.referral) {
      fixed.rewardLockDelayDays = rules.defaultRewardDelays.referral;
    }
  }
  
  // Fix Purchase delay
  if (mission.businessNeed === 'CONVERSION' && 
      mission.name.toLowerCase().includes('purchase')) {
    if (fixed.rewardLockDelayDays < rules.defaultRewardDelays.purchase) {
      fixed.rewardLockDelayDays = rules.defaultRewardDelays.purchase;
    }
  }
  
  // Clamp reward amount
  fixed.rewardPoints = Math.max(25, Math.min(500, fixed.rewardPoints));
  
  // Clamp cooldown
  if (fixed.cooldownRules?.perUser) {
    fixed.cooldownRules.perUser = Math.max(0, Math.min(365 * 24, fixed.cooldownRules.perUser)); // Max 1 year in hours
  }
  
  // Clamp cap
  if (fixed.maxParticipants) {
    fixed.maxParticipants = Math.max(1, Math.min(10000, fixed.maxParticipants));
  }
  
  return fixed;
}

/**
 * GET MISSION ACTIVATION SUMMARY
 * 
 * Returns a summary of the business's mission portfolio for display.
 */

export function getMissionActivationSummary(missions: Mission[]): {
  totalActive: number;
  conversionMissions: number;
  socialMissions: number;
  totalConversionRewards: number;
  totalSocialRewards: number;
  socialToConversionRatio: number;
  isValid: boolean;
  warnings: string[];
} {
  
  const activeMissions = missions.filter(m => m.status === 'ACTIVE');
  
  const conversionMissions = activeMissions.filter(m => m.businessNeed === 'CONVERSION');
  const socialMissions = activeMissions.filter(m => m.businessNeed === 'CONTENT');
  
  const totalConversionRewards = conversionMissions.reduce((sum, m) => sum + m.rewardPoints, 0);
  const totalSocialRewards = socialMissions.reduce((sum, m) => sum + m.rewardPoints, 0);
  
  const ratio = totalConversionRewards > 0 ? totalSocialRewards / totalConversionRewards : 0;
  
  const warnings: string[] = [];
  
  if (conversionMissions.length === 0) {
    warnings.push('No conversion missions active. Add at least one to activate social missions.');
  }
  
  if (ratio > DEFAULT_ACTIVATION_RULES.maxSocialToConversionRatio) {
    warnings.push(`Social rewards (${totalSocialRewards} pts) exceed limit. Should be ≤${Math.floor(totalConversionRewards * 0.5)} pts.`);
  }
  
  return {
    totalActive: activeMissions.length,
    conversionMissions: conversionMissions.length,
    socialMissions: socialMissions.length,
    totalConversionRewards,
    totalSocialRewards,
    socialToConversionRatio: ratio,
    isValid: warnings.length === 0,
    warnings,
  };
}

export const MISSION_ACTIVATION_RULES_VERSION = '1.0.0';
