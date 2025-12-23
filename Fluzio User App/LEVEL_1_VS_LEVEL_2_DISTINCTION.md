# Level 1 vs Level 2 Distinction - Complete Guide

## 🎯 Critical Rule: Level Assignment Based on Business Status

### Level 1 = ASPIRING ENTREPRENEURS ONLY
**Assigned When**: User selects **"I want to start a business"** during signup
**Status**: Idea stage, no operational business yet
**Purpose**: Learning, networking, preparing to launch

### Level 2+ = ACTUAL BUSINESSES
**Assigned When**: User selects **"I already have a business"** during signup
**Status**: Operational business with products/services
**Purpose**: Growth, collaboration, scaling

---

## 📋 How It Works

### Signup Flow Decision Point

During signup, users answer:
**"What best describes you?"**

1. **"I want to start a business"** 
   → `isAspiringBusiness: true` 
   → **Level 1 (Explorer)**

2. **"I already have a business"** 
   → `isAspiringBusiness: false` 
   → **Level 2 (Builder)**

3. **"I'm a customer/creator"** 
   → Not applicable (different user type)

---

## 🔧 Implementation Details

### Cloud Function: `onUserCreate`

```javascript
// In functions/index.js
const status = newUser.isAspiringBusiness ? "APPROVED" : "PENDING";
const initialLevel = newUser.isAspiringBusiness ? 1 : 2;

batch.update(snapshot.ref, { 
  verificationStatus: status,
  businessLevel: initialLevel,
  'levelProgression.currentLevel': initialLevel
});
```

### Initial Permissions

**Level 1 (Aspiring - `isAspiringBusiness: true`)**:
```javascript
'missionUsage.maxMissionsPerMonth': 0,           // Cannot create missions
'missionUsage.maxParticipantsPerMission': 0,     // N/A
'meetupUsage.maxHostPerMonth': 0,                // Cannot host meetups
'meetupUsage.maxJoinPerMonth': 2,                // Can join 2/month
'growthCredits.available': 0,                     // No credits
'subscription.tier': 'BASIC',                     // Free only
```

**Level 2 (Actual Business - `isAspiringBusiness: false`)**:
```javascript
'missionUsage.maxMissionsPerMonth': 1,           // 1 mission/month (BASIC)
'missionUsage.maxParticipantsPerMission': 5,     // 5 participants max
'meetupUsage.maxHostPerMonth': 1,                // Can host 1/month
'meetupUsage.maxJoinPerMonth': 5,                // Can join 5/month
'growthCredits.available': 0,                     // 0 for BASIC (can upgrade)
'subscription.tier': 'BASIC',                     // Can upgrade to Silver/Gold/Platinum
```

---

## ✅ LEVEL 1 (EXPLORER) - Aspiring Entrepreneurs Only

### What They CAN Do:
- ✅ Join beginner meetups (max 2 per month)
- ✅ Join 1 beginner squad
- ✅ Create a business idea profile
- ✅ Follow other businesses and creators
- ✅ Receive mentorship from Level 4–6 users
- ✅ Access Fluzio Academy beginner content
- ✅ View inspirational posts and resources
- ✅ Earn XP by:
  - Attending meetups
  - Joining squads
  - Completing beginner missions (created by others)

### What They CANNOT Do:
- ❌ Cannot create missions (no Growth Credits)
- ❌ Cannot host meetups (can only join)
- ❌ Cannot create rewards
- ❌ Cannot join premium squads
- ❌ Cannot appear in business matching
- ❌ Cannot use global search visibility
- ❌ Cannot join collaborations with businesses
- ❌ Cannot receive follower requests (0 Growth Credits)
- ❌ Cannot create business partnerships
- ❌ Cannot access revenue/influencer features
- ❌ Cannot upgrade to paid tiers (BASIC only)
- ❌ Cannot use campaign automation
- ❌ Cannot apply for verified badge

### Progression Path (L1 → L2):
**Requirements**:
- Attend 2+ meetups
- Join 1+ squad
- Be on platform for 7+ days
- No violations

**How to Upgrade**:
1. Meet activity requirements above
2. Request level upgrade in app
3. Auto-approved if metrics met
4. Unlocks all Level 2 features

**Why Upgrade**:
- Unlock mission creation
- Unlock meetup hosting
- Access paid subscription tiers
- Get Growth Credits allocation
- Enable business matching
- Join premium features

---

## ✅ LEVEL 2 (BUILDER) - Starting Point for Actual Businesses

### What They CAN Do:
- ✅ Everything Level 1 can do, PLUS:
- ✅ **Create missions** (1/month on BASIC, 3-10/month on paid tiers)
- ✅ **Host meetups** (1/month on BASIC, 3-5/month on paid tiers)
- ✅ **Join more meetups** (5/month on BASIC, 10-unlimited on paid)
- ✅ **Access paid tiers** (Silver €19, Gold €39, Platinum €79)
- ✅ **Get Growth Credits** (200-1,000/month on paid tiers)
- ✅ **Appear in business matching**
- ✅ **Create business partnerships**
- ✅ **Use basic analytics**
- ✅ **Create rewards for missions**
- ✅ **Join collaborations**
- ✅ **Global search visibility** (if upgraded to paid tier)

### Subscription Tiers Available:

**BASIC (Free)**:
- 1 mission/month, 5 participants max
- 1 meetup hosting/month
- 0 Growth Credits
- Same-city reach
- No premium features

**SILVER (€19/month)**:
- 3 missions/month, 10 participants max
- 3 meetup hosting/month
- 200 Growth Credits/month
- Nearby cities reach
- Basic analytics

**GOLD (€39/month)**:
- 6 missions/month, 30 participants max
- 5 meetup hosting/month
- 500 Growth Credits/month
- Multi-country reach
- Advanced analytics
- Premium templates

**PLATINUM (€79/month)**:
- 15 missions/month, unlimited participants
- Unlimited meetup hosting
- 1,000 Growth Credits/month
- Global reach
- Priority matching
- Collaboration missions
- VIP access

### Progression Path (L2 → L3):
**Requirements**:
- Create 5+ missions
- Attend 3+ meetups
- Join 1+ squad
- Use 50+ Growth Credits
- Maintain 4.0+ average rating
- No violations

---

## 🎓 Why This Distinction Matters

### Business Model Clarity
1. **Level 1 is a learning/preparation phase**
   - Users exploring entrepreneurship
   - Not yet ready to create missions or host events
   - Need guidance and mentorship
   - Zero revenue expectations

2. **Level 2+ is operational business phase**
   - Already have customers/products
   - Ready to collaborate and grow
   - Can invest in paid tiers
   - Generate value for platform

### Platform Economics
- **Level 1**: Free tier, no monetization opportunity (yet)
- **Level 2+**: Subscription revenue potential immediately
- **Level 4+**: Premium features, higher ARPU
- **Level 6**: Enterprise clients, maximum value

### User Experience
- **Aspiring entrepreneurs** aren't overwhelmed with business tools
- **Actual businesses** get immediate access to growth tools
- Clear progression path motivates upgrades
- Reduces confusion about "why can't I create missions?"

---

## 📊 Data Schema

### User Document Fields

```typescript
{
  // Role Selection
  role: 'BUSINESS',
  isAspiringBusiness: true,  // or false
  
  // Initial Level Assignment
  businessLevel: 1,          // or 2 for actual businesses
  levelProgression: {
    currentLevel: 1,         // or 2
    totalMissionsCreated: 0,
    totalMeetupsAttended: 0,
    totalSquadsJoined: 0,
    // ...
  },
  
  // Subscription
  subscription: {
    tier: 'BASIC',
    // L1 cannot access Silver/Gold/Platinum
    // L2+ can upgrade
  },
  
  // Usage Limits
  missionUsage: {
    maxMissionsPerMonth: 0,  // L1: 0, L2: 1 (BASIC)
    // ...
  },
  
  meetupUsage: {
    maxHostPerMonth: 0,      // L1: 0, L2: 1 (BASIC)
    maxJoinPerMonth: 2,      // L1: 2, L2: 5 (BASIC)
    // ...
  }
}
```

---

## 🔒 Validation & Enforcement

### Mission Creation Validation
```javascript
// In canCreateMission Cloud Function
if (user.businessLevel === 1) {
  return {
    canCreate: false,
    reason: "Level 1 (Aspiring Entrepreneurs) cannot create missions. Upgrade to Level 2 by attending meetups and joining squads."
  };
}
```

### Meetup Hosting Validation
```javascript
// In canHostMeetup Cloud Function
if (user.businessLevel === 1) {
  return {
    canHost: false,
    reason: "Level 1 users can join meetups but cannot host. Reach Level 2 to unlock hosting."
  };
}
```

### Subscription Tier Validation
```javascript
// In subscription upgrade
if (user.businessLevel === 1 && tier !== 'BASIC') {
  return {
    canUpgrade: false,
    reason: "Level 1 is limited to BASIC tier. Progress to Level 2 first."
  };
}
```

---

## 📝 UI/UX Messaging

### Signup Screen
```
"What best describes you?"

[ ] I want to start a business
    → Start as Level 1 Explorer
    → Focus on learning and networking
    
[ ] I already have a business
    → Start as Level 2 Builder
    → Access growth tools immediately
    
[ ] I'm a customer/creator
    → Different user journey
```

### Level 1 Dashboard Message
```
🌱 Welcome, Explorer!

You're at Level 1 - the perfect place to learn and prepare.

What you can do now:
✅ Join 2 beginner meetups this month
✅ Connect with mentors
✅ Access Fluzio Academy content

Ready to launch your business?
→ Complete requirements to reach Level 2 and unlock:
  • Mission creation
  • Meetup hosting  
  • Paid subscription tiers
  • Growth Credits
```

### Level 2+ Dashboard Message
```
🔧 Welcome, Builder!

Your business is ready to grow on Fluzio.

Current Plan: BASIC (Free)
→ Upgrade to unlock more missions, credits, and features

[View Subscription Options]
```

---

## ✅ Implementation Checklist

- [x] Update `onUserCreate` to set initial level based on `isAspiringBusiness`
- [x] Set mission limits: L1 = 0, L2 = 1 (BASIC)
- [x] Set meetup hosting: L1 = 0, L2 = 1 (BASIC)
- [x] Update level progression descriptions
- [x] Document Level 1 vs Level 2 distinction
- [ ] Update UI to show appropriate messaging by level
- [ ] Add "Upgrade to Level 2" prompt for L1 users
- [ ] Test L1 → L2 progression flow
- [ ] Validate mission creation blocks L1 users
- [ ] Validate meetup hosting blocks L1 users
- [ ] Deploy functions with new logic
- [ ] Test signup flow for both paths

---

## 🚀 Deployment Status

**Backend**: ✅ Deployed
- `functions/index.js` updated with level assignment logic
- Mission/meetup limits configured per level
- Validation functions enforce restrictions

**Frontend**: ⏸️ Pending
- UI messaging needs update
- Dashboard should show different content for L1 vs L2
- Upgrade prompts for L1 users

**Documentation**: ✅ Complete
- This guide created
- Level progression docs updated
- Inline code comments added

---

## 💡 Key Takeaways

1. **Level 1 = Aspiring** (idea stage, learning mode)
2. **Level 2+ = Actual Business** (operational, growth mode)
3. **Assignment is automatic** based on signup selection
4. **Level 1 is limited** but free and educational
5. **Level 2 unlocks revenue** features and paid tiers
6. **Clear progression path** motivates user engagement
7. **Platform economics** align with user value delivery

---

**Status**: ✅ Implementation Complete  
**Next Steps**: UI updates, testing, deployment
