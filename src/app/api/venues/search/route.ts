import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { geocodeAddress } from '@/lib/google-maps'
import { buildRatingsMap } from '@/lib/ratings'
import { buildDateRange, venueIdsFreeInRange } from '@/lib/availability-filter'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const q         = searchParams.get('q') ?? ''
  const lat       = parseFloat(searchParams.get('lat') ?? '')
  const lng       = parseFloat(searchParams.get('lng') ?? '')
  const radius    = parseFloat(searchParams.get('radius') ?? '40')
  const capacity  = parseInt(searchParams.get('capacity') ?? '0', 10)
  const priceMax  = searchParams.get('price_max') ? parseFloat(searchParams.get('price_max')!) : null
  const sort      = searchParams.get('sort') ?? 'distance'
  const amenities = searchParams.get('amenities')?.split(',').filter(Boolean) ?? []
  const eventType = searchParams.get('event_type') ?? ''
  const dateRange = buildDateRange(
    searchParams.get('date_from') ?? searchParams.get('date'),
    searchParams.get('date_to'),
    searchParams.get('flex') ? parseInt(searchParams.get('flex')!, 10) : 0,
  )

  const supabase = createClient()

  // --- Geo search via PostGIS RPC ---
  const hasCoords = !Number.isNaN(lat) && !Number.isNaN(lng)

  if (hasCoords) {
    const { data, error } = await supabase.rpc('search_venues_nearby', {
      p_latitude:     lat,
      p_longitude:    lng,
      p_radius_km:    radius,
      p_capacity_min: capacity || 0,
      p_price_max:    priceMax,
    })

    if (error) return Response.json({ error: error.message }, { status: 500 })

    const filtered = await filterRows(supabase, data ?? [], amenities, eventType, dateRange)
    const sorted = applySorting(filtered, sort)
    return Response.json({ venues: await withRatings(supabase, sorted) })
  }

  // --- Text/city fallback (no coords provided) ---
  if (q) {
    // Try geocoding server-side first
    try {
      const geo = await geocodeAddress(q, '')
      const { data, error } = await supabase.rpc('search_venues_nearby', {
        p_latitude:     geo.lat,
        p_longitude:    geo.lng,
        p_radius_km:    radius,
        p_capacity_min: capacity || 0,
        p_price_max:    priceMax,
      })
      if (!error && data?.length) {
        const sorted = applySorting(data, sort)
        return Response.json({ venues: await withRatings(supabase, sorted) })
      }
    } catch {
      // fall through to city-name filter
    }

    // City name ilike fallback
    let query = supabase
      .from('venues')
      .select('id, title, address, city, capacity, price_per_hour, price_per_day, photos, amenities')
      .eq('status', 'ACTIVE')
      .ilike('city', `%${q}%`)

    if (capacity > 0) query = query.gte('capacity', capacity)
    if (priceMax)      query = query.lte('price_per_hour', priceMax)

    const { data, error } = await query.limit(100)
    if (error) return Response.json({ error: error.message }, { status: 500 })

    const withDistance = (data ?? []).map((v) => ({ ...v, distance_km: null, lat: null, lng: null }))
    const sorted = applySorting(withDistance, sort)
    return Response.json({ venues: await withRatings(supabase, sorted) })
  }

  // --- No query and no coords: use Israel center so all venues get real lat/lng ---
  const { data, error } = await supabase.rpc('search_venues_nearby', {
    p_latitude:     31.5,
    p_longitude:    34.85,
    p_radius_km:    500,
    p_capacity_min: capacity || 0,
    p_price_max:    priceMax,
  })
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ venues: await withRatings(supabase, applySorting(data ?? [], sort)) })
}

type VenueRow = {
  id?: string
  distance_km?: number | null
  price_per_hour?: number | null
  price_per_day?: number | null
  avg_rating?: number | null
  review_count?: number | null
  [key: string]: unknown
}

// Apply the in-memory amenity filter and the event-type filter (looked up for
// the candidate rows, since the search RPC doesn't return event_types). Mirrors
// the server-side filtering on /venues so map-drag results stay consistent.
async function filterRows(
  supabase: ReturnType<typeof createClient>,
  venues: VenueRow[],
  amenities: string[],
  eventType: string,
  dateRange: ReturnType<typeof buildDateRange>,
): Promise<VenueRow[]> {
  let out = venues
  if (amenities.length > 0) {
    out = out.filter((v) => {
      const a = Array.isArray(v.amenities) ? (v.amenities as string[]) : []
      return amenities.every((am) => a.includes(am))
    })
  }
  if (eventType && out.length > 0) {
    const ids = out.map((v) => v.id).filter((id): id is string => typeof id === 'string')
    if (ids.length > 0) {
      const { data: etRows } = await supabase.from('venues').select('id, event_types').in('id', ids)
      const etByVenue = new Map(
        (etRows ?? []).map((r) => [
          r.id as string,
          Array.isArray(r.event_types) ? (r.event_types as string[]) : [],
        ]),
      )
      out = out.filter((v) => typeof v.id === 'string' && (etByVenue.get(v.id)?.includes(eventType) ?? false))
    }
  }
  if (dateRange && out.length > 0) {
    const ids = out.map((v) => v.id).filter((id): id is string => typeof id === 'string')
    const freeSet = await venueIdsFreeInRange(supabase, ids, dateRange)
    out = out.filter((v) => typeof v.id === 'string' && freeSet.has(v.id))
  }
  return out
}

async function withRatings(supabase: ReturnType<typeof createClient>, venues: VenueRow[]): Promise<VenueRow[]> {
  const ids = venues.map((v) => v.id).filter((id): id is string => typeof id === 'string')
  if (ids.length === 0) return venues
  const { data } = await supabase.from('reviews').select('venue_id, rating').in('venue_id', ids)
  const map = buildRatingsMap((data ?? []) as { venue_id: string; rating: number }[])
  return venues.map((v) => ({
    ...v,
    avg_rating: v.id ? (map.get(v.id)?.avg_rating ?? null) : null,
    review_count: v.id ? (map.get(v.id)?.review_count ?? null) : null,
  }))
}

function applySorting(venues: VenueRow[], sort: string): VenueRow[] {
  switch (sort) {
    case 'price_asc':
      return [...venues].sort((a, b) => (a.price_per_hour ?? Infinity) - (b.price_per_hour ?? Infinity))
    case 'price_desc':
      return [...venues].sort((a, b) => (b.price_per_hour ?? 0) - (a.price_per_hour ?? 0))
    case 'distance':
    default:
      return [...venues].sort((a, b) => (a.distance_km ?? 9999) - (b.distance_km ?? 9999))
  }
}
