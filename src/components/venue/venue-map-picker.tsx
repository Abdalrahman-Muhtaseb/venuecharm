'use client'

import { reverseGeocodeCoordinates } from '@/lib/google-maps'
import { getDictionary, type Locale } from '@/lib/i18n'
import { Loader2, MapPin } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

declare global {
  interface Window {
    google?: {
      maps: any
    }
    initVenueCharmMap?: () => void
  }
}

type VenueMapPickerProps = {
  addressInputId: string
  cityInputId: string
  latitudeInputName: string
  longitudeInputName: string
  initialLatitude?: number
  initialLongitude?: number
  locale: Locale
}

const DEFAULT_CENTER = { lat: 31.0461, lng: 34.8516 }
const DEFAULT_ZOOM = 6
const SELECTED_ZOOM = 15
const GOOGLE_MAPS_SCRIPT_ID = 'venuecharm-google-maps-script'

export function VenueMapPicker({
  addressInputId,
  cityInputId,
  latitudeInputName,
  longitudeInputName,
  initialLatitude,
  initialLongitude,
  locale,
}: VenueMapPickerProps) {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [isReady, setIsReady] = useState(false)
  const [isResolving, setIsResolving] = useState(false)
  const [pickedLocation, setPickedLocation] = useState<{ lat: number; lng: number } | null>(
    initialLatitude && initialLongitude ? { lat: initialLatitude, lng: initialLongitude } : null,
  )
  const t = getDictionary(locale)

  const center = useMemo(
    () => pickedLocation ?? DEFAULT_CENTER,
    [pickedLocation],
  )

  useEffect(() => {
    if (typeof window === 'undefined') return

    const existing = document.getElementById(GOOGLE_MAPS_SCRIPT_ID)
    if (existing) {
      if (window.google?.maps) {
        setIsReady(true)
      }
      return
    }

    const apiKey =
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? process.env.GOOGLE_MAPS_API_KEY

    if (!apiKey) {
      return
    }

    window.initVenueCharmMap = () => setIsReady(true)

    const script = document.createElement('script')
    script.id = GOOGLE_MAPS_SCRIPT_ID
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initVenueCharmMap`
    script.async = true
    script.defer = true
    script.onerror = () => {
      setIsReady(false)
    }
    document.body.appendChild(script)
  }, [])

  useEffect(() => {
    const googleMaps = window.google?.maps
    if (!isReady || !mapRef.current || !googleMaps) return

    const map = new googleMaps.Map(mapRef.current, {
      center,
      zoom: pickedLocation ? SELECTED_ZOOM : DEFAULT_ZOOM,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      clickableIcons: false,
    })

    mapInstanceRef.current = map

    if (pickedLocation) {
      markerRef.current = new googleMaps.Marker({
        position: pickedLocation,
        map,
      })
    }

    map.addListener('click', async (event: any) => {
      const lat = event.latLng?.lat()
      const lng = event.latLng?.lng()
      if (typeof lat !== 'number' || typeof lng !== 'number') return

      setPickedLocation({ lat, lng })
      setIsResolving(true)

      if (markerRef.current) {
        markerRef.current.setMap(null)
      }

      markerRef.current = new googleMaps.Marker({
        position: { lat, lng },
        map,
      })

      map.panTo({ lat, lng })
      map.setZoom(SELECTED_ZOOM)

      const addressInput = document.getElementById(addressInputId) as HTMLInputElement | null
      const cityInput = document.getElementById(cityInputId) as HTMLInputElement | null
      const latitudeInput = document.querySelector<HTMLInputElement>(
        `input[name="${latitudeInputName}"]`,
      )
      const longitudeInput = document.querySelector<HTMLInputElement>(
        `input[name="${longitudeInputName}"]`,
      )

      if (latitudeInput) latitudeInput.value = String(lat)
      if (longitudeInput) longitudeInput.value = String(lng)

      try {
        const resolved = await reverseGeocodeCoordinates(lat, lng)
        if (addressInput) addressInput.value = resolved.formattedAddress
        if (cityInput && resolved.city) cityInput.value = resolved.city
      } finally {
        setIsResolving(false)
      }
    })
  }, [addressInputId, center, cityInputId, isReady, longitudeInputName, pickedLocation, latitudeInputName])

  return (
    <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4 md:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{t.mapPicker.title}</h2>
          <p className="text-sm text-slate-600">{t.mapPicker.subtitle}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          {isResolving ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
          <span>{isResolving ? t.mapPicker.resolving : t.mapPicker.ready}</span>
        </div>
      </div>

      <div ref={mapRef} className="h-[360px] w-full rounded-2xl border border-slate-200 bg-white" />

      <input type="hidden" name={latitudeInputName} value={pickedLocation?.lat ?? ''} readOnly />
      <input type="hidden" name={longitudeInputName} value={pickedLocation?.lng ?? ''} readOnly />

      {!isReady ? (
        <p className="mt-3 text-sm text-slate-500">
          {t.mapPicker.loading}
        </p>
      ) : null}
    </section>
  )
}
