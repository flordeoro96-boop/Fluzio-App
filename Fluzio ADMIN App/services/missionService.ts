import { db } from './apiService';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  serverTimestamp 
} from 'firebase/firestore';
import { Mission, MissionLifecycleStatus, Participation, MissionStatus } from '../types';

// Create a new mission
export const createMission = async (missionData: Partial<Mission>): Promise<{ success: boolean; missionId?: string; error?: string }> => {
  try {
    console.log('[MissionService - CREATE] ===== CREATING MISSION =====');
    console.log('[MissionService - CREATE] Received missionData:', missionData);
    console.log('[MissionService - CREATE] businessId:', missionData.businessId);
    console.log('[MissionService - CREATE] businessName:', missionData.businessName);
    console.log('[MissionService - CREATE] businessLogo:', missionData.businessLogo);
    
    const now = new Date().toISOString();
    
    const newMission = {
      ...missionData,
      currentParticipants: 0,
      lifecycleStatus: 'DRAFT' as MissionLifecycleStatus,
      createdAt: now,
      isActive: false,
    };

    console.log('[MissionService - CREATE] Final mission object to save:', newMission);

    const docRef = await addDoc(collection(db, 'missions'), newMission);
    
    return { 
      success: true, 
      missionId: docRef.id 
    };
  } catch (error) {
    console.error('Error creating mission:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create mission' 
    };
  }
};

// Get missions by business ID
export const getMissionsByBusiness = async (
  businessId: string, 
  status?: MissionLifecycleStatus
): Promise<Mission[]> => {
  try {
    let q = query(
      collection(db, 'missions'),
      where('businessId', '==', businessId),
      orderBy('createdAt', 'desc')
    );

    if (status) {
      q = query(
        collection(db, 'missions'),
        where('businessId', '==', businessId),
        where('lifecycleStatus', '==', status),
        orderBy('createdAt', 'desc')
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Mission));
  } catch (error) {
    console.error('Error fetching missions:', error);
    return [];
  }
};

// Get active missions for explore/discovery
export const getActiveMissions = async (
  category?: string,
  maxResults: number = 20
): Promise<Mission[]> => {
  try {
    let q = query(
      collection(db, 'missions'),
      where('lifecycleStatus', '==', 'ACTIVE'),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc'),
      limit(maxResults)
    );

    if (category) {
      q = query(
        collection(db, 'missions'),
        where('lifecycleStatus', '==', 'ACTIVE'),
        where('isActive', '==', true),
        where('category', '==', category),
        orderBy('createdAt', 'desc'),
        limit(maxResults)
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Mission));
  } catch (error) {
    console.error('Error fetching active missions:', error);
    return [];
  }
};

// Get missions filtered by user interests and level
export const getMissionsForUser = async (
  userId: string,
  userInterests?: string[],
  userLevel?: string,
  userLocation?: { latitude: number; longitude: number },
  maxResults: number = 20
): Promise<Mission[]> => {
  try {
    // First, get all active missions
    const allMissions = await getActiveMissions(undefined, 100);
    
    // Filter and score missions
    const scoredMissions = allMissions.map(mission => {
      let score = 0;
      
      // Interest matching (highest priority)
      if (userInterests && userInterests.length > 0) {
        if (mission.targetCategories) {
          const matchingInterests = mission.targetCategories.filter(
            cat => userInterests.includes(cat)
          );
          score += matchingInterests.length * 10;
        }
        // Also check main category
        if (userInterests.includes(mission.category)) {
          score += 15;
        }
      }
      
      // Level matching
      if (userLevel && mission.targetLevel) {
        if (mission.targetLevel.includes(userLevel as any)) {
          score += 8;
        }
      } else if (!mission.targetLevel) {
        // Missions without level requirements are suitable for all
        score += 5;
      }
      
      // Location proximity (if available)
      if (userLocation && mission.geo) {
        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          mission.geo.latitude,
          mission.geo.longitude
        );
        
        // Closer missions get higher scores
        if (distance < 1) score += 20; // Within 1km
        else if (distance < 5) score += 10; // Within 5km
        else if (distance < 10) score += 5; // Within 10km
      }
      
      // Availability (slots remaining)
      if (mission.maxParticipants) {
        const slotsRemaining = mission.maxParticipants - mission.currentParticipants;
        if (slotsRemaining > 0) {
          score += Math.min(slotsRemaining, 5); // Up to 5 points for availability
        }
      } else {
        score += 5; // Unlimited slots
      }
      
      // Recency bonus
      const age = Date.now() - new Date(mission.createdAt).getTime();
      const daysSinceCreated = age / (1000 * 60 * 60 * 24);
      if (daysSinceCreated < 1) score += 3; // New missions (< 1 day)
      
      return { mission, score };
    });
    
    // Sort by score and return top results
    return scoredMissions
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults)
      .map(item => item.mission);
      
  } catch (error) {
    console.error('Error fetching missions for user:', error);
    return [];
  }
};

// Helper function to calculate distance
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Get single mission by ID
export const getMissionById = async (missionId: string): Promise<Mission | null> => {
  try {
    const docRef = doc(db, 'missions', missionId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log('[MissionService] getMissionById - Mission data:', { id: docSnap.id, businessId: data.businessId, businessName: data.businessName });
      return {
        id: docSnap.id,
        ...data
      } as Mission;
    }
    console.log('[MissionService] getMissionById - Mission not found:', missionId);
    return null;
  } catch (error) {
    console.error('Error fetching mission:', error);
    return null;
  }
};

// Update mission
export const updateMission = async (
  missionId: string, 
  updates: Partial<Mission>
): Promise<{ success: boolean; error?: string }> => {
  try {
    const docRef = doc(db, 'missions', missionId);
    await updateDoc(docRef, updates);
    return { success: true };
  } catch (error) {
    console.error('Error updating mission:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update mission' 
    };
  }
};

// Publish mission (change from DRAFT to ACTIVE)
export const publishMission = async (missionId: string): Promise<{ success: boolean; error?: string }> => {
  const result = await updateMission(missionId, {
    lifecycleStatus: 'ACTIVE',
    isActive: true
  });

  if (result.success) {
    // Notify followers about the new mission
    try {
      const mission = await getMissionById(missionId);
      if (mission) {
        const { getBusinessFollowers } = await import('./businessService');
        const { createNotification } = await import('./notificationService');
        
        const followers = await getBusinessFollowers(mission.businessId);
        console.log(`[MissionService] Notifying ${followers.length} followers about new mission`);
        
        // Send notification to all followers
        const notificationPromises = followers.map(userId =>
          createNotification(userId, {
            type: 'MISSION_POSTED',
            title: '🎯 New Mission Available!',
            message: `${mission.businessName || 'A business you follow'} posted a new mission: "${mission.title}"`,
            actionLink: `/missions/${missionId}`
          }).catch(err => {
            console.error(`[MissionService] Failed to notify user ${userId}:`, err);
          })
        );
        
        await Promise.all(notificationPromises);
        console.log('[MissionService] ✅ All followers notified');
      }
    } catch (notifError) {
      console.error('[MissionService] Failed to send notifications to followers:', notifError);
      // Don't fail the whole operation if notifications fail
    }
  }

  return result;
};

// Pause/Resume mission
export const toggleMissionStatus = async (
  missionId: string, 
  pause: boolean
): Promise<{ success: boolean; error?: string }> => {
  return updateMission(missionId, {
    lifecycleStatus: pause ? 'PAUSED' : 'ACTIVE',
    isActive: !pause
  });
};

// Get max participants based on subscription level
export const getMaxParticipantsBySubscription = (subscriptionLevel: string): number => {
  switch (subscriptionLevel) {
    case 'SILVER':
      return 10;
    case 'GOLD':
      return 50;
    case 'PLATINUM':
      return 100;
    case 'FREE':
    default:
      return 5; // Free tier gets limited participants
  }
};

// Delete mission
export const deleteMission = async (missionId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    await deleteDoc(doc(db, 'missions', missionId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting mission:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete mission' 
    };
  }
};

// Apply to mission (creator submits application)
// DEPRECATED: Use participationService.applyToMission instead
// This function is kept for backward compatibility only
export const applyToMission = async (
  missionId: string,
  userId: string
): Promise<{ success: boolean; participationId?: string; error?: string }> => {
  console.warn('[MissionService] applyToMission is DEPRECATED. Use participationService.applyToMission instead.');
  
  try {
    // Get mission to extract businessId
    const mission = await getMissionById(missionId);
    if (!mission || !mission.businessId) {
      return {
        success: false,
        error: 'Mission not found or missing businessId'
      };
    }

    const participation = {
      missionId,
      userId,
      businessId: mission.businessId, // NOW INCLUDES businessId
      status: 'PENDING' as const,
      submittedAt: new Date().toISOString()
    };

    console.log('[MissionService] Creating participation with businessId:', participation);
    const docRef = await addDoc(collection(db, 'participations'), participation);
    
    return { 
      success: true, 
      participationId: docRef.id 
    };
  } catch (error) {
    console.error('Error applying to mission:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to apply to mission' 
    };
  }
};

// Submit proof for mission completion
export const submitMissionProof = async (
  participationId: string,
  proofData: {
    proofUrl?: string;
    proofText?: string;
  }
): Promise<{ success: boolean; error?: string }> => {
  try {
    const docRef = doc(db, 'participations', participationId);
    await updateDoc(docRef, {
      ...proofData,
      status: 'PENDING_APPROVAL',
      submittedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error('Error submitting proof:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to submit proof' 
    };
  }
};

// Get participations for a mission (for business to review)
export const getMissionParticipations = async (
  missionId: string,
  status?: MissionStatus
): Promise<Participation[]> => {
  try {
    let q = query(
      collection(db, 'participations'),
      where('missionId', '==', missionId),
      orderBy('submittedAt', 'desc')
    );

    if (status) {
      q = query(
        collection(db, 'participations'),
        where('missionId', '==', missionId),
        where('status', '==', status),
        orderBy('submittedAt', 'desc')
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Participation));
  } catch (error) {
    console.error('Error fetching participations:', error);
    return [];
  }
};

// Get user's participations (for creator's mission history)
export const getUserParticipations = async (
  userId: string,
  status?: MissionStatus
): Promise<Participation[]> => {
  try {
    let q = query(
      collection(db, 'participations'),
      where('userId', '==', userId),
      orderBy('submittedAt', 'desc')
    );

    if (status) {
      q = query(
        collection(db, 'participations'),
        where('userId', '==', userId),
        where('status', '==', status),
        orderBy('submittedAt', 'desc')
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Participation));
  } catch (error) {
    console.error('Error fetching user participations:', error);
    return [];
  }
};

// Approve or reject participation
export const reviewParticipation = async (
  participationId: string,
  approved: boolean,
  feedback?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const docRef = doc(db, 'participations', participationId);
    await updateDoc(docRef, {
      status: approved ? 'APPROVED' : 'REJECTED',
      reviewedAt: new Date().toISOString(),
      feedback
    });
    return { success: true };
  } catch (error) {
    console.error('Error reviewing participation:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to review participation' 
    };
  }
};

// Get mission statistics
export const getMissionStats = async (businessId: string): Promise<{
  totalMissions: number;
  activeMissions: number;
  totalApplications: number;
  pendingReviews: number;
  completedMissions: number;
}> => {
  try {
    const missions = await getMissionsByBusiness(businessId);
    const activeMissions = missions.filter(m => m.lifecycleStatus === 'ACTIVE').length;
    const completedMissions = missions.filter(m => m.lifecycleStatus === 'COMPLETED').length;

    // Get all participations for this business's missions
    const missionIds = missions.map(m => m.id);
    let totalApplications = 0;
    let pendingReviews = 0;

    for (const missionId of missionIds) {
      const participations = await getMissionParticipations(missionId);
      totalApplications += participations.length;
      pendingReviews += participations.filter(p => p.status === 'APPROVED').length;
    }

    return {
      totalMissions: missions.length,
      activeMissions,
      totalApplications,
      pendingReviews,
      completedMissions
    };
  } catch (error) {
    console.error('Error fetching mission stats:', error);
    return {
      totalMissions: 0,
      activeMissions: 0,
      totalApplications: 0,
      pendingReviews: 0,
      completedMissions: 0
    };
  }
};
