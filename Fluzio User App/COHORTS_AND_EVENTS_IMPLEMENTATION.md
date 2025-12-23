# Cohorts + Events Implementation - Complete Architecture

## ✅ **COMPLETED: Cohorts Module**

### Data Models Created
✅ **File**: `src/types/cohorts.ts`
- CityCohort interface
- CohortMembership interface
- CohortStats interface
- CreateCohortRequest, UpdateCohortRequest interfaces

### Backend Service Created
✅ **File**: `functions/cohortService.js`

**Endpoints Implemented:**
1. `createCityCohort` - SUPER_ADMIN, COUNTRY_ADMIN can create cohorts
2. `getCityCohorts` - Get all cohorts (scope-filtered by admin role)
3. `updateCityCohort` - Update cohort settings
4. `activateCohort` - Change status from PENDING → OPEN
5. `getCohortStats` - Get usage stats (slots, members, etc.)

**Core Function:**
- `consumeCohortSlot()` - Automatically called during business approval
  - Checks if city has active cohort
  - Consumes slot if available
  - Adds founding partner badge
  - Locks pricing for X months
  - Auto-closes cohort when full

### Integration Complete
✅ **Modified**: `functions/index.js` → `approveBusinessLevelUpgrade`
- Now calls `consumeCohortSlot()` after approving Level 2+ upgrade
- Adds founding partner fields to business profile
- Enhanced notification with cohort info

**How It Works:**
1. Admin creates cohort for city (e.g., Munich: 100 slots, Berlin: 40 slots)
2. Admin activates cohort (status → OPEN)
3. When business is approved to Level 2+:
   - System checks for active cohort in their city
   - If found and slots available:
     - Business gets slot number (e.g., #23/100)
     - `foundingPartner: true` added to profile
     - `foundingBadgeLabel: "Founding Partner"` added
     - `pricingLockedUntil: [date]` calculated
     - Notification sent with badge info
   - If cohort reaches maxSlots:
     - Status automatically changes to CLOSED
4. CITY_ADMIN can view their city's cohort
5. COUNTRY_ADMIN can view all cohorts in their country
6. SUPER_ADMIN can view/manage all cohorts

---

## ✅ **COMPLETED: Events Module - Data Models**

### Data Models Created
✅ **File**: `src/types/events.ts`

**Interfaces:**
- Event - Main event entity
- EventTicket - Registration/ticket tracking
- EventAttendance - Check-in tracking
- EntitlementLedger - Credit tracking
- EventRegistrationRequest/Response
- EventEntitlement - Current credit status
- CreateEventRequest, UpdateEventRequest
- EventStats - Analytics

**Enums:**
- EventStatus: DRAFT, PUBLISHED, OPEN, CLOSED, CANCELLED, COMPLETED
- EventType: NETWORKING, WORKSHOP, CONFERENCE, SOCIAL, TRAINING, OTHER
- EventScope: GLOBAL, COUNTRY, CITY, CUSTOM
- TicketStatus: RESERVED, CONFIRMED, CHECKED_IN, NO_SHOW, CANCELLED, REFUNDED
- PaymentType: FREE_CREDIT, PAY_PER_USE, COMPLIMENTARY, ADMIN_GRANTED

### Entitlement Service Created
✅ **File**: `functions/entitlementService.js`

**Core Functions:**
1. `getEntitlementRules(level, tier)` - Returns credit allocation rules
2. `getOrCreateEntitlementLedger(businessId, level, tier)` - Gets or creates current period ledger
3. `canUseCredit(businessId, eventId, isPremium)` - Checks if credit available
4. `consumeCredit(ledgerId, eventId, isPremium)` - Uses a credit
5. `getEntitlementStatus(businessId)` - Returns current credit status

**Entitlement Rules Implemented:**

| Level | Tier | Standard Events | Premium Events | Period | Payment |
|-------|------|----------------|---------------|--------|---------|
| 1 | Any | 0 | 0 | N/A | Pay-per-use |
| 2 | FREE | 0 (no access) | 0 | N/A | N/A |
| 2 | SILVER | 0 | 0 | N/A | Pay-per-use |
| 2 | GOLD | 1 free | 0 | Quarterly | Pay after credit used |
| 2 | PLATINUM | 1 free | 1 free premium | Monthly (standard) / Quarterly (premium) | Pay after credits used |

---

## 📋 **REMAINING: Events Backend Endpoints**

### Endpoints to Create (in `functions/eventsService.js`)

#### Admin Endpoints
1. **createEvent** - Create new event
   - Scope: COUNTRY_ADMIN (country events), CITY_ADMIN (city events), EVENT_ADMIN (assigned events)
   - Fields: title, description, type, isPremium, scope, capacity, price, dates, eligibility
   
2. **updateEvent** - Update event details
   - Same scope as create
   
3. **publishEvent** - Change status DRAFT → PUBLISHED
   - Makes event visible to businesses
   
4. **cancelEvent** - Cancel event
   - Refunds all tickets automatically
   
5. **getEvents** - List events (scope-filtered)
   - SUPER_ADMIN: All events
   - COUNTRY_ADMIN: Country events
   - CITY_ADMIN: City events
   - EVENT_ADMIN: Assigned events
   
6. **getEventStats** - Get event analytics
   - Attendance, revenue, no-shows, tier breakdown
   
7. **checkInAttendee** - Mark ticket as checked in
   - Scan QR or manual check-in
   - Creates EventAttendance record
   
8. **getEventAttendees** - List all attendees for an event

#### Business Endpoints
1. **registerForEvent** - Register for an event
   - Logic:
     a. Check eligibility (level, tier)
     b. Check capacity
     c. Try to use free credit via `canUseCredit()`
     d. If no credit, initiate payment
     e. Create EventTicket with status RESERVED
     f. If payment successful or credit used: status → CONFIRMED
     g. If credit used: call `consumeCredit()`
     h. Generate QR code for check-in
   
2. **cancelRegistration** - Cancel ticket
   - If paid: initiate refund
   - If credit used: return credit to ledger
   
3. **getMyTickets** - List business's tickets
   - Filter by upcoming, past, cancelled
   
4. **getAvailableEvents** - List events business can attend
   - Filter by level and tier eligibility
   - Show price or "Use Free Credit" option
   
5. **getMyEntitlements** - Get current credit status
   - Calls `getEntitlementStatus()`

#### Payment Integration
1. **createEventPaymentIntent** - Stripe payment for pay-per-use
2. **confirmEventPayment** - Confirm payment and issue ticket
3. **refundEventTicket** - Process refund for cancelled ticket

---

## 📋 **REMAINING: Admin UI Components**

### Cohort Management UI (to create)
**File**: `components/admin/AdminCohortManagement.tsx`

**Features:**
- List all cohorts (scope-filtered)
- Create new cohort modal
  - City selector
  - Max slots input (default: Munich=100, others=40)
  - Founding badge label input
  - Pricing lock months input
  - Start/end dates
- View cohort details
  - Progress bar (usedSlots / maxSlots)
  - Member list with slot numbers
  - "Activate Cohort" button (PENDING → OPEN)
  - "Close Cohort" button (manual close)
- Edit cohort settings
- Stats dashboard
  - Cohorts by status
  - Total slots vs used
  - Cities covered

### Event Management UI (to create)
**File**: `components/admin/AdminEventManagement.tsx`

**Features:**
- Event list (scope-filtered)
  - Filter by status, type, scope
  - Search by title
- Create event modal
  - Basic info (title, description, type)
  - Premium checkbox
  - Scope selector (based on admin role)
  - Venue/address
  - Capacity
  - Price per ticket
  - Date/time pickers
  - Eligibility (levels, tiers)
  - Image upload
- Edit event
- Publish event (DRAFT → PUBLISHED)
- View event details
  - Attendee list
  - Check-in scanner
  - Stats (confirmed, checked-in, no-shows)
  - Revenue tracking
- Check-in interface
  - QR scanner
  - Manual search
  - Bulk check-in

---

## 📋 **REMAINING: Customer UI Components**

### Event Browse & Register (to create)
**File**: `components/events/EventBrowser.tsx`

**Features:**
- Grid/list view of available events
- Filter by type, date, location
- Event cards showing:
  - Title, image, date/time
  - Venue/address
  - Price or "Free with credit"
  - Capacity remaining
  - Premium badge if applicable
- Event detail modal
  - Full description
  - Map with venue location
  - Organizer info
  - Registration button
    - "Use Free Credit" (if available)
    - "Pay $X" (if no credit or credit exhausted)
    - "Upgrade to attend" (if not eligible)

### My Events (to create)
**File**: `components/events/MyEvents.tsx`

**Features:**
- Tabs: Upcoming, Past, Cancelled
- Ticket cards showing:
  - Event title, date/time
  - Ticket number
  - QR code
  - Check-in status
  - Payment type (free credit vs paid)
  - Cancel button (for upcoming)
- Event credits widget
  - Shows current period
  - Credits remaining
  - Next reset date
  - Usage history

### Event Registration Flow (to create)
**File**: `components/events/EventRegistrationModal.tsx`

**Features:**
- Step 1: Confirm details
  - Event info summary
  - Number of additional attendees
- Step 2: Payment method
  - "Use Free Credit" (if available)
  - "Pay $X via Stripe"
- Step 3: Confirmation
  - Ticket number
  - QR code display
  - Add to calendar button
  - Email confirmation

---

## 🗄️ **Database Collections**

### Firestore Structure

```
cityCohorts/
  {cohortId}/
    - cityId, cityName, countryId
    - cohortName, maxSlots, usedSlots
    - status, startAt, endAt
    - foundingBadgeLabel, pricingLockMonths
    - createdAt, createdBy

cohortMemberships/
  {membershipId}/
    - cohortId, businessId, businessName
    - joinedAt, slotNumber
    - foundingBadgeActive, pricingLockedUntil
    - status (ACTIVE/REVOKED/EXPIRED)

events/
  {eventId}/
    - title, description, eventType, isPremium
    - scope, countryId, cityId
    - venue, address, coordinates
    - maxCapacity, currentAttendees
    - pricePerTicket, currency
    - startDateTime, endDateTime
    - status, allowedLevels, allowedTiers
    - organizerId, organizerName

eventTickets/
  {ticketId}/
    - eventId, businessId, businessName
    - ticketNumber, status
    - paymentType, amountPaid
    - creditType, creditLedgerId
    - checkedInAt, qrCode
    - registeredAt

eventAttendance/
  {attendanceId}/
    - eventId, ticketId, businessId
    - checkedIn, checkInTime, checkInMethod
    - rating, feedback

entitlementLedgers/
  {ledgerId}/
    - businessId, businessLevel, subscriptionTier
    - periodType, periodStart, periodEnd
    - standardEventsAllowed, standardEventsUsed
    - premiumEventsAllowed, premiumEventsUsed
    - isActive
    - standardEventsConsumed[], premiumEventsConsumed[]
```

---

## 🔄 **User Flows**

### Flow 1: Admin Creates Cohort
1. Admin logs in (SUPER_ADMIN or COUNTRY_ADMIN)
2. Goes to Admin Dashboard → Cohorts tab
3. Clicks "Create Cohort"
4. Selects city (Munich, Berlin, etc.)
5. Sets max slots (Munich: 100, others: 40)
6. Sets founding badge label ("Founding Partner")
7. Sets pricing lock (12 months)
8. Clicks "Create" (status: PENDING)
9. Reviews cohort details
10. Clicks "Activate Cohort" (status: OPEN)
11. Cohort is now accepting businesses

### Flow 2: Business Gets Founding Partner Badge
1. Business applies for Level 2 upgrade
2. Admin approves upgrade
3. Backend calls `consumeCohortSlot()`
4. If city has active cohort with slots:
   - Slot consumed (#23/100)
   - Business gets `foundingPartner: true`
   - `foundingBadgeLabel: "Founding Partner"`
   - `pricingLockedUntil: "2026-12-18"`
   - Notification sent
5. Business sees badge in profile
6. Pricing locked for 12 months
7. If cohort reaches max (100/100):
   - Status auto-changes to CLOSED
   - No more businesses can join

### Flow 3: Admin Creates Event
1. Admin logs in (COUNTRY_ADMIN, CITY_ADMIN, or EVENT_ADMIN)
2. Goes to Admin Dashboard → Events tab
3. Clicks "Create Event"
4. Fills in details:
   - Title: "Berlin Networking Night"
   - Type: NETWORKING
   - Premium: No
   - Scope: CITY (Berlin)
   - Capacity: 50
   - Price: €20
   - Date: 2026-01-15
   - Allowed: Level 1, Level 2 (all tiers except FREE)
5. Clicks "Save Draft"
6. Reviews event
7. Clicks "Publish"
8. Event is now visible to businesses

### Flow 4: Business Registers with Free Credit (PLATINUM)
1. Business (Level 2, PLATINUM tier) browses events
2. Sees "Berlin Networking Night"
3. Clicks to view details
4. Sees "Use Free Credit (1 remaining this month)"
5. Clicks "Register"
6. System checks:
   - Level 2 PLATINUM: 1 free per month
   - Current month: Dec 2025
   - Credits used: 0/1
   - ✅ Can use credit
7. System creates:
   - EntitlementLedger entry (if first event this month)
   - EventTicket with paymentType: FREE_CREDIT
   - Updates ledger: standardEventsUsed: 0 → 1
   - Generates QR code
8. Business receives confirmation with QR code
9. Credits widget shows: 0 remaining until Jan 1

### Flow 5: Business Registers with Payment (SILVER)
1. Business (Level 2, SILVER tier) browses events
2. Sees "Berlin Networking Night"
3. Clicks to view details
4. Sees "Pay €20" (no free credits for SILVER)
5. Clicks "Register"
6. System shows Stripe payment form
7. Business enters card details
8. Payment processed
9. System creates:
   - EventTicket with paymentType: PAY_PER_USE
   - Payment recorded
   - QR code generated
10. Business receives confirmation

### Flow 6: Business Attends Event
1. Business arrives at event
2. Admin scans QR code from ticket
3. System checks ticket status
4. If valid:
   - Creates EventAttendance record
   - Updates ticket: status → CHECKED_IN
   - Shows success message
5. After event:
   - Business can rate and leave feedback

---

## 🎯 **Implementation Priorities**

### Priority 1: Complete Events Backend (1-2 days)
- [ ] Create `functions/eventsService.js` with all endpoints
- [ ] Integrate with entitlementService
- [ ] Add Stripe payment endpoints
- [ ] Test entitlement logic with all tier combinations

### Priority 2: Admin UI for Cohorts (1 day)
- [ ] Create AdminCohortManagement component
- [ ] Test create, activate, view stats flows

### Priority 3: Admin UI for Events (2 days)
- [ ] Create AdminEventManagement component
- [ ] Implement check-in scanner
- [ ] Test event creation and publishing

### Priority 4: Customer Event UI (2 days)
- [ ] Create EventBrowser component
- [ ] Create EventRegistrationModal
- [ ] Create MyEvents component
- [ ] Test registration with credits and payment

### Priority 5: Testing & Deployment (1 day)
- [ ] Test all tier combinations
- [ ] Test cohort slot consumption
- [ ] Test credit rollover (monthly/quarterly)
- [ ] Deploy to production

---

## 🔐 **Security & Permissions**

### Cohorts
- **Create/Update**: SUPER_ADMIN, COUNTRY_ADMIN (scope-checked)
- **View**: SUPER_ADMIN (all), COUNTRY_ADMIN (country), CITY_ADMIN (city only)
- **Slot Consumption**: Automatic (system-triggered)

### Events
- **Create**: COUNTRY_ADMIN (country events), CITY_ADMIN (city events), EVENT_ADMIN (assigned events)
- **Update/Publish**: Same as create (must own event or be in scope)
- **Check-in**: EVENT_ADMIN (assigned events), admin who created event
- **View**: SUPER_ADMIN (all), others scope-filtered
- **Register**: Businesses with eligible level + tier

### Entitlements
- **View Own**: Any business can see their credits
- **Admin View**: Admins can see any business's credits
- **Modify**: System only (automatic credit consumption/reset)

---

## 📊 **Analytics & Reporting**

### Cohort Metrics (to implement)
- Total cohorts created
- Cohorts by status (OPEN/CLOSED/ARCHIVED)
- Average fill rate
- Fastest-filling cohorts
- Founding partners by city
- Pricing lock expiration timeline

### Event Metrics (to implement)
- Total events created
- Events by type, status
- Average attendance rate
- No-show percentage
- Revenue by event
- Credit usage vs pay-per-use ratio
- Most popular event types by tier

---

## ✅ **Current Status Summary**

**Completed:**
1. ✅ Cohorts data models
2. ✅ Cohorts backend service (5 endpoints)
3. ✅ Cohort integration with business approval
4. ✅ Events data models
5. ✅ Entitlement service (credit tracking logic)

**Next Steps:**
1. Create Events backend endpoints (10-12 endpoints)
2. Create Cohort Management UI
3. Create Event Management UI
4. Create Customer Event UI
5. Test and deploy

**Time Estimate**: 6-8 days for complete implementation

---

## 🚀 **Quick Start Guide (for next dev session)**

### To Complete Events Module:
1. Create `functions/eventsService.js` with endpoints
2. Update `functions/index.js` to export events endpoints
3. Create admin UI components
4. Create customer UI components
5. Deploy and test

### To Test Cohorts:
1. Login as SUPER_ADMIN
2. Create cohort for test city
3. Activate cohort
4. Approve a business to Level 2
5. Verify business got founding badge
6. Check cohort stats

### Sample Cities for Cohorts:
- Munich: 100 slots
- Berlin: 40 slots
- Hamburg: 40 slots
- Frankfurt: 40 slots
- Cologne: 40 slots
