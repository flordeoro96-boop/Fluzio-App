/**
 * ROI-Driven Mission System for Fluzio
 * 
 * This system is designed to prevent fraud while maximizing business value.
 * All missions are tied to measurable business outcomes.
 */

// ============================================================================
// CORE ENUMS
// ============================================================================

export type BusinessMode = 'PHYSICAL' | 'ONLINE' | 'HYBRID';

export type BusinessNeed = 
  | 'REPUTATION'    // Build brand awareness, reviews, social proof
  | 'TRAFFIC'       // Drive foot traffic or website visits
  | 'CONVERSION'    // Generate sales, signups, or transactions
  | 'REFERRAL'      // Get new customers through word-of-mouth
  | 'CONTENT'       // Create UGC for marketing
  | 'LOYALTY';      // Increase repeat visits/purchases

export type ProofMethod =
  | 'QR_SCAN'           // Physical: Scan QR at location
  | 'GPS_CHECKIN'       // Physical: GPS verification with geofence
  | 'WEBHOOK'           // Online: API callback (e.g., purchase confirmation)
  | 'SCREENSHOT_AI'     // Hybrid: AI-verified screenshot (low trust)
  | 'FORM_SUBMISSION'   // Any: User fills form (requires business review)
  | 'REFERRAL_LINK';    // Any: Trackable referral link click/conversion

export type AntiCheatType =
  | 'RATE_LIMIT'        // Limit submissions per time period
  | 'UNIQUE_DEVICE'     // One submission per device
  | 'LOCATION_LOCK'     // Must be at business location
  | 'TIME_WINDOW'       // Only during business hours
  | 'PURCHASE_VERIFY'   // Must show receipt/order number
  | 'MIN_ENGAGEMENT'    // Minimum time spent or actions taken
  | 'SOCIAL_VERIFY';    // Cross-check with social platform

export type MissionStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'EXPIRED';

export type ProofStatus = 
  | 'PENDING'           // Awaiting verification
  | 'AI_VERIFIED'       // AI confirmed but needs business approval
  | 'APPROVED'          // Business confirmed, reward released
  | 'REJECTED'          // Invalid proof
  | 'EXPIRED';          // Verification window closed

// ============================================================================
// ANTI-CHEAT RULES
// ============================================================================

export interface RateLimitRule {
  type: 'RATE_LIMIT';
  maxSubmissions: number;
  windowHours: number;          // e.g., 3 submissions per 24 hours
  scope: 'PER_USER' | 'PER_MISSION' | 'PER_BUSINESS';
}

export interface UniqueDeviceRule {
  type: 'UNIQUE_DEVICE';
  allowMultipleAccounts: boolean; // Can same device use different accounts?
}

export interface LocationLockRule {
  type: 'LOCATION_LOCK';
  radiusMeters: number;         // Geofence radius
  requireGPS: boolean;
  allowManualOverride: boolean; // Business can manually approve out-of-range
}

export interface TimeWindowRule {
  type: 'TIME_WINDOW';
  allowedDays: number[];        // 0-6 (Sunday-Saturday)
  startTime: string;            // "09:00"
  endTime: string;              // "21:00"
  timezone: string;             // "America/New_York"
}

export interface PurchaseVerifyRule {
  type: 'PURCHASE_VERIFY';
  minAmount?: number;           // Minimum purchase amount
  requireReceipt: boolean;
  requireOrderNumber: boolean;
}

export interface MinEngagementRule {
  type: 'MIN_ENGAGEMENT';
  minTimeSeconds?: number;      // Must spend X seconds on page/location
  minActions?: number;          // Must complete X actions
  requiredActions?: string[];   // Specific actions required
}

export interface SocialVerifyRule {
  type: 'SOCIAL_VERIFY';
  platform: 'INSTAGRAM' | 'FACEBOOK';
  requirePublicPost: boolean;
  minFollowers?: number;
  requireHashtags?: string[];
  requireMention?: string;      // e.g., @businesshandle
}

export type AntiCheatRule = 
  | RateLimitRule
  | UniqueDeviceRule
  | LocationLockRule
  | TimeWindowRule
  | PurchaseVerifyRule
  | MinEngagementRule
  | SocialVerifyRule;

// ============================================================================
// COOLDOWN RULES
// ============================================================================

export interface CooldownRules {
  perUser: number;              // Hours before same user can do again
  perBusiness: number;          // Hours before user can do any mission for this business
  global?: number;              // Hours before user can do any mission
}

// ============================================================================
// PROOF SUBMISSION
// ============================================================================

export interface ProofSubmission {
  id: string;
  missionId: string;
  userId: string;
  businessId: string;
  submittedAt: Date;
  status: ProofStatus;
  
  // Proof data based on method
  proofMethod: ProofMethod;
  proofData: QRProof | GPSProof | WebhookProof | ScreenshotProof | FormProof | ReferralProof;
  
  // AI verification (if applicable)
  aiVerification?: {
    verified: boolean;
    confidence: number;         // 0-1
    findings: string[];
    verifiedAt: Date;
  };
  
  // Business verification (if required)
  businessVerification?: {
    approvedBy: string;         // Business user ID
    approved: boolean;
    notes?: string;
    verifiedAt: Date;
  };
  
  // Reward locking
  rewardLockedUntil?: Date;     // When reward becomes available
  rewardReleased: boolean;
  rewardReleasedAt?: Date;
  
  // Audit trail
  metadata: {
    deviceId: string;
    ipAddress: string;
    userAgent: string;
    location?: { lat: number; lng: number };
  };
}

// Specific proof types
export interface QRProof {
  type: 'QR_SCAN';
  qrCode: string;
  scannedAt: Date;
  location: { lat: number; lng: number };
}

export interface GPSProof {
  type: 'GPS_CHECKIN';
  location: { lat: number; lng: number };
  accuracy: number;             // meters
  checkedInAt: Date;
  durationSeconds?: number;     // How long they stayed
}

export interface WebhookProof {
  type: 'WEBHOOK';
  webhookUrl: string;
  payload: any;                 // e.g., order details from Shopify
  signature?: string;           // Webhook signature for verification
  receivedAt: Date;
}

export interface ScreenshotProof {
  type: 'SCREENSHOT_AI';
  imageUrl: string;
  imageHash: string;            // Prevent duplicate submissions
  aiAnalysis: {
    detectedElements: string[];
    confidence: number;
    flags: string[];            // Potential issues detected
  };
}

export interface FormProof {
  type: 'FORM_SUBMISSION';
  formData: Record<string, any>;
  attachments?: string[];       // URLs to uploaded files
}

export interface ReferralProof {
  type: 'REFERRAL_LINK';
  referralCode: string;
  clickedAt: Date;
  convertedAt?: Date;           // When referred user made action
  conversionValue?: number;     // Value of conversion (if applicable)
}

// ============================================================================
// MISSION INTERFACE
// ============================================================================

export interface Mission {
  // Identity
  id: string;
  name: string;
  description: string;
  businessId: string;
  
  // Business alignment
  businessNeed: BusinessNeed;
  allowedBusinessTypes: BusinessMode[];
  
  // Verification
  proofMethod: ProofMethod;
  antiCheatRules: AntiCheatRule[];
  cooldownRules: CooldownRules;
  
  // Reward & Risk management
  rewardPoints: number;
  rewardLockDelayDays: number | null;  // null = instant, 7 = week delay
  requiresBusinessConfirmation: boolean;
  maxRewardBudget?: number;            // Total points budget for this mission
  
  // Lifecycle
  status: MissionStatus;
  createdAt: Date;
  startDate: Date;
  endDate: Date;
  
  // Constraints
  maxParticipants?: number;
  minUserLevel?: number;               // Require user to be certain level
  
  // Tracking
  participantsCount: number;
  approvedCount: number;
  rejectedCount: number;
  totalRewardsIssued: number;
  
  // Metadata
  category?: string;
  tags?: string[];
  isStandard: boolean;                 // Is this a standard template mission?
}

// ============================================================================
// FRAUD PREVENTION EXPLANATION
// ============================================================================

/**
 * WHY THIS STRUCTURE PREVENTS FRAUD
 * =================================
 * 
 * 1. LAYERED VERIFICATION
 *    - AI verification is ONLY first pass, never trusted alone
 *    - High-value missions require business confirmation
 *    - Proof includes metadata (device, IP, location) for forensics
 * 
 * 2. RATE LIMITING
 *    - Multiple anti-cheat rules prevent abuse patterns
 *    - Cooldowns prevent rapid-fire submissions
 *    - Device fingerprinting stops multi-account abuse
 * 
 * 3. DELAYED REWARDS
 *    - rewardLockDelayDays creates risk for fraudsters
 *    - Business has time to verify before points are spendable
 *    - Discourages hit-and-run fraud attempts
 * 
 * 4. SOCIAL MISSIONS = LOW VALUE
 *    - Screenshot/social proofs have lowest trust
 *    - Capped rewards (enforced by maxRewardBudget)
 *    - Require additional verification layers
 * 
 * 5. CONVERSION FOCUS
 *    - Every mission tied to BusinessNeed
 *    - At least one CONVERSION mission required per business
 *    - Incentivizes real business outcomes over vanity metrics
 * 
 * 6. AUDIT TRAIL
 *    - Every proof has full metadata
 *    - Can trace abuse patterns across users/devices
 *    - Enables retroactive fraud detection
 * 
 * 7. BUSINESS CONTROL
 *    - requiresBusinessConfirmation for high-value actions
 *    - Manual override capabilities where needed
 *    - Business sees all proofs before reward release
 */

// ============================================================================
// STANDARD MISSION TEMPLATES
// ============================================================================

export interface StandardMissionTemplate {
  id: string;
  name: string;
  description: string;
  businessNeed: BusinessNeed;
  allowedBusinessTypes: BusinessMode[];
  proofMethod: ProofMethod;
  defaultReward: number;
  defaultAntiCheatRules: AntiCheatRule[];
  defaultCooldown: CooldownRules;
  rewardLockDelayDays: number | null;
  requiresBusinessConfirmation: boolean;
  minSubscriptionTier?: 'STARTER' | 'SILVER' | 'GOLD' | 'PLATINUM';
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export function validateMissionForBusinessType(
  mission: Mission,
  businessType: BusinessMode
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check business type compatibility
  if (!mission.allowedBusinessTypes.includes(businessType)) {
    errors.push(`Mission not compatible with ${businessType} business type`);
  }
  
  // Physical businesses must use physical verification
  if (businessType === 'PHYSICAL') {
    if (!['QR_SCAN', 'GPS_CHECKIN', 'FORM_SUBMISSION'].includes(mission.proofMethod)) {
      errors.push('Physical businesses must use QR, GPS, or Form verification');
    }
  }
  
  // Online businesses must have conversion tracking
  if (businessType === 'ONLINE') {
    const hasConversionRule = mission.antiCheatRules.some(
      rule => rule.type === 'PURCHASE_VERIFY'
    );
    if (mission.businessNeed === 'CONVERSION' && !hasConversionRule) {
      errors.push('Online conversion missions must include purchase verification');
    }
  }
  
  // High rewards must have delays or confirmation
  if (mission.rewardPoints > 500) {
    if (!mission.rewardLockDelayDays && !mission.requiresBusinessConfirmation) {
      errors.push('Missions over 500 points must have reward delay OR business confirmation');
    }
  }
  
  // Social missions must be low reward
  if (mission.proofMethod === 'SCREENSHOT_AI') {
    if (mission.rewardPoints > 200) {
      errors.push('Screenshot-based missions must be ≤200 points');
    }
    if (!mission.requiresBusinessConfirmation) {
      errors.push('Screenshot missions must require business confirmation');
    }
  }
  
  return { valid: errors.length === 0, errors };
}

export function getMissionRiskLevel(mission: Mission): 'LOW' | 'MEDIUM' | 'HIGH' {
  let riskScore = 0;
  
  // High reward = higher risk
  if (mission.rewardPoints > 500) riskScore += 3;
  else if (mission.rewardPoints > 200) riskScore += 2;
  else riskScore += 1;
  
  // Weak proof methods = higher risk
  if (mission.proofMethod === 'SCREENSHOT_AI') riskScore += 3;
  else if (mission.proofMethod === 'FORM_SUBMISSION') riskScore += 2;
  else riskScore += 1;
  
  // Lack of safeguards = higher risk
  if (!mission.requiresBusinessConfirmation) riskScore += 2;
  if (!mission.rewardLockDelayDays) riskScore += 1;
  if (mission.antiCheatRules.length < 2) riskScore += 2;
  
  if (riskScore >= 8) return 'HIGH';
  if (riskScore >= 5) return 'MEDIUM';
  return 'LOW';
}
