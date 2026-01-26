/**
 * PARTICIPANT POOL SERVICE
 * 
 * Manages shared monthly participant pools for businesses.
 * Priority: Data integrity > Abuse prevention > UX
 * 
 * Key Principles:
 * - One pool shared across ALL missions
 * - Pool resets monthly (1st of month, 00:00 UTC)
 * - When depleted: missions show "COMPLETED_THIS_MONTH", remain visible
 * - Graceful degradation: no business hiding, no mission deletion
 */

import { db } from './apiService';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  setDoc, 
  Timestamp, 
  runTransaction,
  collection,
  query,
  where,
  getDocs
} from '../services/firestoreCompat';
import { Level2Tier } from './level2SubscriptionService';

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

export interface ParticipantPool {
  businessId: string;
  subscriptionTier: Level2Tier;
  
  // Pool Management
  monthlyParticipantLimit: number;  // Max participants this month
  currentUsage: number;             // Participants approved this month
  remaining: number;                // monthlyParticipantLimit - currentUsage
  
  // Cycle Tracking
  cycleStartDate: Timestamp;      // Start of current month
  cycleEndDate: Timestamp;        // End of current month (for display)
  lastResetDate: Timestamp;       // Last time pool was reset
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isUnlimited: boolean;           // True for PLATINUM with unlimited
  
  // Paid Participants Tracking (60/40 rule)
  paidParticipantsUsed?: number;      // Paid slots consumed
  paidParticipantsPurchased?: number; // Paid slots purchased with points
}

export interface PoolCheckResult {
  canParticipate: boolean;
  reason?: 'POOL_DEPLETED' | 'POOL_AVAILABLE' | 'UNLIMITED';
  remaining: number;
  cycleResetDate: Date;
  upgradeRecommendation?: {
    suggestedTier: Level2Tier;
    newLimit: number;
    additionalParticipants: number;
  };
}

// Participant limits by tier
export const TIER_PARTICIPANT_LIMITS: Record<Level2Tier, number> = {
  STARTER: 350,    // Starter tier monthly limit
  SILVER: 500,     // Silver tier monthly limit
  GOLD: 800,       // Gold tier monthly limit
  PLATINUM: 1500   // Platinum tier monthly limit (or -1 for unlimited)
};

const PLATINUM_SOFT_LIMIT = 1500; // For analytics, not hard enforcement

// ============================================================================
// POOL INITIALIZATION & RETRIEVAL
// ============================================================================

/**
 * Safe Timestamp to Date conversion helper
 */
function toDate(value: any): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  if (typeof value.toDate === 'function') return value.toDate();
  if (value.seconds !== undefined) {
    // Firestore Timestamp object
    return new Date(value.seconds * 1000);
  }
  return undefined;
}

/**
 * Get participant pool for business (read-only from client)
 * Pool creation is handled by backend/Cloud Functions
 */
export async function getParticipantPool(businessId: string): Promise<ParticipantPool | null> {
  try {
    const poolRef = doc(db, 'participantPools', businessId);
    const poolSnap = await getDoc(poolRef);
    
    if (poolSnap.exists()) {
      const data = poolSnap.data() as ParticipantPool;
      
      // Check if pool needs monthly reset (will be handled by backend)
      const cycleStartDate = toDate(data.cycleStartDate);
      if (cycleStartDate) {
        const needsReset = shouldResetPool(cycleStartDate);
        if (needsReset) {
          console.log(`[ParticipantPool] Pool needs reset (will be handled by backend)`);
          // Still return current data, backend will handle reset
        }
      }
      
      return data;
    }
    
    // Pool doesn't exist yet - backend needs to create it
    // Return null and show fallback UI
    console.log(`[ParticipantPool] No pool found for business ${businessId} - needs backend initialization`);
    return null;
    
  } catch (error) {
    console.error('[ParticipantPool] Error getting pool:', error);
    return null;
  }
}

/**
 * Initialize participant pool for new business
 */
export async function initializeParticipantPool(
  businessId: string,
  tier: Level2Tier = 'STARTER'
): Promise<ParticipantPool> {
  const now = new Date();
  const cycleStart = getMonthStart(now);
  const cycleEnd = getMonthEnd(now);
  
  const monthlyLimit = TIER_PARTICIPANT_LIMITS[tier];
  const isUnlimited = monthlyLimit === -1;
  
  const pool: ParticipantPool = {
    businessId,
    subscriptionTier: tier,
    monthlyParticipantLimit: isUnlimited ? PLATINUM_SOFT_LIMIT : monthlyLimit,
    currentUsage: 0,
    remaining: isUnlimited ? PLATINUM_SOFT_LIMIT : monthlyLimit,
    cycleStartDate: Timestamp.fromDate(cycleStart),
    cycleEndDate: Timestamp.fromDate(cycleEnd),
    lastResetDate: Timestamp.fromDate(now),
    createdAt: Timestamp.fromDate(now),
    updatedAt: Timestamp.fromDate(now),
    isUnlimited,
    paidParticipantsUsed: 0,
    paidParticipantsPurchased: 0
  };
  
  const poolRef = doc(db, 'participantPools', businessId);
  await setDoc(poolRef, pool);
  
  console.log(`[ParticipantPool] Initialized pool for ${businessId}:`, {
    tier,
    limit: pool.monthlyParticipantLimit,
    isUnlimited
  });
  
  return pool;
}

// ============================================================================
// POOL CHECKS & VALIDATION
// ============================================================================

/**
 * Check if business can accept new participation
 * CRITICAL: Call this BEFORE approving any participation
 */
export async function checkParticipantPoolAvailability(
  businessId: string
): Promise<PoolCheckResult> {
  const pool = await getParticipantPool(businessId);
  
  if (!pool) {
    // Fallback: allow if no pool exists (backward compatibility)
    console.warn(`[ParticipantPool] No pool found for ${businessId}, allowing participation`);
    return {
      canParticipate: true,
      reason: 'POOL_AVAILABLE',
      remaining: 999,
      cycleResetDate: getMonthEnd(new Date())
    };
  }
  
  // Unlimited tier (PLATINUM)
  if (pool.isUnlimited) {
    return {
      canParticipate: true,
      reason: 'UNLIMITED',
      remaining: -1,
      cycleResetDate: toDate(pool.cycleEndDate) || getMonthEnd(new Date())
    };
  }
  
  // Check if pool depleted
  if (pool.remaining <= 0) {
    const upgradeRec = getUpgradeRecommendation(pool.subscriptionTier, pool.monthlyParticipantLimit);
    
    return {
      canParticipate: false,
      reason: 'POOL_DEPLETED',
      remaining: 0,
      cycleResetDate: toDate(pool.cycleEndDate) || getMonthEnd(new Date()),
      upgradeRecommendation: upgradeRec
    };
  }
  
  // Pool available
  return {
    canParticipate: true,
    reason: 'POOL_AVAILABLE',
    remaining: pool.remaining,
    cycleResetDate: toDate(pool.cycleEndDate) || getMonthEnd(new Date())
  };
}

/**
 * Consume one participant slot from pool
 * Uses Firestore transaction for atomicity
 */
export async function consumeParticipantSlot(
  businessId: string,
  participationId: string
): Promise<{ success: boolean; remaining: number; error?: string }> {
  try {
    const poolRef = doc(db, 'participantPools', businessId);
    
    const result = await runTransaction(db, async (transaction) => {
      const poolSnap = await transaction.get(poolRef);
      
      if (!poolSnap.exists()) {
        // Create pool on-the-fly if missing
        const newPool = await initializeParticipantPool(businessId);
        return { success: true, remaining: newPool.remaining - 1 };
      }
      
      const pool = poolSnap.data() as ParticipantPool;
      
      // Unlimited tier: don't enforce hard limit
      if (pool.isUnlimited) {
        transaction.update(poolRef, {
          currentUsage: pool.currentUsage + 1,
          updatedAt: Timestamp.now()
        });
        return { success: true, remaining: -1 };
      }
      
      // Check if pool depleted
      if (pool.remaining <= 0) {
        return { 
          success: false, 
          remaining: 0, 
          error: 'POOL_DEPLETED' 
        };
      }
      
      // Consume slot
      const newUsage = pool.currentUsage + 1;
      const newRemaining = pool.monthlyParticipantLimit - newUsage;
      
      transaction.update(poolRef, {
        currentUsage: newUsage,
        remaining: newRemaining,
        updatedAt: Timestamp.now()
      });
      
      console.log(`[ParticipantPool] Consumed slot for ${businessId}:`, {
        participationId,
        newUsage,
        newRemaining
      });
      
      return { success: true, remaining: newRemaining };
    });
    
    return result;
    
  } catch (error) {
    console.error('[ParticipantPool] Error consuming slot:', error);
    return { success: false, remaining: 0, error: 'TRANSACTION_FAILED' };
  }
}

/**
 * Refund participant slot (if participation rejected/deleted)
 */
export async function refundParticipantSlot(
  businessId: string,
  participationId: string
): Promise<boolean> {
  try {
    const poolRef = doc(db, 'participantPools', businessId);
    
    await runTransaction(db, async (transaction) => {
      const poolSnap = await transaction.get(poolRef);
      
      if (!poolSnap.exists()) return;
      
      const pool = poolSnap.data() as ParticipantPool;
      
      // Don't refund if already at limit (prevents abuse)
      if (pool.currentUsage <= 0) return;
      
      const newUsage = Math.max(0, pool.currentUsage - 1);
      const newRemaining = pool.isUnlimited 
        ? PLATINUM_SOFT_LIMIT 
        : pool.monthlyParticipantLimit - newUsage;
      
      transaction.update(poolRef, {
        currentUsage: newUsage,
        remaining: newRemaining,
        updatedAt: Timestamp.now()
      });
      
      console.log(`[ParticipantPool] Refunded slot for ${businessId}:`, {
        participationId,
        newUsage,
        newRemaining
      });
    });
    
    return true;
    
  } catch (error) {
    console.error('[ParticipantPool] Error refunding slot:', error);
    return false;
  }
}

// ============================================================================
// POOL RESET LOGIC
// ============================================================================

/**
 * Check if pool needs monthly reset
 */
function shouldResetPool(cycleStartDate: Date): boolean {
  const now = new Date();
  const currentMonthStart = getMonthStart(now);
  return cycleStartDate < currentMonthStart;
}

/**
 * Reset participant pool for new month
 */
export async function resetParticipantPool(businessId: string): Promise<ParticipantPool> {
  const poolRef = doc(db, 'participantPools', businessId);
  const poolSnap = await getDoc(poolRef);
  
  if (!poolSnap.exists()) {
    return await initializeParticipantPool(businessId);
  }
  
  const pool = poolSnap.data() as ParticipantPool;
  const now = new Date();
  const cycleStart = getMonthStart(now);
  const cycleEnd = getMonthEnd(now);
  
  const monthlyLimit = pool.isUnlimited ? PLATINUM_SOFT_LIMIT : pool.monthlyParticipantLimit;
  
  const resetPool: Partial<ParticipantPool> = {
    currentUsage: 0,
    remaining: monthlyLimit,
    cycleStartDate: Timestamp.fromDate(cycleStart),
    cycleEndDate: Timestamp.fromDate(cycleEnd),
    lastResetDate: Timestamp.now(),
    updatedAt: Timestamp.now()
  };
  
  await updateDoc(poolRef, resetPool);
  
  console.log(`[ParticipantPool] Reset pool for ${businessId}:`, {
    previousUsage: pool.currentUsage,
    newLimit: monthlyLimit
  });
  
  return { ...pool, ...resetPool } as ParticipantPool;
}

/**
 * Batch reset all pools (for Cloud Function)
 */
export async function resetAllParticipantPools(): Promise<{
  success: number;
  failed: number;
  errors: string[];
}> {
  const stats = { success: 0, failed: 0, errors: [] as string[] };
  
  try {
    const poolsRef = collection(db, 'participantPools');
    const snapshot = await getDocs(poolsRef);
    
    console.log(`[ParticipantPool] Resetting ${snapshot.size} pools...`);
    
    for (const doc of snapshot.docs) {
      try {
        await resetParticipantPool(doc.id);
        stats.success++;
      } catch (error) {
        stats.failed++;
        stats.errors.push(`${doc.id}: ${error}`);
        console.error(`[ParticipantPool] Failed to reset ${doc.id}:`, error);
      }
    }
    
    console.log(`[ParticipantPool] Batch reset complete:`, stats);
    return stats;
    
  } catch (error) {
    console.error('[ParticipantPool] Batch reset failed:', error);
    throw error;
  }
}
/**
 * Debug helper to trace pool state
 */
export async function debugParticipantPool(businessId: string): Promise<void> {
  try {
    const poolRef = doc(db, 'participantPools', businessId);
    const poolSnap = await getDoc(poolRef);
    console.log(`[ParticipantPool DEBUG] businessId=${businessId}, exists=${poolSnap.exists()}`);
    if (poolSnap.exists()) {
      const pool = poolSnap.data();
      console.log(`[ParticipantPool DEBUG] tier=${pool.tier}, used=${pool.currentUsage}, limit=${pool.monthlyParticipantLimit}, unlimited=${pool.isUnlimited}`);
    } else {
      console.warn(`[ParticipantPool DEBUG] ⚠️ Pool does NOT exist for ${businessId}`);
    }
  } catch (error) {
    console.error('[ParticipantPool DEBUG] Error:', error);
  }
}

// ============================================================================
// TIER MANAGEMENT
// ============================================================================

/**
 * Update pool when subscription tier changes
 */
export async function updatePoolTier(
  businessId: string, 
  newTier: Level2Tier
): Promise<void> {
  const poolRef = doc(db, 'participantPools', businessId);
  const poolSnap = await getDoc(poolRef);
  
  if (!poolSnap.exists()) {
    await initializeParticipantPool(businessId, newTier);
    return;
  }
  
  const pool = poolSnap.data() as ParticipantPool;
  const newLimit = TIER_PARTICIPANT_LIMITS[newTier];
  const isUnlimited = newLimit === -1;
  
  const updates: Partial<ParticipantPool> = {
    subscriptionTier: newTier,
    monthlyParticipantLimit: isUnlimited ? PLATINUM_SOFT_LIMIT : newLimit,
    remaining: isUnlimited 
      ? PLATINUM_SOFT_LIMIT 
      : Math.max(0, newLimit - pool.currentUsage),
    isUnlimited,
    updatedAt: Timestamp.now()
  };
  
  await updateDoc(poolRef, updates);
  
  console.log(`[ParticipantPool] Updated tier for ${businessId}:`, {
    oldTier: pool.subscriptionTier,
    newTier,
    newLimit: updates.monthlyParticipantLimit,
    newRemaining: updates.remaining
  });
}

/**
 * Get upgrade recommendation when pool depleted
 */
function getUpgradeRecommendation(
  currentTier: Level2Tier,
  currentLimit: number
): { suggestedTier: Level2Tier; newLimit: number; additionalParticipants: number } | undefined {
  const tierOrder: Level2Tier[] = ['STARTER', 'SILVER', 'GOLD', 'PLATINUM'];
  const currentIndex = tierOrder.indexOf(currentTier);
  
  if (currentIndex === -1 || currentIndex >= tierOrder.length - 1) {
    return undefined; // Already at highest tier
  }
  
  const suggestedTier = tierOrder[currentIndex + 1];
  const newLimit = TIER_PARTICIPANT_LIMITS[suggestedTier];
  const additionalParticipants = newLimit === -1 
    ? PLATINUM_SOFT_LIMIT - currentLimit 
    : newLimit - currentLimit;
  
  return {
    suggestedTier,
    newLimit: newLimit === -1 ? PLATINUM_SOFT_LIMIT : newLimit,
    additionalParticipants
  };
}

// ============================================================================
// MISSION STATE HELPERS
// ============================================================================

/**
 * Check if mission should show "COMPLETED_THIS_MONTH" state
 */
export async function shouldShowCompletedThisMonth(
  businessId: string,
  missionId: string
): Promise<boolean> {
  const poolCheck = await checkParticipantPoolAvailability(businessId);
  return !poolCheck.canParticipate && poolCheck.reason === 'POOL_DEPLETED';
}

/**
 * Get missions that need "COMPLETED_THIS_MONTH" state update
 */
export async function getMissionsNeedingPoolUpdate(
  businessId: string
): Promise<string[]> {
  const poolCheck = await checkParticipantPoolAvailability(businessId);
  
  if (poolCheck.canParticipate) {
    return []; // Pool available, no updates needed
  }
  
  // Get all active missions for this business
  const missionsRef = collection(db, 'missions');
  const q = query(
    missionsRef,
    where('businessId', '==', businessId),
    where('isActive', '==', true)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.id);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

function getMonthEnd(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

/**
 * Get pool status for display
 */
export function formatPoolStatus(pool: ParticipantPool): string {
  if (pool.isUnlimited) {
    return 'Unlimited participants';
  }
  
  const percentage = (pool.currentUsage / pool.monthlyParticipantLimit) * 100;
  return `${pool.remaining} of ${pool.monthlyParticipantLimit} remaining (${Math.round(percentage)}% used)`;
}

/**
 * Get days until pool resets
 */
export function getDaysUntilReset(cycleEndDate: Date): number {
  const now = new Date();
  const diff = cycleEndDate.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
