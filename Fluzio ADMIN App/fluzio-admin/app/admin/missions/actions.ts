'use server';

import { getAdminAuth, db } from '@/lib/firebase/admin';
import { collection, query, where, orderBy, limit, getDocs, getDoc, doc, setDoc, updateDoc, deleteDoc, addDoc } from '@/lib/firebase/firestoreCompat';
import { getAdminById } from '@/lib/repositories/admins';
import { writeAuditLog } from '@/lib/repositories/audit';
import { Mission } from '@/lib/types';
import { cookies } from 'next/headers';

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

export async function getMissionsAction(): Promise<Mission[]> {
  try {
    const admin = await getAuthenticatedAdmin();
    // Using db from imports

    // Build query based on country scope
    let q = query(collection(db, 'missions'));

    // Apply country scope filter
    if (!admin.countryScopes.includes('GLOBAL')) {
      q = query(collection(db, 'missions'), where('countryId', 'in', admin.countryScopes), orderBy('createdAt', 'desc'));
    } else {
      q = query(collection(db, 'missions'), orderBy('createdAt', 'desc'));
    }

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
    })) as Mission[];
  } catch (error: any) {
    console.error('[getMissionsAction] Error:', error);
    throw new Error(error.message || 'Failed to fetch missions');
  }
}

export async function updateMissionStatusAction(
  missionId: string,
  newStatus: string,
  rejectionReason?: string
): Promise<void> {
  try {
    const admin = await getAuthenticatedAdmin();
    // Using db from imports

    // Get mission
    const missionRef = doc(db, 'missions', missionId);
    const missionDoc = await getDoc(missionRef);

    if (!missionDoc.exists) {
      throw new Error('Mission not found');
    }

    const mission = { id: missionDoc.id, ...missionDoc.data() } as Mission;

    // Check country scope
    if (
      !admin.countryScopes.includes('GLOBAL') &&
      !admin.countryScopes.includes(mission.countryId)
    ) {
      throw new Error('You do not have permission to manage missions in this country');
    }

    const oldStatus = mission.status;

    // Update mission
    const updateData: any = {
      status: newStatus,
      updatedAt: new Date(),
    };

    if (newStatus === 'APPROVED') {
      updateData.approvedAt = new Date();
      updateData.approvedBy = admin.uid;
    } else if (newStatus === 'REJECTED' && rejectionReason) {
      updateData.rejectedAt = new Date();
      updateData.rejectedBy = admin.uid;
      updateData.rejectionReason = rejectionReason;
    }

    await updateDoc(missionRef, updateData);

    // Write audit log
    await writeAuditLog({
      adminId: admin.uid,
      action: newStatus === 'APPROVED' ? 'APPROVE_MISSION' : 'REJECT_MISSION',
      resource: 'MISSION',
      resourceId: missionId,
      details: {
        actorRole: admin.role,
        countryScopeUsed: mission.countryId,
        before: { status: oldStatus },
        after: { status: newStatus },
        reason: rejectionReason,
      },
      ipAddress: 'server',
      userAgent: 'admin-app',
    });
  } catch (error: any) {
    console.error('[updateMissionStatusAction] Error:', error);
    throw new Error(error.message || 'Failed to update mission status');
  }
}
