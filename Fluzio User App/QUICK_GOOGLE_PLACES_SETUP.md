# Quick Google Places API Setup for Fluzio

## You Already Have Google Cloud Setup! ✅

Your Firebase project `fluzio-13af2` is already connected to Google Cloud.
You just need to enable 2 more APIs and get a key.

## 3-Minute Setup

### Step 1: Go to Google Cloud Console
Visit: https://console.cloud.google.com/google/maps-apis/credentials?project=fluzio-13af2

### Step 2: Enable Required APIs
Click these links (they'll auto-select your project):

1. **Places API**: https://console.cloud.google.com/apis/library/places-backend.googleapis.com?project=fluzio-13af2
   - Click "ENABLE"

2. **Geocoding API**: https://console.cloud.google.com/apis/library/geocoding-backend.googleapis.com?project=fluzio-13af2
   - Click "ENABLE"

### Step 3: Create API Key

1. Go to: https://console.cloud.google.com/apis/credentials?project=fluzio-13af2
2. Click "+ CREATE CREDENTIALS" → "API key"
3. Copy the key (looks like: `AIzaSy...`)
4. Click "RESTRICT KEY" (important!)

### Step 4: Restrict the Key (Security)

On the API key page:

**Application restrictions:**
- Select: "HTTP referrers (web sites)"
- Add these referrers:
  ```
  https://fluzio-13af2.web.app/*
  https://fluzio-13af2.firebaseapp.com/*
  http://localhost:5173/*
  ```

**API restrictions:**
- Select: "Restrict key"
- Check these APIs:
  - ✅ Places API
  - ✅ Geocoding API

Click "SAVE"

### Step 5: Add to .env File

Open your `.env` file and replace:
```env
VITE_GOOGLE_PLACES_API_KEY=YOUR_GOOGLE_PLACES_API_KEY_HERE
```

With:
```env
VITE_GOOGLE_PLACES_API_KEY=AIzaSy...your-actual-key
```

### Step 6: Rebuild & Deploy

```bash
npm run build
firebase deploy --only hosting
```

## Cost

**FREE for your usage!**
- $200 free credit per month from Google
- Address autocomplete: ~$3 per 1,000 requests
- You'll likely stay under 1,000 requests/month = FREE

## What You'll Get

✅ **Auto-complete addresses** as users type
✅ **One-click location detection** via GPS
✅ **Auto-fill** street, city, ZIP code
✅ **Works worldwide**

## Test It

1. Go to your signup flow
2. In the "Shipping Address" section
3. Start typing an address → see suggestions appear
4. Or click "Use my current location" → instant fill

## Troubleshooting

**"This page can't load Google Maps correctly"**
- Make sure you clicked "Enable Billing" in Google Cloud
  - Go to: https://console.cloud.google.com/billing?project=fluzio-13af2
  - Enable billing (you get $200 free/month)

**No autocomplete appearing**
- Check browser console for errors
- Verify API key is correct in `.env`
- Make sure Places API is enabled
- Try in incognito mode

**"RefererNotAllowedMapError"**
- Check your referrer restrictions
- Make sure `https://fluzio-13af2.web.app/*` is in the list

## Already Done ✅

- ✅ Component created (`AddressAutocomplete.tsx`)
- ✅ Integrated into Business & Creator signup
- ✅ Environment variable configured
- ✅ TypeScript types added
- ✅ Deployed to production

**You just need the API key!**
