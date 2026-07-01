import Link from 'next/link'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { ArrowUpRight, Undo2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ConnectOnboardingCard } from '@/components/stripe/ConnectOnboardingCard'
import { PayoutsChart, type EarningPoint } from '@/components/host/PayoutsChart'
import { PayoutsKpiCards } from '@/components/host/PayoutsKpiCards'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { VenuePagination } from '@/components/search/VenuePagination'
import {
  defaultLocale,
  formatCurrencyILS,
  formatDateLocalized,
  getDictionary,
  isLocale,
  localeCookieName,
  type Locale,
} from '@/lib/i18n'

const PAGE_SIZE = 15

type StatRow = {
  amount: number | null
  platform_fee_amount: number | null
  host_payout_amount: number | null
  refund_amount: number | null
  created_at: string
  stripe_transfer_id: string | null
}

type PayoutRow = StatRow & {
  id: string
  booking_id: string
  status: string
}

/**
 * Net host earnings after accounting for refund reversals.
 *
 * When a renter cancels, Stripe issues a proportional reverse_transfer from
 * the host's Connect account equal to (refund / gross) × host_payout.
 * e.g. 50% refund on ₪11,500 gross → ₪5,750 refunded, host loses ₪5,000.
 *   netHostEarnings = 10,000 × (1 − 5,750/11,500) = 5,000
 */
function netHostEarnings(p: {
  amount: number | null
  platform_fee_amount: number | null
  host_payout_amount: number | null
  refund_amount: number | null
}): number {
  const base   = Number(p.host_payout_amount ?? 0)
  const gross  = Number(p.amount ?? 0) + Number(p.platform_fee_amount ?? 0)
  const refund = Number(p.refund_amount ?? 0)
  if (refund === 0 || gross === 0) return base
  return Math.max(0, base * (1 - refund / gross))
}

type StatusInfo = { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; className: string }

function payoutStatus(p: { stripe_transfer_id: string | null; refund_amount: number | null }, isHe: boolean): StatusInfo {
  if (Number(p.refund_amount ?? 0) > 0) return {
    label: isHe ? 'הוחזר' : 'Refunded',
    variant: 'destructive',
    className: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-400',
  }
  if (p.stripe_transfer_id) return {
    label: isHe ? 'הועבר' : 'Transferred',
    variant: 'secondary',
    className: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400',
  }
  return {
    label: isHe ? 'ממתין' : 'Pending',
    variant: 'outline',
    className: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400',
  }
}

export default async function HostPayoutsPage({
  searchParams,
}: {
  searchParams: { page?: string }
}) {
  const locale: Locale = isLocale(cookies().get(localeCookieName)?.value)
    ? (cookies().get(localeCookieName)!.value as Locale)
    : defaultLocale
  const isHe = locale === 'he'
  const t = getDictionary(locale).stripeConnect
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled, stripe_details_submitted')
    .eq('id', user.id)
    .single()

  const state: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETE' = !profile?.stripe_account_id
    ? 'NOT_STARTED'
    : profile.stripe_charges_enabled
    ? 'COMPLETE'
    : 'IN_PROGRESS'

  const stripeCard = (
    <ConnectOnboardingCard
      locale={locale}
      state={state}
      chargesEnabled={Boolean(profile?.stripe_charges_enabled)}
      payoutsEnabled={Boolean(profile?.stripe_payouts_enabled)}
      detailsSubmitted={Boolean(profile?.stripe_details_submitted)}
      compact={state === 'COMPLETE'}
    />
  )

  if (state !== 'COMPLETE') return stripeCard

  // ── Data fetching ─────────────────────────────────────────────
  const { data: hostVenues } = await supabase.from('venues').select('id, title').eq('host_id', user.id)
  const venueIds = (hostVenues ?? []).map((v) => v.id)
  const venueMap = new Map((hostVenues ?? []).map((v) => [v.id, v.title]))

  let allStats: StatRow[] = []
  let payouts: PayoutRow[] = []
  let totalCount = 0
  const currentPage = Math.max(1, Number(searchParams.page) || 1)
  const offset = (currentPage - 1) * PAGE_SIZE

  if (venueIds.length > 0) {
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id, venue_id')
      .in('venue_id', venueIds)
      .in('status', ['CONFIRMED', 'COMPLETED', 'CANCELLED'])

    const bookingIds = (bookings ?? []).map((b) => b.id)
    const bookingToVenue = new Map((bookings ?? []).map((b) => [b.id, venueMap.get(b.venue_id) ?? '—']))

    if (bookingIds.length > 0) {
      const [statsRes, countRes, pageRes] = await Promise.all([
        supabase
          .from('payments')
          .select('amount, platform_fee_amount, host_payout_amount, refund_amount, created_at, stripe_transfer_id')
          .in('booking_id', bookingIds),
        supabase.from('payments').select('id', { count: 'exact', head: true }).in('booking_id', bookingIds),
        supabase
          .from('payments')
          .select('id, booking_id, amount, platform_fee_amount, host_payout_amount, refund_amount, created_at, status, stripe_transfer_id')
          .in('booking_id', bookingIds)
          .order('created_at', { ascending: false })
          .range(offset, offset + PAGE_SIZE - 1),
      ])

      allStats = (statsRes.data ?? []) as StatRow[]
      totalCount = countRes.count ?? 0
      payouts = ((pageRes.data ?? []) as PayoutRow[]).map(
        (p) => ({ ...p, _venueName: bookingToVenue.get(p.booking_id) ?? '—' } as any),
      )
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const fmt = (v: number) => formatCurrencyILS(v, locale)

  // ── KPI aggregations ──────────────────────────────────────────
  // All figures are NET — refund reversals are deducted proportionally.
  // Gross NET = (amount + fee) − refund_amount
  // Your cut NET = netHostEarnings() = host_payout × (1 − refund/gross)
  const grossRevenue = allStats.reduce((s, p) => {
    const g = Number(p.amount ?? 0) + Number(p.platform_fee_amount ?? 0)
    return s + Math.max(0, g - Number(p.refund_amount ?? 0))
  }, 0)
  const totalEarned      = allStats.reduce((s, p) => s + netHostEarnings(p), 0)
  const totalTransferred = allStats.filter((p) => p.stripe_transfer_id)
    .reduce((s, p) => s + netHostEarnings(p), 0)
  const totalPending = allStats
    .filter((p) => !p.stripe_transfer_id && Number(p.refund_amount ?? 0) === 0)
    .reduce((s, p) => s + netHostEarnings(p), 0)
  const thisMonth = allStats.filter((p) => p.created_at >= monthStart)
    .reduce((s, p) => s + netHostEarnings(p), 0)

  const chartItems: EarningPoint[] = allStats
    .filter((p) => p.host_payout_amount != null)
    .map((p) => ({ date: p.created_at, value: netHostEarnings(p) }))
  const grossChartItems: EarningPoint[] = allStats
    .filter((p) => p.amount != null)
    .map((p) => {
      const g = Number(p.amount) + Number(p.platform_fee_amount ?? 0)
      return { date: p.created_at, value: Math.max(0, g - Number(p.refund_amount ?? 0)) }
    })

  return (
    <div className="flex flex-col gap-6">
      {stripeCard}

      {/* KPI cards — each has an info icon tooltip explaining the metric */}
      <PayoutsKpiCards
        grossRevenue={grossRevenue}
        totalEarned={totalEarned}
        totalTransferred={totalTransferred}
        totalPending={totalPending}
        thisMonth={thisMonth}
        locale={locale}
      />

      {/* Earnings chart */}
      {chartItems.length > 0 && (
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-base">{isHe ? 'הכנסות לפי תאריך' : 'Earnings over time'}</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 pb-4">
            <PayoutsChart earningsItems={chartItems} grossItems={grossChartItems} locale={locale} />
          </CardContent>
        </Card>
      )}

      {/* Payout history table */}
      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">{t.payoutsHistory}</h2>
          {totalCount > 0 && (
            <p className="text-sm text-muted-foreground">
              {isHe ? `${totalCount} רשומות` : `${totalCount} records`}
            </p>
          )}
        </div>

        {payouts.length === 0 ? (
          <div className="rounded-xl border border-dashed py-10 text-center text-muted-foreground">
            {t.noPayouts}
          </div>
        ) : (
          <div className="rounded-xl border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.date}</TableHead>
                  <TableHead>{isHe ? 'נכס' : 'Venue'}</TableHead>
                  <TableHead>{isHe ? 'הזמנה' : 'Booking'}</TableHead>
                  <TableHead>{isHe ? 'ברוטו' : 'Gross'}</TableHead>
                  <TableHead>{isHe ? 'ההכנסה שלך' : 'Your cut'}</TableHead>
                  <TableHead>{isHe ? 'הוחזר' : 'Refunded'}</TableHead>
                  <TableHead>{isHe ? 'סטטוס' : 'Status'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.map((p) => {
                  const info = payoutStatus(p, isHe)
                  const venueName = (p as any)._venueName as string
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDateLocalized(p.created_at, locale)}
                      </TableCell>
                      <TableCell className="max-w-[140px] truncate font-medium">
                        {venueName}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/host/bookings/${p.booking_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-mono text-xs text-primary hover:underline"
                        >
                          {p.booking_id.slice(0, 8)}…
                          <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                        </Link>
                      </TableCell>
                      <TableCell className="tabular-nums text-muted-foreground">
                        {p.amount != null
                          ? fmt(Number(p.amount) + Number(p.platform_fee_amount ?? 0))
                          : '—'}
                      </TableCell>
                      <TableCell className="font-semibold tabular-nums">
                        {p.host_payout_amount != null
                          ? fmt(netHostEarnings(p))
                          : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {Number(p.refund_amount ?? 0) > 0 ? (
                          <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                            <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
                            {fmt(Number(p.refund_amount))}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={info.variant} className={`text-xs ${info.className}`}>
                          {info.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}

        <VenuePagination currentPage={currentPage} totalPages={totalPages} locale={locale} />
      </div>
    </div>
  )
}
