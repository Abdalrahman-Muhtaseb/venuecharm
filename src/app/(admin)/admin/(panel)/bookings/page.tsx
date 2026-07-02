import { Suspense } from 'react'
import Link from 'next/link'
import {
  Clock, CheckCircle2, CheckCheck, XCircle, Ban, CalendarDays,
  ChevronUp, ChevronDown, ChevronsUpDown,
} from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AdminBookingsSearchBar } from '@/components/admin/AdminBookingsSearchBar'
import { VenuePagination } from '@/components/search/VenuePagination'
import { formatDateLocalized, formatCurrencyILS } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 20

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, {
  label: string
  badgeCls: string
  icon: React.ElementType
  iconCls: string
}> = {
  PENDING_APPROVAL: {
    label: 'Pending',
    badgeCls: 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
    icon: Clock,
    iconCls: 'text-amber-500',
  },
  CONFIRMED: {
    label: 'Confirmed',
    badgeCls: 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
    icon: CheckCircle2,
    iconCls: 'text-emerald-500',
  },
  COMPLETED: {
    label: 'Completed',
    badgeCls: 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
    icon: CheckCheck,
    iconCls: 'text-blue-500',
  },
  CANCELLED: {
    label: 'Cancelled',
    badgeCls: 'border-muted-foreground/30 text-muted-foreground',
    icon: XCircle,
    iconCls: 'text-muted-foreground',
  },
  REJECTED: {
    label: 'Rejected',
    badgeCls: 'border-destructive/30 bg-destructive/5 text-destructive',
    icon: Ban,
    iconCls: 'text-destructive',
  },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.CANCELLED
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium', cfg.badgeCls)}>
      <cfg.icon className={cn('h-3 w-3', cfg.iconCls)} />
      {cfg.label}
    </span>
  )
}

// ── Sort ──────────────────────────────────────────────────────────────────────

const BOOKING_SORTS = ['created_desc', 'created_asc', 'start_desc', 'start_asc', 'amount_desc', 'amount_asc'] as const
type BookingSort = (typeof BOOKING_SORTS)[number]

function parseSort(v?: string): BookingSort {
  return (BOOKING_SORTS as readonly string[]).includes(v ?? '') ? (v as BookingSort) : 'created_desc'
}

function applySort(q: ReturnType<ReturnType<typeof createAdminClient>['from']>['select'], sort: BookingSort) {
  switch (sort) {
    case 'created_desc': return (q as any).order('created_at',  { ascending: false })
    case 'created_asc':  return (q as any).order('created_at',  { ascending: true })
    case 'start_desc':   return (q as any).order('start_at',    { ascending: false })
    case 'start_asc':    return (q as any).order('start_at',    { ascending: true })
    case 'amount_desc':  return (q as any).order('total_price', { ascending: false })
    case 'amount_asc':   return (q as any).order('total_price', { ascending: true })
  }
}

function SortHead({
  col, label, sort, baseParams, className,
}: {
  col: string; label: string; sort: BookingSort; baseParams: Record<string, string>; className?: string
}) {
  const isAsc    = sort === `${col}_asc`
  const isDesc   = sort === `${col}_desc`
  const isActive = isAsc || isDesc
  const next     = isAsc ? `${col}_desc` : `${col}_asc`
  const p = new URLSearchParams(baseParams)
  p.set('sort', next)
  p.delete('page')
  const Icon = !isActive ? ChevronsUpDown : isAsc ? ChevronUp : ChevronDown
  return (
    <TableHead className={className}>
      <Link
        href={`?${p.toString()}`}
        className="inline-flex items-center gap-1 rounded-sm transition-colors hover:text-foreground"
      >
        {label}
        <Icon className={cn('h-3.5 w-3.5 shrink-0', isActive ? 'text-foreground' : 'text-muted-foreground/40')} />
      </Link>
    </TableHead>
  )
}

// ── Period ────────────────────────────────────────────────────────────────────

const PERIODS = {
  all: 'All time',
  today: 'Today',
  week: 'Last 7 days',
  month: 'Last 30 days',
} as const
type Period = keyof typeof PERIODS

function getPeriodStart(period: Period): string | null {
  const now = new Date()
  if (period === 'today') {
    const d = new Date(now); d.setHours(0, 0, 0, 0); return d.toISOString()
  }
  if (period === 'week')  return new Date(now.getTime() - 7  * 86_400_000).toISOString()
  if (period === 'month') return new Date(now.getTime() - 30 * 86_400_000).toISOString()
  return null
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label, count, icon: Icon, iconCls, active, href,
}: {
  label: string; count: number
  icon: React.ElementType; iconCls: string; active: boolean; href: string
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-xl border p-3 transition-all hover:shadow-sm',
        active
          ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/20'
          : 'bg-background hover:bg-muted/40',
      )}
    >
      <div className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
        active ? 'bg-primary/10' : 'bg-muted',
      )}>
        <Icon className={cn('h-4 w-4', active ? 'text-primary' : iconCls)} />
      </div>
      <div className="min-w-0">
        <p className="text-xl font-bold tabular-nums leading-tight">{count}</p>
        <p className="truncate text-xs text-muted-foreground">{label}</p>
      </div>
    </Link>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; sort?: string; page?: string; period?: string }
}) {
  const db          = createAdminClient()
  const rawQ        = (searchParams.q ?? '').trim()
  const status      = searchParams.status ?? null
  const sort        = parseSort(searchParams.sort)
  const period      = (searchParams.period ?? 'all') as Period
  const page        = Math.max(1, Number(searchParams.page) || 1)
  const offset      = (page - 1) * PAGE_SIZE
  const term        = rawQ.replace(/[%,()]/g, '')
  const periodStart = getPeriodStart(period)

  // ── All-time status counts (for stat cards) ───────────────────────────────
  const { data: allStatusRows } = await db.from('bookings').select('status')
  const counts: Record<string, number> = { total: 0 }
  for (const r of allStatusRows ?? []) {
    counts.total = (counts.total ?? 0) + 1
    counts[r.status] = (counts[r.status] ?? 0) + 1
  }

  // ── Search: resolve venue + renter IDs in parallel ────────────────────────
  let venueIds: string[]  = []
  let renterIds: string[] = []
  if (term) {
    const [vRes, rRes] = await Promise.all([
      db.from('venues').select('id').ilike('title', `%${term}%`).limit(200),
      db.from('users').select('id')
        .or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%`)
        .limit(200),
    ])
    venueIds  = vRes.data?.map((v) => v.id) ?? []
    renterIds = rRes.data?.map((u) => u.id) ?? []
  }
  const noResults = term.length > 0 && venueIds.length === 0 && renterIds.length === 0

  // ── Filter builder ────────────────────────────────────────────────────────
  function withFilters(base: any) {
    let q = base
    if (status)      q = q.eq('status', status)
    if (periodStart) q = q.gte('created_at', periodStart)
    if (term && !noResults) {
      const conds: string[] = []
      if (venueIds.length  > 0) conds.push(`venue_id.in.(${venueIds.join(',')})`)
      if (renterIds.length > 0) conds.push(`renter_id.in.(${renterIds.join(',')})`)
      q = q.or(conds.join(','))
    }
    return q
  }

  // ── Fetch count + page ────────────────────────────────────────────────────
  type BookingRow = {
    id: string; venue_id: string; renter_id: string
    start_at: string; end_at: string; total_price: number
    status: string; created_at: string; cancelled_at: string | null
  }

  const [filteredCount, rows]: [number, BookingRow[]] = noResults
    ? [0, []]
    : await Promise.all([
        withFilters(db.from('bookings').select('*', { count: 'exact', head: true }))
          .then((r: any) => (r.count as number) ?? 0),
        applySort(
          withFilters(
            db.from('bookings').select(
              'id, venue_id, renter_id, start_at, end_at, total_price, status, created_at, cancelled_at',
            ),
          ),
          sort,
        ).range(offset, offset + PAGE_SIZE - 1)
          .then((r: any) => (r.data ?? []) as BookingRow[]),
      ])

  // ── Lookup names for current page ─────────────────────────────────────────
  const pageVenueIds  = [...new Set(rows.map((b) => b.venue_id))]
  const pageRenterIds = [...new Set(rows.map((b) => b.renter_id))]

  const [{ data: venueRows }, { data: renterRows }] = await Promise.all([
    pageVenueIds.length > 0
      ? db.from('venues').select('id, title, city').in('id', pageVenueIds)
      : Promise.resolve({ data: [] as { id: string; title: string; city: string }[] }),
    pageRenterIds.length > 0
      ? db.from('users').select('id, first_name, last_name, email').in('id', pageRenterIds)
      : Promise.resolve({
          data: [] as { id: string; first_name: string | null; last_name: string | null; email: string | null }[],
        }),
  ])

  const venueMap  = new Map((venueRows  ?? []).map((v) => [v.id, v]))
  const renterMap = new Map((renterRows ?? []).map((u) => [u.id, u]))
  const totalPages = Math.max(1, Math.ceil(filteredCount / PAGE_SIZE))

  // ── URL helpers ───────────────────────────────────────────────────────────
  const baseParams: Record<string, string> = {}
  if (rawQ)   baseParams.q      = rawQ
  if (status) baseParams.status = status
  if (period !== 'all') baseParams.period = period

  function statusHref(s: string | null) {
    const p = new URLSearchParams()
    if (rawQ)   p.set('q', rawQ)
    if (s)      p.set('status', s)
    if (sort !== 'created_desc') p.set('sort', sort)
    if (period !== 'all') p.set('period', period)
    return `/admin/bookings?${p.toString()}`
  }

  function periodHref(p: Period) {
    const params = new URLSearchParams()
    if (rawQ)   params.set('q', rawQ)
    if (status) params.set('status', status)
    if (sort !== 'created_desc') params.set('sort', sort)
    if (p !== 'all') params.set('period', p)
    return `/admin/bookings?${params.toString()}`
  }

  return (
    <div className="space-y-5">

      {/* ── Stat cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        <StatCard label="All"       count={counts.total ?? 0}            icon={CalendarDays} iconCls="text-muted-foreground" active={!status} href={statusHref(null)} />
        <StatCard label="Pending"   count={counts.PENDING_APPROVAL ?? 0} icon={Clock}        iconCls="text-amber-500"        active={status === 'PENDING_APPROVAL'} href={statusHref('PENDING_APPROVAL')} />
        <StatCard label="Confirmed" count={counts.CONFIRMED ?? 0}        icon={CheckCircle2} iconCls="text-emerald-500"      active={status === 'CONFIRMED'}        href={statusHref('CONFIRMED')} />
        <StatCard label="Completed" count={counts.COMPLETED ?? 0}        icon={CheckCheck}   iconCls="text-blue-500"         active={status === 'COMPLETED'}        href={statusHref('COMPLETED')} />
        <StatCard label="Cancelled" count={counts.CANCELLED ?? 0}        icon={XCircle}      iconCls="text-muted-foreground" active={status === 'CANCELLED'}        href={statusHref('CANCELLED')} />
        <StatCard label="Rejected"  count={counts.REJECTED  ?? 0}        icon={Ban}          iconCls="text-destructive"      active={status === 'REJECTED'}         href={statusHref('REJECTED')} />
      </div>

      {/* ── Toolbar ────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <Suspense>
          <AdminBookingsSearchBar />
        </Suspense>

        {/* Period pills */}
        <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-1">
          {(Object.keys(PERIODS) as Period[]).map((p) => (
            <Link
              key={p}
              href={periodHref(p)}
              className={cn(
                'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                period === p
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {PERIODS[p]}
            </Link>
          ))}
        </div>

        {rawQ && (
          <Link
            href={statusHref(status)}
            className="text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            Clear search
          </Link>
        )}
      </div>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <SortHead col="created" label="Created"    sort={sort} baseParams={baseParams} className="w-28" />
              <TableHead>Venue</TableHead>
              <TableHead>Renter</TableHead>
              <SortHead col="start"   label="Event date" sort={sort} baseParams={baseParams} />
              <SortHead col="amount"  label="Amount"     sort={sort} baseParams={baseParams} className="text-end" />
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((b) => {
              const venue  = venueMap.get(b.venue_id)
              const renter = renterMap.get(b.renter_id)
              const renterName = renter
                ? ([renter.first_name, renter.last_name].filter(Boolean).join(' ') || renter.email) ?? '—'
                : '—'

              return (
                <TableRow key={b.id} className="group">
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {b.created_at ? formatDateLocalized(b.created_at, 'en') : '—'}
                  </TableCell>

                  <TableCell>
                    <div className="min-w-0">
                      <p className="max-w-[160px] truncate text-sm font-medium">
                        {venue?.title ?? '—'}
                      </p>
                      {venue?.city && (
                        <p className="text-xs text-muted-foreground">{venue.city}</p>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="min-w-0">
                      <p className="max-w-[140px] truncate text-sm">{renterName}</p>
                      {renter?.email && renter.first_name && (
                        <p className="max-w-[140px] truncate text-xs text-muted-foreground">
                          {renter.email}
                        </p>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="whitespace-nowrap text-sm">
                    {b.start_at ? formatDateLocalized(b.start_at, 'en') : '—'}
                  </TableCell>

                  <TableCell className="text-end text-sm font-medium tabular-nums">
                    {formatCurrencyILS(b.total_price, 'en')}
                  </TableCell>

                  <TableCell>
                    <StatusBadge status={b.status} />
                  </TableCell>

                  <TableCell>
                    <Link
                      href={`/admin/bookings/${b.id}`}
                      className="text-xs text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
                    >
                      View
                    </Link>
                  </TableCell>
                </TableRow>
              )
            })}

            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-16 text-center text-muted-foreground">
                  {noResults
                    ? `No bookings found for "${rawQ}"`
                    : status
                    ? `No ${STATUS_CFG[status]?.label.toLowerCase() ?? status.toLowerCase()} bookings`
                    : 'No bookings yet'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <VenuePagination currentPage={page} totalPages={totalPages} locale="en" />
    </div>
  )
}
