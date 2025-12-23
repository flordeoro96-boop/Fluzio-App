import { collection, query, where, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from './AuthContext';

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  avatarUrl?: string;
  points: number;
  level: number;
  missionsCompleted: number;
  rewardsClaimed: number;
  rank: number;
  city?: string;
  badge?: string;
}

export type LeaderboardPeriod = 'weekly' | 'monthly' | 'all-time';
export type LeaderboardMetric = 'points' | 'missions' | 'level';

/**
 * Get leaderboard rankings
 */
export const getLeaderboard = async (
  period: LeaderboardPeriod = 'all-time',
  metric: LeaderboardMetric = 'points',
  maxResults: number = 50,
  city?: string
): Promise<LeaderboardEntry[]> => {
  try {
    const usersRef = collection(db, 'users');
    let q = query(usersRef);

    // Filter by city if specified
    if (city) {
      q = query(q, where('city', '==', city));
    }

    // Order by metric
    const orderField = metric === 'missions' ? 'missionsCompleted' : metric;
    q = query(q, orderBy(orderField, 'desc'), limit(maxResults));

    const snapshot = await getDocs(q);
    
    const entries: LeaderboardEntry[] = snapshot.docs.map((doc, index) => {
      const data = doc.data();
      return {
        userId: doc.id,
        userName: data.name || 'Anonymous',
        avatarUrl: data.photoUrl || data.avatarUrl,
        points: data.points || 0,
        level: data.level || 1,
        missionsCompleted: data.missionsCompleted || 0,
        rewardsClaimed: data.rewardsClaimed || 0,
        rank: index + 1,
        city: data.city,
        badge: data.badge
      };
    });

    return entries;
  } catch (error) {
    console.error('[LeaderboardService] Error fetching leaderboard:', error);
    return [];
  }
};

/**
 * Get friend leaderboard
 */
export const getFriendLeaderboard = async (
  userId: string,
  friendIds: string[],
  metric: LeaderboardMetric = 'points'
): Promise<LeaderboardEntry[]> => {
  try {
    if (friendIds.length === 0) {
      return [];
    }

    // Include current user in the list
    const userIdsToFetch = [...friendIds, userId];

    // Fetch all friends' data
    const userPromises = userIdsToFetch.map(async (id) => {
      const userRef = doc(db, 'users', id);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) return null;
      
      const data = userSnap.data();
      return {
        userId: id,
        userName: data.name || 'Anonymous',
        avatarUrl: data.photoUrl || data.avatarUrl,
        points: data.points || 0,
        level: data.level || 1,
        missionsCompleted: data.missionsCompleted || 0,
        rewardsClaimed: data.rewardsClaimed || 0,
        rank: 0,
        city: data.city,
        badge: data.badge
      };
    });

    const users = (await Promise.all(userPromises)).filter(u => u !== null) as LeaderboardEntry[];

    // Sort by metric
    users.sort((a, b) => {
      if (metric === 'points') return b.points - a.points;
      if (metric === 'missions') return b.missionsCompleted - a.missionsCompleted;
      if (metric === 'level') return b.level - a.level;
      return 0;
    });

    // Assign ranks
    users.forEach((user, index) => {
      user.rank = index + 1;
    });

    return users;
  } catch (error) {
    console.error('[LeaderboardService] Error fetching friend leaderboard:', error);
    return [];
  }
};

/**
 * Get user's rank
 */
export const getUserRank = async (
  userId: string,
  metric: LeaderboardMetric = 'points',
  city?: string
): Promise<{ rank: number; total: number }> => {
  try {
    const usersRef = collection(db, 'users');
    
    // Get user's score
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      return { rank: 0, total: 0 };
    }

    const userData = userSnap.data();
    const userScore = metric === 'missions' 
      ? userData.missionsCompleted || 0 
      : metric === 'level'
      ? userData.level || 1
      : userData.points || 0;

    // Count users with higher scores
    let q = query(usersRef);
    
    if (city) {
      q = query(q, where('city', '==', city));
    }

    const orderField = metric === 'missions' ? 'missionsCompleted' : metric;
    q = query(q, where(orderField, '>', userScore));

    const snapshot = await getDocs(q);
    const rank = snapshot.size + 1;

    // Get total users
    let totalQuery = query(usersRef);
    if (city) {
      totalQuery = query(totalQuery, where('city', '==', city));
    }
    const totalSnapshot = await getDocs(totalQuery);
    const total = totalSnapshot.size;

    return { rank, total };
  } catch (error) {
    console.error('[LeaderboardService] Error getting user rank:', error);
    return { rank: 0, total: 0 };
  }
};

/**
 * Get top performers (top 3)
 */
export const getTopPerformers = async (
  metric: LeaderboardMetric = 'points',
  city?: string
): Promise<LeaderboardEntry[]> => {
  return getLeaderboard('all-time', metric, 3, city);
};
