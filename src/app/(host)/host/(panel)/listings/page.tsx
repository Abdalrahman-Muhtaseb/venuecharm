import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { Suspense } from 'react'
import { Plus, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { HostListingCard } from '@/components/host/HostListingCard'
import { HostListingActionsDropdown } from '@/components/host/HostListingActionsDropdown'
import { HostListingsSortModal } from '@/components/host/HostListingsSortModal'
import { ViewSwitcher } from '@/components/host/ViewSwitcher'
import { ListingsFilterBar } from '@/components/host/ListingsFilterBar'
import { SortableTableHead } from '@/components/admin/SortableTableHead'
import { VenuePagination } from '@/components/search/VenuePagination'
import { buildRatingsMap, type RatingRow } from '@/lib/ratings'
import {
  applyListingSearch,
  applyListingSort,
  parseListingSort,
  sanitizeSearchTerm,
  type ListingSort,
} from '@/lib/host-listing-filters'
import { defaultLocale, formatCurrencyILS, isLocale, localeCookieName, type Locale } from '@/lib/i18n'

const PAGE_SIZE = 12

/** Sort keys whose ordering requires global aggregation before pagination. */
const AGG_SORTS = new Set<ListingSort>([
  'completed_asc', 'completed_desc',
  'revenue_asc',   'revenue_desc',
  'rating_asc',    'rating_desc',
])

type ListingRow = {
  id: string
  title: string
  city: string
  capacity: number
  price_per_hour: number | null
  price_per_day: number | null
  status: string
  photos: string[] | null
  created_at: string
}

type BookingAggRow = { venue_id: string; total_price: number; status: string }

function StatusBadge({ status }: { status: string }) {
  if (status === 'PENDING_APPROVAL') {
    return (
      <Badge variant="outline" className="whitespace-nowrap border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
        Pending
      </Badge>
    )
  }
  const variantMap: Record<string, 'default' | 'destructive' | 'outline'> = {
    ACTIVE: 'default', SUSPENDED: 'destructive', DRAFT: 'outline',
  }
  const labelMap: Record<string, string> = {
    ACTIVE: 'Active', SUSPENDED: 'Suspended', DRAFT: 'Draft',
  }
  return (
    <Badge variant={variantMap[status] ?? 'outline'} className="whitespace-nowrap">
      {labelMap[status] ?? status}
    </Badge>
  )
}

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: { page?: string; q?: string; sort?: string }
}) {
  const locale: Locale = isLocale(cookies().get(localeCookieName)?.value)
    ? (cookies().get(localeCookieName)!.value as Locale)
    : defaultLocale
  const isHe = locale === 'he'

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const q           = searchParams.q ?? ''
  const sort        = parseListingSort(searchParams.sort)
  const currentPage = Math.max(1, Number(searchParams.page) || 1)
  const offset      = (currentPage - 1) * PAGE_SIZE
  const isAggSort   = AGG_SORTS.has(sort)

  const baseParams: Record<string, string> = {}
  if (q) baseParams.q = q

  const withSearch = (query: any) => applyListingSearch(query, q)

  // ── Main fetch (2 strategies) ───────────────────────────────────────────────
  let rows: ListingRow[] = []
  let filteredCount = 0
  let revenueMap   = new Map<string, number>()
  let completedMap = new Map<string, number>()
  let ratingsMap: ReturnType<typeof buildRatingsMap> = new Map()

  const countQ = () =>
    withSearch(supabase.from('venues').select('id', { count: 'exact', head: true }).eq('host_id', user.id))

  const totalCountP = supabase
    .from('venues')
    .select('id', { count: 'exact', head: true })
    .eq('host_id', user.id)

  if (isAggSort) {
    // Step 1: get ALL matching IDs for this host
    const [_total, { data: allIdsRaw }] = await Promise.all([
      totalCountP,
      withSearch(supabase.from('venues').select('id').eq('host_id', user.id)),
    ])
    void _total

    const allIds = ((allIdsRaw ?? []) as { id: string }[]).map((r) => r.id)
    filteredCount = allIds.length

    // Step 2: fetch all aggregates for those IDs
    if (allIds.length > 0) {
      const [{ data: reviewsRaw }, { data: bookingsRaw }] = await Promise.all([
        supabase.from('reviews').select('venue_id, rating').in('venue_id', allIds),
        supabase.from('bookings').select('venue_id, total_price, status')
          .in('venue_id', allIds)
          .in('status', ['CONFIRMED', 'COMPLETED']),
      ])
      ratingsMap = buildRatingsMap((reviewsRaw ?? []) as RatingRow[])
      for (const b of (bookingsRaw ?? []) as BookingAggRow[]) {
        revenueMap.set(b.venue_id, (revenueMap.get(b.venue_id) ?? 0) + Number(b.total_price))
        if (b.status === 'COMPLETED')
          completedMap.set(b.venue_id, (completedMap.get(b.venue_id) ?? 0) + 1)
      }
    }

    // Step 3: sort IDs globally, paginate, then fetch full rows
    const dir = sort.endsWith('_asc') ? 1 : -1
    const sorted = [...allIds].sort((a, b) => {
      if (sort.startsWith('revenue'))   return ((revenueMap.get(a)   ?? 0) - (revenueMap.get(b)   ?? 0)) * dir
      if (sort.startsWith('rating'))    return ((ratingsMap.get(a)?.avg_rating ?? 0) - (ratingsMap.get(b)?.avg_rating ?? 0)) * dir
      if (sort.startsWith('completed')) return ((completedMap.get(a) ?? 0) - (completedMap.get(b) ?? 0)) * dir
      return 0
    })

    const pageIds = sorted.slice(offset, offset + PAGE_SIZE)
    if (pageIds.length > 0) {
      const { data: venuesRaw } = await supabase
        .from('venues')
        .select('id, title, city, capacity, price_per_hour, price_per_day, status, photos, created_at')
        .in('id', pageIds)
      const order = new Map(pageIds.map((id, i) => [id, i]))
      rows = ((venuesRaw ?? []) as ListingRow[]).sort(
        (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0),
      )
    }

  } else {
    // Standard DB-paginated sort
    const [_total, { count: fc }, { data: venuesRaw }] = await Promise.all([
      totalCountP,
      countQ(),
      applyListingSort(
        withSearch(
          supabase
            .from('venues')
            .select('id, title, city, capacity, price_per_hour, price_per_day, status, photos, created_at')
            .eq('host_id', user.id),
        ),
        sort,
      ).range(offset, offset + PAGE_SIZE - 1),
    ])
    void _total
    filteredCount = fc ?? 0
    rows = (venuesRaw ?? []) as ListingRow[]

    // Fetch aggregates for the page only
    if (rows.length > 0) {
      const ids = rows.map((v) => v.id)
      const [{ data: reviewsRaw }, { data: bookingsRaw }] = await Promise.all([
        supabase.from('reviews').select('venue_id, rating').in('venue_id', ids),
        supabase.from('bookings').select('venue_id, total_price, status')
          .in('venue_id', ids)
          .in('status', ['CONFIRMED', 'COMPLETED']),
      ])
      ratingsMap = buildRatingsMap((reviewsRaw ?? []) as RatingRow[])
      for (const b of (bookingsRaw ?? []) as BookingAggRow[]) {
        revenueMap.set(b.venue_id, (revenueMap.get(b.venue_id) ?? 0) + Number(b.total_price))
        if (b.status === 'COMPLETED')
          completedMap.set(b.venue_id, (completedMap.get(b.venue_id) ?? 0) + 1)
      }
    }
  }

  const { count: totalCount } = await totalCountP
  const totalPages = Math.max(1, Math.ceil(filteredCount / PAGE_SIZE))

  if ((totalCount ?? 0) === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed py-20 text-center">
        <p className="font-medium text-muted-foreground">
          {isHe ? 'עדיין אין נכסים' : 'No listings yet'}
        </p>
        <Button asChild>
          <Link href="/host/listings/new">
            <Plus className="me-2 h-4 w-4" />
            {isHe ? 'פרסם את המקום הראשון' : 'Create your first listing'}
          </Link>
        </Button>
      </div>
    )
  }

  // ── Table ─────────────────────────────────────────────────────────────────
  const tableNode = (
    <div className="rounded-xl border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16 text-center">{isHe ? 'תמונה' : 'Photo'}</TableHead>
            <SortableTableHead field="name"      label={isHe ? 'שם המקום'        : 'Venue'}     sort={sort} baseParams={baseParams} />
            <SortableTableHead field="city"      label={isHe ? 'עיר'             : 'City'}      sort={sort} baseParams={baseParams} />
            <SortableTableHead field="completed" label={isHe ? 'הזמנות שהושלמו' : 'Completed'} sort={sort} baseParams={baseParams} />
            <SortableTableHead field="revenue"   label={isHe ? 'הכנסות'          : 'Revenue'}   sort={sort} baseParams={baseParams} />
            <SortableTableHead field="rating"    label={isHe ? 'דירוג'            : 'Rating'}    sort={sort} baseParams={baseParams} />
            <SortableTableHead field="status"    label={isHe ? 'סטטוס'            : 'Status'}    sort={sort} baseParams={baseParams} />
            <TableHead className="text-center">{isHe ? 'פעולות' : 'Actions'}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((v) => {
            const rating    = ratingsMap.get(v.id)
            const revenue   = revenueMap.get(v.id)
            const completed = completedMap.get(v.id) ?? 0
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
                  <Link href={`/host/listings/${v.id}`} className="font-medium text-primary underline-offset-4 hover:underline">
                    {v.title}
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
                  <HostListingActionsDropdown venueId={v.id} status={v.status} locale={locale} />
                </TableCell>
              </TableRow>
            )
          })}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                {sanitizeSearchTerm(q)
                  ? isHe ? `אין תוצאות עבור &ldquo;${q}&rdquo;` : `No listings match "${q}"`
                  : isHe ? 'אין נכסים' : 'No listings yet'}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )

  // ── Cards ─────────────────────────────────────────────────────────────────
  const cardNode = (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {rows.map((v) => (
        <HostListingCard
          key={v.id}
          v={v}
          locale={locale}
          completed={completedMap.get(v.id) ?? 0}
          revenue={revenueMap.get(v.id)}
          rating={ratingsMap.get(v.id)}
        />
      ))}
    </div>
  )

  // ── Toolbar ───────────────────────────────────────────────────────────────
  const toolbarNode = (
    <div className="flex flex-wrap items-center gap-2">
      <Button asChild>
        <Link href="/host/listings/new">
          <Plus className="me-1.5 h-4 w-4" />
          {isHe ? 'הוסף נכס' : 'Add listing'}
        </Link>
      </Button>
      <Suspense>
        <ListingsFilterBar locale={locale} />
      </Suspense>
    </div>
  )

  return (
    <div>
      <ViewSwitcher
        storageKey="host-listings-view"
        locale={locale}
        toolbar={toolbarNode}
        cardOnlyControl={
          <Suspense>
            <HostListingsSortModal locale={locale} sort={sort} />
          </Suspense>
        }
        table={tableNode}
        card={cardNode}
      />
      <VenuePagination currentPage={currentPage} totalPages={totalPages} locale={locale} />
    </div>
  )
}
