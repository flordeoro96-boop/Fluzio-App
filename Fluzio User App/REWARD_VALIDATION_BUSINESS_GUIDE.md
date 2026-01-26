# Reward Validation - Business Owner Quick Guide

## What Changed?

Your rewards now have **one-time use codes** that prevent fraud and ensure fair redemptions. Every reward you create requires a few new settings.

---

## Creating a Reward (3 New Required Fields)

When creating a reward, you must now specify:

### 1. **Maximum Redemptions**
How many times can this reward be redeemed in total?
- Example: 100 customers can redeem this reward

### 2. **Redemption Frequency**
How often can ONE customer redeem this reward?
- **Once** - Customer can only redeem once ever
- **Once per day** - Customer can redeem daily
- **Once per week** - Customer can redeem weekly
- **Unlimited** - No limit per customer

### 3. **Validation Type**
How will customers prove they redeemed the reward?
- **Physical (In-Store)** - Customer shows QR code at your location
- **Online** - Customer receives an alphanumeric code (e.g., AB3F-X7G2-Z9K1)

---

## Fair Pricing Guidance

When you set the points cost, you'll see:

📊 **Local Average:** What similar rewards cost in your area
📈 **Recommended Range:** Suggested min-max pricing

⚠️ **You can override these recommendations!**
- If you price outside the recommended range, you'll see a warning
- You can still create the reward (not blocked)
- Your pricing will be logged for market analysis

**Example:**
```
Local Average: 150 points
Recommended: 105 - 195 points
Your Price: 250 points

⚠️ Warning: This is 28% above local average. Customers may find
this expensive. You can still proceed.
```

---

## How Customers Redeem Rewards

### Physical Rewards (In-Store)

1. Customer redeems reward on their app
2. They receive a **QR code** on their phone
3. They come to your store and show the QR code
4. You **scan the QR code** with your staff app
5. ✅ Reward validated (QR code becomes invalid immediately)

**Security:**
- Each QR code can only be scanned **ONCE**
- Screenshots don't work (code becomes invalid after first scan)
- Requires internet connection to validate

### Online Rewards

1. Customer redeems reward on their app
2. They receive an **alphanumeric code** (e.g., AB3F-X7G2-Z9K1)
3. They enter the code on your website or tell you the code
4. You **validate the code** in your business app
5. ✅ Reward validated (code becomes invalid immediately)

**Security:**
- Each code can only be used **ONCE**
- Cannot share codes with friends (single use only)
- Requires internet connection to validate

---

## Scanning QR Codes (Staff)

### Using the QR Scanner

1. Open your business app
2. Go to **"Validate Rewards"** section
3. Tap **"Start Scanning"**
4. Point camera at customer's QR code
5. System automatically validates

**What You'll See:**
- ✅ Green = Valid (reward validated successfully)
- ❌ Red = Invalid (already used, expired, or fake)

**If QR Already Used:**
```
❌ This QR code was already used on Dec 15, 2024
By: John (Staff)
Each code can only be used once.
```

### Troubleshooting

❌ **"Camera access denied"**
→ Enable camera permissions in your browser settings

❌ **"No internet connection"**
→ Connect to WiFi or mobile data (validation requires internet)

❌ **"Code already used"**
→ Customer may have already redeemed this. Check their redemption history.

---

## Validating Alphanumeric Codes (Staff)

### Using the Code Validator

1. Open your business app
2. Go to **"Validate Rewards"** section
3. Tap **"Validate Code"**
4. Customer tells you their code (e.g., AB3F-X7G2-Z9K1)
5. Enter the code
6. Tap **"Validate"**

**Auto-Formatting:**
The code will automatically format with dashes as you type:
- You type: `AB3FX7G2Z9K1`
- Shows as: `AB3F-X7G2-Z9K1`

**What You'll See:**
- ✅ Green = Valid (code validated successfully)
- ❌ Red = Invalid (already used, expired, or wrong code)

---

## Fraud Prevention

### What We Track (Automatic)

Every validation is logged with:
- Date and time
- Staff member who validated
- IP address (fraud detection)
- Device used (fraud detection)

### Why This Matters

**Before:** Customers could screenshot QR codes and use them multiple times
**Now:** Each code becomes invalid immediately after first use

**Before:** Customers could share codes with friends
**Now:** Each code is tracked to one redemption (single use only)

**Before:** Offline validation could be abused
**Now:** Validation requires active internet connection (server verifies)

---

## Redemption Frequency Examples

### Scenario 1: Free Coffee (Once Per Day)
```
Reward: Free Small Coffee
Points Cost: 50
Max Total Redemptions: 500
Frequency: Once per day
```
- Loyal customer can get free coffee every day
- But they can't redeem 5 coffees at once
- Limited to 500 total redemptions across all customers

### Scenario 2: Grand Opening Special (Once Ever)
```
Reward: 50% Off Your First Purchase
Points Cost: 100
Max Total Redemptions: 200
Frequency: Once (ever)
```
- New customers can redeem once
- Cannot use multiple times
- Limited to first 200 customers

### Scenario 3: VIP Discount (Unlimited)
```
Reward: 10% Off All Purchases
Points Cost: 200
Max Total Redemptions: 50
Frequency: Unlimited
```
- Customer can use on every purchase
- But only 50 customers can claim this reward
- Perfect for VIP/loyalty program

---

## Common Questions

### Q: What if a customer shows me an already-used QR code?

**A:** The scanner will show:
```
❌ This QR code was already used on [date]
By: [staff member]
```
Politely explain that each reward can only be used once. Check their app to see if they have other active rewards.

### Q: What if the QR scanner isn't working?

**A:** Check:
1. Camera permissions enabled?
2. Internet connection active?
3. QR code clear and not damaged?
4. Try the alphanumeric code instead (ask customer for their code)

### Q: Can I manually validate a reward without scanning?

**A:** Yes, use the **Code Validation** option:
1. Ask customer for their alphanumeric code
2. Enter code manually
3. System validates the same way

### Q: What if pricing guidance says my price is too high?

**A:** You can still create the reward! The system shows:
- ⚠️ Warning message
- But doesn't block you
- Your price is logged for market analysis
- Consider if customers will find it fair

### Q: How do I see validation history?

**A:** In your business dashboard:
1. Go to **"Reward Analytics"**
2. View **"Validation Audit Log"**
3. See all validations (date, staff, method, success/failure)

### Q: What if customer's code expired?

**A:** Codes expire based on your reward settings:
- Default: 30 days after redemption
- Can be changed when creating reward
- Expired codes show: `❌ This code has expired`

---

## Best Practices

### ✅ DO:
- Set realistic max redemptions (don't over-promise)
- Use "once per day" for high-value rewards
- Scan QR codes promptly (prevent screenshots)
- Check validation result before providing reward
- Train staff on QR scanner usage

### ❌ DON'T:
- Don't accept screenshots (always scan from customer's app)
- Don't validate offline (requires internet)
- Don't skip validation (always use scanner/validator)
- Don't share validation codes with customers
- Don't override system rejections (if code is used, it's used)

---

## Support

### Need Help?

**QR Scanner Issues:**
- Check camera permissions
- Verify internet connection
- Try alphanumeric code instead

**Code Validation Issues:**
- Ask customer to show code in their app
- Verify code format (XXXX-XXXX-XXXX)
- Check if already used (system will tell you)

**Pricing Questions:**
- Pricing guidance is advisory only
- You control your prices
- System tracks market averages for your reference

**Fraud Concerns:**
- All validations logged automatically
- Contact support if you suspect abuse
- System tracks patterns (IP, device, timing)

---

## Summary

### Key Points:
1. ✅ **One-time use codes** prevent fraud
2. ✅ **QR scanning** for in-store redemptions
3. ✅ **Alphanumeric codes** for online redemptions
4. ✅ **Fair pricing guidance** (not mandatory)
5. ✅ **Redemption frequency** controls abuse
6. ✅ **Automatic logging** for audit trail

### Security Features:
- ✅ Screenshot reuse prevented
- ✅ Code sharing prevented
- ✅ Offline abuse prevented
- ✅ Double-redemption prevented
- ✅ Fraud patterns detected

### Your Control:
- ✅ Set your own prices (guidance is optional)
- ✅ Choose redemption frequency
- ✅ Limit total redemptions
- ✅ Set expiry dates
- ✅ View full audit trail

---

**Questions?** Contact Fluzio support or check the full documentation.
