import { db } from '@/lib/firebase/admin';
import { Country, CountryStatus, LaunchChecklistItem } from '@/lib/types';
import { Timestamp } from '@/lib/firebase/firestoreCompat';

// Map country ISO codes to phone codes (legacy fallback)
const COUNTRY_PHONE_CODES: Record<string, string> = {
  'DE': '+49',
  'AE': '+971',
  'US': '+1',
  'GB': '+44',
  'FR': '+33',
  'ES': '+34',
  'IT': '+39',
};

export async function getCountries(countryScopes?: string[]): Promise<Country[]> {
  console.log('[getCountries] Starting query with scopes:', countryScopes);
  
  let query = db.collection('countries').orderBy('name', 'asc');

  // Filter by country scopes if not GLOBAL access
  if (countryScopes && !countryScopes.includes('GLOBAL')) {
    console.log('[getCountries] Filtering by country scopes:', countryScopes);
    query = query.where('code', 'in', countryScopes);
  } else {
    console.log('[getCountries] GLOBAL access - querying all countries');
  }

  const snapshot = await query.get();
  console.log('[getCountries] Found countries in Firestore:', snapshot.size);
  
  // Calculate real-time stats for each country
  const countries = await Promise.all(snapshot.docs.map(async (doc) => {
    const data = doc.data();
    const countryCode = data.countryId || data.code || doc.id; // ISO code like 'DE', 'AE'
    const phoneCode = COUNTRY_PHONE_CODES[countryCode];
    
    console.log(`\n[Countries Stats] Processing ${data.name} (${countryCode})`);
    console.log(`[Countries Stats] Using countryId/code/id: ${data.countryId} / ${data.code} / ${doc.id}`);
    console.log(`[Countries Stats] Phone code mapping: ${phoneCode}`);
    
    let totalUsers = 0;
    let activeBusinesses = 0;
    let aspiringBusinesses = 0;
    let verifiedCreators = 0;
    let customers = 0;
    
    try {
      // First try: Query by operatingCountry (new field - ISO country code)
      console.log(`[Countries Stats] Query 1: operatingCountry == '${countryCode}'`);
      let usersSnapshot = await db.collection('users')
        .where('operatingCountry', '==', countryCode)
        .limit(1000)
        .get();
      
      console.log(`[Countries Stats] Query 1 results: ${usersSnapshot.size} users found`);
      
      if (!usersSnapshot.empty) {
        // Log sample user data to see what fields they have
        const sampleUser = usersSnapshot.docs[0].data();
        console.log(`[Countries Stats] Sample user from operatingCountry query:`, {
          id: usersSnapshot.docs[0].id,
          operatingCountry: sampleUser.operatingCountry,
          countryCode: sampleUser.countryCode,
          role: sampleUser.role,
          accountType: sampleUser.accountType,
          name: sampleUser.name
        });
      }
      
      // Fallback: If no results, try countryCode field (phone code format like "+49")
      if (usersSnapshot.empty && phoneCode) {
        console.log(`[Countries Stats] Query 2: countryCode == '${phoneCode}'`);
        usersSnapshot = await db.collection('users')
          .where('countryCode', '==', phoneCode)
          .limit(1000)
          .get();
        
        console.log(`[Countries Stats] Query 2 results: ${usersSnapshot.size} users found`);
        
        if (!usersSnapshot.empty) {
          const sampleUser = usersSnapshot.docs[0].data();
          console.log(`[Countries Stats] Sample user from countryCode query:`, {
            id: usersSnapshot.docs[0].id,
            operatingCountry: sampleUser.operatingCountry,
            countryCode: sampleUser.countryCode,
            role: sampleUser.role,
            accountType: sampleUser.accountType,
            name: sampleUser.name
          });
        }
      }
      
      totalUsers = usersSnapshot.size;
      
      // Count businesses, creators, and customers
      const roleBreakdown: Record<string, number> = {};
      usersSnapshot.docs.forEach(userDoc => {
        const userData = userDoc.data();
        const roleKey = userData.role || userData.accountType || 'unknown';
        roleBreakdown[roleKey] = (roleBreakdown[roleKey] || 0) + 1;
        
        if (userData.role === 'BUSINESS' || userData.accountType === 'business') {
          // Differentiate between Level 1 (aspiring) and Level 2+ (active)
          const businessLevel = userData.businessLevel || userData.level || 1;
          if (businessLevel === 1) {
            aspiringBusinesses++;
          } else {
            activeBusinesses++;
          }
        } else if (userData.role === 'CREATOR' || userData.accountType === 'creator') {
          verifiedCreators++;
        } else if (userData.role === 'MEMBER' || userData.accountType === 'member' || !userData.role) {
          customers++;
        }
      });
      
      console.log(`[Countries Stats] ${countryCode} breakdown:`, {
        totalUsers,
        activeBusinesses,
        aspiringBusinesses,
        verifiedCreators,
        customers,
        roleBreakdown
      });
      
    } catch (error) {
      console.error(`[Countries Stats] ❌ Error calculating stats for ${countryCode}:`, error);
      // Fall back to stored stats if query fails
      totalUsers = data.stats?.totalUsers || 0;
      activeBusinesses = data.stats?.activeBusinesses || 0;
      aspiringBusinesses = data.stats?.aspiringBusinesses || 0;
      verifiedCreators = data.stats?.verifiedCreators || 0;
      customers = data.stats?.customers || 0;
      console.log(`[Countries Stats] Using fallback stats for ${countryCode}:`, {
        totalUsers,
        activeBusinesses,
        verifiedCreators
      });
    }
    
    return {
      id: doc.id,
      ...data,
      stats: {
        totalUsers,
        activeBusinesses,
        aspiringBusinesses,
        verifiedCreators,
        customers,
        activeMissions: data.stats?.activeMissions || 0,
      },
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
  }));
  
  return countries as Country[];
}

export async function getCountryById(countryId: string): Promise<Country | null> {
  const doc = await db.collection('countries').doc(countryId).get();
  if (!doc.exists) return null;

  const data = doc.data()!;
  const countryCode = data.countryId || data.code || doc.id;
  const phoneCode = COUNTRY_PHONE_CODES[countryCode];
  
  // Calculate real-time stats
  let totalUsers = 0;
  let activeBusinesses = 0;
  let aspiringBusinesses = 0;
  let verifiedCreators = 0;
  let customers = 0;
  
  try {
    // First try: Query by operatingCountry (new field - ISO country code)
    let usersSnapshot = await db.collection('users')
      .where('operatingCountry', '==', countryCode)
      .limit(1000)
      .get();
    
    // Fallback: If no results, try countryCode field (phone code format like "+49")
    if (usersSnapshot.empty && phoneCode) {
      usersSnapshot = await db.collection('users')
        .where('countryCode', '==', phoneCode)
        .limit(1000)
        .get();
    }
    
    totalUsers = usersSnapshot.size;
    
    // Count businesses, creators, and customers
    usersSnapshot.docs.forEach(userDoc => {
      const userData = userDoc.data();
      if (userData.role === 'BUSINESS' || userData.accountType === 'business') {
        // Differentiate between Level 1 (aspiring) and Level 2+ (active)
        const businessLevel = userData.businessLevel || userData.level || 1;
        if (businessLevel === 1) {
          aspiringBusinesses++;
        } else {
          activeBusinesses++;
        }
      } else if (userData.role === 'CREATOR' || userData.accountType === 'creator') {
        verifiedCreators++;
      } else if (userData.role === 'MEMBER' || userData.accountType === 'member' || !userData.role) {
        customers++;
      }
    });
  } catch (error) {
    console.error(`[getCountryById] Error calculating stats for ${countryCode}:`, error);
    // Fall back to stored stats if query fails
    totalUsers = data.stats?.totalUsers || 0;
    activeBusinesses = data.stats?.activeBusinesses || 0;
    aspiringBusinesses = data.stats?.aspiringBusinesses || 0;
    verifiedCreators = data.stats?.verifiedCreators || 0;
    customers = data.stats?.customers || 0;
  }
  
  return {
    id: doc.id,
    ...data,
    stats: {
      totalUsers,
      activeBusinesses,
      aspiringBusinesses,
      verifiedCreators,
      customers,
      activeMissions: data.stats?.activeMissions || 0,
    },
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

  // If status is being changed, add to history
  if (data.status) {
    const countryRef = db.collection('countries').doc(countryId);
    const countryDoc = await countryRef.get();
    const currentData = countryDoc.data();
    
    if (currentData && currentData.status !== data.status) {
      const historyEntry = {
        status: data.status,
        changedAt: Timestamp.now(),
        changedBy: updatedBy,
        reason: `Status changed from ${currentData.status} to ${data.status}`,
      };
      
      const currentHistory = currentData.statusHistory || [];
      updateData.statusHistory = [...currentHistory, historyEntry];
    }
  }

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
  
  // Get current status for history
  const countryRef = db.collection('countries').doc(countryId);
  const countryDoc = await countryRef.get();
  const currentData = countryDoc.data();
  const currentHistory = currentData?.statusHistory || [];
  
  await countryRef.update({
    status: CountryStatus.ACTIVE,
    launchedAt: now,
    updatedAt: now,
    updatedBy: launchedBy,
    statusHistory: [
      ...currentHistory,
      {
        status: CountryStatus.ACTIVE,
        changedAt: now,
        changedBy: launchedBy,
        reason: 'Country officially launched',
      },
    ],
  });
}

export async function suspendCountry(
  countryId: string,
  reason: string,
  suspendedBy: string
): Promise<void> {
  const now = Timestamp.now();
  
  // Get current status for history
  const countryRef = db.collection('countries').doc(countryId);
  const countryDoc = await countryRef.get();
  const currentData = countryDoc.data();
  const currentHistory = currentData?.statusHistory || [];
  
  await countryRef.update({
    status: CountryStatus.SUSPENDED,
    suspensionReason: reason,
    suspendedAt: now,
    suspendedBy,
    updatedAt: now,
    updatedBy: suspendedBy,
    statusHistory: [
      ...currentHistory,
      {
        status: CountryStatus.SUSPENDED,
        changedAt: now,
        changedBy: suspendedBy,
        reason: `Country suspended: ${reason}`,
      },
    ],
  });
}
