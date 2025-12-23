# Complete API Access Setup Guide for Fluzio

This document outlines ALL the API access and OAuth configurations needed for Fluzio's missions and integrations.

## 🎯 Required API Access Overview

### ✅ Already Integrated (Needs Access Setup):
1. **Google Business Profile API** - For Google Reviews mission
2. **Google Calendar API** - For appointment booking with calendar sync
3. **Instagram Basic Display API** - For Instagram follow/story missions

### ⏳ Future Integrations:
4. TikTok API - For TikTok video missions
5. Facebook Graph API - For Facebook engagement missions

---

## 1️⃣ Google Business Profile API Setup

### Purpose
- Verify Google Reviews from customers
- Auto-detect review submissions
- Award points automatically

### Setup Steps

#### A. Enable the API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Navigate to: **APIs & Services** → **Library**
4. Search for: **"Google Business Profile API"** (formerly My Business API)
5. Click **ENABLE**

#### B. Create Service Account
1. Go to: **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **Service Account**
3. Name: "Fluzio Review Verification"
4. Grant role: **Service Account User**
5. Click **DONE**
6. Click on the service account email
7. Go to **KEYS** tab → **ADD KEY** → **Create new key** → **JSON**
8. Download the JSON file (keep it secure!)

#### C. Configure OAuth Consent
1. **APIs & Services** → **OAuth consent screen**
2. User type: **External**
3. App information:
   - App name: **Fluzio**
   - User support email: your-email@domain.com
   - App logo: Upload your logo (120x120px)
4. Scopes: Add these:
   ```
   https://www.googleapis.com/auth/business.manage
   https://www.googleapis.com/auth/userinfo.email
   ```
5. Test users: Add business owner emails

#### D. Create OAuth Client ID
1. **APIs & Services** → **Credentials**
2. **+ CREATE CREDENTIALS** → **OAuth client ID**
3. Application type: **Web application**
4. Name: "Fluzio Google Business"
5. Authorized redirect URIs:
   ```
   http://localhost:3000/auth/google/callback
   https://YOUR-APP.web.app/auth/google/callback
   https://YOUR-APP.firebaseapp.com/auth/google/callback
   ```
6. Click **CREATE**
7. **Save**: Client ID and Client Secret

#### E. Store Credentials
```bash
# Firebase Functions config
firebase functions:config:set google.business.client_id="YOUR_CLIENT_ID"
firebase functions:config:set google.business.client_secret="YOUR_CLIENT_SECRET"

# Service account (base64 encode the JSON)
firebase functions:config:set google.business.service_account="$(cat service-account.json | base64)"
```

### Required Scopes
- `https://www.googleapis.com/auth/business.manage` - Read business info and reviews
- `https://www.googleapis.com/auth/userinfo.email` - Get user email

### Business Owner Action Required
Each business must:
1. Connect their Google Business Profile
2. Grant Fluzio access to read reviews
3. Verify their Place ID is correct

---

## 2️⃣ Google Calendar API Setup

### Purpose
- Show real-time availability for appointments
- Auto-sync appointments to business calendar
- Send calendar invites to customers

### Setup Steps

#### A. Enable the API
1. [Google Cloud Console](https://console.cloud.google.com/)
2. Select project → **APIs & Services** → **Library**
3. Search: **"Google Calendar API"**
4. Click **ENABLE**

#### B. Configure OAuth (if not done for Google Business)
1. **APIs & Services** → **OAuth consent screen**
2. Add scopes:
   ```
   https://www.googleapis.com/auth/calendar
   https://www.googleapis.com/auth/calendar.events
   ```

#### C. Create OAuth Client ID
1. **APIs & Services** → **Credentials**
2. **+ CREATE CREDENTIALS** → **OAuth client ID**
3. Application type: **Web application**
4. Name: "Fluzio Calendar Integration"
5. Authorized redirect URIs:
   ```
   http://localhost:3000/auth/calendar/callback
   https://YOUR-APP.web.app/auth/calendar/callback
   ```
6. Click **CREATE**
7. **Save**: Client ID and Client Secret

#### D. Store Credentials
```bash
firebase functions:config:set google.calendar.client_id="YOUR_CLIENT_ID"
firebase functions:config:set google.calendar.client_secret="YOUR_CLIENT_SECRET"
```

### Required Scopes
- `https://www.googleapis.com/auth/calendar` - Read/write calendar events
- `https://www.googleapis.com/auth/calendar.events` - Manage events

### Business Owner Action Required
1. Connect Google Calendar in business settings
2. Configure business hours
3. Set appointment durations

---

## 3️⃣ Instagram Basic Display API Setup

### Purpose
- Verify Instagram follows
- Track Instagram story mentions
- Award points for Instagram engagement

### Setup Steps

#### A. Create Meta App
1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Click **My Apps** → **Create App**
3. Use case: **Consumer**
4. App name: **Fluzio**
5. Contact email: your-email@domain.com
6. Click **Create App**

#### B. Add Instagram Basic Display
1. In your app dashboard, click **Add Product**
2. Find **Instagram Basic Display** → Click **Set Up**
3. Click **Create New App** at bottom
4. Fill in:
   - Display Name: **Fluzio**
   - Privacy Policy URL: `https://your-domain.com/privacy`
   - Terms of Service URL: `https://your-domain.com/terms`
5. Click **Save Changes**

#### C. Configure OAuth Settings
1. Go to **Instagram Basic Display** → **Basic Display**
2. Add OAuth Redirect URIs:
   ```
   https://YOUR-APP.web.app/auth/instagram/callback
   https://localhost:3000/auth/instagram/callback
   ```
3. Add Deauthorize Callback URL:
   ```
   https://YOUR-APP.web.app/auth/instagram/deauthorize
   ```
4. Add Data Deletion Request URL:
   ```
   https://YOUR-APP.web.app/auth/instagram/delete
   ```
5. Click **Save Changes**

#### D. Get Credentials
1. Instagram App ID: Copy this
2. Instagram App Secret: Click **Show** and copy
3. Store in Firebase:
```bash
firebase functions:config:set instagram.app_id="YOUR_APP_ID"
firebase functions:config:set instagram.app_secret="YOUR_APP_SECRET"
```

#### E. Add Test Users
1. Go to **Roles** → **Instagram Testers**
2. Add Instagram accounts (can add up to 25)
3. Each user must accept the invite in their Instagram app:
   - Settings → Apps and Websites → Tester Invites

#### F. Submit for Review (After Testing)
1. **App Review** → **Permissions and Features**
2. Request these permissions:
   - `instagram_basic` - Basic profile access
   - `instagram_content_publish` - For story verification
3. Provide:
   - App demo video
   - How you use Instagram data
   - Privacy policy
4. Submit and wait for approval (typically 2-7 days)

### Required Permissions
- `instagram_basic` - Read profile info
- `instagram_graph_user_profile` - Read username, account type

### User Action Required
1. Connect Instagram account in app
2. Grant permissions when prompted
3. Allow Fluzio to verify follows/stories

---

## 4️⃣ TikTok API Setup (Future)

### Purpose
- Verify TikTok video uploads
- Track engagement metrics
- Award points for content creation

### Setup Steps

#### A. Apply for Developer Access
1. Go to [TikTok for Developers](https://developers.tiktok.com/)
2. Click **Register**
3. Choose **Company** or **Individual**
4. Fill in application:
   - App name: Fluzio
   - Category: Social Media
   - Description: Gamification platform for business marketing
5. Submit and wait for approval (1-2 weeks)

#### B. Create App
1. Developer Portal → **Manage Apps** → **Create New App**
2. App info:
   - Name: Fluzio
   - Category: Social
   - Icon: Upload logo
3. Click **Create**

#### C. Configure OAuth
1. In app settings → **Login Kit**
2. Add Redirect URIs:
   ```
   https://YOUR-APP.web.app/auth/tiktok/callback
   ```
3. Request permissions:
   - `user.info.basic` - Read profile
   - `video.list` - List user videos
   - `video.upload` - Verify uploads

#### D. Store Credentials
```bash
firebase functions:config:set tiktok.client_key="YOUR_CLIENT_KEY"
firebase functions:config:set tiktok.client_secret="YOUR_CLIENT_SECRET"
```

### Status
⏳ **Not yet implemented** - Requires:
- Developer account approval
- Implementation of TikTok OAuth flow
- Video verification logic

---

## 5️⃣ Firebase Cloud Functions Configuration

### Required Environment Variables

Create `functions/.env` for local development:
```bash
# Google Business Profile
GOOGLE_BUSINESS_CLIENT_ID=your_google_business_client_id
GOOGLE_BUSINESS_CLIENT_SECRET=your_google_business_client_secret
GOOGLE_BUSINESS_SERVICE_ACCOUNT=base64_encoded_json

# Google Calendar
GOOGLE_CALENDAR_CLIENT_ID=your_google_calendar_client_id
GOOGLE_CALENDAR_CLIENT_SECRET=your_google_calendar_client_secret

# Instagram
INSTAGRAM_APP_ID=your_instagram_app_id
INSTAGRAM_APP_SECRET=your_instagram_app_secret

# TikTok (future)
TIKTOK_CLIENT_KEY=your_tiktok_client_key
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret

# General
FRONTEND_URL=https://your-app.web.app
ADMIN_EMAIL=admin@yourdomain.com
```

### Set in Production
```bash
# Set all at once
firebase functions:config:set \
  google.business.client_id="xxx" \
  google.business.client_secret="xxx" \
  google.calendar.client_id="xxx" \
  google.calendar.client_secret="xxx" \
  instagram.app_id="xxx" \
  instagram.app_secret="xxx"

# Deploy
firebase deploy --only functions
```

---

## 📋 Quick Setup Checklist

### Google Business Profile ✅
- [ ] API enabled in Cloud Console
- [ ] Service account created and JSON downloaded
- [ ] OAuth client ID created
- [ ] OAuth consent screen configured
- [ ] Scopes added: `business.manage`, `userinfo.email`
- [ ] Credentials stored in Firebase Functions config
- [ ] Test user added (your business account)

### Google Calendar 📅
- [ ] API enabled in Cloud Console
- [ ] OAuth client ID created
- [ ] Scopes added: `calendar`, `calendar.events`
- [ ] Redirect URIs configured
- [ ] Credentials stored in Firebase Functions config
- [ ] Test calendar connection with your account

### Instagram 📸
- [ ] Meta developer account created
- [ ] App created on Meta for Developers
- [ ] Instagram Basic Display added to app
- [ ] OAuth redirect URIs configured
- [ ] App ID and Secret obtained
- [ ] Credentials stored in Firebase Functions config
- [ ] Test users added (Instagram accounts)
- [ ] Users accepted tester invites
- [ ] Tested follow/story verification
- [ ] **App Review submitted** (for production use)

### TikTok (Future) 🎵
- [ ] Developer access applied for
- [ ] Waiting for approval...

---

## 🔒 Security Best Practices

### Never Commit Secrets
Add to `.gitignore`:
```
functions/.env
functions/service-account.json
.env.local
*.secret
*_secret.json
```

### Rotate Tokens Regularly
- Refresh tokens every 60 days
- Revoke access for deleted accounts
- Monitor API usage for anomalies

### Encrypt Sensitive Data
- Store tokens encrypted in Firestore
- Use Firebase Functions to handle sensitive operations
- Never expose API keys in client-side code

### Rate Limiting
- Implement request throttling
- Cache API responses when possible
- Handle quota exceeded errors gracefully

---

## 🚨 Common Issues & Solutions

### "Access blocked: This app's request is invalid"
**Solution**: 
- Check OAuth consent screen is configured
- Add test users if app is in testing mode
- Verify redirect URI matches exactly

### "Invalid redirect_uri"
**Solution**:
- Check for trailing slashes
- Ensure protocol matches (http vs https)
- Verify domain is authorized

### "Insufficient permissions"
**Solution**:
- Request additional scopes in OAuth consent
- Re-authenticate users
- Check API is enabled

### "Quota exceeded"
**Solution**:
- Request quota increase in Cloud Console
- Implement caching
- Optimize API calls

---

## 📞 Support Resources

### Google APIs
- [Cloud Console](https://console.cloud.google.com/)
- [OAuth Playground](https://developers.google.com/oauthplayground)
- [API Explorer](https://developers.google.com/apis-explorer)

### Instagram/Meta
- [Meta for Developers](https://developers.facebook.com/)
- [Instagram API Docs](https://developers.facebook.com/docs/instagram-basic-display-api)
- [Graph API Explorer](https://developers.facebook.com/tools/explorer/)

### TikTok
- [TikTok Developers](https://developers.tiktok.com/)
- [Developer Portal](https://developers.tiktok.com/apps/)

---

## 🎯 Implementation Priority

### Phase 1 (Current) ✅
1. ✅ Google Reviews mission (needs API access setup)
2. ✅ Appointment booking mission (needs Calendar API)
3. ✅ Instagram follow verification (needs app review)

### Phase 2 (Next 2 weeks)
1. Complete Google Business Profile OAuth flow
2. Complete Google Calendar integration
3. Submit Instagram app for review
4. Test all integrations end-to-end

### Phase 3 (Future)
1. TikTok video verification
2. Facebook engagement missions
3. YouTube video tracking
4. Twitter/X engagement

---

## 📝 Notes

- **Testing Mode**: Start with test users before public launch
- **App Review**: Instagram requires review for production use (2-7 days)
- **Compliance**: Ensure privacy policy covers all data collected
- **GDPR**: Allow users to disconnect and delete data
- **Rate Limits**: Monitor API quotas and request increases if needed

---

**Last Updated**: December 16, 2025  
**Status**: Ready for API access configuration  
**Next Step**: Enable APIs and create OAuth credentials following this guide
