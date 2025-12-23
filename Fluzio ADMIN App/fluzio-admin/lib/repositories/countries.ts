import { db } from '@/lib/firebase/admin';
import { Country, CountryStatus, LaunchChecklistItem } from '@/lib/types';
import { Timestamp } from 'firebase-admin/firestore';

export async function getCountries(countryScopes?: string[]): Promise<Country[]> {
  let query = db.collection('countries').orderBy('name', 'asc');

  // Filter by country scopes if not GLOBAL access
  if (countryScopes && !countryScopes.includes('GLOBAL')) {
    query = query.where('code', 'in', countryScopes);
  }

  const snapshot = await query.get();
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt || new Date()),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt || new Date()),
      launchedAt: data.launchedAt?.toDate ? data.launchedAt.toDate() : data.launchedAt,
      suspendedAt: data.suspendedAt?.toDate ? data.suspendedAt.toDate() : data.suspendedAt,
      // Convert checklist item dates
      launchChecklist: (data.launchChecklist || []).map((item: any) => ({
        ...item,
        completedAt: item.completedAt?.toDate ? item.completedAt.toDate() : item.completedAt,
      })),
    };
  }) as Country[];
}

export async function getCountryById(countryId: string): Promise<Country | null> {
  const doc = await db.collection('countries').doc(countryId).get();
  if (!doc.exists) return null;

  const data = doc.data()!;
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt || new Date()),
    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt || new Date()),
    launchedAt: data.launchedAt?.toDate ? data.launchedAt.toDate() : data.launchedAt,
    suspendedAt: data.suspendedAt?.toDate ? data.suspendedAt.toDate() : data.suspendedAt,
    // Convert checklist item dates
    launchChecklist: (data.launchChecklist || []).map((item: any) => ({
      ...item,
      completedAt: item.completedAt?.toDate ? item.completedAt.toDate() : item.completedAt,
    })),
  } as Country;
}

export async function getCountryByCode(code: string): Promise<Country | null> {
  const snapshot = await db.collection('countries').where('code', '==', code).limit(1).get();
  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
    launchedAt: data.launchedAt?.toDate() || undefined,
    suspendedAt: data.suspendedAt?.toDate() || undefined,
    // Convert checklist item dates
    launchChecklist: (data.launchChecklist || []).map((item: any) => ({
      ...item,
      completedAt: item.completedAt?.toDate?.() || item.completedAt || undefined,
    })),
  } as Country;
}

export async function createCountry(data: {
  code: string;
  name: string;
  currency: string;
  timezone: string;
  language: string;
  status: CountryStatus;
  launchChecklist: LaunchChecklistItem[];
  createdBy: string;
}): Promise<Country> {
  const now = Timestamp.now();
  const docRef = await db.collection('countries').add({
    ...data,
    settings: {
      enableBusinessVerification: true,
      enableCreatorPayouts: false,
      enableEvents: false,
      autoApproveMissions: false,
    },
    stats: {
      totalUsers: 0,
      activeBusinesses: 0,
      verifiedCreators: 0,
      activeMissions: 0,
    },
    createdAt: now,
    updatedAt: now,
  });

  const doc = await docRef.get();
  const docData = doc.data()!;
  return {
    id: doc.id,
    ...docData,
    createdAt: docData.createdAt.toDate(),
    updatedAt: docData.updatedAt.toDate(),
    // Convert checklist item dates
    launchChecklist: (docData.launchChecklist || []).map((item: any) => ({
      ...item,
      completedAt: item.completedAt?.toDate?.() || item.completedAt || undefined,
    })),
  } as Country;
}

export async function updateCountry(
  countryId: string,
  data: Partial<Country>,
  updatedBy: string
): Promise<void> {
  const updateData = {
    ...data,
    updatedAt: Timestamp.now(),
    updatedBy,
  };

  // Remove undefined values
  Object.keys(updateData).forEach((key) => {
    if (updateData[key as keyof typeof updateData] === undefined) {
      delete updateData[key as keyof typeof updateData];
    }
  });

  await db.collection('countries').doc(countryId).update(updateData);
}

export async function updateLaunchChecklist(
  countryId: string,
  checklist: LaunchChecklistItem[],
  updatedBy: string
): Promise<void> {
  await db.collection('countries').doc(countryId).update({
    launchChecklist: checklist,
    updatedAt: Timestamp.now(),
    updatedBy,
  });
}

export async function launchCountry(countryId: string, launchedBy: string): Promise<void> {
  const now = Timestamp.now();
  await db.collection('countries').doc(countryId).update({
    status: CountryStatus.ACTIVE,
    launchedAt: now,
    updatedAt: now,
    updatedBy: launchedBy,
  });
}

export async function suspendCountry(
  countryId: string,
  reason: string,
  suspendedBy: string
): Promise<void> {
  await db.collection('countries').doc(countryId).update({
    status: CountryStatus.SUSPENDED,
    suspensionReason: reason,
    suspendedAt: Timestamp.now(),
    suspendedBy,
    updatedAt: Timestamp.now(),
    updatedBy: suspendedBy,
  });
}
