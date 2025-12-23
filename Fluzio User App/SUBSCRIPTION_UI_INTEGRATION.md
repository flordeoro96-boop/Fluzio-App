# Subscription UI Integration Guide

## Overview

This guide shows how to integrate the new subscription UI components into your existing mission/meetup creation flows.

## Components Created

1. **SubscriptionTierSelector** - Displays available tiers for user's level
2. **UsageDashboard** - Shows real-time usage and limits
3. **GrowthCreditsStore** - Purchase additional credits
4. **UpgradePrompt** - Modal that appears when users hit limits

## File Locations

```
components/subscription/
├── SubscriptionTierSelector.tsx
├── UsageDashboard.tsx
├── GrowthCreditsStore.tsx
├── UpgradePrompt.tsx
└── index.ts

src/
├── lib/levels/
│   ├── subscriptionTiers.ts (configuration)
│   └── subscriptionTypes.ts (TypeScript types)
└── pages/
    └── SubscriptionPage.tsx (example implementation)
```

## Integration Steps

### 1. Mission Creation Flow

When a user tries to create a mission, validate against their limits:

```typescript
import { useState } from 'react';
import { UpgradePrompt } from '../components/subscription';

const CreateMissionPage = () => {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<'MISSION_LIMIT' | 'PARTICIPANT_LIMIT'>('MISSION_LIMIT');

  const handleCreateMission = async (missionData) => {
    const userId = auth.currentUser?.uid;
    
    // Call Cloud Function to check if user can create mission
    const response = await fetch('https://us-central1-fluzio-13af2.cloudfunctions.net/canCreateMission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        participantCount: missionData.maxParticipants
      })
    });

    const result = await response.json();

    if (!result.canCreate) {
      // Show upgrade prompt based on reason
      if (result.reason === 'MONTHLY_LIMIT_REACHED') {
        setUpgradeReason('MISSION_LIMIT');
      } else if (result.reason === 'PARTICIPANT_LIMIT_EXCEEDED') {
        setUpgradeReason('PARTICIPANT_LIMIT');
      }
      setShowUpgrade(true);
      return;
    }

    // Proceed with mission creation
    // ... existing code
  };

  return (
    <>
      {/* Your existing mission creation form */}
      
      <UpgradePrompt
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        currentLevel={userData.levelProgression.mainLevel}
        currentTier={userData.subscription.tier}
        reason={upgradeReason}
        onUpgrade={handleUpgradeFlow}
      />
    </>
  );
};
```

### 2. Meetup Hosting Flow

```typescript
import { UpgradePrompt } from '../components/subscription';

const CreateMeetupPage = () => {
  const handleHostMeetup = async (meetupData) => {
    // Check if user can host
    const response = await fetch('https://us-central1-fluzio-13af2.cloudfunctions.net/canHostMeetup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: auth.currentUser?.uid })
    });

    const result = await response.json();

    if (!result.canHost) {
      if (result.reason === 'HOSTING_NOT_ALLOWED') {
        // Level 1 users can't host
        setUpgradeReason('LEVEL_LOCKED');
      } else {
        setUpgradeReason('MEETUP_LIMIT');
      }
      setShowUpgrade(true);
      return;
    }

    // Proceed with meetup creation
  };
};
```

### 3. Growth Credits Usage

When using Growth Credits for mission boosts, featured listings, etc:

```typescript
const boostMission = async (missionId: string, creditsRequired: number) => {
  const userId = auth.currentUser?.uid;

  // Deduct credits
  const response = await fetch('https://us-central1-fluzio-13af2.cloudfunctions.net/useGrowthCredits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      credits: creditsRequired,
      description: 'Mission Boost',
      relatedTo: missionId
    })
  });

  const result = await response.json();

  if (!result.success) {
    if (result.error === 'INSUFFICIENT_CREDITS') {
      // Show low credits prompt
      setUpgradeReason('CREDITS_LOW');
      setShowUpgrade(true);
      return;
    }
  }

  // Success - show new balance
  toast.success(`Mission boosted! New balance: ${result.newBalance} FGC`);
};
```

### 4. Add Usage Dashboard to Business Dashboard

```typescript
// src/pages/BusinessDashboard.tsx

import { UsageDashboard } from '../components/subscription';
import { Tabs } from '../components/ui/tabs';

const BusinessDashboard = () => {
  return (
    <Tabs>
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="usage">Usage & Limits</TabsTrigger>
        <TabsTrigger value="missions">Missions</TabsTrigger>
      </TabsList>

      <TabsContent value="usage">
        <UsageDashboard
          userId={userId}
          onUpgradeClick={() => navigate('/subscription')}
        />
      </TabsContent>
    </Tabs>
  );
};
```

### 5. Add Subscription Link to Navigation

```typescript
// Navigation.tsx

<NavLink to="/subscription">
  <Crown className="w-5 h-5" />
  Subscription
</NavLink>
```

## Backend Integration (Cloud Functions)

The following Cloud Functions are already deployed and ready to use:

### canCreateMission
**URL:** `https://us-central1-fluzio-13af2.cloudfunctions.net/canCreateMission`

**Request:**
```json
{
  "userId": "user-123",
  "participantCount": 50
}
```

**Response (Success):**
```json
{
  "success": true,
  "canCreate": true,
  "remaining": 7,
  "unlimited": false
}
```

**Response (Limit Reached):**
```json
{
  "success": false,
  "canCreate": false,
  "reason": "MONTHLY_LIMIT_REACHED",
  "message": "You've reached your monthly mission limit (10). Upgrade your tier for more missions."
}
```

### canHostMeetup
**URL:** `https://us-central1-fluzio-13af2.cloudfunctions.net/canHostMeetup`

**Request:**
```json
{
  "userId": "user-123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "canHost": true,
  "remaining": 3,
  "unlimited": false
}
```

### useGrowthCredits
**URL:** `https://us-central1-fluzio-13af2.cloudfunctions.net/useGrowthCredits`

**Request:**
```json
{
  "userId": "user-123",
  "credits": 50,
  "description": "Mission Boost",
  "relatedTo": "mission-abc"
}
```

**Response (Success):**
```json
{
  "success": true,
  "newBalance": 450
}
```

**Response (Insufficient):**
```json
{
  "success": false,
  "error": "INSUFFICIENT_CREDITS",
  "available": 30,
  "required": 50,
  "message": "Need 50 credits but only have 30. Purchase more."
}
```

## Firestore Real-Time Listeners

Listen to user document for live updates:

```typescript
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

useEffect(() => {
  const userRef = doc(db, 'users', userId);
  
  const unsubscribe = onSnapshot(userRef, (snapshot) => {
    const data = snapshot.data();
    
    // Update UI with new data
    setGrowthCredits(data.growthCredits.available);
    setMissionsRemaining(data.missionUsage.maxMissionsPerMonth - data.missionUsage.missionsCreatedThisMonth);
    setCurrentTier(data.subscription.tier);
  });

  return () => unsubscribe();
}, [userId]);
```

## Helper Functions Usage

Import helpers from subscriptionTiers.ts:

```typescript
import { 
  getPricing, 
  getMonthlyGrowthCredits, 
  getMissionLimits,
  getMeetupLimits,
  getLevelPerks 
} from '../lib/levels/subscriptionTiers';

// Get pricing for specific tier
const pricing = getPricing(3, 'GOLD'); // Level 3, Gold tier
// { monthly: 79, annual: 790, annualMonths: 10 }

// Get monthly credits
const credits = getMonthlyGrowthCredits(3, 'GOLD', true); // With annual bonus
// 960 (800 base + 20% annual bonus)

// Get mission limits
const limits = getMissionLimits(3, 'GOLD');
// {
//   maxMissionsPerMonth: 30,
//   maxParticipants: 100,
//   geographicReach: 'MULTI_COUNTRY',
//   premiumTemplates: true,
//   ...
// }

// Check if feature available
const canAutomate = canUseAutomatedCampaigns(3, 'GOLD');
// false (requires Level 4+ Gold/Platinum)
```

## Stripe Integration (TODO)

### For Subscriptions

Create Cloud Function for Stripe checkout:

```typescript
// functions/src/stripe.ts

exports.createSubscription = onRequest(async (req, res) => {
  const { userId, tier, billingCycle } = req.body;
  
  const userData = await db.collection('users').doc(userId).get();
  const level = userData.data().levelProgression.mainLevel;
  
  const pricing = getPricing(level, tier);
  const amount = billingCycle === 'ANNUAL' ? pricing.annual : pricing.monthly;
  
  // Create Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    customer: userData.data().subscription.stripeCustomerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'eur',
        product_data: {
          name: `Fluzio ${tier} - Level ${level}`,
          description: `${billingCycle} subscription`
        },
        unit_amount: amount * 100,
        recurring: {
          interval: billingCycle === 'ANNUAL' ? 'year' : 'month'
        }
      },
      quantity: 1
    }],
    success_url: 'https://fluzio.app/subscription?success=true',
    cancel_url: 'https://fluzio.app/subscription?canceled=true',
    metadata: { userId, tier, billingCycle }
  });
  
  res.json({ sessionId: session.id });
});
```

### For Growth Credits

```typescript
exports.purchaseGrowthCredits = onRequest(async (req, res) => {
  const { userId, packName } = req.body;
  
  const pack = GROWTH_CREDIT_PACKS.find(p => p.name === packName);
  const userData = await db.collection('users').doc(userId).get();
  const level = userData.data().levelProgression.mainLevel;
  
  const finalPrice = getGrowthCreditPackPrice(pack, level);
  
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'eur',
        product_data: {
          name: `${pack.credits} Growth Credits`,
          description: pack.name
        },
        unit_amount: finalPrice * 100
      },
      quantity: 1
    }],
    success_url: 'https://fluzio.app/credits?success=true',
    metadata: { userId, credits: pack.credits, pack: pack.name }
  });
  
  res.json({ sessionId: session.id });
});
```

## Next Steps

1. ✅ UI Components (COMPLETE)
2. ⏳ Stripe Integration (TODO)
3. ⏳ Level Progression System (TODO)
4. ⏳ Campaign Automation (TODO)
5. ⏳ Verified Badge System (TODO)

## Testing

### Test with Demo Data

1. Visit `/subscription` page
2. Click demo buttons to trigger upgrade prompts
3. Test tier selection (Stripe not connected yet)
4. Test credits purchase (Stripe not connected yet)

### Test Cloud Functions

```bash
# Test canCreateMission
curl -X POST https://us-central1-fluzio-13af2.cloudfunctions.net/canCreateMission \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user","participantCount":50}'

# Test canHostMeetup
curl -X POST https://us-central1-fluzio-13af2.cloudfunctions.net/canHostMeetup \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user"}'

# Test useGrowthCredits
curl -X POST https://us-central1-fluzio-13af2.cloudfunctions.net/useGrowthCredits \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user","credits":50,"description":"Test"}'
```

## Support

For questions or issues:
1. Check `subscriptionTiers.ts` for all configuration
2. Check `subscriptionTypes.ts` for TypeScript types
3. Review Cloud Functions in `functions/index.js` lines 2916-3185
4. See example implementation in `src/pages/SubscriptionPage.tsx`
