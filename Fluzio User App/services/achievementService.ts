import { db } from './AuthContext';
import { doc, getDoc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'missions' | 'social' | 'points' | 'streak' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirement: {
    type: string;
    value: number;
  };
  reward: {
    points: number;
    title?: string;
  };
  unlockedBy?: number; // Percentage of users who have this
}

export interface UserAchievement {
  achievementId: string;
  unlockedAt: Date;
  progress?: number;
}

// Achievement definitions
export const ACHIEVEMENTS: Achievement[] = [
  // Mission Achievements
  {
    id: 'first_mission',
    name: 'First Steps',
    description: 'Complete your first mission',
    icon: '🎯',
    category: 'missions',
    rarity: 'common',
    requirement: { type: 'missions_completed', value: 1 },
    reward: { points: 50 }
  },
  {
    id: 'mission_rookie',
    name: 'Mission Rookie',
    description: 'Complete 10 missions',
    icon: '🏃',
    category: 'missions',
    rarity: 'common',
    requirement: { type: 'missions_completed', value: 10 },
    reward: { points: 100 }
  },
  {
    id: 'mission_veteran',
    name: 'Mission Veteran',
    description: 'Complete 50 missions',
    icon: '💪',
    category: 'missions',
    rarity: 'rare',
    requirement: { type: 'missions_completed', value: 50 },
    reward: { points: 500 }
  },
  {
    id: 'mission_master',
    name: 'Mission Master',
    description: 'Complete 100 missions',
    icon: '👑',
    category: 'missions',
    rarity: 'epic',
    requirement: { type: 'missions_completed', value: 100 },
    reward: { points: 1000, title: 'Mission Master' }
  },
  {
    id: 'mission_legend',
    name: 'Mission Legend',
    description: 'Complete 500 missions',
    icon: '⭐',
    category: 'missions',
    rarity: 'legendary',
    requirement: { type: 'missions_completed', value: 500 },
    reward: { points: 5000, title: 'Legend' }
  },

  // Points Achievements
  {
    id: 'first_points',
    name: 'Point Collector',
    description: 'Earn your first 100 points',
    icon: '💎',
    category: 'points',
    rarity: 'common',
    requirement: { type: 'total_points', value: 100 },
    reward: { points: 25 }
  },
  {
    id: 'points_enthusiast',
    name: 'Points Enthusiast',
    description: 'Earn 1,000 points',
    icon: '💰',
    category: 'points',
    rarity: 'common',
    requirement: { type: 'total_points', value: 1000 },
    reward: { points: 100 }
  },
  {
    id: 'points_collector',
    name: 'Points Collector',
    description: 'Earn 5,000 points',
    icon: '🏆',
    category: 'points',
    rarity: 'rare',
    requirement: { type: 'total_points', value: 5000 },
    reward: { points: 500 }
  },
  {
    id: 'points_millionaire',
    name: 'Points Millionaire',
    description: 'Earn 10,000 points',
    icon: '💸',
    category: 'points',
    rarity: 'epic',
    requirement: { type: 'total_points', value: 10000 },
    reward: { points: 1000, title: 'Millionaire' }
  },

  // Social Achievements
  {
    id: 'social_butterfly',
    name: 'Social Butterfly',
    description: 'Connect with 10 people',
    icon: '🦋',
    category: 'social',
    rarity: 'common',
    requirement: { type: 'connections', value: 10 },
    reward: { points: 100 }
  },
  {
    id: 'influencer',
    name: 'Influencer',
    description: 'Get 50 followers',
    icon: '📱',
    category: 'social',
    rarity: 'rare',
    requirement: { type: 'followers', value: 50 },
    reward: { points: 500 }
  },
  {
    id: 'referral_champion',
    name: 'Referral Champion',
    description: 'Refer 10 new users',
    icon: '🎁',
    category: 'social',
    rarity: 'epic',
    requirement: { type: 'referrals', value: 10 },
    reward: { points: 1000, title: 'Champion Referrer' }
  },

  // Streak Achievements
  {
    id: 'streak_beginner',
    name: 'Getting Started',
    description: 'Login for 3 days in a row',
    icon: '🔥',
    category: 'streak',
    rarity: 'common',
    requirement: { type: 'login_streak', value: 3 },
    reward: { points: 50 }
  },
  {
    id: 'streak_week',
    name: 'Week Warrior',
    description: 'Login for 7 days in a row',
    icon: '⚡',
    category: 'streak',
    rarity: 'common',
    requirement: { type: 'login_streak', value: 7 },
    reward: { points: 150 }
  },
  {
    id: 'streak_month',
    name: 'Monthly Master',
    description: 'Login for 30 days in a row',
    icon: '🌟',
    category: 'streak',
    rarity: 'rare',
    requirement: { type: 'login_streak', value: 30 },
    reward: { points: 500, title: 'Dedicated' }
  },
  {
    id: 'streak_hardcore',
    name: 'Unstoppable',
    description: 'Login for 100 days in a row',
    icon: '💫',
    category: 'streak',
    rarity: 'legendary',
    requirement: { type: 'login_streak', value: 100 },
    reward: { points: 2000, title: 'Unstoppable' }
  },

  // Special Achievements
  {
    id: 'early_adopter',
    name: 'Early Adopter',
    description: 'Join Fluzio in its first year',
    icon: '🚀',
    category: 'special',
    rarity: 'rare',
    requirement: { type: 'join_date', value: 1 },
    reward: { points: 500, title: 'Early Adopter' }
  },
  {
    id: 'perfect_rating',
    name: 'Five Star Pro',
    description: 'Maintain a 5.0 rating with 20+ reviews',
    icon: '⭐',
    category: 'special',
    rarity: 'epic',
    requirement: { type: 'perfect_rating', value: 20 },
    reward: { points: 1000, title: 'Five Star Pro' }
  },
  {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Complete 10 missions after midnight',
    icon: '🦉',
    category: 'special',
    rarity: 'rare',
    requirement: { type: 'night_missions', value: 10 },
    reward: { points: 300 }
  },
  {
    id: 'speedster',
    name: 'Speedster',
    description: 'Complete 5 missions in one day',
    icon: '⚡',
    category: 'special',
    rarity: 'rare',
    requirement: { type: 'missions_per_day', value: 5 },
    reward: { points: 400 }
  }
];

/**
 * Check and unlock achievements for a user
 */
export const checkAchievements = async (userId: string): Promise<Achievement[]> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return [];
    }

    const userData = userDoc.data();
    const unlockedAchievements = userData.achievements || [];
    const newlyUnlocked: Achievement[] = [];

    for (const achievement of ACHIEVEMENTS) {
      // Skip if already unlocked
      if (unlockedAchievements.some((a: any) => a.achievementId === achievement.id)) {
        continue;
      }

      // Check if requirement is met
      let requirementMet = false;

      switch (achievement.requirement.type) {
        case 'missions_completed':
          requirementMet = (userData.missionsCompleted || 0) >= achievement.requirement.value;
          break;
        case 'total_points':
          requirementMet = (userData.totalPoints || 0) >= achievement.requirement.value;
          break;
        case 'connections':
          requirementMet = (userData.connections?.length || 0) >= achievement.requirement.value;
          break;
        case 'followers':
          requirementMet = (userData.followersCount || 0) >= achievement.requirement.value;
          break;
        case 'referrals':
          requirementMet = (userData.referralCount || 0) >= achievement.requirement.value;
          break;
        case 'login_streak':
          requirementMet = (userData.currentStreak || 0) >= achievement.requirement.value;
          break;
        case 'perfect_rating':
          requirementMet = (userData.rating >= 5.0) && (userData.reviewsCount || 0) >= achievement.requirement.value;
          break;
      }

      if (requirementMet) {
        // Unlock achievement
        await updateDoc(userRef, {
          achievements: arrayUnion({
            achievementId: achievement.id,
            unlockedAt: Timestamp.now()
          }),
          totalPoints: (userData.totalPoints || 0) + achievement.reward.points
        });

        newlyUnlocked.push(achievement);
      }
    }

    return newlyUnlocked;
  } catch (error) {
    console.error('[Achievements] Error checking achievements:', error);
    return [];
  }
};

/**
 * Get user's achievements
 */
export const getUserAchievements = async (userId: string): Promise<{
  unlocked: { achievement: Achievement; unlockedAt?: Date }[];
  locked: { achievement: Achievement; progress: number }[];
  progress: Record<string, number>;
}> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return { unlocked: [], locked: ACHIEVEMENTS.map(a => ({ achievement: a, progress: 0 })), progress: {} };
    }

    const userData = userDoc.data();
    const unlockedAchievements = userData.achievements || [];

    const unlocked = unlockedAchievements.map((ua: any) => ({
      achievement: ACHIEVEMENTS.find(a => a.id === ua.achievementId)!,
      unlockedAt: ua.unlockedAt?.toDate?.()
    }));
    
    const unlockedIds = unlockedAchievements.map((a: any) => a.achievementId);
    const locked = ACHIEVEMENTS.filter(a => !unlockedIds.includes(a.id));

    // Calculate progress for locked achievements
    const progress: Record<string, number> = {};
    
    locked.forEach(achievement => {
      let currentValue = 0;

      switch (achievement.requirement.type) {
        case 'missions_completed':
          currentValue = userData.missionsCompleted || 0;
          break;
        case 'total_points':
          currentValue = userData.totalPoints || 0;
          break;
        case 'connections':
          currentValue = userData.connections?.length || 0;
          break;
        case 'followers':
          currentValue = userData.followersCount || 0;
          break;
        case 'referrals':
          currentValue = userData.referralCount || 0;
          break;
        case 'login_streak':
          currentValue = userData.currentStreak || 0;
          break;
      }

      progress[achievement.id] = Math.min(100, (currentValue / achievement.requirement.value) * 100);
    });

    const lockedWithProgress = locked.map(achievement => ({
      achievement,
      progress: Math.round(progress[achievement.id] || 0)
    }));

    return { unlocked, locked: lockedWithProgress, progress };
  } catch (error) {
    console.error('[Achievements] Error getting user achievements:', error);
    return { unlocked: [], locked: ACHIEVEMENTS.map(a => ({ achievement: a, progress: 0 })), progress: {} };
  }
};

/**
 * Get achievement by ID
 */
export const getAchievement = (achievementId: string): Achievement | undefined => {
  return ACHIEVEMENTS.find(a => a.id === achievementId);
};

/**
 * Get achievements by category
 */
export const getAchievementsByCategory = (category: Achievement['category']): Achievement[] => {
  return ACHIEVEMENTS.filter(a => a.category === category);
};

/**
 * Get achievements by rarity
 */
export const getAchievementsByRarity = (rarity: Achievement['rarity']): Achievement[] => {
  return ACHIEVEMENTS.filter(a => a.rarity === rarity);
};
