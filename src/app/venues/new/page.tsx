import { createVenue } from '@/actions/venues'
import { VenueCreationForm } from '@/components/venue/venue-creation-form'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { defaultLocale, getDictionary, isLocale, localeCookieName } from '@/lib/i18n'

export default async function NewVenuePage() {
  const persistedLocale = cookies().get(localeCookieName)?.value
  const locale = isLocale(persistedLocale) ? persistedLocale : defaultLocale
  const t = getDictionary(locale)
  const supabase = createClient()
  const hasPublicGoogleMapsKey = Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'HOST') {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl items-center px-6 py-12">
        <section className="w-full rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Host access required</h1>
          <p className="mt-3 text-slate-600">
            Only users with role <strong>HOST</strong> can create venue listings.
          </p>
        </section>
      </main>
    )
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-12">
      <section className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-sm md:p-10">
        <h1 className="text-3xl font-bold text-slate-900">{t.dashboard.createVenue}</h1>
        <p className="mt-2 text-sm text-slate-600">{t.venueForm.coordinateHint}</p>

        <VenueCreationForm hasPublicGoogleMapsKey={hasPublicGoogleMapsKey} locale={locale} />
      </section>
    </main>
  )
}
