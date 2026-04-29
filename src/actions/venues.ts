'use server'

import { geocodeAddress } from '@/lib/google-maps'
import { createClient } from '@/lib/supabase/server'
import { createVenueSchema } from '@/types/venue'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createVenue(formData: FormData) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'HOST') {
    throw new Error('Only hosts can create venues.')
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
  })

  if (error) throw new Error(error.message)

  const photosStr = formData.get('photos')
  const photos =
    photosStr && typeof photosStr === 'string' && photosStr.trim()
      ? photosStr.split(',').filter((u) => u.trim())
      : []

  if (photos.length > 0 && venueId) {
    await supabase.from('venues').update({ photos }).eq('id', venueId)
  }

  revalidatePath('/listings')
  redirect('/listings')
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

  const { error } = await supabase
    .from('venues')
    .update({
      title: parsed.title,
      description: parsed.description ?? '',
      address: String(parsed.address),
      city: String(parsed.city),
      capacity: parsed.capacity,
      price_per_hour: parsed.pricePerHour ?? null,
      price_per_day: parsed.pricePerDay ?? null,
      photos: mergedPhotos,
      // location is a geography column — use raw SQL via rpc if needed;
      // for now store coords in a separate RPC or skip coordinate update
      // if unchanged to avoid raw WKT issues with the JS client
      updated_at: new Date().toISOString(),
    })
    .eq('id', venueId)

  if (error) throw new Error(error.message)

  revalidatePath('/listings')
  revalidatePath(`/venues/${venueId}`)
  redirect('/listings')
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

  revalidatePath('/listings')
}
