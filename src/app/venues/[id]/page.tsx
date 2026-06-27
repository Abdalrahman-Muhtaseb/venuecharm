import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { MapPin, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { VenuePhotoGallery } from '@/components/venue/VenuePhotoGallery'
import { VenueAmenityList } from '@/components/venue/VenueAmenityList'
import { BookingWidget } from '@/components/booking/BookingWidget'
import { AvailabilitySection } from '@/components/booking/AvailabilitySection'
import { BookingDateProvider } from '@/components/booking/BookingDateContext'
import { timeToMin } from '@/lib/availability-slots'
import { ThingsToKnow } from '@/components/venue/ThingsToKnow'
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
import { SaveVenueButton } from '@/components/venue/SaveVenueButton'
import { ShareVenueButton } from '@/components/venue/ShareVenueButton'
import { VenueLocationMap } from '@/components/venue/VenueLocationMap'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { StartConversationButton } from '@/components/messaging/StartConversationButton'
import { startVenueConversation } from '@/actions/messages'
import { geocodeAddress } from '@/lib/google-maps'

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
      .select('id, title, description, address, city, capacity, price_per_hour, price_per_day, photos, amenities, event_types, status, created_at, host_id, cancellation_policy, rules, opening_time, closing_time, buffer_minutes')
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

  let isFavorited = false
  if (user && !isOwner) {
    const { data: fav } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('venue_id', venue.id)
      .maybeSingle()
    isFavorited = !!fav
  }

  const todayKey = new Date().toISOString().slice(0, 10)

  // Fetch availability data + reviews in parallel
  const [blockedRes, bookingsRes, slotBlocksRes, reviewsRes] = await Promise.all([
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
    supabase
      .from('availability_blocks')
      .select('date, start_time')
      .eq('venue_id', venue.id)
      .gte('date', todayKey),
    createAdminClient()
      .from('reviews')
      .select('id, rating, comment, created_at, users(first_name, last_name)')
      .eq('venue_id', venue.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const { data: amenityCatalog } = await supabase
    .from('amenities')
    .select('key, label_en, label_he, category, icon')

  const blockedDates = (blockedRes.data ?? []).map((r) => r.date as string)
  const bookingRanges = (bookingsRes.data ?? []).map((b) => ({
    start: b.start_at as string,
    end:   b.end_at   as string,
  }))
  const slotBlocks = (slotBlocksRes.data ?? []).map((r) => ({
    date: r.date as string,
    startMin: timeToMin(r.start_time as string),
  }))
  const openingTime = (venue.opening_time as string | null)?.slice(0, 5) ?? '08:00'
  const closingTime = (venue.closing_time as string | null)?.slice(0, 5) ?? '23:00'
  const bufferMin = Number(venue.buffer_minutes ?? 0)

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
  const eventTypeLabels = getDictionary(locale).rfp.eventTypeOptions
  const venueEventTypes = Array.isArray(venue.event_types) ? (venue.event_types as string[]) : []

  // Resolve the venue's coordinates for the location map. Prefer the host's
  // stored pin (RPC from migration 016); fall back to geocoding the address so
  // the map still works before that migration is applied.
  let coords: { lat: number; lng: number } | null = null
  try {
    const { data: coordRows } = await supabase.rpc('get_venue_coordinates', { p_venue_id: venue.id })
    const row = Array.isArray(coordRows) ? coordRows[0] : coordRows
    if (row?.lat != null && row?.lng != null) coords = { lat: row.lat, lng: row.lng }
  } catch {
    // RPC not yet applied — fall through to geocoding
  }
  if (!coords && venue.address && venue.city) {
    try {
      const g = await geocodeAddress(venue.address, venue.city)
      coords = { lat: g.lat, lng: g.lng }
    } catch {
      // geocoding unavailable — map section will be hidden
    }
  }

  // Host profile for the "About the host" section. The users table RLS blocks
  // cross-user reads, so go through the admin client (read-only, server-only).
  const adminDb = createAdminClient()
  const [{ data: hostRow }, { count: hostListingCount }] = await Promise.all([
    adminDb
      .from('users')
      .select('first_name, last_name, avatar_url, created_at, is_verified')
      .eq('id', venue.host_id)
      .maybeSingle(),
    adminDb
      .from('venues')
      .select('*', { count: 'exact', head: true })
      .eq('host_id', venue.host_id)
      .eq('status', 'ACTIVE'),
  ])
  const host = hostRow as {
    first_name: string | null
    last_name: string | null
    avatar_url: string | null
    created_at: string
    is_verified: boolean
  } | null
  const hostName = host
    ? `${host.first_name ?? ''} ${host.last_name ?? ''}`.trim() || (isHe ? 'מארח' : 'Host')
    : ''
  const hostInitials =
    `${host?.first_name?.[0] ?? ''}${host?.last_name?.[0] ?? ''}`.toUpperCase() || '?'
  const hostSince = host ? new Date(host.created_at).getFullYear() : null

  return (
    <div className="min-h-screen bg-background">
      {!isActive && (
        <div className="border-b bg-background">
          <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
            <Badge variant={statusVariant[venue.status] ?? 'outline'}>
              {venue.status.replace('_', ' ')}
            </Badge>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Title */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold md:text-4xl">{venue.title}</h1>
            <div className="mt-2 flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              <span>{venue.address}, {venue.city}</span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ShareVenueButton title={venue.title} locale={locale} />
            {!isOwner && (
              <SaveVenueButton venueId={venue.id} initialFavorited={isFavorited} locale={locale} />
            )}
          </div>
        </div>

        {/* Photo gallery */}
        <VenuePhotoGallery photos={venue.photos ?? []} title={venue.title} locale={locale} />

        {/* Two-column: venue details + sticky booking widget.
            Order (left col): about → amenities → availability.
            Wrapped so the availability calendar and the widget share one date. */}
        <BookingDateProvider>
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

            {venueEventTypes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {venueEventTypes.map((et) => (
                  <Badge key={et} variant="secondary" className="rounded-full">
                    {eventTypeLabels[et as keyof typeof eventTypeLabels] ?? et}
                  </Badge>
                ))}
              </div>
            )}

            <Separator />

            {/* About this venue */}
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
            <VenueAmenityList
              amenities={venue.amenities}
              locale={locale}
              catalog={amenityCatalog ?? undefined}
            />

            {/* Availability — month calendar + week (time-slot) grid */}
            <Separator />
            <AvailabilitySection
              venueId={venue.id}
              blockedDates={blockedDates}
              bookingRanges={bookingRanges}
              blocks={slotBlocks}
              opening={openingTime}
              closing={closingTime}
              bufferMin={bufferMin}
              locale={locale}
            />
          </div>

          {/* Right — interactive booking widget */}
          <div className="md:col-span-1">
            <BookingWidget
              venueId={venue.id}
              pricePerHour={venue.price_per_hour}
              pricePerDay={venue.price_per_day}
              isOwner={isOwner}
              isActive={isActive}
              blockedDates={blockedDates}
              bookingRanges={bookingRanges}
              blocks={slotBlocks}
              opening={openingTime}
              closing={closingTime}
              bufferMin={bufferMin}
              locale={locale}
            />
          </div>
        </div>
        </BookingDateProvider>

        {/* Full-width sections below the widget: reviews → location → host. */}
        <div className="mt-12 flex flex-col gap-10">
          {/* Reviews */}
          <ReviewList
            reviews={reviewList}
            avgRating={avgRating}
            reviewCount={reviewCount}
            locale={locale}
          />

          {/* Location map */}
          {coords && (
            <>
              <Separator />
              <div>
                <h2 className="mb-3 text-xl font-semibold">
                  {isHe ? 'מיקום' : 'Location'}
                </h2>
                <p className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {venue.address}, {venue.city}
                </p>
                <VenueLocationMap
                  lat={coords.lat}
                  lng={coords.lng}
                  title={venue.title}
                  locale={locale}
                />
              </div>
            </>
          )}

          {/* Host */}
          {host && (
            <>
              <Separator />
              <div>
                <h2 className="mb-4 text-xl font-semibold">
                  {isHe ? 'על המארח' : 'About the host'}
                </h2>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      {host.avatar_url && <AvatarImage src={host.avatar_url} alt={hostName} />}
                      <AvatarFallback className="text-lg font-semibold text-muted-foreground">
                        {hostInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-semibold">{hostName}</p>
                        {host.is_verified && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                            {isHe ? 'מאומת' : 'Verified'}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {hostSince && (isHe ? `מארח מאז ${hostSince}` : `Host since ${hostSince}`)}
                        {hostListingCount ? (
                          <>
                            {' · '}
                            {isHe
                              ? `${hostListingCount} מקומות פעילים`
                              : `${hostListingCount} active listing${hostListingCount !== 1 ? 's' : ''}`}
                          </>
                        ) : null}
                      </p>
                    </div>
                  </div>
                  {user && !isOwner && (
                    <StartConversationButton
                      action={startVenueConversation.bind(null, venue.id)}
                      label={getDictionary(locale).messages.contactHost}
                    />
                  )}
                </div>
              </div>
            </>
          )}

          {/* Things to know — house rules beside the cancellation policy */}
          <Separator />
          <ThingsToKnow
            policy={(venue.cancellation_policy as 'FLEXIBLE' | 'MODERATE' | 'STRICT') ?? 'MODERATE'}
            rules={venue.rules as string | null}
            capacity={venue.capacity}
            locale={locale}
          />
        </div>
      </div>
    </div>
  )
}
