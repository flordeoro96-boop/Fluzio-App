import { db } from './apiService';
import { collection, query, where, getDocs, doc, getDoc, Timestamp } from '../services/firestoreCompat';

/**
 * Safely convert Firestore Timestamp or Date to Date object
 */
function toDate(value: any): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (value.toDate && typeof value.toDate === 'function') return value.toDate();
  if (value.seconds) return new Date(value.seconds * 1000);
  return new Date(value);
}

/**
 * Personalized Mission Feed using ML-based recommendation engine
 * Analyzes user behavior, preferences, and social connections
 */

export interface MissionRecommendation {
  missionId: string;
  mission: any; // Full mission object
  relevanceScore: number; // 0-100
  reasons: string[]; // Why this is recommended
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  estimatedCompletionTime: number; // minutes
  distance?: number; // meters, if location available
}

export interface UserPreferenceProfile {
  userId: string;
  favoriteCategories: string[]; // Top 3 categories
  preferredBusinessTypes: string[];
  avgPointsPerMission: number;
  completionRate: number;
  preferredTimeOfDay: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT' | 'ANY';
  averageDistance: number; // meters
  socialInfluence: number; // 0-100, based on friends' activity
}

/**
 * Build user preference profile from historical data
 */
export async function buildUserPreferenceProfile(userId: string): Promise<UserPreferenceProfile> {
  try {
    // Get user's completed missions
    const participationsRef = collection(db, 'participations');
    const q = query(
      participationsRef,
      where('userId', '==', userId),
      where('status', 'in', ['COMPLETED', 'APPROVED'])
    );
    const participations = await getDocs(q);
    
    // Analyze patterns
    const categoryCount: Record<string, number> = {};
    const businessTypeCount: Record<string, number> = {};
    const hourCount: Record<number, number> = {};
    let totalPoints = 0;
    let totalDistance = 0;
    
    for (const partDoc of participations.docs) {
      const partData = partDoc.data();
      
      // Get mission details
      if (partData.missionId) {
        const missionDoc = await getDoc(doc(db, 'missions', partData.missionId));
        if (missionDoc.exists()) {
          const missionData = missionDoc.data();
          
          // Count categories
          const category = missionData.category || 'OTHER';
          categoryCount[category] = (categoryCount[category] || 0) + 1;
          
          // Count business types
          const businessType = missionData.businessType || 'GENERAL';
          businessTypeCount[businessType] = (businessTypeCount[businessType] || 0) + 1;
          
          // Track points
          totalPoints += missionData.reward?.points || 0;
        }
      }
      
      // Analyze completion time of day
      if (partData.completedAt) {
        const hour = toDate(partData.completedAt).getHours();
        hourCount[hour] = (hourCount[hour] || 0) + 1;
      }
    }
    
    // Find top 3 categories
    const favoriteCategories = Object.entries(categoryCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([cat]) => cat);
    
    // Find top business types
    const preferredBusinessTypes = Object.entries(businessTypeCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([type]) => type);
    
    // Calculate average points
    const avgPointsPerMission = participations.size > 0 ? totalPoints / participations.size : 100;
    
    // Calculate completion rate (all participations vs completed)
    const allParticipationsQuery = query(participationsRef, where('userId', '==', userId));
    const allParticipations = await getDocs(allParticipationsQuery);
    const completionRate = allParticipations.size > 0 
      ? (participations.size / allParticipations.size) * 100 
      : 50;
    
    // Determine preferred time of day
    let preferredTimeOfDay: UserPreferenceProfile['preferredTimeOfDay'] = 'ANY';
    const maxHour = Object.entries(hourCount).sort(([, a], [, b]) => b - a)[0];
    if (maxHour) {
      const hour = parseInt(maxHour[0]);
      if (hour >= 6 && hour < 12) preferredTimeOfDay = 'MORNING';
      else if (hour >= 12 && hour < 17) preferredTimeOfDay = 'AFTERNOON';
      else if (hour >= 17 && hour < 22) preferredTimeOfDay = 'EVENING';
      else preferredTimeOfDay = 'NIGHT';
    }
    
    return {
      userId,
      favoriteCategories,
      preferredBusinessTypes,
      avgPointsPerMission,
      completionRate,
      preferredTimeOfDay,
      averageDistance: 1000, // Default 1km
      socialInfluence: 0 // Will calculate separately
    };
  } catch (error) {
    console.error('[ML Feed] Error building preference profile:', error);
    return {
      userId,
      favoriteCategories: [],
      preferredBusinessTypes: [],
      avgPointsPerMission: 100,
      completionRate: 50,
      preferredTimeOfDay: 'ANY',
      averageDistance: 1000,
      socialInfluence: 0
    };
  }
}

/**
 * Calculate relevance score for a mission based on user profile
 */
function calculateRelevanceScore(
  mission: any,
  profile: UserPreferenceProfile,
  userLocation?: { latitude: number; longitude: number },
  friendsActivity?: Set<string>
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  
  // Category match (0-30 points)
  if (profile.favoriteCategories.includes(mission.category)) {
    score += 30;
    reasons.push(`Matches your interest in ${mission.category}`);
  } else if (profile.favoriteCategories.length > 0) {
    score += 10; // Small bonus for any categorized mission
  }
  
  // Business type match (0-20 points)
  if (profile.preferredBusinessTypes.includes(mission.businessType)) {
    score += 20;
    reasons.push(`Your preferred type of business`);
  }
  
  // Points alignment (0-15 points)
  const pointsDiff = Math.abs(mission.reward?.points - profile.avgPointsPerMission);
  const pointsScore = Math.max(0, 15 - (pointsDiff / profile.avgPointsPerMission) * 15);
  score += pointsScore;
  if (pointsScore > 10) {
    reasons.push(`Reward matches your typical missions`);
  }
  
  // Social influence (0-25 points)
  if (friendsActivity && friendsActivity.has(mission.id)) {
    score += 25;
    reasons.push(`Your friends are doing this mission`);
  }
  
  // Distance (0-10 points) - if location available
  if (userLocation && mission.coordinates) {
    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      mission.coordinates.latitude,
      mission.coordinates.longitude
    );
    
    if (distance < profile.averageDistance * 0.5) {
      score += 10;
      reasons.push('Very close to you');
    } else if (distance < profile.averageDistance) {
      score += 7;
      reasons.push('Nearby');
    } else if (distance < profile.averageDistance * 2) {
      score += 4;
    } else {
      score += 0; // Too far
    }
  } else {
    score += 5; // Neutral if no location data
  }
  
  // Recency bonus (0-10 points)
  if (mission.createdAt) {
    const daysSinceCreated = (Date.now() - toDate(mission.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreated < 3) {
      score += 10;
      reasons.push('New mission!');
    } else if (daysSinceCreated < 7) {
      score += 5;
    }
  }
  
  // Completion rate indicator (adjust score based on mission difficulty)
  if (mission.totalParticipants > 10) {
    const estimatedCompletionRate = (mission.totalCompletions || 0) / mission.totalParticipants;
    if (estimatedCompletionRate > 0.7) {
      score += 5;
      reasons.push('Popular and easy to complete');
    } else if (estimatedCompletionRate < 0.3 && profile.completionRate > 70) {
      score -= 5; // Avoid hard missions for users who prefer easy wins
    }
  }
  
  return { score, reasons };
}

/**
 * Get personalized mission feed for user
 */
export async function getPersonalizedMissionFeed(
  userId: string,
  userLocation?: { latitude: number; longitude: number },
  limit: number = 20
): Promise<MissionRecommendation[]> {
  try {
    // Build user profile
    const profile = await buildUserPreferenceProfile(userId);
    
    // Get friends' recent activity
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();
    const friendIds = userData?.following || [];
    
    const friendsActivity = new Set<string>();
    if (friendIds.length > 0) {
      const recentParticipationsRef = collection(db, 'participations');
      const thirtyDaysAgo = Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
      const friendsQuery = query(
        recentParticipationsRef,
        where('userId', 'in', friendIds.slice(0, 10)), // Firestore limit
        where('createdAt', '>=', thirtyDaysAgo)
      );
      const friendParticipations = await getDocs(friendsQuery);
      friendParticipations.forEach(doc => {
        const missionId = doc.data().missionId;
        if (missionId) friendsActivity.add(missionId);
      });
    }
    
    // Get all active missions
    const missionsRef = collection(db, 'missions');
    const missionsQuery = query(
      missionsRef,
      where('lifecycleStatus', '==', 'ACTIVE')
    );
    const missions = await getDocs(missionsQuery);
    
    // Score and rank missions
    const recommendations: MissionRecommendation[] = [];
    
    for (const missionDoc of missions.docs) {
      const mission = missionDoc.data();
      
      // Check if user already completed this mission
      const userPartQuery = query(
        collection(db, 'participations'),
        where('userId', '==', userId),
        where('missionId', '==', missionDoc.id),
        where('status', 'in', ['COMPLETED', 'APPROVED'])
      );
      const existingPart = await getDocs(userPartQuery);
      if (existingPart.size > 0) continue; // Skip completed missions
      
      const { score, reasons } = calculateRelevanceScore(
        mission,
        profile,
        userLocation,
        friendsActivity
      );
      
      let priority: MissionRecommendation['priority'];
      if (score >= 70) priority = 'HIGH';
      else if (score >= 50) priority = 'MEDIUM';
      else priority = 'LOW';
      
      // Estimate completion time based on mission type
      const estimatedTime = mission.missionType === 'IN_PERSON' ? 30 : 10;
      
      recommendations.push({
        missionId: missionDoc.id,
        mission: { id: missionDoc.id, ...mission },
        relevanceScore: Math.round(score),
        reasons,
        priority,
        estimatedCompletionTime: estimatedTime
      });
    }
    
    // Sort by relevance score and return top N
    return recommendations
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  } catch (error) {
    console.error('[ML Feed] Error generating personalized feed:', error);
    return [];
  }
}

/**
 * Calculate distance between two coordinates (Haversine formula)
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

  return R * c; // Distance in meters
}

/**
 * Get "Why recommended" explanation for a specific mission
 */
export function getRecommendationExplanation(recommendation: MissionRecommendation): string {
  if (recommendation.reasons.length === 0) {
    return 'This mission matches your general preferences.';
  }
  
  return recommendation.reasons.join(' • ');
}
