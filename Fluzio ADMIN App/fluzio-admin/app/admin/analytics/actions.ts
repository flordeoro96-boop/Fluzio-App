'use server';

import { cookies } from 'next/headers';
import { getAdminAuth, db } from '@/lib/firebase/admin';
import { getDocs, Timestamp } from '@/lib/firebase/firestoreCompat';
import { getAdminById } from '@/lib/repositories/admins';

async function getAuthenticatedAdmin() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;

    if (!sessionCookie) {
      throw new Error('Not authenticated');
    }

    const auth = getAdminAuth();
    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    const admin = await getAdminById(decodedToken.uid);

    if (!admin || admin.status !== 'ACTIVE') {
      throw new Error('Not authorized');
    }

    return admin;
  } catch (error: any) {
    throw new Error(`Authentication failed: ${error.message}`);
  }
}

export interface AnalyticsData {
  userGrowth: { month: string; count: number }[];
  revenueByCountry: { country: string; revenue: number }[];
  topBusinesses: { id: string; name: string; revenue: number; orders: number }[];
  userEngagement: { metric: string; value: number; change: string }[];
  countryMetrics: { country: string; users: number; businesses: number; revenue: number }[];
}

export async function getAnalyticsDataAction(filters?: {
  startDate?: string;
  endDate?: string;
  country?: string;
}): Promise<AnalyticsData> {
  try {
    const admin = await getAuthenticatedAdmin();
    // Using db from imports

    // TODO: Implement analytics queries with Supabase
    // Returning mock data for now
    return {
      userGrowth: [{ month: 'Jan', count: 0 }],
      revenueByCountry: [{ country: 'N/A', revenue: 0 }],
      topBusinesses: [{ id: 'none', name: 'No data', revenue: 0, orders: 0 }],
      userEngagement: [{ metric: 'Loading', value: 0, change: '0%' }],
      countryMetrics: [{ country: 'N/A', users: 0, businesses: 0, revenue: 0 }],
    };

    /* Original implementation - needs migration to Supabase query builder
    const userGrowth = await getUserGrowthData(db, admin.countryScopes);
    const revenueByCountry = await getRevenueByCountry(db, admin.countryScopes);
    const topBusinesses = await getTopBusinesses(db, admin.countryScopes);
    const userEngagement = await getUserEngagement(db, admin.countryScopes);
    const countryMetrics = await getCountryMetrics(db, admin.countryScopes);

    return {
      userGrowth,
      revenueByCountry,
      topBusinesses,
      userEngagement,
      countryMetrics,
    };
    */
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch analytics data');
  }
}

async function getUserGrowthData(db: any, countryScopes: string[]) {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  
  const months = [];
  for (let i = 0; i < 6; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    months.push(date.toISOString().substring(0, 7)); // YYYY-MM format
  }

  let query: any = db.collection('users')
    .where('createdAt', '>=', Timestamp.fromDate(sixMonthsAgo));

  if (!countryScopes.includes('GLOBAL')) {
    query = query.where('countryCode', 'in', countryScopes);
  }

  const snapshot = await getDocs(query);
  const usersByMonth: Record<string, number> = {};
  
  snapshot.docs.forEach((doc: any) => {
    const data = doc.data();
    if (data.createdAt) {
      const month = data.createdAt.toDate().toISOString().substring(0, 7);
      usersByMonth[month] = (usersByMonth[month] || 0) + 1;
    }
  });

  return months.map(month => ({
    month,
    count: usersByMonth[month] || 0,
  }));
}

async function getRevenueByCountry(db: any, countryScopes: string[]) {
  let query = db.collection('businesses');
  
  if (!countryScopes.includes('GLOBAL')) {
    query = query.where('countryCode', 'in', countryScopes);
  }

  const snapshot = await getDocs(query);
  const revenueByCountry: Record<string, number> = {};

  snapshot.docs.forEach((doc: any) => {
    const data = doc.data();
    const country = data.countryCode || 'Unknown';
    const revenue = data.totalRevenue || 0;
    revenueByCountry[country] = (revenueByCountry[country] || 0) + revenue;
  });

  return Object.entries(revenueByCountry)
    .map(([country, revenue]) => ({ country, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);
}

async function getTopBusinesses(db: any, countryScopes: string[]) {
  let query = db.collection('businesses')
    .orderBy('totalRevenue', 'desc')
    .limit(10);

  if (!countryScopes.includes('GLOBAL')) {
    query = query.where('countryCode', 'in', countryScopes);
  }

  const snapshot = await getDocs(query);

  return snapshot.docs.map((doc: any) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.businessName || 'Unknown',
      revenue: data.totalRevenue || 0,
      orders: data.totalOrders || 0,
    };
  });
}

async function getUserEngagement(db: any, countryScopes: string[]) {
  let query = db.collection('users');
  
  if (!countryScopes.includes('GLOBAL')) {
    query = query.where('countryCode', 'in', countryScopes);
  }

  const snapshot = await getDocs(query);
  let totalLogins = 0;
  let activeUsers = 0;
  let totalPoints = 0;

  snapshot.docs.forEach((doc: any) => {
    const data = doc.data();
    totalLogins += data.loginCount || 0;
    if (data.lastLoginAt) {
      const lastLogin = data.lastLoginAt.toDate();
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      if (lastLogin > thirtyDaysAgo) {
        activeUsers++;
      }
    }
    totalPoints += data.points || 0;
  });

  const totalUsers = snapshot.size;

  return [
    { metric: 'Active Users (30d)', value: activeUsers, change: '+12%' },
    { metric: 'Avg Logins/User', value: Math.round(totalLogins / totalUsers) || 0, change: '+8%' },
    { metric: 'Total Points Earned', value: totalPoints, change: '+25%' },
    { metric: 'Engagement Rate', value: Math.round((activeUsers / totalUsers) * 100) || 0, change: '+5%' },
  ];
}

async function getCountryMetrics(db: any, countryScopes: string[]) {
  const countries = countryScopes.includes('GLOBAL') 
    ? ['DE', 'AE', 'US', 'GB', 'FR'] 
    : countryScopes;

  const metrics = await Promise.all(
    countries.map(async (country) => {
      const usersSnap = await db.collection('users')
        .where('countryCode', '==', country)
        .count()
        .get();

      const businessesSnap = await db.collection('businesses')
        .where('countryCode', '==', country)
        .count()
        .get();

      const businessDocs = await db.collection('businesses')
        .where('countryCode', '==', country)
        .get();

      let revenue = 0;
      businessDocs.docs.forEach((doc: any) => {
        revenue += doc.data().totalRevenue || 0;
      });

      return {
        country,
        users: usersSnap.data().count,
        businesses: businessesSnap.data().count,
        revenue,
      };
    })
  );

  return metrics.sort((a, b) => b.revenue - a.revenue);
}
