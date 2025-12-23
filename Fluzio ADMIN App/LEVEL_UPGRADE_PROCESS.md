# 🚀 Level Upgrade Process - Complete Guide

## Overview
This document explains how users upgrade from Level 1 → 2 → 3 → 4 → 5 → 6 in the Fluzio platform.

---

## 🎯 How It Works

### **Step 1: User Checks Their Progress**
Users can see their level progress in the app via the `LevelProgressIndicator` component:

```
Location: Settings → Level Progress
OR: Dashboard Widget
```

**What they see:**
- Current Level (e.g., Level 2 - Builder 🔧)
- Next Level (e.g., Level 3 - Operator ⚙️)
- Progress Bar (e.g., 65% complete)
- Missing Requirements (what they still need to do)
- Upgrade Button (enabled when eligible)

---

### **Step 2: Complete Requirements**

Each level has specific requirements:

#### **Level 1 → Level 2** ✅ AUTO-APPROVED
```javascript
Requirements:
- Attend 2 meetups
- Join 1 squad
- 7 days since joining platform
- 0 violations

Admin Approval: NO (instant upgrade)
```

#### **Level 2 → Level 3** 🔍 ADMIN REVIEW
```javascript
Requirements:
- Create 5 missions
- Attend 3 meetups
- Join 1 squad
- Use 50 Growth Credits
- Average rating: 4.0+ stars
- 14 days at Level 2
- 0 violations

Admin Approval: YES (2-5 business days)
```

#### **Level 3 → Level 4** 🔍 ADMIN REVIEW + VERIFICATION
```javascript
Requirements:
- Create 20 missions
- Attend 10 meetups
- Join 2 squads
- Use 500 Growth Credits
- Average rating: 4.3+ stars
- 30 days at Level 3
- 0 violations
- VERIFIED BUSINESS (upload documents)

Documents needed:
- Business registration
- Tax ID or VAT number
- Proof of address

Admin Approval: YES (2-5 business days)
```

#### **Level 4 → Level 5** 🔍 ADMIN REVIEW + VERIFICATION
```javascript
Requirements:
- Create 50 missions
- Attend 25 meetups
- Join 3 squads
- Use 2,000 Growth Credits
- Average rating: 4.5+ stars
- 60 days at Level 4
- 180 days total on platform (6 months)
- 0 violations
- VERIFIED BUSINESS

Documents needed:
- Business registration
- Tax documents
- Portfolio or case studies
- Client testimonials

Admin Approval: YES (2-5 business days)
```

#### **Level 5 → Level 6** 🔍 ADMIN REVIEW + VERIFICATION
```javascript
Requirements:
- Create 100 missions
- Attend 50 meetups
- Join 5 squads
- Use 5,000 Growth Credits
- Average rating: 4.7+ stars
- 90 days at Level 5
- 365 days total on platform (1 year)
- 0 violations
- VERIFIED BUSINESS

Documents needed:
- Business registration
- Financial statements
- Media coverage or awards
- Professional references
- Portfolio of major clients

Admin Approval: YES (2-5 business days)
```

---

## 📱 User Interface Flow

### **1. View Progress**

User navigates to **Settings → Level Progression** and sees:

```
╔═══════════════════════════════════════════════════╗
║  Level 2 - Builder 🔧                             ║
║  ━━━━━━━━━━━━━━━━━━━━░░░░░░░░ 65%               ║
║                                                   ║
║  Next: Level 3 - Operator ⚙️                      ║
║                                                   ║
║  YOUR PROGRESS:                                   ║
║  ✅ Missions Created: 5/5 (100%)                  ║
║  ✅ Meetups Attended: 4/3 (133%)                  ║
║  ✅ Squads Joined: 1/1 (100%)                     ║
║  ⏳ Growth Credits: 25/50 (50%)                   ║
║  ✅ Average Rating: 4.2/4.0                       ║
║  ⏳ Days at Level 2: 10/14 (71%)                  ║
║                                                   ║
║  MISSING:                                         ║
║  • Use 25 more Growth Credits                     ║
║  • Wait 4 more days at Level 2                    ║
║                                                   ║
║  [Upgrade Button] ← DISABLED until 100%          ║
╚═══════════════════════════════════════════════════╝
```

---

### **2. Meet Requirements**

User completes the missing activities:
- Uses Growth Credits on missions/campaigns
- Waits the required time
- Maintains good ratings

Progress bar updates **in real-time** as they complete activities.

---

### **3. Click "Request Upgrade"**

Once progress reaches **100%**, button becomes enabled:

```
╔═══════════════════════════════════════════════════╗
║  Level 2 - Builder 🔧                             ║
║  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100% ✅           ║
║                                                   ║
║  🎉 You're ready to advance to Level 3!          ║
║                                                   ║
║  [Request Level 3 Upgrade] ← ENABLED             ║
╚═══════════════════════════════════════════════════╝
```

User clicks the button.

---

### **4a. Auto-Approval (Level 1 → 2 ONLY)**

For Level 1 → 2, upgrade happens **instantly**:

```javascript
// Backend: requestLevelUp function
if (!eligibility.requiresAdminApproval) {
  // Auto-approve Level 1 → 2
  await userDoc.ref.update({
    'subscription.level': 2,
    'levelProgression.lastLevelUpAt': Timestamp,
    'levelProgression.autoApproved': true
  });
  
  return {
    approved: true,
    message: "Congratulations! You've been upgraded to Level 2"
  };
}
```

**User sees:**
```
🎉 Congratulations! You've been upgraded to Level 2!

[Confetti animation plays]
[Page refreshes to show new level]
```

---

### **4b. Admin Review (Levels 2+ → 3+)**

For all other levels, request goes to admin queue:

```javascript
// Backend: Create upgrade request
await db.collection("levelUpRequests").add({
  userId,
  currentLevel: 2,
  requestedLevel: 3,
  status: "PENDING",
  metrics: { /* all user stats */ },
  createdAt: Timestamp
});

return {
  approved: false,
  message: "Your upgrade request has been submitted for admin review",
  estimatedReviewTime: "2-5 business days"
};
```

**User sees:**
```
✅ Your upgrade request has been submitted for admin review

Estimated review time: 2-5 business days

You'll be notified via email when your request is reviewed.

[OK]
```

---

## 🛠️ Backend Cloud Functions

### **1. checkLevelUpEligibility**
```
URL: https://us-central1-fluzio-13af2.cloudfunctions.net/checkLevelUpEligibility

Method: POST
Body: { "userId": "abc123" }

Response: {
  "success": true,
  "eligible": true,
  "currentLevel": 2,
  "nextLevel": 3,
  "requiresAdminApproval": true,
  "progress": {
    "percentage": 100,
    "current": { /* user's current stats */ },
    "required": { /* what's needed */ },
    "missing": null // or { /* what's missing */ }
  }
}
```

**Called by:**
- `LevelProgressIndicator.tsx` component when user views progress
- Runs automatically on page load
- Refresh button to re-check progress

---

### **2. requestLevelUp**
```
URL: https://us-central1-fluzio-13af2.cloudfunctions.net/requestLevelUp

Method: POST
Body: { 
  "userId": "abc123",
  "message": "Request to advance from Level 2 to Level 3"
}

Response (Auto-Approved):
{
  "success": true,
  "approved": true,
  "newLevel": 2,
  "message": "Congratulations! You've been upgraded to Level 2"
}

Response (Needs Review):
{
  "success": true,
  "approved": false,
  "requestId": "req_xyz789",
  "message": "Your upgrade request has been submitted for admin review",
  "estimatedReviewTime": "2-5 business days"
}
```

**Called by:**
- User clicks "Request Upgrade" button in `LevelProgressIndicator`
- Only works if `eligible: true` from checkLevelUpEligibility

---

### **3. Admin Review Functions** (For admins)

```javascript
// Approve upgrade request
exports.approveBusinessLevelUpgrade = async (req, res) => {
  // Admin approves → User upgraded → Email notification sent
};

// Reject upgrade request
exports.rejectBusinessLevelUpgrade = async (req, res) => {
  // Admin rejects → User notified → Can retry later
};

// View pending requests
exports.getPendingUpgradeRequests = async (req, res) => {
  // Admin dashboard shows all pending requests
};
```

---

## 📊 Complete Upgrade Timeline Example

### **Serge's Journey: Level 1 → Level 6**

#### **Day 1: Sign up as Level 1**
```
Status: Level 1 - Explorer 🌱
To do: Attend 2 meetups, join 1 squad, wait 7 days
```

#### **Day 10: Upgrade to Level 2** ✅ AUTO
```
✅ Attended 3 meetups
✅ Joined 1 squad  
✅ 10 days on platform
→ INSTANT UPGRADE to Level 2 - Builder 🔧
```

#### **Day 25: Request Level 3**
```
✅ Created 6 missions
✅ Attended 5 meetups
✅ Used 120 Growth Credits
✅ 4.3 star rating
✅ 15 days at Level 2
→ SUBMIT REQUEST for admin review
```

#### **Day 28: Approved to Level 3** 🔍
```
Admin reviews metrics → APPROVED
→ Upgraded to Level 3 - Operator ⚙️
Email notification sent
```

#### **Day 60: Request Level 4**
```
✅ Created 25 missions
✅ Attended 12 meetups
✅ Used 600 Growth Credits
✅ 4.4 star rating
✅ 32 days at Level 3
✅ BUSINESS VERIFIED (uploaded docs)
→ SUBMIT REQUEST for admin review
```

#### **Day 64: Approved to Level 4** 🔍
```
Admin reviews + verifies documents → APPROVED
→ Upgraded to Level 4 - Growth Leader 🚀
Email notification sent
```

#### **Day 140: Request Level 5**
```
✅ Created 55 missions
✅ Attended 30 meetups
✅ Used 2,500 Growth Credits
✅ 4.6 star rating
✅ 76 days at Level 4
✅ 180+ days on platform
✅ VERIFIED (updated docs)
→ SUBMIT REQUEST for admin review
```

#### **Day 145: Approved to Level 5** 🔍
```
Admin reviews portfolio + testimonials → APPROVED
→ Upgraded to Level 5 - Expert 🧠
Email notification sent
```

#### **Day 320: Request Level 6**
```
✅ Created 110 missions
✅ Attended 55 meetups
✅ Used 6,000 Growth Credits
✅ 4.8 star rating
✅ 175 days at Level 5
✅ 365+ days on platform
✅ VERIFIED (financial docs + references)
→ SUBMIT REQUEST for admin review
```

#### **Day 325: Approved to Level 6** 🔍 👑
```
Admin reviews full portfolio + references → APPROVED
→ Upgraded to Level 6 - Elite 👑
VIP welcome package sent
```

**Total time: ~11 months to reach Elite status**

---

## 🔑 Key Points

### **Automatic vs Manual Upgrades**

| Level Transition | Type | Time |
|---|---|---|
| Level 1 → 2 | **AUTOMATIC** | Instant ⚡ |
| Level 2 → 3 | Manual Review | 2-5 days 🔍 |
| Level 3 → 4 | Manual + Verification | 2-5 days 🔍 |
| Level 4 → 5 | Manual + Verification | 2-5 days 🔍 |
| Level 5 → 6 | Manual + Verification | 2-5 days 🔍 |

### **What Happens After Upgrade**

1. **Firestore Update**: `subscription.level` changes to new level
2. **Email Notification**: User receives congratulations email
3. **New Perks Unlock**: Access to new features (missions, meetups, credits, etc.)
4. **Confetti Animation**: LevelUpModal shows celebration (coming soon)
5. **Profile Frame**: Border color changes to reflect new level (coming soon)

### **If Request is Rejected**

- User receives email with reason
- Can improve metrics and resubmit after 7 days
- Keeps current level and benefits
- No penalties for rejection

---

## 🎨 UI Components Involved

1. **LevelProgressIndicator.tsx** (448 lines)
   - Shows progress bars
   - Displays missing requirements
   - "Request Upgrade" button

2. **LevelUpModal.tsx** (500 lines) - COMING SOON
   - Confetti celebration
   - Shows new benefits unlocked
   - Share achievement button

3. **SubscriptionTierSelector.tsx**
   - Level 1 users see special guidance message
   - Shows what unlocks at Level 2+

4. **VerificationForm.tsx**
   - Required for Level 4+ upgrades
   - Upload business documents
   - Multi-step wizard

---

## 📝 Summary

**For Level 1 Users (Aspiring Entrepreneurs):**
→ Focus on learning, networking, and validating your idea
→ Attend meetups, join a squad, wait 7 days
→ Click "Request Upgrade" → **INSTANT Level 2 upgrade** ✅

**For Level 2+ Users (Actual Businesses):**
→ Create missions, host meetups, use Growth Credits
→ Maintain high ratings, avoid violations
→ Click "Request Upgrade" → Admin reviews → Approved within 2-5 days 🔍
→ Upload verification documents for Level 4+

**Progression Timeline:**
- Level 1 → 2: ~7-14 days (auto)
- Level 2 → 3: ~2-4 weeks + 2-5 day review
- Level 3 → 4: ~1-2 months + verification + review
- Level 4 → 5: ~2-4 months + advanced verification + review
- Level 5 → 6: ~3-6 months + elite verification + review

**Total Time to Elite (Level 6): 8-12 months of active engagement**

---

## 🚀 All Cloud Functions (Deployed)

```
✅ checkLevelUpEligibility - Check if user can upgrade
✅ requestLevelUp - Submit upgrade request
✅ approveBusinessLevelUpgrade - Admin approves (admin only)
✅ rejectBusinessLevelUpgrade - Admin rejects (admin only)
✅ getPendingUpgradeRequests - List all pending (admin only)
```

**All functions live at:**
`https://us-central1-fluzio-13af2.cloudfunctions.net/[functionName]`

---

End of Level Upgrade Process Guide 🎉
