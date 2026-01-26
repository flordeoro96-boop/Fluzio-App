# Reward Validation System - Integration TODO

## Status: Core Implementation Complete ✅

The reward validation system is fully implemented with:
- ✅ Extended type definitions (RedemptionFrequency, RewardValidationType)
- ✅ Fair value guardrails service (pricing guidance)
- ✅ Reward validation service (QR + alphanumeric codes)
- ✅ One-time use enforcement (atomic transactions)
- ✅ QR scanner component (camera access, real-time scanning)
- ✅ Code validation component (alphanumeric entry)
- ✅ Redemption service integration (code generation)
- ✅ Fraud prevention (IP tracking, device fingerprinting)
- ✅ Comprehensive documentation

---

## Next Steps - UI Integration

### 1. Update Reward Creation Form (HIGH PRIORITY)

**File to Modify:** `components/RewardCreationForm.tsx` or similar

**Changes Needed:**

#### Add Required Fields:
```tsx
// Maximum Redemptions
<div>
  <label>Maximum Total Redemptions *</label>
  <input 
    type="number" 
    name="maxTotalRedemptions"
    required
    min="1"
    placeholder="e.g., 100"
  />
  <p className="help-text">
    Total number of customers who can redeem this reward
  </p>
</div>

// Redemption Frequency
<div>
  <label>Redemption Frequency *</label>
  <select name="redemptionFrequency" required>
    <option value="once">Once per customer (ever)</option>
    <option value="once_per_day">Once per day</option>
    <option value="once_per_week">Once per week</option>
    <option value="unlimited">Unlimited</option>
  </select>
  <p className="help-text">
    How often can one customer redeem this reward?
  </p>
</div>

// Validation Type
<div>
  <label>Validation Method *</label>
  <div className="radio-group">
    <label>
      <input 
        type="radio" 
        name="validationType" 
        value="PHYSICAL" 
        defaultChecked 
      />
      Physical (In-Store QR Code)
    </label>
    <label>
      <input 
        type="radio" 
        name="validationType" 
        value="ONLINE" 
      />
      Online (Alphanumeric Code)
    </label>
  </div>
</div>
```

#### Add Fair Value Guardrails Section:
```tsx
import { calculateFairValueGuardrails } from '../services/fairValueGuardrailsService';

// In component state
const [guardrails, setGuardrails] = useState<FairValueGuardrails | null>(null);

// When points cost changes
const handlePointsCostChange = async (value: number) => {
  if (value > 0) {
    const result = await calculateFairValueGuardrails(
      formData.category,
      business.location,
      businessId,
      formData.estimatedValue,
      value
    );
    setGuardrails(result);
  }
};

// Display guardrails
{guardrails && (
  <div className="fair-value-section bg-blue-50 p-4 rounded-lg">
    <h4 className="font-semibold text-blue-900 mb-2">
      💡 Fair Value Guidance
    </h4>
    
    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
      <div>
        <span className="text-gray-600">Local Average:</span>
        <span className="font-semibold ml-2">{guardrails.localAverage} pts</span>
      </div>
      <div>
        <span className="text-gray-600">Recommended:</span>
        <span className="font-semibold ml-2">
          {guardrails.recommendedMin} - {guardrails.recommendedMax} pts
        </span>
      </div>
    </div>
    
    {guardrails.isOutsideRange && (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-2">
        <p className="text-sm text-yellow-800">
          {guardrails.warningMessage}
        </p>
        <p className="text-xs text-yellow-700 mt-1">
          You can still proceed, but this pricing will be logged.
        </p>
      </div>
    )}
    
    {!guardrails.isOutsideRange && (
      <div className="bg-green-50 border-l-4 border-green-400 p-3">
        <p className="text-sm text-green-800">
          ✅ Your price is within the recommended range
        </p>
      </div>
    )}
  </div>
)}
```

#### Update Form Submission:
```tsx
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  
  // ... existing validation ...
  
  // Log pricing deviation if outside range
  if (guardrails?.isOutsideRange) {
    await logPricingDeviation(businessId, rewardId, guardrails, {
      rewardTitle: formData.title,
      category: formData.category,
      estimatedValue: formData.estimatedValue
    });
  }
  
  // Create reward with new required fields
  await createReward({
    ...formData,
    maxTotalRedemptions: parseInt(formData.maxTotalRedemptions),
    redemptionFrequency: formData.redemptionFrequency,
    validationType: formData.validationType,
    // ... other fields
  });
};
```

**Estimated Time:** 2-3 hours

---

### 2. Update Customer Redemption UI (MEDIUM PRIORITY)

**File to Modify:** `components/RewardRedemptionModal.tsx` or similar

**Changes Needed:**

#### Display Validation Codes:
```tsx
// After successful redemption
{redemption.qrCode && (
  <div className="qr-code-section">
    <h3>Your Reward QR Code</h3>
    <img 
      src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(redemption.qrCode)}`}
      alt="Reward QR Code"
      className="mx-auto"
    />
    <p className="text-sm text-gray-600 mt-2">
      Show this code at the store. Can only be used ONCE.
    </p>
    <p className="text-xs text-red-600">
      ⚠️ Screenshots won't work - code becomes invalid after scanning
    </p>
  </div>
)}

{redemption.alphanumericCode && (
  <div className="alphanumeric-code-section">
    <h3>Your Redemption Code</h3>
    <div className="code-display font-mono text-2xl font-bold tracking-wider">
      {redemption.alphanumericCode}
    </div>
    <button onClick={() => navigator.clipboard.writeText(redemption.alphanumericCode)}>
      📋 Copy Code
    </button>
    <p className="text-sm text-gray-600 mt-2">
      Enter this code on the business website or tell staff. Can only be used ONCE.
    </p>
  </div>
)}
```

#### Show Redemption Frequency Info:
```tsx
{reward.redemptionFrequency !== 'unlimited' && (
  <div className="frequency-info bg-yellow-50 p-3 rounded">
    <p className="text-sm text-yellow-800">
      {reward.redemptionFrequency === 'once' && 
        '⚠️ You can only redeem this reward once'
      }
      {reward.redemptionFrequency === 'once_per_day' && 
        '⚠️ You can redeem this reward once per day'
      }
      {reward.redemptionFrequency === 'once_per_week' && 
        '⚠️ You can redeem this reward once per week'
      }
    </p>
  </div>
)}
```

**Estimated Time:** 1-2 hours

---

### 3. Add Validation Dashboard for Businesses (MEDIUM PRIORITY)

**New File:** `components/ValidationDashboard.tsx`

**Features:**
- QR Scanner Widget (already created)
- Code Validation Widget (already created)
- Validation history/logs
- Tabs to switch between scanner and manual entry

```tsx
import { QRScannerWidget } from './QRScannerWidget';
import { CodeValidationWidget } from './CodeValidationWidget';
import { getValidationAuditLogs } from '../services/rewardValidationService';

export const ValidationDashboard: React.FC<{ businessId: string }> = ({ businessId }) => {
  const [activeTab, setActiveTab] = useState<'scanner' | 'code' | 'history'>('scanner');
  const [auditLogs, setAuditLogs] = useState([]);
  
  useEffect(() => {
    if (activeTab === 'history') {
      loadAuditLogs();
    }
  }, [activeTab]);
  
  const loadAuditLogs = async () => {
    const logs = await getValidationAuditLogs(businessId, 50);
    setAuditLogs(logs);
  };
  
  return (
    <div className="validation-dashboard">
      {/* Tabs */}
      <div className="tabs">
        <button onClick={() => setActiveTab('scanner')}>
          QR Scanner
        </button>
        <button onClick={() => setActiveTab('code')}>
          Enter Code
        </button>
        <button onClick={() => setActiveTab('history')}>
          History
        </button>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'scanner' && (
        <QRScannerWidget 
          businessId={businessId}
          staffId={currentUser.id}
          staffName={currentUser.name}
        />
      )}
      
      {activeTab === 'code' && (
        <CodeValidationWidget
          businessId={businessId}
          staffId={currentUser.id}
          staffName={currentUser.name}
        />
      )}
      
      {activeTab === 'history' && (
        <div className="validation-history">
          <h3>Recent Validations</h3>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Reward</th>
                <th>Customer</th>
                <th>Method</th>
                <th>Staff</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map(log => (
                <tr key={log.id}>
                  <td>{new Date(log.timestamp).toLocaleString()}</td>
                  <td>{log.rewardTitle}</td>
                  <td>{log.userName}</td>
                  <td>{log.validationMethod}</td>
                  <td>{log.validatedBy}</td>
                  <td>
                    {log.success ? (
                      <span className="text-green-600">✅ Valid</span>
                    ) : (
                      <span className="text-red-600">❌ Failed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
```

**Estimated Time:** 2-3 hours

---

### 4. Install Required Dependencies (IMMEDIATE)

**Package Needed:** `react-qr-reader` for QR scanning

```bash
npm install react-qr-reader
```

Or update to use alternative:
```bash
npm install @zxing/library
```

**Alternative (No Dependencies):**
Use browser's native `BarcodeDetector` API (Chrome, Edge):
```tsx
// Replace QrReader with:
const [stream, setStream] = useState<MediaStream | null>(null);
const videoRef = useRef<HTMLVideoElement>(null);

useEffect(() => {
  const startCamera = async () => {
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }
    });
    setStream(mediaStream);
    if (videoRef.current) {
      videoRef.current.srcObject = mediaStream;
    }
  };
  
  if (scanning) {
    startCamera();
  }
  
  return () => {
    stream?.getTracks().forEach(track => track.stop());
  };
}, [scanning]);

// Scan for QR codes
useEffect(() => {
  if (!scanning || !('BarcodeDetector' in window)) return;
  
  const detector = new BarcodeDetector({ formats: ['qr_code'] });
  
  const scan = async () => {
    if (!videoRef.current) return;
    
    try {
      const barcodes = await detector.detect(videoRef.current);
      if (barcodes.length > 0) {
        handleScan(barcodes[0].rawValue);
      }
    } catch (err) {
      console.error('Scan error:', err);
    }
    
    requestAnimationFrame(scan);
  };
  
  scan();
}, [scanning]);
```

**Estimated Time:** 30 minutes

---

### 5. Update Firestore Security Rules (HIGH PRIORITY)

**File:** `firestore.rules`

**Add Rules for New Collections:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ... existing rules ...
    
    // Reward Validation Audit Logs
    match /rewardValidationAudit/{auditId} {
      // Only businesses can read their own audit logs
      allow read: if request.auth != null 
        && get(/databases/$(database)/documents/businesses/$(resource.data.businessId)).data.ownerId == request.auth.uid;
      
      // System can write (from Cloud Functions or validated clients)
      allow write: if request.auth != null;
    }
    
    // Pricing Deviations
    match /pricingDeviations/{deviationId} {
      // Businesses can read their own deviations
      allow read: if request.auth != null 
        && get(/databases/$(database)/documents/businesses/$(resource.data.businessId)).data.ownerId == request.auth.uid;
      
      // System can write
      allow write: if request.auth != null;
    }
    
    // Redeemed Rewards (update to include validation fields)
    match /redeemedRewards/{redemptionId} {
      // Users can read their own redemptions
      allow read: if request.auth != null 
        && (resource.data.userId == request.auth.uid 
        || get(/databases/$(database)/documents/businesses/$(resource.data.businessId)).data.ownerId == request.auth.uid);
      
      // Users can create redemptions
      allow create: if request.auth != null 
        && request.resource.data.userId == request.auth.uid;
      
      // Businesses can update (for validation)
      allow update: if request.auth != null 
        && get(/databases/$(database)/documents/businesses/$(resource.data.businessId)).data.ownerId == request.auth.uid;
    }
  }
}
```

**Estimated Time:** 15 minutes

---

### 6. Add Cloud Function for Expired Codes (LOW PRIORITY)

**File:** `functions/index.js`

**Add Function:**

```javascript
exports.markExpiredRedemptions = onSchedule({
  schedule: "0 2 * * *", // Daily at 2am UTC
  timeZone: "UTC"
}, async (event) => {
  const admin = require('firebase-admin');
  const db = admin.firestore();
  const now = admin.firestore.Timestamp.now();
  
  console.log('[ExpiredRedemptions] Starting cleanup...');
  
  try {
    // Find expired, unvalidated redemptions
    const expiredSnapshot = await db.collection('redeemedRewards')
      .where('validated', '==', false)
      .where('expiresAt', '<=', now)
      .get();
    
    console.log(`[ExpiredRedemptions] Found ${expiredSnapshot.size} expired redemptions`);
    
    // Mark as expired in batches
    const batchSize = 500;
    let batch = db.batch();
    let count = 0;
    
    for (const doc of expiredSnapshot.docs) {
      batch.update(doc.ref, { 
        status: 'EXPIRED',
        expiredAt: now
      });
      
      count++;
      
      // Commit batch every 500 docs
      if (count % batchSize === 0) {
        await batch.commit();
        batch = db.batch();
      }
    }
    
    // Commit remaining
    if (count % batchSize !== 0) {
      await batch.commit();
    }
    
    console.log(`[ExpiredRedemptions] ✅ Marked ${count} redemptions as expired`);
    
  } catch (error) {
    console.error('[ExpiredRedemptions] ❌ Error:', error);
    throw error;
  }
});
```

**Deploy:**
```bash
firebase deploy --only functions:markExpiredRedemptions
```

**Estimated Time:** 30 minutes

---

### 7. Testing Plan (CRITICAL)

#### Unit Tests
- [ ] `generateQRCode()` produces unique codes
- [ ] `generateAlphanumericCode()` produces unique codes
- [ ] `validateQRCode()` marks as validated
- [ ] `validateQRCode()` rejects already-validated codes
- [ ] `validateAlphanumericCode()` marks as validated
- [ ] `validateAlphanumericCode()` rejects already-validated codes
- [ ] `checkRedemptionFrequency()` enforces limits
- [ ] `calculateFairValueGuardrails()` returns correct ranges
- [ ] Atomic transactions prevent race conditions

#### Integration Tests
- [ ] Customer redeems reward → QR generated
- [ ] Customer redeems reward → Code generated
- [ ] Business scans QR → Validates once
- [ ] Business scans QR twice → Rejects second scan
- [ ] Business enters code → Validates once
- [ ] Business enters code twice → Rejects second entry
- [ ] Offline validation → Blocked
- [ ] Expired code validation → Rejected
- [ ] Redemption frequency (once) → Blocks second redemption
- [ ] Redemption frequency (daily) → Allows after 24h
- [ ] Redemption frequency (weekly) → Allows after 7d

#### E2E Tests
- [ ] Full customer redemption flow (physical)
- [ ] Full customer redemption flow (online)
- [ ] QR scanner on mobile device (camera access)
- [ ] Code validation on desktop
- [ ] Pricing guidance displays correctly
- [ ] Pricing deviation logged
- [ ] Audit logs visible in dashboard

**Estimated Time:** 4-6 hours

---

### 8. Documentation Updates (LOW PRIORITY)

- [ ] Update API documentation
- [ ] Add screenshots to business guide
- [ ] Create video tutorial (QR scanning)
- [ ] Update FAQ with new reward system
- [ ] Add troubleshooting section
- [ ] Document fraud detection metrics

**Estimated Time:** 2-3 hours

---

## Total Estimated Time

- **Critical Path:** 8-12 hours
- **Full Implementation:** 15-20 hours
- **With Testing & Documentation:** 20-30 hours

---

## Priority Order

1. **IMMEDIATE:**
   - [ ] Install dependencies (react-qr-reader or alternative)
   - [ ] Update Firestore security rules

2. **HIGH PRIORITY:**
   - [ ] Update reward creation form (required fields)
   - [ ] Add fair value guardrails display
   - [ ] Update customer redemption UI (show codes)

3. **MEDIUM PRIORITY:**
   - [ ] Create validation dashboard (integrate widgets)
   - [ ] Add validation history view
   - [ ] Test QR scanning on mobile

4. **LOW PRIORITY:**
   - [ ] Add expired codes cleanup function
   - [ ] Create admin analytics dashboard
   - [ ] Write comprehensive tests

---

## Known Issues / Considerations

### Browser Compatibility
- QR scanning requires camera access (HTTPS only)
- `BarcodeDetector` API only in Chrome/Edge (fallback to library)
- Safari may have camera permission quirks

### Mobile Testing Required
- Test QR scanning on iOS Safari
- Test QR scanning on Android Chrome
- Verify camera orientation (portrait/landscape)
- Test code display on small screens

### Performance
- QR code generation is async (SHA256 hashing)
- Large validation audit logs may need pagination
- Fair value calculation queries multiple rewards (cache results)

### Security
- IP address logging (consider GDPR compliance)
- Device fingerprinting (privacy considerations)
- Audit log retention policy needed
- Consider rate limiting validation attempts

---

## Support Needed

### From Team
- Design approval for fair value guardrails UI
- Copy review for warning messages
- QA testing on multiple devices
- Legal review of audit logging (privacy)

### External
- Firebase quota check (Cloud Functions, Firestore writes)
- CDN for QR code images (if using external API)
- Consider self-hosting QR generation (privacy)

---

## Success Metrics

### Technical
- [ ] Zero double-redemptions (atomic transactions work)
- [ ] <100ms validation time
- [ ] 99.9% uptime for validation service
- [ ] All validations logged (audit trail complete)

### Business
- [ ] Pricing deviations <20% (guardrails effective)
- [ ] Fraud detection catches >90% of abuse
- [ ] Staff adoption of QR scanner >80%
- [ ] Customer satisfaction with validation process >4.5/5

---

## Rollback Plan

If issues arise:

1. **Phase 1 Rollback:**
   - Keep new reward fields optional (not required)
   - Allow legacy voucher codes (no validation)
   - Disable fair value guardrails

2. **Phase 2 Rollback:**
   - Disable QR validation (manual only)
   - Fallback to admin approval flow

3. **Full Rollback:**
   - Revert to previous redemption service
   - Keep new types (no breaking changes)
   - Archive validation services (don't delete)

---

## Next Action Items

**TODAY:**
1. Install `react-qr-reader` dependency
2. Update Firestore security rules
3. Test code generation functions

**THIS WEEK:**
1. Update reward creation form
2. Add fair value guardrails display
3. Test QR scanning on mobile
4. Deploy validation dashboard

**THIS MONTH:**
1. Complete integration testing
2. Add Cloud Function for expired codes
3. Create staff training materials
4. Monitor validation metrics

---

**Questions?** Review [REWARD_VALIDATION_COMPLETE.md](./REWARD_VALIDATION_COMPLETE.md) for full technical details.
