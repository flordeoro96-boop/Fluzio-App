/**
 * MISSION PROOF METHOD MATRIX FOR FLUZIO
 * 
 * Defines primary, fallback, and forbidden proof methods for each mission
 * across all three business types (physical, online, hybrid).
 * 
 * CORE PRINCIPLES:
 * 1. Physical missions prefer QR > GPS (QR is more secure, GPS can be spoofed)
 * 2. Online missions prefer webhooks > screenshots (webhooks are cryptographic)
 * 3. Screenshots are NEVER the only proof for money/trust missions
 * 4. AI verification is always secondary, never primary (AI can be fooled)
 * 5. High-value missions require cryptographic or manual verification
 */

import type { ProofMethod } from '../types/missionSystem';
import { BusinessType } from './missionAvailabilityByBusinessType';

// ============================================================================
// PROOF METHOD CONFIGURATION
// ============================================================================

export interface ProofMethodConfig {
  primaryProofMethod: ProofMethod;
  fallbackProofMethod?: ProofMethod;
  forbiddenProofMethods: ProofMethod[];
  requiresBusinessConfirmation: boolean;
  reasonForPrimary: string;
  reasonForFallback?: string;
  reasonsForForbidden: string[];
}

export interface MissionProofMatrix {
  missionId: string;
  missionName: string;
  
  // Proof methods by business type
  physical?: ProofMethodConfig;
  online?: ProofMethodConfig;
  hybrid?: ProofMethodConfig;
}

// ============================================================================
// PROOF METHOD MATRIX
// ============================================================================

export const MISSION_PROOF_METHOD_MATRIX: Record<string, MissionProofMatrix> = {
  
  // ==========================================================================
  // REPUTATION MISSIONS (2)
  // ==========================================================================
  
  'GOOGLE_REVIEW_TEXT': {
    missionId: 'GOOGLE_REVIEW_TEXT',
    missionName: 'Google Review (Text Only)',
    
    physical: {
      primaryProofMethod: 'SCREENSHOT_AI',
      fallbackProofMethod: 'FORM_SUBMISSION',
      forbiddenProofMethods: ['QR_SCAN', 'GPS_CHECKIN', 'WEBHOOK', 'REFERRAL_LINK'],
      requiresBusinessConfirmation: true,
      reasonForPrimary: 'Screenshot allows AI to verify review exists on Google. AI checks for business name, location mention, and freshness (must be <48hrs old).',
      reasonForFallback: 'If screenshot fails (e.g., private review), user can submit review link via form for manual verification.',
      reasonsForForbidden: [
        'QR_SCAN: Google reviews are posted online, not scanned in-store',
        'GPS_CHECKIN: Review can be posted from anywhere, location irrelevant',
        'WEBHOOK: Google does not provide review webhooks',
        'REFERRAL_LINK: Not applicable to reviews'
      ]
    },
    
    online: {
      primaryProofMethod: 'SCREENSHOT_AI',
      fallbackProofMethod: 'FORM_SUBMISSION',
      forbiddenProofMethods: ['QR_SCAN', 'GPS_CHECKIN', 'WEBHOOK', 'REFERRAL_LINK'],
      requiresBusinessConfirmation: true,
      reasonForPrimary: 'Screenshot with AI verification. AI checks review mentions online product/service, not physical location.',
      reasonForFallback: 'Manual submission of review URL if screenshot rejected.',
      reasonsForForbidden: [
        'QR_SCAN: Online businesses have no physical location for QR',
        'GPS_CHECKIN: No physical location to verify',
        'WEBHOOK: Google does not provide review webhooks',
        'REFERRAL_LINK: Not applicable'
      ]
    },
    
    hybrid: {
      primaryProofMethod: 'SCREENSHOT_AI',
      fallbackProofMethod: 'FORM_SUBMISSION',
      forbiddenProofMethods: ['QR_SCAN', 'GPS_CHECKIN', 'WEBHOOK', 'REFERRAL_LINK'],
      requiresBusinessConfirmation: true,
      reasonForPrimary: 'Screenshot with AI. Accepts reviews mentioning either physical location OR online service.',
      reasonForFallback: 'Manual URL submission for verification.',
      reasonsForForbidden: [
        'QR_SCAN: Reviews are online, not in-store activity',
        'GPS_CHECKIN: Review location is irrelevant',
        'WEBHOOK: No API available',
        'REFERRAL_LINK: Not applicable'
      ]
    }
  },
  
  'GOOGLE_REVIEW_PHOTOS': {
    missionId: 'GOOGLE_REVIEW_PHOTOS',
    missionName: 'Google Review with Photos',
    
    physical: {
      primaryProofMethod: 'SCREENSHOT_AI',
      fallbackProofMethod: undefined, // No fallback - photos required
      forbiddenProofMethods: ['QR_SCAN', 'GPS_CHECKIN', 'WEBHOOK', 'REFERRAL_LINK', 'FORM_SUBMISSION'],
      requiresBusinessConfirmation: true,
      reasonForPrimary: 'Screenshot must show review WITH attached photos. AI verifies: (1) Photos show physical location/interior, (2) Photos are original (EXIF check), (3) Review is recent.',
      reasonsForForbidden: [
        'QR_SCAN: Cannot verify photo content via QR',
        'GPS_CHECKIN: Location check insufficient, need to verify photos',
        'WEBHOOK: No API available',
        'REFERRAL_LINK: Not applicable',
        'FORM_SUBMISSION: Must see actual photos, not just description'
      ]
    },
    
    online: undefined, // Online businesses cannot use this mission
    
    hybrid: {
      primaryProofMethod: 'SCREENSHOT_AI',
      fallbackProofMethod: undefined,
      forbiddenProofMethods: ['QR_SCAN', 'GPS_CHECKIN', 'WEBHOOK', 'REFERRAL_LINK', 'FORM_SUBMISSION'],
      requiresBusinessConfirmation: true,
      reasonForPrimary: 'Screenshot with AI. Photos must show PHYSICAL location only (not online products). AI verifies location authenticity.',
      reasonsForForbidden: [
        'QR_SCAN: Cannot verify photo content',
        'GPS_CHECKIN: Need to see photos, not just location',
        'WEBHOOK: No API',
        'REFERRAL_LINK: Not applicable',
        'FORM_SUBMISSION: Visual verification required'
      ]
    }
  },
  
  // ==========================================================================
  // TRAFFIC MISSIONS (1)
  // ==========================================================================
  
  'VISIT_CHECKIN': {
    missionId: 'VISIT_CHECKIN',
    missionName: 'Visit & Check-In',
    
    physical: {
      primaryProofMethod: 'QR_SCAN',
      fallbackProofMethod: 'GPS_CHECKIN',
      forbiddenProofMethods: ['WEBHOOK', 'SCREENSHOT_AI', 'FORM_SUBMISSION', 'REFERRAL_LINK'],
      requiresBusinessConfirmation: false, // QR is cryptographically secure
      reasonForPrimary: 'QR scan is most secure. Business generates unique QR code, customer scans in-store. Includes signature + GPS verification. Prevents screenshot fraud.',
      reasonForFallback: 'GPS check-in with geofence (100m radius) + minimum dwell time (60s) + accelerometer data. Used if business has no QR code displayed.',
      reasonsForForbidden: [
        'WEBHOOK: Check-ins are not transactional, no webhook trigger',
        'SCREENSHOT_AI: Easily faked, screenshots can be shared/reused',
        'FORM_SUBMISSION: No way to verify actual presence',
        'REFERRAL_LINK: Not applicable to check-ins'
      ]
    },
    
    online: undefined, // Online businesses have no physical location
    
    hybrid: {
      primaryProofMethod: 'QR_SCAN',
      fallbackProofMethod: 'GPS_CHECKIN',
      forbiddenProofMethods: ['WEBHOOK', 'SCREENSHOT_AI', 'FORM_SUBMISSION', 'REFERRAL_LINK'],
      requiresBusinessConfirmation: false,
      reasonForPrimary: 'QR at PHYSICAL location only. Cannot check-in to website.',
      reasonForFallback: 'GPS at physical store location.',
      reasonsForForbidden: [
        'WEBHOOK: Not applicable to physical check-ins',
        'SCREENSHOT_AI: Too easy to fake',
        'FORM_SUBMISSION: Cannot verify presence',
        'REFERRAL_LINK: Not a check-in mechanism'
      ]
    }
  },
  
  // ==========================================================================
  // CONVERSION MISSIONS (4)
  // ==========================================================================
  
  'CONSULTATION_REQUEST': {
    missionId: 'CONSULTATION_REQUEST',
    missionName: 'Request a Consultation',
    
    physical: {
      primaryProofMethod: 'WEBHOOK',
      fallbackProofMethod: 'FORM_SUBMISSION',
      forbiddenProofMethods: ['QR_SCAN', 'GPS_CHECKIN', 'SCREENSHOT_AI', 'REFERRAL_LINK'],
      requiresBusinessConfirmation: true,
      reasonForPrimary: 'Webhook from booking system (Calendly, Acuity, etc.) confirms appointment booked. Includes date, time, customer info. Reward releases AFTER appointment completed.',
      reasonForFallback: 'If no booking system, manual form submission reviewed by business.',
      reasonsForForbidden: [
        'QR_SCAN: Consultation booking is not an in-store QR activity',
        'GPS_CHECKIN: Booking can happen remotely, location irrelevant',
        'SCREENSHOT_AI: Booking confirmations easily faked (Photoshop)',
        'REFERRAL_LINK: Not a referral, direct consultation request'
      ]
    },
    
    online: {
      primaryProofMethod: 'WEBHOOK',
      fallbackProofMethod: 'FORM_SUBMISSION',
      forbiddenProofMethods: ['QR_SCAN', 'GPS_CHECKIN', 'SCREENSHOT_AI', 'REFERRAL_LINK'],
      requiresBusinessConfirmation: true,
      reasonForPrimary: 'Webhook from virtual booking system. Confirms video call/phone consultation scheduled.',
      reasonForFallback: 'Manual form if no booking integration.',
      reasonsForForbidden: [
        'QR_SCAN: No physical location',
        'GPS_CHECKIN: Virtual consultations have no location',
        'SCREENSHOT_AI: Booking emails easily faked',
        'REFERRAL_LINK: Not applicable'
      ]
    },
    
    hybrid: {
      primaryProofMethod: 'WEBHOOK',
      fallbackProofMethod: 'FORM_SUBMISSION',
      forbiddenProofMethods: ['QR_SCAN', 'GPS_CHECKIN', 'SCREENSHOT_AI', 'REFERRAL_LINK'],
      requiresBusinessConfirmation: true,
      reasonForPrimary: 'Webhook accepts both in-person and virtual bookings. Webhook payload specifies type.',
      reasonForFallback: 'Manual form submission.',
      reasonsForForbidden: [
        'QR_SCAN: Booking is online activity, not in-store',
        'GPS_CHECKIN: Booking location is irrelevant',
        'SCREENSHOT_AI: Too easily manipulated',
        'REFERRAL_LINK: Direct booking, not referral'
      ]
    }
  },
  
  'REDEEM_OFFER': {
    missionId: 'REDEEM_OFFER',
    missionName: 'Redeem Special Offer',
    
    physical: {
      primaryProofMethod: 'QR_SCAN',
      fallbackProofMethod: undefined, // No fallback - must prevent screenshot fraud
      forbiddenProofMethods: ['GPS_CHECKIN', 'WEBHOOK', 'SCREENSHOT_AI', 'FORM_SUBMISSION', 'REFERRAL_LINK'],
      requiresBusinessConfirmation: false, // QR is self-verifying
      reasonForPrimary: 'QR scan is ONLY secure method. Business staff scans customer unique code at POS. Code is single-use, time-limited, GPS-verified. Prevents screenshots being shared or reused.',
      reasonsForForbidden: [
        'GPS_CHECKIN: Cannot verify offer was actually redeemed, only that customer was present',
        'WEBHOOK: In-store redemptions do not trigger webhooks (no e-commerce transaction)',
        'SCREENSHOT_AI: CRITICAL - Screenshots can be shared/reused by multiple people. QR must be scanned to mark as used.',
        'FORM_SUBMISSION: No way to verify redemption occurred',
        'REFERRAL_LINK: Not applicable to offers'
      ]
    },
    
    online: {
      primaryProofMethod: 'WEBHOOK',
      fallbackProofMethod: undefined,
      forbiddenProofMethods: ['QR_SCAN', 'GPS_CHECKIN', 'SCREENSHOT_AI', 'FORM_SUBMISSION', 'REFERRAL_LINK'],
      requiresBusinessConfirmation: false, // Webhook is cryptographic
      reasonForPrimary: 'Webhook from e-commerce system verifies promo code applied during checkout. Confirms order completed with discount.',
      reasonsForForbidden: [
        'QR_SCAN: No physical location to scan',
        'GPS_CHECKIN: Online redemption has no location',
        'SCREENSHOT_AI: Checkout screens easily faked, cannot verify promo was actually applied',
        'FORM_SUBMISSION: User could claim redemption without actually purchasing',
        'REFERRAL_LINK: Promo codes are not referral links'
      ]
    },
    
    hybrid: {
      primaryProofMethod: 'QR_SCAN', // For in-store offers
      fallbackProofMethod: 'WEBHOOK',  // For online offers
      forbiddenProofMethods: ['GPS_CHECKIN', 'SCREENSHOT_AI', 'FORM_SUBMISSION', 'REFERRAL_LINK'],
      requiresBusinessConfirmation: false,
      reasonForPrimary: 'QR for in-store offers (scanned at POS).',
      reasonForFallback: 'Webhook for online promo code redemptions.',
      reasonsForForbidden: [
        'GPS_CHECKIN: Cannot verify redemption, only presence',
        'SCREENSHOT_AI: High fraud risk, offers can be shared',
        'FORM_SUBMISSION: Cannot verify actual redemption',
        'REFERRAL_LINK: Not applicable'
      ]
    }
  },
  
  'FIRST_PURCHASE': {
    missionId: 'FIRST_PURCHASE',
    missionName: 'Make Your First Purchase',
    
    physical: {
      primaryProofMethod: 'WEBHOOK',
      fallbackProofMethod: undefined, // No fallback for money missions
      forbiddenProofMethods: ['QR_SCAN', 'GPS_CHECKIN', 'SCREENSHOT_AI', 'FORM_SUBMISSION', 'REFERRAL_LINK'],
      requiresBusinessConfirmation: false, // Webhook is authoritative
      reasonForPrimary: 'POS system webhook confirms purchase. Includes order ID, amount, payment method, timestamp. Cryptographically signed. 7-day delay for refund protection. SCREENSHOTS FORBIDDEN - receipts easily faked in Photoshop.',
      reasonsForForbidden: [
        'QR_SCAN: Purchase verification needs transaction data, not just presence',
        'GPS_CHECKIN: Being in store does not equal making purchase',
        'SCREENSHOT_AI: CRITICAL - Receipt screenshots trivially faked. Photoshop can create pixel-perfect fake receipts in 5 minutes. NEVER trust screenshots for money.',
        'FORM_SUBMISSION: User could claim purchase without proof',
        'REFERRAL_LINK: Not a referral, direct purchase'
      ]
    },
    
    online: {
      primaryProofMethod: 'WEBHOOK',
      fallbackProofMethod: undefined,
      forbiddenProofMethods: ['QR_SCAN', 'GPS_CHECKIN', 'SCREENSHOT_AI', 'FORM_SUBMISSION', 'REFERRAL_LINK'],
      requiresBusinessConfirmation: false,
      reasonForPrimary: 'E-commerce webhook (Shopify, WooCommerce, etc.) confirms order paid. Signed payload. 7-day delay for refund/chargeback protection.',
      reasonsForForbidden: [
        'QR_SCAN: No physical interaction',
        'GPS_CHECKIN: Online purchase has no location',
        'SCREENSHOT_AI: CRITICAL - Order confirmation emails/pages easily faked. Browser inspect element = instant fake. NEVER trust screenshots for money.',
        'FORM_SUBMISSION: Cannot verify payment occurred',
        'REFERRAL_LINK: Direct purchase, not referral'
      ]
    },
    
    hybrid: {
      primaryProofMethod: 'WEBHOOK',
      fallbackProofMethod: undefined,
      forbiddenProofMethods: ['QR_SCAN', 'GPS_CHECKIN', 'SCREENSHOT_AI', 'FORM_SUBMISSION', 'REFERRAL_LINK'],
      requiresBusinessConfirmation: false,
      reasonForPrimary: 'Unified webhook from POS or e-commerce. Payload indicates channel (in-store or online). First purchase from EITHER channel counts.',
      reasonsForForbidden: [
        'QR_SCAN: Need transaction verification, not presence',
        'GPS_CHECKIN: Online purchases have no location',
        'SCREENSHOT_AI: CRITICAL - Fake receipts/confirmations are trivial to create. Money missions NEVER use screenshots.',
        'FORM_SUBMISSION: No proof of payment',
        'REFERRAL_LINK: Not applicable'
      ]
    }
  },
  
  'REFER_PAYING_CUSTOMER': {
    missionId: 'REFER_PAYING_CUSTOMER',
    missionName: 'Refer a Paying Customer',
    
    physical: {
      primaryProofMethod: 'REFERRAL_LINK',
      fallbackProofMethod: 'WEBHOOK', // Webhook verifies referred purchase
      forbiddenProofMethods: ['QR_SCAN', 'GPS_CHECKIN', 'SCREENSHOT_AI', 'FORM_SUBMISSION'],
      requiresBusinessConfirmation: true,
      reasonForPrimary: 'Referral link tracks referred customer. Link includes referrer ID. When referred customer makes in-store purchase, POS webhook fires with referral metadata.',
      reasonForFallback: 'Webhook verifies purchase occurred. Cross-references referral link click with purchase timestamp.',
      reasonsForForbidden: [
        'QR_SCAN: Cannot track who referred whom',
        'GPS_CHECKIN: Cannot link referrer to referred customer',
        'SCREENSHOT_AI: CRITICAL - "I referred my friend" screenshots are meaningless. Need cryptographic proof of referral + purchase.',
        'FORM_SUBMISSION: Referrer could claim false referrals'
      ]
    },
    
    online: {
      primaryProofMethod: 'REFERRAL_LINK',
      fallbackProofMethod: 'WEBHOOK',
      forbiddenProofMethods: ['QR_SCAN', 'GPS_CHECKIN', 'SCREENSHOT_AI', 'FORM_SUBMISSION'],
      requiresBusinessConfirmation: true,
      reasonForPrimary: 'Referral link with UTM parameters. Tracks click → signup → purchase funnel.',
      reasonForFallback: 'E-commerce webhook confirms referred customer purchased.',
      reasonsForForbidden: [
        'QR_SCAN: No physical interaction',
        'GPS_CHECKIN: Online referrals have no location',
        'SCREENSHOT_AI: Cannot verify referral relationship from screenshots',
        'FORM_SUBMISSION: Self-reported referrals are unreliable'
      ]
    },
    
    hybrid: {
      primaryProofMethod: 'REFERRAL_LINK',
      fallbackProofMethod: 'WEBHOOK',
      forbiddenProofMethods: ['QR_SCAN', 'GPS_CHECKIN', 'SCREENSHOT_AI', 'FORM_SUBMISSION'],
      requiresBusinessConfirmation: true,
      reasonForPrimary: 'Referral link works for both channels. Referred customer can purchase in-store OR online.',
      reasonForFallback: 'Unified webhook verifies purchase from either channel.',
      reasonsForForbidden: [
        'QR_SCAN: Cannot track referral chain',
        'GPS_CHECKIN: Insufficient for referral verification',
        'SCREENSHOT_AI: No way to prove referral relationship',
        'FORM_SUBMISSION: Unverifiable claims'
      ]
    }
  },
  
  // ==========================================================================
  // REFERRAL MISSIONS (1)
  // ==========================================================================
  
  'BRING_A_FRIEND': {
    missionId: 'BRING_A_FRIEND',
    missionName: 'Bring a Friend to Visit',
    
    physical: {
      primaryProofMethod: 'GPS_CHECKIN',
      fallbackProofMethod: 'QR_SCAN', // Both users scan QR together
      forbiddenProofMethods: ['WEBHOOK', 'SCREENSHOT_AI', 'FORM_SUBMISSION', 'REFERRAL_LINK'],
      requiresBusinessConfirmation: true,
      reasonForPrimary: 'GPS check-in verifies BOTH users are physically present at same location at same time (within 30 minutes). Requires: (1) Both GPS within 100m, (2) Check-ins within 30min, (3) Friend is new/first visit.',
      reasonForFallback: 'Both users scan same QR code at business. System verifies two distinct users scanned within 30min window.',
      reasonsForForbidden: [
        'WEBHOOK: No transaction to trigger webhook, just a visit',
        'SCREENSHOT_AI: CRITICAL - Cannot verify co-presence from screenshots. Users could coordinate screenshots remotely.',
        'FORM_SUBMISSION: User could claim friend visited without verification',
        'REFERRAL_LINK: Referral link does not verify co-presence (friend could sign up remotely)'
      ]
    },
    
    online: undefined, // Online businesses cannot verify co-visits
    
    hybrid: {
      primaryProofMethod: 'GPS_CHECKIN',
      fallbackProofMethod: 'QR_SCAN',
      forbiddenProofMethods: ['WEBHOOK', 'SCREENSHOT_AI', 'FORM_SUBMISSION', 'REFERRAL_LINK'],
      requiresBusinessConfirmation: true,
      reasonForPrimary: 'GPS co-check-in at PHYSICAL location. Cannot bring friend to website.',
      reasonForFallback: 'QR co-scan at physical store.',
      reasonsForForbidden: [
        'WEBHOOK: Not applicable to physical co-visits',
        'SCREENSHOT_AI: Cannot prove simultaneous presence',
        'FORM_SUBMISSION: Unverifiable',
        'REFERRAL_LINK: Online referrals do not require co-presence'
      ]
    }
  },
  
  // ==========================================================================
  // CONTENT MISSIONS (4)
  // ==========================================================================
  
  'UGC_PHOTO_UPLOAD': {
    missionId: 'UGC_PHOTO_UPLOAD',
    missionName: 'Share a Photo',
    
    physical: {
      primaryProofMethod: 'SCREENSHOT_AI', // Actually media upload, but typed as screenshot for simplicity
      fallbackProofMethod: 'FORM_SUBMISSION', // If upload fails, URL submission
      forbiddenProofMethods: ['QR_SCAN', 'GPS_CHECKIN', 'WEBHOOK', 'REFERRAL_LINK'],
      requiresBusinessConfirmation: true, // Business reviews quality
      reasonForPrimary: 'Direct photo upload through app. AI verifies: (1) Photo shows location/products, (2) EXIF data present (not screenshot), (3) Taken within 48hrs, (4) Not stock image (reverse search), (5) Not AI-generated (artifact detection). Business manually approves quality.',
      reasonForFallback: 'If upload fails, user submits Instagram/social post URL containing photo.',
      reasonsForForbidden: [
        'QR_SCAN: Cannot verify photo content via QR',
        'GPS_CHECKIN: Location check insufficient, need to verify photo quality',
        'WEBHOOK: No webhook for photo uploads',
        'REFERRAL_LINK: Not applicable'
      ]
    },
    
    online: {
      primaryProofMethod: 'SCREENSHOT_AI',
      fallbackProofMethod: 'FORM_SUBMISSION',
      forbiddenProofMethods: ['QR_SCAN', 'GPS_CHECKIN', 'WEBHOOK', 'REFERRAL_LINK'],
      requiresBusinessConfirmation: true,
      reasonForPrimary: 'Photo upload of product unboxing/review. AI checks: (1) Shows product, (2) Not stock image, (3) Not AI-generated, (4) EXIF data present.',
      reasonForFallback: 'Social media URL submission.',
      reasonsForForbidden: [
        'QR_SCAN: No physical location',
        'GPS_CHECKIN: Product photos have no location requirement',
        'WEBHOOK: Not applicable',
        'REFERRAL_LINK: Not a referral'
      ]
    },
    
    hybrid: {
      primaryProofMethod: 'SCREENSHOT_AI',
      fallbackProofMethod: 'FORM_SUBMISSION',
      forbiddenProofMethods: ['QR_SCAN', 'GPS_CHECKIN', 'WEBHOOK', 'REFERRAL_LINK'],
      requiresBusinessConfirmation: true,
      reasonForPrimary: 'Photo can show location OR products. AI adjusts verification based on content.',
      reasonForFallback: 'Social URL submission.',
      reasonsForForbidden: [
        'QR_SCAN: Cannot verify photo content',
        'GPS_CHECKIN: Photos may not have location context',
        'WEBHOOK: Not applicable',
        'REFERRAL_LINK: Not a referral'
      ]
    }
  },
  
  'UGC_VIDEO_UPLOAD': {
    missionId: 'UGC_VIDEO_UPLOAD',
    missionName: 'Share a Video',
    
    physical: {
      primaryProofMethod: 'SCREENSHOT_AI', // Video upload
      fallbackProofMethod: 'FORM_SUBMISSION', // YouTube/TikTok URL
      forbiddenProofMethods: ['QR_SCAN', 'GPS_CHECKIN', 'WEBHOOK', 'REFERRAL_LINK'],
      requiresBusinessConfirmation: true,
      reasonForPrimary: 'Video upload. AI verifies: (1) Minimum 10s duration, (2) Audio present (not silent stock), (3) Movement detected (not static image), (4) Shows location/experience, (5) Not AI-generated (motion analysis).',
      reasonForFallback: 'Social media video URL.',
      reasonsForForbidden: [
        'QR_SCAN: Cannot verify video content',
        'GPS_CHECKIN: Video may be filmed at location but submitted later',
        'WEBHOOK: Not applicable',
        'REFERRAL_LINK: Not a referral'
      ]
    },
    
    online: {
      primaryProofMethod: 'SCREENSHOT_AI',
      fallbackProofMethod: 'FORM_SUBMISSION',
      forbiddenProofMethods: ['QR_SCAN', 'GPS_CHECKIN', 'WEBHOOK', 'REFERRAL_LINK'],
      requiresBusinessConfirmation: true,
      reasonForPrimary: 'Video upload of product review/unboxing. AI checks quality and authenticity.',
      reasonForFallback: 'YouTube/TikTok URL submission.',
      reasonsForForbidden: [
        'QR_SCAN: No physical location',
        'GPS_CHECKIN: Not location-dependent',
        'WEBHOOK: Not applicable',
        'REFERRAL_LINK: Not a referral'
      ]
    },
    
    hybrid: {
      primaryProofMethod: 'SCREENSHOT_AI',
      fallbackProofMethod: 'FORM_SUBMISSION',
      forbiddenProofMethods: ['QR_SCAN', 'GPS_CHECKIN', 'WEBHOOK', 'REFERRAL_LINK'],
      requiresBusinessConfirmation: true,
      reasonForPrimary: 'Video of location OR products. AI adapts verification.',
      reasonForFallback: 'Social video URL.',
      reasonsForForbidden: [
        'QR_SCAN: Cannot verify video',
        'GPS_CHECKIN: Videos not location-locked',
        'WEBHOOK: Not applicable',
        'REFERRAL_LINK: Not a referral'
      ]
    }
  },
  
  'STORY_POST_TAG': {
    missionId: 'STORY_POST_TAG',
    missionName: 'Tag Us in Instagram Story',
    
    physical: {
      primaryProofMethod: 'SCREENSHOT_AI',
      fallbackProofMethod: undefined, // No fallback - must be screenshot (stories expire)
      forbiddenProofMethods: ['QR_SCAN', 'GPS_CHECKIN', 'WEBHOOK', 'FORM_SUBMISSION', 'REFERRAL_LINK'],
      requiresBusinessConfirmation: true,
      reasonForPrimary: 'Screenshot of story mentioning location. AI verifies: (1) Instagram UI elements present, (2) Business tag visible (@handle), (3) Story <24hrs old (EXIF timestamp), (4) Not edited/fake (UI font check). BUSINESS ALWAYS CONFIRMS because stories can be deleted after screenshot.',
      reasonsForForbidden: [
        'QR_SCAN: Social posts are online, not in-store activity',
        'GPS_CHECKIN: Story can be posted from anywhere',
        'WEBHOOK: Instagram does not provide story webhooks (stories are ephemeral)',
        'FORM_SUBMISSION: Story expires in 24hrs, URL becomes invalid',
        'REFERRAL_LINK: Not applicable'
      ]
    },
    
    online: {
      primaryProofMethod: 'SCREENSHOT_AI',
      fallbackProofMethod: undefined,
      forbiddenProofMethods: ['QR_SCAN', 'GPS_CHECKIN', 'WEBHOOK', 'FORM_SUBMISSION', 'REFERRAL_LINK'],
      requiresBusinessConfirmation: true,
      reasonForPrimary: 'Screenshot showing product mention + business tag. AI checks authenticity.',
      reasonsForForbidden: [
        'QR_SCAN: No physical location',
        'GPS_CHECKIN: Not location-based',
        'WEBHOOK: No story webhooks',
        'FORM_SUBMISSION: Stories expire',
        'REFERRAL_LINK: Not applicable'
      ]
    },
    
    hybrid: {
      primaryProofMethod: 'SCREENSHOT_AI',
      fallbackProofMethod: undefined,
      forbiddenProofMethods: ['QR_SCAN', 'GPS_CHECKIN', 'WEBHOOK', 'FORM_SUBMISSION', 'REFERRAL_LINK'],
      requiresBusinessConfirmation: true,
      reasonForPrimary: 'Screenshot of story mentioning location OR products.',
      reasonsForForbidden: [
        'QR_SCAN: Social media activity',
        'GPS_CHECKIN: Not location-dependent',
        'WEBHOOK: No API',
        'FORM_SUBMISSION: Ephemeral content',
        'REFERRAL_LINK: Not applicable'
      ]
    }
  },
  
  'FEED_REEL_POST_TAG': {
    missionId: 'FEED_REEL_POST_TAG',
    missionName: 'Tag Us in Feed/Reel Post',
    
    physical: {
      primaryProofMethod: 'SCREENSHOT_AI',
      fallbackProofMethod: 'FORM_SUBMISSION', // Public post URL
      forbiddenProofMethods: ['QR_SCAN', 'GPS_CHECKIN', 'WEBHOOK', 'REFERRAL_LINK'],
      requiresBusinessConfirmation: true,
      reasonForPrimary: 'Screenshot of permanent post. AI verifies business tag, content quality, authenticity. 14-day reward delay allows detection of deleted posts.',
      reasonForFallback: 'Direct post URL if public. System scrapes to verify post still exists.',
      reasonsForForbidden: [
        'QR_SCAN: Social content not in-store activity',
        'GPS_CHECKIN: Post location irrelevant',
        'WEBHOOK: Instagram provides limited webhooks, not reliable for individual posts',
        'REFERRAL_LINK: Not a referral'
      ]
    },
    
    online: {
      primaryProofMethod: 'SCREENSHOT_AI',
      fallbackProofMethod: 'FORM_SUBMISSION',
      forbiddenProofMethods: ['QR_SCAN', 'GPS_CHECKIN', 'WEBHOOK', 'REFERRAL_LINK'],
      requiresBusinessConfirmation: true,
      reasonForPrimary: 'Screenshot showing product + business tag.',
      reasonForFallback: 'Public post URL.',
      reasonsForForbidden: [
        'QR_SCAN: No physical interaction',
        'GPS_CHECKIN: Not location-based',
        'WEBHOOK: Limited API',
        'REFERRAL_LINK: Not applicable'
      ]
    },
    
    hybrid: {
      primaryProofMethod: 'SCREENSHOT_AI',
      fallbackProofMethod: 'FORM_SUBMISSION',
      forbiddenProofMethods: ['QR_SCAN', 'GPS_CHECKIN', 'WEBHOOK', 'REFERRAL_LINK'],
      requiresBusinessConfirmation: true,
      reasonForPrimary: 'Screenshot of post featuring location OR products.',
      reasonForFallback: 'Post URL.',
      reasonsForForbidden: [
        'QR_SCAN: Social media activity',
        'GPS_CHECKIN: Not required',
        'WEBHOOK: Limited',
        'REFERRAL_LINK: Not applicable'
      ]
    }
  },
  
  // ==========================================================================
  // LOYALTY MISSIONS (2)
  // ==========================================================================
  
  'REPEAT_PURCHASE_VISIT': {
    missionId: 'REPEAT_PURCHASE_VISIT',
    missionName: 'Make a Repeat Purchase/Visit',
    
    physical: {
      primaryProofMethod: 'WEBHOOK',
      fallbackProofMethod: undefined,
      forbiddenProofMethods: ['QR_SCAN', 'GPS_CHECKIN', 'SCREENSHOT_AI', 'FORM_SUBMISSION', 'REFERRAL_LINK'],
      requiresBusinessConfirmation: false,
      reasonForPrimary: 'POS webhook verifies 2+ purchases from same customer. System tracks purchase history, triggers reward on 2nd purchase (minimum 7 days after 1st).',
      reasonsForForbidden: [
        'QR_SCAN: Need purchase verification, not just check-ins',
        'GPS_CHECKIN: Visiting does not equal purchasing',
        'SCREENSHOT_AI: Cannot verify purchase history from screenshots',
        'FORM_SUBMISSION: User could falsely claim repeat purchases',
        'REFERRAL_LINK: Not applicable'
      ]
    },
    
    online: {
      primaryProofMethod: 'WEBHOOK',
      fallbackProofMethod: undefined,
      forbiddenProofMethods: ['QR_SCAN', 'GPS_CHECKIN', 'SCREENSHOT_AI', 'FORM_SUBMISSION', 'REFERRAL_LINK'],
      requiresBusinessConfirmation: false,
      reasonForPrimary: 'E-commerce webhook tracks purchase count. Triggers on 2nd purchase.',
      reasonsForForbidden: [
        'QR_SCAN: No physical location',
        'GPS_CHECKIN: Not applicable',
        'SCREENSHOT_AI: Order history easily faked',
        'FORM_SUBMISSION: Unverifiable',
        'REFERRAL_LINK: Not applicable'
      ]
    },
    
    hybrid: {
      primaryProofMethod: 'WEBHOOK',
      fallbackProofMethod: undefined,
      forbiddenProofMethods: ['QR_SCAN', 'GPS_CHECKIN', 'SCREENSHOT_AI', 'FORM_SUBMISSION', 'REFERRAL_LINK'],
      requiresBusinessConfirmation: false,
      reasonForPrimary: 'Unified webhook counts purchases across both channels. 2 in-store OR 2 online OR 1 of each = reward.',
      reasonsForForbidden: [
        'QR_SCAN: Need transaction verification',
        'GPS_CHECKIN: Insufficient',
        'SCREENSHOT_AI: Cannot verify purchase history',
        'FORM_SUBMISSION: Unverifiable',
        'REFERRAL_LINK: Not applicable'
      ]
    }
  },
  
  'INSTAGRAM_FOLLOW': {
    missionId: 'INSTAGRAM_FOLLOW',
    missionName: 'Follow on Instagram',
    
    physical: {
      primaryProofMethod: 'SCREENSHOT_AI',
      fallbackProofMethod: 'WEBHOOK', // If Instagram API integrated
      forbiddenProofMethods: ['QR_SCAN', 'GPS_CHECKIN', 'FORM_SUBMISSION', 'REFERRAL_LINK'],
      requiresBusinessConfirmation: false,
      reasonForPrimary: 'User screenshots their Instagram following list showing business account. AI verifies business username is visible.',
      reasonForFallback: 'If Instagram Graph API integrated, automatic follow verification via webhook.',
      reasonsForForbidden: [
        'QR_SCAN: Following happens on Instagram, not via QR code',
        'GPS_CHECKIN: Location irrelevant for social media follow',
        'FORM_SUBMISSION: No form needed, direct Instagram action',
        'REFERRAL_LINK: Not a referral, single-user action'
      ]
    },
    
    online: {
      primaryProofMethod: 'SCREENSHOT_AI',
      fallbackProofMethod: 'WEBHOOK',
      forbiddenProofMethods: ['QR_SCAN', 'GPS_CHECKIN', 'FORM_SUBMISSION', 'REFERRAL_LINK'],
      requiresBusinessConfirmation: false,
      reasonForPrimary: 'User screenshots Instagram following list showing business account.',
      reasonForFallback: 'Automatic verification via Instagram API if connected.',
      reasonsForForbidden: [
        'QR_SCAN: No physical interaction',
        'GPS_CHECKIN: Not applicable',
        'FORM_SUBMISSION: Direct Instagram action',
        'REFERRAL_LINK: Not a referral'
      ]
    },
    
    hybrid: {
      primaryProofMethod: 'SCREENSHOT_AI',
      fallbackProofMethod: 'WEBHOOK',
      forbiddenProofMethods: ['QR_SCAN', 'GPS_CHECKIN', 'FORM_SUBMISSION', 'REFERRAL_LINK'],
      requiresBusinessConfirmation: false,
      reasonForPrimary: 'Form collects omnichannel preferences (in-store vs online shopping preference).',
      reasonForFallback: 'CRM webhook.',
      reasonsForForbidden: [
        'QR_SCAN: Data collection, not scan activity',
        'GPS_CHECKIN: Not location-dependent',
        'SCREENSHOT_AI: No visual proof',
        'REFERRAL_LINK: Not a referral'
      ]
    }
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * GET PROOF METHOD CONFIG FOR MISSION + BUSINESS TYPE
 */
export function getProofMethodConfig(
  missionId: string,
  businessType: BusinessType
): ProofMethodConfig | null {
  
  const matrix = MISSION_PROOF_METHOD_MATRIX[missionId];
  if (!matrix) return null;
  
  switch (businessType) {
    case BusinessType.PHYSICAL:
      return matrix.physical || null;
    case BusinessType.ONLINE:
      return matrix.online || null;
    case BusinessType.HYBRID:
      return matrix.hybrid || null;
    default:
      return null;
  }
}

/**
 * CHECK IF PROOF METHOD IS ALLOWED FOR MISSION + BUSINESS TYPE
 */
export function isProofMethodAllowed(
  missionId: string,
  businessType: BusinessType,
  proofMethod: ProofMethod
): boolean {
  
  const config = getProofMethodConfig(missionId, businessType);
  if (!config) return false;
  
  // Check if forbidden
  if (config.forbiddenProofMethods.includes(proofMethod)) {
    return false;
  }
  
  // Check if primary or fallback
  return config.primaryProofMethod === proofMethod || 
         config.fallbackProofMethod === proofMethod;
}

/**
 * GET FORBIDDEN REASON FOR PROOF METHOD
 */
export function getForbiddenReason(
  missionId: string,
  businessType: BusinessType,
  proofMethod: ProofMethod
): string | null {
  
  const config = getProofMethodConfig(missionId, businessType);
  if (!config) return null;
  
  const forbiddenIndex = config.forbiddenProofMethods.indexOf(proofMethod);
  if (forbiddenIndex === -1) return null;
  
  return config.reasonsForForbidden[forbiddenIndex] || 'This proof method is not allowed for this mission.';
}

/**
 * VALIDATE PROOF METHOD CONFIGURATION
 * 
 * Ensures mission follows the rules:
 * 1. Physical missions prefer QR > GPS
 * 2. Online missions prefer webhooks > screenshots
 * 3. Screenshots never sole proof for money missions
 * 4. AI verification always secondary
 */
export function validateProofMethodConfig(
  missionId: string,
  businessType: BusinessType
): { valid: boolean; violations: string[] } {
  
  const config = getProofMethodConfig(missionId, businessType);
  if (!config) {
    return { valid: false, violations: ['Mission not available for this business type'] };
  }
  
  const violations: string[] = [];
  
  // Rule 1: Money missions cannot use screenshots as primary
  const moneyMissions = ['FIRST_PURCHASE', 'REPEAT_PURCHASE_VISIT', 'REFER_PAYING_CUSTOMER'];
  if (moneyMissions.includes(missionId)) {
    if (config.primaryProofMethod === 'SCREENSHOT_AI') {
      violations.push('Money missions cannot use screenshots as primary proof method');
    }
    if (config.fallbackProofMethod === 'SCREENSHOT_AI' && !config.requiresBusinessConfirmation) {
      violations.push('Money missions using screenshot fallback must require business confirmation');
    }
  }
  
  // Rule 2: Physical missions should prefer QR over GPS
  if (businessType === BusinessType.PHYSICAL) {
    const physicalMissions = ['VISIT_CHECKIN', 'REDEEM_OFFER', 'BRING_A_FRIEND'];
    if (physicalMissions.includes(missionId)) {
      if (config.primaryProofMethod === 'GPS_CHECKIN' && !config.forbiddenProofMethods.includes('QR_SCAN')) {
        violations.push('Physical missions should prefer QR_SCAN over GPS_CHECKIN when both available');
      }
    }
  }
  
  // Rule 3: Online missions should prefer webhooks over screenshots
  if (businessType === BusinessType.ONLINE) {
    const transactionalMissions = ['FIRST_PURCHASE', 'CONSULTATION_REQUEST', 'REDEEM_OFFER'];
    if (transactionalMissions.includes(missionId)) {
      if (config.primaryProofMethod === 'SCREENSHOT_AI') {
        violations.push('Online transactional missions should prefer WEBHOOK over SCREENSHOT_AI');
      }
    }
  }
  
  // Rule 4: Screenshots as primary must always require business confirmation
  if (config.primaryProofMethod === 'SCREENSHOT_AI' && !config.requiresBusinessConfirmation) {
    violations.push('Screenshot-based missions must require business confirmation (AI is never primary judge)');
  }
  
  return {
    valid: violations.length === 0,
    violations
  };
}

export const MISSION_PROOF_METHOD_MATRIX_VERSION = '1.0.0';
