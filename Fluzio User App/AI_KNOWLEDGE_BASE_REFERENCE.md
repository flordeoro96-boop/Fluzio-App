# AI Assistant Knowledge Base - Quick Reference

## What the Enhanced AI Assistant Knows

### Business Subscription Tiers

#### **Level 1 (Aspiring Businesses)**
- **FREE (€0/month)**
  - Browse missions, explore platform
  - Cannot create missions
  - Learning phase
  
- **SILVER (€14/month)**
  - 1 active mission
  - 50 participants/month
  - Basic mission types (check-in, social share)
  
- **GOLD (€24/month)**
  - 2 active missions
  - 100 participants/month
  - Social share missions
  - Basic analytics

#### **Level 2+ (Established Businesses)**
- **FREE (€0/month)**
  - 1 active mission
  - 50 participants/month
  - Check-in & social share only
  
- **SILVER (€29/month)**
  - 3 active missions
  - 200 participants/month
  - ✅ Instagram follow missions
  - ✅ Instagram story missions
  
- **GOLD (€59/month)**
  - 5 active missions
  - 300 participants/month
  - ✅ Instagram feed post missions
  - ✅ Google review missions
  - ✅ Referral tracking
  - ✅ Advanced analytics
  
- **PLATINUM (€99/month)**
  - ⭐ Unlimited active missions
  - 2,500 participants/month
  - ✅ All GOLD features
  - ✅ Video missions
  - ✅ Priority placement
  - ✅ Featured business status

### Features the AI Understands

#### **Customer App Features**
- **Missions Tab**: Browse and complete missions for points
- **Rewards Tab**: Redeem points for rewards
- **My Squad**: Connect with friends, see friend activity
- **Profile**: Level progression, achievements, stats
- **Meetups**: Join community events
- **Leaderboards**: Compete with other users

#### **Business Features**
- **Mission Creation**: Design campaigns with AI assistance
- **Mission Verification**: AI and manual review of submissions
- **Customer Tracking**: See who's engaging with your business
- **Analytics Dashboard**: Track mission performance, ROI
- **Rewards Management**: Create and manage reward catalog
- **Subscription Management**: Upgrade/downgrade tiers

#### **B2B Partner Features (Partners Tab)**
1. **Squad** - Business networking groups
   - Join local business communities
   - Share knowledge and resources
   - Organize group meetups
   - Cross-promote with partners

2. **Match** - AI-powered collaboration matching
   - Find complementary businesses
   - Discover partnership opportunities
   - AI suggests matches based on industry, location, goals
   - Direct messaging with potential partners

3. **Projects** - Collaborative initiatives
   - Create joint marketing campaigns
   - Share resources (venues, equipment, staff)
   - Bundle services together
   - Track project participation and ROI

4. **Market** - Service marketplace
   - Offer services to other businesses (catering, design, etc.)
   - Browse and book services from partners
   - Transparent pricing and availability
   - Reviews and ratings system

5. **Events** - Co-hosted events
   - Plan joint events (pop-ups, workshops, networking)
   - Split costs and attendance
   - Coordinate logistics
   - Track event success metrics

#### **Creator Features**
- **Portfolio**: Showcase past work, skills, testimonials
- **Projects Browser**: Find collaboration opportunities
- **Application System**: Apply to projects with proposals
- **Booking Calendar**: Manage availability
- **Payment Tracking**: Track project earnings
- **Networking**: Connect with businesses and other creators

### Mission Types the AI Knows

| Mission Type | Description | Tier Required |
|--------------|-------------|---------------|
| Check-in | Visit location, scan QR code | All tiers |
| Social Share | Share business on social media | All tiers |
| Instagram Follow | Follow Instagram account | SILVER+ |
| Instagram Story | Repost to Instagram story | SILVER+ |
| Instagram Feed Post | Post to Instagram feed | GOLD+ |
| Google Review | Leave Google review | GOLD+ |
| Referral | Bring a friend (tracked) | GOLD+ |
| Video Upload | Create video content | PLATINUM |

### Upgrade Paths the AI Suggests

#### **From FREE → SILVER**
- **Cost**: €29/month (Level 2)
- **Key Benefits**: Instagram missions, 3 active campaigns, 4x participants
- **ROI**: Just 3 new customers = breakeven
- **Ideal For**: Businesses ready to scale customer engagement

#### **From SILVER → GOLD**
- **Cost**: €59/month
- **Key Benefits**: Google reviews, referrals, analytics, 5 active missions
- **ROI**: 5-10x investment (15-30 new customers/month)
- **Ideal For**: Businesses serious about growth and reputation

#### **From GOLD → PLATINUM**
- **Cost**: €99/month
- **Key Benefits**: Unlimited missions, video, priority placement, 2,500 participants
- **ROI**: 10-20x investment (50-100+ new customers/month)
- **Ideal For**: High-volume businesses, restaurants, retail stores

#### **From Level 1 → Level 2**
- **Cost**: Complete verification process
- **Requirements**: 
  - Established business (6+ months)
  - Verified business documentation
  - Positive early engagement
- **Key Unlock**: Mission creation ability

### Usage Limit Warnings

The AI alerts at:
- **80% of participant limit**: "You're using 85% of your monthly participants"
- **Max missions reached**: "You've hit your mission limit of X"
- **Feature not available**: Explains tier required to unlock

### ROI Calculations the AI Uses

- **FREE → SILVER**: Breakeven at 3-5 new customers
- **SILVER → GOLD**: Breakeven at 6-8 new customers  
- **GOLD → PLATINUM**: Breakeven at 10-15 new customers

**Average Customer Value Assumptions**:
- Restaurant/Cafe: €15-30 per visit
- Retail: €25-50 per purchase
- Service Business: €50-200 per booking

### Context the AI Receives in Every Conversation

```typescript
{
  userName: "John's Coffee Shop",
  userRole: "BUSINESS",
  businessLevel: 2,
  subscriptionTier: "SILVER",
  location: { city: "Dublin", country: "Ireland" },
  businessType: "Cafe",
  subscriptionLimits: {
    maxActiveMissions: 3,
    maxParticipantsPerMonth: 200,
    currentActiveMissions: 2,
    currentParticipantsThisMonth: 165,
    hasInstagramMissions: true,
    hasGoogleReviews: false,
    hasVideoMissions: false,
    hasEvents: true
  },
  recentActivity: [
    "Created mission: Weekend Coffee Special",
    "Verified 12 check-in submissions",
    "Received 5 new followers on Instagram"
  ]
}
```

### AI Personality & Approach

- **Tone**: Friendly, helpful, encouraging
- **Length**: 2-3 sentences unless complex explanation needed
- **Emojis**: Uses them naturally (📊, 🎯, 🚀, ✅, 💡)
- **Actionable**: Always provides next steps
- **Not Pushy**: Only mentions upgrades when relevant
- **Educational**: Explains features clearly

### Sample Responses by Scenario

#### **Feature Question (Has Access)**
Q: "How do Instagram missions work?"  
A: "Instagram missions let customers follow your account to earn points! 📱 In your mission creation modal, select 'Instagram Follow' and we'll automatically verify when users follow @yourcafe. You typically get 10-15 new followers per active mission. Want to create one now?"

#### **Feature Question (No Access)**
Q: "Can I create Google review missions?"  
A: "Google review missions are available on our GOLD plan (€59/month). They're super effective - reviews boost your local SEO and build trust! On GOLD you also get referral tracking and advanced analytics. Would you like to learn more about upgrading?"

#### **Performance Question (Approaching Limit)**
Q: "How am I doing this month?"  
A: "You're doing great! 📊 You have 165 participants across 2 missions (82% of your monthly limit). Quick tip: You're approaching your 200 participant cap. Consider upgrading to GOLD for 300 participants/month + Google review missions to keep momentum going!"

#### **General Help**
Q: "I'm new to Fluzio, where should I start?"  
A: "Welcome! 🎉 Here's your quick start:  
1. Create your first mission (try a check-in mission)  
2. Set up rewards to motivate customers  
3. Share your QR code in-store  
You're on SILVER with 3 available mission slots. Want help creating your first campaign?"

## Implementation Details

**Files Modified**:
- `services/aiContextService.ts`: Context fetching + upgrade recommendations
- `services/openaiService.ts`: System prompt with subscription awareness
- `components/EnhancedAIAssistantModal.tsx`: Pass subscription context to AI

**Key Functions**:
- `fetchUserContext()`: Loads all user data including subscription
- `getUpgradeRecommendations()`: Generates personalized upgrade suggestions  
- `buildSystemPrompt()`: Includes subscription status in AI instructions
- `chatWithAssistant()`: Accepts subscription fields in context

**Data Sources**:
- `users/{userId}`: Business level
- `level2Subscriptions/{userId}`: Tier, usage stats
- `missions`: Active mission count
- `level2SubscriptionService.LEVEL2_TIER_BENEFITS`: Tier capabilities

---

**Last Updated**: 2025-01-24  
**Status**: ✅ Live in Production  
**Version**: 1.0.0
