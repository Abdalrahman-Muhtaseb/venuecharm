import { notFound, redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { VenueEditWizard } from '@/components/venue/venue-edit-wizard'
import { defaultLocale, isLocale, localeCookieName, type Locale } from '@/lib/i18n'

export default async function EditListingPage({ params }: { params: { id: string } }) {
  const locale: Locale = isLocale(cookies().get(localeCookieName)?.value)
    ? (cookies().get(localeCookieName)!.value as Locale)
    : defaultLocale

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: venue } = await supabase
    .from('venues')
    .select('id, title, description, address, city, capacity, price_per_hour, price_per_day, photos, amenities, event_types, host_id, cancellation_policy, rules, opening_time, closing_time, buffer_minutes, default_available_days')
    .eq('id', params.id)
    .single()

  if (!venue || venue.host_id !== user.id) notFound()

  // Fetch stored lat/lng so the map can drop the pin on the existing location.
  // The RPC returns a table row so Supabase JS wraps it as an array.
  const { data: coordRows } = await supabase.rpc('get_venue_coordinates', { p_venue_id: params.id })
  const coordRow = Array.isArray(coordRows) ? coordRows[0] : coordRows

  const hasPublicGoogleMapsKey = Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)

  return (
    <VenueEditWizard
      hasPublicGoogleMapsKey={hasPublicGoogleMapsKey}
      locale={locale}
      initialLat={coordRow?.lat ?? null}
      initialLng={coordRow?.lng ?? null}
      venue={{
        ...venue,
        photos:               venue.photos               ?? [],
        amenities:            (venue.amenities            as string[]) ?? [],
        event_types:          (venue.event_types          as string[]) ?? [],
        default_available_days: (venue.default_available_days as number[]) ?? null,
      }}
    />
  )
}
