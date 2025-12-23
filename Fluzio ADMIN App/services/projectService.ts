import { db } from './AuthContext';
import { collection, query, where, orderBy, getDocs, doc, getDoc, addDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { Project, ProjectSlot } from '../types';

/**
 * Project Service - Firestore integration
 * Replaces MockStore projects with real data
 */

// Get all projects
export const getProjects = async (): Promise<Project[]> => {
  try {
    const projectsRef = collection(db, 'projects');
    const q = query(projectsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        totalCost: data.totalCost || 0,
        organizerId: data.organizerId,
        slots: data.slots || []
      };
    });
  } catch (error) {
    console.error('[ProjectService] Error fetching projects:', error);
    return [];
  }
};

// Create a new project
export const createProject = async (
  organizerId: string,
  title: string,
  slots: ProjectSlot[]
): Promise<string> => {
  try {
    const totalCost = slots.reduce((sum, slot) => sum + slot.cost, 0);
    
    const projectsRef = collection(db, 'projects');
    const docRef = await addDoc(projectsRef, {
      title,
      totalCost,
      organizerId,
      slots,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    console.log('[ProjectService] Project created:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('[ProjectService] Error creating project:', error);
    throw error;
  }
};
// Get creator applications for projects
export interface ProjectApplication {
  id: string;
  projectId: string;
  creatorId: string;
  roleId: string;
  roleName?: string; // Display name of the role
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  appliedAt: string;
  createdAt?: string; // Alias for appliedAt
  message?: string;
  coverLetter?: string; // Cover letter from creator
  creatorName?: string; // Name of the creator who applied
  creatorAvatar?: string; // Avatar URL of the creator
  proposedRate?: number; // Proposed rate from creator
  availability?: {
    startDate: string;
    endDate?: string;
  };
  portfolioSamples?: string[]; // URLs to portfolio samples
  businessResponse?: string; // Response from business after review
  respondedAt?: string; // When business responded
}

export const getCreatorApplications = async (creatorId: string): Promise<ProjectApplication[]> => {
  try {
    const applicationsRef = collection(db, 'project_applications');
    const q = query(
      applicationsRef,
      where('creatorId', '==', creatorId),
      orderBy('appliedAt', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ProjectApplication));
  } catch (error) {
    console.error('[ProjectService] Error fetching creator applications:', error);
    return [];
  }
};

// Get applications for a specific project (for business owners)
export const getProjectApplications = async (projectId: string): Promise<ProjectApplication[]> => {
  try {
    const applicationsRef = collection(db, 'project_applications');
    const q = query(
      applicationsRef,
      where('projectId', '==', projectId),
      orderBy('appliedAt', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ProjectApplication));
  } catch (error) {
    console.error('[ProjectService] Error fetching project applications:', error);
    return [];
  }
};

// Update application status
export const updateApplicationStatus = async (
  applicationId: string,
  status: 'ACCEPTED' | 'REJECTED',
  message?: string
): Promise<boolean> => {
  try {
    const appRef = doc(db, 'project_applications', applicationId);
    const updateData: any = {
      status,
      updatedAt: Timestamp.now()
    };
    
    if (message) {
      updateData.responseMessage = message;
    }
    
    await updateDoc(appRef, updateData);
    return true;
  } catch (error) {
    console.error('[ProjectService] Error updating application status:', error);
    return false;
  }
};

// Submit a project application
export const submitProjectApplication = async (
  applicationData: Omit<ProjectApplication, 'id'>
): Promise<string> => {
  try {
    const applicationsRef = collection(db, 'project_applications');
    const docRef = await addDoc(applicationsRef, {
      ...applicationData,
      appliedAt: applicationData.appliedAt || new Date().toISOString(),
      createdAt: applicationData.createdAt || new Date().toISOString(),
      status: 'PENDING'
    });
    return docRef.id;
  } catch (error) {
    console.error('[ProjectService] Error submitting application:', error);
    throw error;
  }
};