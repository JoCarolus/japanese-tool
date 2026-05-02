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
    const { action, pin, userId } = await req.json()

    if (action === 'check') {
      const { data } = await supabase
        .from('language_profiles')
        .select('id')
        .not('pin_hash', 'is', null)
        .limit(1)
      return NextResponse.json({ hasPins: (data?.length ?? 0) > 0 })
    }

    if (action === 'verify') {
      if (!pin) return NextResponse.json({ success: false })
      const hashed = hashPin(pin)
      const { data } = await supabase
        .from('language_profiles')
        .select('id')
        .eq('pin_hash', hashed)
        .maybeSingle()

      if (data) {
        // Get email from auth.users
        const { data: authUser } = await supabase.auth.admin.getUserById(data.id)
        const email = authUser?.user?.email || ''

        // Create a real Supabase session so PIN users stay logged in
        // This generates a proper access/refresh token pair
        const { data: linkData } = await supabase.auth.admin.generateLink({
          type: 'magiclink',
          email,
        })

        // Use generateLink's token to exchange for a real session
        // We return the user details and let client handle session via signInWithOtp flow
        // Instead use createSession which directly gives tokens
        const { data: sessionData, error: sessionError } = await supabase.auth.admin.createSession({
          userId: data.id,
          // Session options - long lived
        } as any)

        if (!sessionError && sessionData?.session) {
          return NextResponse.json({
            success: true,
            userId: data.id,
            email,
            accessToken: sessionData.session.access_token,
            refreshToken: sessionData.session.refresh_token,
          })
        }

        // Fallback if session creation fails - return userId for localStorage fallback
        return NextResponse.json({ success: true, userId: data.id, email })
      }
      return NextResponse.json({ success: false })
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
    console.error('PIN route error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
