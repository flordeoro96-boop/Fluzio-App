# 🧪 Complete Reward System Testing Guide

## ✅ System Status: READY FOR TESTING

**Date:** December 5, 2025  
**All Systems:** DEPLOYED ✅  
**Total Cloud Functions:** 55  
**Components Ready:** All ✅

---

## 🎯 Complete End-to-End Test Scenarios

### Scenario 1: Daily Check-In & Points Earning

**Objective:** Test daily streak and automatic reward points awarding

**Steps:**
1. **Daily Check-In**
   - User opens app
   - System calls `updatedailystreak` API
   - Body: `{ "userId": "YOUR_USER_ID" }`
   
2. **Expected Results:**
   - ✅ Day 1: +10 reward points (daily check-in)
   - ✅ Day 3: +10 points + 30 bonus (3-day streak)
   - ✅ Day 7: +10 points + 70 bonus (7-day streak)
   - ✅ Day 30: +10 points + 500 bonus (30-day streak)
   
3. **Verify:**
   ```bash
   # Check Firestore
   users/{userId}/rewardPoints/available
   users/{userId}/rewardPoints/recentTransactions
   # Should show daily check-in transactions
   ```

**Test API Call:**
```bash
curl -X POST https://updatedailystreak-uvpokjrjsq-uc.a.run.app \
  -H "Content-Type: application/json" \
  -d '{"userId":"YOUR_USER_ID"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Welcome! Start your daily streak",
  "streak": 1,
  "pointsAwarded": 15,
  "breakdown": {
    "basePoints": 5,
    "streakBonus": 0,
    "milestoneBonus": 0
  },
  "newBalance": 15
}
```

---

### Scenario 2: Mission Creation & Points Earning

**Objective:** Test automatic reward points when creating missions

**Steps:**
1. **Business Creates Mission**
   - Go to Missions tab
   - Click "Create Mission"
   - Fill details:
     - Title: "Follow us on Instagram"
     - Type: Social Media
     - Points: 100
   - Submit

2. **Expected Results:**
   - ✅ Mission created successfully
   - ✅ Trigger `onMissionCreate` fires
   - ✅ Business receives:
     - First mission: 200 reward points
     - Subsequent missions: 50 reward points
   - ✅ Points calculated with tier bonus + streak multiplier

3. **Verify:**
   ```javascript
   // Check Firestore
   users/{businessId}/rewardPoints/available
   // Should increase by 50-200 points
   
   users/{businessId}/rewardPoints/recentTransactions
   // Should show "Mission created" transaction
   ```

**Check Firebase Console:**
- Functions → Logs → Filter: "onMissionCreate"
- Should see: `[RewardPoints] Awarded X points to {userId}`

---

### Scenario 3: Mission Completion & Dual Points Earning

**Objective:** Test points awarded to both business and customer

**Steps:**
1. **Customer Completes Mission**
   - Customer opens mission
   - Completes task (e.g., follows on Instagram)
   - Uploads proof
   - Submits

2. **Expected Results:**
   - ✅ Trigger `onParticipationUpdate` fires
   - ✅ Business owner receives: 150 reward points
   - ✅ Customer receives: 75 reward points
   - ✅ Both amounts calculated with bonuses

3. **Verify:**
   ```javascript
   // Business
   users/{businessId}/rewardPoints/available += 150 (+ bonuses)
   
   // Customer
   users/{customerId}/rewardPoints/available += 75 (+ bonuses)
   
   // Both should have new transaction
   recentTransactions: [{
     type: "EARN",
     amount: X,
     reason: "Mission completed" or "Completed: {title}",
     timestamp: "..."
   }]
   ```

---

### Scenario 4: Create & Manage Rewards (Business)

**Objective:** Test rewards management UI

**Steps:**
1. **Open Rewards Management**
   - Business dashboard → Rewards tab
   - Should see: RewardsManagement component
   - Stats cards show: 0 active, 0 redemptions, 0 points

2. **Create First Reward**
   - Click "Create Reward"
   - Fill form:
     - Title: "Free Coffee"
     - Description: "Any size coffee on the house"
     - Points Cost: 150
     - Type: Free Item
     - Stock: 50
     - Terms: "One per customer per day"
   - Submit

3. **Expected Results:**
   - ✅ API call to `createReward`
   - ✅ Reward appears in "Active Rewards" section
   - ✅ Stats update: 1 active reward
   - ✅ Firestore: New doc in `rewards` collection

4. **Edit Reward**
   - Click Edit button
   - Change points cost: 150 → 100
   - Submit
   - ✅ Reward updates immediately

5. **Toggle Status**
   - Click eye icon
   - ✅ Reward moves to "Inactive" section
   - Click again
   - ✅ Reward moves back to "Active"

6. **Delete Reward**
   - Click trash icon
   - Confirm
   - ✅ Reward disappears (soft deleted)

**Test API Calls:**
```bash
# Create Reward
curl -X POST https://us-central1-fluzio-13af2.cloudfunctions.net/createReward \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "YOUR_BUSINESS_ID",
    "title": "Free Coffee",
    "description": "Any size coffee",
    "costPoints": 150,
    "type": "FREE_ITEM",
    "stock": 50
  }'

# Get Business Rewards
curl -X POST https://us-central1-fluzio-13af2.cloudfunctions.net/getBusinessRewards \
  -H "Content-Type: application/json" \
  -d '{"businessId":"YOUR_BUSINESS_ID"}'
```

---

### Scenario 5: Customer Redeems Reward

**Objective:** Test full redemption flow

**Steps:**
1. **Customer Opens Rewards Tab**
   - Should see real rewards (not mock data)
   - Points balance displayed at top
   - Rewards sorted by relevance

2. **Check Points Balance**
   - API: `getUserRewardPoints`
   - Should show:
     - Available points
     - Tier bonus (if applicable)
     - Streak multiplier (if applicable)

3. **Select Reward**
   - Click "Free Coffee - 150 points"
   - Modal opens with details
   - Shows:
     - Title, description
     - Points cost
     - Terms & conditions
     - Business name

4. **Redeem Reward**
   - Click "Redeem for 150 points"
   - API: `redeemRewardPoints` called
   - Loading state shown

5. **Expected Results:**
   - ✅ Success alert appears
   - ✅ Voucher code shown: `FLUZ-A7B9C2D1E4`
   - ✅ Points deducted: 500 → 350
   - ✅ Balance updates in real-time
   - ✅ Firestore:
     ```javascript
     redemptions/{redemptionId} created:
     {
       voucherCode: "FLUZ-A7B9C2D1E4",
       userId: "...",
       businessId: "...",
       rewardId: "...",
       title: "Free Coffee",
       costPoints: 150,
       status: "ACTIVE",
       redeemedAt: "2025-12-05T10:30:00Z",
       expiresAt: "2026-01-04T10:30:00Z"
     }
     ```

6. **Check "My Rewards"**
   - Click "My Rewards" button
   - Modal opens
   - Should show redeemed voucher
   - Code visible: `FLUZ-A7B9C2D1E4`

**Test API Call:**
```bash
curl -X POST https://us-central1-fluzio-13af2.cloudfunctions.net/redeemRewardPoints \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "YOUR_USER_ID",
    "rewardId": "REWARD_ID"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "voucherCode": "FLUZ-A7B9C2D1E4",
  "pointsRemaining": 350,
  "redemption": {
    "id": "...",
    "title": "Free Coffee",
    "expiresAt": "2026-01-04T10:30:00Z"
  }
}
```

---

### Scenario 6: Business Validates Voucher

**Objective:** Test voucher validation and marking as used

**Steps:**
1. **Customer Shows Voucher**
   - Customer arrives at business
   - Shows voucher code: `FLUZ-A7B9C2D1E4`

2. **Business Opens Validator**
   - Business dashboard → Vouchers tab
   - See VoucherValidation component

3. **Enter Voucher Code**
   - Type: `FLUZ-A7B9C2D1E4`
   - Click "Validate"
   - API: `validateVoucher` called

4. **Expected Results:**
   - ✅ Green success screen appears
   - ✅ Shows:
     - Reward: "Free Coffee"
     - Description: "Any size coffee"
     - Customer: "John Doe"
     - Redeemed: "Dec 5, 2025 10:30 AM"
     - Expires: "Jan 4, 2026"
     - Points Used: 150
   - ✅ "Mark as Used" button enabled

5. **Provide Reward**
   - Business gives coffee to customer

6. **Mark as Used**
   - Click "Mark as Used"
   - Confirm
   - API: `markVoucherUsed` called

7. **Expected Results:**
   - ✅ Success message: "Voucher marked as used"
   - ✅ Form resets
   - ✅ Firestore:
     ```javascript
     redemptions/{id}/status: "ACTIVE" → "USED"
     redemptions/{id}/usedAt: "2025-12-05T11:00:00Z"
     ```

8. **Try Reusing Voucher**
   - Enter same code again
   - Click "Validate"
   - ✅ Red error screen: "Voucher already used"
   - ✅ Shows used date

**Test API Calls:**
```bash
# Validate
curl -X POST https://us-central1-fluzio-13af2.cloudfunctions.net/validateVoucher \
  -H "Content-Type: application/json" \
  -d '{
    "voucherCode": "FLUZ-A7B9C2D1E4",
    "businessId": "YOUR_BUSINESS_ID"
  }'

# Mark as Used
curl -X POST https://us-central1-fluzio-13af2.cloudfunctions.net/markVoucherUsed \
  -H "Content-Type: application/json" \
  -d '{
    "redemptionId": "REDEMPTION_ID",
    "businessId": "YOUR_BUSINESS_ID"
  }'
```

---

## 📊 Full System Test Checklist

### ✅ Reward Points Earning
- [ ] Daily check-in awards 10 points
- [ ] 3-day streak awards 30 bonus
- [ ] 7-day streak awards 70 bonus
- [ ] 30-day streak awards 500 bonus
- [ ] Mission creation awards 50-200 points
- [ ] Mission completion awards points to both parties
- [ ] Meetup hosting awards 100-150 points
- [ ] Tier bonuses apply correctly (GOLD = +10%)
- [ ] Streak multipliers apply correctly

### ✅ Rewards Management (Business)
- [ ] Create reward form works
- [ ] Edit reward updates correctly
- [ ] Delete reward (soft delete)
- [ ] Toggle active/inactive status
- [ ] Stats update in real-time
- [ ] Redemption counts accurate
- [ ] All reward types supported

### ✅ Rewards Catalog (Customer)
- [ ] Real rewards display (not mock)
- [ ] Points balance shows correctly
- [ ] Tier bonus displays
- [ ] Streak multiplier displays
- [ ] Affordable filter works
- [ ] Type filters work
- [ ] Time-based sorting works

### ✅ Redemption Flow
- [ ] Can redeem reward
- [ ] Points deducted correctly
- [ ] Voucher code generated
- [ ] Code shows in alert
- [ ] "My Rewards" shows redemption
- [ ] Balance updates immediately
- [ ] Stock decrements

### ✅ Voucher Validation
- [ ] Valid voucher shows green
- [ ] Customer details correct
- [ ] Can mark as used
- [ ] Used voucher shows red error
- [ ] Expired voucher handled
- [ ] Wrong business rejected
- [ ] Case-insensitive matching

### ✅ Error Handling
- [ ] Insufficient points handled
- [ ] Invalid voucher handled
- [ ] Network errors handled
- [ ] Missing data handled
- [ ] Duplicate redemptions prevented

---

## 🔥 Quick Test Script

Run this sequence to test everything quickly:

```bash
# 1. Daily Check-In (earn 10 points)
curl -X POST https://updatedailystreak-uvpokjrjsq-uc.a.run.app \
  -H "Content-Type: application/json" \
  -d '{"userId":"YOUR_USER_ID"}'

# 2. Check Points Balance
curl -X POST https://us-central1-fluzio-13af2.cloudfunctions.net/getUserRewardPoints \
  -H "Content-Type: application/json" \
  -d '{"userId":"YOUR_USER_ID"}'

# 3. Create Reward (as business)
curl -X POST https://us-central1-fluzio-13af2.cloudfunctions.net/createReward \
  -H "Content-Type: application/json" \
  -d '{
    "businessId":"YOUR_BUSINESS_ID",
    "title":"Test Reward",
    "description":"Test description",
    "costPoints":50,
    "type":"FREE_ITEM",
    "stock":10
  }'

# 4. Get Available Rewards
curl -X POST https://us-central1-fluzio-13af2.cloudfunctions.net/getAvailableRewards \
  -H "Content-Type: application/json" \
  -d '{"userId":"YOUR_USER_ID","city":"Munich"}'

# 5. Redeem Reward
curl -X POST https://us-central1-fluzio-13af2.cloudfunctions.net/redeemRewardPoints \
  -H "Content-Type: application/json" \
  -d '{
    "userId":"YOUR_USER_ID",
    "rewardId":"REWARD_ID_FROM_STEP_3"
  }'
# Copy the voucherCode from response

# 6. Validate Voucher
curl -X POST https://us-central1-fluzio-13af2.cloudfunctions.net/validateVoucher \
  -H "Content-Type: application/json" \
  -d '{
    "voucherCode":"VOUCHER_FROM_STEP_5",
    "businessId":"YOUR_BUSINESS_ID"
  }'

# 7. Mark as Used
curl -X POST https://us-central1-fluzio-13af2.cloudfunctions.net/markVoucherUsed \
  -H "Content-Type: application/json" \
  -d '{
    "redemptionId":"REDEMPTION_ID_FROM_STEP_6",
    "businessId":"YOUR_BUSINESS_ID"
  }'
```

---

## 🐛 Common Issues & Solutions

### Issue: Points not awarded after mission
**Solution:** Check Firebase Functions logs for `onMissionCreate` trigger. Verify `awardRewardPoints` was called.

### Issue: Voucher validation fails
**Solution:** Ensure businessId matches the reward's businessId. Check Firestore redemptions collection.

### Issue: Mock data still showing in Rewards tab
**Solution:** Create at least one real reward using RewardsManagement. API falls back to mock if empty.

### Issue: Bonus multipliers not applying
**Solution:** Check user's tier (GOLD/PLATINUM) and streak days in Firestore. Bonuses only apply if > 0.

### Issue: "Already claimed today" for streak
**Solution:** This is correct behavior. Streak can only be claimed once per day.

---

## 📱 UI Testing

### Desktop
- [ ] Rewards Management full width
- [ ] Forms responsive
- [ ] Modals centered
- [ ] Stats cards align properly

### Mobile
- [ ] Create reward form scrollable
- [ ] Voucher input large enough
- [ ] Cards stack vertically
- [ ] Buttons full width

---

## 🎉 Success Criteria

**All systems working if:**
- ✅ Daily check-in awards points
- ✅ Missions auto-award points to both parties
- ✅ Business can create/edit/delete rewards
- ✅ Customer can see real rewards catalog
- ✅ Redemption generates valid voucher code
- ✅ Business can validate and mark vouchers as used
- ✅ Points balance updates in real-time
- ✅ Tier bonuses and streak multipliers apply
- ✅ All error cases handled gracefully

---

## 📊 Data Verification Queries

**Check user's reward points:**
```javascript
// Firestore Console
users/{userId}
// Look for:
{
  rewardPoints: {
    available: X,
    totalEarned: Y,
    recentTransactions: [...]
  }
}
```

**Check redemptions:**
```javascript
// Firestore Console
redemptions/
// Filter: businessId == YOUR_ID
// Should show all vouchers
```

**Check rewards:**
```javascript
// Firestore Console
rewards/
// Filter: businessId == YOUR_ID AND status == "ACTIVE"
// Should show active rewards
```

---

## 🚀 Production Readiness

**System is production-ready when:**
- ✅ All test scenarios pass
- ✅ No console errors
- ✅ Firebase Functions logs clean
- ✅ Firestore data structure correct
- ✅ UI responsive on all devices
- ✅ Error handling verified
- ✅ Performance acceptable (<2s response times)

---

## 📞 Next Steps After Testing

1. ✅ Fix any bugs found during testing
2. ✅ Add RewardsManagement to business dashboard
3. ✅ Add VoucherValidation to business dashboard
4. ✅ Announce new feature to users
5. ✅ Monitor Firebase Console for first week
6. ✅ Gather user feedback
7. ✅ Iterate and improve

---

**Happy Testing! 🎉**

All 55 Cloud Functions are deployed and ready.  
The complete reward system is LIVE!
