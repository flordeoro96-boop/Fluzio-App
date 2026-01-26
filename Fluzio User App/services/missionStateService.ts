/**
 * Mission State Service
 * 
 * Manages customer-visible mission states and urgency indicators.
 * 
 * CRITICAL RULES:
 * - DO NOT show participant numbers
 * - DO NOT show capacity caps
 * - Only show states and urgency indicators
 * - Use human-readable messages
 */

import { db } from './apiService';
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  orderBy,
  limit,
  Timestamp
} from '../services/firestoreCompat';
import {
  MissionState,
  MISSION_STATE_DISPLAYS,
  MissionStateDisplay
} from '../types/customerLevels';

// ============================================================================
// MISSION STATE DETECTION
// ============================================================================

/**
 * Safely convert Firestore Timestamp to Date
 */
function toDate(value: any): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  if (typeof value.toDate === 'function') return value.toDate();
  return undefined;
}

/**
 * Determine mission state for a customer
 * Returns ONLY customer-facing state (no internal numbers)
 */
export async function getMissionState(
  missionId: string,
  userId: string
): Promise<MissionStateDisplay | null> {
  try {
    const missionRef = doc(db, 'missions', missionId);
    const missionSnap = await getDoc(missionRef);
    
    if (!missionSnap.exists()) {
      return null;
    }
    
    const mission = missionSnap.data();
    
    // Check states in priority order
    
    // 1. Completed this month
    if (await hasCompletedThisMonth(userId, missionId)) {
      return MISSION_STATE_DISPLAYS[MissionState.COMPLETED_THIS_MONTH];
    }
    
    // 2. Ending soon (within 3 days)
    if (isEndingSoon(toDate(mission.endsAt))) {
      return MISSION_STATE_DISPLAYS[MissionState.ENDING_SOON];
    }
    
    // 3. Staff pick
    if (mission.isStaffPick) {
      return MISSION_STATE_DISPLAYS[MissionState.STAFF_PICK];
    }
    
    // 4. Trending (high recent completions, but don't show numbers)
    if (await isTrending(missionId)) {
      return MISSION_STATE_DISPLAYS[MissionState.TRENDING];
    }
    
    // 5. New (created within last 7 days)
    if (isNew(toDate(mission.createdAt))) {
      return MISSION_STATE_DISPLAYS[MissionState.NEW];
    }
    
    // 6. Exclusive (level-gated)
    if (mission.minLevel && mission.minLevel !== 'EXPLORER') {
      return MISSION_STATE_DISPLAYS[MissionState.EXCLUSIVE];
    }
    
    return null; // No special state
    
  } catch (error) {
    console.error('[MissionState] Error detecting state:', error);
    return null;
  }
}

/**
 * Check if user completed mission this month
 */
async function hasCompletedThisMonth(userId: string, missionId: string): Promise<boolean> {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  
  const completionsRef = collection(db, 'missionCompletions');
  const q = query(
    completionsRef,
    where('userId', '==', userId),
    where('missionId', '==', missionId),
    where('completedAt', '>=', Timestamp.fromDate(monthStart))
  );
  
  const snapshot = await getDocs(q);
  return snapshot.size > 0;
}

/**
 * Check if mission is ending soon (within 3 days)
 */
function isEndingSoon(endsAt: Date | undefined): boolean {
  if (!endsAt) return false;
  
  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));
  
  return endsAt <= threeDaysFromNow && endsAt > now;
}

/**
 * Check if mission is new (created within last 7 days)
 */
function isNew(createdAt: Date | undefined): boolean {
  if (!createdAt) return false;
  
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
  
  return createdAt >= sevenDaysAgo;
}

/**
 * Check if mission is trending (high recent activity)
 * Uses relative completions without showing absolute numbers
 */
async function isTrending(missionId: string): Promise<boolean> {
  try {
    // Count completions in last 24 hours
    const yesterday = new Date(Date.now() - (24 * 60 * 60 * 1000));
    
    const completionsRef = collection(db, 'missionCompletions');
    const q = query(
      completionsRef,
      where('missionId', '==', missionId),
      where('completedAt', '>=', Timestamp.fromDate(yesterday))
    );
    
    const snapshot = await getDocs(q);
    const recentCompletions = snapshot.size;
    
    // Trending if more than 10 completions in last 24h
    // (This threshold is internal - customers never see the number)
    return recentCompletions > 10;
    
  } catch (error) {
    console.error('[MissionState] Error checking trending:', error);
    return false;
  }
}

/**
 * Get countdown message for returning missions
 */
export function getReturningCountdown(returnsAt: Date): string {
  const now = new Date();
  const diff = returnsAt.getTime() - now.getTime();
  
  if (diff <= 0) {
    return 'Available now!';
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 7) {
    return `Returns in ${Math.ceil(days / 7)} weeks`;
  } else if (days > 0) {
    return `Returns in ${days} days`;
  } else if (hours > 0) {
    return `Returns in ${hours} hours`;
  } else {
    return 'Returns soon';
  }
}

/**
 * Get urgency indicator for mission (customer-facing)
 * Returns emoji and message (NO raw numbers)
 */
export function getMissionUrgency(mission: any): {
  level: 'none' | 'low' | 'medium' | 'high' | 'critical';
  indicator: string;
  message: string;
} {
  const now = new Date();
  const endsAt = mission.endsAt?.toDate?.() || mission.endsAt;
  
  if (!endsAt) {
    return {
      level: 'none',
      indicator: '',
      message: ''
    };
  }
  
  const timeRemaining = endsAt.getTime() - now.getTime();
  const hoursRemaining = timeRemaining / (1000 * 60 * 60);
  
  if (hoursRemaining <= 0) {
    return {
      level: 'critical',
      indicator: '⏰',
      message: 'Ending now'
    };
  } else if (hoursRemaining <= 6) {
    return {
      level: 'critical',
      indicator: '🔥',
      message: 'Ending today'
    };
  } else if (hoursRemaining <= 24) {
    return {
      level: 'high',
      indicator: '⏰',
      message: 'Less than a day left'
    };
  } else if (hoursRemaining <= 72) {
    return {
      level: 'medium',
      indicator: '⚠️',
      message: 'Ending soon'
    };
  } else {
    return {
      level: 'low',
      indicator: '📅',
      message: 'Time remaining'
    };
  }
}

/**
 * Get all visible missions with states for a user
 * Sorted by priority (trending, ending soon, etc.)
 */
export async function getMissionsWithStates(
  userId: string,
  userLocation?: string
): Promise<Array<{
  mission: any;
  state: MissionStateDisplay | null;
  urgency: ReturnType<typeof getMissionUrgency>;
}>> {
  try {
    // Get active missions
    const missionsRef = collection(db, 'missions');
    const q = query(
      missionsRef,
      where('isActive', '==', true),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    
    const snapshot = await getDocs(q);
    
    // Get states for each mission
    const missionsWithStates = await Promise.all(
      snapshot.docs.map(async (missionDoc) => {
        const mission = { id: missionDoc.id, ...missionDoc.data() };
        const state = await getMissionState(missionDoc.id, userId);
        const urgency = getMissionUrgency(mission);
        
        return { mission, state, urgency };
      })
    );
    
    // Sort by priority
    missionsWithStates.sort((a, b) => {
      // Prioritize by state priority
      const aPriority = a.state?.priority || 0;
      const bPriority = b.state?.priority || 0;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority; // Higher priority first
      }
      
      // Then by urgency
      const urgencyOrder = { critical: 5, high: 4, medium: 3, low: 2, none: 1 };
      const aUrgency = urgencyOrder[a.urgency.level];
      const bUrgency = urgencyOrder[b.urgency.level];
      
      return bUrgency - aUrgency;
    });
    
    return missionsWithStates;
    
  } catch (error) {
    console.error('[MissionState] Error getting missions with states:', error);
    return [];
  }
}

/**
 * Get mission accessibility message for user level
 * (For level-gated missions)
 */
export function getMissionAccessibilityMessage(
  missionMinLevel: string | undefined,
  userLevel: string
): string | null {
  if (!missionMinLevel || missionMinLevel === 'EXPLORER') {
    return null; // Available to all
  }
  
  const levelOrder = ['EXPLORER', 'REGULAR', 'INSIDER', 'AMBASSADOR'];
  const requiredIndex = levelOrder.indexOf(missionMinLevel);
  const userIndex = levelOrder.indexOf(userLevel);
  
  if (userIndex < requiredIndex) {
    return `Unlock at ${missionMinLevel} level`;
  }
  
  return null;
}

/**
 * Get friendly completion message (NO raw numbers)
 */
export function getCompletionMessage(mission: any): string {
  if (mission.participantsRemaining === 0) {
    return 'All spots taken';
  }
  
  // Use vague indicators instead of exact numbers
  const totalParticipants = mission.totalParticipants || 100;
  const remaining = mission.participantsRemaining || totalParticipants;
  const percentRemaining = (remaining / totalParticipants) * 100;
  
  if (percentRemaining <= 10) {
    return 'Almost full';
  } else if (percentRemaining <= 25) {
    return 'Filling fast';
  } else if (percentRemaining <= 50) {
    return 'Spots available';
  } else {
    return 'Plenty of spots';
  }
}

/**
 * Format mission for customer display
 * Removes all internal numbers and technical details
 */
export function formatMissionForCustomer(mission: any): {
  id: string;
  title: string;
  description: string;
  points: number;
  businessName: string;
  imageUrl?: string;
  state?: MissionStateDisplay | null;
  urgency?: ReturnType<typeof getMissionUrgency>;
  accessibilityMessage?: string | null;
  completionMessage?: string;
} {
  return {
    id: mission.id,
    title: mission.title,
    description: mission.description,
    points: mission.pointsReward,
    businessName: mission.businessName,
    imageUrl: mission.imageUrl,
    completionMessage: getCompletionMessage(mission)
  };
}
