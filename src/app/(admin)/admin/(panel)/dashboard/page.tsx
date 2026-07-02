import Link from 'next/link'
import {
  Users, Building2, CalendarDays, TrendingUp, ArrowUpRight, ArrowDownRight, Minus,
  Clock, CheckCircle2, XCircle, Ban, ChevronRight, ShieldCheck,
} from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatCurrencyILS, formatDateLocalized } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import {
  monthlyBuckets, monthlyBookingCounts, bookingStatusBreakdown,
} from '@/lib/admin-analytics'
import { AdminRevenueChart } from '@/components/admin/AdminRevenueChart'
import { AdminStatusDonut } from '@/components/admin/AdminStatusDonut'

export const dynamic = 'force-dynamic'

// ── Helpers ───────────────────────────────────────────────────────────────────

function weekRange(weeksAgo: number) {
  const now   = new Date()
  const end   = new Date(now.getTime() - weeksAgo * 7 * 86_400_000)
  const start = new Date(end.getTime() - 7 * 86_400_000)
  return { start: start.toISOString(), end: end.toISOString() }
}

// ── Server sub-components ─────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, icon: Icon, iconCls,
  trend, trendValue, trendLabel, href,
}: {
  label: string; value: string | number; sub?: string
  icon: React.ElementType; iconCls: string
  trend?: 'up' | 'down' | 'flat'; trendValue?: string; trendLabel?: string
  href?: string
}) {
  const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : Minus
  const trendCls  = trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground'

  const inner = (
    <div className={cn(
      'rounded-xl border bg-background p-4 transition-all',
      href && 'hover:shadow-sm hover:border-primary/30',
    )}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', iconCls)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-3xl font-bold tabular-nums leading-none">{value}</p>
      <div className="mt-2 flex items-center gap-2 flex-wrap">
        {trend && trendValue && (
          <span className={cn('flex items-center gap-0.5 text-xs font-semibold', trendCls)}>
            <TrendIcon className="h-3.5 w-3.5" />
            {trendValue}
          </span>
        )}
        {(sub || trendLabel) && (
          <span className="text-xs text-muted-foreground">{trendLabel ?? sub}</span>
        )}
      </div>
    </div>
  )

  return href ? <Link href={href}>{inner}</Link> : inner
}

function SectionHeader({ title, href, hrefLabel }: { title: string; href?: string; hrefLabel?: string }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-sm font-semibold">{title}</h2>
      {href && (
        <Link href={href} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
          {hrefLabel ?? 'View all'} <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  )
}

const BOOKING_STATUS_CFG: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  PENDING_APPROVAL: { label: 'Pending',   cls: 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-400',   icon: Clock },
  CONFIRMED:        { label: 'Confirmed', cls: 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400', icon: CheckCircle2 },
  COMPLETED:        { label: 'Completed', cls: 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-400',    icon: CheckCircle2 },
  CANCELLED:        { label: 'Cancelled', cls: 'border-muted-foreground/30 text-muted-foreground',                                                          icon: XCircle },
  REJECTED:         { label: 'Rejected',  cls: 'border-destructive/30 bg-destructive/5 text-destructive',                                                   icon: Ban },
}

function BookingStatusBadge({ status }: { status: string }) {
  const cfg = BOOKING_STATUS_CFG[status] ?? BOOKING_STATUS_CFG.CANCELLED
  const Icon = cfg.icon
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium', cfg.cls)}>
      <Icon className="h-2.5 w-2.5" /> {cfg.label}
    </span>
  )
}

const VENUE_STATUS = [
  { key: 'ACTIVE',           label: 'Active',           bar: 'bg-emerald-500', text: 'text-emerald-600' },
  { key: 'PENDING_APPROVAL', label: 'Pending approval', bar: 'bg-amber-400',   text: 'text-amber-600'  },
  { key: 'DRAFT',            label: 'Draft',            bar: 'bg-slate-400',   text: 'text-muted-foreground' },
  { key: 'SUSPENDED',        label: 'Suspended',        bar: 'bg-destructive', text: 'text-destructive' },
]

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AdminDashboardPage() {
  const db = createAdminClient()

  const thisWeek = weekRange(0)
  const lastWeek = weekRange(1)

  const [
    { data: allUsers },
    { data: allVenues },
    { data: allBookings },
    { data: pendingVenueRows },
    { data: recentBookingRows },
    { data: allPayments },
    { count: newUsersThisWeek },
    { count: newUsersLastWeek },
    { count: bookingsThisWeek },
    { count: bookingsLastWeek },
    { data: allReviews },
  ] = await Promise.all([
    db.from('users').select('id, role, created_at'),
    db.from('venues').select('id, title, city, status, host_id, created_at'),
    db.from('bookings').select('id, venue_id, renter_id, total_price, status, created_at, start_at'),
    db.from('venues').select('id, title, city, created_at')
      .eq('status', 'PENDING_APPROVAL').order('created_at', { ascending: false }).limit(5),
    db.from('bookings').select('id, venue_id, renter_id, total_price, status, created_at, start_at')
      .order('created_at', { ascending: false }).limit(8),
    db.from('payments').select('platform_fee_amount, host_payout_amount, status'),
    db.from('users').select('*', { count: 'exact', head: true }).gte('created_at', thisWeek.start),
    db.from('users').select('*', { count: 'exact', head: true }).gte('created_at', lastWeek.start).lt('created_at', lastWeek.end),
    db.from('bookings').select('*', { count: 'exact', head: true }).gte('created_at', thisWeek.start),
    db.from('bookings').select('*', { count: 'exact', head: true }).gte('created_at', lastWeek.start).lt('created_at', lastWeek.end),
    db.from('reviews').select('id, rating, created_at'),
  ])

  // ── Resolve venue/renter names for recent bookings ──────────────────────
  const rbVenueIds  = [...new Set((recentBookingRows ?? []).map((b) => b.venue_id))]
  const rbRenterIds = [...new Set((recentBookingRows ?? []).map((b) => b.renter_id))]

  const [{ data: rbVenues }, { data: rbRenters }] = await Promise.all([
    rbVenueIds.length  > 0 ? db.from('venues').select('id, title').in('id', rbVenueIds)  : Promise.resolve({ data: [] as {id:string;title:string}[] }),
    rbRenterIds.length > 0 ? db.from('users').select('id, first_name, last_name, email').in('id', rbRenterIds) : Promise.resolve({ data: [] as {id:string;first_name:string|null;last_name:string|null;email:string|null}[] }),
  ])

  const venueMap  = new Map((rbVenues  ?? []).map((v) => [v.id, v]))
  const renterMap = new Map((rbRenters ?? []).map((u) => [u.id, u]))

  // ── Aggregations ──────────────────────────────────────────────────────────
  const users    = allUsers    ?? []
  const venues   = allVenues   ?? []
  const bookings = allBookings ?? []
  const payments = allPayments ?? []
  const reviews  = allReviews  ?? []

  const usersByRole = users.reduce<Record<string,number>>((acc, u) => {
    acc[u.role] = (acc[u.role] ?? 0) + 1; return acc
  }, {})

  const venuesByStatus = venues.reduce<Record<string,number>>((acc, v) => {
    acc[v.status] = (acc[v.status] ?? 0) + 1; return acc
  }, {})

  const bookingsByStatus = bookings.reduce<Record<string,number>>((acc, b) => {
    acc[b.status] = (acc[b.status] ?? 0) + 1; return acc
  }, {})

  const successStatuses = new Set(['CONFIRMED', 'COMPLETED'])
  const gmv = bookings
    .filter((b) => successStatuses.has(b.status))
    .reduce((s, b) => s + Number(b.total_price ?? 0), 0)

  const platformRevenue = payments.reduce((s, p) => s + Number(p.platform_fee_amount ?? 0), 0)

  // GMV this/last week
  const gmvThisWeek = bookings
    .filter((b) => successStatuses.has(b.status) && b.created_at >= thisWeek.start)
    .reduce((s, b) => s + Number(b.total_price ?? 0), 0)
  const gmvLastWeek = bookings
    .filter((b) => successStatuses.has(b.status) && b.created_at >= lastWeek.start && b.created_at < lastWeek.end)
    .reduce((s, b) => s + Number(b.total_price ?? 0), 0)

  // Chart data
  const successBookings = bookings.filter((b) => successStatuses.has(b.status))
  const gmv6M  = monthlyBuckets(successBookings.map((b) => ({ date: b.created_at, value: Number(b.total_price ?? 0) })), 6)
  const gmv12M = monthlyBuckets(successBookings.map((b) => ({ date: b.created_at, value: Number(b.total_price ?? 0) })), 12)
  const cnt6M  = monthlyBookingCounts(bookings, 6)
  const cnt12M = monthlyBookingCounts(bookings, 12)
  const statusBreakdown = bookingStatusBreakdown(bookings)

  function trendPct(curr: number, prev: number): { trend: 'up'|'down'|'flat'; label: string } {
    if (prev === 0) return { trend: 'flat', label: 'vs last week' }
    const pct = ((curr - prev) / prev) * 100
    return {
      trend: pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat',
      label: `${Math.abs(pct).toFixed(0)}% vs last week`,
    }
  }

  const gmvTrend      = trendPct(gmvThisWeek, gmvLastWeek)
  const bookingTrend  = trendPct(bookingsThisWeek ?? 0, bookingsLastWeek ?? 0)
  const userTrend     = trendPct(newUsersThisWeek ?? 0, newUsersLastWeek ?? 0)

  const pendingVenueCount   = venuesByStatus['PENDING_APPROVAL'] ?? 0
  const pendingBookingCount = bookingsByStatus['PENDING_APPROVAL'] ?? 0
  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0
  const totalVenues = venues.length

  const maxVenueStatus = Math.max(...VENUE_STATUS.map((s) => venuesByStatus[s.key] ?? 0), 1)

  return (
    <div className="space-y-6">

      {/* ── KPI row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Platform GMV"
          value={formatCurrencyILS(gmv, 'en')}
          icon={TrendingUp}
          iconCls="bg-primary/10 text-primary"
          trend={gmvTrend.trend}
          trendValue={gmvTrend.trend !== 'flat' ? `${gmvTrend.label.split('%')[0]}%` : undefined}
          trendLabel={`${formatCurrencyILS(gmvThisWeek, 'en')} this week`}
          href="/admin/analytics"
        />
        <KpiCard
          label="Total bookings"
          value={bookings.length}
          icon={CalendarDays}
          iconCls="bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400"
          trend={bookingTrend.trend}
          trendValue={bookingTrend.trend !== 'flat' ? `${bookingTrend.label.split('%')[0]}%` : undefined}
          trendLabel={`${bookingsThisWeek ?? 0} this week`}
          href="/admin/bookings"
        />
        <KpiCard
          label="Active venues"
          value={venuesByStatus['ACTIVE'] ?? 0}
          sub={pendingVenueCount > 0 ? `${pendingVenueCount} pending review` : `${totalVenues} total`}
          icon={Building2}
          iconCls="bg-sky-100 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400"
          href="/admin/venues"
        />
        <KpiCard
          label="Registered users"
          value={users.length}
          icon={Users}
          iconCls="bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
          trend={userTrend.trend}
          trendValue={userTrend.trend !== 'flat' ? `${userTrend.label.split('%')[0]}%` : undefined}
          trendLabel={`${newUsersThisWeek ?? 0} new this week`}
          href="/admin/users"
        />
      </div>

      {/* ── Secondary KPI strip ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: 'Platform revenue',
            value: formatCurrencyILS(platformRevenue || gmv * 0.15, 'en'),
            sub: '15% commission',
            cls: 'text-violet-600',
          },
          {
            label: 'Avg rating',
            value: reviews.length > 0 ? `${avgRating.toFixed(1)} ★` : '—',
            sub: `${reviews.length} reviews`,
            cls: 'text-amber-500',
          },
          {
            label: 'Hosts',
            value: usersByRole['HOST'] ?? 0,
            sub: `${usersByRole['RENTER'] ?? 0} renters`,
            cls: 'text-sky-600',
          },
          {
            label: 'Pending review',
            value: pendingVenueCount + pendingBookingCount,
            sub: `${pendingVenueCount} venues · ${pendingBookingCount} bookings`,
            cls: pendingVenueCount + pendingBookingCount > 0 ? 'text-amber-600' : 'text-muted-foreground',
          },
        ].map(({ label, value, sub, cls }) => (
          <div key={label} className="rounded-xl border bg-background px-4 py-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
            <p className={cn('text-xl font-bold tabular-nums', cls)}>{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Charts row ───────────────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <AdminRevenueChart gmv6M={gmv6M} gmv12M={gmv12M} cnt6M={cnt6M} cnt12M={cnt12M} />
        </div>
        <div className="lg:col-span-2">
          <AdminStatusDonut data={statusBreakdown} />
        </div>
      </div>

      {/* ── Pending + Recent bookings ─────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-5">

        {/* Pending approvals */}
        <div className="lg:col-span-2">
          <SectionHeader
            title={pendingVenueCount > 0 ? `Pending approval (${pendingVenueCount})` : 'Pending approval'}
            href="/admin/venues"
            hrefLabel="Review all"
          />
          <div className="rounded-xl border bg-background overflow-hidden">
            {(pendingVenueRows ?? []).length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                <ShieldCheck className="h-8 w-8 text-emerald-500/60" />
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">All caught up!</p>
                <p className="text-xs text-muted-foreground">No venues waiting for review.</p>
              </div>
            ) : (
              <div className="divide-y">
                {(pendingVenueRows ?? []).map((v) => (
                  <Link
                    key={v.id}
                    href={`/admin/${v.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors group"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/50">
                      <Building2 className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium group-hover:text-primary transition-colors">{v.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {v.city} · {formatDateLocalized(v.created_at, 'en')}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                  </Link>
                ))}
                {pendingVenueCount > (pendingVenueRows ?? []).length && (
                  <Link
                    href="/admin/venues"
                    className="flex items-center justify-center py-2.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    +{pendingVenueCount - (pendingVenueRows ?? []).length} more
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Recent bookings */}
        <div className="lg:col-span-3">
          <SectionHeader title="Recent bookings" href="/admin/bookings" />
          <div className="rounded-xl border bg-background overflow-hidden">
            {(recentBookingRows ?? []).length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">No bookings yet.</p>
            ) : (
              <div className="divide-y">
                {(recentBookingRows ?? []).map((b) => {
                  const venue  = venueMap.get(b.venue_id)
                  const renter = renterMap.get(b.renter_id)
                  const name   = renter
                    ? [renter.first_name, renter.last_name].filter(Boolean).join(' ') || renter.email || '—'
                    : '—'
                  return (
                    <Link
                      key={b.id}
                      href={`/admin/bookings/${b.id}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors group"
                    >
                      <div className="min-w-0 flex-1 grid grid-cols-3 items-center gap-2">
                        <div className="col-span-2 min-w-0">
                          <p className="truncate text-sm font-medium group-hover:text-primary transition-colors">
                            {venue?.title ?? '—'}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">{name}</p>
                        </div>
                        <div className="text-end">
                          <p className="text-sm font-semibold tabular-nums">
                            {formatCurrencyILS(b.total_price, 'en')}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {b.start_at ? formatDateLocalized(b.start_at, 'en') : '—'}
                          </p>
                        </div>
                      </div>
                      <BookingStatusBadge status={b.status} />
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Venue health ─────────────────────────────────────────────────── */}
      <div>
        <SectionHeader title="Venue health" href="/admin/venues" hrefLabel="Manage" />
        <div className="grid gap-3 sm:grid-cols-4">
          {VENUE_STATUS.map(({ key, label, bar, text }) => {
            const count = venuesByStatus[key] ?? 0
            const pct   = totalVenues > 0 ? (count / totalVenues) * 100 : 0
            return (
              <Link key={key} href={`/admin/venues?status=${key}`} className="group">
                <div className="rounded-xl border bg-background p-4 transition-all hover:shadow-sm hover:border-primary/30">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={cn('h-2 w-2 rounded-full', bar)} />
                      <span className="text-xs text-muted-foreground">{label}</span>
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums">{pct.toFixed(0)}%</span>
                  </div>
                  <p className={cn('text-2xl font-bold tabular-nums', text)}>{count}</p>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn('h-full rounded-full transition-all', bar)}
                      style={{ width: `${(count / maxVenueStatus) * 100}%` }}
                    />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
