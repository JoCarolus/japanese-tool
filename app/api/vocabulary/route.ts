import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic = new Anthropic()

export async function POST(req: NextRequest) {
  try {
    const { action, userId, language, english, wordId } = await req.json()

    // Fetch all words for a user/language
    if (action === 'list') {
      const { data, error } = await supabase
        .from('vocabulary')
        .select('*')
        .eq('user_id', userId)
        .eq('language', language)
        .order('created_at', { ascending: false })
      return NextResponse.json({ data: data || [], error: error?.message })
    }

    // Add a new word — auto-translate from English
    if (action === 'add') {
      if (!english || !userId || !language) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
      }

      const langName = language.charAt(0).toUpperCase() + language.slice(1)

      const message = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        messages: [{
          role: 'user',
          content: `Translate "${english}" from English to ${langName}.
Respond ONLY with valid JSON, no markdown:
{
  "native": "the word in ${langName} native script",
  "reading": "phonetic reading (hiragana for Japanese, pinyin for Chinese, romanised hangul for Korean) — never empty",
  "romaji": "romanised pronunciation — never empty",
  "tip": "one short pronunciation or usage tip for English speakers"
}`
        }]
      })

      const raw = message.content[0].type === 'text' ? message.content[0].text : ''
      const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())

      const { data, error } = await supabase
        .from('vocabulary')
        .insert({
          user_id: userId,
          language,
          english: english.trim(),
          native: parsed.native || '',
          reading: parsed.reading || '',
          romaji: parsed.romaji || '',
          tip: parsed.tip || '',
        })
        .select()
        .single()

      return NextResponse.json({ data, error: error?.message })
    }

    // Delete a word
    if (action === 'delete') {
      if (!wordId || !userId) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
      }
      const { error } = await supabase
        .from('vocabulary')
        .delete()
        .eq('id', wordId)
        .eq('user_id', userId)
      return NextResponse.json({ success: !error, error: error?.message })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Vocabulary route error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
