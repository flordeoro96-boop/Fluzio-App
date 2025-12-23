# Meta Developer Console - Instagram Webhook Configuration Guide

## Prerequisites
- Instagram Business/Creator Account linked to Facebook Page
- Meta App created (App ID: 1247527037206389)
- Cloud Functions deployed

## Step-by-Step Configuration

### 1. Access Meta Developer Console
1. Go to https://developers.facebook.com/apps
2. Select your app: **Fluzio** (ID: 1247527037206389)
3. Navigate to **Products** in the left sidebar

### 2. Add Instagram Product
1. Click **Add Products**
2. Find **Instagram** and click **Set Up**
3. Select **Instagram Graph API**

### 3. Configure Webhooks

#### A. Add Webhook Subscription
1. In the left sidebar, go to **Products** → **Webhooks**
2. Click **Configure Webhooks** for Instagram
3. Enter the following details:

**Callback URL:**
```
https://us-central1-fluzio-13af2.cloudfunctions.net/instagramWebhook
```

**Verify Token:** (use this exact value)
```
fluzio_instagram_webhook_2024
```

4. Click **Verify and Save**

#### B. Subscribe to Events
After the webhook is verified, subscribe to these fields:
- ✅ **messages** - Required for DM verification
- ✅ **messaging_postbacks** - For button interactions
- ⚠️ **message_echoes** (optional) - For sent message tracking

5. Click **Save**

### 4. Test Webhook Connection

#### Manual Test
1. In Webhooks section, click **Test** next to your webhook
2. Select event: **messages**
3. Click **Send to My Server**
4. Check Cloud Function logs:
```bash
firebase functions:log --only instagramWebhook
```

Expected output:
```
Instagram webhook received: { object: 'instagram', entry: [...] }
```

#### Live Test
1. Go to your Instagram business account
2. Send a DM to yourself from another account
3. Check the logs - you should see the message event

### 5. Required Permissions

Ensure your app has these permissions approved:
1. Go to **App Review** → **Permissions and Features**
2. Request these permissions:
   - `instagram_basic` - ✅ Already approved
   - `instagram_manage_messages` - ⚠️ **REQUEST THIS**
   - `pages_show_list` - ✅ Already approved
   - `pages_read_engagement` - ⚠️ **REQUEST THIS**

**To request permissions:**
1. Click **Request** next to each permission
2. Fill out the usage description:
   ```
   This permission is used to verify that users have followed our business 
   Instagram accounts as part of our rewards program. We receive messages 
   via webhook when users complete follow tasks, and we verify the follow 
   status using the Instagram Graph API.
   ```
3. Provide screencasts/screenshots showing the feature
4. Submit for review

### 6. Page Access Token Setup

For the verification to work, each business needs their Instagram connected:

1. **Business Owner Action:**
   - Go to Settings → Connections → Instagram
   - Click "Connect Instagram"
   - Complete OAuth flow
   - This saves the Page Access Token to Firestore

2. **Verify Token Storage:**
```javascript
// Check in Firestore: users/{businessId}
{
  socialAccounts: {
    instagram: {
      connected: true,
      username: "business_handle",
      accessToken: "EAABwz...", // Page Access Token
      pageId: "123456789"
    }
  }
}
```

### 7. Testing the Full Flow

#### Test Scenario
1. **Create Test Mission:**
   - Business: "Flor de Oro"
   - Mission Type: "Instagram Follow"
   - Reward: 50 points

2. **User Accepts Mission:**
   ```javascript
   // Frontend calls:
   const { dmLink, token } = await InstagramFollowService.generateFollowLink(
     userId,
     businessId,
     missionId
   );
   // dmLink = "https://ig.me/m/flordeoro?ref=abc123..."
   ```

3. **User Follows:**
   - User clicks the link (opens Instagram app/web)
   - User clicks "Follow" on the profile
   - User sends any message (e.g., "Done")

4. **Webhook Receives Event:**
   ```json
   {
     "object": "instagram",
     "entry": [{
       "messaging": [{
         "sender": { "id": "IGSID_123" },
         "message": {
           "text": "Done",
           "referral": { "ref": "abc123..." }
         }
       }]
     }]
   }
   ```

5. **Verification API Call:**
   ```
   GET https://graph.facebook.com/IGSID_123?fields=is_user_follow_business&access_token=PAGE_TOKEN
   
   Response: { "is_user_follow_business": true }
   ```

6. **Points Awarded:**
   - Mission marked as COMPLETED
   - User receives 50 points
   - Notification sent

### 8. Monitoring & Debugging

#### View Webhook Events
```bash
# Real-time logs
firebase functions:log --only instagramWebhook

# Filter for errors
firebase functions:log --only instagramWebhook | grep ERROR
```

#### Check Verification Records
In Firestore Console:
- Collection: `instagramFollowVerifications`
- Filter by status: `PENDING`, `VERIFIED`, `FAILED`

#### Common Issues

**Issue 1: Webhook not receiving events**
- ✅ Check webhook URL is correct
- ✅ Verify token matches
- ✅ Ensure app is in "Live" mode (not Development)

**Issue 2: "Business Instagram not configured" error**
- ✅ Business needs to complete Instagram OAuth
- ✅ Check `socialAccounts.instagram.accessToken` exists
- ✅ Token must be a Page Access Token (not User Token)

**Issue 3: "User did not follow the account"**
- ✅ User must actually click "Follow" 
- ✅ Wait a few seconds after following before sending DM
- ✅ Instagram account must be Business/Creator (for API access)

**Issue 4: Token expired**
- ✅ Tokens expire after 24 hours
- ✅ User must complete within timeframe
- ✅ Generate new link if expired

### 9. Production Checklist

Before going live:
- [ ] Instagram product added to Meta App
- [ ] Webhook URL configured and verified
- [ ] Subscribed to `messages` event
- [ ] `instagram_manage_messages` permission approved
- [ ] Test flow completed successfully
- [ ] Business Instagram accounts connected
- [ ] Error monitoring set up
- [ ] User documentation created

### 10. Security Considerations

**Webhook Security:**
```javascript
// In production, verify the signature
const signature = req.headers['x-hub-signature-256'];
// Validate against app secret
```

**Token Storage:**
- Page Access Tokens stored encrypted in Firestore
- Never expose tokens to frontend
- Refresh tokens before expiry (60 days)

**Rate Limiting:**
- Instagram API: 200 calls/hour per user
- Implement caching for frequent checks
- Queue verification requests if high volume

---

## Quick Start Commands

```bash
# Deploy functions
firebase deploy --only functions:generateInstagramFollowLink,functions:instagramWebhook

# View logs
firebase functions:log --only instagramWebhook

# Test webhook locally (requires Firebase emulators)
firebase emulators:start --only functions

# Check function status
firebase functions:list
```

## Support Resources

- Meta Developer Docs: https://developers.facebook.com/docs/instagram-api
- Webhook Reference: https://developers.facebook.com/docs/graph-api/webhooks
- Instagram Messaging: https://developers.facebook.com/docs/messenger-platform/instagram

## Next Steps

1. Complete webhook configuration in Meta Developer Console
2. Request and get approved for `instagram_manage_messages` permission
3. Connect business Instagram accounts via OAuth
4. Test the full flow with a real user
5. Monitor logs and fix any issues
6. Deploy to production

---

**Configuration Status:**
- ✅ Cloud Functions deployed
- ⏳ Webhooks configured (needs business to complete)
- ⏳ Permissions approved (pending Meta review)
- ⏳ Business Instagram connected (needs OAuth completion)
