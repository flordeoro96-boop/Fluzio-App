'use server';

import { getAdminAuth, db } from '@/lib/firebase/admin';
import { collection, getDocs } from '@/lib/firebase/firestoreCompat';
import { cookies } from 'next/headers';

interface DashboardStats {
  users: {
    total: number;
    change: string;
    newThisMonth: number;
  };
  businesses: {
    total: number;
    active: number;
    pending: number;
    change: string;
  };
  creators: {
    total: number;
    verified: number;
    pending: number;
    change: string;
  };
  missions: {
    total: number;
    active: number;
    completed: number;
    change: string;
  };
  events: {
    total: number;
    upcoming: number;
    published: number;
    change: string;
  };
  finance: {
    pendingPayouts: number;
    totalAmount: number;
    currency: string;
    change: string;
  };
  rewards: {
    totalRedemptions: number;
    activeRewards: number;
    pointsRedeemed: number;
  };
}

interface DashboardAlert {
  type: 'urgent' | 'warning' | 'info';
  message: string;
  count: number;
  href: string;
}

interface RecentActivity {
  id: string;
  type: 'user' | 'business' | 'event' | 'mission' | 'payout';
  action: string;
  entity: string;
  timestamp: string;
  status?: string;
}

export async function getDashboardStatsAction(): Promise<{
  success: boolean;
  stats?: DashboardStats;
  alerts?: DashboardAlert[];
  recentActivity?: RecentActivity[];
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
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    // Using db from imports

    // Calculate date ranges
    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Fetch Users
    const usersSnap = await getDocs(collection(db, 'users'));
    const usersThisMonth = usersSnap.docs.filter(doc => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt ? new Date(data.createdAt) : null;
      return createdAt && createdAt >= firstDayThisMonth;
    }).length;
    const usersLastMonth = usersSnap.docs.filter(doc => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt ? new Date(data.createdAt) : null;
      return createdAt && createdAt >= firstDayLastMonth && createdAt <= lastDayLastMonth;
    }).length;
    const userChange = usersLastMonth > 0 
      ? `${((usersThisMonth - usersLastMonth) / usersLastMonth * 100).toFixed(1)}%`
      : '+0%';

    // Fetch Businesses
    const businessesSnap = await getDocs(collection(db, 'businesses'));
    const activeBusiness = businessesSnap.docs.filter(doc => 
      doc.data().verificationStatus === 'VERIFIED'
    ).length;
    const pendingBusiness = businessesSnap.docs.filter(doc => 
      doc.data().verificationStatus === 'PENDING'
    ).length;
    const businessThisMonth = businessesSnap.docs.filter(doc => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt ? new Date(data.createdAt) : null;
      return createdAt && createdAt >= firstDayThisMonth;
    }).length;
    const businessLastMonth = businessesSnap.docs.filter(doc => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt ? new Date(data.createdAt) : null;
      return createdAt && createdAt >= firstDayLastMonth && createdAt <= lastDayLastMonth;
    }).length;
    const businessChange = businessLastMonth > 0
      ? `${((businessThisMonth - businessLastMonth) / businessLastMonth * 100).toFixed(1)}%`
      : '+0%';

    // Fetch Creators
    const creatorsSnap = await getDocs(collection(db, 'creators'));
    const verifiedCreators = creatorsSnap.docs.filter(doc => 
      doc.data().verificationStatus === 'VERIFIED'
    ).length;
    const pendingCreators = creatorsSnap.docs.filter(doc => 
      doc.data().verificationStatus === 'PENDING'
    ).length;
    const creatorsThisMonth = creatorsSnap.docs.filter(doc => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt ? new Date(data.createdAt) : null;
      return createdAt && createdAt >= firstDayThisMonth;
    }).length;
    const creatorsLastMonth = creatorsSnap.docs.filter(doc => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt ? new Date(data.createdAt) : null;
      return createdAt && createdAt >= firstDayLastMonth && createdAt <= lastDayLastMonth;
    }).length;
    const creatorChange = creatorsLastMonth > 0
      ? `${((creatorsThisMonth - creatorsLastMonth) / creatorsLastMonth * 100).toFixed(1)}%`
      : '+0%';

    // Fetch Missions
    const missionsSnap = await getDocs(collection(db, 'missions'));
    const activeMissions = missionsSnap.docs.filter(doc => 
      doc.data().status === 'ACTIVE'
    ).length;
    const completedMissions = missionsSnap.docs.filter(doc => 
      doc.data().status === 'COMPLETED'
    ).length;
    const missionsThisMonth = missionsSnap.docs.filter(doc => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt ? new Date(data.createdAt) : null;
      return createdAt && createdAt >= firstDayThisMonth;
    }).length;
    const missionsLastMonth = missionsSnap.docs.filter(doc => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt ? new Date(data.createdAt) : null;
      return createdAt && createdAt >= firstDayLastMonth && createdAt <= lastDayLastMonth;
    }).length;
    const missionChange = missionsLastMonth > 0
      ? `${((missionsThisMonth - missionsLastMonth) / missionsLastMonth * 100).toFixed(1)}%`
      : '+0%';

    // Fetch Events
    const eventsSnap = await getDocs(collection(db, 'adminEvents'));
    const upcomingEvents = eventsSnap.docs.filter(doc => {
      const data = doc.data();
      const startDate = data.startDate?.toDate ? data.startDate.toDate() : data.startDate ? new Date(data.startDate) : null;
      return startDate && startDate > now && data.status === 'PUBLISHED';
    }).length;
    const publishedEvents = eventsSnap.docs.filter(doc => 
      doc.data().status === 'PUBLISHED'
    ).length;
    const eventsThisMonth = eventsSnap.docs.filter(doc => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt ? new Date(data.createdAt) : null;
      return createdAt && createdAt >= firstDayThisMonth;
    }).length;
    const eventsLastMonth = eventsSnap.docs.filter(doc => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt ? new Date(data.createdAt) : null;
      return createdAt && createdAt >= firstDayLastMonth && createdAt <= lastDayLastMonth;
    }).length;
    const eventChange = eventsLastMonth > 0
      ? `${((eventsThisMonth - eventsLastMonth) / eventsLastMonth * 100).toFixed(1)}%`
      : '+0%';

    // Fetch Rewards & Redemptions
    const rewardsSnap = await getDocs(collection(db, 'rewards'));
    const activeRewards = rewardsSnap.docs.filter(doc => 
      doc.data().isActive === true
    ).length;
    
    const redemptionsSnap = await getDocs(collection(db, 'redemptions'));
    const totalPointsRedeemed = redemptionsSnap.docs.reduce((sum, doc) => 
      sum + (doc.data().pointsCost || 0), 0
    );

    // Fetch Finance Data (payouts)
    const payoutsSnap = await getDocs(collection(db, 'payouts'));
    const pendingPayouts = payoutsSnap.docs.filter(doc => 
      doc.data().status === 'PENDING' || doc.data().status === 'HELD'
    );
    const totalPendingAmount = pendingPayouts.reduce((sum, doc) => 
      sum + (doc.data().amount || 0), 0
    );

    // Build alerts
    const alerts: DashboardAlert[] = [];

    if (pendingPayouts.length > 0) {
      alerts.push({
        type: 'urgent',
        message: 'payouts require review',
        count: pendingPayouts.length,
        href: '/admin/finance?tab=payouts&filter=pending'
      });
    }

    if (pendingBusiness > 0) {
      alerts.push({
        type: 'warning',
        message: 'businesses pending verification',
        count: pendingBusiness,
        href: '/admin/businesses?filter=pending-verification'
      });
    }

    if (pendingCreators > 0) {
      alerts.push({
        type: 'warning',
        message: 'creators pending verification',
        count: pendingCreators,
        href: '/admin/creators?filter=pending-verification'
      });
    }

    // Get recent activity (last 10 items across all collections)
    const recentActivity: RecentActivity[] = [];

    // Recent businesses
    const recentBusinesses = businessesSnap.docs
      .sort((a, b) => {
        const aData = a.data();
        const bData = b.data();
        const aTime = aData.createdAt?.toDate ? aData.createdAt.toDate().getTime() : aData.createdAt ? new Date(aData.createdAt).getTime() : 0;
        const bTime = bData.createdAt?.toDate ? bData.createdAt.toDate().getTime() : bData.createdAt ? new Date(bData.createdAt).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, 3);

    recentBusinesses.forEach(doc => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt ? new Date(data.createdAt) : new Date();
      recentActivity.push({
        id: doc.id,
        type: 'business',
        action: 'registered',
        entity: data.businessName || data.name || 'Unknown Business',
        timestamp: createdAt.toISOString(),
        status: data.verificationStatus
      });
    });

    // Recent events
    const recentEvents = eventsSnap.docs
      .sort((a, b) => {
        const aData = a.data();
        const bData = b.data();
        const aTime = aData.createdAt?.toDate ? aData.createdAt.toDate().getTime() : aData.createdAt ? new Date(aData.createdAt).getTime() : 0;
        const bTime = bData.createdAt?.toDate ? bData.createdAt.toDate().getTime() : bData.createdAt ? new Date(bData.createdAt).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, 3);

    recentEvents.forEach(doc => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt ? new Date(data.createdAt) : new Date();
      recentActivity.push({
        id: doc.id,
        type: 'event',
        action: 'created',
        entity: data.title || 'Unknown Event',
        timestamp: createdAt.toISOString(),
        status: data.status
      });
    });

    // Sort by timestamp
    recentActivity.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const stats: DashboardStats = {
      users: {
        total: usersSnap.size,
        change: userChange,
        newThisMonth: usersThisMonth
      },
      businesses: {
        total: businessesSnap.size,
        active: activeBusiness,
        pending: pendingBusiness,
        change: businessChange
      },
      creators: {
        total: creatorsSnap.size,
        verified: verifiedCreators,
        pending: pendingCreators,
        change: creatorChange
      },
      missions: {
        total: missionsSnap.size,
        active: activeMissions,
        completed: completedMissions,
        change: missionChange
      },
      events: {
        total: eventsSnap.size,
        upcoming: upcomingEvents,
        published: publishedEvents,
        change: eventChange
      },
      finance: {
        pendingPayouts: pendingPayouts.length,
        totalAmount: totalPendingAmount,
        currency: 'EUR',
        change: '+0%'
      },
      rewards: {
        totalRedemptions: redemptionsSnap.size,
        activeRewards: activeRewards,
        pointsRedeemed: totalPointsRedeemed
      }
    };

    return {
      success: true,
      stats,
      alerts,
      recentActivity: recentActivity.slice(0, 10)
    };
  } catch (error: any) {
    console.error('[getDashboardStatsAction] Error:', error);
    return { success: false, error: error.message || 'Failed to fetch dashboard data' };
  }
}
