import { describe, it, expect } from 'vitest'
import { buildRatingsMap } from '@/lib/ratings'

describe('buildRatingsMap', () => {
  it('groups by venue and computes count + average', () => {
    const map = buildRatingsMap([
      { venue_id: 'a', rating: 5 },
      { venue_id: 'a', rating: 3 },
      { venue_id: 'b', rating: 4 },
    ])
    expect(map.get('a')).toEqual({ avg_rating: 4, review_count: 2 })
    expect(map.get('b')).toEqual({ avg_rating: 4, review_count: 1 })
  })

  it('rounds the average to one decimal place', () => {
    // (5 + 4 + 4) / 3 = 4.333… → 4.3
    const map = buildRatingsMap([
      { venue_id: 'x', rating: 5 },
      { venue_id: 'x', rating: 4 },
      { venue_id: 'x', rating: 4 },
    ])
    expect(map.get('x')).toEqual({ avg_rating: 4.3, review_count: 3 })
  })

  it('returns an empty map for no rows', () => {
    expect(buildRatingsMap([]).size).toBe(0)
  })
})
