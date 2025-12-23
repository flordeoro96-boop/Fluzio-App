/**
 * Business Leaderboard Service
 * Handles leaderboard rankings for businesses based on various metrics
 */

import { collection, query, where, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from './AuthContext';

export interface BusinessLeaderboardEntry {
  businessId: string;
  rank: number;
  name: string;
  avatarUrl?: string;
  city?: string;
  businessType?: string;
  score: number;
  activeMissions: number;
  completedMissions: number;
  totalCustomers: number;
  rating: number;
  subscriptionLevel?: string;
  businessLevel?: number;
}

export type BusinessLeaderboardMetric = 'missions' | 'customers' | 'rating' | 'engagement';
export type BusinessLeaderboardPeriod = 'weekly' | 'monthly' | 'all-time';

/**
 * Get business leaderboard rankings
 */
export const getBusinessLeaderboard = async (
  metric: BusinessLeaderboardMetric = 'missions',
  period: BusinessLeaderboardPeriod = 'all-time',
  maxResults: number = 50,
  city?: string
): Promise<BusinessLeaderboardEntry[]> => {
  try {
    const usersRef = collection(db, 'users');
    let q = query(usersRef, where('role', '==', 'BUSINESS'));

    // Filter by city if specified
    if (city) {
      q = query(q, where('city', '==', city));
    }

    // Fetch all businesses
    const snapshot = await getDocs(q);
    const businesses = snapshot.docs.map(doc => ({
      businessId: doc.id,
      ...doc.data()
    })) as any[];

    // Calculate metrics for each business
    const businessesWithMetrics = await Promise.all(businesses.map(async (business) => {
      const businessId = business.businessId;
      
      // Use aggregated stats from business document instead of querying participations
      // This avoids permission issues when viewing other businesses' data
      const activeMissions = business.activeMissionsCount || 0;
      const completedMissions = business.completedMissionsCount || 0;
      const totalCustomers = business.totalCustomersCount || 0;
      const completedParticipations = business.totalParticipationsCount || 0;
      
      // Use the aggregated mission count from the business document
      const missionsCount = activeMissions;
      
      const engagementScore = totalCustomers * 10 + completedParticipations * 5 + missionsCount * 3;

      // Calculate score based on metric
      let score = 0;
      switch (metric) {
        case 'missions':
          score = missionsCount * 10 + completedMissions * 5;
          break;
        case 'customers':
          score = totalCustomers;
          break;
        case 'rating':
          score = (business.rating || 0) * 100;
          break;
        case 'engagement':
          score = engagementScore;
          break;
      }

      return {
        businessId,
        name: business.name || 'Unknown Business',
        avatarUrl: business.avatarUrl || business.photoUrl,
        city: business.city,
        businessType: business.businessType,
        score,
        activeMissions: missionsCount,
        completedMissions: completedMissions + completedParticipations,
        totalCustomers,
        rating: business.rating || 0,
        subscriptionLevel: business.subscriptionLevel,
        businessLevel: business.businessLevel,
        rank: 0 // Will be set below
      };
    }));

    // Sort by score
    const sorted = businessesWithMetrics.sort((a, b) => b.score - a.score);

    // Assign ranks
    sorted.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return sorted.slice(0, maxResults);
  } catch (error) {
    console.error('[BusinessLeaderboardService] Error fetching leaderboard:', error);
    return [];
  }
};

/**
 * Get business rank
 */
export const getBusinessRank = async (
  businessId: string,
  metric: BusinessLeaderboardMetric = 'missions',
  city?: string
): Promise<{ rank: number; total: number; score: number }> => {
  try {
    const leaderboard = await getBusinessLeaderboard(metric, 'all-time', 1000, city);
    const entry = leaderboard.find(e => e.businessId === businessId);
    
    return {
      rank: entry?.rank || 0,
      total: leaderboard.length,
      score: entry?.score || 0
    };
  } catch (error) {
    console.error('[BusinessLeaderboardService] Error getting rank:', error);
    return { rank: 0, total: 0, score: 0 };
  }
};

/**
 * Get top businesses in city
 */
export const getTopBusinessesInCity = async (
  city: string,
  limit: number = 10
): Promise<BusinessLeaderboardEntry[]> => {
  return getBusinessLeaderboard('engagement', 'all-time', limit, city);
};

/**
 * Get business percentile (top X%)
 */
export const getBusinessPercentile = async (
  businessId: string,
  city?: string
): Promise<number> => {
  try {
    const rank = await getBusinessRank(businessId, 'engagement', city);
    if (rank.total === 0) return 0;
    
    const percentile = ((rank.total - rank.rank) / rank.total) * 100;
    return Math.round(percentile);
  } catch (error) {
    console.error('[BusinessLeaderboardService] Error calculating percentile:', error);
    return 0;
  }
};

/**
 * Get nearby competing businesses
 */
export const getNearbyCompetitors = async (
  businessId: string,
  city: string,
  limit: number = 5
): Promise<BusinessLeaderboardEntry[]> => {
  try {
    const leaderboard = await getBusinessLeaderboard('engagement', 'all-time', 1000, city);
    const currentIndex = leaderboard.findIndex(e => e.businessId === businessId);
    
    if (currentIndex === -1) return [];

    // Get businesses around current rank
    const start = Math.max(0, currentIndex - 2);
    const end = Math.min(leaderboard.length, currentIndex + 3);
    
    return leaderboard.slice(start, end);
  } catch (error) {
    console.error('[BusinessLeaderboardService] Error getting competitors:', error);
    return [];
  }
};

/**
 * Get business statistics summary
 */
export const getBusinessStats = async (businessId: string): Promise<{
  rank: number;
  percentile: number;
  totalBusinesses: number;
  activeMissions: number;
  totalCustomers: number;
  engagementScore: number;
} | null> => {
  try {
    const businessDoc = await getDoc(doc(db, 'users', businessId));
    if (!businessDoc.exists()) return null;

    const businessData = businessDoc.data();
    const city = businessData.city;

    // Get rank and percentile
    const { rank, total, score } = await getBusinessRank(businessId, 'engagement', city);
    const percentile = total > 0 ? Math.round(((total - rank) / total) * 100) : 0;

    // Get missions
    const missionsRef = collection(db, 'missions');
    const missionsQuery = query(missionsRef, where('businessId', '==', businessId));
    const missionsSnapshot = await getDocs(missionsQuery);
    const activeMissions = missionsSnapshot.docs.filter(doc => {
      const data = doc.data();
      return data.lifecycleStatus === 'ACTIVE' && data.isActive;
    }).length;

    // Get customers
    const participationsRef = collection(db, 'participations');
    const participationsQuery = query(participationsRef, where('businessId', '==', businessId));
    const participationsSnapshot = await getDocs(participationsQuery);
    const totalCustomers = new Set(participationsSnapshot.docs.map(doc => doc.data().userId)).size;

    return {
      rank,
      percentile,
      totalBusinesses: total,
      activeMissions,
      totalCustomers,
      engagementScore: score
    };
  } catch (error) {
    console.error('[BusinessLeaderboardService] Error getting stats:', error);
    return null;
  }
};
