const GEOCODE_ENDPOINT = 'https://maps.googleapis.com/maps/api/geocode/json'

type GeocodeResult = {
  lat: number
  lng: number
  formattedAddress: string
}

export async function geocodeAddress(address: string, city: string): Promise<GeocodeResult> {
  const apiKey =
    process.env.GOOGLE_MAPS_API_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    throw new Error('Google Maps API key is missing. Add GOOGLE_MAPS_API_KEY in .env.local.')
  }

  const query = encodeURIComponent(`${address}, ${city}, Israel`)
  const url = `${GEOCODE_ENDPOINT}?address=${query}&key=${apiKey}`

  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error('Failed to geocode address. Please try again.')
  }

  const payload = (await response.json()) as {
    status: string
    results?: Array<{
      formatted_address: string
      geometry: { location: { lat: number; lng: number } }
    }>
    error_message?: string
  }

  if (payload.status !== 'OK' || !payload.results?.length) {
    const reason = payload.error_message ?? payload.status
    throw new Error(`Address could not be geocoded (${reason}).`)
  }

  const first = payload.results[0]

  return {
    lat: first.geometry.location.lat,
    lng: first.geometry.location.lng,
    formattedAddress: first.formatted_address,
  }
}

type ReverseGeocodeResult = GeocodeResult & {
  city: string
}

export async function reverseGeocodeCoordinates(
  latitude: number,
  longitude: number,
): Promise<ReverseGeocodeResult> {
  const apiKey =
    process.env.GOOGLE_MAPS_API_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    throw new Error('Google Maps API key is missing. Add GOOGLE_MAPS_API_KEY in .env.local.')
  }

  const url = `${GEOCODE_ENDPOINT}?latlng=${latitude},${longitude}&key=${apiKey}`

  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error('Failed to reverse geocode location. Please try again.')
  }

  const payload = (await response.json()) as {
    status: string
    results?: Array<{
      formatted_address: string
      address_components: Array<{ long_name: string; types: string[] }>
      geometry: { location: { lat: number; lng: number } }
    }>
    error_message?: string
  }

  if (payload.status !== 'OK' || !payload.results?.length) {
    const reason = payload.error_message ?? payload.status
    throw new Error(`Selected map location could not be resolved (${reason}).`)
  }

  const first = payload.results[0]
  const cityComponent = first.address_components.find((component) =>
    component.types.some((type) => type === 'locality' || type === 'administrative_area_level_1'),
  )

  return {
    lat: first.geometry.location.lat,
    lng: first.geometry.location.lng,
    formattedAddress: first.formatted_address,
    city: cityComponent?.long_name ?? '',
  }
}