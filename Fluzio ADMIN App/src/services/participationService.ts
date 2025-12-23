/**
 * Participation Service - Firestore Integration
 * 
 * Manages mission participations (users applying to missions)
 * Replaces MockStore participation tracking
 */

import { db } from '../../services/AuthContext';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc,
  Timestamp,
  deleteDoc
} from 'firebase/firestore';
import { trackMissionCompletion } from '../../services/customerTrackingService';
import { notifyMissionApproved, notifyMissionRejected, notifyMissionApplication } from '../../services/notificationServiceEnhanced';
import { logPointsTransaction } from '../../services/pointsMarketplaceService';

// ============================================================================
// TYPES
// ============================================================================

export interface Participation {
  id: string;
  missionId: string;
  userId: string;
  businessId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  appliedAt: string;
  approvedAt?: string;
  completedAt?: string;
  proofUrl?: string;
  proofText?: string;
  proofSubmittedAt?: string;
  points?: number;
  feedback?: string;
}

// ============================================================================
// FIRESTORE COLLECTION
// ============================================================================

const participationsCol = collection(db, 'participations');

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const docToParticipation = (data: any, id: string): Participation => {
  return {
    id,
    missionId: data.missionId,
    userId: data.userId,
    businessId: data.businessId,
    status: data.status || 'PENDING',
    appliedAt: data.appliedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    approvedAt: data.approvedAt?.toDate?.()?.toISOString(),
    completedAt: data.completedAt?.toDate?.()?.toISOString(),
    proofUrl: data.proofUrl,
    proofText: data.proofText,
    proofSubmittedAt: data.proofSubmittedAt?.toDate?.()?.toISOString(),
    points: data.points,
    feedback: data.feedback
  };
};

// ============================================================================
// PUBLIC FUNCTIONS
// ============================================================================

/**
 * Apply to a mission
 */
export const applyToMission = async (
  missionId: string,
  userId: string,
  businessId: string
): Promise<{ success: boolean; participationId?: string; error?: string }> => {
  try {
    console.log('[ParticipationService] applyToMission called with:', { missionId, userId, businessId });
    
    // Check if already applied
    const existingQuery = query(
      participationsCol,
      where('missionId', '==', missionId),
      where('userId', '==', userId)
    );
    const existingSnap = await getDocs(existingQuery);
    
    if (!existingSnap.empty) {
      console.log('[ParticipationService] User already applied to this mission');
      return {
        success: false,
        error: 'Already applied to this mission'
      };
    }

    // Create participation
    const participationData = {
      missionId,
      userId,
      businessId,
      status: 'PENDING',
      appliedAt: Timestamp.now()
    };
    
    console.log('[ParticipationService] Creating participation:', participationData);
    const docRef = await addDoc(participationsCol, participationData);
    console.log('[ParticipationService] Participation created successfully with ID:', docRef.id);

    // Send notification to business
    try {
      const { createNotification } = await import('../../services/notificationService');
      const { api } = await import('../../services/apiService');
      const { getMissionById } = await import('../../services/missionService');
      
      // Get user and mission details for notification
      const userResult = await api.getUser(userId);
      const mission = await getMissionById(missionId);
      
      if (userResult.success && userResult.user && mission) {
        await createNotification(businessId, {
          type: 'MISSION_APPLICATION',
          title: '🎯 New Mission Application',
          message: `${userResult.user.name} applied to your mission "${mission.title}"`,
          actionLink: `/verify`
        });
        console.log('[ParticipationService] ✅ Notification sent to business');
        
        // Also send enhanced notification
        try {
          await notifyMissionApplication(businessId, missionId, userId, userResult.user.name, mission.title);
        } catch (enhancedNotifError) {
          console.error('[ParticipationService] Failed to send enhanced notification:', enhancedNotifError);
        }
      }
    } catch (notifError) {
      console.error('[ParticipationService] Failed to send notification:', notifError);
      // Don't fail the whole operation if notification fails
    }

    return {
      success: true,
      participationId: docRef.id
    };
  } catch (error) {
    console.error('[ParticipationService] Error applying to mission:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to apply'
    };
  }
};

/**
 * Get all participations for a user
 */
export const getParticipationsForUser = async (userId: string): Promise<Participation[]> => {
  try {
    const q = query(
      participationsCol,
      where('userId', '==', userId),
      orderBy('appliedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => docToParticipation(doc.data(), doc.id));
  } catch (error) {
    console.error('[ParticipationService] Error fetching user participations:', error);
    return [];
  }
};

/**
 * Get all participations for a business
 */
export const getParticipationsForBusiness = async (businessId: string): Promise<Participation[]> => {
  try {
    console.log('[ParticipationService] getParticipationsForBusiness called for businessId:', businessId);
    
    const q = query(
      participationsCol,
      where('businessId', '==', businessId),
      orderBy('appliedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    console.log('[ParticipationService] Found', snapshot.docs.length, 'participations for business');
    
    const participations = snapshot.docs.map(doc => {
      const data = docToParticipation(doc.data(), doc.id);
      console.log('[ParticipationService] Participation:', { id: doc.id, missionId: data.missionId, userId: data.userId, status: data.status });
      return data;
    });
    
    return participations;
  } catch (error) {
    console.error('[ParticipationService] Error fetching business participations:', error);
    return [];
  }
};

/**
 * Get participations for a specific mission
 */
export const getParticipationsForMission = async (missionId: string): Promise<Participation[]> => {
  try {
    const q = query(
      participationsCol,
      where('missionId', '==', missionId),
      orderBy('appliedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => docToParticipation(doc.data(), doc.id));
  } catch (error) {
    console.error('[ParticipationService] Error fetching mission participations:', error);
    return [];
  }
};

/**
 * Check if user has applied to a mission
 */
export const getParticipation = async (
  missionId: string,
  userId: string
): Promise<Participation | null> => {
  try {
    const q = query(
      participationsCol,
      where('missionId', '==', missionId),
      where('userId', '==', userId)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return docToParticipation(doc.data(), doc.id);
  } catch (error) {
    console.error('[ParticipationService] Error checking participation:', error);
    return null;
  }
};

/**
 * Submit proof for a mission
 */
export const submitProof = async (
  participationId: string,
  proofUrl: string,
  proofText?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const docRef = doc(participationsCol, participationId);
    
    await updateDoc(docRef, {
      proofUrl,
      proofText: proofText || '',
      proofSubmittedAt: Timestamp.now(),
      status: 'PENDING' // Reset to pending for review
    });

    return { success: true };
  } catch (error) {
    console.error('[ParticipationService] Error submitting proof:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit proof'
    };
  }
};

/**
 * Approve a participation (business action)
 */
export const approveParticipation = async (
  participationId: string,
  pointsOverride?: number
): Promise<{ success: boolean; error?: string }> => {
  try {
    const docRef = doc(participationsCol, participationId);
    const participationSnap = await getDoc(docRef);
    
    if (!participationSnap.exists()) {
      console.error('[ParticipationService] Participation not found:', participationId);
      return { success: false, error: 'Participation not found' };
    }
    
    const participation = participationSnap.data();
    const missionId = participation.missionId;
    const userId = participation.userId;
    
    console.log('[ParticipationService] ===== APPROVING PARTICIPATION =====');
    console.log('[ParticipationService] Participation ID:', participationId);
    console.log('[ParticipationService] User ID:', userId);
    console.log('[ParticipationService] Mission ID:', missionId);
    
    // Get mission to find reward points
    const missionsCol = collection(db, 'missions');
    const missionRef = doc(missionsCol, missionId);
    const missionSnap = await getDoc(missionRef);
    
    let points = pointsOverride || 100; // Default to 100 if not specified
    let missionData: any = null;
    
    if (missionSnap.exists()) {
      missionData = missionSnap.data();
      points = pointsOverride || missionData.reward?.points || missionData.points || 100;
      console.log('[ParticipationService] Mission reward points:', points);
    } else {
      console.warn('[ParticipationService] Mission not found, using default points:', points);
    }
    
    // Update participation status
    await updateDoc(docRef, {
      status: 'APPROVED',
      approvedAt: Timestamp.now(),
      points
    });
    console.log('[ParticipationService] ✅ Participation status updated to APPROVED');

    // Award points to user
    console.log('[ParticipationService] 💰 Awarding points to user...');
    const usersCol = collection(db, 'users');
    const userRef = doc(usersCol, userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.data();
      const currentPoints = userData.points || 0;
      const newPoints = currentPoints + points;
      
      // Calculate new level based on points
      const newLevel = Math.floor(Math.sqrt(newPoints / 100)) + 1;
      
      console.log('[ParticipationService] Current points:', currentPoints);
      console.log('[ParticipationService] Points to add:', points);
      console.log('[ParticipationService] New total:', newPoints);
      console.log('[ParticipationService] New level:', newLevel);
      
      await updateDoc(userRef, {
        points: newPoints,
        level: newLevel
      });
      
      // Log transaction for points earned
      await logPointsTransaction(
        userId,
        'EARN',
        points,
        `mission_completion_${missionId}`,
        `Completed mission: ${missionData?.title || 'Mission'}`,
        currentPoints,
        newPoints,
        {
          missionId,
          participationId,
          businessId: missionData?.businessId
        }
      );
      
      console.log('[ParticipationService] ✅ Points awarded successfully! User', userId, 'now has', newPoints, 'points and is level', newLevel);
    } else {
      console.error('[ParticipationService] ❌ User document not found in Firestore:', userId);
      console.error('[ParticipationService] Cannot award points - user does not exist');
      return { success: false, error: 'User not found in Firestore' };
    }

    // Increment mission's currentParticipants count
    if (missionSnap.exists()) {
      const missionData = missionSnap.data();
      const currentCount = missionData.currentParticipants || 0;
      const maxParticipants = missionData.maxParticipants || Infinity;
      const newCount = currentCount + 1;
      
      // Update mission participant count
      const updateData: any = {
        currentParticipants: newCount
      };
      
      // Check if mission is now full and should be marked as completed
      if (newCount >= maxParticipants) {
        updateData.isActive = false;
        updateData.lifecycleStatus = 'COMPLETED';
      }
      
      await updateDoc(missionRef, updateData);
      console.log(`[ParticipationService] Mission ${missionId} participants: ${newCount}/${maxParticipants}`);
    }

    // Send notification to customer
    try {
      const { createNotification } = await import('../../services/notificationService');
      const { getMissionById } = await import('../../services/missionService');
      
      const mission = await getMissionById(missionId);
      
      if (mission) {
        // Track mission completion for customer analytics
        await trackMissionCompletion(userId, mission.businessId);
        
        await createNotification(userId, {
          type: 'MISSION_APPROVED',
          title: '🎉 Mission Approved!',
          message: `Your mission "${mission.title}" was approved! You earned ${points} points.`,
          actionLink: `/home`
        });
        console.log('[ParticipationService] ✅ Notification sent to user');
        
        // Also send enhanced notification
        try {
          await notifyMissionApproved(userId, missionId, mission.title, points);
        } catch (enhancedNotifError) {
          console.error('[ParticipationService] Failed to send enhanced notification:', enhancedNotifError);
        }
      }
    } catch (notifError) {
      console.error('[ParticipationService] Failed to send approval notification:', notifError);
      // Don't fail the whole operation if notification fails
    }

    console.log('[ParticipationService] ===== APPROVAL COMPLETE =====');
    return { success: true };
  } catch (error) {
    console.error('[ParticipationService] ❌ Error approving participation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to approve'
    };
  }
};

/**
 * Reject a participation (business action)
 */
export const rejectParticipation = async (
  participationId: string,
  feedback?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const docRef = doc(participationsCol, participationId);
    const participationSnap = await getDoc(docRef);
    
    if (!participationSnap.exists()) {
      return { success: false, error: 'Participation not found' };
    }
    
    const participation = participationSnap.data();
    const userId = participation.userId;
    const missionId = participation.missionId;
    
    // Update participation status
    await updateDoc(docRef, {
      status: 'REJECTED',
      rejectedAt: Timestamp.now(),
      feedback: feedback || 'Proof does not meet requirements'
    });

    // Refund points if the participation was previously approved
    if (participation.status === 'APPROVED' && participation.points) {
      try {
        const { refundPoints } = await import('../../services/pointsMarketplaceService');
        const { getMissionById } = await import('../../services/missionService');
        
        const mission = await getMissionById(missionId);
        const refundResult = await refundPoints(
          userId,
          participation.points,
          `mission_rejection_${missionId}`,
          `Refund for rejected mission: ${mission?.title || 'Mission'}`,
          {
            participationId,
            missionId,
            reason: 'participation_rejected',
            feedback: feedback || 'Proof does not meet requirements'
          }
        );
        
        if (refundResult.success) {
          console.log(`[ParticipationService] ✅ Refunded ${participation.points} points to user`);
        } else {
          console.error('[ParticipationService] ❌ Failed to refund points:', refundResult.error);
        }
      } catch (refundError) {
        console.error('[ParticipationService] Error processing refund:', refundError);
        // Don't fail the rejection if refund fails
      }
    }

    // Send notification to customer
    try {
      const { createNotification } = await import('../../services/notificationService');
      const { getMissionById } = await import('../../services/missionService');
      
      const mission = await getMissionById(missionId);
      
      if (mission) {
        // Include refund info in message if points were refunded
        const refundMsg = (participation.status === 'APPROVED' && participation.points) 
          ? ` Your ${participation.points} points have been refunded.`
          : '';
        
        await createNotification(userId, {
          type: 'MISSION_REJECTED',
          title: '❌ Mission Rejected',
          message: `Your mission "${mission.title}" was rejected. ${feedback || 'Please try again.'}${refundMsg}`,
          actionLink: `/missions`
        });
        console.log('[ParticipationService] ✅ Rejection notification sent to user');
        
        // Also send enhanced notification
        try {
          await notifyMissionRejected(userId, missionId, mission.title, feedback);
        } catch (enhancedNotifError) {
          console.error('[ParticipationService] Failed to send enhanced rejection notification:', enhancedNotifError);
        }
      }
    } catch (notifError) {
      console.error('[ParticipationService] Failed to send rejection notification:', notifError);
      // Don't fail the whole operation if notification fails
    }

    return { success: true };
  } catch (error) {
    console.error('[ParticipationService] Error rejecting participation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reject'
    };
  }
};

/**
 * Complete a participation
 */
export const completeParticipation = async (
  participationId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const docRef = doc(participationsCol, participationId);
    
    await updateDoc(docRef, {
      status: 'COMPLETED',
      completedAt: Timestamp.now()
    });

    return { success: true };
  } catch (error) {
    console.error('[ParticipationService] Error completing participation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to complete'
    };
  }
};

/**
 * Delete a participation
 */
export const deleteParticipation = async (
  participationId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const docRef = doc(participationsCol, participationId);
    await deleteDoc(docRef);

    return { success: true };
  } catch (error) {
    console.error('[ParticipationService] Error deleting participation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete'
    };
  }
};
