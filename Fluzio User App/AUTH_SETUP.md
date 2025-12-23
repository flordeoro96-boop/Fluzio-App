# Authentication & Profile Management Setup

## ✅ What's Been Implemented

### 1. **AuthContext with Firestore Profile Loading**
Located: `services/AuthContext.tsx`

The AuthContext now includes:
- `userProfile` - User data from Firestore (name, role, city, vibeTags, etc.)
- `loadingProfile` - Loading state for profile fetch
- `refreshUserProfile()` - Manual refresh function

**How it works:**
1. When a user logs in (email/password or Google), Firebase Auth creates a session
2. `onAuthStateChanged` listener detects the login
3. Automatically calls `api.getUser(uid)` to fetch profile from Firestore
4. Stores the profile in `userProfile` state
5. Profile is available app-wide via `useAuth()` hook

### 2. **API Service**
Located: `services/apiService.ts`

Three Cloud Functions integrated:
- `api.createUser(userData)` - Creates user in Firestore during signup
- `api.getUser(userId)` - Fetches user profile from Firestore (used on login)
- `api.updateUser(userId, updates)` - Updates user profile

### 3. **SignUp Flow**
Located: `components/SignUpScreen.tsx`

Complete flow:
1. User fills out onboarding (Steps 0-3)
2. On final submit:
   - Creates Firebase Auth account
   - Gets UID from Firebase
   - Calls `api.createUser()` with complete profile data
   - Profile saved to Firestore `users` collection

### 4. **Login Flow**
When user logs in:
1. Firebase Authentication validates credentials
2. `onAuthStateChanged` fires
3. AuthContext automatically loads profile from Firestore
4. `userProfile` populated with data from signup

### 5. **Example Component**
Located: `components/ProfileScreen.tsx`

Shows how to use the profile data:
```tsx
const { user, userProfile, loadingProfile } = useAuth();

if (loadingProfile || !userProfile) {
  return <div>Loading profile...</div>;
}

return (
  <div>
    <h1>Welcome, {userProfile.name}</h1>
    <p>Role: {userProfile.role}</p>
    <p>City: {userProfile.city}</p>
    {/* etc */}
  </div>
);
```

## 🔧 How to Use in Your Components

### Import the hook:
```tsx
import { useAuth } from '../services/AuthContext';
```

### Use in component:
```tsx
const MyComponent = () => {
  const { user, userProfile, loadingProfile, refreshUserProfile } = useAuth();

  // Handle no auth
  if (!user) {
    return <div>Please log in</div>;
  }

  // Handle loading
  if (loadingProfile || !userProfile) {
    return <div>Loading...</div>;
  }

  // Access profile data
  return (
    <div>
      <h1>{userProfile.name}</h1>
      <p>Email: {userProfile.email}</p>
      <p>Role: {userProfile.role}</p>
      <p>City: {userProfile.city || userProfile.homeCity}</p>
      
      {userProfile.vibeTags && (
        <div>
          {userProfile.vibeTags.map(tag => <span key={tag}>{tag}</span>)}
        </div>
      )}
    </div>
  );
};
```

## 📊 UserProfile Interface

```typescript
export interface UserProfile {
  uid: string;
  email: string;
  role: 'CREATOR' | 'BUSINESS';
  name?: string;
  city?: string;
  homeCity?: string;
  vibeTags?: string[];
  profileComplete?: boolean;
  // Add any other fields from your onboarding
}
```

## 🚀 What Happens When

### User Signs Up:
1. Fills form (email, password, name, role, city, vibeTags, etc.)
2. Firebase Auth creates account → gets UID
3. `api.createUser()` saves to Firestore `users/{uid}`
4. User logged in automatically
5. Profile available in `userProfile`

### User Logs In:
1. Firebase Auth validates credentials
2. `onAuthStateChanged` fires with user
3. `loadUserProfile(uid)` called automatically
4. `api.getUser(uid)` fetches from Firestore
5. Profile data loaded into `userProfile`
6. App renders with full profile data

### User Logs Out:
1. Firebase Auth signs out
2. `userProfile` set to `null`
3. `onAuthStateChanged` fires with `null`

## 🔐 Cloud Functions Setup

All functions are deployed and publicly accessible:
- **createuser**: `https://createuser-uvpokjrjsq-uc.a.run.app`
- **getuser**: `https://getuser-uvpokjrjsq-uc.a.run.app`
- **updateuser**: `https://updateuser-uvpokjrjsq-uc.a.run.app`

Configured with:
- ✅ CORS headers
- ✅ Public invoker access
- ✅ Writes to `users` collection in Firestore

## 📝 Testing

### To test the complete flow:

1. **Sign Up**:
   - Go through signup flow
   - Fill in all profile data
   - Submit → User created in Firestore

2. **Log Out**:
   - Click logout
   - Session cleared

3. **Log In**:
   - Enter same email/password
   - Profile automatically loaded
   - All data from signup appears!

4. **Check Firestore**:
   - Open Firebase Console → Firestore
   - Go to `users` collection
   - Find your UID → see all saved data

## 🎯 Next Steps

You can now:
- ✅ Display user profile data anywhere in the app
- ✅ Update profile with `api.updateUser()`
- ✅ Persist login sessions (Firebase handles this)
- ✅ Access role, city, vibeTags, etc. from Firestore

Just use `const { userProfile } = useAuth()` in any component!
