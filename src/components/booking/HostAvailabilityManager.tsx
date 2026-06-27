'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { CalendarDays, LayoutGrid } from 'lucide-react'
import { HostCalendarClient } from '@/components/booking/HostCalendarClient'
import { WeekAvailabilityGrid } from '@/components/booking/WeekAvailabilityGrid'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
}: HostAvailabilityManagerProps) {
  const router = useRouter()
  const pathname = usePathname()
  const t = getDictionary(locale).availability
  const isHe = locale === 'he'
  const [view, setView] = useState<'month' | 'week'>('week')

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {venues.length > 1 ? (
          <Select value={selectedVenueId} onValueChange={(id) => router.push(`${pathname}?venueId=${id}`)}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {venues.map((v) => (
                <SelectItem key={v.id} value={v.id}>{v.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span />
        )}

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
          <p className="mb-3 text-sm font-medium">{isHe ? 'ניהול לפי שעות' : 'Manage by the hour'}</p>
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
      )}
    </div>
  )
}
