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
  businessPartners: Array<{ role: string; cost: number; description: string }>;
  creatorRoles: Array<{ role: string; budget: number; description: string }>;
}>> => {
  const client = getClient();
  
  // Industry-specific mock projects
  const businessType = (params.businessType || params.category || '').toLowerCase();
  const isVisualBusiness = businessType.includes('jewelry') || businessType.includes('fashion') || 
                           businessType.includes('beauty') || businessType.includes('retail') ||
                           businessType.includes('restaurant') || businessType.includes('cafe');
  
  const mockProjects = isVisualBusiness ? [
    {
      title: `${params.businessName} Glamour Photoshoot Partnership`,
      description: 'Co-create stunning visual content with complementary brands - shared shoot, shared costs, all brands get usage rights.',
      estimatedCost: 4500,
      businessPartners: [
        { role: 'Fashion Boutique Partner', cost: 800, description: 'Provides clothing and accessories for shoot' },
        { role: 'Jewelry Brand Partner', cost: 700, description: 'Provides jewelry pieces to be featured' },
        { role: 'Florist Partner', cost: 500, description: 'Provides flower arrangements and decor' },
        { role: 'Venue Provider Partner', cost: 600, description: 'Provides elegant location for photoshoot' }
      ],
      creatorRoles: [
        { role: 'Professional Photographer', budget: 800, description: 'Full day shoot with equipment and editing' },
        { role: 'Fashion Model', budget: 600, description: 'Professional model for jewelry and clothing' },
        { role: 'Makeup Artist', budget: 400, description: 'Hair and makeup styling' },
        { role: 'Creative Director', budget: 500, description: 'Art direction and styling coordination' }
      ]
    },
    {
      title: 'Co-Branded Social Campaign',
      description: 'Partner with complementary businesses to create shared marketing content that promotes all participating brands.',
      estimatedCost: 3800,
      businessPartners: [
        { role: 'Beauty Salon Partner', cost: 900, description: 'Co-products featured, provides makeup/hair services' },
        { role: 'Cafe/Restaurant Partner', cost: 700, description: 'Provides attractive location backdrop' },
        { role: 'Fashion Brand Partner', cost: 600, description: 'Provides outfits and accessories' }
      ],
      creatorRoles: [
        { role: 'Content Creator', budget: 700, description: 'Creates photos and videos for social media' },
        { role: 'Influencer', budget: 500, description: 'Features products with their audience' },
        { role: 'Video Editor', budget: 400, description: 'Professional editing for Instagram/TikTok' }
      ]
    },
    {
      title: 'Lifestyle Content Day',
      description: 'Full-day content creation with multiple businesses - produce marketing materials for websites, social media, and ads.',
      estimatedCost: 5200,
      businessPartners: [
        { role: 'Cafe/Restaurant Partner', cost: 1000, description: 'Provides location and food styling' },
        { role: 'Fashion/Lifestyle Partner', cost: 800, description: 'Products and styling for lifestyle shots' },
        { role: 'Home Decor Partner', cost: 700, description: 'Props and interior elements' }
      ],
      creatorRoles: [
        { role: 'Photographer', budget: 1000, description: 'Full day photoshoot with equipment' },
        { role: 'Videographer', budget: 800, description: 'Video content creation' },
        { role: 'Stylist', budget: 500, description: 'Product and scene styling' },
        { role: 'Models (2)', budget: 900, description: 'Professional models for lifestyle scenes' }
      ]
    }
  ] : [
    {
      title: `${params.businessName} Grand Opening Partnership`,
      description: 'Launch your business with complementary brands - share the event, share the costs, all benefit from foot traffic.',
      estimatedCost: 4200,
      businessPartners: [
        { role: 'Venue Co-Host Partner', cost: 800, description: 'Shares space and co-hosts the opening event' },
        { role: 'Catering Partner', cost: 1000, description: 'Provides food/drinks, gets brand visibility' },
        { role: 'Beverage Brand Partner', cost: 600, description: 'Provides drinks, promotional materials' }
      ],
      creatorRoles: [
        { role: 'Event Photographer', budget: 500, description: 'Professional event coverage' },
        { role: 'Live Musician/DJ', budget: 700, description: 'Entertainment for event' },
        { role: 'Social Media Manager', budget: 600, description: 'Live coverage and content creation' }
      ]
    },
    {
      title: 'Cross-Promotion Campaign',
      description: 'Partner with non-competing businesses to reach each other\'s audiences through joint marketing and promotions.',
      estimatedCost: 2800,
      businessPartners: [
        { role: 'Retail Partner Business', cost: 600, description: 'Co-promotes offers, shares customer base' },
        { role: 'Service Business Partner', cost: 500, description: 'Bundles services with your offering' }
      ],
      creatorRoles: [
        { role: 'Graphic Designer', budget: 600, description: 'Designs promotional materials and ads' },
        { role: 'Copywriter', budget: 500, description: 'Writes campaign copy and messaging' },
        { role: 'Marketing Consultant', budget: 600, description: 'Strategy and campaign management' }
      ]
    },
    {
      title: 'Community Event Series',
      description: 'Host recurring events with partner businesses - split costs, share audiences, build community together.',
      estimatedCost: 2600,
      businessPartners: [
        { role: 'Venue Provider Partner', cost: 700, description: 'Provides event space, co-branded signage' },
        { role: 'Supply/Product Partner', cost: 500, description: 'Provides materials, gets brand exposure' }
      ],
      creatorRoles: [
        { role: 'Event Coordinator', budget: 600, description: 'Handles logistics and coordination' },
        { role: 'Photographer', budget: 400, description: 'Event documentation' },
        { role: 'Social Media Manager', budget: 400, description: 'Promotion and live coverage' }
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

CRITICAL DISTINCTION:
1. BUSINESS PARTNERS: Companies that join as co-producers (clothing brands, venues, florists, jewelry brands)
2. CREATOR ROLES: Individual professionals hired to execute work (photographers, models, stylists, designers)

For businesses like jewelry, fashion, beauty, restaurants, and retail:
- Business Partners: complementary brands (fashion boutique, makeup brand, florist, venue provider)
- Creator Roles: photographers, videographers, models, makeup artists, stylists

For service-based businesses:
- Business Partners: venue providers, supply companies, co-host businesses
- Creator Roles: event coordinators, photographers, entertainment, designers

Generate realistic, actionable projects with BOTH business partners AND creator roles clearly separated.`;

    const userPrompt = `Business: ${params.businessName}
Industry/Type: ${params.businessType || params.category || 'General Business'}
${params.budget ? `Budget Range: €${params.budget}` : ''}

Generate 3 highly relevant partnership project ideas tailored to this specific industry.

For each project, clearly separate:
1. BUSINESS PARTNERS (companies that co-produce and share costs)
2. CREATOR ROLES (individual professionals hired to execute)

Example for jewelry photoshoot:
Business Partners: Jewelry Brand, Clothing Boutique, Florist, Makeup Brand, Venue Provider
Creator Roles: Photographer, Model, Makeup Artist, Stylist

Provide:
1. A compelling, industry-specific title
2. Brief description (1-2 sentences) explaining the value
3. Realistic estimated total cost (€2,500 - €5,500 range)
4. 3-5 business partner slots with:
   - Company role (e.g., "Fashion Boutique Partner", "Venue Provider")
   - Cost share (what they contribute financially)
   - Brief description of what they provide
5. 3-5 creator role slots with:
   - Individual role (e.g., "Photographer", "Model", "Stylist")
   - Budget/payment (what they get paid)
   - Brief description of deliverables

Return ONLY a JSON array with this structure:
[
  {
    "title": "Project Title",
    "description": "Brief description",
    "estimatedCost": 4500,
    "businessPartners": [
      { "role": "Fashion Boutique Partner", "cost": 700, "description": "Provides clothing for shoot" }
    ],
    "creatorRoles": [
      { "role": "Photographer", "budget": 800, "description": "Full day shoot with editing" }
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
 * Generate event ideas for business owners using AI
 * Supports 1-day, 3-day, 7-day events and camps
 */
export const generateEventIdeas = async (
  duration: '1-day' | '3-day' | '7-day' | 'camp',
  category: 'networking' | 'fitness' | 'wellness' | 'growth' | 'training' | 'social' | 'leadership' | 'innovation' | 'all' | string,
  targetAudience: 'businesses' | 'influencers' | 'all' = 'all',
  locationScope?: 'continent' | 'country' | 'city',
  locationName?: string,
  season?: 'spring' | 'summer' | 'fall' | 'winter' | 'all',
  genderRestriction?: 'mixed' | 'men' | 'women'
): Promise<Array<{
  title: string;
  description: string;
  type: string;
  suggestedLocation: string;
  estimatedAttendees: number;
  keyActivities: string[];
}>> => {
  const client = getClient();
  
  const fallbackEvents = [
    {
      title: 'Business Growth Summit',
      description: 'An intensive summit focused on scaling your business with expert speakers and networking.',
      type: 'CONFERENCE',
      suggestedLocation: 'City Convention Center',
      estimatedAttendees: 150,
      keyActivities: ['Keynote Speeches', 'Panel Discussions', 'Networking Sessions', 'Workshops']
    },
    {
      title: 'Entrepreneur Fitness Retreat',
      description: 'Combine business strategy with physical wellness in this transformative retreat.',
      type: 'WORKSHOP',
      suggestedLocation: 'Mountain Resort',
      estimatedAttendees: 50,
      keyActivities: ['Morning Yoga', 'Strategy Sessions', 'Team Building', 'Meditation']
    },
    {
      title: 'Leadership Bootcamp',
      description: 'Intensive leadership training for business owners ready to level up their management skills.',
      type: 'TRAINING',
      suggestedLocation: 'Business Campus',
      estimatedAttendees: 75,
      keyActivities: ['Leadership Workshops', 'Case Studies', 'Group Challenges', 'One-on-One Coaching']
    }
  ];

  if (!client) {
    console.warn("OpenAI not available, returning fallback event ideas");
    return fallbackEvents;
  }

  try {
    const categoryContext = category === 'all' 
      ? 'various categories including networking, fitness, wellness, personal growth, training, innovation, and leadership'
      : category;

    const audienceText = targetAudience === 'all' 
      ? 'business owners, influencers, and professionals' 
      : targetAudience === 'influencers' 
        ? 'influencers, content creators, and social media professionals'
        : 'business owners and entrepreneurs';

    const locationContext = locationName && locationScope
      ? `The event should be designed for ${locationScope === 'city' ? 'the city/cities of' : locationScope === 'country' ? 'the country/countries of' : 'the continent(s) of'} ${locationName}. Consider local culture, climate, and preferences.`
      : 'Consider various locations and venues that would be suitable.';

    const seasonContext = season && season !== 'all'
      ? `The event is planned for ${season}, so consider seasonal activities, weather conditions, and ${season}-appropriate themes.`
      : 'Consider seasonal factors and timing that would work best for this type of event.';

    const genderContext = genderRestriction && genderRestriction !== 'mixed'
      ? genderRestriction === 'men'
        ? `This is a MEN-ONLY event. Focus on topics, activities, and themes that resonate with male participants. Consider men's health, brotherhood, male leadership styles, father-son dynamics, men's wellness, masculine energy, and men's networking. Examples: "Men's Leadership Summit", "Brotherhood Retreat", "Gentlemen's Business Club", "Warrior Mindset Bootcamp", "Men's Wellness Weekend".`
        : `This is a WOMEN-ONLY event. Focus on topics, activities, and themes that resonate with female participants. Consider women's empowerment, sisterhood, female leadership styles, mother-daughter dynamics, women's health, feminine energy, and women's networking. Examples: "Women in Business Conference", "Sisterhood Circle Retreat", "Women Leaders Summit", "Girl Boss Bootcamp", "Women's Wellness Gathering".`
      : 'This is a mixed-gender event open to all participants. Focus on inclusive themes that appeal to everyone.';

    const prompt = `Generate 3 creative event ideas for ${audienceText} with a ${duration} format focused on ${categoryContext}.

LOCATION CONTEXT: ${locationContext}

SEASONAL CONTEXT: ${seasonContext}

GENDER RESTRICTION: ${genderContext}

Each event should be engaging, valuable, and appealing to the target audience. Consider different formats like:
- Conferences and summits
- Workshops and masterclasses
- Retreats and wellness programs
- Bootcamps and intensive training
- Networking mixers
- Innovation labs
- Leadership academies
- Fitness challenges
- Mindfulness retreats

For ${targetAudience === 'influencers' ? 'influencers and content creators' : 'business professionals'}, focus on ${targetAudience === 'influencers' ? 'content creation, brand building, audience growth, and monetization strategies' : 'business growth, networking, and professional development'}.

Return JSON with this structure:
{
  "events": [
    {
      "title": "Event name (creative, compelling, 3-6 words)",
      "description": "2-sentence description of the event and its value proposition",
      "type": "NETWORKING|WORKSHOP|CONFERENCE|TRAINING|SOCIAL|RETREAT|BOOTCAMP",
      "suggestedLocation": "Specific venue or location type${locationName ? ` in ${locationName}` : ''}",
      "estimatedAttendees": <number between 20-200>,
      "keyActivities": ["activity 1", "activity 2", "activity 3", "activity 4"]
    }
  ]
}`;

    const genderSpecialization = genderRestriction === 'men' 
      ? ' You specialize in creating men-only events that foster brotherhood, male bonding, and address topics specific to men. Use masculine language and themes.'
      : genderRestriction === 'women'
        ? ' You specialize in creating women-only events that foster sisterhood, female empowerment, and address topics specific to women. Use feminine language and themes.'
        : ' You create inclusive mixed-gender events that welcome all participants.';

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert event planner specializing in ${targetAudience === 'influencers' ? 'influencer and creator events (content creation summits, brand collaborations, audience growth workshops)' : targetAudience === 'businesses' ? 'business and professional development events' : 'diverse professional events for both businesses and influencers'}.${genderSpecialization} Create innovative, engaging event concepts that are culturally appropriate${locationName ? ` for ${locationName}` : ''} and consider ${season || 'all'} seasonal factors.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 800,
      response_format: { type: "json_object" }
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) return fallbackEvents;
    
    const parsed = JSON.parse(response);
    return parsed.events || fallbackEvents;
  } catch (error) {
    console.error("Error generating event ideas:", error);
    captureError(error as Error);
    return fallbackEvents;
  }
};



