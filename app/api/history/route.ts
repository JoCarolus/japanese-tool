import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, userId, language, translation } = body

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    if (action === 'fetch') {
      const { data, error } = await supabase
        .from('translations')
        .select('*')
        .eq('user_id', userId)
        .eq('language', language)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        console.error('History fetch error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ data })
    }

    if (action === 'save') {
      // Prepare the translation data with all fields
      const translationData = {
        user_id: userId,
        language: language,
        input_text: translation.input_text || translation.english || '',
        direction: translation.direction || 'en-to-lang',
        english: translation.english || '',
        japanese_kanji: translation.japanese_kanji || '',
        japanese_kana: translation.japanese_kana || '',
        japanese_romaji: translation.japanese_romaji || '',
        korean: translation.korean || null,
        chinese: translation.chinese || null,
        syllable_breakdown: translation.syllable_breakdown || '',
        pitch_accent: translation.pitch_accent || '',
        pronunciation_tips: translation.pronunciation_tips || '',
        breakdown: translation.breakdown || [],
        structure: translation.structure || '',
        tips: translation.tips || '',
        created_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('translations')
        .insert(translationData)

      if (error) {
        console.error('History save error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    if (action === 'clear') {
      const { error } = await supabase
        .from('translations')
        .delete()
        .eq('user_id', userId)
        .eq('language', language)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    console.error('History API error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}