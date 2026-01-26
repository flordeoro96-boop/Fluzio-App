/**
 * Events Backend Service
 * 
 * Manages events with tier-based entitlements
 * - Admin: Create, manage, check-in attendees
 * - Business: Browse, register, view tickets
 * - Automatic credit tracking and payment processing
 */

const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const { requireRole, requireScope, logAdminActionEnhanced, applyScopeFilter, canAccessEntity } = require('./authMiddleware');
const { canUseCredit, consumeCredit, getEntitlementStatus } = require('./entitlementService');

const db = admin.firestore();

/**
 * ADMIN ENDPOINT: Create Event
 * Scope: COUNTRY_ADMIN (country events), CITY_ADMIN (city events), EVENT_ADMIN (assigned events)
 */
exports.createEvent = onRequest({
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
    const { adminId, title, description, eventType, isPremium, scope, countryId, cityId, venue, address, maxCapacity, pricePerTicket, currency, startDateTime, endDateTime, registrationDeadline, allowedLevels, allowedTiers, imageUrl, tags, internalNotes } = req.body;
    
    if (!adminId || !title || !eventType || !maxCapacity || !startDateTime || !endDateTime) {
      res.status(400).json({ success: false, error: 'Missing required fields' });
      return;
    }
    
    // RBAC: Check role
    const roleCheck = await requireRole(['SUPER_ADMIN', 'COUNTRY_ADMIN', 'CITY_ADMIN', 'EVENT_ADMIN'])(adminId);
    if (!roleCheck.success) {
      res.status(roleCheck.code).json({ success: false, error: roleCheck.error });
      return;
    }
    
    // RBAC: Validate scope matches admin permissions
    if (roleCheck.adminData.role === 'COUNTRY_ADMIN' && scope === 'COUNTRY') {
      if (roleCheck.adminData.countryId !== countryId) {
        res.status(403).json({ success: false, error: 'Cannot create events outside your country' });
        return;
      }
    } else if (roleCheck.adminData.role === 'CITY_ADMIN' && scope === 'CITY') {
      if (roleCheck.adminData.cityId !== cityId) {
        res.status(403).json({ success: false, error: 'Cannot create events outside your city' });
        return;
      }
    }
    
    // Get admin details
    const adminSnap = await db.collection('users').doc(adminId).get();
    const adminData = adminSnap.exists ? adminSnap.data() : {};
    
    // Create event
    const eventData = {
      title,
      description: description || '',
      eventType,
      isPremium: isPremium || false,
      scope: scope || 'CITY',
      countryId: countryId || null,
      cityId: cityId || null,
      venue: venue || '',
      address: address || '',
      maxCapacity,
      currentAttendees: 0,
      waitlistEnabled: false,
      waitlistCount: 0,
      pricePerTicket: pricePerTicket || 0,
      currency: currency || 'USD',
      startDateTime,
      endDateTime,
      registrationDeadline: registrationDeadline || endDateTime,
      status: 'DRAFT',
      allowedLevels: allowedLevels || [1, 2],
      allowedTiers: allowedTiers || ['SILVER', 'GOLD', 'PLATINUM'],
      imageUrl: imageUrl || null,
      organizerId: adminId,
      organizerName: adminData.name || 'Admin',
      organizerEmail: adminData.email || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      tags: tags || [],
      internalNotes: internalNotes || ''
    };
    
    const eventRef = await db.collection('events').add(eventData);
    
    // Log admin action
    await logAdminActionEnhanced(
      roleCheck.adminData,
      'CREATE_EVENT',
      'event',
      eventRef.id,
      {
        after: eventData,
        notes: `Created event "${title}" for ${startDateTime}`
      },
      req
    );
    
    console.log(`[Events] Created event ${eventRef.id} by admin ${adminId}`);
    
    res.status(200).json({ 
      success: true, 
      eventId: eventRef.id,
      event: { id: eventRef.id, ...eventData }
    });
  } catch (error) {
    console.error('[Events] Error in createEvent:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * ADMIN ENDPOINT: Update Event
 */
exports.updateEvent = onRequest({
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
    const { adminId, eventId, ...updates } = req.body;
    
    if (!adminId || !eventId) {
      res.status(400).json({ success: false, error: 'adminId and eventId required' });
      return;
    }
    
    // RBAC: Check role
    const roleCheck = await requireRole(['SUPER_ADMIN', 'COUNTRY_ADMIN', 'CITY_ADMIN', 'EVENT_ADMIN'])(adminId);
    if (!roleCheck.success) {
      res.status(roleCheck.code).json({ success: false, error: roleCheck.error });
      return;
    }
    
    const eventRef = db.collection('events').doc(eventId);
    const eventSnap = await eventRef.get();
    
    if (!eventSnap.exists) {
      res.status(404).json({ success: false, error: 'Event not found' });
      return;
    }
    
    const eventData = eventSnap.data();
    
    // RBAC: Check scope or ownership
    if (roleCheck.adminData.role !== 'SUPER_ADMIN') {
      if (eventData.organizerId !== adminId && !canAccessEntity(roleCheck.adminData, { countryId: eventData.countryId, cityId: eventData.cityId })) {
        res.status(403).json({ success: false, error: 'Cannot update event outside your scope' });
        return;
      }
    }
    
    const beforeState = { ...eventData };
    
    const updateData = {
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await eventRef.update(updateData);
    
    // Log admin action
    await logAdminActionEnhanced(
      roleCheck.adminData,
      'UPDATE_EVENT',
      'event',
      eventId,
      {
        before: beforeState,
        after: { ...beforeState, ...updateData },
        notes: `Updated event ${eventData.title}`
      },
      req
    );
    
    console.log(`[Events] Updated event ${eventId} by admin ${adminId}`);
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('[Events] Error in updateEvent:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * ADMIN ENDPOINT: Publish Event (DRAFT → PUBLISHED)
 */
exports.publishEvent = onRequest({
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
    const { adminId, eventId } = req.body;
    
    if (!adminId || !eventId) {
      res.status(400).json({ success: false, error: 'adminId and eventId required' });
      return;
    }
    
    // RBAC: Check role
    const roleCheck = await requireRole(['SUPER_ADMIN', 'COUNTRY_ADMIN', 'CITY_ADMIN', 'EVENT_ADMIN'])(adminId);
    if (!roleCheck.success) {
      res.status(roleCheck.code).json({ success: false, error: roleCheck.error });
      return;
    }
    
    const eventRef = db.collection('events').doc(eventId);
    const eventSnap = await eventRef.get();
    
    if (!eventSnap.exists) {
      res.status(404).json({ success: false, error: 'Event not found' });
      return;
    }
    
    const eventData = eventSnap.data();
    
    if (eventData.status !== 'DRAFT') {
      res.status(400).json({ success: false, error: 'Event is not in draft status' });
      return;
    }
    
    await eventRef.update({
      status: 'PUBLISHED',
      publishedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Log admin action
    await logAdminActionEnhanced(
      roleCheck.adminData,
      'PUBLISH_EVENT',
      'event',
      eventId,
      {
        before: { status: 'DRAFT' },
        after: { status: 'PUBLISHED' },
        notes: `Published event ${eventData.title}`
      },
      req
    );
    
    console.log(`[Events] Published event ${eventId} by admin ${adminId}`);
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('[Events] Error in publishEvent:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * ADMIN ENDPOINT: Get Events (scope-filtered)
 */
exports.getEvents = onRequest({
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
    const status = req.query.status;
    const eventType = req.query.eventType;
    
    if (!adminId) {
      res.status(400).json({ success: false, error: 'adminId required' });
      return;
    }
    
    // RBAC: Check role
    const roleCheck = await requireRole(['SUPER_ADMIN', 'COUNTRY_ADMIN', 'CITY_ADMIN', 'EVENT_ADMIN'])(adminId);
    if (!roleCheck.success) {
      res.status(roleCheck.code).json({ success: false, error: roleCheck.error });
      return;
    }
    
    let query = db.collection('events');
    
    // Apply scope filter
    if (roleCheck.adminData.role === 'COUNTRY_ADMIN') {
      query = query.where('countryId', '==', roleCheck.adminData.countryId);
    } else if (roleCheck.adminData.role === 'CITY_ADMIN') {
      query = query.where('cityId', '==', roleCheck.adminData.cityId);
    } else if (roleCheck.adminData.role === 'EVENT_ADMIN') {
      query = query.where('organizerId', '==', adminId);
    }
    
    // Apply filters
    if (status) {
      query = query.where('status', '==', status);
    }
    if (eventType) {
      query = query.where('eventType', '==', eventType);
    }
    
    const snapshot = await query.orderBy('startDateTime', 'desc').get();
    
    const events = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`[Events] Retrieved ${events.length} events for admin ${adminId}`);
    
    res.status(200).json({ success: true, events });
  } catch (error) {
    console.error('[Events] Error in getEvents:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * ADMIN ENDPOINT: Check-in Attendee
 */
exports.checkInAttendee = onRequest({
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
    const { adminId, ticketId, checkInMethod } = req.body;
    
    if (!adminId || !ticketId) {
      res.status(400).json({ success: false, error: 'adminId and ticketId required' });
      return;
    }
    
    // RBAC: Check role
    const roleCheck = await requireRole(['SUPER_ADMIN', 'COUNTRY_ADMIN', 'CITY_ADMIN', 'EVENT_ADMIN'])(adminId);
    if (!roleCheck.success) {
      res.status(roleCheck.code).json({ success: false, error: roleCheck.error });
      return;
    }
    
    const ticketRef = db.collection('eventTickets').doc(ticketId);
    const ticketSnap = await ticketRef.get();
    
    if (!ticketSnap.exists) {
      res.status(404).json({ success: false, error: 'Ticket not found' });
      return;
    }
    
    const ticketData = ticketSnap.data();
    
    if (ticketData.status === 'CHECKED_IN') {
      res.status(400).json({ success: false, error: 'Ticket already checked in' });
      return;
    }
    
    if (ticketData.status === 'CANCELLED') {
      res.status(400).json({ success: false, error: 'Ticket is cancelled' });
      return;
    }
    
    // Update ticket
    await ticketRef.update({
      status: 'CHECKED_IN',
      checkedInAt: admin.firestore.FieldValue.serverTimestamp(),
      checkedInBy: adminId
    });
    
    // Create attendance record
    await db.collection('eventAttendance').add({
      eventId: ticketData.eventId,
      ticketId,
      businessId: ticketData.businessId,
      checkedIn: true,
      checkInTime: admin.firestore.FieldValue.serverTimestamp(),
      checkInMethod: checkInMethod || 'MANUAL',
      checkInAdminId: adminId,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`[Events] Checked in ticket ${ticketId} by admin ${adminId}`);
    
    res.status(200).json({ success: true, businessName: ticketData.businessName });
  } catch (error) {
    console.error('[Events] Error in checkInAttendee:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * BUSINESS ENDPOINT: Register for Event
 */
exports.registerForEvent = onRequest({
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
    const { businessId, eventId, useCredit, additionalAttendees } = req.body;
    
    if (!businessId || !eventId) {
      res.status(400).json({ success: false, error: 'businessId and eventId required' });
      return;
    }
    
    // Get event
    const eventSnap = await db.collection('events').doc(eventId).get();
    if (!eventSnap.exists) {
      res.status(404).json({ success: false, error: 'Event not found' });
      return;
    }
    
    const eventData = eventSnap.data();
    
    if (eventData.status !== 'PUBLISHED') {
      res.status(400).json({ success: false, error: 'Event is not open for registration' });
      return;
    }
    
    // Check capacity
    if (eventData.currentAttendees >= eventData.maxCapacity) {
      res.status(400).json({ success: false, error: 'Event is at full capacity' });
      return;
    }
    
    // Check if already registered
    const existingTicket = await db.collection('eventTickets')
      .where('eventId', '==', eventId)
      .where('businessId', '==', businessId)
      .where('status', 'in', ['RESERVED', 'CONFIRMED', 'CHECKED_IN'])
      .get();
    
    if (!existingTicket.empty) {
      res.status(400).json({ success: false, error: 'Already registered for this event' });
      return;
    }
    
    // Get business profile
    const businessSnap = await db.collection('users').doc(businessId).get();
    if (!businessSnap.exists) {
      res.status(404).json({ success: false, error: 'Business not found' });
      return;
    }
    
    const business = businessSnap.data();
    const businessLevel = business.businessLevel || 1;
    const subscriptionTier = business.subscriptionTier || 'FREE';
    
    // Check eligibility
    if (!eventData.allowedLevels.includes(businessLevel)) {
      res.status(403).json({ success: false, error: 'Your business level is not eligible for this event' });
      return;
    }
    
    if (subscriptionTier === 'STARTER' && businessLevel >= 2) {
      res.status(403).json({ success: false, error: 'Upgrade to SILVER or higher to attend events' });
      return;
    }
    
    // Try to use credit if requested
    let paymentType = 'PAY_PER_USE';
    let creditUsed = false;
    let creditType = null;
    let creditLedgerId = null;
    let remainingCredits = null;
    
    if (useCredit) {
      const creditCheck = await canUseCredit(businessId, eventId, eventData.isPremium);
      
      if (creditCheck.canUse) {
        paymentType = 'FREE_CREDIT';
        creditUsed = true;
        creditType = creditCheck.creditType;
        creditLedgerId = creditCheck.ledgerId;
        remainingCredits = creditCheck.remainingCredits;
      }
    }
    
    // Generate ticket number
    const ticketNumber = `EVT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    // Create ticket
    const ticketData = {
      eventId,
      businessId,
      businessName: business.name || 'Unknown',
      ticketNumber,
      status: creditUsed ? 'CONFIRMED' : 'RESERVED', // Confirmed if using credit, reserved if payment needed
      paymentType,
      amountPaid: creditUsed ? 0 : eventData.pricePerTicket,
      currency: eventData.currency,
      creditType,
      creditLedgerId,
      qrCode: ticketNumber, // Use ticket number as QR code
      registeredAt: admin.firestore.FieldValue.serverTimestamp(),
      additionalAttendees: additionalAttendees || 0
    };
    
    const ticketRef = await db.collection('eventTickets').add(ticketData);
    
    // If using credit, consume it
    if (creditUsed && creditLedgerId) {
      await consumeCredit(creditLedgerId, eventId, eventData.isPremium);
    }
    
    // Update event attendance count
    await db.collection('events').doc(eventId).update({
      currentAttendees: admin.firestore.FieldValue.increment(1)
    });
    
    // Send notification
    await db.collection('notifications').add({
      userId: businessId,
      type: 'EVENT',
      title: creditUsed ? '🎉 Event Registration Confirmed (Free Credit)' : '📅 Event Registration Pending Payment',
      message: `You've registered for "${eventData.title}" on ${new Date(eventData.startDateTime).toLocaleDateString()}. ${creditUsed ? 'Your free credit has been used.' : 'Complete payment to confirm your ticket.'}`,
      actionLink: '/events/my-tickets',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      isRead: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`[Events] Business ${businessId} registered for event ${eventId} (credit: ${creditUsed})`);
    
    res.status(200).json({ 
      success: true,
      ticket: { id: ticketRef.id, ...ticketData },
      paymentRequired: !creditUsed,
      paymentAmount: creditUsed ? 0 : eventData.pricePerTicket,
      creditUsed,
      creditType,
      remainingCredits
    });
  } catch (error) {
    console.error('[Events] Error in registerForEvent:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * BUSINESS ENDPOINT: Get Available Events
 */
exports.getAvailableEvents = onRequest({
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
    const businessId = req.query.businessId || req.body.businessId;
    const cityId = req.query.cityId;
    const eventType = req.query.eventType;
    
    if (!businessId) {
      res.status(400).json({ success: false, error: 'businessId required' });
      return;
    }
    
    // Get business profile
    const businessSnap = await db.collection('users').doc(businessId).get();
    if (!businessSnap.exists) {
      res.status(404).json({ success: false, error: 'Business not found' });
      return;
    }
    
    const business = businessSnap.data();
    const businessLevel = business.businessLevel || 1;
    const subscriptionTier = business.subscriptionTier || 'FREE';
    
    // Build query
    let query = db.collection('events')
      .where('status', '==', 'PUBLISHED');
    
    if (cityId) {
      query = query.where('cityId', '==', cityId);
    }
    
    if (eventType) {
      query = query.where('eventType', '==', eventType);
    }
    
    const snapshot = await query
      .where('startDateTime', '>=', new Date().toISOString())
      .orderBy('startDateTime', 'asc')
      .get();
    
    // Filter by eligibility
    const events = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(event => {
        // Check level eligibility
        if (!event.allowedLevels.includes(businessLevel)) {
          return false;
        }
        
        // Check tier eligibility for Level 2+
        if (businessLevel >= 2 && subscriptionTier === 'STARTER') {
          return false;
        }
        
        return true;
      });
    
    console.log(`[Events] Retrieved ${events.length} available events for business ${businessId}`);
    
    res.status(200).json({ success: true, events });
  } catch (error) {
    console.error('[Events] Error in getAvailableEvents:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * BUSINESS ENDPOINT: Get My Tickets
 */
exports.getMyTickets = onRequest({
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
    const businessId = req.query.businessId || req.body.businessId;
    
    if (!businessId) {
      res.status(400).json({ success: false, error: 'businessId required' });
      return;
    }
    
    const ticketsSnap = await db.collection('eventTickets')
      .where('businessId', '==', businessId)
      .orderBy('registeredAt', 'desc')
      .get();
    
    const tickets = [];
    
    for (const doc of ticketsSnap.docs) {
      const ticketData = doc.data();
      
      // Get event details
      const eventSnap = await db.collection('events').doc(ticketData.eventId).get();
      const eventData = eventSnap.exists ? eventSnap.data() : {};
      
      tickets.push({
        id: doc.id,
        ...ticketData,
        event: {
          id: ticketData.eventId,
          title: eventData.title,
          startDateTime: eventData.startDateTime,
          endDateTime: eventData.endDateTime,
          venue: eventData.venue,
          address: eventData.address
        }
      });
    }
    
    console.log(`[Events] Retrieved ${tickets.length} tickets for business ${businessId}`);
    
    res.status(200).json({ success: true, tickets });
  } catch (error) {
    console.error('[Events] Error in getMyTickets:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * BUSINESS ENDPOINT: Get My Entitlements
 */
exports.getMyEntitlements = onRequest({
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
    const businessId = req.query.businessId || req.body.businessId;
    
    if (!businessId) {
      res.status(400).json({ success: false, error: 'businessId required' });
      return;
    }
    
    const entitlementResult = await getEntitlementStatus(businessId);
    
    if (!entitlementResult.success) {
      res.status(500).json({ success: false, error: entitlementResult.error });
      return;
    }
    
    res.status(200).json({ 
      success: true, 
      entitlement: entitlementResult.entitlement 
    });
  } catch (error) {
    console.error('[Events] Error in getMyEntitlements:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * BUSINESS ENDPOINT: Cancel Registration
 */
exports.cancelEventRegistration = onRequest({
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
    const { businessId, ticketId, reason } = req.body;
    
    if (!businessId || !ticketId) {
      res.status(400).json({ success: false, error: 'businessId and ticketId required' });
      return;
    }
    
    const ticketRef = db.collection('eventTickets').doc(ticketId);
    const ticketSnap = await ticketRef.get();
    
    if (!ticketSnap.exists) {
      res.status(404).json({ success: false, error: 'Ticket not found' });
      return;
    }
    
    const ticketData = ticketSnap.data();
    
    if (ticketData.businessId !== businessId) {
      res.status(403).json({ success: false, error: 'Ticket does not belong to this business' });
      return;
    }
    
    if (ticketData.status === 'CANCELLED') {
      res.status(400).json({ success: false, error: 'Ticket already cancelled' });
      return;
    }
    
    if (ticketData.status === 'CHECKED_IN') {
      res.status(400).json({ success: false, error: 'Cannot cancel checked-in ticket' });
      return;
    }
    
    // Update ticket
    await ticketRef.update({
      status: 'CANCELLED',
      cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
      cancelledReason: reason || 'User requested'
    });
    
    // Decrease event attendance
    await db.collection('events').doc(ticketData.eventId).update({
      currentAttendees: admin.firestore.FieldValue.increment(-1)
    });
    
    // If credit was used, restore it
    if (ticketData.paymentType === 'FREE_CREDIT' && ticketData.creditLedgerId) {
      const ledgerRef = db.collection('entitlementLedgers').doc(ticketData.creditLedgerId);
      const eventSnap = await db.collection('events').doc(ticketData.eventId).get();
      const eventData = eventSnap.data();
      
      if (eventData.isPremium) {
        await ledgerRef.update({
          premiumEventsUsed: admin.firestore.FieldValue.increment(-1),
          premiumEventsConsumed: admin.firestore.FieldValue.arrayRemove(ticketData.eventId)
        });
      } else {
        await ledgerRef.update({
          standardEventsUsed: admin.firestore.FieldValue.increment(-1),
          standardEventsConsumed: admin.firestore.FieldValue.arrayRemove(ticketData.eventId)
        });
      }
      
      console.log(`[Events] Restored credit for business ${businessId}`);
    }
    
    // Send notification
    const eventSnap = await db.collection('events').doc(ticketData.eventId).get();
    const eventData = eventSnap.exists ? eventSnap.data() : {};
    
    await db.collection('notifications').add({
      userId: businessId,
      type: 'EVENT',
      title: 'Event Registration Cancelled',
      message: `Your registration for "${eventData.title}" has been cancelled. ${ticketData.paymentType === 'FREE_CREDIT' ? 'Your free credit has been restored.' : ''}`,
      actionLink: '/events',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      isRead: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`[Events] Cancelled ticket ${ticketId} for business ${businessId}`);
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('[Events] Error in cancelEventRegistration:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
