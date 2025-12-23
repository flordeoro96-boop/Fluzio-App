// Immutable Audit Logger
import { getAdminDb } from '@/lib/firebase/admin';
import { AuditLog, Admin } from '@/lib/types';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * Write an immutable audit log entry
 * 
 * This is the ONLY way to create audit logs.
 * Audit logs are write-only and cannot be updated or deleted.
 * 
 * @param actor - Admin performing the action
 * @param action - Action being performed
 * @param entityType - Type of entity affected (BUSINESS, CREATOR, etc.)
 * @param entityId - ID of the entity affected
 * @param before - State before the action (optional)
 * @param after - State after the action (optional)
 * @param reason - Optional reason for the action (required for overrides)
 * @returns Promise<string> - ID of the created audit log
 */
export async function writeAuditLog(
  actor: Admin,
  action: string,
  entityType: string,
  entityId: string,
  before?: Record<string, any>,
  after?: Record<string, any>,
  reason?: string
): Promise<string> {
  const db = getAdminDb();

  const auditLog: Omit<AuditLog, 'id'> = {
    actorAdminId: actor.uid,
    actorRole: actor.role,
    countryScopeUsed: before?.countryId || after?.countryId,
    action,
    entityType,
    entityId,
    before,
    after,
    reason,
    createdAt: Timestamp.now() as any,
  };

  const docRef = await db.collection('auditLogs').add(auditLog);

  console.log(`✅ Audit log created: ${docRef.id} - ${action} on ${entityType}:${entityId} by ${actor.email}`);

  return docRef.id;
}

/**
 * Query audit logs for a specific entity
 * Only SUPER_ADMIN can query audit logs
 */
export async function getAuditLogsForEntity(
  entityType: string,
  entityId: string,
  limit: number = 20
): Promise<AuditLog[]> {
  const db = getAdminDb();

  const snapshot = await db
    .collection('auditLogs')
    .where('entityType', '==', entityType)
    .where('entityId', '==', entityId)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as AuditLog[];
}

/**
 * Query audit logs by admin
 */
export async function getAuditLogsByAdmin(
  adminId: string,
  limit: number = 50
): Promise<AuditLog[]> {
  const db = getAdminDb();

  const snapshot = await db
    .collection('auditLogs')
    .where('actorAdminId', '==', adminId)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as AuditLog[];
}

/**
 * Query audit logs by country
 */
export async function getAuditLogsByCountry(
  countryId: string,
  limit: number = 100
): Promise<AuditLog[]> {
  const db = getAdminDb();

  const snapshot = await db
    .collection('auditLogs')
    .where('countryScopeUsed', '==', countryId)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as AuditLog[];
}

/**
 * Query recent audit logs (SUPER_ADMIN only)
 */
export async function getRecentAuditLogs(limit: number = 100): Promise<AuditLog[]> {
  const db = getAdminDb();

  const snapshot = await db
    .collection('auditLogs')
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as AuditLog[];
}
