'use server'

import { createClient } from '@/lib/supabase/server'
import { geocodeAddress } from '@/lib/google-maps'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createRfpSchema } from '@/types/rfp'
import { rankVenues, type RfpCriteria, type ScorableVenue } from '@/lib/rfp-matching'

const MAX_MATCHES = 20
// Generous radius so the distance lookup covers all of Israel; scoring (not this
// filter) decides how strongly distance matters.
const MATCH_RADIUS_KM = 500

/** Score every ACTIVE venue against the criteria and persist the top matches. */
async function generateMatches(
  supabase: SupabaseClient,
  rfpId: string,
  criteria: RfpCriteria,
) {
  const { data: venues } = await supabase
    .from('venues')
    .select('id, capacity, price_per_hour, price_per_day, amenities, event_types')
    .eq('status', 'ACTIVE')

  // When the RFP has a location, fetch each venue's distance from it via PostGIS.
  const distanceMap = new Map<string, number>()
  if (criteria.lat != null && criteria.lng != null) {
    const { data: near } = await supabase.rpc('search_venues_nearby', {
      p_latitude: criteria.lat,
      p_longitude: criteria.lng,
      p_radius_km: MATCH_RADIUS_KM,
      p_capacity_min: 0,
      p_price_max: null,
      p_limit: 1000,
      p_offset: 0,
    })
    for (const r of (near ?? []) as { id: string; distance_km: number }[]) {
      distanceMap.set(r.id, Number(r.distance_km))
    }
  }

  const scorable: ScorableVenue[] = (venues ?? []).map((v) => ({
    id: v.id as string,
    capacity: Number(v.capacity),
    price_per_hour: v.price_per_hour != null ? Number(v.price_per_hour) : null,
    price_per_day: v.price_per_day != null ? Number(v.price_per_day) : null,
    amenities: Array.isArray(v.amenities) ? (v.amenities as string[]) : [],
    event_types: Array.isArray(v.event_types) ? (v.event_types as string[]) : [],
    distanceKm: distanceMap.get(v.id as string) ?? null,
  }))

  const ranked = rankVenues(criteria, scorable, MAX_MATCHES)

  // Always rebuild from scratch so re-runs stay consistent.
  await supabase.from('rfp_matches').delete().eq('rfp_id', rfpId)
  if (ranked.length === 0) return

  const { error } = await supabase
    .from('rfp_matches')
    .insert(ranked.map((r) => ({ rfp_id: rfpId, venue_id: r.venueId, score: r.score })))

  if (error) throw new Error(error.message)
}

export async function createRfp(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const parsed = createRfpSchema.parse({
    eventType: (formData.get('eventType') as string) || 'OTHER',
    eventDate: formData.get('eventDate') || undefined,
    city: formData.get('city') || undefined,
    capacity: formData.get('capacity'),
    budget: formData.get('budget'),
    description: formData.get('description') || undefined,
  })

  const amenitiesStr = formData.get('amenities')
  const amenities =
    typeof amenitiesStr === 'string' && amenitiesStr.trim()
      ? amenitiesStr.split(',').filter(Boolean)
      : []

  // Geocode the requested area (best-effort — RFP creation never fails on this).
  let lat: number | null = null
  let lng: number | null = null
  if (parsed.city) {
    try {
      const geo = await geocodeAddress(parsed.city, '')
      lat = geo.lat
      lng = geo.lng
    } catch {
      // geocoding unavailable — location simply won't factor into matching
    }
  }

  const { data: rfp, error } = await supabase
    .from('rfps')
    .insert({
      renter_id: user.id,
      event_type: parsed.eventType,
      event_date: parsed.eventDate ?? null,
      city: parsed.city ?? null,
      latitude: lat,
      longitude: lng,
      capacity: parsed.capacity,
      budget: parsed.budget,
      description: parsed.description ?? null,
      amenities,
    })
    .select('id')
    .single()

  if (error || !rfp) throw new Error(error?.message ?? 'Could not create request.')

  await generateMatches(supabase, rfp.id, {
    capacity: parsed.capacity,
    budget: parsed.budget,
    amenities,
    eventType: parsed.eventType,
    lat,
    lng,
  })

  revalidatePath('/rfp')
  redirect(`/rfp/${rfp.id}`)
}

export async function deleteRfp(rfpId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('rfps')
    .delete()
    .eq('id', rfpId)
    .eq('renter_id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/rfp')
}
