import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { exchangeCodeForRefreshToken, isGoogleCalendarConfigured } from '@/lib/google-calendar'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export async function GET(request: NextRequest) {
  const done = (status: string) =>
    NextResponse.redirect(new URL(`/host/calendar?calendar=${status}`, APP_URL))

  if (!isGoogleCalendarConfigured()) return done('error')

  const code = request.nextUrl.searchParams.get('code')
  const state = request.nextUrl.searchParams.get('state')
  if (!code) return done('error')

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  // The connecting host must be signed in and match the state we issued.
  if (!user || (state && state !== user.id)) return done('error')

  try {
    const refreshToken = await exchangeCodeForRefreshToken(code)
    if (!refreshToken) return done('noToken')

    await createAdminClient()
      .from('host_calendar_connections')
      .upsert(
        {
          host_id: user.id,
          provider: 'google',
          refresh_token: refreshToken,
          calendar_id: 'primary',
          sync_enabled: true,
        },
        { onConflict: 'host_id' },
      )

    return done('connected')
  } catch {
    return done('error')
  }
}
