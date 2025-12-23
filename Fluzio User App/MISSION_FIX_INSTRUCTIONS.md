# Mission Visibility Fix - Manual Steps

## Problem
Missions created by businesses (like "flor de oro") are not visible to customer accounts because the `isCreatorOnly` field is missing.

## Solution Applied
✅ **Code Fixed:** New missions will automatically have `isCreatorOnly: false` set during creation.

## Fixing Existing Missions

### Option 1: Using Firebase Console (RECOMMENDED - Easy)

1. **Go to Firebase Console:**
   - Visit: https://console.firebase.google.com/project/fluzio-13af2/firestore
   - Navigate to Firestore Database

2. **Open the `missions` collection**

3. **For each mission document:**
   - Click on the mission document
   - Click "Add field" button
   - Field name: `isCreatorOnly`
   - Type: `boolean`
   - Value: `false`
   - Click "Add"

4. **Repeat for all missions** (found 12 missions total)

**Missions that need fixing:**
- "Facebook Check-in" by Flor de Oro (ID: CiwTleKrdazD0jUHnjAw)
- All other business-created missions without `isCreatorOnly` field

---

### Option 2: Using Script (Requires Admin Auth)

The `fixMissionCreatorOnly.js` script is ready but requires authentication. To use it:

1. **Get Firebase Admin credentials:**
   - Go to Firebase Console → Project Settings → Service Accounts
   - Generate new private key
   - Save as `serviceAccountKey.json` in project root

2. **Update the script** to use Admin SDK:
   ```javascript
   import admin from 'firebase-admin';
   import serviceAccount from './serviceAccountKey.json';
   
   admin.initializeApp({
     credential: admin.credential.cert(serviceAccount)
   });
   
   const db = admin.firestore();
   ```

3. **Run the script:**
   ```bash
   node fixMissionCreatorOnly.js
   ```

---

### Option 3: Manual Query in Firebase Console

1. Go to Firebase Console → Firestore
2. Filter missions without `isCreatorOnly` field
3. Use the Console UI to bulk edit

---

## Verification

After fixing missions:

1. **Log in as customer account**
2. **Navigate to Missions section**
3. **Check console logs:**
   ```
   [MissionService] Mission mapped: {...}
   ```
4. **Verify "flor de oro" missions appear** in the list

---

## Prevention (Already Done ✅)

The code fix ensures all NEW missions created will have `isCreatorOnly: false` automatically set.

**File Modified:** `components/MissionCreationModal.tsx` (Line 295)
```typescript
isCreatorOnly: false // Missions created by businesses are visible to all customers
```

This fix is already deployed to production.
