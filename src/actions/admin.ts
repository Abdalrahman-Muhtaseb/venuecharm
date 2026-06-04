'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

async function requireAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  if (!profile || profile.role !== 'ADMIN') throw new Error('Unauthorized')
  return user
}

// ── User management ───────────────────────────────────────────────────────────

export async function adminChangeUserRole(userId: string, role: string) {
  await requireAdmin()
  const { error } = await createAdminClient()
    .from('users')
    .update({ role })
    .eq('id', userId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/dev')
}

export async function adminToggleVerified(userId: string, verified: boolean) {
  await requireAdmin()
  const { error } = await createAdminClient()
    .from('users')
    .update({ is_verified: verified })
    .eq('id', userId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/dev')
}

// ── Booking management ───────────────────────────────────────────────────────

export async function adminCancelBooking(bookingId: string) {
  await requireAdmin()
  const { error } = await createAdminClient()
    .from('bookings')
    .update({ status: 'CANCELLED', cancelled_at: new Date().toISOString() })
    .eq('id', bookingId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/dev')
}

// ── Seed data ────────────────────────────────────────────────────────────────

const SEED_VENUES = [
  {
    title: '[TEST] Event Hall Tel Aviv',
    description: 'Modern event space in the heart of Tel Aviv, perfect for corporate events and celebrations.',
    address: '50 Rothschild Blvd',
    city: 'Tel Aviv',
    capacity: 200,
    price_per_hour: 500,
    price_per_day: 3000,
    amenities: ['WiFi', 'AV', 'Parking', 'Air conditioning'],
    status: 'PENDING_APPROVAL',
    location: 'SRID=4326;POINT(34.7718 32.0653)',
    cancellation_policy: 'MODERATE',
  },
  {
    title: '[TEST] Jerusalem Conference Center',
    description: 'Historic venue near the Old City, ideal for seminars and meetings.',
    address: '10 Keren Hayesod',
    city: 'Jerusalem',
    capacity: 150,
    price_per_hour: 400,
    price_per_day: 2500,
    amenities: ['WiFi', 'Projector', 'Kitchen'],
    status: 'PENDING_APPROVAL',
    location: 'SRID=4326;POINT(35.2137 31.7683)',
    cancellation_policy: 'MODERATE',
  },
  {
    title: '[TEST] Haifa Rooftop Garden',
    description: 'Stunning rooftop venue overlooking the Carmel mountain range.',
    address: '5 Ben Gurion Ave',
    city: 'Haifa',
    capacity: 80,
    price_per_hour: 350,
    price_per_day: 2000,
    amenities: ['Outdoor', 'Coffee', 'Music'],
    status: 'ACTIVE',
    location: 'SRID=4326;POINT(34.9896 32.7940)',
    cancellation_policy: 'FLEXIBLE',
  },
  {
    title: "[TEST] Be'er Sheva Innovation Hub",
    description: "Tech-forward coworking and event space in the heart of the Negev.",
    address: '1 Ben Zvi Blvd',
    city: "Be'er Sheva",
    capacity: 60,
    price_per_hour: 250,
    price_per_day: 1500,
    amenities: ['WiFi', 'Projector', 'Coffee', 'Air conditioning'],
    status: 'ACTIVE',
    location: 'SRID=4326;POINT(34.7915 31.2520)',
    cancellation_policy: 'MODERATE',
  },
  {
    title: '[TEST] Eilat Beachfront Pavilion',
    description: 'Exclusive beachfront event space with stunning Red Sea views.',
    address: '1 Arava Road',
    city: 'Eilat',
    capacity: 120,
    price_per_hour: 600,
    price_per_day: 3500,
    amenities: ['Outdoor', 'AV', 'Music', 'Accessible'],
    status: 'PENDING_APPROVAL',
    location: 'SRID=4326;POINT(34.9482 29.5581)',
    cancellation_policy: 'STRICT',
  },
]

export async function adminSeedVenues() {
  const adminUser = await requireAdmin()
  const db = createAdminClient()

  const { data: hosts } = await db.from('users').select('id').eq('role', 'HOST').limit(1)
  const hostId = hosts?.[0]?.id ?? adminUser.id

  const { error } = await db
    .from('venues')
    .insert(SEED_VENUES.map((v) => ({ ...v, host_id: hostId })))

  if (error) throw new Error(error.message)

  revalidatePath('/admin')
  revalidatePath('/admin/dev')
  revalidatePath('/venues')
}

export async function adminSeedTestUsers() {
  await requireAdmin()
  const db = createAdminClient()

  const testUsers = [
    { email: 'test.host@venuecharm.dev', role: 'HOST', first_name: 'Test', last_name: 'Host' },
    { email: 'test.renter1@venuecharm.dev', role: 'RENTER', first_name: 'Alice', last_name: 'Renter' },
    { email: 'test.renter2@venuecharm.dev', role: 'RENTER', first_name: 'Bob', last_name: 'Renter' },
  ]

  for (const u of testUsers) {
    const { data: existing } = await db.from('users').select('id').eq('email', u.email).single()
    if (existing) continue

    const { data: authData, error: authError } = await db.auth.admin.createUser({
      email: u.email,
      password: 'VenueCharm2024!',
      email_confirm: true,
      user_metadata: { role: u.role, first_name: u.first_name, last_name: u.last_name },
    })

    if (!authError && authData?.user) {
      await db.from('users').upsert({
        id: authData.user.id,
        email: u.email,
        role: u.role,
        first_name: u.first_name,
        last_name: u.last_name,
        is_verified: true,
      }, { ignoreDuplicates: true })
    }
  }

  revalidatePath('/admin/dev')
}

// ── Danger zone ──────────────────────────────────────────────────────────────

export async function adminResetVenuesToPending() {
  await requireAdmin()
  const { error } = await createAdminClient()
    .from('venues')
    .update({ status: 'PENDING_APPROVAL' })
    .neq('status', 'DRAFT')
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
  revalidatePath('/admin/dev')
  revalidatePath('/venues')
}

export async function adminCancelAllPendingBookings() {
  await requireAdmin()
  const { error } = await createAdminClient()
    .from('bookings')
    .update({ status: 'CANCELLED', cancelled_at: new Date().toISOString() })
    .eq('status', 'PENDING')
  if (error) throw new Error(error.message)
  revalidatePath('/admin/dev')
}

export async function adminDeleteTestVenues() {
  await requireAdmin()
  const { error } = await createAdminClient()
    .from('venues')
    .delete()
    .like('title', '[TEST]%')
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
  revalidatePath('/admin/dev')
  revalidatePath('/venues')
}

export async function adminDeleteAllBookings() {
  await requireAdmin()
  const { error } = await createAdminClient()
    .from('bookings')
    .delete()
    .gte('created_at', '1970-01-01T00:00:00.000Z')
  if (error) throw new Error(error.message)
  revalidatePath('/admin/dev')
}
