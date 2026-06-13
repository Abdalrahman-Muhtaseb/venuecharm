'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Map, List, Search } from 'lucide-react'
import { VenueGrid } from '@/components/venue/VenueGrid'
import { MapView, type MapVenue } from '@/components/search/MapView'
import { VenuePagination } from '@/components/search/VenuePagination'
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
  totalCount: number
  currentPage: number
  totalPages: number
  favoritedIds?: string[]
}

export function SearchResults({ venues: initialVenues, locale, totalCount, currentPage, totalPages, favoritedIds }: SearchResultsProps) {
  const favoritedSet = useMemo(() => new Set(favoritedIds ?? []), [favoritedIds])
  const [liveVenues, setLiveVenues] = useState<SearchVenue[]>(initialVenues)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [mapVisible, setMapVisible] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [isMapSearch, setIsMapSearch] = useState(false)
  // Increments on URL-driven re-fetches so MapView knows to re-fit bounds
  const [searchKey, setSearchKey] = useState(0)
  const isHe = locale === 'he'

  // Sync when the server re-fetches due to URL param changes
  useEffect(() => {
    setLiveVenues(initialVenues)
    setIsMapSearch(false)
    setSearchKey((k) => k + 1)
  }, [initialVenues])

  const searchByBounds = useCallback(async (lat: number, lng: number, radiusKm: number) => {
    setIsSearching(true)
    setIsMapSearch(true)
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

  return (
    <div className="relative flex h-full w-full gap-0">
      {/* List panel */}
      <div
        className={`flex flex-col overflow-y-auto pb-20 lg:flex-1 lg:pb-0 ${
          mapVisible ? 'hidden lg:flex' : 'flex flex-1'
        }`}
      >
        {/* Result count — Airbnb-style heading */}
        <div className="mb-5 flex items-center gap-3">
          <h2 className="text-lg font-semibold">
            {isMapSearch
              ? liveVenues.length > 0
                ? isHe ? `${liveVenues.length.toLocaleString()} מקומות באזור זה` : `${liveVenues.length.toLocaleString()} venues in this area`
                : isHe ? 'לא נמצאו מקומות' : 'No venues found'
              : totalCount > 0
                ? isHe ? `מעל ${totalCount.toLocaleString()} מקומות` : `Over ${totalCount.toLocaleString()} venues`
                : isHe ? 'לא נמצאו מקומות' : 'No venues found'}
          </h2>
          {isSearching && (
            <span
              className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"
              aria-label={isHe ? 'מחפש...' : 'Searching...'}
            />
          )}
        </div>

        {/* Empty state */}
        {liveVenues.length === 0 && !isSearching ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Search className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
            </div>
            <div>
              <p className="text-base font-semibold">
                {isHe ? 'לא נמצאו מקומות' : 'No venues found'}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {isHe
                  ? 'נסה לשנות את הסינון או לחפש אזור אחר'
                  : 'Try adjusting your filters or searching a different area'}
              </p>
            </div>
            <a
              href="/venues"
              className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {isHe ? 'נקה סינון' : 'Clear filters'}
            </a>
          </div>
        ) : (
          <>
            <VenueGrid
              venues={liveVenues}
              locale={locale}
              columns="compact"
              highlightedId={selectedId ?? undefined}
              favoritedIds={favoritedSet}
              onCardHover={setHoveredId}
            />
            {!isMapSearch && (
              <VenuePagination
                currentPage={currentPage}
                totalPages={totalPages}
                locale={locale}
              />
            )}
          </>
        )}
      </div>

      {/* Map panel — sticky on desktop, full-screen overlay on mobile */}
      <div
        className={`lg:sticky lg:top-24 lg:h-[calc(100dvh-7rem)] lg:w-[40%] lg:shrink-0 lg:ps-8 ${
          mapVisible
            ? 'fixed inset-0 top-36 z-40 block h-[calc(100dvh-9rem)] w-full lg:static lg:inset-auto lg:z-auto lg:h-[calc(100dvh-7rem)] lg:w-[40%]'
            : 'hidden lg:block'
        }`}
      >
        <MapView
          venues={mapVenues}
          selectedId={selectedId}
          hoveredId={hoveredId}
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
          aria-label={mapVisible
            ? (isHe ? 'הצג רשימה' : 'Show list')
            : (isHe ? 'הצג מפה' : 'Show map')}
          className="flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background shadow-xl transition-all hover:bg-foreground/80 active:scale-95"
        >
          {mapVisible ? (
            <>
              <List className="h-4 w-4" aria-hidden="true" />
              {isHe ? 'הצג רשימה' : 'Show list'}
            </>
          ) : (
            <>
              <Map className="h-4 w-4" aria-hidden="true" />
              {isHe ? 'הצג מפה' : 'Show map'}
            </>
          )}
        </button>
      </div>
    </div>
  )
}
