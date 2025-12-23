import { db } from './AuthContext';
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';

export interface AdminAnalytics {
  overview: {
    totalUsers: number;
    totalBusinesses: number;
    totalCustomers: number;
    totalMissions: number;
    totalParticipations: number;
    totalRewards: number;
    totalRedemptions: number;
    totalRevenue: number;
  };
  growth: {
    userGrowth: { period: string; count: number; change: number }[];
    businessGrowth: { period: string; count: number; change: number }[];
    missionGrowth: { period: string; count: number; change: number }[];
    revenueGrowth: { period: string; amount: number; change: number }[];
  };
  engagement: {
    activeUsers: number;
    activeBusinesses: number;
    avgMissionsPerUser: number;
    avgRedemptionsPerUser: number;
    missionCompletionRate: number;
    avgResponseTime: number; // hours
  };
  missions: {
    pending: number;
    approved: number;
    rejected: number;
    approvalRate: number;
    avgApprovalTime: number; // hours
    topBusinesses: { id: string; name: string; count: number }[];
  };
  users: {
    byRole: { role: string; count: number }[];
    byLocation: { city: string; count: number }[];
    topContributors: { id: string; name: string; points: number }[];
  };
  revenue: {
    totalSubscriptions: number;
    totalPointsSold: number;
    totalCommissions: number;
    monthlyRecurring: number;
  };
}

/**
 * Get comprehensive admin analytics
 */
export const getAdminAnalytics = async (
  timeRange: '7d' | '30d' | '90d' | 'all' = '30d'
): Promise<AdminAnalytics> => {
  try {
    const startDate = getStartDate(timeRange);

    // Fetch all necessary data in parallel
    const [
      usersSnapshot,
      missionsSnapshot,
      participationsSnapshot,
      rewardsSnapshot,
      redemptionsSnapshot
    ] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'missions')),
      getDocs(collection(db, 'participations')),
      getDocs(collection(db, 'rewards')),
      getDocs(collection(db, 'redemptions'))
    ]);

    // Process users
    const users = usersSnapshot.docs.map(doc => {
      const data = doc.data() as any;
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date()
      };
    });

    const businesses = users.filter(u => u.businessType);
    const customers = users.filter(u => !u.businessType);
    const activeUsers = users.filter(u => {
      const lastActive = u.lastActive?.toDate?.() || new Date(0);
      return (Date.now() - lastActive.getTime()) < 7 * 24 * 60 * 60 * 1000; // 7 days
    }).length;

    // Process missions
    const missions = missionsSnapshot.docs.map(doc => {
      const data = doc.data() as any;
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date()
      };
    });

    // Process participations
    const participations = participationsSnapshot.docs.map(doc => {
      const data = doc.data() as any;
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        completedAt: data.completedAt?.toDate?.(),
        approvedAt: data.approvedAt?.toDate?.()
      };
    });

    const pendingParticipations = participations.filter(p => p.status === 'pending').length;
    const approvedParticipations = participations.filter(p => p.status === 'approved').length;
    const rejectedParticipations = participations.filter(p => p.status === 'rejected').length;
    const totalReviewed = approvedParticipations + rejectedParticipations;
    const approvalRate = totalReviewed > 0 ? (approvedParticipations / totalReviewed) * 100 : 0;

    // Calculate average approval time
    const approvedWithTime = participations.filter(p => 
      p.status === 'approved' && p.completedAt && p.approvedAt
    );
    const avgApprovalTime = approvedWithTime.length > 0
      ? approvedWithTime.reduce((sum, p) => {
          const time = (p.approvedAt!.getTime() - p.completedAt!.getTime()) / (1000 * 60 * 60);
          return sum + time;
        }, 0) / approvedWithTime.length
      : 0;

    // Process rewards
    const rewards = rewardsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Process redemptions
    const redemptions = redemptionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().redeemedAt?.toDate?.() || new Date()
    }));

    // Calculate engagement metrics
    const missionCompletionRate = participations.length > 0
      ? (participations.filter(p => p.status === 'approved').length / participations.length) * 100
      : 0;

    const avgMissionsPerUser = customers.length > 0
      ? participations.length / customers.length
      : 0;

    const avgRedemptionsPerUser = customers.length > 0
      ? redemptions.length / customers.length
      : 0;

    // Top businesses by missions
    const businessMissionCounts = participations.reduce((acc, p) => {
      const businessId = missions.find(m => m.id === p.missionId)?.businessId;
      if (businessId) {
        acc[businessId] = (acc[businessId] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const topBusinesses = Object.entries(businessMissionCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([id, count]) => {
        const business = businesses.find(b => b.id === id);
        return {
          id,
          name: business?.name || 'Unknown',
          count: count as number
        };
      });

    // Users by role
    const byRole = [
      { role: 'Customer', count: customers.length },
      { role: 'Business', count: businesses.length },
      { role: 'Admin', count: users.filter(u => u.role === 'ADMIN').length }
    ];

    // Users by location
    const locationCounts = users.reduce((acc, u) => {
      const city = u.city || 'Unknown';
      acc[city] = (acc[city] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byLocation = Object.entries(locationCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([city, count]) => ({ city, count: count as number }));

    // Top contributors by points
    const topContributors = users
      .filter(u => !u.businessType)
      .sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0))
      .slice(0, 10)
      .map(u => ({
        id: u.id,
        name: u.name || 'Unknown',
        points: u.totalPoints || 0
      }));

    // Calculate growth trends
    const userGrowth = calculateGrowthTrend(users, timeRange);
    const businessGrowth = calculateGrowthTrend(businesses, timeRange);
    const missionGrowth = calculateGrowthTrend(missions, timeRange);

    // Revenue calculations (mock for now - replace with actual subscription data)
    const totalRevenue = businesses.length * 29.99; // Assuming average subscription
    const monthlyRecurring = businesses.filter(b => b.subscriptionStatus === 'active').length * 29.99;

    return {
      overview: {
        totalUsers: users.length,
        totalBusinesses: businesses.length,
        totalCustomers: customers.length,
        totalMissions: missions.length,
        totalParticipations: participations.length,
        totalRewards: rewards.length,
        totalRedemptions: redemptions.length,
        totalRevenue
      },
      growth: {
        userGrowth,
        businessGrowth,
        missionGrowth,
        revenueGrowth: [] // TODO: Implement revenue tracking
      },
      engagement: {
        activeUsers,
        activeBusinesses: businesses.filter(b => {
          const lastActive = b.lastActive?.toDate?.() || new Date(0);
          return (Date.now() - lastActive.getTime()) < 7 * 24 * 60 * 60 * 1000;
        }).length,
        avgMissionsPerUser,
        avgRedemptionsPerUser,
        missionCompletionRate,
        avgResponseTime: avgApprovalTime
      },
      missions: {
        pending: pendingParticipations,
        approved: approvedParticipations,
        rejected: rejectedParticipations,
        approvalRate,
        avgApprovalTime,
        topBusinesses
      },
      users: {
        byRole,
        byLocation,
        topContributors
      },
      revenue: {
        totalSubscriptions: businesses.filter(b => b.subscriptionStatus === 'active').length,
        totalPointsSold: 0, // TODO: Track point purchases
        totalCommissions: totalRevenue * 0.1, // 10% commission
        monthlyRecurring
      }
    };
  } catch (error) {
    console.error('[AdminAnalytics] Error fetching analytics:', error);
    throw error;
  }
};

/**
 * Calculate growth trend over time periods
 */
function calculateGrowthTrend(
  items: any[],
  timeRange: '7d' | '30d' | '90d' | 'all'
): { period: string; count: number; change: number }[] {
  const periods = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
  const result: { period: string; count: number; change: number }[] = [];

  for (let i = periods - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const count = items.filter(item => {
      const createdAt = item.createdAt;
      return createdAt >= date && createdAt < nextDate;
    }).length;

    const previousCount = i < periods - 1 ? result[result.length - 1]?.count || 0 : 0;
    const change = previousCount > 0 ? ((count - previousCount) / previousCount) * 100 : 0;

    result.push({
      period: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count,
      change
    });
  }

  return result;
}

/**
 * Get start date based on time range
 */
function getStartDate(timeRange: '7d' | '30d' | '90d' | 'all'): Date {
  if (timeRange === 'all') {
    return new Date(0);
  }

  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

/**
 * Get recent admin activity logs
 */
export const getAdminActivityLogs = async (limit: number = 50) => {
  try {
    // TODO: Implement activity logging system
    // For now, return mock data
    return [
      {
        id: '1',
        action: 'USER_BANNED',
        adminId: 'admin123',
        adminName: 'Admin User',
        targetId: 'user456',
        targetName: 'John Doe',
        reason: 'Spam activity',
        timestamp: new Date()
      }
    ];
  } catch (error) {
    console.error('[AdminAnalytics] Error fetching activity logs:', error);
    return [];
  }
};
