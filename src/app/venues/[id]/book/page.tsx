import { notFound, redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { BookingForm } from '@/components/booking/BookingForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { defaultLocale, formatCurrencyILS, isLocale, localeCookieName, type Locale } from '@/lib/i18n'

export default async function BookPage({ params }: { params: { id: string } }) {
  const locale: Locale = isLocale(cookies().get(localeCookieName)?.value)
    ? (cookies().get(localeCookieName)!.value as Locale)
    : defaultLocale

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [venueRes, blockedRes, bookingsRes] = await Promise.all([
    supabase
      .from('venues')
      .select('id, title, city, price_per_hour, price_per_day, host_id, status')
      .eq('id', params.id)
      .single(),
    supabase
      .from('availability')
      .select('date')
      .eq('venue_id', params.id)
      .eq('is_available', false),
    supabase
      .from('bookings')
      .select('start_at, end_at')
      .eq('venue_id', params.id)
      .in('status', ['PENDING', 'CONFIRMED']),
  ])

  if (!venueRes.data || venueRes.data.status !== 'ACTIVE') notFound()
  if (venueRes.data.host_id === user.id) redirect(`/venues/${params.id}`)

  const venue       = venueRes.data
  const blockedDates = (blockedRes.data ?? []).map((r) => r.date as string)
  const bookingRanges = (bookingsRes.data ?? []).map((b) => ({
    start: b.start_at as string,
    end:   b.end_at   as string,
  }))

  const isHe = locale === 'he'
  const fmt  = (v: number) => formatCurrencyILS(v, locale)

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <Link
        href={`/venues/${params.id}`}
        className="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {venue.title}
      </Link>

      <Card>
        <CardHeader>
          <p className="text-sm text-muted-foreground">{venue.city}</p>
          <CardTitle className="text-2xl">{isHe ? 'בחר תאריך ושעות' : 'Choose date & time'}</CardTitle>
          <div className="flex gap-4 text-sm text-muted-foreground">
            {venue.price_per_hour && <span>{fmt(Number(venue.price_per_hour))}{isHe ? '/שעה' : '/hr'}</span>}
            {venue.price_per_day  && <span>{fmt(Number(venue.price_per_day))}{isHe ? '/יום' : '/day'}</span>}
          </div>
        </CardHeader>
        <CardContent>
          <BookingForm
            venueId={venue.id}
            pricePerHour={venue.price_per_hour ? Number(venue.price_per_hour) : null}
            pricePerDay={venue.price_per_day   ? Number(venue.price_per_day)  : null}
            blockedDates={blockedDates}
            bookingRanges={bookingRanges}
            locale={locale}
          />
        </CardContent>
      </Card>
    </div>
  )
}
