# Instagram Integration Removal Guide

## Overview
This guide outlines the steps to completely remove Instagram integration from Fluzio now that the native feed system is operational.

## Current State
✅ Native feed system fully implemented  
✅ Content creation works without Instagram  
⚠️ Instagram OAuth code still present (not actively used)  
⚠️ Legacy socialAccounts.instagram fields in User model  

## Files to Remove

### Components
```
❌ components/InstagramCallbackScreen.tsx
❌ components/InstagramConnector.tsx
```

### Services
```
❌ services/instagramFollowService.ts
❌ services/instagramService.ts
```

### Backend Functions
```
❌ functions/generateInstagramFollowLink (Cloud Function)
❌ functions/instagramWebhook (Cloud Function)
```

### Firestore Collections
```
❌ instagramFollowVerifications (entire collection)
❌ instagramOAuthTokens (if exists)
```

## Files to Update

### 1. App.tsx
**Remove imports:**
```typescript
- import { InstagramCallbackScreen } from './components/InstagramCallbackScreen';
```

**Remove state:**
```typescript
- const [isInstagramCallbackOpen, setIsInstagramCallbackOpen] = useState(false);
```

**Remove OAuth callback logic (lines ~2240-2260):**
```typescript
// DELETE THIS BLOCK
// Check for Instagram OAuth callback
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const error = params.get('error');
  
  if (code || error) {
    setIsInstagramCallbackOpen(true);
    // ... rest of callback logic
  }
}, []);
```

**Remove callback screen render (lines ~3324-3335):**
```typescript
// DELETE THIS BLOCK
if (isInstagramCallbackOpen) {
  return (
    <InstagramCallbackScreen 
      code={...}
      onComplete={...}
    />
  );
}
```

**Remove social reach calculation (lines ~1121-1123):**
```typescript
// DELETE THIS BLOCK
if (userData.socialAccounts?.instagram?.followers) {
  socialReach += userData.socialAccounts.instagram.followers;
}
```

### 2. types.ts
**Update User interface:**
```typescript
// REMOVE instagram from socialAccounts
socialAccounts?: {
  // instagram?: SocialAccount;  ❌ DELETE THIS
  tiktok?: SocialAccount;
  twitter?: SocialAccount;
  facebook?: SocialAccount;
}

// REMOVE instagram from SocialLinks
export interface SocialLinks {
  // instagram?: SocialConnection;  ❌ DELETE THIS
  twitter?: string;
  linkedin?: string;
}

// REMOVE instagram from integrations
integrations?: {
  // instagram?: { ... };  ❌ DELETE THIS
  googleBusiness?: { ... };
}
```

### 3. CreatorSetupModal.tsx (if exists)
Remove Instagram verification steps and replace with:
- Portfolio upload (native content)
- Sample work showcase
- Skills/interests selection

### 4. Level2SubscriptionService.ts
**Remove Instagram mission flags:**
```typescript
// DELETE this property
export interface Level2Features {
  // instagramFollowMissions: boolean;  ❌ DELETE
  // ... keep other features
}
```

### 5. Mission System
**Update mission types:**
```typescript
// In types/missionSystem.ts
export type SocialMissionPlatform = 
  // 'INSTAGRAM' |  ❌ DELETE
  'TIKTOK' | 
  'FACEBOOK';
```

## Database Migration

### Firestore Data Cleanup

**1. Remove Instagram data from users:**
```javascript
// Run in Firebase Console or admin script
const users = await db.collection('users').get();

const batch = db.batch();
users.forEach(doc => {
  const ref = db.collection('users').doc(doc.id);
  batch.update(ref, {
    'socialAccounts.instagram': firebase.firestore.FieldValue.delete(),
    'socialLinks.instagram': firebase.firestore.FieldValue.delete(),
    'integrations.instagram': firebase.firestore.FieldValue.delete()
  });
});

await batch.commit();
console.log('Removed Instagram data from users');
```

**2. Delete verification collections:**
```javascript
// Delete instagramFollowVerifications
const verificationsRef = db.collection('instagramFollowVerifications');
const snapshot = await verificationsRef.get();

const deletePromises = [];
snapshot.forEach(doc => {
  deletePromises.push(doc.ref.delete());
});

await Promise.all(deletePromises);
console.log('Deleted Instagram verifications');
```

**3. Archive Instagram-linked missions:**
```javascript
// Update missions that required Instagram
const missions = await db.collection('missions')
  .where('socialPlatform', '==', 'INSTAGRAM')
  .get();

const batch = db.batch();
missions.forEach(doc => {
  batch.update(doc.ref, {
    status: 'ARCHIVED',
    archivedReason: 'Instagram integration removed'
  });
});

await batch.commit();
console.log('Archived Instagram missions');
```

## Backend Cleanup

### Cloud Functions

**1. Delete functions:**
```bash
cd functions
firebase functions:delete generateInstagramFollowLink
firebase functions:delete instagramWebhook
firebase functions:delete verifyInstagramFollow
```

**2. Remove from functions/src/index.ts:**
```typescript
// DELETE these exports
// export { generateInstagramFollowLink } from './instagram/generateFollowLink';
// export { instagramWebhook } from './instagram/webhook';
```

**3. Delete function files:**
```bash
rm -rf functions/src/instagram/
```

### Environment Variables

**Remove from .env:**
```bash
# DELETE these
INSTAGRAM_APP_ID=
INSTAGRAM_APP_SECRET=
INSTAGRAM_REDIRECT_URI=
META_VERIFY_TOKEN=
```

## Creator Verification Update

### Old System (Instagram-based)
- Required Instagram account connection
- Verified via follower count
- Used OAuth flow

### New System (Portfolio-based)
```typescript
interface CreatorVerification {
  portfolioPosts: string[];  // FeedPost IDs
  skills: string[];
  bio: string;
  experience: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'PRO';
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedBy?: string;  // Admin ID
  reviewNotes?: string;
}
```

**Admin review criteria:**
1. Quality of portfolio posts (minimum 3)
2. Content originality
3. Engagement with community
4. Professional bio/description

## Testing After Removal

### Regression Tests
1. ✅ User signup works without Instagram
2. ✅ Creator applications use portfolio review
3. ✅ Missions don't reference Instagram
4. ✅ Social sharing still works (native share)
5. ✅ Feed posts display correctly
6. ✅ No broken links or references

### Migration Verification
```bash
# Search for remaining Instagram references
grep -r "instagram" --exclude-dir=node_modules .
grep -r "Instagram" --exclude-dir=node_modules .

# Should only find:
# - Comments explaining removal
# - This migration guide
# - Historical changelog entries
```

## Rollout Plan

### Phase 1: Preparation (1 week)
- ✅ Native feed system tested
- ✅ Portfolio review process defined
- ✅ Admin moderation tools ready
- [ ] User communication prepared

### Phase 2: Migration (2 weeks)
- [ ] Announce to users (in-app banner)
- [ ] Migrate existing creator profiles
- [ ] Archive Instagram missions
- [ ] Deploy code without Instagram

### Phase 3: Cleanup (1 week)
- [ ] Delete Cloud Functions
- [ ] Clean Firestore data
- [ ] Remove environment variables
- [ ] Update documentation

### Phase 4: Monitoring (ongoing)
- [ ] Track creator application rate
- [ ] Monitor portfolio submissions
- [ ] Gather user feedback
- [ ] Adjust verification criteria

## User Communication

### In-App Announcement
```
🎉 We're Going Native!

Fluzio now has its own content creation system. No more Instagram required!

What's new:
✅ Create posts directly in the app
✅ Upload photos/videos with your camera
✅ Showcase your work in your native portfolio
✅ Apply to collaborations without external accounts

For Creators:
Your verification is now based on your Fluzio portfolio, not Instagram followers. Upload your best work to get approved!

Questions? Visit Help → Instagram Migration
```

### FAQ
**Q: What happens to my Instagram-linked content?**
A: We've archived it. Focus on creating new native posts in your Fluzio feed.

**Q: Do I lose my creator status?**
A: No! Your creator account remains active. Just upload 3 portfolio posts for continued verification.

**Q: Can I still share to Instagram?**
A: Yes! Use the native share button to post to any platform, including Instagram.

## Rollback Plan

If critical issues arise:

1. **Immediate**: Revert code deployment
2. **Database**: Restore from pre-migration backup
3. **Functions**: Redeploy Instagram Cloud Functions
4. **Users**: Clear cache, force refresh

## Success Metrics

Track for 30 days post-removal:
- Creator signup rate (should remain stable)
- Portfolio submissions (should increase)
- Native post creation (should increase)
- Instagram-related support tickets (should drop to zero)

---

**Estimated Timeline**: 4 weeks  
**Risk Level**: Low (native system fully operational)  
**Reversibility**: High (can restore if needed)  
**Status**: Ready to execute
