// app/api/tts/route.ts
import { NextResponse } from 'next/server';

// Voice IDs for ElevenLabs (using the multilingual model)
// You can change these to different voices from your ElevenLabs account
const VOICE_IDS: Record<string, string> = {
  'ja-JP': '21m00Tcm4TlvDq8ikWAM',  // Rachel - works well for Japanese
  'ko-KR': '21m00Tcm4TlvDq8ikWAM',  // Same voice works for Korean with multilingual model
  'zh-CN': '21m00Tcm4TlvDq8ikWAM',  // Same voice works for Chinese with multilingual model
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get('text');
  const lang = searchParams.get('lang');

  if (!text) {
    return NextResponse.json({ error: 'Missing text parameter' }, { status: 400 });
  }

  // Default to Japanese if no language specified
  const languageCode = lang || 'ja-JP';
  const voiceId = VOICE_IDS[languageCode] || VOICE_IDS['ja-JP'];

  // Check if ElevenLabs API key is configured
  const apiKey = process.env.ELEVENLABS_API_KEY;
  
  // If no API key is configured, return a helpful error message
  if (!apiKey) {
    console.error('ELEVENLABS_API_KEY is not configured in environment variables');
    
    // Return a simple beep/warning sound as fallback (base64 encoded short beep)
    const beepBase64 = 'UklGRnoAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoAAACAgICAf39/f39/f4CAgICAf39/f39/f4CAgICAf39/f39/f4CAgICAf39/f39/f4CAgICAf39/f39/f4CAgICAf39/f39/f4CAgICAf39/f39/fw==';
    const beepBuffer = Buffer.from(beepBase64, 'base64');
    
    return new NextResponse(beepBuffer, {
      headers: {
        'Content-Type': 'audio/wav',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }

  try {
    // Call ElevenLabs API
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2', // Supports Japanese, Korean, Chinese
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      
      return NextResponse.json(
        { error: `TTS API error: ${response.status}` },
        { status: response.status }
      );
    }

    // Get the audio data
    const audioBuffer = await response.arrayBuffer();
    
    // Return the audio file with proper headers
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });
    
  } catch (error) {
    console.error('TTS request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Increase the max duration for longer text (Vercel Pro plan needed for >10s)
export const maxDuration = 60;