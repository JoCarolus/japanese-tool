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
        const uid = data.id
        const { data: authUser } = await supabase.auth.admin.getUserById(uid)
        const email = authUser?.user?.email || ''

        // Generate magic link and exchange token for real session
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://japanese-tool-liard.vercel.app'
        const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
          type: 'magiclink',
          email,
          options: { redirectTo: appUrl }
        })

        if (!linkError && linkData?.properties?.hashed_token) {
          const { data: sessionData, error: sessionError } = await supabase.auth.verifyOtp({
            token_hash: linkData.properties.hashed_token,
            type: 'magiclink',
          })

          if (!sessionError && sessionData?.session) {
            return NextResponse.json({
              success: true,
              userId: uid,
              email,
              accessToken: sessionData.session.access_token,
              refreshToken: sessionData.session.refresh_token,
            })
          }
        }

        // Fallback to localStorage approach
        return NextResponse.json({ success: true, userId: uid, email })
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
