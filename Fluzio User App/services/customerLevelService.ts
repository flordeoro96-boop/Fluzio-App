/**
 * Customer Level Service
 * 
 * Manages customer level progression and redemption eligibility.
 * 
 * Key Rules:
 * - NEVER show raw numbers to customers
 * - Use human-readable messages
 * - Businesses can override default limits per reward
 * - Higher levels unlock more frequent redemptions
 */

import { db } from './apiService';
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  Timestamp
} from '../services/firestoreCompat';
import {
  CustomerLevel,
  CUSTOMER_LEVELS,
  CustomerLevelDefinition,
  RedemptionLimitMessage,
  RewardLevelOverride,
  LevelRedemptionLimits
} from '../types/customerLevels';

// ============================================================================
// LEVEL CALCULATION
// ============================================================================

/**
 * Calculate user's current level based on activity
 */
export async function calculateCustomerLevel(userId: string): Promise<CustomerLevel> {
  try {
    // Get user stats
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return CustomerLevel.EXPLORER;
    }
    
    const userData = userSnap.data();
    const stats = {
      totalPoints: userData.stats?.totalPointsEarned || 0,
      missionsCompleted: userData.stats?.totalMissionsCompleted || 0,
      rewardsRedeemed: userData.stats?.totalRewardsRedeemed || 0,
      accountCreated: userData.createdAt?.toDate() || new Date()
    };
    
    const accountAgeDays = Math.floor(
      (Date.now() - stats.accountCreated.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Check levels from highest to lowest
    const levels = [
      CustomerLevel.AMBASSADOR,
      CustomerLevel.INSIDER,
      CustomerLevel.REGULAR,
      CustomerLevel.EXPLORER
    ];
    
    for (const level of levels) {
      const requirements = CUSTOMER_LEVELS[level].requirements;
      
      if (
        stats.totalPoints >= requirements.minPoints &&
        stats.missionsCompleted >= requirements.minMissionsCompleted &&
        stats.rewardsRedeemed >= requirements.minRedemptions &&
        accountAgeDays >= requirements.accountAgeDays
      ) {
        return level;
      }
    }
    
    return CustomerLevel.EXPLORER;
    
  } catch (error) {
    console.error('[CustomerLevel] Error calculating level:', error);
    return CustomerLevel.EXPLORER; // Default to Explorer on error
  }
}

/**
 * Get level definition for a customer
 */
export function getLevelDefinition(level: CustomerLevel): CustomerLevelDefinition {
  return CUSTOMER_LEVELS[level];
}

/**
 * Get next level and requirements
 */
export function getNextLevel(currentLevel: CustomerLevel): {
  nextLevel: CustomerLevel | null;
  requirements: string[];
  progress: number;
} | null {
  const levelOrder = [
    CustomerLevel.EXPLORER,
    CustomerLevel.REGULAR,
    CustomerLevel.INSIDER,
    CustomerLevel.AMBASSADOR
  ];
  
  const currentIndex = levelOrder.indexOf(currentLevel);
  if (currentIndex === levelOrder.length - 1) {
    return null; // Already at max level
  }
  
  const nextLevel = levelOrder[currentIndex + 1];
  const requirements = CUSTOMER_LEVELS[nextLevel].requirements;
  
  return {
    nextLevel,
    requirements: [
      `Earn ${requirements.minPoints} total points`,
      `Complete ${requirements.minMissionsCompleted} missions`,
      `Redeem ${requirements.minRedemptions} rewards`,
      `Be active for ${requirements.accountAgeDays} days`
    ],
    progress: 0 // TODO: Calculate actual progress
  };
}

// ============================================================================
// REDEMPTION ELIGIBILITY
// ============================================================================

/**
 * Check if user can redeem a reward based on their level
 * Returns human-readable message (NEVER raw numbers)
 */
export async function checkRedemptionEligibility(
  userId: string,
  rewardId: string,
  businessId: string
): Promise<RedemptionLimitMessage> {
  try {
    // Get user's current level
    const userLevel = await calculateCustomerLevel(userId);
    const levelDef = getLevelDefinition(userLevel);
    
    // Get reward's override limits (if any)
    const rewardRef = doc(db, 'rewards', rewardId);
    const rewardSnap = await getDoc(rewardRef);
    
    if (!rewardSnap.exists()) {
      return {
        canRedeem: false,
        message: 'This reward is no longer available'
      };
    }
    
    const rewardData = rewardSnap.data();
    const overrideLimits = rewardData.levelOverrides?.[userLevel] as RewardLevelOverride | undefined;
    
    // Determine effective limits (override or default)
    const effectiveLimits: LevelRedemptionLimits = {
      perDay: overrideLimits?.perDay ?? levelDef.redemptionLimits.perDay,
      perWeek: overrideLimits?.perWeek ?? levelDef.redemptionLimits.perWeek,
      repeatUsagePerBusiness: overrideLimits?.repeatUsagePerBusiness ?? levelDef.redemptionLimits.repeatUsagePerBusiness
    };
    
    // Check daily limit
    const dailyCheck = await checkDailyLimit(userId, effectiveLimits.perDay);
    if (!dailyCheck.canRedeem) {
      return dailyCheck;
    }
    
    // Check weekly limit
    const weeklyCheck = await checkWeeklyLimit(userId, effectiveLimits.perWeek);
    if (!weeklyCheck.canRedeem) {
      return weeklyCheck;
    }
    
    // Check repeat usage at this business
    const repeatCheck = await checkRepeatUsage(
      userId,
      businessId,
      effectiveLimits.repeatUsagePerBusiness,
      userLevel
    );
    if (!repeatCheck.canRedeem) {
      return repeatCheck;
    }
    
    // All checks passed
    return {
      canRedeem: true,
      message: 'You can redeem this reward!'
    };
    
  } catch (error) {
    console.error('[CustomerLevel] Error checking eligibility:', error);
    return {
      canRedeem: false,
      message: 'Unable to verify eligibility. Please try again.'
    };
  }
}

/**
 * Check daily redemption limit
 * Returns human message (NO raw numbers shown to customer)
 */
async function checkDailyLimit(
  userId: string,
  dailyLimit: number
): Promise<RedemptionLimitMessage> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Count redemptions today
  const redemptionsRef = collection(db, 'redeemedRewards');
  const q = query(
    redemptionsRef,
    where('userId', '==', userId),
    where('redeemedAt', '>=', Timestamp.fromDate(today))
  );
  
  const snapshot = await getDocs(q);
  const todayCount = snapshot.size;
  
  if (todayCount >= dailyLimit) {
    // Calculate when next redemption is available (tomorrow at midnight)
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return {
      canRedeem: false,
      message: 'Available again tomorrow',
      upgradeMessage: 'Higher levels can redeem more often',
      availableAt: tomorrow
    };
  }
  
  return { canRedeem: true, message: '' };
}

/**
 * Check weekly redemption limit
 */
async function checkWeeklyLimit(
  userId: string,
  weeklyLimit: number
): Promise<RedemptionLimitMessage> {
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
  weekStart.setHours(0, 0, 0, 0);
  
  // Count redemptions this week
  const redemptionsRef = collection(db, 'redeemedRewards');
  const q = query(
    redemptionsRef,
    where('userId', '==', userId),
    where('redeemedAt', '>=', Timestamp.fromDate(weekStart))
  );
  
  const snapshot = await getDocs(q);
  const weekCount = snapshot.size;
  
  if (weekCount >= weeklyLimit) {
    // Calculate next week start
    const nextWeek = new Date(weekStart);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    return {
      canRedeem: false,
      message: 'Available next week',
      upgradeMessage: 'Insiders can redeem more often',
      availableAt: nextWeek
    };
  }
  
  return { canRedeem: true, message: '' };
}

/**
 * Check repeat usage at same business
 */
async function checkRepeatUsage(
  userId: string,
  businessId: string,
  repeatLimit: number,
  userLevel: CustomerLevel
): Promise<RedemptionLimitMessage> {
  // Count total redemptions at this business (all time)
  const redemptionsRef = collection(db, 'redeemedRewards');
  const q = query(
    redemptionsRef,
    where('userId', '==', userId),
    where('businessId', '==', businessId)
  );
  
  const snapshot = await getDocs(q);
  const businessCount = snapshot.size;
  
  if (businessCount >= repeatLimit) {
    // Generate appropriate message based on level
    let message = 'You\'ve reached your reward limit at this business';
    let upgradeMessage = '';
    
    if (userLevel === CustomerLevel.EXPLORER) {
      upgradeMessage = 'Regular members can redeem more at their favorite spots';
    } else if (userLevel === CustomerLevel.REGULAR) {
      upgradeMessage = 'Insiders can redeem more often';
    } else if (userLevel === CustomerLevel.INSIDER) {
      upgradeMessage = 'Ambassadors have unlimited access';
    }
    
    return {
      canRedeem: false,
      message,
      upgradeMessage
    };
  }
  
  return { canRedeem: true, message: '' };
}

/**
 * Get human-readable redemption status for a user
 * Shows remaining redemptions in friendly way
 */
export async function getRedemptionStatus(userId: string): Promise<{
  level: CustomerLevel;
  levelDisplay: CustomerLevelDefinition;
  statusMessage: string;
  canRedeemToday: boolean;
  canRedeemThisWeek: boolean;
}> {
  const level = await calculateCustomerLevel(userId);
  const levelDisplay = getLevelDefinition(level);
  
  // Check current usage
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  
  const redemptionsRef = collection(db, 'redeemedRewards');
  
  // Count today
  const todayQuery = query(
    redemptionsRef,
    where('userId', '==', userId),
    where('redeemedAt', '>=', Timestamp.fromDate(today))
  );
  const todaySnapshot = await getDocs(todayQuery);
  const todayCount = todaySnapshot.size;
  
  // Count this week
  const weekQuery = query(
    redemptionsRef,
    where('userId', '==', userId),
    where('redeemedAt', '>=', Timestamp.fromDate(weekStart))
  );
  const weekSnapshot = await getDocs(weekQuery);
  const weekCount = weekSnapshot.size;
  
  const canRedeemToday = todayCount < levelDisplay.redemptionLimits.perDay;
  const canRedeemThisWeek = weekCount < levelDisplay.redemptionLimits.perWeek;
  
  // Generate friendly status message (NO raw numbers)
  let statusMessage = '';
  
  if (canRedeemToday && canRedeemThisWeek) {
    statusMessage = 'You can redeem rewards today! 🎉';
  } else if (!canRedeemToday) {
    statusMessage = 'Available again tomorrow';
  } else if (!canRedeemThisWeek) {
    statusMessage = 'Available next week';
  }
  
  return {
    level,
    levelDisplay,
    statusMessage,
    canRedeemToday,
    canRedeemThisWeek
  };
}

/**
 * Get progress to next level
 */
export async function getLevelProgress(userId: string): Promise<{
  currentLevel: CustomerLevel;
  nextLevel: CustomerLevel | null;
  progressPercentage: number;
  nextMilestone: string;
}> {
  const currentLevel = await calculateCustomerLevel(userId);
  const nextLevelInfo = getNextLevel(currentLevel);
  
  if (!nextLevelInfo) {
    return {
      currentLevel,
      nextLevel: null,
      progressPercentage: 100,
      nextMilestone: 'You\'ve reached the highest level! 👑'
    };
  }
  
  // Get user stats
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    return {
      currentLevel,
      nextLevel: nextLevelInfo.nextLevel,
      progressPercentage: 0,
      nextMilestone: nextLevelInfo.requirements[0]
    };
  }
  
  const userData = userSnap.data();
  const stats = {
    totalPoints: userData.stats?.totalPointsEarned || 0,
    missionsCompleted: userData.stats?.totalMissionsCompleted || 0,
    rewardsRedeemed: userData.stats?.totalRewardsRedeemed || 0
  };
  
  const nextReqs = CUSTOMER_LEVELS[nextLevelInfo.nextLevel].requirements;
  
  // Calculate progress (average of all requirements)
  const pointsProgress = Math.min(100, (stats.totalPoints / nextReqs.minPoints) * 100);
  const missionsProgress = Math.min(100, (stats.missionsCompleted / nextReqs.minMissionsCompleted) * 100);
  const rewardsProgress = Math.min(100, (stats.rewardsRedeemed / nextReqs.minRedemptions) * 100);
  
  const progressPercentage = Math.round((pointsProgress + missionsProgress + rewardsProgress) / 3);
  
  // Find next closest milestone
  let nextMilestone = '';
  if (pointsProgress < 100) {
    const needed = nextReqs.minPoints - stats.totalPoints;
    nextMilestone = `Earn ${needed} more points`;
  } else if (missionsProgress < 100) {
    const needed = nextReqs.minMissionsCompleted - stats.missionsCompleted;
    nextMilestone = `Complete ${needed} more missions`;
  } else if (rewardsProgress < 100) {
    const needed = nextReqs.minRedemptions - stats.rewardsRedeemed;
    nextMilestone = `Redeem ${needed} more rewards`;
  } else {
    nextMilestone = 'Almost there! Keep it up!';
  }
  
  return {
    currentLevel,
    nextLevel: nextLevelInfo.nextLevel,
    progressPercentage,
    nextMilestone
  };
}
