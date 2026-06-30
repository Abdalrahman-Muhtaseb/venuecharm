import { notFound, redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { ArrowLeft, CalendarDays, Clock, Users, MessageSquare } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { BookingActionButtons } from '@/components/booking/BookingActionButtons'
import { PriceBreakdown } from '@/components/booking/PriceBreakdown'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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

export default async function HostBookingDetailPage({ params }: { params: { id: string } }) {
  const locale: Locale = isLocale(cookies().get(localeCookieName)?.value)
    ? (cookies().get(localeCookieName)!.value as Locale)
    : defaultLocale

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: booking } = await supabase
    .from('bookings')
    .select(`
      id, start_at, end_at, total_price, status, notes,
      venues(id, title, city, host_id),
      users(first_name, last_name, email, phone_number, created_at)
    `)
    .eq('id', params.id)
    .single()

  if (!booking) notFound()

  const venue  = Array.isArray(booking.venues) ? booking.venues[0] : booking.venues as { id: string; title: string; city: string; host_id: string } | null
  const renter = Array.isArray(booking.users)  ? booking.users[0]  : booking.users  as { first_name: string | null; last_name: string | null; email: string; phone_number: string | null; created_at: string } | null

  if (!venue || venue.host_id !== user.id) notFound()

  const isHe    = locale === 'he'
  const startDt = new Date(booking.start_at)
  const endDt   = new Date(booking.end_at)
  const isFullDay = startDt.getHours() === 0 && endDt.getHours() === 23

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/host/bookings"
        className="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {isHe ? 'חזרה להזמנות' : 'Back to bookings'}
      </Link>

      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{venue.title}</h1>
        <Badge variant={statusVariant[booking.status] ?? 'outline'}>
          {booking.status.replace('_', ' ')}
        </Badge>
      </div>

      <div className="flex flex-col gap-5">
        {/* Date & Time */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{isHe ? 'פרטי האירוע' : 'Event details'}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              <span>{formatDateLocalized(booking.start_at, locale)}</span>
            </div>
            {!isFullDay && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>
                  {startDt.toLocaleTimeString(locale === 'he' ? 'he-IL' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                  {' → '}
                  {endDt.toLocaleTimeString(locale === 'he' ? 'he-IL' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
            {booking.notes && (
              <div className="flex items-start gap-2">
                <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p className="text-muted-foreground italic">&ldquo;{booking.notes}&rdquo;</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Renter info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{isHe ? 'פרטי השוכר' : 'Renter'}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            {renter ? (
              <>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{renter.first_name ? `${renter.first_name} ${renter.last_name ?? ''}`.trim() : renter.email}</span>
                </div>
                <p className="text-muted-foreground">{renter.email}</p>
                {renter.phone_number && <p className="text-muted-foreground">{renter.phone_number}</p>}
                <p className="text-muted-foreground text-xs">
                  {isHe ? 'חבר מאז' : 'Member since'}: {formatDateLocalized(renter.created_at, locale)}
                </p>
              </>
            ) : <p className="text-muted-foreground">—</p>}
            <StartConversationButton
              action={startBookingConversation.bind(null, booking.id)}
              label={getDictionary(locale).messages.messageRenter}
              className="mt-1 w-full sm:w-auto"
            />
          </CardContent>
        </Card>

        {/* Price */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{isHe ? 'תמחור' : 'Pricing'}</CardTitle>
          </CardHeader>
          <CardContent>
            <PriceBreakdown subtotal={Number(booking.total_price)} locale={locale} />
          </CardContent>
        </Card>

        {/* Accept / Decline */}
        {booking.status === 'PENDING' && (
          <BookingActionButtons bookingId={booking.id} locale={locale} />
        )}
      </div>
    </div>
  )
}
