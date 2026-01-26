'use server';

import { getAdminAuth, db } from '@/lib/firebase/admin';
import { doc, setDoc, updateDoc, deleteDoc } from '@/lib/firebase/firestoreCompat';
import { cookies } from 'next/headers';
import { getAdminById, getAdmins } from '@/lib/repositories/admins';
import { writeAuditLog } from '@/lib/repositories/audit';
import { Admin, AdminRole, AdminStatus } from '@/lib/types';
import { Timestamp } from '@/lib/firebase/firestoreCompat';
import { z } from 'zod';

const createAdminSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['SUPER_ADMIN', 'COUNTRY_ADMIN', 'FINANCE', 'MODERATOR', 'OPS_SUPPORT', 'ANALYST_READONLY']),
  countryScopes: z.array(z.string()).min(1, 'At least one country scope is required'),
});

const updateAdminSchema = z.object({
  role: z.enum(['SUPER_ADMIN', 'COUNTRY_ADMIN', 'FINANCE', 'MODERATOR', 'OPS_SUPPORT', 'ANALYST_READONLY']).optional(),
  countryScopes: z.array(z.string()).min(1, 'At least one country scope is required').optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED']).optional(),
});

async function getAuthenticatedAdmin(): Promise<Admin> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;

    if (!sessionCookie) {
      throw new Error('Not authenticated');
    }

    const auth = getAdminAuth();
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    const admin = await getAdminById(decodedClaims.uid);

    if (!admin || admin.status !== 'ACTIVE') {
      throw new Error('Admin not found or inactive');
    }

    return admin;
  } catch (error: any) {
    console.error('Authentication error:', error);
    throw new Error('Authentication failed');
  }
}

function requireSuperAdmin(admin: Admin) {
  if (admin.role !== 'SUPER_ADMIN') {
    throw new Error('Only SUPER_ADMIN can manage admin users');
  }
}

export async function getAdminsAction(): Promise<Admin[]> {
  try {
    const admin = await getAuthenticatedAdmin();
    requireSuperAdmin(admin);

    const admins = await getAdmins();
    
    // Serialize dates
    return JSON.parse(JSON.stringify(admins));
  } catch (error: any) {
    console.error('Get admins error:', error);
    throw new Error(error.message || 'Failed to fetch admins');
  }
}

export async function createAdminAction(input: {
  email: string;
  password: string;
  role: string;
  countryScopes: string[];
}): Promise<{ success: boolean; adminId?: string; error?: string }> {
  try {
    const admin = await getAuthenticatedAdmin();
    requireSuperAdmin(admin);

    // Validate input
    const validatedData = createAdminSchema.parse(input);

    const auth = getAdminAuth();
    // Using db from imports

    // TODO: Implement Supabase admin user creation
    // Create Supabase Auth user using admin API
    const userRecord = { uid: crypto.randomUUID() }; // Temporary placeholder
    /*
    const { data: { user }, error } = await auth.auth.admin.createUser({
      email: validatedData.email,
      password: validatedData.password,
      email_confirm: true,
    });
    if (error) throw error;
    const userRecord = { uid: user.id };
    */

    // Create admin document in Firestore
    const adminData = {
      uid: userRecord.uid,
      email: validatedData.email,
      role: validatedData.role as AdminRole,
      countryScopes: validatedData.countryScopes,
      status: 'ACTIVE' as AdminStatus,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await setDoc(doc(db, 'admins', userRecord.uid), adminData);

    // Write audit log
    await writeAuditLog({
      adminId: admin.uid,
      action: 'CREATE_ADMIN',
      resource: 'admins',
      resourceId: userRecord.uid,
      details: {
        newAdminEmail: validatedData.email,
        role: validatedData.role,
        countryScopes: validatedData.countryScopes,
      },
      ipAddress: '',
      userAgent: '',
    });

    return { success: true, adminId: userRecord.uid };
  } catch (error: any) {
    console.error('Create admin error:', error);
    
    if (error.code === 'auth/email-already-exists') {
      return { success: false, error: 'Email already exists' };
    }
    
    return { success: false, error: error.message || 'Failed to create admin' };
  }
}

export async function updateAdminAction(
  uid: string,
  input: {
    role?: string;
    countryScopes?: string[];
    status?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await getAuthenticatedAdmin();
    requireSuperAdmin(admin);

    // Validate input
    const validatedData = updateAdminSchema.parse(input);

    // Prevent self-suspension
    if (uid === admin.uid && validatedData.status === 'SUSPENDED') {
      return { success: false, error: 'Cannot suspend your own account' };
    }

    // Update admin document
    const updateData: any = {
      updatedAt: Timestamp.now(),
    };

    if (validatedData.role) updateData.role = validatedData.role;
    if (validatedData.countryScopes) updateData.countryScopes = validatedData.countryScopes;
    if (validatedData.status) updateData.status = validatedData.status;

    // Using db from imports
    await updateDoc(doc(db, 'admins', uid), updateData);

    // Write audit log
    await writeAuditLog({
      adminId: admin.uid,
      action: 'UPDATE_ADMIN',
      resource: 'admins',
      resourceId: uid,
      details: {
        changes: validatedData,
      },
      ipAddress: '',
      userAgent: '',
    });

    return { success: true };
  } catch (error: any) {
    console.error('Update admin error:', error);
    return { success: false, error: error.message || 'Failed to update admin' };
  }
}

export async function deleteAdminAction(uid: string): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await getAuthenticatedAdmin();
    requireSuperAdmin(admin);

    // Prevent self-deletion
    if (uid === admin.uid) {
      return { success: false, error: 'Cannot delete your own account' };
    }

    const auth = getAdminAuth();
    // Using db from imports

    // TODO: Implement Supabase admin user deletion
    // Delete from Supabase Auth using admin API
    /*
    const { error } = await auth.auth.admin.deleteUser(uid);
    if (error) throw error;
    */

    // Delete from Firestore
    await deleteDoc(doc(db, 'admins', uid));

    // Write audit log
    await writeAuditLog({
      adminId: admin.uid,
      action: 'DELETE_ADMIN',
      resource: 'admins',
      resourceId: uid,
      details: {},
      ipAddress: '',
      userAgent: '',
    });

    return { success: true };
  } catch (error: any) {
    console.error('Delete admin error:', error);
    return { success: false, error: error.message || 'Failed to delete admin' };
  }
}

export async function resetAdminPasswordAction(
  uid: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await getAuthenticatedAdmin();
    requireSuperAdmin(admin);

    if (newPassword.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters' };
    }

    const auth = getAdminAuth();
    // TODO: Implement Supabase password reset
    /*
    const { error } = await auth.auth.admin.updateUserById(uid, {
      password: newPassword,
    });
    if (error) throw error;
    */

    // Write audit log
    await writeAuditLog({
      adminId: admin.uid,
      action: 'RESET_ADMIN_PASSWORD',
      resource: 'admins',
      resourceId: uid,
      details: {},
      ipAddress: '',
      userAgent: '',
    });

    return { success: true };
  } catch (error: any) {
    console.error('Reset password error:', error);
    return { success: false, error: error.message || 'Failed to reset password' };
  }
}
