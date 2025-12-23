# RBAC Implementation Plan for Fluzio Admin

## 📊 CURRENT STATE AUDIT

### Admin Screens (11 Components)

**Location:** `components/admin/`

1. **AdminDashboard.tsx** - Main admin hub with tabs
2. **BusinessLevelApprovals.tsx** - Business level upgrade requests
3. **AdminUserManagement.tsx** - User CRUD operations
4. **AdminBusinessManagement.tsx** - Business profile management
5. **AdminMissionManagement.tsx** - Mission moderation
6. **AdminEventManagement.tsx** - Event creation/management
7. **AdminSubscriptionManagement.tsx** - Subscription tier management
8. **AdminAnalytics.tsx** - Platform analytics dashboard
9. **AdminSettings.tsx** - Platform configuration
10. **UserManagementPanel.tsx** - User actions (ban/verify)
11. **ContentModerationPanel.tsx** - Content reports moderation

### Admin API Endpoints (55 Total)

**Location:** `functions/index.js`

#### User Management (3)
- `createuser` - Create new user account
- `getuser` - Get user details
- `updateuser` - Update user profile

#### Business Level System (5)
- `requestBusinessLevelUpgrade` - Business requests level upgrade
- `approveBusinessLevelUpgrade` - **ADMIN ONLY** Approve upgrade
- `rejectBusinessLevelUpgrade` - **ADMIN ONLY** Reject upgrade
- `getPendingUpgradeRequests` - **ADMIN ONLY** Get pending requests
- `setUserBusinessLevel` - **ADMIN ONLY** Manually set business level

#### Verification (3)
- `submitVerificationRequest` - Business submits verification
- `approveVerification` - **ADMIN ONLY** Approve verification
- `rejectVerification` - **ADMIN ONLY** Reject verification

#### Mission & Reward Management (10)
- `generatemissionideas` - AI mission generation
- `generaterewardsuggestions` - AI reward suggestions
- `redeemreward` - Customer redeems reward
- `fundmission` - Fund mission from marketplace
- `activateMission` - Activate mission for business
- `deactivateMission` - Deactivate mission
- `getMissionActivation` - Get mission status
- `createReward` - Create reward
- `updateReward` - Update reward
- `deleteReward` - Delete reward

#### Event Management (3)
- `registerForPremiumEvent` - User registers for event
- `triggerBringAFriendUnlock` - Unlock bring-a-friend feature
- `triggerAppointmentUnlock` - Unlock appointment feature

#### Subscription Management (3)
- `canCreateMission` - Check mission creation limits
- `canHostMeetup` - Check meetup hosting limits
- `useGrowthCredits` - Use growth credits

#### Analytics & Reporting (2)
- `checkUsageLimits` - Check usage statistics
- `getCampaignProgress` - Get campaign metrics

#### System Operations (6)
- `triggerSquadGeneration` - **ADMIN ONLY** Manual squad generation
- `triggerSubscriptionReset` - **ADMIN ONLY** Reset subscription counters
- `migrateExistingBusinessesToLevel2` - **ADMIN ONLY** Migration tool
- `updateSubscriptionLevel` - **ADMIN ONLY** Update user subscription level
- `instagramcallback` - OAuth callback
- `instagramWebhook` - Webhook handler

#### Scheduled Functions (2)
- `generateSquads` - Auto-generate B2B squads (1st of month)
- `resetMonthlySubscriptionCounters` - Reset quotas (1st of month)
- `executeDailyCampaigns` - Execute campaigns (daily)

### Database Collections (30+)

**Core Collections:**
- `users` - User accounts and profiles
- `missions` - Business missions
- `participations` - Mission completions
- `rewards` - Business rewards
- `redemptions` - Reward redemptions
- `checkIns` - Location check-ins
- `reviews` - Business reviews

**Admin-Specific Collections:**
- `adminEvents` - Platform-wide events
- `levelUpRequests` - Business level upgrade requests
- `verificationRequests` - Business verification requests
- `content_reports` - Content moderation reports

**Subscription Collections:**
- `level1Subscriptions` - Aspiring business subscriptions
- `level2Subscriptions` - Established business subscriptions
- `eventRegistrations` - Event registrations

**Social & Communication:**
- `conversations` - Direct messages
- `messages` - Message contents
- `notifications` - User notifications
- `notificationPreferences` - Notification settings
- `squads` - B2B squads
- `customerSquads` - Customer squads
- `meetups` - Meetup events
- `friendships` - User connections
- `friendRequests` - Friend requests

**Gamification:**
- `progressions` - User progression data
- `gamification` - Daily streaks, challenges
- `points_transactions` - Points history
- `points_purchases` - Marketplace purchases

**Business:**
- `service_providers` - Service provider profiles
- `projects` - Collaboration projects
- `collaboration_offers` - Collaboration offers
- `collaboration_requests` - Collaboration requests
- `businessFollows` - Business follower relationships

**System:**
- `platformSettings` - Global platform config
- `adminLogs` - Admin action logs
- `systemMetrics` - System metrics
- `userBehavior` - User behavior tracking
- `analytics` - Analytics data

### Current Permission Enforcement

#### Frontend (Weak)
- **Location:** `App.tsx` lines 189, 309
- **Check:** `user.role === UserRole.ADMIN || user.email === 'admin@fluzio.com'`
- **Issue:** Easy to bypass, no scope validation

#### Backend (Partial)
- **Location:** `functions/index.js` line 33-52
- **Function:** `verifyAdminRole(adminId)`
- **Coverage:** Only 8 endpoints use this (level approvals, verification)
- **Issue:** Most endpoints have NO admin check

#### Firestore Rules (Basic)
- **Location:** `firestore.rules` line 15-19
- **Function:** `isAdmin()`
- **Check:** Email = 'admin@fluzio.com' OR role = 'ADMIN'
- **Issue:** Binary admin check, no scoping

---

## 🎯 PROPOSED RBAC SYSTEM

### Role Definitions

```typescript
enum AdminRole {
  SUPER_ADMIN = 'SUPER_ADMIN',        // Full platform access
  COUNTRY_ADMIN = 'COUNTRY_ADMIN',    // Country-scoped access
  CITY_ADMIN = 'CITY_ADMIN',          // City-scoped access
  EVENT_ADMIN = 'EVENT_ADMIN',        // Event management only
  SUPPORT_ADMIN = 'SUPPORT_ADMIN'     // User support, no pricing
}
```

### Permission Matrix

| Feature | SUPER_ADMIN | COUNTRY_ADMIN | CITY_ADMIN | EVENT_ADMIN | SUPPORT_ADMIN |
|---------|-------------|---------------|------------|-------------|---------------|
| **User Management** |
| View all users | ✅ | ✅ (country) | ✅ (city) | ❌ | ✅ (view only) |
| Ban/Unban users | ✅ | ✅ (country) | ✅ (city) | ❌ | ✅ |
| Delete users | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Business Management** |
| Approve level upgrades | ✅ | ✅ (country) | ✅ (city) | ❌ | ❌ |
| Verify businesses | ✅ | ✅ (country) | ✅ (city) | ❌ | ❌ |
| Modify pricing | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Subscription Management** |
| View subscriptions | ✅ | ✅ (country) | ✅ (city) | ❌ | ❌ |
| Modify tiers | ✅ | ❌ | ❌ | ❌ | ❌ |
| Reset counters | ✅ | ✅ (country) | ✅ (city) | ❌ | ❌ |
| **Event Management** |
| Create events | ✅ | ✅ (country) | ✅ (city) | ✅ (assigned) | ❌ |
| Edit events | ✅ | ✅ (country) | ✅ (city) | ✅ (assigned) | ❌ |
| Delete events | ✅ | ✅ (country) | ✅ (city) | ✅ (assigned) | ❌ |
| **Content Moderation** |
| View reports | ✅ | ✅ (country) | ✅ (city) | ❌ | ✅ |
| Resolve reports | ✅ | ✅ (country) | ✅ (city) | ❌ | ✅ |
| Delete content | ✅ | ✅ (country) | ✅ (city) | ❌ | ❌ |
| **Mission Management** |
| View missions | ✅ | ✅ (country) | ✅ (city) | ❌ | ❌ |
| Approve/Reject | ✅ | ✅ (country) | ✅ (city) | ❌ | ❌ |
| **Analytics** |
| View analytics | ✅ | ✅ (country) | ✅ (city) | ❌ | ✅ (limited) |
| Export data | ✅ | ✅ (country) | ❌ | ❌ | ❌ |
| **System Operations** |
| Trigger squad gen | ✅ | ❌ | ❌ | ❌ | ❌ |
| Run migrations | ✅ | ❌ | ❌ | ❌ | ❌ |
| Modify settings | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 📝 SCHEMA CHANGES

### 1. New Collection: `adminUsers`

```typescript
interface AdminUser {
  id: string;                          // Auto-generated
  userId: string;                      // Reference to users collection
  email: string;                       // Admin email
  role: AdminRole;                     // One of the 5 roles
  
  // Geographic Scope
  countryId?: string;                  // ISO country code (e.g., 'PT', 'ES')
  cityId?: string;                     // City identifier
  
  // Event Scope (for EVENT_ADMIN)
  assignedEventIds?: string[];         // Array of event IDs they can manage
  
  // Permission Overrides (optional)
  permissions?: {
    canBanUsers?: boolean;
    canDeleteContent?: boolean;
    canModifyPricing?: boolean;
    canExportData?: boolean;
    [key: string]: boolean | undefined;
  };
  
  // Status & Metadata
  isActive: boolean;                   // Can log in
  createdAt: Timestamp;
  createdBy: string;                   // Admin who created this admin
  lastLoginAt?: Timestamp;
  notes?: string;                      // Internal notes about this admin
}
```

### 2. Update Collection: `users`

Add admin reference:
```typescript
interface User {
  // ... existing fields
  adminProfile?: {
    adminUserId: string;               // Reference to adminUsers doc
    role: AdminRole;
    isActive: boolean;
  };
}
```

### 3. New Collection: `adminLogs` (Enhanced)

```typescript
interface AdminLog {
  id: string;
  adminUserId: string;                 // Who performed action
  adminEmail: string;
  adminRole: AdminRole;
  action: string;                      // 'APPROVE_LEVEL', 'BAN_USER', etc.
  targetType: string;                  // 'USER', 'BUSINESS', 'EVENT', etc.
  targetId: string;                    // ID of affected entity
  targetEmail?: string;
  details: any;                        // Action-specific data
  ipAddress?: string;
  userAgent?: string;
  timestamp: Timestamp;
}
```

### 4. Update Collection: `levelUpRequests`

Add geographic info:
```typescript
interface LevelUpRequest {
  // ... existing fields
  businessCountry?: string;            // For scope filtering
  businessCity?: string;
}
```

### 5. Update Collection: `verificationRequests`

Add geographic info:
```typescript
interface VerificationRequest {
  // ... existing fields
  businessCountry?: string;
  businessCity?: string;
}
```

---

## 🔧 BACKEND CHANGES

### 1. New Middleware: `requireRole()`

**File:** `functions/authMiddleware.js` (new)

```javascript
const admin = require('firebase-admin');
const db = admin.firestore();

/**
 * Verify user has required admin role
 * @param {string[]} allowedRoles - Array of allowed roles
 */
const requireRole = (allowedRoles) => {
  return async (userId) => {
    try {
      // Get admin user document
      const adminSnapshot = await db.collection('adminUsers')
        .where('userId', '==', userId)
        .where('isActive', '==', true)
        .limit(1)
        .get();
      
      if (adminSnapshot.empty) {
        return {
          success: false,
          error: 'Not an admin user',
          code: 403
        };
      }
      
      const adminDoc = adminSnapshot.docs[0];
      const adminData = adminDoc.data();
      
      // Check if role is allowed
      if (!allowedRoles.includes(adminData.role)) {
        return {
          success: false,
          error: `Insufficient permissions. Required: ${allowedRoles.join(' or ')}`,
          code: 403
        };
      }
      
      return {
        success: true,
        adminData: {
          ...adminData,
          id: adminDoc.id
        }
      };
    } catch (error) {
      console.error('[requireRole] Error:', error);
      return {
        success: false,
        error: 'Failed to verify role',
        code: 500
      };
    }
  };
};

/**
 * Verify user has access to specific scope
 */
const requireScope = async (adminData, targetResource) => {
  const { role, countryId, cityId, assignedEventIds } = adminData;
  
  // SUPER_ADMIN has full access
  if (role === 'SUPER_ADMIN') {
    return { success: true };
  }
  
  // COUNTRY_ADMIN must match country
  if (role === 'COUNTRY_ADMIN') {
    if (!countryId || targetResource.country !== countryId) {
      return {
        success: false,
        error: `Access restricted to country: ${countryId}`,
        code: 403
      };
    }
    return { success: true };
  }
  
  // CITY_ADMIN must match city
  if (role === 'CITY_ADMIN') {
    if (!cityId || targetResource.city !== cityId) {
      return {
        success: false,
        error: `Access restricted to city: ${cityId}`,
        code: 403
      };
    }
    return { success: true };
  }
  
  // EVENT_ADMIN must have event assigned
  if (role === 'EVENT_ADMIN') {
    if (!assignedEventIds || !assignedEventIds.includes(targetResource.eventId)) {
      return {
        success: false,
        error: 'Event not assigned to you',
        code: 403
      };
    }
    return { success: true };
  }
  
  // SUPPORT_ADMIN has limited access
  if (role === 'SUPPORT_ADMIN') {
    // Check if action is in allowed list
    const allowedActions = ['VIEW_USER', 'BAN_USER', 'UNBAN_USER', 'VIEW_REPORT', 'RESOLVE_REPORT'];
    if (!allowedActions.includes(targetResource.action)) {
      return {
        success: false,
        error: 'Support admins cannot perform this action',
        code: 403
      };
    }
    return { success: true };
  }
  
  return {
    success: false,
    error: 'Invalid admin role',
    code: 403
  };
};

module.exports = {
  requireRole,
  requireScope
};
```

### 2. Update Existing Endpoints

**Example: Update `approveBusinessLevelUpgrade`**

```javascript
const { requireRole, requireScope } = require('./authMiddleware');

exports.approveBusinessLevelUpgrade = onRequest({
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
    const { businessId, adminId } = req.body;
    
    if (!businessId || !adminId) {
      res.status(400).json({ 
        success: false, 
        error: 'businessId and adminId required' 
      });
      return;
    }
    
    // NEW: Role check
    const roleCheck = await requireRole([
      'SUPER_ADMIN',
      'COUNTRY_ADMIN',
      'CITY_ADMIN'
    ])(adminId);
    
    if (!roleCheck.success) {
      res.status(roleCheck.code).json({ 
        success: false, 
        error: roleCheck.error 
      });
      return;
    }
    
    // Get business data for scope check
    const businessDoc = await db.collection('users').doc(businessId).get();
    const businessData = businessDoc.data();
    
    // NEW: Scope check
    const scopeCheck = await requireScope(roleCheck.adminData, {
      action: 'APPROVE_LEVEL',
      country: businessData.country,
      city: businessData.city
    });
    
    if (!scopeCheck.success) {
      res.status(scopeCheck.code).json({ 
        success: false, 
        error: scopeCheck.error 
      });
      return;
    }
    
    // Rest of existing logic...
    
    // NEW: Log action
    await db.collection('adminLogs').add({
      adminUserId: roleCheck.adminData.id,
      adminEmail: roleCheck.adminData.email,
      adminRole: roleCheck.adminData.role,
      action: 'APPROVE_LEVEL_UPGRADE',
      targetType: 'BUSINESS',
      targetId: businessId,
      targetEmail: businessData.email,
      details: {
        newLevel: businessData.businessLevel + 1,
        oldLevel: businessData.businessLevel
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('[approveBusinessLevelUpgrade] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
```

---

## 🎨 FRONTEND CHANGES

### 1. New Service: `adminAuthService.ts`

**File:** `services/adminAuthService.ts` (new)

```typescript
import { db } from './AuthContext';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

export interface AdminPermissions {
  role: AdminRole;
  countryId?: string;
  cityId?: string;
  assignedEventIds?: string[];
  permissions?: Record<string, boolean>;
}

export const getAdminPermissions = async (userId: string): Promise<AdminPermissions | null> => {
  try {
    const adminQuery = query(
      collection(db, 'adminUsers'),
      where('userId', '==', userId),
      where('isActive', '==', true),
      limit(1)
    );
    
    const snapshot = await getDocs(adminQuery);
    
    if (snapshot.empty) {
      return null;
    }
    
    const adminData = snapshot.docs[0].data();
    
    return {
      role: adminData.role as AdminRole,
      countryId: adminData.countryId,
      cityId: adminData.cityId,
      assignedEventIds: adminData.assignedEventIds || [],
      permissions: adminData.permissions || {}
    };
  } catch (error) {
    console.error('[getAdminPermissions] Error:', error);
    return null;
  }
};

export const canPerformAction = (
  adminPerms: AdminPermissions,
  action: string,
  targetResource?: any
): boolean => {
  const { role, countryId, cityId, assignedEventIds, permissions } = adminPerms;
  
  // Check permission overrides first
  if (permissions && action in permissions) {
    return permissions[action] === true;
  }
  
  // SUPER_ADMIN can do everything
  if (role === 'SUPER_ADMIN') {
    return true;
  }
  
  // SUPPORT_ADMIN restrictions
  if (role === 'SUPPORT_ADMIN') {
    const supportActions = [
      'VIEW_USERS', 'BAN_USER', 'UNBAN_USER',
      'VIEW_REPORTS', 'RESOLVE_REPORT', 'VIEW_ANALYTICS'
    ];
    return supportActions.includes(action);
  }
  
  // EVENT_ADMIN restrictions
  if (role === 'EVENT_ADMIN') {
    if (!action.includes('EVENT')) {
      return false;
    }
    if (targetResource?.eventId) {
      return assignedEventIds?.includes(targetResource.eventId) || false;
    }
    return true; // Can create new events
  }
  
  // COUNTRY_ADMIN scope check
  if (role === 'COUNTRY_ADMIN' && targetResource?.country) {
    if (targetResource.country !== countryId) {
      return false;
    }
  }
  
  // CITY_ADMIN scope check
  if (role === 'CITY_ADMIN' && targetResource?.city) {
    if (targetResource.city !== cityId) {
      return false;
    }
  }
  
  // Default permissions by role
  const rolePermissions: Record<AdminRole, string[]> = {
    SUPER_ADMIN: ['*'], // All actions
    COUNTRY_ADMIN: [
      'VIEW_USERS', 'BAN_USER', 'UNBAN_USER',
      'APPROVE_LEVEL', 'REJECT_LEVEL', 'VERIFY_BUSINESS',
      'VIEW_SUBSCRIPTIONS', 'RESET_COUNTERS',
      'CREATE_EVENT', 'EDIT_EVENT', 'DELETE_EVENT',
      'VIEW_REPORTS', 'RESOLVE_REPORT', 'DELETE_CONTENT',
      'VIEW_MISSIONS', 'APPROVE_MISSION', 'VIEW_ANALYTICS'
    ],
    CITY_ADMIN: [
      'VIEW_USERS', 'BAN_USER', 'UNBAN_USER',
      'APPROVE_LEVEL', 'REJECT_LEVEL', 'VERIFY_BUSINESS',
      'VIEW_SUBSCRIPTIONS', 'RESET_COUNTERS',
      'CREATE_EVENT', 'EDIT_EVENT', 'DELETE_EVENT',
      'VIEW_REPORTS', 'RESOLVE_REPORT',
      'VIEW_MISSIONS', 'APPROVE_MISSION', 'VIEW_ANALYTICS'
    ],
    EVENT_ADMIN: [
      'CREATE_EVENT', 'EDIT_EVENT', 'DELETE_EVENT', 'VIEW_EVENT_ANALYTICS'
    ],
    SUPPORT_ADMIN: [
      'VIEW_USERS', 'BAN_USER', 'UNBAN_USER',
      'VIEW_REPORTS', 'RESOLVE_REPORT', 'VIEW_ANALYTICS'
    ]
  };
  
  const allowedActions = rolePermissions[role] || [];
  return allowedActions.includes('*') || allowedActions.includes(action);
};
```

### 2. Update AdminDashboard.tsx

```tsx
import { getAdminPermissions, canPerformAction, AdminPermissions } from '../../services/adminAuthService';

export const AdminDashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('approvals');
  const [adminPerms, setAdminPerms] = useState<AdminPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadAdminPermissions();
  }, [userProfile]);
  
  const loadAdminPermissions = async () => {
    if (!userProfile?.uid) return;
    
    const perms = await getAdminPermissions(userProfile.uid);
    
    if (!perms) {
      // Not an admin
      setLoading(false);
      return;
    }
    
    setAdminPerms(perms);
    setLoading(false);
  };
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (!adminPerms) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#1E0E62] mb-2">Access Denied</h2>
          <p className="text-[#8F8FA3]">You must be an administrator to access this page</p>
        </div>
      </div>
    );
  }
  
  // Filter tabs based on permissions
  const availableTabs = tabs.filter(tab => {
    const tabPermissions: Record<AdminTab, string> = {
      'approvals': 'APPROVE_LEVEL',
      'users': 'VIEW_USERS',
      'businesses': 'VIEW_USERS',
      'missions': 'VIEW_MISSIONS',
      'events': 'CREATE_EVENT',
      'subscriptions': 'VIEW_SUBSCRIPTIONS',
      'analytics': 'VIEW_ANALYTICS',
      'settings': 'MODIFY_SETTINGS'
    };
    
    return canPerformAction(adminPerms, tabPermissions[tab.id]);
  });
  
  // Show role badge
  const getRoleBadge = () => {
    const roleColors: Record<AdminRole, string> = {
      SUPER_ADMIN: 'bg-purple-100 text-purple-700',
      COUNTRY_ADMIN: 'bg-blue-100 text-blue-700',
      CITY_ADMIN: 'bg-green-100 text-green-700',
      EVENT_ADMIN: 'bg-orange-100 text-orange-700',
      SUPPORT_ADMIN: 'bg-gray-100 text-gray-700'
    };
    
    return (
      <div className={`px-3 py-1 rounded-full text-xs font-semibold ${roleColors[adminPerms.role]}`}>
        {adminPerms.role.replace('_', ' ')}
        {adminPerms.countryId && ` • ${adminPerms.countryId}`}
        {adminPerms.cityId && ` • ${adminPerms.cityId}`}
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#1E0E62]">Admin Dashboard</h1>
                <p className="text-sm text-[#8F8FA3]">Manage Fluzio platform operations</p>
              </div>
            </div>
            {getRoleBadge()}
          </div>
          
          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto">
            {availableTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-[#8F8FA3] hover:bg-gray-100'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Content with permission checks */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'approvals' && canPerformAction(adminPerms, 'APPROVE_LEVEL') && (
          <BusinessLevelApprovals adminId={userProfile.uid} adminPerms={adminPerms} />
        )}
        
        {activeTab === 'users' && canPerformAction(adminPerms, 'VIEW_USERS') && (
          <AdminUserManagement adminId={userProfile.uid} adminPerms={adminPerms} />
        )}
        
        {/* ... other tabs with permission checks ... */}
      </div>
    </div>
  );
};
```

---

## 🔐 FIRESTORE RULES CHANGES

Update `firestore.rules`:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper: Check if user is any type of admin
    function isAdmin() {
      return isAuthenticated() && 
             exists(/databases/$(database)/documents/adminUsers/$(request.auth.uid));
    }
    
    // Helper: Check if user is super admin
    function isSuperAdmin() {
      return isAuthenticated() &&
             exists(/databases/$(database)/documents/adminUsers/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/adminUsers/$(request.auth.uid)).data.role == 'SUPER_ADMIN' &&
             get(/databases/$(database)/documents/adminUsers/$(request.auth.uid)).data.isActive == true;
    }
    
    // Helper: Check if user has specific admin role
    function hasAdminRole(role) {
      return isAuthenticated() &&
             exists(/databases/$(database)/documents/adminUsers/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/adminUsers/$(request.auth.uid)).data.role == role &&
             get(/databases/$(database)/documents/adminUsers/$(request.auth.uid)).data.isActive == true;
    }
    
    // AdminUsers collection - SUPER_ADMIN only
    match /adminUsers/{adminId} {
      allow read: if isAdmin(); // Admins can see other admins
      allow create: if isSuperAdmin(); // Only super admins can create admins
      allow update: if isSuperAdmin(); // Only super admins can modify admins
      allow delete: if isSuperAdmin(); // Only super admins can delete admins
    }
    
    // AdminLogs collection - Read-only for admins
    match /adminLogs/{logId} {
      allow read: if isAdmin();
      allow write: if false; // Only backend can write
    }
    
    // Level Up Requests - Admins can read/update
    match /levelUpRequests/{requestId} {
      allow read: if isAuthenticated() &&
                     (resource.data.businessId == request.auth.uid || isAdmin());
      allow create: if isAuthenticated() &&
                       request.resource.data.businessId == request.auth.uid;
      allow update: if isAdmin(); // Any admin can approve/reject
      allow delete: if isSuperAdmin();
    }
    
    // Verification Requests - Admins can read/update
    match /verificationRequests/{requestId} {
      allow read: if isAuthenticated() &&
                     (resource.data.userId == request.auth.uid || isAdmin());
      allow create: if isAuthenticated() &&
                       request.resource.data.userId == request.auth.uid;
      allow update: if isAdmin(); // Any admin can approve/reject
      allow delete: if isSuperAdmin();
    }
    
    // Platform Settings - SUPER_ADMIN only
    match /platformSettings/{settingId} {
      allow read: if isAuthenticated();
      allow write: if isSuperAdmin();
    }
    
    // Admin Events - Admins can create/update
    match /adminEvents/{eventId} {
      allow read: if isAuthenticated();
      allow create: if isAdmin(); // Any admin can create
      allow update: if isAdmin(); // Any admin can update
      allow delete: if isSuperAdmin() || 
                       hasAdminRole('COUNTRY_ADMIN') ||
                       hasAdminRole('CITY_ADMIN');
    }
    
    // Content Reports - Admins and support admins can access
    match /content_reports/{reportId} {
      allow create: if isAuthenticated();
      allow read: if isAdmin(); // Any admin can read
      allow update: if isAdmin(); // Any admin can resolve
      allow delete: if isSuperAdmin();
    }
    
    // ... rest of existing rules ...
  }
}
```

---

## 🚀 MIGRATION PLAN

### Phase 1: Schema Setup (Day 1-2)

**Files to Create:**
- `functions/authMiddleware.js` - RBAC middleware
- `services/adminAuthService.ts` - Frontend admin auth
- `scripts/createAdminUsersCollection.js` - Migration script

**Tasks:**
1. ✅ Create `adminUsers` collection structure
2. ✅ Add sample super admin document
3. ✅ Create migration script for existing admins
4. ✅ Test Firestore rules locally

**Checklist:**
```bash
# Create adminUsers collection
- [ ] Run migration script: node scripts/createAdminUsersCollection.js
- [ ] Verify collection created in Firestore
- [ ] Test sample admin user login
```

### Phase 2: Backend Implementation (Day 3-5)

**Files to Modify:**
- `functions/index.js` - Add requireRole/requireScope to endpoints
- `firestore.rules` - Update admin permission checks

**Endpoints to Update (Priority Order):**

**High Priority (8):**
1. ✅ `approveBusinessLevelUpgrade`
2. ✅ `rejectBusinessLevelUpgrade`
3. ✅ `getPendingUpgradeRequests`
4. ✅ `approveVerification`
5. ✅ `rejectVerification`
6. ✅ `setUserBusinessLevel`
7. ✅ `triggerSquadGeneration`
8. ✅ `triggerSubscriptionReset`

**Medium Priority (12):**
9. ✅ Admin event CRUD in components (direct Firestore writes)
10. ✅ User management operations
11. ✅ Business management operations
12. ✅ Mission moderation
13. ✅ Subscription management
14. ✅ Content moderation

**Low Priority (Informational endpoints):**
- Analytics endpoints (read-only)
- Stats endpoints

**Checklist:**
```bash
# Deploy backend changes
- [ ] Add requireRole middleware to functions/authMiddleware.js
- [ ] Update 8 high-priority endpoints
- [ ] Deploy functions: firebase deploy --only functions
- [ ] Update Firestore rules: firebase deploy --only firestore:rules
- [ ] Test each endpoint with different admin roles
```

### Phase 3: Frontend Implementation (Day 6-8)

**Files to Modify:**
- `services/adminAuthService.ts` (new)
- `components/admin/AdminDashboard.tsx`
- `components/admin/AdminUserManagement.tsx`
- `components/admin/AdminBusinessManagement.tsx`
- `components/admin/AdminMissionManagement.tsx`
- `components/admin/AdminEventManagement.tsx`
- `components/admin/AdminSubscriptionManagement.tsx`
- `components/admin/AdminAnalytics.tsx`
- `components/admin/AdminSettings.tsx`
- `components/admin/BusinessLevelApprovals.tsx`
- `components/admin/ContentModerationPanel.tsx`
- `App.tsx` - Update admin check

**Checklist:**
```bash
# Update UI components
- [ ] Create adminAuthService.ts
- [ ] Add role badge to AdminDashboard
- [ ] Filter tabs by permissions
- [ ] Add scope filters to data queries (country/city)
- [ ] Disable actions based on permissions
- [ ] Show permission denied messages
- [ ] Test with different admin roles
```

### Phase 4: Admin Management UI (Day 9-10)

**Files to Create:**
- `components/admin/AdminManagement.tsx` - Manage admin users
- `components/admin/CreateAdminModal.tsx` - Create new admin

**Features:**
- List all admin users
- Create new admin (SUPER_ADMIN only)
- Edit admin scope/permissions
- Deactivate/reactivate admins
- View admin activity logs

**Checklist:**
```bash
# Admin management UI
- [ ] Create AdminManagement component
- [ ] Add to AdminDashboard tabs
- [ ] Implement create admin form
- [ ] Implement edit admin form
- [ ] Add activity log viewer
- [ ] Test create/edit/delete operations
```

### Phase 5: Testing & Documentation (Day 11-12)

**Test Scenarios:**

1. **SUPER_ADMIN Tests**
   - ✅ Can access all tabs
   - ✅ Can approve/reject any request
   - ✅ Can create other admins
   - ✅ Can modify platform settings
   - ✅ Can trigger system operations

2. **COUNTRY_ADMIN Tests (Portugal)**
   - ✅ Can see only Portuguese users/businesses
   - ✅ Can approve level upgrades in Portugal
   - ✅ Cannot approve upgrades in Spain
   - ✅ Can create events in Portugal
   - ✅ Cannot access settings tab

3. **CITY_ADMIN Tests (Lisbon)**
   - ✅ Can see only Lisbon users/businesses
   - ✅ Can approve level upgrades in Lisbon
   - ✅ Cannot approve upgrades in Porto
   - ✅ Cannot modify subscription tiers

4. **EVENT_ADMIN Tests**
   - ✅ Can only see Events tab
   - ✅ Can create new events
   - ✅ Can edit assigned events
   - ✅ Cannot edit unassigned events
   - ✅ Cannot access other tabs

5. **SUPPORT_ADMIN Tests**
   - ✅ Can view users
   - ✅ Can ban/unban users
   - ✅ Can view/resolve reports
   - ✅ Cannot access pricing/subscriptions
   - ✅ Cannot approve level upgrades

**Checklist:**
```bash
# Testing
- [ ] Create test admin users for each role
- [ ] Run all test scenarios above
- [ ] Test permission denials (403 errors)
- [ ] Test scope filtering (country/city)
- [ ] Check admin logs are created correctly
```

---

## 📋 IMPLEMENTATION CHECKLIST

### Backend

**Schema:**
- [ ] Create `adminUsers` collection
- [ ] Add adminProfile to users collection
- [ ] Create enhanced `adminLogs` collection
- [ ] Add country/city to levelUpRequests
- [ ] Add country/city to verificationRequests

**Middleware:**
- [ ] Create `functions/authMiddleware.js`
- [ ] Implement `requireRole()` function
- [ ] Implement `requireScope()` function
- [ ] Add logging to middleware

**Endpoints (Priority Order):**
- [ ] Update `approveBusinessLevelUpgrade`
- [ ] Update `rejectBusinessLevelUpgrade`
- [ ] Update `getPendingUpgradeRequests`
- [ ] Update `approveVerification`
- [ ] Update `rejectVerification`
- [ ] Update `setUserBusinessLevel`
- [ ] Update `triggerSquadGeneration`
- [ ] Update `triggerSubscriptionReset`
- [ ] Update `migrateExistingBusinessesToLevel2`
- [ ] Update `updateSubscriptionLevel`
- [ ] Add scope filtering to all admin queries

**Firestore Rules:**
- [ ] Add `isAdmin()` helper
- [ ] Add `isSuperAdmin()` helper
- [ ] Add `hasAdminRole()` helper
- [ ] Update `adminUsers` rules
- [ ] Update `adminLogs` rules
- [ ] Update `levelUpRequests` rules
- [ ] Update `verificationRequests` rules
- [ ] Update `platformSettings` rules
- [ ] Update `adminEvents` rules
- [ ] Update `content_reports` rules

### Frontend

**Services:**
- [ ] Create `services/adminAuthService.ts`
- [ ] Implement `getAdminPermissions()`
- [ ] Implement `canPerformAction()`
- [ ] Add admin role types to models.ts

**Components:**
- [ ] Update `AdminDashboard.tsx` with role checks
- [ ] Update `AdminUserManagement.tsx` with scope filtering
- [ ] Update `AdminBusinessManagement.tsx` with scope filtering
- [ ] Update `AdminMissionManagement.tsx` with scope filtering
- [ ] Update `AdminEventManagement.tsx` with scope filtering
- [ ] Update `AdminSubscriptionManagement.tsx` with permission checks
- [ ] Update `AdminAnalytics.tsx` with role-based data
- [ ] Update `AdminSettings.tsx` (SUPER_ADMIN only)
- [ ] Update `BusinessLevelApprovals.tsx` with scope filtering
- [ ] Update `ContentModerationPanel.tsx` with scope filtering
- [ ] Create `AdminManagement.tsx` (new tab)
- [ ] Create `CreateAdminModal.tsx`

**App-Level:**
- [ ] Update `App.tsx` admin check to use adminUsers
- [ ] Add admin role badge to UI
- [ ] Show filtered navigation based on role
- [ ] Add permission denied UI states

### Migration

**Scripts:**
- [ ] Create `scripts/createAdminUsersCollection.js`
- [ ] Create `scripts/migrateExistingAdmins.js`
- [ ] Create `scripts/addGeoDataToRequests.js`
- [ ] Create `scripts/testAdminPermissions.js`

**Data:**
- [ ] Migrate existing admin users
- [ ] Add country/city to all users
- [ ] Add country/city to existing requests
- [ ] Create test admin users

### Testing

**Unit Tests:**
- [ ] Test `requireRole()` function
- [ ] Test `requireScope()` function
- [ ] Test `canPerformAction()` function
- [ ] Test Firestore rule helpers

**Integration Tests:**
- [ ] Test endpoint access with different roles
- [ ] Test scope filtering (country/city)
- [ ] Test event assignment (EVENT_ADMIN)
- [ ] Test permission overrides

**E2E Tests:**
- [ ] Test SUPER_ADMIN full access
- [ ] Test COUNTRY_ADMIN scope restrictions
- [ ] Test CITY_ADMIN scope restrictions
- [ ] Test EVENT_ADMIN event-only access
- [ ] Test SUPPORT_ADMIN limited access

### Documentation

- [ ] Update ADMIN_ACCESS_GUIDE.md with new roles
- [ ] Create RBAC_ADMIN_GUIDE.md for new admins
- [ ] Document permission matrix
- [ ] Document scope rules
- [ ] Add troubleshooting section
- [ ] Create video walkthrough

---

## 📁 FILES TO CREATE/MODIFY

### New Files (5)
```
functions/authMiddleware.js
services/adminAuthService.ts
components/admin/AdminManagement.tsx
components/admin/CreateAdminModal.tsx
scripts/createAdminUsersCollection.js
```

### Files to Modify (18)
```
functions/index.js (55 endpoints)
firestore.rules
src/types/models.ts
App.tsx
components/admin/AdminDashboard.tsx
components/admin/AdminUserManagement.tsx
components/admin/AdminBusinessManagement.tsx
components/admin/AdminMissionManagement.tsx
components/admin/AdminEventManagement.tsx
components/admin/AdminSubscriptionManagement.tsx
components/admin/AdminAnalytics.tsx
components/admin/AdminSettings.tsx
components/admin/BusinessLevelApprovals.tsx
components/admin/UserManagementPanel.tsx
components/admin/ContentModerationPanel.tsx
services/adminService.ts
services/adminAnalyticsService.ts
ADMIN_ACCESS_GUIDE.md
```

---

## ⏱️ ESTIMATED TIMELINE

**Total: 12 days (2 weeks)**

| Phase | Days | Tasks |
|-------|------|-------|
| Phase 1: Schema Setup | 2 | Collections, migration scripts |
| Phase 2: Backend Implementation | 3 | Middleware, endpoint updates, Firestore rules |
| Phase 3: Frontend Implementation | 3 | UI updates, permission checks, filtering |
| Phase 4: Admin Management UI | 2 | Admin CRUD interface |
| Phase 5: Testing & Documentation | 2 | End-to-end tests, docs |

**Next Steps:**
1. Review and approve this plan
2. Create branch: `feature/rbac-implementation`
3. Start with Phase 1: Schema Setup
4. Daily progress updates

---

## 🎯 SUCCESS CRITERIA

✅ **Backend:**
- All 55 endpoints have role verification
- Geographic scope filtering works
- Admin logs capture all actions
- Firestore rules enforce RBAC

✅ **Frontend:**
- Tabs filtered by role permissions
- Actions disabled based on scope
- Clear permission denied messages
- Role badge shows current permissions

✅ **Testing:**
- All 5 admin roles tested
- Scope restrictions verified
- Permission overrides work
- No security vulnerabilities

✅ **Documentation:**
- Complete RBAC guide
- Permission matrix documented
- Migration runbook ready
- Troubleshooting guide complete

---

Ready to proceed? Let me know if you want to:
1. Start implementing (I'll begin with Phase 1)
2. Modify the plan (adjust roles, permissions, timeline)
3. Add more detail to specific sections
