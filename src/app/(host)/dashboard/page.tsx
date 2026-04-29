import Link from 'next/link'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { Building2, CalendarCheck, Clock, TrendingUp, Plus, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { defaultLocale, formatCurrencyILS, formatDateLocalized, isLocale, localeCookieName, type Locale } from '@/lib/i18n'

export default async function HostDashboardPage() {
  const locale: Locale = isLocale(cookies().get(localeCookieName)?.value)
    ? (cookies().get(localeCookieName)!.value as Locale)
    : defaultLocale

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get host's venue IDs first
  const { data: hostVenues } = await supabase
    .from('venues')
    .select('id')
    .eq('host_id', user.id)

  const venueIds = (hostVenues ?? []).map((v) => v.id)

  // Run KPI queries in parallel
  const [activeRes, pendingRes, upcomingRes, recentRes] = await Promise.all([
    supabase
      .from('venues')
      .select('id', { count: 'exact', head: true })
      .eq('host_id', user.id)
      .eq('status', 'ACTIVE'),

    venueIds.length > 0
      ? supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'PENDING')
          .in('venue_id', venueIds)
      : Promise.resolve({ count: 0 }),

    venueIds.length > 0
      ? supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'CONFIRMED')
          .gt('start_at', new Date().toISOString())
          .in('venue_id', venueIds)
      : Promise.resolve({ count: 0 }),

    venueIds.length > 0
      ? supabase
          .from('bookings')
          .select('id, status, start_at, total_price, venues(title)')
          .in('venue_id', venueIds)
          .order('created_at', { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [] }),
  ])

  const activeListings = activeRes.count ?? 0
  const pendingRequests = pendingRes.count ?? 0
  const upcomingBookings = upcomingRes.count ?? 0

  type RecentBooking = {
    id: string
    status: string
    start_at: string
    total_price: number
    venues: { title: string } | { title: string }[] | null
  }
  const recentActivity = ((recentRes.data ?? []) as RecentBooking[])

  const getVenueTitle = (v: RecentBooking['venues']) => {
    if (!v) return '—'
    return Array.isArray(v) ? (v[0]?.title ?? '—') : v.title
  }

  const isHe = locale === 'he'

  const statusColor: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-800',
    CONFIRMED: 'bg-emerald-100 text-emerald-800',
    CANCELLED: 'bg-slate-100 text-slate-700',
    COMPLETED: 'bg-blue-100 text-blue-800',
    REJECTED: 'bg-rose-100 text-rose-800',
  }

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm font-medium uppercase tracking-widest text-primary">
          {isHe ? 'לוח בקרה' : 'Dashboard'}
        </p>
        <h1 className="mt-1 text-3xl font-bold">
          {isHe ? 'ברוכים השבים' : 'Welcome back'}
        </h1>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {isHe ? 'נכסים פעילים' : 'Active listings'}
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{activeListings}</p>
            <Button variant="link" size="sm" className="mt-1 h-auto p-0 text-xs text-muted-foreground" asChild>
              <Link href="/listings">{isHe ? 'ניהול נכסים' : 'Manage listings'}</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {isHe ? 'בקשות ממתינות' : 'Pending requests'}
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{pendingRequests}</p>
            {pendingRequests > 0 && (
              <Button variant="link" size="sm" className="mt-1 h-auto p-0 text-xs text-primary" asChild>
                <Link href="/host/bookings">{isHe ? 'סקור בקשות' : 'Review requests'}</Link>
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {isHe ? 'הזמנות קרובות' : 'Upcoming bookings'}
            </CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{upcomingBookings}</p>
            <Button variant="link" size="sm" className="mt-1 h-auto p-0 text-xs text-muted-foreground" asChild>
              <Link href="/host/bookings">{isHe ? 'כל ההזמנות' : 'All bookings'}</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {isHe ? 'הכנסות' : 'Revenue'}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium text-muted-foreground">
              {isHe ? 'זמין לאחר חיבור Stripe' : 'Available after Stripe'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/listings/new">
            <Plus className="me-2 h-4 w-4" />
            {isHe ? 'הוסף נכס' : 'Add listing'}
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/host/bookings">
            {isHe ? 'הזמנות' : 'Bookings'}
            <ArrowRight className="ms-2 h-4 w-4" />
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/host/calendar">
            {isHe ? 'יומן זמינות' : 'Availability calendar'}
            <ArrowRight className="ms-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Recent activity */}
      {recentActivity.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-4 text-lg font-semibold">
            {isHe ? 'פעילות אחרונה' : 'Recent activity'}
          </h2>
          <div className="flex flex-col divide-y rounded-xl border bg-background">
            {recentActivity.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div>
                  <p className="font-medium">{getVenueTitle(booking.venues)}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDateLocalized(booking.start_at, locale)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor[booking.status] ?? ''}`}>
                    {booking.status.replace('_', ' ')}
                  </span>
                  <span className="font-semibold text-primary">
                    {formatCurrencyILS(Number(booking.total_price), locale)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
