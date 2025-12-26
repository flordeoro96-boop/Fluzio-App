'use server';

import { getAdminAuth, db } from '@/lib/firebase/admin';
import { getAdminById } from '@/lib/repositories/admins';
import { canAccess, Resource, Action } from '@/lib/permissions/rbac';
import { writeAuditLog } from '@/lib/repositories/audit';
import {
  getCountries,
  getCountryById,
  getCountryByCode,
  createCountry,
  updateCountry,
  updateLaunchChecklist,
  launchCountry,
  suspendCountry,
} from '@/lib/repositories/countries';
import { getCitiesByCountry, getAllCities } from '@/lib/repositories/cities';
import {
  createCountrySchema,
  updateCountrySchema,
  suspendCountrySchema,
  CreateCountryInput,
  UpdateCountryInput,
  SuspendCountryInput,
} from '@/lib/schemas/country';
import { Country, CountryStatus, LaunchChecklistItem, City, CityStatus } from '@/lib/types';
import { cookies } from 'next/headers';
import { standardizeCityName } from '@/lib/utils/cityStandardization';

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

// Create a new country
export async function createCountryAction(input: CreateCountryInput): Promise<Country> {
  try {
    const admin = await getAuthenticatedAdmin();

    if (!canAccess(admin, Resource.COUNTRIES, Action.CREATE)) {
      throw new Error('Insufficient permissions to create countries');
    }

    // Validate input
    const validated = createCountrySchema.parse(input);

    // Check if country code already exists
    const existing = await getCountryByCode(validated.code);
    if (existing) {
      throw new Error(`Country with code ${validated.code} already exists`);
    }

    // Create default launch checklist
    const defaultChecklist: LaunchChecklistItem[] = [
      {
        id: '1',
        title: 'Legal & Compliance Review',
        description: 'Complete legal setup and compliance requirements',
        required: true,
        completed: false,
      },
      {
        id: '2',
        title: 'Payment Gateway Setup',
        description: 'Set up local payment processing',
        required: true,
        completed: false,
      },
      {
        id: '3',
        title: 'Customer Support Setup',
        description: 'Set up local customer support team',
        required: true,
        completed: false,
      },
      {
        id: '4',
        title: 'Content Moderation Rules',
        description: 'Set up content moderation policies',
        required: true,
        completed: false,
      },
      {
        id: '5',
        title: 'Initial Business Partnerships',
        description: 'Onboard initial business partners',
        required: false,
        completed: false,
      },
    ];

    // Create country with default checklist
    const newCountry = await createCountry({
      ...validated,
      status: CountryStatus.SETUP,
      launchChecklist: defaultChecklist,
      createdBy: admin.uid,
    });

    // Write audit log
    await writeAuditLog({
      adminId: admin.uid,
      action: 'create_country',
      resource: 'countries',
      resourceId: newCountry.id,
      details: { code: validated.code, name: validated.name },
      ipAddress: '',
      userAgent: '',
    });

    // Serialize dates
    return JSON.parse(JSON.stringify(newCountry));
  } catch (error: any) {
    console.error('Create country error:', error);
    throw new Error(error.message || 'Failed to create country');
  }
}

export async function getCountriesAction(): Promise<Country[]> {
  const admin = await getAuthenticatedAdmin();

  if (!canAccess(admin, Resource.COUNTRIES, Action.READ)) {
    throw new Error('Permission denied');
  }

  const countries = await getCountries(admin.countryScopes);
  
  // Force JSON serialization to remove all Firestore Timestamps
  return JSON.parse(JSON.stringify(countries));
}

export async function getCountryByIdAction(countryId: string): Promise<Country | null> {
  const admin = await getAuthenticatedAdmin();

  if (!canAccess(admin, Resource.COUNTRIES, Action.READ)) {
    throw new Error('Permission denied');
  }

  const country = await getCountryById(countryId);

  // Check country scope
  const countryCode = country?.countryId || country?.code || country?.id;
  if (
    country &&
    countryCode &&
    !admin.countryScopes.includes('GLOBAL') &&
    !admin.countryScopes.includes(countryCode)
  ) {
    throw new Error('Access denied to this country');
  }

  if (!country) return null;

  // Force JSON serialization to remove all Firestore Timestamps
  return JSON.parse(JSON.stringify(country));
}

export async function updateCountryAction(
  countryId: string,
  input: UpdateCountryInput
): Promise<void> {
  const admin = await getAuthenticatedAdmin();

  if (!canAccess(admin, Resource.COUNTRIES, Action.UPDATE)) {
    throw new Error('Permission denied');
  }

  const country = await getCountryById(countryId);
  if (!country) {
    throw new Error('Country not found');
  }

  // Check country scope
  if (
    !admin.countryScopes.includes('GLOBAL') &&
    !admin.countryScopes.includes(country.code)
  ) {
    throw new Error('Access denied to this country');
  }

  const validatedData = updateCountrySchema.parse(input);

  await updateCountry(countryId, validatedData, admin.uid);

  await writeAuditLog({
    adminId: admin.uid,
    action: 'UPDATE_COUNTRY',
    resource: 'countries',
    resourceId: countryId,
    details: {
      changes: validatedData,
    },
    ipAddress: '',
    userAgent: '',
  });
}

export async function updateChecklistAction(
  countryId: string,
  checklist: LaunchChecklistItem[]
): Promise<void> {
  const admin = await getAuthenticatedAdmin();

  if (!canAccess(admin, Resource.COUNTRIES, Action.UPDATE)) {
    throw new Error('Permission denied');
  }

  const country = await getCountryById(countryId);
  if (!country) {
    throw new Error('Country not found');
  }

  if (
    !admin.countryScopes.includes('GLOBAL') &&
    !admin.countryScopes.includes(country.code)
  ) {
    throw new Error('Access denied to this country');
  }

  await updateLaunchChecklist(countryId, checklist, admin.uid);

  await writeAuditLog({
    adminId: admin.uid,
    action: 'UPDATE_LAUNCH_CHECKLIST',
    resource: 'countries',
    resourceId: countryId,
    details: {
      checklist,
    },
    ipAddress: '',
    userAgent: '',
  });
}

export async function launchCountryAction(countryId: string): Promise<void> {
  const admin = await getAuthenticatedAdmin();

  if (!canAccess(admin, Resource.COUNTRIES, Action.UPDATE)) {
    throw new Error('Permission denied');
  }

  const country = await getCountryById(countryId);
  if (!country) {
    throw new Error('Country not found');
  }

  if (
    !admin.countryScopes.includes('GLOBAL') &&
    !admin.countryScopes.includes(country.code)
  ) {
    throw new Error('Access denied to this country');
  }

  // Check if all required checklist items are completed
  const incompleteRequired = country.launchChecklist.filter(
    (item) => item.required && !item.completed
  );

  if (incompleteRequired.length > 0) {
    throw new Error('All required checklist items must be completed before launch');
  }

  await launchCountry(countryId, admin.uid);

  await writeAuditLog({
    adminId: admin.uid,
    action: 'LAUNCH_COUNTRY',
    resource: 'countries',
    resourceId: countryId,
    details: {
      countryCode: country.countryId || country.code || countryId,
      countryName: country.name,
    },
    ipAddress: '',
    userAgent: '',
  });
}

export async function suspendCountryAction(
  countryId: string,
  input: SuspendCountryInput
): Promise<void> {
  const admin = await getAuthenticatedAdmin();

  if (!canAccess(admin, Resource.COUNTRIES, Action.UPDATE)) {
    throw new Error('Permission denied');
  }

  const country = await getCountryById(countryId);
  if (!country) {
    throw new Error('Country not found');
  }

  if (
    !admin.countryScopes.includes('GLOBAL') &&
    !admin.countryScopes.includes(country.code)
  ) {
    throw new Error('Access denied to this country');
  }

  const validatedData = suspendCountrySchema.parse(input);

  await suspendCountry(countryId, validatedData.reason, admin.uid);

  await writeAuditLog({
    adminId: admin.uid,
    action: 'SUSPEND_COUNTRY',
    resource: 'countries',
    resourceId: countryId,
    details: {
      countryCode: country.code,
      countryName: country.name,
      reason: validatedData.reason,
    },
    ipAddress: '',
    userAgent: '',
  });
}

// ============================================================================
// CITY ACTIONS
// ============================================================================

export async function getCitiesByCountryAction(
  countryCode: string,
  status?: CityStatus
): Promise<City[]> {
  try {
    const admin = await getAuthenticatedAdmin();
    
    // Check if admin has access to this country
    if (
      !admin.countryScopes.includes('GLOBAL') &&
      !admin.countryScopes.includes(countryCode)
    ) {
      throw new Error('Access denied to this country');
    }

    // Query users directly and group by city
    const phoneCode = COUNTRY_PHONE_CODES[countryCode];
    const usersSnapshot = await db.collection('users')
      .where('countryCode', '==', phoneCode)
      .limit(1000)
      .get();
    
    // Group users by city (using standardized names)
    const cityMap = new Map<string, any>();
    
    usersSnapshot.docs.forEach(doc => {
      const user = doc.data();
      const rawCityName = user.city || user.homeCity || user.geo?.city;
      
      if (!rawCityName) return;
      
      // Standardize the city name to English
      const standardizedCity = standardizeCityName(rawCityName);
      
      if (!cityMap.has(standardizedCity)) {
        cityMap.set(standardizedCity, {
          id: standardizedCity.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase(),
          name: standardizedCity, // Use standardized English name
          countryCode,
          status: 'ACTIVE' as CityStatus,
          stats: {
            totalUsers: 0,
            activeBusinesses: 0,
            verifiedCreators: 0,
            members: 0,
            activeMissions: 0,
            lastUpdated: new Date(),
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      
      const cityData = cityMap.get(standardizedCity)!;
      cityData.stats.totalUsers++;
      
      if (user.role === 'BUSINESS' || user.accountType === 'business') {
        cityData.stats.activeBusinesses++;
      } else if (user.role === 'CREATOR' || user.accountType === 'creator') {
        cityData.stats.verifiedCreators++;
      } else if (user.role === 'MEMBER' || user.accountType === 'member') {
        cityData.stats.members++;
      }
    });
    
    // Convert to array and sort by name
    return Array.from(cityMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    
  } catch (error: any) {
    console.error('[getCitiesByCountryAction] Error:', error);
    throw error;
  }
}

// Map country ISO codes to phone codes
const COUNTRY_PHONE_CODES: Record<string, string> = {
  'DE': '+49',
  'AE': '+971',
  'US': '+1',
  'GB': '+44',
  'FR': '+33',
  'ES': '+34',
  'IT': '+39',
  'PA': '+507',
};

export async function getAllCitiesAction(limit?: number): Promise<City[]> {
  try {
    const admin = await getAuthenticatedAdmin();
    
    // Only GLOBAL admins can view all cities
    if (!admin.countryScopes.includes('GLOBAL')) {
      throw new Error('Access denied - GLOBAL scope required');
    }

    return await getAllCities(limit);
  } catch (error: any) {
    console.error('[getAllCitiesAction] Error:', error);
    throw error;
  }
}

// ============================================================================
// Get Businesses by Country
// ============================================================================

export async function getBusinessesByCountryAction(
  countryCode: string,
  limit: number = 100
): Promise<any[]> {
  try {
    const admin = await getAuthenticatedAdmin();
    
    // Check if admin has access to this country
    if (
      !admin.countryScopes.includes('GLOBAL') &&
      !admin.countryScopes.includes(countryCode)
    ) {
      throw new Error('Access denied to this country');
    }

    const phoneCode = COUNTRY_PHONE_CODES[countryCode];
    const usersSnapshot = await db.collection('users')
      .where('countryCode', '==', phoneCode)
      .where('role', '==', 'BUSINESS')
      .limit(limit)
      .get();
    
    const businesses = usersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        email: data.email,
        photoUrl: data.photoUrl,
        city: data.city,
        homeCity: data.homeCity,
        category: data.category,
        businessLevel: data.businessLevel,
        level: data.level,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      };
    });

    return businesses;
  } catch (error: any) {
    console.error('[getBusinessesByCountryAction] Error:', error);
    throw error;
  }
}

// ============================================================================
// Get Creators by Country
// ============================================================================

export async function getCreatorsByCountryAction(
  countryCode: string,
  limit: number = 100
): Promise<any[]> {
  try {
    const admin = await getAuthenticatedAdmin();
    
    // Check if admin has access to this country
    if (
      !admin.countryScopes.includes('GLOBAL') &&
      !admin.countryScopes.includes(countryCode)
    ) {
      throw new Error('Access denied to this country');
    }

    const phoneCode = COUNTRY_PHONE_CODES[countryCode];
    const usersSnapshot = await db.collection('users')
      .where('countryCode', '==', phoneCode)
      .where('role', '==', 'CREATOR')
      .limit(limit)
      .get();
    
    const creators = usersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        email: data.email,
        photoUrl: data.photoUrl,
        city: data.city,
        homeCity: data.homeCity,
        category: data.category,
        verificationStatus: data.verificationStatus,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      };
    });

    return creators;
  } catch (error: any) {
    console.error('[getCreatorsByCountryAction] Error:', error);
    throw error;
  }
}

/**
 * Update country metadata (for unknown countries that need review)
 */
export async function updateCountryMetadataAction(
  countryCode: string,
  metadata: {
    name: string;
    flag: string;
    currency: string;
    language: string;
    timezone: string;
  }
): Promise<void> {
  try {
    const admin = await getAuthenticatedAdmin();
    
    // Check if admin has access to this country
    if (
      !admin.countryScopes.includes('GLOBAL') &&
      !admin.countryScopes.includes(countryCode)
    ) {
      throw new Error('Access denied to this country');
    }

    const countryRef = db.collection('countries').doc(countryCode);
    const countryDoc = await countryRef.get();
    
    if (!countryDoc.exists) {
      throw new Error('Country not found');
    }

    await countryRef.update({
      ...metadata,
      needsReview: false, // Clear the review flag
      updatedAt: new Date(),
      updatedBy: admin.uid,
    });

    // Log the action
    await writeAuditLog({
      action: 'UPDATE_COUNTRY_METADATA',
      resource: Resource.COUNTRIES,
      resourceId: countryCode,
      adminId: admin.uid,
      details: `Updated metadata for ${countryCode}: ${metadata.name}`,
      ipAddress: 'system', // Server-side action
      userAgent: 'Admin Dashboard',
    });
  } catch (error: any) {
    console.error('[updateCountryMetadataAction] Error:', error);
    throw error;
  }
}
