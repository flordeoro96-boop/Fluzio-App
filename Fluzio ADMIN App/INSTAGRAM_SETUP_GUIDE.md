# Instagram OAuth Setup Guide

## Current Status
✅ All code implemented and deployed
⏸️ Waiting for Meta Developer credentials

## What's Already Done
- ✅ `services/instagramService.ts` - Full OAuth flow
- ✅ `components/InstagramConnector.tsx` - UI widget
- ✅ `components/InstagramCallbackScreen.tsx` - Callback handler
- ✅ Integrated in 4 locations (Settings, Business Profile, Customer Settings, Linked Accounts)
- ✅ Token refresh logic (60-day tokens)
- ✅ Profile/posts sync

## Setup Steps

### 1. Create Instagram App (5 minutes)

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Click **My Apps** → **Create App**
3. Select **Consumer** as app type
4. App Name: `Fluzio`
5. Contact Email: `sergefreije@live.com`
6. Create App

### 2. Add Instagram Basic Display

1. In your app dashboard, click **Add Product**
2. Find **Instagram Basic Display** → Click **Set Up**
3. Click **Create New App** under Instagram App ID
4. Display Name: `Fluzio`
5. Save Changes

### 3. Configure OAuth Settings

1. Go to **Instagram Basic Display** → **Basic Display**
2. Add **Valid OAuth Redirect URIs**:
   ```
   https://fluzio-13af2.web.app
   http://localhost:5173
   ```
3. Add **Deauthorize Callback URL**:
   ```
   https://fluzio-13af2.web.app/instagram/deauthorize
   ```
4. Add **Data Deletion Request URL**:
   ```
   https://fluzio-13af2.web.app/instagram/data-deletion
   ```
5. Save Changes

### 4. Get Credentials

1. Copy **Instagram App ID**
2. Copy **Instagram App Secret**
3. Save these securely

### 5. Add Test Users (Required for Development)

1. Go to **Instagram Basic Display** → **User Token Generator**
2. Click **Add or Remove Instagram Testers**
3. This opens Instagram → Settings → Apps and Websites
4. Accept the tester invitation
5. Back in Meta dashboard, click **Generate Token** to test

### 6. Update Fluzio Code

Add to `.env` file:
```env
VITE_INSTAGRAM_APP_ID=your_app_id_here
VITE_INSTAGRAM_APP_SECRET=your_app_secret_here
```

Or update `services/instagramService.ts`:
```typescript
const INSTAGRAM_APP_ID = 'YOUR_APP_ID';
const INSTAGRAM_APP_SECRET = 'YOUR_APP_SECRET';
```

### 7. Test the Integration

1. Go to Settings → Social Connections
2. Click "Connect Instagram"
3. Should redirect to Instagram login
4. Approve permissions
5. Redirected back to Fluzio
6. Profile data should load

### 8. Submit for Review (Production)

**Required for public use:**

1. Go to **App Review** → **Permissions and Features**
2. Request these permissions:
   - `instagram_graph_user_profile`
   - `instagram_graph_user_media`
3. Provide:
   - App icon (1024x1024)
   - Privacy Policy URL
   - Terms of Service URL
   - Screencast showing OAuth flow
4. Review takes 2-5 business days

### 9. Go Live

1. In **App Settings** → **Basic**
2. Toggle **App Mode** to **Live**
3. Instagram integration now works for all users!

## Troubleshooting

### "Redirect URI mismatch"
- Make sure `https://fluzio-13af2.web.app` is in Valid OAuth Redirect URIs
- Check for trailing slashes (shouldn't have one)

### "Invalid Client ID"
- Double-check `INSTAGRAM_APP_ID` matches the ID from dashboard
- Make sure you're using Instagram App ID, not Facebook App ID

### "Access Token expired"
- Tokens last 60 days
- App automatically refreshes before expiration
- If expired, user needs to reconnect

### "User not authorized as tester"
- Go to Instagram settings → Apps and Websites
- Accept tester invitation
- Or submit app for review to go public

## Security Notes

- ✅ Never commit `.env` file to git
- ✅ Use environment variables for production
- ✅ App Secret should be server-side only (currently client-side for MVP)
- 🔒 For production, move token exchange to Firebase Functions

## Next Steps After Setup

1. Test with your account
2. Add 5-10 test users (friends/team)
3. Collect feedback
4. Submit for App Review
5. Go live!

## Resources

- [Instagram Basic Display API Docs](https://developers.facebook.com/docs/instagram-basic-display-api)
- [Getting Started Guide](https://developers.facebook.com/docs/instagram-basic-display-api/getting-started)
- [Meta for Developers](https://developers.facebook.com/)

---

**Estimated Time**: 10-15 minutes for setup, 2-5 days for review

**Cost**: Free (Meta doesn't charge for Basic Display API)
