/**
 * Application Service
 * Handles creator applications to business missions
 */

import { db } from './AuthContext';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc,
  getDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

export interface Application {
  id: string;
  missionId: string;
  creatorId: string;
  businessId: string;
  status: 'applied' | 'shortlisted' | 'accepted' | 'rejected';
  note?: string;
  creatorRolesSnapshot?: string[]; // Snapshot of creator roles at time of application
  createdAt: string;
  updatedAt?: string;
}

const applicationsCol = collection(db, 'applications');

/**
 * Submit application to a mission
 */
export const applyToMission = async (
  missionId: string,
  creatorId: string,
  businessId: string,
  note?: string,
  creatorRoles?: string[]
): Promise<{ success: boolean; applicationId?: string; error?: string }> => {
  try {
    // Check for duplicate application
    const existingQuery = query(
      applicationsCol,
      where('missionId', '==', missionId),
      where('creatorId', '==', creatorId)
    );
    
    const existingSnapshot = await getDocs(existingQuery);
    
    if (!existingSnapshot.empty) {
      return { 
        success: false, 
        error: 'You have already applied to this opportunity' 
      };
    }

    // Create application
    const applicationData = {
      missionId,
      creatorId,
      businessId,
      status: 'applied' as const,
      note: note || '',
      creatorRolesSnapshot: creatorRoles || [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(applicationsCol, applicationData);
    
    console.log('[ApplicationService] Application submitted:', docRef.id);
    
    return { 
      success: true, 
      applicationId: docRef.id 
    };
  } catch (error) {
    console.error('[ApplicationService] Error submitting application:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to submit application' 
    };
  }
};

/**
 * Get creator's applications
 */
export const getCreatorApplications = async (creatorId: string): Promise<Application[]> => {
  try {
    const q = query(
      applicationsCol,
      where('creatorId', '==', creatorId)
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt instanceof Timestamp 
        ? doc.data().createdAt.toDate().toISOString() 
        : doc.data().createdAt
    })) as Application[];
  } catch (error) {
    console.error('[ApplicationService] Error fetching applications:', error);
    return [];
  }
};

/**
 * Check if creator has applied to a mission
 */
export const hasAppliedToMission = async (
  missionId: string, 
  creatorId: string
): Promise<boolean> => {
  try {
    const q = query(
      applicationsCol,
      where('missionId', '==', missionId),
      where('creatorId', '==', creatorId)
    );
    
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error('[ApplicationService] Error checking application:', error);
    return false;
  }
};

/**
 * Get applications for a mission (business view)
 */
export const getMissionApplications = async (missionId: string): Promise<Application[]> => {
  try {
    const q = query(
      applicationsCol,
      where('missionId', '==', missionId)
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt instanceof Timestamp 
        ? doc.data().createdAt.toDate().toISOString() 
        : doc.data().createdAt
    })) as Application[];
  } catch (error) {
    console.error('[ApplicationService] Error fetching mission applications:', error);
    return [];
  }
};

/**
 * Update application status (business action)
 */
export const updateApplicationStatus = async (
  applicationId: string,
  status: Application['status']
): Promise<{ success: boolean; error?: string }> => {
  try {
    const docRef = doc(applicationsCol, applicationId);
    
    await updateDoc(docRef, {
      status,
      updatedAt: serverTimestamp()
    });
    
    console.log('[ApplicationService] Application status updated:', applicationId, status);
    
    return { success: true };
  } catch (error) {
    console.error('[ApplicationService] Error updating application:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update application' 
    };
  }
};
