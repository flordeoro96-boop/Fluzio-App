# Google My Business API Setup Guide

## Issue
You're getting **429 Rate Limit Exceeded** because the Google My Business API quota is set to `0` - meaning the API isn't enabled for your project.

## Quick Fix (5 minutes)

### Step 1: Enable Google My Business APIs

Go to Google Cloud Console for your project and enable these APIs:

1. **My Business Account Management API**
   - Direct link: https://console.cloud.google.com/apis/library/mybusinessaccountmanagement.googleapis.com?project=fluzio-13af2
   - Click **"ENABLE"**

2. **My Business Business Information API**
   - Direct link: https://console.cloud.google.com/apis/library/mybusinessbusinessinformation.googleapis.com?project=fluzio-13af2
   - Click **"ENABLE"**

3. **My Business Place Actions API** (optional, for reviews)
   - Direct link: https://console.cloud.google.com/apis/library/mybusinessplaceactions.googleapis.com?project=fluzio-13af2
   - Click **"ENABLE"**

### Step 2: Set Up Quota (if needed)

1. Go to: https://console.cloud.google.com/apis/api/mybusinessaccountmanagement.googleapis.com/quotas?project=fluzio-13af2

2. Check the quotas - default should be:
   - **Requests per minute**: 60 (free tier)
   - **Requests per day**: 15,000 (free tier)

3. If quotas show `0`, you may need to:
   - **Enable billing** on your project (Google requires billing even if you stay within free tier)
   - Link: https://console.cloud.google.com/billing/linkedaccount?project=fluzio-13af2

### Step 3: Verify API Keys

1. Go to: https://console.cloud.google.com/apis/credentials?project=fluzio-13af2

2. Make sure your OAuth 2.0 Client IDs include these scopes:
   - `https://www.googleapis.com/auth/business.manage`
   - `https://www.googleapis.com/auth/plus.business.manage`

3. Under **"Application restrictions"**, add:
   ```
   https://fluzio-13af2.web.app
   https://fluzio-13af2.firebaseapp.com
   ```

## Alternative: Manual Place ID (Already Implemented)

If you don't want to set up the APIs, the manual Place ID input is already working! Just:

1. Find your Place ID: https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder
2. Search for "Flor de Oro"
3. Copy the Place ID (starts with `ChIJ...`)
4. Paste it in the manual input field

This bypasses all API calls and still enables the automated Google Review feature.

## Free Tier Limits

Google My Business APIs are **free** up to these limits:
- 60 requests per minute
- 15,000 requests per day
- No cost for basic profile syncing

For a small business, this is more than enough!

## Testing After Setup

1. **Disconnect and reconnect Google** in your Business Profile settings
2. **Try syncing again** - should work now
3. Check browser console - you should see `200 OK` instead of `429`

## Long-term Benefits

Once enabled, you get:
- ✅ Automatic business info sync (hours, photos, reviews)
- ✅ Real Google ratings on your profile
- ✅ Automated review detection
- ✅ Place ID automatically extracted

## Support Links

- **Google Cloud Console**: https://console.cloud.google.com/apis/dashboard?project=fluzio-13af2
- **API Library**: https://console.cloud.google.com/apis/library?project=fluzio-13af2
- **Billing**: https://console.cloud.google.com/billing?project=fluzio-13af2
- **OAuth Credentials**: https://console.cloud.google.com/apis/credentials?project=fluzio-13af2

---

**Note**: The manual Place ID input will always work as a fallback, even if the API isn't enabled. But enabling the API gives you full automation!
