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

export async function bulkSuspendUsersAction(userIds: string[]): Promise<{
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

    if (!canAccess(admin, Resource.USERS, Action.UPDATE)) {
      throw new Error('Insufficient permissions');
    }

    // Using db from imports
    const auth = getAdminAuth();

    for (const userId of userIds) {
      try {
        // Update Firestore
        await updateDoc(doc(db, 'users', userId), {
          status: 'SUSPENDED',
          updatedAt: FieldValue.serverTimestamp(),
        });

        // TODO: Implement Supabase user suspension
        // Can update users table with suspended: true flag
        // await supabase.auth.admin.updateUserById(userId, { ban_duration: 'none' })

        // Audit log
        await writeAuditLog({
          adminId: admin.uid,
          action: 'USER_SUSPENDED',
          resource: 'USER',
          resourceId: userId,
          details: { reason: 'Bulk suspension', suspendedBy: admin.email },
          ipAddress: '',
          userAgent: '',
        });

        successCount++;
      } catch (err: any) {
        failedCount++;
        errors.push(`${userId}: ${err.message}`);
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

export async function bulkActivateUsersAction(userIds: string[]): Promise<{
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

    if (!canAccess(admin, Resource.USERS, Action.UPDATE)) {
      throw new Error('Insufficient permissions');
    }

    // Using db from imports
    const auth = getAdminAuth();

    for (const userId of userIds) {
      try {
        // Update Firestore
        await updateDoc(doc(db, 'users', userId), {
          status: 'ACTIVE',
          updatedAt: FieldValue.serverTimestamp(),
        });

        // TODO: Implement Supabase user unsuspension
        // Remove suspended flag from users table

        // Audit log
        await writeAuditLog({
          adminId: admin.uid,
          action: 'USER_ACTIVATED',
          resource: 'USER',
          resourceId: userId,
          details: { reason: 'Bulk activation', activatedBy: admin.email },
          ipAddress: '',
          userAgent: '',
        });

        successCount++;
      } catch (err: any) {
        failedCount++;
        errors.push(`${userId}: ${err.message}`);
      }
    }

    return {
      success: successCount > 0,
      successCount,
      failedCount,
      errors,
    };
  } catch (error: any) {
    throw new Error(error.message || 'Bulk activate failed');
  }
}

export async function bulkDeleteUsersAction(userIds: string[]): Promise<{
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

    if (!canAccess(admin, Resource.USERS, Action.DELETE)) {
      throw new Error('Insufficient permissions');
    }

    // Using db from imports
    const auth = getAdminAuth();

    for (const userId of userIds) {
      try {
        // Delete from Firestore
        await deleteDoc(doc(db, 'users', userId));

        // TODO: Implement Supabase user deletion
        // await supabase.auth.admin.deleteUser(userId)

        // Audit log
        await writeAuditLog({
          adminId: admin.uid,
          action: 'USER_DELETED',
          resource: 'USER',
          resourceId: userId,
          details: { reason: 'Bulk deletion', deletedBy: admin.email },
          ipAddress: '',
          userAgent: '',
        });

        successCount++;
      } catch (err: any) {
        failedCount++;
        errors.push(`${userId}: ${err.message}`);
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
