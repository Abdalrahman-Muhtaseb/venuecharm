/**
 * Admin analytics — pure aggregation helpers (no I/O, easily testable).
 *
 * Supabase JS has no GROUP BY / AVG in the query builder, so the admin page
 * fetches raw rows and these functions roll them up in memory. Scale is small
 * (academic demo), so a full scan per report is fine.
 */

export interface MonthlyBucket {
  month: string // 'YYYY-MM'
  value: number
}

export interface VenueRanking {
  venueId: string
  bookings: number
  revenue: number
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** The last `n` month keys ('YYYY-MM'), oldest first, ending with the current month. */
export function lastNMonths(n: number, now: Date = new Date()): string[] {
  const months: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    months.push(monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)))
  }
  return months
}

/**
 * Bucket items into the last `n` months (zero-filled so empty months still
 * render). Pass `value: 1` per item to count, or a numeric field to sum.
 */
export function monthlyBuckets(
  items: { date: string; value: number }[],
  n: number,
  now: Date = new Date(),
): MonthlyBucket[] {
  const totals = new Map<string, number>()
  for (const { date, value } of items) {
    const k = monthKey(new Date(date))
    totals.set(k, (totals.get(k) ?? 0) + value)
  }
  return lastNMonths(n, now).map((month) => ({ month, value: totals.get(month) ?? 0 }))
}

/**
 * Rank venues by successful (CONFIRMED + COMPLETED) booking count, best first,
 * with the GMV those bookings represent. Other statuses are ignored so the
 * count matches the revenue.
 */
export function rankVenuesByBookings(
  rows: { venue_id: string; total_price: number | string | null; status: string }[],
  limit = 10,
): VenueRanking[] {
  const map = new Map<string, { bookings: number; revenue: number }>()
  for (const r of rows) {
    if (r.status !== 'CONFIRMED' && r.status !== 'COMPLETED') continue
    const e = map.get(r.venue_id) ?? { bookings: 0, revenue: 0 }
    e.bookings += 1
    e.revenue += Number(r.total_price ?? 0)
    map.set(r.venue_id, e)
  }
  return [...map.entries()]
    .map(([venueId, v]) => ({ venueId, ...v }))
    .sort((a, b) => b.revenue - a.revenue || b.bookings - a.bookings)
    .slice(0, limit)
}

export interface StatusBreakdown {
  status: string
  count: number
}

/** Count bookings by status (all statuses). */
export function bookingStatusBreakdown(
  rows: { status: string }[],
): StatusBreakdown[] {
  const map = new Map<string, number>()
  for (const { status } of rows) {
    map.set(status, (map.get(status) ?? 0) + 1)
  }
  const ORDER = ['PENDING_APPROVAL', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'REJECTED']
  return ORDER.filter((s) => map.has(s)).map((s) => ({ status: s, count: map.get(s)! }))
}

/** Monthly bucket of booking counts (not summed values — always passes value:1). */
export function monthlyBookingCounts(
  rows: { created_at: string }[],
  n: number,
  now: Date = new Date(),
): MonthlyBucket[] {
  return monthlyBuckets(
    rows.map((r) => ({ date: r.created_at, value: 1 })),
    n,
    now,
  )
}
