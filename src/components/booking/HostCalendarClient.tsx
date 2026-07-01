'use client'

import { useState, useTransition } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { toast } from 'sonner'
import { setAvailability } from '@/actions/availability'
import { Calendar } from '@/components/ui/calendar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Locale } from '@/lib/i18n'
import type { Modifiers } from 'react-day-picker'

interface HostCalendarClientProps {
  venues: { id: string; title: string }[]
  selectedVenueId: string
  blockedDates: string[]        // YYYY-MM-DD
  bookingRanges: { start: string; end: string; status: string }[]
  locale: Locale
  /** Hide the built-in venue picker (when a parent already renders one). */
  hideVenueSelector?: boolean
}

function parseDateStr(d: string) {
  const [y, m, day] = d.split('-').map(Number)
  return new Date(y, m - 1, day)
}

function dateRangeToDates(start: string, end: string): Date[] {
  const dates: Date[] = []
  const s = parseDateStr(start)
  const e = parseDateStr(end)
  const c = new Date(s)
  while (c <= e) { dates.push(new Date(c)); c.setDate(c.getDate() + 1) }
  return dates
}

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function HostCalendarClient({
  venues,
  selectedVenueId,
  blockedDates,
  bookingRanges,
  locale,
  hideVenueSelector = false,
}: HostCalendarClientProps) {
  const router   = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [localBlocked, setLocalBlocked] = useState<Set<string>>(new Set(blockedDates))
  const isHe = locale === 'he'

  const bookedDates = new Set(
    bookingRanges.flatMap(({ start, end }) => dateRangeToDates(start, end).map(toDateKey))
  )

  const handleVenueChange = (venueId: string) => {
    router.push(`${pathname}?venueId=${venueId}`)
  }

  const handleDayClick = (day: Date, modifiers: Modifiers) => {
    if (modifiers.disabled) return
    const key = toDateKey(day)
    if (bookedDates.has(key)) {
      toast.info(isHe ? 'יום זה כבר מוזמן' : 'This date has a booking')
      return
    }

    const willBlock = !localBlocked.has(key)
    setLocalBlocked((prev) => {
      const next = new Set(prev)
      if (willBlock) next.add(key)
      else next.delete(key)
      return next
    })

    startTransition(async () => {
      try {
        await setAvailability(selectedVenueId, key, !willBlock)
      } catch {
        // Revert optimistic update
        setLocalBlocked((prev) => {
          const next = new Set(prev)
          if (willBlock) next.delete(key)
          else next.add(key)
          return next
        })
        toast.error(isHe ? 'שגיאה בעדכון זמינות' : 'Failed to update availability')
      }
    })
  }

  const blockedDateObjects = Array.from(localBlocked).map(parseDateStr)
  const bookedDateObjects  = Array.from(bookedDates).map(parseDateStr)

  return (
    <div className="flex flex-col gap-4">
      {!hideVenueSelector && venues.length > 1 && (
        <Select value={selectedVenueId} onValueChange={handleVenueChange}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {venues.map((v) => (
              <SelectItem key={v.id} value={v.id}>{v.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Calendar — full width, larger cells via --cell-size CSS custom property */}
      <div className="overflow-x-auto rounded-xl border bg-background p-4 shadow-sm">
        <Calendar
          mode="single"
          numberOfMonths={2}
          onDayClick={handleDayClick}
          disabled={[{ before: new Date() }]}
          modifiers={{ blocked: blockedDateObjects, booked: bookedDateObjects }}
          modifiersClassNames={{
            blocked: 'bg-rose-100 text-rose-800 line-through opacity-70 hover:bg-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:hover:bg-rose-900',
            booked:  'bg-violet-100 text-violet-800 cursor-not-allowed dark:bg-violet-950 dark:text-violet-300',
          }}
          dir={isHe ? 'rtl' : 'ltr'}
          className="[--cell-size:2.75rem]"
        />
      </div>

      {/* Legend + saving indicator — horizontal chips below the calendar */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full border border-primary/40 bg-primary/20" />
          {isHe ? 'פנוי — לחץ לחסימה' : 'Available — click to block'}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full border border-rose-400 bg-rose-200 dark:border-rose-600 dark:bg-rose-900" />
          {isHe ? 'חסום — לחץ לשחרור' : 'Blocked — click to unblock'}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full border border-violet-400 bg-violet-200 dark:border-violet-600 dark:bg-violet-900" />
          {isHe ? 'הזמנה קיימת (לא ניתן לשנות)' : 'Has booking (read-only)'}
        </span>
        {isPending && (
          <span className="animate-pulse text-muted-foreground">
            {isHe ? 'שומר...' : 'Saving…'}
          </span>
        )}
      </div>
    </div>
  )
}
