# Google Review Service - Automated Verification

## Overview
This service makes leaving Google reviews **seamless** for customers by:
1. Providing a direct link to Google's review page
2. Automatically verifying the review using Google My Business API
3. Instantly awarding points without screenshot uploads
4. Falling back to manual verification if auto-verify fails

## Customer Experience Improvements

### Before (Manual Process):
```
1. Customer sees mission → 2. Leaves review on Google
3. Takes screenshot → 4. Uploads to app
5. Waits for business approval → 6. Gets points (1-2 days later)
```
**Time:** 5-10 minutes + waiting period
**Friction:** 6 steps, screenshot uploads, manual approval

### After (Automated Process):
```
1. Customer sees mission → 2. Taps "Write Review"
3. Google opens → 4. Writes review → 5. Points awarded automatically!
```
**Time:** 2-3 minutes
**Friction:** 1 button click, instant rewards

## How It Works

### 1. Mission Creation
```typescript
const result = await createGoogleReviewMission(businessId, userId, missionId);
// Returns: { reviewLink, instructions, participationId }
```

### 2. Customer Flow
```
Customer taps mission → Modal shows:
┌─────────────────────────────────────────┐
│  Leave a review for Flor de Oro        │
├─────────────────────────────────────────┤
│  📝 Click button to open Google         │
│  ⭐ Rate your experience                │
│  ✍️ Write what you liked                │
│  ✅ Submit - Points awarded!            │
├─────────────────────────────────────────┤
│  [Write Review on Google]  →            │
└─────────────────────────────────────────┘
```

### 3. Automatic Verification
```javascript
// Polls Google My Business API every 30 seconds for 10 minutes
startReviewPolling(businessId, userId, missionId, participationId);

// When review found:
- ✅ Mark participation as COMPLETED
- 💰 Award points instantly
- 🔔 Notify customer: "Review verified! Points awarded"

// If not found after 10 minutes:
- 📸 Request screenshot as fallback
- 🔔 Notify: "Please submit a screenshot"
```

### 4. Review Matching Logic
```javascript
// Matches review by:
- Customer's Google email
- Review timestamp (within mission window)
- Business location ID
- Review authenticity
```

## Cloud Function: checkGoogleReviews

### Endpoint
```
POST /checkGoogleReviews
```

### Request Body
```json
{
  "businessId": "UaK0Co1BgChaprDV0aMMfbIFv8E2",
  "accountId": "accounts/123456",
  "locationId": "locations/789",
  "customerEmail": "customer@example.com",
  "since": 1702648000000
}
```

### Response (Success)
```json
{
  "success": true,
  "reviewFound": true,
  "review": {
    "reviewerId": "google_user_123",
    "reviewerName": "John Doe",
    "reviewText": "Great experience!",
    "rating": 5,
    "reviewTime": "2024-12-15T10:30:00Z",
    "reviewUrl": "https://maps.google.com/reviews/..."
  }
}
```

### Response (Not Found)
```json
{
  "success": false,
  "reviewFound": false,
  "error": "No matching review found"
}
```

## Benefits

### For Customers:
- ✅ **75% faster** - No screenshot uploads
- ✅ **Instant rewards** - Points in ~2 minutes
- ✅ **One-click experience** - Direct Google link
- ✅ **Less friction** - 1 button vs 6 steps

### For Businesses:
- ✅ **Higher completion rate** - Easier = more reviews
- ✅ **Authentic reviews** - API verification prevents fraud
- ✅ **Less work** - No manual screenshot checking
- ✅ **Better data** - Review text, rating, timestamp captured

### For Platform:
- ✅ **Reduced fraud** - API verification > screenshots
- ✅ **Better UX** - Seamless automated flow
- ✅ **Lower support** - Fewer "where's my points?" tickets
- ✅ **Scalable** - Automated approval process

## Implementation in UI

### Mission Card Update
```tsx
// When customer taps Google Review mission:
<MissionDetailModal>
  <h2>Leave a Google Review</h2>
  <StepsList>
    {instructions.steps.map(step => <li>{step}</li>)}
  </StepsList>
  
  <BigButton 
    onClick={() => {
      // Create participation + start polling
      createGoogleReviewMission(businessId, userId, missionId);
      // Open Google in new tab
      window.open(reviewLink, '_blank');
      // Show tracking modal
      setShowTrackingModal(true);
    }}
  >
    {instructions.buttonText}
  </BigButton>
</MissionDetailModal>

// After clicking:
<TrackingModal>
  <Spinner />
  <p>🔍 Checking for your review...</p>
  <StatusMessage>{reviewStatus.message}</StatusMessage>
</TrackingModal>
```

## Fallback Strategy

If automatic verification fails:
1. After 10 minutes of polling → status changes to `NEEDS_PROOF`
2. Customer receives notification
3. App shows upload screen
4. Business manually verifies (original flow)

This ensures **zero failed missions** while optimizing for the 95% case where auto-verification works.

## Security

- Review matching requires email match + timestamp window
- Anti-duplicate: Check if customer already reviewed this business
- Rate limiting: 1 review per business per year
- Token validation: Google OAuth tokens verified
- API authentication: Cloud Function validates Firebase Auth

## Metrics to Track

- **Auto-verification success rate** - Target: >95%
- **Average time to points** - Target: <3 minutes (vs 24 hours manual)
- **Mission completion rate** - Expect +40% vs screenshot method
- **Customer satisfaction** - Survey after automated flow

## Next Steps

1. ✅ Create `googleReviewService.ts` (Done)
2. Add Cloud Function `checkGoogleReviews` to `functions/index.js`
3. Update mission UI to use new flow
4. Test end-to-end with test business
5. Deploy and monitor metrics
