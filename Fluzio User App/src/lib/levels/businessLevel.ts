/**
 * Business Level System
 * 
 * This system implements a dual-level progression for businesses:
 * 
 * 1. Main Business Level (1-6) - Admin-approved only
 *    - Level 1: Explorer (wants to start business)
 *    - Level 2: Builder (developing first business)
 *    - Level 3: Operator (running young business, up to 2 years)
 *    - Level 4: Growth Leader (scaling, stable revenue)
 *    - Level 5: Expert (5-10 years, consultants, coaches)
 *    - Level 6: Elite (top-tier, investors, exits, big brands)
 * 
 * 2. Sub-levels (1-9) - Automatic XP-based progression
 *    - Sub-level increases automatically based on XP thresholds
 *    - When sub-level reaches 9, business can request upgrade to next main level
 *    - Admin must approve main level upgrades
 */

import { db } from '../../../services/AuthContext';
import { doc, getDoc, updateDoc, increment, Timestamp } from 'firebase/firestore';

// ==================== CONSTANTS ====================

/**
 * Main Business Level Definitions
 */
export const BUSINESS_LEVELS = {
  1: { name: 'Explorer', description: 'Wants to start a business' },
  2: { name: 'Builder', description: 'Developing first business' },
  3: { name: 'Operator', description: 'Running a young business' },
  4: { name: 'Growth Leader', description: 'Scaling' },
  5: { name: 'Expert', description: 'Experienced' },
  6: { name: 'Elite', description: 'Top-tier' }
} as const;

/**
 * Sub-level XP thresholds (within one main level)
 * These are cumulative XP values needed to reach each sub-level
 */
export const SUB_LEVEL_THRESHOLDS = [
  0,    // .1
  20,   // .2
  50,   // .3
  90,   // .4
  140,  // .5
  200,  // .6
  270,  // .7
  350,  // .8
  440   // .9
] as const;

/**
 * XP Rewards for various activities
 */
export const XP_REWARDS = {
  MISSION_CREATED_FIRST: 50,
  MISSION_CREATED: 30,
  MISSION_COMPLETED: 30,
  GOOGLE_REVIEW_MISSION: 20,
  MEETUP_HOSTED: 40,
  MEETUP_HOSTED_3_PLUS: 70, // Bonus for 3+ attendees
  EVENT_HOSTED: 40,
  EVENT_HOSTED_5_PLUS: 100 // Bonus for 5+ attendees
} as const;

// ==================== TYPES ====================

export interface BusinessLevelData {
  businessLevel: number;          // 1-6
  businessSubLevel: number;        // 1-9
  businessXp: number;              // Raw XP count
  upgradeRequested: boolean;
  upgradeRequestedAt: Date | null;
  upgradeApprovedAt: Date | null;
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Calculate sub-level from XP
 * @param xp - Current XP amount
 * @returns Sub-level (1-9)
 */
export function getSubLevelFromXp(xp: number): number {
  for (let i = SUB_LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= SUB_LEVEL_THRESHOLDS[i]) {
      return i + 1; // Sub-levels are 1-indexed
    }
  }
  return 1; // Default to sub-level 1
}

/**
 * Get XP needed for next sub-level
 * @param currentXp - Current XP amount
 * @returns XP needed to reach next sub-level, or 0 if at max
 */
export function getXpForNextSubLevel(currentXp: number): number {
  const currentSubLevel = getSubLevelFromXp(currentXp);
  if (currentSubLevel >= 9) return 0; // Already at max sub-level
  
  const nextThreshold = SUB_LEVEL_THRESHOLDS[currentSubLevel]; // currentSubLevel is 0-indexed in array
  return nextThreshold - currentXp;
}

/**
 * Get level display string (e.g., "3.4" for Operator, sub-level 4)
 * @param mainLevel - Main level (1-6)
 * @param subLevel - Sub-level (1-9)
 * @returns Formatted level string
 */
export function getLevelDisplay(mainLevel: number, subLevel: number): string {
  return `${mainLevel}.${subLevel}`;
}

/**
 * Get level name from main level number
 * @param mainLevel - Main level (1-6)
 * @returns Level name
 */
export function getLevelName(mainLevel: number): string {
  return BUSINESS_LEVELS[mainLevel as keyof typeof BUSINESS_LEVELS]?.name || 'Unknown';
}

/**
 * Check if business can request upgrade
 * @param subLevel - Current sub-level
 * @param upgradeRequested - Whether upgrade already requested
 * @returns True if can request upgrade
 */
export function canRequestUpgrade(subLevel: number, upgradeRequested: boolean): boolean {
  return subLevel === 9 && !upgradeRequested;
}

// ==================== FIRESTORE OPERATIONS ====================

/**
 * Get business level data from Firestore
 * @param businessId - Business user ID
 * @returns Business level data or null if not found
 */
export async function getBusinessLevelData(businessId: string): Promise<BusinessLevelData | null> {
  try {
    const userRef = doc(db, 'users', businessId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      console.error('[BusinessLevel] User not found:', businessId);
      return null;
    }
    
    const data = userSnap.data();
    
    // Return level data with defaults
    return {
      businessLevel: data.businessLevel || 1,
      businessSubLevel: data.businessSubLevel || 1,
      businessXp: data.businessXp || 0,
      upgradeRequested: data.upgradeRequested || false,
      upgradeRequestedAt: data.upgradeRequestedAt?.toDate() || null,
      upgradeApprovedAt: data.upgradeApprovedAt?.toDate() || null
    };
  } catch (error) {
    console.error('[BusinessLevel] Error getting business level data:', error);
    return null;
  }
}

/**
 * Initialize business level data for new business users
 * @param businessId - Business user ID
 * @returns Success status
 */
export async function initializeBusinessLevel(businessId: string): Promise<boolean> {
  try {
    const userRef = doc(db, 'users', businessId);
    
    await updateDoc(userRef, {
      businessLevel: 1,
      businessSubLevel: 1,
      businessXp: 0,
      upgradeRequested: false,
      upgradeRequestedAt: null,
      upgradeApprovedAt: null
    });
    
    console.log('[BusinessLevel] Initialized level data for business:', businessId);
    return true;
  } catch (error) {
    console.error('[BusinessLevel] Error initializing business level:', error);
    return false;
  }
}

/**
 * Add XP to a business and update sub-level automatically
 * @param businessId - Business user ID
 * @param deltaXp - Amount of XP to add
 * @param reason - Reason for XP award (for logging)
 * @returns Updated level data or null on error
 */
export async function addBusinessXp(
  businessId: string,
  deltaXp: number,
  reason?: string
): Promise<BusinessLevelData | null> {
  try {
    const userRef = doc(db, 'users', businessId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      console.error('[BusinessLevel] User not found:', businessId);
      return null;
    }
    
    const data = userSnap.data();
    const currentXp = data.businessXp || 0;
    const currentSubLevel = data.businessSubLevel || 1;
    const currentMainLevel = data.businessLevel || 1;
    
    // Calculate new XP and sub-level
    const newXp = currentXp + deltaXp;
    const newSubLevel = getSubLevelFromXp(newXp);
    
    const updates: any = {
      businessXp: increment(deltaXp)
    };
    
    // Only update sub-level if it changed
    if (newSubLevel !== currentSubLevel) {
      updates.businessSubLevel = newSubLevel;
      console.log(`[BusinessLevel] 🎉 Level up! ${businessId} reached sub-level ${currentMainLevel}.${newSubLevel}`);
    }
    
    await updateDoc(userRef, updates);
    
    console.log(`[BusinessLevel] Added ${deltaXp} XP to ${businessId}. Reason: ${reason || 'N/A'}. New total: ${newXp} XP, Level ${currentMainLevel}.${newSubLevel}`);
    
    return {
      businessLevel: currentMainLevel,
      businessSubLevel: newSubLevel,
      businessXp: newXp,
      upgradeRequested: data.upgradeRequested || false,
      upgradeRequestedAt: data.upgradeRequestedAt?.toDate() || null,
      upgradeApprovedAt: data.upgradeApprovedAt?.toDate() || null
    };
  } catch (error) {
    console.error('[BusinessLevel] Error adding XP:', error);
    return null;
  }
}

/**
 * Request upgrade to next main level (business action)
 * Only allowed when sub-level is 9
 * @param businessId - Business user ID
 * @returns Success status
 */
export async function requestBusinessLevelUpgrade(businessId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const userRef = doc(db, 'users', businessId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return { success: false, error: 'Business not found' };
    }
    
    const data = userSnap.data();
    const subLevel = data.businessSubLevel || 1;
    const mainLevel = data.businessLevel || 1;
    const upgradeRequested = data.upgradeRequested || false;
    
    // Validation
    if (mainLevel >= 6) {
      return { success: false, error: 'Already at maximum level (Elite)' };
    }
    
    if (subLevel < 9) {
      return { success: false, error: `Must reach sub-level 9 (currently at ${mainLevel}.${subLevel})` };
    }
    
    if (upgradeRequested) {
      return { success: false, error: 'Upgrade request already pending' };
    }
    
    // Set upgrade request
    await updateDoc(userRef, {
      upgradeRequested: true,
      upgradeRequestedAt: Timestamp.now()
    });
    
    console.log(`[BusinessLevel] 📨 Upgrade request submitted by ${businessId} (Level ${mainLevel}.${subLevel} → ${mainLevel + 1}.1)`);
    
    // TODO: Send notification to admins
    
    return { success: true };
  } catch (error) {
    console.error('[BusinessLevel] Error requesting upgrade:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Approve business level upgrade (admin action)
 * Increments main level and resets sub-level to 1
 * @param businessId - Business user ID
 * @param adminId - Admin user ID performing the action
 * @returns Success status
 */
export async function approveBusinessLevelUpgrade(
  businessId: string,
  adminId: string
): Promise<{ success: boolean; error?: string; newLevel?: { main: number; sub: number } }> {
  try {
    const userRef = doc(db, 'users', businessId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return { success: false, error: 'Business not found' };
    }
    
    const data = userSnap.data();
    const currentMainLevel = data.businessLevel || 1;
    const upgradeRequested = data.upgradeRequested || false;
    
    // Validation
    if (!upgradeRequested) {
      return { success: false, error: 'No upgrade request pending' };
    }
    
    if (currentMainLevel >= 6) {
      return { success: false, error: 'Already at maximum level' };
    }
    
    const newMainLevel = currentMainLevel + 1;
    
    // Upgrade: increment main level, reset sub-level to 1, keep XP (or reset - choose based on preference)
    await updateDoc(userRef, {
      businessLevel: newMainLevel,
      businessSubLevel: 1,
      // Option A: Reset XP to 0
      businessXp: 0,
      // Option B: Keep XP (comment out line above, uncomment below)
      // businessXp: data.businessXp || 0, // Keep existing XP
      upgradeRequested: false,
      upgradeRequestedAt: null,
      upgradeApprovedAt: Timestamp.now(),
      lastUpgradeApprovedBy: adminId
    });
    
    const newLevelName = getLevelName(newMainLevel);
    console.log(`[BusinessLevel] ✅ Upgrade approved! ${businessId} promoted to Level ${newMainLevel}.1 (${newLevelName}) by admin ${adminId}`);
    
    // TODO: Send notification to business user
    
    return { success: true, newLevel: { main: newMainLevel, sub: 1 } };
  } catch (error) {
    console.error('[BusinessLevel] Error approving upgrade:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Reject business level upgrade (admin action)
 * @param businessId - Business user ID
 * @param adminId - Admin user ID performing the action
 * @param reason - Reason for rejection
 * @returns Success status
 */
export async function rejectBusinessLevelUpgrade(
  businessId: string,
  adminId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const userRef = doc(db, 'users', businessId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return { success: false, error: 'Business not found' };
    }
    
    const data = userSnap.data();
    const upgradeRequested = data.upgradeRequested || false;
    
    if (!upgradeRequested) {
      return { success: false, error: 'No upgrade request pending' };
    }
    
    await updateDoc(userRef, {
      upgradeRequested: false,
      upgradeRequestedAt: null,
      lastUpgradeRejectedBy: adminId,
      lastUpgradeRejectedAt: Timestamp.now(),
      lastUpgradeRejectionReason: reason || 'Not specified'
    });
    
    console.log(`[BusinessLevel] ❌ Upgrade rejected for ${businessId} by admin ${adminId}. Reason: ${reason || 'N/A'}`);
    
    // TODO: Send notification to business user
    
    return { success: true };
  } catch (error) {
    console.error('[BusinessLevel] Error rejecting upgrade:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Get all businesses with pending upgrade requests (admin view)
 * @returns List of businesses awaiting approval
 */
export async function getPendingUpgradeRequests(): Promise<Array<{
  id: string;
  name: string;
  email: string;
  currentLevel: number;
  currentSubLevel: number;
  currentXp: number;
  requestedAt: Date;
}>> {
  try {
    const { collection, query, where, getDocs } = await import('firebase/firestore');
    
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('role', '==', 'BUSINESS'),
      where('upgradeRequested', '==', true)
    );
    
    const snapshot = await getDocs(q);
    const requests: Array<any> = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      requests.push({
        id: doc.id,
        name: data.name || 'Unknown',
        email: data.email || '',
        currentLevel: data.businessLevel || 1,
        currentSubLevel: data.businessSubLevel || 1,
        currentXp: data.businessXp || 0,
        requestedAt: data.upgradeRequestedAt?.toDate() || new Date()
      });
    });
    
    // Sort by request date (oldest first)
    requests.sort((a, b) => a.requestedAt.getTime() - b.requestedAt.getTime());
    
    console.log(`[BusinessLevel] Found ${requests.length} pending upgrade requests`);
    return requests;
  } catch (error) {
    console.error('[BusinessLevel] Error getting pending requests:', error);
    return [];
  }
}

// ==================== EXPORTS ====================

export default {
  // Constants
  BUSINESS_LEVELS,
  SUB_LEVEL_THRESHOLDS,
  XP_REWARDS,
  
  // Helper functions
  getSubLevelFromXp,
  getXpForNextSubLevel,
  getLevelDisplay,
  getLevelName,
  canRequestUpgrade,
  
  // Firestore operations
  getBusinessLevelData,
  initializeBusinessLevel,
  addBusinessXp,
  requestBusinessLevelUpgrade,
  approveBusinessLevelUpgrade,
  rejectBusinessLevelUpgrade,
  getPendingUpgradeRequests
};
