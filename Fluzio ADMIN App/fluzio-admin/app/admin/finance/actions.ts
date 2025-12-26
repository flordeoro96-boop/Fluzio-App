'use server';

import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
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

    const adminDb = getAdminDb();
    let query = adminDb.collection('transactions').orderBy('createdAt', 'desc').limit(100);

    // Apply country scope
    if (!admin.countryScopes.includes('GLOBAL')) {
      query = query.where('countryId', 'in', admin.countryScopes) as any;
    }

    // Apply filters
    if (filters?.countryId && admin.countryScopes.includes('GLOBAL')) {
      query = query.where('countryId', '==', filters.countryId) as any;
    }

    if (filters?.type) {
      query = query.where('type', '==', filters.type) as any;
    }

    const snapshot = await query.get();
    let transactions: Transaction[] = [];

    snapshot.forEach((doc) => {
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

    const adminDb = getAdminDb();
    let query = adminDb.collection('payouts').orderBy('createdAt', 'desc');

    // Apply country scope
    if (!admin.countryScopes.includes('GLOBAL')) {
      query = query.where('countryId', 'in', admin.countryScopes) as any;
    }

    // Apply filters
    if (filters?.countryId && admin.countryScopes.includes('GLOBAL')) {
      query = query.where('countryId', '==', filters.countryId) as any;
    }

    if (filters?.status) {
      query = query.where('status', '==', filters.status) as any;
    }

    const snapshot = await query.get();
    let payouts: Payout[] = [];

    snapshot.forEach((doc) => {
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

    const adminDb = getAdminDb();
    const payoutRef = adminDb.collection('payouts').doc(payoutId);
    const payoutDoc = await payoutRef.get();

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

    await payoutRef.update(updateData);

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
