'use client'

import { useEffect, useRef, useState } from 'react'
import { MapPin } from 'lucide-react'
import type { Locale } from '@/lib/i18n'

declare global {
  interface Window {
    google?: { maps: any }
    initVenueCharmSearchMap?: () => void
  }
}

export interface MapVenue {
  id: string
  title: string
  lat: number
  lng: number
  price_per_hour?: number | null
}

interface MapViewProps {
  venues: MapVenue[]
  selectedId: string | null
  onSelect: (id: string) => void
  locale: Locale
}

const GOOGLE_MAPS_SCRIPT_ID = 'venuecharm-google-maps-script'
const ISRAEL_CENTER = { lat: 31.5, lng: 34.85 }

export function MapView({ venues, selectedId, onSelect, locale }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<Map<string, any>>(new Map())
  const [isReady, setIsReady] = useState(false)

  // Load Google Maps script once
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.google?.maps) { setIsReady(true); return }
    if (document.getElementById(GOOGLE_MAPS_SCRIPT_ID)) {
      const poll = setInterval(() => {
        if (window.google?.maps) { setIsReady(true); clearInterval(poll) }
      }, 200)
      return () => clearInterval(poll)
    }
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) return
    window.initVenueCharmSearchMap = () => setIsReady(true)
    const script = document.createElement('script')
    script.id = GOOGLE_MAPS_SCRIPT_ID
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initVenueCharmSearchMap`
    script.async = true
    script.defer = true
    document.body.appendChild(script)
  }, [])

  // Build map once ready
  useEffect(() => {
    if (!isReady || !mapRef.current || !window.google?.maps) return
    if (mapInstanceRef.current) return // already built
    const googleMaps = window.google!.maps
    mapInstanceRef.current = new googleMaps.Map(mapRef.current, {
      center: ISRAEL_CENTER,
      zoom: 7,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      clickableIcons: false,
      styles: [{ featureType: 'poi', stylers: [{ visibility: 'off' }] }],
    })
  }, [isReady])

  // Sync markers when venues change
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!isReady || !map || !window.google?.maps) return
    const googleMaps = window.google!.maps

    // Remove old markers
    markersRef.current.forEach((m) => m.setMap(null))
    markersRef.current.clear()

    if (venues.length === 0) return

    const bounds = new googleMaps.LatLngBounds()

    venues.forEach((venue) => {
      if (!venue.lat || !venue.lng) return

      const marker = new googleMaps.Marker({
        position: { lat: venue.lat, lng: venue.lng },
        map,
        title: venue.title,
        icon: {
          path: googleMaps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: venue.id === selectedId ? '#7c3aed' : '#ffffff',
          fillOpacity: 1,
          strokeColor: '#7c3aed',
          strokeWeight: 2,
        },
      })

      marker.addListener('click', () => onSelect(venue.id))
      markersRef.current.set(venue.id, marker)
      bounds.extend({ lat: venue.lat, lng: venue.lng })
    })

    if (venues.length > 0) map.fitBounds(bounds)
  }, [isReady, venues, selectedId, onSelect])

  // Update selected marker colour without rebuilding all markers
  useEffect(() => {
    if (!isReady || !window.google?.maps) return
    const googleMaps = window.google!.maps
    markersRef.current.forEach((marker, id) => {
      marker.setIcon({
        path: googleMaps.SymbolPath.CIRCLE,
        scale: id === selectedId ? 10 : 8,
        fillColor: id === selectedId ? '#7c3aed' : '#ffffff',
        fillOpacity: 1,
        strokeColor: '#7c3aed',
        strokeWeight: 2,
      })
    })
  }, [isReady, selectedId])

  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-3 rounded-xl bg-muted text-muted-foreground">
        <MapPin className="h-8 w-8" />
        <p className="text-sm">{locale === 'he' ? 'מפה לא זמינה' : 'Map not configured'}</p>
      </div>
    )
  }

  return (
    <div className="relative h-full min-h-[400px]">
      <div ref={mapRef} className="h-full w-full rounded-xl" />
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-muted">
          <p className="text-sm text-muted-foreground">
            {locale === 'he' ? 'טוען מפה...' : 'Loading map...'}
          </p>
        </div>
      )}
    </div>
  )
}
