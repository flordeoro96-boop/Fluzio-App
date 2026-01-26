import { doc, updateDoc, increment, arrayUnion, getDoc, setDoc, Timestamp } from '../services/firestoreCompat';
import { db } from './apiService';
import { PassportStamp } from '../types';

interface UserProgression {
  totalXP: number;
  level: number;
  passportStamps: PassportStamp[];
  badges: string[];
  meetupsCompleted: number;
  currentStreak: number;
  longestStreak: number;
  lastMeetupDate: string;
  categoryStats: {
    [category: string]: {
      count: number;
      xpEarned: number;
    };
  };
}

interface CompletionResult {
  success: boolean;
  newLevel?: number;
  leveledUp?: boolean;
  xpEarned: number;
  stampEarned?: PassportStamp;
  badgesEarned?: string[];
  streakUpdated?: number;
  error?: string;
}

/**
 * Awards XP, stamps, and updates progression when user completes a meetup
 */
export async function awardMeetupCompletion(
  userId: string,
  meetupId: string,
  xpAmount: number,
  stamp?: PassportStamp,
  category?: string
): Promise<CompletionResult> {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return { success: false, error: 'User not found', xpEarned: 0 };
    }

    const userData = userDoc.data();
    const currentXP = userData.totalXP || 0;
    const currentLevel = userData.level || 1;
    const currentStamps = (userData.passportStamps || []) as PassportStamp[];
    const currentBadges = (userData.badges || []) as string[];
    const meetupsCompleted = (userData.meetupsCompleted || 0);
    const lastMeetupDate = userData.lastMeetupDate;

    // Calculate new XP and level
    const newXP = currentXP + xpAmount;
    const newLevel = calculateLevel(newXP);
    const leveledUp = newLevel > currentLevel;

    // Check and update streak
    const streakData = calculateStreak(lastMeetupDate);
    
    // Check for new badges
    const newBadges = checkForNewBadges(
      meetupsCompleted + 1,
      currentStamps,
      stamp,
      streakData.currentStreak,
      currentBadges
    );

    // Prepare update data
    const updateData: any = {
      totalXP: newXP,
      level: newLevel,
      meetupsCompleted: increment(1),
      lastMeetupDate: new Date().toISOString(),
      currentStreak: streakData.currentStreak,
      longestStreak: Math.max(streakData.currentStreak, userData.longestStreak || 0),
      updatedAt: Timestamp.now()
    };

    // Add stamp if new
    if (stamp && !currentStamps.includes(stamp)) {
      updateData.passportStamps = arrayUnion(stamp);
    }

    // Add new badges
    if (newBadges.length > 0) {
      updateData.badges = arrayUnion(...newBadges);
    }

    // Update category stats
    if (category) {
      const categoryPath = `categoryStats.${category}`;
      updateData[`${categoryPath}.count`] = increment(1);
      updateData[`${categoryPath}.xpEarned`] = increment(xpAmount);
    }

    // Update user document
    await updateDoc(userRef, updateData);

    // Track completion in meetup history
    await trackMeetupCompletion(userId, meetupId, xpAmount, stamp);

    return {
      success: true,
      newLevel,
      leveledUp,
      xpEarned: xpAmount,
      stampEarned: stamp && !currentStamps.includes(stamp) ? stamp : undefined,
      badgesEarned: newBadges,
      streakUpdated: streakData.currentStreak
    };
  } catch (error) {
    console.error('Error awarding meetup completion:', error);
    return { 
      success: false, 
      error: 'Failed to update progression', 
      xpEarned: 0 
    };
  }
}

/**
 * Calculates user level based on total XP
 * Level formula: Level = floor(sqrt(totalXP / 100)) + 1
 */
function calculateLevel(totalXP: number): number {
  return Math.floor(Math.sqrt(totalXP / 100)) + 1;
}

/**
 * Calculates XP required for next level
 */
export function getXPForNextLevel(currentLevel: number): number {
  return (currentLevel * currentLevel) * 100;
}

/**
 * Gets XP progress for current level
 */
export function getLevelProgress(totalXP: number, currentLevel: number): {
  currentLevelXP: number;
  nextLevelXP: number;
  progress: number;
} {
  const currentLevelXP = ((currentLevel - 1) * (currentLevel - 1)) * 100;
  const nextLevelXP = (currentLevel * currentLevel) * 100;
  const xpInCurrentLevel = totalXP - currentLevelXP;
  const xpNeededForLevel = nextLevelXP - currentLevelXP;
  const progress = (xpInCurrentLevel / xpNeededForLevel) * 100;

  return {
    currentLevelXP: xpInCurrentLevel,
    nextLevelXP: xpNeededForLevel,
    progress: Math.min(100, Math.max(0, progress))
  };
}

/**
 * Calculates meetup streak
 */
function calculateStreak(lastMeetupDate?: string): {
  currentStreak: number;
  streakBroken: boolean;
} {
  if (!lastMeetupDate) {
    return { currentStreak: 1, streakBroken: false };
  }

  const lastDate = new Date(lastMeetupDate);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - lastDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    // Consecutive day - continue streak
    return { currentStreak: 1, streakBroken: false }; // Will be incremented in update
  } else if (diffDays > 1) {
    // Streak broken - reset to 1
    return { currentStreak: 1, streakBroken: true };
  } else {
    // Same day - maintain current streak
    return { currentStreak: 0, streakBroken: false }; // No change
  }
}

/**
 * Checks if user earned any new badges
 */
function checkForNewBadges(
  totalMeetupsCompleted: number,
  currentStamps: PassportStamp[],
  newStamp?: PassportStamp,
  currentStreak?: number,
  currentBadges: string[] = []
): string[] {
  const newBadges: string[] = [];
  
  // Milestone badges
  if (totalMeetupsCompleted === 1 && !currentBadges.includes('First Meetup')) {
    newBadges.push('First Meetup');
  }
  if (totalMeetupsCompleted === 10 && !currentBadges.includes('Social Butterfly')) {
    newBadges.push('Social Butterfly');
  }
  if (totalMeetupsCompleted === 50 && !currentBadges.includes('Community Leader')) {
    newBadges.push('Community Leader');
  }
  if (totalMeetupsCompleted === 100 && !currentBadges.includes('Meetup Master')) {
    newBadges.push('Meetup Master');
  }

  // Stamp collection badges
  const totalStamps = newStamp && !currentStamps.includes(newStamp) 
    ? currentStamps.length + 1 
    : currentStamps.length;
    
  if (totalStamps === 5 && !currentBadges.includes('Stamp Collector')) {
    newBadges.push('Stamp Collector');
  }
  if (totalStamps === 10 && !currentBadges.includes('Passport Complete')) {
    newBadges.push('Passport Complete');
  }

  // Streak badges
  if (currentStreak === 7 && !currentBadges.includes('Week Warrior')) {
    newBadges.push('Week Warrior');
  }
  if (currentStreak === 30 && !currentBadges.includes('Monthly Champion')) {
    newBadges.push('Monthly Champion');
  }

  return newBadges;
}

/**
 * Tracks completed meetup in user's history
 */
async function trackMeetupCompletion(
  userId: string,
  meetupId: string,
  xpEarned: number,
  stamp?: PassportStamp
): Promise<void> {
  try {
    const completionRef = doc(db, 'users', userId, 'meetupHistory', meetupId);
    await setDoc(completionRef, {
      meetupId,
      completedAt: Timestamp.now(),
      xpEarned,
      stampEarned: stamp || null,
      createdAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error tracking meetup completion:', error);
  }
}

/**
 * Gets user's progression data
 */
export async function getUserProgression(userId: string): Promise<UserProgression | null> {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return null;
    }

    const data = userDoc.data();
    return {
      totalXP: data.totalXP || 0,
      level: data.level || 1,
      passportStamps: (data.passportStamps || []) as PassportStamp[],
      badges: (data.badges || []) as string[],
      meetupsCompleted: data.meetupsCompleted || 0,
      currentStreak: data.currentStreak || 0,
      longestStreak: data.longestStreak || 0,
      lastMeetupDate: data.lastMeetupDate || '',
      categoryStats: data.categoryStats || {}
    };
  } catch (error) {
    console.error('Error getting user progression:', error);
    return null;
  }
}

/**
 * Gets user's meetup history
 */
export async function getMeetupHistory(userId: string, limit: number = 20): Promise<any[]> {
  try {
    const { collection, query, orderBy, limit: limitQuery, getDocs } = await import('./firestoreCompat');
    
    const historyRef = collection(db, 'users', userId, 'meetupHistory');
    const q = query(historyRef, orderBy('completedAt', 'desc'), limitQuery(limit));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting meetup history:', error);
    return [];
  }
}

/**
 * Initializes progression data for new user
 */
export async function initializeUserProgression(userId: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      totalXP: 0,
      level: 1,
      passportStamps: [],
      badges: [],
      meetupsCompleted: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastMeetupDate: null,
      categoryStats: {},
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    }, { merge: true });
  } catch (error) {
    console.error('Error initializing user progression:', error);
  }
}
