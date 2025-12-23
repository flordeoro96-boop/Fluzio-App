# Creator Accounts Implementation

## Overview
Implemented separate **Creator Accounts** alongside Business accounts in Fluzio. Account types are **role-locked** and cannot be switched after signup.

## Implementation Date
December 19, 2025

---

## Changes Summary

### 1. Account Type System

**New Enum: `AccountType`** (types.ts)
```typescript
export enum AccountType {
  BUSINESS = 'business',
  CREATOR = 'creator'
}
```

**Updated UserProfile Interface:**
- Added `accountType: 'business' | 'creator'` field (IMMUTABLE after signup)
- Removed `creatorMode: boolean` (deprecated)
- Updated all references from creatorMode to accountType

**Updated UserRole Enum:**
- Added `CREATOR` role option
- CREATOR and MEMBER both use customer-facing UI

---

### 2. Signup Flow Changes

**File: `components/SignUpScreen.tsx`**

**New Signup Options (4 cards):**
1. **I have a business** → `role: BUSINESS, accountType: 'business'`
2. **I want to start a business** → `role: BUSINESS, accountType: 'business', isAspiringBusiness: true`
3. **Customer** → `role: MEMBER, accountType: 'creator'`
4. **Creator** → `role: CREATOR, accountType: 'creator'`

**Key Changes:**
- `accountType` is set during role selection (Step 1)
- `accountType` saved to Firestore on user creation
- Cannot be changed after account creation

---

### 3. Bottom Navigation

**File: `App.tsx - BottomNav Component`**

**Business Accounts:**
- Home
- Missions (Level 2+)
- Rewards (Level 2+)
- Partners

**Creator Accounts:**
- Opportunities (Dashboard)
- Projects (Missions tab repurposed)
- Network (B2B tab repurposed)

**Implementation:**
- Added `accountType` prop to BottomNav
- Different tab configurations based on `accountType`
- Route guards prevent cross-account access

---

### 4. Route Guards

**File: `App.tsx - Main Content Rendering`**

**Business-Only Routes:**
- Customer CRM (`activeTab === CUSTOMERS`)
- Mission Creation/Management (`activeTab === MISSIONS`)
- Rewards Management (`activeTab === REWARDS`)
- Business Partners (`activeTab === B2B`)

**Creator Routes:**
- Creator Opportunities (Dashboard tab)
- Creator Projects (placeholder)
- Creator Network (placeholder)

**Implementation:**
```typescript
{activeTab === MainTab.MISSIONS && (
  user.accountType === 'business' ? (
    <MissionsView user={user} onNavigate={handleNavigate} />
  ) : (
    // Creator Projects View - placeholder
    <div className="p-6 text-center">
      <h2 className="text-2xl font-bold text-[#1E0E62] mb-4">My Projects</h2>
      <p className="text-gray-600">Creator project management coming soon</p>
    </div>
  )
)}
```

---

### 5. Firestore Security Rules

**File: `firestore.rules`**

**New Helper Functions:**
```javascript
function isBusinessAccount() {
  return isAuthenticated() && 
         exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.accountType == 'business';
}

function isCreatorAccount() {
  return isAuthenticated() && 
         exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.accountType == 'creator';
}
```

**Enforced Rules:**
1. **accountType is IMMUTABLE** - Cannot be changed after user creation
2. **Mission Creation** - Only business accounts can create missions
3. **Mission Updates** - Only business accounts can update/delete missions
4. **Meetup Creation** - Both business and creator accounts can create meetups

**Rules Implementation:**
```javascript
match /users/{userId} {
  allow update: if isAuthenticated() && 
                   // ... existing conditions ...
                   // Prevent accountType changes
                   (!request.resource.data.diff(resource.data).affectedKeys().hasAny(['accountType']) || 
                    !exists(/databases/$(database)/documents/users/$(userId)));
}

match /missions/{missionId} {
  // Only business accounts can create missions
  allow create: if isBusiness() && isBusinessAccount();
  
  // Mission owner or admin can update/delete (business accounts only)
  allow update, delete: if isAuthenticated() && 
                           (resource.data.businessId == request.auth.uid || isAdmin()) &&
                           isBusinessAccount();
}
```

---

### 6. UI Component Updates

**SidebarMenu (src/components/SidebarMenu.tsx):**
- ❌ Removed "Creator Mode" toggle button
- ❌ Removed creator mode badge on avatar
- ✅ Creator Zone section only visible to `accountType === 'creator'`
- ❌ Removed `onToggleCreatorMode` prop

**CustomerProfileModal (components/CustomerProfileModal.tsx):**
- Changed `isCreatorMode` to `isCreatorAccount`
- Creator badge and sections only shown for creator accounts
- Updated variable: `user.accountType === 'creator'`

**Mission Service (src/services/missionService.ts):**
- Updated `getCreatorMissionsForUser()` to check `accountType === 'creator'`
- Removed `user.creatorMode` checks

---

### 7. Removed Code

**Deprecated Features:**
- ❌ Creator Mode toggle functionality
- ❌ `isTogglingCreatorMode` state variable
- ❌ `onToggleCreatorMode` handlers
- ❌ All `user.creatorMode` references
- ❌ `creatorMode` field usage in favor of `accountType`

**Files Updated:**
- App.tsx
- types.ts
- src/types/models.ts
- components/SignUpScreen.tsx
- components/CustomerProfileModal.tsx
- src/components/SidebarMenu.tsx
- src/services/missionService.ts
- services/mockStore.ts
- firestore.rules

---

## Migration Notes

### For Existing Users

**Database Migration Required:**
Existing users need `accountType` field populated:

```javascript
// Migration script (run via Firebase Functions or console)
const users = await db.collection('users').get();
users.forEach(async (doc) => {
  const data = doc.data();
  const accountType = data.role === 'BUSINESS' ? 'business' : 'creator';
  
  await doc.ref.update({
    accountType: accountType,
    // Optionally remove deprecated field
    // creatorMode: FieldValue.delete()
  });
});
```

### Backward Compatibility

The system handles missing `accountType` gracefully:
- Defaults to `'business'` for BUSINESS role
- Defaults to `'creator'` for CREATOR/MEMBER role
- `mockStore.createUserFromFirebase()` applies defaults

---

## Testing Checklist

### Signup Flow
- [ ] Sign up as "I have a business" → accountType = business
- [ ] Sign up as "I want to start a business" → accountType = business
- [ ] Sign up as "Customer" → accountType = creator
- [ ] Sign up as "Creator" → accountType = creator
- [ ] Verify accountType saved to Firestore
- [ ] Verify accountType cannot be changed via profile edit

### Navigation
- [ ] Business account sees: Home / Missions / Rewards / Partners
- [ ] Creator account sees: Opportunities / Projects / Network
- [ ] Level 1 businesses only see: Home / Partners
- [ ] Level 2+ businesses see all 4 tabs

### Route Guards
- [ ] Business can access mission creation
- [ ] Creator cannot access mission creation (route blocked)
- [ ] Business can access CRM
- [ ] Creator cannot access CRM (route blocked)
- [ ] Creator sees placeholder for Projects
- [ ] Creator sees placeholder for Network

### Firestore Rules
- [ ] Business can create missions
- [ ] Creator cannot create missions (permission denied)
- [ ] Business can update own missions
- [ ] Creator cannot update missions (permission denied)
- [ ] accountType field cannot be updated after creation
- [ ] Both accounts can create meetups

### UI Components
- [ ] SidebarMenu has no Creator Mode toggle
- [ ] Creator Zone section only visible to creators
- [ ] Business Tools section only visible to businesses
- [ ] Customer profile shows creator badge for creators only
- [ ] Creator sections (skills, portfolio) only for creators

---

## Architecture Decisions

### Why Separate Account Types?

1. **Clear User Intent:** Users choose their path at signup
2. **Feature Segregation:** Different feature sets without mode confusion
3. **Business Logic Simplification:** No toggle state management
4. **Security:** Firestore rules enforce account-based permissions
5. **UX Clarity:** Users always know what features they have access to

### Why IMMUTABLE?

1. **Data Integrity:** Prevents accidental role switching
2. **Business Logic Consistency:** No mid-session state changes
3. **Security:** Prevents privilege escalation attempts
4. **Analytics:** Clean user journey tracking
5. **Database Design:** Simpler indexing and queries

---

## Future Enhancements

### Creator Features (Placeholders Implemented)
1. **Creator Opportunities** - Brand collaboration marketplace
2. **Creator Projects** - Active campaigns and deliverables
3. **Creator Network** - Connect with other creators
4. **Creator Portfolio** - Showcase work and metrics
5. **Creator Analytics** - Performance tracking

### Implementation Needed
- Creator opportunity listing and application flow
- Project management interface
- Creator-to-creator messaging
- Portfolio management UI
- Creator-specific analytics dashboard

---

## API Endpoints (Future)

### Creator-Specific Endpoints Needed
```
GET  /api/creator/opportunities - List available opportunities
POST /api/creator/opportunities/{id}/apply - Apply to opportunity
GET  /api/creator/projects - Get creator's active projects
POST /api/creator/portfolio - Upload portfolio item
GET  /api/creator/network - Get creator connections
GET  /api/creator/analytics - Get creator performance stats
```

---

## Deployment Steps

1. **Deploy Firestore Rules:**
   ```bash
   firebase deploy --only firestore:rules
   ```

2. **Run User Migration** (if needed):
   - Deploy migration function
   - Execute for all existing users
   - Verify accountType field populated

3. **Deploy Frontend:**
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

4. **Verify Deployment:**
   - Test signup flow for all 4 account types
   - Verify route guards working
   - Test Firestore rule enforcement
   - Confirm UI updates visible

---

## Known Limitations

1. **Creator Features Incomplete:** Network and Projects are placeholders
2. **No Account Type Conversion:** Users cannot change account type (by design)
3. **Single Account Per User:** Users need separate emails for business + creator accounts

---

## Support

For issues or questions:
- Check TypeScript errors: `npm run build`
- Test Firestore rules: Firebase Console > Rules Playground
- Review logs: Browser DevTools Console

---

## Documentation Updated
- ✅ CREATOR_ACCOUNTS_IMPLEMENTATION.md (this file)
- ⚠️ Update user-facing documentation for 4 signup options
- ⚠️ Update admin documentation for account type management
