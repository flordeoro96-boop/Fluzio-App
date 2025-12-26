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
    const openai = getOpenAI();
    
    if (!openai) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 503 }
      );
    }

    const { eventTitle, eventType, categories, description } = await request.json();

    if (!eventTitle) {
      return NextResponse.json(
        { error: 'Event title is required' },
        { status: 400 }
      );
    }

    // Build image prompt based on event details
    const categoryText = categories?.join(', ') || 'general event';
    const typeText = eventType === 'BUSINESS_EVENT' ? 'professional and modern' : 
                     eventType === 'FUN_MEETUP' ? 'vibrant and energetic' : 
                     'creative and dynamic';

    const imagePrompt = `Create a professional event banner image for "${eventTitle}". 
Style: ${typeText}, high-quality, eye-catching
Theme: ${categoryText}
Mood: Exciting and inviting
Requirements: No text overlay, modern design, suitable for ${eventType.toLowerCase().replace('_', ' ')}
Details: ${description ? description.substring(0, 150) : 'Professional event atmosphere'}`;

    console.log('[AI Image] Generating image with DALL-E 3...');
    console.log('[AI Image] Prompt:', imagePrompt);

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: imagePrompt,
      n: 1,
      size: '1792x1024', // Wide banner format
      quality: 'standard',
      style: 'vivid',
    });

    const imageUrl = response.data?.[0]?.url;

    if (!imageUrl) {
      throw new Error('No image URL returned from OpenAI');
    }

    console.log('[AI Image] Successfully generated:', imageUrl);

    return NextResponse.json({
      success: true,
      imageUrl,
      revisedPrompt: response.data?.[0]?.revised_prompt,
    });

  } catch (err: any) {
    console.error('[AI Image] Error:', err);
    return NextResponse.json(
      { 
        success: false,
        error: err.message || 'Failed to generate image'
      },
      { status: 500 }
    );
  }
}
