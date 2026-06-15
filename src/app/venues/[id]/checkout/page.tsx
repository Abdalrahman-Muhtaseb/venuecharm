import { notFound, redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { ArrowLeft, CalendarDays, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { stripe, isStripeConfigured } from '@/lib/stripe'
import { StripePaymentForm } from '@/components/booking/StripePaymentForm'
import { PriceBreakdown } from '@/components/booking/PriceBreakdown'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { defaultLocale, formatCurrencyILS, formatDateLocalized, isLocale, localeCookieName, type Locale } from '@/lib/i18n'

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { bookingId?: string }
}) {
  const locale: Locale = isLocale(cookies().get(localeCookieName)?.value)
    ? (cookies().get(localeCookieName)!.value as Locale)
    : defaultLocale

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const bookingId = searchParams.bookingId
  if (!bookingId) redirect(`/venues/${params.id}`)

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, start_at, end_at, total_price, status, notes, venues(id, title, city)')
    .eq('id', bookingId)
    .eq('renter_id', user.id)
    .single()

  if (!booking) notFound()

  const venue = Array.isArray(booking.venues) ? booking.venues[0] : booking.venues as { id: string; title: string; city: string } | null

  // Get Stripe client secret if available
  let clientSecret: string | null = null
  if (isStripeConfigured()) {
    const { data: payment } = await supabase
      .from('payments')
      .select('stripe_payment_intent_id')
      .eq('booking_id', bookingId)
      .single()

    if (payment?.stripe_payment_intent_id) {
      try {
        const pi = await stripe.paymentIntents.retrieve(payment.stripe_payment_intent_id)
        clientSecret = pi.client_secret
      } catch {
        // Stripe not available or PI not found
      }
    }
  }

  const isHe = locale === 'he'
  const startDate = new Date(booking.start_at)
  const endDate   = new Date(booking.end_at)
  const isFullDay = startDate.getHours() === 0 && endDate.getHours() === 23

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <Link
        href={`/venues/${params.id}/book`}
        className="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {isHe ? 'חזרה לטופס הזמנה' : 'Back to booking form'}
      </Link>

      <Card>
        <CardHeader>
          <p className="text-sm font-medium uppercase tracking-widest text-primary">
            {isHe ? 'סיכום הזמנה' : 'Order summary'}
          </p>
          <CardTitle className="text-2xl">{venue?.title}</CardTitle>
          <p className="text-sm text-muted-foreground">{venue?.city}</p>
        </CardHeader>

        <CardContent className="flex flex-col gap-5">
          {/* Booking details */}
          <div className="flex flex-col gap-2 rounded-xl border bg-muted/30 p-4 text-sm">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              <span>{formatDateLocalized(booking.start_at, locale)}</span>
            </div>
            {!isFullDay && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>
                  {startDate.toLocaleTimeString(locale === 'he' ? 'he-IL' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                  {' → '}
                  {endDate.toLocaleTimeString(locale === 'he' ? 'he-IL' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
            {booking.notes && (
              <p className="mt-1 text-muted-foreground italic">&ldquo;{booking.notes}&rdquo;</p>
            )}
          </div>

          <PriceBreakdown subtotal={Number(booking.total_price)} locale={locale} />

          <Separator />

          {/* Payment section */}
          <div>
            <p className="mb-4 font-semibold">
              {isHe ? 'פרטי תשלום' : 'Payment details'}
            </p>

            {booking.status !== 'PENDING' ? (
              <Badge variant={booking.status === 'CONFIRMED' ? 'default' : 'secondary'}>
                {booking.status}
              </Badge>
            ) : clientSecret ? (
              <StripePaymentForm
                clientSecret={clientSecret}
                bookingId={bookingId}
                venueId={params.id}
                locale={locale}
              />
            ) : (
              <div className="flex flex-col gap-3 rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">
                <p>
                  {isHe
                    ? 'עיבוד תשלומים עם Stripe יופעל בקרוב.'
                    : 'Stripe payment processing will be enabled soon.'}
                </p>
                <p>
                  {isHe
                    ? 'בקשת ההזמנה שלך נשלחה למארח לאישור.'
                    : 'Your booking request has been sent to the host for approval.'}
                </p>
                <Button asChild variant="outline" className="mt-1">
                  <Link href="/">{isHe ? 'חזרה לדף הבית' : 'Back to home'}</Link>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
