import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { ArrowLeft, Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isGoogleCalendarConfigured } from '@/lib/google-calendar'
import { HostAvailabilityManager } from '@/components/booking/HostAvailabilityManager'
import { CalendarSyncDialog } from '@/components/booking/CalendarSyncDialog'
import { VenueSearchBar } from '@/components/booking/VenueSearchBar'
import { VenuePagination } from '@/components/search/VenuePagination'
import { Badge } from '@/components/ui/badge'
import { ymd, timeToMin, type SlotBooking } from '@/lib/availability-slots'
import { sanitizeSearchTerm } from '@/lib/host-listing-filters'
import { defaultLocale, isLocale, localeCookieName, type Locale } from '@/lib/i18n'

const PAGE_SIZE = 12

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  ACTIVE: 'default',
  PENDING_APPROVAL: 'secondary',
  DRAFT: 'outline',
  SUSPENDED: 'destructive',
}

export default async function HostCalendarPage({
  searchParams,
}: {
  searchParams: { venueId?: string; q?: string; page?: string }
}) {
  const locale: Locale = isLocale(cookies().get(localeCookieName)?.value)
    ? (cookies().get(localeCookieName)!.value as Locale)
    : defaultLocale
  const isHe = locale === 'he'

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Calendar connection status — needed on both picker and editor pages.
  const calendarConfigured = isGoogleCalendarConfigured()
  const { data: calendarConn } = await createAdminClient()
    .from('host_calendar_connections')
    .select('host_id')
    .eq('host_id', user.id)
    .maybeSingle()
  const calendarConnected = Boolean(calendarConn)

  const selectedVenueId = searchParams.venueId

  // ── CALENDAR EDITOR ───────────────────────────────────────────
  if (selectedVenueId) {
    const { data: venueRow } = await supabase
      .from('venues')
      .select('id, title, opening_time, closing_time')
      .eq('id', selectedVenueId)
      .eq('host_id', user.id)
      .maybeSingle()

    if (!venueRow) redirect('/host/calendar')

    const opening = venueRow.opening_time?.slice(0, 5) ?? '08:00'
    const closing = venueRow.closing_time?.slice(0, 5) ?? '23:00'
    const todayKey = new Date().toISOString().slice(0, 10)

    const [blockedRes, bookingsRes, slotBlocksRes] = await Promise.all([
      supabase.from('availability').select('date, is_available').eq('venue_id', selectedVenueId),
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

    const blockedDates = (blockedRes.data ?? []).filter((r) => !r.is_available).map((r) => r.date as string)
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

    const headerSlot = (
      <div className="flex items-center gap-3 min-w-0">
        <Link
          href="/host/calendar"
          className="flex shrink-0 items-center gap-1 rounded-sm text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {isHe ? 'חזרה' : 'Back'}
        </Link>
        <span className="text-muted-foreground" aria-hidden="true">/</span>
        <p className="truncate font-semibold">{venueRow.title}</p>
      </div>
    )

    return (
      <HostAvailabilityManager
        venues={[{ id: venueRow.id, title: venueRow.title }]}
        selectedVenueId={selectedVenueId}
        blockedDates={blockedDates}
        bookingRanges={bookingRanges}
        bookings={weekBookings}
        blocks={slotBlocks}
        opening={opening}
        closing={closing}
        locale={locale}
        headerSlot={headerSlot}
        calendarConfigured={calendarConfigured}
        calendarConnected={calendarConnected}
      />
    )
  }

  // ── VENUE PICKER ──────────────────────────────────────────────
  const q = searchParams.q ?? ''
  const term = sanitizeSearchTerm(q)
  const currentPage = Math.max(1, Number(searchParams.page) || 1)
  const offset = (currentPage - 1) * PAGE_SIZE

  type VenueRow = { id: string; title: string; city: string; status: string; photos: string[] | null }

  const applyTermFilter = (base: any) =>
    term ? base.or(`title.ilike.%${term}%,city.ilike.%${term}%`) : base

  const [{ count: totalCount }, { data: venues }] = await Promise.all([
    applyTermFilter(
      supabase.from('venues').select('id', { count: 'exact', head: true }).eq('host_id', user.id)
    ),
    applyTermFilter(
      supabase.from('venues').select('id, title, city, status, photos').eq('host_id', user.id).order('created_at', { ascending: false })
    ).range(offset, offset + PAGE_SIZE - 1),
  ])

  const rows = (venues ?? []) as VenueRow[]
  const totalPages = Math.max(1, Math.ceil((totalCount ?? 0) / PAGE_SIZE))

  // No venues at all
  if ((totalCount ?? 0) === 0 && !term) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-muted-foreground">
        <Building2 className="h-10 w-10 opacity-40" />
        <p>{isHe ? 'אין נכסים עדיין. צור נכס כדי לנהל זמינות.' : 'No listings yet. Create a listing to manage availability.'}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page header — title, search, and google calendar all on one row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold">
            {isHe ? 'בחר נכס לניהול זמינות' : 'Manage availability'}
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {isHe ? 'לחץ על נכס כדי לפתוח את יומן הזמינות שלו' : 'Select a listing to open its availability calendar'}
          </p>
        </div>
        <VenueSearchBar locale={locale} initialQ={q} />
        <CalendarSyncDialog
          locale={locale}
          configured={calendarConfigured}
          connected={calendarConnected}
        />
      </div>

      {/* Venue grid */}
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed py-16 text-center text-muted-foreground">
          {isHe ? `אין תוצאות עבור "${q}"` : `No listings match "${q}"`}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rows.map((v) => (
            <Link
              key={v.id}
              href={`?venueId=${v.id}`}
              className="group flex flex-col overflow-hidden rounded-xl border bg-background transition-all hover:shadow-md hover:border-primary/30"
            >
              <div className="relative h-28 w-full bg-muted">
                {v.photos?.[0] ? (
                  <Image
                    src={v.photos[0]}
                    alt={v.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Building2 className="h-7 w-7 text-muted-foreground/40" aria-hidden="true" />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1 p-3">
                <p className="truncate font-medium">{v.title}</p>
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm text-muted-foreground">{v.city}</p>
                  <Badge variant={statusVariant[v.status] ?? 'outline'} className="shrink-0 text-xs">
                    {v.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <VenuePagination currentPage={currentPage} totalPages={totalPages} locale={locale} />
    </div>
  )
}
