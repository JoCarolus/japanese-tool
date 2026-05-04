import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get('text');
  const lang = searchParams.get('lang');
  const speed = searchParams.get('speed') || '0%';

  if (!text) {
    return NextResponse.json({ error: 'Missing text parameter' }, { status: 400 });
  }

  const apiKey = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;

  if (!apiKey || !region) {
    console.error('Missing Azure credentials');
    return NextResponse.json({ error: 'TTS not configured' }, { status: 500 });
  }

  const voiceMap: Record<string, string> = {
    'ja-JP': 'ja-JP-NanamiNeural',
    'ko-KR': 'ko-KR-SunHiNeural',
    'zh-CN': 'zh-CN-XiaoxiaoNeural',
  };

  const languageCode = lang || 'ja-JP';
  const voiceName = voiceMap[languageCode] || 'ja-JP-NanamiNeural';

  const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${languageCode}">
    <voice name="${voiceName}">
      <prosody rate="${speed}">${escapeXml(text)}</prosody>
    </voice>
  </speak>`;

  try {
    const endpoint = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
      },
      body: ssml,
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Azure error:', response.status, error);
      return NextResponse.json({ error: 'TTS failed' }, { status: response.status });
    }

    const audioBuffer = await response.arrayBuffer();
    
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('TTS error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

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