/**
 * Mission Service - Firestore Integration
 * 
 * Handles all mission-related database operations.
 */

import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  getDoc,
  doc,
  addDoc, 
  updateDoc,
  deleteDoc,
  Timestamp,
  DocumentData,
  QueryConstraint
} from 'firebase/firestore';
import { db } from '../../services/AuthContext';
import { Mission, UserProfile, Skill } from '../types/models';

// ============================================================================
// COLLECTION REFERENCE
// ============================================================================

const missionsCol = collection(db, 'missions');

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert Firestore document to Mission object
 */
const docToMission = (docData: DocumentData, docId: string): Mission => {
  return {
    id: docId,
    businessId: docData.businessId,
    businessName: docData.businessName || 'Business',
    businessLogo: docData.businessLogo || '',
    title: docData.title,
    description: docData.description,
    category: docData.category,
    requirements: docData.requirements || [],
    detailedRequirements: docData.detailedRequirements,
    location: docData.location,
    geo: docData.geo,
    radiusMeters: docData.radiusMeters,
    goal: docData.goal,
    maxParticipants: docData.maxParticipants,
    currentParticipants: docData.currentParticipants || 0,
    reward: docData.reward || { type: 'POINTS_ONLY', points: docData.points || 0 },
    image: docData.image || docData.imageUrl,
    proofType: docData.proofType || 'SCREENSHOT',
    createdAt: docData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    validUntil: docData.validUntil || docData.expiresAt?.toDate?.()?.toISOString() || '',
    triggerType: docData.triggerType || 'MANUAL',
    qrCodeSecret: docData.qrCodeSecret,
    isStandard: docData.isStandard,
    isActive: docData.isActive !== undefined ? docData.isActive : true,
    recurrence: docData.recurrence,
    firestoreId: docId,
    lifecycleStatus: docData.lifecycleStatus || docData.status,
    budget: docData.budget,
    approvalRequired: docData.approvalRequired,
    autoApprove: docData.autoApprove,
    targetAudience: docData.targetAudience,
    targetLevel: docData.targetLevel,
    targetCategories: docData.targetCategories
  };
};

// ============================================================================
// PUBLIC FUNCTIONS
// ============================================================================

/**
 * Get all missions for a specific city
 * 
 * @param city - City name
 * @returns Array of missions
 */
export const getMissionsForCity = async (city: string): Promise<Mission[]> => {
  try {
    const q = query(
      missionsCol,
      where('city', '==', city),
      where('status', '==', 'ACTIVE'),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => docToMission(doc.data(), doc.id));
  } catch (error) {
    console.error('[MissionService] Error fetching missions for city:', error);
    throw error;
  }
};

/**
 * Get missions suitable for a user
 * 
 * @param user - User profile
 * @returns Array of missions
 */
export const getMissionsForUser = async (user: UserProfile): Promise<Mission[]> => {
  try {
    const constraints: QueryConstraint[] = [
      where('city', '==', user.city),
      where('lifecycleStatus', '==', 'ACTIVE'),
      where('isActive', '==', true)
    ];

    // Filter out creator-only missions if user is not a creator
    if (!user.creatorMode) {
      constraints.push(where('isCreatorOnly', '==', false));
    }

    // Filter by user level if applicable
    if (user.level) {
      constraints.push(where('minLevel', '<=', user.level));
    }

    const q = query(
      missionsCol,
      ...constraints,
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => docToMission(doc.data(), doc.id));
  } catch (error) {
    console.error('[MissionService] Error fetching missions for user:', error);
    throw error;
  }
};

/**
 * Get creator-only missions for a user with skills
 * 
 * @param user - User profile with creator mode enabled
 * @returns Array of creator missions
 */
export const getCreatorMissionsForUser = async (user: UserProfile): Promise<Mission[]> => {
  try {
    // Return empty if user is not a creator or has no skills
    if (!user.creatorMode || !user.skills || user.skills.length === 0) {
      return [];
    }

    const q = query(
      missionsCol,
      where('city', '==', user.city),
      where('lifecycleStatus', '==', 'ACTIVE'),
      where('isActive', '==', true),
      where('isCreatorOnly', '==', true),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const allCreatorMissions = snapshot.docs.map(doc => docToMission(doc.data(), doc.id));

    // Filter missions that match user's skills
    return allCreatorMissions.filter(mission => {
      // If mission has no skill requirements, it's available to all creators
      if (!mission.requiredSkills || mission.requiredSkills.length === 0) {
        return true;
      }

      // Check if user has at least one required skill
      return mission.requiredSkills.some(requiredSkill => 
        user.skills?.includes(requiredSkill)
      );
    });
  } catch (error) {
    console.error('[MissionService] Error fetching creator missions:', error);
    throw error;
  }
};

/**
 * Get a single mission by ID
 * 
 * @param missionId - Mission document ID
 * @returns Mission object or null if not found
 */
export const getMissionById = async (missionId: string): Promise<Mission | null> => {
  try {
    const docRef = doc(missionsCol, missionId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return docToMission(docSnap.data(), docSnap.id);
  } catch (error) {
    console.error('[MissionService] Error fetching mission by ID:', error);
    throw error;
  }
};

/**
 * Get missions created by a specific business
 * 
 * @param businessId - Business document ID
 * @returns Array of missions
 */
export const getMissionsByBusiness = async (businessId: string): Promise<Mission[]> => {
  try {
    const q = query(
      missionsCol,
      where('businessId', '==', businessId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => docToMission(doc.data(), doc.id));
  } catch (error) {
    console.error('[MissionService] Error fetching missions by business:', error);
    throw error;
  }
};

/**
 * Create a new mission
 * 
 * @param data - Mission data without ID
 * @returns New mission document ID
 */
export const createMission = async (data: Omit<Mission, 'id'>): Promise<{ success: boolean; missionId?: string; error?: string }> => {
  try {
    console.log('[MissionService - CREATE] ===== CREATING MISSION =====');
    console.log('[MissionService - CREATE] Received data.businessName:', data.businessName);
    console.log('[MissionService - CREATE] Received data.businessLogo:', data.businessLogo);
    
    const missionData = {
      businessId: data.businessId,
      businessName: data.businessName,
      businessLogo: data.businessLogo || '',
      title: data.title,
      description: data.description,
      category: data.category,
      requirements: data.requirements,
      detailedRequirements: data.detailedRequirements,
      location: data.location,
      geo: data.geo,
      radiusMeters: data.radiusMeters,
      goal: data.goal,
      maxParticipants: data.maxParticipants,
      currentParticipants: data.currentParticipants || 0,
      reward: data.reward || { type: 'POINTS_ONLY', points: data.points || 0 },
      image: data.image || data.imageUrl,
      proofType: data.proofType || 'SCREENSHOT',
      createdAt: Timestamp.now(),
      validUntil: data.validUntil || (data.expiresAt ? Timestamp.fromDate(new Date(data.expiresAt)) : null),
      triggerType: data.triggerType || 'MANUAL',
      qrCodeSecret: data.qrCodeSecret,
      status: 'ACTIVE',
      lifecycleStatus: data.lifecycleStatus || 'ACTIVE',
      isActive: data.isActive !== false,
      approvalRequired: data.approvalRequired,
      autoApprove: data.autoApprove,
      budget: data.budget,
      targetAudience: data.targetAudience,
      targetLevel: data.targetLevel,
      targetCategories: data.targetCategories,
      isStandard: data.isStandard,
      updatedAt: Timestamp.now()
    };

    console.log('[MissionService - CREATE] Final missionData to save:', missionData);
    console.log('[MissionService - CREATE] businessName in final data:', missionData.businessName);
    console.log('[MissionService - CREATE] businessLogo in final data:', missionData.businessLogo);

    const docRef = await addDoc(missionsCol, missionData);
    
    console.log('[MissionService - CREATE] ✅ Mission created with ID:', docRef.id);
    
    return { 
      success: true, 
      missionId: docRef.id 
    };
  } catch (error) {
    console.error('[MissionService] Error creating mission:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create mission' 
    };
  }
};

/**
 * Update an existing mission
 * 
 * @param missionId - Mission document ID
 * @param updates - Partial mission data to update
 */
export const updateMission = async (
  missionId: string, 
  updates: Partial<Omit<Mission, 'id'>>
): Promise<void> => {
  try {
    const docRef = doc(missionsCol, missionId);
    
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now()
    };

    // Convert date strings to Timestamps if present
    if (updates.expiresAt) {
      updateData.expiresAt = Timestamp.fromDate(new Date(updates.expiresAt));
    }

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('[MissionService] Error updating mission:', error);
    throw error;
  }
};

/**
 * Delete a mission
 * Note: This is a hard delete. Use cancelMission for proper cleanup with refunds.
 * 
 * @param missionId - Mission document ID
 */
export const deleteMission = async (missionId: string): Promise<void> => {
  try {
    const docRef = doc(missionsCol, missionId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('[MissionService] Error deleting mission:', error);
    throw error;
  }
};

/**
 * Cancel a mission with proper cleanup and refunds
 * - Marks mission as cancelled
 * - Refunds points to business if mission was funded
 * - Notifies participants
 * 
 * @param missionId - Mission document ID
 * @param reason - Cancellation reason (optional)
 */
export const cancelMission = async (
  missionId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log(`[MissionService] Cancelling mission ${missionId}`);
    
    // Get mission details
    const mission = await getMissionById(missionId);
    if (!mission) {
      return { success: false, error: 'Mission not found' };
    }

    // Mark mission as cancelled
    const docRef = doc(missionsCol, missionId);
    await updateDoc(docRef, {
      lifecycleStatus: 'CANCELLED',
      isActive: false,
      cancelledAt: Timestamp.now(),
      cancellationReason: reason || 'Cancelled by business',
      updatedAt: Timestamp.now()
    });

    console.log(`[MissionService] Mission marked as cancelled`);

    // Calculate refund amount
    // Check if mission was funded with points
    const pointsSpent = mission.reward?.points || 0;
    const maxParticipants = mission.maxParticipants || 0;
    const completedParticipants = mission.currentParticipants || 0;
    const remainingSlots = maxParticipants - completedParticipants;
    
    // Refund points for unclaimed slots
    if (remainingSlots > 0 && pointsSpent > 0) {
      try {
        const { refundPoints } = await import('../../services/pointsMarketplaceService');
        
        const refundAmount = pointsSpent * remainingSlots;
        const refundResult = await refundPoints(
          mission.businessId,
          refundAmount,
          `mission_cancellation_${missionId}`,
          `Refund for cancelled mission: ${mission.title} (${remainingSlots} unclaimed slots)`,
          {
            missionId,
            missionTitle: mission.title,
            reason: 'mission_cancelled',
            pointsPerSlot: pointsSpent,
            slotsRefunded: remainingSlots,
            completedParticipants,
            maxParticipants
          }
        );

        if (refundResult.success) {
          console.log(`[MissionService] ✅ Refunded ${refundAmount} points to business`);
        } else {
          console.error('[MissionService] ❌ Failed to refund points:', refundResult.error);
        }
      } catch (refundError) {
        console.error('[MissionService] Error processing refund:', refundError);
        // Don't fail cancellation if refund fails
      }
    }

    // Notify any pending participants
    try {
      const { getParticipationsForMission } = await import('./participationService');
      const { createNotification } = await import('../../services/notificationService');
      
      const participations = await getParticipationsForMission(missionId);
      const pendingParticipations = participations.filter(
        p => p.status === 'PENDING' || p.status === 'APPROVED'
      );

      if (pendingParticipations.length > 0) {
        console.log(`[MissionService] Notifying ${pendingParticipations.length} participants`);
        
        await Promise.all(
          pendingParticipations.map(p =>
            createNotification(p.userId, {
              type: 'SYSTEM',
              title: '❌ Mission Cancelled',
              message: `The mission "${mission.title}" has been cancelled. ${reason || ''}`,
              actionLink: '/missions'
            }).catch(err => {
              console.error(`[MissionService] Failed to notify user ${p.userId}:`, err);
            })
          )
        );
      }
    } catch (notifError) {
      console.error('[MissionService] Error notifying participants:', notifError);
      // Don't fail cancellation if notifications fail
    }

    console.log(`[MissionService] ✅ Mission cancelled successfully`);
    return { success: true };
  } catch (error) {
    console.error('[MissionService] Error cancelling mission:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel mission'
    };
  }
};

/**
 * Get active missions (shortcut for common query)
 * 
 * @returns Array of active missions
 */
export const getActiveMissions = async (): Promise<Mission[]> => {
  try {
    // Simplified query - just get all missions first, then filter in code
    const q = query(
      missionsCol,
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    console.log('[MissionService] ===== MISSION DEBUG =====');
    console.log('[MissionService] Total missions in DB:', snapshot.size);
    
    const allMissions = snapshot.docs.map(doc => {
      const data = doc.data();
      console.log('[MissionService] Mission RAW Firestore data:', doc.id, data);
      console.log('[MissionService] Mission mapped:', {
        id: doc.id,
        businessName: data.businessName,
        businessLogo: data.businessLogo,
        title: data.title,
        lifecycleStatus: data.lifecycleStatus,
        isActive: data.isActive,
        category: data.category,
        reward: data.reward,
        points: data.points
      });
      return docToMission(data, doc.id);
    });
    
    // Filter active missions in code
    const activeMissions = allMissions.filter(m => 
      (m.lifecycleStatus === 'ACTIVE' || m.status === 'ACTIVE') && 
      (m.isActive !== false)
    );
    
    console.log('[MissionService] Active missions count:', activeMissions.length);
    
    // TEMPORARY: If no active missions, return ALL missions so you can see them
    if (activeMissions.length === 0) {
      console.warn('[MissionService] No active missions found, returning ALL missions for debugging');
      return allMissions;
    }
    
    console.log('[MissionService] Returning active missions:', activeMissions.map(m => ({
      id: m.id,
      businessName: m.businessName,
      title: m.title
    })));
    
    return activeMissions;
  } catch (error) {
    console.error('[MissionService] Error fetching active missions:', error);
    throw error;
  }
};

/**
 * Decrement mission slots remaining (when someone accepts)
 * 
 * @param missionId - Mission document ID
 * @returns Updated slots remaining count
 */
export const decrementMissionSlots = async (missionId: string): Promise<number> => {
  try {
    const mission = await getMissionById(missionId);
    
    if (!mission) {
      throw new Error('Mission not found');
    }

    if (mission.slotsRemaining === undefined || mission.slotsRemaining <= 0) {
      throw new Error('No slots available');
    }

    const newSlotsRemaining = mission.slotsRemaining - 1;
    const docRef = doc(missionsCol, missionId);

    const updates: any = {
      slotsRemaining: newSlotsRemaining,
      updatedAt: Timestamp.now()
    };

    // If no slots remaining, mark as completed
    if (newSlotsRemaining === 0) {
      updates.status = 'COMPLETED';
    }

    await updateDoc(docRef, updates);
    return newSlotsRemaining;
  } catch (error) {
    console.error('[MissionService] Error decrementing mission slots:', error);
    throw error;
  }
};
