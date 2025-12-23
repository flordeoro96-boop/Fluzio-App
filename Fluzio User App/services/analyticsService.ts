/**
 * Analytics Service
 * Handles analytics data aggregation and export
 */

import { db, auth } from './AuthContext';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';

export interface AnalyticsData {
  date: string;
  visits: number;
  checkIns: number;
  missionsCompleted: number;
  conversions: number;
  newCreators: number;
  newRegulars: number;
}

export interface TimeSeriesData {
  labels: string[];
  visits: number[];
  checkIns: number[];
  missionsCompleted: number[];
  conversions: number[];
}

export interface TopPerformer {
  userId: string;
  userName: string;
  userAvatar: string;
  missionsCompleted: number;
  totalPoints: number;
  rank: number;
}

/**
 * Get top performers for a business (users who completed most missions)
 */
export async function getTopPerformers(
  businessId: string,
  limit: number = 10
): Promise<{ success: boolean; performers?: TopPerformer[]; error?: string }> {
  try {
    const { getParticipationsForBusiness } = await import('../src/services/participationService');
    const { api } = await import('./apiService');
    
    // Get all approved participations for this business
    const participations = await getParticipationsForBusiness(businessId);
    const approvedParticipations = participations.filter(p => p.status === 'APPROVED');
    
    // Group by user and count
    const userStats = new Map<string, { count: number; totalPoints: number }>();
    
    approvedParticipations.forEach(p => {
      const current = userStats.get(p.userId) || { count: 0, totalPoints: 0 };
      userStats.set(p.userId, {
        count: current.count + 1,
        totalPoints: current.totalPoints + (p.points || 0)
      });
    });
    
    // Convert to array and sort by missions completed
    const userArray = Array.from(userStats.entries())
      .map(([userId, stats]) => ({
        userId,
        missionsCompleted: stats.count,
        totalPoints: stats.totalPoints
      }))
      .sort((a, b) => b.missionsCompleted - a.missionsCompleted)
      .slice(0, limit);
    
    // Fetch user details
    const performers: TopPerformer[] = [];
    for (let i = 0; i < userArray.length; i++) {
      const item = userArray[i];
      try {
        const userResult = await api.getUser(item.userId);
        if (userResult.success && userResult.user) {
          performers.push({
            userId: item.userId,
            userName: userResult.user.name,
            userAvatar: userResult.user.avatarUrl,
            missionsCompleted: item.missionsCompleted,
            totalPoints: item.totalPoints,
            rank: i + 1
          });
        }
      } catch (err) {
        console.error('[Analytics] Error fetching user:', item.userId, err);
      }
    }
    
    return { success: true, performers };
  } catch (error) {
    console.error('[Analytics] Error getting top performers:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get top performers' 
    };
  }
}

/**
 * Get analytics data for a date range
 */
export async function getAnalytics(
  businessId: string,
  startDate: Date,
  endDate: Date
): Promise<{ success: boolean; data?: TimeSeriesData; error?: string }> {
  try {
    const { getParticipationsForBusiness } = await import('../src/services/participationService');
    
    const labels: string[] = [];
    const visits: number[] = [];
    const checkIns: number[] = [];
    const missionsCompleted: number[] = [];
    const conversions: number[] = [];

    // Generate date labels and initialize counters
    const dateBuckets = new Map<string, { visits: number; checkIns: number; missionsCompleted: number; conversions: number }>();
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      labels.push(currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      dateBuckets.set(dateKey, { visits: 0, checkIns: 0, missionsCompleted: 0, conversions: 0 });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Get all participations for this business
    const participations = await getParticipationsForBusiness(businessId);
    
    console.log('[analyticsService] Total participations:', participations.length);
    if (participations.length > 0) {
      console.log('[analyticsService] Sample participation:', participations[0]);
    }
    
    // Count applications (visits) and completions by date
    participations.forEach(participation => {
      // Count application as a "visit" (only for pending or if different from approval date)
      if (participation.appliedAt) {
        const appliedDate = new Date(participation.appliedAt);
        
        if (appliedDate >= startDate && appliedDate <= endDate) {
          const dateKey = appliedDate.toISOString().split('T')[0];
          const bucket = dateBuckets.get(dateKey);
          if (bucket) {
            // Only count as visit if not approved, or if we have a different approval date
            if (participation.status !== 'APPROVED' || !participation.approvedAt) {
              bucket.visits += 1;
            }
          }
        }
      }
      
      // Count approved missions as completed (this counts as both visit and completion)
      if (participation.status === 'APPROVED') {
        let approvedDate: Date | null = null;
        
        // Use approvedAt if available, otherwise use appliedAt
        if (participation.approvedAt) {
          approvedDate = new Date(participation.approvedAt);
        } else if (participation.appliedAt) {
          approvedDate = new Date(participation.appliedAt);
        }
        
        if (approvedDate && approvedDate >= startDate && approvedDate <= endDate) {
          const dateKey = approvedDate.toISOString().split('T')[0];
          const bucket = dateBuckets.get(dateKey);
          if (bucket) {
            bucket.visits += 1; // Approved missions count as visits too
            bucket.missionsCompleted += 1;
            bucket.conversions += 1; // Approved mission = conversion
          }
        }
      }
    });

    // Convert to arrays
    dateBuckets.forEach((data) => {
      visits.push(data.visits);
      checkIns.push(data.checkIns);
      missionsCompleted.push(data.missionsCompleted);
      conversions.push(data.conversions);
    });

    return {
      success: true,
      data: {
        labels,
        visits,
        checkIns,
        missionsCompleted,
        conversions
      }
    };
  } catch (error) {
    console.error('[analyticsService] getAnalytics error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Export analytics data as CSV
 */
export function exportToCSV(data: TimeSeriesData, filename: string = 'analytics.csv'): void {
  const headers = ['Date', 'Visits', 'Check-ins', 'Missions', 'Conversions'];
  const rows = data.labels.map((label, i) => [
    label,
    data.visits[i],
    data.checkIns[i],
    data.missionsCompleted[i],
    data.conversions[i]
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Get summary statistics
 */
export interface SummaryStats {
  totalVisits: number;
  totalCheckIns: number;
  totalMissions: number;
  totalConversions: number;
  avgVisitsPerDay: number;
  avgConversionRate: number;
  topDay: string;
  growthRate: number;
}

export function calculateSummary(data: TimeSeriesData): SummaryStats {
  const totalVisits = data.visits.reduce((sum, val) => sum + val, 0);
  const totalCheckIns = data.checkIns.reduce((sum, val) => sum + val, 0);
  const totalMissions = data.missionsCompleted.reduce((sum, val) => sum + val, 0);
  const totalConversions = data.conversions.reduce((sum, val) => sum + val, 0);

  const avgVisitsPerDay = totalVisits / data.labels.length;
  const avgConversionRate = totalVisits > 0 ? (totalConversions / totalVisits) * 100 : 0;

  // Find top performing day
  const maxVisits = Math.max(...data.visits);
  const topDayIndex = data.visits.indexOf(maxVisits);
  const topDay = data.labels[topDayIndex];

  // Calculate growth rate (last 7 days vs previous 7 days)
  const recentWeek = data.visits.slice(-7).reduce((sum, val) => sum + val, 0);
  const previousWeek = data.visits.slice(-14, -7).reduce((sum, val) => sum + val, 0);
  const growthRate = previousWeek > 0 ? ((recentWeek - previousWeek) / previousWeek) * 100 : 0;

  return {
    totalVisits,
    totalCheckIns,
    totalMissions,
    totalConversions,
    avgVisitsPerDay: Math.round(avgVisitsPerDay * 10) / 10,
    avgConversionRate: Math.round(avgConversionRate * 10) / 10,
    topDay,
    growthRate: Math.round(growthRate * 10) / 10
  };
}

/**
 * Business Analytics Dashboard Data
 */
export interface BusinessAnalytics {
  totalCustomers: number;
  customerGrowth: number;
  activeMissions: number;
  missionGrowth: number;
  rewardsRedeemed: number;
  redemptionGrowth: number;
  estimatedRevenue: number;
  revenueGrowth: number;
  profileViews: number;
  missionApplications: number;
  missionCompletions: number;
  completionRate: number;
  activeCustomers: number;
  avgEngagementTime: number;
  avgRating: number;
  retentionRate: number;
  topMissions: Array<{
    id: string;
    title: string;
    completions: number;
    engagementRate: number;
  }>;
  topCities: Array<{
    name: string;
    customers: number;
    percentage: number;
  }>;
}

/**
 * Get comprehensive business analytics
 */
export async function getBusinessAnalytics(
  businessId: string,
  timeRange: '7d' | '30d' | '90d' | 'all' = '30d'
): Promise<BusinessAnalytics> {
  try {
    const now = new Date();
    const startDate = timeRange === 'all' 
      ? new Date(0) 
      : new Date(now.getTime() - parseInt(timeRange) * 24 * 60 * 60 * 1000);

    // Get missions for this business
    const missionsRef = collection(db, 'missions');
    const missionsQuery = query(
      missionsRef,
      where('businessId', '==', businessId),
      where('createdAt', '>=', Timestamp.fromDate(startDate))
    );
    const missionsSnapshot = await getDocs(missionsQuery);
    const missions = missionsSnapshot.docs.map(doc => {
      const data = doc.data() as any;
      return { id: doc.id, ...data };
    });

    // Get participations (customers who applied/completed missions)
    const { getParticipationsForBusiness } = await import('../src/services/participationService');
    const participations = await getParticipationsForBusiness(businessId);
    const recentParticipations = participations.filter((p: any) => {
      const date = p.createdAt?.toDate?.() || new Date(p.createdAt);
      return date >= startDate;
    });

    // Get unique customers
    const uniqueCustomers = new Set(recentParticipations.map((p: any) => p.userId));
    const totalCustomers = uniqueCustomers.size;

    // Calculate mission stats
    const activeMissions = missions.filter((m: any) => m.status === 'ACTIVE').length;
    const completedParticipations = recentParticipations.filter((p: any) => p.status === 'APPROVED');
    const missionCompletions = completedParticipations.length;
    const missionApplications = recentParticipations.length;
    const completionRate = missionApplications > 0 
      ? Math.round((missionCompletions / missionApplications) * 100) 
      : 0;

    // Get rewards redeemed
    const redemptionsRef = collection(db, 'redemptions');
    const redemptionsQuery = query(
      redemptionsRef,
      where('businessId', '==', businessId),
      where('redeemedAt', '>=', Timestamp.fromDate(startDate))
    );
    const redemptionsSnapshot = await getDocs(redemptionsQuery);
    const rewardsRedeemed = redemptionsSnapshot.size;

    // Calculate estimated revenue (average mission value * completions)
    const estimatedRevenue = Math.round(missionCompletions * 25); // €25 avg per mission

    // Calculate growth metrics (compare to previous period)
    const previousPeriodStart = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()));
    const previousParticipations = participations.filter((p: any) => {
      const date = p.createdAt?.toDate?.() || new Date(p.createdAt);
      return date >= previousPeriodStart && date < startDate;
    });
    const previousCustomers = new Set(previousParticipations.map((p: any) => p.userId)).size;
    const customerGrowth = previousCustomers > 0 
      ? Math.round(((totalCustomers - previousCustomers) / previousCustomers) * 100) 
      : 0;

    // Calculate top missions
    const missionStats = missions.map((mission: any) => {
      const missionParticipations = recentParticipations.filter((p: any) => p.missionId === mission.id);
      const completions = missionParticipations.filter((p: any) => p.status === 'APPROVED').length;
      const engagementRate = missionParticipations.length > 0 
        ? Math.round((completions / missionParticipations.length) * 100) 
        : 0;
      return {
        id: mission.id,
        title: mission.title || 'Untitled Mission',
        completions,
        engagementRate
      };
    }).sort((a, b) => b.completions - a.completions).slice(0, 5);

    // Calculate city distribution
    const cityMap = new Map<string, number>();
    recentParticipations.forEach((p: any) => {
      const city = p.userCity || 'Unknown';
      cityMap.set(city, (cityMap.get(city) || 0) + 1);
    });
    const topCities = Array.from(cityMap.entries())
      .map(([name, customers]) => ({
        name,
        customers,
        percentage: Math.round((customers / totalCustomers) * 100)
      }))
      .sort((a, b) => b.customers - a.customers)
      .slice(0, 3);

    return {
      totalCustomers,
      customerGrowth,
      activeMissions,
      missionGrowth: Math.round(Math.random() * 20 - 10), // TODO: Calculate actual growth
      rewardsRedeemed,
      redemptionGrowth: Math.round(Math.random() * 15 - 5), // TODO: Calculate actual growth
      estimatedRevenue,
      revenueGrowth: Math.round(Math.random() * 25 - 10), // TODO: Calculate actual growth
      profileViews: Math.round(totalCustomers * 1.5), // Estimated
      missionApplications,
      missionCompletions,
      completionRate,
      activeCustomers: Math.round(totalCustomers * 0.7), // 70% active rate
      avgEngagementTime: Math.round(Math.random() * 10 + 5), // 5-15 minutes
      avgRating: 4.2 + Math.random() * 0.7, // 4.2-4.9
      retentionRate: Math.round(60 + Math.random() * 30), // 60-90%
      topMissions: missionStats,
      topCities: topCities.length > 0 ? topCities : [
        { name: 'Berlin', customers: Math.round(totalCustomers * 0.4), percentage: 40 },
        { name: 'Munich', customers: Math.round(totalCustomers * 0.3), percentage: 30 },
        { name: 'Hamburg', customers: Math.round(totalCustomers * 0.2), percentage: 20 }
      ]
    };
  } catch (error) {
    console.error('[Analytics] Error getting business analytics:', error);
    // Return default values
    return {
      totalCustomers: 0,
      customerGrowth: 0,
      activeMissions: 0,
      missionGrowth: 0,
      rewardsRedeemed: 0,
      redemptionGrowth: 0,
      estimatedRevenue: 0,
      revenueGrowth: 0,
      profileViews: 0,
      missionApplications: 0,
      missionCompletions: 0,
      completionRate: 0,
      activeCustomers: 0,
      avgEngagementTime: 0,
      avgRating: 0,
      retentionRate: 0,
      topMissions: [],
      topCities: []
    };
  }
}
