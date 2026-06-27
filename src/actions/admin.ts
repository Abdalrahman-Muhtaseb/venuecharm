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

// Cloudinary/Unsplash are both whitelisted in next.config.mjs.
const ph = (id: string) => `https://images.unsplash.com/photo-${id}?q=80&w=1000&auto=format&fit=crop`

// A spread of venues covering every column added since the first seed:
// event_types, rules, photos, cancellation_policy and the three reservation
// modes (hour-only, day-only, both). Keys come from the amenities catalog
// (migration 012) and the shared event-type vocabulary.
const SEED_VENUES = [
  {
    title: '[TEST] Rothschild Event Hall',
    description: 'Modern double-height event space on Rothschild Boulevard, perfect for corporate launches, conferences and celebrations.',
    address: '50 Rothschild Blvd',
    city: 'Tel Aviv',
    capacity: 220,
    price_per_hour: 550,
    price_per_day: 3600,
    amenities: ['WiFi', 'AV', 'Projector', 'Air conditioning', 'Parking', 'Stage', 'Bar'],
    event_types: ['CONFERENCE', 'CORPORATE', 'PARTY', 'WEDDING'],
    rules: 'No smoking indoors. Music until 23:00. Outside catering allowed with prior approval.',
    photos: [ph('1519167758481-83f550bb49b3'), ph('1505373877841-8d25f7d46678'), ph('1492684223066-81342ee5ff30')],
    status: 'ACTIVE',
    location: 'SRID=4326;POINT(34.7718 32.0653)',
    cancellation_policy: 'MODERATE',
  },
  {
    title: '[TEST] Jaffa Port Loft',
    description: 'Industrial-chic loft steps from the old Jaffa port — natural light, exposed brick and a flexible open floor.',
    address: '12 Nemal Yafo',
    city: 'Tel Aviv',
    capacity: 60,
    price_per_hour: 320,
    price_per_day: null,
    amenities: ['WiFi', 'Coffee', 'Air conditioning', 'Lounge', 'Music'],
    event_types: ['WORKSHOP', 'CORPORATE', 'BIRTHDAY'],
    rules: 'Shoes-off studio. No confetti or glitter. Leave the space as you found it.',
    photos: [ph('1517457373958-b7bdd4587205'), ph('1556761175-5973dc0f32e7'), ph('1497366216548-37526070297c')],
    status: 'ACTIVE',
    location: 'SRID=4326;POINT(34.7522 32.0540)',
    cancellation_policy: 'FLEXIBLE',
  },
  {
    title: '[TEST] Jerusalem Conference Center',
    description: 'Historic full-day conference venue near the city centre, ideal for seminars, panels and corporate offsites.',
    address: '10 Keren Hayesod',
    city: 'Jerusalem',
    capacity: 180,
    price_per_hour: null,
    price_per_day: 2800,
    amenities: ['WiFi', 'Projector', 'AV', 'Air conditioning', 'Catering', 'Accessible', 'Parking'],
    event_types: ['CONFERENCE', 'CORPORATE', 'WORKSHOP'],
    rules: 'Day rentals only (08:00–20:00). Kosher catering required. No open flames.',
    photos: [ph('1531058020387-3be344556be6'), ph('1505373877841-8d25f7d46678'), ph('1540317580384-e5d43616b9aa')],
    status: 'ACTIVE',
    location: 'SRID=4326;POINT(35.2137 31.7683)',
    cancellation_policy: 'MODERATE',
  },
  {
    title: '[TEST] Ein Karem Garden Villa',
    description: 'Romantic garden villa in the Jerusalem hills with olive trees, a stone patio and sweeping valley views.',
    address: '8 Hama’ayan St',
    city: 'Jerusalem',
    capacity: 120,
    price_per_hour: 450,
    price_per_day: 3200,
    amenities: ['Outdoor', 'Garden', 'Parking', 'Bar', 'Lighting', 'Catering'],
    event_types: ['WEDDING', 'PARTY'],
    rules: 'Music outdoors until 22:00, indoors until midnight. No fireworks. Pets welcome on a leash.',
    photos: [ph('1519225421980-715cb0215aed'), ph('1492684223066-81342ee5ff30'), ph('1464366400600-7168b8af9bc3')],
    status: 'PENDING_APPROVAL',
    location: 'SRID=4326;POINT(35.1556 31.7656)',
    cancellation_policy: 'STRICT',
  },
  {
    title: '[TEST] Haifa Carmel Rooftop',
    description: 'Stunning rooftop terrace overlooking the Carmel and the bay — sunset parties and intimate weddings.',
    address: '5 Ben Gurion Ave',
    city: 'Haifa',
    capacity: 90,
    price_per_hour: 360,
    price_per_day: 2100,
    amenities: ['Outdoor', 'Coffee', 'Music', 'Bar', 'Lighting', 'Air conditioning'],
    event_types: ['PARTY', 'BIRTHDAY', 'WEDDING'],
    rules: 'Rooftop closes to music at 23:30. Max 90 guests. No drones.',
    photos: [ph('1540317580384-e5d43616b9aa'), ph('1511795409834-ef04bbd61622'), ph('1519167758481-83f550bb49b3')],
    status: 'ACTIVE',
    location: 'SRID=4326;POINT(34.9896 32.7940)',
    cancellation_policy: 'FLEXIBLE',
  },
  {
    title: '[TEST] Haifa Bay Coworking Loft',
    description: 'Bright coworking loft near the port — perfect for workshops, training days and team meetings.',
    address: '21 HaNamal St',
    city: 'Haifa',
    capacity: 45,
    price_per_hour: 220,
    price_per_day: null,
    amenities: ['WiFi', 'Projector', 'Coffee', 'Air conditioning', 'Accessible'],
    event_types: ['WORKSHOP', 'CONFERENCE', 'CORPORATE'],
    rules: 'Quiet building — no amplified music. Coffee and tea included. Clean up before leaving.',
    photos: [ph('1497366216548-37526070297c'), ph('1556761175-5973dc0f32e7'), ph('1517457373958-b7bdd4587205')],
    status: 'ACTIVE',
    location: 'SRID=4326;POINT(35.0000 32.7900)',
    cancellation_policy: 'FLEXIBLE',
  },
  {
    title: "[TEST] Be'er Sheva Innovation Hub",
    description: 'Tech-forward event and coworking space in the heart of the Negev, built for conferences and hackathons.',
    address: '1 Ben Zvi Blvd',
    city: "Be'er Sheva",
    capacity: 140,
    price_per_hour: 260,
    price_per_day: 1600,
    amenities: ['WiFi', 'Projector', 'AV', 'Coffee', 'Air conditioning', 'Stage', 'Parking'],
    event_types: ['CONFERENCE', 'WORKSHOP', 'CORPORATE'],
    rules: 'No smoking. Equipment must be booked in advance. Catering through approved vendors only.',
    photos: [ph('1505373877841-8d25f7d46678'), ph('1531058020387-3be344556be6'), ph('1492684223066-81342ee5ff30')],
    status: 'ACTIVE',
    location: 'SRID=4326;POINT(34.7915 31.2520)',
    cancellation_policy: 'MODERATE',
  },
  {
    title: '[TEST] Eilat Beachfront Pavilion',
    description: 'Exclusive beachfront pavilion with stunning Red Sea views — destination weddings and parties.',
    address: '1 Arava Road',
    city: 'Eilat',
    capacity: 160,
    price_per_hour: null,
    price_per_day: 4200,
    amenities: ['Outdoor', 'AV', 'Music', 'Bar', 'Lighting', 'Accessible', 'Pool'],
    event_types: ['WEDDING', 'PARTY'],
    rules: 'Full-day bookings only. Beach access by the pavilion stairs. No glass on the sand.',
    photos: [ph('1464366400600-7168b8af9bc3'), ph('1519225421980-715cb0215aed'), ph('1511795409834-ef04bbd61622')],
    status: 'ACTIVE',
    location: 'SRID=4326;POINT(34.9482 29.5581)',
    cancellation_policy: 'STRICT',
  },
  {
    title: '[TEST] Herzliya Marina Terrace',
    description: 'Sleek waterfront terrace at the Herzliya marina — corporate evenings, launches and milestone birthdays.',
    address: '3 HaShunit St',
    city: 'Herzliya',
    capacity: 110,
    price_per_hour: 420,
    price_per_day: 2600,
    amenities: ['Outdoor', 'Bar', 'Music', 'Lighting', 'Air conditioning', 'Parking', 'Security'],
    event_types: ['CORPORATE', 'PARTY', 'BIRTHDAY'],
    rules: 'Valet available. Music until 23:00 by marina bylaw. Decor must be free-standing (no wall fixings).',
    photos: [ph('1540317580384-e5d43616b9aa'), ph('1519167758481-83f550bb49b3'), ph('1492684223066-81342ee5ff30')],
    status: 'ACTIVE',
    location: 'SRID=4326;POINT(34.8443 32.1624)',
    cancellation_policy: 'MODERATE',
  },
  {
    title: '[TEST] Tiberias Galilee Hall',
    description: 'Spacious banquet hall on the shores of the Sea of Galilee for weddings and large gatherings.',
    address: '9 HaBanim St',
    city: 'Tiberias',
    capacity: 300,
    price_per_hour: null,
    price_per_day: 3000,
    amenities: ['AV', 'Stage', 'Lighting', 'Catering', 'Air conditioning', 'Parking', 'Accessible'],
    event_types: ['WEDDING', 'CONFERENCE'],
    rules: 'Day-long events welcome. In-house catering only. No confetti cannons.',
    photos: [ph('1519225421980-715cb0215aed'), ph('1505373877841-8d25f7d46678'), ph('1464366400600-7168b8af9bc3')],
    status: 'PENDING_APPROVAL',
    location: 'SRID=4326;POINT(35.5300 32.7959)',
    cancellation_policy: 'MODERATE',
  },
  {
    title: '[TEST] Netanya Seaview Studio',
    description: 'Light-filled studio above the Netanya cliffs — workshops, small celebrations and photo shoots.',
    address: '14 Nice Blvd',
    city: 'Netanya',
    capacity: 35,
    price_per_hour: 200,
    price_per_day: null,
    amenities: ['WiFi', 'Coffee', 'Air conditioning', 'Lounge', 'Photo Studio'],
    event_types: ['WORKSHOP', 'BIRTHDAY'],
    rules: 'Studio lighting included. No food near the seamless backdrop. Quiet hours after 21:00.',
    photos: [ph('1556761175-5973dc0f32e7'), ph('1497366216548-37526070297c'), ph('1517457373958-b7bdd4587205')],
    status: 'ACTIVE',
    location: 'SRID=4326;POINT(34.8532 32.3215)',
    cancellation_policy: 'FLEXIBLE',
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
