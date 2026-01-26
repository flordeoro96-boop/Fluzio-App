'use server';

import { cookies } from 'next/headers';
import { getAdminAuth } from '@/lib/firebase/admin';
import { getAdminById } from '@/lib/repositories/admins';
import { canAccess, Resource, Action } from '@/lib/permissions/rbac';
import { writeAuditLog } from '@/lib/repositories/audit';
import {
  getBusinesses,
  getBusinessById,
  updateBusinessTier,
  verifyBusiness,
  suspendBusiness,
  unsuspendBusiness,
} from '@/lib/repositories/businesses';
import {
  updateBusinessTierSchema,
  verifyBusinessSchema,
  suspendBusinessSchema,
  unsuspendBusinessSchema,
  UpdateBusinessTierInput,
  VerifyBusinessInput,
  SuspendBusinessInput,
  UnsuspendBusinessInput,
} from '@/lib/schemas/business';
import { Business, BusinessTier, VerificationStatus } from '@/lib/types';

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

export async function getBusinessesAction(filters?: {
  tier?: BusinessTier;
  status?: string;
  verified?: boolean;
  verificationStatus?: VerificationStatus;
  searchQuery?: string;
}): Promise<Business[]> {
  try {
    console.log('[getBusinessesAction] Starting with filters:', filters);
    const admin = await getAuthenticatedAdmin();
    console.log('[getBusinessesAction] Admin authenticated:', admin.uid);

    if (!canAccess(admin, Resource.BUSINESSES, Action.READ)) {
      throw new Error('Insufficient permissions to view businesses');
    }

    console.log('[getBusinessesAction] Fetching businesses...');
    const businesses = await getBusinesses(admin.countryScopes, filters);
    console.log('[getBusinessesAction] Found businesses:', businesses.length);

    // Serialize dates
    const serialized = JSON.parse(JSON.stringify(businesses));
    console.log('[getBusinessesAction] Successfully serialized');
    return serialized;
  } catch (error: any) {
    console.error('[getBusinessesAction] Error:', error.message, error.stack);
    throw new Error(error.message || 'Failed to fetch businesses');
  }
}

export async function getBusinessByIdAction(
  businessId: string
): Promise<Business | null> {
  try {
    const admin = await getAuthenticatedAdmin();

    if (!canAccess(admin, Resource.BUSINESSES, Action.READ)) {
      throw new Error('Insufficient permissions to view business');
    }

    const business = await getBusinessById(businessId);

    if (!business) {
      return null;
    }

    // Check country scope
    if (
      !admin.countryScopes.includes('GLOBAL') &&
      !admin.countryScopes.includes(business.countryCode)
    ) {
      throw new Error('Access denied to this business');
    }

    // Serialize dates
    return JSON.parse(JSON.stringify(business));
  } catch (error: any) {
    console.error('Get business error:', error);
    throw new Error(error.message || 'Failed to fetch business');
  }
}

export async function updateBusinessTierAction(
  input: UpdateBusinessTierInput
): Promise<void> {
  try {
    const admin = await getAuthenticatedAdmin();

    if (!canAccess(admin, Resource.BUSINESSES, Action.UPDATE)) {
      throw new Error('Insufficient permissions to update business tier');
    }

    // Validate input
    const validated = updateBusinessTierSchema.parse(input);

    // Get business to check country scope
    const business = await getBusinessById(validated.businessId);
    if (!business) {
      throw new Error('Business not found');
    }

    if (
      !admin.countryScopes.includes('GLOBAL') &&
      !admin.countryScopes.includes(business.countryCode)
    ) {
      throw new Error('Access denied to this business');
    }

    // Update tier
    await updateBusinessTier(validated.businessId, validated.tier);

    // Write audit log
    await writeAuditLog({
      adminId: admin.uid,
      action: 'update_business_tier',
      resource: 'businesses',
      resourceId: validated.businessId,
      details: { tier: validated.tier },
      ipAddress: '',
      userAgent: '',
    });
  } catch (error: any) {
    console.error('Update tier error:', error);
    throw new Error(error.message || 'Failed to update business tier');
  }
}

export async function verifyBusinessAction(
  input: VerifyBusinessInput
): Promise<void> {
  try {
    const admin = await getAuthenticatedAdmin();

    if (!canAccess(admin, Resource.BUSINESSES, Action.APPROVE)) {
      throw new Error('Insufficient permissions to verify businesses');
    }

    // Validate input
    const validated = verifyBusinessSchema.parse(input);

    // Get business to check country scope
    const business = await getBusinessById(validated.businessId);
    if (!business) {
      throw new Error('Business not found');
    }

    if (
      !admin.countryScopes.includes('GLOBAL') &&
      !admin.countryScopes.includes(business.countryCode)
    ) {
      throw new Error('Access denied to this business');
    }

    // Verify business
    await verifyBusiness(
      validated.businessId,
      validated.approved,
      admin.uid,
      validated.notes
    );

    // Write audit log
    await writeAuditLog({
      adminId: admin.uid,
      action: validated.approved ? 'approve_business' : 'reject_business',
      resource: 'businesses',
      resourceId: validated.businessId,
      details: { notes: validated.notes },
      ipAddress: '',
      userAgent: '',
    });
  } catch (error: any) {
    console.error('Verify business error:', error);
    throw new Error(error.message || 'Failed to verify business');
  }
}

export async function suspendBusinessAction(
  input: SuspendBusinessInput
): Promise<void> {
  try {
    const admin = await getAuthenticatedAdmin();

    if (!canAccess(admin, Resource.BUSINESSES, Action.SUSPEND)) {
      throw new Error('Insufficient permissions to suspend businesses');
    }

    // Validate input
    const validated = suspendBusinessSchema.parse(input);

    // Get business to check country scope
    const business = await getBusinessById(validated.businessId);
    if (!business) {
      throw new Error('Business not found');
    }

    if (
      !admin.countryScopes.includes('GLOBAL') &&
      !admin.countryScopes.includes(business.countryCode)
    ) {
      throw new Error('Access denied to this business');
    }

    // Suspend business
    await suspendBusiness(validated.businessId, validated.reason, admin.uid);

    // Write audit log
    await writeAuditLog({
      adminId: admin.uid,
      action: 'suspend_business',
      resource: 'businesses',
      resourceId: validated.businessId,
      details: { reason: validated.reason },
      ipAddress: '',
      userAgent: '',
    });
  } catch (error: any) {
    console.error('Suspend business error:', error);
    throw new Error(error.message || 'Failed to suspend business');
  }
}

export async function unsuspendBusinessAction(
  input: UnsuspendBusinessInput
): Promise<void> {
  try {
    const admin = await getAuthenticatedAdmin();

    if (!canAccess(admin, Resource.BUSINESSES, Action.SUSPEND)) {
      throw new Error('Insufficient permissions to unsuspend businesses');
    }

    // Validate input
    const validated = unsuspendBusinessSchema.parse(input);

    // Get business to check country scope
    const business = await getBusinessById(validated.businessId);
    if (!business) {
      throw new Error('Business not found');
    }

    if (
      !admin.countryScopes.includes('GLOBAL') &&
      !admin.countryScopes.includes(business.countryCode)
    ) {
      throw new Error('Access denied to this business');
    }

    // Unsuspend business
    await unsuspendBusiness(validated.businessId);

    // Write audit log
    await writeAuditLog({
      adminId: admin.uid,
      action: 'unsuspend_business',
      resource: 'businesses',
      resourceId: validated.businessId,
      details: {},
      ipAddress: '',
      userAgent: '',
    });
  } catch (error: any) {
    console.error('Unsuspend business error:', error);
    throw new Error(error.message || 'Failed to unsuspend business');
  }
}
