// app/api/test-korean/route.ts
import { NextResponse } from 'next/server';

type TestResult = {
  input: string;
  success: boolean;
  korean?: string | null;
  japanese_kanji?: string | null;
  japanese_romaji?: string | null;
  hasKoreanText?: boolean;
  hasJapaneseKanjiText?: boolean;
  error?: string | null;
};

export async function GET() {
  // Test Korean phrases
  const testPhrases = [
    "Hello",
    "How are you?",
    "Thank you",
    "Do you like it?",
    "What is your name?",
    "Nice to meet you"
  ];
  
  const results: TestResult[] = [];
  
  for (const phrase of testPhrases) {
    try {
      // Call your translation API
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: phrase,
          direction: 'en-to-lang',
          language: 'korean'
        })
      });
      
      const result = await response.json();
      
      results.push({
        input: phrase,
        success: response.ok,
        korean: result.korean || null,
        japanese_kanji: result.japanese_kanji || null,
        japanese_romaji: result.japanese_romaji || null,
        hasKoreanText: !!result.korean,
        hasJapaneseKanjiText: !!result.japanese_kanji,
        error: result.error || null
      });
      
    } catch (error) {
      results.push({
        input: phrase,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  // Summary statistics - FIXED: use correct property names
  const successCount = results.filter((r: TestResult) => r.success).length;
  const hasKoreanTextCount = results.filter((r: TestResult) => r.hasKoreanText).length;
  const hasJapaneseKanjiCount = results.filter((r: TestResult) => r.hasJapaneseKanjiText).length;
  
  return NextResponse.json({
    summary: {
      total: testPhrases.length,
      successful: successCount,
      hasKoreanText: hasKoreanTextCount,
      hasJapaneseKanji: hasJapaneseKanjiCount,
      missingKoreanText: successCount - hasKoreanTextCount
    },
    results
  });
}