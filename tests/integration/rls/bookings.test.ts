import { describe, it, expect, afterAll } from 'vitest'
import { hasTestDb, createUser, makeVenue, makeBooking, signIn, cleanupAll } from '../../helpers/supabase'

// Phase 3 (P0): booking visibility is scoped — a renter sees only their own
// bookings; the venue's host can see bookings on their venue.
describe.skipIf(!hasTestDb)('RLS: bookings', () => {
  afterAll(cleanupAll)

  it('renter A cannot read renter B’s booking', async () => {
    const host = await createUser('HOST')
    const renterA = await createUser('RENTER')
    const renterB = await createUser('RENTER')
    const venue = await makeVenue(host.id)
    const booking = await makeBooking(venue, renterB.id)
    expect('id' in booking).toBe(true)
    const bookingId = (booking as { id: string }).id

    const clientA = await signIn(renterA)
    const { data } = await clientA.from('bookings').select('*').eq('id', bookingId)
    expect(data ?? []).toHaveLength(0)
  })

  it('the owning renter can read their own booking', async () => {
    const host = await createUser('HOST')
    const renter = await createUser('RENTER')
    const venue = await makeVenue(host.id)
    const booking = await makeBooking(venue, renter.id)
    const bookingId = (booking as { id: string }).id

    const client = await signIn(renter)
    const { data } = await client.from('bookings').select('*').eq('id', bookingId)
    expect(data ?? []).toHaveLength(1)
  })

  it('the venue host can read a booking on their venue', async () => {
    const host = await createUser('HOST')
    const renter = await createUser('RENTER')
    const venue = await makeVenue(host.id)
    const booking = await makeBooking(venue, renter.id)
    const bookingId = (booking as { id: string }).id

    const client = await signIn(host)
    const { data } = await client.from('bookings').select('*').eq('id', bookingId)
    expect(data ?? []).toHaveLength(1)
  })
})
