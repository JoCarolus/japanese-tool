import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  try {
    const { topic, history, userMessage } = await req.json()

    const systemPrompt = `You are a friendly Japanese conversation partner helping a beginner practise Japanese.
Have a natural conversation about: ${topic}.
Keep your Japanese simple — short sentences, beginner vocabulary.
You MUST respond with ONLY a valid JSON object. No extra text, no markdown, no commentary outside the JSON.`

    const conversationMessages = [
      ...history,
      { role: 'user', content: userMessage }
    ]

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      system: systemPrompt,
      messages: conversationMessages,
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''

    // Check if response is already JSON (new prompt enforcement)
    let japanese = '', romaji = '', english = ''
    try {
      const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())
      japanese = parsed.japanese || ''
      romaji = parsed.romaji || ''
      english = parsed.english || ''
    } catch {
      // Fallback: ask again with explicit JSON instruction
      const retryMsg = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        messages: [{
          role: 'user',
          content: `You are a Japanese conversation partner. The topic is: ${topic}.
The conversation so far: ${JSON.stringify(history)}
The student said: "${userMessage}"

Respond ONLY with this exact JSON object, nothing else:
{
  "japanese": "your reply in Japanese (kanji/kana only, no romaji, no English mixed in)",
  "romaji": "romaji pronunciation of your Japanese reply",
  "english": "direct English translation of your Japanese reply only — nothing extra"
}`
        }]
      })
      const retryRaw = retryMsg.content[0].type === 'text' ? retryMsg.content[0].text : ''
      try {
        const retryParsed = JSON.parse(retryRaw.replace(/```json|```/g, '').trim())
        japanese = retryParsed.japanese || ''
        romaji = retryParsed.romaji || ''
        english = retryParsed.english || ''
      } catch {
        japanese = raw
        romaji = ''
        english = ''
      }
    }

    // Get correction for user message if it contains Japanese characters
    let correction = null
    const hasJapanese = /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]/.test(userMessage)
    if (hasJapanese) {
      const correctionMsg = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: `A Japanese beginner wrote: "${userMessage}"
          
Respond ONLY with valid JSON, no markdown, no extra text:
{
  "is_correct": true or false,
  "confidence_score": 0-100,
  "confidence_label": "Perfect, Almost there, Good start, Needs work, or Not quite",
  "corrected": "corrected Japanese if needed — same as input if correct",
  "tip": "one short friendly tip in plain English, max 1 sentence. null if perfect."
}`
        }]
      })
      const corrRaw = correctionMsg.content[0].type === 'text' ? correctionMsg.content[0].text : ''
      try {
        correction = JSON.parse(corrRaw.replace(/```json|```/g, '').trim())
      } catch {
        correction = null
      }
    }

    return NextResponse.json({ japanese, romaji, english, correction })
  } catch (error) {
    console.error('Converse API error:', error)
    return NextResponse.json({ error: 'Conversation failed. Please try again.' }, { status: 500 })
  }
}
