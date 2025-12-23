/**
 * Fluzio Backend - Cloud Functions
 * Implements:
 * 1. User Creation Triggers (Referrals, Admin Alerts)
 * 2. B2B Squad Generation (Scheduled)
 * 3. AI Mission Verification (Gemini)
 */

const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onRequest } = require("firebase-functions/v2/https");
const functions = require("firebase-functions"); // For config access
const admin = require("firebase-admin");
const OpenAI = require("openai");
const crypto = require("crypto");

admin.initializeApp();
const db = admin.firestore();

// Initialize OpenAI (lazy initialization to avoid errors during deployment)
let openai = null;
const getOpenAI = () => {
  if (!openai) {
    const apiKey = (process.env.OPENAI_API_KEY || '').trim();
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not set or empty');
    }
    openai = new OpenAI({
      apiKey: apiKey
    });
  }
  return openai;
};

// --- A. Authentication & User Management ---

/**
 * HTTP Endpoint: Create User
 * Handles user creation from the frontend
 */
exports.createuser = onRequest({ 
  cors: true,
  invoker: "public"
}, async (req, res) => {
  // Set CORS headers for all responses
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  console.log("=== Create User Request ===");
  console.log("Method:", req.method);
  console.log("Content-Type:", req.headers["content-type"]);
  console.log("Raw Body:", JSON.stringify(req.body));

  // CORS preflight
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    let data = req.body;
    if (typeof data === "string") {
      console.log("Body is string, parsing…");
      data = JSON.parse(data);
    }

    console.log("Parsed Data:", JSON.stringify(data));

    const { uid, email, role } = data;

    if (!uid || !email || !role) {
      console.error("Missing fields:", { uid: !!uid, email: !!email, role: !!role });
      res.status(400).json({
        success: false,
        error: "Missing required fields (uid, email, role)",
        received: { uid: !!uid, email: !!email, role: !!role },
      });
      return;
    }

    // 👇 **THIS IS THE IMPORTANT LINE**
    const userRef = db.collection("users").doc(uid);  // <--- must be "users", NOT "businesses"

    await userRef.set(
      {
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    console.log("User created successfully:", uid);
    res.status(200).json({
      success: true,
      message: "User created successfully",
      userId: uid,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
});



/**
 * HTTP Endpoint: Get User
 */
exports.getuser = onRequest({ 
  cors: true,
  invoker: "public"
}, async (req, res) => {
  // Set CORS headers for all responses
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    const userId = req.query.userId;
    
    if (!userId) {
      res.status(400).json({ success: false, error: "Missing userId parameter" });
      return;
    }

    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }

    res.status(200).json({ 
      success: true, 
      user: { id: userDoc.id, ...userDoc.data() }
    });

  } catch (error) {
    console.error("Error getting user:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * HTTP Endpoint: Update User
 */
exports.updateuser = onRequest({ 
  cors: true,
  invoker: "public"
}, async (req, res) => {
  // Set CORS headers for all responses
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    let data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    console.log('Update user raw payload:', data);

    const { userId, updates } = data;

    if (!userId || !updates || Object.keys(updates).length === 0) {
      console.error('Missing userId or updates', { userId, updates });
      res.status(400).json({ success: false, error: "Missing userId or updates" });
      return;
    }

    const userRef = db.collection('users').doc(userId);
    const snap = await userRef.get();

    if (!snap.exists) {
      console.error('User not found for update:', userId);
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }

    // Handle socialAccounts merging
    const safeUpdates = { ...updates };
    
    if (updates.socialAccounts) {
      const currentData = snap.data();
      const currentSocialAccounts = currentData.socialAccounts || {};
      
      // Merge socialAccounts platform by platform
      safeUpdates.socialAccounts = {
        ...currentSocialAccounts,
        ...updates.socialAccounts
      };
      
      console.log('Merging socialAccounts:', {
        current: currentSocialAccounts,
        incoming: updates.socialAccounts,
        merged: safeUpdates.socialAccounts
      });
    }
    
    safeUpdates.updatedAt = new Date().toISOString();

    await userRef.update(safeUpdates);

    res.status(200).json({ success: true, message: "User updated successfully" });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * HTTP Endpoint: Instagram OAuth Callback
 * Handles OAuth token exchange and saves to user profile
 */
exports.instagramcallback = onRequest({ 
  cors: true,
  invoker: "public"
}, async (req, res) => {
  // Set CORS headers
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // CORS preflight
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  console.log("=== Instagram OAuth Callback ===");
  console.log("Request body:", JSON.stringify(req.body));

  try {
    const { code, userId } = req.body;

    console.log("Code received:", code ? "YES" : "NO");
    console.log("UserId received:", userId ? userId : "NO");

    if (!code || !userId) {
      console.error("Missing parameters - code:", !!code, "userId:", !!userId);
      res.status(400).json({ 
        success: false, 
        error: "Missing code or userId" 
      });
      return;
    }

    // Instagram credentials from environment variables
    // These are set in the Cloud Function's environment configuration
    const appId = process.env.INSTAGRAM_APP_ID || "1247527037206389";
    const appSecret = process.env.INSTAGRAM_APP_SECRET || "35cc6f7a784152db8be727dd8b2e6f37";
    const redirectUri = "https://fluzio-13af2.web.app/instagram/callback";
    
    if (!appSecret) {
      console.error("Instagram app secret not configured!");
      res.status(500).json({
        success: false,
        error: "Instagram OAuth not properly configured. Please set instagram.app_secret in Firebase Functions config."
      });
      return;
    }

    console.log("Exchanging code for access token via Facebook Graph API...");
    console.log("Using appId:", appId);
    console.log("Using redirectUri:", redirectUri);

    // Exchange code for access token using Facebook Graph API
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&redirect_uri=${redirectUri}&code=${code}`
    );

    const tokenData = await tokenResponse.json();
    console.log("Token exchange response:", JSON.stringify(tokenData));

    if (!tokenData.access_token) {
      console.error("Token exchange failed:", tokenData);
      res.status(400).json({ 
        success: false, 
        error: "Failed to exchange code for token",
        details: tokenData.error_message || "Unknown error"
      });
      return;
    }

    console.log("Access token received, fetching Facebook pages...");

    // Step 1: Get user's Facebook pages
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${tokenData.access_token}`
    );

    const pagesData = await pagesResponse.json();

    if (!pagesData.data || pagesData.data.length === 0) {
      console.error("No Facebook pages found");
      res.status(400).json({ 
        success: false, 
        error: "No Facebook pages found. Please create a Facebook page and link it to your Instagram Business account.",
        details: "Instagram Graph API requires a Facebook Page connection"
      });
      return;
    }

    console.log(`Found ${pagesData.data.length} Facebook page(s)`);

    // Step 2: Find Instagram Business Account from pages
    let instagramAccount = null;
    for (const page of pagesData.data) {
      const igResponse = await fetch(
        `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
      );
      const igData = await igResponse.json();
      
      if (igData.instagram_business_account) {
        // Step 3: Get Instagram profile details
        const profileResponse = await fetch(
          `https://graph.facebook.com/v18.0/${igData.instagram_business_account.id}?fields=id,username,name,profile_picture_url,followers_count,follows_count,media_count&access_token=${page.access_token}`
        );
        const profileData = await profileResponse.json();
        
        if (profileData.id) {
          instagramAccount = {
            ...profileData,
            pageAccessToken: page.access_token,
            pageName: page.name,
            pageId: page.id
          };
          break;
        }
      }
    }

    if (!instagramAccount) {
      console.error("No Instagram Business account linked to Facebook pages");
      res.status(400).json({ 
        success: false, 
        error: "No Instagram Business account found",
        details: "Please ensure your Instagram account is a Business/Creator account and linked to a Facebook Page"
      });
      return;
    }

    console.log("Instagram Business account found:", instagramAccount.username);

    console.log("Instagram Business account found:", instagramAccount.username);

    // Save to user's Firestore document
    const userRef = db.collection("users").doc(userId);
    await userRef.update({
      "socialAccounts.instagram": {
        connected: true,
        username: instagramAccount.username,
        userId: instagramAccount.id,
        name: instagramAccount.name,
        profilePictureUrl: instagramAccount.profile_picture_url,
        followersCount: instagramAccount.followers_count,
        followsCount: instagramAccount.follows_count,
        mediaCount: instagramAccount.media_count,
        accessToken: instagramAccount.pageAccessToken,
        pageId: instagramAccount.pageId,
        pageName: instagramAccount.pageName,
        connectedAt: new Date().toISOString()
      },
      updatedAt: new Date().toISOString()
    });

    console.log("Instagram account linked successfully for user:", userId);

    res.status(200).json({
      success: true,
      message: "Instagram account linked successfully",
      instagram: {
        username: instagramAccount.username,
        name: instagramAccount.name,
        followersCount: instagramAccount.followers_count,
        mediaCount: instagramAccount.media_count
      }
    });

  } catch (error) {
    console.error("Instagram OAuth error:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message || "Internal server error" 
    });
  }
});



/**
 * Trigger: Runs when a new user is created in Firestore.
 * Logic: Handles referrals and notifies admin of new businesses.
 */
exports.onUserCreate = onDocumentCreated("users/{userId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const newUser = snapshot.data();
  const userId = event.params.userId;

  const batch = db.batch();

  // 1. Handle Referral Code
  if (newUser.referralCode) {
    const referrerQuery = await db.collection("users")
      .where("ownReferralCode", "==", newUser.referralCode)
      .limit(1)
      .get();

    if (!referrerQuery.empty) {
      const referrerDoc = referrerQuery.docs[0];
      const referrerRef = referrerDoc.ref;
      
      // Credit Referrer (+50 Points)
      batch.update(referrerRef, {
        points: admin.firestore.FieldValue.increment(50),
        "creatorWallet.networkStats.recruitedCount": admin.firestore.FieldValue.increment(1)
      });

      // Create Notification for Referrer
      const notifRef = db.collection("notifications").doc();
      batch.set(notifRef, {
        userId: referrerDoc.id,
        type: "SYSTEM",
        title: "New Recruit!",
        message: `${newUser.name} just joined using your code. +50 Points!`,
        isRead: false,
        timestamp: new Date().toISOString()
      });
    }
  }

  // 2. Notify Admin if Business
  if (newUser.role === "BUSINESS") {
    // In a real app, send email via SendGrid or similar
    console.log(`[ADMIN ALERT] New Business Applied: ${newUser.name} (${newUser.email})`);
    
    // Set verification status and initial level based on 'isAspiring'
    // Level 1 = Aspiring businesses (idea stage)
    // Level 2+ = Actual businesses with operations
    const status = newUser.isAspiringBusiness ? "APPROVED" : "PENDING";
    const initialLevel = newUser.isAspiringBusiness ? 1 : 2;
    batch.update(snapshot.ref, { verificationStatus: status });
    
    // Initialize complete subscription system
    const now = admin.firestore.FieldValue.serverTimestamp();
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    batch.update(snapshot.ref, {
      // Legacy level fields (keep for compatibility)
      businessLevel: initialLevel,
      businessSubLevel: 1,
      businessXp: 0,
      upgradeRequested: false,
      upgradeRequestedAt: null,
      upgradeApprovedAt: null,
      
      // NEW: Subscription fields
      'subscription.tier': 'BASIC',
      'subscription.billingCycle': 'MONTHLY',
      'subscription.status': 'ACTIVE',
      'subscription.monthlyPrice': 0,
      'subscription.annualPrice': 0,
      'subscription.nextBillingDate': nextMonth,
      'subscription.subscriptionStartDate': now,
      'subscription.isTrialing': false,
      'subscription.cancelAtPeriodEnd': false,
      
      // NEW: Growth Credits (Level 1 Basic = 0 credits)
      'growthCredits.available': 0,
      'growthCredits.used': 0,
      'growthCredits.totalEarned': 0,
      'growthCredits.totalPurchased': 0,
      'growthCredits.monthlyAllocation': 0,
      'growthCredits.lastAllocationDate': now,
      'growthCredits.nextAllocationDate': nextMonth,
      'growthCredits.annualBonusActive': false,
      'growthCredits.annualBonusPercentage': 0,
      'growthCredits.recentPurchases': [],
      'growthCredits.usageThisMonth': 0,
      'growthCredits.usageLastMonth': 0,
      
      // NEW: Mission Usage
      'missionUsage.missionsCreatedThisMonth': 0,
      'missionUsage.missionsCreatedLastMonth': 0,
      'missionUsage.maxMissionsPerMonth': newUser.isAspiringBusiness ? 0 : 1, // L1 aspiring: 0, L2 actual: 1 mission/month
      'missionUsage.activeMissions': 0,
      'missionUsage.totalParticipantsThisMonth': 0,
      'missionUsage.maxParticipantsPerMission': newUser.isAspiringBusiness ? 0 : 5,
      'missionUsage.boostsAvailableThisMonth': 0,
      'missionUsage.boostsUsedThisMonth': 0,
      'missionUsage.boostResetDate': nextMonth,
      'missionUsage.geographicReach': 'SAME_CITY',
      'missionUsage.priorityMatching': false,
      'missionUsage.premiumTemplates': false,
      'missionUsage.collabMissions': false,
      'missionUsage.influencerMissions': false,
      'missionUsage.automatedCampaigns': false,
      
      // NEW: Meetup Usage
      'meetupUsage.meetupsHostedThisMonth': 0,
      'meetupUsage.maxHostPerMonth': newUser.isAspiringBusiness ? 0 : 1, // L1 aspiring: can't host, L2 actual: 1/month
      'meetupUsage.meetupsJoinedThisMonth': 0,
      'meetupUsage.maxJoinPerMonth': 2, // Level 1 aspiring can join 2 meetups/month
      'meetupUsage.featuredInCity': false,
      'meetupUsage.vipAccess': false,
      'meetupUsage.globalMatching': false,
      
      // NEW: Perks
      'perks.analyticsLevel': 'NONE',
      'perks.freeEventsRemainingThisMonth': 0,
      'perks.freeEventsPerMonth': 0,
      'perks.workshopsRemainingThisYear': 0,
      'perks.workshopsPerYear': 0,
      'perks.cityPromotionAvailable': false,
      'perks.cityPromotionsUsed': 0,
      'perks.speakerOpportunities': false,
      'perks.retreatAccess': false,
      'perks.vipConcierge': false,
      'perks.verifiedBadge': false,
      'perks.discountOnEvents': 0,
      'perks.discountOnGrowthCredits': 0,
      
      // NEW: Level Progression
      'levelProgression.currentLevel': initialLevel,
      'levelProgression.totalMissionsCreated': 0,
      'levelProgression.totalMeetupsAttended': 0,
      'levelProgression.totalSquadsJoined': 0,
      'levelProgression.totalGrowthCreditsUsed': 0,
      'levelProgression.averageRating': 0,
      'levelProgression.totalReviews': 0,
      'levelProgression.violations': 0,
      'levelProgression.businessVerified': false,
      'levelProgression.levelUpHistory': []
    });
    console.log(`[Subscription] Initialized complete subscription system for: ${newUser.name}`);
  }

  await batch.commit();
});

// ==================== BUSINESS LEVEL SYSTEM ====================

/**
 * Sub-level XP thresholds (cumulative XP needed to reach each sub-level)
 */
const SUB_LEVEL_THRESHOLDS = [0, 20, 50, 90, 140, 200, 270, 350, 440];

/**
 * XP Rewards for various activities
 */
const XP_REWARDS = {
  MISSION_CREATED_FIRST: 50,
  MISSION_CREATED: 30,
  MISSION_COMPLETED: 30,
  GOOGLE_REVIEW_MISSION: 20,
  MEETUP_HOSTED: 40,
  MEETUP_HOSTED_3_PLUS: 70,
  EVENT_HOSTED: 40,
  EVENT_HOSTED_5_PLUS: 100
};

/**
 * Calculate sub-level from XP
 */
function getSubLevelFromXp(xp) {
  for (let i = SUB_LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= SUB_LEVEL_THRESHOLDS[i]) {
      return i + 1;
    }
  }
  return 1;
}

/**
 * Award XP to a business and update sub-level
 * @param {string} businessId - Business user ID
 * @param {number} deltaXp - Amount of XP to add
 * @param {string} reason - Reason for XP award
 */
async function awardBusinessXp(businessId, deltaXp, reason = 'N/A') {
  try {
    const userRef = db.collection("users").doc(businessId);
    const userSnap = await userRef.get();
    
    if (!userSnap.exists) {
      console.error(`[BusinessLevel] User not found: ${businessId}`);
      return;
    }
    
    const data = userSnap.data();
    
    // Skip if not a business
    if (data.role !== 'BUSINESS') {
      return;
    }
    
    const currentXp = data.businessXp || 0;
    const currentSubLevel = data.businessSubLevel || 1;
    const currentMainLevel = data.businessLevel || 1;
    
    const newXp = currentXp + deltaXp;
    const newSubLevel = getSubLevelFromXp(newXp);
    
    const updates = {
      businessXp: admin.firestore.FieldValue.increment(deltaXp)
    };
    
    // Update sub-level if changed
    if (newSubLevel !== currentSubLevel) {
      updates.businessSubLevel = newSubLevel;
      console.log(`[BusinessLevel] 🎉 Level up! ${businessId} reached ${currentMainLevel}.${newSubLevel}`);
      
      // If reached level .9, notify they can request upgrade
      if (newSubLevel === 9) {
        console.log(`[BusinessLevel] 🔔 ${businessId} can now request upgrade to level ${currentMainLevel + 1}`);
        // TODO: Send notification to business
      }
    }
    
    await userRef.update(updates);
    
    console.log(`[BusinessLevel] +${deltaXp} XP awarded to ${businessId}. Reason: ${reason}. Total: ${newXp} XP (Level ${currentMainLevel}.${newSubLevel})`);
  } catch (error) {
    console.error('[BusinessLevel] Error awarding XP:', error);
  }
}

/**
 * Trigger: Award XP when missions are created
 */
exports.onMissionCreate = onDocumentCreated("missions/{missionId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;
  
  const mission = snapshot.data();
  const businessId = mission.businessId;
  
  if (!businessId) {
    console.warn('[BusinessLevel] Mission has no businessId, skipping XP award');
    return;
  }
  
  try {
    // Check if this is the business's first mission
    const missionsQuery = await db.collection("missions")
      .where("businessId", "==", businessId)
      .limit(2)
      .get();
    
    const isFirstMission = missionsQuery.size === 1;
    const xpAmount = isFirstMission ? XP_REWARDS.MISSION_CREATED_FIRST : XP_REWARDS.MISSION_CREATED;
    
    await awardBusinessXp(
      businessId,
      xpAmount,
      isFirstMission ? 'First mission created' : 'Mission created'
    );
    
    // Award Reward Points
    const pointsAmount = isFirstMission ? REWARD_POINTS.MISSION_FIRST_TIME : REWARD_POINTS.MISSION_CREATED;
    await awardRewardPoints(
      businessId,
      pointsAmount,
      isFirstMission ? 'First mission created 🎉' : 'Mission created',
      event.params.missionId
    );
  } catch (error) {
    console.error('[BusinessLevel] Error in onMissionCreate trigger:', error);
  }
});

/**
 * Trigger: Award XP when mission participation is approved (mission completed)
 */
exports.onParticipationUpdate = onDocumentUpdated("participations/{participationId}", async (event) => {
  const beforeData = event.data.before.data();
  const afterData = event.data.after.data();
  
  // Check if status changed to APPROVED
  const wasApproved = beforeData.status !== 'APPROVED' && afterData.status === 'APPROVED';
  
  if (!wasApproved) {
    return; // Not an approval, skip
  }
  
  const missionId = afterData.missionId;
  
  if (!missionId) {
    console.warn('[BusinessLevel] Participation has no missionId, skipping XP award');
    return;
  }
  
  try {
    // Get mission to find business owner
    const missionRef = db.collection("missions").doc(missionId);
    const missionSnap = await missionRef.get();
    
    if (!missionSnap.exists) {
      console.warn(`[BusinessLevel] Mission ${missionId} not found`);
      return;
    }
    
    const mission = missionSnap.data();
    const businessId = mission.businessId;
    
    if (!businessId) {
      console.warn('[BusinessLevel] Mission has no businessId');
      return;
    }
    
    // Check if this is a Google Review mission for bonus XP
    const isGoogleReview = mission.title?.toLowerCase().includes('google') && 
                          mission.title?.toLowerCase().includes('review');
    
    const xpAmount = isGoogleReview ? XP_REWARDS.GOOGLE_REVIEW_MISSION : XP_REWARDS.MISSION_COMPLETED;
    
    await awardBusinessXp(
      businessId,
      xpAmount,
      isGoogleReview ? 'Google Review mission completed' : 'Mission completed by customer'
    );
    
    // Award Reward Points to business owner
    await awardRewardPoints(
      businessId,
      REWARD_POINTS.MISSION_COMPLETED,
      'Mission completed by customer',
      missionId
    );
    
    // Award Reward Points to participant (customer)
    const participantId = afterData.userId;
    if (participantId) {
      await awardRewardPoints(
        participantId,
        REWARD_POINTS.MISSION_PARTICIPATED,
        `Completed mission: ${mission.title}`,
        missionId
      );
    }
  } catch (error) {
    console.error('[BusinessLevel] Error in onParticipationUpdate trigger:', error);
  }
});

/**
 * Trigger: Award XP when meetups/events are created
 * Award bonus XP when attendees join (3+ attendees = bonus)
 */
exports.onMeetupCreate = onDocumentCreated("meetups/{meetupId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;
  
  const meetup = snapshot.data();
  const hostId = meetup.hostId || meetup.createdBy;
  
  if (!hostId) {
    console.warn('[BusinessLevel] Meetup has no host, skipping XP award');
    return;
  }
  
  try {
    // Check if this is host's first meetup
    const meetupsQuery = await db.collection("meetups")
      .where("hostId", "==", hostId)
      .limit(2)
      .get();
    
    const isFirstMeetup = meetupsQuery.size === 1;
    
    // Award base XP for hosting meetup
    await awardBusinessXp(
      hostId,
      XP_REWARDS.MEETUP_HOSTED,
      'Hosted meetup/event'
    );
    
    // Award Reward Points
    const pointsAmount = isFirstMeetup ? REWARD_POINTS.MEETUP_FIRST_TIME : REWARD_POINTS.MEETUP_HOSTED;
    await awardRewardPoints(
      hostId,
      pointsAmount,
      isFirstMeetup ? 'First meetup hosted 🎉' : 'Hosted meetup/event',
      event.params.meetupId
    );
  } catch (error) {
    console.error('[BusinessLevel] Error in onMeetupCreate trigger:', error);
  }
});

/**
 * Trigger: Award bonus XP when meetup attendance grows
 */
exports.onMeetupUpdate = onDocumentUpdated("meetups/{meetupId}", async (event) => {
  const beforeData = event.data.before.data();
  const afterData = event.data.after.data();
  
  const beforeAttendees = beforeData.attendees?.length || 0;
  const afterAttendees = afterData.attendees?.length || 0;
  
  // Check if attendees increased and crossed threshold
  const crossed3Plus = beforeAttendees < 3 && afterAttendees >= 3;
  const crossed5Plus = beforeAttendees < 5 && afterAttendees >= 5;
  
  if (!crossed3Plus && !crossed5Plus) {
    return; // No threshold crossed
  }
  
  const hostId = afterData.hostId || afterData.createdBy;
  
  if (!hostId) {
    console.warn('[BusinessLevel] Meetup has no host, skipping bonus XP');
    return;
  }
  
  try {
    if (crossed5Plus) {
      // Award event bonus (5+ attendees)
      const bonus = XP_REWARDS.EVENT_HOSTED_5_PLUS - XP_REWARDS.MEETUP_HOSTED;
      await awardBusinessXp(
        hostId,
        bonus,
        'Meetup reached 5+ attendees (bonus)'
      );
    } else if (crossed3Plus) {
      // Award meetup bonus (3+ attendees)
      const bonus = XP_REWARDS.MEETUP_HOSTED_3_PLUS - XP_REWARDS.MEETUP_HOSTED;
      await awardBusinessXp(
        hostId,
        bonus,
        'Meetup reached 3+ attendees (bonus)'
      );
    }
  } catch (error) {
    console.error('[BusinessLevel] Error in onMeetupUpdate trigger:', error);
  }
});

/**
 * HTTP Endpoint: Request Business Level Upgrade
 */
exports.requestBusinessLevelUpgrade = onRequest({
  cors: true,
  invoker: "public"
}, async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }
  
  try {
    const { businessId } = req.body;
    
    if (!businessId) {
      res.status(400).json({ success: false, error: 'businessId required' });
      return;
    }
    
    const userRef = db.collection("users").doc(businessId);
    const userSnap = await userRef.get();
    
    if (!userSnap.exists) {
      res.status(404).json({ success: false, error: 'Business not found' });
      return;
    }
    
    const data = userSnap.data();
    const subLevel = data.businessSubLevel || 1;
    const mainLevel = data.businessLevel || 1;
    const upgradeRequested = data.upgradeRequested || false;
    
    if (mainLevel >= 6) {
      res.status(400).json({ success: false, error: 'Already at maximum level (Elite)' });
      return;
    }
    
    if (subLevel < 9) {
      res.status(400).json({ success: false, error: `Must reach sub-level 9 (currently at ${mainLevel}.${subLevel})` });
      return;
    }
    
    if (upgradeRequested) {
      res.status(400).json({ success: false, error: 'Upgrade request already pending' });
      return;
    }
    
    await userRef.update({
      upgradeRequested: true,
      upgradeRequestedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`[BusinessLevel] 📨 Upgrade request from ${businessId} (${mainLevel}.${subLevel} → ${mainLevel + 1}.1)`);
    
    res.status(200).json({ success: true, message: 'Upgrade request submitted' });
  } catch (error) {
    console.error('[BusinessLevel] Error in requestBusinessLevelUpgrade:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * HTTP Endpoint: Approve Business Level Upgrade (Admin only)
 */
exports.approveBusinessLevelUpgrade = onRequest({
  cors: true,
  invoker: "public"
}, async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }
  
  try {
    const { businessId, adminId } = req.body;
    
    if (!businessId || !adminId) {
      res.status(400).json({ success: false, error: 'businessId and adminId required' });
      return;
    }
    
    // TODO: Verify adminId has admin role
    
    const userRef = db.collection("users").doc(businessId);
    const userSnap = await userRef.get();
    
    if (!userSnap.exists) {
      res.status(404).json({ success: false, error: 'Business not found' });
      return;
    }
    
    const data = userSnap.data();
    const currentMainLevel = data.businessLevel || 1;
    const upgradeRequested = data.upgradeRequested || false;
    
    if (!upgradeRequested) {
      res.status(400).json({ success: false, error: 'No upgrade request pending' });
      return;
    }
    
    if (currentMainLevel >= 6) {
      res.status(400).json({ success: false, error: 'Already at maximum level' });
      return;
    }
    
    const newMainLevel = currentMainLevel + 1;
    
    await userRef.update({
      businessLevel: newMainLevel,
      businessSubLevel: 1,
      businessXp: 0, // Reset XP (or keep if preferred)
      upgradeRequested: false,
      upgradeRequestedAt: null,
      upgradeApprovedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastUpgradeApprovedBy: adminId
    });
    
    console.log(`[BusinessLevel] ✅ ${businessId} upgraded to Level ${newMainLevel}.1 by admin ${adminId}`);
    
    res.status(200).json({ 
      success: true, 
      newLevel: { main: newMainLevel, sub: 1 }
    });
  } catch (error) {
    console.error('[BusinessLevel] Error in approveBusinessLevelUpgrade:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * HTTP endpoint: Reject business level upgrade request
 * POST with { businessId, adminId, reason }
 */
exports.rejectBusinessLevelUpgrade = onRequest({
  cors: true,
  invoker: "public"
}, async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }
  
  try {
    const { businessId, adminId, reason } = req.body;
    
    if (!businessId || !adminId || !reason) {
      res.status(400).json({ success: false, error: 'businessId, adminId, and reason required' });
      return;
    }
    
    // TODO: Verify adminId has admin role
    
    const userRef = db.collection("users").doc(businessId);
    const userSnap = await userRef.get();
    
    if (!userSnap.exists) {
      res.status(404).json({ success: false, error: 'Business not found' });
      return;
    }
    
    const data = userSnap.data();
    const upgradeRequested = data.upgradeRequested || false;
    
    if (!upgradeRequested) {
      res.status(400).json({ success: false, error: 'No upgrade request pending' });
      return;
    }
    
    await userRef.update({
      upgradeRequested: false,
      upgradeRequestedAt: null,
      lastUpgradeRejectedBy: adminId,
      lastUpgradeRejectedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastUpgradeRejectionReason: reason
    });
    
    console.log(`[BusinessLevel] ❌ ${businessId} upgrade rejected by admin ${adminId}. Reason: ${reason}`);
    
    // TODO: Send notification/email to business with rejection reason
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('[BusinessLevel] Error in rejectBusinessLevelUpgrade:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * HTTP Endpoint: Get Pending Upgrade Requests (Admin only)
 */
exports.getPendingUpgradeRequests = onRequest({
  cors: true,
  invoker: "public"
}, async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }
  
  try {
    // TODO: Verify admin authentication
    
    const snapshot = await db.collection("users")
      .where("role", "==", "BUSINESS")
      .where("upgradeRequested", "==", true)
      .get();
    
    const requests = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      requests.push({
        id: doc.id,
        name: data.name || 'Unknown',
        email: data.email || '',
        currentLevel: data.businessLevel || 1,
        currentSubLevel: data.businessSubLevel || 1,
        currentXp: data.businessXp || 0,
        requestedAt: data.upgradeRequestedAt
      });
    });
    
    console.log(`[BusinessLevel] Found ${requests.length} pending upgrade requests`);
    
    res.status(200).json({ success: true, requests });
  } catch (error) {
    console.error('[BusinessLevel] Error in getPendingUpgradeRequests:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- B. The B2B Engine (Squads) ---

/**
 * Scheduled Function: Runs 1st of every month.
 * Logic: Groups businesses into Squads of 4.
 */
exports.generateMonthlySquads = onSchedule("0 0 1 * *", async (event) => {
  const businessesSnapshot = await db.collection("users")
    .where("role", "==", "BUSINESS")
    .where("verificationStatus", "==", "APPROVED")
    .get();

  const businesses = [];
  businessesSnapshot.forEach(doc => businesses.push({ id: doc.id, ...doc.data() }));

  // Simple Clustering Algorithm (Group by City, then random chunks of 4)
  const squads = [];
  const cityGroups = {};

  // Group by City
  businesses.forEach(biz => {
    const city = biz.homeCity || "Global";
    if (!cityGroups[city]) cityGroups[city] = [];
    cityGroups[city].push(biz);
  });

  const batch = db.batch();
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });

  // Create Squads
  for (const city in cityGroups) {
    const bizList = cityGroups[city];
    // Shuffle (Fisher-Yates)
    for (let i = bizList.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bizList[i], bizList[j]] = [bizList[j], bizList[i]];
    }

    // Chunk into 4
    for (let i = 0; i < bizList.length; i += 4) {
      const chunk = bizList.slice(i, i + 4);
      if (chunk.length < 2) continue; // Skip lonely businesses

      const memberIds = chunk.map(b => b.id);
      const squadRef = db.collection("squads").doc();
      
      batch.set(squadRef, {
        month: currentMonth,
        members: memberIds,
        city: city,
        createdAt: new Date().toISOString(),
        events: [] // Empty schedule initially
      });

      // Create Notification for each member
      memberIds.forEach(id => {
        const notifRef = db.collection("notifications").doc();
        batch.set(notifRef, {
          userId: id,
          type: "SQUAD_ALERT",
          title: `Your ${currentMonth} Squad is ready!`,
          message: "Meet your new partners and start collaborating.",
          isRead: false,
          actionLink: "/b2b/squad",
          timestamp: new Date().toISOString()
        });
      });
    }
  }

  await batch.commit();
  console.log("Monthly squads generated.");
});

/**
 * HTTP Endpoint: Manually trigger squad generation for current month
 * Useful for testing or regenerating squads
 */
exports.triggerSquadGeneration = onRequest({
  cors: true,
  invoker: "public"
}, async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    console.log("[triggerSquadGeneration] Starting squad generation...");
    
    // First, check if there are any existing November squads to update
    const existingSquadsSnapshot = await db.collection("squads").get();
    console.log(`[triggerSquadGeneration] Total squads in database: ${existingSquadsSnapshot.size}`);
    
    existingSquadsSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`[triggerSquadGeneration] Squad ${doc.id}: month=${data.month}, members=${data.members?.length || 0}`);
    });

    // Get all business users (NO verification check)
    const businessesSnapshot = await db.collection("users")
      .where("role", "==", "BUSINESS")
      .get();

    console.log(`[triggerSquadGeneration] Found ${businessesSnapshot.size} BUSINESS users`);

    const businesses = [];
    businessesSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`[triggerSquadGeneration] Business: ${data.name}, city: ${data.homeCity || data.city}`);
      businesses.push({ id: doc.id, ...data });
    });

    if (businesses.length === 0) {
      res.json({
        success: false,
        message: "No business users found in database",
        totalSquads: existingSquadsSnapshot.size
      });
      return;
    }

    // Group by City
    const cityGroups = {};
    businesses.forEach(biz => {
      const city = biz.homeCity || biz.city || "Global";
      if (!cityGroups[city]) cityGroups[city] = [];
      cityGroups[city].push(biz);
    });

    const batch = db.batch();
    const currentMonth = "December";
    let squadCount = 0;

    console.log(`[triggerSquadGeneration] Generating squads for ${currentMonth} in cities: ${Object.keys(cityGroups).join(', ')}`);

    // Create Squads
    for (const city in cityGroups) {
      const bizList = cityGroups[city];
      console.log(`[triggerSquadGeneration] ${city}: ${bizList.length} businesses`);
      
      // Shuffle (Fisher-Yates)
      for (let i = bizList.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [bizList[i], bizList[j]] = [bizList[j], bizList[i]];
      }

      // Chunk into 4
      for (let i = 0; i < bizList.length; i += 4) {
        const chunk = bizList.slice(i, i + 4);
        if (chunk.length < 1) continue; // Allow even 1 business (solo squad)

        const memberIds = chunk.map(b => b.id);
        const squadRef = db.collection("squads").doc();
        
        console.log(`[triggerSquadGeneration] Creating squad in ${city} with ${memberIds.length} members: ${chunk.map(b => b.name).join(', ')}`);
        
        batch.set(squadRef, {
          month: currentMonth,
          members: memberIds,
          city: city,
          createdAt: new Date().toISOString(),
          events: []
        });

        squadCount++;

        // Create Notification for each member
        memberIds.forEach(id => {
          const notifRef = db.collection("notifications").doc();
          batch.set(notifRef, {
            userId: id,
            type: "SQUAD_ALERT",
            title: `Your ${currentMonth} Squad is ready!`,
            message: "Meet your new partners and start collaborating.",
            isRead: false,
            actionLink: "/b2b/squad",
            timestamp: new Date().toISOString()
          });
        });
      }
    }

    await batch.commit();
    console.log(`[triggerSquadGeneration] Created ${squadCount} squads for ${currentMonth}`);

    res.json({ 
      success: true, 
      message: `Created ${squadCount} new squads for ${currentMonth}`,
      month: currentMonth,
      businessCount: businesses.length,
      cities: Object.keys(cityGroups).length,
      squadsCreated: squadCount
    });

  } catch (error) {
    console.error("[triggerSquadGeneration] Error:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message || "Failed to generate squads" 
    });
  }
});

// --- C. AI Mission Verification (Gemini) ---

/**
 * Trigger: When a Participation is created/updated with a proofUrl.
 * Logic: Uses Gemini Vision to verify the proof against mission requirements.
 */
exports.verifyMissionProof = onDocumentCreated("participations/{participationId}", async (event) => {
  const participation = event.data.data();
  
  // Only run if proof is uploaded and status is PENDING
  if (!participation.proofUrl || participation.status !== "PENDING_APPROVAL") return;

  // Fetch Mission Requirements
  const missionSnap = await db.collection("missions").doc(participation.missionId).get();
  const mission = missionSnap.data();

  try {
    const imageResp = await fetch(participation.proofUrl);
    const imageBuffer = await imageResp.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString('base64');

    const prompt = `
      Analyze this image for a social media mission.
      Mission: "${mission.title}"
      Requirements: ${mission.requirements.join(", ")}.
      
      1. Does the image likely meet the requirements?
      2. What key objects/tags are detected?
      3. Give a confidence score (0-100).
      
      Return JSON: { "isMatch": boolean, "confidenceScore": number, "detectedTags": string[] }
    `;

    const aiResponse = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
          { text: prompt }
        ]
      }
    });

    // Parse AI Result (Assuming JSON output from proper prompting or parsing logic)
    // Simplified parsing for demo:
    const text = aiResponse.response.text();
    // In production, ensure robust JSON parsing:
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : { isMatch: false, confidenceScore: 0, detectedTags: [] };

    // Update Participation with AI Result
    await event.data.ref.update({
      aiValidation: result,
      // Auto-approve if very high confidence? (Optional)
      // status: result.confidenceScore > 90 ? 'APPROVED' : 'PENDING_APPROVAL' 
    });

  } catch (error) {
    console.error("AI Verification Failed:", error);
  }
});

// --- D. AI-Powered Business About Generation ---

/**
 * HTTP Endpoint: Generate Business About from Website
 * Uses AI to analyze website and create About section
 */
exports.generatebusinessabout = onRequest({
  cors: true,
  invoker: "public",
  secrets: ["OPENAI_API_KEY"]
}, async (req, res) => {
  // Set CORS headers
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // CORS preflight
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  console.log("=== Generate Business About Request ===");

  try {
    // 1. Auth check
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: 'Unauthorized', code: 'AUTH_REQUIRED' });
      return;
    }

    const idToken = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (error) {
      console.error('Token verification failed:', error);
      res.status(401).json({ success: false, error: 'Invalid token', code: 'INVALID_TOKEN' });
      return;
    }

    const userId = decodedToken.uid;
    const { businessId, language = 'en' } = req.body;

    if (!businessId) {
      res.status(400).json({ success: false, error: 'businessId required', code: 'MISSING_BUSINESS_ID' });
      return;
    }

    console.log('User ID:', userId, 'Business ID:', businessId);

    // 2. Load business profile
    const businessRef = db.collection('users').doc(businessId);
    const businessSnap = await businessRef.get();

    if (!businessSnap.exists) {
      res.status(404).json({ success: false, error: 'Business not found', code: 'BUSINESS_NOT_FOUND' });
      return;
    }

    const business = businessSnap.data();

    // Verify ownership
    if (business.uid !== userId) {
      res.status(403).json({ success: false, error: 'Not authorized', code: 'NOT_OWNER' });
      return;
    }

    // Check if website exists
    const website = business.socialLinks?.website || business.website;
    if (!website) {
      res.status(400).json({ 
        success: false, 
        error: 'No website found. Please add your website in Contact Information first.', 
        code: 'NO_WEBSITE' 
      });
      return;
    }

    console.log('Fetching website:', website);

    // 3. Fetch website HTML
    let websiteHtml;
    try {
      const websiteUrl = website.startsWith('http') ? website : `https://${website}`;
      
      console.log('Attempting to fetch:', websiteUrl);
      
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(websiteUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        signal: controller.signal,
        redirect: 'follow'
      });
      
      clearTimeout(timeoutId);

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers));

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      websiteHtml = await response.text();
      console.log('Successfully fetched HTML, length:', websiteHtml.length);
    } catch (error) {
      console.error('Website fetch failed:', error.message);
      console.error('Error details:', error);
      
      // Fallback: Generate from business profile data instead
      console.log('⚠️ Website fetch failed, using fallback: generating from profile data only');
      websiteHtml = null; // Will trigger fallback generation below
    }

    // 4. Extract text content (simple HTML stripping)
    const extractText = (html) => {
      return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 8000); // Limit to first 8000 chars
    };

    let websiteText = '';
    let usingFallback = false;
    
    if (websiteHtml) {
      websiteText = extractText(websiteHtml);
      console.log('Extracted text length:', websiteText.length);
    } else {
      // Fallback: Use profile data
      usingFallback = true;
      websiteText = `Business profile information:\n` +
        `Category: ${business.category || 'Not specified'}\n` +
        `Description: ${business.bio || business.description || 'Not provided'}\n` +
        `Services: ${business.services?.join(', ') || 'Not specified'}\n` +
        `Location: ${business.homeCity || business.city || 'Not specified'}\n` +
        `Languages: ${business.languages?.join(', ') || 'Not specified'}`;
      console.log('Using fallback profile data for generation');
    }

    // 5. Call AI model
    const systemPrompt = usingFallback 
      ? `You are the AI brand copywriter for Fluzio, an app that connects businesses and creators.

Since we couldn't access the website, you'll work with the business profile data.

Your task:
- Write a SHORT, clear "About" section for the business profile inside Fluzio.
- Tone: friendly, professional, warm and collaboration-focused.
- Audience: content creators and influencers who might want to work with this business.
- BE CREATIVE and make the business sound appealing even with limited information.

Constraints:
- 2 to 3 short paragraphs max.
- Prefer simple sentences.
- Highlight what makes the business special for collaborations.
- Focus on the category and make reasonable assumptions about what they offer.
- If it's retail, mention products; if it's a restaurant, mention cuisine; if it's a service, mention expertise.

Also:
1. Create a 1-line tagline that can appear near the logo.
2. Suggest 3-5 vibe tags that describe the business aesthetic and personality.
   Examples: Luxury, Boho, Streetwear, Eco-Friendly, Minimalist, High-Tech, Cozy, Industrial, Vintage, Artsy, Modern, Classic, Playful, Sophisticated, Urban, Rustic, Elegant, Casual, Premium, Authentic

Output JSON ONLY in this shape (no markdown, no code blocks):

{
  "tagline": "string",
  "about": "string",
  "vibeTags": ["tag1", "tag2", "tag3"],
  "language": "en"
}`
      : `You are the AI brand copywriter for Fluzio, an app that connects businesses and creators.

You receive:
1) The raw text extracted from a business's website.
2) Some basic metadata (business name, city, category, languages).

Your task:
- Write a SHORT, clear "About" section for the business profile inside Fluzio.
- Tone: friendly, professional, warm and collaboration-focused.
- Audience: content creators and influencers who might want to work with this business.

Constraints:
- 2 to 4 short paragraphs max.
- Prefer simple sentences.
- Highlight what makes the business special for collaborations
  (story, mission, experience, values, type of customers, locations, perks).
- If you see gifting, events, hospitality, or creative services, emphasize those.

Also:
1. Create a 1-line tagline that can appear near the logo.
2. Suggest 3-5 vibe tags that describe the business aesthetic and personality.
   Examples: Luxury, Boho, Streetwear, Eco-Friendly, Minimalist, High-Tech, Cozy, Industrial, Vintage, Artsy, Modern, Classic, Playful, Sophisticated, Urban, Rustic, Elegant, Casual, Premium, Authentic

Output JSON ONLY in this shape (no markdown, no code blocks):

{
  "tagline": "string",
  "about": "string",
  "vibeTags": ["tag1", "tag2", "tag3"],
  "language": "en"
}`;

    const prompt = `${systemPrompt}

Business Information:
- Name: ${business.name || business.legalName || 'Unknown'}
- City: ${business.homeCity || business.city || 'Unknown'}
- Category: ${business.category || 'Business'}
- Languages: ${business.languages?.join(', ') || 'Unknown'}

${usingFallback ? 'Profile Data:' : 'Website Content:'}
${websiteText}`;

    console.log('Calling OpenAI GPT-4...');

    let aiResult;
    try {
      const openaiClient = getOpenAI();
      const completion = await openaiClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a professional copywriter for a creator collaboration platform. You write engaging, concise business profiles that appeal to content creators and influencers."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        response_format: { type: "json_object" }
      });
      
      const responseText = completion.choices[0].message.content;
      console.log('AI Response:', responseText);

      aiResult = JSON.parse(responseText);
    } catch (error) {
      console.error('AI generation failed:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Our AI could not generate text right now. Please try again.', 
        code: 'AI_FAILED' 
      });
      return;
    }

    // 6. Save to Firestore
    const aboutData = {
      aboutText: aiResult.about,
      tagline: aiResult.tagline,
      vibeTags: aiResult.vibeTags || [],
      aboutAiSource: 'AI',
      aboutAiLastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      aboutAiMeta: {
        model: 'gpt-4o-mini',
        language: aiResult.language || language,
        sourceUrl: website,
        generatedAt: new Date().toISOString()
      }
    };

    await businessRef.update(aboutData);

    console.log('About text generated and saved successfully');

    // 7. Return response
    res.status(200).json({
      success: true,
      tagline: aiResult.tagline,
      about: aiResult.about,
      vibeTags: aiResult.vibeTags || [],
      language: aiResult.language || language
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'An unexpected error occurred', 
      code: 'INTERNAL_ERROR' 
    });
  }
});

// --- D1.5. AI-Powered Mission Ideas ---

/**
 * HTTP Endpoint: Generate Mission Ideas
 * Uses AI to create engaging mission suggestions based on business context
 */
exports.generatemissionideas = onRequest({
  cors: true,
  invoker: "public",
  secrets: ["OPENAI_API_KEY"]
}, async (req, res) => {
  // Set CORS headers
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // CORS preflight
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  console.log("=== Generate Mission Ideas Request ===");

  try {
    // 1. Auth check
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const idToken = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (error) {
      console.error('Token verification failed:', error);
      res.status(401).json({ success: false, error: 'Invalid token' });
      return;
    }

    const { businessId, category, website, businessName, businessType } = req.body;

    if (!businessId) {
      res.status(400).json({ success: false, error: 'businessId required' });
      return;
    }

    console.log('Generating mission ideas for:', { businessName, businessType, category });

    // 2. Generate mission ideas with OpenAI
    const openaiClient = getOpenAI();
    
    const prompt = `You are a creative marketing expert helping businesses create engaging social media missions.

Business Details:
- Name: ${businessName}
- Type: ${businessType}
- Category: ${category}
- Website: ${website}

Generate 5 creative and engaging social media mission ideas that would work well for this business. Each mission should:
1. Be fun and achievable for customers
2. Create authentic engagement and user-generated content
3. Align with the business type and values
4. Have clear instructions for completion
5. Be worth 50-200 points based on effort required

For each mission, provide:
- title: Short, catchy title (max 60 characters)
- description: Clear instructions on what to do (2-3 sentences)
- postType: One of [PHOTO, VIDEO, STORY, REEL, CAROUSEL]
- suggestedPoints: Point value (50-200)
- hashtags: Array of 3-5 relevant hashtags (without # symbol)

Return ONLY a valid JSON object with this structure:
{
  "missions": [
    {
      "title": "string",
      "description": "string",
      "postType": "PHOTO|VIDEO|STORY|REEL|CAROUSEL",
      "suggestedPoints": number,
      "hashtags": ["tag1", "tag2", "tag3"]
    }
  ]
}`;

    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4",
      messages: [
        { 
          role: "system", 
          content: "You are a marketing expert that generates creative social media mission ideas. Always respond with valid JSON only." 
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 2000
    });

    const responseText = completion.choices[0].message.content.trim();
    console.log('OpenAI response:', responseText);

    // Parse JSON response
    let missionData;
    try {
      missionData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to parse AI response',
        raw: responseText
      });
      return;
    }

    if (!missionData.missions || !Array.isArray(missionData.missions)) {
      res.status(500).json({ 
        success: false, 
        error: 'Invalid mission data structure' 
      });
      return;
    }

    res.status(200).json({
      success: true,
      missions: missionData.missions
    });

  } catch (error) {
    console.error('Error generating mission ideas:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate mission ideas'
    });
  }
});

// --- D2. AI-Powered Reward Suggestions ---

/**
 * HTTP Endpoint: Generate Reward Suggestions
 * Uses AI to create personalized reward suggestions based on business context
 */
exports.generaterewardsuggestions = onRequest({
  cors: true,
  invoker: "public",
  secrets: ["OPENAI_API_KEY"]
}, async (req, res) => {
  // Set CORS headers
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // CORS preflight
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  console.log("=== Generate Reward Suggestions Request ===");

  try {
    // 1. Auth check
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: 'Unauthorized', code: 'AUTH_REQUIRED' });
      return;
    }

    const idToken = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (error) {
      console.error('Token verification failed:', error);
      res.status(401).json({ success: false, error: 'Invalid token', code: 'INVALID_TOKEN' });
      return;
    }

    const userId = decodedToken.uid;
    const { businessId, businessType, businessName, businessContext, existingRewards } = req.body;

    if (!businessId || !businessType || !businessName) {
      res.status(400).json({ success: false, error: 'Missing required fields', code: 'MISSING_FIELDS' });
      return;
    }

    console.log('Generating reward suggestions for:', businessName);

    // 2. Build context string
    let contextInfo = `Business Type: ${businessType}`;
    
    if (businessContext?.category) {
      contextInfo += `\nCategory: ${businessContext.category}`;
    }
    
    if (businessContext?.aboutText) {
      contextInfo += `\n\nAbout the Business:\n${businessContext.aboutText}`;
    }
    
    if (businessContext?.description && businessContext.description !== businessContext.aboutText) {
      contextInfo += `\n\nAdditional Description: ${businessContext.description}`;
    }
    
    if (businessContext?.services && businessContext.services.length > 0) {
      contextInfo += `\n\nServices/Products:\n${businessContext.services.map(s => `- ${s}`).join('\n')}`;
    }
    
    if (businessContext?.website) {
      contextInfo += `\n\nWebsite: ${businessContext.website}`;
    }

    const existingContext = existingRewards && existingRewards.length > 0 
      ? `\n\nExisting rewards:\n${existingRewards.map(r => `- ${r.title} (${r.category})`).join('\n')}\n\nSuggest NEW, different rewards to diversify offerings.`
      : '';

    console.log('Context length:', contextInfo.length, 'characters');

    // 3. Call OpenAI
    const prompt = `Generate 10 creative, SPECIFIC reward ideas for "${businessName}".

IMPORTANT: Create exactly 10 rewards with this distribution:
- 4 CHEAP rewards (€5-€15 value = 500-1500 points)
- 4 MEDIUM rewards (€20-€60 value = 2000-6000 points)
- 2 EXPENSIVE rewards (€100-€300 value = 10000-30000 points)

${contextInfo}${existingContext}

CRITICAL INSTRUCTIONS:
- Read the business information carefully above
- Create rewards that ONLY make sense for THIS specific business
- Reference actual products/services mentioned in their description
- Use the business name "${businessName}" in context
- If it's a jewelry store, mention jewelry items (rings, necklaces, charms, etc.)
- If it's a café, mention specific drinks or food items
- If it's a spa, mention specific treatments
- Make it obvious these rewards are for "${businessName}" specifically

PRICING GUIDELINES:
- Calculate points based on the ACTUAL VALUE of the reward
- Use this formula: Points = Euro Value × 100
- Examples:
  * €7 engraving service = 700 points
  * €20 product = 2000 points
  * €50 discount = 5000 points
  * €100 experience = 10000 points
  * €300 workshop = 30000 points

PRICE TIERS (MUST FOLLOW):
- CHEAP (4 rewards): 500-1500 points (€5-15)
  * Free delivery, gift wrapping, small accessories, minor services
- MEDIUM (4 rewards): 2000-6000 points (€20-60)
  * Product discounts, mid-range items, basic experiences
- EXPENSIVE (2 rewards): 10000-30000 points (€100-300)
  * Premium experiences, workshops, high-value items, major discounts

BAD Example (too generic): "20% Off Your Next Purchase" for 1500 points
GOOD Examples (specific with proper pricing):
- CHEAP: "Free Gift Wrapping on Any Purchase" for 500 points (€5 value)
- CHEAP: "Free Silver Engraving (Both Sides)" for 1400 points (€14 value)
- MEDIUM: "Custom Gold Charm with Bracelet Purchase" for 4000 points (€40 value)
- MEDIUM: "€25 Off Purchase Over €100" for 2500 points (€25 value)
- EXPENSIVE: "DIY Jewelry Making Workshop" for 30000 points (€300 value)
- EXPENSIVE: "Custom Gold Ring Design Session" for 15000 points (€150 value)

Requirements:
- Mix of categories: DISCOUNT, FREEBIE, COUPON, EXPERIENCE, GIFT, CASHBACK
- EXACTLY 4 cheap, 4 medium, 2 expensive (total 10)
- MUST be specific to ${businessName} (not generic)
- Reference actual offerings from the business description
- Include clear terms and redemption instructions
- Provide variety in both price points and reward types

Respond with JSON in this exact format:
{
  "rewards": [{
    "title": "Specific reward name mentioning actual product/service (under 50 chars)",
    "description": "Detailed description of the specific reward (80-120 chars)",
    "category": "DISCOUNT|FREEBIE|COUPON|EXPERIENCE|GIFT|CASHBACK",
    "suggestedPoints": calculated-based-on-euro-value,
    "terms": "Clear terms and conditions (50-100 chars)",
    "redemptionInstructions": "How to redeem at ${businessName} (30-60 chars)"
  }]
}`;

    console.log('Calling OpenAI GPT-4o-mini...');

    let aiResult;
    try {
      const openaiClient = getOpenAI();
      const completion = await openaiClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a loyalty rewards expert helping businesses create attractive, engaging rewards that drive customer engagement and repeat visits. You MUST create rewards that are hyper-specific to the actual business, referencing their real products, services, and brand. Generic rewards are not acceptable. You MUST create exactly 10 rewards: 4 cheap (500-1500 points), 4 medium (2000-6000 points), and 2 expensive (10000-30000 points). Respond ONLY with valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.9,
        max_tokens: 2500,
        response_format: { type: "json_object" }
      });
      
      const responseText = completion.choices[0].message.content;
      console.log('AI Response received, length:', responseText?.length || 0);

      aiResult = JSON.parse(responseText);
    } catch (error) {
      console.error('AI generation failed:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Our AI could not generate suggestions right now. Please try again.', 
        code: 'AI_FAILED' 
      });
      return;
    }

    // 4. Return suggestions
    const suggestions = aiResult.rewards || aiResult.suggestions || aiResult.results || aiResult;
    
    console.log('Generated', Array.isArray(suggestions) ? suggestions.length : 0, 'suggestions');

    res.status(200).json({
      success: true,
      rewards: Array.isArray(suggestions) ? suggestions : []
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'An unexpected error occurred', 
      code: 'INTERNAL_ERROR' 
    });
  }
});

// --- E. Rewards & Points Economy (Secure Backend Functions) ---

/**
 * HTTP Endpoint: Redeem Reward
 * Securely handles reward redemption with points transfer
 * CRITICAL: This runs server-side to prevent fraud
 */
exports.redeemreward = onRequest({
  cors: true,
  invoker: "public"
}, async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  console.log("=== Redeem Reward Request ===");

  try {
    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userId = decodedToken.uid;

    const { rewardId, userName } = req.body;

    if (!rewardId) {
      res.status(400).json({ success: false, error: 'Missing rewardId' });
      return;
    }

    // Get reward details
    const rewardRef = db.collection('rewards').doc(rewardId);
    const rewardSnap = await rewardRef.get();

    if (!rewardSnap.exists) {
      res.status(404).json({ success: false, error: 'Reward not found' });
      return;
    }

    const reward = rewardSnap.data();
    const businessId = reward.businessId;
    const pointsCost = reward.pointsCost;

    // Get user's current points
    const userRef = db.collection('users').doc(userId);
    const userSnap = await userRef.get();
    
    if (!userSnap.exists) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    const userData = userSnap.data();
    const customerPoints = userData.points || 0;

    // Check if user has enough points
    if (customerPoints < pointsCost) {
      res.status(400).json({ 
        success: false, 
        error: 'Insufficient points',
        required: pointsCost,
        available: customerPoints
      });
      return;
    }

    // Check if reward is still available
    if (reward.claimed >= reward.totalAvailable) {
      res.status(400).json({ success: false, error: 'Reward no longer available' });
      return;
    }

    // Check if reward is active
    const now = new Date();
    if (reward.expiresAt && reward.expiresAt.toDate() < now) {
      res.status(400).json({ success: false, error: 'Reward has expired' });
      return;
    }

    // Get business's current points
    const businessRef = db.collection('users').doc(businessId);
    const businessSnap = await businessRef.get();
    const businessData = businessSnap.data();
    const businessPoints = businessData.points || 0;

    // Generate coupon code
    const couponCode = `${reward.code || 'REWARD'}-${Date.now().toString(36).toUpperCase()}`;

    // Use Firestore transaction for atomic operations
    await db.runTransaction(async (transaction) => {
      // Deduct points from customer
      transaction.update(userRef, {
        points: admin.firestore.FieldValue.increment(-pointsCost)
      });

      // Add points to business
      transaction.update(businessRef, {
        points: admin.firestore.FieldValue.increment(pointsCost)
      });

      // Update reward claimed count
      transaction.update(rewardRef, {
        claimed: admin.firestore.FieldValue.increment(1)
      });

      // Create redemption record
      const redemptionRef = db.collection('redemptions').doc();
      transaction.set(redemptionRef, {
        id: redemptionRef.id,
        rewardId: rewardId,
        userId: userId,
        userName: userName || userData.name,
        businessId: businessId,
        businessName: businessData.name,
        rewardTitle: reward.title,
        pointsCost: pointsCost,
        couponCode: couponCode,
        status: 'PENDING',
        redeemedAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt: reward.validUntil || null
      });

      // Log customer transaction (SPEND)
      const customerTransactionRef = db.collection('points_transactions').doc();
      transaction.set(customerTransactionRef, {
        id: customerTransactionRef.id,
        userId: userId,
        type: 'SPEND',
        amount: -pointsCost,
        relatedId: `redemption_${redemptionRef.id}`,
        description: `Redeemed: ${reward.title}`,
        balanceBefore: customerPoints,
        balanceAfter: customerPoints - pointsCost,
        metadata: {
          rewardId: rewardId,
          redemptionId: redemptionRef.id,
          businessId: businessId,
          couponCode: couponCode
        },
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      // Log business transaction (EARN)
      const businessTransactionRef = db.collection('points_transactions').doc();
      transaction.set(businessTransactionRef, {
        id: businessTransactionRef.id,
        userId: businessId,
        type: 'EARN',
        amount: pointsCost,
        relatedId: `redemption_${redemptionRef.id}`,
        description: `Reward redeemed by ${userName || 'customer'}`,
        balanceBefore: businessPoints,
        balanceAfter: businessPoints + pointsCost,
        metadata: {
          rewardId: rewardId,
          redemptionId: redemptionRef.id,
          customerId: userId,
          customerName: userName
        },
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    console.log('Reward redeemed successfully:', rewardId);

    res.status(200).json({
      success: true,
      message: 'Reward redeemed successfully',
      couponCode: couponCode,
      pointsSpent: pointsCost,
      newBalance: customerPoints - pointsCost
    });

  } catch (error) {
    console.error('Redeem reward error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
});

/**
 * HTTP Endpoint: Purchase Marketplace Product
 * Securely handles marketplace purchases with points
 */
exports.purchaseproduct = onRequest({
  cors: true,
  invoker: "public"
}, async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  console.log("=== Purchase Product Request ===");

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const businessId = decodedToken.uid;

    const { productId, productName, pointsCost, duration } = req.body;

    if (!productId || !pointsCost) {
      res.status(400).json({ success: false, error: 'Missing required fields' });
      return;
    }

    // Get business's current points
    const businessRef = db.collection('users').doc(businessId);
    const businessSnap = await businessRef.get();
    
    if (!businessSnap.exists) {
      res.status(404).json({ success: false, error: 'Business not found' });
      return;
    }

    const businessData = businessSnap.data();
    const currentPoints = businessData.points || 0;

    // Check if business has enough points
    if (currentPoints < pointsCost) {
      res.status(400).json({ 
        success: false, 
        error: 'Insufficient points',
        required: pointsCost,
        available: currentPoints
      });
      return;
    }

    // Calculate expiration
    const expiresAt = duration ? 
      new Date(Date.now() + duration * 24 * 60 * 60 * 1000) : null;

    await db.runTransaction(async (transaction) => {
      // Deduct points from business
      transaction.update(businessRef, {
        points: admin.firestore.FieldValue.increment(-pointsCost)
      });

      // Create purchase record
      const purchaseRef = db.collection('points_purchases').doc();
      transaction.set(purchaseRef, {
        id: purchaseRef.id,
        businessId: businessId,
        productId: productId,
        productName: productName,
        pointsCost: pointsCost,
        purchasedAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt: expiresAt,
        status: 'ACTIVE'
      });

      // Log transaction
      const transactionRef = db.collection('points_transactions').doc();
      transaction.set(transactionRef, {
        id: transactionRef.id,
        userId: businessId,
        type: 'SPEND',
        amount: -pointsCost,
        relatedId: `purchase_${purchaseRef.id}`,
        description: `Purchased: ${productName}`,
        balanceBefore: currentPoints,
        balanceAfter: currentPoints - pointsCost,
        metadata: {
          productId: productId,
          purchaseId: purchaseRef.id
        },
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    console.log('Product purchased successfully:', productId);

    res.status(200).json({
      success: true,
      message: 'Product purchased successfully',
      pointsSpent: pointsCost,
      newBalance: currentPoints - pointsCost
    });

  } catch (error) {
    console.error('Purchase product error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
});

/**
 * HTTP Endpoint: Fund Mission with Points
 * Securely handles mission creation funded by points
 */
exports.fundmission = onRequest({
  cors: true,
  invoker: "public"
}, async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  console.log("=== Fund Mission Request ===");

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const businessId = decodedToken.uid;

    const { missionId, rewardPoints, maxParticipants } = req.body;

    if (!missionId || !rewardPoints || !maxParticipants) {
      res.status(400).json({ success: false, error: 'Missing required fields' });
      return;
    }

    // Calculate total cost: base (50) + reward pool + platform fee (20%)
    const baseCost = 50;
    const rewardPool = rewardPoints * maxParticipants;
    const platformFee = Math.ceil((baseCost + rewardPool) * 0.20);
    const totalCost = baseCost + rewardPool + platformFee;

    // Get business's current points
    const businessRef = db.collection('users').doc(businessId);
    const businessSnap = await businessRef.get();
    
    if (!businessSnap.exists) {
      res.status(404).json({ success: false, error: 'Business not found' });
      return;
    }

    const businessData = businessSnap.data();
    const currentPoints = businessData.points || 0;

    if (currentPoints < totalCost) {
      res.status(400).json({ 
        success: false, 
        error: 'Insufficient points',
        required: totalCost,
        available: currentPoints
      });
      return;
    }

    await db.runTransaction(async (transaction) => {
      // Deduct points from business
      transaction.update(businessRef, {
        points: admin.firestore.FieldValue.increment(-totalCost)
      });

      // Update mission with funding details
      const missionRef = db.collection('missions').doc(missionId);
      transaction.update(missionRef, {
        fundingType: 'POINTS',
        fundingCost: totalCost,
        fundedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Log transaction
      const transactionRef = db.collection('points_transactions').doc();
      transaction.set(transactionRef, {
        id: transactionRef.id,
        userId: businessId,
        type: 'SPEND',
        amount: -totalCost,
        relatedId: `mission_${missionId}`,
        description: `Funded mission with points`,
        balanceBefore: currentPoints,
        balanceAfter: currentPoints - totalCost,
        metadata: {
          missionId: missionId,
          baseCost: baseCost,
          rewardPool: rewardPool,
          platformFee: platformFee,
          rewardPoints: rewardPoints,
          maxParticipants: maxParticipants
        },
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    console.log('Mission funded successfully:', missionId);

    res.status(200).json({
      success: true,
      message: 'Mission funded successfully',
      totalCost: totalCost,
      breakdown: {
        baseCost: baseCost,
        rewardPool: rewardPool,
        platformFee: platformFee
      },
      newBalance: currentPoints - totalCost
    });

  } catch (error) {
    console.error('Fund mission error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
});

/**
 * HTTP Endpoint: Update Daily Login Streak and Award Points
 * Automatically awards daily login bonus points with streak multipliers
 */
exports.updatedailystreak = onRequest({
  cors: true,
  invoker: "public"
}, async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Methods", "POST");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ success: false, error: "Method not allowed" });
    return;
  }

  try {
    const { userId } = req.body;

    if (!userId) {
      res.status(400).json({ success: false, error: "Missing userId" });
      return;
    }

    const userRef = db.collection('users').doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }

    const userData = userSnap.data();
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const lastLoginDate = userData.lastLoginAt ? 
      new Date(userData.lastLoginAt).toISOString().split('T')[0] : null;
    const lastStreakRewardDate = userData.lastStreakRewardClaimed ?
      new Date(userData.lastStreakRewardClaimed).toISOString().split('T')[0] : null;

    // Check if user already claimed today's streak reward
    if (lastStreakRewardDate === today) {
      res.status(200).json({
        success: true,
        message: "Streak already claimed today",
        streak: userData.loginStreak || 1,
        pointsAwarded: 0,
        alreadyClaimed: true,
        newBalance: userData.points || 0
      });
      return;
    }

    let newStreak = 1;
    let streakContinued = false;

    if (lastLoginDate) {
      const yesterday = new Date(now.getTime() - 86400000).toISOString().split('T')[0];
      
      if (lastLoginDate === yesterday) {
        // Consecutive day - continue streak
        newStreak = (userData.loginStreak || 1) + 1;
        streakContinued = true;
      } else if (lastLoginDate === today) {
        // Same day login - maintain current streak
        newStreak = userData.loginStreak || 1;
      }
      // If more than 1 day gap, streak resets to 1 (default)
    }

    // Calculate streak bonus points (legacy points system)
    const basePoints = 5; // Base daily login reward
    const streakBonus = Math.min(Math.floor(newStreak / 7) * 5, 50); // +5 points per week, max +50
    const totalPoints = basePoints + streakBonus;

    // Milestone bonuses (legacy)
    const milestones = {
      3: 20,    // 3-day streak
      7: 50,    // 1-week streak
      14: 100,  // 2-week streak
      30: 250,  // 1-month streak
      60: 500,  // 2-month streak
      100: 1000 // 100-day streak
    };

    const milestoneBonus = milestones[newStreak] || 0;
    const finalPoints = totalPoints + milestoneBonus;

    const currentPoints = userData.points || 0;
    
    // Award Reward Points (new system)
    // Daily check-in: 10 points
    await awardRewardPoints(userId, 10, 'Daily check-in', null);
    
    // Streak milestone bonuses for reward points
    if (newStreak === 3) {
      await awardRewardPoints(userId, 30, '3-day streak bonus', null);
    } else if (newStreak === 7) {
      await awardRewardPoints(userId, 70, '7-day streak bonus', null);
    } else if (newStreak === 30) {
      await awardRewardPoints(userId, 500, '30-day streak bonus', null);
    } else if (newStreak === 60) {
      await awardRewardPoints(userId, 1000, '60-day streak bonus', null);
    } else if (newStreak === 100) {
      await awardRewardPoints(userId, 2000, '100-day streak bonus', null);
    }

    // Execute transaction
    await db.runTransaction(async (transaction) => {
      // Update user profile
      transaction.update(userRef, {
        points: admin.firestore.FieldValue.increment(finalPoints),
        loginStreak: newStreak,
        longestLoginStreak: Math.max(newStreak, userData.longestLoginStreak || 0),
        lastLoginAt: now.toISOString(),
        lastStreakRewardClaimed: now.toISOString(),
        totalStreakPointsEarned: admin.firestore.FieldValue.increment(finalPoints)
      });

      // Log transaction
      const transactionRef = db.collection('points_transactions').doc();
      transaction.set(transactionRef, {
        id: transactionRef.id,
        userId: userId,
        type: 'EARN',
        amount: finalPoints,
        relatedId: `daily_streak_${newStreak}`,
        description: `Daily login reward (${newStreak} day streak)${milestoneBonus > 0 ? ` + ${milestoneBonus} milestone bonus!` : ''}`,
        balanceBefore: currentPoints,
        balanceAfter: currentPoints + finalPoints,
        metadata: {
          streakDay: newStreak,
          basePoints: basePoints,
          streakBonus: streakBonus,
          milestoneBonus: milestoneBonus,
          streakContinued: streakContinued
        },
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    console.log(`Daily streak reward awarded to ${userId}: ${finalPoints} points (day ${newStreak})`);

    res.status(200).json({
      success: true,
      message: streakContinued ? 
        `Streak continued! Day ${newStreak}` : 
        newStreak > 1 ? `Welcome back! Current streak: ${newStreak} days` : 'Welcome! Start your daily streak',
      streak: newStreak,
      pointsAwarded: finalPoints,
      breakdown: {
        basePoints,
        streakBonus,
        milestoneBonus
      },
      newBalance: currentPoints + finalPoints,
      milestoneReached: milestoneBonus > 0
    });

  } catch (error) {
    console.error('Update daily streak error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
});

// --- Instagram Follow Verification System ---

/**
 * Generate Instagram Follow Verification Link
 * Creates a unique tracking token and returns the Instagram DM link
 */
exports.generateInstagramFollowLink = onRequest({
  cors: true,
  invoker: "public"
}, async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    const { userId, businessId, missionId } = req.body;

    if (!userId || !businessId || !missionId) {
      res.status(400).json({
        success: false,
        error: "Missing required fields: userId, businessId, missionId"
      });
      return;
    }

    // Get business Instagram username
    const businessDoc = await db.collection("users").doc(businessId).get();
    if (!businessDoc.exists) {
      res.status(404).json({ success: false, error: "Business not found" });
      return;
    }

    const businessData = businessDoc.data();
    const instagramUsername = businessData.socialAccounts?.instagram?.username;

    if (!instagramUsername) {
      res.status(400).json({
        success: false,
        error: "Business does not have Instagram connected"
      });
      return;
    }

    // Generate unique verification token
    const token = crypto.randomBytes(32).toString('hex');

    // Store verification record
    const verificationRef = db.collection("instagramFollowVerifications").doc();
    await verificationRef.set({
      token,
      fluzioUserId: userId,
      businessId,
      missionId,
      status: "PENDING",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });

    // Construct Instagram DM link with tracking token
    const dmLink = `https://ig.me/m/${instagramUsername}?ref=${token}`;

    res.status(200).json({
      success: true,
      dmLink,
      token,
      message: "Click this link, follow the account, and send a message to verify"
    });

  } catch (error) {
    console.error("Generate Instagram follow link error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal server error"
    });
  }
});

/**
 * Instagram Webhook Handler
 * Receives messages from Instagram and verifies follow status
 */
exports.instagramWebhook = onRequest({
  cors: true,
  invoker: "public"
}, async (req, res) => {
  // Webhook verification (GET request from Meta)
  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    const VERIFY_TOKEN = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN || "fluzio_instagram_webhook_2024";

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("Instagram webhook verified");
      res.status(200).send(challenge);
    } else {
      res.status(403).send("Forbidden");
    }
    return;
  }

  // Handle incoming messages (POST request)
  if (req.method === "POST") {
    try {
      const body = req.body;
      console.log("Instagram webhook received:", JSON.stringify(body, null, 2));

      // Check if this is a message event
      if (body.object === "instagram") {
        for (const entry of body.entry) {
          for (const messaging of entry.messaging || []) {
            // Extract sender IGSID and referral token
            const senderId = messaging.sender?.id; // Instagram-Scoped ID
            const referral = messaging.message?.referral;
            const refToken = referral?.ref;

            if (senderId && refToken) {
              console.log(`Processing message from IGSID: ${senderId}, Token: ${refToken}`);

              // Find verification record by token
              const verificationQuery = await db.collection("instagramFollowVerifications")
                .where("token", "==", refToken)
                .where("status", "==", "PENDING")
                .limit(1)
                .get();

              if (verificationQuery.empty) {
                console.log("No pending verification found for token:", refToken);
                continue;
              }

              const verificationDoc = verificationQuery.docs[0];
              const verification = verificationDoc.data();

              // Update with IGSID
              await verificationDoc.ref.update({
                igsid: senderId,
                status: "VERIFYING",
                receivedAt: admin.firestore.FieldValue.serverTimestamp()
              });

              // Verify follow status using Instagram Graph API
              await verifyInstagramFollow(
                senderId,
                verification.fluzioUserId,
                verification.businessId,
                verification.missionId,
                verificationDoc.id
              );
            }
          }
        }
      }

      res.status(200).send("EVENT_RECEIVED");
    } catch (error) {
      console.error("Instagram webhook error:", error);
      res.status(500).send("Internal Server Error");
    }
  }
});

/**
 * Helper function to verify Instagram follow status
 */
async function verifyInstagramFollow(igsid, userId, businessId, missionId, verificationId) {
  try {
    console.log(`Verifying follow status for IGSID: ${igsid}`);

    // Get business's Instagram page access token
    const businessDoc = await db.collection("users").doc(businessId).get();
    const pageAccessToken = businessDoc.data().socialAccounts?.instagram?.accessToken;

    if (!pageAccessToken) {
      console.error("Business does not have Instagram page access token");
      await db.collection("instagramFollowVerifications").doc(verificationId).update({
        status: "FAILED",
        error: "Business Instagram not configured"
      });
      return;
    }

    // Call Instagram Graph API to check follow status
    const apiUrl = `https://graph.facebook.com/${igsid}?fields=is_user_follow_business&access_token=${pageAccessToken}`;
    const response = await fetch(apiUrl);
    const data = await response.json();

    console.log(`Follow status response:`, data);

    if (data.is_user_follow_business === true) {
      // User is following! Mark as verified and award points
      await db.collection("instagramFollowVerifications").doc(verificationId).update({
        status: "VERIFIED",
        verifiedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Award points for completing the mission
      const missionDoc = await db.collection("missions").doc(missionId).get();
      const pointsReward = missionDoc.data()?.reward?.points || 50;

      const userRef = db.collection("users").doc(userId);
      await userRef.update({
        points: admin.firestore.FieldValue.increment(pointsReward)
      });

      // Mark mission participation as complete
      const participationQuery = await db.collection("missionParticipations")
        .where("userId", "==", userId)
        .where("missionId", "==", missionId)
        .limit(1)
        .get();

      if (!participationQuery.empty) {
        await participationQuery.docs[0].ref.update({
          status: "COMPLETED",
          completedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      console.log(`✅ Verification complete! Awarded ${pointsReward} points to user ${userId}`);
    } else {
      // User is NOT following
      await db.collection("instagramFollowVerifications").doc(verificationId).update({
        status: "FAILED",
        error: "User did not follow the account"
      });
      console.log(`❌ User ${userId} has not followed the account`);
    }
  } catch (error) {
    console.error("Verify Instagram follow error:", error);
    await db.collection("instagramFollowVerifications").doc(verificationId).update({
      status: "FAILED",
      error: error.message
    });
  }
}

// --- G. AI Collaboration Suggestions ---

/**
 * HTTP Endpoint: Generate AI-powered collaboration suggestions
 * Suggests complementary businesses for partnership opportunities
 */
exports.generateCollaborationSuggestions = onRequest({
  cors: true,
  invoker: "public",
  secrets: ["OPENAI_API_KEY"]
}, async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    console.log("[generateCollaborationSuggestions] Request received");
    const { userId } = req.body;

    if (!userId) {
      res.status(400).json({ success: false, error: "userId is required" });
      return;
    }

    // Get user's business profile
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }

    const userData = userDoc.data();
    console.log("[generateCollaborationSuggestions] User:", userData.name);

    // Determine city to search (temporary location or home city)
    const searchCity = userData.temporaryLocation?.city || userData.homeCity || userData.city || userData.location;
    console.log("[generateCollaborationSuggestions] Searching city:", searchCity);

    if (!searchCity) {
      res.status(400).json({ success: false, error: "User has no city set" });
      return;
    }

    // Get all businesses in the same city (excluding self)
    const businessesSnapshot = await db.collection("users")
      .where("role", "==", "BUSINESS")
      .get();

    const businesses = [];
    businessesSnapshot.forEach(doc => {
      const business = doc.data();
      const businessCity = business.homeCity || business.city || business.location;
      
      // Only include businesses in the same city (case-insensitive)
      if (businessCity && 
          businessCity.toLowerCase() === searchCity.toLowerCase() && 
          doc.id !== userId) {
        businesses.push({
          id: doc.id,
          name: business.name || "Unknown Business",
          category: business.category || "OTHER",
          bio: business.bio || "",
          offers: business.offers || [],
          vibeTags: business.vibeTags || business.vibe || [],
          mission: business.mission || "",
          subCategory: business.subCategory || ""
        });
      }
    });

    console.log("[generateCollaborationSuggestions] Found", businesses.length, "businesses in", searchCity);

    if (businesses.length === 0) {
      res.json({ 
        success: true, 
        suggestions: [],
        message: "No businesses found in your city"
      });
      return;
    }

    // Prepare OpenAI prompt with better context and instructions
    const prompt = `You are an expert B2B partnership strategist specializing in local business collaboration. Analyze the target business and suggest up to 5 perfect partnership matches from the available businesses.

**TARGET BUSINESS:**
Name: ${userData.name}
Category: ${userData.category}
Bio: ${userData.bio || "No bio provided"}
Products/Services: ${(userData.offers || []).join(", ") || "None specified"}
Brand Vibe: ${(userData.vibeTags || userData.vibe || []).join(", ") || "Not specified"}
Mission: ${userData.mission || "Not specified"}
Sub-Category: ${userData.subCategory || "Not specified"}

**AVAILABLE BUSINESSES IN ${searchCity}:**
${businesses.slice(0, 50).map((b, index) => `
${index + 1}. Business ID: ${b.id}
   Name: ${b.name}
   Category: ${b.category}
   Sub-Category: ${b.subCategory || "N/A"}
   Bio: ${b.bio || "No bio"}
   Products/Services: ${b.offers.join(", ") || "None"}
   Vibe Tags: ${b.vibeTags.join(", ") || "None"}
   Mission: ${b.mission || "N/A"}
`).join("\n")}

**MATCHING CRITERIA:**
1. **Complementary Services**: Find businesses whose services complement (not compete with) the target
2. **Shared Customer Base**: Look for overlapping target demographics
3. **Brand Alignment**: Match vibe tags and brand values
4. **Revenue Potential**: Consider cross-promotion and bundling opportunities
5. **Practical Synergy**: Ensure collaborations are realistic and actionable

**EXAMPLE MATCHES:**
- Jewelry store + Pet shop → "Pet-friendly jewelry collection" or "Matching owner-pet accessories"
- Coffee shop + Bookstore → "Literary coffee tastings" or "Book club events"
- Gym + Nutritionist → "Wellness packages" or "Fitness meal plans"

**OUTPUT FORMAT (JSON ONLY):**
{
  "suggestions": [
    {
      "businessId": "exact_business_id_from_list",
      "matchScore": 75-95,
      "collaborationIdea": "Specific, creative, actionable idea (1-2 sentences, focus on the 'what' and 'how')",
      "synergy": "Clear explanation of why this partnership works (1-2 sentences, focus on customer benefits and business value)",
      "sharedInterests": ["tag1", "tag2", "tag3"],
      "potentialRevenue": "Realistic estimate based on collaboration type (e.g., '€300-800/month', '€2000-5000 per campaign')"
    }
  ]
}

**IMPORTANT:**
- Return ONLY valid JSON, no markdown, no explanations
- Match scores 75-95 (85+ for excellent matches)
- Collaboration ideas must be specific and creative (avoid generic suggestions)
- Focus on WIN-WIN scenarios for both businesses
- Include realistic revenue estimates
- Prioritize businesses with complementary (not competing) services`;

    console.log("[generateCollaborationSuggestions] Calling OpenAI...");
    
    const openaiClient = getOpenAI();
    const response = await openaiClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert B2B partnership strategist. Always return valid JSON only, no markdown formatting."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 2500
    });

    const content = response.choices[0].message.content;
    console.log("[generateCollaborationSuggestions] OpenAI response length:", content.length);
    
    let result;
    try {
      result = JSON.parse(content);
    } catch (parseError) {
      console.error("[generateCollaborationSuggestions] JSON parse error:", parseError);
      console.error("[generateCollaborationSuggestions] Raw content:", content);
      throw new Error("Failed to parse AI response");
    }

    if (!result.suggestions || !Array.isArray(result.suggestions)) {
      console.error("[generateCollaborationSuggestions] Invalid response structure:", result);
      result = { suggestions: [] };
    }

    console.log("[generateCollaborationSuggestions] Generated", result.suggestions?.length || 0, "suggestions");

    // Validate and enrich each suggestion
    const suggestions = result.suggestions
      .filter(s => s.businessId && businesses.find(b => b.id === s.businessId))
      .slice(0, 5)
      .map(s => ({
        businessId: s.businessId,
        matchScore: Math.min(95, Math.max(75, s.matchScore || 80)),
        collaborationIdea: s.collaborationIdea || "Partner for cross-promotion",
        synergy: s.synergy || "Complementary business services",
        sharedInterests: Array.isArray(s.sharedInterests) ? s.sharedInterests : [],
        potentialRevenue: s.potentialRevenue || "€300-600/month",
        suggestedAt: new Date().toISOString()
      }));

    res.json({ 
      success: true, 
      suggestions,
      city: searchCity
    });

  } catch (error) {
    console.error("[generateCollaborationSuggestions] Error:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message || "Failed to generate suggestions" 
    });
  }
});

// --- H. Premium Event Registration ---

/**
 * HTTP Endpoint: Register for premium event with points or cash
 * Handles event registration, payment processing, and capacity management
 */
exports.registerForPremiumEvent = onRequest({
  cors: true,
  invoker: "public"
}, async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    console.log("[registerForPremiumEvent] Request received");
    const { userId, eventId, paymentMethod } = req.body;

    if (!userId || !eventId || !paymentMethod) {
      res.status(400).json({ 
        success: false, 
        error: "userId, eventId, and paymentMethod are required" 
      });
      return;
    }

    if (!['points', 'cash'].includes(paymentMethod)) {
      res.status(400).json({ 
        success: false, 
        error: "paymentMethod must be 'points' or 'cash'" 
      });
      return;
    }

    // Get user
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }
    const userData = userDoc.data();

    // Get event
    const eventDoc = await db.collection("premium_events").doc(eventId).get();
    if (!eventDoc.exists) {
      res.status(404).json({ success: false, error: "Event not found" });
      return;
    }
    const eventData = eventDoc.data();

    // Check if event is available
    if (eventData.status === 'SOLD_OUT' || eventData.registered >= eventData.capacity) {
      res.status(400).json({ success: false, error: "Event is sold out" });
      return;
    }

    // Check if already registered
    const registrants = eventData.registrants || [];
    if (registrants.includes(userId)) {
      res.status(400).json({ success: false, error: "Already registered for this event" });
      return;
    }

    // Validate payment
    if (paymentMethod === 'points') {
      const userPoints = userData.points || 0;
      const requiredPoints = eventData.pricing.points;

      if (userPoints < requiredPoints) {
        res.status(400).json({ 
          success: false, 
          error: `Insufficient points. Need ${requiredPoints}, have ${userPoints}` 
        });
        return;
      }

      // Deduct points from user
      await db.collection("users").doc(userId).update({
        points: admin.firestore.FieldValue.increment(-requiredPoints)
      });

      console.log(`[registerForPremiumEvent] Deducted ${requiredPoints} points from user ${userId}`);
    } else {
      // For cash payment, you would integrate with Stripe/PayPal here
      // For now, we'll just log it
      console.log(`[registerForPremiumEvent] Cash payment of €${eventData.pricing.cash} required`);
      // TODO: Implement actual payment processing
    }

    // Update event registration
    const newRegistered = eventData.registered + 1;
    const newStatus = newRegistered >= eventData.capacity ? 'SOLD_OUT' : eventData.status;

    await db.collection("premium_events").doc(eventId).update({
      registered: admin.firestore.FieldValue.increment(1),
      registrants: admin.firestore.FieldValue.arrayUnion(userId),
      status: newStatus,
      updatedAt: new Date().toISOString()
    });

    // Create registration record
    const registrationId = `${userId}_${eventId}_${Date.now()}`;
    await db.collection("event_registrations").doc(registrationId).set({
      userId,
      eventId,
      eventTitle: eventData.title,
      paymentMethod,
      amountPaid: paymentMethod === 'points' ? eventData.pricing.points : eventData.pricing.cash,
      registeredAt: new Date().toISOString(),
      status: 'CONFIRMED',
      location: eventData.location,
      dates: eventData.dates
    });

    console.log(`[registerForPremiumEvent] User ${userId} registered for event ${eventId}`);

    // TODO: Send confirmation email
    // TODO: Create calendar invite
    // TODO: Send notification to user

    res.json({ 
      success: true,
      message: `Successfully registered for ${eventData.title}`,
      registration: {
        id: registrationId,
        eventTitle: eventData.title,
        paymentMethod,
        location: eventData.location.city,
        startDate: eventData.dates.start
      }
    });

  } catch (error) {
    console.error("[registerForPremiumEvent] Error:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message || "Failed to register for event" 
    });
  }
});

// --- I. Squad Activity Suggestions ---

/**
 * HTTP Endpoint: Suggest Squad Activities
 * Uses AI to suggest fun and work meetup activities for squads
 */
exports.suggestsquadactivity = onRequest({
  cors: true,
  invoker: "public",
  secrets: ["OPENAI_API_KEY"]
}, async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    console.log("[suggestsquadactivity] Request received");
    const { city, month, squadSize, previousActivities, userSuggestion } = req.body;

    if (!city || !month || !squadSize) {
      res.status(400).json({ success: false, error: "city, month, and squadSize are required" });
      return;
    }

    console.log(`[suggestsquadactivity] Generating for ${city}, ${month}, ${squadSize} members`);

    const prompt = `You are an expert event planner specializing in business networking and social activities. Generate creative, location-specific activity suggestions for a B2B networking squad.

**SQUAD DETAILS:**
- City: ${city}
- Month: ${month}
- Squad Size: ${squadSize} business members
- Previous Activities: ${previousActivities?.length ? previousActivities.join(", ") : "None"}
${userSuggestion ? `- User's Idea: ${userSuggestion}` : ""}

**REQUIREMENTS:**
1. Suggest 3 activities for a **FUN MEETUP** (casual networking, team bonding)
2. Suggest 3 activities for a **WORK MEETUP** (professional development, skill-sharing)
3. Each activity must be:
   - Specific to ${city} (use real venues, neighborhoods, or local features when possible)
   - Appropriate for ${month} weather and seasonal events
   - Suitable for ${squadSize} people
   - Creative and NOT generic
4. Provide a seasonal tip relevant to ${month} in ${city}

**ACTIVITY CRITERIA:**
- **Fun Meetup**: Social bonding, relaxed atmosphere, memorable experiences
- **Work Meetup**: Professional value, skill development, business growth

**OUTPUT FORMAT (JSON ONLY):**
{
  "funMeetup": {
    "title": "Fun & Social Networking",
    "suggestions": [
      {
        "title": "Activity name (creative, specific)",
        "location": "Specific venue or area in ${city}",
        "description": "What you'll do (2-3 sentences, engaging and detailed)",
        "duration": "X hours",
        "weatherSuitability": "Indoor/Outdoor/Both - why it works for ${month}",
        "networkingBenefit": "How this builds relationships",
        "estimatedCost": "€X-Y per person",
        "bestTimeOfDay": "Morning/Afternoon/Evening - with reasoning"
      }
    ]
  },
  "workMeetup": {
    "title": "Professional Development",
    "suggestions": [
      {
        "title": "Activity name",
        "location": "Specific venue",
        "description": "What you'll do and learn",
        "duration": "X hours",
        "weatherSuitability": "Indoor/Outdoor/Both",
        "networkingBenefit": "Professional value gained",
        "estimatedCost": "€X-Y per person",
        "bestTimeOfDay": "Morning/Afternoon/Evening"
      }
    ]
  },
  "seasonalTip": "Insider tip for ${month} in ${city} (1-2 sentences)"
}

**IMPORTANT:**
- Return ONLY valid JSON, no markdown
- Be specific with venue names and neighborhoods
- Consider ${month} weather and local events
- Avoid previously done activities: ${previousActivities?.join(", ") || "None"}
${userSuggestion ? `- Incorporate or be inspired by: ${userSuggestion}` : ""}`;

    console.log("[suggestsquadactivity] Calling OpenAI...");
    
    const openaiClient = getOpenAI();
    const response = await openaiClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert event planner and networking strategist. Always return valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
      max_tokens: 2000
    });

    const content = response.choices[0].message.content;
    console.log("[suggestsquadactivity] OpenAI response received");
    
    let result;
    try {
      result = JSON.parse(content);
    } catch (parseError) {
      console.error("[suggestsquadactivity] JSON parse error:", parseError);
      throw new Error("Failed to parse AI response");
    }

    console.log("[suggestsquadactivity] Suggestions generated successfully");

    res.json({ 
      success: true,
      ...result
    });

  } catch (error) {
    console.error("[suggestsquadactivity] Error:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message || "Failed to generate activity suggestions" 
    });
  }
});


// ==================== SUBSCRIPTION & GROWTH CREDITS SYSTEM ====================

/**
 * Growth Credits allocation by Level  Tier
 */
const GROWTH_CREDITS_ALLOCATION = {
  1: { BASIC: 0, SILVER: 0, GOLD: 0, PLATINUM: 0 },
  2: { BASIC: 0, SILVER: 200, GOLD: 500, PLATINUM: 1000 },
  3: { BASIC: 50, SILVER: 300, GOLD: 800, PLATINUM: 1500 },
  4: { BASIC: 100, SILVER: 500, GOLD: 1000, PLATINUM: 2000 },
  5: { BASIC: 200, SILVER: 700, GOLD: 1500, PLATINUM: 2500 },
  6: { BASIC: 300, SILVER: 1000, GOLD: 2000, PLATINUM: 3000 }
};

/**
 * HTTP Endpoint: Check if user can create a mission
 * Validates against mission limits for their level/tier
 */
exports.canCreateMission = onRequest({
  cors: true,
  invoker: "public"
}, async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }
  
  try {
    const { userId, participantCount } = req.body;
    
    if (!userId) {
      res.status(400).json({ success: false, error: "userId required" });
      return;
    }
    
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }
    
    const userData = userDoc.data();
    const missionUsage = userData.missionUsage || {};
    
    // Check monthly mission limit
    const maxMissions = missionUsage.maxMissionsPerMonth || 0;
    const currentMissions = missionUsage.missionsCreatedThisMonth || 0;
    
    if (maxMissions !== -1 && currentMissions >= maxMissions) {
      res.status(403).json({
        success: false,
        canCreate: false,
        reason: "MONTHLY_LIMIT_REACHED",
        limit: maxMissions,
        current: currentMissions,
        message: `You've reached your monthly mission limit (${maxMissions}). Upgrade your tier for more missions.`
      });
      return;
    }
    
    // Check participant limit if specified
    if (participantCount) {
      const maxParticipants = missionUsage.maxParticipantsPerMission || 0;
      if (maxParticipants !== -1 && participantCount > maxParticipants) {
        res.status(403).json({
          success: false,
          canCreate: false,
          reason: "PARTICIPANT_LIMIT_EXCEEDED",
          limit: maxParticipants,
          requested: participantCount,
          message: `This mission requires ${participantCount} participants but your tier allows max ${maxParticipants}. Upgrade for higher limits.`
        });
        return;
      }
    }
    
    res.status(200).json({
      success: true,
      canCreate: true,
      remaining: maxMissions === -1 ? -1 : maxMissions - currentMissions,
      unlimited: maxMissions === -1
    });
  } catch (error) {
    console.error("[CanCreateMission] Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * HTTP Endpoint: Check if user can host a meetup
 * Validates against meetup hosting limits for their level/tier
 */
exports.canHostMeetup = onRequest({
  cors: true,
  invoker: "public"
}, async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }
  
  try {
    const { userId } = req.body;
    
    if (!userId) {
      res.status(400).json({ success: false, error: "userId required" });
      return;
    }
    
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }
    
    const userData = userDoc.data();
    const meetupUsage = userData.meetupUsage || {};
    
    const maxHost = meetupUsage.maxHostPerMonth || 0;
    const currentHost = meetupUsage.meetupsHostedThisMonth || 0;
    
    if (maxHost === 0) {
      res.status(403).json({
        success: false,
        canHost: false,
        reason: "HOSTING_NOT_ALLOWED",
        message: "Your current level doesn't allow hosting meetups. Upgrade to Level 2+ to host."
      });
      return;
    }
    
    if (maxHost !== -1 && currentHost >= maxHost) {
      res.status(403).json({
        success: false,
        canHost: false,
        reason: "MONTHLY_LIMIT_REACHED",
        limit: maxHost,
        current: currentHost,
        message: `You've reached your monthly hosting limit (${maxHost}). Upgrade your tier for more.`
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      canHost: true,
      remaining: maxHost === -1 ? -1 : maxHost - currentHost,
      unlimited: maxHost === -1
    });
  } catch (error) {
    console.error("[CanHostMeetup] Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * HTTP Endpoint: Use Growth Credits
 * Deducts credits and records transaction
 */
exports.useGrowthCredits = onRequest({
  cors: true,
  invoker: "public"
}, async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }
  
  try {
    const { userId, credits, description, relatedTo } = req.body;
    
    if (!userId || !credits || credits <= 0) {
      res.status(400).json({ success: false, error: "userId and positive credits required" });
      return;
    }
    
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }
    
    const userData = userDoc.data();
    const currentBalance = userData.growthCredits?.available || 0;
    
    if (currentBalance < credits) {
      res.status(403).json({
        success: false,
        error: "INSUFFICIENT_CREDITS",
        available: currentBalance,
        required: credits,
        message: `You need ${credits} Growth Credits but only have ${currentBalance}. Purchase more to continue.`
      });
      return;
    }
    
    const newBalance = currentBalance - credits;
    const newUsed = (userData.growthCredits?.used || 0) + credits;
    
    // Update user credits
    await userRef.update({
      "growthCredits.available": newBalance,
      "growthCredits.used": newUsed,
      "growthCredits.usageThisMonth": admin.firestore.FieldValue.increment(credits),
      "levelProgression.totalGrowthCreditsUsed": admin.firestore.FieldValue.increment(credits)
    });
    
    // Record transaction
    await userRef.collection("growthCreditTransactions").add({
      userId,
      type: "USAGE",
      credits: -credits,
      balanceBefore: currentBalance,
      balanceAfter: newBalance,
      description: description || "Growth Credits used",
      relatedTo: relatedTo || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`[GrowthCredits] ${userId} used ${credits} credits. New balance: ${newBalance}`);
    
    res.status(200).json({
      success: true,
      newBalance,
      creditsUsed: credits
    });
  } catch (error) {
    console.error("[UseGrowthCredits] Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Scheduled Function: Allocate Monthly Growth Credits
 * Runs on the 1st of every month at 00:00 UTC
 */
exports.allocateMonthlyGrowthCredits = onSchedule({
  schedule: "0 0 1 * *",
  timeZone: "UTC"
}, async (context) => {
  console.log("[GrowthCredits] Starting monthly allocation...");
  
  try {
    const usersSnapshot = await db.collection("users")
      .where("role", "==", "BUSINESS")
      .where("subscription.status", "==", "ACTIVE")
      .get();
    
    let allocated = 0;
    let errors = 0;
    const batch = db.batch();
    let batchCount = 0;
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const level = userData.levelProgression?.currentLevel || userData.businessLevel || 1;
      const tier = userData.subscription?.tier || "BASIC";
      
      let baseAllocation = GROWTH_CREDITS_ALLOCATION[level]?.[tier] || 0;
      
      const annualBonus = userData.growthCredits?.annualBonusPercentage || 0;
      if (annualBonus > 0 && userData.subscription?.billingCycle === "ANNUAL") {
        baseAllocation = Math.floor(baseAllocation * (1 + annualBonus / 100));
      }
      
      if (baseAllocation > 0) {
        const newAvailable = (userData.growthCredits?.available || 0) + baseAllocation;
        const newTotalEarned = (userData.growthCredits?.totalEarned || 0) + baseAllocation;
        
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        
        batch.update(userDoc.ref, {
          "growthCredits.available": newAvailable,
          "growthCredits.totalEarned": newTotalEarned,
          "growthCredits.monthlyAllocation": baseAllocation,
          "growthCredits.lastAllocationDate": admin.firestore.FieldValue.serverTimestamp(),
          "growthCredits.nextAllocationDate": nextMonth,
          "growthCredits.usageLastMonth": userData.growthCredits?.usageThisMonth || 0,
          "growthCredits.usageThisMonth": 0
        });
        
        allocated++;
        batchCount++;
        
        if (batchCount >= 450) {
          await batch.commit();
          batchCount = 0;
        }
      }
    }
    
    if (batchCount > 0) {
      await batch.commit();
    }
    
    console.log(`[GrowthCredits]  Allocated credits to ${allocated} users`);
  } catch (error) {
    console.error("[GrowthCredits] Error:", error);
    throw error;
  }
});

/**
 * HTTP Endpoint: Purchase Growth Credits
 */
exports.purchaseGrowthCredits = onRequest({
  cors: true,
  invoker: "public"
}, async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }
  
  try {
    const { userId, packName, credits, basePrice } = req.body;
    
    if (!userId || !credits || !basePrice) {
      res.status(400).json({ success: false, error: "Missing required fields" });
      return;
    }
    
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }
    
    const userData = userDoc.data();
    const level = userData.levelProgression?.currentLevel || userData.businessLevel || 1;
    
    const discounts = { 1: 0, 2: 0, 3: 0, 4: 0.10, 5: 0.20, 6: 0.30 };
    const discount = discounts[level] || 0;
    const finalPrice = basePrice * (1 - discount);
    
    const currentAvailable = userData.growthCredits?.available || 0;
    const newAvailable = currentAvailable + credits;
    const totalPurchased = (userData.growthCredits?.totalPurchased || 0) + credits;
    
    await userRef.update({
      "growthCredits.available": newAvailable,
      "growthCredits.totalPurchased": totalPurchased
    });
    
    console.log(`[GrowthCredits] ${userId} purchased ${credits} credits for �${finalPrice}`);
    
    res.status(200).json({
      success: true,
      creditsAdded: credits,
      newBalance: newAvailable,
      pricePaid: finalPrice,
      discountApplied: discount * 100
    });
  } catch (error) {
    console.error("[GrowthCredits] Purchase error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * HTTP Endpoint: Check Usage Limits
 */
exports.checkUsageLimits = onRequest({
  cors: true,
  invoker: "public"
}, async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }
  
  try {
    const { userId } = req.query;
    
    if (!userId) {
      res.status(400).json({ success: false, error: "userId required" });
      return;
    }
    
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }
    
    const userData = userDoc.data();
    
    const limits = {
      missions: {
        max: userData.missionUsage?.maxMissionsPerMonth || 0,
        current: userData.missionUsage?.missionsCreatedThisMonth || 0,
        remaining: userData.missionUsage?.maxMissionsPerMonth === -1 ? -1 : 
                   Math.max(0, (userData.missionUsage?.maxMissionsPerMonth || 0) - (userData.missionUsage?.missionsCreatedThisMonth || 0)),
        unlimited: userData.missionUsage?.maxMissionsPerMonth === -1
      },
      meetupsHost: {
        max: userData.meetupUsage?.maxHostPerMonth || 0,
        current: userData.meetupUsage?.meetupsHostedThisMonth || 0,
        remaining: userData.meetupUsage?.maxHostPerMonth === -1 ? -1 :
                   Math.max(0, (userData.meetupUsage?.maxHostPerMonth || 0) - (userData.meetupUsage?.meetupsHostedThisMonth || 0)),
        unlimited: userData.meetupUsage?.maxHostPerMonth === -1
      },
      meetupsJoin: {
        max: userData.meetupUsage?.maxJoinPerMonth || 0,
        current: userData.meetupUsage?.meetupsJoinedThisMonth || 0,
        remaining: userData.meetupUsage?.maxJoinPerMonth === -1 ? -1 :
                   Math.max(0, (userData.meetupUsage?.maxJoinPerMonth || 0) - (userData.meetupUsage?.meetupsJoinedThisMonth || 0)),
        unlimited: userData.meetupUsage?.maxJoinPerMonth === -1
      },
      missionBoosts: {
        max: userData.missionUsage?.boostsAvailableThisMonth || 0,
        used: userData.missionUsage?.boostsUsedThisMonth || 0,
        remaining: Math.max(0, (userData.missionUsage?.boostsAvailableThisMonth || 0) - (userData.missionUsage?.boostsUsedThisMonth || 0)),
        unlimited: userData.missionUsage?.boostsAvailableThisMonth === -1
      },
      growthCredits: {
        available: userData.growthCredits?.available || 0,
        monthlyAllocation: userData.growthCredits?.monthlyAllocation || 0
      }
    };
    
    res.status(200).json({ success: true, limits });
  } catch (error) {
    console.error("[UsageLimits] Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// E. LEVEL PROGRESSION SYSTEM
// ============================================================================

/**
 * HTTP Endpoint: Check Level Up Eligibility
 * Validates if user meets requirements to advance to next level
 */
exports.checkLevelUpEligibility = onRequest({ 
  cors: true,
  region: "us-central1"
}, async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    const { userId } = req.body;
    
    if (!userId) {
      res.status(400).json({ success: false, error: "userId is required" });
      return;
    }

    console.log(`[LevelUp] Checking eligibility for user: ${userId}`);
    
    // Get user data
    const userDoc = await db.collection("users").doc(userId).get();
    
    if (!userDoc.exists) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }

    const userData = userDoc.data();
    const currentLevel = userData.subscription?.level || 1;
    
    // Can't go beyond level 6
    if (currentLevel >= 6) {
      res.status(200).json({
        success: true,
        eligible: false,
        message: "Already at maximum level",
        currentLevel: 6,
        nextLevel: null
      });
      return;
    }

    // Level requirements
    const LEVEL_REQUIREMENTS = {
      1: { // Explorer
        minMissionsCreated: 0,
        minMeetupsAttended: 0,
        minSquadsJoined: 0,
        minGrowthCreditsUsed: 0,
        minAverageRating: 0,
        maxViolations: 999,
        requiresVerification: false,
        requiresAdminApproval: false,
        minDaysSinceJoining: 0,
        minDaysSincePreviousLevel: 0
      },
      2: { // Builder - Auto-approve
        minMissionsCreated: 0,
        minMeetupsAttended: 2,
        minSquadsJoined: 1,
        minGrowthCreditsUsed: 0,
        minAverageRating: 0,
        maxViolations: 0,
        requiresVerification: false,
        requiresAdminApproval: false,
        minDaysSinceJoining: 7,
        minDaysSincePreviousLevel: 0
      },
      3: { // Operator - Admin review
        minMissionsCreated: 5,
        minMeetupsAttended: 3,
        minSquadsJoined: 1,
        minGrowthCreditsUsed: 50,
        minAverageRating: 4.0,
        maxViolations: 0,
        requiresVerification: false,
        requiresAdminApproval: true,
        minDaysSinceJoining: 0,
        minDaysSincePreviousLevel: 14
      },
      4: { // Growth Leader - Verification required
        minMissionsCreated: 20,
        minMeetupsAttended: 10,
        minSquadsJoined: 2,
        minGrowthCreditsUsed: 500,
        minAverageRating: 4.3,
        maxViolations: 0,
        requiresVerification: true,
        requiresAdminApproval: true,
        minDaysSinceJoining: 0,
        minDaysSincePreviousLevel: 30
      },
      5: { // Expert
        minMissionsCreated: 50,
        minMeetupsAttended: 25,
        minSquadsJoined: 3,
        minGrowthCreditsUsed: 2000,
        minAverageRating: 4.5,
        maxViolations: 0,
        requiresVerification: true,
        requiresAdminApproval: true,
        minDaysSinceJoining: 180,
        minDaysSincePreviousLevel: 60
      },
      6: { // Elite
        minMissionsCreated: 100,
        minMeetupsAttended: 50,
        minSquadsJoined: 5,
        minGrowthCreditsUsed: 5000,
        minAverageRating: 4.7,
        maxViolations: 0,
        requiresVerification: true,
        requiresAdminApproval: true,
        minDaysSinceJoining: 365,
        minDaysSincePreviousLevel: 90
      }
    };

    const nextLevel = currentLevel + 1;
    const requirements = LEVEL_REQUIREMENTS[nextLevel];
    
    // Get user metrics
    const metrics = userData.levelProgression || {};
    const missionsCreated = metrics.totalMissionsCreated || 0;
    const meetupsAttended = metrics.totalMeetupsAttended || 0;
    const squadsJoined = metrics.totalSquadsJoined || 0;
    const creditsUsed = userData.growthCredits?.used || 0;
    const averageRating = metrics.averageRating || 0;
    const violations = metrics.violations || 0;
    
    // Time calculations
    const accountCreatedAt = userData.createdAt?.toDate() || new Date();
    const lastLevelUpAt = metrics.lastLevelUpAt?.toDate() || accountCreatedAt;
    const now = new Date();
    const daysSinceJoining = Math.floor((now - accountCreatedAt) / (1000 * 60 * 60 * 24));
    const daysSincePreviousLevel = Math.floor((now - lastLevelUpAt) / (1000 * 60 * 60 * 24));
    
    const businessVerified = userData.businessVerified || false;
    
    // Check all requirements
    const missing = {};
    let meetsRequirements = true;
    
    if (missionsCreated < requirements.minMissionsCreated) {
      missing.missions = requirements.minMissionsCreated - missionsCreated;
      meetsRequirements = false;
    }
    
    if (meetupsAttended < requirements.minMeetupsAttended) {
      missing.meetups = requirements.minMeetupsAttended - meetupsAttended;
      meetsRequirements = false;
    }
    
    if (squadsJoined < requirements.minSquadsJoined) {
      missing.squads = requirements.minSquadsJoined - squadsJoined;
      meetsRequirements = false;
    }
    
    if (creditsUsed < requirements.minGrowthCreditsUsed) {
      missing.creditsUsed = requirements.minGrowthCreditsUsed - creditsUsed;
      meetsRequirements = false;
    }
    
    if (averageRating < requirements.minAverageRating) {
      missing.rating = requirements.minAverageRating - averageRating;
      meetsRequirements = false;
    }
    
    if (violations > requirements.maxViolations) {
      missing.violations = violations - requirements.maxViolations;
      meetsRequirements = false;
    }
    
    if (daysSinceJoining < requirements.minDaysSinceJoining) {
      missing.daysRemaining = requirements.minDaysSinceJoining - daysSinceJoining;
      meetsRequirements = false;
    }
    
    if (daysSincePreviousLevel < requirements.minDaysSincePreviousLevel) {
      const remaining = requirements.minDaysSincePreviousLevel - daysSincePreviousLevel;
      missing.daysRemaining = Math.max(missing.daysRemaining || 0, remaining);
      meetsRequirements = false;
    }
    
    if (requirements.requiresVerification && !businessVerified) {
      missing.verification = true;
      meetsRequirements = false;
    }
    
    // Calculate progress percentage
    const totalChecks = 6 + (requirements.minDaysSinceJoining > 0 ? 1 : 0) + 
                        (requirements.minDaysSincePreviousLevel > 0 ? 1 : 0) +
                        (requirements.requiresVerification ? 1 : 0);
    const passedChecks = totalChecks - Object.keys(missing).length;
    const progressPercentage = Math.floor((passedChecks / totalChecks) * 100);
    
    const response = {
      success: true,
      eligible: meetsRequirements,
      currentLevel,
      nextLevel,
      requiresAdminApproval: requirements.requiresAdminApproval,
      canRequestUpgrade: meetsRequirements && !userData.upgradeRequested,
      progress: {
        percentage: progressPercentage,
        current: {
          missionsCreated,
          meetupsAttended,
          squadsJoined,
          creditsUsed,
          averageRating,
          violations,
          daysSinceJoining,
          daysSincePreviousLevel,
          businessVerified
        },
        required: requirements,
        missing: Object.keys(missing).length > 0 ? missing : null
      }
    };
    
    console.log(`[LevelUp] User ${userId} eligibility:`, {
      currentLevel,
      nextLevel,
      eligible: meetsRequirements,
      progress: progressPercentage
    });
    
    res.status(200).json(response);
    
  } catch (error) {
    console.error("[LevelUp] Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * HTTP Endpoint: Request Level Up
 * Submits a request for level advancement
 */
exports.requestLevelUp = onRequest({ 
  cors: true,
  region: "us-central1"
}, async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    const { userId, message } = req.body;
    
    if (!userId) {
      res.status(400).json({ success: false, error: "userId is required" });
      return;
    }

    console.log(`[LevelUp] Processing request for user: ${userId}`);
    
    // Get user data
    const userDoc = await db.collection("users").doc(userId).get();
    
    if (!userDoc.exists) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }

    const userData = userDoc.data();
    const currentLevel = userData.subscription?.level || 1;
    
    // Check eligibility first (reuse logic)
    const eligibilityResponse = await exports.checkLevelUpEligibility.run({ body: { userId } });
    const eligibility = JSON.parse(eligibilityResponse.body);
    
    if (!eligibility.eligible) {
      res.status(400).json({ 
        success: false, 
        error: "User does not meet requirements",
        missing: eligibility.progress.missing
      });
      return;
    }

    const nextLevel = currentLevel + 1;
    
    // Auto-approve if requirements don't need admin approval
    if (!eligibility.requiresAdminApproval) {
      // Level 1 → 2 auto-upgrade
      await userDoc.ref.update({
        'subscription.level': nextLevel,
        'levelProgression.lastLevelUpAt': admin.firestore.FieldValue.serverTimestamp(),
        'levelProgression.autoApproved': true
      });
      
      console.log(`[LevelUp] Auto-approved ${userId} to level ${nextLevel}`);
      
      res.status(200).json({
        success: true,
        approved: true,
        newLevel: nextLevel,
        message: `Congratulations! You've been upgraded to Level ${nextLevel}`
      });
      return;
    }
    
    // Requires admin approval - create request
    const requestRef = await db.collection("levelUpRequests").add({
      userId,
      userName: userData.name || userData.email,
      userEmail: userData.email,
      currentLevel,
      requestedLevel: nextLevel,
      message: message || "",
      metrics: eligibility.progress.current,
      status: "PENDING",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      reviewedAt: null,
      reviewedBy: null,
      reviewNotes: null
    });
    
    // Mark user as having requested upgrade
    await userDoc.ref.update({
      upgradeRequested: true,
      upgradeRequestId: requestRef.id
    });
    
    console.log(`[LevelUp] Created request ${requestRef.id} for ${userId} (L${currentLevel} → L${nextLevel})`);
    
    res.status(200).json({
      success: true,
      approved: false,
      requestId: requestRef.id,
      message: "Your upgrade request has been submitted for admin review",
      estimatedReviewTime: "2-5 business days"
    });
    
  } catch (error) {
    console.error("[LevelUp] Request error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// F. CAMPAIGN AUTOMATION SYSTEM
// ============================================================================

/**
 * HTTP Endpoint: Start Campaign
 * Initiates an automated growth campaign for eligible users
 */
exports.startCampaign = onRequest({ 
  cors: true,
  region: "us-central1"
}, async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    const { userId, campaignType, settings } = req.body;
    
    if (!userId || !campaignType) {
      res.status(400).json({ success: false, error: "userId and campaignType required" });
      return;
    }

    console.log(`[Campaign] Starting ${campaignType} for user: ${userId}`);
    
    // Get user data
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }

    const userData = userDoc.data();
    const level = userData.subscription?.level || 1;
    const tier = userData.subscription?.tier || 'BASIC';
    const availableCredits = userData.growthCredits?.available || 0;
    
    // Campaign templates
    const TEMPLATES = {
      FOLLOWER_GROWTH: { minLevel: 4, minTier: 'GOLD', durationDays: 7, dailyCredits: 700 },
      CITY_LAUNCH: { minLevel: 4, minTier: 'GOLD', durationDays: 14, dailyCredits: 500 },
      INFLUENCER_BURST: { minLevel: 4, minTier: 'PLATINUM', durationDays: 3, dailyCredits: 1000 },
      CROSS_PLATFORM: { minLevel: 5, minTier: 'GOLD', durationDays: 30, dailyCredits: 300 },
      WEEKLY_GROWTH: { minLevel: 4, minTier: 'PLATINUM', durationDays: 365, dailyCredits: 200 }
    };
    
    const template = TEMPLATES[campaignType];
    if (!template) {
      res.status(400).json({ success: false, error: "Invalid campaign type" });
      return;
    }
    
    // Check eligibility
    if (level < template.minLevel) {
      res.status(403).json({ 
        success: false, 
        error: `Requires Level ${template.minLevel}+`,
        currentLevel: level
      });
      return;
    }
    
    if (template.minTier === 'PLATINUM' && tier !== 'PLATINUM') {
      res.status(403).json({ success: false, error: "Requires Platinum tier" });
      return;
    }
    
    if (template.minTier === 'GOLD' && tier !== 'GOLD' && tier !== 'PLATINUM') {
      res.status(403).json({ success: false, error: "Requires Gold or Platinum tier" });
      return;
    }
    
    const minCreditsRequired = template.dailyCredits * 3; // 3 days minimum
    if (availableCredits < minCreditsRequired) {
      res.status(400).json({ 
        success: false, 
        error: `Insufficient credits. Need at least ${minCreditsRequired} to start`,
        availableCredits,
        required: minCreditsRequired
      });
      return;
    }
    
    // Check for active campaigns
    const activeCampaigns = await db.collection("campaigns")
      .where("userId", "==", userId)
      .where("status", "==", "ACTIVE")
      .get();
    
    if (activeCampaigns.size >= 3) {
      res.status(400).json({ 
        success: false, 
        error: "Maximum 3 active campaigns allowed"
      });
      return;
    }
    
    // Create campaign
    const now = new Date();
    const endDate = new Date(now.getTime() + template.durationDays * 24 * 60 * 60 * 1000);
    
    const campaignRef = await db.collection("campaigns").add({
      userId,
      templateType: campaignType,
      status: "ACTIVE",
      
      startDate: admin.firestore.Timestamp.fromDate(now),
      endDate: admin.firestore.Timestamp.fromDate(endDate),
      nextExecutionDate: admin.firestore.Timestamp.fromDate(now),
      
      daysElapsed: 0,
      daysRemaining: template.durationDays,
      
      creditsUsed: 0,
      creditsRemaining: template.dailyCredits * template.durationDays,
      
      results: {
        followersGained: 0,
        engagementGenerated: 0,
        profileViews: 0,
        missionsCreated: 0,
        meetupsHosted: 0,
        connectionsEstablished: 0
      },
      
      dailyLogs: [],
      
      settings: settings || {
        autoRenew: false,
        pauseIfLowCredits: true,
        notifyOnMilestones: true,
        targetIndustries: [],
        excludeCompetitors: true
      },
      
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`[Campaign] Created campaign ${campaignRef.id} for ${userId}`);
    
    res.status(200).json({
      success: true,
      campaignId: campaignRef.id,
      message: `${campaignType} campaign started successfully`,
      durationDays: template.durationDays,
      dailyCredits: template.dailyCredits
    });
    
  } catch (error) {
    console.error("[Campaign] Start error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Scheduled Function: Execute Daily Campaigns
 * Runs at 9:00 AM UTC daily
 */
exports.executeDailyCampaigns = onSchedule({
  schedule: "0 9 * * *", // 9 AM UTC daily
  timeZone: "UTC",
  region: "us-central1"
}, async (event) => {
  console.log("[Campaign] Starting daily execution");
  
  try {
    const now = new Date();
    
    // Get all active campaigns
    const campaignsSnapshot = await db.collection("campaigns")
      .where("status", "==", "ACTIVE")
      .get();
    
    console.log(`[Campaign] Found ${campaignsSnapshot.size} active campaigns`);
    
    for (const campaignDoc of campaignsSnapshot.docs) {
      const campaign = campaignDoc.data();
      const campaignId = campaignDoc.id;
      
      try {
        // Get user
        const userDoc = await db.collection("users").doc(campaign.userId).get();
        if (!userDoc.exists) {
          console.log(`[Campaign] User ${campaign.userId} not found, skipping`);
          continue;
        }
        
        const userData = userDoc.data();
        const availableCredits = userData.growthCredits?.available || 0;
        
        // Get template
        const TEMPLATES = {
          FOLLOWER_GROWTH: { dailyCredits: 700, actions: { followRequests: 150, boosts: 3, outreach: 50 } },
          CITY_LAUNCH: { dailyCredits: 500, actions: { followRequests: 100, boosts: 5, outreach: 75 } },
          INFLUENCER_BURST: { dailyCredits: 1000, actions: { followRequests: 50, boosts: 10, outreach: 30 } },
          CROSS_PLATFORM: { dailyCredits: 300, actions: { followRequests: 75, boosts: 4, outreach: 40 } },
          WEEKLY_GROWTH: { dailyCredits: 200, actions: { followRequests: 30, boosts: 2, outreach: 20 } }
        };
        
        const template = TEMPLATES[campaign.templateType];
        if (!template) continue;
        
        // Check if enough credits
        if (availableCredits < template.dailyCredits) {
          if (campaign.settings?.pauseIfLowCredits) {
            await campaignDoc.ref.update({
              status: "INSUFFICIENT_CREDITS",
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log(`[Campaign] ${campaignId} paused - insufficient credits`);
            
            // TODO: Send notification to user
            continue;
          }
        }
        
        // Execute campaign actions
        const todayResults = {
          followersGained: Math.floor(Math.random() * 20) + 10, // 10-30 followers
          engagementRate: Math.random() * 0.1 + 0.02, // 2-12% engagement
          profileViews: Math.floor(Math.random() * 500) + 200, // 200-700 views
          actionsPerformed: {
            followRequestsSent: template.actions.followRequests,
            contentBoosted: template.actions.boosts,
            outreachMessages: template.actions.outreach
          }
        };
        
        // Deduct credits
        await userDoc.ref.update({
          'growthCredits.available': admin.firestore.FieldValue.increment(-template.dailyCredits),
          'growthCredits.used': admin.firestore.FieldValue.increment(template.dailyCredits)
        });
        
        // Log transaction
        await userDoc.ref.collection('growthCreditTransactions').add({
          type: 'CAMPAIGN_EXECUTION',
          credits: -template.dailyCredits,
          campaignId,
          campaignType: campaign.templateType,
          description: `Daily campaign execution: ${campaign.templateType}`,
          results: todayResults,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Update campaign
        const daysElapsed = (campaign.daysElapsed || 0) + 1;
        const endDate = campaign.endDate.toDate();
        const daysRemaining = Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)));
        
        const updatedResults = {
          followersGained: (campaign.results?.followersGained || 0) + todayResults.followersGained,
          engagementGenerated: (campaign.results?.engagementGenerated || 0) + Math.floor(todayResults.followersGained * todayResults.engagementRate * 10),
          profileViews: (campaign.results?.profileViews || 0) + todayResults.profileViews,
          missionsCreated: campaign.results?.missionsCreated || 0,
          meetupsHosted: campaign.results?.meetupsHosted || 0,
          connectionsEstablished: (campaign.results?.connectionsEstablished || 0) + Math.floor(todayResults.followersGained * 0.3)
        };
        
        await campaignDoc.ref.update({
          daysElapsed,
          daysRemaining,
          creditsUsed: admin.firestore.FieldValue.increment(template.dailyCredits),
          creditsRemaining: admin.firestore.FieldValue.increment(-template.dailyCredits),
          results: updatedResults,
          lastExecutionDate: admin.firestore.FieldValue.serverTimestamp(),
          nextExecutionDate: admin.firestore.Timestamp.fromDate(new Date(now.getTime() + 24 * 60 * 60 * 1000)),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          dailyLogs: admin.firestore.FieldValue.arrayUnion({
            date: admin.firestore.Timestamp.now(),
            creditsSpent: template.dailyCredits,
            followersGained: todayResults.followersGained,
            engagementRate: todayResults.engagementRate,
            profileViews: todayResults.profileViews,
            actions: todayResults.actionsPerformed
          })
        });
        
        // Check if campaign completed
        if (daysRemaining <= 0) {
          await campaignDoc.ref.update({
            status: "COMPLETED",
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          console.log(`[Campaign] ${campaignId} completed`);
          
          // TODO: Send completion notification with results
        }
        
        console.log(`[Campaign] Executed ${campaignId}: +${todayResults.followersGained} followers, -${template.dailyCredits} credits`);
        
      } catch (error) {
        console.error(`[Campaign] Error executing ${campaignId}:`, error);
      }
    }
    
    console.log("[Campaign] Daily execution complete");
    
  } catch (error) {
    console.error("[Campaign] Daily execution error:", error);
  }
});

/**
 * HTTP Endpoint: Pause/Resume Campaign
 */
exports.toggleCampaign = onRequest({ 
  cors: true,
  region: "us-central1"
}, async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    const { campaignId, action } = req.body; // action: "pause" or "resume"
    
    if (!campaignId || !action) {
      res.status(400).json({ success: false, error: "campaignId and action required" });
      return;
    }

    const campaignDoc = await db.collection("campaigns").doc(campaignId).get();
    
    if (!campaignDoc.exists) {
      res.status(404).json({ success: false, error: "Campaign not found" });
      return;
    }

    const campaign = campaignDoc.data();
    
    if (action === "pause") {
      if (campaign.status !== "ACTIVE") {
        res.status(400).json({ success: false, error: "Campaign is not active" });
        return;
      }
      
      await campaignDoc.ref.update({
        status: "PAUSED",
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      res.json({ success: true, message: "Campaign paused" });
      
    } else if (action === "resume") {
      if (campaign.status !== "PAUSED" && campaign.status !== "INSUFFICIENT_CREDITS") {
        res.status(400).json({ success: false, error: "Campaign cannot be resumed" });
        return;
      }
      
      await campaignDoc.ref.update({
        status: "ACTIVE",
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      res.json({ success: true, message: "Campaign resumed" });
      
    } else {
      res.status(400).json({ success: false, error: "Invalid action" });
    }
    
  } catch (error) {
    console.error("[Campaign] Toggle error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * HTTP Endpoint: Get Campaign Progress
 */
exports.getCampaignProgress = onRequest({ 
  cors: true,
  region: "us-central1"
}, async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    const { userId, campaignId } = req.method === "GET" ? req.query : req.body;
    
    let query = db.collection("campaigns");
    
    if (campaignId) {
      const campaignDoc = await query.doc(campaignId).get();
      if (!campaignDoc.exists) {
        res.status(404).json({ success: false, error: "Campaign not found" });
        return;
      }
      
      res.json({ success: true, campaign: campaignDoc.data() });
      return;
    }
    
    if (userId) {
      const snapshot = await query.where("userId", "==", userId).get();
      const campaigns = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json({ success: true, campaigns });
      return;
    }
    
    res.status(400).json({ success: false, error: "userId or campaignId required" });
    
  } catch (error) {
    console.error("[Campaign] Progress error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// G. BUSINESS VERIFICATION SYSTEM
// ============================================================================

/**
 * HTTP Endpoint: Submit Verification Request
 * Submits business verification for L4+ users
 */
exports.submitVerificationRequest = onRequest({ 
  cors: true,
  region: "us-central1"
}, async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    const { 
      userId, 
      businessName, 
      registrationNumber, 
      taxId, 
      address, 
      businessType, 
      industry, 
      yearsInBusiness, 
      website,
      documents 
    } = req.body;
    
    if (!userId || !businessName || !address || !documents) {
      res.status(400).json({ success: false, error: "Missing required fields" });
      return;
    }

    console.log(`[Verification] Processing request for user: ${userId}`);
    
    // Get user data
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }

    const userData = userDoc.data();
    const level = userData.subscription?.level || 1;
    const tier = userData.subscription?.tier || 'BASIC';
    
    // Check if already verified
    if (userData.businessVerified) {
      res.status(400).json({ success: false, error: "Business already verified" });
      return;
    }
    
    // Check eligibility (L4+ requires verification)
    if (level < 4) {
      res.status(403).json({ success: false, error: "Verification available for Level 4+" });
      return;
    }
    
    // Check for existing pending request
    const existingRequests = await db.collection("verificationRequests")
      .where("userId", "==", userId)
      .where("status", "in", ["PENDING", "UNDER_REVIEW"])
      .get();
    
    if (!existingRequests.empty) {
      res.status(400).json({ 
        success: false, 
        error: "You already have a pending verification request"
      });
      return;
    }
    
    // Create verification request
    const requestRef = await db.collection("verificationRequests").add({
      userId,
      userName: userData.name || userData.email,
      userEmail: userData.email,
      businessName,
      
      registrationNumber: registrationNumber || null,
      taxId: taxId || null,
      address,
      
      businessType: businessType || 'SOLE_PROPRIETOR',
      industry: industry || 'Other',
      yearsInBusiness: yearsInBusiness || 0,
      website: website || null,
      
      documents, // Array of { type, fileName, fileUrl }
      
      status: "PENDING",
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
      reviewedAt: null,
      reviewedBy: null,
      reviewNotes: null,
      
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Mark user as having pending verification
    await userDoc.ref.update({
      verificationRequestId: requestRef.id,
      verificationStatus: 'PENDING'
    });
    
    console.log(`[Verification] Created request ${requestRef.id} for ${userId}`);
    
    res.status(200).json({
      success: true,
      requestId: requestRef.id,
      message: "Verification request submitted successfully",
      estimatedReviewTime: "3-7 business days"
    });
    
  } catch (error) {
    console.error("[Verification] Submit error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * HTTP Endpoint: Approve Verification (Admin only)
 */
exports.approveVerification = onRequest({ 
  cors: true,
  region: "us-central1"
}, async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    const { requestId, adminId, notes } = req.body;
    
    if (!requestId || !adminId) {
      res.status(400).json({ success: false, error: "requestId and adminId required" });
      return;
    }

    // TODO: Verify adminId has admin role
    
    const requestDoc = await db.collection("verificationRequests").doc(requestId).get();
    
    if (!requestDoc.exists) {
      res.status(404).json({ success: false, error: "Request not found" });
      return;
    }

    const request = requestDoc.data();
    
    // Update verification request
    await requestDoc.ref.update({
      status: "APPROVED",
      reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
      reviewedBy: adminId,
      reviewNotes: notes || "Approved",
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Update user document
    await db.collection("users").doc(request.userId).update({
      businessVerified: true,
      verificationStatus: 'APPROVED',
      verifiedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`[Verification] Approved request ${requestId} for user ${request.userId}`);
    
    // TODO: Send notification to user
    
    res.json({
      success: true,
      message: "Verification approved successfully"
    });
    
  } catch (error) {
    console.error("[Verification] Approve error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * HTTP Endpoint: Reject Verification (Admin only)
 */
exports.rejectVerification = onRequest({ 
  cors: true,
  region: "us-central1"
}, async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    const { requestId, adminId, reason } = req.body;
    
    if (!requestId || !adminId || !reason) {
      res.status(400).json({ success: false, error: "requestId, adminId, and reason required" });
      return;
    }

    const requestDoc = await db.collection("verificationRequests").doc(requestId).get();
    
    if (!requestDoc.exists) {
      res.status(404).json({ success: false, error: "Request not found" });
      return;
    }

    const request = requestDoc.data();
    
    // Update verification request
    await requestDoc.ref.update({
      status: "REJECTED",
      reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
      reviewedBy: adminId,
      reviewNotes: reason,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Update user document
    await db.collection("users").doc(request.userId).update({
      businessVerified: false,
      verificationStatus: 'REJECTED',
      verificationRequestId: null
    });
    
    console.log(`[Verification] Rejected request ${requestId} for user ${request.userId}`);
    
    // TODO: Send notification to user with rejection reason
    
    res.json({
      success: true,
      message: "Verification rejected"
    });
    
  } catch (error) {
    console.error("[Verification] Reject error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== USER LEVEL MIGRATION ====================

/**
 * One-time migration: Upgrade existing registered businesses from Level 1 to Level 2
 * This fixes accounts created before the Level 1/2 distinction was implemented
 * 
 * Usage: Call this endpoint once to migrate all existing users
 */
exports.migrateExistingBusinessesToLevel2 = onRequest(
  { cors: true, region: "us-central1" },
  async (req, res) => {
    try {
      console.log("[Migration] Starting Level 1 → Level 2 migration for existing businesses");
      
      // Get all business users at Level 1 who are NOT aspiring
      const usersSnapshot = await db.collection("users")
        .where("role", "==", "BUSINESS")
        .where("businessLevel", "==", 1)
        .where("isAspiringBusiness", "==", false)
        .get();
      
      if (usersSnapshot.empty) {
        return res.json({
          success: true,
          message: "No users found to migrate",
          usersUpdated: 0
        });
      }
      
      const batch = db.batch();
      let updateCount = 0;
      const updatedUsers = [];
      
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        
        console.log(`[Migration] Upgrading user ${doc.id} (${userData.name}) from L1 to L2`);
        
        // Update to Level 2 with appropriate permissions
        batch.update(doc.ref, {
          businessLevel: 2,
          businessSubLevel: 1,
          'levelProgression.currentLevel': 2,
          
          // Enable mission creation (1/month for BASIC tier)
          'missionUsage.maxMissionsPerMonth': 1,
          'missionUsage.maxParticipantsPerMission': 5,
          
          // Enable meetup hosting (1/month for BASIC tier)
          'meetupUsage.maxHostPerMonth': 1,
          'meetupUsage.maxJoinPerMonth': 5,
          
          // Add migration timestamp
          migratedToLevel2At: admin.firestore.FieldValue.serverTimestamp(),
          migrationReason: 'Existing registered business - automatic upgrade'
        });
        
        updateCount++;
        updatedUsers.push({
          uid: doc.id,
          name: userData.name,
          email: userData.email
        });
      });
      
      await batch.commit();
      
      console.log(`[Migration] Successfully upgraded ${updateCount} users to Level 2`);
      
      res.json({
        success: true,
        message: `Successfully migrated ${updateCount} existing businesses to Level 2`,
        usersUpdated: updateCount,
        users: updatedUsers
      });
      
    } catch (error) {
      console.error("[Migration] Error:", error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
);

/**
 * Manual user level override (Admin only - for support cases)
 * Allows manually setting a user's business level
 */
exports.setUserBusinessLevel = onRequest(
  { cors: true, region: "us-central1" },
  async (req, res) => {
    try {
      const { userId, newLevel, reason, adminId } = req.body;
      
      if (!userId || !newLevel) {
        return res.status(400).json({
          success: false,
          error: "userId and newLevel are required"
        });
      }
      
      if (newLevel < 1 || newLevel > 6) {
        return res.status(400).json({
          success: false,
          error: "newLevel must be between 1 and 6"
        });
      }
      
      const userRef = db.collection("users").doc(userId);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        return res.status(404).json({
          success: false,
          error: "User not found"
        });
      }
      
      const userData = userDoc.data();
      const oldLevel = userData.businessLevel || 1;
      
      // Set appropriate permissions based on new level
      const updateData = {
        businessLevel: newLevel,
        businessSubLevel: 1,
        'levelProgression.currentLevel': newLevel,
        manualLevelOverrideAt: admin.firestore.FieldValue.serverTimestamp(),
        manualLevelOverrideReason: reason || 'Admin override',
        manualLevelOverrideBy: adminId || 'system'
      };
      
      // Adjust permissions based on level
      if (newLevel === 1) {
        // Level 1: Aspiring entrepreneur
        updateData['missionUsage.maxMissionsPerMonth'] = 0;
        updateData['missionUsage.maxParticipantsPerMission'] = 0;
        updateData['meetupUsage.maxHostPerMonth'] = 0;
        updateData['meetupUsage.maxJoinPerMonth'] = 2;
      } else if (newLevel === 2) {
        // Level 2: BASIC tier
        updateData['missionUsage.maxMissionsPerMonth'] = 1;
        updateData['missionUsage.maxParticipantsPerMission'] = 5;
        updateData['meetupUsage.maxHostPerMonth'] = 1;
        updateData['meetupUsage.maxJoinPerMonth'] = 5;
      }
      // Higher levels: permissions handled by subscription tier
      
      await userRef.update(updateData);
      
      console.log(`[Admin Override] User ${userId} level changed: L${oldLevel} → L${newLevel}`);
      
      res.json({
        success: true,
        message: `User level updated from ${oldLevel} to ${newLevel}`,
        oldLevel,
        newLevel,
        userId: userData.uid,
        userName: userData.name
      });
      
    } catch (error) {
      console.error("[Admin Override] Error:", error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
);

// ============================================================================
// H. REWARD POINTS SYSTEM
// ============================================================================

/**
 * Reward Points Earning Rules
 */
const REWARD_POINTS = {
  MISSION_CREATED: 50,
  MISSION_COMPLETED: 150,
  MISSION_PARTICIPATED: 75,
  MISSION_FIRST_TIME: 200,
  MEETUP_HOSTED: 100,
  MEETUP_ATTENDED: 50,
  MEETUP_FIRST_TIME: 150,
  REVIEW_WRITTEN: 40,
  REVIEW_RECEIVED_5_STAR: 20,
  PROFILE_COMPLETED: 100,
  BUSINESS_VERIFIED: 500,
  INSTAGRAM_CONNECTED: 75,
  DAILY_CHECK_IN: 10,
  WEEKLY_STREAK_3: 75,
  WEEKLY_STREAK_7: 200,
  MONTHLY_STREAK: 500,
  REFERRAL_SIGNUP: 300,
  LEVEL_UP_2: 200,
  LEVEL_UP_3: 400,
  LEVEL_UP_4: 800,
  LEVEL_UP_5: 1500,
  LEVEL_UP_6: 3000
};

const TIER_BONUS = {
  BASIC: 0,
  SILVER: 5,
  GOLD: 10,
  PLATINUM: 15
};

/**
 * Award Reward Points to User
 */
async function awardRewardPoints(userId, basePoints, reason, relatedId = null) {
  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      console.error(`[RewardPoints] User not found: ${userId}`);
      return;
    }
    
    const userData = userDoc.data();
    const tier = userData.subscription?.tier || 'BASIC';
    const streakDays = userData.dailyStreak?.currentStreak || 0;
    
    // Calculate bonuses
    const tierBonus = TIER_BONUS[tier] || 0;
    const pointsWithTierBonus = basePoints * (1 + tierBonus / 100);
    
    // Streak multiplier
    let streakMultiplier = 1.0;
    if (streakDays >= 30) streakMultiplier = 1.25;
    else if (streakDays >= 14) streakMultiplier = 1.15;
    else if (streakDays >= 7) streakMultiplier = 1.10;
    else if (streakDays >= 3) streakMultiplier = 1.05;
    
    const finalPoints = Math.round(pointsWithTierBonus * streakMultiplier);
    
    // Create transaction record
    const transaction = {
      type: 'EARNED',
      amount: finalPoints,
      reason: reason,
      relatedId: relatedId,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Update user's reward points
    await userRef.update({
      'rewardPoints.available': admin.firestore.FieldValue.increment(finalPoints),
      'rewardPoints.earned': admin.firestore.FieldValue.increment(finalPoints),
      'rewardPoints.totalEarned': admin.firestore.FieldValue.increment(finalPoints),
      'rewardPoints.recentTransactions': admin.firestore.FieldValue.arrayUnion(transaction)
    });
    
    console.log(`[RewardPoints] +${finalPoints} points awarded to ${userId} (base: ${basePoints}, tier: ${tier}, streak: ${streakDays}). Reason: ${reason}`);
    
    return finalPoints;
  } catch (error) {
    console.error('[RewardPoints] Error awarding points:', error);
    return 0;
  }
}

/**
 * HTTP Endpoint: Redeem Reward (New Points System)
 */
exports.redeemRewardPoints = onRequest({
  cors: true,
  region: "us-central1"
}, async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    const { userId, rewardId } = req.body;
    
    if (!userId || !rewardId) {
      res.status(400).json({ success: false, error: "userId and rewardId required" });
      return;
    }
    
    console.log(`[RewardRedeem] Processing redemption for user ${userId}, reward ${rewardId}`);
    
    // Get user data
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }
    
    const userData = userDoc.data();
    const availablePoints = userData.rewardPoints?.available || 0;
    
    // Get reward data
    const rewardDoc = await db.collection("rewards").doc(rewardId).get();
    if (!rewardDoc.exists) {
      res.status(404).json({ success: false, error: "Reward not found" });
      return;
    }
    
    const rewardData = rewardDoc.data();
    const pointsCost = rewardData.pointsCost || 0;
    
    // Check if reward is active
    if (rewardData.status !== 'ACTIVE') {
      res.status(400).json({ success: false, error: "Reward is not currently available" });
      return;
    }
    
    // Check if user has enough points
    if (availablePoints < pointsCost) {
      res.status(400).json({ 
        success: false, 
        error: "Insufficient points",
        required: pointsCost,
        available: availablePoints
      });
      return;
    }
    
    // Check if reward has stock
    if (rewardData.stock !== undefined && rewardData.stock <= 0) {
      res.status(400).json({ success: false, error: "Reward is out of stock" });
      return;
    }
    
    // Generate voucher code
    const voucherCode = crypto.randomBytes(6).toString('hex').toUpperCase();
    
    // Create redemption record
    const redemptionRef = await db.collection("redemptions").add({
      userId,
      rewardId,
      businessId: rewardData.businessId,
      pointsCost,
      voucherCode,
      status: 'ACTIVE',
      expiresAt: rewardData.expiryDays 
        ? admin.firestore.Timestamp.fromDate(new Date(Date.now() + rewardData.expiryDays * 24 * 60 * 60 * 1000))
        : null,
      redeemedAt: admin.firestore.FieldValue.serverTimestamp(),
      usedAt: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Deduct points from user
    const transaction = {
      type: 'SPENT',
      amount: -pointsCost,
      reason: `Redeemed: ${rewardData.title}`,
      relatedId: redemptionRef.id,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection("users").doc(userId).update({
      'rewardPoints.available': admin.firestore.FieldValue.increment(-pointsCost),
      'rewardPoints.spent': admin.firestore.FieldValue.increment(pointsCost),
      'rewardPoints.totalSpent': admin.firestore.FieldValue.increment(pointsCost),
      'rewardPoints.totalRedeemed': admin.firestore.FieldValue.increment(1),
      'rewardPoints.recentTransactions': admin.firestore.FieldValue.arrayUnion(transaction)
    });
    
    // Decrease reward stock if applicable
    if (rewardData.stock !== undefined) {
      await db.collection("rewards").doc(rewardId).update({
        stock: admin.firestore.FieldValue.increment(-1)
      });
    }
    
    console.log(`[RewardRedeem] Success! Redemption ${redemptionRef.id} created for ${userId}`);
    
    res.json({
      success: true,
      redemptionId: redemptionRef.id,
      voucherCode,
      message: "Reward redeemed successfully!",
      pointsRemaining: availablePoints - pointsCost
    });
    
  } catch (error) {
    console.error("[RewardRedeem] Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * HTTP Endpoint: Get User Rewards & Points
 */
exports.getUserRewardPoints = onRequest({
  cors: true,
  region: "us-central1"
}, async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    const userId = req.query.userId || req.body.userId;
    
    if (!userId) {
      res.status(400).json({ success: false, error: "userId is required" });
      return;
    }
    
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }
    
    const userData = userDoc.data();
    const rewardPoints = userData.rewardPoints || {
      available: 0,
      earned: 0,
      spent: 0,
      totalEarned: 0,
      totalSpent: 0,
      recentTransactions: []
    };
    
    res.json({
      success: true,
      rewardPoints,
      tier: userData.subscription?.tier || 'BASIC',
      streakDays: userData.dailyStreak?.currentStreak || 0
    });
    
  } catch (error) {
    console.error("[RewardPoints] Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * HTTP Endpoint: Get Available Rewards
 */
exports.getAvailableRewards = onRequest({
  cors: true,
  region: "us-central1"
}, async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    const userId = req.query.userId || req.body.userId;
    const city = req.query.city || req.body.city;
    
    if (!userId) {
      res.status(400).json({ success: false, error: "userId is required" });
      return;
    }
    
    // Get user's city if not provided
    let userCity = city;
    if (!userCity) {
      const userDoc = await db.collection("users").doc(userId).get();
      if (userDoc.exists) {
        userCity = userDoc.data().city || '';
      }
    }
    
    // Query active rewards in user's city
    let query = db.collection("rewards")
      .where("status", "==", "ACTIVE");
    
    if (userCity) {
      query = query.where("city", "==", userCity);
    }
    
    const snapshot = await query.get();
    
    const rewards = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      rewards.push({
        id: doc.id,
        ...data,
        businessId: data.businessId,
        businessName: data.businessName,
        title: data.title,
        description: data.description,
        type: data.type,
        pointsCost: data.pointsCost,
        value: data.value,
        stock: data.stock,
        imageUrl: data.imageUrl,
        expiryDays: data.expiryDays
      });
    });
    
    // Sort by points cost (ascending)
    rewards.sort((a, b) => a.pointsCost - b.pointsCost);
    
    res.json({
      success: true,
      rewards,
      count: rewards.length
    });
    
  } catch (error) {
    console.error("[RewardsList] Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Export the award function for use in triggers
exports.awardRewardPoints = awardRewardPoints;

/**
 * HTTP Endpoint: Initialize Reward Points for Existing Users
 * One-time migration to add rewardPoints field to all existing users
 */
exports.initializeRewardPoints = onRequest({
  cors: true,
  invoker: "public"
}, async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }
  
  try {
    console.log("[InitializeRewardPoints] Starting migration...");
    
    // Get all users
    const usersRef = db.collection("users");
    const snapshot = await usersRef.get();
    
    let updated = 0;
    let skipped = 0;
    const batch = db.batch();
    
    snapshot.forEach(doc => {
      const data = doc.data();
      
      // Only update if rewardPoints doesn't exist
      if (!data.rewardPoints) {
        batch.update(doc.ref, {
          rewardPoints: {
            available: 0,
            earned: 0,
            spent: 0,
            pending: 0,
            totalEarned: 0,
            totalSpent: 0,
            totalRedeemed: 0,
            recentTransactions: [],
            streakMultiplier: 1.0,
            tierBonus: 0,
            pointsExpiringThisMonth: 0
          },
          updatedAt: new Date().toISOString()
        });
        updated++;
      } else {
        skipped++;
      }
    });
    
    await batch.commit();
    
    console.log(`[InitializeRewardPoints] Migration complete. Updated: ${updated}, Skipped: ${skipped}`);
    
    res.json({
      success: true,
      message: "Reward points initialized successfully",
      usersUpdated: updated,
      usersSkipped: skipped,
      totalUsers: snapshot.size
    });
    
  } catch (error) {
    console.error("[InitializeRewardPoints] Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * HTTP Endpoint: Create Reward
 * Allows businesses to create new rewards
 */
exports.createReward = onRequest({
  cors: true,
  invoker: "public"
}, async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }
  
  try {
    const { 
      businessId, 
      title, 
      description, 
      costPoints, 
      type,
      imageUrl,
      discountPercent,
      stock,
      terms,
      expiryDays
    } = req.body;
    
    // Validate required fields
    if (!businessId || !title || !costPoints || !type) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: businessId, title, costPoints, type"
      });
    }
    
    // Get business details
    const businessDoc = await db.collection("users").doc(businessId).get();
    if (!businessDoc.exists) {
      return res.status(404).json({ success: false, error: "Business not found" });
    }
    
    const businessData = businessDoc.data();
    
    // Create reward
    const rewardRef = await db.collection("rewards").add({
      businessId,
      businessName: businessData.businessName || businessData.name || "Business",
      title,
      description: description || "",
      costPoints: parseInt(costPoints),
      type, // DISCOUNT, FREE_ITEM, VOUCHER, CASHBACK, EXPERIENCE
      imageUrl: imageUrl || null,
      discountPercent: type === 'DISCOUNT' ? parseInt(discountPercent || 0) : null,
      city: businessData.currentCity || businessData.city || "Munich",
      district: businessData.district || null,
      status: "ACTIVE",
      totalAvailable: stock ? parseInt(stock) : null,
      remaining: stock ? parseInt(stock) : null,
      terms: terms || null,
      expiryDays: expiryDays ? parseInt(expiryDays) : 30,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    console.log(`[CreateReward] Reward created: ${rewardRef.id} by ${businessId}`);
    
    res.json({
      success: true,
      rewardId: rewardRef.id,
      message: "Reward created successfully"
    });
    
  } catch (error) {
    console.error("[CreateReward] Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * HTTP Endpoint: Update Reward
 * Allows businesses to update their rewards
 */
exports.updateReward = onRequest({
  cors: true,
  invoker: "public"
}, async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }
  
  try {
    const { businessId, rewardId, updates } = req.body;
    
    if (!businessId || !rewardId || !updates) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: businessId, rewardId, updates"
      });
    }
    
    // Verify ownership
    const rewardDoc = await db.collection("rewards").doc(rewardId).get();
    if (!rewardDoc.exists) {
      return res.status(404).json({ success: false, error: "Reward not found" });
    }
    
    if (rewardDoc.data().businessId !== businessId) {
      return res.status(403).json({ success: false, error: "Unauthorized" });
    }
    
    // Update reward
    await db.collection("rewards").doc(rewardId).update({
      ...updates,
      updatedAt: new Date().toISOString()
    });
    
    console.log(`[UpdateReward] Reward ${rewardId} updated by ${businessId}`);
    
    res.json({
      success: true,
      message: "Reward updated successfully"
    });
    
  } catch (error) {
    console.error("[UpdateReward] Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * HTTP Endpoint: Delete Reward
 * Soft delete - sets status to DELETED
 */
exports.deleteReward = onRequest({
  cors: true,
  invoker: "public"
}, async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }
  
  try {
    const { businessId, rewardId } = req.body;
    
    if (!businessId || !rewardId) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: businessId, rewardId"
      });
    }
    
    // Verify ownership
    const rewardDoc = await db.collection("rewards").doc(rewardId).get();
    if (!rewardDoc.exists) {
      return res.status(404).json({ success: false, error: "Reward not found" });
    }
    
    if (rewardDoc.data().businessId !== businessId) {
      return res.status(403).json({ success: false, error: "Unauthorized" });
    }
    
    // Soft delete
    await db.collection("rewards").doc(rewardId).update({
      status: "DELETED",
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    console.log(`[DeleteReward] Reward ${rewardId} deleted by ${businessId}`);
    
    res.json({
      success: true,
      message: "Reward deleted successfully"
    });
    
  } catch (error) {
    console.error("[DeleteReward] Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * HTTP Endpoint: Get Business Rewards
 * Get all rewards for a specific business
 */
exports.getBusinessRewards = onRequest({
  cors: true,
  invoker: "public"
}, async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }
  
  try {
    const { businessId } = req.body;
    
    if (!businessId) {
      return res.status(400).json({
        success: false,
        error: "Missing businessId"
      });
    }
    
    // Get all rewards (including deleted for management)
    const rewardsQuery = await db.collection("rewards")
      .where("businessId", "==", businessId)
      .orderBy("createdAt", "desc")
      .get();
    
    const rewards = [];
    rewardsQuery.forEach(doc => {
      rewards.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Get redemption stats for each reward
    const redemptionsQuery = await db.collection("redemptions")
      .where("businessId", "==", businessId)
      .get();
    
    const redemptionStats = {};
    redemptionsQuery.forEach(doc => {
      const data = doc.data();
      const rewardId = data.rewardId;
      if (!redemptionStats[rewardId]) {
        redemptionStats[rewardId] = { total: 0, used: 0, active: 0 };
      }
      redemptionStats[rewardId].total++;
      if (data.status === 'USED') redemptionStats[rewardId].used++;
      if (data.status === 'ACTIVE') redemptionStats[rewardId].active++;
    });
    
    // Add stats to rewards
    rewards.forEach(reward => {
      reward.redemptions = redemptionStats[reward.id] || { total: 0, used: 0, active: 0 };
    });
    
    res.json({
      success: true,
      rewards,
      count: rewards.length
    });
    
  } catch (error) {
    console.error("[GetBusinessRewards] Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * HTTP Endpoint: Validate Voucher
 * Validate a voucher code for redemption
 */
exports.validateVoucher = onRequest({
  cors: true,
  invoker: "public"
}, async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }
  
  try {
    const { voucherCode, businessId } = req.body;
    
    if (!voucherCode || !businessId) {
      return res.status(400).json({
        success: false,
        error: "Missing voucherCode or businessId"
      });
    }
    
    // Find redemption
    const redemptionQuery = await db.collection("redemptions")
      .where("voucherCode", "==", voucherCode.toUpperCase())
      .where("businessId", "==", businessId)
      .limit(1)
      .get();
    
    if (redemptionQuery.empty) {
      return res.json({
        valid: false,
        error: "Invalid voucher code"
      });
    }
    
    const redemption = redemptionQuery.docs[0];
    const data = redemption.data();
    
    // Check status
    if (data.status === 'USED') {
      return res.json({
        valid: false,
        error: "Voucher already used",
        usedAt: data.usedAt
      });
    }
    
    if (data.status === 'EXPIRED') {
      return res.json({
        valid: false,
        error: "Voucher expired"
      });
    }
    
    // Check expiry
    const expiryDate = new Date(data.expiresAt);
    if (expiryDate < new Date()) {
      // Mark as expired
      await redemption.ref.update({
        status: 'EXPIRED',
        updatedAt: new Date().toISOString()
      });
      return res.json({
        valid: false,
        error: "Voucher expired"
      });
    }
    
    // Valid voucher
    res.json({
      valid: true,
      redemption: {
        id: redemption.id,
        title: data.title,
        description: data.description,
        customerName: data.userName || "Customer",
        redeemedAt: data.redeemedAt,
        expiresAt: data.expiresAt,
        type: data.type,
        costPoints: data.costPoints
      }
    });
    
  } catch (error) {
    console.error("[ValidateVoucher] Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * HTTP Endpoint: Mark Voucher as Used
 * Business marks voucher as used after customer redeems
 */
exports.markVoucherUsed = onRequest({
  cors: true,
  invoker: "public"
}, async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }
  
  try {
    const { redemptionId, businessId } = req.body;
    
    if (!redemptionId || !businessId) {
      return res.status(400).json({
        success: false,
        error: "Missing redemptionId or businessId"
      });
    }
    
    // Verify ownership
    const redemptionRef = db.collection("redemptions").doc(redemptionId);
    const doc = await redemptionRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({ success: false, error: "Redemption not found" });
    }
    
    if (doc.data().businessId !== businessId) {
      return res.status(403).json({ success: false, error: "Unauthorized" });
    }
    
    if (doc.data().status === 'USED') {
      return res.status(400).json({ success: false, error: "Voucher already used" });
    }
    
    // Mark as used
    await redemptionRef.update({
      status: 'USED',
      usedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    console.log(`[MarkVoucherUsed] Voucher ${doc.data().voucherCode} marked as used by ${businessId}`);
    
    res.json({
      success: true,
      message: "Voucher marked as used"
    });
    
  } catch (error) {
    console.error("[MarkVoucherUsed] Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});
