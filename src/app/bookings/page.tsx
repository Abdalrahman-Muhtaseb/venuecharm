import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  defaultLocale,
  formatCurrencyILS,
  formatDateLocalized,
  getDictionary,
  isLocale,
  localeCookieName,
  type Locale,
} from '@/lib/i18n'

type BookingRow = {
  id: string
  start_at: string
  end_at: string
  total_price: number
  status: string
  venues: { id: string; title: string; city: string; photos: string[] | null } | { id: string; title: string; city: string; photos: string[] | null }[] | null
}

function getVenue(v: BookingRow['venues']) {
  if (!v) return null
  return Array.isArray(v) ? v[0] ?? null : v
}

const statusBadgeClass: Record<string, string> = {
  PENDING:   'bg-amber-100 text-amber-800',
  CONFIRMED: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-slate-100 text-slate-700',
  COMPLETED: 'bg-blue-100 text-blue-800',
  REJECTED:  'bg-rose-100 text-rose-800',
}

export default async function RenterBookingsPage() {
  const locale: Locale = isLocale(cookies().get(localeCookieName)?.value)
    ? (cookies().get(localeCookieName)!.value as Locale)
    : defaultLocale

  const t = getDictionary(locale).renterBookings
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('bookings')
    .select('id, start_at, end_at, total_price, status, venues(id, title, city, photos)')
    .eq('renter_id', user.id)
    .order('created_at', { ascending: false })

  const bookings = ((data ?? []) as unknown[]) as BookingRow[]
  const now = new Date().toISOString()

  const pending  = bookings.filter((b) => b.status === 'PENDING')
  const upcoming = bookings.filter((b) => b.status === 'CONFIRMED' && b.start_at > now)
  const past     = bookings.filter((b) => !['PENDING'].includes(b.status) && (b.status !== 'CONFIRMED' || b.start_at <= now))

  const statusLabel = (s: string) => {
    switch (s) {
      case 'PENDING':   return t.statusPending
      case 'CONFIRMED': return t.statusConfirmed
      case 'CANCELLED': return t.statusCancelled
      case 'COMPLETED': return t.statusCompleted
      case 'REJECTED':  return t.statusRejected
      default:          return s
    }
  }

  function List({ items }: { items: BookingRow[] }) {
    if (items.length === 0) {
      return (
        <div className="rounded-xl border border-dashed py-12 text-center text-muted-foreground">
          {t.empty}
        </div>
      )
    }
    return (
      <div className="flex flex-col divide-y rounded-xl border bg-background">
        {items.map((b) => {
          const venue = getVenue(b.venues)
          return (
            <Link
              key={b.id}
              href={`/bookings/${b.id}`}
              className="flex flex-wrap items-center gap-4 px-5 py-4 transition hover:bg-muted/30"
            >
              {venue?.photos?.[0] ? (
                <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                  <Image src={venue.photos[0]} alt={venue.title} fill className="object-cover" sizes="80px" />
                </div>
              ) : (
                <div className="h-14 w-20 shrink-0 rounded-md bg-muted" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{venue?.title ?? '—'}</p>
                <p className="text-sm text-muted-foreground">
                  {venue?.city ?? ''} · {formatDateLocalized(b.start_at, locale)}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass[b.status] ?? ''}`}>
                  {statusLabel(b.status)}
                </span>
                <span className="font-semibold text-primary">{formatCurrencyILS(Number(b.total_price), locale)}</span>
              </div>
            </Link>
          )
        })}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <p className="text-sm font-medium uppercase tracking-widest text-primary">{t.kicker}</p>
        <h1 className="mt-1 text-3xl font-bold">{t.title}</h1>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            {t.pending}
            {pending.length > 0 && (
              <Badge className="ms-2 h-5 rounded-full px-1.5 text-xs">{pending.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="upcoming">{t.upcoming}</TabsTrigger>
          <TabsTrigger value="past">{t.past}</TabsTrigger>
        </TabsList>

        <TabsContent value="pending"  className="mt-4"><List items={pending}  /></TabsContent>
        <TabsContent value="upcoming" className="mt-4"><List items={upcoming} /></TabsContent>
        <TabsContent value="past"     className="mt-4"><List items={past}     /></TabsContent>
      </Tabs>
    </div>
  )
}
