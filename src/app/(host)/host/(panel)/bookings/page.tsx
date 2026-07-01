import Link from 'next/link'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/badge'
import { HostBookingCard } from '@/components/host/HostBookingCard'
import { ViewSwitcher } from '@/components/host/ViewSwitcher'
import { BookingsSearchBar } from '@/components/host/BookingsSearchBar'
import { VenuePagination } from '@/components/search/VenuePagination'
import { sanitizeSearchTerm } from '@/lib/host-listing-filters'
import { cn } from '@/lib/utils'
import { defaultLocale, formatCurrencyILS, formatDateTimeLocalized, isLocale, localeCookieName, type Locale } from '@/lib/i18n'

const PAGE_SIZE = 12
const STATUS_TABS = ['all', 'pending', 'upcoming', 'past'] as const
type StatusTab = (typeof STATUS_TABS)[number]

type RenterInfo = { first_name: string | null; last_name: string | null; email: string }

type BookingRow = {
  id: string
  start_at: string
  end_at: string
  total_price: number
  status: string
  renter_id: string
  venues: { title: string } | { title: string }[] | null
}

const statusColor: Record<string, string> = {
  PENDING:   'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  CONFIRMED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  CANCELLED: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  COMPLETED: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  REJECTED:  'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
}

function getVenueTitle(v: BookingRow['venues']): string {
  if (!v) return '—'
  return Array.isArray(v) ? (v[0]?.title ?? '—') : v.title
}

function getRenterName(renter: RenterInfo | undefined, isHe: boolean): string {
  if (!renter) return isHe ? 'אורח' : 'Guest'
  return renter.first_name ? `${renter.first_name} ${renter.last_name ?? ''}`.trim() : renter.email
}

/** Same status-tab definition applied to both the count query and the page query. */
function applyStatusFilter(query: any, tab: StatusTab, nowIso: string) {
  if (tab === 'all') return query
  if (tab === 'pending') return query.eq('status', 'PENDING')
  if (tab === 'upcoming') return query.eq('status', 'CONFIRMED').gt('start_at', nowIso)
  return query.neq('status', 'PENDING').or(`status.neq.CONFIRMED,start_at.lte.${nowIso}`)
}

/** venue_id/renter_id are plain columns on `bookings`, so an OR across both
 *  is a single PostgREST filter — no embedded-resource join needed. */
function applySearchFilter(query: any, matchedVenueIds: string[], matchedRenterIds: string[]) {
  const clauses: string[] = []
  if (matchedVenueIds.length) clauses.push(`venue_id.in.(${matchedVenueIds.join(',')})`)
  if (matchedRenterIds.length) clauses.push(`renter_id.in.(${matchedRenterIds.join(',')})`)
  return clauses.length ? query.or(clauses.join(',')) : query
}

export default async function HostBookingsPage({
  searchParams,
}: {
  searchParams: { status?: string; page?: string; q?: string }
}) {
  const locale: Locale = isLocale(cookies().get(localeCookieName)?.value)
    ? (cookies().get(localeCookieName)!.value as Locale)
    : defaultLocale
  const isHe = locale === 'he'

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const tab: StatusTab = STATUS_TABS.includes(searchParams.status as StatusTab)
    ? (searchParams.status as StatusTab)
    : 'pending'
  const q = searchParams.q ?? ''
  const currentPage = Math.max(1, Number(searchParams.page) || 1)
  const offset = (currentPage - 1) * PAGE_SIZE

  const { data: hostVenues } = await supabase.from('venues').select('id, title').eq('host_id', user.id)
  const allVenues = hostVenues ?? []
  const venueIds = allVenues.map((v) => v.id)

  // Resolve the search term to concrete venue/renter ids up front, so the
  // booking queries themselves only ever filter on plain `bookings` columns.
  const term = sanitizeSearchTerm(q)
  let matchedVenueIds: string[] = []
  let matchedRenterIds: string[] = []
  if (term) {
    const lower = term.toLowerCase()
    matchedVenueIds = allVenues.filter((v) => v.title.toLowerCase().includes(lower)).map((v) => v.id)
    const { data: matchedRenters } = await createAdminClient()
      .from('users')
      .select('id')
      .or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%`)
    matchedRenterIds = (matchedRenters ?? []).map((r) => r.id)
  }
  const noSearchMatch = Boolean(term) && matchedVenueIds.length === 0 && matchedRenterIds.length === 0

  const nowIso = new Date().toISOString()
  const empty = { data: [] as BookingRow[] }
  const emptyCount = { count: 0 }

  const [countsRes, pageRes] = await Promise.all([
    venueIds.length && !noSearchMatch
      ? Promise.all(
          STATUS_TABS.map((t) =>
            applyStatusFilter(
              applySearchFilter(
                supabase.from('bookings').select('id', { count: 'exact', head: true }).in('venue_id', venueIds),
                matchedVenueIds,
                matchedRenterIds,
              ),
              t,
              nowIso,
            ),
          ),
        )
      : Promise.resolve(STATUS_TABS.map(() => emptyCount)),
    venueIds.length && !noSearchMatch
      ? applyStatusFilter(
          applySearchFilter(
            supabase
              .from('bookings')
              .select('id, start_at, end_at, total_price, status, renter_id, venues(title)', { count: 'exact' })
              .in('venue_id', venueIds),
            matchedVenueIds,
            matchedRenterIds,
          ),
          tab,
          nowIso,
        ).order(tab === 'upcoming' ? 'start_at' : 'created_at', { ascending: tab === 'upcoming' }).range(offset, offset + PAGE_SIZE - 1)
      : Promise.resolve({ ...empty, count: 0 }),
  ])

  const tabCounts: Record<StatusTab, number> = {
    all: countsRes[0]?.count ?? 0,
    pending: countsRes[1]?.count ?? 0,
    upcoming: countsRes[2]?.count ?? 0,
    past: countsRes[3]?.count ?? 0,
  }

  const bookings = ((pageRes.data ?? []) as unknown[]) as BookingRow[]
  const totalPages = Math.max(1, Math.ceil((pageRes.count ?? 0) / PAGE_SIZE))

  // Renter names are a cross-user read — `users` RLS only allows reading your
  // own row, so this join has to go through the admin client (same pattern
  // as the dashboard's pending/upcoming lists).
  const renterIds = Array.from(new Set(bookings.map((b) => b.renter_id)))
  const { data: renterRows } = renterIds.length
    ? await createAdminClient().from('users').select('id, first_name, last_name, email').in('id', renterIds)
    : { data: [] as ({ id: string } & RenterInfo)[] }
  const renterMap = new Map((renterRows ?? []).map((r) => [r.id, r]))

  const tabLabel: Record<StatusTab, string> = {
    all: isHe ? 'הכל' : 'All',
    pending: isHe ? 'ממתינות' : 'Pending',
    upcoming: isHe ? 'קרובות' : 'Upcoming',
    past: isHe ? 'עבר' : 'Past',
  }

  const toolbarNode = (
    <div className="flex flex-wrap items-center gap-3">
      <BookingsSearchBar locale={locale} />
      <div className="inline-flex items-center gap-1 rounded-lg border bg-muted/40 p-1">
        {STATUS_TABS.map((t) => (
          <Link
            key={t}
            href={`?status=${t}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              tab === t ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tabLabel[t]}
            {tabCounts[t] > 0 && (
              <Badge className="h-5 rounded-full px-1.5 text-xs">{tabCounts[t]}</Badge>
            )}
          </Link>
        ))}
      </div>
    </div>
  )

  const emptyNode = (
    <div className="rounded-xl border border-dashed py-12 text-center text-muted-foreground">
      {term ? (isHe ? `אין תוצאות עבור “${q}”` : `No bookings match “${q}”`) : (isHe ? 'אין הזמנות' : 'No bookings')}
    </div>
  )

  const cardRows = bookings.map((b) => ({
    id: b.id,
    start_at: b.start_at,
    total_price: b.total_price,
    status: b.status,
    venueTitle: getVenueTitle(b.venues),
    renterName: getRenterName(renterMap.get(b.renter_id), isHe),
  }))

  const cardNode = bookings.length === 0 ? emptyNode : (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cardRows.map((b) => (
        <HostBookingCard key={b.id} b={b} locale={locale} />
      ))}
    </div>
  )

  const tableNode = bookings.length === 0 ? emptyNode : (
    <div className="flex flex-col divide-y rounded-xl border bg-background">
      {bookings.map((b) => (
        <Link
          key={b.id}
          href={`/host/bookings/${b.id}`}
          className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 transition hover:bg-muted/30"
        >
          <div className="min-w-0">
            <p className="font-medium truncate">{getVenueTitle(b.venues)}</p>
            <p className="text-sm text-muted-foreground">
              {getRenterName(renterMap.get(b.renter_id), isHe)} · {formatDateTimeLocalized(b.start_at, locale)}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor[b.status] ?? ''}`}>
              {b.status.replace('_', ' ')}
            </span>
            <span className="font-semibold text-primary">{formatCurrencyILS(Number(b.total_price), locale)}</span>
          </div>
        </Link>
      ))}
    </div>
  )

  return (
    <div>
      <ViewSwitcher storageKey="host-bookings-view" locale={locale} toolbar={toolbarNode} table={tableNode} card={cardNode} />
      <VenuePagination currentPage={currentPage} totalPages={totalPages} locale={locale} />
    </div>
  )
}
