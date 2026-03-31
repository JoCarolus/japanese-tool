import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  try {
    const { topic, corrections } = await req.json()

    const avgScore = corrections.length > 0
      ? Math.round(corrections.reduce((a: number, c: any) => a + (c.confidence_score || 0), 0) / corrections.length)
      : 100

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `A beginner just finished a Japanese conversation practice about: ${topic}.
Their average confidence score was ${avgScore}%.
Their corrections were: ${JSON.stringify(corrections)}

Respond ONLY with valid JSON, no markdown:
{
  "overall_score": ${avgScore},
  "overall_label": "one of: Excellent, Great job, Good effort, Keep practising",
  "highlight": "One thing they did well, in 1 friendly sentence.",
  "focus_next": "One simple thing to work on next time, in 1 friendly sentence.",
  "encouragement": "A short encouraging closing message, 1-2 sentences."
}`
      }]
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())
    return NextResponse.json(parsed)
  } catch (error) {
    console.error('Summary error:', error)
    return NextResponse.json({ error: 'Summary failed.' }, { status: 500 })
  }
}
