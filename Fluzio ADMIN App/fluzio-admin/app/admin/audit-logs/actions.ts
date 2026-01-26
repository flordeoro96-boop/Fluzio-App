'use server';

import { cookies } from 'next/headers';
import { getAdminAuth, db } from '@/lib/firebase/admin';
import { collection, query, getDocs, where, orderBy, limit, Timestamp } from '@/lib/firebase/firestoreCompat';
import { getAdminById } from '@/lib/repositories/admins';

async function getAuthenticatedAdmin() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;

    if (!sessionCookie) {
      throw new Error('Not authenticated');
    }

    const auth = getAdminAuth();
    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    const admin = await getAdminById(decodedToken.uid);

    if (!admin || admin.status !== 'ACTIVE') {
      throw new Error('Not authorized');
    }

    return admin;
  } catch (error: any) {
    throw new Error(`Authentication failed: ${error.message}`);
  }
}

export interface AuditLogEntry {
  id: string;
  adminId: string;
  adminEmail?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: any;
  timestamp: string;
}

export async function getAuditLogsAction(filters?: {
  adminId?: string;
  action?: string;
  resourceType?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}): Promise<AuditLogEntry[]> {
  try {
    const admin = await getAuthenticatedAdmin();

    // Only SUPER_ADMIN and certain roles can view audit logs
    if (admin.role !== 'SUPER_ADMIN' && admin.role !== 'FINANCE' && admin.role !== 'MODERATOR') {
      throw new Error('Insufficient permissions to view audit logs');
    }

    // Using db from imports
    
    // Build query constraints
    const constraints: any[] = [orderBy('timestamp', 'desc')];

    // Apply filters
    if (filters?.adminId) {
      constraints.push(where('adminId', '==', filters.adminId));
    }

    if (filters?.action) {
      constraints.push(where('action', '==', filters.action));
    }

    if (filters?.resourceType) {
      constraints.push(where('resourceType', '==', filters.resourceType));
    }

    if (filters?.startDate) {
      const startTimestamp = new Date(filters.startDate);
      constraints.push(where('timestamp', '>=', startTimestamp));
    }

    if (filters?.endDate) {
      const endTimestamp = new Date(filters.endDate);
      constraints.push(where('timestamp', '<=', endTimestamp));
    }

    const limitValue = filters?.limit || 100;
    constraints.push(limit(limitValue));

    const q = query(collection(db, 'adminAuditLogs'), ...constraints);
    const snapshot = await getDocs(q);
    
    const logs: AuditLogEntry[] = [];
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Get admin email for display
      let adminEmail = 'Unknown';
      try {
        const logAdmin = await getAdminById(data.adminId);
        adminEmail = logAdmin?.email || 'Unknown';
      } catch (err) {
        // Admin might be deleted
      }

      logs.push({
        id: doc.id,
        adminId: data.adminId,
        adminEmail,
        action: data.action,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        details: data.details,
        timestamp: data.timestamp?.toDate()?.toISOString() || new Date().toISOString(),
      });
    }

    return logs;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch audit logs');
  }
}

export async function exportAuditLogsAction(filters?: {
  adminId?: string;
  action?: string;
  resourceType?: string;
  startDate?: string;
  endDate?: string;
}): Promise<AuditLogEntry[]> {
  try {
    const admin = await getAuthenticatedAdmin();

    if (admin.role !== 'SUPER_ADMIN' && admin.role !== 'FINANCE') {
      throw new Error('Insufficient permissions to export audit logs');
    }

    // Get more logs for export (up to 10,000)
    const logs = await getAuditLogsAction({ ...filters, limit: 10000 });
    return logs;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to export audit logs');
  }
}
