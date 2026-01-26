/**
 * Rewards System Types
 * For businesses to create rewards that customers can redeem with points
 */

export enum RewardCategory {
  DISCOUNT = 'DISCOUNT',
  FREE_ITEM = 'FREE_ITEM',
  COUPON = 'COUPON',
  GIFT_CARD = 'GIFT_CARD',
  EXCLUSIVE_ACCESS = 'EXCLUSIVE_ACCESS',
  OTHER = 'OTHER'
}

export enum RedemptionFrequency {
  ONCE = 'once',                      // One-time redemption per user ever
  ONCE_PER_DAY = 'once_per_day',      // Once daily per user
  ONCE_PER_WEEK = 'once_per_week',    // Once weekly per user
  UNLIMITED = 'unlimited'              // No limit on redemptions
}

export enum RewardValidationType {
  PHYSICAL = 'PHYSICAL',  // In-store QR code scan
  ONLINE = 'ONLINE'       // Online alphanumeric code
}

export interface Reward {
  id: string;
  businessId: string;
  businessName: string;
  businessLogo?: string;
  
  // Reward Details
  title: string;
  description: string;
  category: RewardCategory;
  imageUrl?: string;
  
  // Points Cost (REQUIRED)
  pointsCost: number;
  
  // Availability (REQUIRED)
  totalAvailable: number;
  maxTotalRedemptions: number; // REQUIRED: Hard limit on total redemptions
  claimed: number;
  active: boolean;
  unlimited?: boolean; // If true, ignore totalAvailable limit
  
  // Redemption Frequency (REQUIRED)
  redemptionFrequency: RedemptionFrequency;
  
  // Validation Type
  validationType: RewardValidationType;
  
  // Validity
  expiresAt?: Date;               // OPTIONAL: Reward expires
  expiryDate?: Date;              // OPTIONAL: Alias for expiresAt
  validFrom?: Date;
  validUntil?: Date;
  validDays?: number[]; // Array of day numbers (1=Mon, 7=Sun)
  validTimeStart?: string; // HH:MM format
  validTimeEnd?: string; // HH:MM format
  redeemExpiryDays?: number; // Days until redeemed code expires (default 30)
  
  // Customer Eligibility
  minPointsRequired?: number; // Minimum points balance to redeem
  minPurchaseAmount?: number; // Minimum purchase amount required
  levelRequired?: number; // Minimum customer level (0=all, 1=level1+, 2=level2+)
  
  // Fair Value Tracking
  localAveragePoints?: number; // Local market average for similar rewards
  recommendedMinPoints?: number; // Suggested minimum
  recommendedMaxPoints?: number; // Suggested maximum
  pricingDeviationLogged?: boolean; // True if price deviates from recommendations
  
  // Terms
  terms?: string;
  redemptionInstructions?: string;
  voucherCode?: string; // Optional custom voucher code for website/online redemption
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerRedemption {
  id: string;
  userId: string;
  userName: string;
  rewardId: string;
  reward: Reward;
  
  // Redemption Details
  pointsSpent: number;
  redeemedAt: Date;
  
  // Status
  status: 'PENDING' | 'APPROVED' | 'USED' | 'EXPIRED' | 'CANCELLED';
  
  // One-Time Validation Codes
  qrCode?: string;           // For physical stores (one-time use)
  alphanumericCode?: string; // For online stores (one-time use)
  validationToken?: string;  // Server-side validation token
  
  // Validation Security
  validated: boolean;        // True once code is used
  validatedAt?: Date;        // When code was validated
  validatedBy?: string;      // Business staff who validated
  validationMethod?: 'QR_SCAN' | 'CODE_ENTRY' | 'MANUAL';
  ipAddress?: string;        // For fraud detection
  deviceId?: string;         // For fraud detection
  
  // Usage (Legacy - kept for backward compatibility)
  couponCode?: string;
  usedAt?: Date;
  usedBy?: string;
  
  // Metadata
  expiresAt?: Date;
}

export interface RewardValidationResult {
  valid: boolean;
  message: string;
  redemption?: CustomerRedemption;
  error?: string;
}

export interface FairValueGuardrails {
  localAverage: number;
  recommendedMin: number;
  recommendedMax: number;
  userInputCost: number;
  deviation: number;          // Percentage deviation from average
  isOutsideRange: boolean;    // True if outside recommended range
  warningMessage?: string;    // Warning to show business owner
}

