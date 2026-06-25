'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const ONBOARDED_COOKIE = 'venuecharm-onboarded'

function markOnboardedCookie() {
  cookies().set(ONBOARDED_COOKIE, '1', {
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
  })
}

/** Save the "About me" details, mark onboarding done, and continue to the app. */
export async function completeOnboarding(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const firstName = String(formData.get('first_name') ?? '').trim()
  const lastName = String(formData.get('last_name') ?? '').trim()
  const phone = String(formData.get('phone_number') ?? '').trim()

  if (!firstName || !lastName) {
    throw new Error('First and last name are required.')
  }

  const { error } = await supabase
    .from('users')
    .update({
      first_name: firstName,
      last_name: lastName,
      phone_number: phone || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) throw new Error(error.message)

  markOnboardedCookie()
  redirect('/')
}

/** Skip onboarding — remember the choice so we don't nag on the next login. */
export async function skipOnboarding() {
  markOnboardedCookie()
  redirect('/')
}
