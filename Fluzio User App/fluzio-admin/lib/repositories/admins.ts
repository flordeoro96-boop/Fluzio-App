import { db } from '@/lib/firebase/admin';
import { Admin } from '@/lib/types';

export async function getAdminById(uid: string): Promise<Admin | null> {
  const doc = await db.collection('admins').doc(uid).get();
  if (!doc.exists) return null;

  const data = doc.data()!;
  return {
    uid: doc.id,
    email: data.email,
    role: data.role,
    countryScopes: data.countryScopes || [],
    status: data.status,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  } as Admin;
}

export async function getAdmins(): Promise<Admin[]> {
  const snapshot = await db.collection('admins').orderBy('email', 'asc').get();
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      uid: doc.id,
      email: data.email,
      role: data.role,
      countryScopes: data.countryScopes || [],
      status: data.status,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as Admin;
  });
}
