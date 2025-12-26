import { db } from '@/lib/firebase/admin';
import { Creator, VerificationStatus } from '@/lib/types';

export async function getCreators(
  countryScopes?: string[],
  filters?: {
    verified?: boolean;
    verificationStatus?: VerificationStatus;
    status?: string;
    payoutFrozen?: boolean;
    searchQuery?: string;
  }
): Promise<Creator[]> {
  try {
    let query = db.collection('creators').orderBy('createdAt', 'desc');

    // Apply filters
    if (filters?.verified !== undefined) {
      query = query.where('verified', '==', filters.verified);
    }

    if (filters?.verificationStatus) {
      query = query.where('verificationStatus', '==', filters.verificationStatus);
    }

    if (filters?.status) {
      query = query.where('status', '==', filters.status);
    }

    if (filters?.payoutFrozen !== undefined) {
      query = query.where('payoutFrozen', '==', filters.payoutFrozen);
    }

    // Country scope filtering
    if (countryScopes && !countryScopes.includes('GLOBAL')) {
      query = query.where('countryCode', 'in', countryScopes);
    }

    const snapshot = await query.limit(100).get();

    const creators = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt || new Date()),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt || new Date()),
        verifiedAt: data.verifiedAt?.toDate ? data.verifiedAt.toDate() : data.verifiedAt,
        suspendedAt: data.suspendedAt?.toDate ? data.suspendedAt.toDate() : data.suspendedAt,
      } as Creator;
    });

    // Apply search filter
    if (filters?.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      return creators.filter(
        (creator) =>
          creator.displayName?.toLowerCase().includes(query) ||
          creator.instagramHandle?.toLowerCase().includes(query) ||
          creator.tiktokHandle?.toLowerCase().includes(query)
      );
    }

    return creators;
  } catch (error) {
    console.error('Error fetching creators:', error);
    throw new Error('Failed to fetch creators');
  }
}

export async function getCreatorById(creatorId: string): Promise<Creator | null> {
  try {
    // Load from users collection instead of creators collection
    const doc = await db.collection('users').doc(creatorId).get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data()!;
    
    // Check if it's actually a creator
    if (data.role !== 'CREATOR') {
      return null;
    }
    
    // Map user data to creator format
    return {
      id: doc.id,
      userId: doc.id,
      countryCode: data.countryCode || 'DE',
      displayName: data.name || data.handle || data.displayName || data.email?.split('@')[0] || 'Unknown',
      bio: data.bio || '',
      profilePhoto: data.profilePhoto || data.photoURL,
      verified: data.creatorProfile?.verified || data.verified || false,
      verificationStatus: (data.verificationStatus || data.approvalStatus || 'PENDING') as VerificationStatus,
      status: data.status || 'ACTIVE',
      instagramHandle: data.creatorProfile?.instagramHandle,
      instagramFollowers: data.creatorProfile?.instagramFollowers || 0,
      trustScore: data.creatorProfile?.trustScore || 50,
      riskScore: 0,
      stats: {
        totalMissions: 0,
        completedMissions: 0,
        totalEarnings: data.creatorProfile?.totalEarnings || 0,
        pendingPayout: data.creatorProfile?.pendingPayout || 0,
        averageRating: 0,
        totalReviews: 0,
      },
      payoutFrozen: false,
      disputeCount: 0,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt || new Date()),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt || new Date()),
      verifiedAt: data.verifiedAt?.toDate ? data.verifiedAt.toDate() : data.verifiedAt,
      suspendedAt: data.suspendedAt?.toDate ? data.suspendedAt.toDate() : data.suspendedAt,
    } as Creator;
  } catch (error) {
    console.error('Error fetching creator:', error);
    throw new Error('Failed to fetch creator');
  }
}

export async function verifyCreator(
  creatorId: string,
  approved: boolean,
  adminId: string,
  notes?: string
): Promise<void> {
  try {
    // Update in users collection
    await db.collection('users').doc(creatorId).update({
      verified: approved,
      'creatorProfile.verified': approved,
      verificationStatus: approved ? VerificationStatus.APPROVED : VerificationStatus.REJECTED,
      approvalStatus: approved ? VerificationStatus.APPROVED : VerificationStatus.REJECTED,
      verificationNotes: notes || null,
      verifiedAt: approved ? new Date() : null,
      verifiedBy: approved ? adminId : null,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error verifying creator:', error);
    throw new Error('Failed to verify creator');
  }
}

export async function updateTrustScore(
  creatorId: string,
  trustScore: number
): Promise<void> {
  try {
    const clampedScore = Math.max(0, Math.min(100, trustScore));
    await db.collection('users').doc(creatorId).update({
      'creatorProfile.trustScore': clampedScore,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error updating trust score:', error);
    throw new Error('Failed to update trust score');
  }
}

export async function freezePayout(
  creatorId: string,
  reason: string,
  adminId: string
): Promise<void> {
  try {
    await db.collection('users').doc(creatorId).update({
      payoutFrozen: true,
      payoutFrozenReason: reason,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error freezing payout:', error);
    throw new Error('Failed to freeze payout');
  }
}

export async function unfreezePayout(creatorId: string): Promise<void> {
  try {
    await db.collection('users').doc(creatorId).update({
      payoutFrozen: false,
      payoutFrozenReason: null,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error unfreezing payout:', error);
    throw new Error('Failed to unfreeze payout');
  }
}

export async function suspendCreator(
  creatorId: string,
  reason: string,
  adminId: string
): Promise<void> {
  try {
    await db.collection('users').doc(creatorId).update({
      status: 'SUSPENDED',
      suspensionReason: reason,
      suspendedAt: new Date(),
      suspendedBy: adminId,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error suspending creator:', error);
    throw new Error('Failed to suspend creator');
  }
}

export async function unsuspendCreator(creatorId: string): Promise<void> {
  try {
    await db.collection('users').doc(creatorId).update({
      status: 'ACTIVE',
      suspensionReason: null,
      suspendedAt: null,
      suspendedBy: null,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error unsuspending creator:', error);
    throw new Error('Failed to unsuspend creator');
  }
}
