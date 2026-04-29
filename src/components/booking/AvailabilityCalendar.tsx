'use client'

import { Calendar } from '@/components/ui/calendar'
import type { Locale } from '@/lib/i18n'

interface AvailabilityCalendarProps {
  /** ISO date strings (YYYY-MM-DD) that are blocked in the availability table */
  blockedDates: string[]
  /** Booking ranges [{start: ISO, end: ISO}] for PENDING/CONFIRMED bookings */
  bookingRanges: { start: string; end: string }[]
  locale: Locale
}

function parseDateUTC(iso: string) {
  const [y, m, d] = iso.split('T')[0].split('-').map(Number)
  return new Date(y, m - 1, d)
}

function dateRangeToDates(start: string, end: string): Date[] {
  const dates: Date[] = []
  const s = parseDateUTC(start)
  const e = parseDateUTC(end)
  const cursor = new Date(s)
  while (cursor <= e) {
    dates.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return dates
}

export function AvailabilityCalendar({
  blockedDates,
  bookingRanges,
  locale,
}: AvailabilityCalendarProps) {
  const blocked = blockedDates.map(parseDateUTC)

  const booked = bookingRanges.flatMap(({ start, end }) => dateRangeToDates(start, end))

  const allDisabled = [
    ...blocked,
    ...booked,
    { before: new Date() }, // past dates
  ]

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">
        {locale === 'he' ? 'זמינות' : 'Availability'}
      </h2>

      <div className="inline-block rounded-xl border bg-background p-1">
        <Calendar
          mode="single"
          disabled={allDisabled}
          classNames={{
            day_disabled: 'opacity-30 line-through',
          }}
          dir={locale === 'he' ? 'rtl' : 'ltr'}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-primary/20" />
          {locale === 'he' ? 'פנוי' : 'Available'}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-muted" />
          {locale === 'he' ? 'תפוס / חסום' : 'Booked / blocked'}
        </span>
      </div>
    </div>
  )
}
