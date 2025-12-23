# Instagram OAuth Setup - Quick Start

## 🚀 5-Minute Setup Guide

### Step 1: Create Instagram App (2 minutes)

1. Go to **https://developers.facebook.com/apps/**
2. Click **"Create App"**
3. Select **"Consumer"**
4. Name: **Fluzio**, Email: **your-email@example.com**
5. Click **Add Products** → Select **Instagram Basic Display**
6. Click **Create New App** under Instagram Basic Display
7. Display Name: **Fluzio**

### Step 2: Configure OAuth URLs (1 minute)

In Instagram Basic Display Settings:

**Valid OAuth Redirect URIs:**
```
https://fluzio-13af2.web.app/instagram-callback
http://localhost:5173/instagram-callback
```

**Deauthorize Callback URL:**
```
https://fluzio-13af2.web.app/instagram-deauthorize
```

**Data Deletion Request URL:**
```
https://fluzio-13af2.web.app/instagram-delete
```

Click **Save Changes**

### Step 3: Get Your Credentials (30 seconds)

In **Basic Display** tab, copy:

- **Instagram App ID**: `123456789012345`
- **Instagram App Secret**: `abc123def456...` (click "Show")

### Step 4: Add to Environment Variables (1 minute)

Create `.env` file in project root:

```env
VITE_INSTAGRAM_CLIENT_ID=YOUR_INSTAGRAM_APP_ID_HERE
VITE_INSTAGRAM_CLIENT_SECRET=YOUR_INSTAGRAM_APP_SECRET_HERE
VITE_INSTAGRAM_REDIRECT_URI=https://fluzio-13af2.web.app/instagram-callback
```

**Replace** `YOUR_INSTAGRAM_APP_ID_HERE` and `YOUR_INSTAGRAM_APP_SECRET_HERE` with your actual credentials.

### Step 5: Rebuild & Deploy (30 seconds)

```bash
npm run build
firebase deploy --only hosting
```

### Step 6: Test (1 minute)

1. Open **https://fluzio-13af2.web.app**
2. Log in
3. Go to **Settings** → **Social Connections**
4. Click **Connect Instagram**
5. Approve permissions
6. ✅ Done!

---

## 🔒 Security Checklist

- [ ] `.env` file added to `.gitignore`
- [ ] Never commit `.env` to git
- [ ] Use production HTTPS URLs for redirect URIs
- [ ] Keep `CLIENT_SECRET` private

---

## 🐛 Troubleshooting

### "Invalid Redirect URI"
- Make sure redirect URI in Meta app **exactly matches** the one in `.env`
- Must include protocol (`https://`)
- No trailing slash

### "Invalid Client Secret"
- Copy the secret again from Meta dashboard
- Make sure no extra spaces in `.env` file
- Restart dev server after changing `.env`

### "Token Expired"
- Click "Sync Now" in Settings to refresh
- Token lasts 60 days and auto-refreshes

---

## 📍 Where to Find Credentials

**Meta for Developers Dashboard:**
https://developers.facebook.com/apps/

1. Select your app
2. Click **Instagram Basic Display** (left sidebar)
3. **App ID** and **App Secret** are at the top

---

## ✅ Verification

After setup, you should see:

**In Settings UI:**
- ✅ Instagram connector with "Connect Instagram" button
- ✅ Clicking redirects to Instagram OAuth
- ✅ After approval, redirects back with username shown
- ✅ "Sync Now" button refreshes data
- ✅ "Load Posts" shows recent media

**In Console Logs:**
```
[Instagram] Starting OAuth flow
[Instagram] OAuth callback detected
[Instagram] Exchanging code for token
[Instagram] ✅ Successfully connected: @your_username
```

**In Firestore:**
```
/users/{userId}/instagram:
  - connected: true
  - username: "@your_username"
  - accountType: "PERSONAL"
  - longLivedToken: "IGQW..."
```

---

## 🎯 Next Steps

1. **Test on mobile**: Open app on phone, connect Instagram
2. **Check Firestore**: Verify data is being saved
3. **Test token refresh**: Wait a few days, click "Sync Now"
4. **Add more features**: Follower count, post analytics, etc.

---

## 📚 Full Documentation

See **INSTAGRAM_INTEGRATION_GUIDE.md** for complete details on:
- Architecture
- API endpoints
- Token management
- Error handling
- Advanced features

---

**Setup time: ~5 minutes** ⏱️  
**Status: Production Ready** ✅  
**Last Updated: 2025** 📅
