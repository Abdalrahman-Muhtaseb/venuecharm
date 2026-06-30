import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { VenueCreationForm } from '@/components/venue/venue-creation-form'
import { defaultLocale, getDictionary, isLocale, localeCookieName, type Locale } from '@/lib/i18n'

export default async function NewListingPage() {
  const locale: Locale = isLocale(cookies().get(localeCookieName)?.value)
    ? (cookies().get(localeCookieName)!.value as Locale)
    : defaultLocale
  const t = getDictionary(locale)
  const hasPublicGoogleMapsKey = Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('stripe_charges_enabled')
    .eq('id', user.id)
    .single()

  if (!profile?.stripe_charges_enabled) {
    redirect('/host/payouts')
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <p className="text-sm font-medium uppercase tracking-widest text-primary">
          {locale === 'he' ? 'נכסים' : 'Listings'}
        </p>
        <h1 className="mt-1 text-3xl font-bold">{t.dashboard.createVenue}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.venueForm.coordinateHint}</p>
      </div>

      <VenueCreationForm hasPublicGoogleMapsKey={hasPublicGoogleMapsKey} locale={locale} />
    </div>
  )
}
