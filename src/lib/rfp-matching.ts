/**
 * RFP Smart Matching — pure scoring (no I/O, unit-testable).
 *
 * A venue is scored 0–100 against a renter's request across three weighted
 * dimensions. The weights sum to 100:
 *
 *   - Capacity fit   (40) — does it hold the guests, without being oversized?
 *   - Price fit      (40) — does the estimated cost sit within budget?
 *   - Amenities fit  (20) — how many requested amenities does it have?
 *
 * Assumes an ~8h event when only an hourly rate is set, so a daily-rate and an
 * hourly-rate venue can be compared on the same footing.
 */

export const WEIGHTS = { capacity: 40, price: 40, amenities: 20 } as const

const ASSUMED_EVENT_HOURS = 8

export interface RfpCriteria {
  capacity: number
  budget: number // total event budget, ILS
  amenities: string[] // desired amenity keys
}

export interface ScorableVenue {
  id: string
  capacity: number
  price_per_hour: number | null
  price_per_day: number | null
  amenities: string[] | null
}

export interface VenueScore {
  venueId: string
  score: number // 0–100 integer
  breakdown: { capacity: number; price: number; amenities: number }
}

/** Best estimate of what hosting the event costs at this venue (ILS), or null. */
export function estimatedCost(venue: ScorableVenue): number | null {
  if (venue.price_per_day != null && venue.price_per_day > 0) return venue.price_per_day
  if (venue.price_per_hour != null && venue.price_per_hour > 0) {
    return venue.price_per_hour * ASSUMED_EVENT_HOURS
  }
  return null
}

function capacityScore(requested: number, venueCapacity: number): number {
  if (venueCapacity <= 0 || requested <= 0) return 0
  if (venueCapacity >= requested) {
    // Fits. Ideal when close to the requested size; gently penalise oversize.
    // requested == capacity → 40; 2× → 30; very large → approaches 20.
    return WEIGHTS.capacity * (0.5 + 0.5 * (requested / venueCapacity))
  }
  // Too small to host comfortably — heavy penalty proportional to the shortfall.
  return WEIGHTS.capacity * (venueCapacity / requested) * 0.5
}

function priceScore(budget: number, cost: number | null): number {
  if (cost == null) return WEIGHTS.price * 0.5 // unknown price → neutral half
  if (budget <= 0) return 0
  if (cost <= budget) return WEIGHTS.price // affordable
  return Math.max(0, WEIGHTS.price * (budget / cost)) // linear penalty over budget
}

function amenitiesScore(wanted: string[], have: string[] | null): number {
  if (wanted.length === 0) return WEIGHTS.amenities // no requirement → full marks
  const owned = new Set(have ?? [])
  const matched = wanted.filter((k) => owned.has(k)).length
  return WEIGHTS.amenities * (matched / wanted.length)
}

/** Count of requested amenities the venue actually has (for "why it matched" UI). */
export function matchedAmenities(wanted: string[], have: string[] | null): number {
  const owned = new Set(have ?? [])
  return wanted.filter((k) => owned.has(k)).length
}

export function scoreVenue(criteria: RfpCriteria, venue: ScorableVenue): VenueScore {
  const capacity = capacityScore(criteria.capacity, venue.capacity)
  const price = priceScore(criteria.budget, estimatedCost(venue))
  const amenities = amenitiesScore(criteria.amenities, venue.amenities)
  const total = Math.round(Math.min(100, Math.max(0, capacity + price + amenities)))
  return {
    venueId: venue.id,
    score: total,
    breakdown: {
      capacity: Math.round(capacity),
      price: Math.round(price),
      amenities: Math.round(amenities),
    },
  }
}

/** Score every venue and return them best-first. Pass `limit` to cap the result. */
export function rankVenues(
  criteria: RfpCriteria,
  venues: ScorableVenue[],
  limit?: number,
): VenueScore[] {
  const ranked = venues
    .map((v) => scoreVenue(criteria, v))
    .sort((a, b) => b.score - a.score)
  return typeof limit === 'number' ? ranked.slice(0, limit) : ranked
}
