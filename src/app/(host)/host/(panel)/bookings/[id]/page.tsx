import { notFound, redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, CalendarDays, Clock, MapPin, MessageSquare, Eye, Hash, Mail, Phone, ShieldCheck, Star, Tag } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { COMMISSION_RATE } from '@/lib/stripe'
import { BookingActionButtons } from '@/components/booking/BookingActionButtons'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { StartConversationButton } from '@/components/messaging/StartConversationButton'
import { startBookingConversation } from '@/actions/messages'
import { defaultLocale, formatCurrencyILS, formatDateLocalized, getDictionary, isLocale, localeCookieName, type Locale } from '@/lib/i18n'

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  PENDING:   'secondary',
  CONFIRMED: 'default',
  CANCELLED: 'outline',
  COMPLETED: 'default',
  REJECTED:  'destructive',
}

type VenueRel = {
  id: string
  title: string
  city: string
  address: string
  host_id: string
  photos: string[] | null
  cancellation_policy: string | null
  price_per_hour: number | null
  price_per_day: number | null
}
type RenterRel = {
  first_name: string | null
  last_name: string | null
  email: string
  phone_number: string | null
  bio: string | null
  is_verified: boolean
  created_at: string
}
type ReviewRel = { id: string; rating: number; comment: string | null; created_at: string }
type PaymentRel = { platform_fee_amount: number | null; host_payout_amount: number | null; refund_amount: number | null }

export default async function HostBookingDetailPage({ params }: { params: { id: string } }) {
  const locale: Locale = isLocale(cookies().get(localeCookieName)?.value)
    ? (cookies().get(localeCookieName)!.value as Locale)
    : defaultLocale
  const isHe = locale === 'he'
  const cancT = getDictionary(locale).cancellation

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: booking } = await supabase
    .from('bookings')
    .select(`
      id, start_at, end_at, total_price, status, notes, created_at, renter_id,
      venues(id, title, city, address, host_id, photos, cancellation_policy, price_per_hour, price_per_day)
    `)
    .eq('id', params.id)
    .single()

  if (!booking) notFound()

  const venue = Array.isArray(booking.venues) ? booking.venues[0] : (booking.venues as VenueRel | null)
  if (!venue || venue.host_id !== user.id) notFound()

  // Renter is a different user than the host viewing this page — the `users`
  // RLS only allows reading your own row, so this cross-user read needs the
  // admin client (same pattern as the dashboard's renter-name lookup).
  const [{ data: renter }, { data: review }, { data: payment }] = await Promise.all([
    createAdminClient()
      .from('users')
      .select('first_name, last_name, email, phone_number, bio, is_verified, created_at')
      .eq('id', booking.renter_id)
      .maybeSingle<RenterRel>(),
    booking.status === 'COMPLETED'
      ? supabase.from('reviews').select('id, rating, comment, created_at').eq('booking_id', booking.id).maybeSingle<ReviewRel>()
      : Promise.resolve({ data: null }),
    supabase.from('payments').select('platform_fee_amount, host_payout_amount, refund_amount').eq('booking_id', booking.id).maybeSingle<PaymentRel>(),
  ])

  const startDt = new Date(booking.start_at)
  const endDt = new Date(booking.end_at)
  const isFullDay = startDt.getHours() === 0 && endDt.getHours() === 23
  const hours = Math.round(((endDt.getTime() - startDt.getTime()) / 3600000) * 10) / 10

  const renterInitials = renter?.first_name
    ? `${renter.first_name[0]}${renter.last_name?.[0] ?? ''}`.toUpperCase()
    : (renter?.email?.[0] ?? '?').toUpperCase()
  const renterName = renter
    ? renter.first_name ? `${renter.first_name} ${renter.last_name ?? ''}`.trim() : renter.email
    : (isHe ? 'משתמש' : 'Unknown user')

  const POLICY_TEXT: Record<string, { label: string; desc: string }> = {
    FLEXIBLE: { label: cancT.flexible, desc: cancT.flexibleDesc },
    MODERATE: { label: cancT.moderate, desc: cancT.moderateDesc },
    STRICT:   { label: cancT.strict,   desc: cancT.strictDesc },
  }
  const policy = POLICY_TEXT[venue.cancellation_policy ?? ''] ?? POLICY_TEXT.MODERATE

  const fmt = (v: number) => formatCurrencyILS(v, locale)
  const subtotal = Number(booking.total_price)
  const fee = payment?.platform_fee_amount != null ? Number(payment.platform_fee_amount) : subtotal * COMMISSION_RATE
  const earnings = payment?.host_payout_amount != null ? Number(payment.host_payout_amount) : subtotal
  const renterPaid = subtotal + fee
  const refundAmount = payment?.refund_amount != null ? Number(payment.refund_amount) : 0

  let calcLabel: string | null = null
  if (isFullDay && venue.price_per_day && Math.round(Number(venue.price_per_day)) === Math.round(subtotal)) {
    calcLabel = `${fmt(Number(venue.price_per_day))} × 1 ${isHe ? 'יום' : 'day'}`
  } else if (!isFullDay && venue.price_per_hour && Math.round(Number(venue.price_per_hour) * hours) === Math.round(subtotal)) {
    calcLabel = `${fmt(Number(venue.price_per_hour))} × ${hours} ${isHe ? 'שעות' : 'hours'}`
  }

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/host/bookings"
        className="mb-6 flex w-fit items-center gap-1 rounded-sm text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        {isHe ? 'חזרה להזמנות' : 'Back to bookings'}
      </Link>

      {/* Header — compact venue identity strip */}
      <Card className="mb-5 overflow-hidden">
        <div className="flex items-center gap-4 p-4 sm:p-5">
          <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
            {venue.photos?.[0] ? (
              <Image src={venue.photos[0]} alt={venue.title} fill className="object-cover" sizes="80px" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
                <MapPin className="h-5 w-5" aria-hidden="true" />
              </div>
            )}
          </div>
          <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
            <h1 className="truncate text-xl font-bold">{venue.title}</h1>
            <Badge variant={statusVariant[booking.status] ?? 'outline'} className="shrink-0">
              {booking.status.replace('_', ' ')}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Row 1 — Venue details / Event details / Pricing, equal height so
          none of the three towers over the others. */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{isHe ? 'פרטי הנכס' : 'Venue details'}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{venue.address ? `${venue.address}, ${venue.city}` : venue.city}</span>
            </div>
            {(venue.price_per_hour || venue.price_per_day) && (
              <div className="flex items-center gap-2 tabular-nums">
                <Tag className="h-4 w-4 shrink-0 text-primary" />
                <span>
                  {[
                    venue.price_per_hour ? `${fmt(Number(venue.price_per_hour))}${isHe ? '/שעה' : '/hr'}` : null,
                    venue.price_per_day ? `${fmt(Number(venue.price_per_day))}${isHe ? '/יום' : '/day'}` : null,
                  ].filter(Boolean).join(' · ')}
                </span>
              </div>
            )}
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <span>{policy.label}</span>
                <p className="text-xs text-muted-foreground">{policy.desc}</p>
              </div>
            </div>
            <Link
              href={`/venues/${venue.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-fit items-center gap-1 rounded-sm text-xs font-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              {isHe ? 'תצוגת המודעה' : 'View listing'}
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{isHe ? 'פרטי האירוע' : 'Event details'}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
              <span>{formatDateLocalized(booking.start_at, locale)}</span>
              {isFullDay && (
                <Badge variant="outline" className="text-xs font-normal">
                  {isHe ? 'יום מלא' : 'Full day'}
                </Badge>
              )}
            </div>
            {!isFullDay && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 shrink-0 text-primary" />
                <span>
                  {startDt.toLocaleTimeString(locale === 'he' ? 'he-IL' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                  {' → '}
                  {endDt.toLocaleTimeString(locale === 'he' ? 'he-IL' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({hours} {isHe ? 'שעות' : 'hours'})
                </span>
              </div>
            )}
            {booking.notes && (
              <div className="flex items-start gap-2">
                <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p className="text-muted-foreground italic">&ldquo;{booking.notes}&rdquo;</p>
              </div>
            )}
            <div className="mt-auto flex items-center gap-1.5 pt-1 text-xs text-muted-foreground">
              <Hash className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span>{booking.id.slice(0, 8)}</span>
              <span aria-hidden="true">·</span>
              <span>{isHe ? 'התקבלה ב-' : 'Requested '}{formatDateLocalized(booking.created_at, locale)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{isHe ? 'תמחור' : 'Pricing'}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm tabular-nums">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{calcLabel ?? (isHe ? 'מחיר בסיס' : 'Listed price')}</span>
              <span>{fmt(subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>{isHe ? 'עמלת שירות (לתשלום ע"י השוכר)' : 'Service fee (paid by guest)'}</span>
              <span>+{fmt(fee)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{isHe ? 'סה"כ ששולם ע"י השוכר' : 'Total charged to guest'}</span>
              <span>{fmt(renterPaid)}</span>
            </div>
            {refundAmount > 0 && (
              <div className="flex justify-between text-xs text-rose-600 dark:text-rose-400">
                <span>{isHe ? 'הוחזר לשוכר' : 'Refunded to guest'}</span>
                <span>{fmt(refundAmount)}</span>
              </div>
            )}
            <div className="mt-1 flex items-center justify-between rounded-lg border border-primary/15 bg-primary/5 px-3 py-2.5">
              <span className="font-semibold">{isHe ? 'ההכנסה שלך' : 'Your earnings'}</span>
              <span className="text-lg font-bold text-primary">{fmt(earnings)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2 — Renter on the start side; the end side holds whichever is
          relevant (Accept/Decline while pending, the guest's review once
          completed) — the two states never overlap. */}
      <div className="mt-5 grid gap-5 lg:grid-cols-3 lg:items-start">
        <div className="lg:col-span-2">
          {/* Renter info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{isHe ? 'פרטי השוכר' : 'Renter'}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 shrink-0">
                    <AvatarFallback className="bg-primary text-base text-primary-foreground">{renterInitials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p className="truncate text-lg font-semibold">{renterName}</p>
                      {renter?.is_verified && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                          {isHe ? 'מאומת' : 'Verified'}
                        </span>
                      )}
                    </div>
                    {renter && (
                      <p className="text-xs text-muted-foreground">
                        {isHe ? 'חבר/ה מאז' : 'Member since'} {formatDateLocalized(renter.created_at, locale)}
                      </p>
                    )}
                  </div>
                </div>
                <StartConversationButton
                  action={startBookingConversation.bind(null, booking.id)}
                  label={getDictionary(locale).messages.messageRenter}
                  className="shrink-0"
                />
              </div>

              {renter && (
                <div>
                  <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {isHe ? 'יצירת קשר' : 'Contact'}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      {renter.email}
                    </span>
                    {renter.phone_number && (
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        {renter.phone_number}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {renter?.bio && (
                <div>
                  <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {isHe ? 'ביו' : 'Bio'}
                  </p>
                  <p className="text-muted-foreground">{renter.bio}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          {/* Accept / Decline while pending */}
          {booking.status === 'PENDING' && (
            <BookingActionButtons bookingId={booking.id} locale={locale} />
          )}

          {/* Review — only relevant once the stay is complete */}
          {booking.status === 'COMPLETED' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{isHe ? 'ביקורת' : 'Review'}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                {review ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-1.5">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`h-4 w-4 ${s <= review.rating ? 'fill-amber-400 stroke-amber-400' : 'fill-transparent stroke-muted-foreground/30'}`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">{formatDateLocalized(review.created_at, locale)}</span>
                    </div>
                    {review.comment && (
                      <p className="whitespace-pre-wrap leading-relaxed text-foreground/80">{review.comment.trim()}</p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Star className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {isHe ? 'השוכר עדיין לא השאיר ביקורת.' : 'The guest hasn’t left a review yet.'}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
