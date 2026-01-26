/**
 * Fair Value Guardrails Service
 * 
 * Provides pricing guidance for reward creation:
 * - Calculate local average point costs
 * - Show recommended ranges (70%-130% of average)
 * - Display warnings if outside range
 * - Allow override (soft warnings, not hard blocks)
 * - Log pricing deviations for analytics
 */

import { db } from './apiService';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  Timestamp,
  orderBy,
  limit
} from '../services/firestoreCompat';
import { FairValueGuardrails, Reward, RewardCategory } from '../types/rewards';

// ============================================================================
// FAIR VALUE CALCULATION
// ============================================================================

/**
 * Calculate fair value guardrails for a reward
 * 
 * @param category - Reward category (e.g., 'discount', 'freeItem', 'experience')
 * @param businessLocation - Business location (for local averaging)
 * @param businessId - Current business ID (exclude from average)
 * @param estimatedValue - Estimated dollar value of reward
 * @param userInputCost - Points cost the business wants to set
 */
export async function calculateFairValueGuardrails(
  category: RewardCategory | string,
  businessLocation: string,
  businessId: string,
  estimatedValue?: number,
  userInputCost?: number
): Promise<FairValueGuardrails> {
  try {
    // Get local average for similar rewards
    const localAverage = await getLocalAveragePoints(category, businessLocation, businessId);
    
    // If no local data, use value-based estimation
    if (localAverage === 0 && estimatedValue) {
      return getValueBasedGuardrails(estimatedValue, userInputCost);
    }
    
    // Calculate recommended range (70%-130% of average)
    const recommendedMin = Math.round(localAverage * 0.7);
    const recommendedMax = Math.round(localAverage * 1.3);
    
    // If no user input, return average guidance
    if (!userInputCost) {
      return {
        localAverage,
        recommendedMin,
        recommendedMax,
        userInputCost: localAverage,
        deviation: 0,
        isOutsideRange: false
      };
    }
    
    // Calculate deviation
    const deviation = ((userInputCost - localAverage) / localAverage) * 100;
    const isOutsideRange = userInputCost < recommendedMin || userInputCost > recommendedMax;
    
    // Generate warning message
    let warningMessage: string | undefined;
    if (isOutsideRange) {
      if (userInputCost < recommendedMin) {
        const percentBelow = Math.round(((recommendedMin - userInputCost) / recommendedMin) * 100);
        warningMessage = `⚠️ This price is ${percentBelow}% below the local average (${localAverage} points). Consider if this is sustainable for your business.`;
      } else {
        const percentAbove = Math.round(((userInputCost - recommendedMax) / recommendedMax) * 100);
        warningMessage = `⚠️ This price is ${percentAbove}% above the local average (${localAverage} points). Customers may find this expensive compared to similar rewards.`;
      }
    }
    
    return {
      localAverage,
      recommendedMin,
      recommendedMax,
      userInputCost,
      deviation,
      isOutsideRange,
      warningMessage
    };
    
  } catch (error) {
    console.error('[FairValueGuardrails] Error calculating guardrails:', error);
    
    // Fallback to value-based estimation
    if (estimatedValue && userInputCost) {
      return getValueBasedGuardrails(estimatedValue, userInputCost);
    }
    
    // Return permissive guardrails if all else fails
    return {
      localAverage: userInputCost || 100,
      recommendedMin: 0,
      recommendedMax: 999999,
      userInputCost: userInputCost || 100,
      deviation: 0,
      isOutsideRange: false,
      warningMessage: 'Unable to calculate local average. Price will be logged for future analysis.'
    };
  }
}

/**
 * Get local average point cost for similar rewards
 */
async function getLocalAveragePoints(
  category: string,
  businessLocation: string,
  excludeBusinessId: string
): Promise<number> {
  try {
    const rewardsRef = collection(db, 'rewards');
    
    // Query similar rewards by category
    const q = query(
      rewardsRef,
      where('category', '==', category),
      where('isActive', '==', true)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log(`[FairValueGuardrails] No rewards found for category: ${category}`);
      return 0;
    }
    
    // Filter rewards (exclude current business, focus on nearby locations)
    const rewards = snapshot.docs
      .map(doc => doc.data() as Reward)
      .filter(reward => 
        reward.businessId !== excludeBusinessId &&
        reward.pointsCost > 0 &&
        isNearbyLocation(reward.businessId || '', businessLocation)
      );
    
    if (rewards.length === 0) {
      console.log(`[FairValueGuardrails] No nearby rewards found for comparison`);
      return 0;
    }
    
    // Calculate average
    const totalPoints = rewards.reduce((sum, reward) => sum + reward.pointsCost, 0);
    const average = Math.round(totalPoints / rewards.length);
    
    console.log(`[FairValueGuardrails] Found ${rewards.length} similar rewards, average: ${average} points`);
    
    return average;
    
  } catch (error) {
    console.error('[FairValueGuardrails] Error fetching local average:', error);
    return 0;
  }
}

/**
 * Check if two locations are nearby (simple string comparison)
 * TODO: Implement proper geolocation distance calculation
 */
function isNearbyLocation(location1: string, location2: string): boolean {
  if (!location1 || !location2) return true; // Include if no location data
  
  // Simple comparison: same city/state
  const loc1 = location1.toLowerCase().trim();
  const loc2 = location2.toLowerCase().trim();
  
  // Extract city (assume format "City, State" or "City")
  const city1 = loc1.split(',')[0];
  const city2 = loc2.split(',')[0];
  
  return city1 === city2;
}

/**
 * Get value-based guardrails when no local data exists
 * Uses estimated dollar value to suggest point cost
 */
function getValueBasedGuardrails(
  estimatedValue: number,
  userInputCost?: number
): FairValueGuardrails {
  // Rough conversion: $1 = 10 points (adjust based on your economy)
  const POINTS_PER_DOLLAR = 10;
  
  const suggestedCost = Math.round(estimatedValue * POINTS_PER_DOLLAR);
  const recommendedMin = Math.round(suggestedCost * 0.7);
  const recommendedMax = Math.round(suggestedCost * 1.3);
  
  if (!userInputCost) {
    return {
      localAverage: suggestedCost,
      recommendedMin,
      recommendedMax,
      userInputCost: suggestedCost,
      deviation: 0,
      isOutsideRange: false,
      warningMessage: `Based on estimated value of $${estimatedValue}, suggested cost is ${suggestedCost} points. (No local data available for comparison)`
    };
  }
  
  const deviation = ((userInputCost - suggestedCost) / suggestedCost) * 100;
  const isOutsideRange = userInputCost < recommendedMin || userInputCost > recommendedMax;
  
  let warningMessage: string | undefined;
  if (isOutsideRange) {
    if (userInputCost < recommendedMin) {
      warningMessage = `⚠️ This price seems low for a reward worth $${estimatedValue}. Consider if this is sustainable.`;
    } else {
      warningMessage = `⚠️ This price seems high for a reward worth $${estimatedValue}. Customers may find this expensive.`;
    }
  }
  
  return {
    localAverage: suggestedCost,
    recommendedMin,
    recommendedMax,
    userInputCost,
    deviation,
    isOutsideRange,
    warningMessage
  };
}

// ============================================================================
// DEVIATION LOGGING
// ============================================================================

/**
 * Log pricing deviation for analytics
 * Called when business creates reward outside recommended range
 */
export async function logPricingDeviation(
  businessId: string,
  rewardId: string,
  guardrails: FairValueGuardrails,
  metadata?: {
    rewardTitle?: string;
    category?: string;
    estimatedValue?: number;
  }
): Promise<void> {
  try {
    await addDoc(collection(db, 'pricingDeviations'), {
      businessId,
      rewardId,
      localAverage: guardrails.localAverage,
      recommendedMin: guardrails.recommendedMin,
      recommendedMax: guardrails.recommendedMax,
      actualCost: guardrails.userInputCost,
      deviation: guardrails.deviation,
      isOutsideRange: guardrails.isOutsideRange,
      timestamp: Timestamp.now(),
      ...metadata
    });
    
    console.log(`[FairValueGuardrails] ✅ Logged pricing deviation for reward ${rewardId}`);
    
  } catch (error) {
    console.error('[FairValueGuardrails] ❌ Error logging deviation:', error);
  }
}

/**
 * Get pricing deviation statistics for a business
 */
export async function getPricingDeviationStats(businessId: string): Promise<{
  totalRewards: number;
  deviationsCount: number;
  deviationRate: number;
  averageDeviation: number;
  recentDeviations: any[];
}> {
  try {
    // Get all pricing deviations for this business
    const deviationsRef = collection(db, 'pricingDeviations');
    const q = query(
      deviationsRef,
      where('businessId', '==', businessId),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
    
    const snapshot = await getDocs(q);
    const deviations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.() || new Date()
    }));
    
    // Calculate statistics
    const totalRewards = deviations.length;
    const deviationsCount = deviations.filter((d: any) => d.isOutsideRange).length;
    const deviationRate = totalRewards > 0 ? (deviationsCount / totalRewards) * 100 : 0;
    
    const totalDeviation = deviations.reduce((sum, d: any) => sum + Math.abs(d.deviation || 0), 0);
    const averageDeviation = totalRewards > 0 ? totalDeviation / totalRewards : 0;
    
    return {
      totalRewards,
      deviationsCount,
      deviationRate: Math.round(deviationRate),
      averageDeviation: Math.round(averageDeviation),
      recentDeviations: deviations.slice(0, 10)
    };
    
  } catch (error) {
    console.error('[FairValueGuardrails] Error fetching deviation stats:', error);
    return {
      totalRewards: 0,
      deviationsCount: 0,
      deviationRate: 0,
      averageDeviation: 0,
      recentDeviations: []
    };
  }
}

/**
 * Get top performing price points for a category
 */
export async function getTopPerformingPricePoints(
  category: string,
  limit: number = 10
): Promise<Array<{ pointsCost: number; redemptionCount: number; rewardTitle: string }>> {
  try {
    // Get rewards in category
    const rewardsRef = collection(db, 'rewards');
    const q = query(
      rewardsRef,
      where('category', '==', category),
      where('isActive', '==', true)
    );
    
    const snapshot = await getDocs(q);
    const rewards = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Reward[];
    
    // Count redemptions for each reward
    const rewardsWithRedemptions = await Promise.all(
      rewards.map(async (reward) => {
        const redemptionsRef = collection(db, 'redeemedRewards');
        const redemptionQuery = query(
          redemptionsRef,
          where('rewardId', '==', reward.id),
          where('status', 'in', ['USED', 'APPROVED'])
        );
        
        const redemptionSnapshot = await getDocs(redemptionQuery);
        
        return {
          pointsCost: reward.pointsCost,
          redemptionCount: redemptionSnapshot.size,
          rewardTitle: reward.title
        };
      })
    );
    
    // Sort by redemption count
    return rewardsWithRedemptions
      .filter(r => r.redemptionCount > 0)
      .sort((a, b) => b.redemptionCount - a.redemptionCount)
      .slice(0, limit);
    
  } catch (error) {
    console.error('[FairValueGuardrails] Error fetching top price points:', error);
    return [];
  }
}

/**
 * Validate reward pricing before creation
 * Returns recommendations and warnings (does NOT block creation)
 */
export async function validateRewardPricing(
  reward: Partial<Reward>,
  businessId: string
): Promise<{
  isValid: boolean;
  guardrails: FairValueGuardrails;
  recommendations: string[];
  warnings: string[];
}> {
  const recommendations: string[] = [];
  const warnings: string[] = [];
  
  // Calculate guardrails
  const guardrails = await calculateFairValueGuardrails(
    reward.category || 'other',
    reward.businessId || '',
    businessId,
    (reward as any).estimatedValue || reward.minPointsRequired,
    reward.pointsCost
  );
  
  // Generate recommendations
  if (guardrails.isOutsideRange) {
    if (reward.pointsCost && reward.pointsCost < guardrails.recommendedMin) {
      warnings.push(`Price is ${Math.round(guardrails.deviation)}% below local average`);
      recommendations.push(`Consider pricing between ${guardrails.recommendedMin}-${guardrails.recommendedMax} points`);
    } else if (reward.pointsCost && reward.pointsCost > guardrails.recommendedMax) {
      warnings.push(`Price is ${Math.round(guardrails.deviation)}% above local average`);
      recommendations.push(`Lower prices typically see higher redemption rates`);
    }
  } else {
    recommendations.push(`✅ Price is within recommended range for this category`);
  }
  
  // Check if price is suspiciously low
  if (reward.pointsCost && reward.pointsCost < 10) {
    warnings.push('Very low point cost may not be sustainable long-term');
  }
  
  // Check if price is suspiciously high
  if (reward.pointsCost && reward.pointsCost > 1000) {
    warnings.push('High point cost may limit customer engagement');
    recommendations.push('Consider breaking this into multiple smaller rewards');
  }
  
  return {
    isValid: true, // Always valid (soft warnings only)
    guardrails,
    recommendations,
    warnings
  };
}

/**
 * Get pricing insights for reward creation UI
 */
export async function getPricingInsights(
  category: string,
  businessLocation: string
): Promise<{
  averageCost: number;
  medianCost: number;
  minCost: number;
  maxCost: number;
  sampleSize: number;
}> {
  try {
    const rewardsRef = collection(db, 'rewards');
    const q = query(
      rewardsRef,
      where('category', '==', category),
      where('isActive', '==', true)
    );
    
    const snapshot = await getDocs(q);
    const rewards = snapshot.docs
      .map(doc => doc.data() as Reward)
      .filter(r => r.pointsCost > 0);
    
    if (rewards.length === 0) {
      return {
        averageCost: 0,
        medianCost: 0,
        minCost: 0,
        maxCost: 0,
        sampleSize: 0
      };
    }
    
    const costs = rewards.map(r => r.pointsCost).sort((a, b) => a - b);
    const totalCost = costs.reduce((sum, cost) => sum + cost, 0);
    
    return {
      averageCost: Math.round(totalCost / costs.length),
      medianCost: costs[Math.floor(costs.length / 2)],
      minCost: costs[0],
      maxCost: costs[costs.length - 1],
      sampleSize: costs.length
    };
    
  } catch (error) {
    console.error('[FairValueGuardrails] Error fetching pricing insights:', error);
    return {
      averageCost: 0,
      medianCost: 0,
      minCost: 0,
      maxCost: 0,
      sampleSize: 0
    };
  }
}
