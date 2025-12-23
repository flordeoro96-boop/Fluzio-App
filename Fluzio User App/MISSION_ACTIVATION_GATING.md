# Mission Activation System - Connection Gating

## Overview

Implements strict connection gating for mission activation. Businesses cannot activate missions without required integrations, and users are warned about connection requirements before attempting missions.

---

## Architecture

### Service Layer
**File**: `services/missionActivationService.ts`

Handles:
- Connection validation (business & user)
- Activation record management
- User eligibility checking
- Setup instructions generation

### API Layer  
**File**: `functions/index.js` (Cloud Functions)

Endpoints:
- `POST /activateMission` - Activate mission with gating
- `POST /deactivateMission` - Deactivate mission
- `GET /getMissionActivation` - Get activation status

### Database
**Collection**: `missionActivations`

Document ID format: `{businessId}_{missionId}`

---

## Connection Requirements by Mission

### Google Review Missions (STRICT)

**Missions**:
- `GOOGLE_REVIEW_TEXT` - Leave a Google Review
- `GOOGLE_REVIEW_PHOTOS` - Google Review with Photos

**Business Requirements**:
```typescript
{
  type: 'google_gbp',
  displayName: 'Google Business Profile',
  description: 'Your Google Business Profile must be connected to verify reviews',
  setupUrl: '/settings/integrations/google'
}
```

**User Requirements**:
```typescript
{
  type: 'google_gbp',
  displayName: 'Google Account',
  description: 'Users must connect their Google account to leave reviews',
  setupUrl: '/settings/connections'
}
```

**Activation Behavior**:
- ❌ **REJECTED** if business doesn't have Google Business Profile connected
- ✅ **ALLOWED** if business has connection
- ⚠️ **USER WARNED** that they need Google account to complete

---

### Instagram Missions

**Missions**:
- `STORY_POST_TAG` - Share to Your Story
- `FEED_REEL_POST_TAG` - Post on Your Feed

**Business Requirements**:
```typescript
{
  type: 'instagram',
  displayName: 'Instagram Business',
  description: 'Your Instagram Business account must be connected to verify posts',
  setupUrl: '/settings/integrations/instagram'
}
```

**User Requirements**:
```typescript
{
  type: 'instagram',
  displayName: 'Instagram Account',
  description: 'Users must connect their Instagram account to post',
  setupUrl: '/settings/connections'
}
```

---

### Other Missions (NO REQUIREMENTS)

**Missions**:
- `VISIT_CHECKIN` - Visit & Check-In
- `CONSULTATION_REQUEST` - Book a Consultation
- `REDEEM_OFFER` - Redeem Special Offer
- `FIRST_PURCHASE` - Make Your First Purchase
- `REFER_PAYING_CUSTOMER` - Refer a Paying Customer
- `BRING_A_FRIEND` - Bring a Friend
- `UGC_PHOTO_UPLOAD` - Share Your Experience (Photo)
- `UGC_VIDEO_UPLOAD` - Create a Video Review
- `REPEAT_PURCHASE_VISIT` - Loyalty Rewards
- `JOIN_VIP_SAVE_DATE` - Join Our VIP Program

**Requirements**: None (can use screenshot/manual proof)

---

## API Usage

### Activate Mission

**Endpoint**: `POST /activateMission`

**Request Body**:
```json
{
  "businessId": "business123",
  "missionId": "GOOGLE_REVIEW_TEXT",
  "reward": 150,
  "maxParticipants": 100,
  "validUntil": "2025-12-31T23:59:59Z",
  "cooldownPeriod": 30,
  "requiresApproval": false
}
```

**Success Response** (200):
```json
{
  "success": true,
  "activation": {
    "id": "business123_GOOGLE_REVIEW_TEXT",
    "businessId": "business123",
    "missionId": "GOOGLE_REVIEW_TEXT",
    "missionName": "Leave a Google Review",
    "isActive": true,
    "config": {
      "reward": 150,
      "maxParticipants": 100,
      "validUntil": "2025-12-31T23:59:59Z",
      "cooldownPeriod": 30,
      "requiresApproval": false
    },
    "requiredConnectionsBusiness": [
      {
        "type": "google_gbp",
        "displayName": "Google Business Profile",
        "description": "Your Google Business Profile must be connected to verify reviews",
        "setupUrl": "/settings/integrations/google"
      }
    ],
    "requiredConnectionsUser": [
      {
        "type": "google_gbp",
        "displayName": "Google Account",
        "description": "Users must connect their Google account to leave reviews",
        "setupUrl": "/settings/connections"
      }
    ],
    "activatedAt": "2025-01-15T10:30:00Z",
    "currentParticipants": 0
  },
  "userRequirements": [
    {
      "type": "google_gbp",
      "displayName": "Google Account",
      "description": "Users must connect their Google account to leave reviews",
      "setupUrl": "/settings/connections"
    }
  ]
}
```

**Error Response - Missing Connection** (403):
```json
{
  "success": false,
  "error": {
    "code": "MISSING_BUSINESS_CONNECTION",
    "message": "Google Business Profile must be connected to activate this mission. Go to Settings → Integrations to connect your account.",
    "requiredConnection": {
      "type": "google_gbp",
      "displayName": "Google Business Profile",
      "description": "Your Google Business Profile must be connected to verify reviews",
      "setupUrl": "/settings/integrations/google"
    }
  }
}
```

**Error Response - Mission Not Found** (404):
```json
{
  "success": false,
  "error": {
    "code": "MISSION_NOT_FOUND",
    "message": "Mission \"INVALID_MISSION\" not found in catalog"
  }
}
```

**Error Response - Already Active** (409):
```json
{
  "success": false,
  "error": {
    "code": "ALREADY_ACTIVE",
    "message": "This mission is already active for your business"
  }
}
```

**Error Response - Invalid Config** (400):
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CONFIG",
    "message": "Reward must be between 25 and 500 points",
    "field": "reward"
  }
}
```

---

## Frontend Integration

### 1. Display User Requirements in UI

When activation succeeds, show warning badge:

```typescript
const activationResult = await activateMission(businessId, missionId, config);

if (activationResult.success && activationResult.userRequirements.length > 0) {
  // Show warning banner
  showBanner({
    type: 'warning',
    title: 'User Connection Required',
    message: `Users must connect their ${activationResult.userRequirements[0].displayName} to complete this mission.`,
    action: {
      label: 'Setup Guide',
      url: activationResult.userRequirements[0].setupUrl
    }
  });
}
```

### 2. Handle Missing Business Connection

```typescript
try {
  const result = await activateMission(businessId, missionId, config);
} catch (error) {
  if (error.code === 'MISSING_BUSINESS_CONNECTION') {
    // Show connection setup modal
    showConnectionModal({
      title: error.requiredConnection.displayName,
      description: error.requiredConnection.description,
      setupUrl: error.requiredConnection.setupUrl,
      instructions: getConnectionSetupInstructions(error.requiredConnection)
    });
  }
}
```

### 3. Check User Eligibility Before Mission Start

```typescript
const canComplete = await canUserCompleteMission(userId, missionId, businessId);

if (!canComplete.canComplete && canComplete.missingConnection) {
  // Block mission start, show connection requirement
  showErrorModal({
    title: 'Connection Required',
    message: canComplete.missingConnection.description,
    action: {
      label: `Connect ${canComplete.missingConnection.displayName}`,
      url: canComplete.missingConnection.setupUrl
    }
  });
}
```

---

## Error Codes Reference

| Code | HTTP Status | Meaning |
|------|-------------|---------|
| `MISSION_NOT_FOUND` | 404 | Mission ID not in locked catalog |
| `MISSING_BUSINESS_CONNECTION` | 403 | Business lacks required integration |
| `INVALID_CONFIG` | 400 | Config validation failed |
| `ALREADY_ACTIVE` | 409 | Mission already activated |
| `BUSINESS_NOT_FOUND` | 404 | Business doesn't exist |
| `UNAUTHORIZED` | 401 | Not authorized to activate |

---

## Validation Rules

### Reward
- Minimum: 25 points
- Maximum: 500 points

### Max Participants
- Minimum: 1
- Maximum: 10,000

### Valid Until
- Must be future date

---

## Database Schema

### Collection: `missionActivations`

```typescript
{
  id: string;                              // "{businessId}_{missionId}"
  businessId: string;
  missionId: string;
  missionName: string;
  isActive: boolean;
  config: {
    reward: number;                        // 25-500
    maxParticipants: number;               // 1-10000
    validUntil: Timestamp | null;
    cooldownPeriod: number;                // days
    requiresApproval: boolean;
  };
  requiredConnectionsBusiness: ConnectionRequirement[];
  requiredConnectionsUser: ConnectionRequirement[];
  activatedAt: Timestamp;
  deactivatedAt: Timestamp | null;
  currentParticipants: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

## Testing Checklist

### Test Case 1: Activate Google Review Without Connection
1. Create business without Google Business Profile
2. Attempt to activate `GOOGLE_REVIEW_TEXT`
3. ✅ Should return `MISSING_BUSINESS_CONNECTION` error
4. ✅ Error should include setup URL

### Test Case 2: Activate Google Review With Connection
1. Connect Google Business Profile to business
2. Attempt to activate `GOOGLE_REVIEW_TEXT`
3. ✅ Should succeed
4. ✅ Should return `userRequirements` array with Google connection

### Test Case 3: Activate Non-Google Mission Without Connection
1. Create business without any connections
2. Attempt to activate `VISIT_CHECKIN`
3. ✅ Should succeed (no connection required)
4. ✅ `userRequirements` should be empty

### Test Case 4: User Attempts Mission Without Connection
1. Activate mission successfully
2. User without required connection tries to start
3. ✅ `canUserCompleteMission()` should return false
4. ✅ Should include `missingConnection` details

### Test Case 5: Invalid Configuration
1. Attempt to activate with reward = 10 (below minimum)
2. ✅ Should return `INVALID_CONFIG` error
3. ✅ Error should specify field: 'reward'

### Test Case 6: Already Active Mission
1. Activate mission successfully
2. Attempt to activate same mission again
3. ✅ Should return `ALREADY_ACTIVE` error

---

## Next Steps

1. **Update Mission Creation UI**:
   - Show connection requirements before activation
   - Display warning badges for user requirements
   - Add "Setup Connection" CTA when missing

2. **Update User Mission Flow**:
   - Check user connections before allowing mission start
   - Show connection modal if required
   - Track connection prompts in analytics

3. **Add Connection Status Indicators**:
   - Badge on mission cards showing connection status
   - Dashboard widget showing missing connections
   - Setup wizard for new businesses

4. **Implement Firestore Security Rules**:
   ```javascript
   match /missionActivations/{activationId} {
     allow read: if true;
     allow create: if isBusinessOwner(activationId);
     allow update: if isBusinessOwner(activationId);
   }
   ```

5. **Deploy Cloud Functions**:
   ```bash
   firebase deploy --only functions:activateMission,functions:deactivateMission,functions:getMissionActivation
   ```
