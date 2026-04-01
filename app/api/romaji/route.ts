import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  try {
    const { japanese } = await req.json()
    if (!japanese) return NextResponse.json({ romaji: '' })

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `Convert this Japanese text to romaji. Return ONLY the romaji pronunciation, nothing else, no explanation, no punctuation changes: ${japanese}`
      }]
    })

    const romaji = message.content[0].type === 'text'
      ? message.content[0].text.trim()
      : ''

    return NextResponse.json({ romaji })
  } catch (error) {
    console.error('Romaji API error:', error)
    return NextResponse.json({ romaji: '' })
  }
}
