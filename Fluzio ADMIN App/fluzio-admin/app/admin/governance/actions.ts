'use server';

import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { getAdminById } from '@/lib/repositories/admins';
import { writeAuditLog } from '@/lib/repositories/audit';
import { Admin, AdminStatus, Policy, AuditLog as AuditLogType } from '@/lib/types';
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

export async function getAdminsAction(filters?: { status?: AdminStatus; search?: string }) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      throw new Error('Unauthorized');
    }

    // Only super admin and country admin can view admins
    if (!['SUPER_ADMIN', 'COUNTRY_ADMIN'].includes(admin.role)) {
      throw new Error('Insufficient permissions');
    }

    const adminDb = getAdminDb();
    let query = adminDb.collection('admins');

    // Apply filters
    if (filters?.status) {
      query = query.where('status', '==', filters.status) as any;
    }

    const snapshot = await query.get();
    let admins: Admin[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      admins.push({
        uid: doc.id,
        ...data,
        createdAt: data.createdAt?.toMillis?.() || data.createdAt,
        updatedAt: data.updatedAt?.toMillis?.() || data.updatedAt,
      } as Admin);
    });

    // Apply search filter client-side
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      admins = admins.filter(
        (a) =>
          a.email?.toLowerCase().includes(searchLower) ||
          a.uid.toLowerCase().includes(searchLower)
      );
    }

    return { success: true, admins };
  } catch (error: any) {
    console.error('[getAdminsAction] Error:', error);
    throw new Error(error.message || 'Failed to fetch admins');
  }
}

export async function updateAdminStatusAction(adminUid: string, newStatus: AdminStatus) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      throw new Error('Unauthorized');
    }

    // Only super admin can update admin status
    if (admin.role !== 'SUPER_ADMIN') {
      throw new Error('Only super admin can update admin status');
    }

    const adminDb = getAdminDb();
    const targetAdminRef = adminDb.collection('admins').doc(adminUid);
    const targetAdminDoc = await targetAdminRef.get();

    if (!targetAdminDoc.exists) {
      throw new Error('Admin not found');
    }

    const targetAdmin = { uid: targetAdminDoc.id, ...targetAdminDoc.data() } as Admin;
    const oldStatus = targetAdmin.status;

    // Update admin status
    await targetAdminRef.update({
      status: newStatus,
      updatedAt: new Date(),
    });

    // Write audit log
    await writeAuditLog({
      adminId: admin.uid,
      action: 'UPDATE_ADMIN_STATUS',
      resource: 'ADMIN',
      resourceId: adminUid,
      details: {
        actorRole: admin.role,
        before: { status: oldStatus },
        after: { status: newStatus },
      },
      ipAddress: 'server',
      userAgent: 'admin-app',
    });

    return { success: true };
  } catch (error: any) {
    console.error('[updateAdminStatusAction] Error:', error);
    throw new Error(error.message || 'Failed to update admin status');
  }
}

export async function getAuditLogsAction(filters?: { search?: string; limit?: number }) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      throw new Error('Unauthorized');
    }

    // Only super admin and country admin can view audit logs
    if (!['SUPER_ADMIN', 'COUNTRY_ADMIN'].includes(admin.role)) {
      throw new Error('Insufficient permissions');
    }

    const adminDb = getAdminDb();
    let query = adminDb.collection('auditLogs').orderBy('timestamp', 'desc').limit(filters?.limit || 50);

    const snapshot = await query.get();
    let logs: any[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      logs.push({
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toMillis?.() || data.timestamp,
      });
    });

    // Apply search filter client-side
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      logs = logs.filter(
        (log) =>
          log.adminId?.toLowerCase().includes(searchLower) ||
          log.action?.toLowerCase().includes(searchLower) ||
          log.resource?.toLowerCase().includes(searchLower) ||
          log.resourceId?.toLowerCase().includes(searchLower)
      );
    }

    return { success: true, logs };
  } catch (error: any) {
    console.error('[getAuditLogsAction] Error:', error);
    throw new Error(error.message || 'Failed to fetch audit logs');
  }
}

export async function getPolicyAction() {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      throw new Error('Unauthorized');
    }

    const adminDb = getAdminDb();
    const snapshot = await adminDb.collection('policies').orderBy('version', 'desc').limit(1).get();

    if (snapshot.empty) {
      return { success: true, policy: null };
    }

    const doc = snapshot.docs[0];
    const data = doc.data();
    const policy = {
      ...data,
      id: doc.id,
      createdAt: data.createdAt?.toMillis?.() || data.createdAt,
      updatedAt: data.updatedAt?.toMillis?.() || data.updatedAt,
    } as unknown as Policy;

    return { success: true, policy };
  } catch (error: any) {
    console.error('[getPolicyAction] Error:', error);
    throw new Error(error.message || 'Failed to fetch policy');
  }
}

export async function updatePolicyAction(thresholds: {
  eventApprovalLimit: number;
  payoutReleaseTrustMin: number;
  highRiskScore: number;
}) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      throw new Error('Unauthorized');
    }

    // Only super admin can update policy
    if (admin.role !== 'SUPER_ADMIN') {
      throw new Error('Only super admin can update policy');
    }

    const adminDb = getAdminDb();

    // Get current policy
    const currentSnapshot = await adminDb.collection('policies').orderBy('version', 'desc').limit(1).get();
    const currentVersion = currentSnapshot.empty ? 0 : currentSnapshot.docs[0].data().version;

    // Create new policy version
    const newPolicy = {
      version: currentVersion + 1,
      thresholds,
      updatedAt: new Date(),
      updatedByAdminId: admin.uid,
    };

    await adminDb.collection('policies').add(newPolicy);

    // Write audit log
    await writeAuditLog({
      adminId: admin.uid,
      action: 'UPDATE_POLICY',
      resource: 'POLICY',
      resourceId: `v${newPolicy.version}`,
      details: {
        actorRole: admin.role,
        after: { thresholds },
      },
      ipAddress: 'server',
      userAgent: 'admin-app',
    });

    return { success: true };
  } catch (error: any) {
    console.error('[updatePolicyAction] Error:', error);
    throw new Error(error.message || 'Failed to update policy');
  }
}
