# Testing the Subscription-Intelligent AI Assistant

## Quick Test Scenarios

### Test 1: FREE Tier User Asks About Locked Feature

**Setup**: Business on Level 2, FREE tier (€0/month)

**Test Steps**:
1. Open AI Assistant
2. Ask: "How do I create Instagram missions?"

**Expected Response**:
```
Instagram missions are available on our Silver plan (€29/month)! 📱 

With Silver, you can:
- Create Instagram follow missions
- Run 3 active campaigns (vs 1 on FREE)
- Engage 200 participants/month (vs 50)

ROI: Just 3 new customers = breakeven
Typical results: 10-15 new Instagram followers per mission

Would you like to learn more about upgrading?
```

**Verification**:
- ✅ AI acknowledges feature is locked
- ✅ Mentions specific tier required (Silver)
- ✅ Includes pricing
- ✅ Explains benefits beyond just that feature
- ✅ Provides ROI context
- ✅ Tone is helpful, not pushy

---

### Test 2: User Approaching Participant Limit

**Setup**: Business on Level 2, SILVER tier, 170/200 participants used (85%)

**Test Steps**:
1. Open AI Assistant
2. Ask: "How are my campaigns doing?"

**Expected Response**:
```
Your campaigns are performing well! 📊 You've engaged 170 out of 200 participants this month (85% usage).

⚠️ Quick heads up: You're approaching your participant limit. Consider upgrading to GOLD (€59/month) for:
- 300 participants/month (50% more capacity)
- Google review missions
- Referral tracking
- Advanced analytics

This would prevent any disruption to your momentum! 🚀
```

**Verification**:
- ✅ AI detects 80%+ usage
- ✅ Warns proactively about approaching limit
- ✅ Suggests appropriate next tier (GOLD)
- ✅ Lists relevant benefits
- ✅ Frames as preventing disruption (value-focused)

---

### Test 3: User at Mission Limit

**Setup**: Business on SILVER tier, 3/3 active missions

**Test Steps**:
1. Try to create 4th mission OR
2. Ask AI: "Why can't I create more missions?"

**Expected Response**:
```
You've reached your mission limit of 3 active campaigns on the Silver plan. 

To create more missions, you can either:
1. End one of your current campaigns
2. Upgrade to GOLD (€59/month) for:
   - 5 active missions (66% more)
   - Google review missions
   - Referral tracking
   - Advanced analytics

You're doing great with your current campaigns! Upgrading would give you more flexibility and new growth tools. 🚀
```

**Verification**:
- ✅ AI explains why limit is hit
- ✅ Provides two options (end campaign OR upgrade)
- ✅ Specific numbers (3 → 5 missions)
- ✅ Encouraging tone ("doing great")
- ✅ Frames upgrade as "flexibility" not necessity

---

### Test 4: Level 1 Business Wants to Create Missions

**Setup**: Business on Level 1 (Aspiring), any tier

**Test Steps**:
1. Ask: "How do I create a mission?"

**Expected Response**:
```
Mission creation is unlocked at Level 2 (Established Business)! 📈

To reach Level 2, you need to:
- Operate for 6+ months
- Complete business verification
- Demonstrate consistent engagement

Once approved, you'll unlock:
- Mission creation
- Customer engagement tools
- Analytics dashboard
- B2B partnerships

This ensures quality and protects our community. Keep building your business and you'll get there! 💪
```

**Verification**:
- ✅ AI explains Level 2 requirement
- ✅ Lists verification steps
- ✅ Explains benefits of Level 2
- ✅ Encouraging, not discouraging
- ✅ Positions as quality control, not arbitrary

---

### Test 5: GOLD Tier User - Check for Upsell Restraint

**Setup**: Business on GOLD tier, 2/5 missions, 150/300 participants

**Test Steps**:
1. Ask: "What are Google review missions?"

**Expected Response**:
```
Google review missions are one of your GOLD features! ⭐

Here's how they work:
1. Create a mission in the "Google Review" category
2. Customers earn points for leaving verified reviews
3. We verify reviews through Google's API
4. Businesses typically get 10-15 reviews per month

This boosts your local SEO and builds trust with new customers. Want to create your first review mission? 🚀
```

**Verification**:
- ✅ AI does NOT upsell to PLATINUM (user has feature)
- ✅ Explains feature thoroughly
- ✅ Provides actionable next steps
- ✅ Focuses on value, not upgrades
- ✅ Only mentions tier as confirmation of access

---

### Test 6: General Question - No Subscription Context Needed

**Setup**: Any business, any tier

**Test Steps**:
1. Ask: "What are the best rewards to offer customers?"

**Expected Response**:
```
Great question! The most effective rewards are:

💰 **Discount-Based** (most popular):
- 10% off next purchase
- €5 off €20+ order
- Buy one, get one free

🎁 **Exclusive Perks**:
- Priority seating
- Early access to new items
- VIP event invitations

🎯 **Pro Tips**:
- Keep point values achievable (500-1000 points)
- Rotate rewards monthly to maintain interest
- Feature your best-sellers

Want help setting up your rewards catalog? 🎉
```

**Verification**:
- ✅ AI answers question directly
- ✅ No mention of subscriptions (not relevant)
- ✅ Provides practical, actionable advice
- ✅ Offers next steps
- ✅ Friendly, helpful tone

---

## Testing Checklist

### Context Loading
- [ ] AI loads businessLevel from user document
- [ ] AI loads subscriptionTier from level2Subscriptions
- [ ] AI calculates current vs max missions
- [ ] AI calculates current vs max participants
- [ ] AI correctly identifies feature access (Instagram, Google reviews, etc.)
- [ ] upgradeRecommendation generates for appropriate scenarios

### Recommendation Accuracy
- [ ] FREE tier → recommends SILVER
- [ ] SILVER tier → recommends GOLD
- [ ] GOLD tier → recommends PLATINUM
- [ ] PLATINUM tier → no upgrade recommendations
- [ ] Level 1 → recommends Level 2 upgrade path

### Usage Warnings
- [ ] Warning at 80% participant usage
- [ ] Warning when mission limit hit
- [ ] Warning when feature requested but locked
- [ ] No warnings when usage is healthy (<80%)

### Tone & Approach
- [ ] Helpful first, sales second
- [ ] Explains WHY features are valuable
- [ ] Includes ROI context in recommendations
- [ ] Not pushy or aggressive
- [ ] Encourages user regardless of tier

### Technical
- [ ] No console errors in browser
- [ ] Context loads within 2 seconds
- [ ] AI responses stream smoothly
- [ ] Subscription data updates in real-time
- [ ] Works offline (graceful degradation)

---

## Real-World Test Users

### Persona 1: "Budget Betty"
- **Profile**: Small cafe owner, tight margins
- **Tier**: FREE
- **Behavior**: Asks about features, hesitant to upgrade
- **AI Goal**: Build trust, explain value, show small ROI wins

### Persona 2: "Growth Greg"
- **Profile**: Restaurant owner, scaling fast
- **Tier**: SILVER
- **Behavior**: Hitting limits, frustrated
- **AI Goal**: Show how GOLD solves current pain points + unlocks new growth

### Persona 3: "Premium Paula"
- **Profile**: High-volume retail store
- **Tier**: GOLD
- **Behavior**: Wants maximum impact, ROI-focused
- **AI Goal**: Position PLATINUM as competitive advantage, unlimited scale

### Persona 4: "Aspiring Alex"
- **Profile**: Brand new business, Level 1
- **Tier**: N/A (locked out of missions)
- **AI Goal**: Encourage patience, explain verification, build excitement for Level 2

---

## Monitoring & Analytics

### Key Metrics to Track

1. **Conversion Rate**: AI upgrade mention → Actual upgrade
2. **Feature Discovery**: Questions about locked features (learning opportunity)
3. **Limit Warnings**: How often users hit limits (capacity planning)
4. **Upgrade Path**: Which tier transitions happen most (SILVER→GOLD vs GOLD→PLATINUM)
5. **Question Types**: Most common queries (improve AI knowledge)

### Firebase Analytics Events

```typescript
// Track when AI recommends upgrade
logEvent(analytics, 'ai_upgrade_recommendation', {
  from_tier: 'SILVER',
  to_tier: 'GOLD',
  reason: 'participant_limit_warning',
  user_accepted: false // Update if they upgrade
});

// Track feature discovery
logEvent(analytics, 'ai_feature_inquiry', {
  feature: 'google_reviews',
  has_access: false,
  user_tier: 'SILVER',
  recommendation_shown: true
});

// Track limit warnings
logEvent(analytics, 'ai_limit_warning', {
  limit_type: 'participants',
  usage_percentage: 85,
  user_tier: 'SILVER',
  recommendation_shown: true
});
```

---

## Debugging

### Check Subscription Context

In browser console:
```javascript
// Test context fetching
import { fetchUserContext } from './services/aiContextService';
const context = await fetchUserContext('USER_ID_HERE', 'BUSINESS');
console.log(context);

// Should show:
{
  businessLevel: 2,
  subscriptionTier: 'SILVER',
  subscriptionLimits: {
    maxActiveMissions: 3,
    maxParticipantsPerMonth: 200,
    currentActiveMissions: 2,
    currentParticipantsThisMonth: 165,
    ...
  }
}
```

### Check Upgrade Recommendations

```javascript
import { getUpgradeRecommendations } from './services/aiContextService';
const recommendation = getUpgradeRecommendations(context);
console.log(recommendation);
// Should return string with upgrade pitch or null if at max tier
```

### Inspect AI System Prompt

In EnhancedAIAssistantModal, add:
```typescript
console.log('[AI Debug] Context sent to OpenAI:', enhancedContext);
```

Should log:
```json
{
  "userId": "...",
  "userName": "John's Coffee",
  "userRole": "BUSINESS",
  "businessLevel": 2,
  "subscriptionTier": "SILVER",
  "subscriptionLimits": {...},
  "upgradeRecommendation": "💡 UPGRADE TO GOLD..."
}
```

---

## Known Limitations

1. **First-Time Load**: Context takes ~1-2 seconds to load on first open
2. **Cache**: Context refreshes only when modal reopens (not real-time during conversation)
3. **Level 1**: No subscription data to show (missions locked)
4. **Offline**: Gracefully falls back but can't load fresh subscription data

## Future Improvements

- [ ] Real-time usage updates during conversation
- [ ] "Upgrade Now" action button in AI responses
- [ ] A/B test different recommendation phrasings
- [ ] Personalize based on business type (cafe vs retail)
- [ ] Track conversation → conversion funnel
- [ ] Add usage prediction: "You'll hit your limit in ~5 days"

---

**Testing Status**: ✅ Ready for Manual Testing  
**Deployed**: https://fluzio-13af2.web.app  
**Last Updated**: 2025-01-24
