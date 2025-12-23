/**
 * City Cohorts Backend Service
 * 
 * Manages city-based scarcity model for Level 2+ businesses
 * Munich: 100 slots, Others: 40 slots
 * 
 * Features:
 * - Create/manage cohorts per city
 * - Automatic slot consumption on business approval
 * - Founding Partner badges
 * - Pricing locks for X months
 * - Auto-close when full
 */

const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const { requireRole, requireScope, logAdminActionEnhanced, applyScopeFilter, canAccessEntity } = require('./authMiddleware');

const db = admin.firestore();

/**
 * Create a new city cohort (SUPER_ADMIN, COUNTRY_ADMIN only)
 */
exports.createCityCohort = onRequest({
  cors: true,
  invoker: "public"
}, async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }
  
  try {
    const { adminId, cityId, cityName, countryId, cohortName, maxSlots, foundingBadgeLabel, pricingLockMonths, startAt, endAt, description, notes } = req.body;
    
    if (!adminId || !cityId || !cohortName || !maxSlots) {
      res.status(400).json({ success: false, error: 'Missing required fields' });
      return;
    }
    
    // RBAC: Check role
    const roleCheck = await requireRole(['SUPER_ADMIN', 'COUNTRY_ADMIN'])(adminId);
    if (!roleCheck.success) {
      res.status(roleCheck.code).json({ success: false, error: roleCheck.error });
      return;
    }
    
    // RBAC: Check scope for COUNTRY_ADMIN
    if (roleCheck.adminData.role === 'COUNTRY_ADMIN') {
      if (roleCheck.adminData.countryId !== countryId) {
        res.status(403).json({ success: false, error: 'Cannot create cohort outside your country' });
        return;
      }
    }
    
    // Check if city already has an active cohort
    const existingCohort = await db.collection('cityCohorts')
      .where('cityId', '==', cityId)
      .where('status', '==', 'OPEN')
      .get();
    
    if (!existingCohort.empty) {
      res.status(400).json({ success: false, error: 'City already has an active cohort. Close it first.' });
      return;
    }
    
    // Create cohort
    const cohortData = {
      cityId,
      cityName,
      countryId,
      cohortName,
      maxSlots,
      usedSlots: 0,
      status: 'PENDING', // Admin must explicitly open it
      startAt: startAt || new Date().toISOString(),
      endAt: endAt || null,
      foundingBadgeLabel: foundingBadgeLabel || 'Founding Partner',
      pricingLockMonths: pricingLockMonths || 12,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: adminId,
      description: description || '',
      notes: notes || ''
    };
    
    const cohortRef = await db.collection('cityCohorts').add(cohortData);
    
    // Log admin action
    await logAdminActionEnhanced(
      roleCheck.adminData,
      'CREATE_COHORT',
      'cohort',
      cohortRef.id,
      {
        after: cohortData,
        notes: `Created cohort "${cohortName}" for ${cityName} with ${maxSlots} slots`
      },
      req
    );
    
    console.log(`[Cohorts] Created cohort ${cohortRef.id} for ${cityName} by admin ${adminId}`);
    
    res.status(200).json({ 
      success: true, 
      cohortId: cohortRef.id,
      cohort: { id: cohortRef.id, ...cohortData }
    });
  } catch (error) {
    console.error('[Cohorts] Error in createCityCohort:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get all cohorts (filtered by admin scope)
 */
exports.getCityCohorts = onRequest({
  cors: true,
  invoker: "public"
}, async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }
  
  try {
    const adminId = req.query.adminId || req.body.adminId;
    const cityId = req.query.cityId;
    const status = req.query.status;
    
    if (!adminId) {
      res.status(400).json({ success: false, error: 'adminId required' });
      return;
    }
    
    // RBAC: Check role
    const roleCheck = await requireRole(['SUPER_ADMIN', 'COUNTRY_ADMIN', 'CITY_ADMIN'])(adminId);
    if (!roleCheck.success) {
      res.status(roleCheck.code).json({ success: false, error: roleCheck.error });
      return;
    }
    
    let query = db.collection('cityCohorts');
    
    // Apply scope filter
    if (roleCheck.adminData.role === 'COUNTRY_ADMIN') {
      query = query.where('countryId', '==', roleCheck.adminData.countryId);
    } else if (roleCheck.adminData.role === 'CITY_ADMIN') {
      query = query.where('cityId', '==', roleCheck.adminData.cityId);
    }
    
    // Apply additional filters
    if (cityId) {
      query = query.where('cityId', '==', cityId);
    }
    if (status) {
      query = query.where('status', '==', status);
    }
    
    const snapshot = await query.orderBy('createdAt', 'desc').get();
    
    const cohorts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`[Cohorts] Retrieved ${cohorts.length} cohorts for admin ${adminId}`);
    
    res.status(200).json({ success: true, cohorts });
  } catch (error) {
    console.error('[Cohorts] Error in getCityCohorts:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Update cohort (change status, slots, etc.)
 */
exports.updateCityCohort = onRequest({
  cors: true,
  invoker: "public"
}, async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "PUT, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }
  
  try {
    const { adminId, cohortId, ...updates } = req.body;
    
    if (!adminId || !cohortId) {
      res.status(400).json({ success: false, error: 'adminId and cohortId required' });
      return;
    }
    
    // RBAC: Check role
    const roleCheck = await requireRole(['SUPER_ADMIN', 'COUNTRY_ADMIN'])(adminId);
    if (!roleCheck.success) {
      res.status(roleCheck.code).json({ success: false, error: roleCheck.error });
      return;
    }
    
    const cohortRef = db.collection('cityCohorts').doc(cohortId);
    const cohortSnap = await cohortRef.get();
    
    if (!cohortSnap.exists) {
      res.status(404).json({ success: false, error: 'Cohort not found' });
      return;
    }
    
    const cohortData = cohortSnap.data();
    
    // RBAC: Check scope
    if (roleCheck.adminData.role === 'COUNTRY_ADMIN') {
      if (roleCheck.adminData.countryId !== cohortData.countryId) {
        res.status(403).json({ success: false, error: 'Cannot update cohort outside your country' });
        return;
      }
    }
    
    const beforeState = { ...cohortData };
    
    // Build update object
    const updateData = {
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: adminId
    };
    
    await cohortRef.update(updateData);
    
    // Log admin action
    await logAdminActionEnhanced(
      roleCheck.adminData,
      'UPDATE_COHORT',
      'cohort',
      cohortId,
      {
        before: beforeState,
        after: { ...beforeState, ...updateData },
        notes: `Updated cohort ${cohortData.cohortName}`
      },
      req
    );
    
    console.log(`[Cohorts] Updated cohort ${cohortId} by admin ${adminId}`);
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('[Cohorts] Error in updateCityCohort:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Activate cohort (change status to OPEN)
 */
exports.activateCohort = onRequest({
  cors: true,
  invoker: "public"
}, async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }
  
  try {
    const { adminId, cohortId } = req.body;
    
    if (!adminId || !cohortId) {
      res.status(400).json({ success: false, error: 'adminId and cohortId required' });
      return;
    }
    
    // RBAC: Check role
    const roleCheck = await requireRole(['SUPER_ADMIN', 'COUNTRY_ADMIN'])(adminId);
    if (!roleCheck.success) {
      res.status(roleCheck.code).json({ success: false, error: roleCheck.error });
      return;
    }
    
    const cohortRef = db.collection('cityCohorts').doc(cohortId);
    const cohortSnap = await cohortRef.get();
    
    if (!cohortSnap.exists) {
      res.status(404).json({ success: false, error: 'Cohort not found' });
      return;
    }
    
    const cohortData = cohortSnap.data();
    
    // RBAC: Check scope
    if (roleCheck.adminData.role === 'COUNTRY_ADMIN') {
      if (roleCheck.adminData.countryId !== cohortData.countryId) {
        res.status(403).json({ success: false, error: 'Cannot activate cohort outside your country' });
        return;
      }
    }
    
    if (cohortData.status === 'OPEN') {
      res.status(400).json({ success: false, error: 'Cohort is already open' });
      return;
    }
    
    if (cohortData.status === 'CLOSED') {
      res.status(400).json({ success: false, error: 'Cannot reopen a closed cohort' });
      return;
    }
    
    await cohortRef.update({
      status: 'OPEN',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: adminId
    });
    
    // Log admin action
    await logAdminActionEnhanced(
      roleCheck.adminData,
      'ACTIVATE_COHORT',
      'cohort',
      cohortId,
      {
        before: { status: cohortData.status },
        after: { status: 'OPEN' },
        notes: `Activated cohort ${cohortData.cohortName} - now accepting businesses`
      },
      req
    );
    
    console.log(`[Cohorts] Activated cohort ${cohortId} by admin ${adminId}`);
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('[Cohorts] Error in activateCohort:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get cohort stats (used/available slots, members, etc.)
 */
exports.getCohortStats = onRequest({
  cors: true,
  invoker: "public"
}, async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }
  
  try {
    const cohortId = req.query.cohortId;
    const adminId = req.query.adminId;
    
    if (!cohortId || !adminId) {
      res.status(400).json({ success: false, error: 'cohortId and adminId required' });
      return;
    }
    
    // RBAC: Check role
    const roleCheck = await requireRole(['SUPER_ADMIN', 'COUNTRY_ADMIN', 'CITY_ADMIN'])(adminId);
    if (!roleCheck.success) {
      res.status(roleCheck.code).json({ success: false, error: roleCheck.error });
      return;
    }
    
    const cohortSnap = await db.collection('cityCohorts').doc(cohortId).get();
    
    if (!cohortSnap.exists) {
      res.status(404).json({ success: false, error: 'Cohort not found' });
      return;
    }
    
    const cohortData = cohortSnap.data();
    
    // RBAC: Check scope
    if (!canAccessEntity(roleCheck.adminData, { countryId: cohortData.countryId, cityId: cohortData.cityId })) {
      res.status(403).json({ success: false, error: 'Cannot access cohort outside your scope' });
      return;
    }
    
    // Get memberships
    const membershipsSnap = await db.collection('cohortMemberships')
      .where('cohortId', '==', cohortId)
      .get();
    
    const memberships = membershipsSnap.docs.map(doc => doc.data());
    const activeBusinesses = memberships.filter(m => m.status === 'ACTIVE').length;
    const revokedBusinesses = memberships.filter(m => m.status === 'REVOKED').length;
    
    const stats = {
      cohortId,
      totalSlots: cohortData.maxSlots,
      usedSlots: cohortData.usedSlots,
      availableSlots: cohortData.maxSlots - cohortData.usedSlots,
      percentFilled: Math.round((cohortData.usedSlots / cohortData.maxSlots) * 100),
      activeBusinesses,
      revokedBusinesses,
      isOpen: cohortData.status === 'OPEN',
      isFull: cohortData.usedSlots >= cohortData.maxSlots
    };
    
    // Calculate days remaining if endAt exists
    if (cohortData.endAt) {
      const endDate = new Date(cohortData.endAt);
      const now = new Date();
      const diffTime = endDate.getTime() - now.getTime();
      stats.daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    res.status(200).json({ success: true, stats, memberships });
  } catch (error) {
    console.error('[Cohorts] Error in getCohortStats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Helper: Consume cohort slot (called during business approval)
 * This is internal - called from approveBusinessLevelUpgrade
 */
async function consumeCohortSlot(businessId, businessName, cityId, businessLevel) {
  try {
    // Only consume slot for Level 2+
    if (businessLevel < 2) {
      return { success: true, cohortJoined: false };
    }
    
    // Find active cohort for this city
    const cohortQuery = await db.collection('cityCohorts')
      .where('cityId', '==', cityId)
      .where('status', '==', 'OPEN')
      .limit(1)
      .get();
    
    if (cohortQuery.empty) {
      console.log(`[Cohorts] No active cohort for city ${cityId}`);
      return { success: true, cohortJoined: false, reason: 'No active cohort' };
    }
    
    const cohortDoc = cohortQuery.docs[0];
    const cohortData = cohortDoc.data();
    const cohortId = cohortDoc.id;
    
    // Check if slots available
    if (cohortData.usedSlots >= cohortData.maxSlots) {
      console.log(`[Cohorts] Cohort ${cohortId} is full`);
      return { success: false, error: 'Cohort is full', cohortFull: true };
    }
    
    // Check if business already in cohort
    const existingMembership = await db.collection('cohortMemberships')
      .where('cohortId', '==', cohortId)
      .where('businessId', '==', businessId)
      .where('status', '==', 'ACTIVE')
      .get();
    
    if (!existingMembership.empty) {
      console.log(`[Cohorts] Business ${businessId} already in cohort ${cohortId}`);
      return { success: true, cohortJoined: false, reason: 'Already in cohort' };
    }
    
    // Consume slot
    const newSlotNumber = cohortData.usedSlots + 1;
    
    // Calculate pricing lock expiration
    const pricingLockedUntil = new Date();
    pricingLockedUntil.setMonth(pricingLockedUntil.getMonth() + cohortData.pricingLockMonths);
    
    // Create membership
    const membershipData = {
      cohortId,
      businessId,
      businessName,
      joinedAt: admin.firestore.FieldValue.serverTimestamp(),
      slotNumber: newSlotNumber,
      foundingBadgeActive: true,
      pricingLockedUntil: pricingLockedUntil.toISOString(),
      status: 'ACTIVE',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('cohortMemberships').add(membershipData);
    
    // Update cohort used slots
    await cohortDoc.ref.update({
      usedSlots: newSlotNumber,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Auto-close if full
    if (newSlotNumber >= cohortData.maxSlots) {
      await cohortDoc.ref.update({
        status: 'CLOSED',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`[Cohorts] 🎯 Cohort ${cohortId} is now FULL and CLOSED (${newSlotNumber}/${cohortData.maxSlots})`);
    }
    
    // Add founding badge to business profile
    await db.collection('users').doc(businessId).update({
      foundingPartner: true,
      foundingBadgeLabel: cohortData.foundingBadgeLabel,
      cohortId: cohortId,
      pricingLockedUntil: pricingLockedUntil.toISOString()
    });
    
    console.log(`[Cohorts] ✅ Business ${businessId} joined cohort ${cohortId} (slot ${newSlotNumber}/${cohortData.maxSlots})`);
    
    return {
      success: true,
      cohortJoined: true,
      cohortId,
      cohortName: cohortData.cohortName,
      slotNumber: newSlotNumber,
      foundingBadgeLabel: cohortData.foundingBadgeLabel,
      pricingLockedUntil: pricingLockedUntil.toISOString(),
      cohortFull: newSlotNumber >= cohortData.maxSlots
    };
  } catch (error) {
    console.error('[Cohorts] Error in consumeCohortSlot:', error);
    return { success: false, error: error.message };
  }
}

// Export the consumeCohortSlot function for use by other services
exports.consumeCohortSlot = consumeCohortSlot;
