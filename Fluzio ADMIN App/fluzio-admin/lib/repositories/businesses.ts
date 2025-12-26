import { db } from '@/lib/firebase/admin';
import { Business, BusinessTier, VerificationStatus } from '@/lib/types';

export async function getBusinesses(
  countryScopes?: string[],
  filters?: {
    tier?: BusinessTier;
    status?: string;
    verified?: boolean;
    verificationStatus?: VerificationStatus;
    searchQuery?: string;
  }
): Promise<Business[]> {
  try {
    let query = db.collection('businesses').orderBy('createdAt', 'desc');

    // Apply filters
    if (filters?.tier) {
      query = query.where('tier', '==', filters.tier);
    }

    if (filters?.status) {
      query = query.where('status', '==', filters.status);
    }

    if (filters?.verified !== undefined) {
      query = query.where('verified', '==', filters.verified);
    }

    if (filters?.verificationStatus) {
      query = query.where('verificationStatus', '==', filters.verificationStatus);
    }

    // Country scope filtering
    if (countryScopes && !countryScopes.includes('GLOBAL')) {
      query = query.where('countryCode', 'in', countryScopes);
    }

    const snapshot = await query.limit(100).get();

    const businesses = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt || new Date()),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt || new Date()),
        verifiedAt: data.verifiedAt?.toDate ? data.verifiedAt.toDate() : data.verifiedAt,
        suspendedAt: data.suspendedAt?.toDate ? data.suspendedAt.toDate() : data.suspendedAt,
      } as Business;
    });

    // Apply search filter (after fetching)
    if (filters?.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      return businesses.filter(
        (business) =>
          business.name?.toLowerCase().includes(query) ||
          business.email?.toLowerCase().includes(query) ||
          business.ownerName?.toLowerCase().includes(query)
      );
    }

    return businesses;
  } catch (error) {
    console.error('Error fetching businesses:', error);
    throw new Error('Failed to fetch businesses');
  }
}

export async function getBusinessById(businessId: string): Promise<Business | null> {
  try {
    // Load from users collection instead of businesses collection
    const doc = await db.collection('users').doc(businessId).get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data()!;
    
    // Check if it's actually a business
    if (data.role !== 'BUSINESS') {
      return null;
    }
    
    // Map user data to business format
    return {
      id: doc.id,
      countryCode: data.countryCode || 'DE',
      name: data.name || data.handle || data.legalName || data.displayName || data.email?.split('@')[0] || 'Unknown Business',
      industry: data.category || data.subCategory || 'Other',
      description: data.description || '',
      tier: (data.subscriptionLevel || data.subscription?.tier || 'FREE') as BusinessTier,
      status: data.status || 'ACTIVE',
      verified: data.kycVerified || false,
      verificationStatus: (data.verificationStatus || data.approvalStatus || 'PENDING') as VerificationStatus,
      email: data.email,
      phoneNumber: data.phone || data.phoneNumber,
      website: data.website,
      address: data.street && data.city ? `${data.street}, ${data.city}` : data.address,
      ownerName: data.name || data.handle || data.displayName || data.email?.split('@')[0] || 'Unknown',
      ownerEmail: data.email,
      stats: {
        totalMissions: 0,
        activeMissions: 0,
        totalRedemptions: 0,
        totalSpent: 0,
      },
      riskScore: 0,
      disputeCount: 0,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt || new Date()),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt || new Date()),
      verifiedAt: data.verifiedAt?.toDate ? data.verifiedAt.toDate() : data.verifiedAt,
      suspendedAt: data.suspendedAt?.toDate ? data.suspendedAt.toDate() : data.suspendedAt,
    } as Business;
  } catch (error) {
    console.error('Error fetching business:', error);
    throw new Error('Failed to fetch business');
  }
}

export async function updateBusinessTier(
  businessId: string,
  tier: BusinessTier
): Promise<void> {
  try {
    // Update in users collection
    await db.collection('users').doc(businessId).update({
      subscriptionLevel: tier,
      'subscription.tier': tier,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error updating business tier:', error);
    throw new Error('Failed to update business tier');
  }
}

export async function verifyBusiness(
  businessId: string,
  approved: boolean,
  adminId: string,
  notes?: string
): Promise<void> {
  try {
    // Update in users collection
    await db.collection('users').doc(businessId).update({
      kycVerified: approved,
      verificationStatus: approved ? VerificationStatus.APPROVED : VerificationStatus.REJECTED,
      approvalStatus: approved ? VerificationStatus.APPROVED : VerificationStatus.REJECTED,
      verificationNotes: notes || null,
      verifiedAt: approved ? new Date() : null,
      verifiedBy: approved ? adminId : null,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error verifying business:', error);
    throw new Error('Failed to verify business');
  }
}

export async function suspendBusiness(
  businessId: string,
  reason: string,
  adminId: string
): Promise<void> {
  try {
    // Update in users collection
    await db.collection('users').doc(businessId).update({
      status: 'SUSPENDED',
      suspensionReason: reason,
      suspendedAt: new Date(),
      suspendedBy: adminId,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error suspending business:', error);
    throw new Error('Failed to suspend business');
  }
}

export async function unsuspendBusiness(businessId: string): Promise<void> {
  try {
    // Update in users collection
    await db.collection('users').doc(businessId).update({
      status: 'ACTIVE',
      suspensionReason: null,
      suspendedAt: null,
      suspendedBy: null,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error unsuspending business:', error);
    throw new Error('Failed to unsuspend business');
  }
}

export async function updateBusinessStats(
  businessId: string,
  stats: Partial<Business['stats']>
): Promise<void> {
  try {
    const doc = await db.collection('businesses').doc(businessId).get();
    const currentStats = doc.data()?.stats || {};

    await db.collection('businesses').doc(businessId).update({
      stats: { ...currentStats, ...stats },
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error updating business stats:', error);
    throw new Error('Failed to update business stats');
  }
}
