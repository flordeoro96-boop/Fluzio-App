import { db } from './apiService';
import { collection, query, where, orderBy, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, Timestamp } from '../services/firestoreCompat';
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

    return snapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          description: data.description || 'Create shared marketing visuals for participating brands to use across web and social media.',
          projectType: data.projectType || 'PHOTOSHOOT',
          city: data.city || 'Unknown',
          dateRange: data.dateRange || { start: '', end: '' },
          totalCost: data.totalCost || 0,
          organizerId: data.organizerId,
          leadBusinessId: data.leadBusinessId || data.organizerId,
          participatingBusinesses: data.participatingBusinesses || [],
          status: data.status || 'PLANNING',
          businessRoles: data.businessRoles || [],
          creatorRoles: data.creatorRoles || [],
          tasks: data.tasks || [],
          slots: data.slots || [],
          images: data.images || [],
          coverImage: data.coverImage,
          chatId: data.chatId,
          createdAt: data.createdAt?.toDate().toISOString(),
          updatedAt: data.updatedAt?.toDate().toISOString()
        };
      })
      .filter(project => project.status !== 'DELETED'); // Filter out deleted projects
  } catch (error) {
    console.error('[ProjectService] Error fetching projects:', error);
    return [];
  }
};

// Get a single project by ID
export const getProjectById = async (projectId: string): Promise<Project | null> => {
  try {
    const projectRef = doc(db, 'projects', projectId);
    const projectDoc = await getDoc(projectRef);
    
    if (!projectDoc.exists()) {
      console.log('[ProjectService] Project not found:', projectId);
      return null;
    }
    
    const data = projectDoc.data();
    return {
      id: projectDoc.id,
      title: data.title,
      description: data.description || 'Create shared marketing visuals for participating brands to use across web and social media.',
      projectType: data.projectType || 'PHOTOSHOOT',
      city: data.city || 'Unknown',
      dateRange: data.dateRange || { start: '', end: '' },
      totalCost: data.totalCost || 0,
      organizerId: data.organizerId,
      leadBusinessId: data.leadBusinessId || data.organizerId,
      participatingBusinesses: data.participatingBusinesses || [],
      status: data.status || 'PLANNING',
      businessRoles: data.businessRoles || [],
      creatorRoles: data.creatorRoles || [],
      tasks: data.tasks || [],
      slots: data.slots || [],
      images: data.images || [],
      coverImage: data.coverImage,
      chatId: data.chatId,
      createdAt: data.createdAt?.toDate().toISOString(),
      updatedAt: data.updatedAt?.toDate().toISOString()
    };
  } catch (error) {
    console.error('[ProjectService] Error fetching project:', error);
    return null;
  }
};

// Get projects for a specific business (as lead or participant)
export const getProjectsForBusiness = async (businessId: string): Promise<Project[]> => {
  try {
    const allProjects = await getProjects();
    // Filter projects where the business is either the lead or a participant
    return allProjects.filter(project => 
      project.leadBusinessId === businessId || 
      project.participatingBusinesses.includes(businessId)
    );
  } catch (error) {
    console.error('[ProjectService] Error fetching projects for business:', error);
    return [];
  }
};

// Create a new project
export const createProject = async (projectData: {
  organizerId: string;
  title: string;
  description: string;
  projectType: string;
  city: string;
  dateRange: { start: string; end: string };
  slots: ProjectSlot[];
  creatorRoles?: Array<{ role: string; budget: number; quantity?: number; description?: string }>;
  status: string;
  images?: string[];
  coverImage?: string;
}): Promise<string> => {
  try {
    // Convert slots to business roles
    const businessRoles = projectData.slots.map((slot, index) => ({
      id: `br-${Date.now()}-${index}`,
      title: slot.role,
      contribution: {
        products: [],
        services: []
        // location omitted - only add when needed
      },
      visibility: 'Brand featured in final project materials',
      costShare: slot.cost,
      benefit: 'Full usage rights to final assets for marketing',
      status: 'OPEN' as const
      // businessId omitted - only add when a business joins
    }));

    // Convert AI creator roles to CreatorRole format
    const creatorRoles = (projectData.creatorRoles || []).map((creator, index) => ({
      id: `cr-${Date.now()}-${index}`,
      title: creator.role,
      budget: creator.budget,
      quantity: creator.quantity || 1,
      status: 'DRAFT' as const
      // creatorId omitted - only add when a creator is assigned
    }));

    console.log('[ProjectService] Creating project with:', {
      businessRolesCount: businessRoles.length,
      creatorRolesCount: creatorRoles.length,
      creatorRoles
    });

    // Calculate total cost from business partner slots + creator budgets
    const businessCost = projectData.slots.reduce((sum, slot) => sum + slot.cost, 0);
    const creatorCost = (projectData.creatorRoles || []).reduce((sum, creator) => 
      sum + (creator.budget * (creator.quantity || 1)), 0
    );
    const totalCost = businessCost + creatorCost;
    
    const projectsRef = collection(db, 'projects');
    const docRef = await addDoc(projectsRef, {
      title: projectData.title,
      description: projectData.description,
      projectType: projectData.projectType,
      city: projectData.city,
      dateRange: projectData.dateRange,
      totalCost,
      organizerId: projectData.organizerId,
      leadBusinessId: projectData.organizerId,
      participatingBusinesses: [],
      status: projectData.status,
      businessRoles,
      creatorRoles,
      tasks: [], // Empty at creation
      slots: projectData.slots, // Legacy support
      images: projectData.images || [],
      coverImage: projectData.coverImage || (projectData.images && projectData.images.length > 0 ? projectData.images[0] : undefined),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    console.log('[ProjectService] Project created:', docRef.id);
    
    // Notify matching creators if there are creator roles
    if (creatorRoles.length > 0) {
      // Fire and forget - don't block on notifications
      notifyMatchingCreators(
        docRef.id,
        projectData.title,
        (projectData.creatorRoles || []).map(r => ({ title: r.role, budget: r.budget }))
      ).catch(err => console.error('[ProjectService] Notification error:', err));
    }
    
    return docRef.id;
  } catch (error) {
    console.error('[ProjectService] Error creating project:', error);
    throw error;
  }
};

// Join a business role in a project
export const joinBusinessRole = async (
  projectId: string, 
  roleId: string, 
  businessId: string
): Promise<void> => {
  try {
    const projectRef = doc(db, 'projects', projectId);
    const projectSnap = await getDoc(projectRef);
    
    if (!projectSnap.exists()) {
      throw new Error('Project not found');
    }
    
    const projectData = projectSnap.data();
    const businessRoles = projectData.businessRoles || [];
    
    // Find the role and update it
    const updatedRoles = businessRoles.map((role: any) => {
      if (role.id === roleId && role.status === 'OPEN') {
        return { ...role, status: 'PENDING', businessId };
      }
      return role;
    });
    
    // Add business to participatingBusinesses if not already there
    const participatingBusinesses = projectData.participatingBusinesses || [];
    if (!participatingBusinesses.includes(businessId)) {
      participatingBusinesses.push(businessId);
    }
    
    await updateDoc(projectRef, {
      businessRoles: updatedRoles,
      participatingBusinesses,
      updatedAt: Timestamp.now()
    });
    
    console.log('[ProjectService] Joined business role:', roleId);
  } catch (error) {
    console.error('[ProjectService] Error joining business role:', error);
    throw error;
  }
};

// Confirm a business role (for lead business)
export const confirmBusinessRole = async (
  projectId: string, 
  roleId: string
): Promise<void> => {
  try {
    const projectRef = doc(db, 'projects', projectId);
    const projectSnap = await getDoc(projectRef);
    
    if (!projectSnap.exists()) {
      throw new Error('Project not found');
    }
    
    const projectData = projectSnap.data();
    const businessRoles = projectData.businessRoles || [];
    
    // Update role status to CONFIRMED
    const updatedRoles = businessRoles.map((role: any) => {
      if (role.id === roleId) {
        return { ...role, status: 'CONFIRMED' };
      }
      return role;
    });
    
    await updateDoc(projectRef, {
      businessRoles: updatedRoles,
      updatedAt: Timestamp.now()
    });
    
    console.log('[ProjectService] Confirmed business role:', roleId);
  } catch (error) {
    console.error('[ProjectService] Error confirming business role:', error);
    throw error;
  }
};

// Update a project
export const updateProject = async (
  projectId: string,
  updates: {
    title?: string;
    description?: string;
    projectType?: string;
    city?: string;
    dateRange?: { start: string; end: string };
    slots?: any[];
    creatorRoles?: Array<{ role: string; budget: number; quantity?: number; description?: string }>;
    status?: string;
    images?: string[];
    coverImage?: string;
  }
): Promise<void> => {
  try {
    const projectRef = doc(db, 'projects', projectId);
    const projectSnap = await getDoc(projectRef);
    
    if (!projectSnap.exists()) {
      throw new Error('Project not found');
    }

    const updateData: any = {
      updatedAt: Timestamp.now()
    };

    // Update basic fields if provided
    if (updates.title) updateData.title = updates.title;
    if (updates.description) updateData.description = updates.description;
    if (updates.projectType) updateData.projectType = updates.projectType;
    if (updates.city) updateData.city = updates.city;
    if (updates.dateRange) updateData.dateRange = updates.dateRange;
    if (updates.status) updateData.status = updates.status;
    if (updates.images) updateData.images = updates.images;
    if (updates.coverImage) updateData.coverImage = updates.coverImage;

    // Update business roles if slots provided
    if (updates.slots) {
      const businessRoles = updates.slots.map((slot, index) => ({
        id: `br-${Date.now()}-${index}`,
        title: slot.role,
        contribution: {
          products: [],
          services: []
        },
        visibility: 'Brand featured in final project materials',
        costShare: slot.cost,
        benefit: 'Full usage rights to final assets for marketing',
        status: 'OPEN' as const
      }));
      updateData.businessRoles = businessRoles;
    }

    // Update creator roles if provided
    if (updates.creatorRoles) {
      const creatorRoles = updates.creatorRoles.map((creator, index) => ({
        id: `cr-${Date.now()}-${index}`,
        title: creator.role,
        budget: creator.budget,
        quantity: creator.quantity || 1,
        status: 'DRAFT' as const
      }));
      updateData.creatorRoles = creatorRoles;

      // Recalculate total cost
      const businessCost = (updates.slots || []).reduce((sum, slot) => sum + slot.cost, 0);
      const creatorCost = updates.creatorRoles.reduce((sum, creator) => 
        sum + (creator.budget * (creator.quantity || 1)), 0
      );
      updateData.totalCost = businessCost + creatorCost;
    }

    await updateDoc(projectRef, updateData);
    console.log('[ProjectService] Project updated:', projectId);
  } catch (error) {
    console.error('[ProjectService] Error updating project:', error);
    throw error;
  }
};

// Delete a project (only by lead business)
export const deleteProject = async (projectId: string): Promise<void> => {
  try {
    const projectRef = doc(db, 'projects', projectId);
    const projectSnap = await getDoc(projectRef);
    
    if (!projectSnap.exists()) {
      throw new Error('Project not found');
    }

    // In production, you might want to archive instead of delete
    // Or check if there are any confirmed participants before deleting
    await updateDoc(projectRef, {
      status: 'DELETED',
      deletedAt: Timestamp.now()
    });

    console.log('[ProjectService] Project deleted:', projectId);
  } catch (error) {
    console.error('[ProjectService] Error deleting project:', error);
    throw error;
  }
};

// =============================================================================
// PROJECT APPLICATIONS
// =============================================================================

export interface ProjectApplication {
  id: string;
  projectId: string;
  creatorId: string;
  creatorName: string;
  creatorEmail: string;
  creatorAvatar?: string;
  roleId: string;
  roleName: string;
  coverLetter: string;
  proposedRate?: number;
  portfolioSamples: string[];
  availability: {
    startDate: string;
    endDate?: string;
  };
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
  appliedAt: string;
  createdAt: string;
  updatedAt: string;
  businessResponse?: string;
  respondedAt?: string;
}

/**
 * Submit application for a project role
 */
export const submitProjectApplication = async (applicationData: Omit<ProjectApplication, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<{ success: boolean; applicationId?: string; error?: string }> => {
  try {
    console.log('[ProjectService] Submitting application:', applicationData);

    // Check if already applied
    const applicationsRef = collection(db, 'projectApplications');
    const existingQuery = query(
      applicationsRef,
      where('projectId', '==', applicationData.projectId),
      where('creatorId', '==', applicationData.creatorId),
      where('roleId', '==', applicationData.roleId),
      where('status', 'in', ['PENDING', 'ACCEPTED'])
    );
    
    const existingDocs = await getDocs(existingQuery);
    if (!existingDocs.empty) {
      return { success: false, error: 'You have already applied for this role' };
    }

    // Clean up undefined values (Firestore doesn't accept undefined)
    const cleanedData: any = {};
    Object.keys(applicationData).forEach(key => {
      const value = (applicationData as any)[key];
      if (value !== undefined) {
        cleanedData[key] = value;
      }
    });

    const application: any = {
      ...cleanedData,
      status: 'PENDING',
      appliedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await addDoc(applicationsRef, application);
    
    // Send notification to project lead business
    try {
      const { createNotification } = await import('./notificationService');
      const projectDoc = await getDoc(doc(db, 'projects', applicationData.projectId));
      if (projectDoc.exists()) {
        const projectData = projectDoc.data();
        await createNotification(projectData.leadBusinessId, {
          type: 'PROJECT_APPLICATION',
          title: 'New Project Application',
          message: `${applicationData.creatorName} applied for ${applicationData.roleName} in ${projectData.title}`,
          actionLink: `/projects/${applicationData.projectId}?tab=applications`
        });
      }
    } catch (notifError) {
      console.error('[ProjectService] Error sending notification:', notifError);
      // Don't fail the application if notification fails
    }
    
    console.log('[ProjectService] Application submitted successfully:', docRef.id);
    return { success: true, applicationId: docRef.id };
  } catch (error) {
    console.error('[ProjectService] Error submitting application:', error);
    return { success: false, error: 'Failed to submit application' };
  }
};

/**
 * Get applications for a project
 */
export const getProjectApplications = async (projectId: string): Promise<ProjectApplication[]> => {
  try {
    const applicationsRef = collection(db, 'projectApplications');
    const q = query(
      applicationsRef,
      where('projectId', '==', projectId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ProjectApplication[];
  } catch (error) {
    console.error('[ProjectService] Error getting applications:', error);
    return [];
  }
};

/**
 * Get creator's applications
 */
export const getCreatorApplications = async (creatorId: string): Promise<ProjectApplication[]> => {
  try {
    const applicationsRef = collection(db, 'projectApplications');
    const q = query(
      applicationsRef,
      where('creatorId', '==', creatorId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ProjectApplication[];
  } catch (error) {
    console.error('[ProjectService] Error getting creator applications:', error);
    return [];
  }
};

/**
 * Update application status
 */
export const updateApplicationStatus = async (
  applicationId: string,
  status: 'ACCEPTED' | 'REJECTED',
  businessResponse?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const applicationRef = doc(db, 'projectApplications', applicationId);
    const applicationDoc = await getDoc(applicationRef);
    
    if (!applicationDoc.exists()) {
      return { success: false, error: 'Application not found' };
    }

    const applicationData = applicationDoc.data() as ProjectApplication;
    
    await updateDoc(applicationRef, {
      status,
      businessResponse,
      respondedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    // Send notification to creator
    try {
      const { createNotification } = await import('./notificationService');
      const projectDoc = await getDoc(doc(db, 'projects', applicationData.projectId));
      
      if (projectDoc.exists()) {
        const projectData = projectDoc.data();
        
        if (status === 'ACCEPTED') {
          await createNotification(applicationData.creatorId, {
            type: 'PROJECT_ACCEPTED',
            title: 'Application Accepted! 🎉',
            message: `Congratulations! Your application for ${applicationData.roleName} in ${projectData.title} has been accepted.`,
            actionLink: `/projects/${applicationData.projectId}`
          });
        } else {
          await createNotification(applicationData.creatorId, {
            type: 'PROJECT_REJECTED',
            title: 'Application Update',
            message: `Your application for ${applicationData.roleName} in ${projectData.title} was not selected. ${businessResponse || 'Keep exploring other opportunities!'}`,
            actionLink: `/creator/opportunities`
          });
        }
      }
    } catch (notifError) {
      console.error('[ProjectService] Error sending notification:', notifError);
      // Don't fail the update if notification fails
    }
    
    console.log(`[ProjectService] Application ${applicationId} updated to ${status}`);
    return { success: true };
  } catch (error) {
    console.error('[ProjectService] Error updating application:', error);
    return { success: false, error: 'Failed to update application' };
  }
};

/**
 * Withdraw application
 */
export const withdrawApplication = async (applicationId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const applicationRef = doc(db, 'projectApplications', applicationId);
    
    await updateDoc(applicationRef, {
      status: 'WITHDRAWN',
      updatedAt: new Date().toISOString()
    });
    
    console.log(`[ProjectService] Application ${applicationId} withdrawn`);
    return { success: true };
  } catch (error) {
    console.error('[ProjectService] Error withdrawing application:', error);
    return { success: false, error: 'Failed to withdraw application' };
  }
};

/**
 * Check if creator has applied for role
 */
export const hasAppliedForRole = async (projectId: string, creatorId: string, roleId: string): Promise<boolean> => {
  try {
    const applicationsRef = collection(db, 'projectApplications');
    const q = query(
      applicationsRef,
      where('projectId', '==', projectId),
      where('creatorId', '==', creatorId),
      where('roleId', '==', roleId),
      where('status', 'in', ['PENDING', 'ACCEPTED'])
    );
    
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error('[ProjectService] Error checking application:', error);
    return false;
  }
};

/**
 * Notify creators about new matching project opportunities
 * Call this after creating a new project with creator roles
 */
export const notifyMatchingCreators = async (
  projectId: string,
  projectTitle: string,
  creatorRoles: Array<{ title: string; budget: number }>
): Promise<void> => {
  try {
    // Get all users with creator skills
    const usersRef = collection(db, 'users');
    const creatorsQuery = query(
      usersRef,
      where('accountType', '==', 'creator')
    );
    
    const creatorsSnapshot = await getDocs(creatorsQuery);
    const { createNotification } = await import('./notificationService');
    
    const rolesList = creatorRoles.map(r => r.title).join(', ');
    
    // Send notification to all creators
    const notificationPromises = creatorsSnapshot.docs.map(async (creatorDoc) => {
      const creatorData = creatorDoc.data();
      
      // Check if creator has relevant skills (basic matching)
      const creatorSkills = creatorData.skills || [];
      const hasRelevantSkill = creatorRoles.some(role => 
        creatorSkills.some((skill: any) => 
          role.title.toLowerCase().includes(skill.name?.toLowerCase() || '')
        )
      );
      
      // Send notification to creators with relevant skills or all creators
      if (hasRelevantSkill || creatorSkills.length === 0) {
        await createNotification(creatorDoc.id, {
          type: 'NEW_OPPORTUNITY',
          title: 'New Collaboration Opportunity',
          message: `${projectTitle} is looking for: ${rolesList}`,
          actionLink: `/creator/opportunities?project=${projectId}`
        });
      }
    });
    
    await Promise.all(notificationPromises);
    console.log(`[ProjectService] Notified ${notificationPromises.length} creators about new project`);
  } catch (error) {
    console.error('[ProjectService] Error notifying creators:', error);
    // Don't throw - notifications are non-critical
  }
};
