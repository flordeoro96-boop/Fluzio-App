import { db } from './apiService';
import { collection, query, where, getDocs, Timestamp } from '../services/firestoreCompat';

/**
 * Smart Spending Optimizer - Helps users maximize value from their points
 * Budget tracking and smart redemption suggestions
 */

export interface SpendingProfile {
  userId: string;
  totalPointsEarned: number;
  totalPointsSpent: number;
  currentBalance: number;
  avgPointsPerWeek: number;
  preferredRedemptionTypes: string[]; // e.g., ['DISCOUNT', 'FREE_ITEM', 'EXPERIENCE']
  savingsRate: number; // percentage of points saved vs spent
  spendingEfficiency: number; // 0-100, how well they optimize redemptions
}

export interface RedemptionOpportunity {
  businessId: string;
  businessName: string;
  rewardId: string;
  rewardTitle: string;
  pointsCost: number;
  estimatedValue: number; // in euros
  valuePerPoint: number; // euros per point
  expiryDate?: Date;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  recommendation: string;
}

export interface BudgetInsight {
  message: string;
  type: 'SAVING' | 'SPENDING' | 'OPTIMIZATION' | 'WARNING';
  action?: string;
}

/**
 * Build user spending profile
 */
export async function buildSpendingProfile(userId: string): Promise<SpendingProfile> {
  try {
    // Get user's participation history (points earned)
    const participationsRef = collection(db, 'participations');
    const earnedQuery = query(
      participationsRef,
      where('userId', '==', userId),
      where('status', 'in', ['COMPLETED', 'APPROVED'])
    );
    const earned = await getDocs(earnedQuery);
    
    let totalPointsEarned = 0;
    const weeklyEarnings: Record<string, number> = {};
    
    earned.forEach(doc => {
      const data = doc.data();
      const points = data.pointsEarned || 0;
      totalPointsEarned += points;
      
      if (data.completedAt) {
        const weekKey = getWeekKey(data.completedAt.toDate());
        weeklyEarnings[weekKey] = (weeklyEarnings[weekKey] || 0) + points;
      }
    });
    
    const avgPointsPerWeek = Object.keys(weeklyEarnings).length > 0
      ? Object.values(weeklyEarnings).reduce((a, b) => a + b, 0) / Object.keys(weeklyEarnings).length
      : 0;
    
    // Get redemption history (points spent)
    const redemptionsRef = collection(db, 'redemptions');
    const spentQuery = query(redemptionsRef, where('userId', '==', userId));
    const spent = await getDocs(spentQuery);
    
    let totalPointsSpent = 0;
    const redemptionTypes: Record<string, number> = {};
    let totalValue = 0;
    
    spent.forEach(doc => {
      const data = doc.data();
      const points = data.pointsCost || 0;
      totalPointsSpent += points;
      
      const type = data.rewardType || 'DISCOUNT';
      redemptionTypes[type] = (redemptionTypes[type] || 0) + 1;
      
      // Estimate value (assume 100 points = €1 baseline, but rewards vary)
      const estimatedValue = data.estimatedValue || (points * 0.015); // €1.50 per 100 points avg
      totalValue += estimatedValue;
    });
    
    const preferredRedemptionTypes = Object.entries(redemptionTypes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([type]) => type);
    
    const currentBalance = totalPointsEarned - totalPointsSpent;
    const savingsRate = totalPointsEarned > 0 ? (currentBalance / totalPointsEarned) * 100 : 0;
    
    // Calculate spending efficiency (value received per point spent)
    const avgValuePerPoint = totalPointsSpent > 0 ? totalValue / totalPointsSpent : 0;
    const spendingEfficiency = Math.min(100, avgValuePerPoint * 100); // 0.01 value/point = 100% efficiency
    
    return {
      userId,
      totalPointsEarned,
      totalPointsSpent,
      currentBalance,
      avgPointsPerWeek,
      preferredRedemptionTypes,
      savingsRate,
      spendingEfficiency
    };
  } catch (error) {
    console.error('[Spending Optimizer] Error building profile:', error);
    return {
      userId,
      totalPointsEarned: 0,
      totalPointsSpent: 0,
      currentBalance: 0,
      avgPointsPerWeek: 0,
      preferredRedemptionTypes: [],
      savingsRate: 0,
      spendingEfficiency: 50
    };
  }
}

/**
 * Find best redemption opportunities
 */
export async function findBestRedemptions(
  userId: string,
  userLocation?: { latitude: number; longitude: number }
): Promise<RedemptionOpportunity[]> {
  try {
    const profile = await buildSpendingProfile(userId);
    const opportunities: RedemptionOpportunity[] = [];
    
    // Get all active rewards
    const rewardsRef = collection(db, 'rewards');
    const activeQuery = query(
      rewardsRef,
      where('isActive', '==', true),
      where('pointsCost', '<=', profile.currentBalance * 1.2) // Show some aspirational rewards
    );
    const rewards = await getDocs(activeQuery);
    
    for (const rewardDoc of rewards.docs) {
      const data = rewardDoc.data();
      
      // Estimate value
      let estimatedValue = 0;
      if (data.discount) {
        // Discount reward - estimate based on average transaction
        estimatedValue = (data.discount / 100) * 15; // Assume €15 avg transaction
      } else {
        // Fixed value or free item - estimate
        estimatedValue = data.pointsCost * 0.015; // €1.50 per 100 points
      }
      
      const valuePerPoint = data.pointsCost > 0 ? estimatedValue / data.pointsCost : 0;
      
      // Determine urgency
      let urgency: RedemptionOpportunity['urgency'] = 'LOW';
      if (data.expiryDate) {
        const daysUntilExpiry = (data.expiryDate.toDate().getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        if (daysUntilExpiry < 3) urgency = 'URGENT';
        else if (daysUntilExpiry < 7) urgency = 'HIGH';
        else if (daysUntilExpiry < 14) urgency = 'MEDIUM';
      }
      
      if (data.stock && data.stock < 5) {
        urgency = urgency === 'URGENT' ? 'URGENT' : 'HIGH';
      }
      
      // Generate recommendation
      let recommendation = '';
      if (valuePerPoint >= 0.02) {
        recommendation = `Excellent value! €${estimatedValue.toFixed(2)} worth for ${data.pointsCost} points.`;
      } else if (valuePerPoint >= 0.015) {
        recommendation = `Good deal - ${((valuePerPoint / 0.01) * 100).toFixed(0)}% better than average.`;
      } else {
        recommendation = `Standard value - wait for better opportunities unless you need this now.`;
      }
      
      if (urgency === 'URGENT') {
        recommendation += ' ⚠️ Expires very soon!';
      } else if (urgency === 'HIGH') {
        recommendation += ' ⏰ Limited time offer!';
      }
      
      opportunities.push({
        businessId: data.businessId,
        businessName: data.businessName || 'Unknown Business',
        rewardId: rewardDoc.id,
        rewardTitle: data.title || 'Reward',
        pointsCost: data.pointsCost,
        estimatedValue,
        valuePerPoint,
        expiryDate: data.expiryDate?.toDate(),
        urgency,
        recommendation
      });
    }
    
    // Sort by value per point (best deals first)
    opportunities.sort((a, b) => b.valuePerPoint - a.valuePerPoint);
    
    return opportunities;
  } catch (error) {
    console.error('[Spending Optimizer] Error finding redemptions:', error);
    return [];
  }
}

/**
 * Get personalized budget insights
 */
export async function getBudgetInsights(userId: string): Promise<BudgetInsight[]> {
  try {
    const profile = await buildSpendingProfile(userId);
    const insights: BudgetInsight[] = [];
    
    // Savings rate insights
    if (profile.savingsRate > 80) {
      insights.push({
        message: `You're saving ${profile.savingsRate.toFixed(0)}% of your points! 💰`,
        type: 'SAVING',
        action: 'Consider treating yourself - you have great deals available!'
      });
    } else if (profile.savingsRate < 20 && profile.currentBalance < 100) {
      insights.push({
        message: 'You\'re spending points faster than you earn them.',
        type: 'WARNING',
        action: 'Complete more missions to rebuild your balance for better rewards.'
      });
    }
    
    // Spending efficiency insights
    if (profile.spendingEfficiency >= 80) {
      insights.push({
        message: 'Great job! You consistently choose high-value rewards. 🎯',
        type: 'OPTIMIZATION'
      });
    } else if (profile.spendingEfficiency < 50) {
      insights.push({
        message: 'You could get more value from your points.',
        type: 'OPTIMIZATION',
        action: 'Look for rewards with higher value-per-point ratios before redeeming.'
      });
    }
    
    // Balance insights
    if (profile.currentBalance >= 500) {
      insights.push({
        message: `You have ${profile.currentBalance} points saved! 🌟`,
        type: 'SPENDING',
        action: 'Check out premium rewards - you can afford the best deals now.'
      });
    } else if (profile.currentBalance < 50 && profile.avgPointsPerWeek > 50) {
      insights.push({
        message: 'Your balance is low, but you earn consistently.',
        type: 'SAVING',
        action: `Save for ${Math.ceil((200 - profile.currentBalance) / profile.avgPointsPerWeek)} more weeks to unlock better rewards.`
      });
    }
    
    // Weekly earnings insights
    if (profile.avgPointsPerWeek > 0) {
      const weeksTo500 = Math.ceil((500 - profile.currentBalance) / profile.avgPointsPerWeek);
      if (weeksTo500 > 0 && weeksTo500 <= 8) {
        insights.push({
          message: `At your current pace, you'll reach 500 points in ${weeksTo500} weeks.`,
          type: 'SAVING',
          action: 'Complete extra missions to reach premium rewards faster!'
        });
      }
    }
    
    return insights;
  } catch (error) {
    console.error('[Spending Optimizer] Error getting insights:', error);
    return [];
  }
}

/**
 * Calculate optimal saving goal
 */
export async function calculateSavingGoal(userId: string): Promise<{
  currentBalance: number;
  recommendedGoal: number;
  weeksToGoal: number;
  targetRewards: string[];
}> {
  try {
    const profile = await buildSpendingProfile(userId);
    
    // Find high-value rewards as targets
    const opportunities = await findBestRedemptions(userId);
    const premiumRewards = opportunities
      .filter(opp => opp.pointsCost >= 300 && opp.valuePerPoint >= 0.015)
      .slice(0, 3);
    
    const recommendedGoal = premiumRewards.length > 0
      ? Math.max(...premiumRewards.map(r => r.pointsCost))
      : 500;
    
    const pointsNeeded = Math.max(0, recommendedGoal - profile.currentBalance);
    const weeksToGoal = profile.avgPointsPerWeek > 0
      ? Math.ceil(pointsNeeded / profile.avgPointsPerWeek)
      : 10;
    
    return {
      currentBalance: profile.currentBalance,
      recommendedGoal,
      weeksToGoal,
      targetRewards: premiumRewards.map(r => r.rewardTitle)
    };
  } catch (error) {
    console.error('[Spending Optimizer] Error calculating goal:', error);
    return {
      currentBalance: 0,
      recommendedGoal: 500,
      weeksToGoal: 10,
      targetRewards: []
    };
  }
}

// Helper function
function getWeekKey(date: Date): string {
  const year = date.getFullYear();
  const week = getWeekNumber(date);
  return `${year}-W${week}`;
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}
