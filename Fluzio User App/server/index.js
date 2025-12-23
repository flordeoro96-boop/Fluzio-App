/**
 * Fluzio Backend - Cloud Functions
 * Implements:
 * 1. User Creation Triggers (Referrals, Admin Alerts)
 * 2. B2B Squad Generation (Scheduled)
 * 3. AI Mission Verification (Gemini)
 */

const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const OpenAI = require("openai");

admin.initializeApp();
const db = admin.firestore();

// Initialize OpenAI (lazy initialization to avoid errors during deployment)
let openai = null;
const getOpenAI = () => {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
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
    
    // Set verification status based on 'isAspiring'
    const status = newUser.isAspiringBusiness ? "APPROVED" : "PENDING";
    batch.update(snapshot.ref, { verificationStatus: status });
  }

  await batch.commit();
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
      const response = await fetch(websiteUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; FluzioBot/1.0)'
        },
        timeout: 10000
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      websiteHtml = await response.text();
    } catch (error) {
      console.error('Website fetch failed:', error);
      res.status(400).json({ 
        success: false, 
        error: 'Could not access your website. Please check the URL.', 
        code: 'WEBSITE_FETCH_FAILED' 
      });
      return;
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

    const websiteText = extractText(websiteHtml);
    console.log('Extracted text length:', websiteText.length);

    // 5. Call AI model
    const prompt = `You are the AI brand copywriter for Fluzio, an app that connects businesses and creators.

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
}

Business Information:
- Name: ${business.name || business.legalName || 'Unknown'}
- City: ${business.homeCity || business.city || 'Unknown'}
- Category: ${business.category || 'Business'}
- Languages: ${business.languages?.join(', ') || 'Unknown'}

Website Content:
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

/**
 * HTTP Endpoint: Generate Mission Ideas
 * Uses AI to suggest mission ideas based on business context
 */
exports.generatemissionideas = onRequest({
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

  console.log('[generateMissionIdeas] Request received');

  try {
    // 1. Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(token);
    } catch (error) {
      console.error('[generateMissionIdeas] Auth error:', error);
      res.status(401).json({ success: false, error: 'Invalid token' });
      return;
    }

    // 2. Parse request
    const { businessId, category, website, businessName, businessType, currentMissions } = req.body;

    if (!businessId || !category) {
      res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: businessId, category' 
      });
      return;
    }

    console.log(`[generateMissionIdeas] Generating for business: ${businessName || businessId} (${businessType || category})`);

    // 3. Fetch website content if provided
    let websiteContext = '';
    if (website) {
      try {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(website, { 
          timeout: 5000,
          headers: { 'User-Agent': 'FluzioBot/1.0' }
        });
        const html = await response.text();
        
        // Extract text content (simple version)
        const textContent = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 2000); // Limit to 2000 chars
        
        websiteContext = textContent;
        console.log('[generateMissionIdeas] Website content fetched');
      } catch (error) {
        console.log('[generateMissionIdeas] Could not fetch website, continuing without it');
      }
    }

    // 4. Build AI prompt
    const categoryDescriptions = {
      GASTRONOMY: 'restaurant, café, bar, or food establishment',
      RETAIL: 'retail store, boutique, or shop',
      SERVICES: 'service provider or professional service',
      FITNESS: 'gym, fitness studio, or wellness center',
      FASHION: 'fashion brand, clothing store, or accessories boutique',
      LIFESTYLE: 'lifestyle brand or experience',
      OTHER: 'business'
    };

    const categoryType = businessType || categoryDescriptions[category] || categoryDescriptions.OTHER;
    
    // Add specific context for jewelry/accessories
    const jewelryContext = (businessType && businessType.toLowerCase().includes('jewelry')) || 
                           (businessName && businessName.toLowerCase().includes('oro'))
      ? '\n\nIMPORTANT: This is a jewelry and accessories business. Focus on missions that showcase jewelry pieces, styling, unboxing experiences, gift-giving moments, special occasions, and elegant lifestyle content. Avoid food-related missions.'
      : '';

    const existingMissionsContext = currentMissions && currentMissions.length > 0
      ? `\n\nExisting missions to avoid duplicating:\n${currentMissions.map(m => `- ${m.title}: ${m.description}`).join('\n')}`
      : '';

    const prompt = `You are a creative marketing expert helping ${businessName || 'a business'}, a ${categoryType}, create engaging social media missions for local creators and influencers.

${websiteContext ? `Business context from their website:\n${websiteContext}\n\n` : ''}
Business Category: ${category}${jewelryContext}
${existingMissionsContext}

Generate 4 creative, engaging mission ideas that would work well for this business. Each mission should:
1. Be authentic and match the business vibe
2. Create shareable content that promotes the business
3. Be easy for creators to complete
4. Encourage foot traffic or online engagement (or online sales if e-commerce)
5. Be specific with clear requirements

For each mission, provide:
- title: Short, catchy title (max 50 chars)
- description: Clear description of what creators need to do (max 200 chars)
- requirements: Array of 2-4 specific requirements (e.g., "Post an Instagram Story", "Tag our location", "Use #hashtag")
- suggestedPoints: Point reward (50-300 based on effort)
- postType: One of: STORY, POST, REEL, VIDEO, ANY
- hashtags: Array of 1-3 relevant hashtags (without # symbol)
- goal: One of: GROWTH, CONTENT, TRAFFIC, SALES

Respond ONLY with valid JSON in this exact format:
{
  "missions": [
    {
      "title": "string",
      "description": "string",
      "requirements": ["string"],
      "suggestedPoints": number,
      "postType": "STORY|POST|REEL|VIDEO|ANY",
      "hashtags": ["string"],
      "goal": "GROWTH|CONTENT|TRAFFIC|SALES"
    }
  ]
}`;

    // 5. Call OpenAI
    const openai = getOpenAI();
    console.log('[generateMissionIdeas] Calling OpenAI...');
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 2000
    });

    const responseText = completion.choices[0].message.content.trim();
    console.log('[generateMissionIdeas] AI response received');

    // 6. Parse response
    let missionIdeas;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : responseText;
      missionIdeas = JSON.parse(jsonStr);
    } catch (error) {
      console.error('[generateMissionIdeas] JSON parse error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'AI generated invalid response' 
      });
      return;
    }

    // 7. Return mission ideas
    res.status(200).json({
      success: true,
      missions: missionIdeas.missions || []
    });

  } catch (error) {
    console.error('[generateMissionIdeas] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate mission ideas',
      details: error.message
    });
  }
});

// --- E. Tracking & Analytics ---

/**
 * HTTP Endpoint: Track Event
 * Tracks creator/regular interactions with businesses
 */
exports.trackevent = onRequest({
  cors: true,
  invoker: "public"
}, async (req, res) => {
  // Set CORS headers
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ success: false, error: "Method not allowed" });
    return;
  }

  try {
    // 1. Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ 
        success: false, 
        error: 'Missing or invalid authorization header',
        code: 'AUTH_REQUIRED'
      });
      return;
    }

    const idToken = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (error) {
      console.error('Token verification failed:', error);
      res.status(401).json({ 
        success: false, 
        error: 'Invalid authentication token',
        code: 'INVALID_TOKEN'
      });
      return;
    }

    const currentUserId = decodedToken.uid;
    console.log('[trackEvent] Tracking event for user:', currentUserId);

    // 2. Parse request data
    const { userId, businessId, eventType, metadata = {} } = req.body;

    if (!userId || !businessId || !eventType) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, businessId, eventType'
      });
      return;
    }

    // 3. Get user profile data for insights
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    const userData = userDoc.data();
    const userName = userData.name || userData.legalName || userData.handle || 'Anonymous';
    const userAvatar = userData.photoUrl || userData.avatarUrl || `https://i.pravatar.cc/150?u=${userId}`;
    const userHandle = userData.handle || userData.socialAccounts?.instagram?.username;

    // 4. Determine if user is a creator (has completed missions or has social accounts)
    const isCreator = (userData.socialAccounts && Object.keys(userData.socialAccounts).length > 0) ||
                      eventType === 'MISSION_COMPLETED';

    // 5. Create or update the appropriate insight document
    const insightId = `${businessId}_${userId}`;
    
    if (isCreator) {
      // Update creator insights
      const creatorRef = db.collection('creatorInsights').doc(insightId);
      const creatorDoc = await creatorRef.get();

      const updateData = {
        userId,
        businessId,
        name: userName,
        handle: userHandle,
        avatarUrl: userAvatar,
        lastActivityAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      // Increment counters based on event type
      if (eventType === 'VISIT') {
        updateData.visitsCount = admin.firestore.FieldValue.increment(1);
        updateData.lastVisitAt = admin.firestore.FieldValue.serverTimestamp();
      }
      
      if (eventType === 'CHECK_IN') {
        updateData.checkInsCount = admin.firestore.FieldValue.increment(1);
      }
      
      if (eventType === 'MISSION_COMPLETED') {
        updateData.missionsCompleted = admin.firestore.FieldValue.increment(1);
        updateData.postsCreated = admin.firestore.FieldValue.increment(1);
        
        if (metadata.missionType) {
          updateData.favoriteMissionType = metadata.missionType;
        }
      }
      
      if (eventType === 'CONVERSION') {
        updateData.conversionsGenerated = admin.firestore.FieldValue.increment(1);
      }
      
      if (eventType === 'REFERRAL') {
        updateData.referralsCount = admin.firestore.FieldValue.increment(1);
      }

      // Get social reach if available
      if (!creatorDoc.exists && userData.socialAccounts) {
        let totalReach = 0;
        Object.values(userData.socialAccounts).forEach(account => {
          if (account.followers) totalReach += account.followers;
        });
        updateData.totalReach = totalReach;
        updateData.avgEngagement = 3.5; // Default placeholder
      }

      await creatorRef.set(updateData, { merge: true });
      console.log('[trackEvent] Creator insight updated:', insightId);

    } else {
      // Update regular customer insights
      const regularRef = db.collection('regularInsights').doc(insightId);

      const updateData = {
        userId,
        businessId,
        name: userName,
        handle: userHandle,
        avatarUrl: userAvatar,
        lastActivityAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      // Increment counters
      if (eventType === 'VISIT') {
        updateData.visitsCount = admin.firestore.FieldValue.increment(1);
        updateData.lastVisitAt = admin.firestore.FieldValue.serverTimestamp();
      }
      
      if (eventType === 'CHECK_IN') {
        updateData.checkInsCount = admin.firestore.FieldValue.increment(1);
      }
      
      if (eventType === 'MISSION_COMPLETED') {
        updateData.missionsCompleted = admin.firestore.FieldValue.increment(1);
      }
      
      if (eventType === 'CONVERSION') {
        updateData.ordersInfluenced = admin.firestore.FieldValue.increment(1);
        if (metadata.orderValue) {
          updateData.totalSpend = admin.firestore.FieldValue.increment(metadata.orderValue);
        }
      }
      
      if (eventType === 'REFERRAL') {
        updateData.referralsCount = admin.firestore.FieldValue.increment(1);
      }

      await regularRef.set(updateData, { merge: true });
      console.log('[trackEvent] Regular insight updated:', insightId);
    }

    // 6. Return success
    res.status(200).json({
      success: true,
      message: 'Event tracked successfully',
      isCreator
    });

  } catch (error) {
    console.error('[trackEvent] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track event',
      details: error.message
    });
  }
});

/**
 * Firestore Trigger: On Mission Created
 * Validates mission data and sets up notifications
 */
exports.onmissioncreated = onDocumentCreated("missions/{missionId}", async (event) => {
  const missionId = event.params.missionId;
  const missionData = event.data.data();
  
  console.log(`[onMissionCreated] New mission created: ${missionId}`);
  
  try {
    const updates = {};
    
    // Set default values if not present
    if (!missionData.currentParticipants) {
      updates.currentParticipants = 0;
    }
    
    if (!missionData.lifecycleStatus) {
      updates.lifecycleStatus = 'DRAFT';
    }
    
    // Generate QR code secret for QR-based missions
    if (missionData.triggerType === 'QR_SCAN' && !missionData.qrCodeSecret) {
      updates.qrCodeSecret = `FLUZIO_${missionId}_${Date.now()}`;
    }
    
    // Set expiration check
    if (missionData.validUntil) {
      const expiryDate = new Date(missionData.validUntil);
      const now = new Date();
      
      if (expiryDate < now && missionData.lifecycleStatus === 'ACTIVE') {
        updates.lifecycleStatus = 'EXPIRED';
        updates.isActive = false;
      }
    }
    
    // Apply updates if any
    if (Object.keys(updates).length > 0) {
      await event.data.ref.update(updates);
      console.log(`[onMissionCreated] Mission ${missionId} updated with defaults`);
    }
    
    // TODO: Send notifications to matching creators based on targetAudience
    // This would query users with matching interests/location and create notifications
    
    return null;
  } catch (error) {
    console.error(`[onMissionCreated] Error processing mission ${missionId}:`, error);
    return null;
  }
});

/**
 * Firestore Trigger: On Participation Created
 * Handles mission application logic
 */
exports.onparticipationcreated = onDocumentCreated("participations/{participationId}", async (event) => {
  const participationId = event.params.participationId;
  const participationData = event.data.data();
  
  console.log(`[onParticipationCreated] New participation: ${participationId}`);
  
  try {
    const missionId = participationData.missionId;
    const missionRef = db.collection('missions').doc(missionId);
    const missionSnap = await missionRef.get();
    
    if (!missionSnap.exists) {
      console.error(`[onParticipationCreated] Mission ${missionId} not found`);
      return null;
    }
    
    const missionData = missionSnap.data();
    const currentParticipants = missionData.currentParticipants || 0;
    const maxParticipants = missionData.maxParticipants;
    
    // Check if mission is full
    if (maxParticipants && currentParticipants >= maxParticipants) {
      await missionRef.update({
        lifecycleStatus: 'COMPLETED',
        isActive: false
      });
      console.log(`[onParticipationCreated] Mission ${missionId} is now full`);
    }
    
    // If auto-approve is enabled, immediately approve the participation
    if (missionData.autoApprove) {
      await event.data.ref.update({
        status: 'APPROVED',
        reviewedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`[onParticipationCreated] Auto-approved participation ${participationId}`);
      
      // TODO: Award points/rewards to user
      // TODO: Send notification to user about approval
    } else {
      // TODO: Send notification to business about pending review
    }
    
    return null;
  } catch (error) {
    console.error(`[onParticipationCreated] Error processing participation ${participationId}:`, error);
    return null;
  }
});

/**
 * Scheduled Function: Check Mission Expiration
 * Runs daily to mark expired missions
 */
exports.checkmissionexpiration = onSchedule("every day 00:00", async (event) => {
  console.log('[checkMissionExpiration] Starting daily mission expiration check');
  
  try {
    const now = new Date();
    const missionsRef = db.collection('missions');
    
    // Get all active missions
    const activeMissions = await missionsRef
      .where('lifecycleStatus', '==', 'ACTIVE')
      .get();
    
    let expiredCount = 0;
    
    for (const doc of activeMissions.docs) {
      const mission = doc.data();
      const validUntil = new Date(mission.validUntil);
      
      if (validUntil < now) {
        await doc.ref.update({
          lifecycleStatus: 'EXPIRED',
          isActive: false
        });
        expiredCount++;
      }
    }
    
    console.log(`[checkMissionExpiration] Marked ${expiredCount} missions as expired`);
    return null;
  } catch (error) {
    console.error('[checkMissionExpiration] Error:', error);
    return null;
  }
});

/**
 * HTTP Function: Suggest Squad Activity
 * Generates AI-powered activity suggestions for squad meetups
 */
exports.suggestsquadactivity = onRequest({ 
  cors: true,
  maxInstances: 10,
  secrets: ["OPENAI_API_KEY"]
}, async (req, res) => {
  console.log('[suggestSquadActivity] Received request');
  
  // Set CORS headers explicitly
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    const userId = decodedToken.uid;

    console.log('[suggestSquadActivity] Request from user:', userId);

    const { city, country, month, squadSize = 4, previousActivities = [], userSuggestion } = req.body;

    if (!city || !month) {
      res.status(400).json({ error: 'Missing required fields: city, month' });
      return;
    }

    // Get current weather and season context
    const currentDate = new Date();
    const monthNum = new Date(`${month} 1, ${currentDate.getFullYear()}`).getMonth() + 1;
    const season = getSeasonForMonth(monthNum, country || 'Germany');
    const weatherContext = getWeatherContext(monthNum, city, country);
    
    const prompt = `You are a creative event planner for a group of ${squadSize} entrepreneurs in ${city}, ${country || 'Germany'}.

CONTEXT:
- Month: ${month} (${season} season)
- Weather: ${weatherContext}
- Group: ${squadSize} business owners who meet 2 TIMES per month
- Previous activities: ${previousActivities.length > 0 ? previousActivities.join(', ') : 'None yet'}
${userSuggestion ? `- User suggestion to consider: "${userSuggestion}"` : ''}

IMPORTANT: Squads meet TWICE monthly:
1. MEETUP 1: FUN/SOCIAL activity (restaurant, sport, experience, entertainment)
2. MEETUP 2: WORK session at one member's business location (their café, office, store, workspace, etc.)

REQUIREMENTS:
Suggest exactly 6 activities total (3 for FUN meetup, 3 for WORK meetup):

FUN MEETUP ACTIVITIES (Social/Entertainment):
   - Activity 1: FREE fun activity (no cost required)
   - Activity 2: LOW BUDGET fun activity (maximum €10 per person)
   - Activity 3: PREMIUM fun experience (€30-60 per person)
   - ONE of these MUST be sports-related or involve physical activity (indoor sports if cold weather)

WORK MEETUP ACTIVITIES (At Member's Business):
   - Activity 4: FREE work session at member's café/restaurant (just buy your own coffee/food)
   - Activity 5: LOW BUDGET work session at member's co-working space or office (€5-10 for day pass/refreshments)
   - Activity 6: PREMIUM work session at member's upscale venue with catering (€30-60 per person for food/drinks)
   - Focus: Deep work, collaboration, business strategy discussions
   - Location: "At [Member's Business Name/Type] in [Area]" (be specific: "At member's coffee shop in Schwabing", "At member's design studio in Kreuzberg")

ALL activities should:
   - Be STRICTLY weather-appropriate for ${season} in ${city} (${weatherContext})
   - If winter/freezing temperatures: PRIORITIZE INDOOR venues
   - Foster networking and relationship building
   - Be suitable for entrepreneurs (professional yet comfortable)
   - Be different from previous activities
   - Have a clear benefit for business networking

${userSuggestion ? `
IMPORTANT: One of the suggestions should incorporate or be inspired by this user idea: "${userSuggestion}"
Refine it to make it practical and engaging for the group.
` : ''}

Return ONLY valid JSON (no markdown, no code blocks) in this exact format:
{
  "funMeetup": {
    "title": "Fun Social Meetup",
    "suggestions": [
      {
        "title": "Activity Name",
        "location": "Specific venue or area in ${city}",
        "description": "2-3 sentence description",
        "duration": "2-3 hours",
        "weatherSuitability": "indoor/outdoor/flexible",
        "networkingBenefit": "Why this is great for connections",
        "estimatedCost": "Free" or "€5-10 per person" or "€30-60 per person",
        "bestTimeOfDay": "Morning/Afternoon/Evening"
      }
    ]
  },
  "workMeetup": {
    "title": "Work Session at Member's Business",
    "suggestions": [
      {
        "title": "Activity Name",
        "location": "At member's [business type] in [area]",
        "description": "What you'll work on together, collaboration focus",
        "duration": "2-3 hours",
        "weatherSuitability": "indoor",
        "networkingBenefit": "Why working at member's business helps networking",
        "estimatedCost": "Free" or "€5-10 per person" or "€30-60 per person",
        "bestTimeOfDay": "Morning/Afternoon/Evening"
      }
    ]
  },
  "seasonalTip": "One sentence about what makes ${month} special in ${city}"
}`;

    console.log('[suggestSquadActivity] Generating suggestions for:', { city, month, season });

    // Use OpenAI API
    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a creative event planner helping entrepreneurs network. Return valid JSON only, no markdown."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8,
      response_format: { type: "json_object" }
    });

    let text = completion.choices[0].message.content;
    console.log('[suggestSquadActivity] Raw AI response:', text);

    let suggestions;
    try {
      suggestions = JSON.parse(text);
    } catch (parseError) {
      console.error('[suggestSquadActivity] JSON parse error:', parseError);
      
      // Fallback suggestions with both FUN and WORK meetups
      const isWinter = season === 'Winter';
      const isCold = season === 'Winter' || season === 'Autumn';
      
      suggestions = {
        funMeetup: {
          title: "Fun Social Meetup",
          suggestions: [
            {
              title: isWinter ? "Indoor Climbing Session" : "Park Football Game",
              location: isWinter ? `Indoor climbing gym in ${city}` : `Local park in ${city}`,
              description: isWinter 
                ? "Visit a local climbing gym for a fun physical challenge. No experience needed - instructors available. Great team-building in a warm environment."
                : "Casual football or frisbee game followed by picnic. Bring your own snacks. Perfect for team bonding through friendly competition.",
              duration: "2-3 hours",
              weatherSuitability: isWinter ? "indoor" : "outdoor",
              networkingBenefit: "Physical activities create natural team dynamics and bonding",
              estimatedCost: "Free",
              bestTimeOfDay: isWinter ? "Morning" : "Afternoon"
            },
            {
              title: isCold ? "Museum & Café Tour" : "Street Food Tour",
              location: `${city} city center`,
              description: isCold
                ? "Visit a local museum followed by coffee and discussion at a nearby café. Stay warm while exploring culture and business ideas."
                : "Explore local street food scene together. Try different cuisines while walking and networking.",
              duration: "2-3 hours",
              weatherSuitability: isCold ? "indoor" : "flexible",
              networkingBenefit: "Shared experiences create conversation starters",
              estimatedCost: "€5-10 per person",
              bestTimeOfDay: "Afternoon"
            },
            {
              title: isWinter ? "Winter Fine Dining" : "Rooftop Dinner",
              location: `Upscale restaurant in ${city}`,
              description: isWinter
                ? "Escape the cold with a premium dining experience. Multi-course seasonal menu with wine pairing. Warm, elegant ambiance."
                : "Premium rooftop dining experience. Multi-course meal with views. Perfect for celebrating squad achievements.",
              duration: "2-3 hours",
              weatherSuitability: "indoor",
              networkingBenefit: "Sophisticated setting for deeper business discussions",
              estimatedCost: "€40-60 per person",
              bestTimeOfDay: "Evening"
            }
          ]
        },
        workMeetup: {
          title: "Work Session at Member's Business",
          suggestions: [
            {
              title: "Co-working at Member's Café",
              location: `At member's coffee shop in ${city}`,
              description: "Meet at a squad member's café. Bring laptops and work together while supporting their business. Free WiFi, comfortable seating, great coffee.",
              duration: "2-3 hours",
              weatherSuitability: "indoor",
              networkingBenefit: "See member's business firsthand, support each other, work side-by-side",
              estimatedCost: "Free (just buy your own coffee/food)",
              bestTimeOfDay: "Morning"
            },
            {
              title: "Strategy Session at Member's Office",
              location: `At member's workspace in ${city}`,
              description: "Use a member's co-working space or office for focused strategy session. Tackle business challenges together with whiteboard brainstorming.",
              duration: "2-3 hours",
              weatherSuitability: "indoor",
              networkingBenefit: "Deep collaboration in professional setting, learn from each other's expertise",
              estimatedCost: "€5-10 per person (refreshments/day pass)",
              bestTimeOfDay: "Afternoon"
            },
            {
              title: "Executive Session at Member's Premium Venue",
              location: `At member's upscale business in ${city}`,
              description: "Exclusive work session at member's premium location. Catered lunch/dinner, private space, focused business planning and partnership exploration.",
              duration: "2-3 hours",
              weatherSuitability: "indoor",
              networkingBenefit: "VIP experience, serious business discussions, potential collaborations",
              estimatedCost: "€30-60 per person (catering included)",
              bestTimeOfDay: "Afternoon"
            }
          ]
        },
        seasonalTip: isWinter 
          ? `${month} in ${city} is cold - perfect for cozy indoor meetups and visiting each other's businesses!`
          : `${month} in ${city} offers great opportunities for both fun activities and productive work sessions.`
      };
    }

    const responseData = {
      ...suggestions,
      metadata: {
        city,
        month,
        season,
        generatedAt: new Date().toISOString(),
        squadSize
      }
    };

    res.status(200).json(responseData);

  } catch (error) {
    console.error('[suggestSquadActivity] Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate activity suggestions',
      details: error.message 
    });
  }
});

// Helper functions for squad activities
function getSeasonForMonth(month, country) {
  if (month >= 3 && month <= 5) return 'Spring';
  if (month >= 6 && month <= 8) return 'Summer';
  if (month >= 9 && month <= 11) return 'Autumn';
  return 'Winter';
}

function getWeatherContext(month, city, country) {
  const contexts = {
    1: "Winter (typically -5°C to 5°C). FREEZING temperatures - outdoor activities should be brief or avoided. Indoor venues strongly preferred.",
    2: "Late winter (typically -2°C to 7°C). Still very cold - limit outdoor exposure. Focus on cozy indoor settings.",
    3: "Early spring (5°C to 12°C). Unpredictable weather, can still be cold. Indoor options safer, outdoor with backup plan.",
    4: "Mid-spring (8°C to 15°C). Pleasant for outdoor activities, occasional rain possible.",
    5: "Late spring (12°C to 20°C). Warm and comfortable, ideal for outdoor networking.",
    6: "Early summer (15°C to 23°C). Great outdoor weather, perfect for park activities.",
    7: "Peak summer (18°C to 28°C). Warmest month, excellent for outdoor activities, shade recommended.",
    8: "Late summer (17°C to 26°C). Still warm and pleasant, great for outdoor events.",
    9: "Early autumn (13°C to 20°C). Mild and comfortable, beautiful season for outdoor activities.",
    10: "Mid-autumn (8°C to 14°C). Cooler weather, beautiful fall colors, layer up for outdoor activities.",
    11: "Late autumn (3°C to 9°C). Getting cold, outdoor activities should be brief. Indoor options preferred.",
    12: "Winter (typically -3°C to 4°C). FREEZING cold, festive season. Indoor venues essential, brief outdoor activities only (Christmas markets with mulled wine)."
  };
  
  return contexts[month] || "Moderate weather";
}
