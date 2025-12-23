# User Types Quick Reference Card

## 🎯 Three User Types at a Glance

### 👤 CUSTOMER
- **Role in Firestore:** `MEMBER`
- **Layout:** `CustomerLayout`
- **Tabs:** Home | Discover | Rewards | Missions | Events
- **Can:** Earn points, complete missions, redeem rewards, attend events
- **Files:** `components/CustomerLayout.tsx`, `components/CustomerSidebar.tsx`

### 🎨 CREATOR (Enhanced Customer)
- **Role in Firestore:** `MEMBER` + `creatorMode: true`
- **Layout:** `CustomerLayout` (same as customer)
- **Tabs:** Home | Discover | Rewards | Missions | Events (same as customer)
- **Extra:** Creator Zone in sidebar (Skills, Portfolio, Collab Requests, Jobs)
- **Can:** Everything customers can + showcase skills, receive business offers
- **Files:** `src/components/SidebarMenu.tsx`, `components/creator/*`

### 🏢 BUSINESS
- **Role in Firestore:** `BUSINESS`
- **Layout:** `BusinessLayout`
- **Tabs:** Dashboard | Customers | Missions | Rewards | B2B
- **Can:** Create missions, offer rewards, hire creators, view analytics
- **Files:** `App.tsx` (BusinessLayout), `components/business/*`

### 🛡️ ADMIN
- **Role in Firestore:** `ADMIN`
- **Interface:** Separate Next.js app (`fluzio-admin/`)
- **Access:** View/moderate all platform data
- **URL:** `/admin`

---

## 🔑 Key Rules

| Rule | Description |
|------|-------------|
| **Different Interfaces** | Customers and Businesses use completely different layouts |
| **Creators = Customers+** | Creators are customers with extra features, not separate type |
| **No Mixing** | Never show business tabs to customers or vice versa |
| **Role Values** | Only use: `MEMBER`, `BUSINESS`, `ADMIN` |
| **Creator Flag** | Use `creatorMode: true` to identify creators |

---

## 📊 Navigation Tabs Cheat Sheet

```
CUSTOMER/CREATOR          BUSINESS
┌──────────────────┐      ┌──────────────────┐
│ 🏠 HOME          │      │ 🏠 DASHBOARD     │
│ 🔍 DISCOVER      │      │ 👥 CUSTOMERS     │
│ 🎁 REWARDS       │      │ 🎯 MISSIONS      │
│ 🎯 MISSIONS      │      │ 🏷️ REWARDS       │
│ 📅 EVENTS        │      │ 🤝 B2B           │
└──────────────────┘      └──────────────────┘
```

---

## ⚡ Quick Code Checks

### Check User Type in Console
```javascript
// In browser console
console.log('Role:', user.role);
console.log('Creator Mode:', user.creatorMode);
console.log('Effective Role:', effectiveRole);
```

### Verify Correct Role in Code
```typescript
// Customer or Creator
if (user.role === 'MEMBER') {
  // Show CustomerLayout
  if (user.creatorMode) {
    // Add Creator Zone to sidebar
  }
}

// Business
if (user.role === 'BUSINESS') {
  // Show BusinessLayout
}
```

### Update Role in Firestore
```typescript
// Make user a customer
await updateDoc(doc(db, 'users', userId), { role: 'MEMBER' });

// Enable creator mode
await updateDoc(doc(db, 'users', userId), { 
  role: 'MEMBER', 
  creatorMode: true 
});

// Make user a business
await updateDoc(doc(db, 'users', userId), { role: 'BUSINESS' });
```

---

## 🚫 Common Mistakes

| ❌ Wrong | ✅ Right |
|----------|----------|
| `role: 'CREATOR'` | `role: 'MEMBER', creatorMode: true` |
| `role: 'CUSTOMER'` | `role: 'MEMBER'` |
| Showing CRM to customers | Only show to businesses |
| Creating CreatorLayout | Use CustomerLayout + extras |
| Querying `creators` collection | Query `users` with `creatorMode: true` |

---

## 📱 Where to Find Components

### Customer Components
- Layout: `components/CustomerLayout.tsx`
- Sidebar: `components/CustomerSidebar.tsx`
- Header: `components/CustomerHeader.tsx`
- Screens: `HomeScreen.tsx`, `ExploreScreen.tsx`, `MissionsScreen.tsx`, `RewardsRedemption.tsx`, `MeetupsScreen.tsx`

### Creator Components (extensions of Customer)
- Sidebar additions: `src/components/SidebarMenu.tsx`
- Screens: `creator/CreatorSkillsScreen.tsx`, `creator/CreatorPortfolioScreen.tsx`, `creator/CollaborationRequestsScreen.tsx`

### Business Components
- Layout: `App.tsx` (BusinessLayout component, line 99)
- Screens: `DashboardView.tsx`, `MissionsView.tsx`, `PeopleView.tsx`, `B2BView.tsx`
- Business-specific: `components/business/*`

### Admin Components
- Portal: `fluzio-admin/app/admin/*`
- Layout: `fluzio-admin/app/admin/layout.tsx`

---

## 🔍 File Reference

| User Type | Key Files |
|-----------|-----------|
| **Customer** | `CustomerLayout.tsx`, `CustomerSidebar.tsx`, `HomeScreen.tsx` |
| **Creator** | `SidebarMenu.tsx`, `CreatorSkillsScreen.tsx`, `CreatorPortfolioScreen.tsx` |
| **Business** | `App.tsx:99-142`, `business/CustomerCRM.tsx`, `business/AnalyticsDashboard.tsx` |
| **Admin** | `fluzio-admin/app/admin/layout.tsx`, `fluzio-admin/app/admin/creators/page.tsx` |
| **Types** | `types.ts`, `fluzio-admin/lib/types/index.ts` |
| **Auth** | `services/AuthContext.tsx` |

---

**Print this card and keep it handy!** 📄

For complete documentation, see [USER_TYPES_SEPARATION.md](./USER_TYPES_SEPARATION.md)
