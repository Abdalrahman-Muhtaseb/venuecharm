import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import { isSafeRedirectPath } from '@/lib/utils'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  // OAuth + PKCE email links arrive as `?code=`; Supabase's built-in confirmation
  // email may instead arrive as `?token_hash=&type=signup`. Support both.
  const code = url.searchParams.get('code')
  const tokenHash = url.searchParams.get('token_hash')
  const otpType = url.searchParams.get('type') as EmailOtpType | null
  const linkError = url.searchParams.get('error_description') ?? url.searchParams.get('error')

  const response = NextResponse.redirect(new URL('/', request.url))

  // Expired / already-used confirmation link.
  if (linkError) {
    return NextResponse.redirect(new URL('/login?error=verification', request.url))
  }
  if (!code && !tokenHash) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: unknown }>) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2]),
          )
        },
      },
    },
  )

  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : await supabase.auth.verifyOtp({ type: otpType ?? 'email', token_hash: tokenHash! })

  if (error) {
    return NextResponse.redirect(new URL('/login?error=verification', request.url))
  }

  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const pendingRole = request.cookies.get('venuecharm-pending-role')?.value
    const role = pendingRole === 'HOST' ? 'HOST' : 'RENTER'

    const admin = createAdminClient()
    const meta = user.user_metadata ?? {}
    await admin.from('users').upsert(
      {
        id: user.id,
        email: user.email,
        role,
        first_name: (meta.first_name as string) ?? (meta.name as string)?.split(' ')[0] ?? null,
        last_name: (meta.last_name as string) ?? null,
        avatar_url: (meta.avatar_url as string) ?? null,
      },
      { onConflict: 'id', ignoreDuplicates: true },
    )

    response.cookies.delete('venuecharm-pending-role')

    const pendingRedirect = request.cookies.get('venuecharm-post-login-redirect')?.value
    response.cookies.delete('venuecharm-post-login-redirect')

    if (isSafeRedirectPath(pendingRedirect)) {
      response.headers.set('location', new URL(pendingRedirect, request.url).toString())
    } else if (!request.cookies.get('venuecharm-onboarded')?.value) {
      // First-time / profile-incomplete users complete "About me" before the app.
      const { data: profile } = await admin
        .from('users')
        .select('first_name')
        .eq('id', user.id)
        .single()
      if (!profile?.first_name) {
        response.headers.set('location', new URL('/onboarding', request.url).toString())
      }
    }
  }

  return response
}
