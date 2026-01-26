/**
 * AI Auto-Optimize Service (Gold+ Feature)
 * 
 * Optional AI system that can automatically optimize campaigns.
 * 
 * CRITICAL RULES:
 * - All actions must be explainable
 * - All actions must be reversible
 * - NEVER auto-publish without explicit consent
 * - Always require approval unless autoPublish explicitly enabled
 * - Log all suggestions and actions for audit
 */

import { db } from './apiService';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  Timestamp
} from '../services/firestoreCompat';
import {
  AIAutoOptimizeSettings,
  DEFAULT_AI_SETTINGS,
  AIOptimizationSuggestion
} from '../types/customerLevels';
import { hasServiceAccess } from './premiumServiceAccessService';
import { PremiumService } from '../types/customerLevels';

// ============================================================================
// AI SETTINGS MANAGEMENT
// ============================================================================

/**
 * Get AI auto-optimize settings for a business
 */
export async function getAISettings(businessId: string): Promise<AIAutoOptimizeSettings> {
  try {
    const businessRef = doc(db, 'businesses', businessId);
    const businessSnap = await getDoc(businessRef);
    
    if (!businessSnap.exists()) {
      return DEFAULT_AI_SETTINGS;
    }
    
    const businessData = businessSnap.data();
    return businessData.aiAutoOptimize || DEFAULT_AI_SETTINGS;
    
  } catch (error) {
    console.error('[AIAutoOptimize] Error getting settings:', error);
    return DEFAULT_AI_SETTINGS;
  }
}

/**
 * Update AI auto-optimize settings
 * Requires Gold+ tier
 */
export async function updateAISettings(
  businessId: string,
  settings: Partial<AIAutoOptimizeSettings>
): Promise<{ success: boolean; message: string }> {
  try {
    // Check tier access
    const accessCheck = await hasServiceAccess(businessId, PremiumService.AI_AUTO_OPTIMIZE);
    
    if (!accessCheck.hasAccess) {
      return {
        success: false,
        message: 'AI Auto-Optimize requires Gold or Platinum tier'
      };
    }
    
    // SAFETY CHECK: Warn if enabling auto-publish
    if (settings.autoPublish === true) {
      console.warn('[AIAutoOptimize] ⚠️ Auto-publish enabled for business:', businessId);
      console.warn('[AIAutoOptimize] AI will publish changes without approval!');
    }
    
    const businessRef = doc(db, 'businesses', businessId);
    await updateDoc(businessRef, {
      'aiAutoOptimize': {
        ...DEFAULT_AI_SETTINGS,
        ...settings,
        enabled: settings.enabled !== undefined ? settings.enabled : false
      },
      'aiAutoOptimizeUpdatedAt': Timestamp.now()
    });
    
    // Log settings change
    await addDoc(collection(db, 'aiOptimizationLogs'), {
      businessId,
      action: 'SETTINGS_UPDATED',
      oldSettings: await getAISettings(businessId),
      newSettings: settings,
      timestamp: Timestamp.now()
    });
    
    return {
      success: true,
      message: 'AI settings updated successfully'
    };
    
  } catch (error) {
    console.error('[AIAutoOptimize] Error updating settings:', error);
    return {
      success: false,
      message: 'Failed to update AI settings'
    };
  }
}

// ============================================================================
// AI OPTIMIZATION SUGGESTIONS
// ============================================================================

/**
 * Generate AI optimization suggestions for a business
 * Analyzes missions, rewards, and performance data
 */
export async function generateOptimizationSuggestions(
  businessId: string
): Promise<AIOptimizationSuggestion[]> {
  try {
    const settings = await getAISettings(businessId);
    
    if (!settings.enabled) {
      return []; // AI disabled
    }
    
    const suggestions: AIOptimizationSuggestion[] = [];
    
    // Analyze high-energy missions
    if (settings.canPauseMissions) {
      const highEnergySuggestions = await analyzeHighEnergyMissions(businessId, settings);
      suggestions.push(...highEnergySuggestions);
    }
    
    // Analyze reward attractiveness
    if (settings.canAdjustRewards) {
      const rewardSuggestions = await analyzeRewardAttractiveness(businessId, settings);
      suggestions.push(...rewardSuggestions);
    }
    
    // Analyze participant pool usage
    if (settings.canAdjustParticipants) {
      const participantSuggestions = await analyzeParticipantUsage(businessId, settings);
      suggestions.push(...participantSuggestions);
    }
    
    return suggestions;
    
  } catch (error) {
    console.error('[AIAutoOptimize] Error generating suggestions:', error);
    return [];
  }
}

/**
 * Analyze high-energy missions that may deplete pool too fast
 */
async function analyzeHighEnergyMissions(
  businessId: string,
  settings: AIAutoOptimizeSettings
): Promise<AIOptimizationSuggestion[]> {
  const suggestions: AIOptimizationSuggestion[] = [];
  
  try {
    // Get active missions with high energy cost
    const missionsRef = collection(db, 'missions');
    const q = query(
      missionsRef,
      where('businessId', '==', businessId),
      where('isActive', '==', true)
    );
    
    const snapshot = await getDocs(q);
    
    for (const missionDoc of snapshot.docs) {
      const mission = missionDoc.data();
      
      // Check if energy cost is high (>50 energy)
      if (mission.energyCost && mission.energyCost > 50) {
        // Check completion rate (low completion = too expensive)
        const completionRate = await getMissionCompletionRate(missionDoc.id);
        
        if (completionRate < 0.2) { // Less than 20% completion
          suggestions.push({
            id: `pause_${missionDoc.id}_${Date.now()}`,
            type: 'PAUSE_MISSION',
            missionId: missionDoc.id,
            currentValue: { isActive: true, energyCost: mission.energyCost },
            suggestedValue: { isActive: false },
            reason: `Mission "${mission.title}" has high energy cost (${mission.energyCost}) but low completion rate (${Math.round(completionRate * 100)}%). Consider pausing to prevent energy pool depletion.`,
            impact: 'MEDIUM',
            reversible: true,
            requiresConsent: !settings.autoPublish,
            createdAt: new Date(),
            status: 'PENDING'
          });
        }
      }
    }
    
  } catch (error) {
    console.error('[AIAutoOptimize] Error analyzing missions:', error);
  }
  
  return suggestions;
}

/**
 * Analyze reward attractiveness (redemption rates)
 */
async function analyzeRewardAttractiveness(
  businessId: string,
  settings: AIAutoOptimizeSettings
): Promise<AIOptimizationSuggestion[]> {
  const suggestions: AIOptimizationSuggestion[] = [];
  
  try {
    const rewardsRef = collection(db, 'rewards');
    const q = query(
      rewardsRef,
      where('businessId', '==', businessId),
      where('isActive', '==', true)
    );
    
    const snapshot = await getDocs(q);
    
    for (const rewardDoc of snapshot.docs) {
      const reward = rewardDoc.data();
      
      // Get redemption rate
      const redemptionRate = await getRewardRedemptionRate(rewardDoc.id);
      
      // Low redemption rate = too expensive or unattractive
      if (redemptionRate < 0.1 && reward.pointsCost > 50) {
        const suggestedCost = Math.round(reward.pointsCost * 0.85); // Suggest 15% reduction
        const maxAdjustment = reward.pointsCost * (settings.maxPointAdjustment / 100);
        const finalSuggestion = Math.max(suggestedCost, reward.pointsCost - maxAdjustment);
        
        suggestions.push({
          id: `adjust_${rewardDoc.id}_${Date.now()}`,
          type: 'ADJUST_REWARD',
          rewardId: rewardDoc.id,
          currentValue: { pointsCost: reward.pointsCost },
          suggestedValue: { pointsCost: finalSuggestion },
          reason: `Reward "${reward.title}" has low redemption rate (${Math.round(redemptionRate * 100)}%). Consider reducing points from ${reward.pointsCost} to ${finalSuggestion} to increase attractiveness.`,
          impact: 'LOW',
          reversible: true,
          requiresConsent: !settings.autoPublish,
          createdAt: new Date(),
          status: 'PENDING'
        });
      }
    }
    
  } catch (error) {
    console.error('[AIAutoOptimize] Error analyzing rewards:', error);
  }
  
  return suggestions;
}

/**
 * Analyze participant pool usage patterns
 */
async function analyzeParticipantUsage(
  businessId: string,
  settings: AIAutoOptimizeSettings
): Promise<AIOptimizationSuggestion[]> {
  const suggestions: AIOptimizationSuggestion[] = [];
  
  try {
    // Get participant pool status
    const { getParticipantPool } = await import('./participantPoolService');
    const poolStatus = await getParticipantPool(businessId);
    
    if (!poolStatus) return suggestions;
    
    // Check if pool is depleting too fast (less than 7 days left)
    const daysUntilReset = Math.ceil(
      (poolStatus.cycleEndDate.toDate().getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysUntilReset > 7 && poolStatus.remaining < poolStatus.monthlyParticipantLimit * 0.2) {
      suggestions.push({
        id: `pool_${businessId}_${Date.now()}`,
        type: 'ADJUST_PARTICIPANTS',
        currentValue: { remaining: poolStatus.remaining },
        suggestedValue: { pauseHighCostMissions: true },
        reason: `Participant pool is depleting rapidly (${poolStatus.remaining} remaining with ${daysUntilReset} days until reset). Consider pausing high-energy missions to preserve pool.`,
        impact: 'HIGH',
        reversible: true,
        requiresConsent: true, // Always require consent for pool adjustments
        createdAt: new Date(),
        status: 'PENDING'
      });
    }
    
  } catch (error) {
    console.error('[AIAutoOptimize] Error analyzing participants:', error);
  }
  
  return suggestions;
}

// ============================================================================
// SUGGESTION ACTIONS
// ============================================================================

/**
 * Apply AI optimization suggestion
 * Requires approval unless autoPublish is enabled
 */
export async function applySuggestion(
  businessId: string,
  suggestionId: string,
  approved: boolean
): Promise<{ success: boolean; message: string }> {
  try {
    // Get suggestion
    const suggestionsRef = collection(db, 'aiOptimizationSuggestions');
    const q = query(
      suggestionsRef,
      where('businessId', '==', businessId),
      where('id', '==', suggestionId)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return {
        success: false,
        message: 'Suggestion not found'
      };
    }
    
    const suggestionDoc = snapshot.docs[0];
    const suggestion = suggestionDoc.data() as AIOptimizationSuggestion;
    
    if (!approved) {
      // Mark as rejected
      await updateDoc(suggestionDoc.ref, {
        status: 'REJECTED',
        rejectedAt: Timestamp.now()
      });
      
      return {
        success: true,
        message: 'Suggestion rejected'
      };
    }
    
    // Apply the suggestion
    let applied = false;
    
    switch (suggestion.type) {
      case 'PAUSE_MISSION':
        if (suggestion.missionId) {
          const missionRef = doc(db, 'missions', suggestion.missionId);
          await updateDoc(missionRef, {
            isActive: false,
            pausedByAI: true,
            pausedAt: Timestamp.now(),
            pauseReason: suggestion.reason
          });
          applied = true;
        }
        break;
        
      case 'ADJUST_REWARD':
        if (suggestion.rewardId) {
          const rewardRef = doc(db, 'rewards', suggestion.rewardId);
          await updateDoc(rewardRef, {
            pointsCost: suggestion.suggestedValue.pointsCost,
            adjustedByAI: true,
            adjustedAt: Timestamp.now(),
            adjustmentReason: suggestion.reason,
            previousPointsCost: suggestion.currentValue.pointsCost
          });
          applied = true;
        }
        break;
        
      case 'ADJUST_PARTICIPANTS':
        // This requires more complex logic (pausing multiple missions)
        // Implementation depends on specific use case
        applied = false;
        break;
    }
    
    if (applied) {
      // Mark as applied
      await updateDoc(suggestionDoc.ref, {
        status: 'APPLIED',
        appliedAt: Timestamp.now()
      });
      
      // Log the action
      await addDoc(collection(db, 'aiOptimizationLogs'), {
        businessId,
        action: 'SUGGESTION_APPLIED',
        suggestionId,
        suggestion,
        timestamp: Timestamp.now()
      });
      
      return {
        success: true,
        message: 'Optimization applied successfully'
      };
    } else {
      return {
        success: false,
        message: 'Failed to apply suggestion'
      };
    }
    
  } catch (error) {
    console.error('[AIAutoOptimize] Error applying suggestion:', error);
    return {
      success: false,
      message: 'Error applying suggestion'
    };
  }
}

/**
 * Revert AI optimization (undo action)
 */
export async function revertOptimization(
  businessId: string,
  suggestionId: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Get suggestion from logs
    const logsRef = collection(db, 'aiOptimizationLogs');
    const q = query(
      logsRef,
      where('businessId', '==', businessId),
      where('suggestionId', '==', suggestionId),
      where('action', '==', 'SUGGESTION_APPLIED')
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return {
        success: false,
        message: 'No applied suggestion found'
      };
    }
    
    const logDoc = snapshot.docs[0];
    const log = logDoc.data();
    const suggestion = log.suggestion as AIOptimizationSuggestion;
    
    // Revert based on type
    switch (suggestion.type) {
      case 'PAUSE_MISSION':
        if (suggestion.missionId) {
          const missionRef = doc(db, 'missions', suggestion.missionId);
          await updateDoc(missionRef, {
            isActive: true,
            pausedByAI: false,
            revertedAt: Timestamp.now()
          });
        }
        break;
        
      case 'ADJUST_REWARD':
        if (suggestion.rewardId) {
          const rewardRef = doc(db, 'rewards', suggestion.rewardId);
          await updateDoc(rewardRef, {
            pointsCost: suggestion.currentValue.pointsCost,
            adjustedByAI: false,
            revertedAt: Timestamp.now()
          });
        }
        break;
    }
    
    // Log the reversion
    await addDoc(collection(db, 'aiOptimizationLogs'), {
      businessId,
      action: 'SUGGESTION_REVERTED',
      suggestionId,
      suggestion,
      timestamp: Timestamp.now()
    });
    
    return {
      success: true,
      message: 'Optimization reverted successfully'
    };
    
  } catch (error) {
    console.error('[AIAutoOptimize] Error reverting:', error);
    return {
      success: false,
      message: 'Error reverting optimization'
    };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getMissionCompletionRate(missionId: string): Promise<number> {
  try {
    const missionRef = doc(db, 'missions', missionId);
    const missionSnap = await getDoc(missionRef);
    
    if (!missionSnap.exists()) return 0;
    
    const mission = missionSnap.data();
    const total = mission.totalParticipants || 100;
    const claimed = mission.participantsClaimed || 0;
    
    return claimed / total;
  } catch {
    return 0;
  }
}

async function getRewardRedemptionRate(rewardId: string): Promise<number> {
  try {
    const rewardRef = doc(db, 'rewards', rewardId);
    const rewardSnap = await getDoc(rewardRef);
    
    if (!rewardSnap.exists()) return 0;
    
    const reward = rewardSnap.data();
    const total = reward.totalAvailable || 100;
    const claimed = reward.claimed || 0;
    
    return claimed / total;
  } catch {
    return 0;
  }
}
