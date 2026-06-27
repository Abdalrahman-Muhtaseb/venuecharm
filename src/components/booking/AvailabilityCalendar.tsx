'use client'

import { Calendar } from '@/components/ui/calendar'
import { useBookingDate } from '@/components/booking/BookingDateContext'
import type { Locale } from '@/lib/i18n'

interface AvailabilityCalendarProps {
  /** ISO date strings (YYYY-MM-DD) that are blocked in the availability table */
  blockedDates: string[]
  /** Booking ranges [{start: ISO, end: ISO}] for PENDING/CONFIRMED bookings */
  bookingRanges: { start: string; end: string }[]
  locale: Locale
  /** Hide the built-in "Availability" heading (when a parent renders its own). */
  hideHeading?: boolean
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
  hideHeading = false,
}: AvailabilityCalendarProps) {
  const blocked = blockedDates.map(parseDateUTC)

  const booked = bookingRanges.flatMap(({ start, end }) => dateRangeToDates(start, end))

  const unavailable = [...blocked, ...booked]
  const allDisabled = [
    ...unavailable,
    { before: new Date() }, // past dates
  ]

  // When rendered inside the booking-date provider (venue detail page), clicking
  // an available day drives the booking widget's selected date.
  const bookingDate = useBookingDate()

  return (
    <div>
      {!hideHeading && (
        <h2 className="mb-1 text-xl font-semibold">
          {locale === 'he' ? 'זמינות' : 'Availability'}
        </h2>
      )}
      {bookingDate && (
        <p className="mb-3 text-sm text-muted-foreground">
          {locale === 'he'
            ? 'בחר תאריך פנוי כדי להתחיל בהזמנה'
            : 'Pick an available date to start your booking'}
        </p>
      )}

      <Calendar
        mode="single"
        numberOfMonths={2}
        showOutsideDays={false}
        disabled={allDisabled}
        selected={bookingDate?.selectedDate}
        onSelect={bookingDate ? (d) => bookingDate.setSelectedDate(d) : undefined}
        className="w-full p-0 [--cell-size:2.6rem]"
        classNames={{
          // `relative` keeps the absolutely-positioned prev/next month arrows anchored.
          months: 'relative flex w-full flex-col gap-6 sm:flex-row sm:gap-10',
          month: 'flex w-full flex-col gap-4',
          // Past, booked and blocked days: struck through instead of just dimmed.
          disabled: 'text-muted-foreground/45 line-through decoration-[1.5px]',
        }}
        dir={locale === 'he' ? 'rtl' : 'ltr'}
      />
    </div>
  )
}
