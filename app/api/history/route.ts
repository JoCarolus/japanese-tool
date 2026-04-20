import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Uses service role key so PIN users (no session) can still fetch their history
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { userId, language } = await req.json()
    if (!userId) return NextResponse.json({ data: [] })

    const query = supabase
      .from('translations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (language) query.eq('language', language)

    const { data, error } = await query
    if (error) {
      console.error('History fetch error:', error)
      return NextResponse.json({ data: [] })
    }

    return NextResponse.json({ data: data || [] })
  } catch (error) {
    console.error('History route error:', error)
    return NextResponse.json({ data: [] })
  }
}
