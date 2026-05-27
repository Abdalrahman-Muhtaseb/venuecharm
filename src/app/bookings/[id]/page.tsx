import Link from 'next/link'
import Image from 'next/image'
import { notFound, redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { ArrowLeft, MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CancelBookingButton } from '@/components/booking/CancelBookingButton'
import { refundPercent } from '@/lib/cancellation'
import { toChargeAmount } from '@/lib/stripe'
import type { CancellationPolicy } from '@/types/venue'
import {
  defaultLocale,
  formatCurrencyILS,
  formatDateLocalized,
  getDictionary,
  isLocale,
  localeCookieName,
  type Locale,
} from '@/lib/i18n'

type VenueShape = {
  id: string
  title: string
  city: string
  address: string
  photos: string[] | null
  cancellation_policy?: CancellationPolicy
}

function getVenue(v: VenueShape | VenueShape[] | null): VenueShape | null {
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

export default async function RenterBookingDetail({ params }: { params: { id: string } }) {
  const locale: Locale = isLocale(cookies().get(localeCookieName)?.value)
    ? (cookies().get(localeCookieName)!.value as Locale)
    : defaultLocale

  const t = getDictionary(locale).renterBookings
  const isHe = locale === 'he'
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: booking, error } = await supabase
    .from('bookings')
    .select('id, renter_id, start_at, end_at, total_price, status, notes, created_at, cancellation_deadline, venues(id, title, city, address, photos, cancellation_policy)')
    .eq('id', params.id)
    .single()

  if (error || !booking || booking.renter_id !== user.id) notFound()

  const venue = getVenue(booking.venues as unknown as VenueShape | VenueShape[] | null)
  const cancellation = getDictionary(locale).cancellation
  const canCancel = booking.status === 'PENDING' || booking.status === 'CONFIRMED'

  let refundPreview: { label: string; amount: number; kind: 'full' | 'partial' | 'none' } | null = null
  if (canCancel && venue) {
    const policy = (venue.cancellation_policy ?? 'MODERATE') as CancellationPolicy
    const pct = refundPercent(policy, new Date(), new Date(booking.start_at))
    const grossAgorot = toChargeAmount(Number(booking.total_price))
    const amount = Math.round(grossAgorot * pct) / 100
    const kind: 'full' | 'partial' | 'none' = pct >= 1 ? 'full' : pct > 0 ? 'partial' : 'none'
    const label = kind === 'full' ? cancellation.fullRefund : kind === 'partial' ? cancellation.partialRefund : cancellation.noRefund
    refundPreview = { label, amount, kind }
  }

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

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <Link href="/bookings" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          {t.backToBookings}
        </Link>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass[booking.status] ?? ''}`}>
          {statusLabel(booking.status)}
        </span>
      </div>

      <h1 className="text-3xl font-bold md:text-4xl">{t.bookingDetail}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {isHe ? 'נוצרה ב-' : 'Created '}{formatDateLocalized(booking.created_at, locale)}
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          {venue && (
            <Link
              href={`/venues/${venue.id}`}
              className="flex gap-4 rounded-xl border bg-background p-4 transition hover:bg-muted/30"
            >
              {venue.photos?.[0] ? (
                <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-md bg-muted">
                  <Image src={venue.photos[0]} alt={venue.title} fill className="object-cover" sizes="128px" />
                </div>
              ) : (
                <div className="h-24 w-32 shrink-0 rounded-md bg-muted" />
              )}
              <div className="min-w-0">
                <p className="text-lg font-semibold truncate">{venue.title}</p>
                <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {venue.address}, {venue.city}
                </p>
                <p className="mt-2 text-sm text-primary">{t.viewVenue}</p>
              </div>
            </Link>
          )}

          {booking.notes && (
            <section className="rounded-xl border bg-background p-5">
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                {isHe ? 'הערות' : 'Notes'}
              </h3>
              <p className="whitespace-pre-line text-sm">{booking.notes}</p>
            </section>
          )}
        </div>

        <aside className="space-y-4 rounded-xl border bg-background p-5">
          <h3 className="text-lg font-semibold">{isHe ? 'פרטי ההזמנה' : 'Booking details'}</h3>
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{t.startDate}</p>
            <p className="text-sm font-medium">{formatDateLocalized(booking.start_at, locale)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{t.endDate}</p>
            <p className="text-sm font-medium">{formatDateLocalized(booking.end_at, locale)}</p>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{t.totalPrice}</p>
            <p className="text-lg font-bold text-primary">{formatCurrencyILS(Number(booking.total_price), locale)}</p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{t.bookingStatus}</p>
            <Badge variant="outline">{statusLabel(booking.status)}</Badge>
          </div>

          {canCancel && (
            <>
              <Separator />
              {refundPreview && (
                <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    {cancellation.refundPreviewTitle}
                  </p>
                  <p className="mt-1 font-medium">
                    {refundPreview.label}
                    {refundPreview.kind !== 'none' && (
                      <span className="ms-2 font-semibold text-primary">
                        {formatCurrencyILS(refundPreview.amount, locale)}
                      </span>
                    )}
                  </p>
                </div>
              )}
              <CancelBookingButton bookingId={booking.id} locale={locale} />
            </>
          )}
        </aside>
      </div>
    </div>
  )
}
