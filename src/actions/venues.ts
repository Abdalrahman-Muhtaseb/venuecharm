'use server'

import { geocodeAddress } from '@/lib/google-maps'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createVenueSchema } from '@/types/venue'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createVenue(formData: FormData) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role, stripe_charges_enabled')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'HOST') {
    throw new Error('Only hosts can create venues.')
  }

  if (!profile.stripe_charges_enabled) {
    throw new Error('Please complete Stripe payout onboarding before creating a listing.')
  }

  const parsed = createVenueSchema.parse({
    title: formData.get('title'),
    description: formData.get('description'),
    address: formData.get('address'),
    city: formData.get('city'),
    capacity: formData.get('capacity'),
    latitude: formData.get('latitude'),
    longitude: formData.get('longitude'),
    pricePerHour: formData.get('pricePerHour') || undefined,
    pricePerDay: formData.get('pricePerDay') || undefined,
    cancellationPolicy: (formData.get('cancellationPolicy') as string) || 'MODERATE',
    rules: formData.get('rules') || undefined,
    openingTime: formData.get('openingTime') || undefined,
    closingTime: formData.get('closingTime') || undefined,
    bufferMinutes: formData.get('bufferMinutes') || undefined,
  })

  const hasSelectedPoint =
    typeof parsed.latitude === 'number' && typeof parsed.longitude === 'number'

  const coordinates = hasSelectedPoint
    ? { lat: parsed.latitude as number, lng: parsed.longitude as number }
    : await geocodeAddress(String(parsed.address), String(parsed.city))

  const { data: venueId, error } = await supabase.rpc('create_venue_listing', {
    p_title: parsed.title,
    p_description: parsed.description ?? '',
    p_address: String(parsed.address),
    p_city: String(parsed.city),
    p_capacity: parsed.capacity,
    p_latitude: coordinates.lat,
    p_longitude: coordinates.lng,
    p_price_per_hour: parsed.pricePerHour ?? null,
    p_price_per_day: parsed.pricePerDay ?? null,
    p_cancellation_policy: parsed.cancellationPolicy,
  })

  if (error) throw new Error(error.message)

  const photosStr = formData.get('photos')
  const photos =
    photosStr && typeof photosStr === 'string' && photosStr.trim()
      ? photosStr.split(',').filter((u) => u.trim())
      : []

  const amenitiesStr = formData.get('amenities')
  const amenities =
    amenitiesStr && typeof amenitiesStr === 'string' && amenitiesStr.trim()
      ? amenitiesStr.split(',').filter(Boolean)
      : []

  const eventTypesStr = formData.get('eventTypes')
  const eventTypes =
    eventTypesStr && typeof eventTypesStr === 'string' && eventTypesStr.trim()
      ? eventTypesStr.split(',').filter(Boolean)
      : []

  if (venueId) {
    const updates: Record<string, unknown> = { event_types: eventTypes, rules: parsed.rules ?? null }
    if (parsed.openingTime) updates.opening_time = parsed.openingTime
    if (parsed.closingTime) updates.closing_time = parsed.closingTime
    if (parsed.bufferMinutes != null) updates.buffer_minutes = parsed.bufferMinutes
    if (photos.length > 0) updates.photos = photos
    if (amenities.length > 0) updates.amenities = amenities
    await supabase.from('venues').update(updates).eq('id', venueId)

    const defaultDaysStr = formData.get('defaultDays')
    if (defaultDaysStr && typeof defaultDaysStr === 'string') {
      const days = defaultDaysStr.split(',').map(Number).filter((d) => !isNaN(d) && d >= 0 && d <= 6)
      if (days.length > 0) {
        const rows: { venue_id: string; date: string; is_available: boolean }[] = []
        const today = new Date()
        for (let i = 0; i < 90; i++) {
          const d = new Date(today)
          d.setDate(today.getDate() + i)
          rows.push({
            venue_id: venueId as string,
            date: d.toISOString().slice(0, 10),
            is_available: days.includes(d.getDay()),
          })
        }
        await supabase.from('availability').upsert(rows, { onConflict: 'venue_id,date' })
      }
    }
  }

  revalidatePath('/host/listings')
  redirect('/host/listings')
}

export async function updateVenue(formData: FormData) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const venueId = String(formData.get('venueId'))

  // Verify ownership
  const { data: existing } = await supabase
    .from('venues')
    .select('host_id, photos')
    .eq('id', venueId)
    .single()

  if (!existing || existing.host_id !== user.id) {
    throw new Error('Not authorised to edit this venue.')
  }

  const parsed = createVenueSchema.parse({
    title: formData.get('title'),
    description: formData.get('description'),
    address: formData.get('address'),
    city: formData.get('city'),
    capacity: formData.get('capacity'),
    latitude: formData.get('latitude'),
    longitude: formData.get('longitude'),
    pricePerHour: formData.get('pricePerHour') || undefined,
    pricePerDay: formData.get('pricePerDay') || undefined,
    cancellationPolicy: (formData.get('cancellationPolicy') as string) || 'MODERATE',
    rules: formData.get('rules') || undefined,
    openingTime: formData.get('openingTime') || undefined,
    closingTime: formData.get('closingTime') || undefined,
    bufferMinutes: formData.get('bufferMinutes') || undefined,
  })

  const hasSelectedPoint =
    typeof parsed.latitude === 'number' && typeof parsed.longitude === 'number'

  const coordinates = hasSelectedPoint
    ? { lat: parsed.latitude as number, lng: parsed.longitude as number }
    : await geocodeAddress(String(parsed.address), String(parsed.city))

  // Merge new photos with existing ones
  const newPhotosStr = formData.get('photos')
  const newPhotos =
    newPhotosStr && typeof newPhotosStr === 'string' && newPhotosStr.trim()
      ? newPhotosStr.split(',').filter((u) => u.trim())
      : []
  const mergedPhotos = newPhotos.length > 0 ? newPhotos : (existing.photos ?? [])

  const locationWkt = `POINT(${coordinates.lng} ${coordinates.lat})`

  const amenitiesStr = formData.get('amenities')
  const newAmenities =
    typeof amenitiesStr === 'string' ? amenitiesStr.split(',').filter(Boolean) : null

  const eventTypesStr = formData.get('eventTypes')
  const newEventTypes =
    typeof eventTypesStr === 'string' ? eventTypesStr.split(',').filter(Boolean) : null

  const updatePayload: Record<string, unknown> = {
    title: parsed.title,
    description: parsed.description ?? '',
    address: String(parsed.address),
    city: String(parsed.city),
    capacity: parsed.capacity,
    price_per_hour: parsed.pricePerHour ?? null,
    price_per_day: parsed.pricePerDay ?? null,
    photos: mergedPhotos,
    cancellation_policy: parsed.cancellationPolicy,
    rules: parsed.rules ?? null,
    updated_at: new Date().toISOString(),
  }
  if (parsed.openingTime) updatePayload.opening_time = parsed.openingTime
  if (parsed.closingTime) updatePayload.closing_time = parsed.closingTime
  if (parsed.bufferMinutes != null) updatePayload.buffer_minutes = parsed.bufferMinutes
  if (newAmenities !== null) updatePayload.amenities = newAmenities
  if (newEventTypes !== null) updatePayload.event_types = newEventTypes

  const { error } = await supabase
    .from('venues')
    .update(updatePayload)
    .eq('id', venueId)

  if (error) throw new Error(error.message)

  const { error: locationError } = await supabase.rpc('update_venue_location', {
    p_venue_id: venueId,
    p_latitude: coordinates.lat,
    p_longitude: coordinates.lng,
  })

  if (locationError) throw new Error(locationError.message)

  revalidatePath('/host/listings')
  revalidatePath(`/venues/${venueId}`)
  redirect('/host/listings')
}

export async function deleteVenue(venueId: string) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verify ownership before soft-deleting
  const { data: existing } = await supabase
    .from('venues')
    .select('host_id')
    .eq('id', venueId)
    .single()

  if (!existing || existing.host_id !== user.id) {
    throw new Error('Not authorised to delete this venue.')
  }

  const { error } = await supabase
    .from('venues')
    .update({ status: 'DRAFT', updated_at: new Date().toISOString() })
    .eq('id', venueId)

  if (error) throw new Error(error.message)

  revalidatePath('/host/listings')
}

async function requireAdmin() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'ADMIN') {
    throw new Error('Only admins can moderate venues.')
  }

  return supabase
}

export async function approveVenue(venueId: string) {
  await requireAdmin() // verify caller is ADMIN

  const { error } = await createAdminClient() // bypass RLS for the update
    .from('venues')
    .update({ status: 'ACTIVE', updated_at: new Date().toISOString() })
    .eq('id', venueId)

  if (error) throw new Error(error.message)

  revalidatePath('/admin')
  revalidatePath(`/admin/${venueId}`)
  revalidatePath('/venues')
  revalidatePath(`/venues/${venueId}`)
}

export async function suspendVenue(venueId: string) {
  await requireAdmin() // verify caller is ADMIN

  const { error } = await createAdminClient() // bypass RLS for the update
    .from('venues')
    .update({ status: 'SUSPENDED', updated_at: new Date().toISOString() })
    .eq('id', venueId)

  if (error) throw new Error(error.message)

  revalidatePath('/admin')
  revalidatePath(`/admin/${venueId}`)
  revalidatePath('/venues')
  revalidatePath(`/venues/${venueId}`)
}
