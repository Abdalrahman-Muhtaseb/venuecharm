export type RatingRow = { venue_id: string; rating: number }

export function buildRatingsMap(
  rows: RatingRow[],
): Map<string, { avg_rating: number; review_count: number }> {
  const grouped = new Map<string, number[]>()
  for (const row of rows) {
    const arr = grouped.get(row.venue_id) ?? []
    arr.push(row.rating)
    grouped.set(row.venue_id, arr)
  }
  const result = new Map<string, { avg_rating: number; review_count: number }>()
  for (const [id, ratings] of grouped) {
    const avg = Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
    result.set(id, { avg_rating: avg, review_count: ratings.length })
  }
  return result
}
