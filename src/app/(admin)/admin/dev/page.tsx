import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatCurrencyILS, formatDateLocalized } from '@/lib/i18n'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { UserRoleButton } from '@/components/admin/UserRoleButton'
import { AdminCancelBookingButton } from '@/components/admin/AdminCancelBookingButton'
import { SeedDataPanel } from '@/components/admin/SeedDataPanel'
import { DangerZonePanel } from '@/components/admin/DangerZonePanel'
import { BackfillPaymentsPanel } from '@/components/admin/BackfillPaymentsPanel'
import { MonthlyBarChart } from '@/components/admin/MonthlyBarChart'
import { monthlyBuckets, rankVenuesByBookings } from '@/lib/admin-analytics'
import { Users, Building2, CalendarCheck, BadgeDollarSign, Trophy, TrendingUp, UserPlus } from 'lucide-react'

const BOOKING_STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  PENDING:   'secondary',
  CONFIRMED: 'default',
  CANCELLED: 'destructive',
  REJECTED:  'destructive',
  COMPLETED: 'outline',
}


export default async function AdminDevPage() {
  const db = createAdminClient()

  // ── Stats ─────────────────────────────────────────────────────────────────
  const [
    { count: totalUsers },
    { data: usersByRole },
    { data: venuesByStatus },
    { count: totalBookings },
    { data: bookingsByStatus },
    { data: revenueData },
  ] = await Promise.all([
    db.from('users').select('*', { count: 'exact', head: true }),
    db.from('users').select('role').then(({ data }) => ({
      data: (data ?? []).reduce<Record<string, number>>((acc, u) => {
        acc[u.role] = (acc[u.role] ?? 0) + 1
        return acc
      }, {}),
    })),
    db.from('venues').select('status').then(({ data }) => ({
      data: (data ?? []).reduce<Record<string, number>>((acc, v) => {
        acc[v.status] = (acc[v.status] ?? 0) + 1
        return acc
      }, {}),
    })),
    db.from('bookings').select('*', { count: 'exact', head: true }),
    db.from('bookings').select('status').then(({ data }) => ({
      data: (data ?? []).reduce<Record<string, number>>((acc, b) => {
        acc[b.status] = (acc[b.status] ?? 0) + 1
        return acc
      }, {}),
    })),
    db.from('bookings')
      .select('total_price')
      .in('status', ['CONFIRMED', 'COMPLETED'])
      .then(({ data }) => ({
        data: (data ?? []).reduce((sum, b) => sum + Number(b.total_price ?? 0), 0),
      })),
  ])

  // ── Users ─────────────────────────────────────────────────────────────────
  const { data: usersRaw } = await db
    .from('users')
    .select('id, email, first_name, last_name, role, is_verified, stripe_charges_enabled, created_at')
    .order('created_at', { ascending: false })
    .limit(200)
  const users = (usersRaw ?? []) as {
    id: string
    email: string
    first_name: string | null
    last_name: string | null
    role: string
    is_verified: boolean
    stripe_charges_enabled: boolean
    created_at: string
  }[]

  // ── Bookings ──────────────────────────────────────────────────────────────
  const { data: bookingsRaw } = await db
    .from('bookings')
    .select('id, start_at, end_at, total_price, status, created_at, venues(title), users:renter_id(first_name, last_name, email)')
    .order('created_at', { ascending: false })
    .limit(100)
  type BookingRow = {
    id: string
    start_at: string
    end_at: string
    total_price: number
    status: string
    created_at: string
    venues: { title: string } | { title: string }[] | null
    users: { first_name: string | null; last_name: string | null; email: string } | { first_name: string | null; last_name: string | null; email: string }[] | null
  }
  const bookings = ((bookingsRaw ?? []) as unknown[]) as BookingRow[]

  function venueTitle(v: BookingRow['venues']) {
    if (!v) return '—'
    return Array.isArray(v) ? (v[0]?.title ?? '—') : v.title
  }
  function renterName(u: BookingRow['users']) {
    if (!u) return '—'
    const p = Array.isArray(u) ? u[0] : u
    if (!p) return '—'
    return p.first_name ? `${p.first_name} ${p.last_name ?? ''}`.trim() : p.email
  }

  const revenue = typeof revenueData === 'number' ? revenueData : 0

  // ── Analytics ───────────────────────────────────────────────────────────
  // Full scans (small dataset) — Supabase JS can't GROUP BY, so roll up in memory.
  const [{ data: allBookingRows }, { data: allUserRows }] = await Promise.all([
    db.from('bookings').select('venue_id, total_price, status, created_at'),
    db.from('users').select('created_at'),
  ])
  const bookingRows = (allBookingRows ?? []) as {
    venue_id: string
    total_price: number | string | null
    status: string
    created_at: string
  }[]

  const gmvByMonth = monthlyBuckets(
    bookingRows
      .filter((b) => b.status === 'CONFIRMED' || b.status === 'COMPLETED')
      .map((b) => ({ date: b.created_at, value: Number(b.total_price ?? 0) })),
    12,
  )
  const registrationsByMonth = monthlyBuckets(
    (allUserRows ?? []).map((u) => ({ date: u.created_at as string, value: 1 })),
    12,
  )

  const topVenueRanking = rankVenuesByBookings(bookingRows, 10)
  const { data: topVenueTitles } = topVenueRanking.length > 0
    ? await db.from('venues').select('id, title').in('id', topVenueRanking.map((v) => v.venueId))
    : { data: [] }
  const titleById = new Map((topVenueTitles ?? []).map((v) => [v.id as string, v.title as string]))

  return (
    <div>
      <div className="mb-6">
        <p className="text-sm font-medium uppercase tracking-widest text-primary">Admin</p>
        <h1 className="mt-1 text-3xl font-bold">Dev Tools</h1>
      </div>

      <Tabs defaultValue="stats">
        <TabsList className="mb-6">
          <TabsTrigger value="stats">Stats</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="users">
            Users
            <Badge className="ms-2 h-5 rounded-full px-1.5 text-xs">{totalUsers ?? 0}</Badge>
          </TabsTrigger>
          <TabsTrigger value="bookings">
            Bookings
            <Badge className="ms-2 h-5 rounded-full px-1.5 text-xs">{totalBookings ?? 0}</Badge>
          </TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
        </TabsList>

        {/* ── Stats ─────────────────────────────────────────────────────── */}
        <TabsContent value="stats" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{totalUsers ?? 0}</p>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  {Object.entries(usersByRole ?? {}).map(([role, count]) => (
                    <span key={role}>{role}: <span className="font-medium text-foreground">{count}</span></span>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Venues</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {Object.values(venuesByStatus ?? {}).reduce((s, n) => s + n, 0)}
                </p>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  {Object.entries(venuesByStatus ?? {}).map(([status, count]) => (
                    <span key={status}>{status.replace('_', ' ')}: <span className="font-medium text-foreground">{count}</span></span>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Bookings</CardTitle>
                <CalendarCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{totalBookings ?? 0}</p>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  {Object.entries(bookingsByStatus ?? {}).map(([status, count]) => (
                    <span key={status}>{status}: <span className="font-medium text-foreground">{count}</span></span>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Revenue (confirmed)</CardTitle>
                <BadgeDollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{formatCurrencyILS(revenue, 'he')}</p>
                <p className="mt-2 text-xs text-muted-foreground">From confirmed + completed bookings</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Analytics ─────────────────────────────────────────────────── */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Revenue over time (GMV, last 12 months)
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <MonthlyBarChart
                  buckets={gmvByMonth}
                  formatValue={(v) => formatCurrencyILS(v, 'he')}
                />
                <p className="mt-3 text-xs text-muted-foreground">
                  Confirmed + completed bookings, by month requested.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  New registrations (last 12 months)
                </CardTitle>
                <UserPlus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <MonthlyBarChart
                  buckets={registrationsByMonth}
                  barClassName="bg-emerald-500"
                />
                <p className="mt-3 text-xs text-muted-foreground">
                  Users created per month.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Top venues by bookings
              </CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="ps-6 w-10">#</TableHead>
                    <TableHead>Venue</TableHead>
                    <TableHead className="text-end">Bookings</TableHead>
                    <TableHead className="pe-6 text-end">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topVenueRanking.map((v, i) => (
                    <TableRow key={v.venueId}>
                      <TableCell className="ps-6 font-medium text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-medium">
                        <Link href={`/venues/${v.venueId}`} className="hover:underline">
                          {titleById.get(v.venueId) ?? '—'}
                        </Link>
                      </TableCell>
                      <TableCell className="text-end">{v.bookings}</TableCell>
                      <TableCell className="pe-6 text-end">{formatCurrencyILS(v.revenue, 'he')}</TableCell>
                    </TableRow>
                  ))}
                  {topVenueRanking.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                        No confirmed bookings yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Users ─────────────────────────────────────────────────────── */}
        <TabsContent value="users">
          <div className="rounded-xl border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Stripe</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-end">Role / Verified</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">
                      {u.first_name ? `${u.first_name} ${u.last_name ?? ''}`.trim() : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      {u.role === 'HOST' ? (
                        <Badge variant={u.stripe_charges_enabled ? 'default' : 'outline'} className="text-xs">
                          {u.stripe_charges_enabled ? 'Connected' : 'Not connected'}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateLocalized(u.created_at, 'en')}
                    </TableCell>
                    <TableCell className="text-end">
                      <UserRoleButton userId={u.id} currentRole={u.role} isVerified={u.is_verified} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ── Bookings ──────────────────────────────────────────────────── */}
        <TabsContent value="bookings">
          <div className="rounded-xl border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Venue</TableHead>
                  <TableHead>Renter</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-end">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="max-w-[180px] truncate font-medium">
                      <Link href={`/venues/${b.id}`} className="hover:underline">
                        {venueTitle(b.venues)}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{renterName(b.users)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDateLocalized(b.start_at, 'en')} → {formatDateLocalized(b.end_at, 'en')}
                    </TableCell>
                    <TableCell className="text-sm">{formatCurrencyILS(Number(b.total_price), 'he')}</TableCell>
                    <TableCell>
                      <Badge variant={BOOKING_STATUS_VARIANT[b.status] ?? 'outline'} className="text-xs">
                        {b.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-end">
                      <AdminCancelBookingButton bookingId={b.id} status={b.status} />
                    </TableCell>
                  </TableRow>
                ))}
                {bookings.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                      No bookings yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ── Tools ─────────────────────────────────────────────────────── */}
        <TabsContent value="tools" className="space-y-8">
          <section>
            <h2 className="mb-3 text-base font-semibold">Seed Data</h2>
            <SeedDataPanel />
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold">Stripe Test Helpers</h2>
            <BackfillPaymentsPanel />
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-destructive">Danger Zone</h2>
            <DangerZonePanel />
          </section>
        </TabsContent>
      </Tabs>
    </div>
  )
}
