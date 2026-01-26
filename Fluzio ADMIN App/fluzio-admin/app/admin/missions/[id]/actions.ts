'use server';

import { getAdminAuth, db } from '@/lib/firebase/admin';
import { collection, doc, getDoc } from '@/lib/firebase/firestoreCompat';
import { getAdminById } from '@/lib/repositories/admins';
import { Mission } from '@/lib/types';
import { cookies } from 'next/headers';

async function getAuthenticatedAdmin() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  if (!sessionCookie) {
    throw new Error('No session cookie found');
  }

  const auth = getAdminAuth();
  const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
  const admin = await getAdminById(decodedClaims.uid);

  if (!admin) {
    throw new Error('Admin not found');
  }

  return admin;
}

export async function getMissionByIdAction(missionId: string) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      throw new Error('Unauthorized');
    }

    const missionDoc = await getDoc(doc(db, 'missions', missionId));

    if (!missionDoc.exists) {
      throw new Error('Mission not found');
    }

    const mission: Mission = {
      id: missionDoc.id,
      ...missionDoc.data(),
    } as Mission;

    // Check country scope
    if (!admin.countryScopes.includes('GLOBAL') && !admin.countryScopes.includes(mission.countryId)) {
      throw new Error('Mission not accessible in your country scope');
    }

    return { success: true, mission };
  } catch (error: any) {
    console.error('[getMissionByIdAction] Error:', error);
    throw new Error(error.message || 'Failed to fetch mission');
  }
}
