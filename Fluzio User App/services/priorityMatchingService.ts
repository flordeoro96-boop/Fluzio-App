import { db } from './apiService';
import { doc, getDoc } from '../services/firestoreCompat';
import { Project } from '../types';
import { getUserFeatures } from './creatorPlusService';

/**
 * Priority Matching Service
 * AI-boosted opportunity matching for Creator Plus users
 * Fair system that boosts genuinely good fits, not just any opportunity
 */

interface SkillMatch {
  skill: string;
  confidence: number; // 0-1
}

interface OpportunityMatch {
  project: Project;
  matchScore: number; // 0-100
  matchedSkills: SkillMatch[];
  isCreatorPlus: boolean;
  isPriorityMatch: boolean;
  matchReason: string;
}

/**
 * Calculate skill match score between creator and project
 */
const calculateSkillMatchScore = (
  creatorSkills: string[],
  projectRoles: { role: string; description?: string }[]
): { score: number; matches: SkillMatch[] } => {
  if (!creatorSkills || creatorSkills.length === 0) {
    return { score: 0, matches: [] };
  }

  if (!projectRoles || projectRoles.length === 0) {
    return { score: 0, matches: [] };
  }

  const matches: SkillMatch[] = [];
  let totalConfidence = 0;

  // Normalize skills for comparison
  const normalizedCreatorSkills = creatorSkills.map(s => s.toLowerCase().trim());
  
  // Check each project role against creator skills
  projectRoles.forEach(role => {
    const roleText = `${role.role} ${role.description || ''}`.toLowerCase();
    
    normalizedCreatorSkills.forEach(skill => {
      // Direct match: role name contains skill or vice versa
      if (roleText.includes(skill) || skill.includes(role.role.toLowerCase())) {
        const confidence = 1.0;
        matches.push({ skill, confidence });
        totalConfidence += confidence;
        return;
      }

      // Fuzzy match: check for related terms
      const relatedMatches = getRelatedSkills(skill);
      for (const related of relatedMatches) {
        if (roleText.includes(related)) {
          const confidence = 0.7;
          matches.push({ skill, confidence });
          totalConfidence += confidence;
          break;
        }
      }
    });
  });

  // Remove duplicates and keep highest confidence
  const uniqueMatches = matches.reduce((acc, match) => {
    const existing = acc.find(m => m.skill === match.skill);
    if (!existing || existing.confidence < match.confidence) {
      return [...acc.filter(m => m.skill !== match.skill), match];
    }
    return acc;
  }, [] as SkillMatch[]);

  // Calculate score (0-100)
  const score = uniqueMatches.length > 0
    ? Math.min(100, (totalConfidence / normalizedCreatorSkills.length) * 100)
    : 0;

  return { score, matches: uniqueMatches };
};

/**
 * Get related skills for fuzzy matching
 */
const getRelatedSkills = (skill: string): string[] => {
  const relatedTerms: Record<string, string[]> = {
    'photographer': ['photography', 'photo', 'photoshoot', 'camera'],
    'videographer': ['video', 'videography', 'filming', 'cinematography'],
    'designer': ['design', 'graphic', 'creative', 'visual'],
    'writer': ['writing', 'content', 'copywriting', 'blog'],
    'influencer': ['social media', 'instagram', 'tiktok', 'content creator'],
    'model': ['modeling', 'fashion', 'runway'],
    'editor': ['editing', 'post-production', 'montage'],
    'marketer': ['marketing', 'promotion', 'advertising'],
    'developer': ['development', 'coding', 'programming', 'software'],
    'stylist': ['styling', 'fashion', 'wardrobe'],
  };

  const normalized = skill.toLowerCase();
  
  // Check if skill matches any key
  for (const [key, values] of Object.entries(relatedTerms)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return values;
    }
    // Check if skill matches any value
    if (values.some(v => normalized.includes(v) || v.includes(normalized))) {
      return [key, ...values.filter(v => v !== normalized)];
    }
  }

  return [];
};

/**
 * Calculate location proximity score
 */
const calculateLocationScore = (
  creatorCity: string,
  projectCity: string,
  creatorRadius: number = 50
): number => {
  if (!creatorCity || !projectCity) return 50; // Neutral score if location unknown

  const normalizedCreatorCity = creatorCity.toLowerCase().trim();
  const normalizedProjectCity = projectCity.toLowerCase().trim();

  // Exact match: 100
  if (normalizedCreatorCity === normalizedProjectCity) return 100;

  // Partial match (e.g., "Amsterdam" in "Amsterdam, Netherlands"): 80
  if (normalizedCreatorCity.includes(normalizedProjectCity) || 
      normalizedProjectCity.includes(normalizedCreatorCity)) {
    return 80;
  }

  // Different cities but within radius: 60
  // In real implementation, would use geolocation API
  // For now, assume medium distance
  return 40;
};

/**
 * Calculate budget compatibility score
 */
const calculateBudgetScore = (
  creatorRate: number | undefined,
  projectBudget: number
): number => {
  if (!creatorRate || creatorRate === 0) return 70; // Neutral if no rate set

  const difference = Math.abs(projectBudget - creatorRate);
  const percentDifference = difference / Math.max(projectBudget, creatorRate);

  if (percentDifference <= 0.1) return 100; // Within 10%
  if (percentDifference <= 0.2) return 85;  // Within 20%
  if (percentDifference <= 0.3) return 70;  // Within 30%
  if (percentDifference <= 0.5) return 50;  // Within 50%
  return 30; // Beyond 50%
};

/**
 * Apply Creator Plus boost to match score
 * Only boosts genuinely good matches (score > 40)
 * Fair system: doesn't show bad matches to Plus users
 */
const applyCreatorPlusBoost = (baseScore: number, isCreatorPlus: boolean): number => {
  if (!isCreatorPlus) return baseScore;

  // Only boost if there's a decent base match (score > 40)
  if (baseScore < 40) {
    return baseScore; // No boost for poor matches - stay fair!
  }

  // Good matches get a 10% boost
  if (baseScore >= 40 && baseScore < 70) {
    return Math.min(100, baseScore + 10);
  }

  // Great matches get a 5% boost (already strong)
  if (baseScore >= 70) {
    return Math.min(100, baseScore + 5);
  }

  return baseScore;
};

/**
 * Calculate comprehensive match score for a project
 */
export const calculateOpportunityMatch = async (
  userId: string,
  project: Project,
  creatorSkills: string[],
  creatorCity: string,
  creatorRadius: number,
  creatorRate?: number
): Promise<OpportunityMatch> => {
  // Check if user has Creator Plus
  const features = await getUserFeatures(userId);
  const isCreatorPlus = features.priorityMatching;

  // Calculate component scores
  const rolesForMatching = (project.creatorRoles || []).map(r => ({
    role: r.title || '',
    description: undefined
  }));
  const skillMatch = calculateSkillMatchScore(creatorSkills, rolesForMatching);
  const locationScore = calculateLocationScore(creatorCity, project.city, creatorRadius);
  
  // Get average budget from creator roles
  const avgBudget = project.creatorRoles && project.creatorRoles.length > 0
    ? project.creatorRoles.reduce((sum, r) => sum + (r.budget || 0), 0) / project.creatorRoles.length
    : 0;
  const budgetScore = calculateBudgetScore(creatorRate, avgBudget);

  // Weighted average: Skills 60%, Location 25%, Budget 15%
  const baseScore = (
    skillMatch.score * 0.60 +
    locationScore * 0.25 +
    budgetScore * 0.15
  );

  // Apply Creator Plus boost (fair system)
  const finalScore = applyCreatorPlusBoost(baseScore, isCreatorPlus);

  // Determine if this is a priority match (score > 70 after boost)
  const isPriorityMatch = isCreatorPlus && finalScore >= 70;

  // Generate match reason
  const matchReason = generateMatchReason(skillMatch, locationScore, budgetScore, isCreatorPlus);

  return {
    project,
    matchScore: Math.round(finalScore),
    matchedSkills: skillMatch.matches,
    isCreatorPlus,
    isPriorityMatch,
    matchReason
  };
};

/**
 * Generate human-readable match reason
 */
const generateMatchReason = (
  skillMatch: { score: number; matches: SkillMatch[] },
  locationScore: number,
  budgetScore: number,
  isCreatorPlus: boolean
): string => {
  const reasons: string[] = [];

  if (skillMatch.score >= 80) {
    reasons.push(`Perfect skill match (${skillMatch.matches.length} skills)`);
  } else if (skillMatch.score >= 60) {
    reasons.push(`Strong skill match (${skillMatch.matches.length} skills)`);
  } else if (skillMatch.score >= 40) {
    reasons.push(`Good skill match (${skillMatch.matches.length} skills)`);
  }

  if (locationScore >= 80) {
    reasons.push('Same city');
  } else if (locationScore >= 60) {
    reasons.push('Nearby location');
  }

  if (budgetScore >= 85) {
    reasons.push('Perfect rate match');
  } else if (budgetScore >= 70) {
    reasons.push('Compatible budget');
  }

  if (isCreatorPlus && reasons.length > 0) {
    reasons.push('Creator Plus priority');
  }

  return reasons.length > 0
    ? reasons.join(' • ')
    : 'Opportunity in your area';
};

/**
 * Sort opportunities by match score
 * Creator Plus users see better matches first
 */
export const sortOpportunitiesByMatch = async (
  userId: string,
  projects: Project[],
  creatorSkills: string[],
  creatorCity: string,
  creatorRadius: number,
  creatorRate?: number
): Promise<OpportunityMatch[]> => {
  // Calculate match scores for all projects
  const matchPromises = projects.map(project =>
    calculateOpportunityMatch(
      userId,
      project,
      creatorSkills,
      creatorCity,
      creatorRadius,
      creatorRate
    )
  );

  const matches = await Promise.all(matchPromises);

  // Sort by match score (highest first)
  return matches.sort((a, b) => b.matchScore - a.matchScore);
};

/**
 * Get top N opportunities for a creator
 * Returns best matches, prioritized for Creator Plus users
 */
export const getTopOpportunities = async (
  userId: string,
  projects: Project[],
  creatorSkills: string[],
  creatorCity: string,
  creatorRadius: number,
  limit: number = 10,
  creatorRate?: number
): Promise<OpportunityMatch[]> => {
  const sortedMatches = await sortOpportunitiesByMatch(
    userId,
    projects,
    creatorSkills,
    creatorCity,
    creatorRadius,
    creatorRate
  );

  // Return top N matches
  return sortedMatches.slice(0, limit);
};

/**
 * Check if a project is a good match for a creator
 * Used to decide whether to show opportunity badge
 */
export const isGoodMatch = async (
  userId: string,
  project: Project,
  creatorSkills: string[],
  creatorCity: string,
  creatorRadius: number,
  creatorRate?: number
): Promise<boolean> => {
  const match = await calculateOpportunityMatch(
    userId,
    project,
    creatorSkills,
    creatorCity,
    creatorRadius,
    creatorRate
  );

  // Consider it a good match if score >= 60
  return match.matchScore >= 60;
};

export default {
  calculateOpportunityMatch,
  sortOpportunitiesByMatch,
  getTopOpportunities,
  isGoodMatch
};
