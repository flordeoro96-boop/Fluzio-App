'use server';

import { getCitiesByCountry, getAllCities } from '@/lib/repositories/cities';
import { City, CityStatus } from '@/lib/types';

export async function getCitiesByCountryAction(
  countryCode: string,
  status?: CityStatus
): Promise<City[]> {
  return await getCitiesByCountry(countryCode, status);
}

export async function getAllCitiesAction(limit?: number): Promise<City[]> {
  return await getAllCities(limit);
}
