# Instagram Follow Verification System

## Overview
This system allows businesses to verify that users have followed their Instagram account and reward them with points. It works with **personal Instagram accounts** (no Business account required for users).

## How It Works

### User Flow
1. User sees a mission: "Follow @businessname on Instagram - Earn 50 points"
2. User clicks "Start Mission"
3. System generates a unique tracking link: `https://ig.me/m/businessname?ref=TOKEN`
4. User clicks the link, follows the business, and sends a DM
5. System receives webhook from Instagram
6. System verifies the follow status via Instagram API
7. User receives points automatically

### Technical Flow

#### Phase 1: Link Generation
```
POST /api/instagram/generate-follow-link
Body: { userId, businessId, missionId }
Response: { dmLink: "https://ig.me/m/businessname?ref=abc123" }
```

#### Phase 2: Webhook Reception
```
POST /instagram/webhook
Body: Instagram message event
Extract: sender_id (IGSID), ref token
```

#### Phase 3: Follow Verification
```
GET https://graph.facebook.com/{IGSID}?fields=is_user_follow_business&access_token={PAGE_TOKEN}
Response: { is_user_follow_business: true }
```

#### Phase 4: Reward
```
- Mark mission as complete
- Award points to user
- Send confirmation DM
```

## Database Schema

### followVerifications Collection
```javascript
{
  id: "verification_id",
  token: "unique_token",
  fluzioUserId: "user_123",
  businessId: "business_456",
  missionId: "mission_789",
  status: "PENDING" | "VERIFIED" | "FAILED",
  igsid: "instagram_scoped_user_id", // Set when DM received
  createdAt: timestamp,
  verifiedAt: timestamp,
  expiresAt: timestamp // 24 hours from creation
}
```

## Implementation Status

- [ ] Phase 1: API endpoint to generate verification links
- [ ] Phase 2: Instagram webhook handler
- [ ] Phase 3: Follower verification API integration
- [ ] Phase 4: Points reward system
- [ ] Frontend: Mission UI for Instagram follow tasks
- [ ] Meta App: Configure webhooks

## Next Steps

1. Create Cloud Function for link generation
2. Set up Instagram webhook endpoint
3. Implement verification logic
4. Test end-to-end flow
5. Deploy and configure Meta App webhooks

## Security Considerations

- Tokens are single-use and expire after 24 hours
- IGSID is stored securely and never exposed to frontend
- Webhook signature verification required
- Rate limiting on verification attempts
