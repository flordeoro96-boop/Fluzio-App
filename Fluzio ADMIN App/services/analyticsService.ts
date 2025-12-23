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
