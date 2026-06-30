import Link from 'next/link'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import {
  AlertCircle,
  Building2,
  CalendarCheck,
  Clock,
  TrendingUp,
  Plus,
  ArrowRight,
  Star,
  CheckCircle2,
  CalendarPlus,
  Inbox,
  Wallet,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  end_at?: string
  total_price: number
  renter_id: string
  venues: { title: string } | { title: string }[] | null
}

function venueTitleOf(v: BookingRow['venues']): string {
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
    .select('first_name, stripe_charges_enabled')
    .eq('id', user.id)
    .single()

  const { data: hostVenues } = await supabase
    .from('venues')
    .select('id')
    .eq('host_id', user.id)
  const venueIds = (hostVenues ?? []).map((v) => v.id)

  const nowIso = new Date().toISOString()
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
  const noRows = { data: [] as never[] }
  const noCount = { count: 0 }

  const [
    activeRes,
    pendingCountRes,
    upcomingCountRes,
    completedCountRes,
    revenueRes,
    reviewsRes,
    pendingListRes,
    upcomingListRes,
  ] = await Promise.all([
    supabase.from('venues').select('id', { count: 'exact', head: true }).eq('host_id', user.id).eq('status', 'ACTIVE'),
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
      ? supabase.from('bookings').select('total_price, start_at, status').in('venue_id', venueIds).in('status', ['CONFIRMED', 'COMPLETED'])
      : Promise.resolve(noRows),
    venueIds.length
      ? supabase.from('reviews').select('rating').in('venue_id', venueIds)
      : Promise.resolve(noRows),
    venueIds.length
      ? supabase.from('bookings').select('id, status, start_at, end_at, total_price, renter_id, venues(title)').eq('status', 'PENDING').in('venue_id', venueIds).order('created_at', { ascending: true }).limit(5)
      : Promise.resolve(noRows),
    venueIds.length
      ? supabase.from('bookings').select('id, status, start_at, total_price, renter_id, venues(title)').eq('status', 'CONFIRMED').gt('start_at', nowIso).in('venue_id', venueIds).order('start_at', { ascending: true }).limit(5)
      : Promise.resolve(noRows),
  ])

  const activeListings = activeRes.count ?? 0
  const pendingRequests = pendingCountRes.count ?? 0
  const upcomingBookings = upcomingCountRes.count ?? 0
  const completedStays = completedCountRes.count ?? 0

  const revenueRows = (revenueRes.data ?? []) as { total_price: number; start_at: string; status: string }[]
  const totalRevenue = revenueRows.reduce((sum, b) => sum + Number(b.total_price), 0)
  const monthRevenue = revenueRows
    .filter((b) => b.start_at >= monthStart)
    .reduce((sum, b) => sum + Number(b.total_price), 0)

  const ratings = (reviewsRes.data ?? []) as { rating: number }[]
  const avgRating = ratings.length
    ? Math.round((ratings.reduce((s, r) => s + r.rating, 0) / ratings.length) * 10) / 10
    : null

  const pendingList = (pendingListRes.data ?? []) as BookingRow[]
  const upcomingList = (upcomingListRes.data ?? []) as BookingRow[]

  // Renter names are a cross-user read → admin client (RLS hides other users).
  const renterIds = Array.from(new Set([...pendingList, ...upcomingList].map((b) => b.renter_id)))
  const { data: renterRows } = renterIds.length
    ? await createAdminClient().from('users').select('id, first_name, last_name').in('id', renterIds)
    : { data: [] as { id: string; first_name: string | null; last_name: string | null }[] }
  const renterMap = new Map((renterRows ?? []).map((r) => [r.id, `${r.first_name ?? ''} ${r.last_name ?? ''}`.trim() || (isHe ? 'אורח' : 'Guest')]))

  const stripeT = getDictionary(locale).stripeConnect
  const needsOnboarding = !profile?.stripe_charges_enabled
  const firstName = profile?.first_name?.trim()

  const kpis = [
    {
      label: isHe ? 'נכסים פעילים' : 'Active listings',
      value: String(activeListings),
      icon: Building2,
      href: '/host/listings',
      cta: isHe ? 'ניהול נכסים' : 'Manage',
    },
    {
      label: isHe ? 'בקשות ממתינות' : 'Pending requests',
      value: String(pendingRequests),
      icon: Clock,
      href: '/host/bookings',
      cta: isHe ? 'סקירה' : 'Review',
      highlight: pendingRequests > 0,
    },
    {
      label: isHe ? 'הזמנות קרובות' : 'Upcoming bookings',
      value: String(upcomingBookings),
      icon: CalendarCheck,
      href: '/host/bookings',
      cta: isHe ? 'כל ההזמנות' : 'View all',
    },
    {
      label: isHe ? 'סך הכנסות' : 'Total revenue',
      value: formatCurrencyILS(totalRevenue, locale),
      icon: TrendingUp,
      href: '/host/payouts',
      cta: isHe ? 'תשלומים' : 'Payouts',
    },
  ]

  const secondary = [
    { label: isHe ? 'הכנסות החודש' : 'Revenue this month', value: formatCurrencyILS(monthRevenue, locale), icon: Wallet },
    { label: isHe ? 'אירוחים שהושלמו' : 'Completed stays', value: String(completedStays), icon: CheckCircle2 },
    { label: isHe ? 'דירוג ממוצע' : 'Average rating', value: avgRating !== null ? `${avgRating.toFixed(1)} ★` : '—', icon: Star },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-primary">
            {isHe ? 'לוח בקרה' : 'Dashboard'}
          </p>
          <h1 className="mt-1 text-3xl font-bold">
            {firstName
              ? (isHe ? `שלום, ${firstName}` : `Welcome back, ${firstName}`)
              : (isHe ? 'ברוכים השבים' : 'Welcome back')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isHe ? 'סקירה כללית של פעילות האירוח שלך' : 'An overview of your hosting activity'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/host/listings/new">
              <Plus className="me-2 h-4 w-4" />
              {isHe ? 'הוסף נכס' : 'Add listing'}
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/host/calendar">
              <CalendarPlus className="me-2 h-4 w-4" />
              {isHe ? 'יומן זמינות' : 'Availability'}
            </Link>
          </Button>
        </div>
      </div>

      {needsOnboarding && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="flex-1">
            <p className="font-medium">{stripeT.blockedListing}</p>
            <p className="mt-1 text-sm opacity-90">{stripeT.explainNotStarted}</p>
          </div>
          <Button size="sm" asChild>
            <Link href="/host/payouts">{stripeT.connectNow}</Link>
          </Button>
        </div>
      )}

      {venueIds.length === 0 ? (
        /* First-run state */
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
          {/* KPI cards */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((kpi) => (
              <Card key={kpi.label} className={kpi.highlight ? 'border-primary/40 ring-1 ring-primary/20' : undefined}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.label}</CardTitle>
                  <kpi.icon className={`h-4 w-4 ${kpi.highlight ? 'text-primary' : 'text-muted-foreground'}`} />
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{kpi.value}</p>
                  <Button variant="link" size="sm" className={`mt-1 h-auto p-0 text-xs ${kpi.highlight ? 'text-primary' : 'text-muted-foreground'}`} asChild>
                    <Link href={kpi.href}>{kpi.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Secondary stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            {secondary.map((s) => (
              <div key={s.label} className="flex items-center gap-3 rounded-xl border bg-muted/20 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background">
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-lg font-semibold">{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Needs attention — pending requests with quick actions */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {isHe ? 'דורש את תשומת ליבך' : 'Needs your attention'}
              </h2>
              {pendingRequests > 0 && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/host/bookings">
                    {isHe ? 'הכל' : 'See all'}
                    <ArrowRight className="ms-1 h-4 w-4 rtl:rotate-180" />
                  </Link>
                </Button>
              )}
            </div>

            {pendingList.length === 0 ? (
              <div className="flex items-center gap-3 rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
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
                      <span className="font-semibold text-primary">{formatCurrencyILS(Number(b.total_price), locale)}</span>
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
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{isHe ? 'הזמנות קרובות' : 'Upcoming bookings'}</h2>
            </div>
            {upcomingList.length === 0 ? (
              <div className="flex items-center gap-3 rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                <Inbox className="h-5 w-5" />
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
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-semibold text-primary">{formatCurrencyILS(Number(b.total_price), locale)}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground rtl:rotate-180" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
