// Shared time-slot helpers for the week-availability grid and the booking widget.
// Times are handled as "minutes since midnight"; dates as local YYYY-MM-DD keys.

export type SlotState = 'free' | 'booked' | 'blocked' | 'past'

export interface SlotBooking {
  /** Local date key YYYY-MM-DD */
  date: string
  startMin: number
  endMin: number
}

export interface SlotBlock {
  /** Local date key YYYY-MM-DD */
  date: string
  startMin: number
}

export function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** 'HH:MM' (or 'HH:MM:SS') → minutes since midnight. '24:00' → 1440. */
export function timeToMin(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + (m || 0)
}

export function minToTime(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** Inclusive list of hourly slot starts within [opening, closing). e.g. 08:00→23:00 = 08..22 */
export function hourlySlots(opening: string, closing: string): string[] {
  const start = Math.floor(timeToMin(opening) / 60)
  const end = Math.ceil(timeToMin(closing) / 60)
  const out: string[] = []
  for (let h = start; h < end; h++) out.push(`${String(h).padStart(2, '0')}:00`)
  return out
}

/** Monday-free, Sunday-first week start (matches the rest of the app's Sunday-first calendars). */
export function startOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  d.setDate(d.getDate() - d.getDay()) // 0 = Sunday
  return d
}

export function weekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })
}

/** Booking start/end ISO → the minute range it occupies on a given local date key. */
export function bookingMinutesOnDate(
  booking: { date: string; startMin: number; endMin: number },
  dayKey: string,
): { start: number; end: number } | null {
  if (booking.date !== dayKey) return null
  return { start: booking.startMin, end: booking.endMin }
}

/** State of one hourly slot [slotMin, slotMin+60) on a given day. */
export function slotState(
  dayKey: string,
  slotMin: number,
  opts: {
    bookings: SlotBooking[]
    blocks: SlotBlock[]
    nowMs: number
    dayDate: Date
  },
): SlotState {
  const slotStartMs = new Date(
    opts.dayDate.getFullYear(),
    opts.dayDate.getMonth(),
    opts.dayDate.getDate(),
  ).getTime() + slotMin * 60_000
  if (slotStartMs + 60 * 60_000 <= opts.nowMs) return 'past'

  const slotEnd = slotMin + 60
  const overlapsBooking = opts.bookings.some(
    (b) => b.date === dayKey && b.startMin < slotEnd && b.endMin > slotMin,
  )
  if (overlapsBooking) return 'booked'

  const isBlocked = opts.blocks.some((b) => b.date === dayKey && b.startMin === slotMin)
  if (isBlocked) return 'blocked'

  return 'free'
}

/** Pad each booking by the venue's turnaround buffer so adjacent slots can't be booked. */
export function expandBookings(bookings: SlotBooking[], bufferMin: number): SlotBooking[] {
  if (!bufferMin) return bookings
  return bookings.map((b) => ({
    date: b.date,
    startMin: Math.max(0, b.startMin - bufferMin),
    endMin: Math.min(1440, b.endMin + bufferMin),
  }))
}

/** Taken (booking + block) minute ranges on a date — used to filter booking time dropdowns. */
export function takenRangesForDate(
  dayKey: string,
  bookings: SlotBooking[],
  blocks: SlotBlock[],
): { start: number; end: number }[] {
  const ranges: { start: number; end: number }[] = []
  for (const b of bookings) {
    if (b.date === dayKey) ranges.push({ start: b.startMin, end: b.endMin })
  }
  for (const b of blocks) {
    if (b.date === dayKey) ranges.push({ start: b.startMin, end: b.startMin + 60 })
  }
  return ranges.sort((a, b) => a.start - b.start)
}
