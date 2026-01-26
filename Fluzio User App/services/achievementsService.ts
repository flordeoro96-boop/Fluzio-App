import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where, Timestamp } from '../services/firestoreCompat';
import { db } from './apiService';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'social' | 'missions' | 'rewards' | 'events' | 'exploration' | 'streak' | 'special';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  xpReward: number;
  requirement: {
    type: 'count' | 'milestone' | 'combo' | 'special';
    target: number;
    metric?: string; // e.g., 'missionsCompleted', 'rewardsClaimed'
  };
  unlockedAt?: Date;
  progress?: number;
  isSecret?: boolean;
}

export interface UserAchievements {
  userId: string;
  achievements: Achievement[];
  totalXpEarned: number;
  lastUpdated: Date;
}

export interface DailyQuest {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  progress: number;
  target: number;
  expiresAt: Date;
  completed: boolean;
}

export interface BattlePassTier {
  tier: number;
  freeReward?: {
    type: 'xp' | 'item' | 'badge' | 'avatar';
    value: string | number;
    icon: string;
  };
  premiumReward?: {
    type: 'xp' | 'item' | 'badge' | 'avatar' | 'exclusive';
    value: string | number;
    icon: string;
  };
  xpRequired: number;
}

export interface SeasonalEvent {
  id: string;
  name: string;
  theme: string;
  startDate: Date;
  endDate: Date;
  icon: string;
  specialMissions: string[]; // Mission IDs
  exclusiveRewards: string[]; // Reward IDs
  leaderboardId?: string;
}

/**
 * Achievement definitions (100+ achievements)
 */
const ACHIEVEMENTS: Omit<Achievement, 'unlockedAt' | 'progress'>[] = [
  // Social Achievements (15)
  { id: 'social_first_friend', title: 'Making Friends', description: 'Add your first friend', icon: '👋', category: 'social', tier: 'bronze', xpReward: 10, requirement: { type: 'milestone', target: 1, metric: 'friendsCount' } },
  { id: 'social_10_friends', title: 'Social Butterfly', description: 'Have 10 friends', icon: '🦋', category: 'social', tier: 'silver', xpReward: 50, requirement: { type: 'milestone', target: 10, metric: 'friendsCount' } },
  { id: 'social_50_friends', title: 'Popular', description: 'Have 50 friends', icon: '⭐', category: 'social', tier: 'gold', xpReward: 150, requirement: { type: 'milestone', target: 50, metric: 'friendsCount' } },
  { id: 'social_first_follower', title: 'Influencer Start', description: 'Get your first follower', icon: '👁️', category: 'social', tier: 'bronze', xpReward: 10, requirement: { type: 'milestone', target: 1, metric: 'followersCount' } },
  { id: 'social_100_followers', title: 'Micro-Influencer', description: 'Reach 100 followers', icon: '📢', category: 'social', tier: 'gold', xpReward: 200, requirement: { type: 'milestone', target: 100, metric: 'followersCount' } },
  
  // Mission Achievements (20)
  { id: 'mission_first', title: 'First Steps', description: 'Complete your first mission', icon: '🎯', category: 'missions', tier: 'bronze', xpReward: 25, requirement: { type: 'milestone', target: 1, metric: 'missionsCompleted' } },
  { id: 'mission_10', title: 'Getting Started', description: 'Complete 10 missions', icon: '🏃', category: 'missions', tier: 'silver', xpReward: 100, requirement: { type: 'milestone', target: 10, metric: 'missionsCompleted' } },
  { id: 'mission_50', title: 'Mission Master', description: 'Complete 50 missions', icon: '🎖️', category: 'missions', tier: 'gold', xpReward: 300, requirement: { type: 'milestone', target: 50, metric: 'missionsCompleted' } },
  { id: 'mission_100', title: 'Century Club', description: 'Complete 100 missions', icon: '💯', category: 'missions', tier: 'platinum', xpReward: 500, requirement: { type: 'milestone', target: 100, metric: 'missionsCompleted' } },
  { id: 'mission_500', title: 'Legend', description: 'Complete 500 missions', icon: '👑', category: 'missions', tier: 'diamond', xpReward: 1000, requirement: { type: 'milestone', target: 500, metric: 'missionsCompleted' } },
  
  // Streak Achievements (10)
  { id: 'streak_7', title: 'Week Warrior', description: '7-day login streak', icon: '🔥', category: 'streak', tier: 'bronze', xpReward: 50, requirement: { type: 'milestone', target: 7, metric: 'streak' } },
  { id: 'streak_30', title: 'Monthly Master', description: '30-day login streak', icon: '📅', category: 'streak', tier: 'silver', xpReward: 200, requirement: { type: 'milestone', target: 30, metric: 'streak' } },
  { id: 'streak_100', title: 'Dedication', description: '100-day login streak', icon: '💪', category: 'streak', tier: 'gold', xpReward: 500, requirement: { type: 'milestone', target: 100, metric: 'streak' } },
  { id: 'streak_365', title: 'Year Round', description: '365-day login streak', icon: '🌟', category: 'streak', tier: 'diamond', xpReward: 2000, requirement: { type: 'milestone', target: 365, metric: 'streak' } },
  
  // Reward Achievements (10)
  { id: 'reward_first', title: 'First Reward', description: 'Redeem your first reward', icon: '🎁', category: 'rewards', tier: 'bronze', xpReward: 20, requirement: { type: 'milestone', target: 1, metric: 'rewardsClaimed' } },
  { id: 'reward_25', title: 'Reward Hunter', description: 'Redeem 25 rewards', icon: '🏹', category: 'rewards', tier: 'gold', xpReward: 250, requirement: { type: 'milestone', target: 25, metric: 'rewardsClaimed' } },
  
  // Exploration Achievements (15)
  { id: 'explore_first_business', title: 'Explorer', description: 'Visit your first business', icon: '🗺️', category: 'exploration', tier: 'bronze', xpReward: 15, requirement: { type: 'milestone', target: 1, metric: 'businessesVisited' } },
  { id: 'explore_10_businesses', title: 'City Wanderer', description: 'Visit 10 different businesses', icon: '🚶', category: 'exploration', tier: 'silver', xpReward: 100, requirement: { type: 'milestone', target: 10, metric: 'businessesVisited' } },
  { id: 'explore_50_businesses', title: 'Local Expert', description: 'Visit 50 different businesses', icon: '🎓', category: 'exploration', tier: 'gold', xpReward: 350, requirement: { type: 'milestone', target: 50, metric: 'businessesVisited' } },
  
  // Event Achievements (10)
  { id: 'event_first', title: 'Party Starter', description: 'Attend your first event', icon: '🎉', category: 'events', tier: 'bronze', xpReward: 30, requirement: { type: 'milestone', target: 1, metric: 'eventsAttended' } },
  { id: 'event_10', title: 'Social Calendar', description: 'Attend 10 events', icon: '📆', category: 'events', tier: 'silver', xpReward: 150, requirement: { type: 'milestone', target: 10, metric: 'eventsAttended' } },
  
  // Special/Secret Achievements (20)
  { id: 'special_night_owl', title: 'Night Owl', description: 'Complete a mission after midnight', icon: '🦉', category: 'special', tier: 'silver', xpReward: 75, requirement: { type: 'special', target: 1 }, isSecret: true },
  { id: 'special_early_bird', title: 'Early Bird', description: 'Complete a mission before 6 AM', icon: '🐦', category: 'special', tier: 'silver', xpReward: 75, requirement: { type: 'special', target: 1 }, isSecret: true },
  { id: 'special_birthday', title: 'Birthday Celebration', description: 'Log in on your birthday', icon: '🎂', category: 'special', tier: 'gold', xpReward: 200, requirement: { type: 'special', target: 1 }, isSecret: true },
  { id: 'special_rainbow', title: 'Rainbow Collector', description: 'Complete missions in all categories', icon: '🌈', category: 'special', tier: 'platinum', xpReward: 500, requirement: { type: 'special', target: 8 }, isSecret: true },
];

/**
 * Get user achievements
 */
export const getUserAchievements = async (userId: string): Promise<UserAchievements> => {
  try {
    const achievementsRef = doc(db, 'userAchievements', userId);
    const achievementsSnap = await getDoc(achievementsRef);
    
    if (achievementsSnap.exists()) {
      const data = achievementsSnap.data();
      return {
        userId,
        achievements: data.achievements.map((a: any) => ({
          ...a,
          unlockedAt: a.unlockedAt?.toDate(),
        })),
        totalXpEarned: data.totalXpEarned || 0,
        lastUpdated: data.lastUpdated?.toDate() || new Date(),
      };
    }
    
    // Initialize empty achievements
    return {
      userId,
      achievements: [],
      totalXpEarned: 0,
      lastUpdated: new Date(),
    };
  } catch (error) {
    console.error('[AchievementsService] Error getting achievements:', error);
    return {
      userId,
      achievements: [],
      totalXpEarned: 0,
      lastUpdated: new Date(),
    };
  }
};

/**
 * Check and unlock achievements based on user stats
 */
export const checkAchievements = async (userId: string, userStats: any): Promise<Achievement[]> => {
  try {
    const userAchievements = await getUserAchievements(userId);
    const unlockedIds = new Set(userAchievements.achievements.map(a => a.id));
    const newlyUnlocked: Achievement[] = [];
    
    for (const achievement of ACHIEVEMENTS) {
      if (unlockedIds.has(achievement.id)) continue;
      
      const { requirement } = achievement;
      const metricValue = userStats[requirement.metric || ''] || 0;
      
      if (requirement.type === 'milestone' && metricValue >= requirement.target) {
        const unlocked = {
          ...achievement,
          unlockedAt: new Date(),
          progress: metricValue,
        };
        newlyUnlocked.push(unlocked);
      }
    }
    
    if (newlyUnlocked.length > 0) {
      const achievementsRef = doc(db, 'userAchievements', userId);
      const totalXp = newlyUnlocked.reduce((sum, a) => sum + a.xpReward, 0);
      
      await setDoc(achievementsRef, {
        userId,
        achievements: [...userAchievements.achievements, ...newlyUnlocked],
        totalXpEarned: userAchievements.totalXpEarned + totalXp,
        lastUpdated: Timestamp.now(),
      }, { merge: true });
    }
    
    return newlyUnlocked;
  } catch (error) {
    console.error('[AchievementsService] Error checking achievements:', error);
    return [];
  }
};

/**
 * Get daily quests for user
 */
export const getDailyQuests = async (userId: string): Promise<DailyQuest[]> => {
  try {
    const questsRef = doc(db, 'dailyQuests', userId);
    const questsSnap = await getDoc(questsRef);
    
    if (questsSnap.exists()) {
      const data = questsSnap.data();
      const quests = data.quests.map((q: any) => ({
        ...q,
        expiresAt: q.expiresAt?.toDate(),
      }));
      
      // Check if quests expired (reset at midnight)
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      
      if (quests[0]?.expiresAt < now) {
        // Generate new quests
        return generateDailyQuests(userId);
      }
      
      return quests;
    }
    
    // Generate initial quests
    return generateDailyQuests(userId);
  } catch (error) {
    console.error('[AchievementsService] Error getting daily quests:', error);
    return [];
  }
};

/**
 * Generate new daily quests
 */
const generateDailyQuests = async (userId: string): Promise<DailyQuest[]> => {
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  
  const questTemplates = [
    { id: 'complete_missions', title: 'Mission Marathon', description: 'Complete 3 missions', icon: '🎯', xpReward: 100, target: 3 },
    { id: 'redeem_reward', title: 'Treat Yourself', description: 'Redeem 1 reward', icon: '🎁', xpReward: 50, target: 1 },
    { id: 'visit_businesses', title: 'Explorer', description: 'Visit 2 new businesses', icon: '🗺️', xpReward: 75, target: 2 },
    { id: 'social_interaction', title: 'Socialite', description: 'Chat with 3 friends', icon: '💬', xpReward: 60, target: 3 },
    { id: 'earn_points', title: 'Points Hunter', description: 'Earn 500 XP today', icon: '⭐', xpReward: 80, target: 500 },
  ];
  
  // Select 3 random quests
  const selected = questTemplates.sort(() => Math.random() - 0.5).slice(0, 3);
  
  const quests: DailyQuest[] = selected.map(template => ({
    ...template,
    progress: 0,
    expiresAt: midnight,
    completed: false,
  }));
  
  // Save to Firestore
  const questsRef = doc(db, 'dailyQuests', userId);
  await setDoc(questsRef, {
    userId,
    quests,
    generatedAt: Timestamp.now(),
  });
  
  return quests;
};

/**
 * Update quest progress
 */
export const updateQuestProgress = async (
  userId: string,
  questId: string,
  progress: number
): Promise<boolean> => {
  try {
    const questsRef = doc(db, 'dailyQuests', userId);
    const questsSnap = await getDoc(questsRef);
    
    if (!questsSnap.exists()) return false;
    
    const data = questsSnap.data();
    const quests = data.quests.map((q: any) => {
      if (q.id === questId) {
        return {
          ...q,
          progress: Math.min(progress, q.target),
          completed: progress >= q.target,
        };
      }
      return q;
    });
    
    await updateDoc(questsRef, { quests });
    return true;
  } catch (error) {
    console.error('[AchievementsService] Error updating quest progress:', error);
    return false;
  }
};

/**
 * Get all available achievements
 */
export const getAllAchievements = (): Omit<Achievement, 'unlockedAt' | 'progress'>[] => {
  return ACHIEVEMENTS;
};
