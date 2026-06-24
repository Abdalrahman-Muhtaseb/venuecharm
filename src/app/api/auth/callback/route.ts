import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isSafeRedirectPath } from '@/lib/utils'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')

  const response = NextResponse.redirect(new URL('/', request.url))

  if (!code) {
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

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const pendingRole = request.cookies.get('venuecharm-pending-role')?.value
    const role = pendingRole === 'HOST' ? 'HOST' : 'RENTER'

    const admin = createAdminClient()
    await admin.from('users').upsert(
      {
        id: user.id,
        email: user.email,
        role,
        avatar_url: (user.user_metadata?.avatar_url as string) ?? null,
      },
      { onConflict: 'id', ignoreDuplicates: true },
    )

    response.cookies.delete('venuecharm-pending-role')

    const pendingRedirect = request.cookies.get('venuecharm-post-login-redirect')?.value
    if (isSafeRedirectPath(pendingRedirect)) {
      response.headers.set('location', new URL(pendingRedirect, request.url).toString())
    }
    response.cookies.delete('venuecharm-post-login-redirect')
  }

  return response
}
