/**
 * Mission Energy Service
 * 
 * Internal system (NOT VISIBLE TO CUSTOMERS) that prevents mission spamming
 * and encourages mission diversity by assigning energy costs to different mission types.
 * 
 * Each business gets monthly energy that resets on the 1st of each month.
 * Different mission types consume different amounts of energy.
 */

import { db } from './apiService';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  Timestamp,
  runTransaction,
  query,
  where,
  getDocs,
  writeBatch
} from '../services/firestoreCompat';

// Subscription tier type
export type SubscriptionTier = 'STARTER' | 'SILVER' | 'GOLD' | 'PLATINUM';

// Mission energy cost levels
export type EnergyCost = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';

// Mission energy pool interface
export interface MissionEnergyPool {
  businessId: string;
  subscriptionTier: SubscriptionTier;
  monthlyEnergyLimit: number;
  currentUsage: number;
  remaining: number;
  cycleStartDate: Timestamp;
  cycleEndDate: Timestamp;
  lastResetDate: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isUnlimited: boolean; // PLATINUM tier
}

// Energy cost breakdown by mission type
export interface EnergyConsumption {
  missionId: string;
  missionType: string;
  energyCost: number;
  timestamp: Timestamp;
  missionTitle: string;
}

// Energy check result
export interface EnergyCheckResult {
  canActivate: boolean;
  reason?: string;
  remaining: number;
  required: number;
  cycleResetDate?: Timestamp;
  suggestions?: string[];
}

// Tier-based monthly energy limits
const TIER_ENERGY_LIMITS: Record<SubscriptionTier, number> = {
  STARTER: 100,   // ~5 basic missions
  SILVER: 300,    // ~15 basic missions
  GOLD: 800,      // ~40 basic missions
  PLATINUM: -1    // Unlimited (10,000 soft limit)
};

// Mission type energy costs
export const MISSION_ENERGY_COSTS: Record<string, { cost: number; level: EnergyCost }> = {
  // Check-in missions (LOW)
  'VISIT_STORE': { cost: 15, level: 'LOW' },
  'CHECK_IN': { cost: 15, level: 'LOW' },
  'SCAN_QR': { cost: 15, level: 'LOW' },
  
  // Review missions (MEDIUM)
  'GOOGLE_REVIEW': { cost: 25, level: 'MEDIUM' },
  'WRITE_REVIEW': { cost: 25, level: 'MEDIUM' },
  'LEAVE_FEEDBACK': { cost: 25, level: 'MEDIUM' },
  
  // Photo/Video missions (HIGH)
  'TAKE_PHOTO': { cost: 40, level: 'HIGH' },
  'POST_STORY': { cost: 40, level: 'HIGH' },
  'CREATE_VIDEO': { cost: 45, level: 'HIGH' },
  'SHARE_POST': { cost: 40, level: 'HIGH' },
  
  // Referral missions (VERY_HIGH)
  'REFER_FRIEND': { cost: 60, level: 'VERY_HIGH' },
  'INVITE_FRIENDS': { cost: 60, level: 'VERY_HIGH' },
  'SHARE_REFERRAL': { cost: 60, level: 'VERY_HIGH' },
  
  // Default
  'DEFAULT': { cost: 20, level: 'MEDIUM' }
};

const energyPoolsCol = collection(db, 'missionEnergyPools');

/**
 * Safe timestamp conversion helper
 * Handles Firestore Timestamps, Date objects, and undefined values
 */
function toDate(value: any): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  if (typeof value.toDate === 'function') return value.toDate();
  if (value.seconds !== undefined) {
    return new Date(value.seconds * 1000);
  }
  return undefined;
}

/**
 * Get energy cost for a mission type
 */
export function getEnergyCost(missionType: string): { cost: number; level: EnergyCost } {
  // Handle undefined/null mission type
  if (!missionType) {
    return MISSION_ENERGY_COSTS.DEFAULT;
  }
  
  // Normalize mission type
  const normalizedType = missionType.toUpperCase().replace(/\s+/g, '_');
  
  // Check for exact match
  if (MISSION_ENERGY_COSTS[normalizedType]) {
    return MISSION_ENERGY_COSTS[normalizedType];
  }
  
  // Check for partial matches
  for (const [key, value] of Object.entries(MISSION_ENERGY_COSTS)) {
    if (normalizedType.includes(key) || key.includes(normalizedType)) {
      return value;
    }
  }
  
  // Default cost
  return MISSION_ENERGY_COSTS.DEFAULT;
}

/**
 * Get energy limit for subscription tier
 */
export function getEnergyLimit(tier: SubscriptionTier): number {
  return TIER_ENERGY_LIMITS[tier] || TIER_ENERGY_LIMITS.STARTER;
}

/**
 * Calculate cycle dates (current month boundaries)
 */
function calculateCycleDates(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

/**
 * Initialize energy pool for a business
 */
export async function initializeMissionEnergyPool(
  businessId: string,
  tier: SubscriptionTier = 'STARTER'
): Promise<MissionEnergyPool> {
  const { start, end } = calculateCycleDates();
  const now = Timestamp.now();
  
  const monthlyLimit = getEnergyLimit(tier);
  const isUnlimited = tier === 'PLATINUM';
  
  const pool: MissionEnergyPool = {
    businessId,
    subscriptionTier: tier,
    monthlyEnergyLimit: isUnlimited ? 10000 : monthlyLimit,
    currentUsage: 0,
    remaining: isUnlimited ? 10000 : monthlyLimit,
    cycleStartDate: Timestamp.fromDate(start),
    cycleEndDate: Timestamp.fromDate(end),
    lastResetDate: now,
    createdAt: now,
    updatedAt: now,
    isUnlimited
  };
  
  const poolRef = doc(energyPoolsCol, businessId);
  await setDoc(poolRef, pool);
  
  console.log(`[MissionEnergy] ✅ Initialized energy pool for ${businessId}:`, pool);
  return pool;
}

/**
 * Get energy pool for a business (read-only from client)
 * Pools must be initialized by backend Cloud Functions
 */
export async function getMissionEnergyPool(businessId: string): Promise<MissionEnergyPool | null> {
  console.log(`[MissionEnergy] 🔍 Getting pool for businessId=${businessId}`);
  const poolRef = doc(energyPoolsCol, businessId);
  const poolSnap = await getDoc(poolRef);
  
  if (!poolSnap.exists()) {
    console.warn(`[MissionEnergy] ⚠️ No pool found for business ${businessId} - needs backend initialization`);
    return null;
  }
  
  const pool = poolSnap.data() as MissionEnergyPool;
  console.log(`[MissionEnergy] ✅ Pool found: tier=${pool.subscriptionTier}, used=${pool.currentUsage}, limit=${pool.monthlyEnergyLimit}`);
  
  // Check if cycle has expired (backend will reset via scheduled function)
  const now = new Date();
  const cycleEnd = toDate(pool.cycleEndDate) || new Date();
  
  if (cycleEnd < now) {
    console.log('[MissionEnergy] Cycle expired for business', businessId, '- backend will reset');
    // Return the expired pool data, backend will handle reset
    return pool;
  }
  
  return pool;
}

/**
 * Check if business has enough energy to activate a mission
 */
export async function checkMissionEnergyAvailability(
  businessId: string,
  missionType: string
): Promise<EnergyCheckResult> {
  const pool = await getMissionEnergyPool(businessId);
  
  if (!pool) {
    return {
      canActivate: false,
      reason: 'Energy pool not initialized',
      remaining: 0,
      required: 0
    };
  }
  
  const { cost, level } = getEnergyCost(missionType);
  
  // PLATINUM tier has unlimited energy
  if (pool.isUnlimited) {
    return {
      canActivate: true,
      remaining: 999999,
      required: cost
    };
  }
  
  // Check if enough energy
  if (pool.remaining < cost) {
    return {
      canActivate: false,
      reason: `Insufficient mission energy. Need ${cost}, have ${pool.remaining}.`,
      remaining: pool.remaining,
      required: cost,
      cycleResetDate: pool.cycleEndDate,
      suggestions: getSuggestedAlternatives(pool.remaining, missionType)
    };
  }
  
  return {
    canActivate: true,
    remaining: pool.remaining,
    required: cost
  };
}

/**
 * Suggest alternative lower-energy missions
 */
function getSuggestedAlternatives(remainingEnergy: number, currentType: string): string[] {
  const suggestions: string[] = [];
  
  // Get all mission types that fit within remaining energy
  const affordableMissions = Object.entries(MISSION_ENERGY_COSTS)
    .filter(([type, { cost }]) => cost <= remainingEnergy && type !== 'DEFAULT')
    .sort((a, b) => b[1].cost - a[1].cost) // Highest cost first
    .slice(0, 3);
  
  if (affordableMissions.length === 0) {
    suggestions.push(`Not enough energy for any missions this month. Pool resets on the 1st.`);
    suggestions.push(`Consider upgrading your subscription for more monthly energy.`);
  } else {
    suggestions.push(`Try these lower-energy mission types instead:`);
    affordableMissions.forEach(([type, { cost, level }]) => {
      if (!type) return; // Skip if type is undefined
      const friendlyName = type.toLowerCase().replace(/_/g, ' ');
      suggestions.push(`• ${friendlyName} (${cost} energy, ${level} priority)`);
    });
  }
  
  return suggestions;
}

/**
 * Consume mission energy (atomic transaction)
 */
export async function consumeMissionEnergy(
  businessId: string,
  missionId: string,
  missionType: string,
  missionTitle: string
): Promise<{ success: boolean; remaining: number; error?: string }> {
  const poolRef = doc(energyPoolsCol, businessId);
  const { cost } = getEnergyCost(missionType);
  
  try {
    const result = await runTransaction(db, async (transaction) => {
      const poolSnap = await transaction.get(poolRef);
      
      if (!poolSnap.exists()) {
        throw new Error('Energy pool not found');
      }
      
      const pool = poolSnap.data() as MissionEnergyPool;
      
      // PLATINUM tier has unlimited energy
      if (pool.isUnlimited) {
        // Track usage for analytics but don't block
        transaction.update(poolRef, {
          currentUsage: pool.currentUsage + cost,
          updatedAt: Timestamp.now()
        });
        return { success: true, remaining: 999999 };
      }
      
      // Check if enough energy
      if (pool.remaining < cost) {
        throw new Error(`Insufficient energy. Need ${cost}, have ${pool.remaining}.`);
      }
      
      // Consume energy
      const newUsage = pool.currentUsage + cost;
      const newRemaining = pool.remaining - cost;
      
      transaction.update(poolRef, {
        currentUsage: newUsage,
        remaining: newRemaining,
        updatedAt: Timestamp.now()
      });
      
      // Log consumption
      const consumptionRef = doc(collection(db, 'missionEnergyConsumption'));
      transaction.set(consumptionRef, {
        businessId,
        missionId,
        missionType,
        missionTitle,
        energyCost: cost,
        timestamp: Timestamp.now()
      });
      
      return { success: true, remaining: newRemaining };
    });
    
    console.log(`[MissionEnergy] ✅ Consumed ${cost} energy for mission ${missionId}. Remaining: ${result.remaining}`);
    return result;
    
  } catch (error) {
    console.error('[MissionEnergy] ❌ Failed to consume energy:', error);
    return {
      success: false,
      remaining: 0,
      error: error instanceof Error ? error.message : 'Failed to consume energy'
    };
  }
}

/**
 * Refund mission energy (if mission deactivated/deleted)
 */
export async function refundMissionEnergy(
  businessId: string,
  missionId: string,
  missionType: string
): Promise<boolean> {
  const poolRef = doc(energyPoolsCol, businessId);
  const { cost } = getEnergyCost(missionType);
  
  try {
    await runTransaction(db, async (transaction) => {
      const poolSnap = await transaction.get(poolRef);
      
      if (!poolSnap.exists()) {
        throw new Error('Energy pool not found');
      }
      
      const pool = poolSnap.data() as MissionEnergyPool;
      
      // Calculate refund (can't exceed monthly limit)
      const newUsage = Math.max(0, pool.currentUsage - cost);
      const newRemaining = Math.min(pool.monthlyEnergyLimit, pool.remaining + cost);
      
      transaction.update(poolRef, {
        currentUsage: newUsage,
        remaining: newRemaining,
        updatedAt: Timestamp.now()
      });
    });
    
    console.log(`[MissionEnergy] ✅ Refunded ${cost} energy for mission ${missionId}`);
    return true;
    
  } catch (error) {
    console.error('[MissionEnergy] ❌ Failed to refund energy:', error);
    return false;
  }
}

/**
 * Reset energy pool (monthly reset)
 */
export async function resetMissionEnergyPool(businessId: string): Promise<MissionEnergyPool> {
  const poolRef = doc(energyPoolsCol, businessId);
  const poolSnap = await getDoc(poolRef);
  
  if (!poolSnap.exists()) {
    return await initializeMissionEnergyPool(businessId, 'STARTER');
  }
  
  const pool = poolSnap.data() as MissionEnergyPool;
  const { start, end } = calculateCycleDates();
  const now = Timestamp.now();
  
  const monthlyLimit = pool.isUnlimited ? 10000 : pool.monthlyEnergyLimit;
  
  const updatedPool: Partial<MissionEnergyPool> = {
    currentUsage: 0,
    remaining: monthlyLimit,
    cycleStartDate: Timestamp.fromDate(start),
    cycleEndDate: Timestamp.fromDate(end),
    lastResetDate: now,
    updatedAt: now
  };
  
  await updateDoc(poolRef, updatedPool);
  
  console.log(`[MissionEnergy] ✅ Reset energy pool for ${businessId}`);
  return { ...pool, ...updatedPool } as MissionEnergyPool;
}

/**
 * Reset all energy pools (for Cloud Function)
 */
export async function resetAllMissionEnergyPools(): Promise<{
  totalPools: number;
  successCount: number;
  failedCount: number;
}> {
  const poolsSnapshot = await getDocs(energyPoolsCol);
  const { start, end } = calculateCycleDates();
  const now = Timestamp.now();
  
  let successCount = 0;
  let failedCount = 0;
  const totalPools = poolsSnapshot.size;
  
  // Process in batches of 500 (Firestore limit)
  const batchSize = 500;
  let batch = writeBatch(db);
  let operationCount = 0;
  
  for (const poolDoc of poolsSnapshot.docs) {
    try {
      const pool = poolDoc.data() as MissionEnergyPool;
      const monthlyLimit = pool.isUnlimited ? 10000 : pool.monthlyEnergyLimit;
      
      batch.update(poolDoc.ref, {
        currentUsage: 0,
        remaining: monthlyLimit,
        cycleStartDate: Timestamp.fromDate(start),
        cycleEndDate: Timestamp.fromDate(end),
        lastResetDate: now,
        updatedAt: now
      });
      
      operationCount++;
      
      // Commit batch every 500 operations
      if (operationCount >= batchSize) {
        await batch.commit();
        successCount += operationCount;
        batch = writeBatch(db);
        operationCount = 0;
      }
    } catch (error) {
      console.error(`[MissionEnergy] Failed to reset pool ${poolDoc.id}:`, error);
      failedCount++;
    }
  }
  
  // Commit remaining operations
  if (operationCount > 0) {
    await batch.commit();
    successCount += operationCount;
  }
  
  console.log(`[MissionEnergy] ✅ Reset ${successCount}/${totalPools} energy pools`);
  
  return { totalPools, successCount, failedCount };
}

/**
 * Update energy pool tier (when subscription changes)
 */
export async function updateEnergyPoolTier(
  businessId: string,
  newTier: SubscriptionTier
): Promise<void> {
  const poolRef = doc(energyPoolsCol, businessId);
  const poolSnap = await getDoc(poolRef);
  
  if (!poolSnap.exists()) {
    await initializeMissionEnergyPool(businessId, newTier);
    return;
  }
  
  const pool = poolSnap.data() as MissionEnergyPool;
  const newLimit = getEnergyLimit(newTier);
  const isUnlimited = newTier === 'PLATINUM';
  
  // Recalculate remaining based on current usage
  const newRemaining = isUnlimited 
    ? 10000 
    : Math.max(0, newLimit - pool.currentUsage);
  
  await updateDoc(poolRef, {
    subscriptionTier: newTier,
    monthlyEnergyLimit: isUnlimited ? 10000 : newLimit,
    remaining: newRemaining,
    isUnlimited,
    updatedAt: Timestamp.now()
  });
  
  console.log(`[MissionEnergy] ✅ Updated tier to ${newTier} for ${businessId}`);
}

/**
 * Get energy usage statistics
 */
export async function getEnergyUsageStats(businessId: string): Promise<{
  totalUsed: number;
  remaining: number;
  percentage: number;
  tier: SubscriptionTier;
  isLow: boolean;
  isDepleted: boolean;
}> {
  const pool = await getMissionEnergyPool(businessId);
  
  if (!pool) {
    return {
      totalUsed: 0,
      remaining: 0,
      percentage: 0,
      tier: 'STARTER',
      isLow: false,
      isDepleted: true
    };
  }
  
  const percentage = pool.isUnlimited 
    ? 0 
    : (pool.currentUsage / pool.monthlyEnergyLimit) * 100;
  
  return {
    totalUsed: pool.currentUsage,
    remaining: pool.remaining,
    percentage,
    tier: pool.subscriptionTier,
    isLow: percentage >= 80 && !pool.isUnlimited,
    isDepleted: pool.remaining <= 0 && !pool.isUnlimited
  };
}

/**
 * Get friendly energy level description
 */
export function getEnergyLevelDescription(level: EnergyCost): string {
  const descriptions = {
    LOW: 'Low energy mission - Great for frequent use',
    MEDIUM: 'Medium energy mission - Balanced choice',
    HIGH: 'High energy mission - High engagement value',
    VERY_HIGH: 'Very high energy mission - Premium engagement'
  };
  return descriptions[level];
}
