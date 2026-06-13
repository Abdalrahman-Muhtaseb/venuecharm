import Link from 'next/link'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { defaultLocale, formatCurrencyILS, formatDateLocalized, isLocale, localeCookieName, type Locale } from '@/lib/i18n'

type BookingRow = {
  id: string
  start_at: string
  end_at: string
  total_price: number
  status: string
  venues: { title: string } | { title: string }[] | null
  users: { first_name: string | null; last_name: string | null; email: string } | null
}

const statusColor: Record<string, string> = {
  PENDING:   'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  CONFIRMED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  CANCELLED: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  COMPLETED: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  REJECTED:  'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
}

function getVenueTitle(v: BookingRow['venues']): string {
  if (!v) return '—'
  return Array.isArray(v) ? (v[0]?.title ?? '—') : v.title
}

function getRenterName(u: BookingRow['users']): string {
  if (!u) return '—'
  return u.first_name ? `${u.first_name} ${u.last_name ?? ''}`.trim() : u.email
}

export default async function HostBookingsPage() {
  const locale: Locale = isLocale(cookies().get(localeCookieName)?.value)
    ? (cookies().get(localeCookieName)!.value as Locale)
    : defaultLocale

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: hostVenues } = await supabase.from('venues').select('id').eq('host_id', user.id)
  const venueIds = (hostVenues ?? []).map((v) => v.id)

  const { data: allBookings } = venueIds.length > 0
    ? await supabase
        .from('bookings')
        .select('id, start_at, end_at, total_price, status, venues(title), users(first_name, last_name, email)')
        .in('venue_id', venueIds)
        .order('created_at', { ascending: false })
    : { data: [] }

  const bookings = ((allBookings ?? []) as unknown[]) as BookingRow[]
  const now = new Date().toISOString()

  const pending   = bookings.filter((b) => b.status === 'PENDING')
  const upcoming  = bookings.filter((b) => b.status === 'CONFIRMED' && b.start_at > now)
  const past      = bookings.filter((b) => !['PENDING'].includes(b.status) && (b.status !== 'CONFIRMED' || b.start_at <= now))

  const isHe = locale === 'he'
  const fmt  = (v: number) => formatCurrencyILS(v, locale)

  function BookingList({ items }: { items: BookingRow[] }) {
    if (items.length === 0) {
      return (
        <div className="rounded-xl border border-dashed py-12 text-center text-muted-foreground">
          {isHe ? 'אין הזמנות' : 'No bookings'}
        </div>
      )
    }
    return (
      <div className="flex flex-col divide-y rounded-xl border bg-background">
        {items.map((b) => (
          <Link
            key={b.id}
            href={`/host/bookings/${b.id}`}
            className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 transition hover:bg-muted/30"
          >
            <div className="min-w-0">
              <p className="font-medium truncate">{getVenueTitle(b.venues)}</p>
              <p className="text-sm text-muted-foreground">
                {getRenterName(b.users)} · {formatDateLocalized(b.start_at, locale)}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor[b.status] ?? ''}`}>
                {b.status.replace('_', ' ')}
              </span>
              <span className="font-semibold text-primary">{fmt(Number(b.total_price))}</span>
            </div>
          </Link>
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <p className="text-sm font-medium uppercase tracking-widest text-primary">
          {isHe ? 'ניהול הזמנות' : 'Manage bookings'}
        </p>
        <h1 className="mt-1 text-3xl font-bold">{isHe ? 'הזמנות' : 'Bookings'}</h1>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            {isHe ? 'ממתינות' : 'Pending'}
            {pending.length > 0 && (
              <Badge className="ms-2 h-5 rounded-full px-1.5 text-xs">{pending.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="upcoming">{isHe ? 'קרובות' : 'Upcoming'}</TabsTrigger>
          <TabsTrigger value="past">{isHe ? 'עבר' : 'Past'}</TabsTrigger>
        </TabsList>

        <TabsContent value="pending"  className="mt-4"><BookingList items={pending}  /></TabsContent>
        <TabsContent value="upcoming" className="mt-4"><BookingList items={upcoming} /></TabsContent>
        <TabsContent value="past"     className="mt-4"><BookingList items={past}     /></TabsContent>
      </Tabs>
    </div>
  )
}
