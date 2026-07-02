import Link from 'next/link'
import {
  TrendingUp, Users, CalendarDays, Building2, Star,
  Banknote, ArrowUpRight, ArrowDownRight, Minus,
} from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { AdminRevenueChart } from '@/components/admin/AdminRevenueChart'
import { AdminStatusDonut } from '@/components/admin/AdminStatusDonut'
import { AdminUsersBarChart } from '@/components/admin/AdminUsersBarChart'
import {
  monthlyBuckets, monthlyBookingCounts,
  rankVenuesByBookings, bookingStatusBreakdown,
} from '@/lib/admin-analytics'
import { formatCurrencyILS } from '@/lib/i18n'
import { cn } from '@/lib/utils'

// ── KPI card ──────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, icon: Icon, iconCls, trend, trendLabel,
}: {
  label: string
  value: string
  sub?: string
  icon: React.ElementType
  iconCls: string
  trend?: 'up' | 'down' | 'flat'
  trendLabel?: string
}) {
  const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : Minus
  const trendCls  = trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground'

  return (
    <div className="rounded-xl border bg-background p-4 transition-shadow hover:shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
        <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', iconCls)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-2xl font-bold tabular-nums leading-none">{value}</p>
      {(sub || trendLabel) && (
        <div className="mt-1.5 flex items-center gap-1.5">
          {trendLabel && trend && (
            <span className={cn('flex items-center gap-0.5 text-xs font-medium', trendCls)}>
              <TrendIcon className="h-3 w-3" />
              {trendLabel}
            </span>
          )}
          {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AdminAnalyticsPage() {
  const db = createAdminClient()

  const [
    { data: allBookingRows },
    { data: allUserRows },
    { data: allPaymentRows },
    { data: allReviewRows },
    { count: activeVenueCount },
  ] = await Promise.all([
    db.from('bookings').select('id, venue_id, total_price, status, created_at'),
    db.from('users').select('id, role, created_at'),
    db.from('payments').select('platform_fee_amount, host_payout_amount, status'),
    db.from('reviews').select('rating, created_at'),
    db.from('venues').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
  ])

  const bookingRows = (allBookingRows ?? []) as {
    id: string; venue_id: string; total_price: number | string | null
    status: string; created_at: string
  }[]
  const userRows    = (allUserRows ?? []) as { id: string; role: string; created_at: string }[]
  const paymentRows = (allPaymentRows ?? []) as {
    platform_fee_amount: number | null; host_payout_amount: number | null; status: string
  }[]
  const reviewRows  = (allReviewRows ?? []) as { rating: number; created_at: string }[]

  // ── KPI calculations ─────────────────────────────────────────────────────
  const successStatuses = new Set(['CONFIRMED', 'COMPLETED'])
  const successBookings = bookingRows.filter((b) => successStatuses.has(b.status))
  const totalGmv        = successBookings.reduce((s, b) => s + Number(b.total_price ?? 0), 0)
  const platformRevenue = paymentRows.reduce((s, p) => s + Number(p.platform_fee_amount ?? 0), 0)
  const totalBookings   = bookingRows.length
  const avgBookingValue = successBookings.length > 0 ? totalGmv / successBookings.length : 0

  const pendingCount    = bookingRows.filter((b) => b.status === 'PENDING_APPROVAL').length
  const confirmedCount  = bookingRows.filter((b) => b.status === 'CONFIRMED').length
  const conversionRate  = (pendingCount + confirmedCount + successBookings.length) > 0
    ? ((confirmedCount + successBookings.filter((b) => b.status === 'COMPLETED').length) /
       (pendingCount + confirmedCount + successBookings.length)) * 100
    : 0

  const avgRating       = reviewRows.length > 0
    ? reviewRows.reduce((s, r) => s + r.rating, 0) / reviewRows.length
    : 0
  const totalHosts      = userRows.filter((u) => u.role === 'HOST').length
  const totalRenders    = userRows.length

  // ── This-month vs last-month GMV ─────────────────────────────────────────
  const now        = new Date()
  const thisMonth  = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const lastDate   = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonth  = `${lastDate.getFullYear()}-${String(lastDate.getMonth() + 1).padStart(2, '0')}`

  function monthGmv(monthKey: string) {
    return successBookings
      .filter((b) => b.created_at.startsWith(monthKey))
      .reduce((s, b) => s + Number(b.total_price ?? 0), 0)
  }
  const gmvThisMonth = monthGmv(thisMonth)
  const gmvLastMonth = monthGmv(lastMonth)
  const gmvTrend: 'up' | 'down' | 'flat' =
    gmvLastMonth === 0  ? 'flat'
    : gmvThisMonth > gmvLastMonth ? 'up'
    : 'down'
  const gmvTrendPct = gmvLastMonth > 0
    ? `${Math.abs(((gmvThisMonth - gmvLastMonth) / gmvLastMonth) * 100).toFixed(0)}% vs last month`
    : undefined

  // ── Chart data ────────────────────────────────────────────────────────────
  const gmv12M = monthlyBuckets(
    successBookings.map((b) => ({ date: b.created_at, value: Number(b.total_price ?? 0) })),
    12,
  )
  const gmv6M  = gmv12M.slice(-6)

  const cnt12M = monthlyBookingCounts(bookingRows, 12)
  const cnt6M  = cnt12M.slice(-6)

  const users12M = monthlyBuckets(userRows.map((u) => ({ date: u.created_at, value: 1 })), 12)
  const users6M  = users12M.slice(-6)

  const statusBreakdown = bookingStatusBreakdown(bookingRows)

  // ── Top venues ────────────────────────────────────────────────────────────
  const topVenueRanking = rankVenuesByBookings(bookingRows, 8)
  const { data: topVenueTitles } = topVenueRanking.length > 0
    ? await db.from('venues').select('id, title, city').in('id', topVenueRanking.map((v) => v.venueId))
    : { data: [] }
  const venueById = new Map(
    (topVenueTitles ?? []).map((v) => [v.id as string, v as { id: string; title: string; city: string }]),
  )
  const maxRevenue = Math.max(...topVenueRanking.map((v) => v.revenue), 1)

  return (
    <div className="space-y-5">

      {/* ── KPI cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard
          label="Total GMV"
          value={formatCurrencyILS(totalGmv, 'en')}
          icon={TrendingUp}
          iconCls="bg-primary/10 text-primary"
          trend={gmvTrend}
          trendLabel={gmvTrendPct}
          sub={gmvTrendPct ? undefined : 'Confirmed + completed'}
        />
        <KpiCard
          label="Platform revenue"
          value={formatCurrencyILS(platformRevenue || totalGmv * 0.15, 'en')}
          sub="15% of GMV"
          icon={Banknote}
          iconCls="bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400"
        />
        <KpiCard
          label="Total bookings"
          value={String(totalBookings)}
          sub={`${successBookings.length} successful`}
          icon={CalendarDays}
          iconCls="bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
        />
        <KpiCard
          label="Conversion rate"
          value={`${conversionRate.toFixed(1)}%`}
          sub="Requests → confirmed"
          icon={ArrowUpRight}
          iconCls="bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard
          label="Active venues"
          value={String(activeVenueCount ?? 0)}
          sub={`${totalHosts} hosts`}
          icon={Building2}
          iconCls="bg-orange-100 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400"
        />
        <KpiCard
          label="Registered users"
          value={String(totalRenders)}
          sub={`${totalHosts} hosts · ${totalRenders - totalHosts} renters`}
          icon={Users}
          iconCls="bg-sky-100 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400"
        />
        <KpiCard
          label="Avg booking value"
          value={formatCurrencyILS(avgBookingValue, 'en')}
          sub="Successful bookings"
          icon={TrendingUp}
          iconCls="bg-teal-100 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400"
        />
        <KpiCard
          label="Avg rating"
          value={reviewRows.length > 0 ? `${avgRating.toFixed(1)} ★` : '—'}
          sub={`${reviewRows.length} reviews`}
          icon={Star}
          iconCls="bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400"
        />
      </div>

      {/* ── Revenue / bookings area chart ─────────────────────────────────── */}
      <AdminRevenueChart
        gmv6M={gmv6M}
        gmv12M={gmv12M}
        cnt6M={cnt6M}
        cnt12M={cnt12M}
      />

      {/* ── Status donut + users bar ──────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2">
        <AdminStatusDonut data={statusBreakdown} />
        <AdminUsersBarChart all6M={users6M} all12M={users12M} />
      </div>

      {/* ── Top venues ────────────────────────────────────────────────────── */}
      <div className="rounded-xl border bg-background p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Top venues by revenue</h2>
            <p className="text-xs text-muted-foreground">Confirmed + completed bookings</p>
          </div>
        </div>

        {topVenueRanking.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No confirmed bookings yet</p>
        ) : (
          <div className="space-y-3">
            {topVenueRanking.map((v, i) => {
              const venue = venueById.get(v.venueId)
              const barPct = (v.revenue / maxRevenue) * 100
              return (
                <div key={v.venueId} className="group">
                  <div className="mb-1 flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className={cn(
                        'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                        i === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                        : i === 1 ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        : i === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400'
                        : 'bg-muted text-muted-foreground',
                      )}>
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <Link
                          href={`/venues/${v.venueId}`}
                          target="_blank"
                          className="block truncate text-sm font-medium hover:underline"
                        >
                          {venue?.title ?? v.venueId}
                        </Link>
                        {venue?.city && (
                          <p className="text-xs text-muted-foreground">{venue.city}</p>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 text-end">
                      <p className="text-sm font-semibold tabular-nums">{formatCurrencyILS(v.revenue, 'en')}</p>
                      <p className="text-xs text-muted-foreground">{v.bookings} booking{v.bookings !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        i === 0 ? 'bg-amber-500'
                        : i === 1 ? 'bg-slate-400'
                        : i === 2 ? 'bg-orange-500'
                        : 'bg-primary/50',
                      )}
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
