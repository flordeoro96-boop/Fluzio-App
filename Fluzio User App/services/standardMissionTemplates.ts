/**
 * Standard Mission Templates for Fluzio
 * ROI-Driven missions with built-in fraud prevention
 */

import {
  StandardMissionTemplate,
  BusinessNeed,
  ProofMethod,
  AntiCheatRule,
  CooldownRules
} from '../types/missionSystem';

// ============================================================================
// PHYSICAL LOCATION MISSIONS
// ============================================================================

export const CHECKIN_VISIT: StandardMissionTemplate = {
  id: 'CHECKIN_VISIT',
  name: 'First Visit Check-In',
  description: 'Visit our location and scan the QR code to earn points!',
  businessNeed: 'TRAFFIC',
  allowedBusinessTypes: ['PHYSICAL', 'HYBRID'],
  proofMethod: 'QR_SCAN',
  defaultReward: 50,
  defaultAntiCheatRules: [
    {
      type: 'RATE_LIMIT',
      maxSubmissions: 1,
      windowHours: 24,
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
    perUser: 24,
    perBusiness: 0
  },
  rewardLockDelayDays: null, // Instant reward
  requiresBusinessConfirmation: false
};

export const REPEAT_VISITOR: StandardMissionTemplate = {
  id: 'REPEAT_VISITOR',
  name: 'Loyalty Rewards',
  description: 'Visit us 5 times this month and earn bonus points!',
  businessNeed: 'LOYALTY',
  allowedBusinessTypes: ['PHYSICAL', 'HYBRID'],
  proofMethod: 'QR_SCAN',
  defaultReward: 250,
  defaultAntiCheatRules: [
    {
      type: 'RATE_LIMIT',
      maxSubmissions: 5,
      windowHours: 720, // 30 days
      scope: 'PER_USER'
    },
    {
      type: 'LOCATION_LOCK',
      radiusMeters: 100,
      requireGPS: true,
      allowManualOverride: false
    },
    {
      type: 'MIN_ENGAGEMENT',
      minTimeSeconds: 300, // Must spend 5 minutes
      minActions: 5
    }
  ],
  defaultCooldown: {
    perUser: 4, // 4 hours between visits
    perBusiness: 0
  },
  rewardLockDelayDays: null,
  requiresBusinessConfirmation: false
};

export const IN_STORE_PURCHASE: StandardMissionTemplate = {
  id: 'IN_STORE_PURCHASE',
  name: 'Make a Purchase',
  description: 'Make any purchase and show your receipt for rewards!',
  businessNeed: 'CONVERSION',
  allowedBusinessTypes: ['PHYSICAL', 'HYBRID'],
  proofMethod: 'FORM_SUBMISSION',
  defaultReward: 100,
  defaultAntiCheatRules: [
    {
      type: 'RATE_LIMIT',
      maxSubmissions: 10,
      windowHours: 720, // 30 days
      scope: 'PER_USER'
    },
    {
      type: 'PURCHASE_VERIFY',
      minAmount: 10,
      requireReceipt: true,
      requireOrderNumber: true
    },
    {
      type: 'LOCATION_LOCK',
      radiusMeters: 200,
      requireGPS: true,
      allowManualOverride: true // Allow manual for legitimate cases
    }
  ],
  defaultCooldown: {
    perUser: 1, // 1 hour between purchases
    perBusiness: 0
  },
  rewardLockDelayDays: 3, // 3-day delay to prevent refund fraud
  requiresBusinessConfirmation: true, // Business must verify receipt
  minSubscriptionTier: 'SILVER'
};

export const BRING_A_FRIEND: StandardMissionTemplate = {
  id: 'BRING_A_FRIEND',
  name: 'Bring a Friend',
  description: 'Bring a new customer and both earn rewards!',
  businessNeed: 'REFERRAL',
  allowedBusinessTypes: ['PHYSICAL', 'HYBRID'],
  proofMethod: 'REFERRAL_LINK',
  defaultReward: 150,
  defaultAntiCheatRules: [
    {
      type: 'RATE_LIMIT',
      maxSubmissions: 20,
      windowHours: 720, // 30 days
      scope: 'PER_USER'
    },
    {
      type: 'UNIQUE_DEVICE',
      allowMultipleAccounts: false // Prevent self-referral
    },
    {
      type: 'LOCATION_LOCK',
      radiusMeters: 100,
      requireGPS: true,
      allowManualOverride: false
    }
  ],
  defaultCooldown: {
    perUser: 24, // Once per day
    perBusiness: 0
  },
  rewardLockDelayDays: 7, // 7-day delay to ensure friend actually visits
  requiresBusinessConfirmation: false
};

// ============================================================================
// ONLINE MISSIONS
// ============================================================================

export const ONLINE_PURCHASE: StandardMissionTemplate = {
  id: 'ONLINE_PURCHASE',
  name: 'Online Order',
  description: 'Complete a purchase on our website!',
  businessNeed: 'CONVERSION',
  allowedBusinessTypes: ['ONLINE', 'HYBRID'],
  proofMethod: 'WEBHOOK',
  defaultReward: 200,
  defaultAntiCheatRules: [
    {
      type: 'RATE_LIMIT',
      maxSubmissions: 50,
      windowHours: 720, // 30 days
      scope: 'PER_USER'
    },
    {
      type: 'PURCHASE_VERIFY',
      minAmount: 20,
      requireReceipt: false,
      requireOrderNumber: true
    }
  ],
  defaultCooldown: {
    perUser: 0, // No cooldown, encourage multiple purchases
    perBusiness: 0
  },
  rewardLockDelayDays: 7, // 7-day delay for return window
  requiresBusinessConfirmation: false, // Webhook auto-verifies
  minSubscriptionTier: 'GOLD'
};

export const NEWSLETTER_SIGNUP: StandardMissionTemplate = {
  id: 'NEWSLETTER_SIGNUP',
  name: 'Join Our Newsletter',
  description: 'Subscribe to our newsletter for exclusive deals!',
  businessNeed: 'TRAFFIC',
  allowedBusinessTypes: ['ONLINE', 'HYBRID'],
  proofMethod: 'WEBHOOK',
  defaultReward: 25,
  defaultAntiCheatRules: [
    {
      type: 'RATE_LIMIT',
      maxSubmissions: 1,
      windowHours: 8760, // Once per year
      scope: 'PER_USER'
    },
    {
      type: 'UNIQUE_DEVICE',
      allowMultipleAccounts: false
    }
  ],
  defaultCooldown: {
    perUser: 8760, // Once per year
    perBusiness: 0
  },
  rewardLockDelayDays: null, // Instant
  requiresBusinessConfirmation: false
};

export const CART_COMPLETION: StandardMissionTemplate = {
  id: 'CART_COMPLETION',
  name: 'Complete Your Cart',
  description: 'Finish your abandoned cart and get bonus points!',
  businessNeed: 'CONVERSION',
  allowedBusinessTypes: ['ONLINE', 'HYBRID'],
  proofMethod: 'WEBHOOK',
  defaultReward: 150,
  defaultAntiCheatRules: [
    {
      type: 'RATE_LIMIT',
      maxSubmissions: 5,
      windowHours: 168, // Per week
      scope: 'PER_USER'
    },
    {
      type: 'PURCHASE_VERIFY',
      minAmount: 30,
      requireReceipt: false,
      requireOrderNumber: true
    },
    {
      type: 'MIN_ENGAGEMENT',
      minTimeSeconds: 120 // Cart must be older than 2 minutes
    }
  ],
  defaultCooldown: {
    perUser: 24,
    perBusiness: 0
  },
  rewardLockDelayDays: 7,
  requiresBusinessConfirmation: false,
  minSubscriptionTier: 'GOLD'
};

export const REFERRAL_PURCHASE: StandardMissionTemplate = {
  id: 'REFERRAL_PURCHASE',
  name: 'Refer & Earn',
  description: 'Share your referral link and earn when friends purchase!',
  businessNeed: 'REFERRAL',
  allowedBusinessTypes: ['ONLINE', 'HYBRID'],
  proofMethod: 'REFERRAL_LINK',
  defaultReward: 300,
  defaultAntiCheatRules: [
    {
      type: 'RATE_LIMIT',
      maxSubmissions: 100,
      windowHours: 720, // 30 days
      scope: 'PER_USER'
    },
    {
      type: 'UNIQUE_DEVICE',
      allowMultipleAccounts: false
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
  rewardLockDelayDays: 14, // 14-day delay to prevent refund fraud
  requiresBusinessConfirmation: false,
  minSubscriptionTier: 'SILVER'
};

// ============================================================================
// SOCIAL/CONTENT MISSIONS (LOW REWARD, HIGH VERIFICATION)
// ============================================================================

export const INSTAGRAM_STORY: StandardMissionTemplate = {
  id: 'INSTAGRAM_STORY',
  name: 'Share on Instagram Story',
  description: 'Post about us on your Instagram story with our hashtag!',
  businessNeed: 'CONTENT',
  allowedBusinessTypes: ['PHYSICAL', 'ONLINE', 'HYBRID'],
  proofMethod: 'SCREENSHOT_AI',
  defaultReward: 75, // Low reward for social
  defaultAntiCheatRules: [
    {
      type: 'RATE_LIMIT',
      maxSubmissions: 10,
      windowHours: 720, // 30 days
      scope: 'PER_USER'
    },
    {
      type: 'SOCIAL_VERIFY',
      platform: 'INSTAGRAM',
      requirePublicPost: true,
      minFollowers: 100,
      requireHashtags: ['#fluzio'],
      requireMention: undefined
    },
    {
      type: 'MIN_ENGAGEMENT',
      minTimeSeconds: 60 // Must take time to create
    }
  ],
  defaultCooldown: {
    perUser: 168, // Once per week
    perBusiness: 0
  },
  rewardLockDelayDays: 7, // Delay to check if post stays up
  requiresBusinessConfirmation: true, // Business must verify post
  minSubscriptionTier: 'SILVER'
};

export const INSTAGRAM_POST: StandardMissionTemplate = {
  id: 'INSTAGRAM_POST',
  name: 'Post on Instagram Feed',
  description: 'Create a feed post featuring our business!',
  businessNeed: 'CONTENT',
  allowedBusinessTypes: ['PHYSICAL', 'ONLINE', 'HYBRID'],
  proofMethod: 'SCREENSHOT_AI',
  defaultReward: 150, // Higher than story (more permanent)
  defaultAntiCheatRules: [
    {
      type: 'RATE_LIMIT',
      maxSubmissions: 5,
      windowHours: 720, // 30 days
      scope: 'PER_USER'
    },
    {
      type: 'SOCIAL_VERIFY',
      platform: 'INSTAGRAM',
      requirePublicPost: true,
      minFollowers: 200,
      requireHashtags: ['#fluzio'],
      requireMention: undefined
    }
  ],
  defaultCooldown: {
    perUser: 336, // Once per 2 weeks
    perBusiness: 0
  },
  rewardLockDelayDays: 14, // Longer delay for feed posts
  requiresBusinessConfirmation: true,
  minSubscriptionTier: 'GOLD'
};

export const GOOGLE_REVIEW: StandardMissionTemplate = {
  id: 'GOOGLE_REVIEW',
  name: 'Leave a Google Review',
  description: 'Share your experience on Google!',
  businessNeed: 'REPUTATION',
  allowedBusinessTypes: ['PHYSICAL', 'ONLINE', 'HYBRID'],
  proofMethod: 'SCREENSHOT_AI',
  defaultReward: 100,
  defaultAntiCheatRules: [
    {
      type: 'RATE_LIMIT',
      maxSubmissions: 1,
      windowHours: 8760, // Once per year
      scope: 'PER_USER'
    },
    {
      type: 'UNIQUE_DEVICE',
      allowMultipleAccounts: false
    },
    {
      type: 'MIN_ENGAGEMENT',
      minTimeSeconds: 120 // Must take time to write
    }
  ],
  defaultCooldown: {
    perUser: 8760, // Once per year
    perBusiness: 0
  },
  rewardLockDelayDays: 7, // Delay to verify review stays up
  requiresBusinessConfirmation: true,
  minSubscriptionTier: 'SILVER'
};

export const TIKTOK_VIDEO: StandardMissionTemplate = {
  id: 'TIKTOK_VIDEO',
  name: 'Create TikTok Video',
  description: 'Make a TikTok featuring our business!',
  businessNeed: 'CONTENT',
  allowedBusinessTypes: ['PHYSICAL', 'ONLINE', 'HYBRID'],
  proofMethod: 'SCREENSHOT_AI',
  defaultReward: 200, // Higher effort = higher reward (but still capped)
  defaultAntiCheatRules: [
    {
      type: 'RATE_LIMIT',
      maxSubmissions: 4,
      windowHours: 720, // 30 days
      scope: 'PER_USER'
    },
    {
      type: 'SOCIAL_VERIFY',
      platform: 'TIKTOK',
      requirePublicPost: true,
      minFollowers: 500,
      requireHashtags: ['#fluzio'],
      requireMention: undefined
    },
    {
      type: 'MIN_ENGAGEMENT',
      minTimeSeconds: 180 // Video creation takes time
    }
  ],
  defaultCooldown: {
    perUser: 168, // Once per week
    perBusiness: 0
  },
  rewardLockDelayDays: 14,
  requiresBusinessConfirmation: true,
  minSubscriptionTier: 'PLATINUM'
};

// ============================================================================
// HYBRID MISSIONS
// ============================================================================

export const PHOTO_CHECKIN: StandardMissionTemplate = {
  id: 'PHOTO_CHECKIN',
  name: 'Photo Check-In',
  description: 'Take a photo at our location and share your experience!',
  businessNeed: 'CONTENT',
  allowedBusinessTypes: ['PHYSICAL', 'HYBRID'],
  proofMethod: 'SCREENSHOT_AI',
  defaultReward: 100,
  defaultAntiCheatRules: [
    {
      type: 'RATE_LIMIT',
      maxSubmissions: 10,
      windowHours: 720, // 30 days
      scope: 'PER_USER'
    },
    {
      type: 'LOCATION_LOCK',
      radiusMeters: 50,
      requireGPS: true,
      allowManualOverride: false
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

export const BOOK_APPOINTMENT: StandardMissionTemplate = {
  id: 'BOOK_APPOINTMENT',
  name: 'Book an Appointment',
  description: 'Schedule a consultation or appointment and earn points!',
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
      requiredActions: ['submit_contact_info', 'select_service', 'select_date']
    }
  ],
  defaultCooldown: {
    perUser: 168, // Once per week
    perBusiness: 0
  },
  rewardLockDelayDays: 3, // Ensure customer shows up
  requiresBusinessConfirmation: true,
  minSubscriptionTier: 'SILVER'
};

// ============================================================================
// EXPORT ALL TEMPLATES
// ============================================================================

export const ALL_STANDARD_MISSIONS: StandardMissionTemplate[] = [
  // Physical
  CHECKIN_VISIT,
  REPEAT_VISITOR,
  IN_STORE_PURCHASE,
  BRING_A_FRIEND,
  
  // Online
  ONLINE_PURCHASE,
  NEWSLETTER_SIGNUP,
  CART_COMPLETION,
  REFERRAL_PURCHASE,
  
  // Social/Content
  INSTAGRAM_STORY,
  INSTAGRAM_POST,
  GOOGLE_REVIEW,
  
  // Hybrid
  PHOTO_CHECKIN,
  
  // Appointments/Consultations
  BOOK_APPOINTMENT
];

export function getTemplatesForBusinessType(businessType: 'PHYSICAL' | 'ONLINE' | 'HYBRID'): StandardMissionTemplate[] {
  return ALL_STANDARD_MISSIONS.filter(template => 
    template.allowedBusinessTypes.includes(businessType)
  );
}

export function getTemplatesByNeed(businessNeed: BusinessNeed): StandardMissionTemplate[] {
  return ALL_STANDARD_MISSIONS.filter(template => 
    template.businessNeed === businessNeed
  );
}

export function getConversionMissions(): StandardMissionTemplate[] {
  return ALL_STANDARD_MISSIONS.filter(template => 
    template.businessNeed === 'CONVERSION'
  );
}

export function getTemplateById(id: string): StandardMissionTemplate | undefined {
  return ALL_STANDARD_MISSIONS.find(template => template.id === id);
}

/**
 * Validates that a business has at least one conversion-capable mission
 */
export function ensureConversionMission(
  activeMissions: StandardMissionTemplate[],
  businessType: 'PHYSICAL' | 'ONLINE' | 'HYBRID'
): boolean {
  const conversionMissions = activeMissions.filter(m => m.businessNeed === 'CONVERSION');
  const compatibleConversion = conversionMissions.filter(m => 
    m.allowedBusinessTypes.includes(businessType)
  );
  
  return compatibleConversion.length > 0;
}
