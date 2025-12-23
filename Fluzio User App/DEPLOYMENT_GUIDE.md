# 🚀 Cohorts & Events Deployment Guide

## Prerequisites

- ✅ Firebase project created
- ✅ Firebase CLI installed (`npm install -g firebase-tools`)
- ✅ Logged in to Firebase (`firebase login`)
- ✅ Node.js 18+ installed
- ✅ All code built successfully

---

## Step 1: Configure Firebase Project ID

### Option A: Automatic Setup (Recommended)
```bash
# Run setup script with your project ID
node scripts/setup-firebase-project.js YOUR_ACTUAL_PROJECT_ID

# Example:
node scripts/setup-firebase-project.js fluzio-production
```

### Option B: Manual Setup
Edit `src/config/firebaseFunctions.ts`:
```typescript
// Replace this line:
const FIREBASE_PROJECT_ID = 'YOUR_PROJECT_ID';

// With your actual project ID:
const FIREBASE_PROJECT_ID = 'fluzio-production';
```

---

## Step 2: Build Frontend

```bash
# Build the application
npm run build

# Verify build succeeded
# Should see: ✓ built in XX.XXs
```

**Expected Output:**
```
✓ 2658 modules transformed.
dist/index.html                    8.97 kB
dist/assets/index-*.js         3,067.04 kB
✓ built in 10-20s
```

---

## Step 3: Deploy Cloud Functions

### Deploy All Functions at Once
```bash
firebase deploy --only functions
```

### Deploy Individual Functions (Faster for Updates)

**Cohort Functions:**
```bash
firebase deploy --only functions:createCityCohort
firebase deploy --only functions:getCityCohorts
firebase deploy --only functions:updateCityCohort
firebase deploy --only functions:activateCohort
firebase deploy --only functions:getCohortStats
```

**Event Functions:**
```bash
firebase deploy --only functions:createEvent
firebase deploy --only functions:updateEvent
firebase deploy --only functions:publishEvent
firebase deploy --only functions:getEvents
firebase deploy --only functions:checkInAttendee
firebase deploy --only functions:registerForEvent
firebase deploy --only functions:cancelEventRegistration
firebase deploy --only functions:getAvailableEvents
firebase deploy --only functions:getMyTickets
firebase deploy --only functions:getMyEntitlements
```

**Expected Output:**
```
✔  functions[createCityCohort(us-central1)] Successful create operation.
✔  functions[getCityCohorts(us-central1)] Successful create operation.
...
✔  Deploy complete!
```

---

## Step 4: Deploy Frontend (Hosting)

```bash
firebase deploy --only hosting
```

**Expected Output:**
```
✔  hosting[PROJECT_ID]: file upload complete
✔  Deploy complete!
Hosting URL: https://PROJECT_ID.web.app
```

---

## Step 5: Set Up Firestore Indexes

Some queries require composite indexes. Firebase will provide URLs to create them when needed.

### Manual Index Creation (if needed)
```bash
firebase deploy --only firestore:indexes
```

### Common Indexes Needed:
1. **cityCohorts**: `cityId` + `status`
2. **events**: `status` + `startDateTime`
3. **eventTickets**: `businessId` + `status`
4. **entitlementLedgers**: `businessId` + `periodStart` + `periodEnd`

---

## Step 6: Configure Environment Variables

### Stripe Integration (Optional)
```bash
firebase functions:config:set stripe.secret_key="sk_live_..."
firebase functions:config:set stripe.webhook_secret="whsec_..."

# Redeploy functions to apply
firebase deploy --only functions
```

### CORS Configuration (if needed)
Functions already have CORS enabled:
```javascript
res.set("Access-Control-Allow-Origin", "*");
res.set("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
res.set("Access-Control-Allow-Headers", "Content-Type");
```

---

## Step 7: Verify Deployment

### Check Functions are Live
```bash
# List deployed functions
firebase functions:list

# Expected output:
✔ createCityCohort(us-central1)
✔ getCityCohorts(us-central1)
...
```

### Test API Endpoints
```bash
# Test cohorts endpoint (replace with your project ID)
curl "https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/getCityCohorts?adminId=TEST"

# Should return: {"success":false,"error":"Admin user not found"}
```

### Check Frontend
1. Open hosting URL: `https://YOUR_PROJECT_ID.web.app`
2. Navigate to admin panel
3. Verify components load without 404 errors

---

## Step 8: Initialize First Cohort

### Using Admin Panel
1. Login as SUPER_ADMIN
2. Navigate to "Cohort Management"
3. Click "Create Cohort"
4. Fill in:
   - City: Munich
   - Max Slots: 100
   - Badge: "Founding Partner"
   - Pricing Lock: 12 months
5. Click "Activate"

### Using Firebase Console
```javascript
// In Firestore, create document in cityCohorts/
{
  cityId: "munich",
  cityName: "Munich",
  countryId: "DE",
  cohortName: "Q1 2025 Founding Partners",
  maxSlots: 100,
  usedSlots: 0,
  status: "OPEN",
  foundingBadgeLabel: "Founding Partner",
  pricingLockMonths: 12,
  startAt: "2025-01-01T00:00:00Z",
  createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  createdBy: "system"
}
```

---

## Step 9: Test Complete Flow

### Cohort Testing
1. **Create Cohort** (as SUPER_ADMIN)
2. **Approve Business to Level 2**
   - Should auto-consume slot
   - Should add founding badge
   - usedSlots should increment
3. **Verify in Firestore**
   - Check cohortMemberships collection
   - Check business profile has cohortId

### Event Testing
1. **Create Event** (as CITY_ADMIN)
   ```
   Title: "Munich Networking Night"
   Type: NETWORKING
   Capacity: 50
   Price: 0 (free)
   Levels: [1, 2]
   Tiers: ["GOLD", "PLATINUM"]
   ```

2. **Publish Event**
   - Status should change DRAFT → PUBLISHED

3. **Register Business** (GOLD tier)
   - Should detect free credit
   - Should receive CONFIRMED ticket
   - Should get QR code
   - Credit count should decrease

4. **Check-in at Event**
   - Scan QR code
   - Ticket status → CHECKED_IN

---

## Step 10: Monitor & Debug

### View Function Logs
```bash
# All functions
firebase functions:log

# Specific function
firebase functions:log --only createEvent

# Real-time logs
firebase functions:log --follow
```

### Common Issues

#### Issue: Functions return 404
**Solution:** Verify deployment completed
```bash
firebase functions:list
```

#### Issue: CORS errors
**Solution:** Functions already have CORS enabled. If issues persist:
```javascript
// In functions, ensure headers are set before any response
res.set("Access-Control-Allow-Origin", "*");
```

#### Issue: "Admin user not found"
**Solution:** Ensure admin user exists in Firestore with role field
```javascript
// In users/{userId}
{
  role: "SUPER_ADMIN",
  countryId: "DE",
  cityId: "munich"
}
```

#### Issue: Credits not working
**Solution:** Check entitlementLedgers collection
```bash
# In Firestore Console, verify ledger exists
entitlementLedgers/{businessId}_{periodType}_{periodStart}
```

---

## Rollback Procedure

### Rollback Functions
```bash
# View function versions
firebase functions:list --json

# Rollback specific function
firebase functions:delete createEvent
firebase deploy --only functions:createEvent
```

### Rollback Hosting
```bash
# List previous releases
firebase hosting:list

# Rollback to specific version
firebase hosting:rollback
```

---

## Performance Optimization

### Enable Caching
Add to `firebase.json`:
```json
{
  "hosting": {
    "headers": [
      {
        "source": "**/*.@(js|css|png|jpg|jpeg|svg|ico)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  }
}
```

### Function Optimization
- Functions already use connection pooling
- Consider upgrading to 2GB memory for high-traffic endpoints
- Enable min instances for critical functions:

```javascript
exports.registerForEvent = onRequest({
  cors: true,
  minInstances: 1, // Keep warm
  memory: "2GiB"   // More memory
}, async (req, res) => { ... });
```

---

## Cost Estimation

### Cloud Functions
- **Free tier:** 2M invocations/month
- **Paid:** $0.40/M invocations
- **Estimated:** ~$20-50/month for 100K monthly users

### Firestore
- **Free tier:** 50K reads, 20K writes/day
- **Paid:** $0.06 per 100K reads
- **Estimated:** ~$30-80/month for 100K monthly users

### Hosting
- **Free tier:** 10GB storage, 360MB/day bandwidth
- **Paid:** $0.026/GB storage, $0.15/GB bandwidth
- **Estimated:** ~$10-30/month

**Total Estimated:** $60-160/month for 100K monthly users

---

## Security Checklist

- ✅ All endpoints use `requireRole()` middleware
- ✅ Scope filtering for country/city admins
- ✅ Admin actions logged in auditLogs collection
- ✅ Business profile updates validated
- ✅ Credit consumption atomic operations
- ✅ CORS properly configured
- ✅ Firebase Security Rules deployed
- ⏳ Set up Firebase App Check (recommended)
- ⏳ Enable rate limiting (recommended)

---

## Post-Deployment Tasks

### Week 1
- [ ] Monitor function errors in Firebase Console
- [ ] Check cohort slot consumption working
- [ ] Verify event registration flow
- [ ] Test credit system with real users

### Week 2
- [ ] Analyze performance metrics
- [ ] Optimize slow queries
- [ ] Add missing indexes
- [ ] Review audit logs

### Month 1
- [ ] Collect user feedback
- [ ] Monitor costs
- [ ] Scale functions if needed
- [ ] Implement Phase 2 features

---

## Support & Maintenance

### Health Check Endpoints (Optional)
Add to functions/index.js:
```javascript
exports.healthCheck = onRequest(async (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: Date.now(),
    version: '1.0.0'
  });
});
```

### Monitoring Dashboard
Set up Firebase Console:
1. Functions → View logs
2. Firestore → View metrics
3. Hosting → View analytics
4. Performance Monitoring → Enable

---

## Quick Reference

### Deployment Commands
```bash
# Full deployment
firebase deploy

# Functions only
firebase deploy --only functions

# Hosting only
firebase deploy --only hosting

# Specific function
firebase deploy --only functions:createEvent

# View logs
firebase functions:log --follow

# Rollback hosting
firebase hosting:rollback
```

### Important URLs
```
Functions: https://us-central1-PROJECT_ID.cloudfunctions.net/
Hosting: https://PROJECT_ID.web.app
Console: https://console.firebase.google.com/project/PROJECT_ID
```

---

**Deployment Complete! 🎉**

For issues or questions, check Firebase Console logs or refer to COHORTS_EVENTS_COMPLETE.md for detailed implementation documentation.
