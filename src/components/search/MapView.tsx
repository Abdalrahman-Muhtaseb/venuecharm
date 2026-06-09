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
  city: string
  lat: number
  lng: number
  price_per_hour?: number | null
  price_per_day?: number | null
  photos?: string[] | null
  capacity?: number
  avg_rating?: number | null
  review_count?: number | null
}

interface MapViewProps {
  venues: MapVenue[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onBoundsChange?: (lat: number, lng: number, radiusKm: number) => void
  /** Increments on URL-driven searches so the map re-fits bounds */
  searchKey?: number
  locale: Locale
}

const GOOGLE_MAPS_SCRIPT_ID = 'venuecharm-google-maps-script'
const ISRAEL_CENTER = { lat: 31.5, lng: 34.85 }

function applyBubbleStyle(el: HTMLElement, selected: boolean): void {
  el.style.cssText = [
    'display:inline-flex',
    'align-items:center',
    'justify-content:center',
    'padding:5px 10px',
    'border-radius:20px',
    'font-family:-apple-system,BlinkMacSystemFont,Arial,sans-serif',
    'font-size:12px',
    'font-weight:700',
    'white-space:nowrap',
    'cursor:pointer',
    'user-select:none',
    'line-height:1',
    'transition:transform 0.12s ease,box-shadow 0.12s ease',
    selected
      ? 'background:#7c3aed;color:white;border:2px solid #6d28d9;box-shadow:0 3px 10px rgba(124,58,237,0.4);transform:scale(1.1)'
      : 'background:white;color:#111827;border:1.5px solid #d1d5db;box-shadow:0 2px 6px rgba(0,0,0,0.18);transform:scale(1)',
  ].join(';')
}

function makeBubbleElement(price: number | null | undefined, selected: boolean): HTMLDivElement {
  const el = document.createElement('div')
  el.textContent = price != null ? `₪${Math.round(price)}` : '•'
  applyBubbleStyle(el, selected)
  return el
}

function getMapRadiusKm(map: any): number {
  const bounds = map.getBounds()
  const center = map.getCenter()
  if (!bounds || !center) return 40
  const ne = bounds.getNorthEast()
  const R = 6371
  const lat1 = (center.lat() * Math.PI) / 180
  const lat2 = (ne.lat() * Math.PI) / 180
  const dLat = lat2 - lat1
  const dLng = ((ne.lng() - center.lng()) * Math.PI) / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return Math.max(5, R * 2 * Math.asin(Math.sqrt(a)))
}

function makePopupHTML(venue: MapVenue, locale: Locale): string {
  const isHe = locale === 'he'
  const price =
    venue.price_per_hour != null
      ? `₪${Math.round(venue.price_per_hour)}${isHe ? '/שעה' : '/hr'}`
      : venue.price_per_day != null
      ? `₪${Math.round(venue.price_per_day)}${isHe ? '/יום' : '/day'}`
      : ''
  const capacityText =
    venue.capacity != null
      ? `<div style="color:#9ca3af;font-size:11px;margin-top:2px">${
          isHe
            ? `עד ${venue.capacity} אנשים`
            : `Up to ${venue.capacity} guests`
        }</div>`
      : ''
  const ratingText =
    venue.avg_rating != null
      ? `<div style="display:flex;align-items:center;gap:3px;margin-top:4px"><span style="color:#f59e0b;font-size:13px;line-height:1">★</span><span style="color:#111827;font-weight:600;font-size:12px">${venue.avg_rating.toFixed(1)}</span>${venue.review_count != null ? `<span style="color:#9ca3af;font-size:11px">(${venue.review_count})</span>` : ''}</div>`
      : ''
  const photo = venue.photos?.[0]
  const dir = isHe ? ' dir="rtl"' : ''
  const safeTitle = venue.title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
  const safeCity = venue.city.replace(/&/g, '&amp;').replace(/</g, '&lt;')
  const safePhoto = photo ? photo.replace(/"/g, '&quot;') : ''

  return `<a href="/venues/${venue.id}"${dir} style="display:block;width:220px;text-decoration:none;color:inherit;font-family:-apple-system,BlinkMacSystemFont,Arial,sans-serif">${
    photo
      ? `<div style="width:100%;height:130px;overflow:hidden"><img src="${safePhoto}" alt="" style="width:100%;height:100%;object-fit:cover" loading="lazy"/></div>`
      : `<div style="width:100%;height:80px;background:#f3f4f6;display:flex;align-items:center;justify-content:center;color:#9ca3af;font-size:12px">${isHe ? 'No photo' : 'No photo'}</div>`
  }<div style="padding:10px 12px 12px"><div style="font-weight:600;font-size:13px;line-height:1.35;color:#111827;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${safeTitle}</div><div style="color:#6b7280;font-size:11px;margin-top:3px">${safeCity}</div>${capacityText}${ratingText}${price ? `<div style="color:#7c3aed;font-weight:700;font-size:13px;margin-top:6px">${price}</div>` : ''}</div></a>`
}

export function MapView({
  venues,
  selectedId,
  onSelect,
  onBoundsChange,
  searchKey = 0,
  locale,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<Map<string, any>>(new Map())
  const infoWindowRef = useRef<any>(null)
  const [isReady, setIsReady] = useState(false)
  const [searchAsIMove, setSearchAsIMove] = useState(false)

  // Refs to keep latest values accessible inside persistent event listeners
  const onSelectRef = useRef(onSelect)
  const onBoundsChangeRef = useRef(onBoundsChange)
  const searchAsIMoveRef = useRef(false)
  const venuesRef = useRef(venues)
  const prevSearchKeyRef = useRef(-1)

  useEffect(() => { onSelectRef.current = onSelect }, [onSelect])
  useEffect(() => { onBoundsChangeRef.current = onBoundsChange }, [onBoundsChange])
  useEffect(() => { searchAsIMoveRef.current = searchAsIMove }, [searchAsIMove])
  useEffect(() => { venuesRef.current = venues }, [venues])

  // Load Google Maps script with marker library
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
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker,places&callback=initVenueCharmSearchMap`
    script.async = true
    script.defer = true
    document.body.appendChild(script)
  }, [])

  // Build map and attach persistent listeners (once)
  useEffect(() => {
    if (!isReady || !mapRef.current || !window.google?.maps) return
    if (mapInstanceRef.current) return
    const googleMaps = window.google!.maps
    const map = new googleMaps.Map(mapRef.current, {
      center: ISRAEL_CENTER,
      zoom: 7,
      mapId: 'DEMO_MAP_ID',
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: true,
      clickableIcons: false,
      gestureHandling: 'greedy',
      styles: [{ featureType: 'poi', stylers: [{ visibility: 'off' }] }],
    })
    mapInstanceRef.current = map

    map.addListener('click', () => {
      infoWindowRef.current?.close()
      onSelectRef.current(null)
    })

    map.addListener('dragstart', () => {
      infoWindowRef.current?.close()
    })

    map.addListener('idle', () => {
      if (!searchAsIMoveRef.current) return
      const center = map.getCenter()
      if (!center) return
      onBoundsChangeRef.current?.(center.lat(), center.lng(), getMapRadiusKm(map))
    })
  }, [isReady])

  // Rebuild markers whenever venues change
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!isReady || !map || !window.google?.maps) return
    const googleMaps = window.google!.maps
    const AdvancedMarker = googleMaps.marker?.AdvancedMarkerElement

    infoWindowRef.current?.close()
    markersRef.current.forEach((m) => { m.map = null })
    markersRef.current.clear()

    if (venues.length === 0) return

    const bounds = new googleMaps.LatLngBounds()
    let pinCount = 0

    venues.forEach((venue) => {
      if (!venue.lat || !venue.lng) return
      const isSelected = venue.id === selectedId
      let marker: any

      if (AdvancedMarker) {
        const el = makeBubbleElement(venue.price_per_hour, isSelected)
        marker = new AdvancedMarker({
          position: { lat: venue.lat, lng: venue.lng },
          map,
          content: el,
          title: venue.title,
          zIndex: isSelected ? 10 : 1,
        })
        marker.addListener('gmp-click', () => {
          onSelectRef.current(venue.id)
          if (!infoWindowRef.current) {
            infoWindowRef.current = new googleMaps.InfoWindow({ maxWidth: 240 })
          }
          infoWindowRef.current.setContent(makePopupHTML(venue, locale))
          infoWindowRef.current.open({ anchor: marker, map })
        })
      } else {
        // Fallback: legacy Marker with circle symbol (if library failed to load)
        marker = new googleMaps.Marker({
          position: { lat: venue.lat, lng: venue.lng },
          map,
          title: venue.title,
          icon: {
            path: googleMaps.SymbolPath.CIRCLE,
            scale: isSelected ? 10 : 8,
            fillColor: isSelected ? '#7c3aed' : '#ffffff',
            fillOpacity: 1,
            strokeColor: '#7c3aed',
            strokeWeight: 2,
          },
          zIndex: isSelected ? 10 : 1,
        })
        marker.addListener('click', () => {
          onSelectRef.current(venue.id)
          if (!infoWindowRef.current) {
            infoWindowRef.current = new googleMaps.InfoWindow({ maxWidth: 240 })
          }
          infoWindowRef.current.setContent(makePopupHTML(venue, locale))
          infoWindowRef.current.open({ anchor: marker, map })
        })
      }

      markersRef.current.set(venue.id, marker)
      bounds.extend({ lat: venue.lat, lng: venue.lng })
      pinCount++
    })

    // Only fit bounds for URL-driven searches, not map-movement searches
    const isNewSearch = searchKey !== prevSearchKeyRef.current
    if (isNewSearch) {
      prevSearchKeyRef.current = searchKey
      if (pinCount > 0) map.fitBounds(bounds, pinCount === 1 ? 80 : 30)
    }
  }, [isReady, venues, locale]) // selectedId intentionally excluded — handled separately below

  // Update only the two affected markers when selection changes (no full rebuild)
  useEffect(() => {
    if (!isReady || !window.google?.maps) return
    const googleMaps = window.google!.maps
    const hasAdvanced = !!googleMaps.marker?.AdvancedMarkerElement

    markersRef.current.forEach((marker, id) => {
      const isSelected = id === selectedId
      if (hasAdvanced) {
        const el = marker.content as HTMLElement | undefined
        if (el) applyBubbleStyle(el, isSelected)
        marker.zIndex = isSelected ? 10 : 1
      } else {
        marker.setIcon({
          path: googleMaps.SymbolPath.CIRCLE,
          scale: isSelected ? 10 : 8,
          fillColor: isSelected ? '#7c3aed' : '#ffffff',
          fillOpacity: 1,
          strokeColor: '#7c3aed',
          strokeWeight: 2,
        })
        marker.setZIndex(isSelected ? 10 : 1)
      }
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

  const isHe = locale === 'he'

  return (
    <div className="relative h-full min-h-[400px]">
      <div ref={mapRef} className="h-full w-full rounded-xl" />

      {isReady && (
        <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2">
          <label className="flex cursor-pointer select-none items-center gap-2 rounded-full bg-white px-4 py-2.5 shadow-lg ring-1 ring-black/10 transition-colors hover:bg-gray-50">
            <input
              type="checkbox"
              checked={searchAsIMove}
              onChange={(e) => setSearchAsIMove(e.target.checked)}
              className="h-3.5 w-3.5 accent-violet-600"
            />
            <span className="whitespace-nowrap text-xs font-medium text-gray-700">
              {isHe ? 'חפש בזמן תזוזת המפה' : 'Search as I move the map'}
            </span>
          </label>
        </div>
      )}

      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-muted">
          <p className="text-sm text-muted-foreground">
            {isHe ? 'טוען מפה...' : 'Loading map...'}
          </p>
        </div>
      )}
    </div>
  )
}
