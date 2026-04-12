// app/api/tts/route.ts - Azure version
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get('text');
  const lang = searchParams.get('lang');

  console.log('🔊 TTS Request received:', { text, lang });

  if (!text) {
    return NextResponse.json({ error: 'Missing text parameter' }, { status: 400 });
  }

  // Get Azure credentials from environment variables
  const apiKey = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;

  console.log('🔑 Azure credentials check:', { 
    hasKey: !!apiKey, 
    hasRegion: !!region 
  });

  if (!apiKey || !region) {
    console.error('❌ Missing Azure credentials');
    return NextResponse.json({ 
      error: 'TTS not configured - missing Azure credentials',
      details: { hasKey: !!apiKey, hasRegion: !!region }
    }, { status: 500 });
  }

  // Map language to Azure voice names
  const voiceMap: Record<string, string> = {
    'ja-JP': 'ja-JP-NanamiNeural',
    'ko-KR': 'ko-KR-SunHiNeural',
    'zh-CN': 'zh-CN-XiaoxiaoNeural',
  };

  const languageCode = lang || 'ja-JP';
  const voiceName = voiceMap[languageCode] || 'ja-JP-NanamiNeural';

  // Create SSML (Speech Synthesis Markup Language)
  const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${languageCode}">
    <voice name="${voiceName}">
      <prosody rate="0%">${escapeXml(text)}</prosody>
    </voice>
  </speak>`;

  try {
    const endpoint = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
    console.log('🌐 Calling Azure endpoint:', endpoint);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
      },
      body: ssml,
    });

    console.log('📡 Azure response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Azure TTS error:', response.status, errorText);
      return NextResponse.json(
        { error: `TTS API error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const audioBuffer = await response.arrayBuffer();
    console.log('✅ Audio generated, size:', audioBuffer.byteLength, 'bytes');

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('❌ TTS request error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Helper function to escape XML special characters
function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

export const maxDuration = 60;