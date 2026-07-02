import { config } from 'dotenv'
config({ path: '.env.test' })

import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Self-contained seed for the E2E booking journey. Reads env at call time (after
// dotenv above) so it doesn't depend on module-load ordering elsewhere.

export const SEED_FILE = path.join(process.cwd(), 'tests', 'e2e', '.artifacts', 'seed.json')
export const RENTER_PASSWORD = 'Test123!secure'

export interface SeedData {
  hostId: string
  renterId: string
  renterEmail: string
  renterPassword: string
  venueId: string
}

function admin(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

async function makeUser(a: SupabaseClient, role: 'HOST' | 'RENTER'): Promise<{ id: string; email: string }> {
  const email = `e2e+${randomUUID()}@venuecharm.test`
  const { data, error } = await a.auth.admin.createUser({
    email,
    password: RENTER_PASSWORD,
    email_confirm: true,
  })
  if (error || !data.user) throw new Error(`seed user failed: ${error?.message}`)
  const { error: rowErr } = await a
    .from('users')
    .insert({ id: data.user.id, email, role, first_name: 'E2E', last_name: role === 'HOST' ? 'Host' : 'Renter' })
  if (rowErr) throw new Error(`seed user row failed: ${rowErr.message}`)
  return { id: data.user.id, email }
}

export async function seed(): Promise<SeedData> {
  const a = admin()
  const host = await makeUser(a, 'HOST')
  const renter = await makeUser(a, 'RENTER')

  // Full-day-only venue: no hourly rate, so the booking widget needs just a date.
  const { data: venue, error } = await a
    .from('venues')
    .insert({
      host_id: host.id,
      title: `E2E Venue ${randomUUID().slice(0, 8)}`,
      description: 'E2E booking-journey venue',
      address: '1 Test St',
      city: 'Tel Aviv',
      capacity: 120,
      price_per_hour: null,
      price_per_day: 1500,
      status: 'ACTIVE',
      location: 'SRID=4326;POINT(34.78 32.08)',
    })
    .select('id')
    .single()
  if (error || !venue) throw new Error(`seed venue failed: ${error?.message}`)

  return {
    hostId: host.id,
    renterId: renter.id,
    renterEmail: renter.email,
    renterPassword: RENTER_PASSWORD,
    venueId: venue.id,
  }
}

/** Read the current booking status for a renter+venue (E2E DB assertion). */
export async function findBookingStatus(venueId: string, renterId: string): Promise<string | null> {
  const { data } = await admin()
    .from('bookings')
    .select('status')
    .eq('venue_id', venueId)
    .eq('renter_id', renterId)
    .maybeSingle()
  return data?.status ?? null
}

export async function teardown(data: SeedData): Promise<void> {
  const a = admin()
  const userIds = [data.hostId, data.renterId]
  // Bookings the journey created (by our renter on the seeded venue) + payments.
  const { data: bookings } = await a.from('bookings').select('id').eq('venue_id', data.venueId)
  const bookingIds = (bookings ?? []).map((b) => b.id)
  if (bookingIds.length) {
    await a.from('payments').delete().in('booking_id', bookingIds)
    await a.from('bookings').delete().in('id', bookingIds)
  }
  await a.from('venues').delete().eq('id', data.venueId)
  await a.from('notifications').delete().in('user_id', userIds)
  await a.from('users').delete().in('id', userIds)
  for (const id of userIds) await a.auth.admin.deleteUser(id)
}
