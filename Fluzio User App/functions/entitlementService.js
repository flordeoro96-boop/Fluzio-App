/**
 * Events Entitlement Service
 * 
 * Manages event credit tracking and tier-based entitlements
 * 
 * Rules:
 * Level 1: Squad + Events only (no missions/rewards)
 * Level 2 FREE: No events
 * Level 2 SILVER: Pay-per-use only
 * Level 2 GOLD: Pay-per-use + 1 free per quarter
 * Level 2 PLATINUM: 1 free per month + 1 bonus premium per quarter
 */

const admin = require('firebase-admin');
const db = admin.firestore();

/**
 * Get entitlement rules for a business level + tier
 */
function getEntitlementRules(businessLevel, subscriptionTier) {
  // Level 1: Can attend events (no missions/rewards)
  if (businessLevel === 1) {
    return {
      canAttendEvents: true,
      standardEventsPerPeriod: 0, // No free credits for Level 1
      premiumEventsPerPeriod: 0,
      periodType: null,
      requiresPayment: true // Level 1 pays per use
    };
  }
  
  // Level 2+ tier-based rules
  if (businessLevel >= 2) {
    switch (subscriptionTier) {
      case 'STARTER':
        return {
          canAttendEvents: false, // STARTER tier cannot attend events
          standardEventsPerPeriod: 0,
          premiumEventsPerPeriod: 0,
          periodType: null,
          requiresPayment: false
        };
      
      case 'SILVER':
        return {
          canAttendEvents: true,
          standardEventsPerPeriod: 0, // No free credits
          premiumEventsPerPeriod: 0,
          periodType: null,
          requiresPayment: true // Pay per use only
        };
      
      case 'GOLD':
        return {
          canAttendEvents: true,
          standardEventsPerPeriod: 1, // 1 free per quarter
          premiumEventsPerPeriod: 0,
          periodType: 'QUARTERLY',
          requiresPayment: false // Has free credits
        };
      
      case 'PLATINUM':
        return {
          canAttendEvents: true,
          standardEventsPerPeriod: 1, // 1 free per month
          premiumEventsPerPeriod: 1, // 1 bonus premium per quarter
          periodType: 'MONTHLY', // Monthly for standard, quarterly for premium
          requiresPayment: false // Has free credits
        };
      
      default:
        return {
          canAttendEvents: false,
          standardEventsPerPeriod: 0,
          premiumEventsPerPeriod: 0,
          periodType: null,
          requiresPayment: false
        };
    }
  }
  
  // Default: no access
  return {
    canAttendEvents: false,
    standardEventsPerPeriod: 0,
    premiumEventsPerPeriod: 0,
    periodType: null,
    requiresPayment: false
  };
}

/**
 * Get or create entitlement ledger for current period
 */
async function getOrCreateEntitlementLedger(businessId, businessLevel, subscriptionTier) {
  try {
    const rules = getEntitlementRules(businessLevel, subscriptionTier);
    
    if (!rules.canAttendEvents) {
      return { success: false, error: 'Business tier does not have event access' };
    }
    
    const now = new Date();
    
    // Calculate period start/end based on rules
    let periodStart, periodEnd, periodType;
    
    if (rules.periodType === 'MONTHLY') {
      // Monthly period: 1st of this month to end of month
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      periodType = 'MONTHLY';
    } else if (rules.periodType === 'QUARTERLY') {
      // Quarterly period: Start of quarter to end of quarter
      const quarter = Math.floor(now.getMonth() / 3);
      periodStart = new Date(now.getFullYear(), quarter * 3, 1);
      periodEnd = new Date(now.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59);
      periodType = 'QUARTERLY';
    } else {
      // No period (pay-per-use only)
      return { success: true, ledger: null, requiresPayment: true };
    }
    
    // Check if ledger exists for current period
    const ledgerQuery = await db.collection('entitlementLedgers')
      .where('businessId', '==', businessId)
      .where('periodStart', '==', periodStart.toISOString())
      .where('isActive', '==', true)
      .limit(1)
      .get();
    
    if (!ledgerQuery.empty) {
      const existingLedger = { id: ledgerQuery.docs[0].id, ...ledgerQuery.docs[0].data() };
      return { success: true, ledger: existingLedger, requiresPayment: false };
    }
    
    // Create new ledger for this period
    const newLedger = {
      businessId,
      businessLevel,
      subscriptionTier,
      periodType,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      standardEventsAllowed: rules.standardEventsPerPeriod,
      premiumEventsAllowed: rules.premiumEventsPerPeriod,
      standardEventsUsed: 0,
      premiumEventsUsed: 0,
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      standardEventsConsumed: [],
      premiumEventsConsumed: []
    };
    
    const ledgerRef = await db.collection('entitlementLedgers').add(newLedger);
    
    console.log(`[Entitlements] Created new ledger ${ledgerRef.id} for business ${businessId} (${periodType})`);
    
    return { 
      success: true, 
      ledger: { id: ledgerRef.id, ...newLedger },
      requiresPayment: false
    };
  } catch (error) {
    console.error('[Entitlements] Error in getOrCreateEntitlementLedger:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Check if business can use a free credit for an event
 */
async function canUseCredit(businessId, eventId, isPremium) {
  try {
    // Get business profile
    const businessSnap = await db.collection('users').doc(businessId).get();
    if (!businessSnap.exists) {
      return { canUse: false, error: 'Business not found' };
    }
    
    const business = businessSnap.data();
    const businessLevel = business.businessLevel || 1;
    const subscriptionTier = business.subscriptionTier || 'FREE';
    
    // Get entitlement ledger
    const ledgerResult = await getOrCreateEntitlementLedger(businessId, businessLevel, subscriptionTier);
    
    if (!ledgerResult.success || !ledgerResult.ledger) {
      return { canUse: false, error: ledgerResult.error || 'No active credits', requiresPayment: true };
    }
    
    const ledger = ledgerResult.ledger;
    
    // Check if credits available
    if (isPremium) {
      // Premium event - check premium credits
      if (ledger.premiumEventsUsed >= ledger.premiumEventsAllowed) {
        return { 
          canUse: false, 
          error: 'No premium event credits remaining this period',
          requiresPayment: true
        };
      }
    } else {
      // Standard event - check standard credits
      if (ledger.standardEventsUsed >= ledger.standardEventsAllowed) {
        return { 
          canUse: false, 
          error: 'No event credits remaining this period',
          requiresPayment: true
        };
      }
    }
    
    return { 
      canUse: true, 
      ledgerId: ledger.id,
      creditType: isPremium ? 'QUARTERLY_PREMIUM' : (ledger.periodType === 'MONTHLY' ? 'MONTHLY' : 'QUARTERLY_STANDARD'),
      remainingCredits: {
        standard: ledger.standardEventsAllowed - ledger.standardEventsUsed,
        premium: ledger.premiumEventsAllowed - ledger.premiumEventsUsed
      }
    };
  } catch (error) {
    console.error('[Entitlements] Error in canUseCredit:', error);
    return { canUse: false, error: error.message };
  }
}

/**
 * Consume a credit (update ledger)
 */
async function consumeCredit(ledgerId, eventId, isPremium) {
  try {
    const ledgerRef = db.collection('entitlementLedgers').doc(ledgerId);
    const ledgerSnap = await ledgerRef.get();
    
    if (!ledgerSnap.exists) {
      return { success: false, error: 'Ledger not found' };
    }
    
    const ledger = ledgerSnap.data();
    
    if (isPremium) {
      // Consume premium credit
      await ledgerRef.update({
        premiumEventsUsed: admin.firestore.FieldValue.increment(1),
        premiumEventsConsumed: admin.firestore.FieldValue.arrayUnion(eventId),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      // Consume standard credit
      await ledgerRef.update({
        standardEventsUsed: admin.firestore.FieldValue.increment(1),
        standardEventsConsumed: admin.firestore.FieldValue.arrayUnion(eventId),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    console.log(`[Entitlements] Consumed ${isPremium ? 'premium' : 'standard'} credit for event ${eventId}`);
    
    return { success: true };
  } catch (error) {
    console.error('[Entitlements] Error in consumeCredit:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get current entitlement status for a business
 */
async function getEntitlementStatus(businessId) {
  try {
    const businessSnap = await db.collection('users').doc(businessId).get();
    if (!businessSnap.exists) {
      return { success: false, error: 'Business not found' };
    }
    
    const business = businessSnap.data();
    const businessLevel = business.businessLevel || 1;
    const subscriptionTier = business.subscriptionTier || 'FREE';
    
    const rules = getEntitlementRules(businessLevel, subscriptionTier);
    
    if (!rules.canAttendEvents) {
      return {
        success: true,
        entitlement: {
          businessId,
          level: businessLevel,
          tier: subscriptionTier,
          canAttendEvents: false,
          requiresPayment: false,
          message: subscriptionTier === 'FREE' ? 'Upgrade to SILVER or higher to attend events' : 'Event access not available for your level'
        }
      };
    }
    
    // Get active ledger
    const ledgerResult = await getOrCreateEntitlementLedger(businessId, businessLevel, subscriptionTier);
    
    const entitlement = {
      businessId,
      level: businessLevel,
      tier: subscriptionTier,
      canAttendEvents: true,
      requiresPayment: rules.requiresPayment || !ledgerResult.ledger
    };
    
    if (ledgerResult.ledger) {
      const ledger = ledgerResult.ledger;
      entitlement.currentPeriod = {
        start: ledger.periodStart,
        end: ledger.periodEnd
      };
      entitlement.standardCredits = {
        total: ledger.standardEventsAllowed,
        used: ledger.standardEventsUsed,
        remaining: ledger.standardEventsAllowed - ledger.standardEventsUsed
      };
      entitlement.premiumCredits = {
        total: ledger.premiumEventsAllowed,
        used: ledger.premiumEventsUsed,
        remaining: ledger.premiumEventsAllowed - ledger.premiumEventsUsed
      };
      
      // Calculate next reset
      const periodEnd = new Date(ledger.periodEnd);
      entitlement.nextResetDate = new Date(periodEnd.getTime() + 24 * 60 * 60 * 1000).toISOString(); // Day after period ends
    }
    
    return { success: true, entitlement };
  } catch (error) {
    console.error('[Entitlements] Error in getEntitlementStatus:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  getEntitlementRules,
  getOrCreateEntitlementLedger,
  canUseCredit,
  consumeCredit,
  getEntitlementStatus
};
