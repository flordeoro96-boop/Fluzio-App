'use server';

import { getAdminAuth, db } from '@/lib/firebase/admin';
import { collection, query, where, orderBy, limit, getDocs, getDoc, doc, setDoc, updateDoc, deleteDoc, addDoc } from '@/lib/firebase/firestoreCompat';
import { getAdminById } from '@/lib/repositories/admins';
import { writeAuditLog } from '@/lib/repositories/audit';
import { ModerationReport, ModerationReportStatus } from '@/lib/types';
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

export async function getModerationReportsAction(
  filters?: {
    status?: ModerationReportStatus;
    entityType?: string;
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

    if (filters?.entityType) {
      conditions.push(where('entityType', '==', filters.entityType));
    }

    const q = query(collection(db, 'moderationReports'), ...conditions);
    const snapshot = await getDocs(q);
    let reports: ModerationReport[] = [];

    snapshot.docs.forEach((doc: any) => {
      const data = doc.data();
      reports.push({
        id: doc.id,
        ...data,
      } as ModerationReport);
    });

    // Apply search filter client-side
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      reports = reports.filter(
        (report) =>
          report.id.toLowerCase().includes(searchLower) ||
          report.entityId.toLowerCase().includes(searchLower) ||
          report.reason?.toLowerCase().includes(searchLower)
      );
    }

    return { success: true, reports };
  } catch (error: any) {
    console.error('[getModerationReportsAction] Error:', error);
    throw new Error(error.message || 'Failed to fetch moderation reports');
  }
}

export async function updateReportStatusAction(
  reportId: string,
  newStatus: ModerationReportStatus,
  strikesAdded?: number
) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      throw new Error('Unauthorized');
    }

    // Check permission
    if (!['SUPER_ADMIN', 'COUNTRY_ADMIN', 'CONTENT_MODERATOR'].includes(admin.role)) {
      throw new Error('Insufficient permissions');
    }

    // Using db from imports
    const reportRef = doc(db, 'moderationReports', reportId);
    const reportDoc = await getDoc(reportRef);

    if (!reportDoc.exists) {
      throw new Error('Report not found');
    }

    const report = { id: reportDoc.id, ...reportDoc.data() } as ModerationReport;

    // Check country scope
    if (!admin.countryScopes.includes('GLOBAL') && !admin.countryScopes.includes(report.countryId)) {
      throw new Error('Cannot modify reports outside your country scope');
    }

    const oldStatus = report.status;

    // Update report status
    const updateData: any = {
      status: newStatus,
      updatedAt: new Date(),
    };

    if (strikesAdded !== undefined) {
      updateData.strikesAdded = strikesAdded;
    }

    await updateDoc(reportRef, updateData);

    // Write audit log
    await writeAuditLog({
      adminId: admin.uid,
      action: 'UPDATE_MODERATION_REPORT',
      resource: 'MODERATION_REPORT',
      resourceId: reportId,
      details: {
        actorRole: admin.role,
        countryScopeUsed: report.countryId,
        before: { status: oldStatus },
        after: { status: newStatus, strikesAdded },
      },
      ipAddress: 'server',
      userAgent: 'admin-app',
    });

    return { success: true };
  } catch (error: any) {
    console.error('[updateReportStatusAction] Error:', error);
    throw new Error(error.message || 'Failed to update report status');
  }
}

export async function deleteReportAction(reportId: string) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      throw new Error('Unauthorized');
    }

    // Only super admin and country admin can delete
    if (!['SUPER_ADMIN', 'COUNTRY_ADMIN'].includes(admin.role)) {
      throw new Error('Insufficient permissions');
    }

    // Using db from imports
    const reportRef = doc(db, 'moderationReports', reportId);
    const reportDoc = await getDoc(reportRef);

    if (!reportDoc.exists) {
      throw new Error('Report not found');
    }

    const report = { id: reportDoc.id, ...reportDoc.data() } as ModerationReport;

    // Check country scope
    if (!admin.countryScopes.includes('GLOBAL') && !admin.countryScopes.includes(report.countryId)) {
      throw new Error('Cannot delete reports outside your country scope');
    }

    // Delete the report
    await deleteDoc(reportRef);

    // Write audit log
    await writeAuditLog({
      adminId: admin.uid,
      action: 'DELETE_MODERATION_REPORT',
      resource: 'MODERATION_REPORT',
      resourceId: reportId,
      details: {
        actorRole: admin.role,
        countryScopeUsed: report.countryId,
        deletedReport: {
          entityType: report.entityType,
          entityId: report.entityId,
          reason: report.reason,
          status: report.status,
        },
      },
      ipAddress: 'server',
      userAgent: 'admin-app',
    });

    return { success: true };
  } catch (error: any) {
    console.error('[deleteReportAction] Error:', error);
    throw new Error(error.message || 'Failed to delete report');
  }
}
