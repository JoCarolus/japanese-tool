import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  try {
    const { input, direction } = await req.json()

    if (!input || !direction) {
      return NextResponse.json({ error: 'Missing input or direction' }, { status: 400 })
    }

    const directionLabel =
      direction === 'en-to-jp'
        ? 'Translate the following from English to Japanese.'
        : 'Translate the following from Japanese to English.'

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `${directionLabel}

Input: "${input}"

You are explaining this to a beginner who is learning Japanese casually. Keep all explanations simple, friendly, and jargon-free. Write like you are texting a friend who just started learning — not like a textbook. Short sentences. Plain words.

Respond ONLY with a valid JSON object. No markdown, no code fences, no extra text:

{
  "english": "the English text",
  "japanese_kanji": "Japanese written in kanji and kana",
  "japanese_kana": "hiragana/katakana reading only",
  "japanese_romaji": "romanised pronunciation",
  "syllable_breakdown": "syllable-by-syllable pronunciation using hyphens e.g. ko-n-ni-chi-wa",
  "pitch_accent": "describe the pitch pattern in plain English. Say which parts go high or low in tone, like a simple up-down guide. Keep it to 2 sentences max.",
  "pronunciation_tips": "1-2 tips on how to say this correctly. Focus on sounds that trip up English speakers. Plain English only, no phonetic symbols.",
  "breakdown": [
    {
      "word": "individual Japanese word or particle",
      "reading": "hiragana reading of this word",
      "meaning": "English meaning of this word in plain terms",
      "role": "what this word is doing in the sentence, in simple terms e.g. the subject (who is doing the action), the action, a connector word, describes something"
    }
  ],
  "structure": "Explain how the sentence is built in 2-3 short simple sentences. Use everyday language. If you mention any Japanese grammar term, immediately explain what it means in brackets. Focus on the most useful thing for a beginner to understand.",
  "tips": "1-2 practical tips written like friendly advice. When would you use this? Is there a simpler or more common way to say it? Any easy mistakes to avoid?"
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
