import { db } from './apiService';
import { collection, query, where, getDocs, doc, getDoc } from '../services/firestoreCompat';

/**
 * Dynamic Mission Pricing Intelligence
 * Automatically optimizes mission rewards based on completion rates and ROI
 */

export interface MissionPerformance {
  missionId: string;
  missionTitle: string;
  currentPoints: number;
  completionRate: number; // 0-100
  viewToCompletionRatio: number; // How many who view actually complete
  avgTimeToComplete: number; // minutes
  totalParticipants: number;
  totalViews: number;
  costPerAcquisition: number; // points per customer
  roi: number; // estimated value vs cost
  performanceRating: 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT';
  suggestedPoints: number;
  reasoning: string;
}

export interface PricingRecommendation {
  missionId: string;
  currentPoints: number;
  suggestedPoints: number;
  expectedImpact: string;
  confidence: number; // 0-100
  action: 'INCREASE' | 'DECREASE' | 'KEEP' | 'PAUSE';
}

/**
 * Analyze mission performance and suggest optimal pricing
 */
export async function analyzeMissionPerformance(
  businessId: string,
  missionId: string
): Promise<MissionPerformance | null> {
  try {
    // Get mission details
    const missionDoc = await getDoc(doc(db, 'missions', missionId));
    if (!missionDoc.exists()) return null;
    
    const missionData = missionDoc.data();
    const currentPoints = missionData.reward?.points || 0;
    
    // Get participation data
    const participationsRef = collection(db, 'participations');
    const q = query(participationsRef, where('missionId', '==', missionId));
    const participations = await getDocs(q);
    
    const totalParticipants = participations.size;
    const completedCount = participations.docs.filter(doc => 
      doc.data().status === 'COMPLETED' || doc.data().status === 'APPROVED'
    ).length;
    
    // Estimate views (assume 5x views per participant for low completion)
    const estimatedViews = totalParticipants > 0 ? totalParticipants * 3 : 100;
    const completionRate = estimatedViews > 0 ? (completedCount / estimatedViews) * 100 : 0;
    const viewToCompletion = totalParticipants > 0 ? (completedCount / totalParticipants) * 100 : 0;
    
    // Calculate average time to complete (from participation data)
    let totalTime = 0;
    participations.docs.forEach(doc => {
      const data = doc.data();
      if (data.completedAt && data.createdAt) {
        const start = data.createdAt.toDate();
        const end = data.completedAt.toDate();
        totalTime += (end.getTime() - start.getTime()) / (1000 * 60); // minutes
      }
    });
    const avgTimeToComplete = completedCount > 0 ? totalTime / completedCount : 30;
    
    // Calculate cost per acquisition
    const totalPointsSpent = completedCount * currentPoints;
    const costPerAcquisition = completedCount > 0 ? totalPointsSpent / completedCount : currentPoints;
    
    // Estimate ROI (assume each completion worth €5-10 in value)
    const estimatedValuePerCompletion = 7.5; // euros
    const costInEuros = currentPoints * 0.01; // 100 points = €1
    const roi = costInEuros > 0 ? (estimatedValuePerCompletion / costInEuros) * 100 : 0;
    
    // Determine performance rating
    let performanceRating: MissionPerformance['performanceRating'];
    if (completionRate >= 40) performanceRating = 'EXCELLENT';
    else if (completionRate >= 25) performanceRating = 'GOOD';
    else if (completionRate >= 15) performanceRating = 'FAIR';
    else performanceRating = 'POOR';
    
    // Calculate suggested points
    let suggestedPoints = currentPoints;
    let reasoning = '';
    
    if (completionRate < 10 && totalParticipants > 20) {
      // Very low completion - increase significantly
      suggestedPoints = Math.round(currentPoints * 1.5);
      reasoning = `Only ${completionRate.toFixed(1)}% completion rate. Increase reward to attract more participants.`;
    } else if (completionRate < 20 && totalParticipants > 10) {
      // Low completion - moderate increase
      suggestedPoints = Math.round(currentPoints * 1.25);
      reasoning = `Below average completion rate (${completionRate.toFixed(1)}%). Try increasing reward by 25%.`;
    } else if (completionRate > 60 && roi > 200) {
      // Very high completion and good ROI - can potentially decrease
      suggestedPoints = Math.round(currentPoints * 0.9);
      reasoning = `High completion rate (${completionRate.toFixed(1)}%) and strong ROI. Can optimize cost slightly.`;
    } else if (completionRate >= 30 && completionRate <= 50) {
      // Sweet spot - keep current pricing
      reasoning = `Optimal completion rate (${completionRate.toFixed(1)}%). Current pricing is effective.`;
    } else if (totalParticipants < 5) {
      // Too early to tell
      suggestedPoints = Math.round(currentPoints * 1.2);
      reasoning = `Not enough data yet. Consider boosting visibility with higher reward.`;
    } else {
      reasoning = `Current performance is acceptable. Monitor for another week before adjusting.`;
    }
    
    return {
      missionId,
      missionTitle: missionData.title || 'Untitled Mission',
      currentPoints,
      completionRate,
      viewToCompletionRatio: viewToCompletion,
      avgTimeToComplete,
      totalParticipants,
      totalViews: estimatedViews,
      costPerAcquisition,
      roi,
      performanceRating,
      suggestedPoints,
      reasoning
    };
  } catch (error) {
    console.error('[Pricing] Error analyzing mission performance:', error);
    return null;
  }
}

/**
 * Get pricing recommendations for all business missions
 */
export async function getBusinessPricingRecommendations(
  businessId: string
): Promise<PricingRecommendation[]> {
  try {
    // Get all active missions for business
    const missionsRef = collection(db, 'missions');
    const q = query(
      missionsRef,
      where('businessId', '==', businessId),
      where('lifecycleStatus', '==', 'ACTIVE')
    );
    const missions = await getDocs(q);
    
    const recommendations: PricingRecommendation[] = [];
    
    for (const missionDoc of missions.docs) {
      const performance = await analyzeMissionPerformance(businessId, missionDoc.id);
      if (!performance) continue;
      
      let action: PricingRecommendation['action'] = 'KEEP';
      let expectedImpact = '';
      let confidence = 50;
      
      if (performance.suggestedPoints > performance.currentPoints * 1.15) {
        action = 'INCREASE';
        const increase = ((performance.suggestedPoints - performance.currentPoints) / performance.currentPoints) * 100;
        expectedImpact = `Increase by ${Math.round(increase)}% to boost participation by ~30-40%`;
        confidence = performance.totalParticipants > 20 ? 80 : 60;
      } else if (performance.suggestedPoints < performance.currentPoints * 0.95) {
        action = 'DECREASE';
        const decrease = ((performance.currentPoints - performance.suggestedPoints) / performance.currentPoints) * 100;
        expectedImpact = `Decrease by ${Math.round(decrease)}% to optimize costs (already performing well)`;
        confidence = performance.totalParticipants > 30 ? 85 : 65;
      } else if (performance.completionRate < 5 && performance.totalViews > 50) {
        action = 'PAUSE';
        expectedImpact = `Mission has poor performance despite visibility. Consider redesigning or pausing.`;
        confidence = 75;
      } else {
        expectedImpact = `Current pricing is optimal. Continue monitoring.`;
        confidence = 70;
      }
      
      recommendations.push({
        missionId: missionDoc.id,
        currentPoints: performance.currentPoints,
        suggestedPoints: performance.suggestedPoints,
        expectedImpact,
        confidence,
        action
      });
    }
    
    return recommendations;
  } catch (error) {
    console.error('[Pricing] Error getting recommendations:', error);
    return [];
  }
}

/**
 * Calculate optimal points for a NEW mission based on category and competition
 */
export async function calculateOptimalMissionPoints(
  businessId: string,
  missionType: string,
  category: string,
  complexity: 'EASY' | 'MEDIUM' | 'HARD'
): Promise<number> {
  try {
    // Base points by complexity
    const basePoints = {
      EASY: 50,
      MEDIUM: 100,
      HARD: 200
    };
    
    let suggestedPoints = basePoints[complexity];
    
    // Check competition in same category
    const businessDoc = await getDoc(doc(db, 'users', businessId));
    const businessData = businessDoc.data();
    const city = businessData?.currentCity || '';
    
    if (city) {
      // Find similar missions in same city
      const missionsRef = collection(db, 'missions');
      const q = query(
        missionsRef,
        where('city', '==', city),
        where('category', '==', category),
        where('lifecycleStatus', '==', 'ACTIVE')
      );
      const similarMissions = await getDocs(q);
      
      if (similarMissions.size > 0) {
        // Calculate average points of competitors
        const competitorPoints = similarMissions.docs
          .map(doc => doc.data().reward?.points || 0)
          .filter(points => points > 0);
        
        if (competitorPoints.length > 0) {
          const avgCompetitorPoints = competitorPoints.reduce((a, b) => a + b, 0) / competitorPoints.length;
          // Stay competitive - match or slightly exceed average
          suggestedPoints = Math.round(avgCompetitorPoints * 1.1);
        }
      }
    }
    
    // Adjust for mission type
    const typeMultipliers: Record<string, number> = {
      'FOLLOW_BUSINESS_APP': 0.8,
      'WRITE_REVIEW_APP': 1.2,
      'REVIEW_WITH_PHOTO_APP': 1.5,
      'SHARE_PHOTO_APP': 1.3,
      'IN_PERSON': 1.0,
      'CUSTOM': 1.1
    };
    
    const multiplier = typeMultipliers[missionType] || 1.0;
    suggestedPoints = Math.round(suggestedPoints * multiplier);
    
    // Ensure reasonable bounds
    suggestedPoints = Math.max(25, Math.min(500, suggestedPoints));
    
    return suggestedPoints;
  } catch (error) {
    console.error('[Pricing] Error calculating optimal points:', error);
    return 100; // Default fallback
  }
}

/**
 * Get dynamic pricing insight summary for business dashboard
 */
export async function getPricingSummary(businessId: string): Promise<string> {
  try {
    const recommendations = await getBusinessPricingRecommendations(businessId);
    
    if (recommendations.length === 0) {
      return 'No active missions to analyze yet. Create your first mission to get pricing insights!';
    }
    
    const needsIncrease = recommendations.filter(r => r.action === 'INCREASE').length;
    const needsDecrease = recommendations.filter(r => r.action === 'DECREASE').length;
    const shouldPause = recommendations.filter(r => r.action === 'PAUSE').length;
    const optimal = recommendations.filter(r => r.action === 'KEEP').length;
    
    let summary = '💡 **Dynamic Pricing Insights**\n\n';
    
    if (needsIncrease > 0) {
      summary += `📈 ${needsIncrease} mission${needsIncrease > 1 ? 's' : ''} could benefit from higher rewards to boost participation.\n`;
    }
    
    if (needsDecrease > 0) {
      summary += `📉 ${needsDecrease} mission${needsDecrease > 1 ? 's' : ''} performing great - you can optimize costs.\n`;
    }
    
    if (shouldPause > 0) {
      summary += `⚠️ ${shouldPause} mission${shouldPause > 1 ? 's need' : ' needs'} attention - consider redesigning or pausing.\n`;
    }
    
    if (optimal > 0) {
      summary += `✅ ${optimal} mission${optimal > 1 ? 's are' : ' is'} optimally priced.\n`;
    }
    
    summary += `\n💰 Our AI monitors completion rates and automatically suggests optimal reward levels to maximize your ROI.`;
    
    return summary;
  } catch (error) {
    console.error('[Pricing] Error generating summary:', error);
    return 'Unable to generate pricing insights at this time.';
  }
}
