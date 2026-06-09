'use client'

import {
  Wifi, Car, Volume2, UtensilsCrossed, Trees, Accessibility,
  Thermometer, Projector, ShowerHead, Coffee, Dumbbell, Music,
  Wine, Waves, ChefHat, Mic2, ShieldCheck, Sofa,
  Flower2, Lightbulb, Flame, ArrowUpDown, Shirt, Camera,
} from 'lucide-react'
import type { Locale } from '@/lib/i18n'

const AMENITIES = [
  // ── Core ──────────────────────────────────────────────────────────────────
  { key: 'WiFi',             labelHe: 'WiFi',               labelEn: 'WiFi',               Icon: Wifi },
  { key: 'Parking',          labelHe: 'חניה',               labelEn: 'Parking',            Icon: Car },
  { key: 'Air conditioning', labelHe: 'מיזוג אוויר',        labelEn: 'Air Conditioning',   Icon: Thermometer },
  { key: 'Heating',          labelHe: 'חימום',              labelEn: 'Heating',            Icon: Flame },
  { key: 'Elevator',         labelHe: 'מעלית',              labelEn: 'Elevator',           Icon: ArrowUpDown },
  { key: 'Accessible',       labelHe: 'נגיש לנכים',         labelEn: 'Wheelchair Access',  Icon: Accessibility },
  // ── AV & Events ───────────────────────────────────────────────────────────
  { key: 'AV',               labelHe: 'ציוד שמע/וידאו',     labelEn: 'AV Equipment',       Icon: Volume2 },
  { key: 'Projector',        labelHe: 'מקרן',               labelEn: 'Projector',          Icon: Projector },
  { key: 'Lighting',         labelHe: 'תאורה מקצועית',      labelEn: 'Lighting System',    Icon: Lightbulb },
  { key: 'Stage',            labelHe: 'במה',                labelEn: 'Stage',              Icon: Mic2 },
  { key: 'Music',            labelHe: 'מערכת מוסיקה',       labelEn: 'Music System',       Icon: Music },
  // ── Food & Drink ──────────────────────────────────────────────────────────
  { key: 'Kitchen',          labelHe: 'מטבח',               labelEn: 'Kitchen',            Icon: UtensilsCrossed },
  { key: 'Coffee',           labelHe: 'קפה',                labelEn: 'Coffee Station',     Icon: Coffee },
  { key: 'Catering',         labelHe: 'קייטרינג',           labelEn: 'Catering',           Icon: ChefHat },
  { key: 'Bar',              labelHe: 'בר',                 labelEn: 'Bar',                Icon: Wine },
  // ── Outdoor & Spaces ──────────────────────────────────────────────────────
  { key: 'Outdoor',          labelHe: 'שטח חוץ',            labelEn: 'Outdoor Space',      Icon: Trees },
  { key: 'Garden',           labelHe: 'גינה',               labelEn: 'Garden',             Icon: Flower2 },
  { key: 'Pool',             labelHe: 'בריכה',              labelEn: 'Pool',               Icon: Waves },
  { key: 'Lounge',           labelHe: 'פינת ישיבה',         labelEn: 'Lounge Area',        Icon: Sofa },
  // ── Facilities ────────────────────────────────────────────────────────────
  { key: 'Shower',           labelHe: 'מקלחת',              labelEn: 'Shower',             Icon: ShowerHead },
  { key: 'Gym',              labelHe: 'חדר כושר',           labelEn: 'Gym',                Icon: Dumbbell },
  { key: 'Dressing Room',    labelHe: 'חדר הלבשה',          labelEn: 'Dressing Room',      Icon: Shirt },
  { key: 'Photo Studio',     labelHe: 'סטודיו צילום',       labelEn: 'Photo Studio',       Icon: Camera },
  { key: 'Security',         labelHe: 'אבטחה',              labelEn: 'Security',           Icon: ShieldCheck },
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
