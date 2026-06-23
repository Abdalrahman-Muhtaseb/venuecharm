'use client'

import { useEffect, useRef, useState } from 'react'
import { MapPin } from 'lucide-react'
import { useTheme } from 'next-themes'
import type { Locale } from '@/lib/i18n'

declare global {
  interface Window {
    google?: { maps: any }
  }
}

const GOOGLE_MAPS_SCRIPT_ID = 'venuecharm-google-maps-script'

interface VenueLocationMapProps {
  lat: number
  lng: number
  title: string
  locale: Locale
}

export function VenueLocationMap({ lat, lng, title, locale }: VenueLocationMapProps) {
  const isHe = locale === 'he'
  const mapRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.google?.maps) { setReady(true); return }
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) return
    if (!document.getElementById(GOOGLE_MAPS_SCRIPT_ID)) {
      const script = document.createElement('script')
      script.id = GOOGLE_MAPS_SCRIPT_ID
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker`
      script.async = true
      script.defer = true
      document.body.appendChild(script)
    }
    const poll = setInterval(() => {
      if (window.google?.maps) { setReady(true); clearInterval(poll) }
    }, 200)
    return () => clearInterval(poll)
  }, [])

  useEffect(() => {
    if (!ready || !mapRef.current || !window.google?.maps) return
    const g = window.google.maps
    const map = new g.Map(mapRef.current, {
      center: { lat, lng },
      zoom: 14,
      mapId: 'DEMO_MAP_ID',
      colorScheme: isDark ? 'DARK' : 'LIGHT',
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      clickableIcons: false,
      gestureHandling: 'cooperative',
      styles: [{ featureType: 'poi', stylers: [{ visibility: 'off' }] }],
    })
    const AdvancedMarker = g.marker?.AdvancedMarkerElement
    if (AdvancedMarker) {
      new AdvancedMarker({ position: { lat, lng }, map, title })
    } else {
      new g.Marker({ position: { lat, lng }, map, title })
    }
  }, [ready, lat, lng, title, isDark])

  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) return null

  return (
    <div className="relative h-72 w-full overflow-hidden rounded-2xl bg-muted">
      <div ref={mapRef} className="h-full w-full" />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-5 w-5" aria-hidden="true" />
          {isHe ? 'טוען מפה...' : 'Loading map...'}
        </div>
      )}
    </div>
  )
}
