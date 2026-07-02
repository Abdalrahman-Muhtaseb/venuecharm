import { describe, it, expect } from 'vitest'
import {
  estimatedCost,
  matchedAmenities,
  scoreVenue,
  rankVenues,
  WEIGHTS,
  ASSUMED_EVENT_HOURS,
  type RfpCriteria,
  type ScorableVenue,
} from '@/lib/rfp-matching'

// A criteria object with every dimension unconstrained → each scores full marks.
const noConstraint: RfpCriteria = {
  capacity: 0,
  budget: 0,
  amenities: [],
  eventType: 'OTHER',
  lat: null,
  lng: null,
}

const baseVenue: ScorableVenue = {
  id: 'v1',
  capacity: 100,
  price_per_hour: null,
  price_per_day: 1000,
  amenities: [],
  event_types: [],
  distanceKm: null,
}

describe('estimatedCost', () => {
  it('prefers the daily rate when set', () => {
    expect(estimatedCost({ ...baseVenue, price_per_day: 1500, price_per_hour: 200 })).toBe(1500)
  })
  it('falls back to hourly × assumed hours', () => {
    expect(estimatedCost({ ...baseVenue, price_per_day: null, price_per_hour: 200 })).toBe(
      200 * ASSUMED_EVENT_HOURS,
    )
  })
  it('returns null when neither rate is set', () => {
    expect(estimatedCost({ ...baseVenue, price_per_day: null, price_per_hour: null })).toBeNull()
  })
})

describe('matchedAmenities', () => {
  it('counts requested amenities the venue has', () => {
    expect(matchedAmenities(['wifi', 'parking', 'stage'], ['wifi', 'stage'])).toBe(2)
  })
  it('handles null venue amenities', () => {
    expect(matchedAmenities(['wifi'], null)).toBe(0)
  })
})

describe('scoreVenue — no constraints award full marks', () => {
  it('scores 100 when nothing is constrained', () => {
    const { score, breakdown } = scoreVenue(noConstraint, baseVenue)
    expect(score).toBe(100)
    expect(breakdown).toEqual({
      capacity: WEIGHTS.capacity,
      price: WEIGHTS.price,
      amenities: WEIGHTS.amenities,
      location: WEIGHTS.location,
      eventType: WEIGHTS.eventType,
    })
  })
})

describe('scoreVenue — capacity dimension', () => {
  const cap = (requested: number, venueCapacity: number) =>
    scoreVenue({ ...noConstraint, capacity: requested }, { ...baseVenue, capacity: venueCapacity })
      .breakdown.capacity

  it('perfect fit earns full capacity weight', () => {
    expect(cap(100, 100)).toBe(WEIGHTS.capacity)
  })
  it('oversized venue is gently penalised', () => {
    expect(cap(100, 200)).toBe(Math.round(WEIGHTS.capacity * 0.75)) // 19
  })
  it('too-small venue is heavily penalised', () => {
    expect(cap(100, 50)).toBe(Math.round(WEIGHTS.capacity * 0.25)) // 6
  })
})

describe('scoreVenue — price dimension', () => {
  const price = (budget: number, venue: Partial<ScorableVenue>) =>
    scoreVenue({ ...noConstraint, budget }, { ...baseVenue, ...venue }).breakdown.price

  it('within budget earns full price weight', () => {
    expect(price(2000, { price_per_day: 1000 })).toBe(WEIGHTS.price)
  })
  it('over budget is linearly penalised', () => {
    expect(price(1000, { price_per_day: 2000 })).toBe(Math.round(WEIGHTS.price * 0.5))
  })
  it('unknown price is neutral half', () => {
    expect(price(1000, { price_per_day: null, price_per_hour: null })).toBe(
      Math.round(WEIGHTS.price * 0.5),
    )
  })
})

describe('scoreVenue — amenities / location / event-type', () => {
  it('amenities score is proportional to matches', () => {
    const s = scoreVenue(
      { ...noConstraint, amenities: ['a', 'b', 'c', 'd'] },
      { ...baseVenue, amenities: ['a', 'b'] },
    )
    expect(s.breakdown.amenities).toBe(Math.round(WEIGHTS.amenities * 0.5))
  })

  it('near location earns full marks, far earns zero', () => {
    const near = scoreVenue({ ...noConstraint, lat: 32, lng: 34 }, { ...baseVenue, distanceKm: 5 })
    const far = scoreVenue({ ...noConstraint, lat: 32, lng: 34 }, { ...baseVenue, distanceKm: 200 })
    expect(near.breakdown.location).toBe(WEIGHTS.location)
    expect(far.breakdown.location).toBe(0)
  })

  it('unknown distance with a requested area is neutral half', () => {
    const s = scoreVenue({ ...noConstraint, lat: 32, lng: 34 }, { ...baseVenue, distanceKm: null })
    expect(s.breakdown.location).toBe(Math.round(WEIGHTS.location * 0.5))
  })

  it('matching event type earns full marks; mismatch earns zero', () => {
    const match = scoreVenue({ ...noConstraint, eventType: 'WEDDING' }, { ...baseVenue, event_types: ['WEDDING'] })
    const miss = scoreVenue({ ...noConstraint, eventType: 'WEDDING' }, { ...baseVenue, event_types: ['CONFERENCE'] })
    expect(match.breakdown.eventType).toBe(WEIGHTS.eventType)
    expect(miss.breakdown.eventType).toBe(0)
  })
})

describe('rankVenues', () => {
  const criteria: RfpCriteria = { capacity: 100, budget: 2000, amenities: ['wifi'], eventType: 'WEDDING', lat: null, lng: null }
  const venues: ScorableVenue[] = [
    { id: 'good', capacity: 100, price_per_hour: null, price_per_day: 1500, amenities: ['wifi'], event_types: ['WEDDING'], distanceKm: null },
    { id: 'ok', capacity: 400, price_per_hour: null, price_per_day: 1900, amenities: [], event_types: ['WEDDING'], distanceKm: null },
    { id: 'bad', capacity: 20, price_per_hour: null, price_per_day: 9000, amenities: [], event_types: ['CONFERENCE'], distanceKm: null },
  ]

  it('returns best-first', () => {
    const ranked = rankVenues(criteria, venues)
    expect(ranked.map((r) => r.venueId)).toEqual(['good', 'ok', 'bad'])
  })

  it('respects the limit', () => {
    expect(rankVenues(criteria, venues, 2)).toHaveLength(2)
  })

  it('scores are clamped to 0..100 integers', () => {
    for (const r of rankVenues(criteria, venues)) {
      expect(Number.isInteger(r.score)).toBe(true)
      expect(r.score).toBeGreaterThanOrEqual(0)
      expect(r.score).toBeLessThanOrEqual(100)
    }
  })
})
