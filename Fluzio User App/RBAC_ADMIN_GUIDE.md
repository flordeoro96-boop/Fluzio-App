# Fluzio RBAC Admin System Guide

## 📚 Table of Contents

1. [Overview](#overview)
2. [Admin Roles](#admin-roles)
3. [Getting Started](#getting-started)
4. [Admin Dashboard](#admin-dashboard)
5. [Managing Admin Users](#managing-admin-users)
6. [Permission Matrix](#permission-matrix)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

Fluzio's Role-Based Access Control (RBAC) system provides secure, hierarchical administrative access to the platform. The system supports 5 admin roles with varying levels of permissions and geographic scoping.

### Key Features

- **5 Admin Roles** with hierarchical permissions
- **Geographic Scoping** (Country/City level)
- **Event Assignment** for event-specific admins
- **Comprehensive Audit Trail** of all admin actions
- **Permission-Based UI** that adapts to admin role
- **Granular Permission Overrides** (optional)

---

## 👥 Admin Roles

### 1. SUPER_ADMIN 🔴
**Access Level:** Global (All Data)

**Capabilities:**
- ✅ Full platform access across all countries/cities
- ✅ Manage all admin users (create, edit, delete)
- ✅ View activity logs
- ✅ Access platform settings
- ✅ Override subscription levels
- ✅ Trigger system operations (squad generation, resets)
- ✅ Manage all businesses, users, missions, events
- ✅ Access all analytics data

**Use Cases:**
- Platform owner
- CTO/Technical lead
- Head of operations

---

### 2. COUNTRY_ADMIN 🟠
**Access Level:** Country-Scoped

**Capabilities:**
- ✅ Manage users within assigned country
- ✅ Approve/reject business verifications (country scope)
- ✅ Approve/reject level upgrades (country scope)
- ✅ Manage businesses in assigned country
- ✅ Manage missions in assigned country
- ✅ Manage events in assigned country
- ✅ View analytics for assigned country
- ❌ Cannot manage admin users
- ❌ Cannot access platform settings
- ❌ Cannot trigger system operations

**Use Cases:**
- Country manager
- Regional operations lead
- National coordinator

**Configuration:**
```javascript
{
  role: 'COUNTRY_ADMIN',
  countryId: 'US' // ISO country code
}
```

---

### 3. CITY_ADMIN 🟡
**Access Level:** City-Scoped

**Capabilities:**
- ✅ Manage users within assigned city
- ✅ Approve/reject business verifications (city scope)
- ✅ Approve/reject level upgrades (city scope)
- ✅ Manage businesses in assigned city
- ✅ Manage missions in assigned city
- ✅ Manage events in assigned city
- ✅ View analytics for assigned city
- ❌ Cannot manage admin users
- ❌ Cannot access platform settings
- ❌ Cannot trigger system operations

**Use Cases:**
- City manager
- Local operations coordinator
- Community lead

**Configuration:**
```javascript
{
  role: 'CITY_ADMIN',
  countryId: 'US',
  cityId: 'New York'
}
```

---

### 4. EVENT_ADMIN 🟢
**Access Level:** Event-Scoped

**Capabilities:**
- ✅ Manage assigned events only
- ✅ View event registrations
- ✅ Edit event details
- ❌ Cannot create new events
- ❌ Cannot manage users/businesses
- ❌ Cannot access analytics
- ❌ Limited to specific events

**Use Cases:**
- Event coordinator
- Workshop facilitator
- Conference organizer

**Configuration:**
```javascript
{
  role: 'EVENT_ADMIN',
  assignedEventIds: ['event1', 'event2', 'event3']
}
```

---

### 5. SUPPORT_ADMIN 🔵
**Access Level:** Limited (Support Operations Only)

**Capabilities:**
- ✅ View user profiles
- ✅ View business information
- ✅ View missions (read-only)
- ❌ Cannot approve/reject verifications
- ❌ Cannot manage admin users
- ❌ Cannot modify subscriptions
- ❌ Read-only access to most data

**Use Cases:**
- Customer support agent
- Help desk operator
- Community moderator

---

## 🚀 Getting Started

### Step 1: Access Admin Dashboard

1. Log in to Fluzio with your admin account
2. Navigate to the Admin Dashboard (URL: `/admin`)
3. You'll see your role badge in the top-right corner

### Step 2: Verify Your Permissions

Your dashboard will only show tabs you have permission to access:

**Super Admin sees:**
- Level Approvals
- Users
- Businesses
- Missions
- Events
- Subscriptions
- Analytics
- Admin Users ⭐ (Super Admin only)
- Settings ⭐ (Super Admin only)

**Country/City Admin sees:**
- Level Approvals
- Users
- Businesses
- Missions
- Events
- Analytics
(All filtered to their geographic scope)

**Event Admin sees:**
- Events (assigned events only)

**Support Admin sees:**
- Users (read-only)
- Businesses (read-only)

### Step 3: Understanding Your Scope

Look at the scope description under your email:
- **"Global Access"** - Super Admin (all data)
- **"Country: US"** - Country Admin (US data only)
- **"City: New York, US"** - City Admin (New York data only)
- **"3 Assigned Events"** - Event Admin (specific events)
- **"Limited Support Access"** - Support Admin (read-only)

---

## 🎛️ Admin Dashboard

### Dashboard Features

#### 1. **Level Approvals Tab**
- View pending business level upgrade requests
- Approve or reject with notes
- Filtered by your geographic scope
- Sends notifications to businesses

**Actions:**
- **Approve**: Upgrades business level, sends congratulations notification
- **Reject**: Declines request with reason, sends feedback notification

#### 2. **Users Tab**
- Search and filter all users
- View user profiles
- Ban/unban users (SUPER/COUNTRY/CITY admins)
- Filter by role (CUSTOMER/BUSINESS)
- Geographic scope automatically applied

#### 3. **Businesses Tab**
- Manage business accounts
- View verification requests
- Approve/reject verifications
- Update business levels
- Geographic scope automatically applied

#### 4. **Missions Tab**
- View all missions
- Filter by status
- Delete missions (with confirmation)
- Geographic scope automatically applied

#### 5. **Events Tab**
- Create/edit/delete events
- Manage event registrations
- EVENT_ADMIN: See only assigned events
- Others: See events in geographic scope

#### 6. **Subscriptions Tab**
- View Level 1 and Level 2 subscriptions
- Monitor usage metrics
- Edit subscription tiers (Super Admin only)
- Reset monthly counters

#### 7. **Analytics Tab**
- Platform-wide statistics
- User growth metrics
- Mission completion rates
- Geographic scope automatically applied to metrics

#### 8. **Admin Users Tab** ⭐ (Super Admin Only)
- Create new admin users
- Edit admin roles and scopes
- Activate/deactivate admins
- View activity logs
- Search and filter admins

#### 9. **Settings Tab** ⭐ (Super Admin Only)
- Platform settings
- Maintenance mode
- Feature toggles
- Default values

---

## 👤 Managing Admin Users

### Creating a New Admin

**Requirements:**
- Must be Super Admin
- Need user's Firebase UID
- Need user's email address

**Steps:**

1. Navigate to **Admin Users** tab
2. Click **"Add Admin"** button
3. Fill in the form:

```
User ID (Firebase UID): abc123xyz456...
Email: admin@example.com
Admin Role: [Select Role]
Country Code: US (if COUNTRY_ADMIN or CITY_ADMIN)
City Name: New York (if CITY_ADMIN)
Notes: Optional description
```

4. Click **"Create Admin"**
5. User can now log in with admin access

### Editing an Admin

1. Find admin in the list
2. Click **Edit** icon (pencil)
3. Modify role, scope, or notes
4. Click **"Update Admin"**

### Deactivating an Admin

1. Find admin in the list
2. Click **Toggle Active** icon (checkmark/X)
3. Confirm action
4. Admin loses access immediately

### Deleting an Admin

1. Find admin in the list
2. Click **Delete** icon (trash)
3. Type **"DELETE"** to confirm
4. Admin is permanently removed

**⚠️ Warning:** Cannot delete your own admin account

### Viewing Activity Logs

1. Click **"View Activity Logs"** button
2. See recent admin actions:
   - Who performed the action
   - What action was performed
   - Target user/business/mission
   - Timestamp
3. Last 100 actions shown

**Log Entry Example:**
```
SUPER_ADMIN | admin@fluzio.com performed APPROVE_LEVEL_UPGRADE
Target: business@example.com
Details: Level 2.1 → Level 3.1
Time: Dec 18, 2025 10:30 AM
```

---

## 📋 Permission Matrix

### Actions by Role

| Action | Super Admin | Country Admin | City Admin | Event Admin | Support Admin |
|--------|-------------|---------------|------------|-------------|---------------|
| **User Management** |
| View Users | ✅ Global | ✅ Country | ✅ City | ❌ | ✅ Read-only |
| Ban Users | ✅ | ✅ | ✅ | ❌ | ❌ |
| Delete Users | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Business Management** |
| View Businesses | ✅ Global | ✅ Country | ✅ City | ❌ | ✅ Read-only |
| Approve Verification | ✅ | ✅ | ✅ | ❌ | ❌ |
| Set Business Level | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Mission Management** |
| View Missions | ✅ Global | ✅ Country | ✅ City | ❌ | ✅ Read-only |
| Delete Missions | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Event Management** |
| View Events | ✅ Global | ✅ Country | ✅ City | ✅ Assigned | ❌ |
| Create Events | ✅ | ✅ | ✅ | ❌ | ❌ |
| Edit Events | ✅ | ✅ | ✅ | ✅ Assigned | ❌ |
| Delete Events | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Subscriptions** |
| View Subscriptions | ✅ | ✅ | ✅ | ❌ | ❌ |
| Edit Tiers | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Analytics** |
| View Analytics | ✅ Global | ✅ Country | ✅ City | ❌ | ❌ |
| **Admin Management** |
| Manage Admins | ✅ | ❌ | ❌ | ❌ | ❌ |
| View Logs | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Platform Settings** |
| Platform Settings | ✅ | ❌ | ❌ | ❌ | ❌ |
| System Operations | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## ✅ Best Practices

### Security

1. **Principle of Least Privilege**
   - Assign the minimum role necessary
   - Use City Admin instead of Country Admin when possible
   - Use Event Admin for event-specific staff

2. **Regular Audits**
   - Review admin list monthly
   - Deactivate unused accounts
   - Check activity logs for suspicious actions

3. **Scope Assignment**
   - Always assign geographic scope for Country/City admins
   - Verify scope matches admin's responsibilities
   - Update scopes when admin changes location

### Operational

1. **Admin Onboarding**
   - Create admin account with appropriate role
   - Send welcome email with access instructions
   - Provide this guide for reference
   - Schedule training session

2. **Role Assignment**
   - **Super Admin**: Platform owners, CTO (limit to 2-3)
   - **Country Admin**: 1-2 per major country
   - **City Admin**: 1 per major city
   - **Event Admin**: Per event as needed
   - **Support Admin**: Customer support team

3. **Documentation**
   - Document why each admin was created (use Notes field)
   - Keep track of admin responsibilities
   - Update when roles change

### Communication

1. **Notify Users**
   - Always add notes when approving/rejecting
   - Be specific about rejection reasons
   - Use professional, helpful language

2. **Internal Communication**
   - Use Activity Logs to coordinate between admins
   - Document major actions in admin notes
   - Communicate scope changes to affected admins

---

## 🔧 Troubleshooting

### Common Issues

#### 1. "Access Denied" when opening Admin Dashboard

**Cause:** User is not in adminUsers collection

**Solution:**
1. Ask Super Admin to add you via Admin Users tab
2. Provide your Firebase UID and email
3. Wait for account creation
4. Refresh page and log in again

#### 2. Cannot see certain tabs

**Cause:** Your role doesn't have permission

**Solution:**
- Check your role badge (top-right)
- Verify with Super Admin if you need different role
- This is expected behavior for scoped admins

#### 3. Can't see data in tabs

**Cause:** Geographic scope filtering

**Solution:**
- Verify your scope (shown under email in header)
- Data outside your scope is intentionally hidden
- Contact Super Admin if scope needs adjustment

#### 4. Action fails with "Permission denied"

**Cause:** Backend permission check failed

**Solution:**
1. Check if action is within your scope
2. Verify your admin account is active
3. Check browser console for error details
4. Contact Super Admin if permissions need update

#### 5. Can't create admin user

**Cause:** Must be Super Admin

**Solution:**
- Only Super Admins can manage other admins
- Request Super Admin to create the account
- Provide required information (UID, email, desired role)

#### 6. Admin users tab missing

**Cause:** Not a Super Admin

**Solution:**
- Admin Users tab only visible to Super Admins
- This is by design for security
- Contact Super Admin for admin user management

---

## 🎓 Training Checklist

### New Admin Onboarding

**Week 1: Basics**
- [ ] Read this guide completely
- [ ] Log in and verify access
- [ ] Explore assigned tabs
- [ ] Understand your role and scope
- [ ] Practice searching and filtering

**Week 2: Core Operations**
- [ ] Approve/reject sample requests
- [ ] Manage users in your scope
- [ ] Create/edit events (if applicable)
- [ ] Run analytics reports
- [ ] Practice common workflows

**Week 3: Advanced**
- [ ] Handle edge cases
- [ ] Coordinate with other admins
- [ ] Use activity logs for tracking
- [ ] Optimize workflow efficiency
- [ ] Document learnings

---

## 📞 Support

### For Admin Access Issues
- Contact: Super Admin Team
- Email: admin@fluzio.com
- Provide: Your UID, email, and role needed

### For Technical Issues
- Check browser console for errors
- Include error message and steps to reproduce
- Screenshot of issue helpful

### For Permission Questions
- Refer to Permission Matrix above
- Contact Super Admin if matrix unclear
- Document use case for review

---

## 🔄 System Architecture

### How RBAC Works

```
User Login → Check adminUsers Collection
    ↓
Load Admin Role & Scope
    ↓
Filter Dashboard Tabs (canPerformAction)
    ↓
User Clicks Tab → Load Component
    ↓
Apply Geographic Filtering (filterByScope)
    ↓
Display Scoped Data
    ↓
User Performs Action → API Call
    ↓
Backend: requireRole() Check
    ↓
Backend: requireScope() Check
    ↓
Action Executes
    ↓
logAdminAction() to adminLogs
```

### Firestore Collections

1. **adminUsers** - Admin user definitions
   - Contains: userId, email, role, scope, permissions
   - Access: Super Admin only

2. **adminLogs** - Activity audit trail
   - Contains: action, admin, target, timestamp, details
   - Access: Read by admins, write by backend only

### Security Rules

- Frontend: UI filtering only (can be bypassed)
- Backend: Hard enforcement via middleware
- Firestore: Rules enforce document-level access
- Triple-layer security model

---

## 📈 Future Enhancements

**Planned Features:**
- Email notifications for admin actions
- Advanced reporting dashboard
- Permission override system
- Multi-factor authentication for admins
- Admin activity analytics
- Bulk operations support
- Export/import admin configurations

---

## 📝 Version History

**v1.0** (Dec 18, 2025)
- Initial RBAC implementation
- 5 admin roles with scoping
- Complete UI with Admin Management
- 11 protected backend endpoints
- Comprehensive audit logging

---

## 📄 Quick Reference Card

### Role Selection Guide

**Choose SUPER_ADMIN when:**
- Platform owner or CTO
- Need to manage other admins
- Need access to platform settings
- Require global visibility

**Choose COUNTRY_ADMIN when:**
- Managing a specific country
- Need country-wide operations
- Regional leadership role

**Choose CITY_ADMIN when:**
- Managing a specific city
- Local operations focus
- Community management role

**Choose EVENT_ADMIN when:**
- Managing specific events only
- Event coordination role
- Limited scope needed

**Choose SUPPORT_ADMIN when:**
- Customer support role
- Need read-only access
- Help desk operations

---

*Last Updated: December 18, 2025*
*Fluzio RBAC System v1.0*
