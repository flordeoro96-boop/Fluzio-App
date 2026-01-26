'use server';

import { cookies } from 'next/headers';
import { getAdminAuth } from '@/lib/firebase/admin';
import { getAdminById } from '@/lib/repositories/admins';
import { canAccess, Resource, Action } from '@/lib/permissions/rbac';
import { writeAuditLog } from '@/lib/repositories/audit';
import {
  getUsers,
  getUserById,
  suspendUser,
  unsuspendUser,
  updateUserKYC,
  addUserStrike,
} from '@/lib/repositories/users';
import {
  suspendUserSchema,
  unsuspendUserSchema,
  updateUserKYCSchema,
  addUserStrikeSchema,
  SuspendUserInput,
  UnsuspendUserInput,
  UpdateUserKYCInput,
  AddUserStrikeInput,
} from '@/lib/schemas/user';
import { User, UserRole } from '@/lib/types';

async function getAuthenticatedAdmin() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;

    if (!sessionCookie) {
      throw new Error('Not authenticated - no session cookie');
    }

    const auth = getAdminAuth();
    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    const admin = await getAdminById(decodedToken.uid);

    if (!admin || admin.status !== 'ACTIVE') {
      throw new Error('Not authorized - admin not found or inactive');
    }

    return admin;
  } catch (error: any) {
    console.error('Authentication error:', error);
    throw new Error(`Authentication failed: ${error.message}`);
  }
}

export async function getUsersAction(filters?: {
  role?: UserRole;
  status?: string;
  kycVerified?: boolean;
  searchQuery?: string;
}): Promise<User[]> {
  try {
    console.log('[getUsersAction] Starting with filters:', filters);
    const admin = await getAuthenticatedAdmin();
    console.log('[getUsersAction] Admin authenticated:', admin.uid);

    if (!canAccess(admin, Resource.USERS, Action.READ)) {
      throw new Error('Insufficient permissions to view users');
    }

    console.log('[getUsersAction] Fetching users...');
    const users = await getUsers(admin.countryScopes, filters);
    console.log('[getUsersAction] Found users:', users.length);

    // Serialize dates
    const serialized = JSON.parse(JSON.stringify(users));
    console.log('[getUsersAction] Successfully serialized');
    return serialized;
  } catch (error: any) {
    console.error('[getUsersAction] Error:', error.message, error.stack);
    throw new Error(error.message || 'Failed to fetch users');
  }
}

export async function getUserByIdAction(userId: string): Promise<User | null> {
  try {
    const admin = await getAuthenticatedAdmin();

    if (!canAccess(admin, Resource.USERS, Action.READ)) {
      throw new Error('Insufficient permissions to view user');
    }

    const user = await getUserById(userId);

    if (!user) {
      return null;
    }

    // Check country scope
    if (
      !admin.countryScopes.includes('GLOBAL') &&
      !admin.countryScopes.includes(user.countryCode)
    ) {
      throw new Error('Access denied to this user');
    }

    // Serialize dates
    return JSON.parse(JSON.stringify(user));
  } catch (error: any) {
    console.error('Get user error:', error);
    throw new Error(error.message || 'Failed to fetch user');
  }
}

export async function suspendUserAction(input: SuspendUserInput): Promise<void> {
  try {
    const admin = await getAuthenticatedAdmin();

    if (!canAccess(admin, Resource.USERS, Action.SUSPEND)) {
      throw new Error('Insufficient permissions to suspend users');
    }

    // Validate input
    const validated = suspendUserSchema.parse(input);

    // Get user to check country scope
    const user = await getUserById(validated.userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (
      !admin.countryScopes.includes('GLOBAL') &&
      !admin.countryScopes.includes(user.countryCode)
    ) {
      throw new Error('Access denied to this user');
    }

    // Suspend user
    await suspendUser(validated.userId, validated.reason, admin.uid);

    // Write audit log
    await writeAuditLog({
      adminId: admin.uid,
      action: 'suspend_user',
      resource: 'users',
      resourceId: validated.userId,
      details: { reason: validated.reason },
      ipAddress: '',
      userAgent: '',
    });
  } catch (error: any) {
    console.error('Suspend user error:', error);
    throw new Error(error.message || 'Failed to suspend user');
  }
}

export async function unsuspendUserAction(
  input: UnsuspendUserInput
): Promise<void> {
  try {
    const admin = await getAuthenticatedAdmin();

    if (!canAccess(admin, Resource.USERS, Action.SUSPEND)) {
      throw new Error('Insufficient permissions to unsuspend users');
    }

    // Validate input
    const validated = unsuspendUserSchema.parse(input);

    // Get user to check country scope
    const user = await getUserById(validated.userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (
      !admin.countryScopes.includes('GLOBAL') &&
      !admin.countryScopes.includes(user.countryCode)
    ) {
      throw new Error('Access denied to this user');
    }

    // Unsuspend user
    await unsuspendUser(validated.userId);

    // Write audit log
    await writeAuditLog({
      adminId: admin.uid,
      action: 'unsuspend_user',
      resource: 'users',
      resourceId: validated.userId,
      details: {},
      ipAddress: '',
      userAgent: '',
    });
  } catch (error: any) {
    console.error('Unsuspend user error:', error);
    throw new Error(error.message || 'Failed to unsuspend user');
  }
}

export async function updateUserKYCAction(
  input: UpdateUserKYCInput
): Promise<void> {
  try {
    const admin = await getAuthenticatedAdmin();

    if (!canAccess(admin, Resource.USERS, Action.APPROVE)) {
      throw new Error('Insufficient permissions to update user KYC');
    }

    // Validate input
    const validated = updateUserKYCSchema.parse(input);

    // Get user to check country scope
    const user = await getUserById(validated.userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (
      !admin.countryScopes.includes('GLOBAL') &&
      !admin.countryScopes.includes(user.countryCode)
    ) {
      throw new Error('Access denied to this user');
    }

    // Update KYC
    await updateUserKYC(validated.userId, validated.verified);

    // Write audit log
    await writeAuditLog({
      adminId: admin.uid,
      action: 'update_user_kyc',
      resource: 'users',
      resourceId: validated.userId,
      details: { verified: validated.verified },
      ipAddress: '',
      userAgent: '',
    });
  } catch (error: any) {
    console.error('Update KYC error:', error);
    throw new Error(error.message || 'Failed to update user KYC');
  }
}

export async function addUserStrikeAction(
  input: AddUserStrikeInput
): Promise<void> {
  try {
    const admin = await getAuthenticatedAdmin();

    if (!canAccess(admin, Resource.USERS, Action.UPDATE)) {
      throw new Error('Insufficient permissions to add user strikes');
    }

    // Validate input
    const validated = addUserStrikeSchema.parse(input);

    // Get user to check country scope
    const user = await getUserById(validated.userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (
      !admin.countryScopes.includes('GLOBAL') &&
      !admin.countryScopes.includes(user.countryCode)
    ) {
      throw new Error('Access denied to this user');
    }

    // Add strike
    await addUserStrike(validated.userId, validated.reason);

    // Write audit log
    await writeAuditLog({
      adminId: admin.uid,
      action: 'add_user_strike',
      resource: 'users',
      resourceId: validated.userId,
      details: { reason: validated.reason },
      ipAddress: '',
      userAgent: '',
    });
  } catch (error: any) {
    console.error('Add strike error:', error);
    throw new Error(error.message || 'Failed to add user strike');
  }
}
