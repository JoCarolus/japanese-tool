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

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `${directionLabel}

Input: "${input}"

You are explaining this to a beginner learning ${langName} casually. Keep all explanations simple, friendly, and jargon-free. Write like you are texting a friend who just started learning — not like a textbook. Short sentences. Plain words.

Respond ONLY with a valid JSON object. No markdown, no code fences, no extra text:

{
  "english": "the English text",
  "japanese_kanji": "the ${langName} text in its native script",
  "japanese_kana": "phonetic reading if applicable (hiragana for Japanese, pinyin for Chinese, romanised hangul for Korean) — omit if same as above",
  "japanese_romaji": "romanised pronunciation",
  "syllable_breakdown": "syllable-by-syllable pronunciation using hyphens",
  "pitch_accent": "describe the pronunciation pattern in plain English — 2 sentences max",
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

    return NextResponse.json(parsed)
  } catch (error) {
    console.error('Translate API error:', error)
    return NextResponse.json(
      { error: 'Translation failed. Please try again.' },
      { status: 500 }
    )
  }
}
