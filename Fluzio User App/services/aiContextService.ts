/**
 * AI Context Service - Provides real-time user data for AI Assistant
 * Fetches user statistics, recent activity, and contextual information
 */

import { collection, query, where, orderBy, limit, getDocs, doc, getDoc } from '../services/firestoreCompat';
import { db } from './apiService';

export interface UserContextData {
  // Basic Info
  userId: string;
  userName: string;
  userRole: 'USER' | 'BUSINESS' | 'CREATOR';
  location?: { city?: string; country?: string };
  subscriptionLevel?: string;
  businessType?: string;
  
  // Subscription & Level (Business-specific)
  businessLevel?: number; // 1-6
  subscriptionTier?: 'STARTER' | 'SILVER' | 'GOLD' | 'PLATINUM';
  subscriptionLimits?: {
    maxActiveMissions: number;
    maxParticipantsPerMonth: number;
    currentActiveMissions: number;
    currentParticipantsThisMonth: number;
    hasInAppFollowMissions: boolean;
    hasInAppReviewMissions: boolean;
    hasPhotoMissions: boolean;
    hasVideoMissions: boolean;
    hasEvents: boolean;
  };
  
  // Statistics
  stats?: {
    totalPoints?: number;
    level?: number;
    missionsCompleted?: number;
    activeMissions?: number;
    totalRewards?: number;
    redeemedRewards?: number;
    checkIns?: number;
    followers?: number;
    
    // Business-specific
    totalCampaigns?: number;
    pendingReviews?: number;
    totalApplications?: number;
    activeAmbassadors?: number;
    
    // Creator-specific
    portfolioItems?: number;
    projectApplications?: number;
    activeProjects?: number;
    totalEarnings?: number;
  };
  
  // Recent Activity
  recentActivity?: Array<{
    type: string;
    title: string;
    timestamp: Date;
  }>;
  
  // Current Context
  currentScreen?: string;
  lastActiveFeature?: string;
  strugglingWith?: string; // Detected issue (e.g., stuck on a page)
}

/**
 * Fetch comprehensive user context for AI Assistant
 */
export async function fetchUserContext(userId: string, userRole: string): Promise<UserContextData | null> {
  try {
    console.log('[AIContext] Fetching context for user:', userId, userRole);
    
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      console.warn('[AIContext] User not found');
      return null;
    }
    
    const userData = userDoc.data();
    
    const context: UserContextData = {
      userId,
      userName: userData.name || 'User',
      userRole: userRole as 'USER' | 'BUSINESS' | 'CREATOR',
      location: userData.homeCity ? { city: userData.homeCity, country: userData.country } : undefined,
      subscriptionLevel: userData.subscriptionLevel,
      businessType: userData.businessType,
      stats: {},
      recentActivity: []
    };
    
    // Fetch role-specific data
    if (userRole === 'BUSINESS') {
      await fetchBusinessContext(userId, context);
    } else if (userRole === 'CREATOR') {
      await fetchCreatorContext(userId, context);
    } else {
      await fetchCustomerContext(userId, context);
    }
    
    // Fetch recent activity
    await fetchRecentActivity(userId, userRole, context);
    
    console.log('[AIContext] Context fetched successfully:', context);
    return context;
    
  } catch (error) {
    console.error('[AIContext] Error fetching context:', error);
    return null;
  }
}

/**
 * Fetch business-specific context
 */
async function fetchBusinessContext(businessId: string, context: UserContextData) {
  try {
    // Fetch user document for level and subscription info
    const userDoc = await getDoc(doc(db, 'users', businessId));
    const userData = userDoc.data();
    
    // Get business level (1-6) - check both 'level' and 'businessLevel' fields
    context.businessLevel = userData?.level || userData?.businessLevel || 1;
    console.log('[AIContext] Business Level from Firestore:', {
      userId: businessId,
      level: userData?.level,
      businessLevel: userData?.businessLevel,
      fallbackUsed: !userData?.level && !userData?.businessLevel,
      finalLevel: context.businessLevel
    });
    
    // Fetch Level 2 subscription if applicable
    if (context.businessLevel >= 2) {
      try {
        const level2SubDoc = await getDoc(doc(db, 'level2Subscriptions', businessId));
        if (level2SubDoc.exists()) {
          const subData = level2SubDoc.data();
          context.subscriptionTier = subData.tier as 'STARTER' | 'SILVER' | 'GOLD' | 'PLATINUM';
          console.log(`[AI Context] ✅ Level 2 subscription found: tier=${context.subscriptionTier}`);
          
          // Get benefits based on tier
          const { LEVEL2_TIER_BENEFITS } = await import('./level2SubscriptionService');
          const benefits = LEVEL2_TIER_BENEFITS[context.subscriptionTier];
          
          context.subscriptionLimits = {
            maxActiveMissions: benefits.maxActiveMissions,
            maxParticipantsPerMonth: benefits.maxParticipantsPerMonth,
            currentActiveMissions: subData.activeMissionsCount || 0,
            currentParticipantsThisMonth: subData.participantsThisMonth || 0,
            hasInAppFollowMissions: benefits.visitCheckInMissions, // In-app follow business feature
            hasInAppReviewMissions: true, // Available on all tiers
            hasPhotoMissions: benefits.visitCheckInMissions, // Photo/content missions
            hasVideoMissions: benefits.videoMissions,
            hasEvents: benefits.eventsAccess
          };
        } else {
          // No Level 2 subscription doc - default to STARTER tier
          console.warn('[AI Context] ⚠️ No level2Subscriptions doc found for Level 2+ business, defaulting to STARTER tier');
          const { LEVEL2_TIER_BENEFITS } = await import('./level2SubscriptionService');
          const benefits = LEVEL2_TIER_BENEFITS['STARTER'];
          context.subscriptionTier = 'STARTER';
          
          context.subscriptionLimits = {
            maxActiveMissions: benefits.maxActiveMissions,
            maxParticipantsPerMonth: benefits.maxParticipantsPerMonth,
            currentActiveMissions: 0,
            currentParticipantsThisMonth: 0,
            hasInAppFollowMissions: benefits.visitCheckInMissions,
            hasInAppReviewMissions: true,
            hasPhotoMissions: benefits.visitCheckInMissions,
            hasVideoMissions: benefits.videoMissions,
            hasEvents: benefits.eventsAccess
          };
        }
      } catch (error) {
        console.error('[AIContext] Error fetching subscription:', error);
      }
    } else {
      // Level 1 business
      try {
        const level1SubDoc = await getDoc(doc(db, 'level1Subscriptions', businessId));
        if (level1SubDoc.exists()) {
          const subData = level1SubDoc.data();
          context.subscriptionTier = subData.tier as 'STARTER' | 'SILVER' | 'GOLD';
          
          // Get Level 1 benefits
          const { LEVEL1_TIER_BENEFITS } = await import('./level1SubscriptionService');
          const benefits = LEVEL1_TIER_BENEFITS[context.subscriptionTier];
          
          // Set subscription limits for Level 1
          context.subscriptionLimits = {
            maxActiveMissions: 0, // Level 1 can't create missions until Level 2
            maxParticipantsPerMonth: 0,
            currentActiveMissions: 0,
            currentParticipantsThisMonth: 0,
            hasInAppFollowMissions: false,
            hasInAppReviewMissions: false,
            hasPhotoMissions: false,
            hasVideoMissions: false,
            hasEvents: benefits.eventsAccess
          };
        } else {
          // No subscription doc found - set default Level 1 STARTER tier
          context.subscriptionTier = 'STARTER';
          context.subscriptionLimits = {
            maxActiveMissions: 0,
            maxParticipantsPerMonth: 0,
            currentActiveMissions: 0,
            currentParticipantsThisMonth: 0,
            hasInAppFollowMissions: false,
            hasInAppReviewMissions: false,
            hasPhotoMissions: false,
            hasVideoMissions: false,
            hasEvents: false
          };
        }
      } catch (error) {
        console.error('[AIContext] Error fetching Level 1 subscription:', error);
      }
    }
    
    // Fetch missions
    const missionsRef = collection(db, 'missions');
    const missionsQuery = query(
      missionsRef,
      where('businessId', '==', businessId),
      limit(100)
    );
    const missionsSnapshot = await getDocs(missionsQuery);
    
    const activeMissions = missionsSnapshot.docs.filter(doc => 
      doc.data().status === 'active' || doc.data().status === 'ACTIVE'
    ).length;
    
    // Fetch participations (applications)
    const participationsRef = collection(db, 'participations');
    const participationsQuery = query(
      participationsRef,
      where('businessId', '==', businessId),
      limit(200)
    );
    const participationsSnapshot = await getDocs(participationsQuery);
    
    const pendingReviews = participationsSnapshot.docs.filter(doc => 
      doc.data().status === 'pending'
    ).length;
    
    const activeAmbassadors = new Set(
      participationsSnapshot.docs
        .filter(doc => doc.data().status === 'approved')
        .map(doc => doc.data().userId)
    ).size;
    
    context.stats = {
      ...context.stats,
      totalCampaigns: missionsSnapshot.size,
      activeMissions,
      pendingReviews,
      totalApplications: participationsSnapshot.size,
      activeAmbassadors
    };
    
  } catch (error) {
    console.error('[AIContext] Error fetching business context:', error);
  }
}

/**
 * Fetch creator-specific context
 */
async function fetchCreatorContext(creatorId: string, context: UserContextData) {
  try {
    // Fetch bookings
    const bookingsRef = collection(db, 'bookings');
    const bookingsQuery = query(
      bookingsRef,
      where('creatorId', '==', creatorId),
      limit(100)
    );
    const bookingsSnapshot = await getDocs(bookingsQuery);
    
    const activeProjects = bookingsSnapshot.docs.filter(doc => 
      doc.data().status === 'confirmed' || doc.data().status === 'in_progress'
    ).length;
    
    // Calculate earnings (mock - would need payment data)
    const totalEarnings = bookingsSnapshot.docs
      .filter(doc => doc.data().status === 'completed')
      .reduce((sum, doc) => sum + (doc.data().amount || 0), 0);
    
    context.stats = {
      ...context.stats,
      projectApplications: bookingsSnapshot.size,
      activeProjects,
      totalEarnings
    };
    
  } catch (error) {
    console.error('[AIContext] Error fetching creator context:', error);
  }
}

/**
 * Fetch user-specific context (customer)
 */
async function fetchCustomerContext(userId: string, context: UserContextData) {
  try {
    // Fetch user points and level
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();
    
    // Fetch participations
    const participationsRef = collection(db, 'participations');
    const participationsQuery = query(
      participationsRef,
      where('userId', '==', userId),
      limit(100)
    );
    const participationsSnapshot = await getDocs(participationsQuery);
    
    const missionsCompleted = participationsSnapshot.docs.filter(doc => 
      doc.data().status === 'completed' || doc.data().status === 'approved'
    ).length;
    
    // Fetch redemptions
    const redemptionsRef = collection(db, 'redemptions');
    const redemptionsQuery = query(
      redemptionsRef,
      where('userId', '==', userId),
      limit(100)
    );
    const redemptionsSnapshot = await getDocs(redemptionsQuery);
    
    context.stats = {
      ...context.stats,
      totalPoints: userData?.points || 0,
      level: userData?.level || 1,
      missionsCompleted,
      activeMissions: participationsSnapshot.docs.filter(doc => 
        doc.data().status === 'pending' || doc.data().status === 'submitted'
      ).length,
      redeemedRewards: redemptionsSnapshot.size
    };
    
  } catch (error) {
    console.error('[AIContext] Error fetching user context:', error);
  }
}

/**
 * Fetch recent activity
 */
async function fetchRecentActivity(userId: string, userRole: string, context: UserContextData) {
  try {
    const activities: Array<{ type: string; title: string; timestamp: Date }> = [];
    
    if (userRole === 'BUSINESS') {
      // Recent missions
      const missionsRef = collection(db, 'missions');
      const missionsQuery = query(
        missionsRef,
        where('businessId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const missionsSnapshot = await getDocs(missionsQuery);
      
      missionsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        // Safely convert timestamp - handle both Timestamp objects and regular dates
        const timestamp = data.createdAt?.toDate ? data.createdAt.toDate() : 
                         data.createdAt instanceof Date ? data.createdAt : 
                         new Date();
        activities.push({
          type: 'mission_created',
          title: data.title || 'New Mission',
          timestamp
        });
      });
    } else {
      // Recent participations
      const participationsRef = collection(db, 'participations');
      const participationsQuery = query(
        participationsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const participationsSnapshot = await getDocs(participationsQuery);
      
      participationsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        // Safely convert timestamp - handle both Timestamp objects and regular dates
        const timestamp = data.createdAt?.toDate ? data.createdAt.toDate() : 
                         data.createdAt instanceof Date ? data.createdAt : 
                         new Date();
        activities.push({
          type: 'mission_joined',
          title: data.missionTitle || 'Mission',
          timestamp
        });
      });
    }
    
    context.recentActivity = activities;
    
  } catch (error) {
    console.error('[AIContext] Error fetching recent activity:', error);
  }
}

/**
 * Detect if user is struggling with current screen
 */
export function detectStruggle(timeOnScreen: number, interactions: number): string | undefined {
  // User has been on screen for >30 seconds with <3 interactions
  if (timeOnScreen > 30000 && interactions < 3) {
    return 'stuck_on_page';
  }
  
  // User has clicked same button multiple times
  if (interactions > 10) {
    return 'repetitive_actions';
  }
  
  return undefined;
}

/**
 * Get contextual quick actions based on user state
 */
export function getContextualActions(context: UserContextData): Array<{
  label: string;
  action: string;
  icon: string;
}> {
  const actions: Array<{ label: string; action: string; icon: string }> = [];
  
  if (context.userRole === 'BUSINESS') {
    if (context.stats?.pendingReviews && context.stats.pendingReviews > 0) {
      actions.push({
        label: `Review ${context.stats.pendingReviews} pending submissions`,
        action: 'navigate:/missions/verify',
        icon: '⏱️'
      });
    }
    
    if (!context.stats?.activeMissions || context.stats.activeMissions === 0) {
      actions.push({
        label: 'Create your first mission',
        action: 'navigate:/missions/create',
        icon: '🎯'
      });
    }
    
    actions.push({
      label: 'View analytics',
      action: 'navigate:/analytics',
      icon: '📊'
    });
    
    // B2B Partnership actions
    actions.push({
      label: 'Explore B2B partnerships',
      action: 'navigate:/b2b/match',
      icon: '🤝'
    });
  } else if (context.userRole === 'CREATOR') {
    actions.push({
      label: 'Browse opportunities',
      action: 'navigate:/opportunities',
      icon: '💼'
    });
    
    actions.push({
      label: 'Update portfolio',
      action: 'navigate:/portfolio',
      icon: '🎨'
    });
  } else {
    actions.push({
      label: 'Find missions nearby',
      action: 'navigate:/explore',
      icon: '🗺️'
    });
    
    actions.push({
      label: 'Redeem rewards',
      action: 'navigate:/rewards',
      icon: '🎁'
    });
  }
  
  return actions;
}

/**
 * Get comprehensive platform feature guide for AI Assistant
 * This helps the AI understand all available features and how to guide users
 */
export function getPlatformFeatureGuide(userRole: 'USER' | 'BUSINESS' | 'CREATOR'): string {
  if (userRole === 'BUSINESS') {
    return `
**BEEVVY PLATFORM FEATURES FOR BUSINESSES**

**PARTNERS TAB (B2B Features):**
The Partners tab is your hub for business-to-business collaboration with 5 powerful sub-sections:

1. **My Squad** - Your Monthly Business Network
   - Automatically matched with 2-4 local businesses in your city each month
   - Meet twice monthly: 1 fun social meetup + 1 deep business discussion
   - Group chat for ongoing support and collaboration
   - AI-powered activity suggestions for squad meetups
   - Share experiences, solve challenges together, build genuine relationships

2. **Match** - Find Strategic B2B Partners
   - Discover businesses that complement yours (not competitors)
   - AI-powered matching based on location, industry, and goals
   - Connect with businesses for cross-promotions and referrals
   - Platinum tier users can change location to find partners in other cities
   - Build strategic partnerships that help both businesses grow

3. **Projects** - Collaborative Cost-Sharing Campaigns
   - Create or join multi-business marketing projects
   - Split costs on expensive campaigns (photoshoots, videos, events)
   - Define business partner roles (venue, product supplier, etc.)
   - Define creator roles (photographer, videographer, designer, etc.)
   - Track applications and manage project collaborations
   - Example: 4 businesses split a €4,000 video campaign = €1,000 each
   - View projects: "Your Projects", "Interesting" (matches your business type), "All"

4. **Market** - Hire Individual Creators & Freelancers
   - Browse and hire creators for one-off services
   - Find photographers, videographers, designers, models, stylists
   - View creator portfolios, past work, and rates
   - Direct messaging to discuss project details
   - Book creators for services like photoshoots, content creation, branding

5. **Events** - Premium Networking & Learning
   - Level 2+ businesses can create and join premium events
   - Host workshops, networking sessions, or exclusive gatherings
   - Monetize your expertise or learn from other businesses
   - Build your reputation as an industry expert

**ENGAGE TAB (Customer Engagement):**
- **Missions**: Create campaigns for customers (Instagram follow, review, visit, share story)
- **Rewards**: Create point-based rewards customers can redeem

**OTHER KEY FEATURES:**
- **Home Dashboard**: Overview of stats, pending reviews, quick actions, active ambassadors
- **Feed**: Social content from customers who love your brand
- **Analytics**: Track campaign performance and customer engagement
- **Profile**: Showcase your business, update info, manage subscription

**SUBSCRIPTION TIERS:**
- Level 1 (Aspiring): Basic features, Home + Partners tabs only
- Level 2+ (Established): Full access including Feed, Engage tabs, Premium Events
- Subscription levels: FREE, STARTER, PRO, PLATINUM

The AI Assistant can help with:
- Creating effective missions and rewards
- Finding the right B2B partners for your business type
- Suggesting collaboration projects ideas
- Navigating the platform features
- Optimizing your business strategy
`;
  } else if (userRole === 'CREATOR') {
    return `
**BEEVVY PLATFORM FEATURES FOR CREATORS**

**OPPORTUNITIES:**
- Browse business mission campaigns (Instagram, content creation, events)
- Apply for paid projects from businesses
- View requirements, compensation, and deadlines

**PROJECTS:**
- Join collaborative business projects as a hired professional
- Offer your creative services (photography, video, design, etc.)
- Set your rates and showcase your expertise

**PORTFOLIO:**
- Showcase your past work and skills
- Upload photos, videos, case studies
- Highlight your specialties and experience
- Improve visibility to businesses looking for creators

**NETWORK:**
- Connect with businesses and other creators
- Build relationships in your city
- Receive project invitations from businesses

**PROFILE:**
- Set your creator type, skills, rates
- Manage bookings and availability
- Track earnings and completed projects
`;
  } else {
    return `
**BEEVVY PLATFORM FEATURES FOR CUSTOMERS**

**HOME:**
- See your stats, level, points, and current streak
- Discover nearby businesses with location-based suggestions
- View active missions and quick access to rewards
- AI-powered recommendations for places to try
- Active mission widget showing your progress

**FEED:**
- Share your experiences at local businesses
- See what friends and community members are discovering
- Engage with posts, like, comment, and connect

**DISCOVER:**
- Explore businesses near you by category
- Filter by type: restaurants, cafes, shops, services, wellness
- View business profiles, missions, and rewards
- Check-in to businesses and earn points

**EARN TAB:**
- **Missions**: Complete brand campaigns (Instagram follow, review, visit, share story)
- **Rewards**: Redeem your points for exclusive perks and discounts

**EVENTS:**
- **Squads**: Auto-matched with local friends based on your interests
- **Collaborate**: Find friends to do missions together
- **Events**: Discover and join community meetups and experiences
- Digital passport tracking event attendance

**KEY FEATURES:**
- Points & Levels: Earn points, level up, unlock achievements
- Daily Streaks: Login daily to maintain your streak and earn bonuses
- Missions: Complete tasks for businesses and earn rewards
- Leaderboards: Compete with friends and community
- My Squad: Meet new friends in your city with similar interests
`;
  }
}

/**
 * Generate smart upgrade recommendations based on user's subscription and usage
 */
export function getUpgradeRecommendations(context: UserContextData): string | null {
  if (context.userRole !== 'BUSINESS' || !context.businessLevel || !context.subscriptionTier) {
    return null;
  }

  const level = context.businessLevel;
  const tier = context.subscriptionTier;
  const limits = context.subscriptionLimits;
  
  // Level 1 businesses - encourage upgrade to Level 2
  if (level === 1) {
    return `
📈 **UPGRADE TO LEVEL 2**

You're currently Level 1 (Aspiring Business) with ${tier} tier.

**What you're missing:**
- ❌ Cannot create missions to engage customers
- ❌ No customer engagement campaigns
- ❌ Limited analytics and insights

**To unlock mission creation:**
1. Complete your business verification
2. Demonstrate you're an established business
3. Get admin approval to Level 2

Once at Level 2, you can:
✅ Create missions (check-ins, Instagram, reviews)
✅ Engage customers with rewards
✅ Track ROI with analytics
✅ Build your customer base

Would you like help preparing your Level 2 application?
`;
  }

  // Level 2+ businesses - tier-specific recommendations
  if (level >= 2 && limits) {
    const recommendations: string[] = [];
    
    // Check if hitting mission limits
    if (limits.currentActiveMissions >= limits.maxActiveMissions && limits.maxActiveMissions > 0) {
      recommendations.push(`⚠️ You've hit your mission limit (${limits.maxActiveMissions} active missions)`);
    }
    
    // Check if hitting participant limits
    const participantUsage = limits.maxParticipantsPerMonth > 0 
      ? (limits.currentParticipantsThisMonth / limits.maxParticipantsPerMonth) * 100 
      : 0;
    if (participantUsage > 80) {
      recommendations.push(`⚠️ You've used ${Math.round(participantUsage)}% of your monthly participants (${limits.currentParticipantsThisMonth}/${limits.maxParticipantsPerMonth})`);
    }
    
    // Tier-specific recommendations
    if (tier === 'STARTER') {
      return `
💡 **UPGRADE RECOMMENDED: STARTER → SILVER (€29/month)**

**You're missing out on:**
- ❌ Multiple active missions (only 1 at a time)
- ❌ Limited to 20 participants/month
- ❌ Only basic mission types

**Silver tier gives you:**
✅ 3 active missions simultaneously
✅ Enhanced mission types & features
✅ 40 participants/month (2x more)
✅ Events access (pay-per-event)
✅ Better engagement & reach

**ROI Example:**
- Cost: €29/month
- Just 3 new customers = breakeven
- Average Silver user sees 5-10 new customers/month

Ready to upgrade and grow faster?
`;
    }
    
    if (tier === 'SILVER') {
      return `
💡 **UPGRADE TO GOLD (€59/month) FOR MAXIMUM ROI**

**What you're missing:**
- ❌ Advanced review campaigns with photos
- ❌ Referral missions (viral growth)
- ❌ Enhanced analytics (track what works)
- ❌ Limited to 40 participants/month

**Gold tier unlocks:**
✅ 6 active missions (2x more campaigns)
✅ Advanced review missions with photo verification
✅ Referral tracking (3/month for viral growth)
✅ 120 participants/month (3x capacity)
✅ Enhanced analytics dashboard
✅ 1 free event per quarter

**ROI Calculation:**
- Cost: €59/month
- Photo reviews alone bring 2-5 new customers/month
- Referrals create viral growth
- Typical Gold user sees 15-30 new customers/month
- ROI: 5-10x your investment

${recommendations.length > 0 ? '\n**Current Usage:**\n' + recommendations.join('\n') : ''}

Want to unlock your full potential?
`;
    }
    
    if (tier === 'GOLD') {
      return `
🚀 **UPGRADE TO PLATINUM (€99/month) - DOMINATE YOUR MARKET**

**Premium features you're missing:**
- ❌ Video missions (highest engagement rate)
- ❌ Unlimited missions (you're capped at 6)
- ❌ Priority feed placement (be seen first)
- ❌ 300 participants/month (you have 120)
- ❌ 1 free event per month (12/year)
- ❌ Priority support

**Platinum is for market leaders:**
✅ Unlimited missions (fair use policy)
✅ Video content campaigns (2x engagement)
✅ 300 participants/month (2.5x more)
✅ Priority city feed placement
✅ 12 free events/year + premium quarterly event
✅ Advanced review and referral features
✅ Dedicated priority support

**Market Dominance:**
- Typical Platinum users get 50-100+ new customers/month
- Premium placement = 3x more visibility
- Video missions = 2x engagement vs photos
- ROI: 10-20x your investment

${recommendations.length > 0 ? '\n**Current Usage:**\n' + recommendations.join('\n') : ''}

Ready to dominate your local market?
`;
    }
  }
  
  return null;
}

