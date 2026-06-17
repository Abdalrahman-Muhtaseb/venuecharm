import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isGoogleCalendarConfigured } from '@/lib/google-calendar'
import { HostCalendarClient } from '@/components/booking/HostCalendarClient'
import { HostCalendarConnectCard } from '@/components/booking/HostCalendarConnectCard'
import { defaultLocale, isLocale, localeCookieName, type Locale } from '@/lib/i18n'

export default async function HostCalendarPage({
  searchParams,
}: {
  searchParams: { venueId?: string }
}) {
  const locale: Locale = isLocale(cookies().get(localeCookieName)?.value)
    ? (cookies().get(localeCookieName)!.value as Locale)
    : defaultLocale

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: venues } = await supabase
    .from('venues')
    .select('id, title')
    .eq('host_id', user.id)
    .order('created_at', { ascending: false })

  const allVenues = (venues ?? []) as { id: string; title: string }[]
  const selectedVenueId = searchParams.venueId ?? allVenues[0]?.id

  const calendarConfigured = isGoogleCalendarConfigured()
  const { data: calendarConn } = await createAdminClient()
    .from('host_calendar_connections')
    .select('host_id')
    .eq('host_id', user.id)
    .maybeSingle()
  const calendarConnected = Boolean(calendarConn)

  if (!selectedVenueId) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-muted-foreground">
        <p>{locale === 'he' ? 'אין נכסים עדיין. צור נכס כדי לנהל זמינות.' : 'No listings yet. Create a listing to manage availability.'}</p>
      </div>
    )
  }

  const [blockedRes, bookingsRes] = await Promise.all([
    supabase
      .from('availability')
      .select('date, is_available')
      .eq('venue_id', selectedVenueId),
    supabase
      .from('bookings')
      .select('start_at, end_at, status')
      .eq('venue_id', selectedVenueId)
      .in('status', ['PENDING', 'CONFIRMED']),
  ])

  const blockedDates = (blockedRes.data ?? [])
    .filter((r) => !r.is_available)
    .map((r) => r.date as string)

  const bookingRanges = (bookingsRes.data ?? []).map((b) => ({
    start: (b.start_at as string).split('T')[0],
    end:   (b.end_at   as string).split('T')[0],
    status: b.status as string,
  }))

  return (
    <div>
      <div className="mb-6">
        <p className="text-sm font-medium uppercase tracking-widest text-primary">
          {locale === 'he' ? 'ניהול זמינות' : 'Manage availability'}
        </p>
        <h1 className="mt-1 text-3xl font-bold">
          {locale === 'he' ? 'יומן זמינות' : 'Availability calendar'}
        </h1>
      </div>

      <div className="mb-6">
        <HostCalendarConnectCard
          locale={locale}
          configured={calendarConfigured}
          connected={calendarConnected}
        />
      </div>

      <HostCalendarClient
        venues={allVenues}
        selectedVenueId={selectedVenueId}
        blockedDates={blockedDates}
        bookingRanges={bookingRanges}
        locale={locale}
      />
    </div>
  )
}
