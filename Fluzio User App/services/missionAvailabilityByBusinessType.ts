/**
 * MISSION AVAILABILITY BY BUSINESS TYPE FOR FLUZIO
 * 
 * Enforces which missions are available to physical, online, and hybrid businesses.
 * Each of the 14 locked missions in the v1 catalog has explicit business type restrictions.
 */

import type { Mission, BusinessNeed, ProofMethod } from '../types/missionSystem';

// ============================================================================
// BUSINESS TYPE DEFINITIONS
// ============================================================================

export enum BusinessType {
  PHYSICAL = 'PHYSICAL',   // Brick-and-mortar only
  ONLINE = 'ONLINE',       // E-commerce/digital only
  HYBRID = 'HYBRID',       // Both physical and online presence
}

// ============================================================================
// MISSION AVAILABILITY MAP
// ============================================================================

export interface MissionAvailability {
  missionId: string;
  missionName: string;
  
  // Business type restrictions
  allowedBusinessTypes: BusinessType[];
  forbiddenBusinessTypes: BusinessType[];
  
  // Proof method adjustments per business type
  proofAdjustments: {
    [BusinessType.PHYSICAL]?: ProofMethodAdjustment;
    [BusinessType.ONLINE]?: ProofMethodAdjustment;
    [BusinessType.HYBRID]?: ProofMethodAdjustment;
  };
  
  // Human-readable reason for restriction
  availabilityReason: string;
}

export interface ProofMethodAdjustment {
  requiredProofMethod: ProofMethod;
  additionalRequirements?: string[];
  disallowedProofMethods?: ProofMethod[];
  explanation: string;
}

/**
 * LOCKED FLUZIO V1 CATALOG - MISSION AVAILABILITY
 * 
 * All 14 missions with explicit business type rules.
 */

export const MISSION_AVAILABILITY_MAP: Record<string, MissionAvailability> = {
  
  // ==========================================================================
  // REPUTATION MISSIONS (2)
  // ==========================================================================
  
  'GOOGLE_REVIEW_TEXT': {
    missionId: 'GOOGLE_REVIEW_TEXT',
    missionName: 'Google Review (Text Only)',
    
    allowedBusinessTypes: [
      BusinessType.PHYSICAL,
      BusinessType.ONLINE,
      BusinessType.HYBRID
    ],
    forbiddenBusinessTypes: [],
    
    proofAdjustments: {
      [BusinessType.PHYSICAL]: {
        requiredProofMethod: 'SCREENSHOT_AI',
        additionalRequirements: [
          'Must verify review mentions physical location or address',
          'Must verify customer visited location (cross-check with check-in data if available)'
        ],
        explanation: 'Physical businesses need location-specific review verification'
      },
      [BusinessType.ONLINE]: {
        requiredProofMethod: 'SCREENSHOT_AI',
        additionalRequirements: [
          'Must verify review mentions website, product, or online service',
          'No requirement for physical location verification'
        ],
        explanation: 'Online businesses need product/service-focused review verification'
      },
      [BusinessType.HYBRID]: {
        requiredProofMethod: 'SCREENSHOT_AI',
        additionalRequirements: [
          'Must verify review mentions either location OR online service',
          'Both physical and online reviews accepted'
        ],
        explanation: 'Hybrid businesses accept reviews for either channel'
      }
    },
    
    availabilityReason: 'Google reviews available to all business types. Verification adjusts based on business model.'
  },
  
  'GOOGLE_REVIEW_PHOTOS': {
    missionId: 'GOOGLE_REVIEW_PHOTOS',
    missionName: 'Google Review with Photos',
    
    allowedBusinessTypes: [
      BusinessType.PHYSICAL,
      BusinessType.HYBRID
    ],
    forbiddenBusinessTypes: [
      BusinessType.ONLINE
    ],
    
    proofAdjustments: {
      [BusinessType.PHYSICAL]: {
        requiredProofMethod: 'SCREENSHOT_AI',
        additionalRequirements: [
          'Photos must show physical location, interior, or products',
          'Must verify photos are original (not stock images)',
          'Must verify review is posted to correct business location'
        ],
        explanation: 'Physical businesses require location-based photos'
      },
      [BusinessType.HYBRID]: {
        requiredProofMethod: 'SCREENSHOT_AI',
        additionalRequirements: [
          'Photos must show physical location or in-store products',
          'Online products NOT eligible (use UGC missions instead)',
          'Must verify customer visited physical location'
        ],
        explanation: 'Hybrid businesses can only accept physical location photos for Google reviews'
      }
    },
    
    availabilityReason: 'Google review photos require physical location. Online-only businesses cannot use this mission.'
  },
  
  // ==========================================================================
  // TRAFFIC MISSIONS (1)
  // ==========================================================================
  
  'VISIT_CHECKIN': {
    missionId: 'VISIT_CHECKIN',
    missionName: 'Visit & Check-In',
    
    allowedBusinessTypes: [
      BusinessType.PHYSICAL,
      BusinessType.HYBRID
    ],
    forbiddenBusinessTypes: [
      BusinessType.ONLINE
    ],
    
    proofAdjustments: {
      [BusinessType.PHYSICAL]: {
        requiredProofMethod: 'GPS_CHECKIN',
        additionalRequirements: [
          'GPS must be within 100m of business location',
          'Minimum 60-second dwell time required',
          'Accelerometer data required (prevent GPS spoofing)'
        ],
        disallowedProofMethods: ['SCREENSHOT_AI', 'FORM_SUBMISSION'],
        explanation: 'Physical businesses require GPS verification at their location'
      },
      [BusinessType.HYBRID]: {
        requiredProofMethod: 'GPS_CHECKIN',
        additionalRequirements: [
          'GPS must be within 100m of physical store location',
          'Minimum 60-second dwell time required',
          'Cannot check in to online store/website (use online missions instead)'
        ],
        disallowedProofMethods: ['SCREENSHOT_AI', 'FORM_SUBMISSION'],
        explanation: 'Hybrid businesses require GPS verification at physical location only'
      }
    },
    
    availabilityReason: 'Check-in requires physical location. Online-only businesses have no physical address to verify.'
  },
  
  // ==========================================================================
  // CONVERSION MISSIONS (4)
  // ==========================================================================
  
  'CONSULTATION_REQUEST': {
    missionId: 'CONSULTATION_REQUEST',
    missionName: 'Request a Consultation',
    
    allowedBusinessTypes: [
      BusinessType.PHYSICAL,
      BusinessType.ONLINE,
      BusinessType.HYBRID
    ],
    forbiddenBusinessTypes: [],
    
    proofAdjustments: {
      [BusinessType.PHYSICAL]: {
        requiredProofMethod: 'WEBHOOK',
        additionalRequirements: [
          'Must book in-person consultation at physical location',
          'Webhook must include appointment date, time, and location',
          'Reward releases after appointment is completed (not just booked)'
        ],
        explanation: 'Physical businesses require in-person consultation bookings'
      },
      [BusinessType.ONLINE]: {
        requiredProofMethod: 'WEBHOOK',
        additionalRequirements: [
          'Virtual consultation (video call, phone, or chat) accepted',
          'Webhook must include consultation date and time',
          'Reward releases after consultation is completed'
        ],
        explanation: 'Online businesses accept virtual consultations'
      },
      [BusinessType.HYBRID]: {
        requiredProofMethod: 'WEBHOOK',
        additionalRequirements: [
          'Both in-person and virtual consultations accepted',
          'Webhook must specify consultation type (in-person or virtual)',
          'Reward releases after consultation is completed'
        ],
        explanation: 'Hybrid businesses accept both in-person and virtual consultations'
      }
    },
    
    availabilityReason: 'Consultation missions available to all types. Proof method adjusts for in-person vs virtual.'
  },
  
  'REDEEM_OFFER': {
    missionId: 'REDEEM_OFFER',
    missionName: 'Redeem Special Offer',
    
    allowedBusinessTypes: [
      BusinessType.PHYSICAL,
      BusinessType.ONLINE,
      BusinessType.HYBRID
    ],
    forbiddenBusinessTypes: [],
    
    proofAdjustments: {
      [BusinessType.PHYSICAL]: {
        requiredProofMethod: 'QR_SCAN',
        additionalRequirements: [
          'QR code must be scanned in-store by business staff',
          'GPS verification required (within 100m of location)',
          'Cannot redeem via screenshot or online'
        ],
        disallowedProofMethods: ['SCREENSHOT_AI', 'FORM_SUBMISSION'],
        explanation: 'Physical businesses require in-store QR scan to prevent screenshot abuse'
      },
      [BusinessType.ONLINE]: {
        requiredProofMethod: 'WEBHOOK',
        additionalRequirements: [
          'Offer must be redeemed during online checkout',
          'Webhook verifies promo code applied and order completed',
          'No in-person redemption available'
        ],
        disallowedProofMethods: ['QR_SCAN', 'GPS_CHECKIN'],
        explanation: 'Online businesses use webhook to verify promo code redemption'
      },
      [BusinessType.HYBRID]: {
        requiredProofMethod: 'QR_SCAN', // OR 'WEBHOOK' (business chooses)
        additionalRequirements: [
          'Business must specify: in-store only, online only, or both',
          'If in-store: QR scan + GPS required',
          'If online: Webhook required',
          'Cannot mix proof methods in single mission (create two separate missions)'
        ],
        explanation: 'Hybrid businesses must create separate missions for in-store and online offers'
      }
    },
    
    availabilityReason: 'Offer redemption available to all types. Proof method varies: QR in-store, webhook online.'
  },
  
  'FIRST_PURCHASE': {
    missionId: 'FIRST_PURCHASE',
    missionName: 'Make Your First Purchase',
    
    allowedBusinessTypes: [
      BusinessType.PHYSICAL,
      BusinessType.ONLINE,
      BusinessType.HYBRID
    ],
    forbiddenBusinessTypes: [],
    
    proofAdjustments: {
      [BusinessType.PHYSICAL]: {
        requiredProofMethod: 'WEBHOOK',
        additionalRequirements: [
          'Purchase must occur at physical location (POS system webhook)',
          'Webhook must include order ID, amount, and location',
          'Minimum purchase amount: $10',
          '7-day reward delay for refund protection'
        ],
        explanation: 'Physical businesses verify purchase via POS webhook'
      },
      [BusinessType.ONLINE]: {
        requiredProofMethod: 'WEBHOOK',
        additionalRequirements: [
          'Purchase must occur on website/app (e-commerce webhook)',
          'Webhook must include order ID, amount, and customer email',
          'Minimum purchase amount: $10',
          '7-day reward delay for refund/chargeback protection'
        ],
        explanation: 'Online businesses verify purchase via e-commerce webhook'
      },
      [BusinessType.HYBRID]: {
        requiredProofMethod: 'WEBHOOK',
        additionalRequirements: [
          'Purchase accepted from either physical store OR online',
          'Webhook must specify purchase channel (in-store or online)',
          'Minimum purchase amount: $10',
          '7-day reward delay for refund protection',
          'One-time reward regardless of channel used'
        ],
        explanation: 'Hybrid businesses accept first purchase from either channel'
      }
    },
    
    availabilityReason: 'First purchase mission available to all types. Webhook required for payment verification.'
  },
  
  'REFER_PAYING_CUSTOMER': {
    missionId: 'REFER_PAYING_CUSTOMER',
    missionName: 'Refer a Paying Customer',
    
    allowedBusinessTypes: [
      BusinessType.PHYSICAL,
      BusinessType.ONLINE,
      BusinessType.HYBRID
    ],
    forbiddenBusinessTypes: [],
    
    proofAdjustments: {
      [BusinessType.PHYSICAL]: {
        requiredProofMethod: 'REFERRAL_LINK',
        additionalRequirements: [
          'Referred customer must make in-store purchase (verified via POS webhook)',
          'Referral link tracks customer, purchase verified separately',
          'Minimum referred purchase: $25',
          '14-day reward delay (refund window + fraud detection)'
        ],
        explanation: 'Physical businesses require in-store purchase by referred customer'
      },
      [BusinessType.ONLINE]: {
        requiredProofMethod: 'REFERRAL_LINK',
        additionalRequirements: [
          'Referred customer must make online purchase (verified via e-commerce webhook)',
          'Referral link tracks customer, purchase verified separately',
          'Minimum referred purchase: $25',
          '14-day reward delay (refund/chargeback window + fraud detection)'
        ],
        explanation: 'Online businesses require online purchase by referred customer'
      },
      [BusinessType.HYBRID]: {
        requiredProofMethod: 'REFERRAL_LINK',
        additionalRequirements: [
          'Referred customer can purchase in-store OR online',
          'Referral link tracks customer, purchase verified via webhook (any channel)',
          'Minimum referred purchase: $25',
          '14-day reward delay',
          'One-time reward per referred customer regardless of channel'
        ],
        explanation: 'Hybrid businesses accept referred purchases from either channel'
      }
    },
    
    availabilityReason: 'Referral mission available to all types. Referred purchase must occur on business\'s platform.'
  },
  
  // ==========================================================================
  // REFERRAL MISSIONS (1)
  // ==========================================================================
  
  'BRING_A_FRIEND': {
    missionId: 'BRING_A_FRIEND',
    missionName: 'Bring a Friend to Visit',
    
    allowedBusinessTypes: [
      BusinessType.PHYSICAL,
      BusinessType.HYBRID
    ],
    forbiddenBusinessTypes: [
      BusinessType.ONLINE
    ],
    
    proofAdjustments: {
      [BusinessType.PHYSICAL]: {
        requiredProofMethod: 'GPS_CHECKIN',
        additionalRequirements: [
          'Both referrer and friend must check in at physical location',
          'Check-ins must occur within 30 minutes of each other',
          'GPS must verify both users within 100m of location',
          'Minimum 60-second dwell time for both users',
          'Business confirmation required'
        ],
        disallowedProofMethods: ['SCREENSHOT_AI', 'FORM_SUBMISSION', 'REFERRAL_LINK'],
        explanation: 'Physical businesses require GPS-verified co-visit'
      },
      [BusinessType.HYBRID]: {
        requiredProofMethod: 'GPS_CHECKIN',
        additionalRequirements: [
          'Both users must check in at PHYSICAL location (not online)',
          'Check-ins must occur within 30 minutes of each other',
          'GPS verification required for both users',
          'Cannot "bring a friend" online (use referral missions instead)',
          'Business confirmation required'
        ],
        disallowedProofMethods: ['SCREENSHOT_AI', 'FORM_SUBMISSION', 'REFERRAL_LINK'],
        explanation: 'Hybrid businesses require physical co-visit, not online referral'
      }
    },
    
    availabilityReason: 'Bring a friend requires physical presence. Online businesses cannot verify co-visit.'
  },
  
  // ==========================================================================
  // CONTENT MISSIONS (4)
  // ==========================================================================
  
  'UGC_PHOTO_UPLOAD': {
    missionId: 'UGC_PHOTO_UPLOAD',
    missionName: 'Share a Photo',
    
    allowedBusinessTypes: [
      BusinessType.PHYSICAL,
      BusinessType.ONLINE,
      BusinessType.HYBRID
    ],
    forbiddenBusinessTypes: [],
    
    proofAdjustments: {
      [BusinessType.PHYSICAL]: {
        requiredProofMethod: 'SCREENSHOT_AI', // Photo uploaded via app
        additionalRequirements: [
          'Photo must show physical location, interior, products, or food',
          'GPS verification recommended (within 200m of location)',
          'EXIF data must show photo taken within 48 hours',
          'Business must approve content quality',
          'Content reuse consent required if business wants to use in marketing'
        ],
        explanation: 'Physical businesses require location-specific photos'
      },
      [BusinessType.ONLINE]: {
        requiredProofMethod: 'SCREENSHOT_AI',
        additionalRequirements: [
          'Photo must show online product, packaging, or unboxing',
          'Cannot require GPS verification (no physical location)',
          'EXIF data must show photo taken within 7 days',
          'Business must approve content quality',
          'Content reuse consent required'
        ],
        explanation: 'Online businesses require product-focused photos'
      },
      [BusinessType.HYBRID]: {
        requiredProofMethod: 'SCREENSHOT_AI',
        additionalRequirements: [
          'Photo can show physical location OR online products',
          'GPS verification optional (not required for online products)',
          'EXIF data must show photo taken within 7 days',
          'Business must specify: location photos only, product photos only, or both',
          'Business must approve content quality',
          'Content reuse consent required'
        ],
        explanation: 'Hybrid businesses accept photos of location or products'
      }
    },
    
    availabilityReason: 'Photo upload available to all types. Content focus varies: location vs products.'
  },
  
  'UGC_VIDEO_UPLOAD': {
    missionId: 'UGC_VIDEO_UPLOAD',
    missionName: 'Share a Video',
    
    allowedBusinessTypes: [
      BusinessType.PHYSICAL,
      BusinessType.ONLINE,
      BusinessType.HYBRID
    ],
    forbiddenBusinessTypes: [],
    
    proofAdjustments: {
      [BusinessType.PHYSICAL]: {
        requiredProofMethod: 'SCREENSHOT_AI', // Video uploaded via app
        additionalRequirements: [
          'Video must show physical location, experience, or products',
          'Minimum duration: 10 seconds',
          'GPS verification recommended',
          'Must detect audio (no silent stock videos)',
          'Business must approve content quality',
          'Content reuse consent required'
        ],
        explanation: 'Physical businesses require location/experience videos'
      },
      [BusinessType.ONLINE]: {
        requiredProofMethod: 'SCREENSHOT_AI',
        additionalRequirements: [
          'Video must show online product, unboxing, or review',
          'Minimum duration: 10 seconds',
          'No GPS verification required',
          'Must detect audio (no silent stock videos)',
          'Business must approve content quality',
          'Content reuse consent required'
        ],
        explanation: 'Online businesses require product review/unboxing videos'
      },
      [BusinessType.HYBRID]: {
        requiredProofMethod: 'SCREENSHOT_AI',
        additionalRequirements: [
          'Video can show physical location OR online products',
          'Minimum duration: 10 seconds',
          'GPS verification optional',
          'Must detect audio',
          'Business must approve content quality',
          'Content reuse consent required'
        ],
        explanation: 'Hybrid businesses accept videos of location or products'
      }
    },
    
    availabilityReason: 'Video upload available to all types. Content focus varies: location vs products.'
  },
  
  'STORY_POST_TAG': {
    missionId: 'STORY_POST_TAG',
    missionName: 'Tag Us in Instagram Story',
    
    allowedBusinessTypes: [
      BusinessType.PHYSICAL,
      BusinessType.ONLINE,
      BusinessType.HYBRID
    ],
    forbiddenBusinessTypes: [],
    
    proofAdjustments: {
      [BusinessType.PHYSICAL]: {
        requiredProofMethod: 'SCREENSHOT_AI',
        additionalRequirements: [
          'Story must tag business Instagram account',
          'Story must show physical location or mention visit',
          'Screenshot must be submitted within 24 hours (story expires)',
          'AI must verify business tag is visible',
          'Business must approve story content',
          '7-day reward delay (verify story not deleted immediately after screenshot)'
        ],
        explanation: 'Physical businesses require location-based story posts'
      },
      [BusinessType.ONLINE]: {
        requiredProofMethod: 'SCREENSHOT_AI',
        additionalRequirements: [
          'Story must tag business Instagram account',
          'Story must show online products or mention brand',
          'Screenshot must be submitted within 24 hours',
          'AI must verify business tag is visible',
          'Business must approve story content',
          '7-day reward delay'
        ],
        explanation: 'Online businesses require product-focused story posts'
      },
      [BusinessType.HYBRID]: {
        requiredProofMethod: 'SCREENSHOT_AI',
        additionalRequirements: [
          'Story must tag business Instagram account',
          'Story can mention physical location OR online products',
          'Screenshot must be submitted within 24 hours',
          'AI must verify business tag is visible',
          'Business must approve story content',
          '7-day reward delay'
        ],
        explanation: 'Hybrid businesses accept stories about location or products'
      }
    },
    
    availabilityReason: 'Instagram story mission available to all types. Content focus varies by business model.'
  },
  
  'FEED_REEL_POST_TAG': {
    missionId: 'FEED_REEL_POST_TAG',
    missionName: 'Tag Us in Feed/Reel Post',
    
    allowedBusinessTypes: [
      BusinessType.PHYSICAL,
      BusinessType.ONLINE,
      BusinessType.HYBRID
    ],
    forbiddenBusinessTypes: [],
    
    proofAdjustments: {
      [BusinessType.PHYSICAL]: {
        requiredProofMethod: 'SCREENSHOT_AI',
        additionalRequirements: [
          'Post must tag business Instagram account',
          'Post must show physical location, experience, or products',
          'Post must remain public for minimum 14 days',
          'AI must verify business tag and content quality',
          'Business must approve post',
          '14-day reward delay (verify post not deleted)'
        ],
        explanation: 'Physical businesses require location/experience posts'
      },
      [BusinessType.ONLINE]: {
        requiredProofMethod: 'SCREENSHOT_AI',
        additionalRequirements: [
          'Post must tag business Instagram account',
          'Post must show online products or brand',
          'Post must remain public for minimum 14 days',
          'AI must verify business tag and content quality',
          'Business must approve post',
          '14-day reward delay'
        ],
        explanation: 'Online businesses require product review posts'
      },
      [BusinessType.HYBRID]: {
        requiredProofMethod: 'SCREENSHOT_AI',
        additionalRequirements: [
          'Post must tag business Instagram account',
          'Post can show physical location OR online products',
          'Post must remain public for minimum 14 days',
          'AI must verify business tag and content quality',
          'Business must approve post',
          '14-day reward delay'
        ],
        explanation: 'Hybrid businesses accept posts about location or products'
      }
    },
    
    availabilityReason: 'Instagram feed/reel post mission available to all types. Content varies by model.'
  },
  
  // ==========================================================================
  // LOYALTY MISSIONS (2)
  // ==========================================================================
  
  'REPEAT_PURCHASE_VISIT': {
    missionId: 'REPEAT_PURCHASE_VISIT',
    missionName: 'Make a Repeat Purchase/Visit',
    
    allowedBusinessTypes: [
      BusinessType.PHYSICAL,
      BusinessType.ONLINE,
      BusinessType.HYBRID
    ],
    forbiddenBusinessTypes: [],
    
    proofAdjustments: {
      [BusinessType.PHYSICAL]: {
        requiredProofMethod: 'WEBHOOK',
        additionalRequirements: [
          'Must verify at least 2 purchases/visits at physical location',
          'Minimum 7 days between first and second purchase',
          'POS webhook verifies repeat purchase',
          'Instant reward (loyalty should be rewarded immediately)'
        ],
        explanation: 'Physical businesses verify repeat visits via POS'
      },
      [BusinessType.ONLINE]: {
        requiredProofMethod: 'WEBHOOK',
        additionalRequirements: [
          'Must verify at least 2 online purchases',
          'Minimum 7 days between first and second purchase',
          'E-commerce webhook verifies repeat purchase',
          'Instant reward'
        ],
        explanation: 'Online businesses verify repeat purchases via e-commerce webhook'
      },
      [BusinessType.HYBRID]: {
        requiredProofMethod: 'WEBHOOK',
        additionalRequirements: [
          'Must verify at least 2 purchases (either channel)',
          'Can mix physical and online purchases',
          'Minimum 7 days between first and second purchase',
          'Webhook verifies repeat purchase from either channel',
          'Instant reward'
        ],
        explanation: 'Hybrid businesses accept repeat purchases from any channel'
      }
    },
    
    availabilityReason: 'Repeat purchase mission available to all types. Webhook verifies transaction history.'
  },
  
  'INSTAGRAM_FOLLOW': {
    missionId: 'INSTAGRAM_FOLLOW',
    missionName: 'Follow on Instagram',
    
    allowedBusinessTypes: [
      BusinessType.PHYSICAL,
      BusinessType.ONLINE,
      BusinessType.HYBRID
    ],
    forbiddenBusinessTypes: [],
    
    proofAdjustments: {
      [BusinessType.PHYSICAL]: {
        requiredProofMethod: 'SCREENSHOT_AI',
        additionalRequirements: [
          'User must screenshot their Instagram following list showing business account',
          'Business must have Instagram Business account connected',
          'Alternative: Automated verification via Instagram Graph API',
          '3-day reward delay to prevent unfollow fraud'
        ],
        explanation: 'Physical businesses grow social media presence for local marketing'
      },
      [BusinessType.ONLINE]: {
        requiredProofMethod: 'SCREENSHOT_AI',
        additionalRequirements: [
          'User must screenshot their Instagram following list showing business account',
          'Business must have Instagram Business account connected',
          'Alternative: Automated verification via Instagram Graph API',
          '3-day reward delay to prevent unfollow fraud'
        ],
        explanation: 'Online businesses leverage Instagram for product discovery and sales'
      },
      [BusinessType.HYBRID]: {
        requiredProofMethod: 'SCREENSHOT_AI',
        additionalRequirements: [
          'User must screenshot their Instagram following list showing business account',
          'Business must have Instagram Business account connected',
          'Alternative: Automated verification via Instagram Graph API',
          '3-day reward delay to prevent unfollow fraud'
        ],
        explanation: 'Hybrid businesses use Instagram for both online and in-store promotions'
      }
    },
    
    availabilityReason: 'Instagram follow mission available to all business types. Builds social media following and brand awareness.'
  },
};

// ============================================================================
// HYBRID BUSINESS REQUIREMENTS
// ============================================================================

/**
 * HYBRID BUSINESS SPECIAL RULES
 * 
 * Hybrid businesses must activate at least one offline AND one online conversion mission.
 */

export interface HybridBusinessRequirements {
  requiresOfflineConversion: boolean;
  requiresOnlineConversion: boolean;
  offlineConversionMissions: string[];    // Eligible mission IDs
  onlineConversionMissions: string[];     // Eligible mission IDs
}

export const HYBRID_BUSINESS_REQUIREMENTS: HybridBusinessRequirements = {
  requiresOfflineConversion: true,
  requiresOnlineConversion: true,
  
  // Offline conversion missions (require physical presence)
  offlineConversionMissions: [
    'CONSULTATION_REQUEST',     // In-person consultation
    'REDEEM_OFFER',            // In-store QR redemption
    'FIRST_PURCHASE',          // In-store purchase
  ],
  
  // Online conversion missions (can be done remotely)
  onlineConversionMissions: [
    'CONSULTATION_REQUEST',     // Virtual consultation
    'REDEEM_OFFER',            // Online promo code
    'FIRST_PURCHASE',          // Online purchase
    'REFER_PAYING_CUSTOMER',   // Online referral
  ],
};

// ============================================================================
// VALIDATION LOGIC
// ============================================================================

export interface MissionAvailabilityError {
  code: string;
  message: string;
  missionId: string;
  businessType: BusinessType;
  suggestedFix?: string;
}

/**
 * VALIDATE MISSION AVAILABILITY FOR BUSINESS TYPE
 * 
 * Checks if a mission can be activated by a specific business type.
 */

export function validateMissionAvailability(
  missionId: string,
  businessType: BusinessType
): MissionAvailabilityError | null {
  
  const availability = MISSION_AVAILABILITY_MAP[missionId];
  
  if (!availability) {
    return {
      code: 'MISSION_NOT_FOUND',
      message: `Mission "${missionId}" not found in locked catalog.`,
      missionId,
      businessType,
    };
  }
  
  // Check if business type is forbidden
  if (availability.forbiddenBusinessTypes.includes(businessType)) {
    return {
      code: 'MISSION_FORBIDDEN_FOR_BUSINESS_TYPE',
      message: `Mission "${availability.missionName}" is not available for ${businessType} businesses. ${availability.availabilityReason}`,
      missionId,
      businessType,
      suggestedFix: getSuggestedAlternativeMission(missionId, businessType),
    };
  }
  
  // Check if business type is allowed
  if (!availability.allowedBusinessTypes.includes(businessType)) {
    return {
      code: 'MISSION_NOT_ALLOWED_FOR_BUSINESS_TYPE',
      message: `Mission "${availability.missionName}" is not available for ${businessType} businesses.`,
      missionId,
      businessType,
      suggestedFix: getSuggestedAlternativeMission(missionId, businessType),
    };
  }
  
  // Mission is available
  return null;
}

/**
 * VALIDATE HYBRID BUSINESS MISSION PORTFOLIO
 * 
 * Hybrid businesses must have at least one offline AND one online conversion mission.
 */

export function validateHybridBusinessPortfolio(
  activeMissionIds: string[]
): MissionAvailabilityError[] {
  
  const errors: MissionAvailabilityError[] = [];
  
  // Count offline and online conversion missions
  const offlineConversions = activeMissionIds.filter(id => 
    HYBRID_BUSINESS_REQUIREMENTS.offlineConversionMissions.includes(id)
  );
  
  const onlineConversions = activeMissionIds.filter(id => 
    HYBRID_BUSINESS_REQUIREMENTS.onlineConversionMissions.includes(id)
  );
  
  // Check offline requirement
  if (offlineConversions.length === 0) {
    errors.push({
      code: 'HYBRID_MISSING_OFFLINE_CONVERSION',
      message: 'Hybrid businesses must activate at least one offline conversion mission (in-store purchase, consultation, or offer redemption).',
      missionId: 'N/A',
      businessType: BusinessType.HYBRID,
      suggestedFix: 'Activate "First Purchase" (in-store), "Consultation Request" (in-person), or "Redeem Offer" (in-store) mission.',
    });
  }
  
  // Check online requirement
  if (onlineConversions.length === 0) {
    errors.push({
      code: 'HYBRID_MISSING_ONLINE_CONVERSION',
      message: 'Hybrid businesses must activate at least one online conversion mission (online purchase, virtual consultation, or online offer redemption).',
      missionId: 'N/A',
      businessType: BusinessType.HYBRID,
      suggestedFix: 'Activate "First Purchase" (online), "Consultation Request" (virtual), or "Redeem Offer" (online) mission.',
    });
  }
  
  return errors;
}

/**
 * GET PROOF METHOD ADJUSTMENTS FOR BUSINESS TYPE
 * 
 * Returns the required proof method and additional requirements for a mission + business type combo.
 */

export function getProofMethodAdjustments(
  missionId: string,
  businessType: BusinessType
): ProofMethodAdjustment | null {
  
  const availability = MISSION_AVAILABILITY_MAP[missionId];
  
  if (!availability) {
    return null;
  }
  
  return availability.proofAdjustments[businessType] || null;
}

/**
 * GET ALL AVAILABLE MISSIONS FOR BUSINESS TYPE
 * 
 * Returns list of mission IDs that are available for a specific business type.
 */

export function getAvailableMissionsForBusinessType(
  businessType: BusinessType
): string[] {
  
  return Object.keys(MISSION_AVAILABILITY_MAP).filter(missionId => {
    const availability = MISSION_AVAILABILITY_MAP[missionId];
    return availability.allowedBusinessTypes.includes(businessType) &&
           !availability.forbiddenBusinessTypes.includes(businessType);
  });
}

/**
 * GET SUGGESTED ALTERNATIVE MISSION
 * 
 * When a mission is unavailable, suggest similar alternative.
 */

function getSuggestedAlternativeMission(
  unavailableMissionId: string,
  businessType: BusinessType
): string {
  
  const alternatives: Record<string, Record<BusinessType, string>> = {
    'GOOGLE_REVIEW_PHOTOS': {
      [BusinessType.ONLINE]: 'Try "UGC Photo Upload" or "Instagram Post" mission instead. Google review photos require physical location.',
      [BusinessType.PHYSICAL]: '',
      [BusinessType.HYBRID]: '',
    },
    'VISIT_CHECKIN': {
      [BusinessType.ONLINE]: 'Try "First Purchase" or "Newsletter Signup" mission instead. Check-ins require physical location.',
      [BusinessType.PHYSICAL]: '',
      [BusinessType.HYBRID]: '',
    },
    'BRING_A_FRIEND': {
      [BusinessType.ONLINE]: 'Try "Refer a Paying Customer" mission instead. Bring-a-friend requires physical co-visit.',
      [BusinessType.PHYSICAL]: '',
      [BusinessType.HYBRID]: '',
    },
  };
  
  return alternatives[unavailableMissionId]?.[businessType] || 'Contact support for mission recommendations.';
}

/**
 * VALIDATE MISSION ACTIVATION (COMPLETE)
 * 
 * Full validation including business type restrictions.
 */

export function validateMissionActivationComplete(
  missionId: string,
  businessType: BusinessType,
  activeMissionIds: string[]
): MissionAvailabilityError[] {
  
  const errors: MissionAvailabilityError[] = [];
  
  // 1. Check if mission is available for business type
  const availabilityError = validateMissionAvailability(missionId, businessType);
  if (availabilityError) {
    errors.push(availabilityError);
    return errors; // Stop here if mission not available
  }
  
  // 2. If hybrid business, check portfolio requirements
  if (businessType === BusinessType.HYBRID) {
    const portfolioErrors = validateHybridBusinessPortfolio([...activeMissionIds, missionId]);
    errors.push(...portfolioErrors);
  }
  
  return errors;
}

// ============================================================================
// MISSION AVAILABILITY SUMMARY
// ============================================================================

/**
 * GET MISSION AVAILABILITY SUMMARY
 * 
 * Returns summary of mission availability across business types.
 */

export function getMissionAvailabilitySummary() {
  const summary = {
    totalMissions: Object.keys(MISSION_AVAILABILITY_MAP).length,
    physicalOnly: 0,
    onlineOnly: 0,
    hybridOnly: 0,
    allTypes: 0,
    byBusinessNeed: {
      REPUTATION: { physical: 0, online: 0, hybrid: 0 },
      TRAFFIC: { physical: 0, online: 0, hybrid: 0 },
      CONVERSION: { physical: 0, online: 0, hybrid: 0 },
      REFERRAL: { physical: 0, online: 0, hybrid: 0 },
      CONTENT: { physical: 0, online: 0, hybrid: 0 },
      LOYALTY: { physical: 0, online: 0, hybrid: 0 },
    },
  };
  
  Object.values(MISSION_AVAILABILITY_MAP).forEach(mission => {
    const allowed = mission.allowedBusinessTypes;
    
    if (allowed.length === 3) {
      summary.allTypes++;
    } else if (allowed.includes(BusinessType.PHYSICAL) && !allowed.includes(BusinessType.ONLINE)) {
      summary.physicalOnly++;
    } else if (allowed.includes(BusinessType.ONLINE) && !allowed.includes(BusinessType.PHYSICAL)) {
      summary.onlineOnly++;
    } else if (allowed.includes(BusinessType.HYBRID) && allowed.length === 1) {
      summary.hybridOnly++;
    }
  });
  
  return summary;
}

export const MISSION_AVAILABILITY_VERSION = '1.0.0';

