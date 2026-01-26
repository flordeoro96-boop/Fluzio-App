/**
 * Premium Service Access Service
 * 
 * Manages tier-based access to premium features for businesses.
 * 
 * Tiers:
 * - FREE: Basic features
 * - GOLD: Access to premium services
 * - PLATINUM: Priority access + higher volume
 * 
 * Rules:
 * - Features locked by tier
 * - No one-off add-ons (unless explicitly enabled)
 * - Clear upgrade paths
 */

import { db } from './apiService';
import { doc, getDoc } from '../services/firestoreCompat';
import {
  PremiumServiceTier,
  PremiumService,
  PREMIUM_SERVICES,
  PremiumServiceAccess
} from '../types/customerLevels';

// ============================================================================
// SERVICE ACCESS CHECKING
// ============================================================================

/**
 * Check if business has access to a premium service
 */
export async function hasServiceAccess(
  businessId: string,
  service: PremiumService
): Promise<{
  hasAccess: boolean;
  currentTier: PremiumServiceTier;
  requiredTier: PremiumServiceTier;
  message: string;
  upgradeRequired: boolean;
}> {
  try {
    // Get business tier
    const businessRef = doc(db, 'businesses', businessId);
    const businessSnap = await getDoc(businessRef);
    
    if (!businessSnap.exists()) {
      return {
        hasAccess: false,
        currentTier: PremiumServiceTier.STARTER,
        requiredTier: PREMIUM_SERVICES[service].requiredTier,
        message: 'Business not found',
        upgradeRequired: true
      };
    }
    
    const businessData = businessSnap.data();
    const currentTier = (businessData.premiumTier || PremiumServiceTier.STARTER) as PremiumServiceTier;
    const serviceAccess = PREMIUM_SERVICES[service];
    
    // Check tier access
    const tierOrder = {
      [PremiumServiceTier.STARTER]: 0,
      [PremiumServiceTier.GOLD]: 1,
      [PremiumServiceTier.PLATINUM]: 2
    };
    
    const hasAccess = tierOrder[currentTier] >= tierOrder[serviceAccess.requiredTier];
    
    if (hasAccess) {
      return {
        hasAccess: true,
        currentTier,
        requiredTier: serviceAccess.requiredTier,
        message: `You have ${currentTier} access`,
        upgradeRequired: false
      };
    } else {
      return {
        hasAccess: false,
        currentTier,
        requiredTier: serviceAccess.requiredTier,
        message: `Upgrade to ${serviceAccess.requiredTier} to access ${serviceAccess.displayName}`,
        upgradeRequired: true
      };
    }
    
  } catch (error) {
    console.error('[PremiumService] Error checking access:', error);
    return {
      hasAccess: false,
      currentTier: PremiumServiceTier.STARTER,
      requiredTier: PREMIUM_SERVICES[service].requiredTier,
      message: 'Error checking access',
      upgradeRequired: true
    };
  }
}

/**
 * Get all services available to a business tier
 */
export function getAvailableServices(tier: PremiumServiceTier): PremiumServiceAccess[] {
  const tierOrder = {
    [PremiumServiceTier.STARTER]: 0,
    [PremiumServiceTier.GOLD]: 1,
    [PremiumServiceTier.PLATINUM]: 2
  };
  
  return Object.values(PREMIUM_SERVICES).filter(
    (service) => tierOrder[tier] >= tierOrder[service.requiredTier]
  );
}

/**
 * Get services locked for a business tier (for upgrade prompts)
 */
export function getLockedServices(tier: PremiumServiceTier): PremiumServiceAccess[] {
  const tierOrder = {
    [PremiumServiceTier.STARTER]: 0,
    [PremiumServiceTier.GOLD]: 1,
    [PremiumServiceTier.PLATINUM]: 2
  };
  
  return Object.values(PREMIUM_SERVICES).filter(
    (service) => tierOrder[tier] < tierOrder[service.requiredTier]
  );
}

/**
 * Get feature comparison between tiers
 */
export function getTierComparison(service: PremiumService): {
  service: PremiumServiceAccess;
  freeAccess: boolean;
  goldFeatures: string[];
  platinumFeatures: string[];
} {
  const serviceAccess = PREMIUM_SERVICES[service];
  
  return {
    service: serviceAccess,
    freeAccess: serviceAccess.requiredTier === PremiumServiceTier.STARTER,
    goldFeatures: serviceAccess.goldFeatures || [],
    platinumFeatures: serviceAccess.platinumFeatures || []
  };
}

/**
 * Check if business can perform action (with volume limits)
 */
export async function checkServiceUsage(
  businessId: string,
  service: PremiumService,
  currentUsage: number
): Promise<{
  canUse: boolean;
  message: string;
  limitReached: boolean;
  upgradeMessage?: string;
}> {
  const accessCheck = await hasServiceAccess(businessId, service);
  
  if (!accessCheck.hasAccess) {
    return {
      canUse: false,
      message: accessCheck.message,
      limitReached: false,
      upgradeMessage: `Upgrade to ${accessCheck.requiredTier} to access this feature`
    };
  }
  
  // Get usage limits based on tier
  const limits = getUsageLimits(service, accessCheck.currentTier);
  
  if (limits.unlimited) {
    return {
      canUse: true,
      message: 'Unlimited usage available',
      limitReached: false
    };
  }
  
  if (currentUsage >= limits.limit) {
    const isPlatinum = accessCheck.currentTier === PremiumServiceTier.PLATINUM;
    const upgradeMessage = isPlatinum 
      ? undefined 
      : 'Upgrade to Platinum for higher limits';
    
    return {
      canUse: false,
      message: `You've reached your monthly limit for ${PREMIUM_SERVICES[service].displayName}`,
      limitReached: true,
      upgradeMessage
    };
  }
  
  return {
    canUse: true,
    message: `${limits.limit - currentUsage} uses remaining this month`,
    limitReached: false
  };
}

/**
 * Get usage limits for a service by tier
 */
function getUsageLimits(
  service: PremiumService,
  tier: PremiumServiceTier
): { limit: number; unlimited: boolean } {
  // Define limits per service per tier
  const limits: Record<PremiumService, Record<PremiumServiceTier, { limit: number; unlimited: boolean }>> = {
    [PremiumService.PROFESSIONAL_PHOTOSHOOT]: {
      [PremiumServiceTier.STARTER]: { limit: 0, unlimited: false },
      [PremiumServiceTier.GOLD]: { limit: 1, unlimited: false },      // 1 per month
      [PremiumServiceTier.PLATINUM]: { limit: 3, unlimited: false }   // 3 per month
    },
    [PremiumService.CREATOR_HIRING]: {
      [PremiumServiceTier.STARTER]: { limit: 0, unlimited: false },
      [PremiumServiceTier.GOLD]: { limit: 5, unlimited: false },      // 5 creators per month
      [PremiumServiceTier.PLATINUM]: { limit: 20, unlimited: false }  // 20 creators per month
    },
    [PremiumService.EVENT_HOSTING]: {
      [PremiumServiceTier.STARTER]: { limit: 0, unlimited: false },
      [PremiumServiceTier.GOLD]: { limit: 2, unlimited: false },      // 2 events per month
      [PremiumServiceTier.PLATINUM]: { limit: 0, unlimited: true }    // Unlimited
    },
    [PremiumService.ADVANCED_AI_INSIGHTS]: {
      [PremiumServiceTier.STARTER]: { limit: 0, unlimited: false },
      [PremiumServiceTier.GOLD]: { limit: 0, unlimited: true },       // Unlimited
      [PremiumServiceTier.PLATINUM]: { limit: 0, unlimited: true }
    },
    [PremiumService.AI_AUTO_OPTIMIZE]: {
      [PremiumServiceTier.STARTER]: { limit: 0, unlimited: false },
      [PremiumServiceTier.GOLD]: { limit: 0, unlimited: true },       // Unlimited
      [PremiumServiceTier.PLATINUM]: { limit: 0, unlimited: true }
    },
    [PremiumService.PRIORITY_SUPPORT]: {
      [PremiumServiceTier.STARTER]: { limit: 0, unlimited: false },
      [PremiumServiceTier.GOLD]: { limit: 0, unlimited: true },
      [PremiumServiceTier.PLATINUM]: { limit: 0, unlimited: true }
    },
    [PremiumService.UNLIMITED_REWARDS]: {
      [PremiumServiceTier.STARTER]: { limit: 10, unlimited: false },     // 10 rewards max
      [PremiumServiceTier.GOLD]: { limit: 0, unlimited: true },       // Unlimited
      [PremiumServiceTier.PLATINUM]: { limit: 0, unlimited: true }
    }
  };
  
  return limits[service][tier];
}

/**
 * Get tier pricing (for upgrade prompts)
 */
export function getTierPricing(): Record<PremiumServiceTier, {
  tier: PremiumServiceTier;
  displayName: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  popular?: boolean;
}> {
  return {
    [PremiumServiceTier.STARTER]: {
      tier: PremiumServiceTier.STARTER,
      displayName: 'Starter',
      monthlyPrice: 0,
      yearlyPrice: 0,
      features: [
        'Up to 10 rewards',
        'Basic analytics',
        'Community support',
        'Standard mission access'
      ]
    },
    [PremiumServiceTier.GOLD]: {
      tier: PremiumServiceTier.GOLD,
      displayName: 'Gold',
      monthlyPrice: 99,
      yearlyPrice: 999,
      features: [
        'Unlimited rewards',
        'Professional photoshoots (1/month)',
        'Creator hiring (5/month)',
        'Event hosting (2/month)',
        'Advanced AI insights',
        'AI auto-optimize',
        'Priority email support'
      ],
      popular: true
    },
    [PremiumServiceTier.PLATINUM]: {
      tier: PremiumServiceTier.PLATINUM,
      displayName: 'Platinum',
      monthlyPrice: 299,
      yearlyPrice: 2999,
      features: [
        'Everything in Gold',
        'Professional photoshoots (3/month)',
        'Creator hiring (20/month)',
        'Unlimited event hosting',
        'Advanced optimization',
        '24/7 phone support',
        'Dedicated account manager',
        'Priority placement'
      ]
    }
  };
}

/**
 * Calculate savings for yearly subscription
 */
export function calculateYearlySavings(tier: PremiumServiceTier): number {
  const pricing = getTierPricing()[tier];
  const monthlyTotal = pricing.monthlyPrice * 12;
  return monthlyTotal - pricing.yearlyPrice;
}

/**
 * Get upgrade call-to-action for locked service
 */
export function getUpgradeCTA(
  service: PremiumService,
  currentTier: PremiumServiceTier
): {
  title: string;
  description: string;
  buttonText: string;
  requiredTier: PremiumServiceTier;
} {
  const serviceAccess = PREMIUM_SERVICES[service];
  const pricing = getTierPricing()[serviceAccess.requiredTier];
  
  return {
    title: `Unlock ${serviceAccess.displayName}`,
    description: `Upgrade to ${pricing.displayName} to access ${serviceAccess.description}`,
    buttonText: `Upgrade to ${pricing.displayName} - $${pricing.monthlyPrice}/mo`,
    requiredTier: serviceAccess.requiredTier
  };
}
