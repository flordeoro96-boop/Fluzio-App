'use server';

import { db, getAdminAuth } from '@/lib/firebase/admin';
import { collection, doc, getDoc, getDocs, setDoc } from '@/lib/firebase/firestoreCompat';
import { cookies } from 'next/headers';

async function getAuthenticatedAdmin() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;

  if (!sessionCookie) {
    throw new Error('Not authenticated - no session cookie');
  }

  const auth = getAdminAuth();
  const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
  const uid = decodedToken.uid;

  // Get admin doc
  const adminDoc = await getDoc(doc(db, 'users', uid));
  if (!adminDoc.exists) {
    throw new Error('Admin not found');
  }

  const adminData = adminDoc.data();
  if (adminData?.role !== 'SUPER_ADMIN' && adminData?.role !== 'ADMIN') {
    throw new Error('Not an admin');
  }

  if (adminData?.status !== 'ACTIVE') {
    throw new Error('Admin account not active');
  }

  return {
    uid,
    email: adminData.email,
    role: adminData.role,
    countryScopes: adminData.countryScopes || [],
    status: adminData.status,
  };
}

// City name normalization mapping
const CITY_NAME_MAPPINGS: Record<string, string> = {
  'München': 'Munich',
  'Munchen': 'Munich',
  'munich': 'Munich',
  'MUNICH': 'Munich',
};

function normalizeCityName(cityName: string): string {
  if (!cityName) return '';
  const trimmed = cityName.trim();
  return CITY_NAME_MAPPINGS[trimmed] || trimmed;
}

export async function populateCitiesAction() {
  try {
    // Check admin permissions
    const admin = await getAuthenticatedAdmin();
    if (!admin.countryScopes.includes('GLOBAL')) {
      throw new Error('Only GLOBAL admins can populate cities');
    }

    console.log('🏙️  Starting city metrics aggregation...');
    
    // Get all users
    const usersSnapshot = await getDocs(collection(db, 'users'));
    console.log(`📊 Found ${usersSnapshot.size} total users`);
    
    // Group users by city and country
    const cityMap = new Map<string, any>();
    
    usersSnapshot.docs.forEach(doc => {
      const user = doc.data();
      const rawCity = user.city || user.homeCity || user.geo?.city;
      
      // Determine country code
      let countryCode = user.operatingCountry;
      if (!countryCode && user.countryCode) {
        // Map phone codes to country codes
        const phoneToCountry: Record<string, string> = {
          '+49': 'DE',
          '+507': 'PA',
          '+971': 'AE',
          '+1': 'US',
          '+44': 'GB',
        };
        countryCode = phoneToCountry[user.countryCode];
      }
      
      if (!rawCity || !countryCode) return;
      
      const normalizedCity = normalizeCityName(rawCity);
      const cityKey = `${normalizedCity}_${countryCode}`;
      
      if (!cityMap.has(cityKey)) {
        cityMap.set(cityKey, {
          name: normalizedCity,
          countryCode,
          totalUsers: 0,
          businesses: 0,
          creators: 0,
          members: 0,
          activeMissions: 0,
        });
      }
      
      const cityData = cityMap.get(cityKey)!;
      cityData.totalUsers++;
      
      if (user.role === 'BUSINESS' || user.accountType === 'business') {
        cityData.businesses++;
      } else if (user.role === 'CREATOR' || user.accountType === 'creator') {
        cityData.creators++;
      } else if (user.role === 'MEMBER' || user.accountType === 'member') {
        cityData.members++;
      }
    });
    
    console.log(`🏙️  Found ${cityMap.size} unique cities`);
    
    // Write to Firestore
    const results = [];
    for (const [cityKey, data] of cityMap.entries()) {
      const cityId = cityKey.replace(/[^a-zA-Z0-9_-]/g, '_');
      const cityRef = doc(db, 'cities', cityId);
      
      await setDoc(cityRef, {
        name: data.name,
        countryCode: data.countryCode,
        status: 'ACTIVE',
        stats: {
          totalUsers: data.totalUsers,
          businesses: data.businesses,
          creators: data.creators,
          members: data.members,
          activeMissions: data.activeMissions,
          lastUpdated: new Date(),
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }, { merge: true });
      
      results.push({
        name: data.name,
        country: data.countryCode,
        users: data.totalUsers,
        businesses: data.businesses,
        creators: data.creators,
      });
      
      console.log(`  ✅ ${data.name}, ${data.countryCode}: ${data.totalUsers} users (${data.businesses} businesses, ${data.creators} creators)`);
    }
    
    return {
      success: true,
      citiesCreated: results.length,
      cities: results,
    };
    
  } catch (error: any) {
    console.error('❌ Error aggregating city metrics:', error);
    throw new Error(`Failed to populate cities: ${error.message}`);
  }
}
