import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { MapPin, Users, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { VenuePhotoGallery } from '@/components/venue/VenuePhotoGallery'
import { VenueAmenityList } from '@/components/venue/VenueAmenityList'
import { BookingWidget } from '@/components/booking/BookingWidget'
import { AvailabilityCalendar } from '@/components/booking/AvailabilityCalendar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  defaultLocale,
  formatDateLocalized,
  getDictionary,
  isLocale,
  localeCookieName,
  type Locale,
} from '@/lib/i18n'
import { ShieldCheck, Star } from 'lucide-react'
import { ReviewList } from '@/components/venue/ReviewList'

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  ACTIVE:           'default',
  PENDING_APPROVAL: 'secondary',
  DRAFT:            'outline',
  SUSPENDED:        'destructive',
}

export default async function VenueDetailPage({ params }: { params: { id: string } }) {
  const locale: Locale = isLocale(cookies().get(localeCookieName)?.value)
    ? (cookies().get(localeCookieName)!.value as Locale)
    : defaultLocale

  const supabase = createClient()

  // Fetch venue + auth user in parallel
  const [venueRes, userRes] = await Promise.all([
    supabase
      .from('venues')
      .select('id, title, description, address, city, capacity, price_per_hour, price_per_day, photos, amenities, status, created_at, host_id, cancellation_policy')
      .eq('id', params.id)
      .single(),
    supabase.auth.getUser(),
  ])

  if (venueRes.error || !venueRes.data) notFound()
  const venue = venueRes.data
  const user  = userRes.data.user
  const isOwner  = user?.id === venue.host_id
  const isActive = venue.status === 'ACTIVE'

  if (!isActive && !isOwner) notFound()

  // Fetch availability data + reviews in parallel
  const [blockedRes, bookingsRes, reviewsRes] = await Promise.all([
    supabase
      .from('availability')
      .select('date')
      .eq('venue_id', venue.id)
      .eq('is_available', false),
    supabase
      .from('bookings')
      .select('start_at, end_at')
      .eq('venue_id', venue.id)
      .in('status', ['PENDING', 'CONFIRMED']),
    createAdminClient()
      .from('reviews')
      .select('id, rating, comment, created_at, users(first_name, last_name)')
      .eq('venue_id', venue.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const blockedDates = (blockedRes.data ?? []).map((r) => r.date as string)
  const bookingRanges = (bookingsRes.data ?? []).map((b) => ({
    start: b.start_at as string,
    end:   b.end_at   as string,
  }))

  const reviewList = (reviewsRes.data ?? []) as {
    id: string
    rating: number
    comment: string | null
    created_at: string
    users: { first_name: string | null; last_name: string | null } | { first_name: string | null; last_name: string | null }[] | null
  }[]
  const reviewCount = reviewList.length
  const avgRating = reviewCount > 0
    ? Math.round(reviewList.reduce((sum, r) => sum + r.rating, 0) / reviewCount * 10) / 10
    : null

  const isHe = locale === 'he'

  return (
    <div className="min-h-screen bg-background">
      {/* Back nav */}
      <div className="border-b bg-background">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
          <Link
            href="/venues"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {isHe ? 'חזרה לחיפוש' : 'Back to search'}
          </Link>
          {!isActive && (
            <Badge variant={statusVariant[venue.status] ?? 'outline'} className="ms-2">
              {venue.status.replace('_', ' ')}
            </Badge>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold md:text-4xl">{venue.title}</h1>
          <div className="mt-2 flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span>{venue.address}, {venue.city}</span>
          </div>
        </div>

        {/* Photo gallery */}
        <VenuePhotoGallery photos={venue.photos ?? []} title={venue.title} locale={locale} />

        {/* Two-column layout */}
        <div className="mt-8 grid gap-8 md:grid-cols-3">
          {/* Left — main content */}
          <div className="flex flex-col gap-8 md:col-span-2">

            {/* Key details */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 rounded-xl border bg-muted/30 px-4 py-2.5 text-sm">
                <Users className="h-4 w-4 text-primary" />
                <span>
                  {isHe ? `עד ${venue.capacity} אורחים` : `Up to ${venue.capacity} guests`}
                </span>
              </div>
              {avgRating !== null && (
                <div className="flex items-center gap-2 rounded-xl border bg-muted/30 px-4 py-2.5 text-sm">
                  <Star className="h-4 w-4 fill-amber-400 stroke-amber-400" />
                  <span className="font-medium">{avgRating.toFixed(1)}</span>
                  <span className="text-muted-foreground">
                    ({isHe ? `${reviewCount} ביקורות` : `${reviewCount} review${reviewCount !== 1 ? 's' : ''}`})
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 rounded-xl border bg-muted/30 px-4 py-2.5 text-sm text-muted-foreground">
                {isHe ? 'פורסם' : 'Listed'}: {formatDateLocalized(venue.created_at, locale)}
              </div>
            </div>

            <Separator />

            {/* Description */}
            {venue.description && (
              <>
                <div>
                  <h2 className="mb-3 text-xl font-semibold">
                    {isHe ? 'על המקום' : 'About this venue'}
                  </h2>
                  <p className="leading-7 text-muted-foreground whitespace-pre-wrap">
                    {venue.description}
                  </p>
                </div>
                <Separator />
              </>
            )}

            {/* Amenities */}
            <VenueAmenityList amenities={venue.amenities} locale={locale} />

            {/* Cancellation policy */}
            <Separator />
            {(() => {
              const cancellation = getDictionary(locale).cancellation
              const policy = (venue.cancellation_policy as 'FLEXIBLE' | 'MODERATE' | 'STRICT') ?? 'MODERATE'
              const label =
                policy === 'FLEXIBLE' ? cancellation.flexible
                : policy === 'STRICT' ? cancellation.strict
                : cancellation.moderate
              const desc =
                policy === 'FLEXIBLE' ? cancellation.flexibleDesc
                : policy === 'STRICT' ? cancellation.strictDesc
                : cancellation.moderateDesc
              return (
                <div className="flex items-start gap-3 rounded-xl border bg-muted/20 p-4">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="font-medium">{cancellation.policy}: {label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
                  </div>
                </div>
              )
            })()}

            {/* Availability calendar */}
            <Separator />
            <AvailabilityCalendar
              blockedDates={blockedDates}
              bookingRanges={bookingRanges}
              locale={locale}
            />

            {/* Reviews */}
            <Separator />
            <ReviewList
              reviews={reviewList}
              avgRating={avgRating}
              reviewCount={reviewCount}
              locale={locale}
            />
          </div>

          {/* Right — booking widget */}
          <div className="md:col-span-1">
            <BookingWidget
              venueId={venue.id}
              pricePerHour={venue.price_per_hour}
              pricePerDay={venue.price_per_day}
              isOwner={isOwner}
              isActive={isActive}
              locale={locale}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
