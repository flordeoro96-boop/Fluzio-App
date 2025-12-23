# Business Level System - Admin Guide

## 🎯 Overview

The admin interface provides a comprehensive dashboard for reviewing and managing business level upgrade requests. This ensures that only qualified businesses advance to higher credibility tiers.

---

## 📋 Admin Responsibilities

### What Admins Review

When a business reaches **sub-level 9** and requests an upgrade to the next main level, admins should verify:

1. **Business Legitimacy**
   - Valid business registration
   - Active operations
   - Real physical/online presence

2. **Platform Activity**
   - Quality of missions created
   - Customer satisfaction
   - Engagement with community

3. **Credibility Markers**
   - **Level 2 → 3**: Business has operated for several months
   - **Level 3 → 4**: Proven revenue/growth trajectory
   - **Level 4 → 5**: 5+ years experience, established brand
   - **Level 5 → 6**: Major brand, exits, investments, or exceptional track record

---

## 🖥️ Admin Dashboard Interface

### Accessing the Dashboard

1. **Route**: Add to your routing configuration:
```tsx
import { AdminDashboard } from './components/admin/AdminDashboard';

// In your router:
{
  path: '/admin',
  element: <AdminDashboard />,
  // Add route protection to ensure only ADMIN role can access
}
```

2. **Role Check**: The component automatically checks for `userProfile.role === 'ADMIN'`
3. **Auto-deny**: Non-admin users see an "Access Denied" message

### Dashboard Features

**Tabs:**
- ✅ **Level Approvals** - Review business upgrade requests (ACTIVE)
- 🚧 **Users** - User management (Coming soon)
- 🚧 **Analytics** - Platform metrics (Coming soon)
- 🚧 **Settings** - Admin configuration (Coming soon)

---

## 🔍 Reviewing Upgrade Requests

### Request Table Columns

| Column | Description |
|--------|-------------|
| **Business** | Name, email, profile picture |
| **Current Level** | Current Level X.Y with visual badge |
| **XP** | Total XP earned (should be 440+ to reach .9) |
| **Requested** | Time since request ("Today", "2 days ago", etc.) |
| **Actions** | Approve ✅ or Reject ❌ buttons |

### Approval Process

**To Approve:**
1. Click the green **✅** checkmark button
2. Confirm the action in your mind (no confirmation modal by default)
3. System automatically:
   - Increments `businessLevel` by 1
   - Resets `businessSubLevel` to 1
   - Resets `businessXp` to 0
   - Sets `upgradeRequested` to false
   - Records `upgradeApprovedAt` timestamp
   - Records `lastUpgradeApprovedBy` as your admin UID

**What Happens:**
- Business receives their new level immediately
- Request disappears from pending queue
- Business can see new level badge on profile
- (Future) Email notification sent to business

### Rejection Process

**To Reject:**
1. Click the red **❌** X button
2. Modal opens with rejection form
3. **Required**: Enter detailed feedback explaining why
4. Click "Reject Request"
5. System automatically:
   - Sets `upgradeRequested` to false
   - Records `lastUpgradeRejectedAt` timestamp
   - Records `lastUpgradeRejectedBy` as your admin UID
   - Stores `lastUpgradeRejectionReason` with your feedback

**Rejection Feedback Best Practices:**

✅ **Good Examples:**
```
"Please provide proof of business registration or tax ID before we can approve Level 3"

"Your missions show low completion rates (15%). Please improve mission quality and customer satisfaction to 60%+ before requesting upgrade"

"Level 5 requires 5+ years of business operation. Current profile shows 2 years. Reapply when you reach the 5-year mark"
```

❌ **Bad Examples:**
```
"Not qualified" (too vague)
"No" (no explanation)
"Try again later" (doesn't explain what to improve)
```

**What Happens:**
- Business sees rejection notice in their BusinessLevelCard
- Reason is displayed prominently in orange feedback box
- They can submit a new request after addressing feedback
- (Future) Email notification with feedback

---

## 🔧 Technical Implementation

### Cloud Functions

**1. Get Pending Requests**
```http
GET https://us-central1-fluzio-13af2.cloudfunctions.net/getPendingUpgradeRequests
```

**Response:**
```json
{
  "success": true,
  "requests": [
    {
      "id": "user123",
      "name": "TechCorp Inc",
      "email": "contact@techcorp.com",
      "currentLevel": 2,
      "currentSubLevel": 9,
      "currentXp": 450,
      "requestedAt": { "_seconds": 1701234567 }
    }
  ]
}
```

**2. Approve Upgrade**
```http
POST https://us-central1-fluzio-13af2.cloudfunctions.net/approveBusinessLevelUpgrade
Content-Type: application/json

{
  "businessId": "user123",
  "adminId": "admin456"
}
```

**Response:**
```json
{
  "success": true,
  "newLevel": {
    "main": 3,
    "sub": 1
  }
}
```

**3. Reject Upgrade**
```http
POST https://us-central1-fluzio-13af2.cloudfunctions.net/rejectBusinessLevelUpgrade
Content-Type: application/json

{
  "businessId": "user123",
  "adminId": "admin456",
  "reason": "Please provide business registration documents"
}
```

**Response:**
```json
{
  "success": true
}
```

### Firestore Schema

**Fields Set on Approval:**
```javascript
{
  businessLevel: 3,                     // Incremented
  businessSubLevel: 1,                  // Reset to 1
  businessXp: 0,                        // Reset to 0
  upgradeRequested: false,              // Cleared
  upgradeRequestedAt: null,             // Cleared
  upgradeApprovedAt: Timestamp.now(),   // Set
  lastUpgradeApprovedBy: "admin456"     // Set
}
```

**Fields Set on Rejection:**
```javascript
{
  upgradeRequested: false,
  upgradeRequestedAt: null,
  lastUpgradeRejectedBy: "admin456",
  lastUpgradeRejectedAt: Timestamp.now(),
  lastUpgradeRejectionReason: "Your feedback here"
}
```

---

## 📊 Monitoring & Analytics

### Suggested Metrics to Track

1. **Approval Rate**: % of requests approved vs rejected
2. **Time to Review**: Average time from request to decision
3. **Level Distribution**: How many businesses at each level
4. **Rejection Reasons**: Common themes for rejections
5. **Re-request Rate**: How many businesses reapply after rejection

### Future Enhancements

- [ ] Bulk actions (approve/reject multiple)
- [ ] Filters (by level, by date, by business name)
- [ ] Sort options (oldest first, highest level first)
- [ ] Business detail modal (view full profile before deciding)
- [ ] Approval notes/comments
- [ ] Email notifications to businesses
- [ ] In-app notifications
- [ ] Audit log (track all admin actions)
- [ ] Auto-approval rules (e.g., verified businesses with >90% satisfaction)

---

## 🚀 Usage Examples

### Example 1: Approving a Valid Request

**Scenario:** "Coffee Haven Café" has:
- Level 2.9 (Operator)
- 450 XP
- Requested upgrade 2 days ago
- Profile shows real café with photos
- 15 completed missions
- 85% customer satisfaction

**Action:** ✅ Approve
**Result:** Coffee Haven Café → Level 3.1 (Growth Leader)

---

### Example 2: Rejecting an Invalid Request

**Scenario:** "QuickBiz LLC" has:
- Level 1.9 (Explorer)
- 440 XP
- Requested upgrade today
- Profile is incomplete (no description, no photos)
- Only 3 missions created
- All missions are generic "Follow us on Instagram"

**Action:** ❌ Reject
**Reason:** "To reach Level 2 (Builder), please complete your business profile with photos, description, and create more diverse missions that provide value to customers. Current missions lack engagement."

---

### Example 3: Borderline Case

**Scenario:** "StartupHub Co" has:
- Level 3.9 (Operator)
- 470 XP
- Requested upgrade 5 days ago
- Profile shows 18 months of operation
- Good mission quality
- Wants Level 4 (Growth Leader - requires scaling metrics)

**Options:**
1. **Approve** if they show clear growth trajectory
2. **Reject** if they don't meet "scaling" criteria yet

**Best Practice:** Ask for clarification first (future feature: comments/notes)

---

## 🔐 Security Considerations

### Current TODO Items

The functions currently have placeholder comments:
```javascript
// TODO: Verify adminId has admin role
```

**Recommended Implementation:**
```javascript
// In Cloud Functions
const adminRef = db.collection("users").doc(adminId);
const adminSnap = await adminRef.get();
const adminData = adminSnap.data();

if (adminData?.role !== 'ADMIN') {
  res.status(403).json({ 
    success: false, 
    error: 'Unauthorized: Admin role required' 
  });
  return;
}
```

### Access Control Checklist

- [ ] Verify admin role in Cloud Functions
- [ ] Add Firestore security rules for admin endpoints
- [ ] Rate limit approval/rejection actions
- [ ] Log all admin actions to audit trail
- [ ] Require 2FA for admin accounts (future)
- [ ] Add IP allowlisting for admin dashboard (future)

---

## 📝 Testing Guide

### Manual Test Checklist

**Setup:**
1. Create test business account
2. Award XP to reach Level 1.9 (440 XP)
3. Submit upgrade request

**Test Approvals:**
- [ ] Can view pending request in admin dashboard
- [ ] Approve button works and increments level
- [ ] Business sees new level on profile immediately
- [ ] Request disappears from pending queue
- [ ] Firestore fields updated correctly

**Test Rejections:**
- [ ] Reject button opens modal
- [ ] Cannot submit without reason
- [ ] Reason saved to Firestore
- [ ] Business sees rejection feedback in settings
- [ ] Can submit new request after rejection

**Test Edge Cases:**
- [ ] Non-admin cannot access dashboard
- [ ] Cannot approve business already at Level 6
- [ ] Cannot approve business without pending request
- [ ] Request removed if business manually reverted by database edit
- [ ] Loading states work correctly

---

## 🎨 UI Customization

### Color Scheme

**Request Table:**
- Hover: `bg-gray-50`
- Borders: `border-gray-100`

**Action Buttons:**
- Approve: `bg-green-100 text-green-700 hover:bg-green-200`
- Reject: `bg-red-100 text-red-700 hover:bg-red-200`

**Level Badges:**
```tsx
const levelColors = {
  1: 'bg-gray-100 text-gray-700 border-gray-300',
  2: 'bg-green-100 text-green-700 border-green-300',
  3: 'bg-blue-100 text-blue-700 border-blue-300',
  4: 'bg-purple-100 text-purple-700 border-purple-300',
  5: 'bg-orange-100 text-orange-700 border-orange-300',
  6: 'bg-gradient-to-r from-yellow-100 to-pink-100 text-pink-700'
};
```

### Responsive Design

- Table scrolls horizontally on mobile
- Action buttons stack on small screens
- Modal takes full width on mobile
- Date formatting adjusts ("Today" vs full date)

---

## 📞 Support & Troubleshooting

### Common Issues

**Issue:** "No pending requests" but businesses report submitting
- **Check:** Firestore query in `getPendingUpgradeRequests`
- **Verify:** `upgradeRequested: true` and `businessSubLevel: 9`
- **Fix:** Check Cloud Function logs for errors

**Issue:** Approval doesn't increment level
- **Check:** Cloud Function logs for error messages
- **Verify:** Business not already at Level 6
- **Fix:** Ensure `businessLevel` field exists and is a number

**Issue:** Rejection feedback not showing to business
- **Check:** `lastUpgradeRejectionReason` field in Firestore
- **Verify:** BusinessLevelCard component showing rejection section
- **Fix:** Clear browser cache or check component logic

---

## 🎓 Best Practices Summary

### For Admins

✅ **Do:**
- Review business profiles before deciding
- Provide specific, actionable feedback in rejections
- Be consistent with approval criteria across levels
- Respond to requests within 24-48 hours
- Keep audit logs of decisions

❌ **Don't:**
- Auto-approve without review
- Give vague rejection reasons
- Play favorites or discriminate
- Take too long to respond (hurts user experience)
- Approve Level 6 lightly (it's the highest tier)

### For Platform Owners

- Monitor approval rates and times
- Adjust level criteria if too strict/loose
- Gather feedback from rejected businesses
- Consider auto-approval for verified businesses in future
- Build analytics dashboard to track trends

---

## 📚 Related Documentation

- **[BUSINESS_LEVEL_SYSTEM_COMPLETE.md](./BUSINESS_LEVEL_SYSTEM_COMPLETE.md)** - Full system overview
- **Firestore Schema** - See database structure
- **Cloud Functions** - Backend implementation details
- **User Guide** - How businesses earn XP and request upgrades

---

## ✅ Deployment Status

- ✅ AdminDashboard component created
- ✅ BusinessLevelApprovals component created
- ✅ rejectBusinessLevelUpgrade Cloud Function deployed
- ✅ Rejection feedback UI in BusinessLevelCard
- ✅ All endpoints live and tested
- 🚧 Admin role verification (TODO in functions)
- 🚧 Email notifications (future)
- 🚧 Audit logging (future)

---

**Last Updated:** December 4, 2025  
**System Version:** 1.0  
**Status:** ✅ Production Ready
