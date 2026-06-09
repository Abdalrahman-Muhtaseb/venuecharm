'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Map, List } from 'lucide-react'
import { VenueGrid } from '@/components/venue/VenueGrid'
import { MapView, type MapVenue } from '@/components/search/MapView'
import type { VenueCardProps } from '@/components/venue/VenueCard'
import type { Locale } from '@/lib/i18n'

type SearchVenue = Omit<VenueCardProps, 'locale' | 'highlighted' | 'showStatus'> & {
  lat?: number | null
  lng?: number | null
  distance_km?: number | null
}

interface SearchResultsProps {
  venues: SearchVenue[]
  locale: Locale
  totalCount?: number
}

export function SearchResults({ venues: initialVenues, locale }: SearchResultsProps) {
  const [liveVenues, setLiveVenues] = useState<SearchVenue[]>(initialVenues)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mapVisible, setMapVisible] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  // Increments on URL-driven re-fetches so MapView knows to re-fit bounds
  const [searchKey, setSearchKey] = useState(0)
  const isHe = locale === 'he'

  // Sync when the server re-fetches due to URL param changes
  useEffect(() => {
    setLiveVenues(initialVenues)
    setSearchKey((k) => k + 1)
  }, [initialVenues])

  const searchByBounds = useCallback(async (lat: number, lng: number, radiusKm: number) => {
    setIsSearching(true)
    try {
      const params = new URLSearchParams({
        lat: String(lat),
        lng: String(lng),
        radius: String(Math.ceil(radiusKm)),
      })
      const res = await fetch(`/api/venues/search?${params}`)
      if (!res.ok) return
      const json = await res.json()
      setLiveVenues(json.venues ?? [])
    } catch {
      // silently ignore — map-driven search is best-effort
    } finally {
      setIsSearching(false)
    }
  }, [])

  const mapVenues = useMemo<MapVenue[]>(
    () =>
      liveVenues
        .filter((v) => v.lat != null && v.lng != null)
        .map((v) => ({
          id: v.id,
          title: v.title,
          city: v.city,
          lat: v.lat!,
          lng: v.lng!,
          price_per_hour: v.price_per_hour,
          price_per_day: v.price_per_day,
          photos: v.photos,
          capacity: v.capacity,
          avg_rating: v.avg_rating,
          review_count: v.review_count,
        })),
    [liveVenues],
  )

  const countLabel = isHe
    ? `${liveVenues.length} מקומות`
    : `${liveVenues.length} venues`

  return (
    <div className="relative flex h-full w-full gap-0">
      {/* List panel */}
      <div
        className={`flex flex-col overflow-y-auto pb-20 lg:flex-1 lg:pb-0 ${
          mapVisible ? 'hidden lg:flex' : 'flex flex-1'
        }`}
      >
        <p className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          {countLabel}
          {isSearching && (
            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          )}
        </p>
        <VenueGrid
          venues={liveVenues}
          locale={locale}
          columns="compact"
          highlightedId={selectedId ?? undefined}
        />
      </div>

      {/* Map panel — sticky on desktop, full-screen overlay on mobile */}
      <div
        className={`lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:w-[50%] lg:shrink-0 lg:ps-4 ${
          mapVisible
            ? 'fixed inset-0 top-16 z-40 block h-[calc(100dvh-4rem)] w-full lg:static lg:inset-auto lg:z-auto lg:h-[calc(100vh-4rem)] lg:w-[50%]'
            : 'hidden lg:block'
        }`}
      >
        <MapView
          venues={mapVenues}
          selectedId={selectedId}
          onSelect={(id) => {
            setSelectedId(id)
            if (id) {
              document.getElementById(`venue-card-${id}`)?.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
              })
            }
          }}
          onBoundsChange={searchByBounds}
          searchKey={searchKey}
          locale={locale}
        />
      </div>

      {/* Mobile floating map / list toggle */}
      <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 lg:hidden">
        <button
          type="button"
          onClick={() => setMapVisible((v) => !v)}
          className="flex items-center gap-2 rounded-full bg-gray-900 px-5 py-3 text-sm font-semibold text-white shadow-xl transition-all hover:bg-gray-700 active:scale-95"
        >
          {mapVisible ? (
            <>
              <List className="h-4 w-4" />
              {isHe ? 'הצג רשימה' : 'Show list'}
            </>
          ) : (
            <>
              <Map className="h-4 w-4" />
              {isHe ? 'הצג מפה' : 'Show map'}
            </>
          )}
        </button>
      </div>
    </div>
  )
}
