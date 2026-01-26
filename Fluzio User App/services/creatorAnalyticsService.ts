/**
 * Creator Analytics Service
 * Tracks creator performance, earnings, and engagement metrics
 */

import { db } from './apiService';
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from '../services/firestoreCompat';

export interface CreatorStats {
  // Application & Projects
  totalApplications: number;
  acceptedApplications: number;
  rejectedApplications: number;
  pendingApplications: number;
  applicationSuccessRate: number;
  
  // Earnings
  totalEarnings: number;
  monthlyEarnings: number;
  averageProjectValue: number;
  pendingPayments: number;
  
  // Profile Performance
  profileViews: number;
  profileViewsThisMonth: number;
  collaborationRequests: number;
  responseRate: number;
  averageResponseTime: number; // in hours
  
  // Completion & Reliability
  completedProjects: number;
  ongoingProjects: number;
  cancelledProjects: number;
  completionRate: number;
  averageRating: number;
  totalReviews: number;
  hireAgainRate: number;
  
  // Timeline data
  earningsTimeline: Array<{ month: string; amount: number }>;
  applicationsTimeline: Array<{ month: string; count: number; accepted: number }>;
  
  // Top performing
  topSkills: Array<{ skill: string; projectCount: number; earnings: number }>;
  topBusinesses: Array<{ businessId: string; businessName: string; projectCount: number }>;
}

export interface CreatorInsight {
  type: 'success' | 'warning' | 'info';
  title: string;
  description: string;
  icon: string;
}

export interface CreatorRecommendation {
  priority: 'high' | 'medium' | 'low';
  action: string;
  reason: string;
}

/**
 * Get comprehensive creator analytics
 */
export async function getCreatorAnalytics(creatorId: string): Promise<CreatorStats> {
  try {
    console.log('[CreatorAnalytics] Loading analytics for creator:', creatorId);

    // Get all creator applications
    const applicationsRef = collection(db, 'creatorApplications');
    const applicationsQuery = query(applicationsRef, where('creatorId', '==', creatorId));
    const applicationsSnap = await getDocs(applicationsQuery);
    
    const applications = applicationsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log('[CreatorAnalytics] Total applications:', applications.length);

    // Calculate application stats
    const totalApplications = applications.length;
    const acceptedApplications = applications.filter((app: any) => app.status === 'ACCEPTED').length;
    const rejectedApplications = applications.filter((app: any) => app.status === 'REJECTED').length;
    const pendingApplications = applications.filter((app: any) => app.status === 'PENDING').length;
    const applicationSuccessRate = totalApplications > 0 
      ? Math.round((acceptedApplications / totalApplications) * 100) 
      : 0;

    // Get completed projects
    const projectsRef = collection(db, 'projects');
    const creatorProjectsQuery = query(
      projectsRef,
      where('creatorRoles', 'array-contains', { creatorId })
    );
    const projectsSnap = await getDocs(creatorProjectsQuery);
    
    const completedProjects = projectsSnap.docs.filter(doc => 
      doc.data().status === 'COMPLETED'
    ).length;
    const ongoingProjects = projectsSnap.docs.filter(doc => 
      doc.data().status === 'ACTIVE'
    ).length;
    const cancelledProjects = projectsSnap.docs.filter(doc => 
      doc.data().status === 'CANCELLED'
    ).length;
    
    const totalProjects = completedProjects + cancelledProjects;
    const completionRate = totalProjects > 0 
      ? Math.round((completedProjects / totalProjects) * 100) 
      : 0;

    // Calculate earnings (mock data for now - would come from payment records)
    const averageProjectValue = completedProjects > 0 ? 350 : 0;
    const totalEarnings = completedProjects * averageProjectValue;
    const monthlyEarnings = Math.round(totalEarnings / 6); // Last 6 months average

    // Get profile views (mock data - would track in separate collection)
    const profileViews = Math.floor(Math.random() * 500) + 100;
    const profileViewsThisMonth = Math.floor(Math.random() * 100) + 20;

    // Get collaboration requests
    const collaborationRequests = applications.filter(app => 
      (app: any) => app.type === 'INVITATION'
    ).length;

    // Calculate response metrics (mock data)
    const responseRate = 85; // 85% response rate
    const averageResponseTime = 4; // 4 hours average

    // Calculate ratings (mock data - would come from reviews)
    const averageRating = 4.7;
    const totalReviews = completedProjects;
    const hireAgainRate = 90;

    // Generate earnings timeline (last 6 months)
    const earningsTimeline = generateEarningsTimeline(completedProjects);
    
    // Generate applications timeline
    const applicationsTimeline = generateApplicationsTimeline(applications);

    // Calculate top skills
    const topSkills = calculateTopSkills(applications);

    // Calculate top businesses
    const topBusinesses = calculateTopBusinesses(applications);

    const stats: CreatorStats = {
      totalApplications,
      acceptedApplications,
      rejectedApplications,
      pendingApplications,
      applicationSuccessRate,
      totalEarnings,
      monthlyEarnings,
      averageProjectValue,
      pendingPayments: Math.round(monthlyEarnings * 0.3), // 30% pending
      profileViews,
      profileViewsThisMonth,
      collaborationRequests,
      responseRate,
      averageResponseTime,
      completedProjects,
      ongoingProjects,
      cancelledProjects,
      completionRate,
      averageRating,
      totalReviews,
      hireAgainRate,
      earningsTimeline,
      applicationsTimeline,
      topSkills,
      topBusinesses
    };

    console.log('[CreatorAnalytics] Stats calculated:', stats);
    return stats;

  } catch (error) {
    console.error('[CreatorAnalytics] Error loading analytics:', error);
    throw error;
  }
}

/**
 * Generate AI-powered insights for creator
 */
export function generateCreatorInsights(stats: CreatorStats): CreatorInsight[] {
  const insights: CreatorInsight[] = [];

  // Success rate insight
  if (stats.applicationSuccessRate >= 70) {
    insights.push({
      type: 'success',
      title: 'High Success Rate',
      description: `Your ${stats.applicationSuccessRate}% application acceptance rate is excellent. Businesses trust your work!`,
      icon: '🎯'
    });
  } else if (stats.applicationSuccessRate < 40 && stats.totalApplications > 5) {
    insights.push({
      type: 'warning',
      title: 'Low Application Success',
      description: `Only ${stats.applicationSuccessRate}% of your applications are accepted. Consider improving your portfolio or tailoring proposals.`,
      icon: '⚠️'
    });
  }

  // Earnings insight
  if (stats.monthlyEarnings > 500) {
    insights.push({
      type: 'success',
      title: 'Strong Earnings',
      description: `You're earning $${stats.monthlyEarnings}/month. Keep up the great work!`,
      icon: '💰'
    });
  } else if (stats.totalApplications > 0 && stats.monthlyEarnings < 200) {
    insights.push({
      type: 'info',
      title: 'Growth Opportunity',
      description: `Your monthly earnings ($${stats.monthlyEarnings}) could be higher. Consider increasing your rates or taking on more projects.`,
      icon: '📈'
    });
  }

  // Profile visibility
  if (stats.profileViewsThisMonth > 50) {
    insights.push({
      type: 'success',
      title: 'High Profile Visibility',
      description: `${stats.profileViewsThisMonth} businesses viewed your profile this month. Your visibility is strong!`,
      icon: '👀'
    });
  } else if (stats.profileViewsThisMonth < 10 && stats.totalApplications > 0) {
    insights.push({
      type: 'warning',
      title: 'Low Profile Views',
      description: 'Only a few businesses are viewing your profile. Update your portfolio and skills to stand out.',
      icon: '🔍'
    });
  }

  // Reliability insight
  if (stats.completionRate >= 90 && stats.completedProjects >= 5) {
    insights.push({
      type: 'success',
      title: 'Highly Reliable',
      description: `${stats.completionRate}% project completion rate. Businesses love working with reliable creators!`,
      icon: '⭐'
    });
  }

  // Response time
  if (stats.averageResponseTime <= 2) {
    insights.push({
      type: 'success',
      title: 'Quick Responder',
      description: `You respond in ${stats.averageResponseTime} hours on average. Fast communication wins projects!`,
      icon: '⚡'
    });
  }

  return insights.slice(0, 3); // Return top 3 insights
}

/**
 * Generate AI-powered recommendations
 */
export function generateCreatorRecommendations(stats: CreatorStats): CreatorRecommendation[] {
  const recommendations: CreatorRecommendation[] = [];

  // Portfolio recommendation
  if (stats.applicationSuccessRate < 50 && stats.totalApplications > 5) {
    recommendations.push({
      priority: 'high',
      action: 'Improve your portfolio',
      reason: 'Your low acceptance rate suggests businesses need to see more compelling work samples.'
    });
  }

  // Pricing recommendation
  if (stats.averageProjectValue < 200 && stats.completedProjects >= 5) {
    recommendations.push({
      priority: 'high',
      action: 'Consider raising your rates',
      reason: `Your average project value ($${stats.averageProjectValue}) is below market average. Quality work deserves fair compensation.`
    });
  }

  // Activity recommendation
  if (stats.totalApplications < 5) {
    recommendations.push({
      priority: 'high',
      action: 'Apply to more opportunities',
      reason: 'Only a few applications submitted. More applications = more chances to land projects.'
    });
  }

  // Profile optimization
  if (stats.profileViewsThisMonth < 20) {
    recommendations.push({
      priority: 'medium',
      action: 'Optimize your profile',
      reason: 'Low profile views suggest you need better SEO. Add more skills, update your bio, and showcase recent work.'
    });
  }

  // Response time
  if (stats.averageResponseTime > 12) {
    recommendations.push({
      priority: 'medium',
      action: 'Respond faster to businesses',
      reason: 'Your average response time is over 12 hours. Quick responses increase your chances of winning projects.'
    });
  }

  // Diversification
  if (stats.topSkills.length === 1 && stats.completedProjects >= 3) {
    recommendations.push({
      priority: 'low',
      action: 'Expand your skill set',
      reason: 'You specialize in one area. Learning complementary skills opens up more opportunities.'
    });
  }

  // Testimonials
  if (stats.totalReviews < stats.completedProjects / 2) {
    recommendations.push({
      priority: 'medium',
      action: 'Request more reviews',
      reason: 'You have completed projects without reviews. Ask satisfied clients for testimonials to build trust.'
    });
  }

  return recommendations.slice(0, 4); // Return top 4 recommendations
}

// Helper functions
function generateEarningsTimeline(completedProjects: number): Array<{ month: string; amount: number }> {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const avgPerMonth = completedProjects / 6;
  
  return months.map(month => ({
    month,
    amount: Math.round((avgPerMonth * 350) + (Math.random() * 200 - 100))
  }));
}

function generateApplicationsTimeline(applications: any[]): Array<{ month: string; count: number; accepted: number }> {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const avgPerMonth = applications.length / 6;
  
  return months.map(month => ({
    month,
    count: Math.round(avgPerMonth + (Math.random() * 3 - 1.5)),
    accepted: Math.round((avgPerMonth * 0.6) + (Math.random() * 2 - 1))
  }));
}

function calculateTopSkills(applications: any[]): Array<{ skill: string; projectCount: number; earnings: number }> {
  const skillsMap: { [key: string]: { count: number; earnings: number } } = {};
  
  applications.forEach(app => {
    const skill = app.roleName || 'Photography';
    if (!skillsMap[skill]) {
      skillsMap[skill] = { count: 0, earnings: 0 };
    }
    skillsMap[skill].count++;
    if (app.status === 'ACCEPTED') {
      skillsMap[skill].earnings += 350; // Average project value
    }
  });

  return Object.entries(skillsMap)
    .map(([skill, data]) => ({
      skill,
      projectCount: data.count,
      earnings: data.earnings
    }))
    .sort((a, b) => b.earnings - a.earnings)
    .slice(0, 3);
}

function calculateTopBusinesses(applications: any[]): Array<{ businessId: string; businessName: string; projectCount: number }> {
  const businessMap: { [key: string]: { name: string; count: number } } = {};
  
  applications.forEach(app => {
    const businessId = app.businessId || 'unknown';
    const businessName = app.businessName || 'Unknown Business';
    
    if (!businessMap[businessId]) {
      businessMap[businessId] = { name: businessName, count: 0 };
    }
    if (app.status === 'ACCEPTED') {
      businessMap[businessId].count++;
    }
  });

  return Object.entries(businessMap)
    .map(([businessId, data]) => ({
      businessId,
      businessName: data.name,
      projectCount: data.count
    }))
    .filter(b => b.projectCount > 0)
    .sort((a, b) => b.projectCount - a.projectCount)
    .slice(0, 3);
}
