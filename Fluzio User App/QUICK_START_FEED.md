# Quick Start: Testing the Native Feed System

## Prerequisites
✅ Node.js installed  
✅ Firebase CLI installed  
✅ Firestore rules deployed (DONE)  
✅ Firestore indexes deployed (DONE)

## Step 1: Install Dependencies
```bash
cd "C:\Users\sflor\Downloads\Fluzio\Fluzio User App"
npm install
```

## Step 2: Verify Configuration
Check that `.env` has Firebase config:
```env
REACT_APP_FIREBASE_API_KEY=your_key
REACT_APP_FIREBASE_AUTH_DOMAIN=fluzio-13af2.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=fluzio-13af2
REACT_APP_FIREBASE_STORAGE_BUCKET=fluzio-13af2.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

## Step 3: Start Development Server
```bash
npm start
# or
npm run dev
```

App should open at: `http://localhost:3000`

## Step 4: Create Test Account (Optional)
If you need a fresh account:
1. Go to signup
2. Create User account (Explorer role)
3. Complete onboarding
4. You'll see the new **Feed** tab as primary

## Step 5: Seed Sample Data (Optional)
```bash
# Install ts-node if not already
npm install -g ts-node

# Run seed script
ts-node scripts/seedFeedData.ts
```

This creates 6 sample posts:
- Experience post (coffee shop)
- Collaboration call (fashion brand)
- Creator content (photography)
- Business announcement (restaurant)
- Event preview (meetup)
- Moment (quick photo)

## Step 6: Test Feed Features

### Basic Navigation
1. ✅ **Open app** → Should land on Feed tab (icon: grid/layout)
2. ✅ **Switch segments** → Toggle between "Discover" and "Following"
3. ✅ **Scroll feed** → Pull to refresh, infinite scroll

### Content Creation
1. ✅ **Tap + button** (bottom right floating action button)
2. ✅ **Select content type** (Experience Post, Moment, etc.)
3. ✅ **Add media**:
   - Tap "Camera" → Take photo with device camera
   - Tap "Gallery" → Select from device photos
   - Tap "Files" → Upload from file system
4. ✅ **Add caption** (up to 2000 characters)
5. ✅ **Add location** (optional)
6. ✅ **Add tags** (type and press Enter or "Add")
7. ✅ **Tap "Post"** → Should appear in feed immediately

### Engagement
1. ✅ **Save post** → Tap bookmark icon (should turn solid)
2. ✅ **Unsave post** → Tap bookmark again (should turn outline)
3. ✅ **View profile** → Tap creator avatar/name
4. ✅ **Follow user** → Tap person-add icon (if not following)
5. ✅ **Share post** → Tap share icon

### Role-Specific Features

**As User (Explorer):**
- Should see: Experiences, Events, Moments, Business Announcements
- Actions: Save, Join (events), View, Follow

**As Creator:**
- Should see: Collaboration Calls, Creator Content, Experiences
- Actions: Apply (to collabs), Save, View, Follow
- Content types available: Experience Post, Creator Content, Moment

**As Business:**
- Should see: Creator Content, Business Announcements, Collaborations
- Actions: View, Contact, Save
- Content types available: Business Announcement, Collaboration Call, Experience Post

## Step 7: Test Search & Filters (Future)
Currently not implemented. Coming soon:
- Text search across captions/tags
- Location radius filter
- Content type filter
- Date range filter

## Step 8: Verify Data in Firebase Console

### Check Posts Created
1. Open Firebase Console → Firestore
2. Navigate to `feedPosts` collection
3. Should see your created posts with:
   - ✅ status: "PUBLISHED"
   - ✅ moderationStatus: "APPROVED"
   - ✅ createdBy: your userId
   - ✅ media array with uploaded URLs

### Check Saves
1. Navigate to `feedSaves` collection
2. Should see entries when you bookmark posts:
   - ✅ userId: your userId
   - ✅ postId: saved post ID
   - ✅ savedAt: timestamp

## Common Issues & Fixes

### Issue: Feed tab not showing
**Fix:** Hard refresh browser (Ctrl+Shift+R) or clear cache

### Issue: Can't upload media
**Check:**
- Firebase Storage rules allow uploads
- File size < 10MB (recommended)
- Correct MIME types (image/*, video/*)

### Issue: Posts not appearing
**Check:**
- status === 'PUBLISHED'
- moderationStatus === 'APPROVED'
- Firestore indexes deployed successfully
- User is authenticated

### Issue: Role-based filtering not working
**Check:**
- User role is set correctly (MEMBER, CREATOR, BUSINESS)
- Content types match role expectations
- Firestore query uses correct contentType filter

### Issue: Location filter not working
**Check:**
- User has geo location in profile
- Posts have location.geo (GeoPoint)
- Proximity calculation is working (check console logs)

## Performance Tips

### Optimize Feed Loading
- Limit to 20 posts per page (default)
- Use skeleton loaders during fetch
- Cache last feed in state
- Implement pull-to-refresh for manual updates

### Optimize Media Upload
- Compress images before upload (max 1080p)
- Limit video duration (max 60 seconds)
- Show upload progress
- Handle upload failures gracefully

### Monitor Firestore Usage
```bash
# Check Firestore usage in console
firebase console:projects:firestore:usage
```

Watch for:
- Read operations (feed queries)
- Write operations (post creation)
- Storage usage (uploaded media)

## Debug Mode

Enable detailed logging:
```typescript
// In feedService.ts, uncomment console.logs:
console.log('[FeedService] Fetching feed with filter:', filter);
console.log('[FeedService] Found posts:', posts.length);
console.log('[FeedService] Relevance scores:', feedItems.map(i => i.relevanceScore));
```

Check browser console for:
- Feed fetch times
- Relevance score calculations
- Post creation success/errors
- Save/unsave operations

## Next Steps After Testing

1. **User Testing** → Get 5-10 beta testers to try the feed
2. **Feedback Collection** → Gather insights on UX/UI
3. **Performance Monitoring** → Track load times, error rates
4. **Content Moderation** → Build admin review dashboard
5. **Instagram Removal** → Follow INSTAGRAM_REMOVAL_GUIDE.md

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify Firestore rules are deployed
3. Check Firebase Console for data
4. Review [FEED_SYSTEM_README.md](FEED_SYSTEM_README.md) for detailed docs

---

**Happy Testing!** 🚀  
Created: December 31, 2025
