import {
  Wifi, Car, Volume2, UtensilsCrossed, Trees, Accessibility,
  Thermometer, Projector, ShowerHead, Coffee, Dumbbell, Music,
  CheckCircle2,
} from 'lucide-react'

const AMENITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  WiFi:          Wifi,
  Parking:       Car,
  AV:            Volume2,
  Audio:         Volume2,
  Kitchen:       UtensilsCrossed,
  Outdoor:       Trees,
  Garden:        Trees,
  Accessible:    Accessibility,
  'Air conditioning': Thermometer,
  Projector:     Projector,
  Shower:        ShowerHead,
  Coffee:        Coffee,
  Gym:           Dumbbell,
  Music:         Music,
}

interface VenueAmenityListProps {
  amenities: unknown
  locale: 'he' | 'en'
}

export function VenueAmenityList({ amenities, locale }: VenueAmenityListProps) {
  const list: string[] = Array.isArray(amenities) ? amenities : []

  if (list.length === 0) return null

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">
        {locale === 'he' ? 'מתקנים' : 'Amenities'}
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {list.map((amenity) => {
          const Icon = AMENITY_ICONS[amenity] ?? CheckCircle2
          return (
            <div key={amenity} className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2.5 text-sm">
              <Icon className="h-4 w-4 shrink-0 text-primary" />
              <span>{amenity}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
