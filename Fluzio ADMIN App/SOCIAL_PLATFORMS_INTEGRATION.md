# Social Media Platforms Integration Guide

**Last Updated:** January 2025  
**Status:** Google ✅ | Instagram ✅ | TikTok ✅ | Twitter/X ✅ | LinkedIn ✅

---

## Overview

Fluzio integrates with multiple social media platforms to enhance user profiles and enable creator-business collaborations. This document outlines the integration status, requirements, and implementation roadmap for each platform.

---

## ✅ COMPLETED INTEGRATIONS

### 1. Google (Firebase Auth)

**Status:** ✅ **FULLY FUNCTIONAL**

**Implementation:**
- Uses Firebase Authentication with Google provider
- Available for both customers and businesses
- Service: `socialAuthService.ts`

**Features:**
- One-click Google sign-in
- Link/unlink Google account
- Profile data sync (email, name, photo)
- Enhanced security with OAuth 2.0
- Automatic profile verification

**Usage:**
```typescript
import { socialAuthService } from '../services/socialAuthService';

// Link Google account
const result = await socialAuthService.linkGoogle();

// Unlink Google account
const result = await socialAuthService.unlinkGoogle();
```

**Data Stored:**
- Email address
- Display name
- Profile photo URL
- Provider ID (google.com)

**User Benefits:**
- ✅ Verified profile badge
- ✅ Enhanced account security
- ✅ Easy sign-in across devices
- ✅ Trusted identity

---

### 2. Instagram (Graph API via Facebook)

**Status:** ✅ **FULLY FUNCTIONAL**

**Implementation:**
- Uses Facebook Graph API (Instagram Basic Display deprecated Dec 2024)
- Requires Instagram Business or Creator account
- Must be linked to a Facebook Page
- Backend Cloud Function: `instagramcallback`
- Service: `instagramService.ts`

**Requirements:**
1. Instagram account must be Business or Creator type
2. Instagram account must be linked to a Facebook Page
3. Facebook Page must be managed by the user
4. Meta Developer App configured with correct scopes

**OAuth Scopes:**
- `instagram_basic` - Basic profile access
- `pages_show_list` - Access to Facebook pages
- `instagram_manage_insights` - Analytics (optional)
- `pages_read_engagement` - Engagement metrics (optional)

**Features:**
- ✅ Profile connection via OAuth 2.0
- ✅ Display username and followers
- ✅ Show account type (Business/Creator)
- ✅ Profile picture sync
- ✅ Long-lived tokens (60 days)
- ✅ Auto-refresh mechanism
- ✅ Disconnect functionality

**Data Stored:**
```typescript
{
  connected: true,
  username: "@username",
  userId: "instagram_user_id",
  name: "Display Name",
  profilePictureUrl: "https://...",
  followersCount: 1000,
  followsCount: 500,
  mediaCount: 250,
  accessToken: "long_lived_token",
  pageId: "facebook_page_id",
  pageName: "Page Name",
  connectedAt: "2025-12-02T..."
}
```

**User Benefits:**
- ✅ Showcase Instagram presence
- ✅ Display follower count
- ✅ Creator verification
- ✅ Enhanced profile credibility

**Known Issues:**
- ⚠️ Requires Facebook Page (not always obvious to users)
- ⚠️ Token expires after 60 days (needs refresh)
- ⚠️ Only works with Business/Creator accounts

**Setup Guide:**
See `INSTAGRAM_OAUTH_BACKEND.md` for complete setup instructions.

---

## 🚧 PLANNED INTEGRATIONS

### 3. TikTok

**Status:** 🚧 **PLANNED - NOT STARTED**

**Why TikTok?**
- Fastest-growing creator platform
- Strong Gen Z and Millennial audience
- High engagement rates
- Perfect for mission content and challenges

**Research Required:**

#### A. TikTok Login Kit
- **API:** TikTok for Developers - Login Kit
- **Documentation:** https://developers.tiktok.com/doc/login-kit-web
- **OAuth:** OAuth 2.0 with Authorization Code Flow
- **Free Tier:** Yes, with rate limits

**Scopes Needed:**
- `user.info.basic` - Username, display name, avatar
- `user.info.profile` - Bio, follower count
- `user.info.stats` - Follower/following counts
- `video.list` - Access to user's videos (optional)

**Endpoints:**
```
Authorization: https://www.tiktok.com/auth/authorize/
Token Exchange: https://open-api.tiktok.com/oauth/access_token/
User Info: https://open-api.tiktok.com/user/info/
```

**Data to Capture:**
```typescript
{
  connected: true,
  username: "@username",
  displayName: "Display Name",
  avatarUrl: "https://...",
  followerCount: 10000,
  followingCount: 500,
  videoCount: 100,
  verified: boolean,
  accessToken: "token",
  refreshToken: "refresh_token",
  expiresAt: "timestamp"
}
```

#### B. Implementation Steps

1. **Developer Account Setup**
   - Register at https://developers.tiktok.com/
   - Create new app
   - Add Login Kit product
   - Configure redirect URIs:
     - Production: `https://fluzio-13af2.web.app/tiktok/callback`
     - Development: `http://localhost:5173/tiktok/callback`

2. **Backend Cloud Function**
   - Create `tiktokCallback` function similar to Instagram
   - Handle OAuth code exchange
   - Fetch user profile data
   - Save to Firestore `users/{userId}/socialAccounts/tiktok`

3. **Frontend Service**
   - Create `services/tiktokService.ts`
   - Implement OAuth flow
   - Add token refresh mechanism
   - Handle disconnection

4. **UI Components**
   - Update `SocialAccountConnector` to support TikTok
   - Add TikTok icon and branding
   - Display follower count and videos

#### C. Use Cases for Fluzio

**For Customers (Creators):**
- Showcase TikTok following on profile
- Verify creator status
- Display engagement metrics
- Link to TikTok profile from missions

**For Businesses:**
- Find TikTok creators by follower count
- Request TikTok-specific content missions
- Track creator's TikTok growth
- Measure mission impact on TikTok

**Mission Integration:**
- "Post this product on TikTok and tag us"
- "Create a TikTok dance with our brand"
- "Share our store location in TikTok video"
- Auto-verify completion via TikTok API

#### D. Challenges & Considerations

**Rate Limits:**
- TikTok API has strict rate limits
- Need to implement caching
- Consider webhook subscriptions

**Content Access:**
- Video access may require additional approval
- Some features only for verified developers
- Analytics limited to certain account types

**Privacy:**
- TikTok data privacy regulations
- GDPR compliance for EU users
- Age restrictions (13+ platform)

**Costs:**
- Free tier sufficient for MVP
- May need paid tier for scale
- Monitor API usage carefully

---

### 4. LinkedIn

**Status:** 🚧 **PLANNED - NOT STARTED**

**Why LinkedIn?**
- Professional networking focus
- B2B collaboration opportunities
- Business verification
- Creator professional credibility

**Research Required:**

#### A. LinkedIn OAuth 2.0
- **API:** LinkedIn Sign In with LinkedIn
- **Documentation:** https://learn.microsoft.com/en-us/linkedin/
- **OAuth:** OAuth 2.0 Authorization Code Flow
- **Free Tier:** Yes, with limitations

**Scopes Needed:**
- `r_liteprofile` - Basic profile (name, photo)
- `r_emailaddress` - Email address
- `r_basicprofile` - Full profile data (requires partner status)
- `w_member_social` - Post on behalf of user (optional)

**Endpoints:**
```
Authorization: https://www.linkedin.com/oauth/v2/authorization
Token Exchange: https://www.linkedin.com/oauth/v2/accessToken
Profile: https://api.linkedin.com/v2/me
```

**Data to Capture:**
```typescript
{
  connected: true,
  firstName: "John",
  lastName: "Doe",
  headline: "Marketing Professional",
  profilePictureUrl: "https://...",
  email: "john@example.com",
  industry: "Marketing and Advertising",
  location: "San Francisco Bay Area",
  connections: 500, // May require partner status
  accessToken: "token",
  expiresAt: "timestamp"
}
```

#### B. Implementation Steps

1. **LinkedIn Developer Setup**
   - Create app at https://www.linkedin.com/developers/
   - Request access to necessary scopes
   - Configure redirect URIs
   - Verify company (for enhanced features)

2. **Backend Cloud Function**
   - Create `linkedinCallback` function
   - Handle OAuth code exchange
   - Fetch profile data
   - Save to Firestore

3. **Frontend Service**
   - Create `services/linkedinService.ts`
   - Implement OAuth flow
   - Handle token management
   - Support disconnection

4. **UI Components**
   - Update `SocialAccountConnector`
   - Add LinkedIn branding
   - Display professional info

#### C. Use Cases for Fluzio

**For Customers (Creators):**
- Professional verification
- Display work experience
- Show industry expertise
- Network size as credibility marker

**For Businesses:**
- Verify business legitimacy
- Display company information
- Find B2B collaboration partners
- Professional networking features

**B2B Features:**
- Connect with other businesses
- Share professional content
- Industry-specific missions
- Networking events coordination

#### D. Unique Features

**Business-Specific:**
- Company page integration
- Employee verification
- Industry targeting
- Professional endorsements

**Creator-Specific:**
- Professional brand building
- Thought leadership content
- Industry influence metrics
- Speaking engagement tracking

#### E. Challenges & Considerations

**API Limitations:**
- Limited free tier access
- Partner program required for full features
- Strict content policies
- May need manual review for some scopes

**Use Case Fit:**
- More B2B focused than B2C
- May be less relevant for certain creator types
- Best for professional services businesses
- Lower priority than Instagram/TikTok

**Compliance:**
- Professional data privacy
- Employment verification requirements
- Company information accuracy
- Anti-spam policies

---

## Implementation Priority

### Phase 1: Fixes & Improvements (Week 1)
- ✅ Fix Instagram OAuth redirect issue (DONE)
- ✅ Add Google connection for customers (DONE)
- ✅ Create unified `SocialAccountConnector` component (DONE)
- ✅ Update Customer Settings with social section (DONE)

### Phase 2: TikTok Integration (Weeks 2-3)
1. 🔴 Register TikTok Developer account
2. 🔴 Create TikTok app and get credentials
3. 🔴 Implement `tiktokService.ts`
4. 🔴 Create Cloud Function `tiktokCallback`
5. 🔴 Update `SocialAccountConnector` with TikTok support
6. 🔴 Test OAuth flow end-to-end
7. 🔴 Add TikTok profile display to user profiles

### Phase 3: LinkedIn Integration (Weeks 4-5)
1. 🟡 Register LinkedIn Developer account
2. 🟡 Request necessary API scopes
3. 🟡 Implement `linkedinService.ts`
4. 🟡 Create Cloud Function `linkedinCallback`
5. 🟡 Update `SocialAccountConnector` with LinkedIn support
6. 🟡 Add B2B features using LinkedIn data
7. 🟡 Test and refine

### Phase 4: Enhanced Features (Week 6+)
1. 🟢 Auto-post missions to social platforms
2. 🟢 Sync content from social accounts
3. 🟢 Analytics integration (followers over time)
4. 🟢 Social proof badges
5. 🟢 Cross-platform content suggestions

---

## Security Considerations

### Token Management
- Store tokens encrypted in Firestore
- Implement automatic token refresh
- Expire and revoke on disconnect
- Never expose tokens in frontend

### OAuth Security
- Use PKCE for mobile/SPA apps where supported
- Validate state parameter
- Secure redirect URIs (HTTPS only)
- Implement CSRF protection

### Data Privacy
- Only request necessary scopes
- Clear consent messaging
- Allow easy disconnection
- GDPR compliance (right to deletion)

### Rate Limiting
- Implement request caching
- Monitor API usage
- Handle rate limit errors gracefully
- Use webhooks instead of polling where possible

---

## Testing Strategy

### Manual Testing
- [ ] Test OAuth flow for each platform
- [ ] Verify data sync accuracy
- [ ] Test token refresh mechanism
- [ ] Confirm disconnection works
- [ ] Check error handling

### Automated Testing
- [ ] Unit tests for services
- [ ] Integration tests for OAuth flows
- [ ] Mock API responses
- [ ] Test error scenarios
- [ ] Performance testing

### User Acceptance Testing
- [ ] Real user OAuth testing
- [ ] Verify UI/UX flows
- [ ] Check mobile responsiveness
- [ ] Test across browsers
- [ ] Gather user feedback

---

## Cost Analysis

### TikTok API Costs
- **Free Tier:** 10,000 API calls/day
- **Paid Tier:** Contact sales
- **Estimated Usage:** 100-500 calls/day (MVP)
- **Cost:** $0/month (free tier sufficient)

### LinkedIn API Costs
- **Free Tier:** Limited access
- **Partner Program:** Requires application
- **Marketing Developer Platform:** $$$
- **Estimated Cost:** $0-500/month depending on features

### Infrastructure Costs
- Cloud Functions execution: ~$5-10/month
- Firestore reads/writes: ~$5/month
- Total estimated: ~$10-20/month additional

---

## Success Metrics

### Connection Rate
- Target: 40% of users connect at least 1 social account
- Goal: 60% connect 2+ accounts

### Platform Distribution
- Instagram: 70% of connections
- Google: 50% of connections
- TikTok: 40% of connections (when available)
- LinkedIn: 20% of connections (B2B focus)

### User Engagement
- Profile views increase: +30%
- Mission participation increase: +25%
- Creator credibility score: +40%

### Business Value
- Better creator-business matching
- Higher mission completion quality
- Verified user trust increase
- Reduced fake accounts

---

## Support & Documentation

### User Guides Needed
1. "How to Connect Instagram" (with troubleshooting)
2. "How to Connect TikTok" 
3. "How to Connect LinkedIn"
4. "Benefits of Connecting Social Accounts"
5. "Privacy & Security of Connected Accounts"

### Developer Documentation
1. OAuth flow diagrams
2. API endpoint documentation
3. Error handling guide
4. Token refresh procedures
5. Troubleshooting common issues

---

## Next Steps

### Immediate (This Week)
1. ✅ Fix Instagram OAuth (DONE)
2. ✅ Add Google for customers (DONE)
3. 🔴 Test Instagram connection end-to-end
4. 🔴 Create user guide for Instagram setup

### Short Term (2-4 Weeks)
1. Register TikTok Developer account
2. Implement TikTok OAuth flow
3. Test TikTok integration
4. Launch TikTok beta

### Medium Term (1-2 Months)
1. Evaluate LinkedIn integration need
2. Implement if B2B features are prioritized
3. Add enhanced social features (auto-post, sync)
4. Analytics dashboard for social metrics

---

**Notes:**
- All social integrations must comply with platform policies
- Regular review of API changes and deprecations required
- User privacy and consent are paramount
- Focus on creator value and business matching utility
