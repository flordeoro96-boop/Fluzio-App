// Squad Activity Suggestion Function for Fluzio
// Suggests fun meetup activities based on city, weather, season, and user preferences

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { GoogleGenerativeAI } = require('@google/genai');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(functions.config().gemini?.key || process.env.GEMINI_API_KEY);

exports.suggestSquadActivity = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

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
    
    // Build context for AI
    const weatherContext = getWeatherContext(monthNum, city, country);
    
    const prompt = `You are a creative event planner for a group of ${squadSize} entrepreneurs in ${city}, ${country || 'Germany'}.

CONTEXT:
- Month: ${month} (${season} season)
- Weather: ${weatherContext}
- Group: ${squadSize} business owners who meet monthly
- Previous activities: ${previousActivities.length > 0 ? previousActivities.join(', ') : 'None yet'}
${userSuggestion ? `- User suggestion to consider: "${userSuggestion}"` : ''}

REQUIREMENTS:
1. Suggest 3 unique, fun activities for a 2-3 hour meetup
2. Activities should:
   - Be weather-appropriate for ${season} in ${city}
   - Foster networking and relationship building
   - Be suitable for entrepreneurs (not too casual, not too formal)
   - Be different from previous activities
   - Include a specific venue/location in ${city} when possible
3. Consider the local culture and what's popular in ${city}
4. Each activity should have a clear benefit for networking

${userSuggestion ? `
IMPORTANT: One of the suggestions should incorporate or be inspired by this user idea: "${userSuggestion}"
Refine it to make it practical and engaging for the group.
` : ''}

Return ONLY valid JSON (no markdown, no code blocks) in this exact format:
{
  "suggestions": [
    {
      "title": "Activity Name",
      "location": "Specific venue or area in ${city}",
      "description": "2-3 sentence description of what you'll do",
      "duration": "2-3 hours",
      "weatherSuitability": "indoor/outdoor/flexible",
      "networkingBenefit": "Why this is great for business connections",
      "estimatedCost": "€15-30 per person" or "Free",
      "bestTimeOfDay": "Morning/Afternoon/Evening"
    }
  ],
  "seasonalTip": "One sentence about what makes ${month} special in ${city}"
}`;

    console.log('[suggestSquadActivity] Generating suggestions for:', { city, month, season });

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const response = result.response;
    let text = response.text();

    // Clean up the response - remove markdown code blocks if present
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    console.log('[suggestSquadActivity] Raw AI response:', text);

    let suggestions;
    try {
      suggestions = JSON.parse(text);
    } catch (parseError) {
      console.error('[suggestSquadActivity] JSON parse error:', parseError);
      console.error('[suggestSquadActivity] Failed text:', text);
      
      // Fallback suggestions
      suggestions = {
        suggestions: [
          {
            title: "Rooftop Networking Drinks",
            location: `Popular rooftop bar in ${city}`,
            description: "Casual drinks with a view. Perfect for relaxed conversation and getting to know each other's businesses in a fun setting.",
            duration: "2-3 hours",
            weatherSuitability: season === 'Summer' ? 'outdoor' : 'indoor',
            networkingBenefit: "Relaxed atmosphere encourages authentic conversations and relationship building",
            estimatedCost: "€20-35 per person",
            bestTimeOfDay: "Evening"
          },
          {
            title: "Coffee & Co-working Session",
            location: `Trendy café in ${city} city center`,
            description: "Meet at a collaborative workspace or café. Work side-by-side, share challenges, and help each other solve problems.",
            duration: "2-3 hours",
            weatherSuitability: "indoor",
            networkingBenefit: "Working together builds deeper understanding of each other's businesses",
            estimatedCost: "€5-15 per person",
            bestTimeOfDay: "Morning"
          },
          {
            title: "Local Food Tour",
            location: `${city} food district`,
            description: "Explore local food spots together. Sample local specialties while discussing business and life as entrepreneurs.",
            duration: "2-3 hours",
            weatherSuitability: "flexible",
            networkingBenefit: "Walking and eating together creates natural conversation flow",
            estimatedCost: "€25-40 per person",
            bestTimeOfDay: "Afternoon"
          }
        ],
        seasonalTip: `${month} in ${city} offers great opportunities for both indoor and outdoor networking activities.`
      };
    }

    // Add metadata
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

// Helper functions
function getSeasonForMonth(month, country) {
  // Northern hemisphere (default)
  if (month >= 3 && month <= 5) return 'Spring';
  if (month >= 6 && month <= 8) return 'Summer';
  if (month >= 9 && month <= 11) return 'Autumn';
  return 'Winter';
}

function getWeatherContext(month, city, country) {
  const contexts = {
    1: "Cold winter weather, likely indoor activities preferred",
    2: "Late winter, still chilly but days getting longer",
    3: "Early spring, unpredictable weather, mix of indoor/outdoor works",
    4: "Spring in full swing, pleasant for outdoor activities",
    5: "Late spring, warm and comfortable",
    6: "Early summer, great outdoor weather",
    7: "Peak summer, warmest month",
    8: "Late summer, still warm and pleasant",
    9: "Early autumn, mild temperatures",
    10: "Autumn, cooler weather, beautiful colors",
    11: "Late autumn, getting cold, shorter days",
    12: "Winter, cold weather, festive season"
  };
  
  return contexts[month] || "Moderate weather";
}
