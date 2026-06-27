import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { geocodeAddress } from '@/lib/google-maps'
import { defaultLocale, isLocale, localeCookieName, type Locale } from '@/lib/i18n'
import { buildRatingsMap } from '@/lib/ratings'
import { buildDateRange, venueIdsFreeInRange } from '@/lib/availability-filter'
import { rankVenues, ASSUMED_EVENT_HOURS, type RfpCriteria, type ScorableVenue } from '@/lib/rfp-matching'
import { getFavoriteVenueIds } from '@/actions/favorites'
import { SearchResults } from '@/components/search/SearchResults'
import { Skeleton } from '@/components/ui/skeleton'

const PAGE_SIZE = 14

interface VenuesPageProps {
  searchParams: {
    q?: string
    lat?: string
    lng?: string
    radius?: string
    capacity?: string
    date?: string
    date_from?: string
    date_to?: string
    flex?: string
    price_max?: string
    sort?: string
    amenities?: string
    event_type?: string
    page?: string
  }
}

async function fetchVenues(searchParams: VenuesPageProps['searchParams']) {
  const supabase = createClient()
  const capacity  = parseInt(searchParams.capacity ?? '0', 10) || 0
  const priceMax  = searchParams.price_max ? parseFloat(searchParams.price_max) : null
  const sort      = searchParams.sort ?? 'distance'
  const q         = searchParams.q ?? ''
  const radiusKm  = parseFloat(searchParams.radius ?? '40')
  const amenities = searchParams.amenities?.split(',').filter(Boolean) ?? []
  const eventType = searchParams.event_type ?? ''

  let lat = parseFloat(searchParams.lat ?? '')
  let lng = parseFloat(searchParams.lng ?? '')

  if (q && (Number.isNaN(lat) || Number.isNaN(lng))) {
    try {
      const geo = await geocodeAddress(q, '')
      lat = geo.lat
      lng = geo.lng
    } catch {
      // fall through to city ilike
    }
  }

  const hasLocation     = !Number.isNaN(lat) && !Number.isNaN(lng)
  const effectiveLat    = hasLocation ? lat : 31.5
  const effectiveLng    = hasLocation ? lng : 34.85
  const effectiveRadius = hasLocation ? radiusKm : 500

  const { data } = await supabase.rpc('search_venues_nearby', {
    p_latitude:     effectiveLat,
    p_longitude:    effectiveLng,
    p_radius_km:    effectiveRadius,
    p_capacity_min: capacity,
    p_price_max:    priceMax,
  })
  let rows = (data ?? []) as VenueRow[]
  if (amenities.length > 0) {
    rows = rows.filter((v) => {
      const a = Array.isArray(v.amenities) ? v.amenities : []
      return amenities.every((am) => a.includes(am))
    })
  }

  // Event-type filter. The search RPC doesn't return event_types, so look them
  // up for the candidate rows and keep only venues that advertise the type.
  if (eventType && rows.length > 0) {
    const ids = rows.map((v) => v.id)
    const { data: etRows } = await supabase.from('venues').select('id, event_types').in('id', ids)
    const etByVenue = new Map(
      (etRows ?? []).map((r) => [
        r.id as string,
        (Array.isArray(r.event_types) ? (r.event_types as string[]) : []),
      ]),
    )
    rows = rows.filter((v) => etByVenue.get(v.id)?.includes(eventType))
  }

  // Date filter — keep venues with at least one free day in the requested range.
  const dateRange = buildDateRange(
    searchParams.date_from ?? searchParams.date,
    searchParams.date_to,
    searchParams.flex ? parseInt(searchParams.flex, 10) : 0,
  )
  if (dateRange && rows.length > 0) {
    const freeSet = await venueIdsFreeInRange(supabase, rows.map((v) => v.id), dateRange)
    rows = rows.filter((v) => freeSet.has(v.id))
  }

  if (sort === 'match') {
    const criteria: RfpCriteria = {
      capacity,
      // The search only captures a per-hour cap; treat it as the budget for an
      // assumed full-day event so daily- and hourly-priced venues compare fairly.
      budget: priceMax != null ? priceMax * ASSUMED_EVENT_HOURS : 0,
      amenities,
      eventType: 'OTHER', // general search has no event-type filter → no constraint
      lat: hasLocation ? lat : null,
      lng: hasLocation ? lng : null,
    }
    return rankRows(rows, criteria)
  }

  return sortRows(rows, sort)
}

function rankRows(rows: VenueRow[], criteria: RfpCriteria): VenueRow[] {
  const scorables: ScorableVenue[] = rows.map((v) => ({
    id: v.id,
    capacity: v.capacity,
    price_per_hour: v.price_per_hour,
    price_per_day: v.price_per_day,
    amenities: Array.isArray(v.amenities) ? (v.amenities as string[]) : [],
    distanceKm: v.distance_km ?? null,
  }))
  const scores = new Map(rankVenues(criteria, scorables).map((s) => [s.venueId, s.score]))
  return rows
    .map((v) => ({ ...v, match_score: scores.get(v.id) ?? null }))
    .sort((a, b) => (b.match_score ?? -1) - (a.match_score ?? -1))
}

type VenueRow = {
  id: string
  title: string
  address: string
  city: string
  capacity: number
  price_per_hour: number | null
  price_per_day: number | null
  photos: string[] | null
  amenities: unknown
  distance_km?: number | null
  lat: number | null
  lng: number | null
  avg_rating?: number | null
  review_count?: number | null
  match_score?: number | null
}

function sortRows(rows: VenueRow[], sort: string): VenueRow[] {
  if (sort === 'price_asc')  return [...rows].sort((a, b) => (a.price_per_hour ?? Infinity) - (b.price_per_hour ?? Infinity))
  if (sort === 'price_desc') return [...rows].sort((a, b) => (b.price_per_hour ?? 0) - (a.price_per_hour ?? 0))
  return rows
}

export default async function VenuesPage({ searchParams }: VenuesPageProps) {
  const locale: Locale = isLocale(cookies().get(localeCookieName)?.value)
    ? (cookies().get(localeCookieName)!.value as Locale)
    : defaultLocale

  // Pagination — fetch all matching rows server-side, then slice to one page
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10))
  const allVenues = await fetchVenues(searchParams)
  const totalCount = allVenues.length
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageVenues = allVenues.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  // Fetch ratings only for the visible page, not the entire result set
  const supabaseForRatings = createClient()
  const venueIds = pageVenues.map((v) => v.id)
  const { data: ratingRows } = venueIds.length > 0
    ? await supabaseForRatings.from('reviews').select('venue_id, rating').in('venue_id', venueIds)
    : { data: [] }
  const ratingsMap = buildRatingsMap(ratingRows ?? [])
  const favoritedIds = await getFavoriteVenueIds()
  const venuesWithRatings = pageVenues.map((v) => ({
    ...v,
    avg_rating: ratingsMap.get(v.id)?.avg_rating ?? null,
    review_count: ratingsMap.get(v.id)?.review_count ?? null,
  }))

  return (
    <div className="flex min-h-screen flex-col">
      {/* Main content */}
      <div
        id="venues-content"
        className="mx-auto flex w-full max-w-[1440px] flex-1 gap-0 px-4 py-5 sm:px-6 lg:px-10"
      >
        {/* Results (grid + map) */}
        <Suspense
          fallback={
            <div className="grid flex-1 grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-xl border">
                  <Skeleton className="h-44 w-full" />
                  <div className="space-y-2 p-4">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          }
        >
          <SearchResults
            venues={venuesWithRatings}
            locale={locale}
            totalCount={totalCount}
            currentPage={currentPage}
            totalPages={totalPages}
            favoritedIds={favoritedIds}
          />
        </Suspense>
      </div>
    </div>
  )
}
