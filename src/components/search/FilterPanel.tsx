'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'
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
import type { Locale } from '@/lib/i18n'
import { amenityIcon, amenityLabel } from '@/lib/amenities'
import { useAmenities } from '@/lib/use-amenities'

interface FilterPanelProps {
  locale: Locale
  maxPrice?: number
  hideClear?: boolean
}

export function FilterPanel({ locale, maxPrice = 4000, hideClear = false }: FilterPanelProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isHe = locale === 'he'
  const amenities = useAmenities()

  const currentPriceMax = parseInt(searchParams.get('price_max') ?? String(maxPrice), 10)
  const currentSort = searchParams.get('sort') ?? 'distance'
  const currentAmenities = searchParams.get('amenities')?.split(',').filter(Boolean) ?? []

  const update = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) params.set(key, value)
      else params.delete(key)
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams],
  )

  const toggleAmenity = (amenity: string) => {
    const next = currentAmenities.includes(amenity)
      ? currentAmenities.filter((a) => a !== amenity)
      : [...currentAmenities, amenity]
    update('amenities', next.length ? next.join(',') : null)
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
      {/* Sort */}
      <div className="flex flex-col gap-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {isHe ? 'מיון' : 'Sort by'}
        </Label>
        <Select value={currentSort} onValueChange={(v) => update('sort', v)}>
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="distance">{isHe ? 'מרחק' : 'Distance'}</SelectItem>
            <SelectItem value="price_asc">{isHe ? 'מחיר: נמוך לגבוה' : 'Price: low to high'}</SelectItem>
            <SelectItem value="price_desc">{isHe ? 'מחיר: גבוה לנמוך' : 'Price: high to low'}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Price */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {isHe ? 'מחיר מקסימלי לשעה' : 'Max price / hour'}
          </Label>
          <span className="text-sm font-semibold text-primary">₪{currentPriceMax}</span>
        </div>
        <Slider
          min={50}
          max={maxPrice}
          step={50}
          value={[currentPriceMax]}
          onValueChange={([v]) => update('price_max', String(v))}
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
            const active = currentAmenities.includes(amenity.key)
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
