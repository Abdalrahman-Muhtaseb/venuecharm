'use client'

import { useMemo, useState, useTransition } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { blockTimeSlot, unblockTimeSlot } from '@/actions/availability'
import { useBookingDate } from '@/components/booking/BookingDateContext'
import {
  hourlySlots,
  minToTime,
  slotState,
  startOfWeek,
  timeToMin,
  weekDays,
  ymd,
  type SlotBlock,
  type SlotBooking,
  type SlotState,
} from '@/lib/availability-slots'
import { cn } from '@/lib/utils'
import type { Locale } from '@/lib/i18n'

interface WeekAvailabilityGridProps {
  venueId: string
  opening: string
  closing: string
  bookings: SlotBooking[]
  blocks: SlotBlock[]
  mode: 'host' | 'renter'
  locale: Locale
}

const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const WEEKDAYS_HE = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']

function blockKey(date: string, startMin: number) {
  return `${date}|${startMin}`
}

interface Selection {
  dateKey: string
  startMin: number
  endMin: number
}

export function WeekAvailabilityGrid({
  venueId,
  opening,
  closing,
  bookings,
  blocks,
  mode,
  locale,
}: WeekAvailabilityGridProps) {
  const isHe = locale === 'he'
  const bookingDate = useBookingDate()
  const [, startSaving] = useTransition()
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  // Optimistic host overrides keyed by `${date}|${startMin}` → blocked?
  const [overrides, setOverrides] = useState<Map<string, boolean>>(new Map())
  // Renter slot range selection.
  const [sel, setSel] = useState<Selection | null>(null)

  const slots = useMemo(() => hourlySlots(opening, closing), [opening, closing])
  const openingMin = timeToMin(opening)
  const closingMin = timeToMin(closing)
  const days = useMemo(() => weekDays(weekStart), [weekStart])
  const nowMs = Date.now()
  const thisWeekStart = startOfWeek(new Date())
  const canGoPrev = weekStart.getTime() > thisWeekStart.getTime()

  const baseBlockSet = useMemo(
    () => new Set(blocks.map((b) => blockKey(b.date, b.startMin))),
    [blocks],
  )

  const effectiveBlocks: SlotBlock[] = useMemo(() => {
    const out: SlotBlock[] = blocks.filter((b) => overrides.get(blockKey(b.date, b.startMin)) !== false)
    for (const [key, blocked] of overrides) {
      if (!blocked) continue
      const [date, min] = key.split('|')
      if (!baseBlockSet.has(key)) out.push({ date, startMin: Number(min) })
    }
    return out
  }, [blocks, overrides, baseBlockSet])

  const stateOf = (dayDate: Date, dayKey: string, slotMin: number): SlotState =>
    slotState(dayKey, slotMin, { bookings, blocks: effectiveBlocks, nowMs, dayDate })

  const contiguousFree = (dayDate: Date, dayKey: string, fromMin: number, toMinExcl: number) => {
    for (let m = fromMin; m < toMinExcl; m += 60) {
      if (stateOf(dayDate, dayKey, m) !== 'free') return false
    }
    return true
  }

  const weekLabel = `${days[0].toLocaleDateString(isHe ? 'he-IL' : 'en-US', { day: 'numeric', month: 'short' })} – ${days[6].toLocaleDateString(isHe ? 'he-IL' : 'en-US', { day: 'numeric', month: 'short' })}`

  const shiftWeek = (delta: number) => {
    setWeekStart((prev) => {
      const next = new Date(prev)
      next.setDate(prev.getDate() + delta * 7)
      return next
    })
  }

  // ── Host actions ──────────────────────────────────────────────
  const onHostToggle = (date: string, startMin: number, currentlyBlocked: boolean) => {
    const key = blockKey(date, startMin)
    setOverrides((prev) => new Map(prev).set(key, !currentlyBlocked))
    startSaving(async () => {
      try {
        if (currentlyBlocked) await unblockTimeSlot(venueId, date, minToTime(startMin))
        else await blockTimeSlot(venueId, date, minToTime(startMin), minToTime(startMin + 60))
      } catch {
        setOverrides((prev) => new Map(prev).set(key, currentlyBlocked))
        toast.error(isHe ? 'שגיאה בעדכון זמינות' : 'Failed to update availability')
      }
    })
  }

  const onHostDay = (dayDate: Date, dayKey: string) => {
    const free = slots.map(timeToMin).filter((m) => stateOf(dayDate, dayKey, m) === 'free')
    const blockedNow = slots.map(timeToMin).filter((m) => stateOf(dayDate, dayKey, m) === 'blocked')
    const blocking = free.length > 0
    const targets = blocking ? free : blockedNow
    if (targets.length === 0) return

    setOverrides((prev) => {
      const next = new Map(prev)
      for (const m of targets) next.set(blockKey(dayKey, m), blocking)
      return next
    })
    startSaving(async () => {
      try {
        await Promise.all(
          targets.map((m) =>
            blocking
              ? blockTimeSlot(venueId, dayKey, minToTime(m), minToTime(m + 60))
              : unblockTimeSlot(venueId, dayKey, minToTime(m)),
          ),
        )
      } catch {
        setOverrides((prev) => {
          const next = new Map(prev)
          for (const m of targets) next.set(blockKey(dayKey, m), !blocking)
          return next
        })
        toast.error(isHe ? 'שגיאה בעדכון זמינות' : 'Failed to update availability')
      }
    })
  }

  // ── Renter selection ──────────────────────────────────────────
  const renterPick = (dayDate: Date, dayKey: string, slotMin: number) => {
    // Extend an existing same-day selection forward if the gap stays free…
    if (sel && sel.dateKey === dayKey && slotMin >= sel.startMin && contiguousFree(dayDate, dayKey, sel.startMin, slotMin + 60)) {
      const next = { dateKey: dayKey, startMin: sel.startMin, endMin: slotMin + 60 }
      setSel(next)
      bookingDate?.selectRange(dayDate, minToTime(next.startMin), minToTime(next.endMin))
      return
    }
    // …otherwise start a fresh 1-hour selection.
    const next = { dateKey: dayKey, startMin: slotMin, endMin: slotMin + 60 }
    setSel(next)
    bookingDate?.selectRange(dayDate, minToTime(next.startMin), minToTime(next.endMin))
  }

  const renterPickDay = (dayDate: Date, dayKey: string) => {
    if (!contiguousFree(dayDate, dayKey, openingMin, closingMin)) {
      toast.info(isHe ? 'היום אינו פנוי במלואו' : 'This day is not fully free')
      return
    }
    // Whole-day intent — the widget resolves to the day rate when one exists,
    // otherwise to an opening→closing hourly booking. Highlight the full column.
    setSel({ dateKey: dayKey, startMin: openingMin, endMin: closingMin })
    bookingDate?.selectFullDay(dayDate)
  }

  const isSelected = (dayKey: string, slotMin: number) =>
    mode === 'renter' && sel?.dateKey === dayKey && slotMin >= sel.startMin && slotMin < sel.endMin

  const cellClasses: Record<SlotState, string> = {
    free:
      mode === 'host'
        ? 'bg-background ring-1 ring-inset ring-border hover:bg-rose-50 hover:ring-rose-300 dark:hover:bg-rose-950/40'
        : 'bg-background ring-1 ring-inset ring-border hover:bg-primary/10 hover:ring-primary',
    booked: 'bg-violet-500/90 text-white cursor-not-allowed',
    blocked: 'bg-rose-500/90 text-white line-through',
    past: 'bg-muted/50 cursor-not-allowed',
  }

  return (
    <div>
      {/* Week nav */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => canGoPrev && shiftWeek(-1)}
          disabled={!canGoPrev}
          aria-label={isHe ? 'שבוע קודם' : 'Previous week'}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-input transition-colors hover:bg-muted disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
        </button>
        <span className="text-sm font-semibold">{weekLabel}</span>
        <button
          type="button"
          onClick={() => shiftWeek(1)}
          aria-label={isHe ? 'שבוע הבא' : 'Next week'}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-input transition-colors hover:bg-muted"
        >
          <ChevronRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
        </button>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <div
          className="grid min-w-[680px] gap-1.5"
          style={{ gridTemplateColumns: `3.5rem repeat(7, minmax(0,1fr))` }}
        >
          {/* Header row — clickable day = whole day */}
          <div />
          {days.map((d) => {
            const wd = (isHe ? WEEKDAYS_HE : WEEKDAYS_EN)[d.getDay()]
            const dayKey = ymd(d)
            return (
              <button
                key={dayKey}
                type="button"
                onClick={() => (mode === 'host' ? onHostDay(d, dayKey) : renterPickDay(d, dayKey))}
                className="rounded-md py-1 text-center transition-colors hover:bg-muted"
                title={mode === 'host'
                  ? (isHe ? 'חסום/שחרר את כל היום' : 'Block / free the whole day')
                  : (isHe ? 'בחר את כל היום' : 'Select the whole day')}
              >
                <div className="text-xs text-muted-foreground">{wd}</div>
                <div className="text-sm font-semibold">{d.getDate()}</div>
              </button>
            )
          })}

          {/* Slot rows */}
          {slots.map((slot) => {
            const slotMin = timeToMin(slot)
            return (
              <div key={slot} className="contents">
                <div className="flex items-center justify-end pe-1 text-xs text-muted-foreground">
                  {slot}
                </div>
                {days.map((d) => {
                  const dayKey = ymd(d)
                  const state = stateOf(d, dayKey, slotMin)
                  const selected = isSelected(dayKey, slotMin)
                  const interactive = state === 'free' || (mode === 'host' && state === 'blocked')

                  const onClick = () => {
                    if (!interactive) return
                    if (mode === 'host') onHostToggle(dayKey, slotMin, state === 'blocked')
                    else if (state === 'free') renterPick(d, dayKey, slotMin)
                  }

                  return (
                    <button
                      key={`${dayKey}-${slot}`}
                      type="button"
                      disabled={!interactive}
                      onClick={onClick}
                      aria-label={`${dayKey} ${slot}`}
                      className={cn(
                        'h-7 rounded-md text-[11px] font-medium transition-colors',
                        cellClasses[state],
                        selected && 'bg-primary text-primary-foreground ring-2 ring-primary',
                      )}
                    />
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-background ring-1 ring-inset ring-border" />
          {isHe ? 'פנוי' : 'Free'}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-violet-500/90" />
          {isHe ? 'מוזמן' : 'Booked'}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-rose-500/90" />
          {isHe ? 'חסום' : 'Blocked'}
        </span>
      </div>

      {mode === 'host' ? (
        <p className="mt-2 text-xs text-muted-foreground">
          {isHe
            ? 'לחץ על משבצת לחסימה/שחרור, או על כותרת היום לחסימת כל היום.'
            : 'Click a slot to block/free it, or a day header to block the whole day.'}
        </p>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">
          {isHe
            ? 'לחץ על משבצת התחלה ואז על משבצת מאוחרת יותר לבחירת שעת הסיום, או על כותרת היום ליום שלם.'
            : 'Click a start slot, then a later slot to set checkout — or a day header for the whole day.'}
        </p>
      )}
    </div>
  )
}
