import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { defaultLocale, getDictionary, isLocale, localeCookieName, type Locale } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/server'
import { PublicNavbar } from '@/components/layout/PublicNavbar'
import { Footer } from '@/components/layout/Footer'
import ProfileForm from '@/components/profile/profile-form'

export default async function ProfilePage() {
  const locale: Locale = isLocale(cookies().get(localeCookieName)?.value)
    ? (cookies().get(localeCookieName)!.value as Locale)
    : defaultLocale
  const t = getDictionary(locale)
  const supabase = createClient()

  const { data: authData } = await supabase.auth.getUser()
  if (!authData.user) redirect('/login')

  const { data: profile, error } = await supabase
    .from('users')
    .select('id, email, first_name, last_name, phone_number, bio, birth_date, visibility, avatar_url, role, is_verified, created_at')
    .eq('id', authData.user.id)
    .single()

  if (error || !profile) redirect('/login')

  // Whether this is an email/password account (an `email` identity exists) vs. a
  // social-only one. Google accounts manage their password with Google, so the
  // profile shows an informational note instead of a reset control.
  const providers =
    authData.user.identities?.map((i) => i.provider) ??
    (authData.user.app_metadata?.providers as string[] | undefined) ??
    []
  const isEmailAccount = providers.includes('email')

  return (
    <div className="flex min-h-screen flex-col">
      <PublicNavbar locale={locale} />
      <main className="flex-1 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <h1 className="mb-6 text-3xl font-bold">{t.profile.title}</h1>
          <ProfileForm locale={locale} isEmailAccount={isEmailAccount} user={profile} />
        </div>
      </main>
      <Footer locale={locale} />
    </div>
  )
}
