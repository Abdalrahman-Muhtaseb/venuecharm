// Fallback: re-fetch server data every 60 s if Realtime isn't delivering.
export const revalidate = 60

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { DashboardLive } from '@/components/host/DashboardLive'
import { DashboardMessagesCard } from '@/components/host/DashboardMessagesCard'
import { cookies } from 'next/headers'
import {
  AlertCircle,
  Building2,
  CalendarDays,
  Clock,
  TrendingUp,
  Plus,
  ArrowRight,
  Star,
  CheckCircle2,
  Inbox,
  Wallet,
  CreditCard,
  Send,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BookingActionButtons } from '@/components/booking/BookingActionButtons'
import {
  defaultLocale,
  formatCurrencyILS,
  formatDateTimeLocalized,
  getDictionary,
  isLocale,
  localeCookieName,
  type Locale,
} from '@/lib/i18n'

type BookingRow = {
  id: string
  status: string
  start_at: string
  total_price: number
  renter_id: string
  venues: { title: string } | { title: string }[] | null
}

type ReviewRow = {
  id: string
  rating: number
  comment: string | null
  created_at: string
  venues: { title: string } | { title: string }[] | null
}

function venueTitleOf(v: BookingRow['venues'] | ReviewRow['venues']): string {
  if (!v) return '—'
  return Array.isArray(v) ? (v[0]?.title ?? '—') : v.title
}

export default async function HostDashboardPage() {
  const locale: Locale = isLocale(cookies().get(localeCookieName)?.value)
    ? (cookies().get(localeCookieName)!.value as Locale)
    : defaultLocale
  const isHe = locale === 'he'

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('stripe_charges_enabled')
    .eq('id', user.id)
    .single()

  const { data: allVenues } = await supabase
    .from('venues')
    .select('id, status')
    .eq('host_id', user.id)

  const venues        = allVenues ?? []
  const venueIds      = venues.map((v) => v.id)
  const activeCount   = venues.filter((v) => v.status === 'ACTIVE').length
  const draftCount    = venues.filter((v) => v.status === 'DRAFT').length
  const pendingApprovalCount = venues.filter((v) => v.status === 'PENDING_APPROVAL').length
  const suspendedCount = venues.filter((v) => v.status === 'SUSPENDED').length

  const nowIso     = new Date().toISOString()
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

  const noRows  = { data: [] as never[] }
  const noCount = { count: 0 }

  const [
    pendingCountRes,
    upcomingCountRes,
    completedCountRes,
    reviewsRes,
    recentReviewsRes,
    pendingListRes,
    upcomingListRes,
    earningsRes,
  ] = await Promise.all([
    venueIds.length
      ? supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'PENDING').in('venue_id', venueIds)
      : Promise.resolve(noCount),
    venueIds.length
      ? supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'CONFIRMED').gt('start_at', nowIso).in('venue_id', venueIds)
      : Promise.resolve(noCount),
    venueIds.length
      ? supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'COMPLETED').in('venue_id', venueIds)
      : Promise.resolve(noCount),
    venueIds.length
      ? supabase.from('reviews').select('rating').in('venue_id', venueIds)
      : Promise.resolve(noRows),
    venueIds.length
      ? supabase.from('reviews').select('id, rating, comment, created_at, venues(title)').in('venue_id', venueIds).order('created_at', { ascending: false }).limit(3)
      : Promise.resolve(noRows),
    venueIds.length
      ? supabase.from('bookings').select('id, status, start_at, total_price, renter_id, venues(title)').eq('status', 'PENDING').in('venue_id', venueIds).order('created_at', { ascending: true }).limit(5)
      : Promise.resolve(noRows),
    venueIds.length
      ? supabase.from('bookings').select('id, status, start_at, total_price, renter_id, venues(title)').eq('status', 'CONFIRMED').gt('start_at', nowIso).in('venue_id', venueIds).order('start_at', { ascending: true }).limit(5)
      : Promise.resolve(noRows),
    // Accurate net earnings from payments (not bookings.total_price)
    venueIds.length
      ? supabase.from('bookings').select('id').in('venue_id', venueIds).in('status', ['CONFIRMED', 'COMPLETED']).then(async ({ data: bks }) => {
          const ids = (bks ?? []).map((b) => b.id)
          return ids.length
            ? supabase.from('payments').select('host_payout_amount, refund_amount, platform_fee_amount, created_at').in('booking_id', ids).not('host_payout_amount', 'is', null)
            : { data: [] }
        })
      : Promise.resolve({ data: [] }),
  ])

  const pendingRequests   = pendingCountRes.count  ?? 0
  const upcomingBookings  = upcomingCountRes.count ?? 0
  const completedStays    = completedCountRes.count ?? 0

  // ── Earnings (net, accounting for refunds) ────────────────────
  const earningRows = (earningsRes.data ?? []) as {
    host_payout_amount: number | null
    refund_amount: number | null
    platform_fee_amount: number | null
    created_at: string
  }[]

  function netEarning(p: typeof earningRows[0]): number {
    const base  = Number(p.host_payout_amount ?? 0)
    const gross = base + Number(p.platform_fee_amount ?? 0)
    const ref   = Number(p.refund_amount ?? 0)
    if (ref === 0 || gross === 0) return base
    return Math.max(0, base * (1 - ref / gross))
  }

  const totalNetEarnings  = earningRows.reduce((s, p) => s + netEarning(p), 0)
  const monthNetEarnings  = earningRows
    .filter((p) => p.created_at >= monthStart)
    .reduce((s, p) => s + netEarning(p), 0)

  // ── Ratings ───────────────────────────────────────────────────
  const ratings = (reviewsRes.data ?? []) as { rating: number }[]
  const avgRating = ratings.length
    ? Math.round((ratings.reduce((s, r) => s + r.rating, 0) / ratings.length) * 10) / 10
    : null

  const recentReviews = (recentReviewsRes.data ?? []) as ReviewRow[]

  // ── Pending bookings + upcoming ───────────────────────────────
  const pendingList  = (pendingListRes.data  ?? []) as BookingRow[]
  const upcomingList = (upcomingListRes.data ?? []) as BookingRow[]

  const renterIds = Array.from(new Set([...pendingList, ...upcomingList].map((b) => b.renter_id)))
  const { data: renterRows } = renterIds.length
    ? await createAdminClient().from('users').select('id, first_name, last_name').in('id', renterIds)
    : { data: [] as { id: string; first_name: string | null; last_name: string | null }[] }
  const renterMap = new Map((renterRows ?? []).map((r) => [
    r.id,
    `${r.first_name ?? ''} ${r.last_name ?? ''}`.trim() || (isHe ? 'אורח' : 'Guest'),
  ]))

  const stripeT    = getDictionary(locale).stripeConnect
  const needsStripe = !profile?.stripe_charges_enabled
  const fmt = (v: number) => formatCurrencyILS(v, locale)

  // ── Shortcut cards ────────────────────────────────────────────
  // Messages card is rendered as a client component (DashboardMessagesCard)
  // so it stays in sync with the sidebar badge via the same Realtime hook.
  const shortcuts = [
    {
      href: '/host/listings/new',
      icon: Plus,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      title: isHe ? 'נכס חדש' : 'New listing',
      sub: isHe ? 'פרסם מקום חדש' : 'Publish a new space',
    },
    {
      href: '/host/payouts',
      icon: Wallet,
      iconBg: 'bg-emerald-100 dark:bg-emerald-950',
      iconColor: 'text-emerald-600',
      title: isHe ? 'תשלומים' : 'Payouts',
      sub: monthNetEarnings > 0
        ? `${fmt(monthNetEarnings)} ${isHe ? 'החודש' : 'this month'}`
        : isHe ? 'סקור את ההכנסות שלך' : 'Review your earnings',
    },
    {
      href: '/host/calendar',
      icon: CalendarDays,
      iconBg: 'bg-violet-100 dark:bg-violet-950',
      iconColor: 'text-violet-600',
      title: isHe ? 'זמינות' : 'Availability',
      sub: isHe ? 'נהל את הלוח שלך' : 'Manage your calendar',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Realtime listener — triggers router.refresh() on any relevant DB change */}
      <DashboardLive />

      {/* Stripe onboarding alert */}
      {needsStripe && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="flex-1">
            <p className="font-medium">{stripeT.blockedListing}</p>
            <p className="mt-1 text-sm opacity-90">{stripeT.explainNotStarted}</p>
          </div>
          <Button size="sm" asChild>
            <Link href="/host/payouts">
              <CreditCard className="me-2 h-4 w-4" />
              {stripeT.connectNow}
            </Link>
          </Button>
        </div>
      )}

      {venueIds.length === 0 ? (
        /* ── First-run ───────────────────────────────────────────── */
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Building2 className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-lg font-semibold">
              {isHe ? 'בואו נפרסם את הנכס הראשון שלך' : 'Let’s list your first space'}
            </h2>
            <p className="max-w-md text-sm text-muted-foreground">
              {isHe
                ? 'פרסום מקום אורך כמה דקות. לאחר האישור הוא יופיע בחיפוש וניתן יהיה להזמין אותו.'
                : 'Creating a listing takes a few minutes. Once approved it appears in search and can be booked.'}
            </p>
            <Button asChild className="mt-2">
              <Link href="/host/listings/new">
                <Plus className="me-2 h-4 w-4" />
                {isHe ? 'הוסף נכס' : 'Add a listing'}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ── Quick action shortcuts ──────────────────────────── */}
          {/* Order: New listing | Payouts | Messages (client) | Calendar */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {shortcuts.slice(0, 2).map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="group flex items-center gap-3 rounded-xl border bg-background p-4 transition-all hover:border-primary/30 hover:shadow-sm"
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${s.iconBg}`}>
                  <s.icon className={`h-5 w-5 ${s.iconColor}`} aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{s.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{s.sub}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
              </Link>
            ))}

            {/* Messages — client component: same Realtime hook as the sidebar badge */}
            <DashboardMessagesCard locale={locale} />

            {shortcuts.slice(2).map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="group flex items-center gap-3 rounded-xl border bg-background p-4 transition-all hover:border-primary/30 hover:shadow-sm"
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${s.iconBg}`}>
                  <s.icon className={`h-5 w-5 ${s.iconColor}`} aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{s.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{s.sub}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
              </Link>
            ))}
          </div>

          {/* ── KPI stats ───────────────────────────────────────── */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {isHe ? 'נכסים פעילים' : 'Active listings'}
                </CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{activeCount}</p>
                <Button variant="link" size="sm" className="mt-1 h-auto p-0 text-xs text-muted-foreground" asChild>
                  <Link href="/host/listings">{isHe ? 'ניהול נכסים' : 'Manage'}</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className={pendingRequests > 0 ? 'border-primary/40 ring-1 ring-primary/20' : undefined}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className={`text-sm font-medium ${pendingRequests > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                  {isHe ? 'בקשות ממתינות' : 'Pending requests'}
                </CardTitle>
                <Clock className={`h-4 w-4 ${pendingRequests > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{pendingRequests}</p>
                <Button variant="link" size="sm" className={`mt-1 h-auto p-0 text-xs ${pendingRequests > 0 ? 'text-primary' : 'text-muted-foreground'}`} asChild>
                  <Link href="/host/bookings?status=pending">{isHe ? 'סקירה' : 'Review'}</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {isHe ? 'הזמנות קרובות' : 'Upcoming'}
                </CardTitle>
                <Send className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{upcomingBookings}</p>
                <Button variant="link" size="sm" className="mt-1 h-auto p-0 text-xs text-muted-foreground" asChild>
                  <Link href="/host/bookings?status=upcoming">{isHe ? 'כל ההזמנות' : 'View all'}</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {isHe ? 'הכנסות החודש' : 'This month'}
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold tabular-nums">{fmt(monthNetEarnings)}</p>
                <Button variant="link" size="sm" className="mt-1 h-auto p-0 text-xs text-muted-foreground" asChild>
                  <Link href="/host/payouts">{isHe ? 'תשלומים' : 'Payouts'}</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {isHe ? 'דירוג ממוצע' : 'Avg. rating'}
                </CardTitle>
                <Star className="h-4 w-4 text-amber-400" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {avgRating !== null ? avgRating.toFixed(1) : '—'}
                  {avgRating !== null && <span className="ms-1 text-base text-amber-400">★</span>}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {ratings.length > 0
                    ? `${ratings.length} ${isHe ? 'ביקורות' : 'reviews'}`
                    : isHe ? 'אין ביקורות עדיין' : 'No reviews yet'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* ── Listings health (show only when there are non-active listings) */}
          {(draftCount > 0 || pendingApprovalCount > 0 || suspendedCount > 0) && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-muted/20 px-4 py-3 text-sm">
              <span className="font-medium text-muted-foreground me-1">
                {isHe ? 'מצב נכסים:' : 'Listings status:'}
              </span>
              {pendingApprovalCount > 0 && (
                <Link href="/host/listings" className="hover:underline">
                  <Badge variant="secondary">{pendingApprovalCount} {isHe ? 'ממתין לאישור' : 'pending approval'}</Badge>
                </Link>
              )}
              {draftCount > 0 && (
                <Link href="/host/listings" className="hover:underline">
                  <Badge variant="outline">{draftCount} {isHe ? 'טיוטה' : 'draft'}</Badge>
                </Link>
              )}
              {suspendedCount > 0 && (
                <Link href="/host/listings" className="hover:underline">
                  <Badge variant="destructive">{suspendedCount} {isHe ? 'מושהה' : 'suspended'}</Badge>
                </Link>
              )}
            </div>
          )}

          {/* ── Secondary stats row ─────────────────────────────── */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-xl border bg-muted/20 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{isHe ? 'סך הכנסות' : 'All-time earnings'}</p>
                <p className="text-lg font-semibold tabular-nums">{fmt(totalNetEarnings)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border bg-muted/20 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background">
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{isHe ? 'הזמנות שהושלמו' : 'Completed bookings'}</p>
                <p className="text-lg font-semibold">{completedStays}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border bg-muted/20 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{isHe ? 'סך נכסים' : 'Total listings'}</p>
                <p className="text-lg font-semibold">{venueIds.length}</p>
              </div>
            </div>
          </div>

          {/* ── Main grid: attention + reviews ──────────────────── */}
          <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
            <div className="flex flex-col gap-6 lg:col-span-2">
              {/* Needs attention */}
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-base font-semibold">
                    {isHe ? 'דורש את תשומת ליבך' : 'Needs your attention'}
                  </h2>
                  {pendingRequests > 0 && (
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/host/bookings?status=pending">
                        {isHe ? 'הכל' : 'See all'}
                        <ArrowRight className="ms-1 h-4 w-4 rtl:rotate-180" />
                      </Link>
                    </Button>
                  )}
                </div>
                {pendingList.length === 0 ? (
                  <div className="flex items-center gap-3 rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                    {isHe ? 'אין בקשות ממתינות — הכול מטופל!' : 'No pending requests — you’re all caught up!'}
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {pendingList.map((b) => (
                      <div key={b.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-background p-4">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{venueTitleOf(b.venues)}</p>
                          <p className="text-sm text-muted-foreground">
                            {renterMap.get(b.renter_id)} · {formatDateTimeLocalized(b.start_at, locale)}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-semibold text-primary">{fmt(Number(b.total_price))}</span>
                          <div className="w-56">
                            <BookingActionButtons bookingId={b.id} locale={locale} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Upcoming bookings */}
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-base font-semibold">{isHe ? 'הזמנות קרובות' : 'Upcoming bookings'}</h2>
                  {upcomingList.length > 0 && (
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/host/bookings?status=upcoming">
                        {isHe ? 'הכל' : 'See all'}
                        <ArrowRight className="ms-1 h-4 w-4 rtl:rotate-180" />
                      </Link>
                    </Button>
                  )}
                </div>
                {upcomingList.length === 0 ? (
                  <div className="flex items-center gap-3 rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
                    <Inbox className="h-5 w-5 shrink-0" />
                    {isHe ? 'אין הזמנות מאושרות קרובות.' : 'No confirmed bookings coming up.'}
                  </div>
                ) : (
                  <div className="flex flex-col divide-y rounded-xl border bg-background">
                    {upcomingList.map((b) => (
                      <Link
                        key={b.id}
                        href={`/host/bookings/${b.id}`}
                        className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-muted/30"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium">{venueTitleOf(b.venues)}</p>
                          <p className="text-sm text-muted-foreground">
                            {renterMap.get(b.renter_id)} · {formatDateTimeLocalized(b.start_at, locale)}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <span className="font-semibold text-primary">{fmt(Number(b.total_price))}</span>
                          <ArrowRight className="h-4 w-4 text-muted-foreground rtl:rotate-180" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* Sidebar: recent reviews */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">{isHe ? 'ביקורות אחרונות' : 'Recent reviews'}</h2>
              </div>
              {recentReviews.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                  <Star className="h-6 w-6 text-muted-foreground/40" />
                  {isHe ? 'אין ביקורות עדיין.' : 'No reviews yet.'}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {recentReviews.map((r) => (
                    <div key={r.id} className="rounded-xl border bg-background p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-xs text-muted-foreground">{venueTitleOf(r.venues)}</p>
                        <div className="flex shrink-0 gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`h-3.5 w-3.5 ${s <= r.rating ? 'fill-amber-400 stroke-amber-400' : 'fill-transparent stroke-muted-foreground/30'}`}
                            />
                          ))}
                        </div>
                      </div>
                      {r.comment && (
                        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed">{r.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
