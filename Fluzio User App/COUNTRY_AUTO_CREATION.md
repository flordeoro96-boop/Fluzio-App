# Country Auto-Creation System

## Overview
Countries are automatically created when users sign up from new regions. This allows Fluzio to expand naturally based on user demand while maintaining admin control over feature activation.

## How It Works

### 1. User Signup Trigger
When a new user registers in Firestore:
- The `onUserCreate` Cloud Function is triggered
- User's `countryCode` field is checked (e.g., "+49" for Germany, "+39" for Italy)

### 2. Country Code Mapping
The phone code is mapped to ISO country code:
```javascript
'+49' → 'DE' (Germany)
'+39' → 'IT' (Italy)
'+971' → 'AE' (UAE)
'+507' → 'PA' (Panama)
// ... etc
```

### 3. Country Document Creation
If the country doesn't exist in the `countries` collection:
- A new country document is automatically created
- Document ID: ISO code (e.g., "IT" for Italy)
- Initial status: **SOFT_LAUNCH** (not fully active yet)

### 4. Default Country Data
Auto-created countries include:
```javascript
{
  code: "IT",
  countryId: "IT",
  name: "Italy",
  flag: "🇮🇹",
  currency: "EUR",
  language: "it",
  timezone: "Europe/Rome",
  status: "SOFT_LAUNCH",
  autoCreated: true,
  firstUserId: "user123", // First user from this country
  launchChecklist: [], // Empty - admin configures
  settings: {
    enableBusinessVerification: false,
    enableCreatorPayouts: false,
    enableEvents: false,
    autoApproveMissions: true // For soft launch
  },
  createdAt: "2024-01-15T10:30:00Z",
  updatedAt: "2024-01-15T10:30:00Z"
}
```

## Country Status Flow

### 1. SOFT_LAUNCH (Auto-created)
- **Default status for new countries**
- Users can register and use basic features
- Missions auto-approved (no manual review needed)
- Business verification disabled
- Creator payouts disabled
- Events disabled

**Admin Actions:**
- Monitor user growth
- Configure launch checklist
- Set up local payment methods
- Prepare legal/compliance docs

### 2. LIVE (Admin-activated)
When admin upgrades status to LIVE:
- All features enabled
- Business verification required
- Creator payouts available
- Events system active
- Mission require manual approval
- Full platform functionality

## Admin Control

### Monitoring New Countries
1. Login to Admin Dashboard: https://fluzio-admin.vercel.app
2. Navigate to **Countries** page
3. Auto-created countries show:
   - Badge: "Auto-Created"
   - Status: "SOFT_LAUNCH"
   - First User ID
   - Creation timestamp

### Upgrading a Country
1. Click on country card
2. Navigate to **Overview** tab
3. Find "Country Status" section
4. Click "Update Status" → Select "LIVE"
5. Configure launch checklist as needed

### Launch Checklist (Optional)
Admins can configure checklist items:
- Legal compliance completed
- Payment gateway setup
- Local currency support
- Customer support setup
- Marketing materials ready
- Partnership agreements signed

## Supported Countries (45+)

### Europe (24)
- 🇩🇪 Germany (DE) - EUR
- 🇬🇧 United Kingdom (GB) - GBP
- 🇫🇷 France (FR) - EUR
- 🇪🇸 Spain (ES) - EUR
- 🇮🇹 Italy (IT) - EUR
- 🇵🇹 Portugal (PT) - EUR
- 🇳🇱 Netherlands (NL) - EUR
- 🇧🇪 Belgium (BE) - EUR
- 🇨🇭 Switzerland (CH) - CHF
- 🇦🇹 Austria (AT) - EUR
- 🇩🇰 Denmark (DK) - DKK
- 🇸🇪 Sweden (SE) - SEK
- 🇳🇴 Norway (NO) - NOK
- 🇵🇱 Poland (PL) - PLN
- 🇨🇿 Czech Republic (CZ) - CZK
- 🇭🇺 Hungary (HU) - HUF
- 🇷🇴 Romania (RO) - RON
- 🇬🇷 Greece (GR) - EUR
- 🇮🇪 Ireland (IE) - EUR
- 🇫🇮 Finland (FI) - EUR
- 🇱🇹 Lithuania (LT) - EUR
- 🇱🇻 Latvia (LV) - EUR
- 🇪🇪 Estonia (EE) - EUR

### Middle East (1)
- 🇦🇪 UAE (AE) - AED

### Americas (7)
- 🇺🇸 USA (US) - USD
- 🇵🇦 Panama (PA) - PAB
- 🇲🇽 Mexico (MX) - MXN
- 🇦🇷 Argentina (AR) - ARS
- 🇧🇷 Brazil (BR) - BRL
- 🇨🇱 Chile (CL) - CLP
- 🇨🇴 Colombia (CO) - COP
- 🇵🇪 Peru (PE) - PEN

### Asia Pacific (8)
- 🇨🇳 China (CN) - CNY
- 🇯🇵 Japan (JP) - JPY
- 🇰🇷 South Korea (KR) - KRW
- 🇮🇳 India (IN) - INR
- 🇸🇬 Singapore (SG) - SGD
- 🇭🇰 Hong Kong (HK) - HKD
- 🇦🇺 Australia (AU) - AUD
- 🇳🇿 New Zealand (NZ) - NZD

### Africa (3)
- 🇿🇦 South Africa (ZA) - ZAR
- 🇳🇬 Nigeria (NG) - NGN
- 🇰🇪 Kenya (KE) - KES

## Unknown Countries
If a user signs up with an unsupported phone code:
- Country created with generic data
- Code: Phone code value
- Name: Country code
- Flag: 🌍 (generic globe)
- Currency: USD (default)
- Language: en (default)
- Timezone: UTC

**Admin should update manually with correct data.**

## Benefits

### 1. No Blocked Users
- Users from any country can register immediately
- No "country not supported" errors
- Frictionless signup experience

### 2. Data-Driven Expansion
- See real demand before full launch
- Monitor user growth organically
- Make informed expansion decisions

### 3. Gradual Rollout
- Soft launch allows testing
- Admin activates features when ready
- Controlled risk management

### 4. Automatic Scalability
- No manual country setup required
- System handles new regions automatically
- Focus admin time on activation, not creation

## Technical Details

### Cloud Function
- **Name:** `onUserCreate`
- **Trigger:** Firestore document created in `users/{userId}`
- **Region:** us-central1
- **Runtime:** Node.js 20 (2nd Gen)
- **Timeout:** 60 seconds

### Helper Functions
```javascript
// Extract ISO code from phone code
extractCountryCodeFromPhone(phoneCode)
  Input: "+49"
  Output: "DE"

// Get full country data
getCountryData(code)
  Input: "DE"
  Output: { code, name, flag, currency, language, timezone }
```

### Firestore Structure
```
countries/
  DE/
    code: "DE"
    countryId: "DE"
    name: "Germany"
    status: "SOFT_LAUNCH"
    autoCreated: true
    firstUserId: "abc123"
    settings: { ... }
    createdAt: Timestamp
    updatedAt: Timestamp
```

## Monitoring & Logs

### Firebase Console Logs
Check Cloud Function logs for country creation:
```
[Country Auto-Create] Creating new country: IT for user John Doe
[Country Auto-Create] ✅ Created Italy (IT) - Status: SOFT_LAUNCH
```

### Admin Dashboard
Monitor new countries:
1. Go to Countries page
2. Filter by "Auto-Created" badge
3. Check creation dates
4. Review first user IDs

## Future Enhancements

### Potential Additions
- [ ] Email notification to admin when new country created
- [ ] Automatic locale/language detection
- [ ] Regional currency conversion rates
- [ ] Country-specific feature flags
- [ ] Geographic analytics dashboard
- [ ] Regional marketing campaigns

## Testing

### Test Country Auto-Creation
1. Create test user with new phone code:
   ```javascript
   {
     name: "Test User",
     email: "test@example.com",
     countryCode: "+39", // Italy (if not exists)
     city: "Rome"
   }
   ```

2. Check Firestore:
   - Verify `countries/IT` document created
   - Confirm status is "SOFT_LAUNCH"
   - Check `autoCreated: true`

3. Check Admin Dashboard:
   - Italy should appear in countries list
   - Badge: "Auto-Created"
   - Stats: 1 user

### Test Status Upgrade
1. Login to admin panel
2. Click Italy country card
3. Go to Overview tab
4. Change status from SOFT_LAUNCH → LIVE
5. Verify settings updated:
   - Business verification enabled
   - Creator payouts enabled
   - Events enabled
   - Mission auto-approve disabled

## Support

For issues or questions:
- Check Firebase Console logs
- Review Firestore `countries` collection
- Test with known phone codes first
- Contact development team if unknown country codes needed
