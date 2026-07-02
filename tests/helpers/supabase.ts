import { randomUUID } from 'node:crypto'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY

// Integration tests self-skip when the test DB isn't configured (e.g. in CI,
// which currently runs unit tests only). See describe.skipIf(!hasTestDb).
export const hasTestDb = Boolean(URL && ANON && SERVICE)

const clientOpts = { auth: { persistSession: false, autoRefreshToken: false } } as const

/** Service-role client — bypasses RLS. Use for seeding and admin-path assertions. */
export function admin(): SupabaseClient {
  return createClient(URL!, SERVICE!, clientOpts)
}

/** Anonymous (unauthenticated) client — subject to the anon RLS role. */
export function anon(): SupabaseClient {
  return createClient(URL!, ANON!, clientOpts)
}

export interface TestUser {
  id: string
  email: string
  password: string
  role: 'RENTER' | 'HOST' | 'ADMIN'
}

const createdUsers: string[] = []
const createdVenues: string[] = []
const createdBookings: string[] = []

/** Create an auth user + matching public.users row. Tracked for cleanup. */
export async function createUser(role: TestUser['role'] = 'RENTER'): Promise<TestUser> {
  const a = admin()
  const email = `test+${randomUUID()}@venuecharm.test`
  const password = 'Test123!secure'

  const { data, error } = await a.auth.admin.createUser({ email, password, email_confirm: true })
  if (error || !data.user) throw new Error(`createUser auth failed: ${error?.message}`)
  const id = data.user.id
  createdUsers.push(id)

  const { error: rowErr } = await a
    .from('users')
    .insert({ id, email, role, first_name: 'Test', last_name: 'User' })
  if (rowErr) throw new Error(`createUser row failed: ${rowErr.message}`)

  return { id, email, password, role }
}

/** Return a client authenticated as the given user (RLS applies as that user). */
export async function signIn(user: TestUser): Promise<SupabaseClient> {
  const client = createClient(URL!, ANON!, clientOpts)
  const { error } = await client.auth.signInWithPassword({
    email: user.email,
    password: user.password,
  })
  if (error) throw new Error(`signIn failed: ${error.message}`)
  return client
}

export interface VenueOpts {
  status?: 'DRAFT' | 'PENDING_APPROVAL' | 'ACTIVE' | 'SUSPENDED'
  city?: string
  capacity?: number
  lat?: number
  lng?: number
}

/** Insert a venue (geography via EWKT). Tracked for cleanup. */
export async function makeVenue(hostId: string, opts: VenueOpts = {}): Promise<string> {
  const { status = 'ACTIVE', city = 'Tel Aviv', capacity = 100, lat = 32.08, lng = 34.78 } = opts
  const { data, error } = await admin()
    .from('venues')
    .insert({
      host_id: hostId,
      title: `Test Venue ${randomUUID().slice(0, 8)}`,
      description: 'Integration test venue',
      address: '1 Test St',
      city,
      capacity,
      price_per_hour: 200,
      price_per_day: 1500,
      status,
      location: `SRID=4326;POINT(${lng} ${lat})`,
    })
    .select('id')
    .single()
  if (error || !data) throw new Error(`makeVenue failed: ${error?.message}`)
  createdVenues.push(data.id)
  return data.id
}

export interface BookingOpts {
  status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'REJECTED'
  startAt?: string
  endAt?: string
  totalPrice?: number
}

/** Insert a booking via the admin client. Tracked for cleanup. */
export async function makeBooking(
  venueId: string,
  renterId: string,
  opts: BookingOpts = {},
): Promise<{ id: string } | { error: string }> {
  const {
    status = 'PENDING',
    startAt = '2026-09-01T10:00:00Z',
    endAt = '2026-09-01T14:00:00Z',
    totalPrice = 800,
  } = opts
  const { data, error } = await admin()
    .from('bookings')
    .insert({
      venue_id: venueId,
      renter_id: renterId,
      start_at: startAt,
      end_at: endAt,
      total_price: totalPrice,
      status,
    })
    .select('id')
    .single()
  if (error) return { error: error.message }
  createdBookings.push(data.id)
  return { id: data.id }
}

export interface PaymentOpts {
  stripePaymentIntentId?: string
  status?: 'PENDING' | 'AUTHORIZED' | 'CAPTURED' | 'REFUNDED' | 'FAILED'
  amount?: number
}

/** Insert a payment row for a booking. Cleaned up with its booking. */
export async function makePayment(
  bookingId: string,
  renterId: string,
  opts: PaymentOpts = {},
): Promise<{ id: string; stripePaymentIntentId: string }> {
  const {
    stripePaymentIntentId = `pi_test_${randomUUID().replace(/-/g, '')}`,
    status = 'PENDING',
    amount = 800,
  } = opts
  const { data, error } = await admin()
    .from('payments')
    .insert({
      booking_id: bookingId,
      renter_id: renterId,
      amount,
      currency: 'ILS',
      stripe_payment_intent_id: stripePaymentIntentId,
      status,
    })
    .select('id')
    .single()
  if (error || !data) throw new Error(`makePayment failed: ${error?.message}`)
  return { id: data.id, stripePaymentIntentId }
}

/** Set a user's Stripe Connect account id (for account.updated webhook tests). */
export async function setStripeAccount(userId: string, accountId: string): Promise<void> {
  const { error } = await admin()
    .from('users')
    .update({ stripe_account_id: accountId })
    .eq('id', userId)
  if (error) throw new Error(`setStripeAccount failed: ${error.message}`)
}

/** Delete everything created by the current test file, in dependency order. */
export async function cleanupAll(): Promise<void> {
  const a = admin()
  // Payments reference bookings — remove them first to satisfy the FK.
  if (createdBookings.length) await a.from('payments').delete().in('booking_id', createdBookings)
  if (createdBookings.length) await a.from('bookings').delete().in('id', createdBookings)
  if (createdVenues.length) await a.from('venues').delete().in('id', createdVenues)
  if (createdUsers.length) {
    await a.from('notifications').delete().in('user_id', createdUsers)
    await a.from('host_calendar_connections').delete().in('host_id', createdUsers)
    await a.from('users').delete().in('id', createdUsers)
    for (const id of createdUsers) await a.auth.admin.deleteUser(id)
  }
  createdBookings.length = 0
  createdVenues.length = 0
  createdUsers.length = 0
}
