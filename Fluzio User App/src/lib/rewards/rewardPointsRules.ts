/**
 * Reward Points Earning Rules
 * 
 * Defines how many points users earn for different activities
 * Separate from XP (which is for leveling up)
 */

export const REWARD_POINTS = {
  // Mission Activities
  MISSION_CREATED: 50,
  MISSION_COMPLETED: 150,
  MISSION_PARTICIPATED: 75,
  MISSION_FIRST_TIME: 200, // First mission ever
  
  // Meetup Activities
  MEETUP_HOSTED: 100,
  MEETUP_ATTENDED: 50,
  MEETUP_FIRST_TIME: 150,
  
  // Review & Feedback
  REVIEW_WRITTEN: 40,
  REVIEW_RECEIVED_5_STAR: 20,
  FEEDBACK_GIVEN: 25,
  
  // Social & Engagement
  PROFILE_COMPLETED: 100,
  BUSINESS_VERIFIED: 500,
  INSTAGRAM_CONNECTED: 75,
  FOLLOWER_MILESTONE_100: 100,
  FOLLOWER_MILESTONE_500: 250,
  FOLLOWER_MILESTONE_1000: 500,
  
  // Daily & Streaks
  DAILY_CHECK_IN: 10,
  WEEKLY_STREAK_3: 75,
  WEEKLY_STREAK_7: 200,
  MONTHLY_STREAK: 500,
  
  // Referrals
  REFERRAL_SIGNUP: 300,
  REFERRAL_FIRST_MISSION: 200,
  
  // Squad Activities
  SQUAD_JOINED: 50,
  SQUAD_ACTIVITY_COMPLETED: 40,
  SQUAD_MVP_MONTH: 300,
  
  // Level Achievements
  LEVEL_UP_2: 200,
  LEVEL_UP_3: 400,
  LEVEL_UP_4: 800,
  LEVEL_UP_5: 1500,
  LEVEL_UP_6: 3000,
  
  // Special Events
  PARTNER_BUSINESS_CREATED: 150,
  COLLABORATION_COMPLETED: 200,
  EVENT_ATTENDED: 60,
  WORKSHOP_COMPLETED: 100
};

/**
 * Tier-based bonus multipliers for reward points
 */
export const TIER_BONUS_MULTIPLIERS = {
  BASIC: 0,    // 0% bonus
  SILVER: 5,   // +5% bonus
  GOLD: 10,    // +10% bonus
  PLATINUM: 15 // +15% bonus
};

/**
 * Streak multipliers (applied on top of tier bonus)
 */
export const STREAK_MULTIPLIERS = {
  NO_STREAK: 1.0,
  STREAK_3_DAYS: 1.05,   // +5%
  STREAK_7_DAYS: 1.10,   // +10%
  STREAK_14_DAYS: 1.15,  // +15%
  STREAK_30_DAYS: 1.25   // +25%
};

/**
 * Calculate final points with bonuses
 */
export function calculatePoints(
  basePoints: number,
  tier: 'BASIC' | 'SILVER' | 'GOLD' | 'PLATINUM',
  streakDays: number
): number {
  // Apply tier bonus
  const tierBonus = TIER_BONUS_MULTIPLIERS[tier];
  const pointsWithTierBonus = basePoints * (1 + tierBonus / 100);
  
  // Apply streak multiplier
  let streakMultiplier = STREAK_MULTIPLIERS.NO_STREAK;
  if (streakDays >= 30) streakMultiplier = STREAK_MULTIPLIERS.STREAK_30_DAYS;
  else if (streakDays >= 14) streakMultiplier = STREAK_MULTIPLIERS.STREAK_14_DAYS;
  else if (streakDays >= 7) streakMultiplier = STREAK_MULTIPLIERS.STREAK_7_DAYS;
  else if (streakDays >= 3) streakMultiplier = STREAK_MULTIPLIERS.STREAK_3_DAYS;
  
  const finalPoints = Math.round(pointsWithTierBonus * streakMultiplier);
  
  return finalPoints;
}

/**
 * Get streak days from last check-in date
 */
export function getStreakDays(lastCheckIn: Date, currentCheckIns: number): number {
  const now = new Date();
  const daysSinceLastCheckIn = Math.floor((now.getTime() - lastCheckIn.getTime()) / (1000 * 60 * 60 * 24));
  
  // If checked in yesterday or today, streak continues
  if (daysSinceLastCheckIn <= 1) {
    return currentCheckIns;
  }
  
  // Streak broken
  return 0;
}

export default {
  REWARD_POINTS,
  TIER_BONUS_MULTIPLIERS,
  STREAK_MULTIPLIERS,
  calculatePoints,
  getStreakDays
};
