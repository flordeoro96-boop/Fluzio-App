import { db } from '@/lib/firebase/admin';
import { City, CityStatus } from '@/lib/types';

export async function getCitiesByCountry(
  countryCode: string,
  status?: CityStatus
): Promise<City[]> {
  try {
    console.log(`[getCitiesByCountry] Querying cities for country: ${countryCode}, status: ${status || 'all'}`);
    
    let query = db.collection('cities').where('countryCode', '==', countryCode);

    if (status) {
      query = query.where('status', '==', status) as any;
    }
    
    query = query.orderBy('name', 'asc') as any;

    const snapshot = await query.get();
    console.log(`[getCitiesByCountry] Found ${snapshot.size} cities`);
    
    if (snapshot.empty) {
      return [];
    }
    
    return snapshot.docs.map((doc) => {
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

export async function getAllCities(limit?: number): Promise<City[]> {
  try {
    console.log(`[getAllCities] Querying all cities, limit: ${limit || 'none'}`);
    
    let query = db.collection('cities').orderBy('name', 'asc');

    if (limit) {
      query = query.limit(limit) as any;
    }

    const snapshot = await query.get();
    console.log(`[getAllCities] Found ${snapshot.size} cities`);
    
    if (snapshot.empty) {
      return [];
    }
    
    return snapshot.docs.map((doc) => {
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
