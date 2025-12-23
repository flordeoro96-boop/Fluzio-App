// Server-side Firestore repository functions
import { getAdminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import {
  Country,
  Business,
  Creator,
  Mission,
  Event,
  Transaction,
  Payout,
  ModerationReport,
  Policy,
  Admin,
} from '@/lib/types';

const db = getAdminDb();

// ============ ADMIN REPOSITORY ============
export async function getAdminById(uid: string): Promise<Admin | null> {
  const doc = await db.collection('admins').doc(uid).get();
  if (!doc.exists) return null;
  const data = { uid, ...doc.data() } as Admin;
  return data;
}

export async function getAllAdmins(): Promise<Admin[]> {
  const snapshot = await db.collection('admins').get();
  return snapshot.docs.map((doc) => ({
    uid: doc.id,
    ...doc.data()
  } as Admin));
}

export async function updateAdmin(
  uid: string,
  data: Partial<Omit<Admin, 'uid' | 'createdAt'>>
): Promise<void> {
  await db
    .collection('admins')
    .doc(uid)
    .update({
      ...data,
      updatedAt: Timestamp.now(),
    });
}

// ============ COUNTRY REPOSITORY ============
export async function getCountryById(countryId: string): Promise<Country | null> {
  const doc = await db.collection('countries').doc(countryId).get();
  if (!doc.exists) return null;
  return doc.data() as Country;
}

export async function getAllCountries(): Promise<Country[]> {
  const snapshot = await db.collection('countries').orderBy('name').get();
  return snapshot.docs.map((doc) => doc.data() as Country);
}

export async function getCountriesByIds(countryIds: string[]): Promise<Country[]> {
  if (countryIds.length === 0) return [];
  const snapshot = await db
    .collection('countries')
    .where('countryId', 'in', countryIds)
    .get();
  return snapshot.docs.map((doc) => doc.data() as Country);
}

export async function createCountry(data: Omit<Country, 'createdAt' | 'updatedAt'>): Promise<void> {
  const countryRef = db.collection('countries').doc(data.code);
  await countryRef.set({
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

export async function updateCountry(
  countryId: string,
  data: Partial<Omit<Country, 'id' | 'code' | 'createdAt' | 'updatedAt'>>,
  adminId: string
): Promise<void> {
  await db
    .collection('countries')
    .doc(countryId)
    .update({
      ...data,
      updatedAt: Timestamp.now(),
    });
}

// ============ BUSINESS REPOSITORY ============
export async function getBusinessById(id: string): Promise<Business | null> {
  const doc = await db.collection('businesses').doc(id).get();
  if (!doc.exists) return null;
  return { id, ...doc.data() } as Business;
}

export async function getBusinessesByCountry(
  countryId: string,
  limit: number = 100
): Promise<Business[]> {
  const snapshot = await db
    .collection('businesses')
    .where('countryId', '==', countryId)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Business));
}

export async function getAllBusinesses(limit: number = 100): Promise<Business[]> {
  const snapshot = await db
    .collection('businesses')
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Business));
}

export async function updateBusiness(
  id: string,
  data: Partial<Omit<Business, 'id' | 'createdAt'>>
): Promise<void> {
  await db
    .collection('businesses')
    .doc(id)
    .update({
      ...data,
      updatedAt: Timestamp.now(),
    });
}

// ============ CREATOR REPOSITORY ============
export async function getCreatorById(id: string): Promise<Creator | null> {
  const doc = await db.collection('creators').doc(id).get();
  if (!doc.exists) return null;
  return { id, ...doc.data() } as Creator;
}

export async function getCreatorsByCountry(
  countryId: string,
  limit: number = 100
): Promise<Creator[]> {
  const snapshot = await db
    .collection('creators')
    .where('countryId', '==', countryId)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Creator));
}

export async function getAllCreators(limit: number = 100): Promise<Creator[]> {
  const snapshot = await db
    .collection('creators')
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Creator));
}

export async function updateCreator(
  id: string,
  data: Partial<Omit<Creator, 'id' | 'createdAt'>>
): Promise<void> {
  await db
    .collection('creators')
    .doc(id)
    .update({
      ...data,
      updatedAt: Timestamp.now(),
    });
}

// ============ MISSION REPOSITORY ============
export async function getMissionById(id: string): Promise<Mission | null> {
  const doc = await db.collection('missions').doc(id).get();
  if (!doc.exists) return null;
  return { id, ...doc.data() } as Mission;
}

export async function getMissionsByCountry(
  countryId: string,
  limit: number = 100
): Promise<Mission[]> {
  const snapshot = await db
    .collection('missions')
    .where('countryId', '==', countryId)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Mission));
}

export async function getDisputedMissions(limit: number = 50): Promise<Mission[]> {
  const snapshot = await db
    .collection('missions')
    .where('dispute.isDisputed', '==', true)
    .orderBy('updatedAt', 'desc')
    .limit(limit)
    .get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Mission));
}

export async function updateMission(
  id: string,
  data: Partial<Omit<Mission, 'id' | 'createdAt'>>
): Promise<void> {
  await db
    .collection('missions')
    .doc(id)
    .update({
      ...data,
      updatedAt: Timestamp.now(),
    });
}

// ============ EVENT REPOSITORY ============
export async function getEventById(id: string): Promise<Event | null> {
  const doc = await db.collection('events').doc(id).get();
  if (!doc.exists) return null;
  return { id, ...doc.data() } as Event;
}

export async function getEventsByCountry(
  countryId: string,
  limit: number = 100
): Promise<Event[]> {
  const snapshot = await db
    .collection('events')
    .where('countryId', '==', countryId)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Event));
}

export async function updateEvent(
  id: string,
  data: Partial<Omit<Event, 'id' | 'createdAt'>>
): Promise<void> {
  await db
    .collection('events')
    .doc(id)
    .update({
      ...data,
      updatedAt: Timestamp.now(),
    });
}

// ============ PAYOUT REPOSITORY ============
export async function getPayoutById(id: string): Promise<Payout | null> {
  const doc = await db.collection('payouts').doc(id).get();
  if (!doc.exists) return null;
  return { id, ...doc.data() } as Payout;
}

export async function getPayoutsByStatus(
  status: 'PENDING' | 'HELD' | 'FAILED' | 'PAID',
  limit: number = 100
): Promise<Payout[]> {
  const snapshot = await db
    .collection('payouts')
    .where('status', '==', status)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Payout));
}

export async function getPayoutsByCreator(creatorId: string): Promise<Payout[]> {
  const snapshot = await db
    .collection('payouts')
    .where('creatorId', '==', creatorId)
    .orderBy('createdAt', 'desc')
    .get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Payout));
}

export async function updatePayout(
  id: string,
  data: Partial<Omit<Payout, 'id' | 'createdAt'>>
): Promise<void> {
  await db
    .collection('payouts')
    .doc(id)
    .update({
      ...data,
      updatedAt: Timestamp.now(),
    });
}

// ============ MODERATION REPOSITORY ============
export async function getModerationReportById(id: string): Promise<ModerationReport | null> {
  const doc = await db.collection('moderationReports').doc(id).get();
  if (!doc.exists) return null;
  return { id, ...doc.data() } as ModerationReport;
}

export async function getModerationReportsByStatus(
  status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED',
  limit: number = 100
): Promise<ModerationReport[]> {
  const snapshot = await db
    .collection('moderationReports')
    .where('status', '==', status)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ModerationReport));
}

export async function updateModerationReport(
  id: string,
  data: Partial<Omit<ModerationReport, 'id' | 'createdAt'>>
): Promise<void> {
  await db
    .collection('moderationReports')
    .doc(id)
    .update({
      ...data,
      updatedAt: Timestamp.now(),
    });
}

// ============ POLICY REPOSITORY ============
export async function getCurrentPolicy(): Promise<Policy | null> {
  const snapshot = await db
    .collection('policies')
    .orderBy('version', 'desc')
    .limit(1)
    .get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as Policy;
}

export async function createPolicy(
  data: Omit<Policy, 'id' | 'updatedAt' | 'version'>
): Promise<string> {
  const currentPolicy = await getCurrentPolicy();
  const newVersion = currentPolicy ? currentPolicy.version + 1 : 1;

  const docRef = await db.collection('policies').add({
    ...data,
    version: newVersion,
    updatedAt: Timestamp.now(),
  });

  return docRef.id;
}

// ============ TRANSACTION REPOSITORY ============
export async function getTransactionsByCountry(
  countryId: string,
  limit: number = 100
): Promise<Transaction[]> {
  const snapshot = await db
    .collection('transactions')
    .where('countryId', '==', countryId)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Transaction));
}

export async function getAllTransactions(limit: number = 100): Promise<Transaction[]> {
  const snapshot = await db
    .collection('transactions')
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Transaction));
}
