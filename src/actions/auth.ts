'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { isSafeRedirectPath } from '@/lib/utils'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function signUp(formData: FormData) {
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')
  const role = String(formData.get('role') ?? 'RENTER') as 'RENTER' | 'HOST'

  const supabase = createClient()
  const { data, error } = await supabase.auth.signUp({ email, password })

  if (error) {
    throw new Error(error.message)
  }

  if (!data.user) {
    throw new Error('User was not created.')
  }

  const admin = createAdminClient()

  await admin.from('users').upsert({
    id: data.user.id,
    email,
    role,
  })

  redirect('/verify-email')
}

export async function signIn(formData: FormData) {
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')
  const redirectTo = String(formData.get('redirectTo') ?? '')

  const supabase = createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    throw new Error(error.message)
  }

  redirect(isSafeRedirectPath(redirectTo) ? redirectTo : '/')
}

export async function signInWithGoogle(redirectTo?: string) {
  if (isSafeRedirectPath(redirectTo)) {
    cookies().set('venuecharm-post-login-redirect', redirectTo, {
      maxAge: 300,
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
    })
  }

  const supabase = createClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${appUrl}/api/auth/callback`,
    },
  })

  if (error) {
    throw new Error(error.message)
  }

  if (data.url) {
    redirect(data.url)
  }

  redirect('/login')
}

export async function signUpWithGoogle(role: 'RENTER' | 'HOST') {
  const cookieStore = cookies()
  cookieStore.set('venuecharm-pending-role', role, {
    maxAge: 300,
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
  })

  const supabase = createClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${appUrl}/api/auth/callback`,
    },
  })

  if (error) throw new Error(error.message)
  if (data.url) redirect(data.url)
  redirect('/login')
}

export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect('/')
}

export async function becomeHost() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/register')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'RENTER') {
    const admin = createAdminClient()
    await admin.from('users').update({ role: 'HOST' }).eq('id', user.id)
  }

  redirect('/listings/new')
}
