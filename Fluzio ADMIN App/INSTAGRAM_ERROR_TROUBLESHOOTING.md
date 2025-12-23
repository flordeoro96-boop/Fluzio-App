# Instagram OAuth Error: "Invalid platform app" - Troubleshooting Guide

## Error Details
```
Invalid Request: Request parameters are invalid: Invalid platform app
```

This error occurs when trying to connect Instagram and typically means the Meta Developer Console configuration doesn't match the OAuth request.

## Root Causes

### 1. Wrong API Type Selected
**Problem**: Using Instagram Basic Display API credentials with Graph API URLs (or vice versa)

**Solution**: 
- Your app ID `1367253291601420` should be configured for **Instagram Basic Display API**
- NOT Instagram Graph API
- NOT Facebook Login

### 2. Missing or Incorrect Redirect URI

**Required Steps**:

1. Go to https://developers.facebook.com/apps/1367253291601420
2. In left sidebar, find **"Instagram Basic Display"**
3. Scroll to **"Valid OAuth Redirect URIs"**
4. Add this EXACT URL:
   ```
   https://fluzio-13af2.web.app/instagram/callback
   ```
5. Click **"Save Changes"** at the bottom

**Common Mistakes**:
- ❌ `http://` instead of `https://` 
- ❌ Trailing slash: `https://fluzio-13af2.web.app/instagram/callback/`
- ❌ Missing `/instagram/callback` path
- ❌ Different domain or subdomain

### 3. App Not in Correct Mode

**Check App Mode**:
1. Look at top of Meta Developer Console
2. Switch should show either "Development" or "Live"

**If in Development Mode**:
- Only added test users can connect
- Go to **Roles** → **Instagram Testers**
- Add your Instagram account as a test user
- Accept the invitation on Instagram app

**Recommended**: Switch to **Live Mode**
- Any Instagram user can connect
- Better for production testing

### 4. Instagram Basic Display Not Enabled

**Verify Setup**:
1. In Meta Console left sidebar, look for **"Instagram Basic Display"**
2. If you don't see it, you need to **add the product**:
   - Click **"Add Product"** (or similar button)
   - Find **"Instagram Basic Display"**
   - Click **"Set Up"** or **"Add"**

### 5. App Type Mismatch

**Verify App Type**:
1. In Meta Console, check **App Type**
2. Should be: **"None"** or **"Business"**
3. If it says "Consumer" or "Gaming", create a new app

## How to Verify Configuration

### Step 1: Check Instagram Basic Display Settings

In Meta Console → Instagram Basic Display, you should see:

```
┌─────────────────────────────────────────────┐
│ Instagram Basic Display                     │
├─────────────────────────────────────────────┤
│ Client ID: 1367253291601420                 │
│ Client Secret: ed8b62************************│
│                                             │
│ Valid OAuth Redirect URIs:                  │
│ https://fluzio-13af2.web.app/instagram/... │
│                                             │
│ [Save Changes]                              │
└─────────────────────────────────────────────┘
```

### Step 2: Test the OAuth URL

Open this URL in a new browser tab (replace CLIENT_ID if needed):

```
https://api.instagram.com/oauth/authorize?client_id=1367253291601420&redirect_uri=https://fluzio-13af2.web.app/instagram/callback&scope=user_profile,user_media&response_type=code
```

**Expected Results**:
- ✅ Instagram login page appears
- ✅ Shows app name and requested permissions
- ❌ "Invalid platform app" = Configuration issue

### Step 3: Check Browser Console

Before clicking "Connect Instagram" in Fluzio:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Click "Connect Instagram"
4. Check the logged URL

Should show:
```
[Instagram] Starting OAuth flow: https://api.instagram.com/oauth/authorize?client_id=1367253291601420&redirect_uri=https%3A%2F%2Ffluzio-13af2.web.app%2Finstagram%2Fcallback&scope=user_profile,user_media&response_type=code
```

## Quick Fix Checklist

Do these in order:

- [ ] Verify you're in **Instagram Basic Display** section (not Graph API)
- [ ] Confirm Client ID is `1367253291601420`
- [ ] Add redirect URI: `https://fluzio-13af2.web.app/instagram/callback`
- [ ] Click **"Save Changes"**
- [ ] Switch app to **"Live"** mode (or add test user)
- [ ] Clear browser cache and cookies for instagram.com
- [ ] Try connecting again

## Alternative: Create New Instagram App

If above doesn't work, create a fresh app:

### 1. Create New App
1. Go to https://developers.facebook.com/apps
2. Click **"Create App"**
3. Select **"None"** or **"Business"** as app type
4. Give it a name: "Fluzio Instagram"
5. Click **"Create App"**

### 2. Add Instagram Basic Display
1. In the new app dashboard
2. Find **"Add Products to Your App"**
3. Locate **"Instagram Basic Display"**
4. Click **"Set Up"**

### 3. Configure Settings
1. Create Instagram App (button in Basic Display settings)
2. Add **Valid OAuth Redirect URIs**: `https://fluzio-13af2.web.app/instagram/callback`
3. Add **Deauthorize Callback URL**: `https://fluzio-13af2.web.app/instagram/deauthorize` (optional)
4. Add **Data Deletion Request URL**: `https://fluzio-13af2.web.app/instagram/deletion` (optional)
5. Save changes

### 4. Get New Credentials
1. Copy the new **Instagram App ID**
2. Copy the new **Instagram App Secret**
3. Update Fluzio code with new credentials

## Update Fluzio with New Credentials

If you created a new app, update these files:

**File 1: services/instagramService.ts**
```typescript
const INSTAGRAM_CLIENT_ID = 'YOUR_NEW_APP_ID';
```

**File 2: functions/index.js**
```javascript
const appId = "YOUR_NEW_APP_ID";
const appSecret = "YOUR_NEW_APP_SECRET";
```

Then rebuild and redeploy:
```bash
npm run build
firebase deploy
```

## Testing After Fix

1. Clear browser cache
2. Log out and log back into Fluzio
3. Go to Settings → Linked Accounts
4. Click "Connect Instagram"
5. Should redirect to Instagram authorization
6. Authorize the app
7. Should redirect back to Fluzio
8. Instagram should show as connected

## Still Not Working?

### Check Instagram App Status
- Ensure your Instagram account is a **Personal** or **Business/Creator** account
- Private accounts should still work
- Very new Instagram accounts (< 24 hours) might have restrictions

### Verify Domain
- `fluzio-13af2.web.app` must be accessible
- Try opening https://fluzio-13af2.web.app/instagram/callback directly
- Should show 404 or the app (not a connection error)

### Meta Review
- Basic Display API doesn't require review for basic features
- If app is restricted, check "App Review" section in Meta Console

## Contact Support

If still stuck:
- Meta Developer Support: https://developers.facebook.com/support/bugs/
- Provide: App ID, error message, screenshot of configuration
- Check Meta status: https://developers.facebook.com/status/

---

**Most Common Solution**: 
99% of "Invalid platform app" errors are fixed by adding the exact redirect URI to Instagram Basic Display settings and clicking Save Changes.
