'use server';

import { getAdminAuth, db } from '@/lib/firebase/admin';
import { collection, getDocs } from '@/lib/firebase/firestoreCompat';
import { cookies } from 'next/headers';

interface BusinessRedemptionStats {
  businessId: string;
  businessName: string;
  city: string;
  country: string;
  totalRedemptions: number;
  uniqueCustomers: number;
  totalPointsRedeemed: number;
  topRewards: Array<{
    rewardId: string;
    rewardTitle: string;
    count: number;
  }>;
}

export async function getRedemptionStatsAction(): Promise<{
  success: boolean;
  stats?: BusinessRedemptionStats[];
  countries?: string[];
  cities?: string[];
  error?: string;
}> {
  try {
    // Verify admin authentication
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    if (!sessionCookie) {
      return { success: false, error: 'Unauthorized' };
    }

    const auth = getAdminAuth();
    await auth.verifySessionCookie(sessionCookie, true);

    // Using db from imports

    // Fetch all redemptions
    const redemptionsSnap = await getDocs(collection(db, 'redemptions'));

    // Fetch all businesses
    const businessesSnap = await getDocs(collection(db, 'businesses'));
    const businessesMap = new Map();
    businessesSnap.forEach((doc: any) => {
      const data = doc.data();
      businessesMap.set(doc.id, {
        name: data.businessName || data.name || 'Unknown Business',
        city: data.city || 'Unknown',
        country: data.countryId || 'Unknown'
      });
    });

    // Fetch all rewards for titles
    const rewardsSnap = await getDocs(collection(db, 'rewards'));
    const rewardsMap = new Map();
    rewardsSnap.forEach((doc: any) => {
      const data = doc.data();
      rewardsMap.set(doc.id, data.title || 'Unknown Reward');
    });

    // Group redemptions by business
    const businessStats = new Map<string, BusinessRedemptionStats>();
    const uniqueCountries = new Set<string>();
    const uniqueCities = new Set<string>();

    redemptionsSnap.forEach(doc => {
      const redemption = doc.data();
      const businessId = redemption.businessId;
      if (!businessId) return;

      const businessInfo = businessesMap.get(businessId);
      if (!businessInfo) return;

      uniqueCountries.add(businessInfo.country);
      uniqueCities.add(businessInfo.city);

      if (!businessStats.has(businessId)) {
        businessStats.set(businessId, {
          businessId,
          businessName: businessInfo.name,
          city: businessInfo.city,
          country: businessInfo.country,
          totalRedemptions: 0,
          uniqueCustomers: 0,
          totalPointsRedeemed: 0,
          topRewards: []
        });
      }

      const stats = businessStats.get(businessId)!;
      stats.totalRedemptions++;
      stats.totalPointsRedeemed += redemption.pointsCost || 0;

      // Track rewards
      const rewardId = redemption.rewardId;
      const existing = stats.topRewards.find(r => r.rewardId === rewardId);
      if (existing) {
        existing.count++;
      } else {
        stats.topRewards.push({
          rewardId,
          rewardTitle: rewardsMap.get(rewardId) || 'Unknown',
          count: 1
        });
      }
    });

    // Count unique customers per business
    const customersByBusiness = new Map<string, Set<string>>();
    redemptionsSnap.forEach((doc: any) => {
      const redemption = doc.data();
      const businessId = redemption.businessId;
      const customerId = redemption.customerId;
      if (!businessId || !customerId) return;

      if (!customersByBusiness.has(businessId)) {
        customersByBusiness.set(businessId, new Set());
      }
      customersByBusiness.get(businessId)!.add(customerId);
    });

    customersByBusiness.forEach((customers, businessId) => {
      const stats = businessStats.get(businessId);
      if (stats) {
        stats.uniqueCustomers = customers.size;
      }
    });

    // Sort top rewards for each business
    businessStats.forEach(stats => {
      stats.topRewards.sort((a, b) => b.count - a.count);
      stats.topRewards = stats.topRewards.slice(0, 3); // Top 3 only
    });

    // Convert to array and sort by unique customers (most to least)
    const sortedStats = Array.from(businessStats.values())
      .sort((a, b) => b.uniqueCustomers - a.uniqueCustomers);

    return {
      success: true,
      stats: sortedStats,
      countries: ['All', ...Array.from(uniqueCountries).sort()],
      cities: ['All', ...Array.from(uniqueCities).sort()]
    };
  } catch (error: any) {
    console.error('[getRedemptionStatsAction] Error:', error);
    return { success: false, error: error.message || 'Failed to fetch redemption stats' };
  }
}
