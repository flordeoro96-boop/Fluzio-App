/**
 * MISSION PARTICIPATION LIMITS FOR FLUZIO
 * 
 * Defines participation caps and cooldown periods for each mission type.
 * Protects businesses from reward budget exhaustion while preventing spam.
 * 
 * DESIGN PRINCIPLES:
 * 1. Google Reviews: Once per user per business (lifetime restriction)
 * 2. UGC Video: Quality over quantity - heavily capped
 * 3. Story Missions: Low reward = higher frequency allowed
 * 4. Conversion Missions: Limited by business budget capacity
 * 5. Referral Missions: No global cap, but per-user limits prevent abuse
 * 6. Check-ins: Daily frequency to drive repeat traffic
 * 
 * CAP HIERARCHY:
 * - Global Cap: Total participants across all users (budget protection)
 * - Daily Cap: Participants per day (prevents flash mobs)
 * - Per-User Cap: Times a single user can complete (prevents farming)
 * - Cooldown: Time between completions for same user (pacing)
 */

import type { BusinessNeed } from '../types/missionSystem';

// ============================================================================
// MISSION CAP CONFIGURATION
// ============================================================================

export interface MissionCapConfig {
  missionId: string;
  missionName: string;
  businessNeed: string;
  
  // GLOBAL LIMITS
  maxTotalParticipants: number | null;        // null = unlimited
  maxParticipantsPerDay: number | null;       // null = unlimited
  recommendedBudget: number;                  // Suggested total points budget
  
  // PER-USER LIMITS
  maxParticipationsPerUser: number | null;    // null = unlimited
  cooldownPeriod: number;                     // Days between completions
  isOneTimeOnly: boolean;                     // Can only complete once ever
  
  // QUALITY CONTROLS
  requiresUniqueProof: boolean;               // Proof must be unique (no resubmission)
  allowSimultaneousSubmissions: boolean;      // Multiple users can submit at once
  
  // EXPLANATION
  rationaleForCaps: string;
  exampleScenario: string;
}

// ============================================================================
// MISSION CAP MATRIX
// ============================================================================

export const MISSION_PARTICIPATION_LIMITS: Record<string, MissionCapConfig> = {
  
  // ==========================================================================
  // REPUTATION MISSIONS (2)
  // ==========================================================================
  
  'GOOGLE_REVIEW_TEXT': {
    missionId: 'GOOGLE_REVIEW_TEXT',
    missionName: 'Google Review (Text Only)',
    businessNeed: 'REPUTATION',
    
    // GLOBAL LIMITS
    maxTotalParticipants: 500,               // Cap at 500 total reviews
    maxParticipantsPerDay: 20,               // Max 20 reviews per day
    recommendedBudget: 25000,                // 500 users × 50 points = 25,000 points
    
    // PER-USER LIMITS
    maxParticipationsPerUser: 1,             // ONCE per user per business LIFETIME
    cooldownPeriod: 0,                       // No cooldown (already one-time only)
    isOneTimeOnly: true,                     // Strict one-time enforcement
    
    // QUALITY CONTROLS
    requiresUniqueProof: true,               // Each review must be unique
    allowSimultaneousSubmissions: true,      // Multiple users can review at once
    
    rationaleForCaps: 'Google ToS prohibit incentivized reviews, so we cap this heavily. One review per user per business LIFETIME prevents spam. Daily cap of 20 prevents sudden spikes that look suspicious to Google. Total cap of 500 ensures mission eventually closes (businesses should not run indefinitely).',
    
    exampleScenario: 'Coffee shop launches review mission with 50-point reward. Day 1: 18 reviews. Day 2: 20 reviews (hits daily cap). Day 25: Reaches 500 total reviews, mission auto-closes. Each user can only review once, even if they visit 100 times.'
  },
  
  'GOOGLE_REVIEW_PHOTOS': {
    missionId: 'GOOGLE_REVIEW_PHOTOS',
    missionName: 'Google Review with Photos',
    businessNeed: 'REPUTATION',
    
    // GLOBAL LIMITS
    maxTotalParticipants: 200,               // Lower cap than text (photos are premium)
    maxParticipantsPerDay: 10,               // Max 10 photo reviews per day
    recommendedBudget: 20000,                // 200 users × 100 points = 20,000 points
    
    // PER-USER LIMITS
    maxParticipationsPerUser: 1,             // ONCE per user per business LIFETIME
    cooldownPeriod: 0,
    isOneTimeOnly: true,
    
    // QUALITY CONTROLS
    requiresUniqueProof: true,               // Photos must be original
    allowSimultaneousSubmissions: true,
    
    rationaleForCaps: 'Photo reviews are higher value (100 points) and more impactful. Lower caps than text reviews. Daily cap of 10 prevents coordinated photo campaigns. Physical businesses only, so audience is naturally limited by location.',
    
    exampleScenario: 'Restaurant offers 100 points for photo reviews. Day 1: 8 reviews with food photos. Day 2: 10 reviews (hits daily cap, queue forms). Day 20: Reaches 200 total, mission closes. Each customer can only submit once.'
  },
  
  // ==========================================================================
  // TRAFFIC MISSIONS (1)
  // ==========================================================================
  
  'VISIT_CHECKIN': {
    missionId: 'VISIT_CHECKIN',
    missionName: 'Visit & Check-In',
    businessNeed: 'TRAFFIC',
    
    // GLOBAL LIMITS
    maxTotalParticipants: null,              // Unlimited total (encourages repeat visits)
    maxParticipantsPerDay: 100,              // Max 100 check-ins per day
    recommendedBudget: 15000,                // 100 users × 30 points × 5 days = 15,000/week
    
    // PER-USER LIMITS
    maxParticipationsPerUser: null,          // Unlimited (encourage repeat visits!)
    cooldownPeriod: 1,                       // 1 day between check-ins
    isOneTimeOnly: false,
    
    // QUALITY CONTROLS
    requiresUniqueProof: false,              // QR code can be scanned repeatedly
    allowSimultaneousSubmissions: true,      // Many customers at once is GOOD
    
    rationaleForCaps: 'Check-ins drive TRAFFIC, so we want unlimited repeat visits. Daily cooldown prevents user from checking in multiple times per day (fraud). Daily cap of 100 prevents flash mobs but allows steady traffic. No total cap because traffic missions should run indefinitely.',
    
    exampleScenario: 'Gym offers 30 points per check-in, max once per day. User Alice checks in Monday, earns 30 points. Tuesday: checks in again, earns another 30. Can continue indefinitely. Gym gets steady traffic tracking. If 100 people check in on grand opening day, mission pauses until next day.'
  },
  
  // ==========================================================================
  // CONVERSION MISSIONS (4)
  // ==========================================================================
  
  'CONSULTATION_REQUEST': {
    missionId: 'CONSULTATION_REQUEST',
    missionName: 'Request a Consultation',
    businessNeed: 'CONVERSION',
    
    // GLOBAL LIMITS
    maxTotalParticipants: 50,                // Limited by business capacity
    maxParticipantsPerDay: 5,                // Max 5 consultations per day
    recommendedBudget: 7500,                 // 50 users × 150 points = 7,500 points
    
    // PER-USER LIMITS
    maxParticipationsPerUser: 3,             // Up to 3 consultations per user
    cooldownPeriod: 30,                      // 30 days between consultations
    isOneTimeOnly: false,
    
    // QUALITY CONTROLS
    requiresUniqueProof: true,               // Each consultation is unique booking
    allowSimultaneousSubmissions: false,     // Consultations are scheduled, not instant
    
    rationaleForCaps: 'Consultations require business time (1-2 hours each). Daily cap of 5 prevents overwhelming schedule. Total cap of 50 ensures mission closes when capacity reached. User can book up to 3 times (initial + follow-ups) but must wait 30 days between.',
    
    exampleScenario: 'Law firm offers 150 points for free consultations. Day 1: 4 bookings. Day 2: 5 bookings (hits daily cap). Week 10: Reaches 50 total, mission closes. User Bob books consultation in January, another in March, and final in June (30-day spacing).'
  },
  
  'REDEEM_OFFER': {
    missionId: 'REDEEM_OFFER',
    missionName: 'Redeem Special Offer',
    businessNeed: 'CONVERSION',
    
    // GLOBAL LIMITS
    maxTotalParticipants: 1000,              // High cap for promotional offers
    maxParticipantsPerDay: 50,               // Max 50 redemptions per day
    recommendedBudget: 40000,                // 1000 users × 40 points = 40,000 points
    
    // PER-USER LIMITS
    maxParticipationsPerUser: 1,             // Once per user (one-time offer)
    cooldownPeriod: 0,
    isOneTimeOnly: true,
    
    // QUALITY CONTROLS
    requiresUniqueProof: true,               // QR code is single-use
    allowSimultaneousSubmissions: true,      // Many customers can redeem at once
    
    rationaleForCaps: 'Offers are promotional (e.g., "Buy 1 Get 1 Free"). Total cap of 1000 protects business budget. Daily cap of 50 prevents flash redemption. Each user gets one redemption only. QR codes are single-use to prevent sharing.',
    
    exampleScenario: 'Retail store offers "20% off + 40 points" promo. Day 1: 45 redemptions. Day 2: 50 (hits daily cap). Week 20: Reaches 1000 total, mission closes. Each customer can only redeem once (QR code burns after scan).'
  },
  
  'FIRST_PURCHASE': {
    missionId: 'FIRST_PURCHASE',
    missionName: 'Make Your First Purchase',
    businessNeed: 'CONVERSION',
    
    // GLOBAL LIMITS
    maxTotalParticipants: null,              // Unlimited (acquiring new customers is always good)
    maxParticipantsPerDay: null,             // Unlimited daily (more customers = better)
    recommendedBudget: 50000,                // Estimate 500 new customers × 100 points
    
    // PER-USER LIMITS
    maxParticipationsPerUser: 1,             // ONCE per user per business (first purchase only!)
    cooldownPeriod: 0,
    isOneTimeOnly: true,
    
    // QUALITY CONTROLS
    requiresUniqueProof: true,               // Each purchase is unique transaction
    allowSimultaneousSubmissions: true,      // Many customers can purchase at once
    
    rationaleForCaps: 'First purchase missions drive NEW customer acquisition. No global cap because more customers is always good. But each user can only complete ONCE per business (otherwise it is not "first" purchase). High reward (100 points) justified by customer lifetime value.',
    
    exampleScenario: 'E-commerce store offers 100 points for first purchase. User Alice buys shoes, earns 100 points. Week later, Alice buys dress - no reward (not first purchase). Bob makes his first purchase, earns 100 points. Mission runs indefinitely, always acquiring new customers.'
  },
  
  'REFER_PAYING_CUSTOMER': {
    missionId: 'REFER_PAYING_CUSTOMER',
    missionName: 'Refer a Paying Customer',
    businessNeed: 'REFERRAL',
    
    // GLOBAL LIMITS
    maxTotalParticipants: null,              // Unlimited (referrals are free marketing!)
    maxParticipantsPerDay: null,             // Unlimited daily
    recommendedBudget: 100000,               // High budget (referrals pay for themselves)
    
    // PER-USER LIMITS
    maxParticipationsPerUser: null,          // Unlimited per user (BUT user level caps apply)
    cooldownPeriod: 14,                      // 14 days between referrals (anti-fraud)
    isOneTimeOnly: false,
    
    // QUALITY CONTROLS
    requiresUniqueProof: true,               // Each referred customer must be unique person
    allowSimultaneousSubmissions: true,      // Users can refer multiple friends
    
    rationaleForCaps: 'Referrals have NO global cap because each referred customer brings revenue. Per-user limit is handled by user level system (Contributor: 3/month, Trusted: 5/month, etc.). 14-day cooldown prevents rapid self-referral fraud. High reward (200 points) justified by customer acquisition cost.',
    
    exampleScenario: 'Restaurant offers 200 points per paying referral. User Alice (Contributor level) refers friend Bob in January, earns 200 points. February: refers Carol, earns 200. March: refers Dave, earns 200. Hits 3/month limit (Contributor cap). Must wait 14 days between each referral. No global cap - restaurant wants unlimited referrals!'
  },
  
  // ==========================================================================
  // REFERRAL MISSIONS (1)
  // ==========================================================================
  
  'BRING_A_FRIEND': {
    missionId: 'BRING_A_FRIEND',
    missionName: 'Bring a Friend to Visit',
    businessNeed: 'REFERRAL',
    
    // GLOBAL LIMITS
    maxTotalParticipants: null,              // Unlimited (more traffic is always good)
    maxParticipantsPerDay: 50,               // Max 50 friend visits per day
    recommendedBudget: 30000,                // Estimate 300 referrals × 100 points
    
    // PER-USER LIMITS
    maxParticipationsPerUser: 10,            // Up to 10 friend visits per user
    cooldownPeriod: 7,                       // 7 days between friend visits
    isOneTimeOnly: false,
    
    // QUALITY CONTROLS
    requiresUniqueProof: true,               // Each friend must be unique (first-time visitor)
    allowSimultaneousSubmissions: true,      // Users can bring friends simultaneously
    
    rationaleForCaps: 'Encourages bringing NEW friends to physical location. No global cap (traffic is good), but daily cap of 50 prevents flash mob events. Per-user cap of 10 prevents abuse (user cannot bring 100 friends). 7-day cooldown ensures spacing. Friend must be first-time visitor (GPS/QR verifies).',
    
    exampleScenario: 'Cafe offers 100 points for bringing first-time friend. User Alice brings friend Emma (Emma first visit), both check in via GPS. Alice earns 100 points. Week later, Alice brings friend Frank. Earns another 100. Can do this 10 times total. Friend must be genuinely new (system checks Emma/Frank have never visited before).'
  },
  
  // ==========================================================================
  // CONTENT MISSIONS (4)
  // ==========================================================================
  
  'UGC_PHOTO_UPLOAD': {
    missionId: 'UGC_PHOTO_UPLOAD',
    missionName: 'Share a Photo',
    businessNeed: 'CONTENT',
    
    // GLOBAL LIMITS
    maxTotalParticipants: 500,               // Cap at 500 photos (quality > quantity)
    maxParticipantsPerDay: 20,               // Max 20 photos per day
    recommendedBudget: 30000,                // 500 users × 60 points = 30,000 points
    
    // PER-USER LIMITS
    maxParticipationsPerUser: 5,             // Up to 5 photos per user
    cooldownPeriod: 7,                       // 7 days between photo submissions
    isOneTimeOnly: false,
    
    // QUALITY CONTROLS
    requiresUniqueProof: true,               // Each photo must be unique (EXIF check)
    allowSimultaneousSubmissions: true,      // Multiple users can upload at once
    
    rationaleForCaps: 'Photos generate marketing content. Total cap of 500 ensures quality over spam. Daily cap of 20 prevents flood. Per-user cap of 5 ensures variety (not all photos from one person). 7-day cooldown prevents rapid-fire uploads. Business manually approves each photo for quality.',
    
    exampleScenario: 'Hotel offers 60 points per photo. User Alice uploads beautiful sunset photo, earns 60 points. Week later, uploads pool photo, earns 60. Can submit 5 photos total. Day 25: Mission reaches 500 photos, closes. Hotel now has diverse photo library from 100-500 different guests.'
  },
  
  'UGC_VIDEO_UPLOAD': {
    missionId: 'UGC_VIDEO_UPLOAD',
    missionName: 'Share a Video',
    businessNeed: 'CONTENT',
    
    // GLOBAL LIMITS
    maxTotalParticipants: 100,               // HEAVILY CAPPED (videos are premium, quality matters)
    maxParticipantsPerDay: 5,                // Max 5 videos per day
    recommendedBudget: 15000,                // 100 users × 150 points = 15,000 points
    
    // PER-USER LIMITS
    maxParticipationsPerUser: 2,             // Only 2 videos per user (ensure diversity)
    cooldownPeriod: 30,                      // 30 days between video submissions
    isOneTimeOnly: false,
    
    // QUALITY CONTROLS
    requiresUniqueProof: true,               // Each video must be unique
    allowSimultaneousSubmissions: false,     // Videos require manual review (not instant)
    
    rationaleForCaps: 'Videos are PREMIUM content. Total cap of 100 ensures only high-quality videos accepted. Daily cap of 5 allows business to review carefully. Per-user cap of 2 ensures diverse creators (not one person making 50 videos). 30-day cooldown prevents spam. High reward (150 points) justified by video value.',
    
    exampleScenario: 'Adventure park offers 150 points per video. Day 1: 3 videos submitted (zip-lining, rock climbing, etc.). Day 2: 5 videos (hits daily cap). Week 20: Reaches 100 total videos. Mission closes. User Alice submitted 2 videos (max per user). Park now has 100 diverse, high-quality promotional videos from 50-100 creators.'
  },
  
  'STORY_POST_TAG': {
    missionId: 'STORY_POST_TAG',
    missionName: 'Tag Us in Instagram Story',
    businessNeed: 'CONTENT',
    
    // GLOBAL LIMITS
    maxTotalParticipants: null,              // Unlimited (stories are ephemeral, low commitment)
    maxParticipantsPerDay: 100,              // Max 100 stories per day
    recommendedBudget: 15000,                // Estimate 500 stories × 30 points
    
    // PER-USER LIMITS
    maxParticipationsPerUser: null,          // Unlimited per user (encourage frequent tagging)
    cooldownPeriod: 3,                       // 3 days between story posts
    isOneTimeOnly: false,
    
    // QUALITY CONTROLS
    requiresUniqueProof: true,               // Each story must be unique screenshot
    allowSimultaneousSubmissions: true,      // Many users can post stories at once
    
    rationaleForCaps: 'Stories are LOW-EFFORT, LOW-REWARD (30 points). No total cap because stories expire in 24hrs (ephemeral content). Daily cap of 100 prevents spam. Per-user unlimited but 3-day cooldown prevents daily spam. Encourages authentic, frequent social sharing.',
    
    exampleScenario: 'Clothing store offers 30 points per story tag. User Alice posts story wearing new dress, tags store, earns 30 points. 3 days later, posts another story with shoes, earns 30. Can continue indefinitely with 3-day spacing. Business gets frequent social media exposure. No total cap because stories disappear anyway.'
  },
  
  'FEED_REEL_POST_TAG': {
    missionId: 'FEED_REEL_POST_TAG',
    missionName: 'Tag Us in Feed/Reel Post',
    businessNeed: 'CONTENT',
    
    // GLOBAL LIMITS
    maxTotalParticipants: 1000,              // Cap at 1000 permanent posts
    maxParticipantsPerDay: 30,               // Max 30 posts per day
    recommendedBudget: 50000,                // 1000 users × 50 points = 50,000 points
    
    // PER-USER LIMITS
    maxParticipationsPerUser: 10,            // Up to 10 posts per user
    cooldownPeriod: 14,                      // 14 days between posts (prevent spam)
    isOneTimeOnly: false,
    
    // QUALITY CONTROLS
    requiresUniqueProof: true,               // Each post must be unique
    allowSimultaneousSubmissions: true,      // Multiple users can post at once
    
    rationaleForCaps: 'Feed/Reel posts are PERMANENT content (unlike stories). Total cap of 1000 ensures quality library. Daily cap of 30 manages review queue. Per-user cap of 10 ensures diversity. 14-day cooldown prevents spam (posts should be genuine, not daily grind). 14-day reward delay allows detection of deleted posts.',
    
    exampleScenario: 'Beauty salon offers 50 points per Instagram post. User Alice posts before/after haircut photo, earns 50 points (after 14-day delay). Two weeks later, posts makeup look, earns 50. Can post 10 times total. Day 33: Mission reaches 1000 posts, closes. Salon has diverse permanent content library from 100-1000 customers.'
  },
  
  // ==========================================================================
  // LOYALTY MISSIONS (2)
  // ==========================================================================
  
  'REPEAT_PURCHASE_VISIT': {
    missionId: 'REPEAT_PURCHASE_VISIT',
    missionName: 'Make a Repeat Purchase/Visit',
    businessNeed: 'LOYALTY',
    
    // GLOBAL LIMITS
    maxTotalParticipants: null,              // Unlimited (loyalty missions should run indefinitely)
    maxParticipantsPerDay: null,             // Unlimited daily (more purchases = better)
    recommendedBudget: 100000,               // High budget (repeat customers are valuable)
    
    // PER-USER LIMITS
    maxParticipationsPerUser: null,          // Unlimited (encourage infinite repeat purchases!)
    cooldownPeriod: 7,                       // 7 days between repeat purchases
    isOneTimeOnly: false,
    
    // QUALITY CONTROLS
    requiresUniqueProof: true,               // Each purchase is unique transaction
    allowSimultaneousSubmissions: true,      // Many customers can purchase at once
    
    rationaleForCaps: 'Repeat purchase missions reward LOYALTY. No caps because business wants unlimited repeat purchases. 7-day cooldown prevents daily grinding (must wait week between purchases). High reward (100 points) maintains customer lifetime value. Triggers on 2nd+ purchase (after First Purchase mission).',
    
    exampleScenario: 'Subscription box service offers 100 points per repeat purchase. User Alice makes first purchase (earns First Purchase reward). 10 days later, makes 2nd purchase (earns Repeat Purchase reward). 10 days later, makes 3rd purchase (earns another Repeat reward). Can continue indefinitely. Business loves repeat customers!'
  },
  
  'INSTAGRAM_FOLLOW': {
    missionId: 'INSTAGRAM_FOLLOW',
    missionName: 'Follow on Instagram',
    businessNeed: 'CONTENT',
    
    // GLOBAL LIMITS
    maxTotalParticipants: null,              // Unlimited (building follower base)
    maxParticipantsPerDay: null,             // Unlimited daily
    recommendedBudget: 5000,                 // Estimate 100 follows × 50 points
    
    // PER-USER LIMITS
    maxParticipationsPerUser: 1,             // ONCE per user per business
    cooldownPeriod: 0,
    isOneTimeOnly: true,
    
    // QUALITY CONTROLS
    requiresUniqueProof: true,               // Screenshot or API verification
    allowSimultaneousSubmissions: true,      // Many users can follow at once
    
    rationaleForCaps: 'Instagram follow is SOCIAL GROWTH. No global cap because more followers = more reach. Each user can only follow once per business. Moderate reward (50 points) for social action. 3-day delay prevents unfollow fraud.',
    
    exampleScenario: 'Coffee shop offers 50 points for Instagram follow. User Alice follows @coffeeshop, screenshots following list, submits proof. AI verifies. 3 days later, Alice gets 50 points. Cannot do this mission again for same business. Business gains organic follower.'
  }
};

// ============================================================================
// DEFAULT VALUES & RECOMMENDATIONS
// ============================================================================

/**
 * DEFAULT MISSION CAPS
 * 
 * Applied when business does not specify custom limits.
 * Conservative defaults to prevent budget exhaustion.
 */
export const DEFAULT_MISSION_CAPS = {
  // One-time missions (reviews, first purchase)
  ONE_TIME: {
    maxTotalParticipants: 500,
    maxParticipantsPerDay: 20,
    maxParticipationsPerUser: 1,
    cooldownPeriod: 0
  },
  
  // Repeat missions (check-ins, repeat purchase)
  REPEAT: {
    maxTotalParticipants: null,              // Unlimited
    maxParticipantsPerDay: 100,
    maxParticipationsPerUser: null,          // Unlimited
    cooldownPeriod: 7                        // Weekly
  },
  
  // Limited repeat (UGC, referrals)
  LIMITED_REPEAT: {
    maxTotalParticipants: 500,
    maxParticipantsPerDay: 20,
    maxParticipationsPerUser: 5,
    cooldownPeriod: 7
  },
  
  // High-value missions (consultations, purchases)
  HIGH_VALUE: {
    maxTotalParticipants: 100,
    maxParticipantsPerDay: 10,
    maxParticipationsPerUser: 3,
    cooldownPeriod: 30
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * GET MISSION CAP CONFIG
 */
export function getMissionCapConfig(missionId: string): MissionCapConfig {
  return MISSION_PARTICIPATION_LIMITS[missionId];
}

/**
 * CALCULATE ESTIMATED BUDGET
 * 
 * Helps businesses estimate total points cost for mission.
 */
export function calculateEstimatedBudget(
  missionId: string,
  rewardPoints: number,
  customMaxParticipants?: number
): {
  estimatedCost: number;
  dailyCost: number;
  weeklyCost: number;
  monthlyCost: number;
} {
  
  const config = getMissionCapConfig(missionId);
  const maxParticipants = customMaxParticipants || config.maxTotalParticipants || 1000;
  const maxPerDay = config.maxParticipantsPerDay || 50;
  
  const estimatedCost = maxParticipants * rewardPoints;
  const dailyCost = maxPerDay * rewardPoints;
  const weeklyCost = dailyCost * 7;
  const monthlyCost = dailyCost * 30;
  
  return {
    estimatedCost,
    dailyCost,
    weeklyCost,
    monthlyCost
  };
}

/**
 * VALIDATE USER CAN PARTICIPATE
 * 
 * Checks if user has exceeded per-user caps or cooldown.
 */
export interface ParticipationValidation {
  canParticipate: boolean;
  reason?: string;
  cooldownEnds?: Date;
  participationsRemaining?: number;
}

export function validateUserCanParticipate(
  missionId: string,
  userCompletionCount: number,
  lastCompletionDate: Date | null
): ParticipationValidation {
  
  const config = getMissionCapConfig(missionId);
  
  // Check per-user cap
  if (config.maxParticipationsPerUser !== null && 
      userCompletionCount >= config.maxParticipationsPerUser) {
    return {
      canParticipate: false,
      reason: `You have reached the maximum participation limit (${config.maxParticipationsPerUser} times).`,
      participationsRemaining: 0
    };
  }
  
  // Check cooldown
  if (lastCompletionDate && config.cooldownPeriod > 0) {
    const daysSinceCompletion = Math.floor(
      (Date.now() - lastCompletionDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceCompletion < config.cooldownPeriod) {
      const cooldownEnds = new Date(lastCompletionDate);
      cooldownEnds.setDate(cooldownEnds.getDate() + config.cooldownPeriod);
      
      const daysRemaining = config.cooldownPeriod - daysSinceCompletion;
      
      return {
        canParticipate: false,
        reason: `You must wait ${daysRemaining} more day(s) before participating again.`,
        cooldownEnds
      };
    }
  }
  
  // Check one-time restriction
  if (config.isOneTimeOnly && userCompletionCount > 0) {
    return {
      canParticipate: false,
      reason: 'This mission can only be completed once.',
      participationsRemaining: 0
    };
  }
  
  // Calculate remaining participations
  const remaining = config.maxParticipationsPerUser !== null
    ? config.maxParticipationsPerUser - userCompletionCount
    : null; // Unlimited
  
  return {
    canParticipate: true,
    participationsRemaining: remaining !== null ? remaining : undefined
  };
}

/**
 * CHECK IF MISSION HAS REACHED GLOBAL CAP
 * 
 * Validates if mission should accept more participants.
 */
export function hasMissionReachedCap(
  missionId: string,
  currentTotalParticipants: number,
  todayParticipants: number
): {
  canAcceptMore: boolean;
  reason?: string;
  spaceRemaining?: number;
} {
  
  const config = getMissionCapConfig(missionId);
  
  // Check total cap
  if (config.maxTotalParticipants !== null && 
      currentTotalParticipants >= config.maxTotalParticipants) {
    return {
      canAcceptMore: false,
      reason: `Mission has reached maximum capacity (${config.maxTotalParticipants} participants).`,
      spaceRemaining: 0
    };
  }
  
  // Check daily cap
  if (config.maxParticipantsPerDay !== null && 
      todayParticipants >= config.maxParticipantsPerDay) {
    return {
      canAcceptMore: false,
      reason: `Daily participation limit reached (${config.maxParticipantsPerDay}). Try again tomorrow.`,
      spaceRemaining: 0
    };
  }
  
  // Calculate space remaining
  const totalRemaining = config.maxTotalParticipants !== null
    ? config.maxTotalParticipants - currentTotalParticipants
    : null; // Unlimited
  
  const dailyRemaining = config.maxParticipantsPerDay !== null
    ? config.maxParticipantsPerDay - todayParticipants
    : null; // Unlimited
  
  const spaceRemaining = totalRemaining !== null && dailyRemaining !== null
    ? Math.min(totalRemaining, dailyRemaining)
    : totalRemaining || dailyRemaining || null;
  
  return {
    canAcceptMore: true,
    spaceRemaining: spaceRemaining !== null ? spaceRemaining : undefined
  };
}

/**
 * GET RECOMMENDED CAPS FOR BUSINESS TYPE & BUDGET
 * 
 * Suggests appropriate caps based on business size and budget.
 */
export function getRecommendedCaps(
  businessSize: 'SMALL' | 'MEDIUM' | 'LARGE',
  monthlyBudget: number  // Points per month
): {
  maxTotalParticipants: number;
  maxParticipantsPerDay: number;
  recommendedReward: number;
} {
  
  switch (businessSize) {
    case 'SMALL':
      // Small business: Conservative caps
      return {
        maxTotalParticipants: 100,
        maxParticipantsPerDay: 5,
        recommendedReward: Math.floor(monthlyBudget / 100)  // Spread budget over 100 users
      };
      
    case 'MEDIUM':
      // Medium business: Moderate caps
      return {
        maxTotalParticipants: 500,
        maxParticipantsPerDay: 20,
        recommendedReward: Math.floor(monthlyBudget / 500)
      };
      
    case 'LARGE':
      // Large business: Generous caps
      return {
        maxTotalParticipants: 2000,
        maxParticipantsPerDay: 100,
        recommendedReward: Math.floor(monthlyBudget / 2000)
      };
      
    default:
      return {
        maxTotalParticipants: 500,
        maxParticipantsPerDay: 20,
        recommendedReward: 50
      };
  }
}

export const MISSION_PARTICIPATION_LIMITS_VERSION = '1.0.0';
