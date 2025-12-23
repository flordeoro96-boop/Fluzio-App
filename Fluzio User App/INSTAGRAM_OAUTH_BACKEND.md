# Instagram OAuth Integration - Backend Implementation Guide

## Overview
This document provides complete instructions for implementing Instagram OAuth authentication for the Fluzio business profile system. The implementation follows the same pattern as Google sign-in, providing a seamless "Connect" button experience with proper token management.

## Prerequisites

### 1. Meta Developer Account Setup
1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create a new app (Type: "Business")
3. Add "Instagram Basic Display" product to your app
4. Configure OAuth redirect URIs:
   - Development: `http://localhost:5000/auth/instagram/callback`
   - Production: `https://yourdomain.com/auth/instagram/callback`

### 2. Required Credentials
Store these in your Firebase project's environment config:

```bash
# In Firebase Functions config
firebase functions:config:set instagram.client_id="YOUR_INSTAGRAM_APP_ID"
firebase functions:config:set instagram.client_secret="YOUR_INSTAGRAM_APP_SECRET"
firebase functions:config:set instagram.redirect_uri="https://yourdomain.com/auth/instagram/callback"
```

For local development, create `.runtimeconfig.json` in functions directory:
```json
{
  "instagram": {
    "client_id": "YOUR_INSTAGRAM_APP_ID",
    "client_secret": "YOUR_INSTAGRAM_APP_SECRET",
    "redirect_uri": "http://localhost:5000/auth/instagram/callback"
  }
}
```

## Backend Implementation

### 1. Update Firestore User Profile Schema

Add Instagram connection to the user profile document:

```typescript
// In Firestore users/{userId} document
{
  ...existingFields,
  socialLinks: {
    instagram: {
      connected: boolean,
      username: string,
      userId: string, // Instagram user ID
      accessToken: string, // Encrypted
      lastSync: Timestamp,
      expired: boolean,
      profilePictureUrl: string // Optional
    }
  }
}
```

### 2. Add Instagram OAuth Functions

Create `functions/src/instagram.ts`:

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';

const INSTAGRAM_API_BASE = 'https://api.instagram.com';
const INSTAGRAM_GRAPH_BASE = 'https://graph.instagram.com';

interface InstagramAuthResponse {
  access_token: string;
  user_id: number;
}

interface InstagramUserProfile {
  id: string;
  username: string;
  account_type: string;
  media_count?: number;
}

// 1. Generate Instagram OAuth URL
export const getInstagramAuthUrl = functions.https.onCall(async (data, context) => {
  // Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const config = functions.config().instagram;
  const userId = context.auth.uid;

  // Generate state parameter for CSRF protection
  const state = Buffer.from(JSON.stringify({
    userId,
    timestamp: Date.now(),
    nonce: Math.random().toString(36).substring(7)
  })).toString('base64');

  // Store state in Firestore for validation (expires in 10 minutes)
  await admin.firestore().collection('oauth_states').doc(state).set({
    userId,
    provider: 'instagram',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + 10 * 60 * 1000)
  });

  // Build Instagram OAuth URL
  const params = new URLSearchParams({
    client_id: config.client_id,
    redirect_uri: config.redirect_uri,
    scope: 'user_profile,user_media',
    response_type: 'code',
    state
  });

  const authUrl = `https://api.instagram.com/oauth/authorize?${params.toString()}`;
  
  return { authUrl };
});

// 2. Handle Instagram OAuth Callback
export const instagramCallback = functions.https.onRequest(async (req, res) => {
  const { code, state, error } = req.query;

  // Handle OAuth errors
  if (error) {
    return res.redirect(`/settings?error=instagram_${error}`);
  }

  if (!code || !state) {
    return res.redirect('/settings?error=instagram_missing_params');
  }

  try {
    // Verify state parameter
    const stateDoc = await admin.firestore().collection('oauth_states').doc(state as string).get();
    
    if (!stateDoc.exists) {
      return res.redirect('/settings?error=instagram_invalid_state');
    }

    const stateData = stateDoc.data()!;
    const userId = stateData.userId;

    // Check if state is expired
    if (stateData.expiresAt.toMillis() < Date.now()) {
      await stateDoc.ref.delete();
      return res.redirect('/settings?error=instagram_state_expired');
    }

    // Delete used state
    await stateDoc.ref.delete();

    const config = functions.config().instagram;

    // Exchange code for access token
    const tokenResponse = await axios.post<InstagramAuthResponse>(
      `${INSTAGRAM_API_BASE}/oauth/access_token`,
      new URLSearchParams({
        client_id: config.client_id,
        client_secret: config.client_secret,
        grant_type: 'authorization_code',
        redirect_uri: config.redirect_uri,
        code: code as string
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    const { access_token, user_id } = tokenResponse.data;

    // Get long-lived access token (valid for 60 days)
    const longLivedTokenResponse = await axios.get(
      `${INSTAGRAM_GRAPH_BASE}/access_token`,
      {
        params: {
          grant_type: 'ig_exchange_token',
          client_secret: config.client_secret,
          access_token
        }
      }
    );

    const longLivedToken = longLivedTokenResponse.data.access_token;

    // Fetch user profile
    const profileResponse = await axios.get<InstagramUserProfile>(
      `${INSTAGRAM_GRAPH_BASE}/${user_id}`,
      {
        params: {
          fields: 'id,username,account_type,media_count',
          access_token: longLivedToken
        }
      }
    );

    const profile = profileResponse.data;

    // Update user profile in Firestore
    await admin.firestore().collection('users').doc(userId).update({
      'socialLinks.instagram': {
        connected: true,
        username: profile.username,
        userId: profile.id,
        accessToken: longLivedToken, // TODO: Encrypt this
        lastSync: admin.firestore.FieldValue.serverTimestamp(),
        expired: false,
        accountType: profile.account_type
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Redirect back to app with success
    return res.redirect('/settings?instagram=connected');

  } catch (error) {
    console.error('Instagram OAuth error:', error);
    return res.redirect('/settings?error=instagram_auth_failed');
  }
});

// 3. Disconnect Instagram
export const disconnectInstagram = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;

  try {
    await admin.firestore().collection('users').doc(userId).update({
      'socialLinks.instagram': admin.firestore.FieldValue.delete(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Instagram disconnect error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to disconnect Instagram');
  }
});

// 4. Refresh Instagram Token (Schedule daily)
export const refreshInstagramTokens = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  const db = admin.firestore();
  
  // Find all users with Instagram connected
  const usersSnapshot = await db.collection('users')
    .where('socialLinks.instagram.connected', '==', true)
    .get();

  const refreshPromises = usersSnapshot.docs.map(async (doc) => {
    const instagram = doc.data().socialLinks?.instagram;
    
    if (!instagram?.accessToken) return;

    try {
      // Refresh long-lived token (extends validity)
      const config = functions.config().instagram;
      const refreshResponse = await axios.get(
        `${INSTAGRAM_GRAPH_BASE}/refresh_access_token`,
        {
          params: {
            grant_type: 'ig_refresh_token',
            access_token: instagram.accessToken
          }
        }
      );

      await doc.ref.update({
        'socialLinks.instagram.accessToken': refreshResponse.data.access_token,
        'socialLinks.instagram.lastSync': admin.firestore.FieldValue.serverTimestamp(),
        'socialLinks.instagram.expired': false
      });

      console.log(`Refreshed Instagram token for user ${doc.id}`);
    } catch (error) {
      console.error(`Failed to refresh Instagram token for user ${doc.id}:`, error);
      
      // Mark as expired
      await doc.ref.update({
        'socialLinks.instagram.expired': true
      });
    }
  });

  await Promise.all(refreshPromises);
  console.log(`Refreshed ${refreshPromises.length} Instagram tokens`);
});
```

### 3. Update Functions Index

Add exports to `functions/src/index.ts`:

```typescript
export { 
  getInstagramAuthUrl, 
  instagramCallback, 
  disconnectInstagram,
  refreshInstagramTokens 
} from './instagram';
```

### 4. Install Dependencies

```bash
cd functions
npm install axios
npm install --save-dev @types/node
```

### 5. Deploy Functions

```bash
firebase deploy --only functions
```

## Frontend Integration

### 1. Add API Service Methods

Update `services/apiService.ts`:

```typescript
async getInstagramAuthUrl(): Promise<string> {
  try {
    const getAuthUrl = httpsCallable(functions, 'getInstagramAuthUrl');
    const result = await getAuthUrl();
    return (result.data as { authUrl: string }).authUrl;
  } catch (error) {
    console.error('[API] Error getting Instagram auth URL:', error);
    throw error;
  }
}

async disconnectInstagram(): Promise<void> {
  try {
    const disconnect = httpsCallable(functions, 'disconnectInstagram');
    await disconnect();
  } catch (error) {
    console.error('[API] Error disconnecting Instagram:', error);
    throw error;
  }
}
```

### 2. Update Connect Handler

Replace the placeholder in `BusinessProfileScreen.tsx`:

```typescript
const handleConnectInstagram = async () => {
  try {
    console.log('[Instagram] Initiating OAuth connection...');
    const authUrl = await api.getInstagramAuthUrl();
    window.location.href = authUrl;
  } catch (error) {
    console.error('[Instagram] Connection error:', error);
    alert('Failed to connect Instagram. Please try again.');
  }
};

const handleDisconnectInstagram = async () => {
  try {
    console.log('[Instagram] Disconnecting...');
    const confirmed = confirm('Are you sure you want to disconnect your Instagram account?');
    if (!confirmed) return;

    await api.disconnectInstagram();
    
    // Refresh user profile to update UI
    await refreshUserProfile();
    
    alert('Instagram disconnected successfully!');
  } catch (error) {
    console.error('[Instagram] Disconnect error:', error);
    alert('Failed to disconnect Instagram. Please try again.');
  }
};
```

## Security Considerations

### 1. Encrypt Access Tokens
Use Google Cloud KMS or Firebase's built-in encryption:

```typescript
import { KMS } from '@google-cloud/kms';

async function encryptToken(token: string): Promise<string> {
  const client = new KMS.KeyManagementServiceClient();
  const projectId = 'your-project-id';
  const locationId = 'global';
  const keyRingId = 'fluzio-keyring';
  const keyId = 'instagram-token-key';

  const name = client.cryptoKeyPath(projectId, locationId, keyRingId, keyId);
  
  const [result] = await client.encrypt({
    name,
    plaintext: Buffer.from(token)
  });

  return result.ciphertext!.toString('base64');
}
```

### 2. Firestore Security Rules

Update `firestore.rules`:

```javascript
match /users/{userId} {
  allow read: if request.auth != null;
  allow write: if request.auth.uid == userId;
  
  // Prevent direct access to sensitive Instagram data
  allow read: if request.auth.uid == userId;
  allow update: if request.auth.uid == userId 
    && !request.resource.data.diff(resource.data).affectedKeys()
      .hasAny(['socialLinks.instagram.accessToken']);
}
```

### 3. Rate Limiting
Add rate limiting to OAuth endpoints:

```typescript
import * as admin from 'firebase-admin';

async function checkRateLimit(userId: string, action: string): Promise<void> {
  const key = `ratelimit:${userId}:${action}`;
  const ref = admin.database().ref(key);
  
  const snapshot = await ref.once('value');
  const count = snapshot.val() || 0;
  
  if (count > 5) { // Max 5 attempts per hour
    throw new functions.https.HttpsError('resource-exhausted', 'Too many attempts');
  }
  
  await ref.set(count + 1);
  await ref.expire(3600); // 1 hour TTL
}
```

## Testing

### 1. Local Testing
```bash
cd functions
npm run serve
```

Test OAuth flow:
1. Navigate to `/settings`
2. Click "Connect Instagram"
3. Should redirect to Instagram auth page
4. Authorize the app
5. Should redirect back with success message

### 2. Production Testing Checklist
- [ ] Meta app approved for production
- [ ] Redirect URIs configured correctly
- [ ] Environment variables set in Firebase
- [ ] Token encryption enabled
- [ ] Rate limiting active
- [ ] Firestore rules deployed
- [ ] Token refresh scheduled job running

## Monitoring

Add logging for Instagram operations:

```typescript
// In each function
functions.logger.info('Instagram OAuth initiated', { userId });
functions.logger.error('Instagram auth failed', { userId, error });
```

View logs:
```bash
firebase functions:log --only instagramCallback
```

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI"**
   - Verify redirect URI in Meta Developer Console matches exactly
   - Check HTTP vs HTTPS
   - Ensure no trailing slashes

2. **"Token expired"**
   - Instagram tokens expire after 60 days
   - Ensure refresh job is running
   - Check `expired` flag in Firestore

3. **"Invalid state parameter"**
   - State document may have expired (10 min TTL)
   - User may have clicked "Connect" twice

4. **"Insufficient permissions"**
   - Verify app has `user_profile` and `user_media` scopes
   - Check Instagram account type (Business/Creator)

## Next Steps

After Instagram is working:
1. Apply same pattern to TikTok OAuth
2. Add Instagram analytics sync
3. Display Instagram media in profile
4. Enable Instagram story mentions tracking

## References
- [Instagram Basic Display API](https://developers.facebook.com/docs/instagram-basic-display-api)
- [OAuth 2.0 Authorization](https://developers.facebook.com/docs/instagram-basic-display-api/overview#authorization)
- [Long-Lived Tokens](https://developers.facebook.com/docs/instagram-basic-display-api/guides/long-lived-access-tokens)
