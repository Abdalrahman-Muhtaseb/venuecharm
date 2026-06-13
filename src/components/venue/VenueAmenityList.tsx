import { amenityIcon, amenityLabel, DEFAULT_AMENITIES, type Amenity } from '@/lib/amenities'

interface VenueAmenityListProps {
  amenities: unknown
  locale: 'he' | 'en'
  /** Optional live catalog; falls back to the static list for label/icon lookup. */
  catalog?: Amenity[]
}

export function VenueAmenityList({ amenities, locale, catalog }: VenueAmenityListProps) {
  const list: string[] = Array.isArray(amenities) ? amenities : []
  if (list.length === 0) return null

  const isHe = locale === 'he'
  const byKey = new Map((catalog ?? DEFAULT_AMENITIES).map((a) => [a.key, a]))

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">
        {isHe ? 'מתקנים' : 'Amenities'}
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {list.map((key) => {
          const amenity = byKey.get(key)
          const Icon = amenityIcon(amenity?.icon)
          const label = amenity ? amenityLabel(amenity, isHe) : key
          return (
            <div key={key} className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2.5 text-sm">
              <Icon className="h-4 w-4 shrink-0 text-primary" />
              <span>{label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
