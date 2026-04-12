// app/api/tts/route.ts
import { NextResponse } from 'next/server';

// You'll need a TTS service. Here are two free options:

// OPTION 1: Use a free TTS API (no API key needed)
// This uses the same browser speech API but on the server side
// Note: This won't work in all environments, but it's simple to test

// OPTION 2: Use ElevenLabs (has free tier - 10,000 characters/month)
// Sign up at https://elevenlabs.io for API key

// OPTION 3: Use Google Cloud TTS (free tier - 1 million characters/month)
// Sign up at Google Cloud Console

// I'll show you a working example with ElevenLabs (easiest to set up)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get('text');
  const lang = searchParams.get('lang');

  if (!text) {
    return NextResponse.json({ error: 'Missing text' }, { status: 400 });
  }

  // Map language codes to ElevenLabs voice IDs
  const voiceMap: Record<string, string> = {
    'ja-JP': '21m00Tcm4TlvDq8ikWAM', // Japanese voice
    'ko-KR': 'EXAVITQu4L4J4sD4sD4s', // Korean voice (example)
    'zh-CN': '21m00Tcm4TlvDq8ikWAM', // Chinese voice (example)
  };

  const voiceId = voiceMap[lang || 'ja-JP'];

  try {
    // Option 1: Using ElevenLabs (requires API key)
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('TTS API failed');
    }

    const audioBuffer = await response.arrayBuffer();
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      },
    });
  } catch (error) {
    console.error('TTS error:', error);
    return NextResponse.json({ error: 'TTS failed' }, { status: 500 });
  }
}