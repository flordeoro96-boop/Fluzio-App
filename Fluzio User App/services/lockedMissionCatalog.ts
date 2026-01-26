/**
 * LOCKED MISSION CATALOG V1
 * 
 * This is the official, locked set of 13 missions for Beevvy.
 * No additional missions should be added without approval.
 * Each mission is designed to create measurable business value.
 * 
 * NOTE: All missions are now internal to Beevvy app - no external social media required.
 */

import {
  StandardMissionTemplate,
  BusinessNeed,
  ProofMethod,
  AntiCheatRule,
  CooldownRules
} from '../types/missionSystem';

// ============================================================================
// MISSION 1: WRITE REVIEW (INTERNAL)
// ============================================================================

export const WRITE_REVIEW_APP: StandardMissionTemplate = {
  id: 'WRITE_REVIEW_APP',
  name: 'Write a Review',
  description: 'Share your experience and rate this business after checking in',
  businessNeed: 'REPUTATION',
  allowedBusinessTypes: ['PHYSICAL', 'ONLINE', 'HYBRID'],
  proofMethod: 'FORM_SUBMISSION',
  defaultReward: 100,
  defaultAntiCheatRules: [
    {
      type: 'RATE_LIMIT',
      maxSubmissions: 1,
      windowHours: 8760, // Once per year per business
      scope: 'PER_BUSINESS'
    },
    {
      type: 'UNIQUE_DEVICE',
      allowMultipleAccounts: false
    },
    {
      type: 'MIN_ENGAGEMENT',
      minTimeSeconds: 60, // Must spend 1 minute writing
      minActions: 2 // Rating + review text
    }
  ],
  defaultCooldown: {
    perUser: 8760, // Once per year per business
    perBusiness: 0
  },
  rewardLockDelayDays: null, // Instant reward after check-in
  requiresBusinessConfirmation: false, // Auto-approved after check-in verification
  minSubscriptionTier: 'STARTER'
};

/**
 * WHY THIS CREATES BUSINESS VALUE:
 * - Authentic customer feedback helps businesses improve
 * - Reviews build trust and social proof on business profiles
 * - Star ratings displayed prominently on business pages
 * - AI analysis identifies common themes and improvement areas
 * - Check-in verification ensures genuine customer experiences
 */

// ============================================================================
// MISSION 2: REVIEW WITH PHOTO (INTERNAL)
// ============================================================================

export const REVIEW_WITH_PHOTO_APP: StandardMissionTemplate = {
  id: 'REVIEW_WITH_PHOTO_APP',
  name: 'Review with Photo',
  description: 'Write a review and upload a photo of your experience after checking in',
  businessNeed: 'REPUTATION',
  allowedBusinessTypes: ['PHYSICAL', 'ONLINE', 'HYBRID'],
  proofMethod: 'SCREENSHOT_AI',
  defaultReward: 150,
  defaultAntiCheatRules: [
    {
      type: 'RATE_LIMIT',
      maxSubmissions: 1,
      windowHours: 8760, // Once per year per business
      scope: 'PER_BUSINESS'
    },
    {
      type: 'UNIQUE_DEVICE',
      allowMultipleAccounts: false
    },
    {
      type: 'MIN_ENGAGEMENT',
      minTimeSeconds: 90, // Must spend 90 seconds
      minActions: 3 // Rating + review text + photo upload
    }
  ],
  defaultCooldown: {
    perUser: 8760, // Once per year per business
    perBusiness: 0
  },
  rewardLockDelayDays: null, // Instant reward after check-in verification
  requiresBusinessConfirmation: false, // Auto-approved with check-in
  minSubscriptionTier: 'SILVER'
};

/**
 * WHY THIS CREATES BUSINESS VALUE:
 * - Photo reviews are 3x more engaging than text-only
 * - Visual proof builds authentic trust with potential customers
 * - Photos showcase real customer experiences and atmosphere
 * - AI analyzes photos for quality insights (cleanliness, ambiance, etc.)
 * - Rich media content increases profile attractiveness
 */

// ============================================================================
// MISSION 3: VISIT & CHECK-IN (PHYSICAL)
// ============================================================================

export const VISIT_CHECKIN: StandardMissionTemplate = {
  id: 'VISIT_CHECKIN',
  name: 'Visit & Check-In',
  description: 'Visit our location and check in via QR code or GPS',
  businessNeed: 'TRAFFIC',
  allowedBusinessTypes: ['PHYSICAL', 'HYBRID'],
  proofMethod: 'QR_SCAN', // Primary: QR, fallback: GPS
  defaultReward: 50,
  defaultAntiCheatRules: [
    {
      type: 'RATE_LIMIT',
      maxSubmissions: 1,
      windowHours: 24, // Once per day
      scope: 'PER_USER'
    },
    {
      type: 'LOCATION_LOCK',
      radiusMeters: 100,
      requireGPS: true,
      allowManualOverride: false
    },
    {
      type: 'UNIQUE_DEVICE',
      allowMultipleAccounts: false
    }
  ],
  defaultCooldown: {
    perUser: 24, // Once per day
    perBusiness: 0
  },
  rewardLockDelayDays: null, // Instant reward
  requiresBusinessConfirmation: false
};

/**
 * WHY THIS CREATES BUSINESS VALUE:
 * - Drives foot traffic to physical locations
 * - Captures data on visit frequency and timing
 * - Creates habit loop for repeat visits
 * - Low friction = high conversion rate
 */

// ============================================================================
// MISSION 4: CONSULTATION / APPOINTMENT REQUEST
// ============================================================================

export const CONSULTATION_REQUEST: StandardMissionTemplate = {
  id: 'CONSULTATION_REQUEST',
  name: 'Book a Consultation',
  description: 'Request a consultation or schedule an appointment',
  businessNeed: 'CONVERSION',
  allowedBusinessTypes: ['PHYSICAL', 'ONLINE', 'HYBRID'],
  proofMethod: 'FORM_SUBMISSION',
  defaultReward: 200,
  defaultAntiCheatRules: [
    {
      type: 'RATE_LIMIT',
      maxSubmissions: 5,
      windowHours: 720, // 5 per month
      scope: 'PER_USER'
    },
    {
      type: 'MIN_ENGAGEMENT',
      minTimeSeconds: 60,
      minActions: 1,
      requiredActions: ['submit_contact_info', 'select_service']
    }
  ],
  defaultCooldown: {
    perUser: 168, // Once per week
    perBusiness: 0
  },
  rewardLockDelayDays: 3, // Ensure they show up
  requiresBusinessConfirmation: true,
  minSubscriptionTier: 'SILVER'
};

/**
 * WHY THIS CREATES BUSINESS VALUE:
 * - Generates qualified leads
 * - Captures contact information for follow-up
 * - High-intent customers (consultation = purchase consideration)
 * - Average consultation converts at 20-40%
 */

// ============================================================================
// MISSION 5: REDEEM AN OFFER (IN-STORE OR ONLINE)
// ============================================================================

export const REDEEM_OFFER: StandardMissionTemplate = {
  id: 'REDEEM_OFFER',
  name: 'Redeem Special Offer',
  description: 'Redeem your exclusive offer in-store or online',
  businessNeed: 'CONVERSION',
  allowedBusinessTypes: ['PHYSICAL', 'ONLINE', 'HYBRID'],
  proofMethod: 'QR_SCAN', // In-store QR or online webhook
  defaultReward: 100,
  defaultAntiCheatRules: [
    {
      type: 'RATE_LIMIT',
      maxSubmissions: 10,
      windowHours: 720, // 10 per month
      scope: 'PER_USER'
    },
    {
      type: 'UNIQUE_DEVICE',
      allowMultipleAccounts: false
    },
    {
      type: 'TIME_WINDOW',
      allowedDays: [0, 1, 2, 3, 4, 5, 6],
      startTime: '00:00',
      endTime: '23:59',
      timezone: 'America/New_York'
    }
  ],
  defaultCooldown: {
    perUser: 72, // Once per 3 days
    perBusiness: 0
  },
  rewardLockDelayDays: null, // Instant to encourage immediate redemption
  requiresBusinessConfirmation: false
};

/**
 * WHY THIS CREATES BUSINESS VALUE:
 * - Drives immediate sales with promotional offers
 * - Tracks offer redemption rates
 * - Incentivizes first-time purchases
 * - Creates urgency and FOMO
 */

// ============================================================================
// MISSION 6: FIRST PURCHASE
// ============================================================================

export const FIRST_PURCHASE: StandardMissionTemplate = {
  id: 'FIRST_PURCHASE',
  name: 'Make Your First Purchase',
  description: 'Complete your first purchase and earn bonus points',
  businessNeed: 'CONVERSION',
  allowedBusinessTypes: ['PHYSICAL', 'ONLINE', 'HYBRID'],
  proofMethod: 'WEBHOOK', // Online: webhook, Physical: receipt upload
  defaultReward: 300,
  defaultAntiCheatRules: [
    {
      type: 'RATE_LIMIT',
      maxSubmissions: 1,
      windowHours: 87600, // Once ever (10 years)
      scope: 'PER_BUSINESS'
    },
    {
      type: 'PURCHASE_VERIFY',
      minAmount: 10,
      requireReceipt: true,
      requireOrderNumber: true
    },
    {
      type: 'UNIQUE_DEVICE',
      allowMultipleAccounts: false
    }
  ],
  defaultCooldown: {
    perUser: 87600, // Once per business lifetime
    perBusiness: 87600
  },
  rewardLockDelayDays: 7, // Prevent refund fraud
  requiresBusinessConfirmation: true,
  minSubscriptionTier: 'GOLD'
};

/**
 * WHY THIS CREATES BUSINESS VALUE:
 * - Converts prospects into paying customers
 * - Overcomes first purchase hesitation
 * - Customer acquisition is 5x more expensive than retention
 * - First purchase = foundation for customer lifetime value
 */

// ============================================================================
// MISSION 7: REFER A PAYING CUSTOMER
// ============================================================================

export const REFER_PAYING_CUSTOMER: StandardMissionTemplate = {
  id: 'REFER_PAYING_CUSTOMER',
  name: 'Refer a Paying Customer',
  description: 'Refer someone who makes a purchase',
  businessNeed: 'REFERRAL',
  allowedBusinessTypes: ['PHYSICAL', 'ONLINE', 'HYBRID'],
  proofMethod: 'REFERRAL_LINK',
  defaultReward: 500,
  defaultAntiCheatRules: [
    {
      type: 'RATE_LIMIT',
      maxSubmissions: 50,
      windowHours: 720, // 50 per month
      scope: 'PER_USER'
    },
    {
      type: 'UNIQUE_DEVICE',
      allowMultipleAccounts: false // Prevent self-referral
    },
    {
      type: 'PURCHASE_VERIFY',
      minAmount: 25,
      requireReceipt: false,
      requireOrderNumber: true
    }
  ],
  defaultCooldown: {
    perUser: 0, // No cooldown on referrals
    perBusiness: 0
  },
  rewardLockDelayDays: 14, // Ensure purchase doesn't get refunded
  requiresBusinessConfirmation: false, // Webhook auto-verifies
  minSubscriptionTier: 'GOLD'
};

/**
 * WHY THIS CREATES BUSINESS VALUE:
 * - Referred customers have 37% higher retention rates
 * - Referrals cost 50% less than traditional acquisition
 * - Word-of-mouth is the #1 trust signal
 * - Creates viral growth loop
 */

// ============================================================================
// MISSION 8: BRING A FRIEND (PHYSICAL)
// ============================================================================

export const BRING_A_FRIEND: StandardMissionTemplate = {
  id: 'BRING_A_FRIEND',
  name: 'Bring a Friend',
  description: 'Visit with a friend who has never been here before',
  businessNeed: 'REFERRAL',
  allowedBusinessTypes: ['PHYSICAL', 'HYBRID'],
  proofMethod: 'QR_SCAN', // Both people scan
  defaultReward: 200,
  defaultAntiCheatRules: [
    {
      type: 'RATE_LIMIT',
      maxSubmissions: 20,
      windowHours: 720, // 20 per month
      scope: 'PER_USER'
    },
    {
      type: 'LOCATION_LOCK',
      radiusMeters: 100,
      requireGPS: true,
      allowManualOverride: false
    },
    {
      type: 'UNIQUE_DEVICE',
      allowMultipleAccounts: false
    },
    {
      type: 'MIN_ENGAGEMENT',
      minTimeSeconds: 300 // Both must be there 5+ minutes
    }
  ],
  defaultCooldown: {
    perUser: 24, // Once per day
    perBusiness: 0
  },
  rewardLockDelayDays: 3, // Verify friend actually visited
  requiresBusinessConfirmation: false
};

/**
 * WHY THIS CREATES BUSINESS VALUE:
 * - Drives foot traffic with social proof
 * - Acquires new customers through trusted recommendations
 * - Group visits increase average order value by 25%
 * - Creates community around the business
 */

// ============================================================================
// MISSION 9: UGC PHOTO UPLOAD
// ============================================================================

export const UGC_PHOTO_UPLOAD: StandardMissionTemplate = {
  id: 'UGC_PHOTO_UPLOAD',
  name: 'Share Your Experience (Photo)',
  description: 'Upload a photo of your experience',
  businessNeed: 'CONTENT',
  allowedBusinessTypes: ['PHYSICAL', 'ONLINE', 'HYBRID'],
  proofMethod: 'SCREENSHOT_AI',
  defaultReward: 100,
  defaultAntiCheatRules: [
    {
      type: 'RATE_LIMIT',
      maxSubmissions: 10,
      windowHours: 720, // 10 per month
      scope: 'PER_USER'
    },
    {
      type: 'MIN_ENGAGEMENT',
      minTimeSeconds: 60
    }
  ],
  defaultCooldown: {
    perUser: 168, // Once per week
    perBusiness: 0
  },
  rewardLockDelayDays: 3,
  requiresBusinessConfirmation: true,
  minSubscriptionTier: 'SILVER'
};

/**
 * WHY THIS CREATES BUSINESS VALUE:
 * - User-generated content has 5x higher click rates than branded content
 * - 85% of consumers trust UGC more than brand advertising
 * - Can be repurposed for marketing at zero cost
 * - Authentic visual proof builds trust
 */

// ============================================================================
// MISSION 10: UGC VIDEO UPLOAD
// ============================================================================

export const UGC_VIDEO_UPLOAD: StandardMissionTemplate = {
  id: 'UGC_VIDEO_UPLOAD',
  name: 'Create a Video Review',
  description: 'Upload a video showcasing your experience',
  businessNeed: 'CONTENT',
  allowedBusinessTypes: ['PHYSICAL', 'ONLINE', 'HYBRID'],
  proofMethod: 'SCREENSHOT_AI',
  defaultReward: 200,
  defaultAntiCheatRules: [
    {
      type: 'RATE_LIMIT',
      maxSubmissions: 5,
      windowHours: 720, // 5 per month
      scope: 'PER_USER'
    },
    {
      type: 'MIN_ENGAGEMENT',
      minTimeSeconds: 180 // Video creation takes time
    }
  ],
  defaultCooldown: {
    perUser: 336, // Once per 2 weeks
    perBusiness: 0
  },
  rewardLockDelayDays: 7,
  requiresBusinessConfirmation: true,
  minSubscriptionTier: 'GOLD'
};

/**
 * WHY THIS CREATES BUSINESS VALUE:
 * - Video content generates 1200% more shares than text + images combined
 * - 88% of consumers have been convinced to buy after watching video
 * - Video testimonials have highest conversion rate of any content type
 * - Higher production value = higher perceived authenticity
 */

// ============================================================================
// MISSION 11: FOLLOW BUSINESS IN APP
// ============================================================================

export const FOLLOW_BUSINESS_APP: StandardMissionTemplate = {
  id: 'FOLLOW_BUSINESS_APP',
  name: 'Follow Business',
  description: 'Follow this business in the Beevvy app to stay updated',
  businessNeed: 'CONTENT',
  allowedBusinessTypes: ['PHYSICAL', 'ONLINE', 'HYBRID'],
  proofMethod: 'WEBHOOK',
  defaultReward: 50,
  defaultAntiCheatRules: [
    {
      type: 'RATE_LIMIT',
      maxSubmissions: 1,
      windowHours: 87600, // Once ever (10 years)
      scope: 'PER_BUSINESS'
    },
    {
      type: 'UNIQUE_DEVICE',
      allowMultipleAccounts: false
    }
  ],
  defaultCooldown: {
    perUser: 87600, // Once per business lifetime
    perBusiness: 0
  },
  rewardLockDelayDays: 3, // Ensure they don't unfollow immediately
  requiresBusinessConfirmation: false,
  minSubscriptionTier: 'SILVER'
};

/**
 * WHY THIS CREATES BUSINESS VALUE:
 * - Builds in-app following and reach
 * - Each follower sees business updates in their feed
 * - Creates direct communication channel with customers
 * - Zero-cost marketing channel within Beevvy
 * - Higher engagement than external social media
 */

// ============================================================================
// MISSION 12: SHARE PHOTO IN APP
// ============================================================================

export const SHARE_PHOTO_APP: StandardMissionTemplate = {
  id: 'SHARE_PHOTO_APP',
  name: 'Share Your Experience',
  description: 'Post a photo of your experience in the Beevvy app',
  businessNeed: 'CONTENT',
  allowedBusinessTypes: ['PHYSICAL', 'ONLINE', 'HYBRID'],
  proofMethod: 'SCREENSHOT_AI',
  defaultReward: 100,
  defaultAntiCheatRules: [
    {
      type: 'RATE_LIMIT',
      maxSubmissions: 10,
      windowHours: 720, // 10 per month
      scope: 'PER_USER'
    },
    {
      type: 'MIN_ENGAGEMENT',
      minTimeSeconds: 60
    }
  ],
  defaultCooldown: {
    perUser: 168, // Once per week
    perBusiness: 0
  },
  rewardLockDelayDays: 3,
  requiresBusinessConfirmation: true,
  minSubscriptionTier: 'SILVER'
};

/**
 * WHY THIS CREATES BUSINESS VALUE:
 * - User-generated content in the app feed
 * - Increases visibility within Beevvy community
 * - Authentic peer recommendations
 * - Creates social proof for other users
 */

// ============================================================================
// MISSION 13: REPEAT PURCHASE / REPEAT VISIT
// ============================================================================

export const REPEAT_PURCHASE_VISIT: StandardMissionTemplate = {
  id: 'REPEAT_PURCHASE_VISIT',
  name: 'Loyalty Rewards',
  description: 'Make 5 purchases or visits within 30 days',
  businessNeed: 'LOYALTY',
  allowedBusinessTypes: ['PHYSICAL', 'ONLINE', 'HYBRID'],
  proofMethod: 'QR_SCAN', // Physical: QR, Online: Webhook
  defaultReward: 400,
  defaultAntiCheatRules: [
    {
      type: 'RATE_LIMIT',
      maxSubmissions: 5,
      windowHours: 720, // 5 times in 30 days
      scope: 'PER_USER'
    },
    {
      type: 'MIN_ENGAGEMENT',
      minTimeSeconds: 300,
      minActions: 5
    }
  ],
  defaultCooldown: {
    perUser: 4, // 4 hours between visits/purchases
    perBusiness: 0
  },
  rewardLockDelayDays: null, // Instant after 5th completion
  requiresBusinessConfirmation: false
};

/**
 * WHY THIS CREATES BUSINESS VALUE:
 * - Increases customer lifetime value by 300%
 * - Repeat customers spend 67% more than new customers
 * - Creates habit formation and routine
 * - Retention is 5x cheaper than acquisition
 */

// ============================================================================
// EXPORT LOCKED CATALOG
// ============================================================================

export const LOCKED_MISSION_CATALOG: StandardMissionTemplate[] = [
  WRITE_REVIEW_APP,             // 1 - Internal review after check-in
  REVIEW_WITH_PHOTO_APP,        // 2 - Internal review with photo
  VISIT_CHECKIN,                // 3
  CONSULTATION_REQUEST,         // 4
  REDEEM_OFFER,                 // 5
  FIRST_PURCHASE,               // 6
  REFER_PAYING_CUSTOMER,        // 7
  BRING_A_FRIEND,               // 8
  UGC_PHOTO_UPLOAD,             // 9
  UGC_VIDEO_UPLOAD,             // 10
  FOLLOW_BUSINESS_APP,          // 11
  SHARE_PHOTO_APP,              // 12
  REPEAT_PURCHASE_VISIT         // 13
];

// ============================================================================
// CATALOG UTILITIES
// ============================================================================

export function getMissionById(id: string): StandardMissionTemplate | undefined {
  return LOCKED_MISSION_CATALOG.find(m => m.id === id);
}

export function getMissionsByBusinessType(businessType: 'PHYSICAL' | 'ONLINE' | 'HYBRID'): StandardMissionTemplate[] {
  return LOCKED_MISSION_CATALOG.filter(m => m.allowedBusinessTypes.includes(businessType));
}

export function getMissionsByNeed(need: BusinessNeed): StandardMissionTemplate[] {
  return LOCKED_MISSION_CATALOG.filter(m => m.businessNeed === need);
}

export function getConversionMissions(): StandardMissionTemplate[] {
  return getMissionsByNeed('CONVERSION');
}

export function getContentMissions(): StandardMissionTemplate[] {
  return getMissionsByNeed('CONTENT');
}

export function getReputationMissions(): StandardMissionTemplate[] {
  return getMissionsByNeed('REPUTATION');
}

/**
 * Validates that a business has at least one conversion mission active.
 * This is a REQUIRED constraint to ensure businesses focus on ROI.
 */
export function validateBusinessHasConversionMission(
  activeMissionIds: string[],
  businessType: 'PHYSICAL' | 'ONLINE' | 'HYBRID'
): { valid: boolean; error?: string } {
  const activeMissions = activeMissionIds
    .map(id => getMissionById(id))
    .filter(Boolean) as StandardMissionTemplate[];

  const conversionMissions = activeMissions.filter(
    m => m.businessNeed === 'CONVERSION' && m.allowedBusinessTypes.includes(businessType)
  );

  if (conversionMissions.length === 0) {
    return {
      valid: false,
      error: `At least one conversion mission (First Purchase, Consultation, or Refer Paying Customer) must be active for ${businessType} businesses.`
    };
  }

  return { valid: true };
}

/**
 * CATALOG RULES:
 * 1. This is a LOCKED catalog - no missions can be added without approval
 * 2. All 13 missions are designed for measurable business outcomes
 * 3. Every business MUST have at least one CONVERSION mission active
 * 4. All missions are internal to Beevvy - no external social media required
 * 5. High-value missions require business confirmation
 */
