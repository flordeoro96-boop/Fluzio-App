import OpenAI from 'openai';
import { User, StrategicMatch } from '../types';
import { captureError, captureMessage } from './sentryService';

// Support both frontend env and process.env (for consistency with backend)
const apiKey = import.meta.env.VITE_OPENAI_API_KEY || (typeof process !== 'undefined' && process.env?.OPENAI_API_KEY) || '';

let openaiClient: OpenAI | null = null;

// Check if API key is valid (not a placeholder)
const isValidApiKey = (key: string): boolean => {
  return key && 
         key.length > 20 && 
         !key.includes('your_') && 
         !key.includes('placeholder') &&
         (key.startsWith('sk-') || key.startsWith('sk-proj-'));
};

// Initialize OpenAI client
const getClient = () => {
  if (!openaiClient && apiKey && isValidApiKey(apiKey)) {
    openaiClient = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true // For client-side usage
    });
  }
  return openaiClient;
};

/**
 * Generate mission description using ChatGPT
 */
export const generateMissionDescription = async (
  title: string,
  businessType: string,
  requirements: string
): Promise<string> => {
  const client = getClient();
  
  if (!client) {
    console.warn("OpenAI API Key not found. Returning mock response.");
    return "Create an engaging social media post featuring our product. Make sure to tag us and have fun! (AI Generation Unavailable)";
  }

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a marketing assistant for Fluzio, a platform connecting local businesses with creators. Write short, exciting, professional mission descriptions."
        },
        {
          role: "user",
          content: `Write a mission description (max 2 sentences).\n\nBusiness Type: ${businessType}\nMission Title: ${title}\nRequirements: ${requirements}\n\nTone: Enthusiastic, clear, and inviting.`
        }
      ],
      temperature: 0.7,
      max_tokens: 100
    });

    return completion.choices[0]?.message?.content?.trim() || "Join us for this exciting opportunity!";
  } catch (error) {
    console.error("Error generating mission description:", error);
    return "Join us for this exciting opportunity! Check the requirements and apply today.";
  }
};

/**
 * Generate gamification badge name using ChatGPT
 */
export const generateGamificationBadgeName = async (userInterests: string[]): Promise<string> => {
  const client = getClient();
  
  if (!client) return "Super Star";

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `Suggest a single, cool, 2-word badge name for a user interested in: ${userInterests.join(', ')}. Only respond with the badge name, no quotes or explanation.`
        }
      ],
      temperature: 0.8,
      max_tokens: 10
    });

    return completion.choices[0]?.message?.content?.replace(/"/g, '').trim() || "Community Hero";
  } catch (error) {
    console.error("Error generating badge name:", error);
    return "Community Hero";
  }
};

/**
 * Generate mission ideas using ChatGPT
 */
export const generateMissionIdeas = async (
  businessType: string,
  location: string
): Promise<Array<{title: string; description: string; requirements: string[]; category: string}>> => {
  const client = getClient();
  
  // Mock fallback
  if (!client) {
    await new Promise(r => setTimeout(r, 1000));
    return [
      {
        title: `Visit ${businessType}`,
        description: `Come visit our ${businessType} in ${location} and share your experience on Instagram Stories!`,
        requirements: ["Take a photo", "Tag us"],
        category: "Lifestyle"
      },
      {
        title: "Hidden Gem Spotlight",
        description: "Find your favorite item in our store and tell your followers why you love it.",
        requirements: ["Photo of item", "Short review"],
        category: "Other"
      },
      {
        title: "Bring a Friend",
        description: "Bring a friend along for a discount and capture the moment together.",
        requirements: ["Selfie with friend", "Purchase receipt"],
        category: "Lifestyle"
      }
    ];
  }

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a creative marketing assistant generating social media mission ideas. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: `Generate 3 distinct, creative mission ideas for:\nBusiness Type: ${businessType}\nLocation: ${location}\n\nCategories: Coffee, Food, Fashion, Tech, Lifestyle, Travel, Pets, Beauty, Other\n\nRespond with JSON array: [{"title": "...", "description": "...", "requirements": ["...", "..."], "category": "..."}]`
        }
      ],
      temperature: 0.8,
      max_tokens: 500,
      response_format: { type: "json_object" }
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) return [];
    
    const parsed = JSON.parse(response);
    return parsed.missions || parsed.ideas || parsed;
  } catch (error) {
    console.error("Error generating mission ideas:", error);
    
    // Track OpenAI errors in Sentry
    captureError(error as Error, {
      service: 'openaiService',
      function: 'generateMissionIdeas',
      businessType,
      location,
    });
    
    return [];
  }
};

/**
 * Generate creative mission ideas with detailed structure for MissionCreationModal
 */
export const generateCreativeMissionIdeas = async (params: {
  businessName: string;
  businessType: string;
  category: string;
  website?: string;
}): Promise<Array<{
  title: string;
  description: string;
  postType: 'PHOTO' | 'VIDEO' | 'STORY' | 'REEL' | 'CAROUSEL';
  suggestedPoints: number;
  hashtags: string[];
}>> => {
  const client = getClient();
  
  if (!client) {
    console.warn("OpenAI API Key not found. Returning mock mission ideas.");
    return [
      {
        title: "Showcase Your Favorite Product",
        description: "Share a photo or video of your favorite item from our collection. Tell your followers why you love it!",
        postType: "PHOTO",
        suggestedPoints: 100,
        hashtags: ["favorite", "shopping", params.businessType.toLowerCase().replace(/\s+/g, '')]
      },
      {
        title: "Behind the Scenes Story",
        description: "Post an Instagram Story showing your visit to our location. Give your followers a peek behind the scenes!",
        postType: "STORY",
        suggestedPoints: 75,
        hashtags: ["behindthescenes", "local", "discover"]
      },
      {
        title: "Product Reel Challenge",
        description: "Create a fun Reel featuring our products. Get creative and show us your unique style!",
        postType: "REEL",
        suggestedPoints: 150,
        hashtags: ["reel", "creative", "style"]
      }
    ];
  }

  try {
    const prompt = `You are a creative marketing expert helping businesses create engaging social media missions.

Business Details:
- Name: ${params.businessName}
- Type: ${params.businessType}
- Category: ${params.category}
${params.website ? `- Website: ${params.website}` : ''}

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

Return a JSON object with this exact structure:
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

    const completion = await client.chat.completions.create({
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

    const responseText = completion.choices[0]?.message?.content?.trim();
    if (!responseText) {
      console.error('Empty response from OpenAI');
      return [];
    }

    console.log('OpenAI response:', responseText);

    // Parse JSON response
    const missionData = JSON.parse(responseText);
    
    if (!missionData.missions || !Array.isArray(missionData.missions)) {
      console.error('Invalid mission data structure:', missionData);
      return [];
    }

    return missionData.missions;

  } catch (error) {
    console.error('Error generating creative mission ideas:', error);
    captureError(error as Error, {
      service: 'openaiService',
      function: 'generateCreativeMissionIdeas',
      params,
    });
    
    // Return mock missions on error
    console.warn('Returning mock mission ideas due to API error');
    return [
      {
        title: `Showcase ${params.businessName}`,
        description: `Share a photo or video of your experience at ${params.businessName}. Tag us and tell your followers why you love it!`,
        postType: "PHOTO" as const,
        suggestedPoints: 100,
        hashtags: [params.businessName.toLowerCase().replace(/\s+/g, ''), params.category.toLowerCase(), "local"]
      },
      {
        title: "Behind the Scenes Story",
        description: `Post an Instagram Story showing your visit. Give your followers a peek behind the scenes and share what makes ${params.businessName} special!`,
        postType: "STORY" as const,
        suggestedPoints: 75,
        hashtags: ["behindthescenes", "local", "discover"]
      },
      {
        title: "Creative Reel Challenge",
        description: `Create a fun 15-30 second Reel featuring ${params.businessName}. Show off your creative side and help spread the word!`,
        postType: "REEL" as const,
        suggestedPoints: 150,
        hashtags: ["reel", "creative", params.category.toLowerCase()]
      },
      {
        title: "Product Review Post",
        description: `Write an honest review post about your favorite item or experience. Share the details and help others discover something great!`,
        postType: "PHOTO" as const,
        suggestedPoints: 125,
        hashtags: ["review", "recommendation", "musttry"]
      },
      {
        title: "Bring a Friend",
        description: `Bring a friend along and capture a photo together! Tag both ${params.businessName} and your friend to complete this mission.`,
        postType: "PHOTO" as const,
        suggestedPoints: 100,
        hashtags: ["friends", "together", "goodtimes"]
      }
    ];
  }
};

/**
 * Generate creative partnership project ideas with AI
 */
export const generateProjectIdeas = async (params: {
  businessName: string;
  businessType?: string;
  category?: string;
  budget?: number;
}): Promise<Array<{
  title: string;
  description: string;
  estimatedCost: number;
  slots: Array<{ role: string; cost: number; description: string }>;
}>> => {
  const client = getClient();
  
  // Industry-specific mock projects
  const businessType = (params.businessType || params.category || '').toLowerCase();
  const isVisualBusiness = businessType.includes('jewelry') || businessType.includes('fashion') || 
                           businessType.includes('beauty') || businessType.includes('retail') ||
                           businessType.includes('restaurant') || businessType.includes('cafe');
  
  const mockProjects = isVisualBusiness ? [
    {
      title: `${params.businessName} Product Photography Campaign`,
      description: 'High-quality product photography and styled shoots for your collection, perfect for social media and e-commerce.',
      estimatedCost: 2800,
      slots: [
        { role: 'Product Photographer', cost: 1200, description: 'Professional product and lifestyle photography session' },
        { role: 'Styling & Props', cost: 600, description: 'Professional stylist and curated props/backdrops' },
        { role: 'Photo Editing', cost: 500, description: 'Professional retouching and color grading' },
        { role: 'Social Media Templates', cost: 500, description: 'Branded Instagram story and post templates' }
      ]
    },
    {
      title: 'Influencer Marketing Partnership',
      description: 'Collaborate with micro-influencers to showcase your products and reach targeted audiences authentically.',
      estimatedCost: 2200,
      slots: [
        { role: 'Influencer Coordination', cost: 800, description: '3-4 micro-influencers for product features' },
        { role: 'Content Creation', cost: 600, description: 'Professional photos/videos for influencer use' },
        { role: 'Campaign Management', cost: 500, description: 'Track engagement, analytics, and ROI' },
        { role: 'Social Media Ads', cost: 300, description: 'Boost top-performing influencer posts' }
      ]
    },
    {
      title: 'Social Media Campaign Launch',
      description: 'Complete social media campaign with professional content, strategy, and paid advertising to build brand awareness.',
      estimatedCost: 3200,
      slots: [
        { role: 'Content Photographer', cost: 1000, description: 'Photo/video content for 1 month campaign' },
        { role: 'Social Media Manager', cost: 800, description: 'Strategy, posting schedule, and community engagement' },
        { role: 'Graphic Designer', cost: 600, description: 'Feed aesthetics, stories, and branded graphics' },
        { role: 'Paid Advertising', cost: 800, description: 'Instagram and Facebook ad budget and optimization' }
      ]
    }
  ] : [
    {
      title: `${params.businessName} Grand Opening Event`,
      description: 'Launch your business with a memorable grand opening that attracts customers and creates buzz in the community.',
      estimatedCost: 3500,
      slots: [
        { role: 'Event Photography', cost: 800, description: 'Professional photographer for 4 hours' },
        { role: 'Catering Services', cost: 1200, description: 'Food and beverages for 100 guests' },
        { role: 'Live Entertainment', cost: 1000, description: 'Local band or DJ for 3 hours' },
        { role: 'Marketing Materials', cost: 500, description: 'Flyers, banners, and social media graphics' }
      ]
    },
    {
      title: 'Collaborative Marketing Campaign',
      description: 'Partner with complementary businesses to create a joint marketing campaign that reaches a wider audience.',
      estimatedCost: 2000,
      slots: [
        { role: 'Content Creator', cost: 600, description: 'Professional content creation for social media' },
        { role: 'Graphic Design', cost: 400, description: 'Campaign visuals and branding' },
        { role: 'Social Media Ads', cost: 800, description: 'Sponsored posts and advertising' },
        { role: 'Influencer Partnership', cost: 200, description: 'Micro-influencer collaboration' }
      ]
    },
    {
      title: 'Community Workshop Series',
      description: 'Host educational workshops that showcase your expertise while building community connections.',
      estimatedCost: 1500,
      slots: [
        { role: 'Venue Rental', cost: 500, description: 'Event space for workshops' },
        { role: 'Materials & Supplies', cost: 400, description: 'Workshop materials and handouts' },
        { role: 'Video Production', cost: 600, description: 'Record and edit workshop content' }
      ]
    }
  ];

  if (!client) {
    console.warn('[OpenAI] No API key, returning mock project ideas');
    return mockProjects;
  }

  try {
    const systemPrompt = `You are a business partnership expert specializing in cost-sharing collaborations for small businesses.
Your expertise includes understanding industry-specific needs, especially for visual and product-based businesses.

For businesses like jewelry, fashion, beauty, restaurants, and retail:
- Focus heavily on photography, videography, and visual content
- Emphasize social media campaigns and influencer partnerships
- Include content creation, styling, and professional editing
- Consider seasonal campaigns, product launches, and lookbooks

For service-based businesses:
- Focus on events, workshops, and community engagement
- Include venue partnerships and collaborative promotions
- Consider co-marketing and cross-promotional opportunities

Generate realistic, actionable projects that create win-win scenarios for all partners involved.
Provide specific, industry-relevant partnership slots with accurate cost estimates.`;

    const userPrompt = `Business: ${params.businessName}
Industry/Type: ${params.businessType || params.category || 'General Business'}
${params.budget ? `Budget Range: €${params.budget}` : ''}

Generate 3 highly relevant partnership project ideas tailored to this specific industry.
For visual/product businesses (jewelry, fashion, beauty, retail, food):
- Prioritize photography, content creation, social media campaigns
- Include influencer partnerships and professional styling
- Focus on e-commerce and social media presence

For each project, provide:
1. A compelling, industry-specific title
2. Brief description (1-2 sentences) explaining the value
3. Realistic estimated total cost (€1,500 - €4,000 range)
4. 3-5 specific partnership slots with:
   - Role/service needed (be specific to the industry)
   - Individual cost (realistic pricing)
   - Brief description of deliverables

Return ONLY a JSON array with this structure:
[
  {
    "title": "Project Title",
    "description": "Brief description",
    "estimatedCost": 2500,
    "slots": [
      { "role": "Specific Role Name", "cost": 500, "description": "What's included" }
    ]
  }
]`;

    const completion = await client.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.8,
      max_tokens: 2000
    });

    const responseText = completion.choices[0]?.message?.content?.trim() || '';
    
    // Extract JSON from response
    const jsonMatch = responseText.match(/\[\s*{[\s\S]*}\s*\]/);
    if (jsonMatch) {
      const projects = JSON.parse(jsonMatch[0]);
      console.log('[OpenAI] Generated project ideas:', projects);
      return projects;
    }

    console.warn('[OpenAI] Could not parse AI response, using mock data');
    return mockProjects;
  } catch (error) {
    console.error('[OpenAI] Error generating project ideas:', error);
    return mockProjects;
  }
};

/**
 * Find strategic business matches using ChatGPT
 */
export const findStrategicMatches = async (
  myProfile: User,
  candidates: User[]
): Promise<StrategicMatch[]> => {
  const client = getClient();
  
  const targetCity = myProfile.homeCity || "Berlin";
  const isGlobal = myProfile.subscriptionScope === 'GLOBAL';
  
  // Filter eligible candidates
  const eligibleCandidates = candidates.filter(c => 
    c.id !== myProfile.id && 
    c.role === 'BUSINESS' && 
    c.activeGoal && 
    myProfile.activeGoal &&
    c.activeGoal.type === myProfile.activeGoal.type
  );

  if (eligibleCandidates.length === 0) return [];

  const myData = {
    name: myProfile.name,
    businessType: myProfile.businessType,
    bio: myProfile.bio,
    goal: myProfile.activeGoal?.type,
    budget: myProfile.activeGoal?.budget,
    location: myProfile.location,
    city: targetCity
  };

  if (!client) {
    // Mock fallback
    const filteredMockCandidates = isGlobal 
      ? eligibleCandidates 
      : eligibleCandidates.filter(c => c.homeCity === targetCity);

    return filteredMockCandidates.map(c => ({
      candidateId: c.id,
      matchScore: Math.floor(Math.random() * 30) + 60,
      collaborationPitch: `Partner with ${c.name} to pool your budget for a higher quality outcome.`
    }));
  }

  try {
    const candidatesData = eligibleCandidates.map(c => ({
      id: c.id,
      name: c.name,
      businessType: c.businessType,
      bio: c.bio,
      budget: c.activeGoal?.budget,
      location: c.location,
      city: c.homeCity || "Unknown"
    }));

    const cityInstruction = isGlobal
      ? `You may return businesses from any city, but prioritize those in ${targetCity}.`
      : `Only return businesses in ${targetCity}. Do not mix cities.`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a B2B Partnership Consultant. Score collaboration matches and provide partnership pitches. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: `Match businesses for "${myData.goal}" collaboration.\n\nMy Business: ${JSON.stringify(myData)}\n\nCandidates: ${JSON.stringify(candidatesData)}\n\n${cityInstruction}\n\nCriteria:\n1. Visual/category compatibility\n2. Budget viability\n3. Location match\n\nRespond with JSON: [{"candidateId": "...", "matchScore": 0-100, "collaborationPitch": "one sentence"}]`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) return [];
    
    const parsed = JSON.parse(response);
    return parsed.matches || parsed.results || parsed;
  } catch (error) {
    console.error("Error finding strategic matches:", error);
    return eligibleCandidates.map(c => ({
      candidateId: c.id,
      matchScore: 50,
      collaborationPitch: `Collaborate with ${c.name} on your ${myData.goal}.`
    }));
  }
};

/**
 * Generate AI-powered meetup description
 */
export const generateMeetupDescription = async (
  category: string,
  businessName: string,
  businessType: string,
  vibe: string[]
): Promise<string> => {
  const client = getClient();
  
  if (!client) {
    return `Join us for a ${category.toLowerCase()} meetup at ${businessName}! Connect with 3 like-minded people in an intimate setting.`;
  }

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a social event coordinator writing warm, inviting meetup descriptions. Be concise and authentic."
        },
        {
          role: "user",
          content: `Write a meetup description (2-3 sentences max) for a 4-person social meetup.\n\nCategory: ${category}\nBusiness: ${businessName} (${businessType})\nVibe: ${vibe.join(', ')}\n\nFocus on social connection. No emojis.`
        }
      ],
      temperature: 0.7,
      max_tokens: 80
    });

    return completion.choices[0]?.message?.content?.trim() || 
      `Join us for a ${category.toLowerCase()} meetup at ${businessName}! Connect with 3 like-minded people in an intimate setting.`;
  } catch (error) {
    console.error("Error generating meetup description:", error);
    return `Join us for a ${category.toLowerCase()} meetup at ${businessName}! Connect with 3 like-minded people in an intimate setting.`;
  }
};

/**
 * Generate smart chat summary after meetup
 */
export const generateChatSummary = async (
  messages: Array<{ senderName: string; message: string }>,
  meetupCategory: string
): Promise<string> => {
  const client = getClient();
  
  if (!client || messages.length === 0) {
    return "Great conversation! Thanks for joining the meetup.";
  }

  try {
    const chatText = messages
      .filter(m => !m.message.includes('Welcome to the meetup chat'))
      .slice(-20) // Last 20 messages
      .map(m => `${m.senderName}: ${m.message}`)
      .join('\n');

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `Summarize this ${meetupCategory} meetup chat in one friendly sentence (max 15 words).\n\n${chatText}\n\nBe warm and positive. No emojis.`
        }
      ],
      temperature: 0.6,
      max_tokens: 30
    });

    return completion.choices[0]?.message?.content?.trim() || 
      "Great meetup! Thanks for the wonderful conversation.";
  } catch (error) {
    console.error("Error generating chat summary:", error);
    return "Great meetup! Thanks for the wonderful conversation.";
  }
};

/**
 * Generate personalized meetup recommendation reason
 */
export const generateMeetupRecommendationReason = async (
  userName: string,
  userInterests: string[],
  userVibe: string[],
  meetupCategory: string,
  meetupVibe: string[]
): Promise<string> => {
  const client = getClient();
  
  if (!client) {
    return `Perfect for your ${userInterests[0] || 'social'} interests!`;
  }

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `Explain in ONE short sentence (max 12 words) why this meetup matches this user.\n\nUser: ${userName}\nInterests: ${userInterests.join(', ')}\nVibe: ${userVibe.join(', ')}\n\nMeetup: ${meetupCategory}\nVibe: ${meetupVibe.join(', ')}\n\nStart with "Perfect for..." No emojis.`
        }
      ],
      temperature: 0.7,
      max_tokens: 20
    });

    return completion.choices[0]?.message?.content?.trim() || 
      `Perfect for your ${userInterests[0] || 'social'} interests!`;
  } catch (error) {
    console.error("Error generating recommendation reason:", error);
    return `Perfect for your ${userInterests[0] || 'social'} interests!`;
  }
};

/**
 * Generate AI about section for user profile
 */
export const generateAIAbout = async (
  interests: string[],
  vibe: string,
  role: string
): Promise<string> => {
  const client = getClient();
  
  if (!client) {
    return `Passionate ${role.toLowerCase()} interested in ${interests.join(', ')}. Always looking for new connections and experiences!`;
  }

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `Write a friendly, authentic "about me" bio (2-3 sentences max).\n\nRole: ${role}\nInterests: ${interests.join(', ')}\nVibe: ${vibe}\n\nBe personal and warm. No emojis.`
        }
      ],
      temperature: 0.8,
      max_tokens: 60
    });

    return completion.choices[0]?.message?.content?.trim() || 
      `Passionate ${role.toLowerCase()} interested in ${interests.join(', ')}.`;
  } catch (error) {
    console.error("Error generating AI about:", error);
    return `Passionate ${role.toLowerCase()} interested in ${interests.join(', ')}.`;
  }
};

/**
 * AI-powered business matching for meetup recommendations
 * Analyzes user profile, behavior, and preferences to find best business matches
 */
export const findBusinessMatchesForMeetup = async (
  userProfile: {
    id: string;
    name: string;
    vibeTags: string[];
    interests?: string[];
    city: string;
    recentActivity?: string[];
    favoriteCategories?: string[];
  },
  businesses: Array<{
    id: string;
    name: string;
    businessType: string;
    vibeTags: string[];
    category?: string;
    city: string;
    bio?: string;
  }>,
  meetupType: 'squad' | 'browse',
  limit: number = 5
): Promise<Array<{
  businessId: string;
  matchScore: number;
  personalizedPitch: string;
  reason: string;
}>> => {
  const client = getClient();
  
  // Fallback to rule-based matching if no OpenAI
  if (!client) {
    return businesses
      .filter(b => b.vibeTags?.some(tag => userProfile.vibeTags?.includes(tag)))
      .slice(0, limit)
      .map(b => ({
        businessId: b.id,
        matchScore: 75,
        personalizedPitch: `${b.name} is a great match for your interests in ${userProfile.vibeTags.join(', ')}!`,
        reason: 'Shared interests'
      }));
  }

  try {
    const userData = {
      name: userProfile.name,
      interests: userProfile.vibeTags || [],
      city: userProfile.city,
      recentActivity: userProfile.recentActivity || [],
      favoriteCategories: userProfile.favoriteCategories || []
    };

    const businessData = businesses.map(b => ({
      id: b.id,
      name: b.name,
      type: b.businessType,
      vibe: b.vibeTags || [],
      category: b.category,
      bio: b.bio?.substring(0, 100) // Limit for token efficiency
    }));

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a matchmaking AI for social meetups. Analyze user preferences and business characteristics to find perfect matches. Respond ONLY with valid JSON."
        },
        {
          role: "user",
          content: `Find the top ${limit} business matches for a ${meetupType} meetup request.\n\nUser Profile:\n${JSON.stringify(userData)}\n\nAvailable Businesses:\n${JSON.stringify(businessData)}\n\nCriteria:\n1. Interest/vibe alignment (50%)\n2. Recent activity patterns (20%)\n3. Category preference (20%)\n4. Surprise factor/variety (10%)\n\nRespond with JSON array:\n[{\n  "businessId": "id",\n  "matchScore": 0-100,\n  "personalizedPitch": "One sentence notification message to business explaining why this user is a good match",\n  "reason": "Short match reason (5 words max)"\n}]\n\nReturn top ${limit} matches, sorted by score.`
        }
      ],
      temperature: 0.7,
      max_tokens: 800,
      response_format: { type: "json_object" }
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }
    
    const parsed = JSON.parse(response);
    const matches = parsed.matches || parsed.results || parsed;
    
    return Array.isArray(matches) ? matches.slice(0, limit) : [];
  } catch (error) {
    console.error("Error finding business matches with AI:", error);
    // Fallback to simple tag matching
    return businesses
      .filter(b => b.vibeTags?.some(tag => userProfile.vibeTags?.includes(tag)))
      .slice(0, limit)
      .map(b => ({
        businessId: b.id,
        matchScore: 70,
        personalizedPitch: `${userProfile.name} is looking for a ${meetupType} meetup and shares your ${b.vibeTags[0]} vibe!`,
        reason: 'Shared interests'
      }));
  }
};

/**
 * Generate AI reward suggestions based on business type and context
 * Now uses Cloud Function instead of direct OpenAI calls for security
 */
export const generateRewardSuggestions = async (
  businessType: string,
  businessName: string,
  existingRewards?: Array<{ title: string; category: string }>,
  businessContext?: {
    category?: string;
    aboutText?: string;
    website?: string;
    description?: string;
    services?: string[];
  }
): Promise<Array<{
  title: string;
  description: string;
  category: string;
  suggestedPoints: number;
  terms: string;
  redemptionInstructions: string;
}>> => {
  try {
    console.log('⏳ Calling Cloud Function for reward suggestions...');
    
    // Get current user's auth token
    const auth = (await import('firebase/auth')).getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const idToken = await user.getIdToken();
    
    // Call Cloud Function
    const response = await fetch('https://us-central1-fluzio-13af2.cloudfunctions.net/generaterewardsuggestions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({
        businessId: user.uid,
        businessType,
        businessName,
        businessContext,
        existingRewards
      })
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to generate suggestions');
    }
    
    console.log('✅ Received', data.rewards?.length || 0, 'AI reward suggestions from Cloud Function');
    
    return data.rewards || [];
    
  } catch (error) {
    console.error("❌ Error generating reward suggestions:", error);
    console.error("Error details:", {
      name: (error as Error).name,
      message: (error as Error).message,
      stack: (error as Error).stack
    });
    
    // Track AI generation errors
    captureError(error as Error, {
      service: 'openaiService',
      function: 'generateRewardSuggestions',
      businessType,
      businessName,
    });
    
    // Return fallback suggestions
    return [
      {
        title: '15% Off Your Next Purchase',
        description: 'Save 15% on your entire order during your next visit.',
        category: 'DISCOUNT',
        suggestedPoints: 150,
        terms: 'Valid for 30 days. Cannot be combined with other offers.',
        redemptionInstructions: 'Show this code to staff at checkout'
      }
    ];
  }
};

/**
 * Generate smart reward details based on partial input
 */
export const enhanceRewardWithAI = async (
  rewardTitle: string,
  businessType: string,
  category?: string,
  businessContext?: {
    businessName?: string;
    aboutText?: string;
    website?: string;
    description?: string;
  }
): Promise<{
  description: string;
  suggestedPoints: number;
  terms: string;
  redemptionInstructions: string;
}> => {
  const client = getClient();
  
  const fallback = {
    description: `Redeem this ${category?.toLowerCase() || 'reward'} at our ${businessType} location.`,
    suggestedPoints: 150,
    terms: 'Valid for 30 days. One per customer. Cannot be combined with other offers.',
    redemptionInstructions: 'Show this code to staff at checkout'
  };

  if (!client) return fallback;

  try {
    // Build business context
    let contextInfo = `Business Type: ${businessType}`;
    
    if (businessContext?.businessName) {
      contextInfo += `\nBusiness Name: ${businessContext.businessName}`;
    }
    
    if (businessContext?.aboutText) {
      contextInfo += `\n\nAbout: ${businessContext.aboutText.substring(0, 300)}`;
    }
    
    if (businessContext?.description) {
      contextInfo += `\n\nDescription: ${businessContext.description}`;
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a marketing expert helping create compelling reward descriptions and terms. Make rewards SPECIFIC to the business context provided. Respond ONLY with valid JSON."
        },
        {
          role: "user",
          content: `${contextInfo}
Reward Title: "${rewardTitle}"
Category: ${category || 'general'}

Generate:
1. Compelling description (80-120 chars) that makes this reward sound valuable
2. Fair point cost (100-500 range based on perceived value)
3. Clear terms and conditions (50-100 chars)
4. Simple redemption instructions (30-60 chars)

Respond with JSON:
{
  "description": "...",
  "suggestedPoints": number,
  "terms": "...",
  "redemptionInstructions": "..."
}`
        }
      ],
      temperature: 0.7,
      max_tokens: 300,
      response_format: { type: "json_object" }
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) return fallback;
    
    const parsed = JSON.parse(response);
    return {
      description: parsed.description || fallback.description,
      suggestedPoints: parsed.suggestedPoints || fallback.suggestedPoints,
      terms: parsed.terms || fallback.terms,
      redemptionInstructions: parsed.redemptionInstructions || fallback.redemptionInstructions
    };
  } catch (error) {
    console.error("Error enhancing reward with AI:", error);
    return fallback;
  }
};

/**
 * Generate AI-powered event ideas with comprehensive details
 * Enhanced for AdminEventManagement with all event parameters
 */
export const generateEventIdeas = async (params: {
  duration: '1-day' | '3-day' | '7-day' | 'camp';
  categories: string[];
  targetAudience: 'businesses' | 'influencers' | 'all';
  genderRestriction: 'mixed' | 'men' | 'women';
  location: 'city' | 'country' | 'continent';
  locationName: string;
  season: 'spring' | 'summer' | 'fall' | 'winter' | 'all';
}): Promise<Array<{
  title: string;
  description: string;
  type: 'NETWORKING' | 'WORKSHOP' | 'CONFERENCE' | 'MEETUP' | 'TRAINING' | 'SOCIAL' | 'RETREAT' | 'BOOTCAMP' | 'CAMP';
  duration: '1-day' | '3-day' | '7-day' | 'multi-day';
  suggestedLocation: string;
  estimatedAttendees: number;
  keyActivities: string[];
  targetAudience: 'ALL' | 'BUSINESSES' | 'CREATORS' | 'PREMIUM';
  category: string;
  pricingGuidance: {
    pointsCost: number;
    moneyCost: number;
  };
}>> => {
  const client = getClient();
  
  // Build fallback events based on parameters
  const mockEvents = [
    {
      title: `${params.duration === '1-day' ? 'Intensive' : 'Immersive'} ${params.categories[0] || 'Business'} ${params.duration === 'camp' ? 'Camp' : 'Workshop'}`,
      description: `A transformative ${params.duration} experience focused on ${params.categories.join(', ')} for ${params.targetAudience === 'all' ? 'everyone' : params.targetAudience}.`,
      type: (params.duration === 'camp' ? 'CAMP' : params.duration === '1-day' ? 'WORKSHOP' : 'RETREAT') as 'NETWORKING' | 'WORKSHOP' | 'CONFERENCE' | 'MEETUP' | 'TRAINING' | 'SOCIAL' | 'RETREAT' | 'BOOTCAMP' | 'CAMP',
      duration: (params.duration === 'camp' ? 'multi-day' : params.duration) as '1-day' | '3-day' | '7-day' | 'multi-day',
      suggestedLocation: params.locationName || (params.location === 'city' ? 'Berlin, Munich, or Hamburg' : params.location === 'country' ? 'Germany' : 'Europe'),
      estimatedAttendees: params.duration === '1-day' ? 50 : params.duration === '3-day' ? 30 : 20,
      keyActivities: [
        `${params.categories[0] || 'Business'} workshops`,
        'Networking sessions',
        'Expert panels',
        'Hands-on activities'
      ],
      targetAudience: (params.targetAudience === 'businesses' ? 'BUSINESSES' : params.targetAudience === 'influencers' ? 'CREATORS' : 'ALL') as 'ALL' | 'BUSINESSES' | 'CREATORS' | 'PREMIUM',
      category: params.categories[0] || 'business',
      pricingGuidance: {
        pointsCost: params.duration === '1-day' ? 500 : params.duration === '3-day' ? 1200 : 2500,
        moneyCost: params.duration === '1-day' ? 50 : params.duration === '3-day' ? 150 : 350
      }
    },
    {
      title: `${params.season !== 'all' ? params.season.charAt(0).toUpperCase() + params.season.slice(1) : ''} ${params.categories[1] || 'Networking'} Summit`,
      description: `Connect with like-minded ${params.targetAudience === 'businesses' ? 'business owners' : params.targetAudience === 'influencers' ? 'creators and influencers' : 'professionals'} in an inspiring setting.`,
      type: 'CONFERENCE' as const,
      duration: (params.duration === 'camp' ? 'multi-day' : params.duration) as '1-day' | '3-day' | '7-day' | 'multi-day',
      suggestedLocation: params.locationName || 'Barcelona, Spain',
      estimatedAttendees: params.duration === '1-day' ? 100 : 60,
      keyActivities: [
        'Keynote speeches',
        'Breakout sessions',
        'Speed networking',
        'Social evening events'
      ],
      targetAudience: (params.targetAudience === 'businesses' ? 'BUSINESSES' : params.targetAudience === 'influencers' ? 'CREATORS' : 'PREMIUM') as 'ALL' | 'BUSINESSES' | 'CREATORS' | 'PREMIUM',
      category: params.categories[1] || 'networking',
      pricingGuidance: {
        pointsCost: params.duration === '1-day' ? 800 : 1800,
        moneyCost: params.duration === '1-day' ? 80 : 200
      }
    },
    {
      title: `${params.genderRestriction === 'women' ? 'Women in' : params.genderRestriction === 'men' ? 'Men\'s' : 'Community'} ${params.categories[2] || 'Leadership'} Bootcamp`,
      description: `An intensive ${params.duration} program designed to elevate your ${params.categories[2] || 'leadership'} skills through practical exercises and peer learning.`,
      type: 'BOOTCAMP' as const,
      duration: (params.duration === 'camp' ? 'multi-day' : params.duration) as '1-day' | '3-day' | '7-day' | 'multi-day',
      suggestedLocation: params.locationName || 'Amsterdam, Netherlands',
      estimatedAttendees: params.duration === '1-day' ? 40 : 25,
      keyActivities: [
        'Interactive workshops',
        'Group challenges',
        'Mentorship sessions',
        'Final presentations'
      ],
      targetAudience: 'ALL' as const,
      category: params.categories[2] || 'personal_development',
      pricingGuidance: {
        pointsCost: params.duration === '1-day' ? 600 : params.duration === '3-day' ? 1500 : 3000,
        moneyCost: params.duration === '1-day' ? 60 : params.duration === '3-day' ? 180 : 400
      }
    }
  ];

  if (!client) {
    console.warn('[OpenAI] No API key, returning mock event ideas');
    return mockEvents;
  }

  try {
    const systemPrompt = `You are an expert event planning consultant specializing in creating impactful events for businesses, creators, and professionals.

Your expertise includes:
- Understanding event formats: networking events, workshops, conferences, retreats, bootcamps, and multi-day camps
- Creating engaging curricula and activity schedules
- Matching event types to target audiences and goals
- Pricing events appropriately based on value delivered
- Selecting ideal locations and venues

Generate creative, actionable event concepts that participants will love.`;

    const categoriesStr = params.categories.length > 0 ? params.categories.join(', ') : 'any relevant topics';
    const locationStr = params.locationName || `any ${params.location}`;
    const seasonStr = params.season !== 'all' ? ` during ${params.season}` : '';
    const genderStr = params.genderRestriction === 'mixed' ? 'mixed gender groups' : params.genderRestriction === 'women' ? 'women only' : 'men only';
    
    const userPrompt = `Generate 5 diverse, creative event ideas with these parameters:

**Event Parameters:**
- Duration: ${params.duration} (${params.duration === '1-day' ? 'single intensive day' : params.duration === '3-day' ? 'long weekend program' : params.duration === '7-day' ? 'week-long immersive experience' : 'multi-week transformational camp'})
- Categories: ${categoriesStr}
- Target Audience: ${params.targetAudience === 'businesses' ? 'Business owners and entrepreneurs' : params.targetAudience === 'influencers' ? 'Content creators and influencers' : 'All professionals'}
- Gender: ${genderStr}
- Location: ${locationStr}${seasonStr}

**Requirements:**
1. Each event must be highly specific to the categories provided
2. Include 4-6 key activities that match the duration and theme
3. Suggest realistic attendee numbers (1-day: 30-100, 3-day: 20-50, 7-day: 15-30, camp: 10-25)
4. Provide specific location suggestions within the given scope
5. Price appropriately (points: 500-5000, money: €50-500) based on duration and value

**Return ONLY a JSON array with this exact structure:**
[
  {
    "title": "Event Title (creative and specific)",
    "description": "2-3 sentence description highlighting unique value proposition",
    "type": "NETWORKING|WORKSHOP|CONFERENCE|MEETUP|TRAINING|SOCIAL|RETREAT|BOOTCAMP|CAMP",
    "duration": "${params.duration === 'camp' ? 'multi-day' : params.duration}",
    "suggestedLocation": "Specific city/venue or region",
    "estimatedAttendees": number,
    "keyActivities": ["Activity 1", "Activity 2", "Activity 3", "Activity 4"],
    "targetAudience": "${params.targetAudience === 'businesses' ? 'BUSINESSES' : params.targetAudience === 'influencers' ? 'CREATORS' : 'ALL'}",
    "category": "primary category from the list",
    "pricingGuidance": {
      "pointsCost": number,
      "moneyCost": number
    }
  }
]`;

    const completion = await client.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.9,
      max_tokens: 3000
    });

    const responseText = completion.choices[0]?.message?.content?.trim() || '';
    
    // Extract JSON from response
    const jsonMatch = responseText.match(/\[\s*{[\s\S]*}\s*\]/);
    if (jsonMatch) {
      const events = JSON.parse(jsonMatch[0]);
      console.log('[OpenAI] Generated event ideas:', events);
      
      // Validate and return
      if (Array.isArray(events) && events.length > 0) {
        return events;
      }
    }

    console.warn('[OpenAI] Could not parse AI response, using mock data');
    return mockEvents;
  } catch (error) {
    console.error('[OpenAI] Error generating event ideas:', error);
    captureError(error as Error, {
      service: 'openaiService',
      function: 'generateEventIdeas',
      params,
    });
    return mockEvents;
  }
};


