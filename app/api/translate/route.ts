// app/api/translate/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    message: 'API is working'
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { input, language } = body;
    
    // Build language-specific prompt
    let systemPrompt = '';
    let targetLanguage = '';
    
    if (language === 'korean') {
      targetLanguage = 'Korean';
      systemPrompt = `You are a Korean language teacher. Translate the following English phrase to Korean.

Return ONLY valid JSON in this exact format, no other text:
{
  "japanese_kanji": "Korean Hangul text",
  "korean": "Korean Hangul text",
  "japanese_kana": "Korean Hangul (same as above)",
  "japanese_romaji": "Romanized Korean",
  "syllable_breakdown": "Break the word/phrase into syllables with hyphens (e.g., an-nyeong-ha-se-yo)",
  "pitch_accent": "Explain the intonation pattern (e.g., 'Starts low, rises on the second syllable')",
  "pronunciation_tips": "2-3 helpful tips for English speakers",
  "breakdown": [
    {"word": "each syllable or word", "reading": "pronunciation", "meaning": "meaning", "role": "part of speech"}
  ],
  "structure": "Explain the grammar pattern or sentence structure",
  "tips": "Usage tips and cultural notes"
}`;
    } else if (language === 'chinese') {
      targetLanguage = 'Chinese';
      systemPrompt = `You are a Chinese language teacher. Translate the following English phrase to Simplified Chinese.

Return ONLY valid JSON in this exact format:
{
  "japanese_kanji": "Simplified Chinese text",
  "chinese": "Simplified Chinese text",
  "japanese_kana": "Pinyin with tone marks",
  "japanese_romaji": "Pinyin without tone marks",
  "syllable_breakdown": "Break pinyin into syllables",
  "pitch_accent": "Tone pattern explanation",
  "pronunciation_tips": "2-3 helpful tips for English speakers",
  "breakdown": [
    {"word": "each character", "reading": "pinyin", "meaning": "meaning", "role": "character type"}
  ],
  "structure": "Grammar pattern explanation",
  "tips": "Usage tips"
}`;
    } else {
      targetLanguage = 'Japanese';
      systemPrompt = `You are a Japanese language teacher. Translate the following English phrase to Japanese.

Return ONLY valid JSON in this exact format:
{
  "japanese_kanji": "Japanese text (Kanji + Kana)",
  "japanese_kana": "Hiragana reading",
  "japanese_romaji": "Romaji",
  "syllable_breakdown": "Break into mora with hyphens",
  "pitch_accent": "Pitch pattern explanation",
  "pronunciation_tips": "2-3 helpful tips for English speakers",
  "breakdown": [
    {"word": "each word/particle", "reading": "pronunciation", "meaning": "meaning", "role": "part of speech"}
  ],
  "structure": "Grammar explanation",
  "tips": "Usage and cultural notes"
}`;
    }

    // Check if API key exists
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY is not set');
      // Return mock response with full breakdown
      return getMockResponse(input, language);
    }

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 2000,
        temperature: 0.3,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `Translate "${input}" to ${targetLanguage}. Include all requested fields.`
          }
        ]
      })
    });

    if (!response.ok) {
      console.error('Claude API error:', response.status);
      return getMockResponse(input, language);
    }

    const data = await response.json();
    const content = data.content[0].text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      return getMockResponse(input, language);
    }
    
    let translationResult;
    try {
      translationResult = JSON.parse(jsonMatch[0]);
    } catch (e) {
      return getMockResponse(input, language);
    }

    // Add English field
    translationResult.english = input;
    
    return NextResponse.json(translationResult);
    
  } catch (error) {
    console.error('Error:', error);
    return getMockResponse('', '');
  }
}

// Mock responses with full breakdown for common phrases
function getMockResponse(input: string, language: string) {
  const mockData: Record<string, Record<string, any>> = {
    'you\'re welcome': {
      korean: {
        japanese_kanji: '천만에요',
        korean: '천만에요',
        japanese_kana: '천만에요',
        japanese_romaji: 'cheonmaneyo',
        syllable_breakdown: 'cheon-ma-ne-yo',
        pitch_accent: 'Starts medium, rises slightly on "ma", then falls',
        pronunciation_tips: 'The "ch" is soft like in "cheese". The "eo" is like "uh" in "cup".',
        breakdown: [
          { word: '천만', reading: 'cheonman', meaning: 'ten million', role: 'noun' },
          { word: '에요', reading: 'eyo', meaning: 'polite ending', role: 'suffix' }
        ],
        structure: 'This is a fixed polite expression meaning "ten million" - used to say "you\'re welcome"',
        tips: 'Use this in formal situations. For casual settings, you can say "아니에요" (anieyo)',
        english: input
      },
      chinese: {
        japanese_kanji: '不客气',
        chinese: '不客气',
        japanese_kana: 'bù kè qì',
        japanese_romaji: 'bu ke qi',
        syllable_breakdown: 'bù-kè-qì',
        pitch_accent: 'Falling, falling-rising, falling',
        pronunciation_tips: 'The "bù" changes to "bú" before a fourth tone',
        breakdown: [
          { word: '不', reading: 'bù', meaning: 'not', role: 'adverb' },
          { word: '客气', reading: 'kè qì', meaning: 'polite', role: 'adjective' }
        ],
        structure: 'Literally "not polite" - meaning "don\'t be polite"',
        tips: 'Most common way to say "you\'re welcome" in Chinese',
        english: input
      },
      japanese: {
        japanese_kanji: 'どういたしまして',
        japanese_kana: 'どういたしまして',
        japanese_romaji: 'dou itashimashite',
        syllable_breakdown: 'do-u-i-ta-shi-ma-shi-te',
        pitch_accent: 'Flat, then rises on "shi"',
        pronunciation_tips: 'The "u" in "dou" is very short',
        breakdown: [
          { word: 'どう', reading: 'dou', meaning: 'how', role: 'adverb' },
          { word: 'いたしまして', reading: 'itashimashite', meaning: 'humble form of "do"', role: 'verb' }
        ],
        structure: 'Humble expression literally meaning "how could I (do that)"',
        tips: 'Standard polite way to say "you\'re welcome"',
        english: input
      }
    },
    'hello': {
      korean: {
        japanese_kanji: '안녕하세요',
        korean: '안녕하세요',
        japanese_kana: '안녕하세요',
        japanese_romaji: 'annyeonghaseyo',
        syllable_breakdown: 'an-nyeong-ha-se-yo',
        pitch_accent: 'Starts low, rises on "nyeong", then falls',
        pronunciation_tips: 'The "nyeong" sounds like "young" with an N sound',
        breakdown: [
          { word: '안녕', reading: 'annyeong', meaning: 'peace/well-being', role: 'noun' },
          { word: '하세요', reading: 'haseyo', meaning: 'polite form of "do"', role: 'verb' }
        ],
        structure: 'Literally "Are you at peace?"',
        tips: 'Use this in most situations. For close friends, use "안녕" (annyeong)',
        english: input
      },
      chinese: {
        japanese_kanji: '你好',
        chinese: '你好',
        japanese_kana: 'nǐ hǎo',
        japanese_romaji: 'ni hao',
        syllable_breakdown: 'nǐ-hǎo',
        pitch_accent: 'Falling-rising, falling-rising',
        pronunciation_tips: 'Both syllables have dipping tones',
        breakdown: [
          { word: '你', reading: 'nǐ', meaning: 'you', role: 'pronoun' },
          { word: '好', reading: 'hǎo', meaning: 'good', role: 'adjective' }
        ],
        structure: 'Literally "you good"',
        tips: 'Standard greeting for any situation',
        english: input
      },
      japanese: {
        japanese_kanji: 'こんにちは',
        japanese_kana: 'こんにちは',
        japanese_romaji: 'konnichiwa',
        syllable_breakdown: 'ko-n-ni-chi-wa',
        pitch_accent: 'Rises on the second mora',
        pronunciation_tips: 'The "n" is a full beat. The "wa" is pronounced like "ha"',
        breakdown: [
          { word: 'こんにち', reading: 'konnichi', meaning: 'today', role: 'noun' },
          { word: 'は', reading: 'wa', meaning: 'topic marker', role: 'particle' }
        ],
        structure: 'Shortened from "konnichi wa gokigen ikaga desu ka"',
        tips: 'Use during daytime (10am-6pm)',
        english: input
      }
    }
  };
  
  const lowerInput = input.toLowerCase().trim();
  
  if (mockData[lowerInput] && mockData[lowerInput][language]) {
    return NextResponse.json(mockData[lowerInput][language]);
  }
  
  // Default fallback
  return NextResponse.json({
    japanese_kanji: input,
    japanese_kana: '',
    japanese_romaji: '',
    syllable_breakdown: '',
    pitch_accent: '',
    pronunciation_tips: '',
    breakdown: [],
    structure: '',
    tips: '',
    english: input
  });
}