import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { geocodeAddress } from '@/lib/google-maps'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const q         = searchParams.get('q') ?? ''
  const lat       = parseFloat(searchParams.get('lat') ?? '')
  const lng       = parseFloat(searchParams.get('lng') ?? '')
  const radius    = parseFloat(searchParams.get('radius') ?? '40')
  const capacity  = parseInt(searchParams.get('capacity') ?? '0', 10)
  const priceMax  = searchParams.get('price_max') ? parseFloat(searchParams.get('price_max')!) : null
  const sort      = searchParams.get('sort') ?? 'distance'

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

    const sorted = applySorting(data ?? [], sort)
    return Response.json({ venues: sorted })
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
        return Response.json({ venues: applySorting(data, sort) })
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

    const withDistance = (data ?? []).map((v) => ({ ...v, distance_km: null }))
    return Response.json({ venues: applySorting(withDistance, sort) })
  }

  // --- No query: return latest active venues ---
  const { data, error } = await supabase
    .from('venues')
    .select('id, title, address, city, capacity, price_per_hour, price_per_day, photos, amenities')
    .eq('status', 'ACTIVE')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ venues: (data ?? []).map((v) => ({ ...v, distance_km: null })) })
}

type VenueRow = {
  distance_km?: number | null
  price_per_hour?: number | null
  price_per_day?: number | null
  [key: string]: unknown
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
