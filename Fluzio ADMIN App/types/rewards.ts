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
  
  // Points Cost
  pointsCost: number;
  
  // Availability
  totalAvailable: number;
  claimed: number;
  active: boolean;
  unlimited?: boolean; // If true, ignore totalAvailable limit
  
  // Validity
  expiresAt?: Date;
  validFrom?: Date;
  validUntil?: Date;
  validDays?: number[]; // Array of day numbers (1=Mon, 7=Sun)
  validTimeStart?: string; // HH:MM format
  validTimeEnd?: string; // HH:MM format
  
  // Customer Eligibility
  minPointsRequired?: number; // Minimum points balance to redeem
  minPurchaseAmount?: number; // Minimum purchase amount required
  levelRequired?: number; // Minimum customer level (0=all, 1=level1+, 2=level2+)
  
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
  
  // Coupon Code (if applicable)
  couponCode?: string;
  
  // Usage
  usedAt?: Date;
  usedBy?: string; // Business staff who approved usage
  
  // Metadata
  expiresAt?: Date;
}
