import { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { cookies } from 'next/headers'
import { Star } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AdminVenueActionsDropdown } from '@/components/admin/AdminVenueActionsDropdown'
import { AdminVenueCard } from '@/components/admin/AdminVenueCard'
import { SortableTableHead } from '@/components/admin/SortableTableHead'
import { ViewSwitcher } from '@/components/host/ViewSwitcher'
import { ListingsFilterBar } from '@/components/host/ListingsFilterBar'
import { AdminVenuesSortModal } from '@/components/admin/AdminVenuesSortModal'
import { VenuePagination } from '@/components/search/VenuePagination'
import { buildRatingsMap, type RatingRow } from '@/lib/ratings'
import {
  applyListingSort,
  parseListingSort,
  sanitizeSearchTerm,
  type ListingSort,
} from '@/lib/host-listing-filters'
import { cn } from '@/lib/utils'
import {
  defaultLocale,
  formatCurrencyILS,
  isLocale,
  localeCookieName,
  type Locale,
} from '@/lib/i18n'

const PAGE_SIZE = 12

/**
 * Sorts that need all matching venues fetched upfront so JS can sort globally.
 * - HOST_SORTS: sort by embedded host name (PostgREST can't sort outer resource by embedded column)
 * - AGG_SORTS: sort by aggregate (revenue/rating/completed) not stored on the venue row
 */
const HOST_SORTS = new Set(['host_asc', 'host_desc'])
const AGG_SORTS  = new Set(['revenue_asc', 'revenue_desc', 'rating_asc', 'rating_desc', 'completed_asc', 'completed_desc'])

const SELECT =
  'id, title, city, capacity, status, photos, created_at, users:host_id(first_name, last_name)'

type VenueRow = {
  id: string
  title: string
  city: string
  capacity: number
  status: string
  photos: string[] | null
  created_at: string
  users:
    | { first_name: string | null; last_name: string | null }
    | { first_name: string | null; last_name: string | null }[]
    | null
}

type BookingAggRow = { venue_id: string; total_price: number; status: string }

function getHostName(u: VenueRow['users']): string {
  if (!u) return ''
  const p = Array.isArray(u) ? u[0] : u
  if (!p) return ''
  return [p.first_name, p.last_name].filter(Boolean).join(' ').trim()
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'PENDING_APPROVAL') {
    return (
      <Badge
        variant="outline"
        className="whitespace-nowrap border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
      >
        Pending
      </Badge>
    )
  }
  const variant =
    status === 'ACTIVE' ? 'default' : status === 'SUSPENDED' ? 'destructive' : 'outline'
  const label =
    status === 'ACTIVE' ? 'Active' : status === 'DRAFT' ? 'Draft' : status === 'SUSPENDED' ? 'Suspended' : status
  return <Badge variant={variant} className="whitespace-nowrap">{label}</Badge>
}

const STAT_CARDS = [
  { status: 'ACTIVE',           label: 'Active',    colorRing: 'ring-emerald-500/50', colorBg: 'bg-emerald-50 dark:bg-emerald-950/30', colorCount: 'text-emerald-700 dark:text-emerald-400', colorDot: 'bg-emerald-500' },
  { status: 'PENDING_APPROVAL', label: 'Pending',   colorRing: 'ring-amber-500/50',   colorBg: 'bg-amber-50 dark:bg-amber-950/30',   colorCount: 'text-amber-700 dark:text-amber-400',   colorDot: 'bg-amber-500'   },
  { status: 'DRAFT',            label: 'Draft',     colorRing: 'ring-slate-400/50',   colorBg: 'bg-slate-50 dark:bg-slate-950/30',   colorCount: 'text-slate-600 dark:text-slate-400',   colorDot: 'bg-slate-400'   },
  { status: 'SUSPENDED',        label: 'Suspended', colorRing: 'ring-red-500/50',     colorBg: 'bg-red-50 dark:bg-red-950/30',       colorCount: 'text-red-700 dark:text-red-400',       colorDot: 'bg-red-500'     },
] as const

export default async function AdminVenuesPage({
  searchParams,
}: {
  searchParams: { page?: string; q?: string; sort?: string; status?: string }
}) {
  const locale: Locale = isLocale(cookies().get(localeCookieName)?.value)
    ? (cookies().get(localeCookieName)!.value as Locale)
    : defaultLocale
  const isHe = locale === 'he'

  const db = createAdminClient()

  const q       = searchParams.q ?? ''
  const sort    = parseListingSort(searchParams.sort)
  const statusFilter  = (searchParams.status ?? '').split(',').filter(Boolean)
  const currentPage   = Math.max(1, Number(searchParams.page) || 1)
  const offset        = (currentPage - 1) * PAGE_SIZE
  const statusParamStr = statusFilter.join(',')

  const isHostSort = HOST_SORTS.has(sort)
  const isAggSort  = AGG_SORTS.has(sort)

  const baseParams: Record<string, string> = {}
  if (q) baseParams.q = q
  if (statusParamStr) baseParams.status = statusParamStr

  // ── Host-name search pre-fetch ──────────────────────────────────────────────
  // Split the search term into words so "John Smith" matches by first+last name.
  let hostMatchIds: string[] = []
  if (q) {
    const term  = sanitizeSearchTerm(q)
    const words = term.split(/\s+/).filter(Boolean)
    if (words.length > 0) {
      let userQ = db.from('users').select('id')
      for (const word of words) {
        // Each chained .or() is ANDed — all words must match against some name field.
        userQ = userQ.or(`first_name.ilike.%${word}%,last_name.ilike.%${word}%`)
      }
      const { data: hostRows } = await userQ
      hostMatchIds = (hostRows ?? []).map((u: { id: string }) => u.id)
    }
  }

  /** Venue search: title, city, or host name (via pre-fetched hostMatchIds). */
  const withSearch = (query: any) => {
    const term = sanitizeSearchTerm(q)
    if (!term) return query
    const conds = [`title.ilike.%${term}%`, `city.ilike.%${term}%`]
    if (hostMatchIds.length > 0) conds.push(`host_id.in.(${hostMatchIds.join(',')})`)
    return query.or(conds.join(','))
  }

  const withStatus = (query: any) =>
    statusFilter.length > 0 ? query.in('status', statusFilter) : query

  const filteredBase = () => withSearch(withStatus(db.from('venues').select(SELECT)))

  // ── Status counts Promise (fire immediately, parallel with main data) ───────
  const statusCountsP = Promise.all([
    db.from('venues').select('id', { count: 'exact', head: true }),
    db.from('venues').select('id', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
    db.from('venues').select('id', { count: 'exact', head: true }).eq('status', 'PENDING_APPROVAL'),
    db.from('venues').select('id', { count: 'exact', head: true }).eq('status', 'DRAFT'),
    db.from('venues').select('id', { count: 'exact', head: true }).eq('status', 'SUSPENDED'),
  ])

  // ── Aggregate helpers ────────────────────────────────────────────────────────
  function buildMaps(bookingsRaw: BookingAggRow[]) {
    const rev = new Map<string, number>()
    const cmp = new Map<string, number>()
    for (const b of bookingsRaw) {
      rev.set(b.venue_id, (rev.get(b.venue_id) ?? 0) + Number(b.total_price))
      if (b.status === 'COMPLETED')
        cmp.set(b.venue_id, (cmp.get(b.venue_id) ?? 0) + 1)
    }
    return { rev, cmp }
  }

  async function fetchAggregates(ids: string[]) {
    if (ids.length === 0) return { reviewsRaw: [], bookingsRaw: [] }
    const [{ data: r }, { data: b }] = await Promise.all([
      db.from('reviews').select('venue_id, rating').in('venue_id', ids),
      db.from('bookings')
        .select('venue_id, total_price, status')
        .in('venue_id', ids)
        .in('status', ['CONFIRMED', 'COMPLETED']),
    ])
    return { reviewsRaw: r ?? [], bookingsRaw: b ?? [] }
  }

  // ── Main data fetch (3 strategies) ──────────────────────────────────────────
  let venues: VenueRow[] = []
  let filteredCount = 0
  let revenueMap = new Map<string, number>()
  let completedMap = new Map<string, number>()
  let ratingsMap: ReturnType<typeof buildRatingsMap> = new Map()

  if (isHostSort) {
    // Fetch ALL matching venues + status counts in parallel.
    // Sort by host name in JS, then paginate.
    const [_counts, { data: allRaw }] = await Promise.all([
      statusCountsP,
      filteredBase(),
    ])
    void _counts // will be awaited again below for counts

    const dir = sort === 'host_asc' ? 1 : -1
    const all = ((allRaw ?? []) as unknown[]) as VenueRow[]
    all.sort((a, b) => (getHostName(a.users) || '').localeCompare(getHostName(b.users) || '') * dir)

    filteredCount = all.length
    venues = all.slice(offset, offset + PAGE_SIZE)

    const { reviewsRaw, bookingsRaw } = await fetchAggregates(venues.map(v => v.id))
    ratingsMap = buildRatingsMap(reviewsRaw as RatingRow[])
    const maps = buildMaps(bookingsRaw as BookingAggRow[])
    revenueMap = maps.rev
    completedMap = maps.cmp

  } else if (isAggSort) {
    // Fetch ALL matching venue IDs + status counts in parallel.
    // Fetch all their aggregates, sort by aggregate value, paginate, then fetch venue rows.
    const [_counts, { data: allIdsRaw }] = await Promise.all([
      statusCountsP,
      withSearch(withStatus(db.from('venues').select('id'))),
    ])
    void _counts

    const allIds = ((allIdsRaw ?? []) as { id: string }[]).map(r => r.id)
    filteredCount = allIds.length

    const { reviewsRaw, bookingsRaw } = await fetchAggregates(allIds)
    ratingsMap = buildRatingsMap(reviewsRaw as RatingRow[])
    const maps = buildMaps(bookingsRaw as BookingAggRow[])
    revenueMap = maps.rev
    completedMap = maps.cmp

    const dir = sort.endsWith('_asc') ? 1 : -1
    const sorted = [...allIds].sort((a, b) => {
      if (sort.startsWith('revenue'))   return ((revenueMap.get(a)   ?? 0) - (revenueMap.get(b)   ?? 0)) * dir
      if (sort.startsWith('rating'))    return ((ratingsMap.get(a)?.avg_rating ?? 0) - (ratingsMap.get(b)?.avg_rating ?? 0)) * dir
      if (sort.startsWith('completed')) return ((completedMap.get(a) ?? 0) - (completedMap.get(b) ?? 0)) * dir
      return 0
    })

    const pageIds = sorted.slice(offset, offset + PAGE_SIZE)
    if (pageIds.length > 0) {
      const { data: venuesRaw } = await db.from('venues').select(SELECT).in('id', pageIds)
      const order = new Map(pageIds.map((id, i) => [id, i]))
      venues = ((venuesRaw ?? []) as unknown[])
        .map(v => v as VenueRow)
        .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
    }

  } else {
    // Server-side sort — paginate in the DB.
    const [_counts, { count: fc }, { data: venuesRaw }] = await Promise.all([
      statusCountsP,
      withSearch(withStatus(db.from('venues').select('id', { count: 'exact', head: true }))),
      applyListingSort(filteredBase(), sort).range(offset, offset + PAGE_SIZE - 1),
    ])
    void _counts

    filteredCount = fc ?? 0
    venues = ((venuesRaw ?? []) as unknown[]) as VenueRow[]

    const { reviewsRaw, bookingsRaw } = await fetchAggregates(venues.map(v => v.id))
    ratingsMap = buildRatingsMap(reviewsRaw as RatingRow[])
    const maps = buildMaps(bookingsRaw as BookingAggRow[])
    revenueMap = maps.rev
    completedMap = maps.cmp
  }

  // ── Resolve status counts (already resolved — just destructure) ─────────────
  const [
    { count: totalCount },
    { count: activeCount },
    { count: pendingCount },
    { count: draftCount },
    { count: suspendedCount },
  ] = await statusCountsP

  const statusCounts: Record<string, number> = {
    ACTIVE: activeCount ?? 0,
    PENDING_APPROVAL: pendingCount ?? 0,
    DRAFT: draftCount ?? 0,
    SUSPENDED: suspendedCount ?? 0,
  }

  const totalPages = Math.max(1, Math.ceil(filteredCount / PAGE_SIZE))
  const isFiltered = statusFilter.length > 0 || !!q

  if ((totalCount ?? 0) === 0) {
    return (
      <div className="rounded-2xl border border-dashed py-20 text-center text-muted-foreground">
        {isHe ? 'אין נכסים' : 'No venues yet'}
      </div>
    )
  }

  // ── Table ───────────────────────────────────────────────────────────────────
  const tableNode = (
    <div className="rounded-xl border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16 text-center">{isHe ? 'תמונה' : 'Photo'}</TableHead>
            <SortableTableHead field="name"      label={isHe ? 'שם המקום'        : 'Venue'}     sort={sort} baseParams={baseParams} />
            <SortableTableHead field="host"      label={isHe ? 'מארח'            : 'Host'}      sort={sort} baseParams={baseParams} />
            <SortableTableHead field="city"      label={isHe ? 'עיר'             : 'City'}      sort={sort} baseParams={baseParams} />
            <SortableTableHead field="completed" label={isHe ? 'הזמנות שהושלמו' : 'Completed'} sort={sort} baseParams={baseParams} />
            <SortableTableHead field="revenue"   label={isHe ? 'הכנסות'          : 'Revenue'}   sort={sort} baseParams={baseParams} />
            <SortableTableHead field="rating"    label={isHe ? 'דירוג'            : 'Rating'}    sort={sort} baseParams={baseParams} />
            <SortableTableHead field="status"    label={isHe ? 'סטטוס'            : 'Status'}    sort={sort} baseParams={baseParams} />
            <TableHead className="text-center">{isHe ? 'פעולות' : 'Actions'}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {venues.map((v) => {
            const rating    = ratingsMap.get(v.id)
            const revenue   = revenueMap.get(v.id)
            const completed = completedMap.get(v.id) ?? 0
            const hostName  = getHostName(v.users) || '—'
            return (
              <TableRow key={v.id}>
                <TableCell className="text-center">
                  {v.photos?.[0] ? (
                    <div className="relative mx-auto h-10 w-14 overflow-hidden rounded-md bg-muted">
                      <Image src={v.photos[0]} alt={v.title} fill className="object-cover" sizes="56px" />
                    </div>
                  ) : (
                    <div className="mx-auto h-10 w-14 rounded-md bg-muted" />
                  )}
                </TableCell>

                <TableCell className="text-center">
                  <Link href={`/admin/${v.id}`} className="font-medium text-primary underline-offset-4 hover:underline">
                    {v.title}
                  </Link>
                </TableCell>

                <TableCell className="text-center text-sm">
                  <Link href="/admin/users" className="text-primary/80 underline-offset-4 hover:text-primary hover:underline">
                    {hostName}
                  </Link>
                </TableCell>

                <TableCell className="text-center text-muted-foreground">{v.city}</TableCell>

                <TableCell className="text-center tabular-nums">
                  {completed > 0 ? completed : <span className="text-muted-foreground">—</span>}
                </TableCell>

                <TableCell className="text-center tabular-nums">
                  {revenue != null && revenue > 0
                    ? formatCurrencyILS(revenue, locale)
                    : <span className="text-muted-foreground">—</span>}
                </TableCell>

                <TableCell className="text-center">
                  {rating ? (
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      {rating.avg_rating.toFixed(1)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>

                <TableCell className="text-center">
                  <StatusBadge status={v.status} />
                </TableCell>

                <TableCell className="text-center">
                  <AdminVenueActionsDropdown venueId={v.id} status={v.status} locale={locale} />
                </TableCell>
              </TableRow>
            )
          })}
          {venues.length === 0 && (
            <TableRow>
              <TableCell colSpan={9} className="py-12 text-center text-muted-foreground">
                {isFiltered
                  ? isHe ? 'לא נמצאו נכסים תואמים' : 'No venues match your filters'
                  : isHe ? 'אין נכסים' : 'No venues yet'}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )

  // ── Cards ───────────────────────────────────────────────────────────────────
  const cardNode = (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {venues.map((v) => (
        <AdminVenueCard
          key={v.id}
          v={v}
          hostName={getHostName(v.users) || '—'}
          locale={locale}
          completed={completedMap.get(v.id) ?? 0}
          revenue={revenueMap.get(v.id)}
          rating={ratingsMap.get(v.id)}
        />
      ))}
    </div>
  )

  // ── Page ────────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {/* All */}
        {(() => {
          const isAllActive = statusFilter.length === 0
          const p = new URLSearchParams()
          if (q) p.set('q', q)
          const href = `/admin/venues${p.toString() ? `?${p.toString()}` : ''}`
          return (
            <Link
              href={href}
              className={cn(
                'flex flex-col gap-1 rounded-xl border p-4 transition-all hover:shadow-sm',
                isAllActive ? 'ring-2 ring-primary/40 bg-primary/5' : 'hover:bg-muted/50',
              )}
            >
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary" />
                <span className="text-xs font-medium text-muted-foreground">{isHe ? 'הכל' : 'All'}</span>
              </div>
              <p className="text-2xl font-bold tabular-nums leading-none text-primary">
                {totalCount ?? 0}
              </p>
            </Link>
          )
        })()}

        {STAT_CARDS.map(({ status, label, colorRing, colorBg, colorCount, colorDot }) => {
          const isSingle = statusFilter.length === 1 && statusFilter[0] === status
          const p = new URLSearchParams()
          if (q) p.set('q', q)
          if (!isSingle) p.set('status', status)
          const href = `/admin/venues${p.toString() ? `?${p.toString()}` : ''}`
          return (
            <Link
              key={status}
              href={href}
              className={cn(
                'flex flex-col gap-1 rounded-xl border p-4 transition-all hover:shadow-sm',
                isSingle ? cn('ring-2', colorRing, colorBg) : 'hover:bg-muted/50',
              )}
            >
              <div className="flex items-center gap-2">
                <span className={cn('h-2 w-2 rounded-full', colorDot)} />
                <span className="text-xs font-medium text-muted-foreground">{label}</span>
              </div>
              <p className={cn('text-2xl font-bold tabular-nums leading-none', colorCount)}>
                {statusCounts[status] ?? 0}
              </p>
            </Link>
          )
        })}
      </div>

      <ViewSwitcher
        storageKey="admin-venues-view"
        locale={locale}
        toolbar={
          <Suspense>
            <ListingsFilterBar
              locale={locale}
              placeholder={isHe ? 'חיפוש לפי מקום, מארח או עיר' : 'Search by venue, host or city'}
              className="w-full sm:w-80 md:w-96 lg:w-[28rem] xl:flex-1 xl:max-w-lg"
            />
          </Suspense>
        }
        cardOnlyControl={
          <Suspense>
            <AdminVenuesSortModal locale={locale} sort={sort} />
          </Suspense>
        }
        table={tableNode}
        card={cardNode}
      />

      <VenuePagination currentPage={currentPage} totalPages={totalPages} locale={locale} />
    </div>
  )
}
