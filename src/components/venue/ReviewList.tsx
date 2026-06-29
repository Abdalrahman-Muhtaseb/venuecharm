import { Star } from 'lucide-react'
import { formatDateLocalized, translate, type Locale, getDictionary } from '@/lib/i18n'

type UserShape = { first_name: string | null; last_name: string | null }

export interface ReviewItem {
  id: string
  rating: number
  comment: string | null
  created_at: string
  users: UserShape | UserShape[] | null
}

interface ReviewListProps {
  reviews: ReviewItem[]
  avgRating: number | null
  reviewCount: number
  locale: Locale
}

const AVATAR_COLORS = [
  'bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500',
  'bg-rose-500',   'bg-indigo-500', 'bg-teal-500',  'bg-orange-500',
]

function resolveUser(users: ReviewItem['users']): UserShape {
  if (!users) return { first_name: null, last_name: null }
  return Array.isArray(users) ? (users[0] ?? { first_name: null, last_name: null }) : users
}

function displayName(users: ReviewItem['users'], guestLabel: string): string {
  const u = resolveUser(users)
  const first = u.first_name?.trim() || ''
  const last  = u.last_name?.trim()  || ''
  if (!first && !last) return guestLabel
  const lastInitial = last ? ` ${last[0].toUpperCase()}.` : ''
  return `${first}${lastInitial}`
}

function initials(users: ReviewItem['users']): string {
  const u = resolveUser(users)
  const f = u.first_name?.trim()[0]?.toUpperCase() ?? ''
  const l = u.last_name?.trim()[0]?.toUpperCase()  ?? ''
  return f + l || '?'
}

function avatarColor(users: ReviewItem['users']): string {
  const code = initials(users).charCodeAt(0) || 0
  return AVATAR_COLORS[code % AVATAR_COLORS.length]
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-3.5 w-3.5 ${
            s <= rating
              ? 'fill-amber-400 stroke-amber-400'
              : 'fill-transparent stroke-muted-foreground/30'
          }`}
        />
      ))}
    </div>
  )
}

export function ReviewList({ reviews, avgRating, reviewCount, locale }: ReviewListProps) {
  const t = getDictionary(locale).reviews

  return (
    <section>
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <h2 className="text-xl font-semibold">{t.title}</h2>
        {avgRating !== null && (
          <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-sm ring-1 ring-amber-200">
            <Star className="h-3.5 w-3.5 fill-amber-400 stroke-amber-400" />
            <span className="font-bold text-amber-700">{avgRating.toFixed(1)}</span>
            <span className="text-amber-600/70">
              · {translate(t.reviewCount, { count: reviewCount })}
            </span>
          </div>
        )}
      </div>

      {reviews.length === 0 ? (
        <p className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
          {t.noReviews}
        </p>
      ) : (
        <div className="divide-y divide-border">
          {reviews.map((review) => {
            const name  = displayName(review.users, t.guest)
            const inits = initials(review.users)
            const color = avatarColor(review.users)

            return (
              <div key={review.id} className="py-6 first:pt-0 last:pb-0">
                {/* Reviewer row */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${color}`}>
                      {inits}
                    </div>
                    <div>
                      <p className="text-sm font-semibold leading-none">{name}</p>
                      <p className="mt-1.5">
                        <StarRow rating={review.rating} />
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground pt-0.5">
                    {formatDateLocalized(review.created_at, locale)}
                  </span>
                </div>

                {/* Comment */}
                {review.comment && (
                  <p className="mt-3 ms-13 text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">
                    {review.comment.trim()}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
