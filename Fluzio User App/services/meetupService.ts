import { db } from './AuthContext';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  arrayUnion,
  arrayRemove,
  increment,
  serverTimestamp
} from 'firebase/firestore';
import { Meetup, MeetupParticipant, MeetupCategory, User, PassportStamp } from '../types';
import { calculateDistance } from '../hooks/useLocation';
import { getUserBehavior } from './userBehaviorService';
import { awardMeetupCompletion } from './progressionService';
import { generateMeetupDescription, generateMeetupRecommendationReason } from './openaiService';

/**
 * Get all upcoming meetups for a city
 */
export async function getMeetupsForCity(city: string, limitCount: number = 50): Promise<Meetup[]> {
  try {
    const meetupsRef = collection(db, 'meetups');
    const q = query(
      meetupsRef,
      where('location.city', '==', city),
      where('status', '==', 'upcoming'),
      where('startTime', '>', new Date().toISOString()),
      orderBy('startTime', 'asc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Meetup));
  } catch (error) {
    console.error('[MeetupService] Error fetching meetups:', error);
    return [];
  }
}

/**
 * Get nearby meetups based on user location
 */
export async function getNearbyMeetups(
  userLocation: { latitude: number; longitude: number },
  city: string,
  maxDistance: number = 5000 // meters
): Promise<Meetup[]> {
  try {
    const allMeetups = await getMeetupsForCity(city);
    
    // Filter by distance
    const nearbyMeetups = allMeetups
      .map(meetup => ({
        ...meetup,
        distance: calculateDistance(userLocation, meetup.location)
      }))
      .filter(meetup => meetup.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance);

    return nearbyMeetups;
  } catch (error) {
    console.error('[MeetupService] Error fetching nearby meetups:', error);
    return [];
  }
}

/**
 * AI-Powered Recommended Meetups
 * Uses vibe tags, interests, walking radius, past behavior
 */
export async function getRecommendedMeetups(
  user: User,
  userLocation: { latitude: number; longitude: number }
): Promise<Meetup[]> {
  try {
    const behavior = await getUserBehavior(user.id);
    const allMeetups = await getNearbyMeetups(
      userLocation,
      user.currentCity || 'Munich',
      behavior?.movementProfile?.preferredRadius || 3000
    );

    // Calculate match scores
    const scoredMeetups = allMeetups.map(meetup => ({
      ...meetup,
      matchScore: calculateMatchScore(meetup, user, behavior)
    }));

    // Sort by match score + partner priority
    scoredMeetups.sort((a, b) => {
      const scoreA = a.matchScore + (a.businessIsPartner ? a.partnerPriority : 0);
      const scoreB = b.matchScore + (b.businessIsPartner ? b.partnerPriority : 0);
      return scoreB - scoreA;
    });

    return scoredMeetups.slice(0, 20); // Top 20 recommendations
  } catch (error) {
    console.error('[MeetupService] Error getting recommendations:', error);
    return [];
  }
}

/**
 * AI Match Score Calculation
 * match_score = vibe_similarity * 0.4 + interest_overlap * 0.2 + 
 *               radius_fit * 0.15 + personality_balance * 0.15 + 
 *               category_preference * 0.1
 */
function calculateMatchScore(
  meetup: Meetup,
  user: User,
  behavior: any
): number {
  let score = 0;

  // 1. Vibe Similarity (40%)
  const userVibes = user.vibeTags || user.vibe || [];
  const meetupVibes = meetup.vibeMatch || [];
  const vibeOverlap = userVibes.filter(v => meetupVibes.includes(v)).length;
  const vibeSimilarity = userVibes.length > 0 ? (vibeOverlap / userVibes.length) : 0;
  score += vibeSimilarity * 40;

  // 2. Interest Overlap (20%)
  const userInterests = user.interests || [];
  const meetupCategory = meetup.category.toLowerCase();
  const hasInterest = userInterests.some(i => 
    meetupCategory.includes(i.toLowerCase()) || 
    i.toLowerCase().includes(meetupCategory)
  );
  score += hasInterest ? 20 : 0;

  // 3. Radius Fit (15%)
  const preferredRadius = behavior?.movementProfile?.preferredRadius || 2000;
  // Distance would be calculated separately if user location available
  const radiusFit = 0.8; // Default good fit
  score += radiusFit * 15;

  // 4. Personality Balance (15%)
  // TODO: More sophisticated personality matching
  score += 10; // Default moderate score

  // 5. Category Preference (10%)
  const categoryAffinities = behavior?.categoryAffinities || {};
  const categoryScore = categoryAffinities[meetup.category]?.visits || 0;
  score += Math.min(10, categoryScore * 2);

  return Math.round(score);
}

/**
 * Get trending meetups (high join rate, filling up fast)
 */
export async function getTrendingMeetups(city: string): Promise<Meetup[]> {
  try {
    const allMeetups = await getMeetupsForCity(city);
    
    // Calculate trending score
    const trendingMeetups = allMeetups.map(meetup => ({
      ...meetup,
      trendingScore: (meetup.participants.length / meetup.capacity) * 100 +
                     (meetup.viewCount || 0) * 0.5 +
                     (meetup.joinRequestCount || 0) * 2 +
                     (meetup.businessIsPartner ? 20 : 0)
    }));

    trendingMeetups.sort((a, b) => b.trendingScore - a.trendingScore);
    return trendingMeetups.slice(0, 15);
  } catch (error) {
    console.error('[MeetupService] Error fetching trending meetups:', error);
    return [];
  }
}

/**
 * Get meetups by category
 */
export async function getMeetupsByCategory(
  city: string,
  category: MeetupCategory
): Promise<Meetup[]> {
  try {
    const meetupsRef = collection(db, 'meetups');
    const q = query(
      meetupsRef,
      where('location.city', '==', city),
      where('category', '==', category),
      where('status', '==', 'upcoming'),
      orderBy('startTime', 'asc'),
      limit(30)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Meetup));
  } catch (error) {
    console.error('[MeetupService] Error fetching meetups by category:', error);
    return [];
  }
}

/**
 * Get a single meetup by ID
 */
export async function getMeetupById(meetupId: string): Promise<Meetup | null> {
  try {
    const meetupRef = doc(db, 'meetups', meetupId);
    const meetupDoc = await getDoc(meetupRef);

    if (!meetupDoc.exists()) {
      return null;
    }

    return { id: meetupDoc.id, ...meetupDoc.data() } as Meetup;
  } catch (error) {
    console.error('[MeetupService] Error fetching meetup:', error);
    return null;
  }
}

/**
 * Join a meetup
 */
export async function joinMeetup(
  meetupId: string,
  user: User
): Promise<{ success: boolean; error?: string }> {
  try {
    const meetup = await getMeetupById(meetupId);
    
    if (!meetup) {
      return { success: false, error: 'Meetup not found' };
    }

    // Validation checks
    if (meetup.participants.length >= meetup.capacity) {
      return { success: false, error: 'Meetup is full' };
    }

    if (meetup.participants.some(p => p.userId === user.id)) {
      return { success: false, error: 'Already joined this meetup' };
    }

    if (user.level < meetup.levelRequired) {
      return { success: false, error: `Level ${meetup.levelRequired} required` };
    }

    // TODO: Add verification check
    // if (!user.verified) return { success: false, error: 'Verification required' };

    const participant: MeetupParticipant = {
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatarUrl,
      userLevel: user.level,
      joinedAt: new Date().toISOString(),
      checkedIn: false,
      missionsCompleted: []
    };

    const meetupRef = doc(db, 'meetups', meetupId);
    await updateDoc(meetupRef, {
      participants: arrayUnion(participant),
      joinRequestCount: increment(1),
      updatedAt: serverTimestamp()
    });

    // Create/open chat if this is the 2nd+ participant
    if (meetup.participants.length >= 1 && !meetup.chatId) {
      // TODO: Create group chat
      // const chatId = await createMeetupChat(meetupId, [...meetup.participants, participant]);
    }

    return { success: true };
  } catch (error) {
    console.error('[MeetupService] Error joining meetup:', error);
    return { success: false, error: 'Failed to join meetup' };
  }
}

/**
 * Leave a meetup
 */
export async function leaveMeetup(
  meetupId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const meetup = await getMeetupById(meetupId);
    
    if (!meetup) {
      return { success: false, error: 'Meetup not found' };
    }

    const participant = meetup.participants.find(p => p.userId === userId);
    if (!participant) {
      return { success: false, error: 'Not a participant' };
    }

    const meetupRef = doc(db, 'meetups', meetupId);
    await updateDoc(meetupRef, {
      participants: arrayRemove(participant),
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('[MeetupService] Error leaving meetup:', error);
    return { success: false, error: 'Failed to leave meetup' };
  }
}

/**
 * Check-in to a meetup (must be at location)
 */
export async function checkInToMeetup(
  meetupId: string,
  userId: string,
  userLocation: { latitude: number; longitude: number }
): Promise<{ success: boolean; error?: string }> {
  try {
    const meetup = await getMeetupById(meetupId);
    
    if (!meetup) {
      return { success: false, error: 'Meetup not found' };
    }

    const participant = meetup.participants.find(p => p.userId === userId);
    if (!participant) {
      return { success: false, error: 'Not a participant' };
    }

    // Verify location (must be within 100m)
    const distance = calculateDistance(userLocation, meetup.location);
    if (distance > 100) {
      return { success: false, error: 'Too far from meetup location' };
    }

    // Update participant check-in status
    const updatedParticipants = meetup.participants.map(p =>
      p.userId === userId ? { ...p, checkedIn: true } : p
    );

    const meetupRef = doc(db, 'meetups', meetupId);
    await updateDoc(meetupRef, {
      participants: updatedParticipants,
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('[MeetupService] Error checking in:', error);
    return { success: false, error: 'Failed to check in' };
  }
}

/**
 * Complete a meetup (called after endTime)
 * Awards XP, stamps, and triggers post-meetup flow
 */
export async function completeMeetup(
  meetupId: string,
  userId: string
): Promise<{
  success: boolean;
  xpEarned?: number;
  stampEarned?: PassportStamp;
  rewardUnlocked?: boolean;
  leveledUp?: boolean;
  newLevel?: number;
  badgesEarned?: string[];
}> {
  try {
    const meetup = await getMeetupById(meetupId);
    
    if (!meetup) {
      return { success: false };
    }

    const participant = meetup.participants.find(p => p.userId === userId);
    if (!participant || !participant.checkedIn) {
      return { success: false };
    }

    // Award XP
    const xpEarned = meetup.xpReward || 50;
    
    // Award stamp
    const stampEarned = meetup.stamp;

    // Unlock reward (partner only)
    const rewardUnlocked = meetup.businessIsPartner && !!meetup.rewardId;

    // Update meetup status
    const meetupRef = doc(db, 'meetups', meetupId);
    await updateDoc(meetupRef, {
      status: 'ended',
      updatedAt: serverTimestamp()
    });

    // Award progression (XP, stamps, badges, streak)
    const progressionResult = await awardMeetupCompletion(
      userId,
      meetupId,
      xpEarned,
      stampEarned,
      meetup.category
    );

    return {
      success: true,
      xpEarned,
      stampEarned: progressionResult.stampEarned,
      rewardUnlocked,
      leveledUp: progressionResult.leveledUp,
      newLevel: progressionResult.newLevel,
      badgesEarned: progressionResult.badgesEarned
    };
  } catch (error) {
    console.error('[MeetupService] Error completing meetup:', error);
    return { success: false };
  }
}

/**
 * Track meetup view (for analytics)
 */
export async function trackMeetupView(meetupId: string): Promise<void> {
  try {
    const meetupRef = doc(db, 'meetups', meetupId);
    await updateDoc(meetupRef, {
      viewCount: increment(1)
    });
  } catch (error) {
    console.error('[MeetupService] Error tracking view:', error);
  }
}

/**
 * Get weather-appropriate meetups
 */
export function filterByWeather(
  meetups: Meetup[],
  weather: 'sunny' | 'rainy' | 'cloudy'
): Meetup[] {
  if (weather === 'rainy') {
    return meetups.filter(m => 
      m.weatherRelevance === 'indoor' || 
      m.weatherRelevance === 'any'
    );
  }
  
  if (weather === 'sunny') {
    // Prioritize outdoor, but don't exclude indoor
    return meetups.sort((a, b) => {
      const scoreA = a.weatherRelevance === 'outdoor' ? 10 : 0;
      const scoreB = b.weatherRelevance === 'outdoor' ? 10 : 0;
      return scoreB - scoreA;
    });
  }

  return meetups;
}

/**
 * Get time-appropriate meetups
 */
export function filterByTimeOfDay(meetups: Meetup[]): Meetup[] {
  const hour = new Date().getHours();
  let timeOfDay: 'morning' | 'lunch' | 'afternoon' | 'evening' | 'night';

  if (hour >= 6 && hour < 11) timeOfDay = 'morning';
  else if (hour >= 11 && hour < 14) timeOfDay = 'lunch';
  else if (hour >= 14 && hour < 17) timeOfDay = 'afternoon';
  else if (hour >= 17 && hour < 22) timeOfDay = 'evening';
  else timeOfDay = 'night';

  // Boost meetups matching current time
  return meetups.sort((a, b) => {
    const scoreA = a.timeOfDay === timeOfDay ? 15 : 0;
    const scoreB = b.timeOfDay === timeOfDay ? 15 : 0;
    return scoreB - scoreA;
  });
}
