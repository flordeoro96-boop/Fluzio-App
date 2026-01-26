'use server';

import { getAdminAuth, db } from '@/lib/firebase/admin';
import { collection, query, where, orderBy, limit, getDocs, getDoc, doc, setDoc, updateDoc, deleteDoc, addDoc } from '@/lib/firebase/firestoreCompat';
import { getAdminById } from '@/lib/repositories/admins';
import { writeAuditLog } from '@/lib/repositories/audit';
import { Transaction, Payout, PayoutStatus } from '@/lib/types';
import { cookies } from 'next/headers';

async function getAuthenticatedAdmin() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  if (!sessionCookie) {
    throw new Error('No session cookie found');
  }

  const auth = getAdminAuth();
  const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
  const admin = await getAdminById(decodedClaims.uid);

  if (!admin) {
    throw new Error('Admin not found');
  }

  return admin;
}

export async function getTransactionsAction(
  filters?: {
    type?: string;
    countryId?: string;
    search?: string;
  }
) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      throw new Error('Unauthorized');
    }

    // Using db from imports
    let conditions: any[] = [orderBy('createdAt', 'desc'), limit(100)];

    // Apply country scope
    if (!admin.countryScopes.includes('GLOBAL')) {
      conditions.push(where('countryId', 'in', admin.countryScopes));
    }

    // Apply filters
    if (filters?.countryId && admin.countryScopes.includes('GLOBAL')) {
      conditions.push(where('countryId', '==', filters.countryId));
    }

    if (filters?.type) {
      conditions.push(where('type', '==', filters.type));
    }

    const q = query(collection(db, 'transactions'), ...conditions);
    const snapshot = await getDocs(q);
    let transactions: Transaction[] = [];

    snapshot.docs.forEach((doc: any) => {
      const data = doc.data();
      transactions.push({
        id: doc.id,
        ...data,
      } as Transaction);
    });

    // Apply search filter client-side
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      transactions = transactions.filter(
        (txn) =>
          txn.id.toLowerCase().includes(searchLower) ||
          txn.sourceEntityId.toLowerCase().includes(searchLower) ||
          txn.destEntityId.toLowerCase().includes(searchLower)
      );
    }

    return { success: true, transactions };
  } catch (error: any) {
    console.error('[getTransactionsAction] Error:', error);
    throw new Error(error.message || 'Failed to fetch transactions');
  }
}

export async function getPayoutsAction(
  filters?: {
    status?: PayoutStatus;
    countryId?: string;
    search?: string;
  }
) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      throw new Error('Unauthorized');
    }

    // Using db from imports
    let conditions: any[] = [orderBy('createdAt', 'desc')];

    // Apply country scope
    if (!admin.countryScopes.includes('GLOBAL')) {
      conditions.push(where('countryId', 'in', admin.countryScopes));
    }

    // Apply filters
    if (filters?.countryId && admin.countryScopes.includes('GLOBAL')) {
      conditions.push(where('countryId', '==', filters.countryId));
    }

    if (filters?.status) {
      conditions.push(where('status', '==', filters.status));
    }

    const q = query(collection(db, 'payouts'), ...conditions);
    const snapshot = await getDocs(q);
    let payouts: Payout[] = [];

    snapshot.docs.forEach((doc: any) => {
      const data = doc.data();
      payouts.push({
        id: doc.id,
        ...data,
      } as Payout);
    });

    // Apply search filter client-side
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      payouts = payouts.filter(
        (payout) =>
          payout.id.toLowerCase().includes(searchLower) ||
          payout.creatorId.toLowerCase().includes(searchLower)
      );
    }

    return { success: true, payouts };
  } catch (error: any) {
    console.error('[getPayoutsAction] Error:', error);
    throw new Error(error.message || 'Failed to fetch payouts');
  }
}

export async function updatePayoutStatusAction(
  payoutId: string,
  newStatus: PayoutStatus,
  failReason?: string
) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      throw new Error('Unauthorized');
    }

    // Check permission
    if (!['SUPER_ADMIN', 'COUNTRY_ADMIN', 'FINANCE_MANAGER'].includes(admin.role)) {
      throw new Error('Insufficient permissions');
    }

    // Using db from imports
    const payoutRef = doc(db, 'payouts', payoutId);
    const payoutDoc = await getDoc(payoutRef);

    if (!payoutDoc.exists) {
      throw new Error('Payout not found');
    }

    const payout = { id: payoutDoc.id, ...payoutDoc.data() } as Payout;

    // Check country scope
    if (!admin.countryScopes.includes('GLOBAL') && !admin.countryScopes.includes(payout.countryId)) {
      throw new Error('Cannot modify payouts outside your country scope');
    }

    const oldStatus = payout.status;

    // Update payout status
    const updateData: any = {
      status: newStatus,
      updatedAt: new Date(),
    };

    if (failReason) {
      updateData.failReason = failReason;
    }

    await updateDoc(payoutRef, updateData);

    // Write audit log
    await writeAuditLog({
      adminId: admin.uid,
      action: 'UPDATE_PAYOUT_STATUS',
      resource: 'PAYOUT',
      resourceId: payoutId,
      details: {
        actorRole: admin.role,
        countryScopeUsed: payout.countryId,
        before: { status: oldStatus },
        after: { status: newStatus, failReason },
      },
      ipAddress: 'server',
      userAgent: 'admin-app',
    });

    return { success: true };
  } catch (error: any) {
    console.error('[updatePayoutStatusAction] Error:', error);
    throw new Error(error.message || 'Failed to update payout status');
  }
}
