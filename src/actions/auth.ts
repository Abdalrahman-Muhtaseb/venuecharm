'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { isSafeRedirectPath } from '@/lib/utils'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

/** Localized error codes the client maps to dictionary strings (t.auth.errXxx). */
export type AuthErrorCode =
  | 'first_name'
  | 'last_name'
  | 'invalid_email'
  | 'weak_password'
  | 'passwords_mismatch'
  | 'email_exists'
  | 'google_account'
  | 'captcha'
  | 'rate_limit'
  | 'email_send'
  | 'generic'

export type SignUpResult =
  | { ok: true; redirectTo: string }
  | { needsVerification: true; email: string }
  | { error: AuthErrorCode; message?: string }

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

/**
 * Which sign-in method an email is registered with. Used to give a friendly
 * message when someone who signed up with Google tries the email/password form
 * (and vice-versa). Best-effort; never throws.
 */
export async function getAuthMethod(email: string): Promise<'google' | 'email' | 'none'> {
  if (!email) return 'none'
  try {
    const admin = createAdminClient()
    const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    const user = data?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase())
    if (!user) return 'none'
    const providers = [
      ...((user.app_metadata?.providers as string[] | undefined) ?? []),
      ...(user.identities?.map((i) => i.provider) ?? []),
    ]
    // A linked email/password login always takes precedence (password works).
    if (providers.includes('email')) return 'email'
    if (providers.includes('google')) return 'google'
    return 'none'
  } catch {
    return 'none'
  }
}

export async function signUp(formData: FormData): Promise<SignUpResult> {
  const firstName = String(formData.get('firstName') ?? '').trim()
  const lastName = String(formData.get('lastName') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const confirm = String(formData.get('confirmPassword') ?? '')
  const captchaToken = String(formData.get('captchaToken') ?? '')

  if (!firstName) return { error: 'first_name' }
  if (!lastName) return { error: 'last_name' }
  if (!EMAIL_RE.test(email)) return { error: 'invalid_email' }
  if (password.length < 8) return { error: 'weak_password' }
  if (password !== confirm) return { error: 'passwords_mismatch' }

  const supabase = createClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { first_name: firstName, last_name: lastName },
      emailRedirectTo: `${appUrl}/api/auth/callback`,
      ...(captchaToken ? { captchaToken } : {}),
    },
  })

  if (error) {
    const msg = error.message.toLowerCase()
    const status = (error as { status?: number }).status
    if (msg.includes('already registered') || msg.includes('already been registered')) {
      return { error: (await getAuthMethod(email)) === 'google' ? 'google_account' : 'email_exists' }
    }
    // "Email rate limit exceeded" / 429 — Supabase's built-in mailer is throttled.
    if (status === 429 || msg.includes('rate limit')) return { error: 'rate_limit' }
    // "Error sending confirmation email" — the mailer failed, NOT a bad address.
    if (msg.includes('sending') || msg.includes('confirmation email') || msg.includes('smtp')) {
      return { error: 'email_send' }
    }
    if (msg.includes('captcha')) return { error: 'captcha' }
    if (msg.includes('weak') || msg.includes('at least') || msg.includes('password')) {
      return { error: 'weak_password' }
    }
    // Only a genuine format/validation error should claim the email is invalid.
    if (msg.includes('invalid') && msg.includes('email')) return { error: 'invalid_email' }
    // Anything else: surface the real message so the cause is visible.
    return { error: 'generic', message: error.message }
  }

  // Supabase obfuscates existing emails: a user with an empty `identities` array
  // and no error means the address is already taken.
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    return { error: (await getAuthMethod(email)) === 'google' ? 'google_account' : 'email_exists' }
  }
  if (!data.user) return { error: 'generic' }

  // Create the public profile row up front (RENTER). Survives the email-confirm
  // round-trip so the name is already there when they verify.
  const admin = createAdminClient()
  await admin
    .from('users')
    .upsert(
      { id: data.user.id, email, first_name: firstName, last_name: lastName, role: 'RENTER' },
      { onConflict: 'id' },
    )

  // Session present → email confirmation is disabled, user is signed in.
  if (data.session) return { ok: true, redirectTo: '/onboarding' }
  return { needsVerification: true, email }
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

export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect('/')
}

export async function becomeHost() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'RENTER') {
    const admin = createAdminClient()
    await admin.from('users').update({ role: 'HOST' }).eq('id', user.id)
  }

  // New hosts complete their host requirements (Stripe, etc.) before listing.
  redirect('/host/onboarding')
}
