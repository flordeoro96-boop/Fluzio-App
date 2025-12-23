'use server';

import { getAdminAuth } from '@/lib/firebase/admin';
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
import {
  createCountrySchema,
  updateCountrySchema,
  suspendCountrySchema,
  CreateCountryInput,
  UpdateCountryInput,
  SuspendCountryInput,
} from '@/lib/schemas/country';
import { Country, CountryStatus, LaunchChecklistItem } from '@/lib/types';
import { cookies } from 'next/headers';

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
  if (
    country &&
    !admin.countryScopes.includes('GLOBAL') &&
    !admin.countryScopes.includes(country.code)
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
      countryCode: country.code,
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
