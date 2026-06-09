import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { SlidersHorizontal } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { geocodeAddress } from '@/lib/google-maps'
import { defaultLocale, isLocale, localeCookieName, type Locale } from '@/lib/i18n'
import { SearchBarAutocomplete } from '@/components/search/SearchBarAutocomplete'
import { FilterSidebar } from '@/components/search/FilterSidebar'
import { FilterPanel } from '@/components/search/FilterPanel'
import { SearchResults } from '@/components/search/SearchResults'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

interface VenuesPageProps {
  searchParams: {
    q?: string
    lat?: string
    lng?: string
    radius?: string
    capacity?: string
    price_max?: string
    sort?: string
    amenities?: string
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

  // Geocode city text server-side if no coords in URL
  if (q && (Number.isNaN(lat) || Number.isNaN(lng))) {
    try {
      const geo = await geocodeAddress(q, '')
      lat = geo.lat
      lng = geo.lng
    } catch {
      // fall through to city ilike
    }
  }

  // No coordinates: default to Israel center with 500 km radius so the RPC
  // always runs and returns real lat/lng for every venue (required for map pins).
  const effectiveLat = !Number.isNaN(lat) ? lat : 31.5
  const effectiveLng = !Number.isNaN(lng) ? lng : 34.85
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
}

function sortRows(rows: VenueRow[], sort: string): VenueRow[] {
  if (sort === 'price_asc')  return [...rows].sort((a, b) => (a.price_per_hour ?? Infinity) - (b.price_per_hour ?? Infinity))
  if (sort === 'price_desc') return [...rows].sort((a, b) => (b.price_per_hour ?? 0) - (a.price_per_hour ?? 0))
  return rows // distance already ordered by RPC; city fallback uses created_at
}

export default async function VenuesPage({ searchParams }: VenuesPageProps) {
  const locale: Locale = isLocale(cookies().get(localeCookieName)?.value)
    ? (cookies().get(localeCookieName)!.value as Locale)
    : defaultLocale

  const venues = await fetchVenues(searchParams)
  const isHe = locale === 'he'

  return (
    <div className="flex min-h-screen flex-col">
      {/* Sticky search + filter bar */}
      <div className="sticky top-16 z-30 border-b bg-background/95 px-3 py-3 backdrop-blur sm:px-4">
        <div className="mx-auto flex max-w-[1440px] items-center gap-3">
          <div className="flex-1">
            <SearchBarAutocomplete
              locale={locale}
              initialQ={searchParams.q ?? ''}
              initialCapacity={searchParams.capacity ?? ''}
            />
          </div>

          {/* Mobile filter sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 lg:hidden">
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle>{isHe ? 'סינון' : 'Filters'}</SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                <FilterPanel locale={locale} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto flex w-full max-w-[1440px] flex-1 gap-0 px-3 py-5 sm:px-4">
        {/* Desktop collapsible filter sidebar */}
        <FilterSidebar locale={locale} />

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
          <SearchResults venues={venues} locale={locale} totalCount={venues.length} />
        </Suspense>
      </div>
    </div>
  )
}
