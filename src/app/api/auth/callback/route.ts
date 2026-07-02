import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import { isSafeRedirectPath } from '@/lib/utils'
import { normalizeILPhone } from '@/lib/phone'

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
    const metaRole = user.user_metadata?.role as string | undefined
    const role =
      pendingRole === 'HOST' ? 'HOST' : metaRole === 'ADMIN' ? 'ADMIN' : 'RENTER'

    const admin = createAdminClient()
    const meta = user.user_metadata ?? {}
    // Google rarely returns a phone, but if a provider supplies one, keep it only
    // when it's a valid IL number; otherwise leave null so onboarding prompts.
    const rawPhone = (meta.phone_number as string) ?? (meta.phone as string) ?? null
    const phone = rawPhone ? normalizeILPhone(rawPhone) : null
    // Google gives `name`/`full_name` (sometimes given_name/family_name). Split the
    // full name so we keep the last name too — not just the first word.
    const fullName = (((meta.full_name as string) ?? (meta.name as string)) ?? '').trim()
    const nameParts = fullName ? fullName.split(/\s+/) : []
    const firstName =
      (meta.given_name as string) ?? (meta.first_name as string) ?? nameParts[0] ?? null
    const lastName =
      (meta.family_name as string) ??
      (meta.last_name as string) ??
      (nameParts.length > 1 ? nameParts.slice(1).join(' ') : null)
    await admin.from('users').upsert(
      {
        id: user.id,
        email: user.email,
        role,
        first_name: firstName,
        last_name: lastName,
        avatar_url: (meta.avatar_url as string) ?? (meta.picture as string) ?? null,
        phone_number: phone,
      },
      { onConflict: 'id', ignoreDuplicates: true },
    )

    response.cookies.delete('venuecharm-pending-role')

    // Invite-link acceptance: skip onboarding and go straight to the admin panel.
    if (otpType === 'invite') {
      response.headers.set('location', new URL('/admin', request.url).toString())
      return response
    }

    const pendingRedirect = request.cookies.get('venuecharm-post-login-redirect')?.value
    response.cookies.delete('venuecharm-post-login-redirect')

    if (isSafeRedirectPath(pendingRedirect)) {
      response.headers.set('location', new URL(pendingRedirect, request.url).toString())
    } else if (!request.cookies.get('venuecharm-onboarded')?.value) {
      // First-time / profile-incomplete users complete "About me" before the app.
      // Trigger whenever a required name field is missing (Google often gives only
      // a first name), not just when first_name is absent.
      const { data: profile } = await admin
        .from('users')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single()
      if (!profile?.first_name || !profile?.last_name) {
        response.headers.set('location', new URL('/onboarding', request.url).toString())
      }
    }
  }

  return response
}
