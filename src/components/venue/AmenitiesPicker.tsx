'use client'

import { amenityIcon, amenityLabel, type Amenity } from '@/lib/amenities'
import { useAmenities } from '@/lib/use-amenities'
import type { Locale } from '@/lib/i18n'

interface AmenitiesPickerProps {
  locale: Locale
  selected: string[]
  onChange: (amenities: string[]) => void
}

export function AmenitiesPicker({ locale, selected, onChange }: AmenitiesPickerProps) {
  const isHe = locale === 'he'
  const amenities = useAmenities()

  const toggle = (key: string) =>
    onChange(selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key])

  // Preserve any selected keys that are no longer in the catalog so editing an
  // existing listing never silently drops them.
  const known = new Set(amenities.map((a) => a.key))
  const orphans: Amenity[] = selected
    .filter((k) => !known.has(k))
    .map((k) => ({ key: k, label_en: k, label_he: k, category: 'Other', icon: 'CheckCircle2' }))
  const list = [...amenities, ...orphans]

  return (
    <div className="flex flex-wrap gap-2">
      {list.map((amenity) => {
        const Icon = amenityIcon(amenity.icon)
        const active = selected.includes(amenity.key)
        return (
          <button
            key={amenity.key}
            type="button"
            onClick={() => toggle(amenity.key)}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
              active
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background hover:border-primary/60 hover:bg-muted/50'
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {amenityLabel(amenity, isHe)}
          </button>
        )
      })}
    </div>
  )
}
