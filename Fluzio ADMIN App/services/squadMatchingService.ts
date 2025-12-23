import { User, UserRole } from '../types';

export interface NearbyCityInfo {
  city: string;
  distance: number; // in km
  userCount: number;
  users: User[];
}

export interface SquadMatchResult {
  hasSquad: boolean;
  members: User[];
  city: string;
  message?: string;
  nearbyCities?: NearbyCityInfo[];
}

// Haversine formula to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function findSquadMembers(
  currentUser: User, 
  allUsers: User[], 
  maxDistance: number = 50 // km within same city
): SquadMatchResult {
  // Only business users can be in squads
  if (currentUser.role !== UserRole.BUSINESS) {
    return {
      hasSquad: false,
      members: [],
      city: currentUser.geo?.city || currentUser.homeCity || 'Unknown',
      message: 'Squad feature is only available for business accounts.'
    };
  }

  const currentCity = currentUser.geo?.city || currentUser.homeCity;
  const currentLat = currentUser.geo?.latitude;
  const currentLon = currentUser.geo?.longitude;

  if (!currentCity || !currentLat || !currentLon) {
    return {
      hasSquad: false,
      members: [currentUser],
      city: 'Unknown',
      message: 'Location information not available. Please update your profile.'
    };
  }

  // Find business users in the same city (excluding current user)
  const sameCityUsers = allUsers.filter(user => 
    user.role === UserRole.BUSINESS &&
    user.id !== currentUser.id &&
    (user.geo?.city === currentCity || user.homeCity === currentCity) &&
    user.geo?.latitude && 
    user.geo?.longitude &&
    calculateDistance(currentLat, currentLon, user.geo.latitude, user.geo.longitude) <= maxDistance
  );

  // If we have 1-3 other users in the city (squad size 2-4 total including current user)
  if (sameCityUsers.length > 0) {
    const squadMembers = [currentUser, ...sameCityUsers.slice(0, 3)]; // Max 4 total
    return {
      hasSquad: true,
      members: squadMembers,
      city: currentCity,
      message: squadMembers.length === 4 
        ? `Full squad of 4 found in ${currentCity}!`
        : `Squad of ${squadMembers.length} found in ${currentCity}. We'll notify you when more members join!`
    };
  }

  // No users in same city - find nearby cities
  const nearbyCitiesMap = new Map<string, { users: User[], lat: number, lon: number }>();

  allUsers.forEach(user => {
    if (
      user.role === UserRole.BUSINESS &&
      user.id !== currentUser.id &&
      user.geo?.city &&
      user.geo?.city !== currentCity &&
      user.geo?.latitude &&
      user.geo?.longitude
    ) {
      const distance = calculateDistance(currentLat, currentLon, user.geo.latitude, user.geo.longitude);
      
      // Only consider cities within 200km
      if (distance <= 200) {
        const cityData = nearbyCitiesMap.get(user.geo.city) || { 
          users: [], 
          lat: user.geo.latitude, 
          lon: user.geo.longitude 
        };
        cityData.users.push(user);
        nearbyCitiesMap.set(user.geo.city, cityData);
      }
    }
  });

  // Convert to array and calculate distances
  const nearbyCities: NearbyCityInfo[] = Array.from(nearbyCitiesMap.entries())
    .map(([city, data]) => ({
      city,
      distance: Math.round(calculateDistance(currentLat, currentLon, data.lat, data.lon)),
      userCount: data.users.length,
      users: data.users
    }))
    .sort((a, b) => a.distance - b.distance) // Sort by distance
    .slice(0, 5); // Top 5 nearby cities

  return {
    hasSquad: false,
    members: [currentUser],
    city: currentCity,
    message: `No other businesses found in ${currentCity} yet.`,
    nearbyCities: nearbyCities.length > 0 ? nearbyCities : undefined
  };
}

// Get city representation for a user
export function getUserCity(user: User): string {
  return user.geo?.city || user.homeCity || user.currentCity || 'Unknown';
}

// Update user's location to a new city (for joining nearby squads)
export function updateUserCity(user: User, newCity: string, lat?: number, lon?: number): User {
  return {
    ...user,
    geo: lat && lon ? {
      ...user.geo,
      city: newCity,
      latitude: lat,
      longitude: lon
    } : user.geo,
    homeCity: newCity,
    currentCity: newCity
  };
}
