import { db } from './apiService';
import { collection, query, where, getDocs, Timestamp, orderBy, limit } from './firestoreCompat';

/**
 * Safely convert Firestore Timestamp or Date to Date object
 */
function toDate(value: any): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (value.toDate && typeof value.toDate === 'function') return value.toDate();
  if (value.seconds) return new Date(value.seconds * 1000);
  return new Date(value);
}

/**
 * Habit Builder - Gamified behavior patterns to increase engagement
 * Analyzes user patterns and creates personalized challenges
 */

export interface UserHabit {
  habitId: string;
  userId: string;
  type: 'CHECK_IN' | 'MISSION' | 'EXPLORE' | 'SOCIAL' | 'SPENDING';
  pattern: string; // e.g., "Check in daily", "Complete 3 missions weekly"
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  currentStreak: number;
  longestStreak: number;
  lastCompleted?: Date;
  progress: number; // 0-100
  level: number; // Habit mastery level
  rewards: {
    points: number;
    badges: string[];
  };
}

export interface HabitChallenge {
  challengeId: string;
  title: string;
  description: string;
  goal: number;
  current: number;
  timeframe: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  reward: {
    points: number;
    badge?: string;
  };
  expiresAt: Date;
  motivationalMessage: string;
}

export interface HabitInsight {
  insight: string;
  recommendation: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
}

/**
 * Detect user habits from historical behavior
 */
export async function detectUserHabits(userId: string): Promise<UserHabit[]> {
  try {
    const habits: UserHabit[] = [];
    const now = new Date();
    
    // Analyze check-in patterns
    const checkInsRef = collection(db, 'customerInteractions');
    const checkInsQuery = query(
      checkInsRef,
      where('userId', '==', userId)
    );
    const checkIns = await getDocs(checkInsQuery);
    
    // Group check-ins by date
    const checkInDates: Set<string> = new Set();
    let lastCheckInDate: Date | null = null;
    
    checkIns.forEach(doc => {
      const data = doc.data();
      if (data.lastCheckIn) {
        const date = toDate(data.lastCheckIn);
        checkInDates.add(date.toDateString());
        if (!lastCheckInDate || date > lastCheckInDate) {
          lastCheckInDate = date;
        }
      }
    });
    
    // Calculate check-in streak
    let checkInStreak = 0;
    let currentDate = new Date();
    while (true) {
      if (checkInDates.has(currentDate.toDateString())) {
        checkInStreak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (checkInStreak > 0) {
        break; // Streak broken
      } else {
        currentDate.setDate(currentDate.getDate() - 1);
        if ((now.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24) > 7) {
          break; // Look back max 7 days for start of streak
        }
      }
    }
    
    if (checkInDates.size > 0) {
      habits.push({
        habitId: `${userId}_checkin`,
        userId,
        type: 'CHECK_IN',
        pattern: checkInStreak >= 7 ? 'Daily Check-in Champion' : 'Regular Check-in',
        frequency: 'DAILY',
        currentStreak: checkInStreak,
        longestStreak: checkInDates.size, // Simplified
        lastCompleted: lastCheckInDate || undefined,
        progress: Math.min(100, (checkInStreak / 30) * 100),
        level: Math.floor(checkInStreak / 10) + 1,
        rewards: {
          points: checkInStreak * 10,
          badges: checkInStreak >= 30 ? ['30_DAY_STREAK'] : []
        }
      });
    }
    
    // Analyze mission completion patterns
    const participationsRef = collection(db, 'participations');
    const missionsQuery = query(
      participationsRef,
      where('userId', '==', userId),
      where('status', 'in', ['COMPLETED', 'APPROVED'])
    );
    const missions = await getDocs(missionsQuery);
    
    // Group by week
    const weeklyMissions: Record<string, number> = {};
    let lastMissionDate: Date | null = null;
    
    missions.forEach(doc => {
      const data = doc.data();
      if (data.completedAt) {
        const date = toDate(data.completedAt);
        const weekKey = getWeekKey(date);
        weeklyMissions[weekKey] = (weeklyMissions[weekKey] || 0) + 1;
        if (!lastMissionDate || date > lastMissionDate) {
          lastMissionDate = date;
        }
      }
    });
    
    const avgMissionsPerWeek = Object.values(weeklyMissions).reduce((a, b) => a + b, 0) / Math.max(1, Object.keys(weeklyMissions).length);
    
    if (missions.size >= 3) {
      habits.push({
        habitId: `${userId}_missions`,
        userId,
        type: 'MISSION',
        pattern: avgMissionsPerWeek >= 5 ? 'Mission Master' : avgMissionsPerWeek >= 2 ? 'Active Participant' : 'Casual Explorer',
        frequency: 'WEEKLY',
        currentStreak: Object.keys(weeklyMissions).length,
        longestStreak: Object.keys(weeklyMissions).length,
        lastCompleted: lastMissionDate || undefined,
        progress: Math.min(100, (avgMissionsPerWeek / 10) * 100),
        level: Math.floor(missions.size / 10) + 1,
        rewards: {
          points: missions.size * 5,
          badges: missions.size >= 50 ? ['MISSION_VETERAN'] : []
        }
      });
    }
    
    return habits;
  } catch (error) {
    console.error('[Habit Builder] Error detecting habits:', error);
    return [];
  }
}

/**
 * Generate personalized habit challenges
 */
export async function generateHabitChallenges(userId: string): Promise<HabitChallenge[]> {
  try {
    const habits = await detectUserHabits(userId);
    const challenges: HabitChallenge[] = [];
    const now = new Date();
    
    // Check-in challenge
    const checkInHabit = habits.find(h => h.type === 'CHECK_IN');
    if (!checkInHabit || checkInHabit.currentStreak < 7) {
      const dailyExpiry = new Date(now);
      dailyExpiry.setHours(23, 59, 59, 999);
      
      challenges.push({
        challengeId: `${userId}_daily_checkin`,
        title: '7-Day Check-in Streak',
        description: 'Check in at any business for 7 days in a row',
        goal: 7,
        current: checkInHabit?.currentStreak || 0,
        timeframe: 'DAILY',
        difficulty: 'EASY',
        reward: {
          points: 100,
          badge: '7_DAY_STREAK'
        },
        expiresAt: dailyExpiry,
        motivationalMessage: checkInHabit?.currentStreak 
          ? `You're on day ${checkInHabit.currentStreak}! Keep it going!` 
          : 'Start your streak today!'
      });
    }
    
    // Weekly mission challenge
    const missionHabit = habits.find(h => h.type === 'MISSION');
    const currentWeekMissions = missionHabit?.progress || 0;
    
    challenges.push({
      challengeId: `${userId}_weekly_missions`,
      title: 'Weekend Warrior',
      description: 'Complete 5 missions this week',
      goal: 5,
      current: Math.floor((currentWeekMissions / 100) * 5),
      timeframe: 'WEEKLY',
      difficulty: 'MEDIUM',
      reward: {
        points: 250,
        badge: 'WEEKEND_WARRIOR'
      },
      expiresAt: getEndOfWeek(),
      motivationalMessage: currentWeekMissions > 50 
        ? 'Halfway there! Keep crushing it!' 
        : 'Start strong this week!'
    });
    
    // Social challenge
    challenges.push({
      challengeId: `${userId}_social_butterfly`,
      title: 'Social Butterfly',
      description: 'Follow 3 new businesses and complete their missions',
      goal: 3,
      current: 0,
      timeframe: 'WEEKLY',
      difficulty: 'MEDIUM',
      reward: {
        points: 150
      },
      expiresAt: getEndOfWeek(),
      motivationalMessage: 'Discover new favorite spots!'
    });
    
    // Explorer challenge
    challenges.push({
      challengeId: `${userId}_explorer`,
      title: 'City Explorer',
      description: 'Visit businesses in 5 different categories',
      goal: 5,
      current: 0,
      timeframe: 'MONTHLY',
      difficulty: 'HARD',
      reward: {
        points: 500,
        badge: 'CATEGORY_MASTER'
      },
      expiresAt: getEndOfMonth(),
      motivationalMessage: 'Expand your horizons!'
    });
    
    return challenges;
  } catch (error) {
    console.error('[Habit Builder] Error generating challenges:', error);
    return [];
  }
}

/**
 * Analyze habits and provide insights
 */
export async function getHabitInsights(userId: string): Promise<HabitInsight[]> {
  try {
    const habits = await detectUserHabits(userId);
    const insights: HabitInsight[] = [];
    
    // Check-in insights
    const checkInHabit = habits.find(h => h.type === 'CHECK_IN');
    if (checkInHabit) {
      if (checkInHabit.currentStreak >= 7) {
        insights.push({
          insight: `Amazing! You've checked in ${checkInHabit.currentStreak} days in a row!`,
          recommendation: 'Keep your streak alive to unlock exclusive rewards at level 3 (30 days).',
          impact: 'HIGH'
        });
      } else if (checkInHabit.currentStreak === 0 && checkInHabit.lastCompleted) {
        const daysSince = Math.floor((Date.now() - checkInHabit.lastCompleted.getTime()) / (1000 * 60 * 60 * 24));
        insights.push({
          insight: `Your check-in streak ended ${daysSince} days ago.`,
          recommendation: 'Check in today to start a new streak and earn bonus points!',
          impact: 'MEDIUM'
        });
      }
    } else {
      insights.push({
        insight: 'You haven\'t established a check-in habit yet.',
        recommendation: 'Try checking in daily for a week to earn streak bonuses and discover new places!',
        impact: 'HIGH'
      });
    }
    
    // Mission insights
    const missionHabit = habits.find(h => h.type === 'MISSION');
    if (missionHabit) {
      if (missionHabit.level >= 5) {
        insights.push({
          insight: `You're a Level ${missionHabit.level} Mission Expert!`,
          recommendation: 'Help others by sharing your favorite missions and tips.',
          impact: 'MEDIUM'
        });
      } else if (missionHabit.progress < 30) {
        insights.push({
          insight: 'You complete missions occasionally but not consistently.',
          recommendation: 'Set a goal to complete 2-3 missions per week to build momentum.',
          impact: 'MEDIUM'
        });
      }
    }
    
    return insights;
  } catch (error) {
    console.error('[Habit Builder] Error getting insights:', error);
    return [];
  }
}

// Helper functions
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

function getEndOfWeek(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = 7 - day;
  const endOfWeek = new Date(now);
  endOfWeek.setDate(now.getDate() + diff);
  endOfWeek.setHours(23, 59, 59, 999);
  return endOfWeek;
}

function getEndOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
}
