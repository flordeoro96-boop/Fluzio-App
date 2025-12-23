# Business Level System - Quick Reference

## 🚀 For Developers

### Import the Library
```typescript
import {
  BUSINESS_LEVELS,
  SUB_LEVEL_THRESHOLDS,
  XP_REWARDS,
  getBusinessLevelData,
  addBusinessXp,
  requestBusinessLevelUpgrade,
  getLevelDisplay,
  getLevelName
} from '../../src/lib/levels/businessLevel';
```

---

## 📊 Constants

### Level Names
```typescript
BUSINESS_LEVELS[1] // { name: 'Explorer', description: '...' }
BUSINESS_LEVELS[2] // { name: 'Builder', description: '...' }
BUSINESS_LEVELS[3] // { name: 'Operator', description: '...' }
BUSINESS_LEVELS[4] // { name: 'Growth Leader', description: '...' }
BUSINESS_LEVELS[5] // { name: 'Expert', description: '...' }
BUSINESS_LEVELS[6] // { name: 'Elite', description: '...' }
```

### Sub-Level Thresholds
```typescript
SUB_LEVEL_THRESHOLDS // [0, 20, 50, 90, 140, 200, 270, 350, 440]
```

### XP Rewards
```typescript
XP_REWARDS.MISSION_CREATED_FIRST    // 50
XP_REWARDS.MISSION_CREATED          // 30
XP_REWARDS.MISSION_COMPLETED        // 30
XP_REWARDS.GOOGLE_REVIEW_MISSION    // 20
XP_REWARDS.MEETUP_HOSTED            // 40
XP_REWARDS.MEETUP_HOSTED_3_PLUS     // 70
XP_REWARDS.EVENT_HOSTED             // 40
XP_REWARDS.EVENT_HOSTED_5_PLUS      // 100
```

---

## 🔧 Common Functions

### Get Business Level Data
```typescript
const levelData = await getBusinessLevelData('businessId123');
// Returns:
// {
//   businessLevel: 2,
//   businessSubLevel: 5,
//   businessXp: 140,
//   upgradeRequested: false,
//   ...
// }
```

### Award XP
```typescript
await addBusinessXp('businessId123', 30, 'Mission completed');
// Auto-updates sub-level if threshold crossed
```

### Format Level Display
```typescript
getLevelDisplay(2, 5)  // "2.5"
getLevelName(2)        // "Builder"
```

### Request Upgrade
```typescript
await requestBusinessLevelUpgrade('businessId123');
// Validates sub-level === 9 before allowing
```

---

## 🎨 UI Components

### Show Level Badge
```tsx
import { getBusinessLevelData, getLevelDisplay, getLevelName } from '...';

const [levelData, setLevelData] = useState(null);

useEffect(() => {
  const loadLevel = async () => {
    const data = await getBusinessLevelData(business.id);
    setLevelData(data);
  };
  loadLevel();
}, [business.id]);

return (
  <div className="px-3 py-1.5 rounded-full bg-blue-50 text-blue-700">
    Level {getLevelDisplay(levelData.level, levelData.subLevel)}
    <span className="text-xs">({getLevelName(levelData.level)})</span>
  </div>
);
```

### Show Level Card
```tsx
import { BusinessLevelCard } from './components/business/BusinessLevelCard';

<BusinessLevelCard businessId={userProfile.uid} userProfile={userProfile} />
```

### Admin Dashboard
```tsx
import { AdminDashboard } from './components/admin/AdminDashboard';

// Add to routing:
<Route path="/admin" element={<AdminDashboard />} />
```

---

## 🌐 API Calls

### Frontend: Request Upgrade
```typescript
const response = await fetch(
  'https://us-central1-fluzio-13af2.cloudfunctions.net/requestBusinessLevelUpgrade',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ businessId })
  }
);
const result = await response.json();
// { success: true } or { success: false, error: '...' }
```

### Frontend: Get Pending (Admin)
```typescript
const response = await fetch(
  'https://us-central1-fluzio-13af2.cloudfunctions.net/getPendingUpgradeRequests'
);
const result = await response.json();
// { success: true, requests: [...] }
```

### Frontend: Approve (Admin)
```typescript
const response = await fetch(
  'https://us-central1-fluzio-13af2.cloudfunctions.net/approveBusinessLevelUpgrade',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ businessId, adminId })
  }
);
```

### Frontend: Reject (Admin)
```typescript
const response = await fetch(
  'https://us-central1-fluzio-13af2.cloudfunctions.net/rejectBusinessLevelUpgrade',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ businessId, adminId, reason: 'Feedback here' })
  }
);
```

---

## 🔥 Cloud Functions

### Award XP in Backend
```javascript
const { awardBusinessXp } = require('./businessLevelHelpers');

// In your Cloud Function:
await awardBusinessXp(businessId, 30, 'Mission completed');
```

### Check Level in Function
```javascript
const userRef = db.collection("users").doc(businessId);
const userData = (await userRef.get()).data();

if (userData.businessLevel >= 3) {
  // Premium feature for Level 3+ businesses
}
```

---

## 🗄️ Firestore Queries

### Get All Businesses at Level X
```javascript
const level3Businesses = await db.collection("users")
  .where("role", "==", "BUSINESS")
  .where("businessLevel", "==", 3)
  .get();
```

### Get Pending Upgrade Requests
```javascript
const pending = await db.collection("users")
  .where("role", "==", "BUSINESS")
  .where("upgradeRequested", "==", true)
  .where("businessSubLevel", "==", 9)
  .orderBy("upgradeRequestedAt", "desc")
  .get();
```

### Get Top XP Earners
```javascript
const topEarners = await db.collection("users")
  .where("role", "==", "BUSINESS")
  .orderBy("businessXp", "desc")
  .limit(10)
  .get();
```

---

## 🎯 Color Schemes

### Level Colors (Tailwind)
```typescript
const levelColors = {
  1: 'bg-gray-50 text-gray-700 border-gray-300',
  2: 'bg-green-50 text-green-700 border-green-300',
  3: 'bg-blue-50 text-blue-700 border-blue-300',
  4: 'bg-purple-50 text-purple-700 border-purple-300',
  5: 'bg-orange-50 text-orange-700 border-orange-300',
  6: 'bg-gradient-to-r from-yellow-100 to-pink-100 text-pink-700 border-pink-300'
};
```

### Gradient Colors (for progress bars)
```typescript
const levelGradients = {
  1: 'from-gray-400 to-gray-600',
  2: 'from-green-400 to-green-600',
  3: 'from-blue-400 to-blue-600',
  4: 'from-purple-400 to-purple-600',
  5: 'from-orange-400 to-orange-600',
  6: 'from-yellow-400 via-pink-500 to-purple-600'
};
```

### Emojis
```typescript
const levelEmojis = {
  1: '🔰',  // Explorer
  2: '🛠️',  // Builder
  3: '⚙️',  // Operator
  4: '🚀',  // Growth Leader
  5: '🎯',  // Expert
  6: '👑'   // Elite
};
```

---

## 🧪 Testing Helpers

### Award Test XP
```typescript
// Award 440 XP to reach Level 1.9
await addBusinessXp('testBusinessId', 440, 'Testing');
```

### Reset to Level 1.1
```typescript
await updateDoc(doc(db, 'users', 'testBusinessId'), {
  businessLevel: 1,
  businessSubLevel: 1,
  businessXp: 0,
  upgradeRequested: false
});
```

### Simulate Approval
```typescript
await fetch(
  'https://us-central1-fluzio-13af2.cloudfunctions.net/approveBusinessLevelUpgrade',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      businessId: 'testBusinessId', 
      adminId: 'testAdminId' 
    })
  }
);
```

---

## 📝 Common Patterns

### Display Level with Conditional Styling
```tsx
const getLevelColor = (level: number) => {
  const colors = {
    1: 'gray', 2: 'green', 3: 'blue',
    4: 'purple', 5: 'orange', 6: 'rainbow'
  };
  return colors[level];
};

<div className={`badge-${getLevelColor(level)}`}>
  Level {getLevelDisplay(level, subLevel)}
</div>
```

### Show Upgrade Button Conditionally
```tsx
{levelData?.businessSubLevel === 9 && 
 levelData?.businessLevel < 6 && 
 !levelData?.upgradeRequested && (
  <button onClick={handleRequestUpgrade}>
    Request Upgrade to Level {levelData.businessLevel + 1}
  </button>
)}
```

### Progress Bar
```tsx
const progressPercent = subLevel === 9 
  ? 100 
  : (currentXp / xpForNext) * 100;

<div className="h-3 bg-gray-100 rounded-full">
  <div 
    className="h-full bg-gradient-to-r from-purple-400 to-pink-600"
    style={{ width: `${progressPercent}%` }}
  />
</div>
```

---

## 🚨 Error Handling

### Handle API Errors
```typescript
try {
  const response = await fetch(endpoint, options);
  const result = await response.json();
  
  if (!result.success) {
    console.error('API Error:', result.error);
    alert(result.error);
    return;
  }
  
  // Success!
} catch (error) {
  console.error('Network error:', error);
  alert('Network error. Please try again.');
}
```

### Validate Before Awarding XP
```typescript
const userData = (await userRef.get()).data();

if (userData.role !== 'BUSINESS') {
  console.log('User is not a business, skipping XP');
  return;
}

await addBusinessXp(userId, amount, reason);
```

---

## 📚 Full Documentation

- **BUSINESS_LEVEL_SYSTEM_COMPLETE.md** - Complete system overview
- **ADMIN_LEVEL_APPROVAL_GUIDE.md** - Admin usage guide
- **FINAL_IMPLEMENTATION_SUMMARY.md** - Full feature list

---

## ⚡ Quick Wins

### Add XP for New Action
```javascript
// In functions/index.js
exports.onNewAction = onDocumentCreated("actions/{id}", async (event) => {
  const action = event.data.data();
  const businessId = action.businessId;
  
  await awardBusinessXp(businessId, 25, 'New action completed');
});
```

### Add Level Requirement to Feature
```typescript
if (userProfile.businessLevel < 3) {
  return (
    <div>This feature requires Level 3 (Operator) or higher</div>
  );
}

// Show premium feature
```

### Show Level on Any Component
```tsx
const levelData = await getBusinessLevelData(businessId);

<span>
  {levelEmojis[levelData.businessLevel]} 
  Level {getLevelDisplay(levelData.businessLevel, levelData.businessSubLevel)}
</span>
```

---

**Last Updated:** December 4, 2025  
**Status:** ✅ Production Ready  
**Version:** 1.0
