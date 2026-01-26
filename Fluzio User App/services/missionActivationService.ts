/**
 * MISSION ACTIVATION SERVICE
 * 
 * Handles mission activation with connection gating logic.
 * Validates that businesses have required integrations before allowing mission activation.
 * Tracks user-level connection requirements for mission completion.
 */

import { db } from './apiService';
import { doc, getDoc, setDoc, updateDoc, collection, serverTimestamp, Timestamp } from '../services/firestoreCompat';
import { LOCKED_MISSION_CATALOG } from './lockedMissionCatalog';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ConnectionRequirement {
  type: 'google_gbp' | 'instagram' | 'facebook' | 'tiktok';
  displayName: string;
  description: string;
  setupUrl?: string;
}

export interface MissionActivationConfig {
  missionId: string;
  businessId: string;
  reward: number;
  maxParticipants: number;
  validUntil?: string;
  cooldownPeriod?: number;
  requiresApproval?: boolean;
  checkInMethod?: 'QR_ONLY' | 'GPS' | 'BOTH'; // For Visit & Check-In missions
}

export interface MissionActivation {
  id: string;
  businessId: string;
  missionId: string;
  missionName: string;
  isActive: boolean;
  config: {
    reward: number;
    maxParticipants: number;
    validUntil?: Date;
    cooldownPeriod?: number;
    requiresApproval: boolean;
    checkInMethod?: 'QR_ONLY' | 'GPS' | 'BOTH';
  };
  requiredConnectionsBusiness: ConnectionRequirement[];
  requiredConnectionsUser: ConnectionRequirement[];
  activatedAt: Date;
  deactivatedAt?: Date;
  currentParticipants: number;
}

export interface ActivationResult {
  success: boolean;
  activation?: MissionActivation;
  userRequirements?: ConnectionRequirement[];
  error?: MissionActivationError;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export enum MissionActivationErrorCode {
  MISSION_NOT_FOUND = 'MISSION_NOT_FOUND',
  MISSING_BUSINESS_CONNECTION = 'MISSING_BUSINESS_CONNECTION',
  INVALID_CONFIG = 'INVALID_CONFIG',
  ALREADY_ACTIVE = 'ALREADY_ACTIVE',
  BUSINESS_NOT_FOUND = 'BUSINESS_NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
}

export interface MissionActivationError {
  code: MissionActivationErrorCode;
  message: string;
  field?: string;
  requiredConnection?: ConnectionRequirement;
}

// ============================================================================
// CONNECTION REQUIREMENTS BY MISSION
// ============================================================================

/**
 * Define which connections are required for each mission type
 */
const MISSION_CONNECTION_REQUIREMENTS: Record<string, {
  business: ConnectionRequirement[];
  user: ConnectionRequirement[];
}> = {
  // Google Review missions require Google Business Profile
  'GOOGLE_REVIEW_TEXT': {
    business: [{
      type: 'google_gbp',
      displayName: 'Google Business Profile',
      description: 'Your Google Business Profile must be connected to verify reviews',
      setupUrl: '/settings/integrations/google'
    }],
    user: [{
      type: 'google_gbp',
      displayName: 'Google Account',
      description: 'Users must connect their Google account to leave reviews',
      setupUrl: '/settings/connections'
    }]
  },
  
  'GOOGLE_REVIEW_PHOTOS': {
    business: [{
      type: 'google_gbp',
      displayName: 'Google Business Profile',
      description: 'Your Google Business Profile must be connected to verify photo reviews',
      setupUrl: '/settings/integrations/google'
    }],
    user: [{
      type: 'google_gbp',
      displayName: 'Google Account',
      description: 'Users must connect their Google account to leave photo reviews',
      setupUrl: '/settings/connections'
    }]
  },
  
  // Instagram missions require Instagram Business account
  'STORY_POST_TAG': {
    business: [{
      type: 'instagram',
      displayName: 'Instagram Business',
      description: 'Your Instagram Business account must be connected to verify story tags',
      setupUrl: '/settings/integrations/instagram'
    }],
    user: [{
      type: 'instagram',
      displayName: 'Instagram Account',
      description: 'Users must connect their Instagram account to post stories',
      setupUrl: '/settings/connections'
    }]
  },
  
  'FEED_REEL_POST_TAG': {
    business: [{
      type: 'instagram',
      displayName: 'Instagram Business',
      description: 'Your Instagram Business account must be connected to verify posts',
      setupUrl: '/settings/integrations/instagram'
    }],
    user: [{
      type: 'instagram',
      displayName: 'Instagram Account',
      description: 'Users must connect their Instagram account to create posts',
      setupUrl: '/settings/connections'
    }]
  },
  
  // Instagram Follow mission
  'INSTAGRAM_FOLLOW': {
    business: [{
      type: 'instagram',
      displayName: 'Instagram Business',
      description: 'Your Instagram Business account must be connected for follow verification',
      setupUrl: '/settings/integrations/instagram'
    }],
    user: []
  },
  
  // Other missions have no required connections (can use screenshot/manual proof)
  'VISIT_CHECKIN': { business: [], user: [] },
  'CONSULTATION_REQUEST': { business: [], user: [] },
  'REDEEM_OFFER': { business: [], user: [] },
  'FIRST_PURCHASE': { business: [], user: [] },
  'REFER_PAYING_CUSTOMER': { business: [], user: [] },
  'BRING_A_FRIEND': { business: [], user: [] },
  'UGC_PHOTO_UPLOAD': { business: [], user: [] },
  'UGC_VIDEO_UPLOAD': { business: [], user: [] },
  'REPEAT_PURCHASE_VISIT': { business: [], user: [] },
};

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Check if business has required connection
 */
async function validateBusinessConnections(
  businessId: string,
  requiredConnections: ConnectionRequirement[]
): Promise<{ valid: boolean; missing?: ConnectionRequirement }> {
  
  if (requiredConnections.length === 0) {
    return { valid: true };
  }
  
  try {
    const businessRef = doc(db, 'users', businessId);
    const businessSnap = await getDoc(businessRef);
    
    if (!businessSnap.exists()) {
      return { valid: false };
    }
    
    const businessData = businessSnap.data();
    const socialAccounts = businessData.socialAccounts || {};
    const integrations = businessData.integrations || {};
    
    for (const requirement of requiredConnections) {
      switch (requirement.type) {
        case 'google_gbp':
          // Check if Google Business Profile is connected
          if (!socialAccounts.google?.connected || !integrations.googleBusiness?.connected) {
            return { valid: false, missing: requirement };
          }
          break;
          
        case 'instagram':
          // Check if Instagram Business is connected
          if (!socialAccounts.instagram?.connected) {
            return { valid: false, missing: requirement };
          }
          break;
          
        case 'facebook':
          if (!socialAccounts.facebook?.connected) {
            return { valid: false, missing: requirement };
          }
          break;
          
        case 'tiktok':
          if (!socialAccounts.tiktok?.connected) {
            return { valid: false, missing: requirement };
          }
          break;
      }
    }
    
    return { valid: true };
  } catch (error) {
    console.error('[MissionActivation] Error validating business connections:', error);
    return { valid: false };
  }
}

/**
 * Validate mission configuration
 */
function validateMissionConfig(config: MissionActivationConfig): MissionActivationError | null {
  
  // Validate reward
  if (config.reward < 25) {
    return {
      code: MissionActivationErrorCode.INVALID_CONFIG,
      message: 'Reward must be at least 25 points',
      field: 'reward'
    };
  }
  
  if (config.reward > 500) {
    return {
      code: MissionActivationErrorCode.INVALID_CONFIG,
      message: 'Reward cannot exceed 500 points',
      field: 'reward'
    };
  }
  
  // Validate max participants
  if (config.maxParticipants < 1) {
    return {
      code: MissionActivationErrorCode.INVALID_CONFIG,
      message: 'Max participants must be at least 1',
      field: 'maxParticipants'
    };
  }
  
  if (config.maxParticipants > 10000) {
    return {
      code: MissionActivationErrorCode.INVALID_CONFIG,
      message: 'Max participants cannot exceed 10,000',
      field: 'maxParticipants'
    };
  }
  
  // Validate validUntil
  if (config.validUntil) {
    const validUntilDate = new Date(config.validUntil);
    if (validUntilDate < new Date()) {
      return {
        code: MissionActivationErrorCode.INVALID_CONFIG,
        message: 'Valid until date must be in the future',
        field: 'validUntil'
      };
    }
  }
  
  return null;
}

// ============================================================================
// ACTIVATION FUNCTIONS
// ============================================================================

/**
 * Activate a mission for a business
 * 
 * This is the main activation endpoint that validates all requirements
 * and creates the activation record in Firestore.
 */
export async function activateMission(
  businessId: string,
  missionId: string,
  config: MissionActivationConfig
): Promise<ActivationResult> {
  
  console.log('[MissionActivation] Activating mission:', { businessId, missionId, config });
  
  try {
    // ========================================================================
    // STEP 1: VALIDATE MISSION EXISTS
    // ========================================================================
    
    const missionTemplate = LOCKED_MISSION_CATALOG.find(m => m.id === missionId);
    
    if (!missionTemplate) {
      return {
        success: false,
        error: {
          code: MissionActivationErrorCode.MISSION_NOT_FOUND,
          message: `Mission with ID "${missionId}" not found in catalog`
        }
      };
    }
    
    // ========================================================================
    // STEP 2: VALIDATE CONFIG
    // ========================================================================
    
    const configError = validateMissionConfig(config);
    if (configError) {
      return {
        success: false,
        error: configError
      };
    }
    
    // ========================================================================
    // STEP 3: GET CONNECTION REQUIREMENTS
    // ========================================================================
    
    const requirements = MISSION_CONNECTION_REQUIREMENTS[missionId] || { business: [], user: [] };
    
    console.log('[MissionActivation] Connection requirements:', requirements);
    
    // ========================================================================
    // STEP 4: VALIDATE BUSINESS CONNECTIONS (STRICT)
    // ========================================================================
    
    const businessValidation = await validateBusinessConnections(
      businessId,
      requirements.business
    );
    
    if (!businessValidation.valid) {
      console.error('[MissionActivation] Business missing required connection:', businessValidation.missing);
      
      return {
        success: false,
        error: {
          code: MissionActivationErrorCode.MISSING_BUSINESS_CONNECTION,
          message: businessValidation.missing 
            ? `${businessValidation.missing.displayName} must be connected to activate this mission. ${businessValidation.missing.description}`
            : 'Business does not have required connections for this mission',
          requiredConnection: businessValidation.missing
        }
      };
    }
    
    // ========================================================================
    // STEP 5: CHECK IF ALREADY ACTIVE
    // ========================================================================
    
    const activationId = `${businessId}_${missionId}`;
    const activationRef = doc(db, 'missionActivations', activationId);
    const existingActivation = await getDoc(activationRef);
    
    if (existingActivation.exists() && existingActivation.data().isActive) {
      return {
        success: false,
        error: {
          code: MissionActivationErrorCode.ALREADY_ACTIVE,
          message: 'This mission is already active for your business'
        }
      };
    }
    
    // ========================================================================
    // STEP 6: CREATE ACTIVATION RECORD
    // ========================================================================
    
    const activationData = {
      id: activationId,
      businessId,
      missionId,
      missionName: missionTemplate.name,
      isActive: true,
      config: {
        reward: config.reward,
        maxParticipants: config.maxParticipants,
        validUntil: config.validUntil ? Timestamp.fromDate(new Date(config.validUntil)) : null,
        cooldownPeriod: config.cooldownPeriod || 0,
        requiresApproval: config.requiresApproval || false,
        checkInMethod: config.checkInMethod || 'QR_ONLY', // Store check-in method for Visit & Check-In
      },
      requiredConnectionsBusiness: requirements.business,
      requiredConnectionsUser: requirements.user,
      activatedAt: serverTimestamp(),
      deactivatedAt: null,
      currentParticipants: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    await setDoc(activationRef, activationData);
    
    console.log('[MissionActivation] ✅ Mission activated successfully');
    
    // ========================================================================
    // STEP 7: RETURN ACTIVATION WITH USER REQUIREMENTS
    // ========================================================================
    
    const activation: MissionActivation = {
      id: activationId,
      businessId,
      missionId,
      missionName: missionTemplate.name,
      isActive: true,
      config: {
        reward: config.reward,
        maxParticipants: config.maxParticipants,
        validUntil: config.validUntil ? new Date(config.validUntil) : undefined,
        cooldownPeriod: config.cooldownPeriod || 0,
        requiresApproval: config.requiresApproval || false,
        checkInMethod: config.checkInMethod || 'QR_ONLY',
      },
      requiredConnectionsBusiness: requirements.business,
      requiredConnectionsUser: requirements.user,
      activatedAt: new Date(),
      currentParticipants: 0,
    };
    
    return {
      success: true,
      activation,
      userRequirements: requirements.user, // Show this in UI
    };
    
  } catch (error) {
    console.error('[MissionActivation] Error activating mission:', error);
    return {
      success: false,
      error: {
        code: MissionActivationErrorCode.INVALID_CONFIG,
        message: error instanceof Error ? error.message : 'Failed to activate mission'
      }
    };
  }
}

/**
 * Deactivate a mission
 */
export async function deactivateMission(
  businessId: string,
  missionId: string
): Promise<{ success: boolean; error?: string }> {
  
  try {
    const activationId = `${businessId}_${missionId}`;
    const activationRef = doc(db, 'missionActivations', activationId);
    
    await updateDoc(activationRef, {
      isActive: false,
      deactivatedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    console.log('[MissionActivation] Mission deactivated:', activationId);
    
    return { success: true };
  } catch (error) {
    console.error('[MissionActivation] Error deactivating mission:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to deactivate mission'
    };
  }
}

/**
 * Get activation status for a mission
 */
export async function getMissionActivation(
  businessId: string,
  missionId: string
): Promise<MissionActivation | null> {
  
  try {
    const activationId = `${businessId}_${missionId}`;
    const activationRef = doc(db, 'missionActivations', activationId);
    const activationSnap = await getDoc(activationRef);
    
    if (!activationSnap.exists()) {
      return null;
    }
    
    const data = activationSnap.data();
    
    return {
      id: activationId,
      businessId: data.businessId,
      missionId: data.missionId,
      missionName: data.missionName,
      isActive: data.isActive,
      config: {
        reward: data.config.reward,
        maxParticipants: data.config.maxParticipants,
        validUntil: data.config.validUntil?.toDate(),
        cooldownPeriod: data.config.cooldownPeriod,
        requiresApproval: data.config.requiresApproval,
      },
      requiredConnectionsBusiness: data.requiredConnectionsBusiness || [],
      requiredConnectionsUser: data.requiredConnectionsUser || [],
      activatedAt: data.activatedAt?.toDate() || new Date(),
      deactivatedAt: data.deactivatedAt?.toDate(),
      currentParticipants: data.currentParticipants || 0,
    };
  } catch (error) {
    console.error('[MissionActivation] Error getting activation:', error);
    return null;
  }
}

/**
 * Check if user can complete mission (has required connections)
 */
export async function canUserCompleteMission(
  userId: string,
  missionId: string,
  businessId: string
): Promise<{ canComplete: boolean; missingConnection?: ConnectionRequirement }> {
  
  try {
    // Get activation to check user requirements
    const activation = await getMissionActivation(businessId, missionId);
    
    if (!activation || !activation.isActive) {
      return { canComplete: false };
    }
    
    if (activation.requiredConnectionsUser.length === 0) {
      return { canComplete: true };
    }
    
    // Check if user has required connections
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return { canComplete: false };
    }
    
    const userData = userSnap.data();
    const socialAccounts = userData.socialAccounts || {};
    
    for (const requirement of activation.requiredConnectionsUser) {
      switch (requirement.type) {
        case 'google_gbp':
          if (!socialAccounts.google?.connected) {
            return { canComplete: false, missingConnection: requirement };
          }
          break;
          
        case 'instagram':
          if (!socialAccounts.instagram?.connected) {
            return { canComplete: false, missingConnection: requirement };
          }
          break;
          
        case 'facebook':
          if (!socialAccounts.facebook?.connected) {
            return { canComplete: false, missingConnection: requirement };
          }
          break;
          
        case 'tiktok':
          if (!socialAccounts.tiktok?.connected) {
            return { canComplete: false, missingConnection: requirement };
          }
          break;
      }
    }
    
    return { canComplete: true };
  } catch (error) {
    console.error('[MissionActivation] Error checking user eligibility:', error);
    return { canComplete: false };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all active missions for a business
 */
export async function getActiveBusinessMissions(businessId: string): Promise<MissionActivation[]> {
  // Implementation would query missionActivations collection
  // This is a placeholder
  return [];
}

/**
 * Get connection setup instructions for display
 */
export function getConnectionSetupInstructions(requirement: ConnectionRequirement): {
  title: string;
  steps: string[];
  estimatedTime: string;
} {
  switch (requirement.type) {
    case 'google_gbp':
      return {
        title: 'Connect Google Business Profile',
        steps: [
          'Go to Settings → Integrations',
          'Click "Connect Google Business Profile"',
          'Sign in with your business Google account',
          'Select your business location',
          'Grant permissions to verify reviews',
        ],
        estimatedTime: '2-3 minutes'
      };
      
    case 'instagram':
      return {
        title: 'Connect Instagram Business',
        steps: [
          'Go to Settings → Connections',
          'Click "Connect Instagram"',
          'Ensure your Instagram is a Business account',
          'Ensure it\'s linked to a Facebook Page',
          'Sign in and grant permissions',
        ],
        estimatedTime: '3-5 minutes'
      };
      
    case 'facebook':
      return {
        title: 'Connect Facebook',
        steps: [
          'Go to Settings → Connections',
          'Click "Connect Facebook"',
          'Sign in with Facebook',
          'Grant permissions',
        ],
        estimatedTime: '1-2 minutes'
      };
      
    case 'tiktok':
      return {
        title: 'Connect TikTok',
        steps: [
          'Go to Settings → Connections',
          'Click "Connect TikTok"',
          'Sign in with TikTok',
          'Grant permissions',
        ],
        estimatedTime: '2-3 minutes'
      };
      
    default:
      return {
        title: 'Connect Account',
        steps: ['Follow the setup wizard'],
        estimatedTime: 'A few minutes'
      };
  }
}

export const MISSION_ACTIVATION_VERSION = '1.0.0';
