/**
 * Gamification Service
 * 
 * Handles all gamification features:
 * - Daily login streaks with rewards
 * - Daily and weekly challenges
 * - Leaderboards (friends, city, global)
 * - Combo multipliers for point streaks
 * - Achievement tracking
 */

import { db } from './apiService';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  increment,
  arrayUnion
} from '../services/firestoreCompat';

// ============================================================================
// TYPES
// ============================================================================

export interface Challenge {
  id: string;
  type: 'DAILY' | 'WEEKLY';
  title: string;
  description: string;
  goal: number;
  progress: number;
  category: 'MISSIONS' | 'MEETUPS' | 'REWARDS' | 'SOCIAL' | 'EXPLORATION';
  reward: {
    points: number;
    bonus?: string; // e.g., "2x XP for next mission"
  };
  expiresAt: string;
  completed: boolean;
  claimedAt?: string;
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  userAvatar?: string;
  level: number;
  totalXP: number;
  weeklyXP: number;
  rank: number;
  city?: string;
  badges: number;
}

export interface StreakReward {
  day: number;
  points: number;
  bonus?: string;
  claimed: boolean;
}

export interface ComboMultiplier {
  multiplier: number; // 1.5x, 2x, 3x, 5x
  actionsInStreak: number;
  expiresAt: string;
  active: boolean;
}

export interface UserGamification {
  userId: string;
  
  // Streaks
  currentStreak: number;
  longestStreak: number;
  lastLoginDate: string;
  streakRewards: StreakReward[];
  
  // Challenges
  dailyChallenges: Challenge[];
  weeklyChallenges: Challenge[];
  completedChallengesCount: number;
  
  // Leaderboard
  totalXP: number;
  weeklyXP: number;
  monthlyXP: number;
  globalRank?: number;
  cityRank?: number;
  
  // Combos
  currentCombo: ComboMultiplier | null;
  bestCombo: number;
  
  // Stats
  totalPointsEarned: number;
  totalMissionsCompleted: number;
  totalMeetupsAttended: number;
  totalRewardsRedeemed: number;
}

// ============================================================================
// STREAK MANAGEMENT
// ============================================================================

/**
 * Check and update user's daily login streak
 */
export async function updateLoginStreak(userId: string): Promise<UserGamification> {
  const userRef = doc(db, 'users', userId);
  const gamificationRef = doc(db, 'gamification', userId);
  
  const [userSnap, gamificationSnap] = await Promise.all([
    getDoc(userRef),
    getDoc(gamificationRef)
  ]);
  
  const now = new Date();
  const today = now.toDateString();
  
  let gamificationData: UserGamification;
  
  if (gamificationSnap.exists()) {
    gamificationData = gamificationSnap.data() as UserGamification;
    const lastLogin = new Date(gamificationData.lastLoginDate);
    const lastLoginDate = lastLogin.toDateString();
    
    // Same day - no update
    if (lastLoginDate === today) {
      return gamificationData;
    }
    
    // Check if streak continues (yesterday)
    const yesterday = new Date(now.getTime() - 86400000).toDateString();
    const streakContinues = lastLoginDate === yesterday;
    
    // Update streak
    const newStreak = streakContinues ? gamificationData.currentStreak + 1 : 1;
    const newLongestStreak = Math.max(newStreak, gamificationData.longestStreak);
    
    // Generate streak rewards for new streak day
    const streakRewards = generateStreakRewards(newStreak);
    
    gamificationData = {
      ...gamificationData,
      currentStreak: newStreak,
      longestStreak: newLongestStreak,
      lastLoginDate: now.toISOString(),
      streakRewards
    };
    
    // Update user's streak in main profile
    await updateDoc(userRef, {
      currentStreak: newStreak,
      longestStreak: newLongestStreak,
      lastLoginDate: now.toISOString()
    });
    
  } else {
    // First time - initialize gamification data
    const totalXP = userSnap.data()?.totalXP || 0;
    const calculatedLevel = Math.floor(Math.sqrt(totalXP / 100)) + 1;
    
    gamificationData = {
      userId,
      currentStreak: 1,
      longestStreak: 1,
      lastLoginDate: now.toISOString(),
      streakRewards: generateStreakRewards(1),
      dailyChallenges: [],
      weeklyChallenges: [],
      completedChallengesCount: 0,
      totalXP: totalXP,
      weeklyXP: 0,
      monthlyXP: 0,
      currentCombo: null,
      bestCombo: 1,
      totalPointsEarned: userSnap.data()?.points || 0,
      totalMissionsCompleted: 0,
      totalMeetupsAttended: 0,
      totalRewardsRedeemed: 0
    };
    
    // Ensure user has level set
    await updateDoc(userRef, {
      currentStreak: 1,
      longestStreak: 1,
      lastLoginDate: now.toISOString(),
      level: calculatedLevel,
      totalXP: totalXP
    });
  }
  
  await setDoc(gamificationRef, gamificationData);
  return gamificationData;
}

/**
 * Generate streak rewards based on current streak
 */
function generateStreakRewards(currentStreak: number): StreakReward[] {
  const rewards: StreakReward[] = [];
  
  // Daily rewards increase with streak
  const baseReward = 10;
  const bonusPerDay = 5;
  
  // Milestone rewards
  const milestones = [
    { day: 3, points: 50, bonus: "🔥 3-Day Streak!" },
    { day: 7, points: 150, bonus: "⭐ Week Warrior!" },
    { day: 14, points: 300, bonus: "💪 2-Week Champion!" },
    { day: 30, points: 1000, bonus: "👑 Monthly Master!" },
    { day: 60, points: 2500, bonus: "🏆 Dedication Legend!" },
    { day: 100, points: 5000, bonus: "💎 Century Club!" }
  ];
  
  // Add daily reward
  rewards.push({
    day: currentStreak,
    points: baseReward + (currentStreak * bonusPerDay),
    claimed: false
  });
  
  // Add milestone rewards
  const milestone = milestones.find(m => m.day === currentStreak);
  if (milestone) {
    rewards.push({
      day: milestone.day,
      points: milestone.points,
      bonus: milestone.bonus,
      claimed: false
    });
  }
  
  return rewards;
}

/**
 * Claim streak rewards
 */
export async function claimStreakRewards(userId: string): Promise<number> {
  const gamificationRef = doc(db, 'gamification', userId);
  const gamificationSnap = await getDoc(gamificationRef);
  
  if (!gamificationSnap.exists()) {
    throw new Error('Gamification data not found');
  }
  
  const data = gamificationSnap.data() as UserGamification;
  const unclaimedRewards = data.streakRewards.filter(r => !r.claimed);
  
  if (unclaimedRewards.length === 0) {
    return 0;
  }
  
  const totalPoints = unclaimedRewards.reduce((sum, r) => sum + r.points, 0);
  
  // Mark all rewards as claimed
  const updatedRewards = data.streakRewards.map(r => ({
    ...r,
    claimed: true,
    claimedAt: new Date().toISOString()
  }));
  
  await updateDoc(gamificationRef, {
    streakRewards: updatedRewards
  });
  
  // Add points to user
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    points: increment(totalPoints),
    totalXP: increment(totalPoints)
  });
  
  return totalPoints;
}

// ============================================================================
// CHALLENGES
// ============================================================================

/**
 * Generate daily challenges for a user
 */
export async function generateDailyChallenges(userId: string): Promise<Challenge[]> {
  const challenges: Challenge[] = [
    {
      id: `daily-missions-${Date.now()}`,
      type: 'DAILY',
      title: 'Mission Hunter',
      description: 'Complete 3 missions today',
      goal: 3,
      progress: 0,
      category: 'MISSIONS',
      reward: { points: 100, bonus: '2x XP on next mission' },
      expiresAt: getEndOfDay().toISOString(),
      completed: false
    },
    {
      id: `daily-meetup-${Date.now()}`,
      type: 'DAILY',
      title: 'Social Butterfly',
      description: 'Attend 1 meetup today',
      goal: 1,
      progress: 0,
      category: 'MEETUPS',
      reward: { points: 150 },
      expiresAt: getEndOfDay().toISOString(),
      completed: false
    },
    {
      id: `daily-explore-${Date.now()}`,
      type: 'DAILY',
      title: 'Explorer',
      description: 'Visit 5 new businesses',
      goal: 5,
      progress: 0,
      category: 'EXPLORATION',
      reward: { points: 75 },
      expiresAt: getEndOfDay().toISOString(),
      completed: false
    }
  ];
  
  return challenges;
}

/**
 * Generate weekly challenges for a user
 */
export async function generateWeeklyChallenges(userId: string): Promise<Challenge[]> {
  const challenges: Challenge[] = [
    {
      id: `weekly-missions-${Date.now()}`,
      type: 'WEEKLY',
      title: 'Mission Master',
      description: 'Complete 15 missions this week',
      goal: 15,
      progress: 0,
      category: 'MISSIONS',
      reward: { points: 500, bonus: '3x XP boost for 24h' },
      expiresAt: getEndOfWeek().toISOString(),
      completed: false
    },
    {
      id: `weekly-social-${Date.now()}`,
      type: 'WEEKLY',
      title: 'Social Star',
      description: 'Attend 5 meetups this week',
      goal: 5,
      progress: 0,
      category: 'MEETUPS',
      reward: { points: 750 },
      expiresAt: getEndOfWeek().toISOString(),
      completed: false
    },
    {
      id: `weekly-rewards-${Date.now()}`,
      type: 'WEEKLY',
      title: 'Reward Collector',
      description: 'Redeem 3 rewards this week',
      goal: 3,
      progress: 0,
      category: 'REWARDS',
      reward: { points: 300 },
      expiresAt: getEndOfWeek().toISOString(),
      completed: false
    }
  ];
  
  return challenges;
}

/**
 * Update challenge progress
 */
export async function updateChallengeProgress(
  userId: string, 
  category: Challenge['category'], 
  amount: number = 1
): Promise<void> {
  const gamificationRef = doc(db, 'gamification', userId);
  const gamificationSnap = await getDoc(gamificationRef);
  
  if (!gamificationSnap.exists()) {
    return;
  }
  
  const data = gamificationSnap.data() as UserGamification;
  
  // Update daily challenges
  const updatedDailyChallenges = data.dailyChallenges.map(challenge => {
    if (challenge.category === category && !challenge.completed) {
      const newProgress = challenge.progress + amount;
      const completed = newProgress >= challenge.goal;
      return {
        ...challenge,
        progress: newProgress,
        completed
      };
    }
    return challenge;
  });
  
  // Update weekly challenges
  const updatedWeeklyChallenges = data.weeklyChallenges.map(challenge => {
    if (challenge.category === category && !challenge.completed) {
      const newProgress = challenge.progress + amount;
      const completed = newProgress >= challenge.goal;
      return {
        ...challenge,
        progress: newProgress,
        completed
      };
    }
    return challenge;
  });
  
  await updateDoc(gamificationRef, {
    dailyChallenges: updatedDailyChallenges,
    weeklyChallenges: updatedWeeklyChallenges
  });
}

/**
 * Claim challenge reward
 */
export async function claimChallengeReward(userId: string, challengeId: string): Promise<number> {
  const gamificationRef = doc(db, 'gamification', userId);
  const gamificationSnap = await getDoc(gamificationRef);
  
  if (!gamificationSnap.exists()) {
    throw new Error('Gamification data not found');
  }
  
  const data = gamificationSnap.data() as UserGamification;
  
  // Find challenge in daily or weekly
  const allChallenges = [...data.dailyChallenges, ...data.weeklyChallenges];
  const challenge = allChallenges.find(c => c.id === challengeId);
  
  if (!challenge || !challenge.completed || challenge.claimedAt) {
    return 0;
  }
  
  // Mark as claimed
  const updatedDailyChallenges = data.dailyChallenges.map(c => 
    c.id === challengeId ? { ...c, claimedAt: new Date().toISOString() } : c
  );
  const updatedWeeklyChallenges = data.weeklyChallenges.map(c => 
    c.id === challengeId ? { ...c, claimedAt: new Date().toISOString() } : c
  );
  
  await updateDoc(gamificationRef, {
    dailyChallenges: updatedDailyChallenges,
    weeklyChallenges: updatedWeeklyChallenges,
    completedChallengesCount: increment(1)
  });
  
  // Add points to user
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    points: increment(challenge.reward.points),
    totalXP: increment(challenge.reward.points)
  });
  
  return challenge.reward.points;
}

// ============================================================================
// LEADERBOARDS
// ============================================================================

/**
 * Get global leaderboard
 */
export async function getGlobalLeaderboard(limitCount: number = 50): Promise<LeaderboardEntry[]> {
  const usersRef = collection(db, 'users');
  const q = query(
    usersRef,
    where('role', '==', 'customer'),
    orderBy('totalXP', 'desc'),
    limit(limitCount)
  );
  
  const snapshot = await getDocs(q);
  
  const entries: LeaderboardEntry[] = [];
  let rank = 1;
  
  snapshot.forEach(doc => {
    const data = doc.data();
    entries.push({
      userId: doc.id,
      userName: data.name || 'Anonymous',
      userAvatar: data.avatar,
      level: data.level || 1,
      totalXP: data.totalXP || 0,
      weeklyXP: data.weeklyXP || 0,
      rank: rank++,
      city: data.city,
      badges: data.badges?.length || 0
    });
  });
  
  return entries;
}

/**
 * Get city leaderboard
 */
export async function getCityLeaderboard(city: string, limitCount: number = 50): Promise<LeaderboardEntry[]> {
  const usersRef = collection(db, 'users');
  const q = query(
    usersRef,
    where('role', '==', 'customer'),
    where('city', '==', city),
    orderBy('totalXP', 'desc'),
    limit(limitCount)
  );
  
  const snapshot = await getDocs(q);
  
  const entries: LeaderboardEntry[] = [];
  let rank = 1;
  
  snapshot.forEach(doc => {
    const data = doc.data();
    entries.push({
      userId: doc.id,
      userName: data.name || 'Anonymous',
      userAvatar: data.avatar,
      level: data.level || 1,
      totalXP: data.totalXP || 0,
      weeklyXP: data.weeklyXP || 0,
      rank: rank++,
      city: data.city,
      badges: data.badges?.length || 0
    });
  });
  
  return entries;
}

/**
 * Get friends leaderboard
 */
export async function getFriendsLeaderboard(userId: string): Promise<LeaderboardEntry[]> {
  // For now, return empty array - will implement when friends system exists
  // TODO: Query user's friends and sort by XP
  return [];
}

// ============================================================================
// COMBO MULTIPLIERS
// ============================================================================

/**
 * Start or update combo multiplier
 */
export async function updateComboMultiplier(userId: string): Promise<ComboMultiplier | null> {
  const gamificationRef = doc(db, 'gamification', userId);
  const gamificationSnap = await getDoc(gamificationRef);
  
  if (!gamificationSnap.exists()) {
    return null;
  }
  
  const data = gamificationSnap.data() as UserGamification;
  const now = new Date();
  
  let combo: ComboMultiplier;
  
  if (data.currentCombo && data.currentCombo.active) {
    const expiresAt = new Date(data.currentCombo.expiresAt);
    
    // Check if combo expired
    if (now > expiresAt) {
      // Combo expired - start new one
      combo = {
        multiplier: 1.5,
        actionsInStreak: 1,
        expiresAt: new Date(now.getTime() + 3600000).toISOString(), // 1 hour
        active: true
      };
    } else {
      // Continue combo - increase multiplier
      const newActions = data.currentCombo.actionsInStreak + 1;
      const newMultiplier = calculateMultiplier(newActions);
      
      combo = {
        multiplier: newMultiplier,
        actionsInStreak: newActions,
        expiresAt: new Date(now.getTime() + 3600000).toISOString(), // Reset to 1 hour
        active: true
      };
    }
  } else {
    // Start new combo
    combo = {
      multiplier: 1.5,
      actionsInStreak: 1,
      expiresAt: new Date(now.getTime() + 3600000).toISOString(),
      active: true
    };
  }
  
  await updateDoc(gamificationRef, {
    currentCombo: combo,
    bestCombo: Math.max(combo.multiplier, data.bestCombo || 1)
  });
  
  return combo;
}

/**
 * Calculate multiplier based on actions in streak
 */
function calculateMultiplier(actions: number): number {
  if (actions >= 10) return 5;
  if (actions >= 7) return 3;
  if (actions >= 5) return 2;
  if (actions >= 3) return 1.5;
  return 1;
}

// ============================================================================
// HELPERS
// ============================================================================

function getEndOfDay(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
}

function getEndOfWeek(): Date {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilSunday = 7 - dayOfWeek;
  const endOfWeek = new Date(now.getTime() + daysUntilSunday * 86400000);
  return new Date(endOfWeek.getFullYear(), endOfWeek.getMonth(), endOfWeek.getDate(), 23, 59, 59);
}

/**
 * Get user's gamification data
 */
export async function getUserGamification(userId: string): Promise<UserGamification | null> {
  const gamificationRef = doc(db, 'gamification', userId);
  const gamificationSnap = await getDoc(gamificationRef);
  
  if (!gamificationSnap.exists()) {
    return null;
  }
  
  return gamificationSnap.data() as UserGamification;
}

/**
 * Initialize gamification for new user
 */
export async function initializeGamification(userId: string): Promise<void> {
  const gamificationRef = doc(db, 'gamification', userId);
  
  const dailyChallenges = await generateDailyChallenges(userId);
  const weeklyChallenges = await generateWeeklyChallenges(userId);
  
  const gamificationData: UserGamification = {
    userId,
    currentStreak: 0,
    longestStreak: 0,
    lastLoginDate: new Date().toISOString(),
    streakRewards: [],
    dailyChallenges,
    weeklyChallenges,
    completedChallengesCount: 0,
    totalXP: 0,
    weeklyXP: 0,
    monthlyXP: 0,
    currentCombo: null,
    bestCombo: 1,
    totalPointsEarned: 0,
    totalMissionsCompleted: 0,
    totalMeetupsAttended: 0,
    totalRewardsRedeemed: 0
  };
  
  await setDoc(gamificationRef, gamificationData);
}
