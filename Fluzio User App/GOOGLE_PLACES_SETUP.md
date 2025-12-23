# Google Places API Setup Guide

## Overview
The address autocomplete feature uses Google Places API to provide smart address suggestions and auto-fill address fields (street, city, zip code) automatically.

## Setup Steps

### 1. Get Google Places API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the following APIs:
   - **Places API**
   - **Geocoding API** (for reverse geocoding with current location)
4. Go to **Credentials** → **Create Credentials** → **API Key**
5. Copy the generated API key

### 2. Restrict API Key (Security)

⚠️ **Important**: Restrict your API key to prevent unauthorized use

1. Click on your API key in the Credentials page
2. Under **Application restrictions**:
   - Select **HTTP referrers (websites)**
   - Add your domains:
     ```
     https://fluzio-13af2.web.app/*
     https://fluzio-13af2.firebaseapp.com/*
     http://localhost:5173/*  (for development)
     ```
3. Under **API restrictions**:
   - Select **Restrict key**
   - Choose:
     - Places API
     - Geocoding API

### 3. Add to Environment Variables

Add the API key to your `.env` file:

```env
VITE_GOOGLE_PLACES_API_KEY=AIzaSy...your-key-here
```

### 4. Enable Billing (Required)

Google Places API requires billing to be enabled:
- You get **$200 free credit per month**
- Typical usage for this feature:
  - **Autocomplete**: $2.83 per 1,000 requests
  - **Geocoding**: $5 per 1,000 requests
  - Most apps stay within free tier

## Features Enabled

### ✅ Address Autocomplete
- Type address → get suggestions
- Select → auto-fills street, city, zip code
- Works worldwide

### ✅ Current Location Detection
- Click "Use my current location"
- Automatically detects and fills address
- Uses reverse geocoding

### ✅ Smart Parsing
Automatically extracts:
- Street number + route name
- City/locality
- Postal/ZIP code
- Country

## Usage in App

The `AddressAutocomplete` component is used in:

1. **Business Signup** (Step 4) - Location Anchor section
   - Physical address for business location
   - Auto-fills city to match with missions

2. **Creator Signup** (Step 4) - Shipping Address section
   - Home address for reward deliveries
   - Ensures accurate shipping information

## Cost Optimization

To minimize costs:

1. **Session Tokens** (already implemented):
   ```javascript
   // Autocomplete groups requests into sessions
   // Charged once per session instead of per keystroke
   ```

2. **Request only needed fields**:
   ```javascript
   fields: ['address_components', 'formatted_address', 'geometry']
   ```

3. **Monitor usage** in Google Cloud Console
4. **Set budget alerts** to avoid unexpected charges

## Fallback Behavior

If API key is not configured:
- Component shows warning in console
- Falls back to manual text input
- Users can still enter addresses manually

## Testing

1. **Development**: Test with localhost
2. **Staging**: Test with Firebase preview URL
3. **Production**: Verify API restrictions work

## Troubleshooting

### "This page can't load Google Maps correctly"
- Check API key is correct in `.env`
- Verify Places API is enabled
- Check billing is enabled
- Verify domain restrictions match

### "REQUEST_DENIED"
- API key restrictions too strict
- Make sure your domain is whitelisted
- Check API restrictions include Places API

### Autocomplete not appearing
- Check browser console for errors
- Verify script loads: check Network tab
- Try incognito mode (extensions can block)

## Alternative: Free Solution

If you prefer not to use Google Places API:

1. Use **Nominatim** (OpenStreetMap) - Free but has rate limits
2. Use **Mapbox Places** - $0.50 per 1,000 requests (cheaper)
3. Keep manual input only

To disable autocomplete:
```typescript
// In .env, leave blank or set to placeholder
VITE_GOOGLE_PLACES_API_KEY=YOUR_GOOGLE_PLACES_API_KEY_HERE
```

## Resources

- [Google Places API Documentation](https://developers.google.com/maps/documentation/places/web-service)
- [Pricing Calculator](https://mapsplatform.google.com/pricing/)
- [API Key Best Practices](https://developers.google.com/maps/api-key-best-practices)
