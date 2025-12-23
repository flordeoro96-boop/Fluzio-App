# Mission Visibility Debugging Guide

## Issue
Mission created in "Flor de Oro" business is not visible from customer account.

## Root Cause Analysis

The mission service has comprehensive debug logging built in. When you view missions as a customer, check the browser console for these debug logs:

### Debug Logs to Check

1. **Total missions in DB:**
   ```
   [MissionService] Total missions in DB: X
   ```

2. **Raw Firestore data for each mission:**
   ```
   [MissionService] Mission RAW Firestore data: {mission_id} {data}
   ```

3. **Mapped mission data:**
   ```
   [MissionService] Mission mapped: {
     id, businessName, businessLogo, title, 
     lifecycleStatus, isActive, category, reward
   }
   ```

4. **Active missions count:**
   ```
   [MissionService] Active missions count: X
   ```

## Common Issues & Solutions

### Issue 1: Mission has wrong lifecycleStatus
**Check:** Look for `lifecycleStatus` in the raw Firestore data
**Expected:** `lifecycleStatus: 'ACTIVE'`
**Fix:** Mission might be 'DRAFT', 'PAUSED', 'COMPLETED', 'EXPIRED', or 'CANCELLED'
- Use Admin Panel → Missions tab → Activate the mission

### Issue 2: Mission has isActive = false
**Check:** Look for `isActive` field
**Expected:** `isActive: true`
**Fix:** Mission was paused
- Use Admin Panel → Missions tab → Click the activate button

### Issue 3: Mission doesn't exist in Firestore
**Check:** Total missions count
**Fix:** Mission creation might have failed
- Check business account for error messages when creating
- Check Firebase Console → Firestore → missions collection

### Issue 4: City/Location mismatch
**Check:** Mission `location` or `city` field vs customer's `city`
**Note:** `getMissionsForUser()` filters by city match
**Fix:** Ensure mission and customer have same city

### Issue 5: Creator-only mission
**Check:** `isCreatorOnly` field
**If true:** Mission only visible to users with `creatorMode: true`
**Fix:** Either:
  - Enable creator mode on customer account
  - Set `isCreatorOnly: false` on mission

## How to Debug (Step by Step)

1. **Open browser console** (F12 → Console tab)

2. **Log in as customer** (the account where mission is not visible)

3. **Navigate to mission list**
   - Home screen
   - Explore tab
   - Missions section

4. **Look for debug logs** with prefix `[MissionService]`

5. **Find your mission** in the raw data
   - Search for "Flor de Oro" in console logs
   - Look for mission title

6. **Check these fields:**
   ```javascript
   {
     lifecycleStatus: 'ACTIVE',  // Must be ACTIVE
     isActive: true,              // Must be true
     city: 'Your City',           // Must match customer's city
     isCreatorOnly: false         // Should be false for regular customers
   }
   ```

7. **If mission not in list:**
   - Mission might not exist in Firestore
   - Check Firebase Console → Firestore Database → missions collection

## Quick Fixes via Admin Panel

1. **Access Admin Panel:**
   - Login as admin@fluzio.com
   - Click hamburger menu → "Admin Panel"

2. **Go to Missions tab**

3. **Find "Flor de Oro" mission:**
   - Use search bar
   - Look for business name

4. **Check Status Badge:**
   - Should be green "ACTIVE"
   - If yellow "PAUSED" → Click activate button
   - If red "EXPIRED" → Mission past deadline
   - If gray "CANCELLED" → Mission was cancelled

5. **View Mission Details:**
   - Click eye icon to see full details
   - Check participants, location, requirements

## Firestore Direct Check

1. Go to Firebase Console: https://console.firebase.google.com
2. Select project: fluzio-13af2
3. Firestore Database → missions collection
4. Find mission by searching business name or recent creation date
5. Check document fields:
   - `lifecycleStatus`: should be 'ACTIVE'
   - `isActive`: should be true
   - `businessId`: should match Flor de Oro's user ID
   - `businessName`: should be "Flor de Oro"

## Mission Service Code Reference

### Creation (sets defaults):
```typescript
lifecycleStatus: data.lifecycleStatus || 'ACTIVE',
isActive: data.isActive !== false,
status: 'ACTIVE'
```

### Filtering (what makes missions visible):
```typescript
const activeMissions = allMissions.filter(m => 
  (m.lifecycleStatus === 'ACTIVE' || m.status === 'ACTIVE') && 
  (m.isActive !== false)
);
```

### TEMPORARY: If no active missions found
The service currently returns ALL missions if no active ones found, so you should see everything in the list (for debugging purposes).

## Next Steps

Based on console logs, we can determine:
1. Is mission in database?
2. What's the lifecycleStatus?
3. What's the isActive value?
4. Does city match?
5. Is it creator-only?

**Please share the console logs when viewing as customer, and we can pinpoint the exact issue.**
