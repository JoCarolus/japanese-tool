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
    
    console.log('Translating:', { input, language });
    
    // Comprehensive mock data with full breakdowns
    const translations: Record<string, Record<string, any>> = {
      // Common phrases
      'hello': {
        korean: {
          japanese_kanji: '안녕하세요',
          korean: '안녕하세요',
          japanese_kana: '안녕하세요',
          japanese_romaji: 'annyeonghaseyo',
          syllable_breakdown: 'an-nyeong-ha-se-yo',
          pitch_accent: 'Starts low, rises on "nyeong", then falls gradually',
          pronunciation_tips: 'The "nyeong" sounds like "young" with an N sound. Keep it smooth and flowing.',
          breakdown: [
            { word: '안녕', reading: 'annyeong', meaning: 'peace/well-being', role: 'noun' },
            { word: '하세요', reading: 'haseyo', meaning: 'polite form of "do"', role: 'verb suffix' }
          ],
          structure: 'Literally "Are you at peace?" - a question asking about someone\'s well-being',
          tips: 'Use this in most situations. For close friends, use "안녕" (annyeong)',
          english: 'Hello'
        },
        chinese: {
          japanese_kanji: '你好',
          chinese: '你好',
          japanese_kana: 'nǐ hǎo',
          japanese_romaji: 'ni hao',
          syllable_breakdown: 'nǐ-hǎo',
          pitch_accent: 'Both syllables have falling-rising tones (3rd tone)',
          pronunciation_tips: 'The "nǐ" dips down then up. The "hǎo" does the same pattern.',
          breakdown: [
            { word: '你', reading: 'nǐ', meaning: 'you', role: 'pronoun' },
            { word: '好', reading: 'hǎo', meaning: 'good', role: 'adjective' }
          ],
          structure: 'Literally "you good" - a simple greeting wishing someone well',
          tips: 'Standard greeting for any situation, formal or informal',
          english: 'Hello'
        },
        japanese: {
          japanese_kanji: 'こんにちは',
          japanese_kana: 'こんにちは',
          japanese_romaji: 'konnichiwa',
          syllable_breakdown: 'ko-n-ni-chi-wa',
          pitch_accent: 'Rises on the second mora (n), then stays level',
          pronunciation_tips: 'Hold the "n" sound for a full beat. The final "wa" is pronounced "ha" in writing.',
          breakdown: [
            { word: 'こんにち', reading: 'konnichi', meaning: 'this day', role: 'noun' },
            { word: 'は', reading: 'wa', meaning: 'topic marker', role: 'particle' }
          ],
          structure: 'Shortened from "konnichi wa gokigen ikaga desu ka" (How is your mood this day?)',
          tips: 'Use during daytime (10am-6pm). For morning: "ohayou gozaimasu", evening: "konbanwa"',
          english: 'Hello'
        }
      },
      
      'do you want this?': {
        korean: {
          japanese_kanji: '이것을 원하세요?',
          korean: '이것을 원하세요?',
          japanese_kana: '이것을 원하세요?',
          japanese_romaji: 'igeoseul wonhaseyo?',
          syllable_breakdown: 'i-geo-seul-won-ha-se-yo',
          pitch_accent: 'Rises on "won", falls at the end for question',
          pronunciation_tips: 'The "eo" in "geoseul" is like "uh" in "cup"',
          breakdown: [
            { word: '이것을', reading: 'igeoseul', meaning: 'this (object)', role: 'noun + object marker' },
            { word: '원하세요?', reading: 'wonhaseyo?', meaning: 'do you want?', role: 'verb (polite question)' }
          ],
          structure: 'Object + want (polite question form)',
          tips: 'Polite way to ask if someone wants something',
          english: 'Do you want this?'
        },
        chinese: {
          japanese_kanji: '你想要这个吗？',
          chinese: '你想要这个吗？',
          japanese_kana: 'nǐ xiǎng yào zhè ge ma?',
          japanese_romaji: 'ni xiang yao zhe ge ma?',
          syllable_breakdown: 'nǐ-xiǎng-yào-zhè-ge-ma',
          pitch_accent: 'Rises on "xiǎng", falls on "ma" at the end',
          pronunciation_tips: 'The "xi" sounds like "she" without the vowel',
          breakdown: [
            { word: '你', reading: 'nǐ', meaning: 'you', role: 'pronoun' },
            { word: '想要', reading: 'xiǎng yào', meaning: 'want', role: 'verb' },
            { word: '这个', reading: 'zhè ge', meaning: 'this', role: 'demonstrative' },
            { word: '吗', reading: 'ma', meaning: 'question particle', role: 'particle' }
          ],
          structure: 'You + want + this + question particle',
          tips: 'Standard way to ask "Do you want this?" in Chinese',
          english: 'Do you want this?'
        },
        japanese: {
          japanese_kanji: 'これが欲しいですか？',
          japanese_kana: 'これがほしいですか？',
          japanese_romaji: 'kore ga hoshii desu ka?',
          syllable_breakdown: 'ko-re-ga-ho-shi-i-de-su-ka',
          pitch_accent: 'Rises on "ho", then falls',
          pronunciation_tips: 'The "shi" is pronounced like "she"',
          breakdown: [
            { word: 'これ', reading: 'kore', meaning: 'this', role: 'pronoun' },
            { word: 'が', reading: 'ga', meaning: 'subject marker', role: 'particle' },
            { word: '欲しい', reading: 'hoshii', meaning: 'want (desired)', role: 'adjective' },
            { word: 'ですか', reading: 'desu ka', meaning: 'polite question ending', role: 'suffix' }
          ],
          structure: 'This + subject marker + want + polite question',
          tips: 'Use "hoshii" when wanting an object (not an action)',
          english: 'Do you want this?'
        }
      },
      
      'do you like it?': {
        korean: {
          japanese_kanji: '좋아하세요?',
          korean: '좋아하세요?',
          japanese_kana: '좋아하세요?',
          japanese_romaji: 'joahaseyo?',
          syllable_breakdown: 'jo-a-ha-se-yo',
          pitch_accent: 'Rises on "ha", falls at the end',
          pronunciation_tips: 'The "jo" is like "jo" in "jog"',
          breakdown: [
            { word: '좋아하세요?', reading: 'joahaseyo?', meaning: 'do you like?', role: 'verb (polite question)' }
          ],
          structure: 'Like (polite question form)',
          tips: 'Polite way to ask if someone likes something',
          english: 'Do you like it?'
        },
        chinese: {
          japanese_kanji: '你喜欢它吗？',
          chinese: '你喜欢它吗？',
          japanese_kana: 'nǐ xǐ huān tā ma?',
          japanese_romaji: 'ni xi huan ta ma?',
          syllable_breakdown: 'nǐ-xǐ-huān-tā-ma',
          pitch_accent: 'Rises on "huān", falls on "ma"',
          pronunciation_tips: 'The "xǐ" sounds like "she"',
          breakdown: [
            { word: '你', reading: 'nǐ', meaning: 'you', role: 'pronoun' },
            { word: '喜欢', reading: 'xǐ huān', meaning: 'like', role: 'verb' },
            { word: '它', reading: 'tā', meaning: 'it', role: 'pronoun' },
            { word: '吗', reading: 'ma', meaning: 'question particle', role: 'particle' }
          ],
          structure: 'You + like + it + question particle',
          tips: 'Standard way to ask "Do you like it?"',
          english: 'Do you like it?'
        },
        japanese: {
          japanese_kanji: '好きですか？',
          japanese_kana: 'すきですか？',
          japanese_romaji: 'suki desu ka?',
          syllable_breakdown: 'su-ki-de-su-ka',
          pitch_accent: 'Rises on "ki", then falls',
          pronunciation_tips: 'The "su" is very short, almost just "s"',
          breakdown: [
            { word: '好き', reading: 'suki', meaning: 'like', role: 'na-adjective' },
            { word: 'ですか', reading: 'desu ka', meaning: 'polite question ending', role: 'suffix' }
          ],
          structure: 'Like + polite question',
          tips: 'Can also say "suki desu" (I like it) without "ka" for statement',
          english: 'Do you like it?'
        }
      },
      
      'i want this': {
        korean: {
          japanese_kanji: '이것을 원해요',
          korean: '이것을 원해요',
          japanese_kana: '이것을 원해요',
          japanese_romaji: 'igeoseul wonhaeyo',
          syllable_breakdown: 'i-geo-seul-won-hae-yo',
          pitch_accent: 'Rises on "won", falls at the end',
          pronunciation_tips: 'The "eo" is like "uh"',
          breakdown: [
            { word: '이것을', reading: 'igeoseul', meaning: 'this', role: 'object' },
            { word: '원해요', reading: 'wonhaeyo', meaning: 'want', role: 'verb' }
          ],
          structure: 'This + want (polite form)',
          tips: 'Polite way to say "I want this"',
          english: 'I want this'
        },
        chinese: {
          japanese_kanji: '我想要这个',
          chinese: '我想要这个',
          japanese_kana: 'wǒ xiǎng yào zhè ge',
          japanese_romaji: 'wo xiang yao zhe ge',
          syllable_breakdown: 'wǒ-xiǎng-yào-zhè-ge',
          pitch_accent: 'Rises on "xiǎng", then falls',
          pronunciation_tips: 'The "wǒ" has a falling-rising tone',
          breakdown: [
            { word: '我', reading: 'wǒ', meaning: 'I', role: 'pronoun' },
            { word: '想要', reading: 'xiǎng yào', meaning: 'want', role: 'verb' },
            { word: '这个', reading: 'zhè ge', meaning: 'this', role: 'demonstrative' }
          ],
          structure: 'I + want + this',
          tips: 'Standard way to say "I want this"',
          english: 'I want this'
        },
        japanese: {
          japanese_kanji: 'これが欲しいです',
          japanese_kana: 'これがほしいです',
          japanese_romaji: 'kore ga hoshii desu',
          syllable_breakdown: 'ko-re-ga-ho-shi-i-de-su',
          pitch_accent: 'Rises on "ho", then falls',
          pronunciation_tips: 'The "shi" is like "she"',
          breakdown: [
            { word: 'これ', reading: 'kore', meaning: 'this', role: 'pronoun' },
            { word: 'が', reading: 'ga', meaning: 'subject marker', role: 'particle' },
            { word: '欲しい', reading: 'hoshii', meaning: 'want', role: 'adjective' },
            { word: 'です', reading: 'desu', meaning: 'polite ending', role: 'suffix' }
          ],
          structure: 'This + subject marker + want + polite',
          tips: 'Use "hoshii" when wanting an object (not an action)',
          english: 'I want this'
        }
      },
      
      'you\'re welcome': {
        korean: {
          japanese_kanji: '천만에요',
          korean: '천만에요',
          japanese_kana: '천만에요',
          japanese_romaji: 'cheonmaneyo',
          syllable_breakdown: 'cheon-ma-ne-yo',
          pitch_accent: 'Starts medium, rises on "ma", then falls',
          pronunciation_tips: 'The "ch" is soft like in "cheese"',
          breakdown: [
            { word: '천만', reading: 'cheonman', meaning: 'ten million', role: 'noun' },
            { word: '에요', reading: 'eyo', meaning: 'polite ending', role: 'suffix' }
          ],
          structure: 'Fixed expression meaning "ten million" - used for "you\'re welcome"',
          tips: 'For casual settings, you can say "아니에요" (anieyo)',
          english: 'You\'re welcome'
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
          tips: 'Most common way to say "you\'re welcome"',
          english: 'You\'re welcome'
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
          structure: 'Humble expression meaning "how could I (do that)"',
          tips: 'Standard polite way to say "you\'re welcome"',
          english: 'You\'re welcome'
        }
      }
    };
    
    const lowerInput = input.toLowerCase().trim();
    console.log('Looking for:', lowerInput);
    console.log('Available keys:', Object.keys(translations));
    
    if (translations[lowerInput] && translations[lowerInput][language]) {
      console.log('Found translation for:', lowerInput, language);
      return NextResponse.json(translations[lowerInput][language]);
    }
    
    // If not found, return a helpful error
    console.log('No translation found for:', lowerInput, language);
    return NextResponse.json({
      japanese_kanji: `[Translation needed: "${input}" in ${language}]`,
      japanese_kana: '',
      japanese_romaji: '',
      syllable_breakdown: '',
      pitch_accent: '',
      pronunciation_tips: `This phrase hasn't been added to the dictionary yet.`,
      breakdown: [],
      structure: '',
      tips: `Please try a different phrase or contact support to add "${input}"`,
      english: input
    });
    
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}