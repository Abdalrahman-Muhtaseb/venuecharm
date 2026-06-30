import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isGoogleCalendarConfigured } from '@/lib/google-calendar'
import { HostAvailabilityManager } from '@/components/booking/HostAvailabilityManager'
import { HostCalendarConnectCard } from '@/components/booking/HostCalendarConnectCard'
import { ymd, timeToMin, type SlotBooking } from '@/lib/availability-slots'
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
    .select('id, title, opening_time, closing_time')
    .eq('host_id', user.id)
    .order('created_at', { ascending: false })

  const allVenues = (venues ?? []) as {
    id: string
    title: string
    opening_time: string | null
    closing_time: string | null
  }[]
  const selectedVenueId = searchParams.venueId ?? allVenues[0]?.id
  const selectedVenue = allVenues.find((v) => v.id === selectedVenueId)
  const opening = selectedVenue?.opening_time?.slice(0, 5) ?? '08:00'
  const closing = selectedVenue?.closing_time?.slice(0, 5) ?? '23:00'

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

  const todayKey = new Date().toISOString().slice(0, 10)
  const [blockedRes, bookingsRes, slotBlocksRes] = await Promise.all([
    supabase
      .from('availability')
      .select('date, is_available')
      .eq('venue_id', selectedVenueId),
    supabase
      .from('bookings')
      .select('start_at, end_at, status')
      .eq('venue_id', selectedVenueId)
      .in('status', ['PENDING', 'CONFIRMED']),
    supabase
      .from('availability_blocks')
      .select('date, start_time')
      .eq('venue_id', selectedVenueId)
      .gte('date', todayKey),
  ])

  const blockedDates = (blockedRes.data ?? [])
    .filter((r) => !r.is_available)
    .map((r) => r.date as string)

  // Month view: booking day-ranges. Week view: minute-precise slots.
  const bookingRanges = (bookingsRes.data ?? []).map((b) => ({
    start: (b.start_at as string).split('T')[0],
    end:   (b.end_at   as string).split('T')[0],
    status: b.status as string,
  }))
  const weekBookings: SlotBooking[] = (bookingsRes.data ?? []).map((b) => {
    const s = new Date(b.start_at as string)
    const e = new Date(b.end_at as string)
    const sameDay = s.toDateString() === e.toDateString()
    return {
      date: ymd(s),
      startMin: s.getHours() * 60 + s.getMinutes(),
      endMin: sameDay ? e.getHours() * 60 + e.getMinutes() : 1440,
    }
  })
  const slotBlocks = (slotBlocksRes.data ?? []).map((r) => ({
    date: r.date as string,
    startMin: timeToMin(r.start_time as string),
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

      <HostAvailabilityManager
        venues={allVenues.map((v) => ({ id: v.id, title: v.title }))}
        selectedVenueId={selectedVenueId}
        blockedDates={blockedDates}
        bookingRanges={bookingRanges}
        bookings={weekBookings}
        blocks={slotBlocks}
        opening={opening}
        closing={closing}
        locale={locale}
      />
    </div>
  )
}
