import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  try {
    const { topic } = await req.json()

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `You are starting a Japanese conversation practice session about: ${topic}.

Write a natural, friendly opening line in Japanese to start the conversation. Keep it simple for a beginner.
Write the Japanese first, then on the next line write the English translation.
Return ONLY these two lines, nothing else.`
      }]
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    const lines = raw.split('\n').filter((l: string) => l.trim())
    const japanese = lines[0] || raw
    const english = lines.slice(1).join(' ') || ''

    const romajiMsg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `Convert this Japanese text to romaji only. Return ONLY the romaji, nothing else: ${japanese}`
      }]
    })
    const romaji = romajiMsg.content[0].type === 'text' ? romajiMsg.content[0].text.trim() : ''

    return NextResponse.json({ japanese, romaji, english })
  } catch (error) {
    console.error('Converse start error:', error)
    return NextResponse.json({ error: 'Failed to start conversation.' }, { status: 500 })
  }
}
