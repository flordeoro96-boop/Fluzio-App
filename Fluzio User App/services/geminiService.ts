
import { GoogleGenAI, Type } from "@google/genai";
import { User, StrategicMatch } from '../types';

const apiKey = process.env.API_KEY || '';

let aiClient: GoogleGenAI | null = null;

// Initialize securely
const getClient = () => {
  if (!aiClient && apiKey) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
};

export const generateMissionDescription = async (title: string, businessType: string, requirements: string): Promise<string> => {
  const client = getClient();
  if (!client) {
    console.warn("Gemini API Key not found. Returning mock response.");
    return "Create an engaging social media post featuring our product. Make sure to tag us and have fun! (AI Generation Unavailable)";
  }

  try {
    const prompt = `
      You are a marketing assistant for "Fluzio", a platform connecting local businesses with creators.
      Write a short, exciting, and professional mission description (max 2 sentences).
      
      Business Type: ${businessType}
      Mission Title: ${title}
      Requirements: ${requirements}
      
      Tone: Enthusiastic, clear, and inviting.
    `;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.error("Error generating mission description:", error);
    return "Join us for this exciting opportunity! Check the requirements and apply today.";
  }
};

export const generateGamificationBadgeName = async (userInterests: string[]): Promise<string> => {
    const client = getClient();
    if (!client) return "Super Star";

    try {
      const prompt = `suggest a single, cool, 2-word badge name for a user interested in: ${userInterests.join(', ')}.`;
      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      return response.text.replace(/"/g, '').trim();
    } catch (e) {
      return "Community Hero";
    }
};

export const generateMissionIdeas = async (businessType: string, location: string): Promise<Array<{title: string, description: string, requirements: string[], category: string}>> => {
  const client = getClient();
  
  // Mock fallback if no client/key
  if (!client) {
      await new Promise(r => setTimeout(r, 1000)); // Simulate network delay
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
    const prompt = `
      Generate 3 distinct, creative, and engaging mission ideas for a business.
      Business Type: ${businessType}
      Location: ${location}
      
      The missions should be suitable for social media creators (e.g., Instagram, TikTok).
      Categories must be one of: Coffee, Food, Fashion, Tech, Lifestyle, Travel, Pets, Beauty, Other.
      
      Ensure variety in the type of content requested (e.g., Video, Photo, Review).
    `;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              requirements: { type: Type.ARRAY, items: { type: Type.STRING } },
              category: { type: Type.STRING }
            },
            required: ['title', 'description', 'requirements', 'category']
          }
        }
      }
    });

    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Error generating mission ideas:", error);
    return [];
  }
};

export const findStrategicMatches = async (myProfile: User, candidates: User[]): Promise<StrategicMatch[]> => {
  const client = getClient();
  
  // Determine Target City Logic
  // If subscriptionScope is 'CITY', default to homeCity. If 'GLOBAL', allow any (or specific logic if extended).
  // For now, we filter the candidates sent to Gemini, but also strictly prompt Gemini.
  const targetCity = myProfile.homeCity || "Berlin";
  const isGlobal = myProfile.subscriptionScope === 'GLOBAL';
  
  // Filter for same goal type and ensure business role
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
      // Filter fallback by city if not global
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

    let cityInstruction = `Only return businesses located in ${targetCity}. Do not mix cities.`;
    if (isGlobal) {
        cityInstruction = `You may return businesses from any city, but prioritize those in ${targetCity} or major hubs.`;
    }

    const prompt = `
      Act as a B2B Partnership Consultant. I need you to score potential collaboration matches between "My Business" and a list of "Candidates".
      
      Goal: They are all looking to organize a "${myData.goal}".
      
      My Business Profile: ${JSON.stringify(myData)}
      
      Candidate List: ${JSON.stringify(candidatesData)}
      
      Location Constraint: ${cityInstruction}
      
      Matching Criteria:
      1. Visual/Category Compatibility: Does their brand aesthetic or industry complement mine? 
         - Example: Jewelry matches Fashion well (High Score). 
         - Example: Hardware store does NOT match Fashion (Low Score).
      2. Budget Viability: Does combining our budgets allow for a better result?
      3. Location: ${isGlobal ? "Global partnerships allowed." : "MUST match my city."}
      
      Output Requirements:
      - Return a JSON array.
      - 'matchScore': Integer 0-100 based on compatibility.
      - 'collaborationPitch': A one-sentence pitch convincing me to partner with them (e.g., "Combine your €${myData.budget} budget with their €${candidatesData[0]?.budget || 0} to hire Studio X").
    `;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              candidateId: { type: Type.STRING },
              matchScore: { type: Type.NUMBER },
              collaborationPitch: { type: Type.STRING }
            },
            required: ['candidateId', 'matchScore', 'collaborationPitch']
          }
        }
      }
    });

    return JSON.parse(response.text || '[]');

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
 * Generate AI-powered meetup description based on category and vibe
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
    const prompt = `
      Write an engaging, concise meetup description (2-3 sentences max) for a 4-person social meetup.
      
      Category: ${category}
      Business: ${businessName} (${businessType})
      Vibe: ${vibe.join(', ')}
      
      Tone: Warm, inviting, and exciting. Focus on the social connection aspect.
      Do NOT use emojis. Keep it natural and authentic.
    `;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.error("Error generating meetup description:", error);
    return `Join us for a ${category.toLowerCase()} meetup at ${businessName}! Connect with 3 like-minded people in an intimate setting.`;
  }
};

/**
 * Generate smart chat summary after meetup ends
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
      .map(m => `${m.senderName}: ${m.message}`)
      .join('\n');

    const prompt = `
      Summarize this meetup group chat in one friendly sentence (max 15 words).
      Category: ${meetupCategory}
      
      Chat:
      ${chatText}
      
      Focus on the main topics discussed or vibe of the conversation.
      Be warm and positive. No emojis.
    `;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.error("Error generating chat summary:", error);
    return "Great meetup! Thanks for the wonderful conversation.";
  }
};

/**
 * Generate personalized meetup recommendation explanation
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
    return `This ${meetupCategory.toLowerCase()} meetup matches your interests!`;
  }

  try {
    const prompt = `
      Explain in ONE short sentence (max 12 words) why this meetup is a good match for this user.
      
      User: ${userName}
      User Interests: ${userInterests.join(', ')}
      User Vibe: ${userVibe.join(', ')}
      
      Meetup Category: ${meetupCategory}
      Meetup Vibe: ${meetupVibe.join(', ')}
      
      Be specific and personal. No emojis. Start with "Perfect for..."
    `;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.error("Error generating recommendation reason:", error);
    return `Perfect for your ${userInterests[0] || 'social'} interests!`;
  }
};
