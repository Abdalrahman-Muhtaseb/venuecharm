type UserShape = { first_name: string | null; last_name: string | null }

export interface ReviewItem {
  id: string
  rating: number
  comment: string | null
  created_at: string
  /** null when the reviewer hid their name (visibility.reviews = false). */
  users: UserShape | UserShape[] | null
}

type RawReviewer = {
  first_name: string | null
  last_name: string | null
  visibility: { reviews?: boolean } | null
}

export interface RawReviewRow {
  id: string
  rating: number
  comment: string | null
  created_at: string
  users: RawReviewer | RawReviewer[] | null
}

/** The Supabase select shared by the venue page and the "load more" action. */
export const REVIEW_SELECT =
  'id, rating, comment, created_at, users:reviewer_id(first_name, last_name, visibility)'

/**
 * Maps a raw review row to the display shape, anonymizing reviewers who turned
 * off "My reviews" visibility (defaults to visible). Keep this the single source
 * of truth so paginated loads match the server-rendered first page.
 */
export function toReviewItem(r: RawReviewRow): ReviewItem {
  const u = Array.isArray(r.users) ? r.users[0] : r.users
  const showName = u?.visibility?.reviews ?? true
  return {
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    created_at: r.created_at,
    users: showName && u ? { first_name: u.first_name, last_name: u.last_name } : null,
  }
}
