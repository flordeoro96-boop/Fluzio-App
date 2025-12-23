/**
 * Points Marketplace Types
 * Define products and services businesses can purchase with points
 */

export enum PointsProductCategory {
  MISSION_BOOST = 'MISSION_BOOST',
  PREMIUM_FEATURES = 'PREMIUM_FEATURES',
  ANALYTICS = 'ANALYTICS',
  VISIBILITY = 'VISIBILITY',
  B2B_SERVICES = 'B2B_SERVICES',
  SUBSCRIPTION_CREDIT = 'SUBSCRIPTION_CREDIT'
}

export interface PointsProduct {
  id: string;
  category: PointsProductCategory;
  name: string;
  description: string;
  pointsCost: number;
  icon: string;
  duration?: string; // e.g., "1 week", "1 month", "permanent"
  benefits: string[];
  popular?: boolean;
  available: boolean;
}

export interface PointsPurchase {
  id: string;
  businessId: string;
  businessName: string;
  productId: string;
  productName: string;
  pointsSpent: number;
  purchasedAt: Date;
  expiresAt?: Date;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  metadata?: Record<string, any>;
}

export interface PointsTransaction {
  id: string;
  userId: string;
  type: 'EARN' | 'SPEND' | 'REFUND' | 'CONVERSION';
  amount: number; // positive for earn, negative for spend
  source: string; // e.g., "reward_redemption", "mission_boost", "subscription_credit"
  description: string;
  timestamp: Date;
  balanceBefore: number;
  balanceAfter: number;
  metadata?: Record<string, any>;
}

export interface MissionFundingOption {
  type: 'CASH' | 'POINTS' | 'HYBRID';
  cashAmount?: number;
  pointsAmount?: number;
  totalReward: number; // equivalent value
}

// Points Marketplace Products Catalog
export const POINTS_MARKETPLACE_PRODUCTS: PointsProduct[] = [
  {
    id: 'mission-featured-week',
    category: PointsProductCategory.VISIBILITY,
    name: 'Featured Mission (1 Week)',
    description: 'Boost your mission to the top of discovery feeds for 7 days',
    pointsCost: 200,
    icon: '🚀',
    duration: '1 week',
    benefits: [
      'Top placement in Explore tab',
      'Priority in search results',
      '3x more visibility',
      'Featured badge'
    ],
    popular: true,
    available: true
  },
  {
    id: 'analytics-premium-month',
    category: PointsProductCategory.PREMIUM_FEATURES,
    name: 'Premium Analytics',
    description: 'Advanced insights and detailed performance metrics',
    pointsCost: 100,
    icon: '📊',
    duration: '1 month',
    benefits: [
      'Customer demographics',
      'Conversion tracking',
      'ROI analysis',
      'Competitor insights',
      'Export reports'
    ],
    available: true
  },
  {
    id: 'business-profile-featured',
    category: PointsProductCategory.VISIBILITY,
    name: 'Featured Business Profile',
    description: 'Highlight your business in local discovery',
    pointsCost: 150,
    icon: '⭐',
    duration: '1 week',
    benefits: [
      'Top of local business listings',
      'Featured badge on profile',
      'Enhanced profile card',
      'Priority in recommendations'
    ],
    available: true
  },
  {
    id: 'mission-points-only',
    category: PointsProductCategory.MISSION_BOOST,
    name: 'Create Points-Only Mission',
    description: 'Fund a mission entirely with points (no cash needed)',
    pointsCost: 50,
    icon: '🎯',
    duration: 'per mission',
    benefits: [
      'No subscription required',
      'Attract point-hungry customers',
      'Build engagement',
      'Test new campaigns'
    ],
    popular: true,
    available: true
  },
  {
    id: 'subscription-credit-10',
    category: PointsProductCategory.SUBSCRIPTION_CREDIT,
    name: '$10 Subscription Credit',
    description: 'Convert points to subscription payment credit',
    pointsCost: 1000,
    icon: '💎',
    duration: 'permanent',
    benefits: [
      'Apply to any subscription',
      'Never expires',
      'Instant credit',
      'Cash equivalent'
    ],
    available: true
  },
  {
    id: 'subscription-credit-50',
    category: PointsProductCategory.SUBSCRIPTION_CREDIT,
    name: '$50 Subscription Credit',
    description: 'Convert points to subscription payment credit',
    pointsCost: 4500,
    icon: '💰',
    duration: 'permanent',
    benefits: [
      'Apply to any subscription',
      'Never expires',
      'Instant credit',
      '10% bonus (500 points savings)'
    ],
    popular: true,
    available: true
  },
  {
    id: 'priority-support',
    category: PointsProductCategory.PREMIUM_FEATURES,
    name: 'Priority Support',
    description: '24/7 priority customer support access',
    pointsCost: 75,
    icon: '🎧',
    duration: '1 month',
    benefits: [
      'Dedicated support line',
      'Response within 1 hour',
      'Account manager',
      'Setup assistance'
    ],
    available: true
  },
  {
    id: 'api-access',
    category: PointsProductCategory.PREMIUM_FEATURES,
    name: 'API Access',
    description: 'Integrate Fluzio with your systems',
    pointsCost: 300,
    icon: '🔌',
    duration: '1 month',
    benefits: [
      'REST API access',
      'Webhook support',
      'Custom integrations',
      'Developer documentation'
    ],
    available: true
  },
  {
    id: 'bulk-missions',
    category: PointsProductCategory.MISSION_BOOST,
    name: 'Bulk Mission Creator',
    description: 'Create up to 10 missions at once',
    pointsCost: 250,
    icon: '📦',
    duration: 'permanent',
    benefits: [
      'Upload CSV templates',
      'Batch scheduling',
      'Time-saving automation',
      'Campaign management'
    ],
    available: true
  },
  {
    id: 'collaboration-spotlight',
    category: PointsProductCategory.B2B_SERVICES,
    name: 'B2B Collaboration Spotlight',
    description: 'Featured in partner discovery feed',
    pointsCost: 180,
    icon: '🤝',
    duration: '2 weeks',
    benefits: [
      'Priority in B2B matches',
      'Enhanced collaboration profile',
      'Direct outreach credits',
      'Partnership analytics'
    ],
    available: true
  }
];

// Conversion rates
export const POINTS_CONVERSION_RATES = {
  POINTS_TO_USD: 100, // 100 points = $1 USD
  USD_TO_POINTS: 100,
  MINIMUM_CONVERSION: 1000, // Minimum 1000 points to convert
  MAXIMUM_MONTHLY_CONVERSION: 10000 // Max 10,000 points per month
};

// Mission funding costs
export const MISSION_POINTS_COSTS = {
  BASE_CREATION: 50, // Cost to create a points-only mission
  PER_PARTICIPANT: 10, // Additional cost per allowed participant
  REWARD_MULTIPLIER: 1.2 // Points cost = reward points × 1.2 (20% platform fee)
};
