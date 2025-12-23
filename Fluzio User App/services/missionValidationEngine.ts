/**
 * FLUZIO MISSION VALIDATION ENGINE
 * 
 * Centralized validation logic that enforces all mission constraints.
 * Validates mission activation (business creating mission) and mission completion (user participating).
 * 
 * VALIDATION LAYERS:
 * 1. Business Type Compatibility - Mission available for this business type?
 * 2. User Level Permissions - User level high enough?
 * 3. Trust Score Requirements - User trust score sufficient?
 * 4. Participant Caps - Mission not full?
 * 5. Proof Method Constraints - Proof method valid for business type?
 * 6. Cooldown Enforcement - User not in cooldown period?
 * 
 * Returns user-friendly rejection reasons for frontend display.
 */

import { getUserLevelConfig, UserLevel, calculateUserLevel, classifyMissionType } from './userLevelMissionLimits';
import { getProofMethodConfig, isProofMethodAllowed, getForbiddenReason } from './missionProofMethodMatrix';
import { getMissionCapConfig, validateUserCanParticipate, hasMissionReachedCap } from './missionParticipationLimits';
import { BusinessType } from './missionAvailabilityByBusinessType';
import type { ProofMethod } from '../types/missionSystem';

// ============================================================================
// VALIDATION RESULT TYPES
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings?: ValidationWarning[];
}

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
  requiredValue?: any;
  currentValue?: any;
}

export interface ValidationWarning {
  code: string;
  message: string;
}

// ============================================================================
// MISSION ACTIVATION VALIDATION (Business Side)
// ============================================================================

/**
 * VALIDATE MISSION ACTIVATION
 * 
 * Called when business attempts to create/activate a mission.
 * Ensures mission is compatible with business type and configuration.
 */
export function validateMissionActivation(
  missionId: string,
  businessType: BusinessType,
  businessLevel: number,
  proofMethod: ProofMethod,
  rewardPoints: number,
  maxParticipants?: number
): ValidationResult {
  
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  // =========================================================================
  // STEP 1: VALIDATE BUSINESS TYPE COMPATIBILITY
  // =========================================================================
  
  const proofConfig = getProofMethodConfig(missionId, businessType);
  
  if (!proofConfig) {
    errors.push({
      code: 'MISSION_NOT_AVAILABLE',
      message: `This mission is not available for ${businessType.toLowerCase()} businesses. Please choose a different mission type.`,
      field: 'missionId'
    });
    
    // Early return - no point checking other validations
    return { isValid: false, errors, warnings };
  }
  
  // =========================================================================
  // STEP 2: VALIDATE PROOF METHOD
  // =========================================================================
  
  const isAllowed = isProofMethodAllowed(missionId, businessType, proofMethod);
  
  if (!isAllowed) {
    const reason = getForbiddenReason(missionId, businessType, proofMethod);
    
    errors.push({
      code: 'INVALID_PROOF_METHOD',
      message: reason || `${proofMethod} is not allowed for this mission and business type.`,
      field: 'proofMethod',
      currentValue: proofMethod
    });
    
    // Suggest valid proof methods
    const validMethods = [
      proofConfig.primaryProofMethod,
      proofConfig.fallbackProofMethod
    ].filter(Boolean);
    
    warnings.push({
      code: 'SUGGESTED_PROOF_METHODS',
      message: `Recommended proof methods: ${validMethods.join(', ')}`
    });
  }
  
  // =========================================================================
  // STEP 3: VALIDATE PARTICIPANT CAPS
  // =========================================================================
  
  const capConfig = getMissionCapConfig(missionId);
  
  if (maxParticipants) {
    // Business specified custom cap - validate it
    if (capConfig.maxTotalParticipants !== null && maxParticipants > capConfig.maxTotalParticipants) {
      warnings.push({
        code: 'PARTICIPANT_CAP_TOO_HIGH',
        message: `You set max participants to ${maxParticipants}, but we recommend ${capConfig.maxTotalParticipants} for this mission type to ensure quality.`
      });
    }
  }
  
  // =========================================================================
  // STEP 4: VALIDATE REWARD AMOUNT
  // =========================================================================
  
  if (rewardPoints < 25) {
    errors.push({
      code: 'REWARD_TOO_LOW',
      message: 'Reward must be at least 25 points to incentivize participation.',
      field: 'rewardPoints',
      requiredValue: 25,
      currentValue: rewardPoints
    });
  }
  
  if (rewardPoints > 500) {
    errors.push({
      code: 'REWARD_TOO_HIGH',
      message: 'Reward cannot exceed 500 points. For higher rewards, split into multiple missions.',
      field: 'rewardPoints',
      requiredValue: 500,
      currentValue: rewardPoints
    });
  }
  
  // =========================================================================
  // STEP 5: VALIDATE BUSINESS LEVEL (if applicable)
  // =========================================================================
  
  // High-value missions require Level 2+ businesses
  const highValueMissions = ['FIRST_PURCHASE', 'REFER_PAYING_CUSTOMER', 'CONSULTATION_REQUEST'];
  if (highValueMissions.includes(missionId) && businessLevel < 2) {
    warnings.push({
      code: 'UPGRADE_RECOMMENDED',
      message: 'High-value missions perform better for Level 2+ businesses with established reputation.'
    });
  }
  
  // =========================================================================
  // STEP 6: BUDGET WARNING
  // =========================================================================
  
  const estimatedCost = (maxParticipants || capConfig.maxTotalParticipants || 1000) * rewardPoints;
  
  if (estimatedCost > 50000) {
    warnings.push({
      code: 'HIGH_BUDGET',
      message: `This mission will cost approximately ${estimatedCost.toLocaleString()} points. Consider lowering reward or participant cap.`
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// ============================================================================
// MISSION PARTICIPATION VALIDATION (User Side)
// ============================================================================

/**
 * VALIDATE MISSION PARTICIPATION
 * 
 * Called when user attempts to start/complete a mission.
 * Comprehensive validation of all user constraints.
 */
export function validateMissionParticipation(
  missionId: string,
  userId: string,
  userTotalPoints: number,
  userTrustScore: number,
  businessType: BusinessType,
  proofMethod: ProofMethod,
  userCompletionCount: number,
  lastCompletionDate: Date | null,
  currentTotalParticipants: number,
  todayParticipants: number
): ValidationResult {
  
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  // =========================================================================
  // STEP 1: CALCULATE USER LEVEL
  // =========================================================================
  
  const userLevel = calculateUserLevel(userTotalPoints);
  const levelConfig = getUserLevelConfig(userLevel);
  const missionType = classifyMissionType(missionId);
  
  // =========================================================================
  // STEP 2: VALIDATE TRUST SCORE
  // =========================================================================
  
  if (userTrustScore < levelConfig.minimumTrustScoreRequired) {
    errors.push({
      code: 'TRUST_SCORE_TOO_LOW',
      message: `Your trust score is ${userTrustScore}. You need ${levelConfig.minimumTrustScoreRequired}+ to participate in this mission. Complete more missions successfully to increase your trust score.`,
      field: 'trustScore',
      requiredValue: levelConfig.minimumTrustScoreRequired,
      currentValue: userTrustScore
    });
  }
  
  // =========================================================================
  // STEP 3: VALIDATE USER LEVEL PERMISSIONS
  // =========================================================================
  
  switch (missionType) {
    case 'REFERRAL':
      if (!levelConfig.canAccessReferralMissions) {
        errors.push({
          code: 'LEVEL_TOO_LOW_REFERRAL',
          message: `Referral missions unlock at Contributor level (Level 3). You are currently ${levelConfig.levelName}. Earn ${500 - userTotalPoints} more points to unlock.`,
          field: 'userLevel',
          requiredValue: UserLevel.CONTRIBUTOR,
          currentValue: userLevel
        });
      }
      break;
      
    case 'UGC':
      if (!levelConfig.canAccessUgcMissions) {
        errors.push({
          code: 'LEVEL_TOO_LOW_UGC',
          message: `UGC missions unlock at Explorer level (Level 2). You are currently ${levelConfig.levelName}. Earn ${100 - userTotalPoints} more points to unlock.`,
          field: 'userLevel',
          requiredValue: UserLevel.EXPLORER,
          currentValue: userLevel
        });
      }
      break;
      
    case 'REVIEW':
      if (!levelConfig.canAccessReviewMissions) {
        errors.push({
          code: 'LEVEL_TOO_LOW_REVIEW',
          message: `Review missions unlock at Explorer level (Level 2). You are currently ${levelConfig.levelName}. Earn ${100 - userTotalPoints} more points to unlock.`,
          field: 'userLevel',
          requiredValue: UserLevel.EXPLORER,
          currentValue: userLevel
        });
      }
      break;
      
    case 'HIGH_VALUE':
      if (!levelConfig.canAccessHighValueMissions && levelConfig.requiresManualApproval) {
        warnings.push({
          code: 'REQUIRES_MANUAL_APPROVAL',
          message: 'High-value missions require business approval for your level. Your submission will be reviewed within 24-48 hours.'
        });
      }
      break;
  }
  
  // =========================================================================
  // STEP 4: VALIDATE BUSINESS TYPE COMPATIBILITY
  // =========================================================================
  
  const proofConfig = getProofMethodConfig(missionId, businessType);
  
  if (!proofConfig) {
    errors.push({
      code: 'MISSION_NOT_AVAILABLE',
      message: `This mission is not available for ${businessType.toLowerCase()} businesses.`,
      field: 'businessType'
    });
    
    // Early return
    return { isValid: false, errors, warnings };
  }
  
  // =========================================================================
  // STEP 5: VALIDATE PROOF METHOD
  // =========================================================================
  
  if (!isProofMethodAllowed(missionId, businessType, proofMethod)) {
    const reason = getForbiddenReason(missionId, businessType, proofMethod);
    
    errors.push({
      code: 'INVALID_PROOF_METHOD',
      message: reason || `This proof method is not accepted for this mission.`,
      field: 'proofMethod'
    });
  }
  
  // =========================================================================
  // STEP 6: VALIDATE PARTICIPANT CAPS (Global & Daily)
  // =========================================================================
  
  const capStatus = hasMissionReachedCap(missionId, currentTotalParticipants, todayParticipants);
  
  if (!capStatus.canAcceptMore) {
    errors.push({
      code: 'MISSION_FULL',
      message: capStatus.reason || 'This mission has reached its participant limit.',
      field: 'participants'
    });
  } else if (capStatus.spaceRemaining !== null && capStatus.spaceRemaining <= 10) {
    warnings.push({
      code: 'ALMOST_FULL',
      message: `Only ${capStatus.spaceRemaining} spots remaining! Complete this mission soon before it fills up.`
    });
  }
  
  // =========================================================================
  // STEP 7: VALIDATE PER-USER LIMITS & COOLDOWN
  // =========================================================================
  
  const userEligibility = validateUserCanParticipate(missionId, userCompletionCount, lastCompletionDate);
  
  if (!userEligibility.canParticipate) {
    errors.push({
      code: 'USER_LIMIT_REACHED',
      message: userEligibility.reason || 'You cannot participate in this mission right now.',
      field: 'userParticipation'
    });
    
    if (userEligibility.cooldownEnds) {
      errors[errors.length - 1].requiredValue = userEligibility.cooldownEnds.toISOString();
    }
  }
  
  // =========================================================================
  // STEP 8: VALIDATE DAILY/WEEKLY/MONTHLY USER LIMITS
  // =========================================================================
  
  // This would require database queries to count user's recent missions
  // Pseudo-code for illustration:
  /*
  const today = getStartOfDay();
  const missionsToday = await countUserMissions(userId, today);
  
  if (missionsToday >= levelConfig.maxActiveMissionsPerDay) {
    errors.push({
      code: 'DAILY_LIMIT_REACHED',
      message: `You have completed ${missionsToday} missions today. Your daily limit is ${levelConfig.maxActiveMissionsPerDay}. Try again tomorrow!`,
      field: 'dailyLimit',
      requiredValue: levelConfig.maxActiveMissionsPerDay,
      currentValue: missionsToday
    });
  }
  
  if (missionType === 'HIGH_VALUE') {
    const thisWeek = getStartOfWeek();
    const highValueThisWeek = await countUserMissions(userId, thisWeek, 'HIGH_VALUE');
    
    if (highValueThisWeek >= levelConfig.maxHighValueMissionsPerWeek) {
      errors.push({
        code: 'WEEKLY_HIGH_VALUE_LIMIT',
        message: `You have completed ${highValueThisWeek} high-value missions this week. Your weekly limit is ${levelConfig.maxHighValueMissionsPerWeek}. Resets Monday.`,
        field: 'weeklyLimit'
      });
    }
  }
  */
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// ============================================================================
// COMBINED VALIDATION FLOW
// ============================================================================

/**
 * FULL MISSION VALIDATION
 * 
 * Validates both business configuration and user eligibility.
 * Use this for comprehensive mission health check.
 */
export function validateMissionCompletely(
  // Mission config
  missionId: string,
  businessType: BusinessType,
  businessLevel: number,
  proofMethod: ProofMethod,
  rewardPoints: number,
  maxParticipants: number | undefined,
  
  // User details
  userId: string,
  userTotalPoints: number,
  userTrustScore: number,
  userCompletionCount: number,
  lastCompletionDate: Date | null,
  
  // Current state
  currentTotalParticipants: number,
  todayParticipants: number
): ValidationResult {
  
  // Validate business side
  const businessValidation = validateMissionActivation(
    missionId,
    businessType,
    businessLevel,
    proofMethod,
    rewardPoints,
    maxParticipants
  );
  
  // If business validation fails, don't check user
  if (!businessValidation.isValid) {
    return businessValidation;
  }
  
  // Validate user side
  const userValidation = validateMissionParticipation(
    missionId,
    userId,
    userTotalPoints,
    userTrustScore,
    businessType,
    proofMethod,
    userCompletionCount,
    lastCompletionDate,
    currentTotalParticipants,
    todayParticipants
  );
  
  // Combine results
  return {
    isValid: userValidation.isValid,
    errors: userValidation.errors,
    warnings: [...(businessValidation.warnings || []), ...(userValidation.warnings || [])]
  };
}

// ============================================================================
// QUICK VALIDATION HELPERS
// ============================================================================

/**
 * Quick check if user can start mission
 */
export function canUserStartMission(
  missionId: string,
  userLevel: UserLevel,
  userTrustScore: number
): { canStart: boolean; reason?: string } {
  
  const levelConfig = getUserLevelConfig(userLevel);
  const missionType = classifyMissionType(missionId);
  
  // Check trust score
  if (userTrustScore < levelConfig.minimumTrustScoreRequired) {
    return {
      canStart: false,
      reason: `Trust score too low. Need ${levelConfig.minimumTrustScoreRequired}, have ${userTrustScore}.`
    };
  }
  
  // Check mission type access
  switch (missionType) {
    case 'REFERRAL':
      if (!levelConfig.canAccessReferralMissions) {
        return { canStart: false, reason: 'Referral missions unlock at Contributor level.' };
      }
      break;
    case 'UGC':
      if (!levelConfig.canAccessUgcMissions) {
        return { canStart: false, reason: 'UGC missions unlock at Explorer level.' };
      }
      break;
    case 'REVIEW':
      if (!levelConfig.canAccessReviewMissions) {
        return { canStart: false, reason: 'Review missions unlock at Explorer level.' };
      }
      break;
  }
  
  return { canStart: true };
}

/**
 * Quick check if business can create mission
 */
export function canBusinessCreateMission(
  missionId: string,
  businessType: BusinessType,
  proofMethod: ProofMethod
): { canCreate: boolean; reason?: string } {
  
  const proofConfig = getProofMethodConfig(missionId, businessType);
  
  if (!proofConfig) {
    return {
      canCreate: false,
      reason: `This mission type is not available for ${businessType.toLowerCase()} businesses.`
    };
  }
  
  if (!isProofMethodAllowed(missionId, businessType, proofMethod)) {
    const reason = getForbiddenReason(missionId, businessType, proofMethod);
    return {
      canCreate: false,
      reason: reason || 'This proof method is not allowed for this mission.'
    };
  }
  
  return { canCreate: true };
}

// ============================================================================
// VALIDATION EXAMPLES FOR FRONTEND
// ============================================================================

/**
 * Example rejection messages that frontend would display to users
 */
export const VALIDATION_ERROR_EXAMPLES = {
  
  // User level too low
  LEVEL_TOO_LOW_REFERRAL: {
    title: 'Level Requirement Not Met',
    message: 'Referral missions unlock at Contributor level (Level 3). You are currently Novice. Earn 500 more points to unlock.',
    icon: '🔒',
    actionText: 'View Other Missions',
    actionColor: 'blue'
  },
  
  // Trust score too low
  TRUST_SCORE_TOO_LOW: {
    title: 'Trust Score Too Low',
    message: 'Your trust score is 25. You need 50+ to participate in this mission. Complete more missions successfully to increase your trust score.',
    icon: '⚠️',
    actionText: 'Learn About Trust Score',
    actionColor: 'yellow'
  },
  
  // Mission full
  MISSION_FULL: {
    title: 'Mission Full',
    message: 'This mission has reached its participant limit. Check back later or explore similar missions nearby.',
    icon: '🚫',
    actionText: 'Find Similar Missions',
    actionColor: 'gray'
  },
  
  // User in cooldown
  USER_LIMIT_REACHED: {
    title: 'Cooldown Active',
    message: 'You must wait 7 more days before participating again. You last completed this mission on Jan 15.',
    icon: '⏰',
    actionText: 'Set Reminder',
    actionColor: 'blue'
  },
  
  // Daily limit reached
  DAILY_LIMIT_REACHED: {
    title: 'Daily Limit Reached',
    message: 'You have completed 5 missions today. Your daily limit is 5. Come back tomorrow for more!',
    icon: '📅',
    actionText: 'View Completed Missions',
    actionColor: 'green'
  },
  
  // Business type incompatible
  MISSION_NOT_AVAILABLE: {
    title: 'Mission Not Available',
    message: 'This mission is only available for physical businesses. It requires in-person check-in.',
    icon: '🏪',
    actionText: 'Browse Available Missions',
    actionColor: 'blue'
  },
  
  // Invalid proof method
  INVALID_PROOF_METHOD: {
    title: 'Invalid Proof Method',
    message: 'Screenshots cannot be used for this mission. QR code scan is required to prevent fraud.',
    icon: '❌',
    actionText: 'Learn About Proof Methods',
    actionColor: 'red'
  },
  
  // High-value needs approval
  REQUIRES_MANUAL_APPROVAL: {
    title: 'Manual Review Required',
    message: 'High-value missions require business approval for your level. Your submission will be reviewed within 24-48 hours.',
    icon: 'ℹ️',
    actionText: 'Understood',
    actionColor: 'blue'
  }
};

// ============================================================================
// VALIDATION FLOW DIAGRAM (as code comments)
// ============================================================================

/*

MISSION VALIDATION FLOW
========================

1. USER INITIATES MISSION
   ↓
2. VALIDATE BUSINESS CONFIGURATION
   │
   ├─ Is mission available for business type?
   │  NO → Reject: "Mission not available"
   │  YES → Continue
   │
   ├─ Is proof method valid for business type?
   │  NO → Reject: "Invalid proof method"
   │  YES → Continue
   │
   └─ Is reward amount valid (25-500)?
      NO → Reject: "Invalid reward amount"
      YES → Continue to user validation
      
3. VALIDATE USER ELIGIBILITY
   │
   ├─ Calculate user level from total points
   │
   ├─ Is trust score sufficient?
   │  NO → Reject: "Trust score too low"
   │  YES → Continue
   │
   ├─ Does user level allow mission type?
   │  ├─ REFERRAL → Requires Contributor (L3+)
   │  ├─ REVIEW → Requires Explorer (L2+)
   │  ├─ UGC → Requires Explorer (L2+)
   │  └─ HIGH_VALUE → Requires Trusted (L4+) OR manual approval
   │  NO → Reject: "Level requirement not met"
   │  YES → Continue
   │
   ├─ Has user exceeded per-user cap?
   │  YES → Reject: "User limit reached"
   │  NO → Continue
   │
   ├─ Is user in cooldown period?
   │  YES → Reject: "Cooldown active"
   │  NO → Continue
   │
   └─ Has user exceeded daily/weekly limits?
      YES → Reject: "Daily/weekly limit reached"
      NO → Continue to capacity check

4. VALIDATE MISSION CAPACITY
   │
   ├─ Has mission reached total participant cap?
   │  YES → Reject: "Mission full"
   │  NO → Continue
   │
   └─ Has mission reached daily participant cap?
      YES → Reject: "Daily limit reached, try tomorrow"
      NO → APPROVE PARTICIPATION

5. RETURN VALIDATION RESULT
   │
   ├─ isValid: boolean
   ├─ errors: ValidationError[]
   └─ warnings: ValidationWarning[]

*/

export const MISSION_VALIDATION_ENGINE_VERSION = '1.0.0';
