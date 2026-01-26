import { db } from '@/lib/firebase/admin';
import { Timestamp } from '@/lib/firebase/firestoreCompat';

export interface AuditLog {
  adminId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
  ipAddress: string;
  userAgent: string;
  timestamp?: Date;
}

export async function writeAuditLog(log: AuditLog): Promise<void> {
  await db.collection('auditLogs').add({
    ...log,
    timestamp: Timestamp.now(),
  });
}

export async function getAuditLogs(filters?: {
  adminId?: string;
  resource?: string;
  resourceId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}): Promise<AuditLog[]> {
  let query: any = db.collection('auditLogs').orderBy('timestamp', 'desc');

  if (filters?.adminId) {
    query = query.where('adminId', '==', filters.adminId);
  }

  if (filters?.resource) {
    query = query.where('resource', '==', filters.resource);
  }

  if (filters?.resourceId) {
    query = query.where('resourceId', '==', filters.resourceId);
  }

  if (filters?.startDate) {
    query = query.where('timestamp', '>=', Timestamp.fromDate(filters.startDate));
  }

  if (filters?.endDate) {
    query = query.where('timestamp', '<=', Timestamp.fromDate(filters.endDate));
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  } else {
    query = query.limit(100);
  }

  const snapshot = await query.get();
  return snapshot.docs.map((doc: any) => ({
    ...doc.data(),
    timestamp: doc.data().timestamp?.toDate(),
  })) as AuditLog[];
}
