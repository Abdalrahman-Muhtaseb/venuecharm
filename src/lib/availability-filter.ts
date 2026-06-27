import type { SupabaseClient } from '@supabase/supabase-js'

// Cap how many days we expand a flexible/ranged search over, so a huge range
// can't blow up the per-venue day scan.
const MAX_RANGE_DAYS = 60

export interface DateRange {
  startStr: string
  endStr: string
  days: string[]
}

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function parseYmd(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s)
  if (!m) return null
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
}

/**
 * Build the inclusive calendar-day range a date search covers.
 * - single `from` → just that day
 * - `from` + `to`  → the span
 * - `flex > 0`     → `from` ± flex days
 * Past days are clamped to today; the span is bounded by MAX_RANGE_DAYS.
 */
export function buildDateRange(
  dateFrom?: string | null,
  dateTo?: string | null,
  flex?: number,
): DateRange | null {
  const from = parseYmd(dateFrom ?? '')
  if (!from) return null

  let start = new Date(from)
  let end = parseYmd(dateTo ?? '') ?? new Date(from)

  const fl = flex && flex > 0 ? flex : 0
  if (fl > 0) {
    start = new Date(from)
    start.setDate(start.getDate() - fl)
    end = new Date(from)
    end.setDate(end.getDate() + fl)
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (start < today) start = today
  if (end < start) return null

  const days: string[] = []
  const cur = new Date(start)
  while (cur <= end && days.length < MAX_RANGE_DAYS) {
    days.push(ymd(cur))
    cur.setDate(cur.getDate() + 1)
  }
  if (days.length === 0) return null
  return { startStr: days[0], endStr: days[days.length - 1], days }
}

/**
 * Of the given venues, which have **at least one free day** within the range?
 * A day is free when it is neither host-blocked (`availability.is_available = false`)
 * nor covered by a PENDING/CONFIRMED booking. Venues with no blocks/bookings are
 * treated as fully available (returned).
 */
export async function venueIdsFreeInRange(
  supabase: SupabaseClient,
  venueIds: string[],
  range: DateRange,
): Promise<Set<string>> {
  const result = new Set<string>()
  if (venueIds.length === 0) return result

  const [{ data: blockedRows }, { data: bookingRows }] = await Promise.all([
    supabase
      .from('availability')
      .select('venue_id, date')
      .in('venue_id', venueIds)
      .eq('is_available', false)
      .gte('date', range.startStr)
      .lte('date', range.endStr),
    supabase
      .from('bookings')
      .select('venue_id, start_at, end_at')
      .in('venue_id', venueIds)
      .in('status', ['PENDING', 'CONFIRMED']),
  ])

  const blocked = new Map<string, Set<string>>()
  for (const r of blockedRows ?? []) {
    const set = blocked.get(r.venue_id) ?? new Set<string>()
    set.add(String(r.date).slice(0, 10))
    blocked.set(r.venue_id, set)
  }

  const booked = new Map<string, Set<string>>()
  for (const b of bookingRows ?? []) {
    const s = parseYmd(String(b.start_at).slice(0, 10))
    const e = parseYmd(String(b.end_at).slice(0, 10))
    if (!s || !e) continue
    const set = booked.get(b.venue_id) ?? new Set<string>()
    const cur = new Date(s)
    while (cur <= e) {
      set.add(ymd(cur))
      cur.setDate(cur.getDate() + 1)
    }
    booked.set(b.venue_id, set)
  }

  for (const id of venueIds) {
    const bl = blocked.get(id)
    const bk = booked.get(id)
    if (range.days.some((d) => !bl?.has(d) && !bk?.has(d))) result.add(id)
  }
  return result
}
