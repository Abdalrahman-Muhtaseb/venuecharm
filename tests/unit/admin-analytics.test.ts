import { describe, it, expect } from 'vitest'
import {
  lastNMonths,
  monthlyBuckets,
  rankVenuesByBookings,
  bookingStatusBreakdown,
  monthlyBookingCounts,
} from '@/lib/admin-analytics'

const now = new Date(2026, 5, 15) // 2026-06-15, fixed for determinism

describe('lastNMonths', () => {
  it('returns n month keys, oldest first, ending on the current month', () => {
    expect(lastNMonths(3, now)).toEqual(['2026-04', '2026-05', '2026-06'])
  })
  it('crosses year boundaries', () => {
    expect(lastNMonths(3, new Date(2026, 0, 10))).toEqual(['2025-11', '2025-12', '2026-01'])
  })
})

describe('monthlyBuckets', () => {
  it('sums values into months and zero-fills empty ones', () => {
    const items = [
      { date: '2026-06-01', value: 100 },
      { date: '2026-06-20', value: 50 },
      { date: '2026-04-10', value: 30 },
    ]
    expect(monthlyBuckets(items, 3, now)).toEqual([
      { month: '2026-04', value: 30 },
      { month: '2026-05', value: 0 },
      { month: '2026-06', value: 150 },
    ])
  })

  it('ignores items outside the window', () => {
    const items = [{ date: '2020-01-01', value: 999 }]
    expect(monthlyBuckets(items, 2, now)).toEqual([
      { month: '2026-05', value: 0 },
      { month: '2026-06', value: 0 },
    ])
  })
})

describe('rankVenuesByBookings', () => {
  const rows = [
    { venue_id: 'a', total_price: 1000, status: 'CONFIRMED' },
    { venue_id: 'a', total_price: 500, status: 'COMPLETED' },
    { venue_id: 'b', total_price: 2000, status: 'CONFIRMED' },
    { venue_id: 'c', total_price: 9999, status: 'CANCELLED' }, // ignored
    { venue_id: 'a', total_price: 100, status: 'PENDING' }, // ignored
  ]

  it('counts only CONFIRMED/COMPLETED and sorts by revenue', () => {
    const ranked = rankVenuesByBookings(rows)
    expect(ranked).toEqual([
      { venueId: 'b', bookings: 1, revenue: 2000 },
      { venueId: 'a', bookings: 2, revenue: 1500 },
    ])
  })

  it('respects the limit', () => {
    expect(rankVenuesByBookings(rows, 1)).toHaveLength(1)
  })

  it('coerces string/null prices', () => {
    const ranked = rankVenuesByBookings([
      { venue_id: 'x', total_price: '250', status: 'CONFIRMED' },
      { venue_id: 'x', total_price: null, status: 'COMPLETED' },
    ])
    expect(ranked[0]).toEqual({ venueId: 'x', bookings: 2, revenue: 250 })
  })
})

describe('bookingStatusBreakdown', () => {
  it('counts by status in canonical order, omitting absent statuses', () => {
    const rows = [
      { status: 'CONFIRMED' },
      { status: 'PENDING_APPROVAL' },
      { status: 'CONFIRMED' },
      { status: 'CANCELLED' },
    ]
    expect(bookingStatusBreakdown(rows)).toEqual([
      { status: 'PENDING_APPROVAL', count: 1 },
      { status: 'CONFIRMED', count: 2 },
      { status: 'CANCELLED', count: 1 },
    ])
  })
})

describe('monthlyBookingCounts', () => {
  it('counts rows per month (value always 1)', () => {
    const rows = [
      { created_at: '2026-06-02' },
      { created_at: '2026-06-28' },
      { created_at: '2026-05-05' },
    ]
    expect(monthlyBookingCounts(rows, 2, now)).toEqual([
      { month: '2026-05', value: 1 },
      { month: '2026-06', value: 2 },
    ])
  })
})
