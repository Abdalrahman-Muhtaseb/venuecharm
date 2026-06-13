'use client'

import { useEffect, useState } from 'react'
import { DEFAULT_AMENITIES, type Amenity } from '@/lib/amenities'

// Module-level cache so the catalog is fetched once per page session and shared
// across the picker, the filter panel, etc.
let cache: Amenity[] | null = null

export function useAmenities(): Amenity[] {
  const [amenities, setAmenities] = useState<Amenity[]>(cache ?? DEFAULT_AMENITIES)

  useEffect(() => {
    if (cache) return
    let cancelled = false
    fetch('/api/amenities')
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return
        if (Array.isArray(j.amenities) && j.amenities.length > 0) {
          cache = j.amenities
          setAmenities(j.amenities)
        }
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  return amenities
}
