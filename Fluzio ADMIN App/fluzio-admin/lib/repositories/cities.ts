import { db } from '@/lib/firebase/admin';
import { collection, query, where, orderBy, limit as limitFn, getDocs } from '@/lib/firebase/firestoreCompat';
import { City, CityStatus } from '@/lib/types';

export async function getCitiesByCountry(
  countryCode: string,
  status?: CityStatus
): Promise<City[]> {
  try {
    console.log(`[getCitiesByCountry] Querying cities for country: ${countryCode}, status: ${status || 'all'}`);
    
    let q = status 
      ? query(collection(db, 'cities'), where('countryCode', '==', countryCode), where('status', '==', status), orderBy('name', 'asc'))
      : query(collection(db, 'cities'), where('countryCode', '==', countryCode), orderBy('name', 'asc'));

    const snapshot = await getDocs(q);
    console.log(`[getCitiesByCountry] Found ${snapshot.docs?.length || 0} cities`);
    
    if (!snapshot.docs || snapshot.docs.length === 0) {
      return [];
    }
    
    return snapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
        stats: data.stats ? {
          ...data.stats,
          lastUpdated: data.stats.lastUpdated?.toDate?.() || new Date(),
        } : undefined,
      } as City;
    });
  } catch (error: any) {
    console.error('[getCitiesByCountry] Error:', error.message || error);
    // Return empty array instead of throwing - cities might not exist yet
    return [];
  }
}

export async function getAllCities(limitNum?: number): Promise<City[]> {
  try {
    console.log(`[getAllCities] Querying all cities, limit: ${limitNum || 'none'}`);
    
    let q = limitNum
      ? query(collection(db, 'cities'), orderBy('name', 'asc'), limitFn(limitNum))
      : query(collection(db, 'cities'), orderBy('name', 'asc'));

    const snapshot = await getDocs(q);
    console.log(`[getAllCities] Found ${snapshot.docs?.length || 0} cities`);
    
    if (!snapshot.docs || snapshot.docs.length === 0) {
      return [];
    }
    
    return snapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
        stats: data.stats ? {
          ...data.stats,
          lastUpdated: data.stats.lastUpdated?.toDate?.() || new Date(),
        } : undefined,
      } as City;
    });
  } catch (error: any) {
    console.error('[getAllCities] Error:', error.message || error);
    // Return empty array instead of throwing - cities might not exist yet
    return [];
  }
}
