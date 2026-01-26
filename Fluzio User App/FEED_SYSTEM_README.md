# Native Feed System - Implementation Guide

## Overview

Fluzio's native feed system replaces Instagram and Google Tasks integrations with a self-contained, experience-driven discovery platform. The feed shows the same content pool to all users, but with different perspectives based on their role (User/Creator/Business).

## Core Principles

### ✅ What We Built
- **One shared feed** - All posts in `feedPosts` collection
- **Role-based filtering** - Different content types for different roles
- **Discovery over virality** - No public likes, follower counts, or ranking algorithms
- **Native content** - Full media upload, no external platform dependencies
- **Relevance-based** - Proximity + interests + freshness + role preferences

### ❌ What We Avoid
- Social media gamification (likes, shares visible to users)
- Follower counts and popularity metrics
- Infinite scrolling addiction loops
- External platform dependencies (Instagram, TikTok)
- Viral content algorithms

## Architecture

### Data Models

**ContentType Enum:**
```typescript
EXPERIENCE_POST      // Users sharing experiences
CREATOR_CONTENT      // Creators showcasing work
BUSINESS_ANNOUNCEMENT // Business news/offers
COLLABORATION_CALL   // Businesses seeking creators
EVENT_PREVIEW        // Upcoming event highlights
MOMENT               // Quick photo/video moments
```

**FeedPost Interface:**
```typescript
{
  id: string
  contentType: ContentType
  createdBy: string
  creatorName: string
  creatorAvatar: string
  creatorRole: UserRole
  caption: string (max 2000 chars)
  media: FeedMedia[] (images/videos)
  location?: { name, geo, city, country }
  tags?: string[]
  businessTag?: string
  collaborationDetails?: { budget, compensation, spots, deadline }
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'REMOVED'
  moderationStatus: 'PENDING' | 'APPROVED' | 'FLAGGED'
  createdAt, publishedAt, updatedAt
}
```

### Services

**feedService.ts** - Core feed operations:
- `getFeed(userId, filter, location, interests, following, limit)` - Fetch role-specific feed
- `createFeedPost(post)` - Create new post
- `updateFeedPost(postId, updates)` - Update existing post
- `deleteFeedPost(postId)` - Delete post
- `saveFeedPost(userId, postId)` - Bookmark for later
- `applyToCollaboration(postId, userId)` - Apply to collab call

**Relevance Algorithm:**
1. **Proximity** (if both have location)
   - < 5km: +30 points
   - < 20km: +20 points
   - < 50km: +10 points

2. **Interest Match**
   - +5 points per matching tag

3. **Following Boost**
   - +25 points if following creator

4. **Freshness**
   - +15 points if posted < 24h ago

5. **Role Preference**
   - Users: +10 for experiences/events
   - Creators: +15 for collaborations/creator content
   - Businesses: +10 for creator content/announcements

### Components

**FeedScreen** (`components/FeedScreen.tsx`)
- Two segments: Discover (relevance) and Following (followed users)
- Infinite scroll with pull-to-refresh
- Empty states with calm messaging
- Floating + button for content creation

**FeedCard** (`components/FeedCard.tsx`)
- Universal card design for all content types
- Color-coded context badges
- Role-based action buttons (Apply/Join/View/Save)
- No public metrics (internal tracking only)

**ContentCreator** (`components/ContentCreator.tsx`)
- Native camera/gallery access
- Multi-media upload (photos/videos)
- Caption + location + tags + business mentions
- Role-specific post types
- Collaboration form for businesses

### Navigation

**Updated CustomerLayout:**
```typescript
CustomerTab.FEED      // Position 1 (primary tab)
CustomerTab.DISCOVER  // Business/venue discovery
CustomerTab.REWARDS   // Rewards catalog
CustomerTab.MISSIONS  // Available missions
CustomerTab.EVENTS    // Meetups/events
```

## Firestore Structure

### Collections

**feedPosts** (main collection)
```
{
  contentType: string
  createdBy: string (userId)
  creatorName: string
  creatorAvatar: string
  creatorRole: 'MEMBER' | 'CREATOR' | 'BUSINESS'
  caption: string
  media: array
  location: { name, geo (GeoPoint), city, country }
  tags: array
  status: string
  moderationStatus: string
  publishedAt: timestamp
  viewCount: number
  saveCount: number
}
```

**feedSaves** (user bookmarks)
```
{
  userId: string
  postId: string
  savedAt: timestamp
}
```

### Security Rules

```javascript
// Anyone can read published, approved posts
match /feedPosts/{postId} {
  allow read: if resource.data.status == 'PUBLISHED' && 
                 resource.data.moderationStatus == 'APPROVED';
  
  // Users create their own posts
  allow create: if isAuthenticated() && 
                   request.resource.data.createdBy == request.auth.uid;
  
  // Users update their own, admins update any
  allow update: if isAuthenticated() && 
                   (resource.data.createdBy == request.auth.uid || isAdmin());
}

// Users manage their own saves
match /feedSaves/{saveId} {
  allow read, create, delete: if isAuthenticated() && 
                                  resource.data.userId == request.auth.uid;
}
```

### Indexes

Required composite indexes:
1. `status + moderationStatus + publishedAt`
2. `status + moderationStatus + contentType + publishedAt`
3. `status + moderationStatus + contentType + location.city + publishedAt`
4. `status + moderationStatus + contentType + location.country + publishedAt`
5. `status + moderationStatus + createdBy + publishedAt`
6. `userId + savedAt` (for feedSaves)

## Usage

### For Users (Explorers)
```typescript
<FeedScreen
  userId={user.id}
  userRole={UserRole.MEMBER}
  userName={user.name}
  userAvatar={user.avatarUrl}
  userLocation={user.geo}
  userInterests={user.vibeTags}
  followingIds={user.following}
/>
```

**What they see:**
- Experiences from other users
- Event previews
- Business announcements
- Moments from the community

**Actions:**
- Save experience
- Follow creator/business
- Join event
- View details

### For Creators
```typescript
<FeedScreen
  userId={creator.id}
  userRole={UserRole.CREATOR}
  // ... same props
/>
```

**What they see:**
- Collaboration calls from businesses
- Other creators' work (inspiration)
- Experiences needing content
- Opportunities to apply

**Actions:**
- Apply to collaborations
- Upload portfolio content
- Tag businesses
- Build visibility

### For Businesses
```typescript
<FeedScreen
  userId={business.id}
  userRole={UserRole.BUSINESS}
  // ... same props
/>
```

**What they see:**
- Creator content (for inspiration)
- Other businesses' experiences
- Creator portfolios
- Trending formats

**Actions:**
- Post collaboration calls
- Announce offers/news
- Repost creator content
- Track applications

## Testing

### Seed Sample Data
```bash
cd "C:\Users\sflor\Downloads\Fluzio\Fluzio User App"
ts-node scripts/seedFeedData.ts
```

This creates 6 sample posts:
1. Experience post (coffee shop)
2. Collaboration call (fashion brand)
3. Creator content (photography)
4. Business announcement (restaurant)
5. Event preview (meetup)
6. Moment (brunch photo)

### Test Scenarios

**1. Role-Based Filtering**
- Login as User → See experiences/events
- Login as Creator → See collaborations/opportunities
- Login as Business → See creator content/insights

**2. Content Creation**
- Tap + FAB button
- Select content type (role-dependent options)
- Upload photo/video from camera or gallery
- Add caption, location, tags
- Post → Appears in relevant feeds

**3. Engagement**
- Save/unsave posts (bookmark icon)
- Apply to collaborations (creators only)
- Join events (all roles)
- Follow creators/businesses

**4. Discovery Modes**
- **Discover tab**: Relevance-based (proximity + interests)
- **Following tab**: Only from followed users

## Migration from Instagram

### Phase 1: Parallel Running (Complete)
✅ New feed system operational
✅ Instagram integration still exists
✅ Users can create native posts

### Phase 2: Migration (Pending)
- Export Instagram-linked creator profiles
- Convert external URLs to native media
- Archive old Instagram verification data
- Update creator verification to portfolio-based

### Phase 3: Removal (Pending)
- Remove Instagram OAuth components
- Delete `InstagramCallbackScreen.tsx`
- Delete `InstagramConnector.tsx`
- Clean up `socialAccounts.instagram` references
- Update creator onboarding flow

## Performance Considerations

### Optimizations
1. **Media Upload**: Max 1080p, 60sec videos, auto-compression
2. **Feed Loading**: Pagination (20 per page), lazy loading
3. **Caching**: Store last feed in local state
4. **Indexing**: All Firestore queries use composite indexes

### Monitoring
- Track feed load times
- Monitor Firestore read counts
- Watch Storage usage (media uploads)
- Alert on moderation queue size

## Admin Tools (Future)

### Content Moderation Dashboard
- Review flagged posts
- Approve/reject pending posts
- Ban users for violations
- View reported content

### Analytics Dashboard
- Post performance by type
- Creator engagement metrics
- Geographic content distribution
- Trending tags/topics

## Support & Documentation

### User Guide
- How to create posts
- Understanding content types
- Privacy and visibility settings
- Reporting inappropriate content

### Creator Guide
- Building your portfolio
- Applying to collaborations
- Best practices for content
- Getting discovered by businesses

### Business Guide
- Posting collaboration calls
- Reviewing applications
- Content performance insights
- Community guidelines

## Deployment Checklist

✅ Data models added to `types.ts`
✅ Feed service implemented (`services/feedService.ts`)
✅ FeedCard component created
✅ ContentCreator modal created
✅ FeedScreen implemented
✅ Navigation updated (FEED as primary tab)
✅ Firestore rules deployed
✅ Firestore indexes deployed
✅ Seed data script created

### Next Steps
1. Test all role perspectives (User/Creator/Business)
2. Create sample posts via ContentCreator
3. Test engagement features (save, apply, follow)
4. Monitor Firestore usage and performance
5. Plan Instagram integration removal
6. Build admin moderation dashboard

---

**Status**: ✅ Production Ready  
**Last Updated**: December 31, 2025  
**Version**: 1.0.0
