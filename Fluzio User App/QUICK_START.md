# ⚡ Quick Start Guide - Cohorts & Events

## 🎯 What Was Built

**Complete city-based cohort scarcity system + tier-based event entitlements**

- ✅ 16 Backend Cloud Function endpoints
- ✅ 5 Frontend UI components (Admin + Customer)
- ✅ Automatic credit tracking system
- ✅ QR code check-in system
- ✅ RBAC with scope filtering
- ✅ ~3,500 lines of production-ready code

---

## 🚀 Deploy in 3 Minutes

### 1. Configure Project
```bash
# Replace YOUR_PROJECT_ID with your actual Firebase project ID
node scripts/setup-firebase-project.js fluzio-production
```

### 2. Deploy Backend
```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

### 3. Deploy Frontend
```bash
npm run build
firebase deploy --only hosting
```

**Done! 🎉** Your app is now live with cohorts and events.

---

## 📁 File Structure

### Backend (functions/)
```
functions/
├── cohortService.js       # 5 cohort endpoints (549 lines)
├── entitlementService.js  # Credit tracking logic (330 lines)
├── eventsService.js       # 11 event endpoints (650 lines)
└── index.js              # Modified to export all endpoints
```

### Frontend (src/)
```
src/
├── types/
│   ├── cohorts.ts                    # CityCohort, CohortMembership
│   └── events.ts                     # Event, EventTicket, EntitlementLedger
├── config/
│   └── firebaseFunctions.ts          # Centralized API config
└── components/
    ├── AdminCohortManagement.tsx     # Cohort dashboard (580 lines)
    ├── AdminEventManagement.tsx      # Event creation (620 lines)
    ├── EventBrowser.tsx              # Browse events (550 lines)
    └── MyEvents.tsx                  # My tickets (480 lines)
```

---

## 🎨 Features Overview

### Cohorts Module
- **Scarcity:** Munich 100 slots, Others 40 slots
- **Auto-Consume:** Slot consumed when business approved to Level 2+
- **Founding Badge:** Automatic badge + pricing lock
- **Auto-Close:** Cohort closes when maxSlots reached

### Events Module
- **Tier-Based Credits:**
  - Level 1: Pay-per-use only
  - Level 2 FREE: No event access
  - SILVER: Pay-per-use
  - GOLD: 1 free/quarter
  - PLATINUM: 1 free/month + 1 premium/quarter
- **Smart Registration:** Auto credit check → Use free or require payment
- **QR Check-in:** Generate QR codes for event entry
- **Credit Tracking:** Monthly/quarterly periods, no rollover

---

## 🧪 Test It

### Create First Cohort
1. Login as SUPER_ADMIN
2. Go to "Cohort Management"
3. Create cohort: Munich, 100 slots, "Founding Partner"
4. Activate cohort

### Create First Event
1. Login as CITY_ADMIN
2. Go to "Event Management"
3. Create event: Free networking mixer
4. Publish event

### Register Business
1. Login as business (GOLD tier)
2. Browse events
3. See "Use Free Credit" option
4. Register → Get QR code

---

## 📊 Database Collections

| Collection | Purpose |
|------------|---------|
| `cityCohorts` | Cohort definitions |
| `cohortMemberships` | Business memberships |
| `events` | Event definitions |
| `eventTickets` | Registration records |
| `eventAttendance` | Check-in tracking |
| `entitlementLedgers` | Credit tracking |

---

## 🔐 API Endpoints

### Cohorts (5 endpoints)
- `createCityCohort` - Create cohort
- `getCityCohorts` - List cohorts
- `updateCityCohort` - Update cohort
- `activateCohort` - Open cohort
- `getCohortStats` - Get stats

### Events Admin (5 endpoints)
- `createEvent` - Create event
- `updateEvent` - Update event
- `publishEvent` - Publish event
- `getEvents` - List events
- `checkInAttendee` - Check-in with QR

### Events Business (6 endpoints)
- `registerForEvent` - Register
- `cancelEventRegistration` - Cancel
- `getAvailableEvents` - Browse
- `getMyTickets` - My tickets
- `getMyEntitlements` - Check credits

---

## 💡 Key Concepts

### Cohort Flow
```
1. Admin creates cohort (status: PENDING)
2. Admin activates (status: OPEN)
3. Business approved to Level 2+ → Auto slot consumption
4. usedSlots increments
5. Business gets founding badge + pricing lock
6. When full → status: CLOSED
```

### Credit Flow
```
1. Business upgrades to GOLD/PLATINUM
2. Ledger created for current period
3. Business registers for event
4. System checks: canUseCredit()
5. If yes → consumeCredit(), ticket: CONFIRMED
6. If no → require payment, ticket: RESERVED
7. Period ends → ledger resets
```

### Event Flow
```
1. Admin creates event (status: DRAFT)
2. Admin publishes (status: PUBLISHED)
3. Business registers
4. Business gets QR code
5. At event → scan QR → status: CHECKED_IN
```

---

## 🛠️ Configuration

### Update Project ID
Edit `src/config/firebaseFunctions.ts`:
```typescript
const FIREBASE_PROJECT_ID = 'your-project-id';
```

Or use script:
```bash
node scripts/setup-firebase-project.js your-project-id
```

### All Endpoints Centralized
```typescript
import { ENDPOINTS } from '../config/firebaseFunctions';

// Use in components:
fetch(ENDPOINTS.createEvent, { ... })
fetch(`${ENDPOINTS.getMyTickets}?businessId=...`)
```

---

## 📈 Business Rules

### Tier Entitlements
| Tier | Standard Events | Premium Events | Period |
|------|----------------|----------------|---------|
| Level 1 | Pay-per-use | Pay-per-use | - |
| Level 2 FREE | No access | No access | - |
| SILVER | Pay-per-use | Pay-per-use | - |
| GOLD | 1 free | Pay-per-use | Quarterly |
| PLATINUM | 1 free | 1 free | Monthly / Quarterly |

### Cohort Slots
| City | Max Slots | Auto-Close |
|------|-----------|------------|
| Munich | 100 | Yes |
| Others | 40 | Yes |

### Pricing Locks
- Default: 12 months
- Configurable per cohort
- Applied on approval to Level 2+

---

## 🎓 Admin Access Levels

| Role | Cohorts | Events | Scope |
|------|---------|--------|-------|
| SUPER_ADMIN | Full CRUD | Full CRUD | Global |
| COUNTRY_ADMIN | Create/Manage | Full CRUD | Country |
| CITY_ADMIN | View only | Full CRUD | City |
| EVENT_ADMIN | No access | Owned only | Own events |

---

## 📞 Quick Troubleshooting

### Functions return 404
```bash
firebase functions:list  # Check deployment
firebase deploy --only functions  # Redeploy
```

### CORS errors
Already configured! Check browser console for actual error.

### Credits not working
```javascript
// Check Firestore: entitlementLedgers collection
// Verify: periodStart, periodEnd match current period
```

### Cohort not consuming slots
```javascript
// Check: functions/index.js line 1015-1040
// Verify: consumeCohortSlot() is called after approval
```

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `COHORTS_EVENTS_COMPLETE.md` | Full implementation details |
| `DEPLOYMENT_GUIDE.md` | Step-by-step deployment |
| `QUICK_START.md` | This file - quick reference |

---

## ✅ Pre-Deployment Checklist

- [ ] Firebase project created
- [ ] Firebase CLI installed (`npm i -g firebase-tools`)
- [ ] Logged in (`firebase login`)
- [ ] Project ID configured in `src/config/firebaseFunctions.ts`
- [ ] Backend built (`cd functions && npm install`)
- [ ] Frontend built (`npm run build`)
- [ ] Functions deployed (`firebase deploy --only functions`)
- [ ] Hosting deployed (`firebase deploy --only hosting`)
- [ ] First cohort created and activated
- [ ] First event created and published
- [ ] Tested registration flow with credits

---

## 🎉 You're Ready!

**Next Steps:**
1. Configure your Firebase project ID
2. Deploy functions and hosting
3. Create your first cohort (Munich recommended)
4. Create your first event
5. Test with real users

**Need Help?**
- Check logs: `firebase functions:log`
- Read full docs: `COHORTS_EVENTS_COMPLETE.md`
- Deployment guide: `DEPLOYMENT_GUIDE.md`

**Built with ❤️ - December 19, 2025**
