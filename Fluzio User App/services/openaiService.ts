import OpenAI from 'openai';
import { User, StrategicMatch } from '../types';
import { captureError, captureMessage } from './sentryService';
import { getPlatformFeatureGuide } from './aiContextService';

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
          content: "You are a marketing assistant for Beevvy, a platform connecting local businesses with creators. Write short, exciting, professional mission descriptions."
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
        description: `Come visit our ${businessType} in ${location} and share your experience on your Beevvy feed!`,
        requirements: ["Take a photo", "Share on feed"],
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
        description: "Post on your Beevvy feed showing your visit to our location. Give your followers a peek behind the scenes!",
        postType: "STORY",
        suggestedPoints: 75,
        hashtags: ["behindthescenes", "local", "discover"]
      },
      {
        title: "Product Video Challenge",
        description: "Create a fun video featuring our products. Get creative and show us your unique style!",
        postType: "VIDEO",
        suggestedPoints: 150,
        hashtags: ["video", "creative", "style"]
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
        description: `Post on your Fluzio feed showing your visit. Give your followers a peek behind the scenes and share what makes ${params.businessName} special!`,
        postType: "STORY" as const,
        suggestedPoints: 75,
        hashtags: ["behindthescenes", "local", "discover"]
      },
      {
        title: "Creative Video Challenge",
        description: `Create a fun 15-30 second video featuring ${params.businessName}. Show off your creative side and help spread the word!`,
        postType: "VIDEO" as const,
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
        { role: 'Video Editor', budget: 400, description: 'Professional editing for content creation' }
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
    const auth = (await import('./authCompat')).getAuth();
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

/**
 * AI-Powered Proof Verification
 * Analyzes proof submissions (photos, screenshots, text) to determine validity
 */
export const analyzeProofSubmission = async (params: {
  missionTitle: string;
  missionRequirements: string;
  proofType: 'PHOTO' | 'SCREENSHOT' | 'LINK' | 'TEXT';
  proofDescription?: string;
  imageUrl?: string;
}): Promise<{
  isValid: boolean;
  confidence: number; // 0-1
  reasoning: string;
  flags: string[]; // Potential issues
  recommendation: 'AUTO_APPROVE' | 'MANUAL_REVIEW' | 'AUTO_REJECT';
}> => {
  const client = getClient();
  
  const fallbackResponse = {
    isValid: false,
    confidence: 0.5,
    reasoning: "AI verification unavailable. Manual review required.",
    flags: ['AI_UNAVAILABLE'],
    recommendation: 'MANUAL_REVIEW' as const
  };

  if (!client) {
    console.warn("OpenAI API Key not found for proof verification");
    return fallbackResponse;
  }

  try {
    const { missionTitle, missionRequirements, proofType, proofDescription, imageUrl } = params;

    // Build analysis prompt
    let prompt = `Analyze this mission proof submission and determine if it's valid.

Mission: "${missionTitle}"
Requirements: ${missionRequirements}
Proof Type: ${proofType}
${proofDescription ? `Description: ${proofDescription}` : ''}

Analyze if the proof meets the requirements. Look for:
- Does it match what was requested?
- Is it authentic (not AI-generated, stolen, or manipulated)?
- Is it appropriate content (no spam, offensive material)?
- Does it show genuine effort?

Respond in JSON format:
{
  "isValid": true/false,
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation",
  "flags": ["list", "of", "concerns"],
  "recommendation": "AUTO_APPROVE" | "MANUAL_REVIEW" | "AUTO_REJECT"
}

Recommendations:
- AUTO_APPROVE: confidence > 0.9 and clearly valid
- MANUAL_REVIEW: confidence 0.4-0.9 or any uncertainty
- AUTO_REJECT: confidence < 0.4 or obvious violations`;

    const messages: any[] = [
      {
        role: "system",
        content: "You are an expert content moderator for a social platform. Your job is to verify proof submissions fairly and accurately. Be thorough but not overly strict. When in doubt, recommend manual review."
      },
      {
        role: "user",
        content: prompt
      }
    ];

    // If image URL provided, use vision model
    const model = imageUrl ? "gpt-4o" : "gpt-4o-mini";

    if (imageUrl && model === "gpt-4o") {
      // Use vision capabilities
      messages[1] = {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: { url: imageUrl }
          }
        ]
      };
    }

    const completion = await client.chat.completions.create({
      model,
      messages,
      temperature: 0.3, // Lower temp for consistent moderation
      max_tokens: 300,
      response_format: { type: "json_object" }
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) return fallbackResponse;

    const result = JSON.parse(response);
    
    // Validate and sanitize response
    return {
      isValid: result.isValid === true,
      confidence: Math.max(0, Math.min(1, Number(result.confidence) || 0.5)),
      reasoning: String(result.reasoning || "Analysis complete"),
      flags: Array.isArray(result.flags) ? result.flags : [],
      recommendation: ['AUTO_APPROVE', 'MANUAL_REVIEW', 'AUTO_REJECT'].includes(result.recommendation) 
        ? result.recommendation 
        : 'MANUAL_REVIEW'
    };

  } catch (error) {
    console.error("Error analyzing proof submission:", error);
    captureError(error as Error);
    return fallbackResponse;
  }
};

/**
 * AI-Powered Personalized Feed Ranking
 * Learns user preferences and ranks posts by relevance
 * 
 * @param posts - Array of feed items to rank
 * @param userProfile - User preferences and engagement history
 * @returns Ranked array of feed items with scores
 */
export const rankFeedPosts = async (
  posts: Array<{
    id: string;
    contentType: string;
    createdBy: string;
    creatorName: string;
    caption?: string;
    tags?: string[];
    location?: { city?: string; country?: string };
    likes?: number;
    comments?: number;
  }>,
  userProfile: {
    userId: string;
    interests: string[];
    followingIds: string[];
    engagementHistory?: {
      likedPostIds: string[];
      commentedPostIds: string[];
      savedPostIds: string[];
      viewedCreators: string[];
    };
    location?: { city?: string; country?: string };
  }
): Promise<Array<{ postId: string; relevanceScore: number }>> => {
  const client = getClient();
  
  // Fallback: prioritize followed creators, then chronological
  const fallbackRanking = posts.map((post, index) => ({
    postId: post.id,
    relevanceScore: userProfile.followingIds.includes(post.createdBy) ? 0.8 : 0.5 - (index * 0.01)
  }));

  if (!client || posts.length === 0) {
    return fallbackRanking;
  }

  try {
    // Prepare post data (limit to essential info for token efficiency)
    const postsData = posts.slice(0, 50).map(p => ({
      id: p.id,
      type: p.contentType,
      creator: p.creatorName,
      caption: p.caption?.substring(0, 100), // Limit caption length
      tags: p.tags?.slice(0, 5), // Limit tags
      location: p.location,
      engagement: { likes: p.likes || 0, comments: p.comments || 0 },
      isFollowing: userProfile.followingIds.includes(p.createdBy)
    }));

    // Prepare engagement summary
    const engagement = userProfile.engagementHistory || {
      likedPostIds: [],
      commentedPostIds: [],
      savedPostIds: [],
      viewedCreators: []
    };

    const prompt = `Rank these ${postsData.length} feed posts by relevance for this user.

User Profile:
- Interests: ${userProfile.interests.join(', ')}
- Location: ${userProfile.location?.city || 'Unknown'}
- Following: ${userProfile.followingIds.length} creators
- Recent Engagement: ${engagement.likedPostIds.length} likes, ${engagement.commentedPostIds.length} comments

Posts to Rank:
${JSON.stringify(postsData, null, 2)}

Ranking Criteria (weighted):
1. Content from followed creators (35%)
2. Interest alignment with user's stated interests (25%)
3. Similar to previously engaged content (20%)
4. Geographic relevance (10%)
5. High engagement signals quality (10%)

Return JSON array of post IDs with relevance scores:
{
  "rankings": [
    {"postId": "id1", "relevanceScore": 0.95},
    {"postId": "id2", "relevanceScore": 0.82},
    ...
  ]
}

Score range: 0.0 (not relevant) to 1.0 (highly relevant).`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini", // Cost-efficient model for ranking
      messages: [
        {
          role: "system",
          content: "You are a personalization engine that ranks social media posts. Analyze user preferences and post characteristics to determine relevance. Respond ONLY with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3, // Lower temp for consistent ranking
      max_tokens: 1500,
      response_format: { type: "json_object" }
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) return fallbackRanking;

    const result = JSON.parse(response);
    const rankings = result.rankings || result.posts || [];

    // Validate rankings and merge with fallback for missing posts
    const rankingMap = new Map(rankings.map((r: any) => [r.postId, r.relevanceScore]));
    
    return posts.map(post => ({
      postId: post.id,
      relevanceScore: Number(rankingMap.get(post.id) ?? (userProfile.followingIds.includes(post.createdBy) ? 0.6 : 0.4))
    }));

  } catch (error) {
    console.error("Error ranking feed posts with AI:", error);
    captureError(error as Error, {
      service: 'openaiService',
      function: 'rankFeedPosts',
      userId: userProfile.userId,
      postCount: posts.length
    });
    return fallbackRanking;
  }
};

/**
 * AI Chatbot Support Assistant
 * Provides streaming conversational support with context awareness
 * 
 * @param messages - Chat history
 * @param userContext - User profile and current context
 * @param onChunk - Callback for streaming response chunks
 * @returns Complete AI response
 */
export const chatWithAssistant = async (
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  userContext: {
    userId: string;
    userName: string;
    userRole: 'USER' | 'BUSINESS' | 'CREATOR';
    location?: { city?: string; country?: string };
    currentScreen?: string;
    subscriptionLevel?: string;
    businessType?: string;
    recentActivity?: string[];
    businessLevel?: number;
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
    upgradeRecommendation?: string;
  },
  onChunk?: (chunk: string) => void
): Promise<string> => {
  const client = getClient();
  
  if (!client) {
    const fallbackMessage = "I'm currently unavailable. Please try again later or contact support at support@beevvy.com";
    onChunk?.(fallbackMessage);
    return fallbackMessage;
  }

  try {
    // Build context-aware system prompt based on user role
    const systemPrompt = buildSystemPrompt(userContext);

    // Prepare messages with system context
    const chatMessages: any[] = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    console.log('[AI Assistant] Starting chat with context:', {
      role: userContext.userRole,
      location: userContext.location?.city,
      screen: userContext.currentScreen,
      tier: userContext.subscriptionTier,
      level: userContext.businessLevel
    });

    // Use streaming for better UX
    const stream = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: chatMessages,
      temperature: 0.7,
      max_tokens: 500,
      stream: true
    });

    let fullResponse = '';

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullResponse += content;
        onChunk?.(content);
      }
    }

    console.log('[AI Assistant] Response complete:', fullResponse.length, 'characters');
    return fullResponse;

  } catch (error) {
    console.error('Error in AI chat:', error);
    captureError(error as Error, {
      service: 'openaiService',
      function: 'chatWithAssistant',
      userId: userContext.userId
    });
    
    const errorMessage = "I encountered an error. Please try rephrasing your question or contact support.";
    onChunk?.(errorMessage);
    return errorMessage;
  }
};

/**
 * Build context-aware system prompt based on user role
 */
function buildSystemPrompt(context: {
  userName: string;
  userRole: 'USER' | 'BUSINESS' | 'CREATOR';
  location?: { city?: string; country?: string };
  currentScreen?: string;
  subscriptionLevel?: string;
  businessType?: string;
  recentActivity?: string[];
  businessLevel?: number;
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
  upgradeRecommendation?: string;
}): string {
  // Import the comprehensive feature guide
  const featureGuide = getPlatformFeatureGuide(context.userRole);
  
  // Build subscription context for businesses
  let subscriptionContext = '';
  
  // Debug logging
  console.log('[OpenAI] Building prompt with context:', {
    userRole: context.userRole,
    businessLevel: context.businessLevel,
    subscriptionTier: context.subscriptionTier,
    hasLimits: !!context.subscriptionLimits,
    limits: context.subscriptionLimits
  });
  
  if (context.userRole === 'BUSINESS' && context.subscriptionTier && context.subscriptionLimits) {
    const limits = context.subscriptionLimits;
    subscriptionContext = `

SUBSCRIPTION STATUS:
- Level: ${context.businessLevel || 1}
- Tier: ${context.subscriptionTier}
- Active Missions: ${limits.currentActiveMissions}/${limits.maxActiveMissions}
- Participants This Month: ${limits.currentParticipantsThisMonth}/${limits.maxParticipantsPerMonth}
- In-App Follow Missions: ${limits.hasInAppFollowMissions ? 'Yes' : 'No'}
- In-App Review Missions: ${limits.hasInAppReviewMissions ? 'Yes' : 'No'}
- Photo Missions: ${limits.hasPhotoMissions ? 'Yes' : 'No'}
- Video Missions: ${limits.hasVideoMissions ? 'Yes' : 'No'}
- Events Access: ${limits.hasEvents ? 'Yes' : 'No'}

${context.businessLevel === 1 ? `
⚠️⚠️⚠️ CRITICAL - LEVEL 1 RESTRICTIONS ⚠️⚠️⚠️
This user is LEVEL 1 and CANNOT create missions yet.
- Max Active Missions: 0 (ZERO, not 5, not 1, ZERO)
- They must reach Level 2 to create missions
- When user asks about missions or "what do I get" → Tell them:
  "As a Level 1 business, you can explore the platform and network with other businesses, but mission creation is unlocked at Level 2. Would you like to know how to reach Level 2?"
- DO NOT say "5 missions" or any other number
- ONLY Level 2+ businesses can create missions
` : `
CRITICAL - SUBSCRIPTION TIER LIMITS (Level 2+):

⚠️⚠️⚠️ AVAILABLE SUBSCRIPTION TIERS FOR LEVEL 2+ BUSINESSES ⚠️⚠️⚠️

**STARTER TIER (€0/month):**
- Max Active Missions: 1 (ONE mission at a time)
- Max Participants/Month: 20
- Max Participants/Mission: 10
- Basic mission types only

**SILVER TIER (€29/month):**
- Max Active Missions: 3 (run 3 campaigns simultaneously)
- Max Participants/Month: 40
- Max Participants/Mission: 20
- All mission types included
- Priority support

**GOLD TIER (€59/month):**
- Max Active Missions: 6 (run 6 campaigns simultaneously)
- Max Participants/Month: 120
- Max Participants/Mission: 30
- All mission types + events access
- Advanced analytics
- Priority support
- Featured business placement

**PLATINUM TIER (€99/month):**
- Max Active Missions: Unlimited (fair use policy)
- Max Participants/Month: 300
- Max Participants/Mission: 50
- All features unlocked
- Premium events hosting
- Advanced analytics + competitive insights
- Dedicated account manager
- Featured placement + marketing boost

${context.subscriptionTier === 'STARTER' ? `
🔹 CURRENT TIER: STARTER
- Max Active Missions: 1 (ONE mission at a time, not 5, not 2, exactly ONE)
- Max Participants/Month: 20
- Max Participants/Mission: 10
- When user asks "how many missions can I create" → Answer: "1 active mission at a time"
- Once a mission ends, they can create another one
` : context.subscriptionTier === 'SILVER' ? `
🔹 CURRENT TIER: SILVER (€29/month)
- Max Active Missions: 3 (can run 3 missions simultaneously)
- Max Participants/Month: 40
- Max Participants/Mission: 20
` : context.subscriptionTier === 'GOLD' ? `
🔹 CURRENT TIER: GOLD (€59/month)
- Max Active Missions: 6 (can run 6 missions simultaneously)
- Max Participants/Month: 120
- Max Participants/Mission: 30
- Events access included
` : `
🔹 CURRENT TIER: PLATINUM (€99/month)
- Max Active Missions: Unlimited (fair use policy)
- Max Participants/Month: 300
- Max Participants/Mission: 50
- All premium features included
`}
`}
${context.upgradeRecommendation ? `UPGRADE OPPORTUNITY:\n${context.upgradeRecommendation}\n` : ''}

IMPORTANT CONTEXT:
- All missions are IN-APP ONLY (no external Instagram or Google connections)
- Mission types: Follow Business (in-app), Write Review (in-app), Review with Photo (in-app), Share Photo (in-app), Check-in/Visit, Custom
- DO NOT mention Instagram followers, Instagram stories, Google Reviews, or any external social media features
- When explaining missions, always clarify they happen within the Beevvy app

When users ask about features they don't have access to:
1. Politely explain the feature is available in a higher tier/level
2. Mention the specific tier/level that unlocks it (and cost if relevant)
3. Highlight the value/ROI of upgrading
4. Be helpful and encouraging, not pushy

When users are approaching or hitting their limits:
1. Alert them proactively ("You're using 85% of your participant limit this month")
2. Suggest upgrading to avoid disruption
3. Explain the benefits of the next tier`;
  } else if (context.userRole === 'BUSINESS') {
    // Business user but missing subscription data - add warning
    subscriptionContext = `

⚠️ SUBSCRIPTION DATA NOT AVAILABLE
The user is a business but subscription information could not be loaded.
DO NOT make up or guess subscription limits.
Tell the user: "I'm having trouble loading your subscription details. Please refresh the page or contact support if this persists."
`;
    console.warn('[OpenAI] Business user but missing subscription data!', {
      hasLevel: !!context.businessLevel,
      hasTier: !!context.subscriptionTier,
      hasLimits: !!context.subscriptionLimits
    });
  }
  
  const basePrompt = `You are Beevvy AI Assistant, a helpful and friendly support agent for the Beevvy platform. Your role is to help users get the most out of Beevvy.

User Context:
- Name: ${context.userName}
- Role: ${context.userRole}
${context.location?.city ? `- Location: ${context.location.city}${context.location.country ? `, ${context.location.country}` : ''}` : ''}
${context.currentScreen ? `- Current Screen: ${context.currentScreen}` : ''}
${context.subscriptionLevel ? `- Subscription: ${context.subscriptionLevel}` : ''}
${context.businessType ? `- Business Type: ${context.businessType}` : ''}
${context.recentActivity && context.recentActivity.length > 0 ? `\nRecent Activity:\n${context.recentActivity.map(a => `- ${a}`).join('\n')}` : ''}${subscriptionContext}

🎯 INDUSTRY-SPECIFIC PERSONALIZATION (CRITICAL):
${context.businessType ? `This user runs a ${context.businessType} business. ALWAYS tailor your advice to this industry:

**For RETAIL**: 
- Example missions: "Post a photo with your purchase", "Share your style transformation", "Tag us in your outfit"
- ROI focus: Increase foot traffic, boost social proof, drive repeat purchases
- Real benefits: "3 missions = run 'New Arrivals Spotlight', 'Customer of the Week', 'Style Challenge' simultaneously"

**For RESTAURANT/CAFE**: 
- Example missions: "Share your favorite dish", "Review your meal experience", "Post a food photo and tag us"
- ROI focus: Fill tables during slow hours, increase takeout orders, build loyal regulars
- Real benefits: "40 participants = 40 mouthwatering food photos spreading across social media"

**For FITNESS/GYM**: 
- Example missions: "Post your workout selfie", "Share your transformation story", "Check-in after class"
- ROI focus: Member retention, class bookings, referral generation
- Real benefits: "Events access = host fitness challenges, nutrition workshops, member appreciation nights"

**For BEAUTY/SALON**: 
- Example missions: "Share your new look before/after", "Review your experience", "Tag us in your selfie"
- ROI focus: Fill appointment slots, showcase expertise, build portfolio
- Real benefits: "Photo missions = visual proof of your work spreading organically"

**For PROFESSIONAL SERVICES**: 
- Example missions: "Leave a testimonial", "Share your success story", "Refer a colleague"
- ROI focus: Build credibility, generate referrals, showcase results
- Real benefits: "Review missions = authentic testimonials for your website and marketing"

Provide SPECIFIC, ACTIONABLE examples relevant to their ${context.businessType} business.
` : 'Provide general business advice with concrete examples.'}

🗣️ COMMUNICATION STYLE (CRITICAL):

**Talk Like a Human, Not a Corporate Bot:**
- Avoid bullet points and formal lists unless absolutely necessary
- Use natural, conversational language like you're talking to a friend over coffee
- Tell mini-stories with concrete examples: "Imagine you're a café owner. Instead of posting flyers, you create a mission..."
- Use "you" and "your business" frequently to make it personal
- Skip emojis unless it feels natural (not forced corporate cheerfulness)

**Show, Don't Just Tell:**
❌ BAD: "My Squad helps you network with businesses"
✅ GOOD: "My Squad automatically matches you with 2-4 local businesses each month. Think of it like having a regular coffee meetup with other business owners in your area - you share what's working, brainstorm solutions to challenges, maybe even plan joint promotions together."

❌ BAD: "Projects feature allows collaboration"
✅ GOOD: "Let's say you run a boutique and there's a salon nearby. With Projects, you could team up on a 'Summer Glow-Up' campaign - they do hair/makeup, you provide the outfits, you split the cost of a photographer, and both of you get amazing content. That's what Projects is for."

❌ BAD: "Events access for premium tiers"
✅ GOOD: "With Events access, you could host something like 'Small Business Owners Happy Hour' at your location. Other local businesses show up, everyone networks, and you position yourself as the connector in your community. Plus it brings foot traffic to your space."

**For B2B Features Specifically:**
Instead of listing features with generic descriptions, paint a picture:
- My Squad: "Every month, you get matched with 2-4 DIFFERENT local businesses for a fun social activity - not the same group, new people each time. The app suggests ideas like bowling, escape rooms, or happy hours. It's like speed networking but actually fun. You might meet a bakery owner one month, a fitness studio the next. You do something enjoyable together, naturally start talking shop, share marketing ideas, and sometimes those connections turn into real partnerships or referrals. It's about building your local business network while actually having a good time, not sitting in boring meetups."
- Match: "Say you're a wedding photographer. Match would help you find venues, florists, DJs - all the businesses that serve the same customers but aren't competing with you. Then you can cross-promote: they recommend you, you recommend them."
- Projects: "Perfect for bigger campaigns you can't afford alone. Maybe 3-4 businesses chip in for a professional video shoot, each get content for their social media, and split the €2,000 cost."
- Market: "Need a one-time thing? Like headshots for your team, or someone to redesign your menu? Market is where you browse freelancers' portfolios and hire them for specific projects."

**Answer Structure:**
1. Start with a relatable scenario from THEIR industry
2. Explain how the feature helps with that scenario
3. Give a specific example with numbers/outcomes when possible
4. Optional: Gently suggest next step or related feature

**Tone Checklist:**
✅ Conversational and warm
✅ Specific examples from their industry
✅ Natural language, not corporate jargon
✅ Story-driven explanations
❌ No robotic bullet lists unless comparing tiers/numbers
❌ No generic "boost engagement" fluff
❌ No forced emoji enthusiasm

CRITICAL: When answering questions about subscription limits, ONLY use the numbers provided in SUBSCRIPTION STATUS above. Never guess or estimate.

${featureGuide}

Remember: You're helping a real business owner grow their ${context.businessType || 'business'}. Make every answer feel personalized, actionable, and valuable to THEIR specific situation.`;

  return basePrompt;
}

/**
 * Get quick suggestions for common questions based on user role
 */
export const getQuickSuggestions = (userRole: 'USER' | 'BUSINESS' | 'CREATOR'): string[] => {
  switch (userRole) {
    case 'BUSINESS':
      return [
        "How do I create my first mission?",
        "What are B2B partnerships and how do they work?",
        "How can I find other businesses to collaborate with?",
        "What's the difference between Projects and Market?",
        "How do Squad meetups work?",
        "What rewards attract customers?",
        "How does the AI verification work?"
      ];
    case 'CREATOR':
      return [
        "How do I find collaboration opportunities?",
        "What should I include in my portfolio?",
        "How do I apply to projects?",
        "How are project payments handled?",
        "How can I increase my visibility?"
      ];
    case 'USER':
      return [
        "How do I earn points quickly?",
        "Where can I find missions near me?",
        "How do I redeem rewards?",
        "What are meetups and how do I join?",
        "How does the level system work?",
        "What is My Squad?"
      ];
    default:
      return [
        "How does Beevvy work?",
        "What can I do on this platform?",
        "How do I get started?"
      ];
  }
};

/**
 * AI Caption Generator
 * Creates engaging social media captions with hashtags
 * 
 * @param params - Caption generation parameters
 * @returns Generated caption with hashtags
 */
export const generateCaption = async (params: {
  contentType: string;
  topic?: string;
  imageDescription?: string;
  businessType?: string;
  businessName?: string;
  tone?: 'professional' | 'casual' | 'fun' | 'inspiring';
  includeEmojis?: boolean;
  includeHashtags?: boolean;
  targetAudience?: string;
}): Promise<{
  caption: string;
  hashtags: string[];
}> => {
  const client = getClient();
  
  const {
    contentType,
    topic,
    imageDescription,
    businessType,
    businessName,
    tone = 'casual',
    includeEmojis = true,
    includeHashtags = true,
    targetAudience
  } = params;

  // Fallback captions
  const fallbackCaptions = {
    'EXPERIENCE_POST': {
      caption: "Had an amazing experience today! Can't wait to share more. ✨",
      hashtags: ['experience', 'lifestyle', 'goodvibes']
    },
    'MOMENT': {
      caption: "Capturing this special moment 📸",
      hashtags: ['moment', 'photooftheday', 'memories']
    },
    'BUSINESS_ANNOUNCEMENT': {
      caption: `Exciting news from ${businessName || 'us'}! Stay tuned for updates.`,
      hashtags: ['announcement', 'news', 'updates']
    },
    'CREATOR_CONTENT': {
      caption: "Fresh content alert! Hope you enjoy this one 🎨",
      hashtags: ['content', 'creative', 'newpost']
    },
    'EVENT_PREVIEW': {
      caption: "Mark your calendars! Something special is coming. 🎉",
      hashtags: ['event', 'comingsoon', 'exciting']
    }
  };

  const fallback = fallbackCaptions[contentType as keyof typeof fallbackCaptions] || {
    caption: "Sharing something special with you all! ✨",
    hashtags: ['share', 'post', 'social']
  };

  if (!client) {
    console.warn('OpenAI API not available, returning fallback caption');
    return fallback;
  }

  try {
    // Build context for AI
    let contextInfo = `Content Type: ${contentType}\n`;
    if (topic) contextInfo += `Topic: ${topic}\n`;
    if (imageDescription) contextInfo += `Image Description: ${imageDescription}\n`;
    if (businessType) contextInfo += `Business Type: ${businessType}\n`;
    if (businessName) contextInfo += `Business Name: ${businessName}\n`;
    if (targetAudience) contextInfo += `Target Audience: ${targetAudience}\n`;

    const toneDescriptions = {
      professional: 'professional, polished, and business-appropriate',
      casual: 'casual, friendly, and conversational',
      fun: 'fun, playful, and energetic',
      inspiring: 'inspiring, motivational, and uplifting'
    };

    const prompt = `Generate an engaging social media caption for this post:

${contextInfo}

Tone: ${toneDescriptions[tone]}
${includeEmojis ? 'Use 2-3 relevant emojis naturally integrated' : 'No emojis'}
${includeHashtags ? 'Include 5-7 relevant hashtags' : 'No hashtags'}

Guidelines:
- Caption should be 1-2 sentences (max 150 characters)
- Make it engaging and authentic
- Match the tone specified
- If it's a business post, subtly promote the business
- Be conversational and relatable

Return JSON:
{
  "caption": "The caption text${includeEmojis ? ' with emojis' : ''}",
  "hashtags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}

Caption only (hashtags separate). Keep it short and punchy!`;

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a social media expert who creates engaging, authentic captions. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8, // Higher for creativity
      max_tokens: 150,
      response_format: { type: 'json_object' }
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) return fallback;

    const result = JSON.parse(response);
    
    return {
      caption: result.caption || fallback.caption,
      hashtags: Array.isArray(result.hashtags) ? result.hashtags : fallback.hashtags
    };

  } catch (error) {
    console.error('Error generating caption:', error);
    captureError(error as Error, {
      service: 'openaiService',
      function: 'generateCaption',
      contentType
    });
    return fallback;
  }
};

/**
 * Fetch and analyze website content for business context
 * Extracts key information from business website
 */
const analyzeWebsiteContent = async (websiteUrl: string): Promise<{
  businessDescription?: string;
  keyServices?: string[];
  hours?: string;
  location?: string;
  uniqueSellingPoints?: string[];
  websiteQuality?: 'excellent' | 'good' | 'needs-improvement';
}> => {
  try {
    // Fetch website content
    const response = await fetch(websiteUrl, {
      headers: { 'User-Agent': 'Beevvy AI Analyzer/1.0' },
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    
    if (!response.ok) throw new Error('Failed to fetch');
    
    const html = await response.text();
    
    // Extract text content (simple extraction)
    const textContent = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 2000); // First 2000 chars
    
    const client = getClient();
    if (!client) return {};
    
    // Use AI to extract structured info
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Extract key business information from website content. Return valid JSON only.'
        },
        {
          role: 'user',
          content: `Analyze this business website content and extract:\n\n${textContent}\n\nReturn JSON:\n{\n  "businessDescription": "Brief description",\n  "keyServices": ["service1", "service2"],\n  "uniqueSellingPoints": ["USP1", "USP2"],\n  "websiteQuality": "excellent|good|needs-improvement"\n}`
        }
      ],
      temperature: 0.3,
      max_tokens: 400,
      response_format: { type: 'json_object' }
    });
    
    const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
    return result;
    
  } catch (error) {
    console.warn('[analyzeWebsiteContent] Error:', error);
    return {};
  }
};

/**
 * AI Business Performance Insights
 * Analyzes metrics and provides actionable recommendations
 * Now includes website analysis for better context
 * 
 * @param metrics - Business performance data
 * @returns AI-generated insights and recommendations
 */
export const analyzeBusinessPerformance = async (metrics: {
  businessId: string;
  businessName: string;
  businessType: string;
  websiteUrl?: string;
  period: 'week' | 'month' | 'quarter';
  data: {
    totalMissions: number;
    activeMissions: number;
    completedMissions: number;
    totalParticipations: number;
    approvedParticipations: number;
    rejectedParticipations: number;
    totalPointsAwarded: number;
    totalRewards: number;
    redeemedRewards: number;
    newCustomers: number;
    returningCustomers: number;
    averageEngagementRate?: number;
    topPerformingMissions?: Array<{ title: string; completions: number }>;
  };
}): Promise<{
  summary: string;
  insights: Array<{ type: 'success' | 'warning' | 'info'; title: string; description: string }>;
  recommendations: Array<{ priority: 'high' | 'medium' | 'low'; action: string; reason: string }>;
  score: number; // 0-100
}> => {
  const client = getClient();
  
  const fallback = {
    summary: `Your business has ${metrics.data.totalMissions} active campaigns with ${metrics.data.totalParticipations} total participations.`,
    insights: [
      {
        type: 'info' as const,
        title: 'Engagement Overview',
        description: `${metrics.data.approvedParticipations} approved submissions out of ${metrics.data.totalParticipations} total.`
      }
    ],
    recommendations: [
      {
        priority: 'medium' as const,
        action: 'Review your mission requirements',
        reason: 'Ensure your missions are clear and achievable to increase completion rates.'
      }
    ],
    score: 65
  };

  if (!client) {
    console.warn('OpenAI API not available, returning fallback insights');
    return fallback;
  }

  try {
    const { businessName, businessType, websiteUrl, period, data } = metrics;
    
    // Fetch website data if URL provided
    let websiteContext = '';
    if (websiteUrl) {
      const websiteData = await analyzeWebsiteContent(websiteUrl);
      if (websiteData.businessDescription || websiteData.keyServices) {
        websiteContext = `\n\nWebsite Analysis:
- Description: ${websiteData.businessDescription || 'N/A'}
- Services: ${websiteData.keyServices?.join(', ') || 'N/A'}
- USPs: ${websiteData.uniqueSellingPoints?.join(', ') || 'N/A'}
- Website Quality: ${websiteData.websiteQuality || 'N/A'}
- URL: ${websiteUrl}`;
      }
    }
    
    // Calculate key rates
    const approvalRate = data.totalParticipations > 0 
      ? (data.approvedParticipations / data.totalParticipations * 100).toFixed(1)
      : '0';
    const completionRate = data.totalMissions > 0
      ? (data.completedMissions / data.totalMissions * 100).toFixed(1)
      : '0';
    const redemptionRate = data.totalRewards > 0
      ? (data.redeemedRewards / data.totalRewards * 100).toFixed(1)
      : '0';
    const customerRetention = data.newCustomers > 0
      ? (data.returningCustomers / (data.newCustomers + data.returningCustomers) * 100).toFixed(1)
      : '0';

    const prompt = `Analyze business performance and provide actionable insights.

Business: ${businessName} (${businessType})
Time Period: Last ${period}${websiteContext}

Performance Metrics:
- Total Missions: ${data.totalMissions} (${data.activeMissions} active, ${data.completedMissions} completed)
- Participation: ${data.totalParticipations} total (${data.approvedParticipations} approved, ${data.rejectedParticipations} rejected)
- Approval Rate: ${approvalRate}%
- Completion Rate: ${completionRate}%
- Points Awarded: ${data.totalPointsAwarded}
- Rewards: ${data.totalRewards} total (${data.redeemedRewards} redeemed)
- Redemption Rate: ${redemptionRate}%
- Customers: ${data.newCustomers} new, ${data.returningCustomers} returning
- Customer Retention: ${customerRetention}%
${data.topPerformingMissions ? `\nTop Missions:\n${data.topPerformingMissions.map(m => `- ${m.title}: ${m.completions} completions`).join('\n')}` : ''}

Provide:
1. Brief summary (1 sentence)
2. 3-5 key insights (success/warning/info)
3. 3-5 prioritized recommendations (high/medium/low)
4. Overall performance score (0-100)

Return JSON:
{
  "summary": "One sentence overview",
  "insights": [
    {"type": "success|warning|info", "title": "Insight title", "description": "2 sentence explanation"}
  ],
  "recommendations": [
    {"priority": "high|medium|low", "action": "What to do", "reason": "Why it matters"}
  ],
  "score": 75
}

Focus on actionable advice. Be specific to ${businessType} businesses.${websiteUrl ? ' Use website context to provide personalized recommendations aligned with their brand and offerings.' : ''}`;

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a business performance analyst with deep knowledge of ${businessType} businesses. Provide clear, actionable insights${websiteUrl ? ' leveraging the business website context for personalized advice' : ''}. Always respond with valid JSON only.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.6, // Balanced for analysis
      max_tokens: 800,
      response_format: { type: 'json_object' }
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) return fallback;

    const result = JSON.parse(response);
    
    return {
      summary: result.summary || fallback.summary,
      insights: Array.isArray(result.insights) ? result.insights : fallback.insights,
      recommendations: Array.isArray(result.recommendations) ? result.recommendations : fallback.recommendations,
      score: typeof result.score === 'number' ? Math.max(0, Math.min(100, result.score)) : fallback.score
    };

  } catch (error) {
    console.error('Error analyzing business performance:', error);
    captureError(error as Error, {
      service: 'openaiService',
      function: 'analyzeBusinessPerformance',
      businessId: metrics.businessId
    });
    return fallback;
  }
};

/**
 * AI Fraud Detection
 * Analyzes user behavior patterns to detect suspicious activity
 * 
 * @param suspicionData - User activity data to analyze
 * @returns Fraud risk assessment with reasoning
 */
export const detectFraudRisk = async (suspicionData: {
  userId: string;
  userName: string;
  accountAge: number; // days
  activityData: {
    totalSubmissions: number;
    rejectedSubmissions: number;
    approvedSubmissions: number;
    submissionsLast24h: number;
    uniqueBusinessesEngaged: number;
    accountCreationDate: Date;
    lastActivityDate: Date;
    averageTimeBetweenSubmissions: number; // minutes
    duplicateContentDetected: boolean;
    unusualLocationChanges: number;
    multipleAccountsFromIP?: boolean;
    rapidPointsEarning?: boolean;
    rewardRedemptionRate?: number;
  };
}): Promise<{
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number; // 0-100
  suspiciousPatterns: Array<{ pattern: string; severity: 'low' | 'medium' | 'high'; description: string }>;
  recommendations: string[];
  shouldFlag: boolean;
  shouldBlock: boolean;
}> => {
  const client = getClient();
  
  const fallback = {
    riskLevel: 'low' as const,
    riskScore: 15,
    suspiciousPatterns: [],
    recommendations: ['Continue monitoring user activity'],
    shouldFlag: false,
    shouldBlock: false
  };

  if (!client) {
    console.warn('OpenAI API not available, returning fallback fraud assessment');
    return fallback;
  }

  try {
    const { userName, accountAge, activityData } = suspicionData;
    
    // Calculate rejection rate
    const rejectionRate = activityData.totalSubmissions > 0
      ? (activityData.rejectedSubmissions / activityData.totalSubmissions * 100).toFixed(1)
      : '0';
    
    // Calculate activity intensity
    const submissionsPerDay = accountAge > 0
      ? (activityData.totalSubmissions / accountAge).toFixed(2)
      : '0';

    const prompt = `Analyze user behavior for fraud detection.

User: ${userName}
Account Age: ${accountAge} days
Created: ${activityData.accountCreationDate.toISOString()}
Last Activity: ${activityData.lastActivityDate.toISOString()}

Activity Metrics:
- Total Submissions: ${activityData.totalSubmissions}
- Approved: ${activityData.approvedSubmissions}
- Rejected: ${activityData.rejectedSubmissions}
- Rejection Rate: ${rejectionRate}%
- Submissions Last 24h: ${activityData.submissionsLast24h}
- Submissions Per Day: ${submissionsPerDay}
- Unique Businesses: ${activityData.uniqueBusinessesEngaged}
- Avg Time Between Submissions: ${activityData.averageTimeBetweenSubmissions} minutes
- Duplicate Content: ${activityData.duplicateContentDetected ? 'Yes' : 'No'}
- Unusual Location Changes: ${activityData.unusualLocationChanges}
${activityData.multipleAccountsFromIP ? '- Multiple accounts from same IP detected' : ''}
${activityData.rapidPointsEarning ? '- Rapid points earning detected' : ''}
${activityData.rewardRedemptionRate ? `- Reward redemption rate: ${activityData.rewardRedemptionRate}%` : ''}

Assess fraud risk. Look for:
- Bot-like behavior (rapid submissions, consistent timing)
- Fake proof attempts (high rejection rate)
- Gaming the system (multiple accounts, location manipulation)
- Suspicious patterns (duplicate content, unusual activity spikes)

Return JSON:
{
  "riskLevel": "low|medium|high|critical",
  "riskScore": 0-100,
  "suspiciousPatterns": [
    {"pattern": "Pattern name", "severity": "low|medium|high", "description": "Why suspicious"}
  ],
  "recommendations": ["Action 1", "Action 2"],
  "shouldFlag": boolean,
  "shouldBlock": boolean
}

Be conservative but accurate. False positives harm real users.`;

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a fraud detection expert. Analyze patterns carefully. Balance security with user experience. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3, // Low temperature for consistent analysis
      max_tokens: 600,
      response_format: { type: 'json_object' }
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) return fallback;

    const result = JSON.parse(response);
    
    return {
      riskLevel: ['low', 'medium', 'high', 'critical'].includes(result.riskLevel) ? result.riskLevel : 'low',
      riskScore: typeof result.riskScore === 'number' ? Math.max(0, Math.min(100, result.riskScore)) : 15,
      suspiciousPatterns: Array.isArray(result.suspiciousPatterns) ? result.suspiciousPatterns : [],
      recommendations: Array.isArray(result.recommendations) ? result.recommendations : fallback.recommendations,
      shouldFlag: typeof result.shouldFlag === 'boolean' ? result.shouldFlag : false,
      shouldBlock: typeof result.shouldBlock === 'boolean' ? result.shouldBlock : false
    };

  } catch (error) {
    console.error('Error detecting fraud risk:', error);
    captureError(error as Error, {
      service: 'openaiService',
      function: 'detectFraudRisk',
      userId: suspicionData.userId
    });
    return fallback;
  }
};

/**
 * AI Smart Mission Pricing
 * Suggests optimal point values for missions based on complexity, market data, and ROI
 * 
 * @param missionData - Mission details for pricing analysis
 * @returns Recommended pricing with reasoning
 */
export const suggestMissionPricing = async (missionData: {
  missionType: string;
  title: string;
  description: string;
  requirements: string[];
  estimatedTimeMinutes: number;
  businessType: string;
  targetAudience: string;
  competitorPricing?: { min: number; max: number; average: number };
  previousMissionPerformance?: { averageCompletions: number; averageQuality: number };
}): Promise<{
  recommendedPoints: number;
  minPoints: number;
  maxPoints: number;
  reasoning: string;
  pricingStrategy: 'budget' | 'competitive' | 'premium';
  expectedEngagement: 'low' | 'medium' | 'high';
  roiProjection: string;
}> => {
  const client = getClient();
  
  const fallback = {
    recommendedPoints: 50,
    minPoints: 30,
    maxPoints: 75,
    reasoning: 'Standard pricing based on mission complexity',
    pricingStrategy: 'competitive' as const,
    expectedEngagement: 'medium' as const,
    roiProjection: 'Estimated 5-10 quality submissions'
  };

  if (!client) {
    console.warn('OpenAI API not available, returning fallback pricing');
    return fallback;
  }

  try {
    const { missionType, title, description, requirements, estimatedTimeMinutes, businessType, targetAudience } = missionData;

    const prompt = `Suggest optimal point value for a mission reward.

Mission Type: ${missionType}
Title: ${title}
Description: ${description}
Requirements: ${requirements.join(', ')}
Estimated Time: ${estimatedTimeMinutes} minutes
Business Type: ${businessType}
Target Audience: ${targetAudience}
${missionData.competitorPricing ? `Market Data: ${missionData.competitorPricing.min}-${missionData.competitorPricing.max} points (avg: ${missionData.competitorPricing.average})` : ''}
${missionData.previousMissionPerformance ? `Previous Performance: ${missionData.previousMissionPerformance.averageCompletions} completions, ${missionData.previousMissionPerformance.averageQuality}/5 quality` : ''}

Consider:
- Time and effort required
- Mission complexity and requirements
- Market competition
- Business value and ROI
- User motivation factors

Return JSON:
{
  "recommendedPoints": number (optimal value),
  "minPoints": number (lower bound),
  "maxPoints": number (upper bound),
  "reasoning": "2-3 sentence explanation",
  "pricingStrategy": "budget|competitive|premium",
  "expectedEngagement": "low|medium|high",
  "roiProjection": "Expected outcome description"
}

Balance attractiveness to users with business value.`;

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a pricing strategist. Suggest fair, competitive point values that balance user motivation with business goals. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.5,
      max_tokens: 400,
      response_format: { type: 'json_object' }
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) return fallback;

    const result = JSON.parse(response);
    
    return {
      recommendedPoints: typeof result.recommendedPoints === 'number' ? Math.max(10, result.recommendedPoints) : 50,
      minPoints: typeof result.minPoints === 'number' ? result.minPoints : 30,
      maxPoints: typeof result.maxPoints === 'number' ? result.maxPoints : 75,
      reasoning: result.reasoning || fallback.reasoning,
      pricingStrategy: ['budget', 'competitive', 'premium'].includes(result.pricingStrategy) ? result.pricingStrategy : 'competitive',
      expectedEngagement: ['low', 'medium', 'high'].includes(result.expectedEngagement) ? result.expectedEngagement : 'medium',
      roiProjection: result.roiProjection || fallback.roiProjection
    };

  } catch (error) {
    console.error('Error suggesting mission pricing:', error);
    captureError(error as Error, {
      service: 'openaiService',
      function: 'suggestMissionPricing'
    });
    return fallback;
  }
};

/**
 * AI Notification Timing Optimization
 * Analyzes user behavior to recommend best times to send notifications
 * 
 * @param userData - User activity patterns
 * @returns Optimal notification timing
 */
export const optimizeNotificationTiming = async (userData: {
  userId: string;
  timezone: string;
  activityHistory: Array<{ timestamp: Date; action: string }>;
  openedNotifications: Array<{ sentAt: Date; openedAt: Date }>;
  ignoredNotifications: Array<{ sentAt: Date }>;
  userRole: 'USER' | 'BUSINESS' | 'CREATOR';
}): Promise<{
  optimalTimes: Array<{ hour: number; minute: number; dayOfWeek?: number; confidence: number }>;
  avoidTimes: Array<{ hour: number; reason: string }>;
  bestDay: string;
  recommendations: string[];
  engagementScore: number; // 0-100
}> => {
  const client = getClient();
  
  const fallback = {
    optimalTimes: [
      { hour: 9, minute: 0, confidence: 0.7 },
      { hour: 12, minute: 30, confidence: 0.6 },
      { hour: 18, minute: 0, confidence: 0.8 }
    ],
    avoidTimes: [
      { hour: 3, reason: 'Late night - low engagement' }
    ],
    bestDay: 'Tuesday',
    recommendations: ['Send important notifications during peak hours', 'Avoid late night and early morning'],
    engagementScore: 65
  };

  if (!client) {
    console.warn('OpenAI API not available, returning fallback timing');
    return fallback;
  }

  try {
    const { timezone, activityHistory, openedNotifications, ignoredNotifications, userRole } = userData;

    // Calculate engagement stats
    const totalNotifications = openedNotifications.length + ignoredNotifications.length;
    const openRate = totalNotifications > 0 
      ? ((openedNotifications.length / totalNotifications) * 100).toFixed(1)
      : '0';

    // Get activity hour distribution
    const activityByHour: Record<number, number> = {};
    activityHistory.forEach(activity => {
      const hour = new Date(activity.timestamp).getHours();
      activityByHour[hour] = (activityByHour[hour] || 0) + 1;
    });

    const topActivityHours = Object.entries(activityByHour)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([hour]) => hour);

    const prompt = `Optimize notification timing for user engagement.

User Role: ${userRole}
Timezone: ${timezone}
Total Notifications: ${totalNotifications}
Open Rate: ${openRate}%
Activity History: ${activityHistory.length} actions tracked
Top Active Hours: ${topActivityHours.join(', ')}

Analyze patterns and recommend:
1. Best times to send notifications (hour, minute, confidence 0-1)
2. Times to avoid
3. Best day of week
4. Specific recommendations for ${userRole}

Return JSON:
{
  "optimalTimes": [
    {"hour": 0-23, "minute": 0-59, "dayOfWeek": 0-6 (optional), "confidence": 0-1}
  ],
  "avoidTimes": [
    {"hour": 0-23, "reason": "Why to avoid"}
  ],
  "bestDay": "Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday",
  "recommendations": ["Actionable tip 1", "Actionable tip 2"],
  "engagementScore": 0-100
}

Consider ${userRole}-specific patterns. Be data-driven.`;

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a notification timing expert. Analyze user behavior to maximize engagement. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.4,
      max_tokens: 500,
      response_format: { type: 'json_object' }
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) return fallback;

    const result = JSON.parse(response);
    
    return {
      optimalTimes: Array.isArray(result.optimalTimes) ? result.optimalTimes : fallback.optimalTimes,
      avoidTimes: Array.isArray(result.avoidTimes) ? result.avoidTimes : fallback.avoidTimes,
      bestDay: result.bestDay || fallback.bestDay,
      recommendations: Array.isArray(result.recommendations) ? result.recommendations : fallback.recommendations,
      engagementScore: typeof result.engagementScore === 'number' ? Math.max(0, Math.min(100, result.engagementScore)) : 65
    };

  } catch (error) {
    console.error('Error optimizing notification timing:', error);
    captureError(error as Error, {
      service: 'openaiService',
      function: 'optimizeNotificationTiming',
      userId: userData.userId
    });
    return fallback;
  }
};



