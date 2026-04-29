'use client'

import { useState } from 'react'
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

export function SearchResults({ venues, locale, totalCount }: SearchResultsProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const isHe = locale === 'he'

  const mapVenues: MapVenue[] = venues
    .filter((v) => v.lat != null && v.lng != null)
    .map((v) => ({
      id: v.id,
      title: v.title,
      lat: v.lat!,
      lng: v.lng!,
      price_per_hour: v.price_per_hour,
    }))

  return (
    <div className="flex h-full gap-0">
      {/* List panel */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        {/* Result count */}
        <p className="mb-4 text-sm text-muted-foreground">
          {totalCount != null
            ? isHe
              ? `${totalCount} מקומות נמצאו`
              : `${totalCount} venues found`
            : isHe
              ? `${venues.length} מקומות`
              : `${venues.length} venues`}
        </p>

        <VenueGrid
          venues={venues}
          locale={locale}
          columns="compact"
          highlightedId={selectedId ?? undefined}
        />
      </div>

      {/* Sticky map panel — hidden on mobile */}
      <div className="sticky top-16 hidden h-[calc(100vh-4rem)] w-[45%] shrink-0 ps-4 lg:block">
        <MapView
          venues={mapVenues}
          selectedId={selectedId}
          onSelect={(id) => {
            setSelectedId(id)
            // Scroll the matching card into view
            document.getElementById(`venue-card-${id}`)?.scrollIntoView({
              behavior: 'smooth',
              block: 'nearest',
            })
          }}
          locale={locale}
        />
      </div>
    </div>
  )
}
