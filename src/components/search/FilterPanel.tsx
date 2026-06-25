'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { getDictionary, type Locale } from '@/lib/i18n'
import { amenityIcon, amenityLabel } from '@/lib/amenities'
import { useAmenities } from '@/lib/use-amenities'
import { eventTypes } from '@/types/event-types'

const EVENT_TYPE_FILTERS = eventTypes.filter((et) => et !== 'OTHER')

export interface FilterValues {
  sort: string
  eventType: string
  priceMax: number | null
  amenities: string[]
}

export const EMPTY_FILTERS: FilterValues = { sort: 'distance', eventType: '', priceMax: null, amenities: [] }

interface FilterPanelProps {
  locale: Locale
  maxPrice?: number
  hideClear?: boolean
  /** Staged mode: when both are provided, the panel reads/writes this draft
   *  instead of pushing to the URL on every change. */
  value?: FilterValues
  onChange?: (next: FilterValues) => void
}

export function FilterPanel({ locale, maxPrice = 4000, hideClear = false, value, onChange }: FilterPanelProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isHe = locale === 'he'
  const amenities = useAmenities()
  const eventTypeLabels = getDictionary(locale).rfp.eventTypeOptions

  const staged = typeof onChange === 'function'
  const current: FilterValues =
    staged && value
      ? value
      : {
          sort: searchParams.get('sort') ?? 'distance',
          eventType: searchParams.get('event_type') ?? '',
          priceMax: searchParams.get('price_max') ? parseInt(searchParams.get('price_max')!, 10) : null,
          amenities: searchParams.get('amenities')?.split(',').filter(Boolean) ?? [],
        }

  const priceValue = current.priceMax ?? maxPrice

  const setField = (patch: Partial<FilterValues>) => {
    const next = { ...current, ...patch }
    if (staged) {
      onChange!(next)
      return
    }
    const params = new URLSearchParams(searchParams.toString())
    const set = (key: string, v: string | null) => (v ? params.set(key, v) : params.delete(key))
    set('sort', next.sort && next.sort !== 'distance' ? next.sort : null)
    set('event_type', next.eventType || null)
    set('price_max', next.priceMax != null ? String(next.priceMax) : null)
    set('amenities', next.amenities.length ? next.amenities.join(',') : null)
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  const toggleAmenity = (amenity: string) => {
    const next = current.amenities.includes(amenity)
      ? current.amenities.filter((a) => a !== amenity)
      : [...current.amenities, amenity]
    setField({ amenities: next })
  }

  const clearFilters = () => {
    const params = new URLSearchParams()
    const q = searchParams.get('q')
    const cap = searchParams.get('capacity')
    if (q) params.set('q', q)
    if (cap) params.set('capacity', cap)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Sort + Event type, side by side */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {isHe ? 'מיון' : 'Sort by'}
          </Label>
          <Select value={current.sort} onValueChange={(v) => setField({ sort: v })}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="match">{isHe ? 'התאמה הטובה ביותר' : 'Best match'}</SelectItem>
              <SelectItem value="distance">{isHe ? 'מרחק' : 'Distance'}</SelectItem>
              <SelectItem value="price_asc">{isHe ? 'מחיר: נמוך לגבוה' : 'Price: low to high'}</SelectItem>
              <SelectItem value="price_desc">{isHe ? 'מחיר: גבוה לנמוך' : 'Price: high to low'}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {isHe ? 'סוג אירוע' : 'Event type'}
          </Label>
          <Select
            value={current.eventType || 'ANY'}
            onValueChange={(v) => setField({ eventType: v === 'ANY' ? '' : v })}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ANY">{isHe ? 'כל הסוגים' : 'Any type'}</SelectItem>
              {EVENT_TYPE_FILTERS.map((et) => (
                <SelectItem key={et} value={et}>
                  {eventTypeLabels[et as keyof typeof eventTypeLabels] ?? et}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Price */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {isHe ? 'מחיר מקסימלי לשעה' : 'Max price / hour'}
          </Label>
          <span className="text-sm font-semibold text-primary">₪{priceValue}</span>
        </div>
        <Slider
          min={50}
          max={maxPrice}
          step={50}
          value={[priceValue]}
          onValueChange={([v]) => setField({ priceMax: v })}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>₪50</span>
          <span>₪{maxPrice}</span>
        </div>
      </div>

      <Separator />

      {/* Amenities */}
      <div className="flex flex-col gap-3">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {isHe ? 'מתקנים' : 'Amenities'}
        </Label>
        <div className="flex flex-wrap gap-2">
          {amenities.map((amenity) => {
            const Icon = amenityIcon(amenity.icon)
            const active = current.amenities.includes(amenity.key)
            return (
              <button
                key={amenity.key}
                type="button"
                aria-pressed={active}
                onClick={() => toggleAmenity(amenity.key)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background hover:border-primary/60 hover:bg-muted/50'
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {amenityLabel(amenity, isHe)}
              </button>
            )
          })}
        </div>
      </div>

      {!hideClear && (
        <>
          <Separator />
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
            {isHe ? 'נקה סינון' : 'Clear filters'}
          </Button>
        </>
      )}
    </div>
  )
}
