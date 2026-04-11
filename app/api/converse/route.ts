import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  try {
    const { topic, history, userMessage, language = 'japanese' } = await req.json()

    const langName = language.charAt(0).toUpperCase() + language.slice(1)
    const langCode = language === 'japanese' ? 'ja-JP' : language === 'korean' ? 'ko-KR' : 'zh-CN'

    const systemPrompt = `You are a friendly ${langName} conversation partner helping a beginner practise ${langName}.
Have a natural conversation about: ${topic}.
Keep your ${langName} simple — short sentences, beginner vocabulary.
You MUST respond with ONLY a valid JSON object. No extra text, no markdown, no commentary outside the JSON.
The JSON must have: japanese (the ${langName} text in native script), romaji (romanised pronunciation), english (direct translation only).`

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

    let japanese = '', romaji = '', english = ''
    try {
      const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())
      japanese = parsed.japanese || ''
      romaji = parsed.romaji || ''
      english = parsed.english || ''
    } catch {
      const retryMsg = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        messages: [{
          role: 'user',
          content: `You are a ${langName} conversation partner. Topic: ${topic}.
History: ${JSON.stringify(history)}
Student said: "${userMessage}"

Respond ONLY with this exact JSON:
{
  "japanese": "your reply in ${langName} native script only",
  "romaji": "romanised pronunciation of your reply",
  "english": "direct English translation of your reply only"
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

    let correction = null
    const hasScript = /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff\uac00-\ud7af]/.test(userMessage)
    if (hasScript) {
      const correctionMsg = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: `A ${langName} beginner wrote: "${userMessage}"

Respond ONLY with valid JSON:
{
  "is_correct": true or false,
  "confidence_score": 0-100,
  "confidence_label": "Perfect, Almost there, Good start, Needs work, or Not quite",
  "corrected": "corrected ${langName} if needed — same as input if correct",
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
