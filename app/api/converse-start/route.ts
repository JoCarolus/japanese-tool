import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  try {
    const { topic, language = 'japanese' } = await req.json()
    const langName = language.charAt(0).toUpperCase() + language.slice(1)

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: `You are a friendly ${langName} conversation partner starting a conversation about: ${topic}.

Give a natural, simple opening line that a ${langName} speaker would say to start this conversation. Keep it beginner level.

Respond ONLY with this exact JSON object, nothing else:
{
  "japanese": "your opening line in ${langName} native script only",
  "romaji": "romanised pronunciation",
  "english": "direct English translation only"
}`
      }]
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    const clean = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    return NextResponse.json(parsed)
  } catch (error) {
    console.error('Converse start error:', error)
    return NextResponse.json({ error: 'Failed to start conversation' }, { status: 500 })
  }
}
