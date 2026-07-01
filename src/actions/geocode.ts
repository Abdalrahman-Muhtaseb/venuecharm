'use server'

import { reverseGeocodeCoordinates } from '@/lib/google-maps'

/** Server-side reverse geocoding — uses GOOGLE_MAPS_API_KEY (no referrer
 *  restrictions needed since this runs server-to-server). */
export async function reverseGeocode(lat: number, lng: number) {
  try {
    const result = await reverseGeocodeCoordinates(lat, lng)
    return { ok: true as const, address: result.formattedAddress, city: result.city ?? '' }
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : 'Geocoding failed' }
  }
}
