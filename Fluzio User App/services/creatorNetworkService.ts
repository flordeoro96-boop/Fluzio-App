/**
 * Creator Network Service
 * Manages creator's business connections and collaborator relationships
 */

import { db } from './apiService';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  doc as firebaseDoc,
  getDoc
} from '../services/firestoreCompat';

export interface BusinessConnection {
  id: string;
  businessId: string;
  businessName: string;
  businessLogo?: string;
  businessCity?: string;
  sharedProjectsCount: number;
  lastInteraction: string; // ISO date
  status: 'active' | 'completed';
}

export interface CollaboratorConnection {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar?: string;
  role?: string;
  sharedProjectsCount: number;
  sharedMissions: string[]; // mission IDs
}

/**
 * Get businesses the creator has worked with
 * Based on accepted/completed applications
 */
export const getCreatorBusinessConnections = async (
  creatorId: string
): Promise<BusinessConnection[]> => {
  try {
    const applicationsCol = collection(db, 'applications');
    
    // Query accepted or completed applications
    const q = query(
      applicationsCol,
      where('creatorId', '==', creatorId),
      where('status', 'in', ['accepted', 'completed'])
    );
    
    const snapshot = await getDocs(q);
    
    // Group by businessId to count projects
    const businessMap = new Map<string, {
      businessId: string;
      businessName: string;
      businessLogo?: string;
      businessCity?: string;
      projectCount: number;
      latestDate: Date;
      hasActive: boolean;
    }>();
    
    for (const applicationDoc of snapshot.docs) {
      const app = applicationDoc.data();
      const businessId = app.businessId;
      
      // Fetch business details
      let businessData = businessMap.get(businessId);
      
      if (!businessData) {
        // Get business info from mission or user collection
        const missionDoc = await getDoc(firebaseDoc(db, 'missions', app.missionId));
        const missionData = missionDoc.data() as any;
        
        businessData = {
          businessId,
          businessName: missionData?.businessName || 'Unknown Business',
          businessLogo: missionData?.businessLogo,
          businessCity: missionData?.businessCity,
          projectCount: 0,
          latestDate: new Date(app.createdAt?.toDate?.() || app.createdAt),
          hasActive: false
        };
        businessMap.set(businessId, businessData);
      }
      
      businessData.projectCount++;
      
      const appDate = new Date(app.createdAt?.toDate?.() || app.createdAt);
      if (appDate > businessData.latestDate) {
        businessData.latestDate = appDate;
      }
      
      if (app.status === 'accepted') {
        businessData.hasActive = true;
      }
    }
    
    // Convert to BusinessConnection array
    const connections: BusinessConnection[] = Array.from(businessMap.values()).map(b => ({
      id: b.businessId,
      businessId: b.businessId,
      businessName: b.businessName,
      businessLogo: b.businessLogo,
      businessCity: b.businessCity,
      sharedProjectsCount: b.projectCount,
      lastInteraction: b.latestDate.toISOString(),
      status: b.hasActive ? 'active' : 'completed'
    }));
    
    // Sort by last interaction (most recent first)
    connections.sort((a, b) => 
      new Date(b.lastInteraction).getTime() - new Date(a.lastInteraction).getTime()
    );
    
    return connections;
  } catch (error) {
    console.error('[CreatorNetworkService] Error fetching business connections:', error);
    return [];
  }
};

/**
 * Get collaborators (other creators) the creator has worked with
 * Based on shared missions
 */
export const getCreatorCollaborators = async (
  creatorId: string
): Promise<CollaboratorConnection[]> => {
  try {
    const applicationsCol = collection(db, 'applications');
    
    // Get all accepted missions for this creator
    const myApplicationsQuery = query(
      applicationsCol,
      where('creatorId', '==', creatorId),
      where('status', 'in', ['accepted', 'completed'])
    );
    
    const mySnapshot = await getDocs(myApplicationsQuery);
    const myMissionIds = mySnapshot.docs.map(doc => doc.data().missionId);
    
    if (myMissionIds.length === 0) {
      return [];
    }
    
    // Find other creators who worked on the same missions
    // Note: Firestore 'in' queries limited to 10 items
    const collaboratorMap = new Map<string, {
      creatorId: string;
      creatorName: string;
      creatorAvatar?: string;
      role?: string;
      missions: Set<string>;
    }>();
    
    // Process in batches of 10
    for (let i = 0; i < myMissionIds.length; i += 10) {
      const batch = myMissionIds.slice(i, i + 10);
      
      const collaboratorQuery = query(
        applicationsCol,
        where('missionId', 'in', batch),
        where('status', 'in', ['accepted', 'completed'])
      );
      
      const collabSnapshot = await getDocs(collaboratorQuery);
      
      for (const appDoc of collabSnapshot.docs) {
        const app = appDoc.data();
        const collabId = app.creatorId;
        
        // Skip self
        if (collabId === creatorId) continue;
        
        let collaborator = collaboratorMap.get(collabId);
        
        if (!collaborator) {
          // Fetch creator details
          const creatorDocRef = firebaseDoc(db, 'users', collabId);
          const creatorDoc = await getDoc(creatorDocRef);
          const creatorData = creatorDoc.data() as any;
          
          collaborator = {
            creatorId: collabId,
            creatorName: creatorData?.name || 'Unknown Creator',
            creatorAvatar: creatorData?.avatarUrl,
            role: creatorData?.creatorRole || creatorData?.role,
            missions: new Set()
          };
          collaboratorMap.set(collabId, collaborator);
        }
        
        collaborator.missions.add(app.missionId);
      }
    }
    
    // Convert to CollaboratorConnection array
    const collaborators: CollaboratorConnection[] = Array.from(collaboratorMap.values()).map(c => ({
      id: c.creatorId,
      creatorId: c.creatorId,
      creatorName: c.creatorName,
      creatorAvatar: c.creatorAvatar,
      role: c.role,
      sharedProjectsCount: c.missions.size,
      sharedMissions: Array.from(c.missions)
    }));
    
    // Sort by shared project count (most shared first)
    collaborators.sort((a, b) => b.sharedProjectsCount - a.sharedProjectsCount);
    
    return collaborators;
  } catch (error) {
    console.error('[CreatorNetworkService] Error fetching collaborators:', error);
    return [];
  }
};

/**
 * Get application history with a specific business
 */
export const getBusinessApplicationHistory = async (
  creatorId: string,
  businessId: string
): Promise<any[]> => {
  try {
    const applicationsCol = collection(db, 'applications');
    
    const q = query(
      applicationsCol,
      where('creatorId', '==', creatorId),
      where('businessId', '==', businessId)
    );
    
    const snapshot = await getDocs(q);
    
    const applications = await Promise.all(
      snapshot.docs.map(async (appDoc) => {
        const app = appDoc.data();
        
        // Fetch mission details
        const missionDocRef = firebaseDoc(db, 'missions', app.missionId);
        const missionDoc = await getDoc(missionDocRef);
        const missionData = missionDoc.data() as any;
        
        return {
          id: appDoc.id,
          ...app,
          missionTitle: missionData?.title || 'Unknown Mission',
          missionDescription: missionData?.description,
          createdAt: app.createdAt?.toDate?.() || app.createdAt
        };
      })
    );
    
    // Sort by date (most recent first)
    applications.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    return applications;
  } catch (error) {
    console.error('[CreatorNetworkService] Error fetching application history:', error);
    return [];
  }
};
