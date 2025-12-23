# Scope Filtering and Audit Logging Implementation

## Overview

This document describes the comprehensive scope filtering and enhanced audit logging system implemented as part of the Fluzio RBAC (Role-Based Access Control) system.

## 🎯 Objectives

1. **Scope Filtering**: Ensure admins can only access data within their assigned geographic or event scope
2. **Enhanced Audit Logging**: Track all admin actions with before/after state, IP addresses, and metadata
3. **Audit UI**: Provide a searchable, filterable interface for viewing audit logs

## 📋 Implementation Components

### 1. Backend Middleware (functions/authMiddleware.js)

#### New Functions Added:

**applyScopeFilter(query, adminData, options)**
- Automatically filters Firestore queries based on admin scope
- Applies country/city/event filters at the query level
- Returns modified query that only fetches authorized data

```javascript
const applyScopeFilter = (query, adminData, options = {}) => {
  if (adminData.role === 'SUPER_ADMIN') return query;
  
  if (adminData.role === 'COUNTRY_ADMIN' && adminData.countryId) {
    return query.where('country', '==', adminData.countryId);
  }
  
  if (adminData.role === 'CITY_ADMIN' && adminData.cityId) {
    return query.where('city', '==', adminData.cityId);
  }
  
  // ... EVENT_ADMIN and SUPPORT_ADMIN handling
};
```

**filterByAdminScope(entities, adminData, options)**
- Post-query filtering for already-fetched data
- Used when data is retrieved in bulk and needs client-side filtering
- Returns filtered array

```javascript
const filterByAdminScope = (entities, adminData, options = {}) => {
  if (adminData.role === 'SUPER_ADMIN') return entities;
  
  if (adminData.role === 'COUNTRY_ADMIN') {
    return entities.filter(e => e.country === adminData.countryId);
  }
  
  // ... other role filtering
};
```

**logAdminActionEnhanced(adminData, action, entityType, entityId, details, request)**
- Comprehensive audit logging with metadata
- Captures before/after state
- Records IP address and user agent
- Stores structured change data

```javascript
await logAdminActionEnhanced(
  adminData,
  'APPROVE_LEVEL_UPGRADE',
  'business',
  businessId,
  {
    before: { businessLevel: 1, upgradeRequested: true },
    after: { businessLevel: 2, upgradeRequested: false },
    changes: { businessLevel: '1 → 2' },
    notes: 'Upgraded from Level 1 to Level 2'
  },
  req
);
```

**canAccessEntity(adminData, entity)**
- Validates if admin can access a specific entity
- Used for authorization checks before mutations
- Returns boolean

### 2. Frontend Components

#### AdminAuditLog Component (components/admin/AdminAuditLog.tsx)

**Features:**
- ✅ Real-time audit log display
- ✅ Filterable by action type, entity type, admin, date range
- ✅ Expandable log details with before/after diff
- ✅ CSV export functionality
- ✅ Scope-filtered (non-super admins see only their logs)
- ✅ Responsive design

**Key Capabilities:**
```typescript
// Filter logs by multiple criteria
<select value={filterAction} onChange={e => setFilterAction(e.target.value)}>
  <option value="all">All Actions</option>
  <option value="create">Create</option>
  <option value="update">Update</option>
  <option value="approve">Approve</option>
  // ...
</select>

// Show diff between before/after states
const renderDiff = (before: any, after: any) => {
  const changes = [];
  allKeys.forEach(key => {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      changes.push({ field: key, before: before[key], after: after[key] });
    }
  });
  // Render table with changes
};
```

#### useAdminAuth Hook (hooks/useAdminAuth.ts)

**Purpose:**
- Centralized admin authentication state
- Permission checking helpers
- Scope validation utilities

**Usage:**
```typescript
const { adminData, loading, isAdmin, hasPermission, checkScope } = useAdminAuth();

// Check if can perform action
if (hasPermission('VIEW_AUDIT_LOGS')) {
  // Show audit logs tab
}

// Check if resource is in scope
if (checkScope(business)) {
  // Allow access to business
}
```

### 3. Database Schema

#### adminLogs Collection

```javascript
{
  // Admin identification
  adminUserId: string,
  adminEmail: string,
  adminRole: 'SUPER_ADMIN' | 'COUNTRY_ADMIN' | 'CITY_ADMIN' | 'EVENT_ADMIN' | 'SUPPORT_ADMIN',
  
  // Action details
  action: string, // e.g., 'APPROVE_LEVEL_UPGRADE', 'UPDATE_USER', 'DELETE_MISSION'
  entityType: string, // e.g., 'business', 'user', 'mission', 'event'
  entityId: string,
  
  // Change tracking
  before: object, // State before action
  after: object, // State after action
  changes: object, // Structured summary of changes
  
  // Context
  reason: string | null,
  notes: string | null,
  
  // Request metadata
  ipAddress: string | null,
  userAgent: string | null,
  
  // Timestamps
  timestamp: Timestamp,
  createdAt: string
}
```

## 🔒 Scope Filtering Rules

### Role-Based Filtering

| Admin Role | Can Access |
|-----------|-----------|
| **SUPER_ADMIN** | All data globally |
| **COUNTRY_ADMIN** | Data where `country === adminData.countryId` |
| **CITY_ADMIN** | Data where `city === adminData.cityId` |
| **EVENT_ADMIN** | Events where `eventId` in `adminData.assignedEventIds` |
| **SUPPORT_ADMIN** | Only entities they've been explicitly assigned to handle |

### Implementation Pattern

**For Query Endpoints:**
```javascript
// 1. Check admin role
const roleCheck = await requireRole(['SUPER_ADMIN', 'COUNTRY_ADMIN', 'CITY_ADMIN'])(adminId);

// 2. Apply scope filter to query
let query = db.collection('businesses');
query = applyScopeFilter(query, roleCheck.adminData, { entityType: 'business' });

// 3. Execute query (automatically filtered)
const snapshot = await query.get();
```

**For Mutation Endpoints:**
```javascript
// 1. Check admin role
const roleCheck = await requireRole([...])(adminId);

// 2. Fetch entity
const entity = await db.collection('businesses').doc(businessId).get();
const data = entity.data();

// 3. Check scope before mutation
const scopeCheck = await requireScope(roleCheck.adminData, {
  action: 'UPDATE_BUSINESS',
  country: data.country,
  city: data.city
});

if (!scopeCheck.success) {
  return res.status(403).json({ error: 'Out of scope' });
}

// 4. Perform mutation with enhanced logging
const beforeState = { ...data };
await entity.ref.update(updates);
const afterState = { ...data, ...updates };

await logAdminActionEnhanced(roleCheck.adminData, 'UPDATE_BUSINESS', 'business', businessId, {
  before: beforeState,
  after: afterState,
  changes: computeChanges(beforeState, afterState)
}, req);
```

## 📊 Audit Log Actions

### Standard Actions

| Action | Description | Example Usage |
|--------|-------------|---------------|
| `APPROVE_LEVEL_UPGRADE` | Approve business level upgrade | Business approved from Level 1 to Level 2 |
| `REJECT_LEVEL_UPGRADE` | Reject business level upgrade | Upgrade request denied with reason |
| `CREATE_USER` | Create new user | Admin created test account |
| `UPDATE_USER` | Update user profile | Changed user email or phone |
| `BAN_USER` | Ban user account | Banned for ToS violation |
| `UNBAN_USER` | Unban user account | Ban lifted after appeal |
| `CREATE_MISSION` | Create new mission | New mission for local restaurant |
| `UPDATE_MISSION` | Update mission | Changed reward points |
| `DELETE_MISSION` | Delete mission | Removed expired mission |
| `APPROVE_VERIFICATION` | Approve business verification | Verified business identity |
| `REJECT_VERIFICATION` | Reject business verification | Verification documents insufficient |
| `CREATE_EVENT` | Create new event | Created monthly leaderboard event |
| `ASSIGN_ADMIN` | Assign admin to scope | Assigned city admin to Miami |
| `REVOKE_ADMIN` | Remove admin access | Revoked admin privileges |

## 🎨 UI Features

### Audit Log Screen

**Location:** Admin Dashboard > Audit Logs tab

**Features:**
1. **Filter Bar**
   - Action type dropdown
   - Entity type dropdown
   - Date range selector (7d, 30d, 90d, all)
   - Result limit (50, 100, 250, 500)

2. **Log List**
   - Color-coded action badges
   - Admin email and role
   - Timestamp
   - Click to expand details

3. **Expanded View**
   - Full admin info (ID, email, role)
   - IP address and user agent
   - Reason and notes
   - Before/after diff table
   - Structured changes view

4. **Export**
   - Export to CSV
   - Includes all visible columns
   - Filename: `audit-logs-YYYY-MM-DD.csv`

### Permission Requirements

| Role | Can View Logs |
|------|--------------|
| **SUPER_ADMIN** | All logs globally |
| **COUNTRY_ADMIN** | All logs for their country |
| **CITY_ADMIN** | All logs for their city |
| **EVENT_ADMIN** | Logs for assigned events |
| **SUPPORT_ADMIN** | Only their own logs |

## 🔧 Configuration

### Enable Audit Logging for Endpoint

```javascript
// At the start of the function file
const { logAdminActionEnhanced } = require('./authMiddleware');

// After performing the mutation
await logAdminActionEnhanced(
  adminData,        // From requireRole() result
  'ACTION_NAME',    // Descriptive action name
  'entityType',     // e.g., 'business', 'user', 'mission'
  entityId,         // ID of affected entity
  {
    before: originalState,
    after: newState,
    changes: { field: 'old → new' },
    reason: userProvidedReason,  // Optional
    notes: 'Additional context'   // Optional
  },
  req               // HTTP request object
);
```

### Add Scope Filtering to Query Endpoint

```javascript
// Import the function
const { applyScopeFilter } = require('./authMiddleware');

// Build base query
let query = db.collection('entities');

// Apply scope filter
query = applyScopeFilter(query, adminData, { 
  entityType: 'business'  // or 'event', 'user', etc.
});

// Execute filtered query
const snapshot = await query.get();
```

## 📈 Testing

### Test Scope Filtering

**Test Case 1: City Admin Cannot Access Other Cities**
```javascript
// Setup: Create City Admin for Miami
// Action: Try to access business in New York
// Expected: 403 Forbidden or filtered out of results
```

**Test Case 2: Country Admin Can Access All Cities in Country**
```javascript
// Setup: Create Country Admin for USA
// Action: Access businesses in Miami, New York, LA
// Expected: All accessible
```

**Test Case 3: Event Admin Restricted to Assigned Events**
```javascript
// Setup: Assign Event Admin to Event #1
// Action: Try to modify Event #2
// Expected: 403 Forbidden
```

### Test Audit Logging

**Test Case 1: Before/After Captured Correctly**
```javascript
// Action: Update user email
// Verify: Log shows before: 'old@email.com', after: 'new@email.com'
```

**Test Case 2: IP and User Agent Logged**
```javascript
// Action: Perform any admin action
// Verify: Log contains req.ip and req.headers['user-agent']
```

**Test Case 3: Log Filtering Works**
```javascript
// Setup: Create multiple logs with different actions
// Action: Filter by action type
// Verify: Only matching logs shown
```

## 🚀 Deployment

### Files Modified
- ✅ `functions/authMiddleware.js` - Added 4 new functions
- ✅ `functions/index.js` - Updated 2 endpoints with enhanced logging
- ✅ `components/admin/AdminDashboard.tsx` - Added Audit Logs tab
- ✅ `components/admin/AdminAuditLog.tsx` - New component (480 lines)
- ✅ `components/admin/AdminAuditLog.css` - New stylesheet (350 lines)
- ✅ `hooks/useAdminAuth.ts` - New hook for admin auth state
- ✅ `services/adminAuthService.ts` - Added VIEW_AUDIT_LOGS permission

### Deployment Steps
```bash
# 1. Build frontend
npm run build

# 2. Deploy functions
firebase deploy --only functions:approveBusinessLevelUpgrade,functions:rejectBusinessLevelUpgrade

# 3. Deploy hosting
firebase deploy --only hosting

# 4. Verify in production
# - Login as Super Admin
# - Navigate to Audit Logs tab
# - Perform action and verify log appears
```

## 📝 Future Enhancements

### Phase 8 (Recommended)
1. **Automatic Anomaly Detection**
   - Flag suspicious patterns (e.g., 50 approvals in 1 minute)
   - Alert Super Admins to unusual activity

2. **Advanced Filtering**
   - Filter by IP address range
   - Filter by specific admin user
   - Full-text search in notes/reasons

3. **Retention Policies**
   - Archive logs older than 2 years
   - Compress old logs for storage efficiency

4. **Compliance Reports**
   - Generate monthly admin activity reports
   - Export logs for external compliance tools
   - GDPR data export for specific users

5. **Real-time Notifications**
   - Notify Super Admins of critical actions
   - Email digest of daily admin activities

## ✅ Current Status

**Completed:**
- ✅ Backend scope filtering functions
- ✅ Enhanced audit logging with metadata
- ✅ AdminAuditLog UI component
- ✅ useAdminAuth hook
- ✅ Integrated into AdminDashboard
- ✅ Updated 2 critical endpoints as examples
- ✅ Permission system updated

**In Progress:**
- ⏳ Updating remaining 57 endpoints with scope filtering
- ⏳ Testing all role/scope combinations
- ⏳ Locking down Firestore rules

**Next Steps:**
1. Systematically update all query endpoints (getPendingRequests, getUsers, getBusinesses, etc.)
2. Add scope filtering to all mutation endpoints
3. Test with all 5 admin roles
4. Lock down Firestore adminUsers collection rules
5. Deploy to production

## 📞 Support

For questions or issues with scope filtering or audit logging:
- Check logs in Admin Dashboard > Audit Logs
- Verify admin permissions in adminUsers collection
- Review console logs for detailed error messages
- Contact Super Admin for permission issues
