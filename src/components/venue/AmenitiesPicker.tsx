'use client'

import {
  Wifi, Car, Volume2, UtensilsCrossed, Trees, Accessibility,
  Thermometer, Projector, ShowerHead, Coffee, Dumbbell, Music,
} from 'lucide-react'
import type { Locale } from '@/lib/i18n'

const AMENITIES = [
  { key: 'WiFi',             labelHe: 'WiFi',            labelEn: 'WiFi',               Icon: Wifi },
  { key: 'Parking',          labelHe: 'חניה',            labelEn: 'Parking',            Icon: Car },
  { key: 'AV',               labelHe: 'ציוד שמע/וידאו',  labelEn: 'AV Equipment',       Icon: Volume2 },
  { key: 'Kitchen',          labelHe: 'מטבח',            labelEn: 'Kitchen',            Icon: UtensilsCrossed },
  { key: 'Outdoor',          labelHe: 'שטח חוץ',         labelEn: 'Outdoor Space',      Icon: Trees },
  { key: 'Accessible',       labelHe: 'נגיש לנכים',      labelEn: 'Accessible',         Icon: Accessibility },
  { key: 'Air conditioning', labelHe: 'מיזוג אוויר',     labelEn: 'Air Conditioning',   Icon: Thermometer },
  { key: 'Projector',        labelHe: 'מקרן',            labelEn: 'Projector',          Icon: Projector },
  { key: 'Shower',           labelHe: 'מקלחת',           labelEn: 'Shower',             Icon: ShowerHead },
  { key: 'Coffee',           labelHe: 'קפה',             labelEn: 'Coffee',             Icon: Coffee },
  { key: 'Gym',              labelHe: 'חדר כושר',        labelEn: 'Gym',                Icon: Dumbbell },
  { key: 'Music',            labelHe: 'מוסיקה',          labelEn: 'Music System',       Icon: Music },
]

interface AmenitiesPickerProps {
  locale: Locale
  selected: string[]
  onChange: (amenities: string[]) => void
}

export function AmenitiesPicker({ locale, selected, onChange }: AmenitiesPickerProps) {
  const isHe = locale === 'he'
  const toggle = (key: string) =>
    onChange(selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key])

  return (
    <div className="flex flex-wrap gap-2">
      {AMENITIES.map(({ key, labelHe, labelEn, Icon }) => {
        const active = selected.includes(key)
        return (
          <button
            key={key}
            type="button"
            onClick={() => toggle(key)}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
              active
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background hover:border-primary/60 hover:bg-muted/50'
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {isHe ? labelHe : labelEn}
          </button>
        )
      })}
    </div>
  )
}
