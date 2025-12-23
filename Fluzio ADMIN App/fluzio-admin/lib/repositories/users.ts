import { db } from '@/lib/firebase/admin';
import { User, UserRole } from '@/lib/types';

export async function getUsers(
  countryScopes?: string[],
  filters?: {
    role?: UserRole;
    status?: string;
    kycVerified?: boolean;
    searchQuery?: string;
  }
): Promise<User[]> {
  try {
    let query = db.collection('users').orderBy('createdAt', 'desc');

    // Apply filters
    if (filters?.role) {
      query = query.where('role', '==', filters.role);
    }

    if (filters?.status) {
      query = query.where('status', '==', filters.status);
    }

    if (filters?.kycVerified !== undefined) {
      query = query.where('kycVerified', '==', filters.kycVerified);
    }

    // Country scope filtering
    if (countryScopes && !countryScopes.includes('GLOBAL')) {
      query = query.where('countryCode', 'in', countryScopes);
    }

    const snapshot = await query.limit(100).get();

    const users = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt || new Date()),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt || new Date()),
        lastLoginAt: data.lastLoginAt?.toDate ? data.lastLoginAt.toDate() : data.lastLoginAt,
        lastStrikeAt: data.lastStrikeAt?.toDate ? data.lastStrikeAt.toDate() : data.lastStrikeAt,
        suspendedAt: data.suspendedAt?.toDate ? data.suspendedAt.toDate() : data.suspendedAt,
      } as User;
    });

    // Apply search filter (after fetching, since it's not indexed)
    if (filters?.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      return users.filter(
        (user) =>
          user.displayName?.toLowerCase().includes(query) ||
          user.email?.toLowerCase().includes(query) ||
          user.phoneNumber?.includes(query)
      );
    }

    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw new Error('Failed to fetch users');
  }
}

export async function getUserById(userId: string): Promise<User | null> {
  try {
    const doc = await db.collection('users').doc(userId).get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data()!;
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt || new Date()),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt || new Date()),
      lastLoginAt: data.lastLoginAt?.toDate ? data.lastLoginAt.toDate() : data.lastLoginAt,
      lastStrikeAt: data.lastStrikeAt?.toDate ? data.lastStrikeAt.toDate() : data.lastStrikeAt,
      suspendedAt: data.suspendedAt?.toDate ? data.suspendedAt.toDate() : data.suspendedAt,
    } as User;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw new Error('Failed to fetch user');
  }
}

export async function suspendUser(
  userId: string,
  reason: string,
  adminId: string
): Promise<void> {
  try {
    await db.collection('users').doc(userId).update({
      status: 'SUSPENDED',
      suspensionReason: reason,
      suspendedAt: new Date(),
      suspendedBy: adminId,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error suspending user:', error);
    throw new Error('Failed to suspend user');
  }
}

export async function unsuspendUser(userId: string): Promise<void> {
  try {
    await db.collection('users').doc(userId).update({
      status: 'ACTIVE',
      suspensionReason: null,
      suspendedAt: null,
      suspendedBy: null,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error unsuspending user:', error);
    throw new Error('Failed to unsuspend user');
  }
}

export async function updateUserKYC(
  userId: string,
  verified: boolean
): Promise<void> {
  try {
    await db.collection('users').doc(userId).update({
      kycVerified: verified,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error updating user KYC:', error);
    throw new Error('Failed to update user KYC');
  }
}

export async function addUserStrike(
  userId: string,
  reason: string
): Promise<void> {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const currentStrikes = userData?.strikes || 0;

    await db.collection('users').doc(userId).update({
      strikes: currentStrikes + 1,
      lastStrikeAt: new Date(),
      updatedAt: new Date(),
    });

    // Auto-suspend if strikes >= 3
    if (currentStrikes + 1 >= 3) {
      await suspendUser(userId, `Automatic suspension: ${reason}`, 'SYSTEM');
    }
  } catch (error) {
    console.error('Error adding user strike:', error);
    throw new Error('Failed to add user strike');
  }
}
