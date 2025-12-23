import { db } from './AuthContext';
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';

export interface CustomerProfile {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  city?: string;
  country?: string;
  totalPoints: number;
  joinedAt: Date;
  lastActive?: Date;
}

export interface CustomerActivity {
  type: 'mission' | 'reward' | 'event' | 'review';
  title: string;
  date: Date;
  points?: number;
  status?: string;
  rating?: number;
}

export interface CustomerStats {
  totalMissions: number;
  completedMissions: number;
  pendingMissions: number;
  totalRewards: number;
  totalPoints: number;
  pointsSpent: number;
  averageRating: number;
  eventsAttended: number;
  lastInteraction?: Date;
}

export interface CRMCustomer {
  profile: CustomerProfile;
  stats: CustomerStats;
  activities: CustomerActivity[];
  tags: string[];
  segment: 'vip' | 'active' | 'inactive' | 'new';
}

/**
 * Get all customers for a business with their stats
 */
export async function getBusinessCustomers(businessId: string): Promise<CRMCustomer[]> {
  try {
    const customers: CRMCustomer[] = [];
    const customerMap = new Map<string, CRMCustomer>();

    // Get all participations for this business
    const participationsQuery = query(
      collection(db, 'participations'),
      where('businessId', '==', businessId),
      orderBy('submittedAt', 'desc')
    );
    const participationsSnap = await getDocs(participationsQuery);

    // Process each participation to build customer profiles
    for (const doc of participationsSnap.docs) {
      const participation = doc.data();
      const userId = participation.userId;

      if (!customerMap.has(userId)) {
        // Fetch user profile
        const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', userId), limit(1)));
        if (userDoc.empty) continue;

        const userData = userDoc.docs[0].data();
        
        customerMap.set(userId, {
          profile: {
            uid: userId,
            name: userData.name || 'Unknown User',
            email: userData.email || '',
            photoURL: userData.photoURL,
            city: userData.city,
            country: userData.country,
            totalPoints: userData.totalPoints || 0,
            joinedAt: userData.createdAt?.toDate?.() || new Date(),
            lastActive: participation.submittedAt?.toDate?.() || new Date(),
          },
          stats: {
            totalMissions: 0,
            completedMissions: 0,
            pendingMissions: 0,
            totalRewards: 0,
            totalPoints: 0,
            pointsSpent: 0,
            averageRating: 0,
            eventsAttended: 0,
          },
          activities: [],
          tags: [],
          segment: 'new',
        });
      }

      const customer = customerMap.get(userId)!;
      customer.stats.totalMissions++;
      
      if (participation.status === 'APPROVED') {
        customer.stats.completedMissions++;
        customer.stats.totalPoints += participation.pointsAwarded || 0;
      } else if (participation.status === 'PENDING') {
        customer.stats.pendingMissions++;
      }

      // Add activity
      customer.activities.push({
        type: 'mission',
        title: participation.missionTitle || 'Mission',
        date: participation.submittedAt?.toDate?.() || new Date(),
        points: participation.pointsAwarded || 0,
        status: participation.status,
      });
    }

    // Get redemptions
    const redemptionsQuery = query(
      collection(db, 'redemptions'),
      where('businessId', '==', businessId),
      orderBy('redeemedAt', 'desc')
    );
    const redemptionsSnap = await getDocs(redemptionsQuery);

    for (const doc of redemptionsSnap.docs) {
      const redemption = doc.data();
      const userId = redemption.userId;

      if (customerMap.has(userId)) {
        const customer = customerMap.get(userId)!;
        customer.stats.totalRewards++;
        customer.stats.pointsSpent += redemption.pointsCost || 0;

        customer.activities.push({
          type: 'reward',
          title: redemption.rewardTitle || 'Reward Redeemed',
          date: redemption.redeemedAt?.toDate?.() || new Date(),
          points: -(redemption.pointsCost || 0),
        });
      }
    }

    // Get event registrations
    const eventsQuery = query(
      collection(db, 'eventRegistrations'),
      where('businessId', '==', businessId)
    );
    const eventsSnap = await getDocs(eventsQuery);

    for (const doc of eventsSnap.docs) {
      const registration = doc.data();
      const userId = registration.userId;

      if (customerMap.has(userId)) {
        const customer = customerMap.get(userId)!;
        customer.stats.eventsAttended++;

        customer.activities.push({
          type: 'event',
          title: registration.eventTitle || 'Event Attended',
          date: registration.registeredAt?.toDate?.() || new Date(),
        });
      }
    }

    // Calculate segments and tags
    for (const [userId, customer] of customerMap) {
      // Sort activities by date
      customer.activities.sort((a, b) => b.date.getTime() - a.date.getTime());
      
      // Get last interaction
      if (customer.activities.length > 0) {
        customer.stats.lastInteraction = customer.activities[0].date;
      }

      // Calculate average rating (placeholder - would need review data)
      customer.stats.averageRating = 4.5; // Default for now

      // Determine segment
      const daysSinceLastActivity = customer.stats.lastInteraction
        ? (Date.now() - customer.stats.lastInteraction.getTime()) / (1000 * 60 * 60 * 24)
        : 999;

      if (customer.stats.totalPoints >= 1000 && customer.stats.completedMissions >= 10) {
        customer.segment = 'vip';
        customer.tags.push('VIP', 'High Value');
      } else if (daysSinceLastActivity <= 7 && customer.stats.completedMissions >= 3) {
        customer.segment = 'active';
        customer.tags.push('Active');
      } else if (daysSinceLastActivity > 30) {
        customer.segment = 'inactive';
        customer.tags.push('Inactive', 'Needs Re-engagement');
      } else {
        customer.segment = 'new';
        customer.tags.push('New Customer');
      }

      // Additional tags
      if (customer.stats.totalRewards >= 5) {
        customer.tags.push('Loyal Redeemer');
      }
      if (customer.stats.eventsAttended >= 2) {
        customer.tags.push('Event Enthusiast');
      }
      if (customer.stats.completedMissions >= 20) {
        customer.tags.push('Mission Master');
      }

      customers.push(customer);
    }

    // Sort by last interaction (most recent first)
    customers.sort((a, b) => {
      const aTime = a.stats.lastInteraction?.getTime() || 0;
      const bTime = b.stats.lastInteraction?.getTime() || 0;
      return bTime - aTime;
    });

    return customers;
  } catch (error) {
    console.error('Error fetching business customers:', error);
    return [];
  }
}

/**
 * Get detailed customer information
 */
export async function getCustomerDetails(userId: string, businessId: string): Promise<CRMCustomer | null> {
  try {
    const customers = await getBusinessCustomers(businessId);
    return customers.find(c => c.profile.uid === userId) || null;
  } catch (error) {
    console.error('Error fetching customer details:', error);
    return null;
  }
}

/**
 * Search customers by name or email
 */
export function searchCustomers(customers: CRMCustomer[], searchTerm: string): CRMCustomer[] {
  const term = searchTerm.toLowerCase().trim();
  if (!term) return customers;

  return customers.filter(customer =>
    customer.profile.name.toLowerCase().includes(term) ||
    customer.profile.email.toLowerCase().includes(term) ||
    customer.profile.city?.toLowerCase().includes(term)
  );
}

/**
 * Filter customers by segment
 */
export function filterBySegment(customers: CRMCustomer[], segment: string): CRMCustomer[] {
  if (segment === 'all') return customers;
  return customers.filter(customer => customer.segment === segment);
}

/**
 * Export customers to CSV format
 */
export function exportCustomersToCSV(customers: CRMCustomer[]): string {
  const headers = [
    'Name',
    'Email',
    'City',
    'Total Points',
    'Missions Completed',
    'Rewards Redeemed',
    'Events Attended',
    'Segment',
    'Last Active',
    'Joined Date'
  ];

  const rows = customers.map(c => [
    c.profile.name,
    c.profile.email,
    c.profile.city || 'N/A',
    c.profile.totalPoints,
    c.stats.completedMissions,
    c.stats.totalRewards,
    c.stats.eventsAttended,
    c.segment.toUpperCase(),
    c.stats.lastInteraction?.toLocaleDateString() || 'Never',
    c.profile.joinedAt.toLocaleDateString()
  ]);

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  return csv;
}
