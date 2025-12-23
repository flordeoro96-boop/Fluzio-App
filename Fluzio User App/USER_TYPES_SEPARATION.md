# User Types Separation Guide

## ⚠️ CRITICAL: Read This First

**THREE USER TYPES, THREE SEPARATE INTERFACES:**

1. **CUSTOMERS** - Regular users (role: `MEMBER`)
2. **CREATORS** - Customers with creator mode enabled (role: `MEMBER`, `creatorMode: true`)
3. **BUSINESSES** - Business accounts (role: `BUSINESS`)

**GOLDEN RULES:**

✅ **DO:**
- Customers use `CustomerLayout` with Home/Discover/Rewards/Missions/Events tabs
- Businesses use `BusinessLayout` with Dashboard/Customers/Missions/Rewards/B2B tabs
- Creators are customers with extra features, NOT a separate interface
- Use `role: 'MEMBER'` for both customers and creators
- Use `creatorMode: true` flag to identify creators

❌ **DON'T:**
- Mix customer and business navigation menus
- Create a separate "Creator Layout" (creators use customer interface)
- Use `role: 'CREATOR'` in main app Firestore (only in admin portal)
- Show business tabs to customers or customer tabs to businesses

**DATA MODEL WARNING:**
The admin portal (`fluzio-admin/`) currently uses a different data model than the main app. See the "Firestore Data Model" section for details on this discrepancy.

---

## Overview
Fluzio has **THREE DISTINCT USER TYPES**, each with completely separate interfaces, navigation, and functionality. This document ensures clarity on their separation and relationships.

---

## 🎭 The Three User Types

### 1. 👤 **CUSTOMERS (UserRole.MEMBER)**
**Who they are:** Regular users who explore, engage with businesses, complete missions, and redeem rewards.

**Primary Interface:** `CustomerLayout` (mobile-first, bottom navigation)

**Main Navigation Tabs:**
- 🏠 **HOME** - Personalized feed, trending missions, nearby businesses
- 🔍 **DISCOVER** - Explore businesses and creators by location
- 🎁 **REWARDS** - Browse and redeem available rewards
- 🎯 **MISSIONS** - Complete tasks to earn points
- 📅 **EVENTS** - Browse and join community meetups

**Special Features:**
- Can enable **Creator Mode** to become a hybrid Customer/Creator
- When Creator Mode is ON:
  - Still use Customer interface
  - Gain access to "Creator Zone" in sidebar menu
  - Can view collaboration requests from businesses
  - Can showcase skills and portfolio
  - Can apply for paid creator jobs

**Sidebar Menu (CustomerSidebar):**
- Profile management
- Switch between Customer ↔ Business accounts
- Subscription management
- Linked social accounts
- **Creator Zone** (only if `creatorMode === true`)
  - Skills
  - Portfolio
  - Collaboration Requests
  - Creator Missions
  - Creator Jobs

**Key Files:**
- `components/CustomerLayout.tsx`
- `components/CustomerSidebar.tsx`
- `components/CustomerHeader.tsx`
- Customer screens: `HomeScreen`, `ExploreScreen`, `MissionsScreen`, `RewardsRedemption`, `MeetupsScreen`

---

### 2. 🏢 **BUSINESSES (UserRole.BUSINESS)**
**Who they are:** Physical or online businesses that create missions, offer rewards, and engage with customers/creators.

**Primary Interface:** `BusinessLayout` (mobile-first, bottom navigation)

**Main Navigation Tabs:**
- 🏠 **DASHBOARD** - Business analytics overview
- 👥 **CUSTOMERS** - Customer CRM and engagement data
- 🎯 **MISSIONS** - Create and manage missions
- 🏷️ **REWARDS** - Create and manage rewards/vouchers
- 🤝 **B2B (PARTNERS)** - Collaborate with creators and other businesses

**Special Features:**
- Can browse and hire creators for collaborations
- Access to advanced analytics
- Customer relationship management (CRM)
- Squad management for ongoing partnerships
- Project creation and management

**Sidebar Menu (UserDrawer):**
- Business profile management
- Subscription & wallet
- Admin panel access (if admin)
- Settings
- Profile view
- Switch to Customer account

**Key Files:**
- `App.tsx` (BusinessLayout component, lines 99-142)
- `components/business/` - All business-specific components
  - `AnalyticsDashboard.tsx`
  - `CustomerCRM.tsx`
  - `BusinessMarketScreen.tsx`
  - `CreatorProfileView.tsx`
- Business screens: `DashboardView`, `MissionsView`, `PeopleView`, `B2BView`

---

### 3. 🎨 **CREATORS** (Hybrid: MEMBER with `creatorMode = true`)
**Who they are:** NOT a separate user role. Creators are customers who have enabled Creator Mode.

**Important:** Creators use the **Customer interface** but with additional features unlocked.

**How to Identify:**
```typescript
// In code
user.role === UserRole.MEMBER && user.creatorMode === true
```

**What Changes When Creator Mode is Enabled:**
1. "Creator Zone" section appears in sidebar
2. Can view and respond to collaboration requests from businesses
3. Can showcase portfolio and skills
4. Appears in business searches when they browse creators
5. Can apply for paid creator jobs/projects

**Creator-Specific Screens:**
- `CreatorSkillsScreen` - Manage skills, rates, and services
- `CreatorPortfolioScreen` - Showcase work samples
- `CollaborationRequestsScreen` - View business collaboration offers
- `BusinessProfileScreen` - View business as creator (when browsing)

**Key Files:**
- `src/components/SidebarMenu.tsx` (lines 152-158: Creator Zone items)
- `components/creator/` - Creator-specific screens
- Creator logic integrated in Customer interface

**Toggle Creator Mode:**
```typescript
// In Firestore
await updateDoc(doc(db, 'users', userId), {
  creatorMode: true,
  creatorProfile: {
    skills: [],
    portfolio: [],
    rates: {}
  }
});
```

---

## 🔀 User Type Relationships

### Customer → Creator
- Any customer can enable Creator Mode
- Keeps customer functionality + gains creator features
- Uses same Customer interface with extended menu
- Represented in code as: `role: MEMBER, creatorMode: true`

### Customer → Business
- Users can switch accounts if they have multiple profiles
- Completely different interface (BusinessLayout vs CustomerLayout)
- Different navigation, features, and capabilities
- Switch via "Switch Account" in sidebar

### Business ↔ Creator
- Businesses can browse and hire creators
- Creators appear in business's "Partners" tab
- Businesses send collaboration requests
- Creators receive and respond to requests

### All Types → Admin
- Admins access a separate admin portal (`fluzio-admin/`)
- Built with Next.js, completely separate from main app
- View-only access to all user types, businesses, missions, rewards
- Accessed via Admin Panel button (only visible to admin users)

---

## 📊 Code Structure

### User Role Enum
```typescript
// types.ts
export enum UserRole {
  ADMIN = 'ADMIN',
  BUSINESS = 'BUSINESS',
  MEMBER = 'MEMBER'  // Customers and Creators
}
```

### User Interface
```typescript
interface User {
  role: UserRole;
  creatorMode?: boolean; // Only for MEMBER role
  
  // Customer/Creator fields
  level?: number;
  points?: number;
  interests?: string[];
  
  // Business fields
  businessType?: string;
  category?: BusinessCategory;
  address?: Address;
  
  // Creator fields (when creatorMode = true)
  creatorProfile?: {
    skills: string[];
    portfolio: PortfolioItem[];
    rates: RateCard;
  };
}
```

### Routing Logic
```typescript
// App.tsx (lines 2617-2630)
const effectiveRole = 
  isTogglingCreatorMode ? UserRole.MEMBER :
  userProfile?.role === 'BUSINESS' ? UserRole.BUSINESS : 
  userProfile?.role === 'CREATOR' ? UserRole.MEMBER :  // CREATOR mapped to MEMBER
  user.role;

if (effectiveRole === UserRole.MEMBER) {
  // Render CustomerLayout
  return <CustomerLayout>...</CustomerLayout>;
}

// Render BusinessLayout
return <BusinessLayout>...</BusinessLayout>;
```

---

## 🚫 What NOT to Do

### ❌ **DO NOT** mix user interfaces
- Customers should NEVER see business-only tabs (Analytics, CRM)
- Businesses should NEVER see customer-only tabs (Home feed, Discover)
- Creator features should ONLY appear when `creatorMode === true`

### ❌ **DO NOT** create a separate "Creator Layout"
- Creators use CustomerLayout, not a separate interface
- Creator Mode is an enhancement, not a separate user type

### ❌ **DO NOT** confuse roles in Firestore
- Use `MEMBER` for customers/creators
- Use `BUSINESS` for businesses
- Use `ADMIN` for administrators
- **NEVER** use `CREATOR` as a role value (it's a boolean flag)

---

## ✅ Navigation Menu Summary

| Feature | Customer | Customer (Creator Mode) | Business |
|---------|----------|------------------------|----------|
| Home Tab | ✅ | ✅ | ✅ (Dashboard) |
| Discover | ✅ | ✅ | ❌ |
| Rewards | ✅ | ✅ | ❌ |
| Missions | ✅ | ✅ | ✅ |
| Events | ✅ | ✅ | ❌ |
| Analytics | ❌ | ❌ | ✅ |
| Customers (CRM) | ❌ | ❌ | ✅ |
| B2B/Partners | ❌ | ❌ | ✅ |
| Creator Zone | ❌ | ✅ | ❌ |
| Collaboration Requests | ❌ | ✅ | ❌ |

---

## 🎯 Admin Portal (Separate System)

**Location:** `fluzio-admin/` folder

**User Type:** `AdminRole` (separate from UserRole)

**Admin Roles:**
- `SUPER_ADMIN` - Full access
- `COUNTRY_ADMIN` - Country-level management
- `CITY_ADMIN` - City-level management
- `EVENT_MANAGER` - Event management only
- `MODERATOR` - Content moderation only

**Admin Navigation:**
- Countries
- Users (view all customers)
- Businesses (view all businesses)
- **Creators** (view all users with creatorMode = true)
- Missions
- Events
- Rewards
- Finance
- Moderation
- Analytics
- Governance
- System

**Key Distinction:**
- Admin portal is a **separate Next.js app**
- Accessed via `/admin` route
- Completely different authentication flow
- View-only dashboard for monitoring
- Admin panel button in main app opens new tab to admin portal

**Key Files:**
- `fluzio-admin/app/admin/layout.tsx` - Admin navigation
- `fluzio-admin/app/admin/creators/page.tsx` - Creators list (filtered MEMBER users)
- `fluzio-admin/app/admin/businesses/page.tsx` - Businesses list
- `fluzio-admin/lib/types/index.ts` - Admin-specific types

---

## 🔐 Firestore Data Model

### Main App Collections

**users collection** (Main app: `App.tsx`):
```javascript
// Customer
{ 
  role: 'MEMBER', 
  creatorMode: false,
  // customer fields...
}

// Creator (Customer with creator mode enabled)
{ 
  role: 'MEMBER', 
  creatorMode: true,
  creatorProfile: {
    skills: [],
    portfolio: [],
    rates: {}
  }
  // customer fields + creator fields...
}

// Business
{ 
  role: 'BUSINESS',
  businessType: 'RESTAURANT',
  category: 'GASTRONOMY',
  // business fields...
}

// Admin
{ 
  role: 'ADMIN'
}
```

### Admin Portal Collections

⚠️ **DATA MODEL DISCREPANCY:** The admin portal currently uses separate collections:

**users collection** (Admin portal):
```javascript
// Regular customers only
{
  role: 'CUSTOMER',
  // Does NOT include creators
}
```

**creators collection** (Admin portal):
```javascript
// Separate collection for creators
{
  role: 'CREATOR',  // ⚠️ Different from main app
  verified: boolean,
  trustScore: number,
  payoutFrozen: boolean,
  // creator-specific fields
}
```

**businesses collection** (Admin portal):
```javascript
// Business accounts
{
  tier: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE',
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED',
  // business fields
}
```

### 🔧 Recommended Fix

To align the admin portal with the main app:

1. **Remove the separate `creators` collection**
2. **Query `users` collection with filter: `role === 'MEMBER' && creatorMode === true`**
3. **Update admin types to use `MEMBER` instead of `CUSTOMER` and `CREATOR`**

**Files to update:**
- `fluzio-admin/lib/types/index.ts` - Change `UserRole` enum
- `fluzio-admin/lib/repositories/creators.ts` - Query `users` collection
- `fluzio-admin/app/admin/creators/page.tsx` - Update to filter users by `creatorMode`

**INCORRECT (Current admin portal):**
```javascript
// ❌ NEVER DO THIS in main app
{ role: 'CREATOR' }  // Only exists in admin portal
{ role: 'CUSTOMER' } // Use MEMBER instead
```

**CORRECT (Main app):**
```javascript
// ✅ Always use this
{ role: 'MEMBER' }     // For customers/creators
{ role: 'BUSINESS' }   // For businesses
{ role: 'ADMIN' }      // For admins
```

---

## 📱 Visual Flow

```
┌─────────────────────────────────────────────────┐
│              FLUZIO USERS                        │
└─────────────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        │                        │
   ┌────▼─────┐           ┌─────▼──────┐
   │ CUSTOMER │           │  BUSINESS  │
   │  (MEMBER)│           │ (BUSINESS) │
   └────┬─────┘           └────────────┘
        │                       │
        │ Toggle               │ Browse
        │ Creator Mode         │ Creators
        ▼                      ▼
   ┌─────────────┐       ┌──────────────┐
   │ CREATOR     │◄──────┤ Send Collab  │
   │ (MEMBER +   │       │ Requests     │
   │ creatorMode)│       └──────────────┘
   └─────────────┘
```

---

## 🚀 Key Takeaways

1. **Three distinct user experiences**: Customer, Business, and Admin
2. **Creators are enhanced customers**, not a separate type
3. **Each has completely different navigation** - no crossover
4. **Relationships exist** but interfaces remain separate
5. **Admin portal is a separate application** for monitoring
6. **Role field in Firestore (main app)**: `MEMBER`, `BUSINESS`, or `ADMIN` only
7. **Creator Mode is a boolean flag**, not a role
8. **Data model differs between main app and admin portal** (needs alignment)

---

## 🎨 Visual Navigation Map

### Customer Interface (CustomerLayout)
```
┌─────────────────────────────────────────────┐
│  👤 Customer Navigation                      │
├─────────────────────────────────────────────┤
│  Bottom Tabs:                                │
│  🏠 HOME     - Personalized feed            │
│  🔍 DISCOVER - Explore businesses           │
│  🎁 REWARDS  - Browse rewards               │
│  🎯 MISSIONS - Complete tasks               │
│  📅 EVENTS   - Join meetups                 │
│                                              │
│  Sidebar Menu (if creatorMode = false):     │
│  - Profile                                   │
│  - Subscription                              │
│  - Linked Accounts                           │
│  - Settings                                  │
│                                              │
│  Sidebar Menu (if creatorMode = true):      │
│  - Profile                                   │
│  - Subscription                              │
│  - Linked Accounts                           │
│  - ✨ CREATOR ZONE:                         │
│    • Skills                                  │
│    • Portfolio                               │
│    • Collaboration Requests                  │
│    • Creator Missions                        │
│    • Creator Jobs                            │
│  - Settings                                  │
└─────────────────────────────────────────────┘
```

### Business Interface (BusinessLayout)
```
┌─────────────────────────────────────────────┐
│  🏢 Business Navigation                      │
├─────────────────────────────────────────────┤
│  Bottom Tabs:                                │
│  🏠 DASHBOARD - Analytics overview          │
│  👥 CUSTOMERS - CRM & engagement            │
│  🎯 MISSIONS  - Create missions             │
│  🏷️ REWARDS   - Manage rewards              │
│  🤝 B2B       - Creator partnerships        │
│                                              │
│  Sidebar Menu:                               │
│  - Business Profile                          │
│  - Subscription & Wallet                     │
│  - Analytics                                 │
│  - Customer CRM                              │
│  - Settings                                  │
│  - Switch to Customer Account                │
│  - Admin Panel (if admin)                    │
└─────────────────────────────────────────────┘
```

### Admin Portal (Separate Next.js App)
```
┌─────────────────────────────────────────────┐
│  🛡️ Admin Navigation (fluzio-admin/)        │
├─────────────────────────────────────────────┤
│  Sidebar:                                    │
│  📊 Dashboard    - Platform overview        │
│  🌍 Countries    - Country management        │
│  👥 Users        - All customers (MEMBER)   │
│  🏢 Businesses   - All businesses           │
│  🎨 Creators     - Users with creatorMode   │
│  🎯 Missions     - Mission approval          │
│  📅 Events       - Event management          │
│  🎁 Rewards      - Reward oversight          │
│  💰 Finance      - Transactions              │
│  🚩 Moderation   - Content moderation        │
│  📈 Analytics    - Platform metrics          │
│  ⚖️ Governance   - Policy management         │
│  ⚙️ System       - System settings           │
└─────────────────────────────────────────────┘
```

---

## 📝 Implementation Checklist

- [x] Customer interface uses `CustomerLayout` with bottom nav
- [x] Business interface uses `BusinessLayout` with different tabs
- [x] Creator Mode adds features to Customer interface, not new interface
- [x] Admin portal is separate Next.js app
- [x] No menu crossover between user types
- [x] Role-based rendering logic in `App.tsx`
- [x] Separate sidebar menus for each type
- [x] Account switching functionality for multi-profile users
- [x] Creator Mode toggle functionality
- [x] Business can browse and contact creators

---

## 🔍 Quick Comparison Table

| Aspect | Customer | Creator | Business | Admin |
|--------|----------|---------|----------|-------|
| **Firestore Role** | `MEMBER` | `MEMBER` | `BUSINESS` | `ADMIN` |
| **Special Flag** | `creatorMode: false` | `creatorMode: true` | N/A | N/A |
| **Layout Component** | `CustomerLayout` | `CustomerLayout` | `BusinessLayout` | Admin Portal |
| **Bottom Nav Tabs** | 5 tabs | 5 tabs | 5 tabs | None (sidebar) |
| **Home Tab Shows** | Feed | Feed | Dashboard | Overview |
| **Can Create Missions** | ❌ | ❌ | ✅ | View only |
| **Can Earn Points** | ✅ | ✅ | ❌ | N/A |
| **Has Portfolio** | ❌ | ✅ | ❌ | View only |
| **Has CRM** | ❌ | ❌ | ✅ | View all |
| **Can Browse Creators** | ❌ | ❌ | ✅ | View all |
| **Receives Collab Requests** | ❌ | ✅ | ❌ | View only |
| **Sidebar Menu Items** | 8 items | 13 items | 10 items | 13 pages |
| **App Location** | Main app | Main app | Main app | `/fluzio-admin` |
| **Built With** | React | React | React | Next.js |

---

## 🎓 Understanding the Relationships

### How Users Interact Across Types

```
┌──────────────────────────────────────────────────────────┐
│                    USER ECOSYSTEM                         │
└──────────────────────────────────────────────────────────┘

  CUSTOMER (MEMBER)                    BUSINESS (BUSINESS)
  ┌─────────────────┐                  ┌─────────────────┐
  │ • Browse deals  │                  │ • Create deals  │
  │ • Do missions   │◄─────────────────┤ • Post missions │
  │ • Earn points   │  Participate in  │ • Offer rewards │
  │ • Redeem rewards│                  │ • Track ROI     │
  └────────┬────────┘                  └────────┬────────┘
           │                                     │
           │ Toggle Creator Mode                 │ Browse & Hire
           ▼                                     ▼
  ┌─────────────────┐                  ┌─────────────────┐
  │ CREATOR         │                  │ PARTNERSHIP     │
  │ (MEMBER + Mode) │◄─────────────────┤ • Send offers   │
  │ • Portfolio     │  Collaboration   │ • View profiles │
  │ • Skills        │  Requests        │ • Rate creators │
  │ • Get hired     │                  │ • Manage squad  │
  └─────────────────┘                  └─────────────────┘
           │                                     │
           │                                     │
           └──────────────┬──────────────────────┘
                          │
                   Monitored by
                          │
                          ▼
                  ┌─────────────────┐
                  │  ADMIN PORTAL   │
                  │ • View all data │
                  │ • Approve/reject│
                  │ • Moderate      │
                  │ • Analytics     │
                  └─────────────────┘
```

### Real-World Scenarios

**Scenario 1: Customer Becomes Creator**
1. User signs up as Customer (`role: MEMBER`)
2. Uses app to earn points, complete missions
3. Decides to offer services → Toggles Creator Mode
4. Now sees "Creator Zone" in sidebar
5. Adds skills and portfolio
6. Receives collaboration request from business
7. Still has full customer functionality

**Scenario 2: Business Hires Creator**
1. Business needs photographer for event
2. Goes to "B2B" tab → "Find Creators"
3. Browses creators by skills/location
4. Sends collaboration request
5. Creator sees request in "Collaboration Requests"
6. They negotiate and agree
7. Business manages project in "My Squad"

**Scenario 3: User Has Multiple Accounts**
1. User owns a café (Business account)
2. Also enjoys exploring as customer
3. Creates second profile as Customer
4. Can switch between accounts in sidebar
5. Each account has completely different interface
6. Business account: manages café
7. Customer account: earns rewards at other cafés

**Scenario 4: Admin Monitors Platform**
1. Admin logs into admin portal
2. Sees dashboard with platform metrics
3. Reviews flagged content in Moderation
4. Checks new creator applications
5. Approves business verification
6. Views financial reports
7. All read-only, no direct posting

---

**Last Updated:** December 23, 2025
**Status:** ✅ COMPLETE - All user types properly separated

---

## 🔧 Troubleshooting Common Issues

### Issue: Customer seeing business tabs
**Symptom:** Customer sees "Customers CRM", "Analytics", or "B2B" tabs

**Cause:** Role is incorrectly set to `BUSINESS` in Firestore

**Fix:**
```typescript
// Check user role in browser console
console.log('User role:', user.role);

// Update in Firestore
await updateDoc(doc(db, 'users', userId), {
  role: 'MEMBER'
});
```

---

### Issue: Creator Mode not showing features
**Symptom:** User has `creatorMode: true` but doesn't see Creator Zone

**Cause:** Check if `creatorMode` field exists and is `true`

**Fix:**
```typescript
// Enable creator mode properly
await updateDoc(doc(db, 'users', userId), {
  creatorMode: true,
  creatorProfile: {
    skills: [],
    portfolio: [],
    rates: {}
  }
});
```

---

### Issue: Business can't access business features
**Symptom:** Business user sees customer interface instead

**Cause:** Role should be `BUSINESS`, not `MEMBER`

**Fix:**
```typescript
// Update role
await updateDoc(doc(db, 'users', userId), {
  role: 'BUSINESS',
  businessType: 'RESTAURANT',
  category: 'GASTRONOMY'
});
```

---

### Issue: Admin portal showing wrong users
**Symptom:** Creators not appearing in admin creators list

**Cause:** Admin portal queries `creators` collection instead of filtering `users`

**Fix Required:** Update admin repository to query `users` collection:
```typescript
// In fluzio-admin/lib/repositories/creators.ts
// CHANGE FROM:
let query = db.collection('creators').orderBy('createdAt', 'desc');

// CHANGE TO:
let query = db.collection('users')
  .where('role', '==', 'MEMBER')
  .where('creatorMode', '==', true)
  .orderBy('createdAt', 'desc');
```

---

### Issue: User switched accounts but interface didn't change
**Symptom:** Switched from Business to Customer but still seeing business tabs

**Cause:** State not properly updated, or role not changed

**Fix:**
1. Force refresh: `window.location.reload()`
2. Check `effectiveRole` calculation in `App.tsx` (line 2617)
3. Verify role in Firestore matches expected role

---

### Issue: Creator can't be found by businesses
**Symptom:** Creator enabled mode but doesn't appear in business search

**Cause:** Missing creator profile data or visibility settings

**Fix:**
```typescript
// Ensure creator profile is complete
await updateDoc(doc(db, 'users', userId), {
  creatorMode: true,
  creatorProfile: {
    skills: ['photographer', 'videographer'],
    portfolio: [/* items */],
    rates: { hourly: 50 },
    visible: true,
    verified: false
  }
});
```

---
