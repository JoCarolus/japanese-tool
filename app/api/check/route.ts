import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  try {
    const { attempt, intended, language = 'japanese' } = await req.json()

    if (!attempt) {
      return NextResponse.json({ error: 'Missing input' }, { status: 400 })
    }

    const langName = language.charAt(0).toUpperCase() + language.slice(1)

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `You are a friendly ${langName} teacher helping a beginner learner.

The student wants to say: "${intended}"
The student wrote in ${langName}: "${attempt}"

Respond ONLY with a valid JSON object. No markdown, no code fences, no extra text:

{
  "correct_sentence": "The correct ${langName} sentence for what they were trying to say",
  "correct_romaji": "Romanised pronunciation of the correct sentence",
  "student_sentence": "The student's original attempt exactly as written",
  "is_correct": true or false,
  "confidence_score": 0-100,
  "confidence_label": "one of: Perfect, Almost there, Good start, Needs work, Not quite",
  "what_was_wrong": "In plain simple English, explain what was wrong. Max 3 sentences. No jargon.",
  "what_was_right": "In one short sentence, mention what the student got right. If nothing, say something encouraging.",
  "remember_this": "One simple takeaway rule for next time. Friendly tip, not textbook. Max 2 sentences.",
  "example_sentences": [
    {
      "japanese": "A simple related example sentence in ${langName}",
      "romaji": "Romanised pronunciation",
      "english": "English meaning"
    }
  ]
}`,
        },
      ],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    const clean = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    return NextResponse.json(parsed)
  } catch (error) {
    console.error('Check API error:', error)
    return NextResponse.json(
      { error: 'Check failed. Please try again.' },
      { status: 500 }
    )
  }
}
