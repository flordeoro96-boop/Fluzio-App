/**
 * City name standardization utility for Admin App
 * Normalizes city names to their English equivalents for consistent data
 */

// Comprehensive mapping of city names to their English standard form
export const CITY_NAME_MAPPINGS: Record<string, string> = {
  // German cities
  'münchen': 'Munich',
  'munchen': 'Munich',
  'köln': 'Cologne',
  'koln': 'Cologne',
  'nürnberg': 'Nuremberg',
  'nurnberg': 'Nuremberg',
  'braunschweig': 'Brunswick',
  
  // Austrian cities
  'wien': 'Vienna',
  
  // Spanish cities
  'sevilla': 'Seville',
  'zaragoza': 'Zaragoza',
  'málaga': 'Malaga',
  'malaga': 'Malaga',
  
  // French cities
  'paris': 'Paris',
  'marseille': 'Marseille',
  'lyon': 'Lyon',
  
  // Italian cities
  'roma': 'Rome',
  'milano': 'Milan',
  'firenze': 'Florence',
  'venezia': 'Venice',
  'napoli': 'Naples',
  'torino': 'Turin',
  
  // Portuguese cities
  'lisboa': 'Lisbon',
  
  // Dutch cities
  'den haag': 'The Hague',
  's-gravenhage': 'The Hague',
  
  // Polish cities
  'warszawa': 'Warsaw',
  'kraków': 'Krakow',
  'krakow': 'Krakow',
  
  // Czech cities
  'praha': 'Prague',
  
  // Add more as needed
};

/**
 * Normalizes a city name to its standard English form
 * @param cityName - The city name to normalize
 * @returns The standardized city name in English
 */
export function standardizeCityName(cityName: string | undefined | null): string {
  if (!cityName) return '';
  
  // Remove extra whitespace and trim
  const cleaned = cityName.trim().replace(/\s+/g, ' ');
  
  // Normalize to NFD and remove diacritics for comparison
  const normalized = cleaned
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  
  // Check if we have a mapping for this city
  const standardName = CITY_NAME_MAPPINGS[normalized];
  
  if (standardName) {
    console.log(`[standardizeCityName] Mapped "${cityName}" -> "${standardName}"`);
    return standardName;
  }
  
  // If no mapping found, return with proper capitalization
  // Capitalize first letter of each word
  const capitalized = cleaned
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
    
  console.log(`[standardizeCityName] Capitalized "${cityName}" -> "${capitalized}"`);
  return capitalized;
}
