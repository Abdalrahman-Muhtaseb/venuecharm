import { describe, it, expect, afterAll } from 'vitest'
import { hasTestDb, createUser, makeVenue, makeBooking, cleanupAll } from '../helpers/supabase'

// Phase 2 (P0): the EXCLUDE USING GIST constraint on bookings must make it
// impossible to double-book an overlapping time range on the same venue while a
// booking is PENDING or CONFIRMED.
describe.skipIf(!hasTestDb)('bookings: double-booking constraint', () => {
  afterAll(cleanupAll)

  it('rejects an overlapping booking when one is CONFIRMED', async () => {
    const host = await createUser('HOST')
    const renterA = await createUser('RENTER')
    const renterB = await createUser('RENTER')
    const venue = await makeVenue(host.id)

    const first = await makeBooking(venue, renterA.id, {
      status: 'CONFIRMED',
      startAt: '2026-09-10T10:00:00Z',
      endAt: '2026-09-10T14:00:00Z',
    })
    expect('id' in first).toBe(true)

    // Overlaps 10:00–14:00 → must violate the exclusion constraint.
    const second = await makeBooking(venue, renterB.id, {
      status: 'PENDING',
      startAt: '2026-09-10T12:00:00Z',
      endAt: '2026-09-10T16:00:00Z',
    })
    expect('error' in second).toBe(true)
  })

  it('allows a non-overlapping booking on the same venue', async () => {
    const host = await createUser('HOST')
    const renter = await createUser('RENTER')
    const venue = await makeVenue(host.id)

    const first = await makeBooking(venue, renter.id, {
      status: 'CONFIRMED',
      startAt: '2026-09-11T10:00:00Z',
      endAt: '2026-09-11T12:00:00Z',
    })
    const second = await makeBooking(venue, renter.id, {
      status: 'CONFIRMED',
      startAt: '2026-09-11T12:00:00Z',
      endAt: '2026-09-11T14:00:00Z',
    })
    expect('id' in first).toBe(true)
    expect('id' in second).toBe(true)
  })

  it('ignores CANCELLED/REJECTED bookings (slot frees up)', async () => {
    const host = await createUser('HOST')
    const renter = await createUser('RENTER')
    const venue = await makeVenue(host.id)

    await makeBooking(venue, renter.id, {
      status: 'CANCELLED',
      startAt: '2026-09-12T10:00:00Z',
      endAt: '2026-09-12T14:00:00Z',
    })
    // Same range, but the prior one is CANCELLED → constraint's WHERE excludes it.
    const retry = await makeBooking(venue, renter.id, {
      status: 'CONFIRMED',
      startAt: '2026-09-12T10:00:00Z',
      endAt: '2026-09-12T14:00:00Z',
    })
    expect('id' in retry).toBe(true)
  })
})
