/**
 * Campaign Automation Templates
 * 
 * Automated growth campaigns for L4+ Gold/Platinum users
 * Daily execution with Growth Credits consumption
 */

export type CampaignType = 
  | 'FOLLOWER_GROWTH'
  | 'CITY_LAUNCH'
  | 'INFLUENCER_BURST'
  | 'CROSS_PLATFORM'
  | 'WEEKLY_GROWTH';

export type CampaignStatus = 
  | 'DRAFT'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'INSUFFICIENT_CREDITS';

export interface CampaignTemplate {
  id: string;
  type: CampaignType;
  name: string;
  description: string;
  icon: string;
  
  // Requirements
  minLevel: number;
  minTier: 'GOLD' | 'PLATINUM';
  
  // Duration
  durationDays: number;
  
  // Credits
  dailyCredits: number;
  totalCredits: number;
  
  // Goals
  goals: {
    followers?: number;
    engagement?: number;
    visibility?: number;
  };
  
  // Actions
  dailyActions: {
    followRequests: number;
    contentBoosts: number;
    targetedOutreach: number;
    adSpend?: number;
  };
  
  // Targeting
  targeting: {
    geographic?: 'CITY' | 'REGION' | 'COUNTRY' | 'GLOBAL';
    industries?: string[];
    businessSize?: 'STARTUP' | 'SMB' | 'ENTERPRISE';
    interestTags?: string[];
  };
  
  // Features
  features: string[];
  
  // Success metrics
  successMetrics: {
    minFollowersGained: number;
    minEngagementRate: number;
    minProfileViews: number;
  };
}

// ============================================================================
// CAMPAIGN TEMPLATES
// ============================================================================

export const CAMPAIGN_TEMPLATES: Record<CampaignType, CampaignTemplate> = {
  FOLLOWER_GROWTH: {
    id: 'follower-growth-7day',
    type: 'FOLLOWER_GROWTH',
    name: 'Rapid Follower Growth',
    description: 'Gain 1,000 targeted followers in 7 days with automated outreach and engagement',
    icon: '📈',
    
    minLevel: 4,
    minTier: 'GOLD',
    
    durationDays: 7,
    dailyCredits: 700,
    totalCredits: 4900,
    
    goals: {
      followers: 1000,
      engagement: 500,
      visibility: 10000
    },
    
    dailyActions: {
      followRequests: 150,
      contentBoosts: 3,
      targetedOutreach: 50,
      adSpend: 0
    },
    
    targeting: {
      geographic: 'COUNTRY',
      industries: [],
      businessSize: 'SMB',
      interestTags: []
    },
    
    features: [
      'Automated follow/unfollow',
      'Smart targeting based on your profile',
      'Daily content boosting',
      'Engagement automation',
      'Real-time analytics',
      'Performance optimization',
      'A/B testing of outreach messages'
    ],
    
    successMetrics: {
      minFollowersGained: 800,
      minEngagementRate: 0.05,
      minProfileViews: 5000
    }
  },
  
  CITY_LAUNCH: {
    id: 'city-launch-14day',
    type: 'CITY_LAUNCH',
    name: 'City Launch Campaign',
    description: 'Dominate your local market in 14 days with hyper-targeted city-wide promotion',
    icon: '🏙️',
    
    minLevel: 4,
    minTier: 'GOLD',
    
    durationDays: 14,
    dailyCredits: 500,
    totalCredits: 7000,
    
    goals: {
      followers: 500,
      engagement: 1000,
      visibility: 20000
    },
    
    dailyActions: {
      followRequests: 100,
      contentBoosts: 5,
      targetedOutreach: 75,
      adSpend: 0
    },
    
    targeting: {
      geographic: 'CITY',
      industries: [],
      businessSize: 'SMB',
      interestTags: []
    },
    
    features: [
      'Geo-targeted promotions',
      'Local business partnerships',
      'City-wide event notifications',
      'Featured in local searches',
      'Meetup promotion',
      'Mission visibility boost',
      'Local influencer collaboration',
      'Community engagement'
    ],
    
    successMetrics: {
      minFollowersGained: 400,
      minEngagementRate: 0.08,
      minProfileViews: 15000
    }
  },
  
  INFLUENCER_BURST: {
    id: 'influencer-burst-3day',
    type: 'INFLUENCER_BURST',
    name: 'Influencer Burst',
    description: 'Explosive 3-day campaign targeting high-value influencers and decision makers',
    icon: '⚡',
    
    minLevel: 4,
    minTier: 'PLATINUM',
    
    durationDays: 3,
    dailyCredits: 1000,
    totalCredits: 3000,
    
    goals: {
      followers: 300,
      engagement: 800,
      visibility: 15000
    },
    
    dailyActions: {
      followRequests: 50,
      contentBoosts: 10,
      targetedOutreach: 30,
      adSpend: 0
    },
    
    targeting: {
      geographic: 'GLOBAL',
      industries: [],
      businessSize: 'ENTERPRISE',
      interestTags: []
    },
    
    features: [
      'VIP influencer targeting',
      'Premium content placement',
      'Priority messaging',
      'High-value networking',
      'Executive outreach',
      'Thought leadership positioning',
      'Strategic partnerships',
      'Media mentions'
    ],
    
    successMetrics: {
      minFollowersGained: 200,
      minEngagementRate: 0.15,
      minProfileViews: 10000
    }
  },
  
  CROSS_PLATFORM: {
    id: 'cross-platform-30day',
    type: 'CROSS_PLATFORM',
    name: 'Cross-Platform Expansion',
    description: 'Expand your presence across multiple platforms over 30 days',
    icon: '🌐',
    
    minLevel: 5,
    minTier: 'GOLD',
    
    durationDays: 30,
    dailyCredits: 300,
    totalCredits: 9000,
    
    goals: {
      followers: 2000,
      engagement: 3000,
      visibility: 50000
    },
    
    dailyActions: {
      followRequests: 75,
      contentBoosts: 4,
      targetedOutreach: 40,
      adSpend: 0
    },
    
    targeting: {
      geographic: 'GLOBAL',
      industries: [],
      businessSize: 'SMB',
      interestTags: []
    },
    
    features: [
      'Multi-platform synchronization',
      'Cross-posting automation',
      'Unified analytics',
      'Platform-specific optimization',
      'Audience overlap analysis',
      'Content repurposing',
      'Platform-specific targeting',
      'Integrated campaigns'
    ],
    
    successMetrics: {
      minFollowersGained: 1500,
      minEngagementRate: 0.06,
      minProfileViews: 40000
    }
  },
  
  WEEKLY_GROWTH: {
    id: 'weekly-growth-ongoing',
    type: 'WEEKLY_GROWTH',
    name: 'Steady Weekly Growth',
    description: 'Consistent weekly growth on autopilot - set it and forget it',
    icon: '📊',
    
    minLevel: 4,
    minTier: 'PLATINUM',
    
    durationDays: 365, // Ongoing
    dailyCredits: 200,
    totalCredits: 73000, // Annual
    
    goals: {
      followers: 100, // Per week
      engagement: 150,
      visibility: 2000
    },
    
    dailyActions: {
      followRequests: 30,
      contentBoosts: 2,
      targetedOutreach: 20,
      adSpend: 0
    },
    
    targeting: {
      geographic: 'COUNTRY',
      industries: [],
      businessSize: 'SMB',
      interestTags: []
    },
    
    features: [
      'Fully automated',
      'Adaptive targeting',
      'Auto-adjusting based on performance',
      'Seasonal optimization',
      'Continuous A/B testing',
      'Smart budget allocation',
      'Weekly reports',
      'Performance alerts'
    ],
    
    successMetrics: {
      minFollowersGained: 80, // Per week
      minEngagementRate: 0.04,
      minProfileViews: 1500
    }
  }
};

// ============================================================================
// CAMPAIGN INSTANCE INTERFACE
// ============================================================================

export interface CampaignInstance {
  id: string;
  userId: string;
  templateType: CampaignType;
  
  // Status
  status: CampaignStatus;
  
  // Timing
  startDate: Date;
  endDate: Date;
  lastExecutionDate?: Date;
  nextExecutionDate?: Date;
  
  // Progress
  daysElapsed: number;
  daysRemaining: number;
  
  // Credits
  creditsUsed: number;
  creditsRemaining: number;
  
  // Results
  results: {
    followersGained: number;
    engagementGenerated: number;
    profileViews: number;
    missionsCreated: number;
    meetupsHosted: number;
    connectionsEstablished: number;
  };
  
  // Daily logs
  dailyLogs: {
    date: Date;
    creditsSpent: number;
    followersGained: number;
    engagementRate: number;
    profileViews: number;
    actions: {
      followRequestsSent: number;
      contentBoosted: number;
      outreachMessages: number;
    };
  }[];
  
  // Settings
  settings: {
    autoRenew: boolean;
    pauseIfLowCredits: boolean;
    notifyOnMilestones: boolean;
    targetIndustries: string[];
    excludeCompetitors: boolean;
  };
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get campaign template by type
 */
export function getCampaignTemplate(type: CampaignType): CampaignTemplate {
  return CAMPAIGN_TEMPLATES[type];
}

/**
 * Get all available campaigns for user's level and tier
 */
export function getAvailableCampaigns(
  level: number,
  tier: 'BASIC' | 'SILVER' | 'GOLD' | 'PLATINUM'
): CampaignTemplate[] {
  return Object.values(CAMPAIGN_TEMPLATES).filter(template => {
    if (level < template.minLevel) return false;
    
    if (template.minTier === 'PLATINUM' && tier !== 'PLATINUM') return false;
    if (template.minTier === 'GOLD' && tier !== 'GOLD' && tier !== 'PLATINUM') return false;
    
    return true;
  });
}

/**
 * Check if user can start a campaign
 */
export function canStartCampaign(
  level: number,
  tier: 'BASIC' | 'SILVER' | 'GOLD' | 'PLATINUM',
  availableCredits: number,
  template: CampaignTemplate
): { allowed: boolean; reason?: string } {
  if (level < template.minLevel) {
    return { allowed: false, reason: `Requires Level ${template.minLevel}+` };
  }
  
  if (template.minTier === 'PLATINUM' && tier !== 'PLATINUM') {
    return { allowed: false, reason: 'Requires Platinum tier' };
  }
  
  if (template.minTier === 'GOLD' && tier !== 'GOLD' && tier !== 'PLATINUM') {
    return { allowed: false, reason: 'Requires Gold or Platinum tier' };
  }
  
  if (availableCredits < template.dailyCredits * 3) {
    return { 
      allowed: false, 
      reason: `Insufficient credits. Need at least ${template.dailyCredits * 3} to start (3 days minimum)` 
    };
  }
  
  return { allowed: true };
}

/**
 * Calculate campaign progress
 */
export function calculateCampaignProgress(campaign: CampaignInstance): {
  percentComplete: number;
  creditsPercentUsed: number;
  onTrack: boolean;
  projectedResults: {
    followers: number;
    engagement: number;
    visibility: number;
  };
} {
  const template = getCampaignTemplate(campaign.templateType);
  const percentComplete = (campaign.daysElapsed / template.durationDays) * 100;
  const creditsPercentUsed = (campaign.creditsUsed / template.totalCredits) * 100;
  
  // Calculate if on track
  const expectedFollowers = (template.goals.followers || 0) * (percentComplete / 100);
  const onTrack = campaign.results.followersGained >= expectedFollowers * 0.8; // Within 80%
  
  // Project final results based on current rate
  const dailyRate = campaign.daysElapsed > 0 
    ? campaign.results.followersGained / campaign.daysElapsed 
    : 0;
  const projectedFollowers = dailyRate * template.durationDays;
  
  return {
    percentComplete: Math.min(100, percentComplete),
    creditsPercentUsed: Math.min(100, creditsPercentUsed),
    onTrack,
    projectedResults: {
      followers: Math.round(projectedFollowers),
      engagement: Math.round(projectedFollowers * 0.5),
      visibility: Math.round(projectedFollowers * 10)
    }
  };
}

/**
 * Estimate campaign ROI
 */
export function estimateCampaignROI(template: CampaignTemplate, creditCost: number): {
  totalInvestment: number;
  projectedFollowers: number;
  costPerFollower: number;
  estimatedValue: number;
  roi: number;
} {
  const totalInvestment = (template.totalCredits / 100) * creditCost; // Credits to EUR
  const projectedFollowers = template.goals.followers || 0;
  const costPerFollower = projectedFollowers > 0 ? totalInvestment / projectedFollowers : 0;
  
  // Estimate value: each follower worth ~€5 in potential business
  const estimatedValue = projectedFollowers * 5;
  const roi = totalInvestment > 0 ? ((estimatedValue - totalInvestment) / totalInvestment) * 100 : 0;
  
  return {
    totalInvestment,
    projectedFollowers,
    costPerFollower,
    estimatedValue,
    roi
  };
}

export default {
  CAMPAIGN_TEMPLATES,
  getCampaignTemplate,
  getAvailableCampaigns,
  canStartCampaign,
  calculateCampaignProgress,
  estimateCampaignROI
};
