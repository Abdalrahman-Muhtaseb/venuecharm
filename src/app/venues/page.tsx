import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { geocodeAddress } from '@/lib/google-maps'
import { defaultLocale, isLocale, localeCookieName, type Locale } from '@/lib/i18n'
import { buildRatingsMap } from '@/lib/ratings'
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
    price_max?: string
    sort?: string
    amenities?: string
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

  const effectiveLat    = !Number.isNaN(lat) ? lat : 31.5
  const effectiveLng    = !Number.isNaN(lng) ? lng : 34.85
  const effectiveRadius = !Number.isNaN(lat) ? radiusKm : 500

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
  return sortRows(rows, sort)
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
