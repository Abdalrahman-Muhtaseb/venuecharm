'use server'

import { geocodeAddress } from '@/lib/google-maps'
import { createClient } from '@/lib/supabase/server'
import { createVenueSchema } from '@/types/venue'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createVenue(formData: FormData) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'HOST') {
    throw new Error('Only hosts can create venues. Please register as a host.')
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

  const venueAddress = String(parsed.address)

  const venueCity = String(parsed.city)

  const coordinates = hasSelectedPoint
    ? { lat: parsed.latitude as number, lng: parsed.longitude as number }
    : await geocodeAddress(String(parsed.address), String(parsed.city))

  const { data: venueId, error } = await supabase.rpc('create_venue_listing', {
    p_title: parsed.title,
    p_description: parsed.description ?? '',
    p_address: venueAddress,
    p_city: venueCity,
    p_capacity: parsed.capacity,
    p_latitude: coordinates.lat,
    p_longitude: coordinates.lng,
    p_price_per_hour: parsed.pricePerHour ?? null,
    p_price_per_day: parsed.pricePerDay ?? null,
  })

  if (error) {
    throw new Error(error.message)
  }

  // Handle photo uploads if provided
  const photosStr = formData.get('photos')
  const photos = photosStr && typeof photosStr === 'string' && photosStr.trim()
    ? photosStr.split(',').filter(url => url.trim())
    : []

  if (photos.length > 0 && venueId) {
    const { error: photoError } = await supabase
      .from('venues')
      .update({ photos })
      .eq('id', venueId)

    if (photoError) {
      console.error('Failed to save photos:', photoError)
      // Continue anyway - venue creation succeeded
    }
  }

  revalidatePath('/dashboard')
  redirect('/dashboard')
}
