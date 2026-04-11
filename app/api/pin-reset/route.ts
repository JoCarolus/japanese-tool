import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function hashPin(pin: string): string {
  let hash = 0
  const str = pin + 'trilingo_pin_salt_2024'
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}

export async function POST(req: NextRequest) {
  try {
    const { action, userId, pin, email } = await req.json()

    if (action === 'request') {
      if (!email) return NextResponse.json({ success: false, error: 'Email required' })
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://japanese-tool-liard.vercel.app'
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${appUrl}/pin-reset` }
      })
      return NextResponse.json({ success: !error })
    }

    if (action === 'set') {
      if (!pin || !userId) return NextResponse.json({ success: false })
      const hashed = hashPin(pin)
      const { error } = await supabase
        .from('language_profiles')
        .upsert({ id: userId, pin_hash: hashed }, { onConflict: 'id' })
      return NextResponse.json({ success: !error })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('PIN reset route error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
