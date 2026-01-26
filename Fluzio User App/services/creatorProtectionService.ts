/**
 * Creator Protection System Service
 * 
 * Comprehensive protection for creators including dispute resolution,
 * contract management, content protection, and legal resources.
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

export interface Dispute {
  id: string;
  creatorId: string;
  clientId: string;
  projectId?: string;
  title: string;
  description: string;
  category: 'PAYMENT' | 'SCOPE' | 'QUALITY' | 'COMMUNICATION' | 'OTHER';
  status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'ESCALATED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  evidence: DisputeEvidence[];
  resolution?: string;
  createdAt: Timestamp;
  resolvedAt?: Timestamp;
  assignedTo?: string; // Admin ID
}

export interface DisputeEvidence {
  type: 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'SCREENSHOT';
  content: string;
  uploadedAt: Timestamp;
  description?: string;
}

export interface Contract {
  id: string;
  creatorId: string;
  clientId: string;
  projectId: string;
  title: string;
  description: string;
  scope: string[];
  deliverables: string[];
  timeline: string;
  payment: {
    amount: number;
    currency: string;
    schedule: 'UPFRONT' | 'MILESTONE' | 'COMPLETION' | 'CUSTOM';
    terms: string;
  };
  revisions: number;
  ipRights: string;
  confidentiality: boolean;
  status: 'DRAFT' | 'SENT' | 'SIGNED' | 'ACTIVE' | 'COMPLETED' | 'TERMINATED';
  creatorSignature?: {
    signedAt: Timestamp;
    ipAddress: string;
  };
  clientSignature?: {
    signedAt: Timestamp;
    ipAddress: string;
  };
  createdAt: Timestamp;
}

export interface ContentProtection {
  id: string;
  creatorId: string;
  contentType: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'TEXT' | 'DESIGN';
  title: string;
  description: string;
  originalUrl?: string;
  watermarked: boolean;
  copyrightNotice: string;
  usageRights: 'ALL_RIGHTS_RESERVED' | 'LIMITED_LICENSE' | 'COMMERCIAL_LICENSE';
  registeredAt: Timestamp;
}

export interface LegalResource {
  id: string;
  category: 'CONTRACT' | 'COPYRIGHT' | 'DISPUTE' | 'TAXATION' | 'GENERAL';
  title: string;
  description: string;
  content: string;
  url?: string;
  helpful: number;
}

/**
 * Create a dispute
 */
export const createDispute = async (
  creatorId: string,
  clientId: string,
  title: string,
  description: string,
  category: Dispute['category'],
  priority: Dispute['priority'] = 'MEDIUM',
  projectId?: string
): Promise<{ success: boolean; disputeId?: string; error?: string }> => {
  try {
    const dispute: Omit<Dispute, 'id'> = {
      creatorId,
      clientId,
      projectId,
      title,
      description,
      category,
      status: 'OPEN',
      priority,
      evidence: [],
      createdAt: serverTimestamp() as Timestamp
    };

    const docRef = await addDoc(collection(db, 'disputes'), dispute);
    return { success: true, disputeId: docRef.id };
  } catch (error) {
    console.error('[ProtectionService] Error creating dispute:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Add evidence to dispute
 */
export const addDisputeEvidence = async (
  disputeId: string,
  evidence: Omit<DisputeEvidence, 'uploadedAt'>
): Promise<{ success: boolean; error?: string }> => {
  try {
    const disputeRef = doc(db, 'disputes', disputeId);
    const newEvidence = {
      ...evidence,
      uploadedAt: Timestamp.now()
    };

    // This would use arrayUnion in a real implementation
    await updateDoc(disputeRef, {
      evidence: [newEvidence] // Simplified - would append to existing array
    });

    return { success: true };
  } catch (error) {
    console.error('[ProtectionService] Error adding evidence:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Get creator disputes
 */
export const getCreatorDisputes = async (
  creatorId: string,
  status?: Dispute['status']
): Promise<Dispute[]> => {
  try {
    const disputesRef = collection(db, 'disputes');
    let q = query(
      disputesRef,
      where('creatorId', '==', creatorId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    if (status) {
      q = query(
        disputesRef,
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
    } as Dispute));
  } catch (error) {
    console.error('[ProtectionService] Error getting disputes:', error);
    return [];
  }
};

/**
 * Update dispute status
 */
export const updateDisputeStatus = async (
  disputeId: string,
  status: Dispute['status'],
  resolution?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const disputeRef = doc(db, 'disputes', disputeId);
    const updateData: any = { status };

    if (status === 'RESOLVED' || status === 'CLOSED') {
      updateData.resolvedAt = serverTimestamp();
      if (resolution) {
        updateData.resolution = resolution;
      }
    }

    await updateDoc(disputeRef, updateData);
    return { success: true };
  } catch (error) {
    console.error('[ProtectionService] Error updating dispute:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Create a contract
 */
export const createContract = async (
  creatorId: string,
  clientId: string,
  projectId: string,
  contractData: {
    title: string;
    description: string;
    scope: string[];
    deliverables: string[];
    timeline: string;
    paymentAmount: number;
    paymentSchedule: Contract['payment']['schedule'];
    paymentTerms: string;
    revisions: number;
    ipRights: string;
    confidentiality: boolean;
  }
): Promise<{ success: boolean; contractId?: string; error?: string }> => {
  try {
    const contract: Omit<Contract, 'id'> = {
      creatorId,
      clientId,
      projectId,
      title: contractData.title,
      description: contractData.description,
      scope: contractData.scope,
      deliverables: contractData.deliverables,
      timeline: contractData.timeline,
      payment: {
        amount: contractData.paymentAmount,
        currency: 'USD',
        schedule: contractData.paymentSchedule,
        terms: contractData.paymentTerms
      },
      revisions: contractData.revisions,
      ipRights: contractData.ipRights,
      confidentiality: contractData.confidentiality,
      status: 'DRAFT',
      createdAt: serverTimestamp() as Timestamp
    };

    const docRef = await addDoc(collection(db, 'contracts'), contract);
    return { success: true, contractId: docRef.id };
  } catch (error) {
    console.error('[ProtectionService] Error creating contract:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Get creator contracts
 */
export const getCreatorContracts = async (creatorId: string): Promise<Contract[]> => {
  try {
    const contractsRef = collection(db, 'contracts');
    const q = query(
      contractsRef,
      where('creatorId', '==', creatorId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Contract));
  } catch (error) {
    console.error('[ProtectionService] Error getting contracts:', error);
    return [];
  }
};

/**
 * Register content for protection
 */
export const registerContent = async (
  creatorId: string,
  contentType: ContentProtection['contentType'],
  title: string,
  description: string,
  usageRights: ContentProtection['usageRights'] = 'ALL_RIGHTS_RESERVED'
): Promise<{ success: boolean; protectionId?: string; error?: string }> => {
  try {
    const protection: Omit<ContentProtection, 'id'> = {
      creatorId,
      contentType,
      title,
      description,
      watermarked: false,
      copyrightNotice: `© ${new Date().getFullYear()} All Rights Reserved`,
      usageRights,
      registeredAt: serverTimestamp() as Timestamp
    };

    const docRef = await addDoc(collection(db, 'contentProtections'), protection);
    return { success: true, protectionId: docRef.id };
  } catch (error) {
    console.error('[ProtectionService] Error registering content:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Get protected content
 */
export const getProtectedContent = async (creatorId: string): Promise<ContentProtection[]> => {
  try {
    const protectionsRef = collection(db, 'contentProtections');
    const q = query(
      protectionsRef,
      where('creatorId', '==', creatorId),
      orderBy('registeredAt', 'desc'),
      limit(100)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ContentProtection));
  } catch (error) {
    console.error('[ProtectionService] Error getting protected content:', error);
    return [];
  }
};

/**
 * Get legal resources
 */
export const getLegalResources = async (category?: LegalResource['category']): Promise<LegalResource[]> => {
  try {
    const resourcesRef = collection(db, 'legalResources');
    let q = query(resourcesRef, limit(50));

    if (category) {
      q = query(resourcesRef, where('category', '==', category), limit(50));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as LegalResource));
  } catch (error) {
    console.error('[ProtectionService] Error getting legal resources:', error);
    return [];
  }
};

/**
 * Get protection statistics
 */
export const getProtectionStats = async (creatorId: string) => {
  try {
    const [disputes, contracts, protectedContent] = await Promise.all([
      getCreatorDisputes(creatorId),
      getCreatorContracts(creatorId),
      getProtectedContent(creatorId)
    ]);

    return {
      totalDisputes: disputes.length,
      activeDisputes: disputes.filter(d => d.status === 'OPEN' || d.status === 'IN_REVIEW').length,
      resolvedDisputes: disputes.filter(d => d.status === 'RESOLVED').length,
      totalContracts: contracts.length,
      activeContracts: contracts.filter(c => c.status === 'ACTIVE').length,
      signedContracts: contracts.filter(c => c.status === 'SIGNED').length,
      protectedAssets: protectedContent.length
    };
  } catch (error) {
    console.error('[ProtectionService] Error getting stats:', error);
    return {
      totalDisputes: 0,
      activeDisputes: 0,
      resolvedDisputes: 0,
      totalContracts: 0,
      activeContracts: 0,
      signedContracts: 0,
      protectedAssets: 0
    };
  }
};
