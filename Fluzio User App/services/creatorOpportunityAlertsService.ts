/**
 * Creator Opportunity Alerts Service
 * 
 * Smart, AI-powered opportunity matching and alerts for creators.
 * Analyzes creator profile, skills, and preferences to recommend relevant opportunities.
 */

import { db } from './apiService';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  orderBy,
  limit,
  Timestamp
} from '../services/firestoreCompat';

export interface OpportunityAlert {
  id: string;
  creatorId: string;
  opportunityId: string;
  opportunityType: 'PROJECT' | 'COLLABORATION' | 'EVENT' | 'MISSION';
  title: string;
  description: string;
  businessName: string;
  businessId: string;
  matchScore: number; // 0-100
  matchReasons: string[];
  budget?: {
    min: number;
    max: number;
    currency: string;
  };
  deadline?: Timestamp;
  skills: string[];
  status: 'NEW' | 'VIEWED' | 'DISMISSED' | 'APPLIED';
  createdAt: Timestamp;
  viewedAt?: Timestamp;
  dismissedAt?: Timestamp;
  appliedAt?: Timestamp;
}

export interface CreatorPreferences {
  skills: string[];
  categories: string[];
  minBudget?: number;
  maxDistance?: number; // km
  preferredBusinessTypes?: string[];
  excludedBusinesses?: string[];
  notificationFrequency: 'IMMEDIATE' | 'DAILY' | 'WEEKLY';
  emailNotifications: boolean;
  pushNotifications: boolean;
}

/**
 * Calculate match score between creator and opportunity
 */
export const calculateMatchScore = (
  creatorSkills: string[],
  creatorCategories: string[],
  opportunitySkills: string[],
  opportunityCategory: string,
  creatorRating?: number,
  opportunityBudget?: number
): number => {
  let score = 0;
  
  // Skill matching (40 points)
  const matchingSkills = creatorSkills.filter(skill => 
    opportunitySkills.some(oppSkill => 
      oppSkill.toLowerCase().includes(skill.toLowerCase()) ||
      skill.toLowerCase().includes(oppSkill.toLowerCase())
    )
  );
  score += (matchingSkills.length / Math.max(opportunitySkills.length, 1)) * 40;
  
  // Category matching (30 points)
  if (creatorCategories.includes(opportunityCategory)) {
    score += 30;
  }
  
  // Creator rating bonus (15 points)
  if (creatorRating && creatorRating >= 4.5) {
    score += 15;
  } else if (creatorRating && creatorRating >= 4.0) {
    score += 10;
  } else if (creatorRating && creatorRating >= 3.5) {
    score += 5;
  }
  
  // Budget bonus (15 points) - higher budgets get higher scores
  if (opportunityBudget && opportunityBudget >= 1000) {
    score += 15;
  } else if (opportunityBudget && opportunityBudget >= 500) {
    score += 10;
  } else if (opportunityBudget && opportunityBudget >= 250) {
    score += 5;
  }
  
  return Math.min(Math.round(score), 100);
};

/**
 * Generate match reasons for display
 */
export const generateMatchReasons = (
  creatorSkills: string[],
  opportunitySkills: string[],
  matchScore: number
): string[] => {
  const reasons: string[] = [];
  
  const matchingSkills = creatorSkills.filter(skill => 
    opportunitySkills.some(oppSkill => 
      oppSkill.toLowerCase().includes(skill.toLowerCase()) ||
      skill.toLowerCase().includes(oppSkill.toLowerCase())
    )
  );
  
  if (matchingSkills.length > 0) {
    reasons.push(`${matchingSkills.length} matching skill${matchingSkills.length > 1 ? 's' : ''}: ${matchingSkills.slice(0, 3).join(', ')}`);
  }
  
  if (matchScore >= 80) {
    reasons.push('Excellent match for your profile');
  } else if (matchScore >= 60) {
    reasons.push('Good fit for your expertise');
  }
  
  return reasons;
};

/**
 * Get creator preferences
 */
export const getCreatorPreferences = async (creatorId: string): Promise<CreatorPreferences | null> => {
  try {
    const prefsRef = collection(db, 'creatorPreferences');
    const q = query(prefsRef, where('creatorId', '==', creatorId), limit(1));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      const data = doc.data();
      return {
        id: doc.id,
        skills: data.skills || [],
        categories: data.categories || [],
        notificationFrequency: data.notificationFrequency || 'DAILY',
        emailNotifications: data.emailNotifications ?? true,
        pushNotifications: data.pushNotifications ?? true,
        ...data
      } as CreatorPreferences;
    }
    
    // Return default preferences
    return {
      skills: [],
      categories: [],
      notificationFrequency: 'DAILY',
      emailNotifications: true,
      pushNotifications: true
    };
  } catch (error) {
    console.error('[OpportunityAlerts] Error getting preferences:', error);
    return null;
  }
};

/**
 * Update creator preferences
 */
export const updateCreatorPreferences = async (
  creatorId: string, 
  preferences: Partial<CreatorPreferences>
): Promise<{ success: boolean; error?: string }> => {
  try {
    const prefsRef = collection(db, 'creatorPreferences');
    const q = query(prefsRef, where('creatorId', '==', creatorId), limit(1));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      // Update existing
      const docRef = doc(db, 'creatorPreferences', snapshot.docs[0].id);
      await updateDoc(docRef, {
        ...preferences,
        updatedAt: serverTimestamp()
      });
    } else {
      // Create new
      await addDoc(collection(db, 'creatorPreferences'), {
        creatorId,
        ...preferences,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error('[OpportunityAlerts] Error updating preferences:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Get opportunity alerts for creator
 */
export const getOpportunityAlerts = async (
  creatorId: string,
  status?: 'NEW' | 'VIEWED' | 'DISMISSED' | 'APPLIED'
): Promise<OpportunityAlert[]> => {
  try {
    const alertsRef = collection(db, 'opportunityAlerts');
    let q = query(
      alertsRef,
      where('creatorId', '==', creatorId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    
    if (status) {
      q = query(
        alertsRef,
        where('creatorId', '==', creatorId),
        where('status', '==', status),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as OpportunityAlert));
  } catch (error) {
    console.error('[OpportunityAlerts] Error getting alerts:', error);
    return [];
  }
};

/**
 * Mark alert as viewed
 */
export const markAlertViewed = async (alertId: string): Promise<void> => {
  try {
    const alertRef = doc(db, 'opportunityAlerts', alertId);
    await updateDoc(alertRef, {
      status: 'VIEWED',
      viewedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('[OpportunityAlerts] Error marking viewed:', error);
  }
};

/**
 * Dismiss alert
 */
export const dismissAlert = async (alertId: string): Promise<void> => {
  try {
    const alertRef = doc(db, 'opportunityAlerts', alertId);
    await updateDoc(alertRef, {
      status: 'DISMISSED',
      dismissedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('[OpportunityAlerts] Error dismissing:', error);
  }
};

/**
 * Mark alert as applied
 */
export const markAlertApplied = async (alertId: string): Promise<void> => {
  try {
    const alertRef = doc(db, 'opportunityAlerts', alertId);
    await updateDoc(alertRef, {
      status: 'APPLIED',
      appliedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('[OpportunityAlerts] Error marking applied:', error);
  }
};

/**
 * Get alert statistics
 */
export const getAlertStats = async (creatorId: string): Promise<{
  total: number;
  new: number;
  viewed: number;
  applied: number;
  averageMatchScore: number;
}> => {
  try {
    const alertsRef = collection(db, 'opportunityAlerts');
    const q = query(alertsRef, where('creatorId', '==', creatorId));
    const snapshot = await getDocs(q);
    
    const alerts = snapshot.docs.map(doc => doc.data() as OpportunityAlert);
    const newAlerts = alerts.filter(a => a.status === 'NEW');
    const viewedAlerts = alerts.filter(a => a.status === 'VIEWED');
    const appliedAlerts = alerts.filter(a => a.status === 'APPLIED');
    
    const totalScore = alerts.reduce((sum, alert) => sum + alert.matchScore, 0);
    const averageMatchScore = alerts.length > 0 ? totalScore / alerts.length : 0;
    
    return {
      total: alerts.length,
      new: newAlerts.length,
      viewed: viewedAlerts.length,
      applied: appliedAlerts.length,
      averageMatchScore: Math.round(averageMatchScore)
    };
  } catch (error) {
    console.error('[OpportunityAlerts] Error getting stats:', error);
    return {
      total: 0,
      new: 0,
      viewed: 0,
      applied: 0,
      averageMatchScore: 0
    };
  }
};
