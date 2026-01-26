import { db } from './apiService';
import { collection, query, where, getDocs, Timestamp } from '../services/firestoreCompat';

/**
 * Smart Route Planning Service
 * Optimizes multi-mission routes for maximum efficiency
 */

export interface MissionStop {
  missionId: string;
  businessId: string;
  businessName: string;
  address: string;
  coordinates: { latitude: number; longitude: number };
  estimatedDuration: number; // minutes
  points: number;
  category: string;
}

export interface OptimizedRoute {
  stops: MissionStop[];
  totalDistance: number; // meters
  totalDuration: number; // minutes
  totalPoints: number;
  estimatedWalkingTime: number; // minutes
  efficiency: number; // points per minute
  routePath: Array<{ lat: number; lng: number }>;
  savings: {
    originalDistance: number;
    optimizedDistance: number;
    timeSaved: number; // minutes
  };
}

export interface RouteRecommendation {
  route: OptimizedRoute;
  description: string;
  benefits: string[];
  difficulty: 'EASY' | 'MODERATE' | 'CHALLENGING';
}

/**
 * Calculate distance between two coordinates
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calculate total route distance
 */
function calculateRouteDistance(stops: MissionStop[]): number {
  let total = 0;
  for (let i = 0; i < stops.length - 1; i++) {
    const curr = stops[i].coordinates;
    const next = stops[i + 1].coordinates;
    total += calculateDistance(curr.latitude, curr.longitude, next.latitude, next.longitude);
  }
  return total;
}

/**
 * Optimize route using nearest neighbor algorithm
 */
function optimizeRouteOrder(
  start: { latitude: number; longitude: number },
  missions: MissionStop[]
): MissionStop[] {
  if (missions.length === 0) return [];
  if (missions.length === 1) return missions;
  
  const optimized: MissionStop[] = [];
  const remaining = [...missions];
  let current = start;
  
  // Greedy nearest neighbor
  while (remaining.length > 0) {
    let nearest = remaining[0];
    let nearestDist = calculateDistance(
      current.latitude,
      current.longitude,
      nearest.coordinates.latitude,
      nearest.coordinates.longitude
    );
    let nearestIndex = 0;
    
    for (let i = 1; i < remaining.length; i++) {
      const dist = calculateDistance(
        current.latitude,
        current.longitude,
        remaining[i].coordinates.latitude,
        remaining[i].coordinates.longitude
      );
      if (dist < nearestDist) {
        nearest = remaining[i];
        nearestDist = dist;
        nearestIndex = i;
      }
    }
    
    optimized.push(nearest);
    remaining.splice(nearestIndex, 1);
    current = nearest.coordinates;
  }
  
  return optimized;
}

/**
 * Plan optimal route for multiple missions
 */
export async function planOptimalRoute(
  userId: string,
  missionIds: string[],
  startLocation: { latitude: number; longitude: number }
): Promise<OptimizedRoute | null> {
  try {
    if (missionIds.length === 0) return null;
    
    // Fetch mission details
    const missionsRef = collection(db, 'missions');
    const missionStops: MissionStop[] = [];
    
    for (const missionId of missionIds) {
      const missionQuery = query(missionsRef, where('__name__', '==', missionId));
      const missionDocs = await getDocs(missionQuery);
      
      if (missionDocs.empty) continue;
      
      const missionData = missionDocs.docs[0].data();
      
      if (missionData.coordinates) {
        missionStops.push({
          missionId,
          businessId: missionData.businessId,
          businessName: missionData.businessName || 'Unknown Business',
          address: missionData.address || '',
          coordinates: missionData.coordinates,
          estimatedDuration: missionData.missionType === 'IN_PERSON' ? 30 : 10,
          points: missionData.reward?.points || 0,
          category: missionData.category || 'OTHER'
        });
      }
    }
    
    if (missionStops.length === 0) return null;
    
    // Calculate original (unoptimized) route distance
    const originalDistance = calculateRouteDistance(missionStops);
    
    // Optimize route order
    const optimizedStops = optimizeRouteOrder(startLocation, missionStops);
    const optimizedDistance = calculateRouteDistance(optimizedStops);
    
    // Calculate metrics
    const totalPoints = optimizedStops.reduce((sum, stop) => sum + stop.points, 0);
    const totalMissionDuration = optimizedStops.reduce((sum, stop) => sum + stop.estimatedDuration, 0);
    
    // Estimate walking time (average 5 km/h = 83.3 m/min)
    const walkingTime = Math.round(optimizedDistance / 83.3);
    const totalDuration = walkingTime + totalMissionDuration;
    
    const efficiency = totalDuration > 0 ? totalPoints / totalDuration : 0;
    
    // Build route path
    const routePath = [
      { lat: startLocation.latitude, lng: startLocation.longitude },
      ...optimizedStops.map(stop => ({
        lat: stop.coordinates.latitude,
        lng: stop.coordinates.longitude
      }))
    ];
    
    return {
      stops: optimizedStops,
      totalDistance: Math.round(optimizedDistance),
      totalDuration,
      totalPoints,
      estimatedWalkingTime: walkingTime,
      efficiency: Math.round(efficiency * 10) / 10,
      routePath,
      savings: {
        originalDistance: Math.round(originalDistance),
        optimizedDistance: Math.round(optimizedDistance),
        timeSaved: Math.round((originalDistance - optimizedDistance) / 83.3)
      }
    };
  } catch (error) {
    console.error('[Route Planning] Error planning route:', error);
    return null;
  }
}

/**
 * Suggest mission combos based on proximity
 */
export async function suggestMissionCombos(
  userId: string,
  userLocation: { latitude: number; longitude: number },
  maxDistance: number = 2000, // meters
  minMissions: number = 3
): Promise<RouteRecommendation[]> {
  try {
    // Get all active missions near user
    const missionsRef = collection(db, 'missions');
    const activeQuery = query(
      missionsRef,
      where('lifecycleStatus', '==', 'ACTIVE')
    );
    const missions = await getDocs(activeQuery);
    
    const nearbyMissions: MissionStop[] = [];
    
    for (const missionDoc of missions.docs) {
      const data = missionDoc.data();
      
      if (!data.coordinates) continue;
      
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        data.coordinates.latitude,
        data.coordinates.longitude
      );
      
      if (distance <= maxDistance) {
        nearbyMissions.push({
          missionId: missionDoc.id,
          businessId: data.businessId,
          businessName: data.businessName || 'Unknown',
          address: data.address || '',
          coordinates: data.coordinates,
          estimatedDuration: data.missionType === 'IN_PERSON' ? 30 : 10,
          points: data.reward?.points || 0,
          category: data.category || 'OTHER'
        });
      }
    }
    
    if (nearbyMissions.length < minMissions) return [];
    
    // Generate route recommendations
    const recommendations: RouteRecommendation[] = [];
    
    // Recommendation 1: High-value route (top paying missions)
    const highValueMissions = [...nearbyMissions]
      .sort((a, b) => b.points - a.points)
      .slice(0, Math.min(5, nearbyMissions.length));
    
    const highValueRoute = await planOptimalRoute(
      userId,
      highValueMissions.map(m => m.missionId),
      userLocation
    );
    
    if (highValueRoute) {
      recommendations.push({
        route: highValueRoute,
        description: 'Maximum Points Route',
        benefits: [
          `Earn ${highValueRoute.totalPoints} points`,
          `Visit ${highValueRoute.stops.length} top-paying businesses`,
          `Only ${Math.round(highValueRoute.totalDistance / 1000 * 10) / 10}km walking`
        ],
        difficulty: highValueRoute.totalDistance > 1500 ? 'MODERATE' : 'EASY'
      });
    }
    
    // Recommendation 2: Quick route (fastest to complete)
    const quickMissions = [...nearbyMissions]
      .sort((a, b) => a.estimatedDuration - b.estimatedDuration)
      .slice(0, Math.min(4, nearbyMissions.length));
    
    const quickRoute = await planOptimalRoute(
      userId,
      quickMissions.map(m => m.missionId),
      userLocation
    );
    
    if (quickRoute) {
      recommendations.push({
        route: quickRoute,
        description: 'Express Route',
        benefits: [
          `Complete in ~${quickRoute.totalDuration} minutes`,
          `Earn ${quickRoute.totalPoints} points quickly`,
          `Perfect for a quick outing`
        ],
        difficulty: 'EASY'
      });
    }
    
    // Recommendation 3: Category-focused (e.g., food tour)
    const categoryGroups: Record<string, MissionStop[]> = {};
    nearbyMissions.forEach(mission => {
      if (!categoryGroups[mission.category]) {
        categoryGroups[mission.category] = [];
      }
      categoryGroups[mission.category].push(mission);
    });
    
    // Find largest category with 3+ missions
    const largestCategory = Object.entries(categoryGroups)
      .filter(([, missions]) => missions.length >= 3)
      .sort(([, a], [, b]) => b.length - a.length)[0];
    
    if (largestCategory) {
      const [category, missions] = largestCategory;
      const categoryRoute = await planOptimalRoute(
        userId,
        missions.slice(0, 5).map(m => m.missionId),
        userLocation
      );
      
      if (categoryRoute) {
        recommendations.push({
          route: categoryRoute,
          description: `${category} Tour`,
          benefits: [
            `Explore ${missions.length} ${category.toLowerCase()} spots`,
            `Discover new favorites in one category`,
            `Earn ${categoryRoute.totalPoints} points`
          ],
          difficulty: categoryRoute.totalDistance > 2000 ? 'MODERATE' : 'EASY'
        });
      }
    }
    
    return recommendations;
  } catch (error) {
    console.error('[Route Planning] Error suggesting combos:', error);
    return [];
  }
}

/**
 * Calculate route efficiency score
 */
export function calculateRouteEfficiency(route: OptimizedRoute): {
  score: number; // 0-100
  rating: 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT';
} {
  // Factors: points per minute, distance efficiency, number of stops
  const pointsPerMinute = route.efficiency;
  const distancePerStop = route.stops.length > 0 ? route.totalDistance / route.stops.length : 0;
  
  let score = 0;
  
  // Points efficiency (0-40)
  if (pointsPerMinute >= 5) score += 40;
  else if (pointsPerMinute >= 3) score += 30;
  else if (pointsPerMinute >= 2) score += 20;
  else score += 10;
  
  // Distance efficiency (0-30)
  if (distancePerStop < 300) score += 30; // Very close together
  else if (distancePerStop < 500) score += 25;
  else if (distancePerStop < 800) score += 15;
  else score += 5;
  
  // Number of stops bonus (0-30)
  if (route.stops.length >= 5) score += 30;
  else if (route.stops.length >= 3) score += 20;
  else score += 10;
  
  let rating: 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT';
  if (score >= 80) rating = 'EXCELLENT';
  else if (score >= 60) rating = 'GOOD';
  else if (score >= 40) rating = 'FAIR';
  else rating = 'POOR';
  
  return { score, rating };
}
