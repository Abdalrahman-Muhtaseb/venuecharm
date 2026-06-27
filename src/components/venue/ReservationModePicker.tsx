'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getDictionary, type Locale } from '@/lib/i18n'

type Mode = 'hour' | 'day' | 'both'

function inferMode(pricePerHour?: number | null, pricePerDay?: number | null): Mode {
  if (pricePerHour != null && pricePerDay != null) return 'both'
  if (pricePerDay != null && pricePerHour == null) return 'day'
  return 'hour'
}

const HOUR_OPTIONS = Array.from({ length: 25 }, (_, h) => `${String(h).padStart(2, '0')}:00`)

const BUFFER_OPTIONS = ['0', '30', '60', '90', '120']

interface ReservationModePickerProps {
  locale: Locale
  defaultPricePerHour?: number | null
  defaultPricePerDay?: number | null
  defaultOpening?: string | null
  defaultClosing?: string | null
  defaultBuffer?: number | null
}

/**
 * Lets the host pick how the venue can be reserved (per hour / per day / both)
 * and renders only the matching, required price input(s). Unrendered inputs are
 * not submitted, so the unused price serializes to null in the server action.
 */
export function ReservationModePicker({
  locale,
  defaultPricePerHour = null,
  defaultPricePerDay = null,
  defaultOpening = null,
  defaultClosing = null,
  defaultBuffer = null,
}: ReservationModePickerProps) {
  const t = getDictionary(locale).venueForm
  const isHe = locale === 'he'
  const [mode, setMode] = useState<Mode>(inferMode(defaultPricePerHour, defaultPricePerDay))
  const [opening, setOpening] = useState(defaultOpening?.slice(0, 5) ?? '08:00')
  const [closing, setClosing] = useState(defaultClosing?.slice(0, 5) ?? '23:00')
  const [buffer, setBuffer] = useState(String(defaultBuffer ?? 0))

  const bufferLabel = (v: string) =>
    v === '0'
      ? (isHe ? 'ללא' : 'None')
      : Number(v) >= 60
        ? (isHe ? `${Number(v) / 60} שעות` : `${Number(v) / 60} hr`)
        : (isHe ? `${v} דקות` : `${v} min`)

  const options: { value: Mode; label: string }[] = [
    { value: 'hour', label: t.modeHour },
    { value: 'day', label: t.modeDay },
    { value: 'both', label: t.modeBoth },
  ]

  const showHour = mode === 'hour' || mode === 'both'
  const showDay = mode === 'day' || mode === 'both'

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-base font-semibold">{t.reservationMode}</h2>
        <p className="text-sm text-muted-foreground">{t.reservationModeHint}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => setMode(o.value)}
            aria-pressed={mode === o.value}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              mode === o.value
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background text-muted-foreground hover:border-primary/60'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {showHour && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="pricePerHour">{t.pricePerHour}</Label>
            <Input
              id="pricePerHour"
              name="pricePerHour"
              type="number"
              min={0}
              step="0.01"
              required
              defaultValue={defaultPricePerHour ?? ''}
            />
          </div>
        )}
        {showDay && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="pricePerDay">{t.pricePerDay}</Label>
            <Input
              id="pricePerDay"
              name="pricePerDay"
              type="number"
              min={0}
              step="0.01"
              required
              defaultValue={defaultPricePerDay ?? ''}
            />
          </div>
        )}
      </div>

      {/* Operating hours */}
      <div className="space-y-2 pt-2">
        <p className="text-sm font-medium">{t.operatingHours}</p>
        <p className="text-sm text-muted-foreground">{t.operatingHoursHint}</p>
        <input type="hidden" name="openingTime" value={opening} />
        <input type="hidden" name="closingTime" value={closing} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label>{t.openTime}</Label>
            <Select value={opening} onValueChange={setOpening}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {HOUR_OPTIONS.slice(0, 24).map((h) => (
                  <SelectItem key={h} value={h}>{h}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label>{t.closeTime}</Label>
            <Select value={closing} onValueChange={setClosing}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {HOUR_OPTIONS.filter((h) => h > opening).map((h) => (
                  <SelectItem key={h} value={h}>{h}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Turnaround buffer between bookings */}
      <div className="space-y-2 pt-2">
        <p className="text-sm font-medium">{t.buffer}</p>
        <p className="text-sm text-muted-foreground">{t.bufferHint}</p>
        <input type="hidden" name="bufferMinutes" value={buffer} />
        <Select value={buffer} onValueChange={setBuffer}>
          <SelectTrigger className="sm:max-w-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {BUFFER_OPTIONS.map((v) => (
              <SelectItem key={v} value={v}>{bufferLabel(v)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </section>
  )
}
