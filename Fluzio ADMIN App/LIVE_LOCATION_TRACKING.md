# Live Location Tracking System

## Overview
The app now uses **live geolocation** to track user locations in real-time. All location-dependent features (Squad matching, Mission discovery, Activity suggestions) are connected to the user's actual GPS coordinates.

## Key Features

### 1. Automatic Location Tracking
- **On Login**: Immediately fetches user's live location
- **Continuous Updates**: Watches for location changes while app is active
- **Smart Caching**: Stores location for 30 minutes to reduce API calls
- **Background Sync**: Updates localStorage for persistence across sessions

### 2. Reverse Geocoding
- Converts GPS coordinates (lat/lon) to readable addresses
- Uses **OpenStreetMap Nominatim API** (free, no API key needed)
- Extracts: City, District, Address, Country
- Automatic fallback for geocoding failures

### 3. Location Permission Handling
- Requests permission on signup
- Graceful fallback if permission denied
- Clear user messaging about location requirements

## Implementation Details

### Core Service: `locationService.ts`

#### Main Functions

**`getCurrentLocation()`**
```typescript
const location = await getCurrentLocation();
// Returns: { latitude, longitude, city, address, district }
```
- Gets user's current GPS position
- Performs reverse geocoding to get city name
- Returns null if location unavailable

**`updateUserLocation(userId)`**
```typescript
await updateUserLocation(user.id);
```
- Fetches live location
- Updates user in mockStore
- Saves to localStorage for persistence
- Used on login and manual refresh

**`watchUserLocation(userId, onUpdate, onError)`**
```typescript
const watchId = watchUserLocation(
  user.id,
  (location) => console.log('Location updated:', location.city),
  (error) => console.error('Location error:', error)
);
```
- Continuous location monitoring
- Callbacks for updates and errors
- Returns watchId for cleanup
- Configurable accuracy and update frequency

**`getUserLocation(userId, maxAgeMinutes)`**
```typescript
const location = await getUserLocation(user.id, 30);
```
- Returns cached location if recent (default 30 min)
- Fetches fresh location if cache expired
- Optimizes API usage

**`stopWatchingLocation(watchId)`**
```typescript
stopWatchingLocation(watchId);
```
- Stops continuous tracking
- Called on logout or component unmount

### Helper Functions

**`calculateDistance(point1, point2)`**
- Haversine formula for accurate distance calculation
- Returns distance in kilometers
- Used for squad matching and mission proximity

**`formatDistance(km)`**
- Human-readable distance formatting
- Shows meters if < 1km, else kilometers

**`estimateWalkTime(km)`**
- Calculates estimated walking time
- Assumes 5 km/h average walking speed

## Connected Features

### 1. Squad Matching (`squadMatchingService.ts`)
```typescript
const matchResult = findSquadMembers(currentUser, allUsers);
```
- Uses `currentUser.geo.city` for city-based matching
- Calculates distances to find nearby entrepreneurs
- Shows nearby cities with distances when no local users
- All distances calculated from **live GPS coordinates**

### 2. Activity Suggestions (`SquadActivityPlanner.tsx`)
```typescript
generateSuggestions(city, month, squadSize);
```
- Sends current city to Cloud Function
- AI generates location-specific activities
- Weather and seasonal context based on actual location

### 3. Mission Discovery (`ExploreScreen.tsx`, `MissionCard.tsx`)
- Shows distance to missions from current location
- Filters missions by proximity
- Walking time estimates
- "Near you" badges for close missions

### 4. Signup Flow (`SignUpScreen.tsx`)
```typescript
const handleLocationRequest = async () => {
  const location = await getCurrentLocation();
  updateField('city', location.city);
};
```
- Requests location during onboarding
- Pre-fills city field with detected location
- Saves to user profile

## User Flow

### Initial Login/Signup
1. User logs in or signs up
2. App requests location permission
3. GPS coordinates obtained → Reverse geocoded to city name
4. User profile updated with: `geo`, `homeCity`, `location`
5. Location saved to localStorage

### Active Session
1. `App.tsx` mounts → Starts location watch
2. Location updates every 5 minutes or on significant movement
3. All components receive updated user object with latest location
4. Squad matching re-runs when city changes
5. Mission distances recalculated

### Background/Cached
1. If location < 30 min old → Use cached version
2. Reduces battery drain and API calls
3. Refresh manually via "Update Location" button (if implemented)

## Data Structure

### User Object
```typescript
interface User {
  // ... other fields
  location: string;        // Legacy: "Berlin"
  homeCity?: string;       // "Berlin"
  geo?: GeoPoint;          // NEW: Full location data
}

interface GeoPoint {
  latitude: number;        // 52.5200
  longitude: number;       // 13.4050
  address: string;         // "Alexanderplatz, Mitte, Berlin, Germany"
  city: string;            // "Berlin"
  district?: string;       // "Mitte"
}
```

### LocalStorage Keys
- `user_location_{userId}`: JSON stringified GeoPoint
- `user_location_timestamp_{userId}`: Timestamp of last update
- `currentUserId`: Currently logged-in user (for UserSwitcher)

## Configuration

### Geolocation Options
```typescript
{
  enableHighAccuracy: true,    // Use GPS instead of IP/WiFi
  timeout: 10000,              // Wait up to 10s for location
  maximumAge: 300000           // Cache valid for 5 minutes
}
```

### Distance Thresholds
- **Same City**: ≤ 50km
- **Nearby Cities**: ≤ 200km
- **Walking Distance**: < 2km (for "Near you" badge)

### Geocoding API
- **Provider**: OpenStreetMap Nominatim
- **Endpoint**: `https://nominatim.openstreetmap.org/reverse`
- **Rate Limit**: 1 request/second (built-in throttling)
- **User-Agent**: `Fluzio-App/1.0` (required by API)

## Testing

### Manual Testing
1. **Test with Real Location**
   - Allow browser location permission
   - Verify city name appears correctly
   - Check squad members match actual location

2. **Test Location Changes**
   - Use browser dev tools → Sensors → Geolocation override
   - Change coordinates and observe updates
   - Verify squad re-matching and mission distances

3. **Test Permission Denied**
   - Block location in browser settings
   - Verify graceful fallback messaging
   - Check that app still functions (with limited features)

### Mock Locations for Testing
```typescript
// Munich
{ latitude: 48.1351, longitude: 11.5820 }

// Berlin
{ latitude: 52.5200, longitude: 13.4050 }

// Hamburg
{ latitude: 53.5511, longitude: 9.9937 }

// Potsdam
{ latitude: 52.3906, longitude: 13.0645 }
```

## Privacy & Security

### User Privacy
- Location only tracked when app is active
- User must grant permission explicitly
- No location data sent to external servers (except geocoding)
- Can be disabled (app will use fallback city from profile)

### Data Storage
- Location stored locally in browser (localStorage)
- No persistent server-side storage of GPS coordinates
- Only city name sent to Cloud Functions for AI suggestions

### GDPR Compliance
- Clear permission request with purpose explanation
- User can deny and still use app
- Location data not shared with third parties
- Can be deleted by clearing browser data

## Troubleshooting

### Location Not Updating
1. Check browser location permissions
2. Verify HTTPS connection (required for geolocation)
3. Check console for errors
4. Try manual refresh (logout/login)

### Wrong City Detected
1. Geocoding API might be inaccurate for rural areas
2. Check GPS accuracy in browser dev tools
3. Consider manual city override option

### High Battery Usage
1. Reduce location watch frequency
2. Increase `maximumAge` to use cache longer
3. Stop watching when app in background

## Future Enhancements

### Planned Features
- [ ] Manual location override for testing
- [ ] Location history tracking
- [ ] Geofencing for mission check-ins
- [ ] Multi-city user support (frequent travelers)
- [ ] Location-based push notifications
- [ ] "Share my location" for squad meetups
- [ ] Offline mode with last known location

### Performance Optimizations
- [ ] Debounce location updates
- [ ] Batch geocoding requests
- [ ] Local city database (reduce API calls)
- [ ] Service worker for background sync

## Code Examples

### Get Current User Location
```typescript
import { getCurrentLocation } from '../services/locationService';

const location = await getCurrentLocation();
console.log(`You are in ${location.city}`);
```

### Track User Movement
```typescript
import { watchUserLocation, stopWatchingLocation } from '../services/locationService';

useEffect(() => {
  const watchId = watchUserLocation(
    userId,
    (location) => setCurrentLocation(location),
    (error) => console.error(error)
  );

  return () => {
    if (watchId !== null) {
      stopWatchingLocation(watchId);
    }
  };
}, [userId]);
```

### Calculate Distance to Mission
```typescript
import { calculateDistance, formatDistance } from '../services/locationService';

const distanceKm = calculateDistance(userLocation, missionLocation);
const formattedDistance = formatDistance(distanceKm);
console.log(`Mission is ${formattedDistance} away`);
```

## Related Files

### Core Services
- `services/locationService.ts` - Main location tracking logic
- `services/squadMatchingService.ts` - Location-based squad matching
- `hooks/useLocation.ts` - React hook for components

### Components Using Location
- `App.tsx` - Initializes location tracking
- `components/SignUpScreen.tsx` - Requests permission
- `components/SquadView.tsx` - Shows local squad members
- `components/ExploreScreen.tsx` - Displays nearby missions
- `components/MissionCard.tsx` - Shows distance to mission
- `components/SquadActivityPlanner.tsx` - Sends city for AI suggestions

### Cloud Functions
- `server/index.js` - `suggestsquadactivity` function uses city parameter

## Summary

The live location tracking system is fully integrated across the app:
- ✅ Real GPS coordinates obtained on login
- ✅ Automatic reverse geocoding to city names
- ✅ Continuous location monitoring
- ✅ Squad matching based on live location
- ✅ Mission distances calculated from current position
- ✅ AI activity suggestions for actual city
- ✅ Smart caching for performance
- ✅ Privacy-conscious implementation

All location-dependent features now work with **live user location** instead of hardcoded mock data.
