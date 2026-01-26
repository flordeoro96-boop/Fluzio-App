'use server';

import { cookies } from 'next/headers';
import { getAdminAuth, db } from '@/lib/firebase/admin';
import { doc, updateDoc, deleteDoc, FieldValue } from '@/lib/firebase/firestoreCompat';
import { getAdminById } from '@/lib/repositories/admins';
import { canAccess, Resource, Action } from '@/lib/permissions/rbac';
import { writeAuditLog } from '@/lib/repositories/audit';

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

export async function bulkVerifyCreatorsAction(creatorIds: string[]): Promise<{
  success: boolean;
  successCount: number;
  failedCount: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let successCount = 0;
  let failedCount = 0;

  try {
    const admin = await getAuthenticatedAdmin();

    if (!canAccess(admin, Resource.CREATORS, Action.UPDATE)) {
      throw new Error('Insufficient permissions');
    }

    // Using db from imports

    for (const creatorId of creatorIds) {
      try {
        await updateDoc(doc(db, 'creators', creatorId), {
          verificationStatus: 'VERIFIED',
          verifiedAt: FieldValue.serverTimestamp(),
          verifiedBy: admin.uid,
          updatedAt: FieldValue.serverTimestamp(),
        });

        await writeAuditLog({
          adminId: admin.uid,
          action: 'CREATOR_VERIFIED',
          resource: 'CREATOR',
          resourceId: creatorId,
          details: { reason: 'Bulk verification', verifiedBy: admin.email },
          ipAddress: '',
          userAgent: '',
        });

        successCount++;
      } catch (err: any) {
        failedCount++;
        errors.push(`${creatorId}: ${err.message}`);
      }
    }

    return {
      success: successCount > 0,
      successCount,
      failedCount,
      errors,
    };
  } catch (error: any) {
    throw new Error(error.message || 'Bulk verify failed');
  }
}

export async function bulkSuspendCreatorsAction(creatorIds: string[]): Promise<{
  success: boolean;
  successCount: number;
  failedCount: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let successCount = 0;
  let failedCount = 0;

  try {
    const admin = await getAuthenticatedAdmin();

    if (!canAccess(admin, Resource.CREATORS, Action.UPDATE)) {
      throw new Error('Insufficient permissions');
    }

    // Using db from imports

    for (const creatorId of creatorIds) {
      try {
        await updateDoc(doc(db, 'creators', creatorId), {
          status: 'SUSPENDED',
          suspendedAt: FieldValue.serverTimestamp(),
          suspendedBy: admin.uid,
          updatedAt: FieldValue.serverTimestamp(),
        });

        await writeAuditLog({
          adminId: admin.uid,
          action: 'CREATOR_SUSPENDED',
          resource: 'CREATOR',
          resourceId: creatorId,
          details: { reason: 'Bulk suspension', suspendedBy: admin.email },
          ipAddress: '',
          userAgent: '',
        });

        successCount++;
      } catch (err: any) {
        failedCount++;
        errors.push(`${creatorId}: ${err.message}`);
      }
    }

    return {
      success: successCount > 0,
      successCount,
      failedCount,
      errors,
    };
  } catch (error: any) {
    throw new Error(error.message || 'Bulk suspend failed');
  }
}

export async function bulkDeleteCreatorsAction(creatorIds: string[]): Promise<{
  success: boolean;
  successCount: number;
  failedCount: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let successCount = 0;
  let failedCount = 0;

  try {
    const admin = await getAuthenticatedAdmin();

    if (!canAccess(admin, Resource.CREATORS, Action.DELETE)) {
      throw new Error('Insufficient permissions');
    }

    // Using db from imports

    for (const creatorId of creatorIds) {
      try {
        await deleteDoc(doc(db, 'creators', creatorId));

        await writeAuditLog({
          adminId: admin.uid,
          action: 'CREATOR_DELETED',
          resource: 'CREATOR',
          resourceId: creatorId,
          details: { reason: 'Bulk deletion', deletedBy: admin.email },
          ipAddress: '',
          userAgent: '',
        });

        successCount++;
      } catch (err: any) {
        failedCount++;
        errors.push(`${creatorId}: ${err.message}`);
      }
    }

    return {
      success: successCount > 0,
      successCount,
      failedCount,
      errors,
    };
  } catch (error: any) {
    throw new Error(error.message || 'Bulk delete failed');
  }
}
