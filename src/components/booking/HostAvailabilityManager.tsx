'use client'

import { type ReactNode, useState } from 'react'
import { CalendarDays, LayoutGrid } from 'lucide-react'
import { HostCalendarClient } from '@/components/booking/HostCalendarClient'
import { WeekAvailabilityGrid } from '@/components/booking/WeekAvailabilityGrid'
import { CalendarSyncDialog } from '@/components/booking/CalendarSyncDialog'
import type { SlotBlock, SlotBooking } from '@/lib/availability-slots'
import { cn } from '@/lib/utils'
import { getDictionary, type Locale } from '@/lib/i18n'

interface HostAvailabilityManagerProps {
  venues: { id: string; title: string }[]
  selectedVenueId: string
  /** Month view (HostCalendarClient): whole-day blocks + booking day-ranges */
  blockedDates: string[]
  bookingRanges: { start: string; end: string; status: string }[]
  /** Week view: time-slot bookings + host blocks + operating hours */
  bookings: SlotBooking[]
  blocks: SlotBlock[]
  opening: string
  closing: string
  locale: Locale
  /** Replaces the venue dropdown on the start side of the toolbar (e.g. back-link + venue name). */
  headerSlot?: ReactNode
  /** Optional Google Calendar sync props — shows a compact trigger at the end of the toolbar. */
  calendarConfigured?: boolean
  calendarConnected?: boolean
}

export function HostAvailabilityManager({
  venues,
  selectedVenueId,
  blockedDates,
  bookingRanges,
  bookings,
  blocks,
  opening,
  closing,
  locale,
  headerSlot,
  calendarConfigured,
  calendarConnected,
}: HostAvailabilityManagerProps) {
  const t = getDictionary(locale).availability
  const [view, setView] = useState<'month' | 'week'>('week')

  const viewToggle = (
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
  )

  return (
    <div className="flex flex-col gap-5">
      {/* Toolbar: start = headerSlot (back + venue name); end = toggle + calendar button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          {headerSlot}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {viewToggle}
          {calendarConfigured !== undefined && (
            <CalendarSyncDialog
              locale={locale}
              configured={calendarConfigured}
              connected={calendarConnected ?? false}
            />
          )}
        </div>
      </div>

      {view === 'month' ? (
        <HostCalendarClient
          venues={venues}
          selectedVenueId={selectedVenueId}
          blockedDates={blockedDates}
          bookingRanges={bookingRanges}
          locale={locale}
          hideVenueSelector
        />
      ) : (
        <div className="rounded-xl border bg-background p-4 shadow-sm">
          {/* max-h keeps the grid compact; scroll reveals later hours */}
          <div className="max-h-[480px] overflow-y-auto">
            <WeekAvailabilityGrid
              venueId={selectedVenueId}
              opening={opening}
              closing={closing}
              bookings={bookings}
              blocks={blocks}
              mode="host"
              locale={locale}
            />
          </div>
        </div>
      )}
    </div>
  )
}
