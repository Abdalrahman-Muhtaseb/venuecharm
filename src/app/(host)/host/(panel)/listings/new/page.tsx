import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { VenueCreationWizard } from '@/components/venue/venue-creation-wizard'
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
    <VenueCreationWizard hasPublicGoogleMapsKey={hasPublicGoogleMapsKey} locale={locale} />
  )
}
