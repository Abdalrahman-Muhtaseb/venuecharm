'use client'

import { useEffect, useRef, useState } from 'react'
import { MapPin } from 'lucide-react'
import { useTheme } from 'next-themes'
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
  hoveredId?: string | null
  onSelect: (id: string | null) => void
  onBoundsChange?: (lat: number, lng: number, radiusKm: number) => void
  /** Increments on URL-driven searches so the map re-fits bounds */
  searchKey?: number
  locale: Locale
}

const GOOGLE_MAPS_SCRIPT_ID = 'venuecharm-google-maps-script'
const ISRAEL_CENTER = { lat: 31.5, lng: 34.85 }

function applyBubbleStyle(el: HTMLElement, selected: boolean, hovered = false, dark = false): void {
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
      : hovered
        ? dark
          ? 'background:#4c1d95;color:#ede9fe;border:2px solid #a78bfa;box-shadow:0 3px 10px rgba(124,58,237,0.5);transform:scale(1.08)'
          : 'background:#ede9fe;color:#5b21b6;border:2px solid #7c3aed;box-shadow:0 3px 10px rgba(124,58,237,0.3);transform:scale(1.08)'
        : dark
          ? 'background:#1f2937;color:#f9fafb;border:1.5px solid #4b5563;box-shadow:0 2px 6px rgba(0,0,0,0.5);transform:scale(1)'
          : 'background:white;color:#111827;border:1.5px solid #d1d5db;box-shadow:0 2px 6px rgba(0,0,0,0.18);transform:scale(1)',
  ].join(';')
}

function makeBubbleElement(price: number | null | undefined, selected: boolean, dark: boolean): HTMLDivElement {
  const el = document.createElement('div')
  el.textContent = price != null ? `₪${Math.round(price)}` : '•'
  applyBubbleStyle(el, selected, false, dark)
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

function makePopupHTML(venue: MapVenue, locale: Locale, dark: boolean): string {
  const isHe = locale === 'he'
  const cardBg       = dark ? '#1f2937' : '#ffffff'
  const textColor    = dark ? '#f9fafb' : '#111827'
  const subtleColor  = dark ? '#9ca3af' : '#6b7280'
  const priceColor   = dark ? '#a78bfa' : '#7c3aed'
  const noPhotoBg    = dark ? '#374151' : '#f3f4f6'
  const priceVal =
    venue.price_per_hour != null
      ? `₪${Math.round(venue.price_per_hour)}`
      : venue.price_per_day != null
      ? `₪${Math.round(venue.price_per_day)}`
      : ''
  const priceUnit =
    venue.price_per_hour != null
      ? (isHe ? ' / שעה' : ' / hr')
      : venue.price_per_day != null
      ? (isHe ? ' / יום' : ' / day')
      : ''
  const capacityText =
    venue.capacity != null
      ? ` · ${isHe ? `עד ${venue.capacity} אורחים` : `Up to ${venue.capacity} guests`}`
      : ''
  const ratingInline =
    venue.avg_rating != null
      ? `<span style="display:inline-flex;align-items:center;gap:3px;white-space:nowrap;font-size:12px;line-height:1.35;color:${textColor}"><span style="color:#f59e0b">★</span><span style="font-weight:600">${venue.avg_rating.toFixed(1)}</span>${venue.review_count != null && venue.review_count > 0 ? `<span style="color:${subtleColor};font-weight:400">(${venue.review_count})</span>` : ''}</span>`
      : ''
  const closeBtn = `<div data-popup-close role="button" aria-label="${isHe ? 'סגור' : 'Close'}" style="position:absolute;top:8px;${isHe ? 'left' : 'right'}:8px;width:26px;height:26px;border-radius:999px;background:rgba(255,255,255,0.95);display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,0.25);cursor:pointer;font-size:13px;line-height:1;color:#111827">✕</div>`
  const photo = venue.photos?.[0]
  const dir = isHe ? ' dir="rtl"' : ''
  const safeTitle = venue.title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
  const safeCity = venue.city.replace(/&/g, '&amp;').replace(/</g, '&lt;')
  const safePhoto = photo ? photo.replace(/"/g, '&quot;') : ''

  const media = `<div style="position:relative;width:100%;aspect-ratio:16/10;background:${noPhotoBg};overflow:hidden">${
    photo
      ? `<img src="${safePhoto}" alt="" style="width:100%;height:100%;object-fit:cover;display:block" loading="lazy"/>`
      : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:${subtleColor};font-size:12px">${isHe ? 'אין תמונה' : 'No photo'}</div>`
  }${closeBtn}</div>`

  const titleRow = `<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px"><div style="flex:1;min-width:0;font-weight:600;font-size:13.5px;line-height:1.35;color:${textColor};overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${safeTitle}</div>${ratingInline}</div>`

  const priceLine = priceVal
    ? `<div style="margin-top:6px;font-size:13px;color:${textColor}"><span style="font-weight:700;color:${priceColor}">${priceVal}</span><span style="color:${subtleColor}">${priceUnit}</span></div>`
    : ''

  return `<a href="/venues/${venue.id}" target="_blank" rel="noopener noreferrer"${dir} style="display:block;width:240px;text-decoration:none;color:inherit;background:${cardBg};border-radius:16px;overflow:hidden;box-shadow:0 8px 28px rgba(0,0,0,0.22);font-family:-apple-system,BlinkMacSystemFont,Arial,sans-serif">${media}<div style="padding:10px 12px 12px">${titleRow}<div style="color:${subtleColor};font-size:11.5px;margin-top:3px">${safeCity}${capacityText}</div>${priceLine}</div></a>`
}

// Custom floating popup (Airbnb-style): no tail, edge-aware placement, stays
// within the map viewport without auto-panning the map.
function createPopupOverlay(googleMaps: any, onClose: () => void): any {
  class Popup extends googleMaps.OverlayView {
    position: any = null
    anchorHeight = 0
    container: HTMLDivElement

    constructor() {
      super()
      const container = document.createElement('div')
      container.style.position = 'absolute'
      container.style.zIndex = '60'
      container.style.willChange = 'transform'
      container.addEventListener('click', (e: MouseEvent) => {
        const target = e.target as HTMLElement | null
        if (target?.closest('[data-popup-close]')) {
          e.preventDefault()
          e.stopPropagation()
          onClose()
        }
      })
      googleMaps.OverlayView.preventMapHitsAndGesturesFrom(container)
      this.container = container
    }

    setContent(html: string) {
      this.container.innerHTML = html
    }

    setPosition(pos: any, anchorHeight = 0) {
      this.position = pos
      this.anchorHeight = anchorHeight
      if (this.getMap()) this.draw()
    }

    onAdd() {
      this.getPanes()?.floatPane.appendChild(this.container)
    }

    onRemove() {
      this.container.parentElement?.removeChild(this.container)
    }

    draw() {
      const proj = this.getProjection()
      if (!proj || !this.position) return
      const divPt = proj.fromLatLngToDivPixel(this.position)
      const contPt = proj.fromLatLngToContainerPixel(this.position)
      if (!divPt || !contPt) return

      const gap = 10
      const margin = 10
      const w = this.container.offsetWidth || 240
      const h = this.container.offsetHeight || 0
      const mapEl = this.getMap()?.getDiv() as HTMLElement | undefined
      const mapW = mapEl?.offsetWidth ?? 0
      // The marker's anchor is its bottom-center, so the price bubble sits above
      // the point. Clear the bubble's full height when placing the card above it.
      const anchorH = this.anchorHeight

      // Flip below the marker when there isn't room above (near the top edge)
      const placeBelow = contPt.y < h + anchorH + gap + margin

      // Keep the card horizontally inside the viewport
      let dx = 0
      if (mapW > 0) {
        const left = contPt.x - w / 2
        const right = contPt.x + w / 2
        if (left < margin) dx = margin - left
        else if (right > mapW - margin) dx = mapW - margin - right
      }

      this.container.style.left = `${divPt.x}px`
      this.container.style.top = `${divPt.y}px`
      this.container.style.transform = placeBelow
        ? `translate(calc(-50% + ${dx}px), ${gap}px)`
        : `translate(calc(-50% + ${dx}px), calc(-100% - ${anchorH + gap}px))`
    }
  }
  return new Popup()
}

export function MapView({
  venues,
  selectedId,
  hoveredId = null,
  onSelect,
  onBoundsChange,
  searchKey = 0,
  locale,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<Map<string, any>>(new Map())
  const popupRef = useRef<any>(null)
  const [isReady, setIsReady] = useState(false)
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  // colorScheme can only be set at map creation, so theme changes force a rebuild
  const [mapVersion, setMapVersion] = useState(0)
  const builtSchemeRef = useRef<string | null>(null)

  // Refs to keep latest values accessible inside persistent event listeners
  const onSelectRef = useRef(onSelect)
  const onBoundsChangeRef = useRef(onBoundsChange)
  const venuesRef = useRef(venues)
  const selectedIdRef = useRef(selectedId)
  const prevSearchKeyRef = useRef(-1)
  // Suppress the idle that fires after a programmatic fitBounds so we don't double-fetch
  const suppressNextIdleRef = useRef(false)

  useEffect(() => { onSelectRef.current = onSelect }, [onSelect])
  useEffect(() => { onBoundsChangeRef.current = onBoundsChange }, [onBoundsChange])
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

  // Build map and attach persistent listeners (rebuilds when theme changes)
  useEffect(() => {
    if (!isReady || !mapRef.current || !window.google?.maps) return
    const scheme = isDark ? 'DARK' : 'LIGHT'
    if (mapInstanceRef.current && builtSchemeRef.current === scheme) return
    const googleMaps = window.google!.maps

    // Preserve camera position when rebuilding for a theme change
    const prev = mapInstanceRef.current
    const center = prev?.getCenter?.() ?? ISRAEL_CENTER
    const zoom = prev?.getZoom?.() ?? 7

    popupRef.current?.setMap(null)
    popupRef.current = null
    markersRef.current.forEach((m) => { m.map = null })
    markersRef.current.clear()

    const map = new googleMaps.Map(mapRef.current, {
      center,
      zoom,
      mapId: 'DEMO_MAP_ID',
      colorScheme: scheme,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: true,
      clickableIcons: false,
      gestureHandling: 'greedy',
      styles: [{ featureType: 'poi', stylers: [{ visibility: 'off' }] }],
    })
    builtSchemeRef.current = scheme
    mapInstanceRef.current = map
    popupRef.current = createPopupOverlay(googleMaps, () => {
      popupRef.current?.setMap(null)
      onSelectRef.current(null)
    })
    setMapVersion((v) => v + 1)

    map.addListener('click', () => {
      popupRef.current?.setMap(null)
      onSelectRef.current(null)
    })

    map.addListener('dragstart', () => {
      popupRef.current?.setMap(null)
    })

    map.addListener('idle', () => {
      if (suppressNextIdleRef.current) {
        suppressNextIdleRef.current = false
        return
      }
      const center = map.getCenter()
      if (!center) return
      onBoundsChangeRef.current?.(center.lat(), center.lng(), getMapRadiusKm(map))
    })
  }, [isReady, isDark])

  // Rebuild markers whenever venues change
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!isReady || !map || !window.google?.maps) return
    const googleMaps = window.google!.maps
    const AdvancedMarker = googleMaps.marker?.AdvancedMarkerElement

    popupRef.current?.setMap(null)
    markersRef.current.forEach((m) => { m.map = null })
    markersRef.current.clear()

    const openPopup = (venue: MapVenue, anchorHeight: number) => {
      const popup = popupRef.current
      if (!popup) return
      popup.setContent(makePopupHTML(venue, locale, isDark))
      popup.setPosition(new googleMaps.LatLng(venue.lat, venue.lng), anchorHeight)
      popup.setMap(map)
    }

    if (venues.length === 0) return

    const bounds = new googleMaps.LatLngBounds()
    let pinCount = 0

    venues.forEach((venue) => {
      if (!venue.lat || !venue.lng) return
      const isSelected = venue.id === selectedId
      let marker: any

      if (AdvancedMarker) {
        const el = makeBubbleElement(venue.price_per_hour ?? venue.price_per_day, isSelected, isDark)
        marker = new AdvancedMarker({
          position: { lat: venue.lat, lng: venue.lng },
          map,
          content: el,
          title: venue.title,
          zIndex: isSelected ? 10 : 1,
        })
        marker.addListener('gmp-click', () => {
          onSelectRef.current(venue.id)
          openPopup(venue, el.offsetHeight || 30)
        })
        // Lift the hovered bubble above any overlapping neighbours.
        el.addEventListener('mouseenter', () => { marker.zIndex = 1000 })
        el.addEventListener('mouseleave', () => {
          marker.zIndex = venue.id === selectedIdRef.current ? 10 : 1
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
          openPopup(venue, 24)
        })
      }

      markersRef.current.set(venue.id, marker)
      bounds.extend({ lat: venue.lat, lng: venue.lng })
      pinCount++
    })

    // Fit bounds for URL-driven searches; suppress the idle that follows so we
    // don't immediately overwrite server results with a redundant map search.
    const isNewSearch = searchKey !== prevSearchKeyRef.current
    if (isNewSearch) {
      prevSearchKeyRef.current = searchKey
      if (pinCount > 0) {
        suppressNextIdleRef.current = true
        map.fitBounds(bounds, pinCount === 1 ? 80 : 30)
      }
    }
  }, [isReady, venues, locale, mapVersion, isDark]) // selectedId intentionally excluded — handled separately below

  // Update marker styles when selection or hover changes (no full rebuild)
  useEffect(() => {
    if (!isReady || !window.google?.maps) return
    const googleMaps = window.google!.maps
    const hasAdvanced = !!googleMaps.marker?.AdvancedMarkerElement

    selectedIdRef.current = selectedId
    markersRef.current.forEach((marker, id) => {
      const isSelected = id === selectedId
      const isHovered = !isSelected && id === hoveredId
      if (hasAdvanced) {
        const el = marker.content as HTMLElement | undefined
        if (el) applyBubbleStyle(el, isSelected, isHovered, isDark)
        marker.zIndex = isSelected ? 10 : isHovered ? 5 : 1
      } else {
        marker.setIcon({
          path: googleMaps.SymbolPath.CIRCLE,
          scale: isSelected ? 10 : isHovered ? 9 : 8,
          fillColor: isSelected ? '#7c3aed' : isHovered ? '#ede9fe' : '#ffffff',
          fillOpacity: 1,
          strokeColor: '#7c3aed',
          strokeWeight: isSelected || isHovered ? 2 : 1.5,
        })
        marker.setZIndex(isSelected ? 10 : isHovered ? 5 : 1)
      }
    })
  }, [isReady, selectedId, hoveredId, isDark])

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
    <div className="relative h-full min-h-[520px]">
      <div ref={mapRef} className="h-full w-full rounded-xl" />

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
