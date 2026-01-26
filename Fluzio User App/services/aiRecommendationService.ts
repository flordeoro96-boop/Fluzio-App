/**
 * AI-Powered Recommendation Service
 * Provides intelligent recommendations for customers based on behavior, preferences, and patterns
 */

import { db } from './apiService';
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from '../services/firestoreCompat';
import { User, Mission } from '../types';

export interface AIRecommendation {
  type: 'business' | 'mission' | 'category' | 'event';
  id: string;
  title: string;
  description: string;
  reason: string; // Why this is recommended
  confidence: number; // 0-1 confidence score
  priority: 'high' | 'medium' | 'low';
  data: any; // The actual business/mission data
  imageUrl?: string;
  distance?: number;
  points?: number;
}

export interface UserBehaviorProfile {
  favoriteCategories: string[];
  visitedBusinesses: string[];
  completedMissions: number;
  averageDistance: number; // km
  preferredTimeOfDay: 'morning' | 'afternoon' | 'evening';
  activeWeekdays: number[]; // 0-6
  pointsBalance: number;
  level: number;
  interests: string[];
  lastActivityDate: Date;
}

/**
 * Get AI-powered recommendations for a user
 */
export async function getAIRecommendations(
  userId: string,
  userLocation?: { latitude: number; longitude: number },
  maxResults: number = 10
): Promise<AIRecommendation[]> {
  try {
    // Get user behavior profile
    const behaviorProfile = await getUserBehaviorProfile(userId);
    const recommendations: AIRecommendation[] = [];

    // Get category-based recommendations
    const categoryRecs = await getCategoryRecommendations(behaviorProfile, userLocation);
    recommendations.push(...categoryRecs);

    // Get mission recommendations
    const missionRecs = await getMissionRecommendations(userId, behaviorProfile, userLocation);
    recommendations.push(...missionRecs);

    // Get trending recommendations
    const trendingRecs = await getTrendingRecommendations(userLocation);
    recommendations.push(...trendingRecs);

    // Get social recommendations (friends' favorites)
    const socialRecs = await getSocialRecommendations(userId, userLocation);
    recommendations.push(...socialRecs);

    // Get personalized business recommendations
    const businessRecs = await getPersonalizedBusinesses(userId, behaviorProfile, userLocation);
    recommendations.push(...businessRecs);

    // Sort by priority and confidence
    const sortedRecs = recommendations
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.confidence - a.confidence;
      })
      .slice(0, maxResults);

    console.log('[AI Recommendations] Generated', sortedRecs.length, 'recommendations for user', userId);
    return sortedRecs;
  } catch (error) {
    console.error('[AI Recommendations] Error:', error);
    return [];
  }
}

/**
 * Build user behavior profile from historical data
 */
async function getUserBehaviorProfile(userId: string): Promise<UserBehaviorProfile> {
  try {
    const [userDoc, participations, visits] = await Promise.all([
      getDocs(query(collection(db, 'users'), where('firebaseUid', '==', userId), limit(1))),
      getDocs(query(collection(db, 'participations'), where('userId', '==', userId), orderBy('submittedAt', 'desc'), limit(50))),
      getDocs(query(collection(db, 'shopifyVisits'), where('userId', '==', userId), orderBy('timestamp', 'desc'), limit(50)))
    ]);

    const userData = userDoc.empty ? null : userDoc.docs[0].data();
    
    // Analyze categories from participations
    const categoryCount: Record<string, number> = {};
    const businessSet = new Set<string>();
    let totalDistance = 0;
    let distanceCount = 0;
    const hourVisits: number[] = new Array(24).fill(0);
    const weekdayVisits: number[] = new Array(7).fill(0);

    participations.forEach(doc => {
      const data = doc.data();
      if (data.businessCategory) {
        categoryCount[data.businessCategory] = (categoryCount[data.businessCategory] || 0) + 1;
      }
      if (data.businessId) {
        businessSet.add(data.businessId);
      }
      if (data.distance) {
        totalDistance += data.distance;
        distanceCount++;
      }
      
      const timestamp = data.submittedAt?.toDate?.() || new Date(data.submittedAt);
      hourVisits[timestamp.getHours()]++;
      weekdayVisits[timestamp.getDay()]++;
    });

    visits.forEach(doc => {
      const data = doc.data();
      if (data.businessId) {
        businessSet.add(data.businessId);
      }
      
      const timestamp = new Date(data.timestamp);
      hourVisits[timestamp.getHours()]++;
      weekdayVisits[timestamp.getDay()]++;
    });

    // Determine favorite categories (top 3)
    const favoriteCategories = Object.entries(categoryCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category);

    // Determine preferred time of day
    const morningVisits = hourVisits.slice(6, 12).reduce((a, b) => a + b, 0);
    const afternoonVisits = hourVisits.slice(12, 18).reduce((a, b) => a + b, 0);
    const eveningVisits = hourVisits.slice(18, 24).reduce((a, b) => a + b, 0);
    let preferredTimeOfDay: 'morning' | 'afternoon' | 'evening' = 'afternoon';
    if (morningVisits > afternoonVisits && morningVisits > eveningVisits) preferredTimeOfDay = 'morning';
    else if (eveningVisits > afternoonVisits) preferredTimeOfDay = 'evening';

    // Find most active weekdays
    const activeWeekdays = weekdayVisits
      .map((count, day) => ({ day, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(({ day }) => day);

    return {
      favoriteCategories,
      visitedBusinesses: Array.from(businessSet),
      completedMissions: participations.size,
      averageDistance: distanceCount > 0 ? totalDistance / distanceCount : 5,
      preferredTimeOfDay,
      activeWeekdays,
      pointsBalance: userData?.points || userData?.credits || 0,
      level: userData?.level || 1,
      interests: userData?.interests || userData?.vibeTags || [],
      lastActivityDate: participations.empty ? new Date() : participations.docs[0].data().submittedAt?.toDate() || new Date()
    };
  } catch (error) {
    console.error('[AI Recommendations] Error building behavior profile:', error);
    return {
      favoriteCategories: [],
      visitedBusinesses: [],
      completedMissions: 0,
      averageDistance: 5,
      preferredTimeOfDay: 'afternoon',
      activeWeekdays: [0, 1, 2, 3, 4, 5, 6],
      pointsBalance: 0,
      level: 1,
      interests: [],
      lastActivityDate: new Date()
    };
  }
}

/**
 * Get category-based recommendations
 */
async function getCategoryRecommendations(
  profile: UserBehaviorProfile,
  location?: { latitude: number; longitude: number }
): Promise<AIRecommendation[]> {
  const recommendations: AIRecommendation[] = [];

  if (profile.favoriteCategories.length === 0) return recommendations;

  try {
    for (const category of profile.favoriteCategories.slice(0, 2)) {
      const businessQuery = query(
        collection(db, 'users'),
        where('role', '==', 'BUSINESS'),
        where('category', '==', category),
        limit(3)
      );

      const snapshot = await getDocs(businessQuery);
      
      snapshot.docs.forEach((doc, index) => {
        const business = doc.data();
        
        // Skip if already visited
        if (profile.visitedBusinesses.includes(doc.id)) return;

        let distance = undefined;
        if (location && business.geo) {
          distance = calculateDistance(location, business.geo);
          if (distance > profile.averageDistance * 2) return; // Too far
        }

        recommendations.push({
          type: 'business',
          id: doc.id,
          title: business.name,
          description: business.bio || `Explore this ${category}`,
          reason: `You love ${category}! This spot has great reviews.`,
          confidence: 0.8 - (index * 0.1),
          priority: index === 0 ? 'high' : 'medium',
          data: business,
          imageUrl: business.photoUrl || business.coverUrl,
          distance
        });
      });
    }
  } catch (error) {
    console.error('[AI Recommendations] Category recommendations error:', error);
  }

  return recommendations;
}

/**
 * Get mission recommendations based on user behavior
 */
async function getMissionRecommendations(
  userId: string,
  profile: UserBehaviorProfile,
  location?: { latitude: number; longitude: number }
): Promise<AIRecommendation[]> {
  const recommendations: AIRecommendation[] = [];

  try {
    const missionsQuery = query(
      collection(db, 'missions'),
      where('status', '==', 'ACTIVE'),
      where('slots', '>', 0),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const snapshot = await getDocs(missionsQuery);
    
    snapshot.docs.forEach(doc => {
      const mission = doc.data();
      
      // Filter by category match
      const categoryMatch = profile.favoriteCategories.includes(mission.category);
      
      // Filter by difficulty (match user level)
      const difficultyMatch = 
        (profile.level <= 3 && mission.difficulty === 'EASY') ||
        (profile.level > 3 && profile.level <= 7 && mission.difficulty === 'MEDIUM') ||
        (profile.level > 7 && mission.difficulty === 'HARD');

      // Filter by points (affordable or aspirational)
      const pointsMatch = mission.points <= profile.pointsBalance * 2;

      let confidence = 0.5;
      if (categoryMatch) confidence += 0.2;
      if (difficultyMatch) confidence += 0.15;
      if (pointsMatch) confidence += 0.15;

      if (confidence < 0.6) return; // Skip low confidence

      let reason = 'New mission available';
      if (categoryMatch) reason = `Perfect for your ${mission.category} interests`;
      else if (difficultyMatch) reason = `Matches your skill level`;
      else if (pointsMatch) reason = `Great rewards within your reach`;

      recommendations.push({
        type: 'mission',
        id: doc.id,
        title: mission.title,
        description: mission.description,
        reason,
        confidence,
        priority: confidence > 0.8 ? 'high' : 'medium',
        data: mission,
        imageUrl: mission.image,
        points: mission.points
      });
    });
  } catch (error) {
    console.error('[AI Recommendations] Mission recommendations error:', error);
  }

  return recommendations;
}

/**
 * Get trending recommendations
 */
async function getTrendingRecommendations(
  location?: { latitude: number; longitude: number }
): Promise<AIRecommendation[]> {
  const recommendations: AIRecommendation[] = [];

  try {
    // Get recently popular missions
    const missionsQuery = query(
      collection(db, 'missions'),
      where('status', '==', 'ACTIVE'),
      orderBy('applicationCount', 'desc'),
      limit(5)
    );

    const snapshot = await getDocs(missionsQuery);
    
    snapshot.docs.forEach((doc, index) => {
      const mission = doc.data();
      
      if (index < 2) { // Only top 2 trending
        recommendations.push({
          type: 'mission',
          id: doc.id,
          title: mission.title,
          description: mission.description,
          reason: '🔥 Trending now! Many users are joining this mission.',
          confidence: 0.7,
          priority: 'medium',
          data: mission,
          imageUrl: mission.image,
          points: mission.points
        });
      }
    });
  } catch (error) {
    console.error('[AI Recommendations] Trending recommendations error:', error);
  }

  return recommendations;
}

/**
 * Get social recommendations (friends' favorites)
 */
async function getSocialRecommendations(
  userId: string,
  location?: { latitude: number; longitude: number }
): Promise<AIRecommendation[]> {
  // TODO: Implement social graph analysis
  // For now, return empty array
  return [];
}

/**
 * Get personalized business recommendations
 */
async function getPersonalizedBusinesses(
  userId: string,
  profile: UserBehaviorProfile,
  location?: { latitude: number; longitude: number }
): Promise<AIRecommendation[]> {
  const recommendations: AIRecommendation[] = [];

  try {
    // Find businesses similar to visited ones
    if (profile.visitedBusinesses.length > 0) {
      // Get businesses in same categories
      const similarQuery = query(
        collection(db, 'users'),
        where('role', '==', 'BUSINESS'),
        limit(5)
      );

      const snapshot = await getDocs(similarQuery);
      
      snapshot.docs.forEach(doc => {
        const business = doc.data();
        
        // Skip if already visited
        if (profile.visitedBusinesses.includes(doc.id)) return;

        recommendations.push({
          type: 'business',
          id: doc.id,
          title: business.name,
          description: business.bio || 'Discover this hidden gem',
          reason: 'Similar to places you love',
          confidence: 0.65,
          priority: 'low',
          data: business,
          imageUrl: business.photoUrl || business.coverUrl
        });
      });
    }
  } catch (error) {
    console.error('[AI Recommendations] Personalized business error:', error);
  }

  return recommendations;
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(
  point1: { latitude: number; longitude: number },
  point2: { latitude: number; longitude: number }
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(point2.latitude - point1.latitude);
  const dLon = toRad(point2.longitude - point1.longitude);
  const lat1 = toRad(point1.latitude);
  const lat2 = toRad(point2.latitude);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Get quick recommendation summary
 */
export async function getRecommendationSummary(userId: string): Promise<{
  totalRecommendations: number;
  highPriority: number;
  categories: string[];
  bestMatch?: AIRecommendation;
}> {
  try {
    const recommendations = await getAIRecommendations(userId, undefined, 20);
    
    return {
      totalRecommendations: recommendations.length,
      highPriority: recommendations.filter(r => r.priority === 'high').length,
      categories: [...new Set(recommendations.map(r => r.type))],
      bestMatch: recommendations[0]
    };
  } catch (error) {
    console.error('[AI Recommendations] Summary error:', error);
    return {
      totalRecommendations: 0,
      highPriority: 0,
      categories: [],
      bestMatch: undefined
    };
  }
}
