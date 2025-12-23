/**
 * Level Progression Requirements for Fluzio Business Levels
 * 
 * Defines what's needed to advance from Level 1 → 6
 */

import { BusinessLevel } from './subscriptionTypes';

export interface LevelRequirementConfig {
  level: BusinessLevel;
  name: string;
  description: string;
  emoji: string;
  
  // Activity Requirements
  minMissionsCreated: number;
  minMeetupsAttended: number;
  minSquadsJoined: number;
  minGrowthCreditsUsed: number;
  
  // Quality Requirements
  minAverageRating: number; // 0-5 stars
  maxViolations: number;
  
  // Verification Requirements
  requiresBusinessVerification: boolean;
  verificationDocuments?: string[]; // List of required docs
  
  // Approval Process
  requiresAdminApproval: boolean;
  autoApproveIfMetrics: boolean; // Auto-approve if all requirements met
  
  // Additional Criteria (text descriptions for admin review)
  additionalCriteria?: string[];
}

// ============================================================================
// LEVEL REQUIREMENTS
// ============================================================================

export const LEVEL_REQUIREMENTS: Record<BusinessLevel, LevelRequirementConfig> = {
  1: {
    level: 1,
    name: 'Explorer',
    description: 'Idea-phase entrepreneurs exploring Fluzio',
    emoji: '🌱',
    minMissionsCreated: 0,
    minMeetupsAttended: 0,
    minSquadsJoined: 0,
    minGrowthCreditsUsed: 0,
    minAverageRating: 0,
    maxViolations: 999,
    requiresBusinessVerification: false,
    requiresAdminApproval: false,
    autoApproveIfMetrics: true,
    additionalCriteria: [
      'Default starting level for all new business users'
    ]
  },
  
  2: {
    level: 2,
    name: 'Builder',
    description: 'Early-stage entrepreneurs starting to create',
    emoji: '🔧',
    minMissionsCreated: 0, // Can upgrade immediately to start creating
    minMeetupsAttended: 2, // Must attend at least 2 meetups as Level 1
    minSquadsJoined: 1,
    minGrowthCreditsUsed: 0,
    minAverageRating: 0, // No rating requirement yet
    maxViolations: 0,
    requiresBusinessVerification: false,
    requiresAdminApproval: false, // Auto-approve to encourage growth
    autoApproveIfMetrics: true,
    additionalCriteria: [
      'Completed profile with business description',
      'Has valid contact information'
    ]
  },
  
  3: {
    level: 3,
    name: 'Operator',
    description: 'Running young businesses with traction',
    emoji: '⚙️',
    minMissionsCreated: 5,
    minMeetupsAttended: 5,
    minSquadsJoined: 2,
    minGrowthCreditsUsed: 100,
    minAverageRating: 4.0,
    maxViolations: 0,
    requiresBusinessVerification: false,
    requiresAdminApproval: true, // Start requiring manual review
    autoApproveIfMetrics: false,
    additionalCriteria: [
      'Active business operations (not just planning)',
      'Consistent platform engagement',
      'Positive community feedback'
    ]
  },
  
  4: {
    level: 4,
    name: 'Growth Leader',
    description: 'Scaling businesses with stable revenue',
    emoji: '🚀',
    minMissionsCreated: 20,
    minMeetupsAttended: 10,
    minSquadsJoined: 3,
    minGrowthCreditsUsed: 500,
    minAverageRating: 4.3,
    maxViolations: 0,
    requiresBusinessVerification: true, // Verification required from here
    verificationDocuments: [
      'Business registration certificate',
      'Tax identification number',
      'Proof of business address'
    ],
    requiresAdminApproval: true,
    autoApproveIfMetrics: false,
    additionalCriteria: [
      'Demonstrated revenue growth',
      'Professional business operations',
      'Multiple completed missions with high satisfaction',
      'Active team or hiring plans'
    ]
  },
  
  5: {
    level: 5,
    name: 'Expert',
    description: 'Experienced businesses, coaches, consultants',
    emoji: '🧠',
    minMissionsCreated: 50,
    minMeetupsAttended: 20,
    minSquadsJoined: 5,
    minGrowthCreditsUsed: 2000,
    minAverageRating: 4.5,
    maxViolations: 0,
    requiresBusinessVerification: true,
    verificationDocuments: [
      'Business registration certificate',
      'Tax identification number',
      'Financial statements or revenue proof',
      'Business bank account verification'
    ],
    requiresAdminApproval: true,
    autoApproveIfMetrics: false,
    additionalCriteria: [
      '5+ years in business OR proven expertise in field',
      'Track record of successful projects/clients',
      'Thought leadership (speaking, content, etc.)',
      'Mentorship or community contributions',
      'Verified customer testimonials'
    ]
  },
  
  6: {
    level: 6,
    name: 'Elite',
    description: 'Top-tier: investors, major brands, agencies',
    emoji: '👑',
    minMissionsCreated: 100,
    minMeetupsAttended: 30,
    minSquadsJoined: 10,
    minGrowthCreditsUsed: 5000,
    minAverageRating: 4.7,
    maxViolations: 0,
    requiresBusinessVerification: true,
    verificationDocuments: [
      'Corporate registration documents',
      'Financial statements (last 2 years)',
      'Tax identification number',
      'Business bank account verification',
      'Professional references'
    ],
    requiresAdminApproval: true,
    autoApproveIfMetrics: false,
    additionalCriteria: [
      'One of the following:',
      '  • Major brand with significant market presence',
      '  • Successfully exited founder',
      '  • Active investor with portfolio',
      '  • Established agency/consultancy with team',
      '  • 10+ years proven business track record',
      'Exceptional platform contribution',
      'Strong industry reputation',
      'Potential to mentor/inspire other businesses'
    ]
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get requirements for a specific level
 */
export function getLevelRequirements(level: BusinessLevel): LevelRequirementConfig {
  return LEVEL_REQUIREMENTS[level];
}

/**
 * Get the next level for progression
 */
export function getNextLevel(currentLevel: BusinessLevel): BusinessLevel | null {
  if (currentLevel >= 6) return null;
  return (currentLevel + 1) as BusinessLevel;
}

/**
 * Check if user meets requirements for next level
 */
export interface EligibilityCheck {
  eligible: boolean;
  currentLevel: BusinessLevel;
  nextLevel: BusinessLevel | null;
  
  // Requirement Status
  requirements: {
    missions: { required: number; current: number; met: boolean };
    meetups: { required: number; current: number; met: boolean };
    squads: { required: number; current: number; met: boolean };
    growthCredits: { required: number; current: number; met: boolean };
    rating: { required: number; current: number; met: boolean };
    violations: { max: number; current: number; met: boolean };
    verification: { required: boolean; verified: boolean; met: boolean };
  };
  
  // Overall Status
  meetsAllRequirements: boolean;
  requiresAdminApproval: boolean;
  canAutoApprove: boolean;
  
  // Missing Items
  missingRequirements: string[];
}

export function checkLevelUpEligibility(
  currentLevel: BusinessLevel,
  stats: {
    missionsCreated: number;
    meetupsAttended: number;
    squadsJoined: number;
    growthCreditsUsed: number;
    averageRating: number;
    violations: number;
    businessVerified: boolean;
  }
): EligibilityCheck {
  const nextLevel = getNextLevel(currentLevel);
  
  if (!nextLevel) {
    return {
      eligible: false,
      currentLevel,
      nextLevel: null,
      requirements: {} as any,
      meetsAllRequirements: false,
      requiresAdminApproval: false,
      canAutoApprove: false,
      missingRequirements: ['Already at maximum level']
    };
  }
  
  const req = LEVEL_REQUIREMENTS[nextLevel];
  
  const requirements = {
    missions: {
      required: req.minMissionsCreated,
      current: stats.missionsCreated,
      met: stats.missionsCreated >= req.minMissionsCreated
    },
    meetups: {
      required: req.minMeetupsAttended,
      current: stats.meetupsAttended,
      met: stats.meetupsAttended >= req.minMeetupsAttended
    },
    squads: {
      required: req.minSquadsJoined,
      current: stats.squadsJoined,
      met: stats.squadsJoined >= req.minSquadsJoined
    },
    growthCredits: {
      required: req.minGrowthCreditsUsed,
      current: stats.growthCreditsUsed,
      met: stats.growthCreditsUsed >= req.minGrowthCreditsUsed
    },
    rating: {
      required: req.minAverageRating,
      current: stats.averageRating,
      met: stats.averageRating >= req.minAverageRating
    },
    violations: {
      max: req.maxViolations,
      current: stats.violations,
      met: stats.violations <= req.maxViolations
    },
    verification: {
      required: req.requiresBusinessVerification,
      verified: stats.businessVerified,
      met: !req.requiresBusinessVerification || stats.businessVerified
    }
  };
  
  const meetsAllRequirements = Object.values(requirements).every(r => r.met);
  
  const missingRequirements: string[] = [];
  if (!requirements.missions.met) {
    missingRequirements.push(`Create ${requirements.missions.required - requirements.missions.current} more missions`);
  }
  if (!requirements.meetups.met) {
    missingRequirements.push(`Attend ${requirements.meetups.required - requirements.meetups.current} more meetups`);
  }
  if (!requirements.squads.met) {
    missingRequirements.push(`Join ${requirements.squads.required - requirements.squads.current} more squads`);
  }
  if (!requirements.growthCredits.met) {
    missingRequirements.push(`Use ${requirements.growthCredits.required - requirements.growthCredits.current} more Growth Credits`);
  }
  if (!requirements.rating.met) {
    missingRequirements.push(`Improve rating to ${requirements.rating.required}+ stars (current: ${requirements.rating.current.toFixed(1)})`);
  }
  if (!requirements.violations.met) {
    missingRequirements.push(`Resolve ${requirements.violations.current} violations`);
  }
  if (!requirements.verification.met) {
    missingRequirements.push('Complete business verification');
  }
  
  const canAutoApprove = req.autoApproveIfMetrics && meetsAllRequirements;
  const eligible = meetsAllRequirements && (!req.requiresAdminApproval || canAutoApprove);
  
  return {
    eligible,
    currentLevel,
    nextLevel,
    requirements,
    meetsAllRequirements,
    requiresAdminApproval: req.requiresAdminApproval,
    canAutoApprove,
    missingRequirements
  };
}

/**
 * Get level-up message for UI
 */
export function getLevelUpMessage(toLevel: BusinessLevel): string {
  const req = LEVEL_REQUIREMENTS[toLevel];
  return `🎉 Congratulations! You've reached Level ${toLevel}: ${req.name} ${req.emoji}`;
}

/**
 * Get all level names and emojis for display
 */
export function getAllLevels(): Array<{ level: BusinessLevel; name: string; emoji: string; description: string }> {
  return Object.values(LEVEL_REQUIREMENTS).map(req => ({
    level: req.level,
    name: req.name,
    emoji: req.emoji,
    description: req.description
  }));
}

export default {
  LEVEL_REQUIREMENTS,
  getLevelRequirements,
  getNextLevel,
  checkLevelUpEligibility,
  getLevelUpMessage,
  getAllLevels
};
