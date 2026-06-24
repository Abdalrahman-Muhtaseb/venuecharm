import { notFound, redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { VenueEditForm } from '@/components/venue/venue-edit-form'
import { HostAvailabilityEditor } from '@/components/venue/HostAvailabilityEditor'
import { defaultLocale, isLocale, localeCookieName, type Locale } from '@/lib/i18n'

function rangeToISOs(start: string, end: string): string[] {
  const dates: string[] = []
  const cursor = new Date(start.slice(0, 10))
  const last   = new Date(end.slice(0, 10))
  while (cursor <= last) {
    dates.push(cursor.toLocaleDateString('sv-SE'))
    cursor.setDate(cursor.getDate() + 1)
  }
  return dates
}

export default async function EditListingPage({ params }: { params: { id: string } }) {
  const locale: Locale = isLocale(cookies().get(localeCookieName)?.value)
    ? (cookies().get(localeCookieName)!.value as Locale)
    : defaultLocale

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: venue } = await supabase
    .from('venues')
    .select('id, title, description, address, city, capacity, price_per_hour, price_per_day, photos, amenities, event_types, host_id, cancellation_policy')
    .eq('id', params.id)
    .single()

  if (!venue || venue.host_id !== user.id) notFound()

  const today = new Date().toISOString().slice(0, 10)

  const [{ data: availRows }, { data: bookingRows }] = await Promise.all([
    supabase
      .from('availability')
      .select('date')
      .eq('venue_id', params.id)
      .eq('is_available', false)
      .gte('date', today),
    supabase
      .from('bookings')
      .select('start_at, end_at')
      .eq('venue_id', params.id)
      .in('status', ['PENDING', 'CONFIRMED'])
      .gte('end_at', new Date().toISOString()),
  ])

  const blockedDates = (availRows ?? []).map((r) => r.date as string)
  const bookedDates  = (bookingRows ?? []).flatMap((b) => rangeToISOs(b.start_at, b.end_at))

  const hasPublicGoogleMapsKey = Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/listings"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {locale === 'he' ? 'חזרה לנכסים' : 'Back to listings'}
        </Link>
      </div>

      <div className="mb-2">
        <p className="text-sm font-medium uppercase tracking-widest text-primary">
          {locale === 'he' ? 'עריכת נכס' : 'Edit listing'}
        </p>
        <h1 className="mt-1 text-3xl font-bold">{venue.title}</h1>
      </div>

      <VenueEditForm
        hasPublicGoogleMapsKey={hasPublicGoogleMapsKey}
        locale={locale}
        venue={{
          ...venue,
          photos: venue.photos ?? [],
          amenities: (venue.amenities as string[]) ?? [],
          event_types: (venue.event_types as string[]) ?? [],
        }}
      />

      <div className="mt-10">
        <HostAvailabilityEditor
          venueId={params.id}
          initialBlocked={blockedDates}
          bookedDates={bookedDates}
          locale={locale}
        />
      </div>
    </div>
  )
}
