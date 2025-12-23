'use server';

import { cookies } from 'next/headers';
import { getAdminAuth } from '@/lib/firebase/admin';
import { getAdminById } from '@/lib/repositories/admins';
import { canAccess, Resource, Action } from '@/lib/permissions/rbac';
import { writeAuditLog } from '@/lib/repositories/audit';
import {
  getCreators,
  getCreatorById,
  verifyCreator,
  updateTrustScore,
  freezePayout,
  unfreezePayout,
  suspendCreator,
  unsuspendCreator,
} from '@/lib/repositories/creators';
import {
  verifyCreatorSchema,
  updateTrustScoreSchema,
  freezePayoutSchema,
  unfreezePayoutSchema,
  suspendCreatorSchema,
  unsuspendCreatorSchema,
  VerifyCreatorInput,
  UpdateTrustScoreInput,
  FreezePayoutInput,
  UnfreezePayoutInput,
  SuspendCreatorInput,
  UnsuspendCreatorInput,
} from '@/lib/schemas/creator';
import { Creator, VerificationStatus } from '@/lib/types';

async function getAuthenticatedAdmin() {
  try {
    const cookieStore = await cookies();
    const idToken = cookieStore.get('idToken')?.value;

    if (!idToken) {
      throw new Error('Not authenticated - no token');
    }

    const auth = getAdminAuth();
    const decodedToken = await auth.verifyIdToken(idToken);
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

export async function getCreatorsAction(filters?: {
  verified?: boolean;
  verificationStatus?: VerificationStatus;
  status?: string;
  payoutFrozen?: boolean;
  searchQuery?: string;
}): Promise<Creator[]> {
  try {
    const admin = await getAuthenticatedAdmin();

    if (!canAccess(admin, Resource.CREATORS, Action.READ)) {
      throw new Error('Insufficient permissions to view creators');
    }

    const creators = await getCreators(admin.countryScopes, filters);

    // Serialize dates
    return JSON.parse(JSON.stringify(creators));
  } catch (error: any) {
    console.error('Get creators error:', error);
    throw new Error(error.message || 'Failed to fetch creators');
  }
}

export async function getCreatorByIdAction(
  creatorId: string
): Promise<Creator | null> {
  try {
    const admin = await getAuthenticatedAdmin();

    if (!canAccess(admin, Resource.CREATORS, Action.READ)) {
      throw new Error('Insufficient permissions to view creator');
    }

    const creator = await getCreatorById(creatorId);

    if (!creator) {
      return null;
    }

    // Check country scope
    if (
      !admin.countryScopes.includes('GLOBAL') &&
      !admin.countryScopes.includes(creator.countryCode)
    ) {
      throw new Error('Access denied to this creator');
    }

    // Serialize dates
    return JSON.parse(JSON.stringify(creator));
  } catch (error: any) {
    console.error('Get creator error:', error);
    throw new Error(error.message || 'Failed to fetch creator');
  }
}

export async function verifyCreatorAction(
  input: VerifyCreatorInput
): Promise<void> {
  try {
    const admin = await getAuthenticatedAdmin();

    if (!canAccess(admin, Resource.CREATORS, Action.APPROVE)) {
      throw new Error('Insufficient permissions to verify creators');
    }

    // Validate input
    const validated = verifyCreatorSchema.parse(input);

    // Get creator to check country scope
    const creator = await getCreatorById(validated.creatorId);
    if (!creator) {
      throw new Error('Creator not found');
    }

    if (
      !admin.countryScopes.includes('GLOBAL') &&
      !admin.countryScopes.includes(creator.countryCode)
    ) {
      throw new Error('Access denied to this creator');
    }

    // Verify creator
    await verifyCreator(
      validated.creatorId,
      validated.approved,
      admin.uid,
      validated.notes
    );

    // Write audit log
    await writeAuditLog({
      adminId: admin.uid,
      action: validated.approved ? 'approve_creator' : 'reject_creator',
      resource: 'creators',
      resourceId: validated.creatorId,
      details: { notes: validated.notes },
      ipAddress: '',
      userAgent: '',
    });
  } catch (error: any) {
    console.error('Verify creator error:', error);
    throw new Error(error.message || 'Failed to verify creator');
  }
}

export async function updateTrustScoreAction(
  input: UpdateTrustScoreInput
): Promise<void> {
  try {
    const admin = await getAuthenticatedAdmin();

    if (!canAccess(admin, Resource.CREATORS, Action.UPDATE)) {
      throw new Error('Insufficient permissions to update trust score');
    }

    // Validate input
    const validated = updateTrustScoreSchema.parse(input);

    // Get creator to check country scope
    const creator = await getCreatorById(validated.creatorId);
    if (!creator) {
      throw new Error('Creator not found');
    }

    if (
      !admin.countryScopes.includes('GLOBAL') &&
      !admin.countryScopes.includes(creator.countryCode)
    ) {
      throw new Error('Access denied to this creator');
    }

    // Update trust score
    await updateTrustScore(validated.creatorId, validated.trustScore);

    // Write audit log
    await writeAuditLog({
      adminId: admin.uid,
      action: 'update_creator_trust_score',
      resource: 'creators',
      resourceId: validated.creatorId,
      details: { trustScore: validated.trustScore },
      ipAddress: '',
      userAgent: '',
    });
  } catch (error: any) {
    console.error('Update trust score error:', error);
    throw new Error(error.message || 'Failed to update trust score');
  }
}

export async function freezePayoutAction(
  input: FreezePayoutInput
): Promise<void> {
  try {
    const admin = await getAuthenticatedAdmin();

    if (!canAccess(admin, Resource.CREATORS, Action.UPDATE)) {
      throw new Error('Insufficient permissions to freeze payouts');
    }

    // Validate input
    const validated = freezePayoutSchema.parse(input);

    // Get creator to check country scope
    const creator = await getCreatorById(validated.creatorId);
    if (!creator) {
      throw new Error('Creator not found');
    }

    if (
      !admin.countryScopes.includes('GLOBAL') &&
      !admin.countryScopes.includes(creator.countryCode)
    ) {
      throw new Error('Access denied to this creator');
    }

    // Freeze payout
    await freezePayout(validated.creatorId, validated.reason, admin.uid);

    // Write audit log
    await writeAuditLog({
      adminId: admin.uid,
      action: 'freeze_creator_payout',
      resource: 'creators',
      resourceId: validated.creatorId,
      details: { reason: validated.reason },
      ipAddress: '',
      userAgent: '',
    });
  } catch (error: any) {
    console.error('Freeze payout error:', error);
    throw new Error(error.message || 'Failed to freeze payout');
  }
}

export async function unfreezePayoutAction(
  input: UnfreezePayoutInput
): Promise<void> {
  try {
    const admin = await getAuthenticatedAdmin();

    if (!canAccess(admin, Resource.CREATORS, Action.UPDATE)) {
      throw new Error('Insufficient permissions to unfreeze payouts');
    }

    // Validate input
    const validated = unfreezePayoutSchema.parse(input);

    // Get creator to check country scope
    const creator = await getCreatorById(validated.creatorId);
    if (!creator) {
      throw new Error('Creator not found');
    }

    if (
      !admin.countryScopes.includes('GLOBAL') &&
      !admin.countryScopes.includes(creator.countryCode)
    ) {
      throw new Error('Access denied to this creator');
    }

    // Unfreeze payout
    await unfreezePayout(validated.creatorId);

    // Write audit log
    await writeAuditLog({
      adminId: admin.uid,
      action: 'unfreeze_creator_payout',
      resource: 'creators',
      resourceId: validated.creatorId,
      details: {},
      ipAddress: '',
      userAgent: '',
    });
  } catch (error: any) {
    console.error('Unfreeze payout error:', error);
    throw new Error(error.message || 'Failed to unfreeze payout');
  }
}

export async function suspendCreatorAction(
  input: SuspendCreatorInput
): Promise<void> {
  try {
    const admin = await getAuthenticatedAdmin();

    if (!canAccess(admin, Resource.CREATORS, Action.SUSPEND)) {
      throw new Error('Insufficient permissions to suspend creators');
    }

    // Validate input
    const validated = suspendCreatorSchema.parse(input);

    // Get creator to check country scope
    const creator = await getCreatorById(validated.creatorId);
    if (!creator) {
      throw new Error('Creator not found');
    }

    if (
      !admin.countryScopes.includes('GLOBAL') &&
      !admin.countryScopes.includes(creator.countryCode)
    ) {
      throw new Error('Access denied to this creator');
    }

    // Suspend creator
    await suspendCreator(validated.creatorId, validated.reason, admin.uid);

    // Write audit log
    await writeAuditLog({
      adminId: admin.uid,
      action: 'suspend_creator',
      resource: 'creators',
      resourceId: validated.creatorId,
      details: { reason: validated.reason },
      ipAddress: '',
      userAgent: '',
    });
  } catch (error: any) {
    console.error('Suspend creator error:', error);
    throw new Error(error.message || 'Failed to suspend creator');
  }
}

export async function unsuspendCreatorAction(
  input: UnsuspendCreatorInput
): Promise<void> {
  try {
    const admin = await getAuthenticatedAdmin();

    if (!canAccess(admin, Resource.CREATORS, Action.SUSPEND)) {
      throw new Error('Insufficient permissions to unsuspend creators');
    }

    // Validate input
    const validated = unsuspendCreatorSchema.parse(input);

    // Get creator to check country scope
    const creator = await getCreatorById(validated.creatorId);
    if (!creator) {
      throw new Error('Creator not found');
    }

    if (
      !admin.countryScopes.includes('GLOBAL') &&
      !admin.countryScopes.includes(creator.countryCode)
    ) {
      throw new Error('Access denied to this creator');
    }

    // Unsuspend creator
    await unsuspendCreator(validated.creatorId);

    // Write audit log
    await writeAuditLog({
      adminId: admin.uid,
      action: 'unsuspend_creator',
      resource: 'creators',
      resourceId: validated.creatorId,
      details: {},
      ipAddress: '',
      userAgent: '',
    });
  } catch (error: any) {
    console.error('Unsuspend creator error:', error);
    throw new Error(error.message || 'Failed to unsuspend creator');
  }
}
