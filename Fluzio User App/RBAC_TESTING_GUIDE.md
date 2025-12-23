# RBAC System Testing Guide

## 🧪 Overview

This guide provides comprehensive testing scenarios for the Fluzio RBAC system. Follow these tests sequentially to verify all roles, permissions, and scoping functionality.

---

## 🎯 Test Environment Setup

### Prerequisites

- [x] Super Admin account created: `CJDGOcJEBJPDgMVyupbqFHYJxRi2`
- [ ] Test users created for each role
- [ ] Test businesses in different countries/cities
- [ ] Test events created
- [ ] Firebase console access
- [ ] Browser developer tools enabled

### Test Data Setup

#### 1. Create Test Admin Users

Log in as Super Admin and create the following test admins:

```javascript
// Test Admin 1: Country Admin (US)
{
  userId: "test_country_admin_us",
  email: "country.admin.us@test.fluzio.com",
  role: "COUNTRY_ADMIN",
  countryId: "US",
  isActive: true,
  notes: "Test account - US Country Admin"
}

// Test Admin 2: City Admin (New York)
{
  userId: "test_city_admin_ny",
  email: "city.admin.ny@test.fluzio.com",
  role: "CITY_ADMIN",
  countryId: "US",
  cityId: "New York",
  isActive: true,
  notes: "Test account - New York City Admin"
}

// Test Admin 3: Event Admin
{
  userId: "test_event_admin",
  email: "event.admin@test.fluzio.com",
  role: "EVENT_ADMIN",
  assignedEventIds: ["event_test_1", "event_test_2"],
  isActive: true,
  notes: "Test account - Event Admin"
}

// Test Admin 4: Support Admin
{
  userId: "test_support_admin",
  email: "support.admin@test.fluzio.com",
  role: "SUPPORT_ADMIN",
  isActive: true,
  notes: "Test account - Support Admin"
}
```

#### 2. Create Test Business Data

Create businesses in different locations:

```javascript
// US Business (New York)
{
  businessName: "Test Business NY",
  country: "US",
  city: "New York",
  level: "2.1"
}

// US Business (Los Angeles)
{
  businessName: "Test Business LA",
  country: "US",
  city: "Los Angeles",
  level: "2.1"
}

// Canada Business (Toronto)
{
  businessName: "Test Business Toronto",
  country: "CA",
  city: "Toronto",
  level: "2.1"
}
```

#### 3. Create Test Events

```javascript
// Event 1 (assigned to Event Admin)
{
  id: "event_test_1",
  title: "Test Event 1",
  country: "US",
  city: "New York"
}

// Event 2 (assigned to Event Admin)
{
  id: "event_test_2",
  title: "Test Event 2",
  country: "US",
  city: "New York"
}

// Event 3 (NOT assigned to Event Admin)
{
  id: "event_test_3",
  title: "Test Event 3",
  country: "US",
  city: "Los Angeles"
}
```

---

## ✅ Test Cases

### Test Suite 1: Super Admin

#### Test 1.1: Dashboard Access
**Steps:**
1. Log in with Super Admin account
2. Navigate to `/admin`

**Expected Results:**
- ✅ All 9 tabs visible: Level Approvals, Users, Businesses, Missions, Events, Subscriptions, Analytics, Admin Users, Settings
- ✅ Role badge shows "SUPER ADMIN" in red
- ✅ Scope shows "Global Access"

**Status:** [ ] Pass [ ] Fail

---

#### Test 1.2: Admin User Management
**Steps:**
1. Click "Admin Users" tab
2. Verify table shows all admins
3. Click "Add Admin" button
4. Fill form and create test Country Admin
5. Edit the newly created admin
6. Toggle admin active status
7. View Activity Logs

**Expected Results:**
- ✅ All existing admins listed
- ✅ Create form opens correctly
- ✅ New admin created successfully
- ✅ Edit modal opens with populated data
- ✅ Changes save correctly
- ✅ Active status toggles immediately
- ✅ Activity logs show all actions

**Status:** [ ] Pass [ ] Fail

---

#### Test 1.3: Global Data Access
**Steps:**
1. Click "Businesses" tab
2. Verify all businesses visible (US, Canada, all cities)
3. Click "Users" tab
4. Verify all users visible
5. Click "Analytics" tab
6. Verify metrics include all data

**Expected Results:**
- ✅ See Test Business NY
- ✅ See Test Business LA
- ✅ See Test Business Toronto
- ✅ No geographic filtering applied
- ✅ Analytics include all countries/cities

**Status:** [ ] Pass [ ] Fail

---

#### Test 1.4: Backend Operations
**Steps:**
1. Open browser console (F12)
2. Approve a business verification
3. Check console for API response
4. Navigate to Firebase Console → Functions logs
5. Verify log entry created

**Expected Results:**
- ✅ API call succeeds (200 status)
- ✅ No permission errors
- ✅ Function log shows execution
- ✅ adminLogs collection has new entry

**Status:** [ ] Pass [ ] Fail

---

### Test Suite 2: Country Admin (US)

#### Test 2.1: Dashboard Access
**Steps:**
1. Log out Super Admin
2. Log in with Country Admin (US) account
3. Navigate to `/admin`

**Expected Results:**
- ✅ 7 tabs visible: Level Approvals, Users, Businesses, Missions, Events, Subscriptions, Analytics
- ❌ "Admin Users" tab NOT visible
- ❌ "Settings" tab NOT visible
- ✅ Role badge shows "COUNTRY ADMIN" in orange
- ✅ Scope shows "Country: US"

**Status:** [ ] Pass [ ] Fail

---

#### Test 2.2: Geographic Filtering - Businesses
**Steps:**
1. Click "Businesses" tab
2. Count visible businesses
3. Verify country of each business

**Expected Results:**
- ✅ See Test Business NY (US)
- ✅ See Test Business LA (US)
- ❌ DO NOT see Test Business Toronto (Canada)
- ✅ All visible businesses have country = "US"

**Status:** [ ] Pass [ ] Fail

---

#### Test 2.3: Geographic Filtering - Users
**Steps:**
1. Click "Users" tab
2. Verify only US users visible
3. Try to search for Canadian user

**Expected Results:**
- ✅ Only users with country = "US" visible
- ❌ Canadian users filtered out
- ❌ Search for Canadian user returns no results

**Status:** [ ] Pass [ ] Fail

---

#### Test 2.4: Action Permissions
**Steps:**
1. Approve a US business verification
2. Try to ban a US user
3. Try to manage events in US
4. Open browser console and check for errors

**Expected Results:**
- ✅ Can approve US business verification
- ✅ Can ban US users
- ✅ Can manage US events
- ✅ No permission errors in console

**Status:** [ ] Pass [ ] Fail

---

#### Test 2.5: Scope Enforcement (Backend)
**Steps:**
1. Open browser DevTools → Network tab
2. Attempt to approve Canadian business (use API directly)
3. Check API response

**Expected Results:**
- ❌ API returns 403 Forbidden
- ❌ Error message: "Geographic scope mismatch"
- ✅ Backend enforces scope restriction

**Status:** [ ] Pass [ ] Fail

---

### Test Suite 3: City Admin (New York)

#### Test 3.1: Dashboard Access
**Steps:**
1. Log out Country Admin
2. Log in with City Admin (New York) account
3. Navigate to `/admin`

**Expected Results:**
- ✅ 7 tabs visible (same as Country Admin)
- ✅ Role badge shows "CITY ADMIN" in yellow
- ✅ Scope shows "City: New York, US"

**Status:** [ ] Pass [ ] Fail

---

#### Test 3.2: Geographic Filtering - City Level
**Steps:**
1. Click "Businesses" tab
2. Count visible businesses
3. Verify city of each business

**Expected Results:**
- ✅ See Test Business NY (New York)
- ❌ DO NOT see Test Business LA (Los Angeles)
- ❌ DO NOT see Test Business Toronto (Canada)
- ✅ Only New York businesses visible

**Status:** [ ] Pass [ ] Fail

---

#### Test 3.3: Action Permissions - City Scope
**Steps:**
1. Try to approve New York business
2. Try to ban New York user
3. Try to manage New York event

**Expected Results:**
- ✅ Can approve New York business
- ✅ Can ban New York users
- ✅ Can manage New York events
- ✅ Actions succeed without errors

**Status:** [ ] Pass [ ] Fail

---

#### Test 3.4: Out-of-Scope Action Rejection
**Steps:**
1. Use browser DevTools to attempt LA business approval
2. Check API response

**Expected Results:**
- ❌ API returns 403 Forbidden
- ❌ Error message: "Geographic scope mismatch"
- ✅ Backend blocks out-of-scope action

**Status:** [ ] Pass [ ] Fail

---

### Test Suite 4: Event Admin

#### Test 4.1: Dashboard Access
**Steps:**
1. Log out City Admin
2. Log in with Event Admin account
3. Navigate to `/admin`

**Expected Results:**
- ✅ 1 tab visible: Events only
- ✅ Role badge shows "EVENT ADMIN" in green
- ✅ Scope shows "2 Assigned Events"

**Status:** [ ] Pass [ ] Fail

---

#### Test 4.2: Event Filtering
**Steps:**
1. Click "Events" tab
2. Count visible events
3. Verify event IDs

**Expected Results:**
- ✅ See Event 1 (event_test_1) - assigned
- ✅ See Event 2 (event_test_2) - assigned
- ❌ DO NOT see Event 3 (event_test_3) - not assigned
- ✅ Only assigned events visible

**Status:** [ ] Pass [ ] Fail

---

#### Test 4.3: Event Management
**Steps:**
1. Click Edit on Event 1
2. Modify event details
3. Save changes
4. Try to delete Event 1

**Expected Results:**
- ✅ Edit modal opens for Event 1
- ✅ Can modify event details
- ✅ Changes save successfully
- ❌ Delete button disabled or hidden
- ✅ EVENT_ADMIN can edit but not delete

**Status:** [ ] Pass [ ] Fail

---

#### Test 4.4: Restricted Access
**Steps:**
1. Try to navigate to `/admin#users`
2. Try to navigate to `/admin#businesses`
3. Check if tabs appear

**Expected Results:**
- ❌ Users tab not accessible
- ❌ Businesses tab not accessible
- ✅ Only Events tab available
- ✅ Other tabs filtered out

**Status:** [ ] Pass [ ] Fail

---

### Test Suite 5: Support Admin

#### Test 5.1: Dashboard Access
**Steps:**
1. Log out Event Admin
2. Log in with Support Admin account
3. Navigate to `/admin`

**Expected Results:**
- ✅ 2-3 tabs visible: Users, Businesses (read-only)
- ✅ Role badge shows "SUPPORT ADMIN" in blue
- ✅ Scope shows "Limited Support Access"

**Status:** [ ] Pass [ ] Fail

---

#### Test 5.2: Read-Only Access
**Steps:**
1. Click "Users" tab
2. Try to find Ban/Delete buttons
3. Click "Businesses" tab
4. Try to find Approve/Reject buttons

**Expected Results:**
- ✅ Can view user list
- ❌ No Ban button visible
- ❌ No Delete button visible
- ✅ Can view business list
- ❌ No Approve/Reject buttons visible
- ✅ All actions disabled

**Status:** [ ] Pass [ ] Fail

---

#### Test 5.3: Action Rejection
**Steps:**
1. Use browser DevTools to attempt user ban
2. Call API directly with Support Admin credentials
3. Check API response

**Expected Results:**
- ❌ API returns 403 Forbidden
- ❌ Error message: "Insufficient permissions"
- ✅ Backend blocks all write actions

**Status:** [ ] Pass [ ] Fail

---

### Test Suite 6: Audit Logging

#### Test 6.1: Action Logging
**Steps:**
1. Log in as Super Admin
2. Approve a business verification
3. Create a new admin user
4. Navigate to Admin Users → View Activity Logs
5. Check last 2 entries

**Expected Results:**
- ✅ Log entry 1: Action = "APPROVE_VERIFICATION"
- ✅ Log entry 2: Action = "CREATE_ADMIN"
- ✅ Both have correct adminEmail
- ✅ Both have correct adminRole
- ✅ Both have timestamp
- ✅ Correct target details

**Status:** [ ] Pass [ ] Fail

---

#### Test 6.2: Log Retention
**Steps:**
1. Perform 10+ admin actions
2. Check Activity Logs
3. Verify log count

**Expected Results:**
- ✅ All actions logged
- ✅ Logs retained indefinitely
- ✅ No log data loss

**Status:** [ ] Pass [ ] Fail

---

#### Test 6.3: Log Security
**Steps:**
1. Log in as Country Admin
2. Try to access Activity Logs
3. Try to navigate to `/admin#admin-users`

**Expected Results:**
- ❌ Activity Logs button not visible
- ❌ Cannot access Admin Users tab
- ✅ Only Super Admin can view logs

**Status:** [ ] Pass [ ] Fail

---

### Test Suite 7: Backend API Protection

#### Test 7.1: Role Verification
**Steps:**
1. Open Postman/curl
2. Call `triggerSquadGeneration` with no adminId
3. Call with invalid adminId
4. Call with Support Admin credentials
5. Call with Super Admin credentials

**Expected Results:**
- ❌ Test 1: 401 Unauthorized (no adminId)
- ❌ Test 2: 403 Forbidden (invalid admin)
- ❌ Test 3: 403 Forbidden (wrong role)
- ✅ Test 4: 200 Success (Super Admin)

**Status:** [ ] Pass [ ] Fail

---

#### Test 7.2: Scope Verification
**Steps:**
1. Call `setUserBusinessLevel` as Country Admin (US)
2. Target: US business (should succeed)
3. Target: Canadian business (should fail)

**Expected Results:**
- ✅ Test 1: 200 Success (in scope)
- ❌ Test 2: 403 Forbidden (out of scope)
- ✅ Backend enforces geographic scope

**Status:** [ ] Pass [ ] Fail

---

#### Test 7.3: Protected Endpoints
**Test all 11 protected endpoints:**

| Endpoint | Test Admin | Expected Result |
|----------|------------|-----------------|
| triggerSquadGeneration | Super Admin | ✅ 200 |
| triggerSquadGeneration | Country Admin | ❌ 403 |
| setUserBusinessLevel | Country Admin (US) | ✅ 200 (US business) |
| setUserBusinessLevel | Country Admin (US) | ❌ 403 (CA business) |
| approveLevelUpgrade | City Admin (NY) | ✅ 200 (NY business) |
| approveLevelUpgrade | City Admin (NY) | ❌ 403 (LA business) |
| rejectLevelUpgrade | Country Admin | ✅ 200 (in scope) |
| approveVerification | City Admin | ✅ 200 (in scope) |
| rejectVerification | Country Admin | ✅ 200 (in scope) |
| getPendingRequests | Country Admin | ✅ 200 (scoped data) |
| triggerSubscriptionReset | Super Admin | ✅ 200 |
| triggerSubscriptionReset | Country Admin | ❌ 403 |

**Status:** [ ] Pass [ ] Fail

---

### Test Suite 8: Firestore Rules

#### Test 8.1: Admin Users Collection
**Steps:**
1. Log in as Country Admin
2. Open browser console
3. Try to read `adminUsers` collection:
   ```javascript
   firebase.firestore().collection('adminUsers').get()
   ```
4. Try to write to `adminUsers`:
   ```javascript
   firebase.firestore().collection('adminUsers').doc('test').set({...})
   ```

**Expected Results:**
- ✅ Read succeeds (isAnyAdmin() allows read)
- ❌ Write fails (only isSuperAdmin() allows write)

**Status:** [ ] Pass [ ] Fail

---

#### Test 8.2: Admin Logs Collection
**Steps:**
1. Try to read `adminLogs` as any admin
2. Try to write to `adminLogs` from frontend

**Expected Results:**
- ✅ Read succeeds
- ❌ Write fails (backend-only writes)

**Status:** [ ] Pass [ ] Fail

---

#### Test 8.3: Platform Settings
**Steps:**
1. Try to write to `platformSettings` as Country Admin
2. Try to write as Super Admin

**Expected Results:**
- ❌ Country Admin write fails
- ✅ Super Admin write succeeds

**Status:** [ ] Pass [ ] Fail

---

### Test Suite 9: Edge Cases

#### Test 9.1: Inactive Admin
**Steps:**
1. Create admin user
2. Set `isActive: false`
3. Try to log in
4. Check dashboard access

**Expected Results:**
- ❌ Dashboard shows "Access Denied"
- ❌ Backend rejects API calls
- ✅ Inactive admins cannot perform actions

**Status:** [ ] Pass [ ] Fail

---

#### Test 9.2: Missing Scope Data
**Steps:**
1. Create City Admin without cityId
2. Log in and check scope display
3. Try to perform actions

**Expected Results:**
- ⚠️ Scope shows incomplete information
- ❌ Actions may fail scope validation
- ✅ System handles gracefully

**Status:** [ ] Pass [ ] Fail

---

#### Test 9.3: Role Change During Session
**Steps:**
1. Log in as Country Admin
2. Super Admin changes role to City Admin
3. Refresh page
4. Verify new role applied

**Expected Results:**
- ✅ New role badge displayed
- ✅ Tabs update to new permissions
- ✅ Scope reflects new role

**Status:** [ ] Pass [ ] Fail

---

#### Test 9.4: Self-Deletion Prevention
**Steps:**
1. Log in as Super Admin
2. Try to delete your own admin account
3. Check for error message

**Expected Results:**
- ❌ Delete button disabled for own account
- ⚠️ Warning message if attempted
- ✅ Cannot delete self

**Status:** [ ] Pass [ ] Fail

---

## 📊 Test Summary Template

```markdown
## Test Execution Summary

**Date:** _______________
**Tester:** _______________
**Environment:** Production / Staging

### Results

| Test Suite | Total Tests | Passed | Failed | Notes |
|------------|-------------|--------|--------|-------|
| 1. Super Admin | 4 | ___ | ___ | |
| 2. Country Admin | 5 | ___ | ___ | |
| 3. City Admin | 4 | ___ | ___ | |
| 4. Event Admin | 4 | ___ | ___ | |
| 5. Support Admin | 3 | ___ | ___ | |
| 6. Audit Logging | 3 | ___ | ___ | |
| 7. Backend API | 3 | ___ | ___ | |
| 8. Firestore Rules | 3 | ___ | ___ | |
| 9. Edge Cases | 4 | ___ | ___ | |
| **TOTAL** | **33** | ___ | ___ | |

### Pass Rate: ____%

### Critical Issues Found:
1. 
2. 
3. 

### Minor Issues Found:
1. 
2. 
3. 

### Recommendations:
1. 
2. 
3. 
```

---

## 🔧 Debugging Tips

### Common Issues

#### Issue 1: "Permission denied" errors
**Debug Steps:**
1. Check browser console for exact error
2. Verify admin account exists in `adminUsers` collection
3. Check `isActive: true`
4. Verify role matches required permission
5. Check geographic scope matches target resource

#### Issue 2: Data not filtering correctly
**Debug Steps:**
1. Log `adminPerms` object in component
2. Verify `countryId`/`cityId` populated correctly
3. Check `filterByScope` function call
4. Verify data has `country`/`city` fields
5. Check if data is undefined/null

#### Issue 3: Tabs not showing
**Debug Steps:**
1. Check role badge in header
2. Verify `canPerformAction` logic
3. Log `tabs` array after filtering
4. Check `requiredAction` field in tab config
5. Verify ROLE_PERMISSIONS constant

#### Issue 4: API calls failing
**Debug Steps:**
1. Open Network tab in DevTools
2. Check request payload has `adminId`
3. Verify response status code
4. Check function logs in Firebase Console
5. Look for authMiddleware errors

---

## 📝 Test Data Cleanup

After testing, clean up test data:

```javascript
// Delete test admin users
await firebase.firestore().collection('adminUsers')
  .where('email', '>=', 'test.')
  .get()
  .then(snapshot => {
    snapshot.forEach(doc => doc.ref.delete());
  });

// Delete test businesses
await firebase.firestore().collection('businesses')
  .where('businessName', '>=', 'Test Business')
  .get()
  .then(snapshot => {
    snapshot.forEach(doc => doc.ref.delete());
  });

// Delete test events
await firebase.firestore().collection('events')
  .where('id', 'in', ['event_test_1', 'event_test_2', 'event_test_3'])
  .get()
  .then(snapshot => {
    snapshot.forEach(doc => doc.ref.delete());
  });
```

---

*Last Updated: December 18, 2025*
*Fluzio RBAC Testing Guide v1.0*
