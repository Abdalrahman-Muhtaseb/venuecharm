'use client'

import { useState } from 'react'
import { CalendarDays, LayoutGrid } from 'lucide-react'
import { AvailabilityCalendar } from '@/components/booking/AvailabilityCalendar'
import { WeekAvailabilityGrid } from '@/components/booking/WeekAvailabilityGrid'
import { expandBookings, ymd, type SlotBlock, type SlotBooking } from '@/lib/availability-slots'
import { cn } from '@/lib/utils'
import { getDictionary, type Locale } from '@/lib/i18n'

interface AvailabilitySectionProps {
  venueId: string
  blockedDates: string[]
  bookingRanges: { start: string; end: string }[]
  blocks: SlotBlock[]
  opening: string
  closing: string
  bufferMin?: number
  locale: Locale
}

function toSlotBookings(ranges: { start: string; end: string }[]): SlotBooking[] {
  return ranges.map(({ start, end }) => {
    const s = new Date(start)
    const e = new Date(end)
    const sameDay = s.toDateString() === e.toDateString()
    return {
      date: ymd(s),
      startMin: s.getHours() * 60 + s.getMinutes(),
      endMin: sameDay ? e.getHours() * 60 + e.getMinutes() : 1440,
    }
  })
}

export function AvailabilitySection({
  venueId,
  blockedDates,
  bookingRanges,
  blocks,
  opening,
  closing,
  bufferMin = 0,
  locale,
}: AvailabilitySectionProps) {
  const t = getDictionary(locale).availability
  const [view, setView] = useState<'month' | 'week'>('month')

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">{locale === 'he' ? 'זמינות' : 'Availability'}</h2>
        <div className="inline-flex rounded-full border p-0.5">
          <button
            type="button"
            onClick={() => setView('month')}
            aria-pressed={view === 'month'}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
              view === 'month' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted',
            )}
          >
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            {t.month}
          </button>
          <button
            type="button"
            onClick={() => setView('week')}
            aria-pressed={view === 'week'}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
              view === 'week' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted',
            )}
          >
            <LayoutGrid className="h-4 w-4" aria-hidden="true" />
            {t.week}
          </button>
        </div>
      </div>

      {view === 'month' ? (
        <AvailabilityCalendar
          blockedDates={blockedDates}
          bookingRanges={bookingRanges}
          locale={locale}
          hideHeading
        />
      ) : (
        <WeekAvailabilityGrid
          venueId={venueId}
          opening={opening}
          closing={closing}
          bookings={expandBookings(toSlotBookings(bookingRanges), bufferMin)}
          blocks={blocks}
          mode="renter"
          locale={locale}
        />
      )}
    </div>
  )
}
