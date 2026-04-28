import Link from 'next/link'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { defaultLocale, getDictionary, isLocale, localeCookieName, Locale } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/server'
import ProfileForm from '@/components/profile/profile-form'

export default async function ProfilePage() {
  const persistedLocale = cookies().get(localeCookieName)?.value
  const locale: Locale = isLocale(persistedLocale) ? persistedLocale : defaultLocale
  const t = getDictionary(locale)

  const supabase = createClient()

  // Get authenticated user
  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user

  if (!user) {
    redirect('/login')
  }

  // Get user profile from database
  const { data: profile, error } = await supabase
    .from('users')
    .select('id, email, first_name, last_name, phone_number, avatar_url, role, is_verified, created_at')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    redirect('/login')
  }

  return (
    <main className="min-h-screen px-6 py-10 text-slate-900">
      <section className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm md:p-10">
        {/* Header with Back Button */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-violet-600">Account</p>
            <h1 className="mt-2 text-3xl font-bold">{t.profile.title}</h1>
          </div>
          <Link
            href="/dashboard"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {t.profile.backToDashboard}
          </Link>
        </div>

        {/* Profile Form Component */}
        <ProfileForm locale={locale} user={profile} />
      </section>
    </main>
  )
}
