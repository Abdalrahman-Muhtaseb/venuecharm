'use client'

import { useState, useTransition } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { setAvailability } from '@/actions/availability'
import type { Locale } from '@/lib/i18n'

function toISODate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

interface HostAvailabilityEditorProps {
  venueId: string
  /** ISO YYYY-MM-DD dates the host has manually blocked */
  initialBlocked: string[]
  /** ISO YYYY-MM-DD dates that have PENDING or CONFIRMED bookings (read-only) */
  bookedDates: string[]
  locale: Locale
}

export function HostAvailabilityEditor({
  venueId,
  initialBlocked,
  bookedDates,
  locale,
}: HostAvailabilityEditorProps) {
  const [blocked, setBlocked] = useState<Set<string>>(() => new Set(initialBlocked))
  const [isPending, startTransition] = useTransition()
  const isHe = locale === 'he'

  const bookedSet = new Set(bookedDates)
  const blockedDateObjs = Array.from(blocked).map(parseLocalDate)
  const bookedDateObjs = bookedDates.map(parseLocalDate)

  const handleSelect = (dates: Date[] | undefined) => {
    const newBlocked = new Set(
      (dates ?? []).map(toISODate).filter((d) => !bookedSet.has(d)),
    )

    // Derive what changed (one date per click)
    const added = [...newBlocked].filter((d) => !blocked.has(d))
    const removed = [...blocked].filter((d) => !newBlocked.has(d))

    setBlocked(newBlocked)

    startTransition(async () => {
      for (const iso of added)   await setAvailability(venueId, iso, false) // block
      for (const iso of removed) await setAvailability(venueId, iso, true)  // unblock
    })
  }

  return (
    <section className="space-y-4 rounded-2xl border p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">
            {isHe ? 'ניהול זמינות' : 'Manage Availability'}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {isHe
              ? 'לחץ על תאריך כדי לחסום אותו או לשחרר אותו. תאריכים עם הזמנות אינם ניתנים לשינוי.'
              : 'Click a date to block or unblock it. Dates with active bookings cannot be changed.'}
          </p>
        </div>
        {isPending && (
          <span className="mt-1 shrink-0 text-xs text-muted-foreground">
            {isHe ? 'שומר...' : 'Saving…'}
          </span>
        )}
      </div>

      <div className="overflow-x-auto">
        <Calendar
          mode="multiple"
          selected={blockedDateObjs}
          onSelect={handleSelect}
          disabled={[...bookedDateObjs, { before: new Date() }]}
          numberOfMonths={2}
          dir={isHe ? 'rtl' : 'ltr'}
        />
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
        <span className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full border border-border bg-background" />
          {isHe ? 'פנוי (לחץ לחסימה)' : 'Available (click to block)'}
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full bg-primary" />
          {isHe ? 'חסום על ידך (לחץ לשחרור)' : 'Blocked by you (click to unblock)'}
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full bg-muted-foreground/30" />
          {isHe ? 'מוזמן / עבר' : 'Booked / past'}
        </span>
      </div>
    </section>
  )
}
