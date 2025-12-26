import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export async function POST(request: NextRequest) {
  try {
    console.log('[AI Generate Event] Request received');
    console.log('[AI Generate Event] API Key present:', !!process.env.OPENAI_API_KEY);
    
    const openai = getOpenAI();
    
    if (!openai) {
      console.error('[AI Generate Event] OpenAI not initialized - API key missing');
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to environment variables.' },
        { status: 503 }
      );
    }

    const { prompt } = await request.json();
    console.log('[AI Generate Event] Prompt received:', prompt?.substring(0, 100));

    if (!prompt || typeof prompt !== 'string') {
      console.error('[AI Generate Event] Invalid prompt');
      return NextResponse.json(
        { error: 'Valid prompt is required' },
        { status: 400 }
      );
    }

    const systemPrompt = `You are an expert event planner with deep knowledge of business, creator economy, and community building. Generate 5 different event concepts based on the user's description and configuration. Each should be unique and appealing.

Return a JSON object with this EXACT structure:
{
  "events": [
    {
      "title": "Event title (catchy, specific, and professional)",
      "description": "Comprehensive description (2-3 paragraphs with specific details, benefits, and what makes it unique)",
      "type": "FUN_MEETUP" | "BUSINESS_EVENT" | "HYBRID",
      "category": "NETWORKING" | "PITCH_EVENT" | "STARTUP" | "INVESTOR_MEETUP" | "CONFERENCE" | "TRADE_SHOW" | "WORKSHOP" | "SEMINAR" | "TRAINING" | "HACKATHON" | "ART_EXHIBITION" | "MUSIC" | "PHOTOGRAPHY" | "DESIGN" | "CULTURAL" | "MEETUP" | "PARTY" | "COMMUNITY" | "CHARITY" | "SPORTS" | "WELLNESS" | "FOOD_DRINK" | "ENTERTAINMENT" | "PRODUCT_LAUNCH" | "MARKET" | "EXPO" | "OTHER",
      "countryId": "Country code (DE, US, UK, FR, ES, IT, NL, BE, AT, CH, etc.)",
      "location": "Specific venue name and address",
      "city": "City name",
      "capacity": number (realistic based on event type),
      "targetAudience": ["BUSINESSES", "CUSTOMERS", "CREATORS"],
      "audienceDescription": "Detailed description of who will benefit most",
      "ticketing": {
        "mode": "FREE" | "PAID",
        "price": number (if paid, reasonable for event type in EUR)
      },
      "agenda": [
        { "time": "HH:MM", "activity": "Detailed activity" }
      ],
      "tags": ["relevant", "keywords"],
      "highlights": ["Key selling point 1", "Key selling point 2", "Key selling point 3"],
      "requirements": "Prerequisites or empty string",
      "benefits": "Concrete outcomes (3-5 specific benefits)"
    }
  ]
}

IMPORTANT: Generate 5 DIFFERENT event concepts with varied approaches:
1. Professional/Premium version
2. Community-focused/Accessible version  
3. Innovative/Unique angle
4. Intimate/Exclusive approach
5. Large-scale/Festival style

Vary the titles, descriptions, capacities, pricing, and approaches while staying true to the user's base requirements.`;

    console.log('[AI Generate Event] Calling OpenAI API...');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.8,
      response_format: { type: 'json_object' },
    });

    console.log('[AI Generate Event] Completion received');

    const generatedContent = completion.choices[0]?.message?.content;
    
    if (!generatedContent) {
      console.error('[AI Generate Event] No content in response');
      throw new Error('No content generated');
    }

    console.log('[AI Generate Event] Parsing JSON response');
    const result = JSON.parse(generatedContent);
    
    if (!result.events || !Array.isArray(result.events)) {
      console.error('[AI Generate Event] Invalid response structure');
      throw new Error('Invalid response structure - expected events array');
    }
    
    console.log('[AI Generate Event] Success - Generated', result.events.length, 'event options');

    return NextResponse.json({
      success: true,
      events: result.events,
    });
  } catch (error: any) {
    console.error('[AI Generate Event] Error:', error);
    console.error('[AI Generate Event] Error stack:', error.stack);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to generate event',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
