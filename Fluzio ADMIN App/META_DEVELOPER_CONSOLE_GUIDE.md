# Instagram OAuth - Meta Developer Console Setup Guide

## Current Integration Status

✅ **Instagram OAuth is ALREADY integrated** in:
- ✅ Business Profile Settings (`EditBusinessProfile.tsx` - line 517)
- ✅ Customer Settings Modal (`CustomerSettingsModal.tsx` - line 152)
- ✅ General Settings View (`SettingsView.tsx` - line 341)
- ✅ Linked Accounts Modal (`LinkedAccountsModal.tsx` - line 215)

The `InstagramConnector` component appears in all account settings screens for both customers and businesses.

## How to Verify Meta Developer Console Configuration

### Step 1: Access Meta Developer Console
1. Go to: https://developers.facebook.com/apps
2. Log in with your Meta/Facebook account
3. Find your app with ID: **1367253291601420**

### Step 2: Navigate to Instagram Basic Display
1. In the left sidebar, find **"Instagram Basic Display"**
2. Click on it to access Instagram settings

### Step 3: Verify OAuth Redirect URIs
**CRITICAL**: You must add the exact redirect URI to your app settings.

1. Look for **"Valid OAuth Redirect URIs"** or **"OAuth Redirect URLs"**
2. You should see a text field where you can add URLs
3. Add this EXACT URL (copy it exactly):
   ```
   https://fluzio-13af2.web.app/instagram/callback
   ```
4. Click **"Save Changes"** at the bottom

### Step 4: Verify App Details
Make sure these match:

| Field | Expected Value |
|-------|----------------|
| **Client ID** | 1367253291601420 |
| **Instagram App ID** | 1367253291601420 |
| **App Secret** | ed8b62c31467aa2f078c3c8d2be39aa3 |
| **Valid OAuth Redirect URIs** | https://fluzio-13af2.web.app/instagram/callback |

### Step 5: Check App Mode
Your app needs to be in the correct mode:

- **Development Mode**: Only test users can connect
  - You need to add test Instagram accounts manually
  - Go to "Roles" → "Instagram Testers" to add accounts
  
- **Live Mode**: Any Instagram user can connect ✅ (Recommended)
  - Your app is public and ready for real users
  - No need to add test accounts

**To Switch to Live Mode:**
1. Click the toggle at the top of the page
2. Switch from "Development" to "Live"
3. Confirm the change

### Step 6: Verify Permissions/Scopes
Your app should request these permissions:

- ✅ `user_profile` - To get username and account info
- ✅ `user_media` - To access media count and posts (optional)

**Where to check:**
1. Go to "Permissions and Features" in the left sidebar
2. Verify "Instagram Basic Display API" is enabled
3. Check that permissions are granted

### Step 7: Test the Integration
Once configured, test it:

1. Go to: https://fluzio-13af2.web.app
2. Log in as a customer or business
3. Navigate to Settings → Linked Accounts
4. Click "Connect Instagram"
5. You should be redirected to Instagram authorization page
6. Authorize the app
7. You should be redirected back to Fluzio with Instagram connected

## Screenshot of What You Should See in Meta Console

```
┌─────────────────────────────────────────────────────────┐
│  Instagram Basic Display                                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Client ID: 1367253291601420                            │
│  Client Secret: ed8b62************************3         │
│                                                          │
│  Valid OAuth Redirect URIs:                             │
│  ┌────────────────────────────────────────────────┐    │
│  │ https://fluzio-13af2.web.app/instagram/callback│    │
│  └────────────────────────────────────────────────┘    │
│  [+ Add Another]                                        │
│                                                          │
│  Deauthorize Callback URL: (optional)                   │
│  Data Deletion Request URL: (optional)                  │
│                                                          │
│  [Save Changes]                                         │
└─────────────────────────────────────────────────────────┘
```

## Common Issues and Solutions

### Issue 1: "redirect_uri_mismatch" Error
**Cause**: The redirect URI in Meta Console doesn't match exactly.

**Solution**:
- Verify the URI is **exactly**: `https://fluzio-13af2.web.app/instagram/callback`
- No trailing slash
- Must be HTTPS (not HTTP)
- Case-sensitive
- Save changes after adding

### Issue 2: "Invalid Client ID"
**Cause**: App ID doesn't match.

**Solution**:
- Verify Client ID in Meta Console is: `1367253291601420`
- Check that it matches in the code (already configured)

### Issue 3: "This app is in development mode"
**Cause**: App is not in Live mode.

**Solution**:
- Switch app to "Live" mode in Meta Console
- OR add test Instagram accounts in Roles → Instagram Testers

### Issue 4: User sees "Authorization Failed"
**Cause**: User denied permissions or Instagram rejected the request.

**Solution**:
- User must click "Authorize" on Instagram
- Check that app has required permissions enabled
- Verify app is not suspended or restricted

### Issue 5: "Failed to exchange code for token"
**Cause**: Code expired or app secret is wrong.

**Solution**:
- User must complete OAuth flow within 60 seconds
- Verify App Secret matches in functions/index.js
- Check Firebase Functions logs for detailed error

## How to Check if It's Working

### Frontend Check:
1. Open browser console (F12)
2. Go to Settings → Linked Accounts
3. Click "Connect Instagram"
4. You should see console log: `[Instagram] Starting OAuth flow: https://api.instagram.com/oauth/authorize?client_id=...`

### Backend Check:
1. Go to Firebase Console: https://console.firebase.google.com/project/fluzio-13af2
2. Click "Functions" in left sidebar
3. Find `instagramcallback` function
4. Check logs for any errors

### Firestore Check:
After successful connection:
1. Go to Firestore Database in Firebase Console
2. Navigate to: `users/{userId}/socialAccounts/instagram`
3. You should see:
   ```
   {
     connected: true,
     username: "their_username",
     userId: "instagram_user_id",
     accountType: "PERSONAL",
     mediaCount: 123,
     accessToken: "token...",
     connectedAt: "2024-11-30T..."
   }
   ```

## Quick Verification Checklist

Before testing, verify:

- [ ] Meta Developer Console shows Client ID: 1367253291601420
- [ ] Redirect URI added: `https://fluzio-13af2.web.app/instagram/callback`
- [ ] App is in "Live" mode (or test user added if in Development)
- [ ] Instagram Basic Display API is enabled
- [ ] Permissions include `user_profile` and `user_media`
- [ ] Changes are saved in Meta Console
- [ ] Firebase Functions deployed successfully
- [ ] Frontend deployed to: https://fluzio-13af2.web.app

## Where Instagram Integration Appears

### For Customers (Creators):
1. **Sign Up Flow** - Can connect during registration (optional)
2. **Settings → Linked Accounts** - Main integration screen
3. **Customer Settings Modal** - Quick access from dashboard
4. **Profile Screen** - Shows connected status

### For Businesses:
1. **Edit Business Profile → Social Media** - Integration section
2. **Settings → Linked Accounts** - Main integration screen
3. **Business Profile** - Shows Instagram link

## Testing Different Scenarios

### Scenario 1: Fresh Connection
1. User has never connected Instagram
2. Clicks "Connect Instagram"
3. Redirected to Instagram auth
4. Authorizes app
5. Redirected back to Fluzio
6. Sees "Connected ✓" with username

### Scenario 2: Reconnection
1. User previously connected but disconnected
2. Data still in Firestore but `connected: false`
3. Clicks "Connect Instagram" again
4. Goes through OAuth flow
5. New access token saved

### Scenario 3: Disconnect
1. User clicks "Disconnect"
2. Confirms action
3. Firestore updated: `connected: false`
4. UI shows "Connect Instagram" button again

## Support Links

- **Meta Developer Console**: https://developers.facebook.com/apps/1367253291601420
- **Instagram Basic Display API Docs**: https://developers.facebook.com/docs/instagram-basic-display-api
- **OAuth Flow Documentation**: https://developers.facebook.com/docs/instagram-basic-display-api/getting-started
- **Firebase Console**: https://console.firebase.google.com/project/fluzio-13af2
- **Your App URL**: https://fluzio-13af2.web.app

## Next Steps After Verification

Once Instagram OAuth is confirmed working:

1. **Test with real account**: Connect your personal Instagram
2. **Monitor errors**: Check Firebase Functions logs
3. **Add error tracking**: Consider adding Sentry or similar
4. **Token refresh**: Implement automatic token refresh (tokens expire in 60 days)
5. **Enhanced features**:
   - Display Instagram posts on profile
   - Auto-post mission completions to Instagram Stories
   - Instagram insights for businesses
   - Follower count tracking

---

**Current Status**: ✅ Fully deployed and ready for testing
**Last Updated**: November 30, 2025
**Next Action**: Verify redirect URI in Meta Developer Console
