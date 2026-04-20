// app/api/translate/route.ts
import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  try {
    const { input, direction, language = 'japanese' } = await req.json()

    if (!input || !direction) {
      return NextResponse.json({ error: 'Missing input or direction' }, { status: 400 })
    }

    const langName = language.charAt(0).toUpperCase() + language.slice(1)
    const directionLabel =
      direction === 'en-to-lang'
        ? `Translate the following from English to ${langName}.`
        : `Translate the following from ${langName} to English.`

    // Language-specific instructions for reading and romaji fields
    const readingInstructions = language === 'japanese'
      ? `"japanese_kana": "hiragana reading of the Japanese text — always include this, even if the text is already in hiragana",
  "japanese_romaji": "romaji (romanised) pronunciation of the Japanese text — always include this",`
      : language === 'korean'
      ? `"japanese_kana": "Korean text written in hangul romanisation (Revised Romanization of Korean) — always include this, never leave empty",
  "japanese_romaji": "the same romanisation again — always include this, never leave empty",`
      : `"japanese_kana": "pinyin with tone marks for the Chinese text — always include this, never leave empty",
  "japanese_romaji": "pinyin without tone marks, just the syllables — always include this, never leave empty",`

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `${directionLabel}

Input: "${input}"

You are explaining this to a beginner learning ${langName} casually. Keep all explanations simple, friendly, and jargon-free. Short sentences. Plain words.

IMPORTANT: Every field in the JSON must have a value. Never leave any field empty or null.

Respond ONLY with a valid JSON object. No markdown, no code fences, no extra text:

{
  "english": "the English text",
  "japanese_kanji": "the ${langName} text in its native script",
  ${readingInstructions}
  "syllable_breakdown": "syllable-by-syllable pronunciation using hyphens e.g. an-nyeong for Korean, ni-hao for Chinese, ko-n-ni-chi-wa for Japanese",
  "pitch_accent": "describe the pronunciation pattern in 1-2 plain English sentences",
  "pronunciation_tips": "1-2 tips on how to say this correctly for English speakers",
  "breakdown": [
    {
      "word": "individual word or character in native script",
      "reading": "phonetic reading of this word",
      "meaning": "English meaning in plain terms",
      "role": "what this word is doing in the sentence in simple terms"
    }
  ],
  "structure": "Explain how the sentence is built in 2-3 short simple sentences. Use everyday language.",
  "tips": "1-2 practical tips written like friendly advice."
}`,
        },
      ],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    const clean = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    // Add language-specific fields for ResultCard compatibility
    if (language === 'korean') {
      parsed.korean = parsed.japanese_kanji
    }
    if (language === 'chinese') {
      parsed.chinese = parsed.japanese_kanji
    }

    // Ensure all fields have values
    parsed.english = parsed.english || input
    parsed.japanese_kana = parsed.japanese_kana || ''
    parsed.japanese_romaji = parsed.japanese_romaji || ''
    parsed.syllable_breakdown = parsed.syllable_breakdown || ''
    parsed.pitch_accent = parsed.pitch_accent || ''
    parsed.pronunciation_tips = parsed.pronunciation_tips || ''
    parsed.breakdown = parsed.breakdown || []
    parsed.structure = parsed.structure || ''
    parsed.tips = parsed.tips || ''

    return NextResponse.json(parsed)
  } catch (error) {
    console.error('Translate API error:', error)
    return NextResponse.json(
      { error: 'Translation failed. Please try again.' },
      { status: 500 }
    )
  }
}
