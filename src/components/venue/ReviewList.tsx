'use client'

import { useState, useTransition } from 'react'
import { Star, ChevronDown, Loader2 } from 'lucide-react'
import { formatDateLocalized, translate, type Locale, getDictionary } from '@/lib/i18n'
import { loadVenueReviews } from '@/actions/reviews'
import type { ReviewItem } from '@/lib/reviews-format'

export type { ReviewItem } from '@/lib/reviews-format'

type UserShape = { first_name: string | null; last_name: string | null }

interface ReviewListProps {
  venueId: string
  reviews: ReviewItem[]
  avgRating: number | null
  reviewCount: number
  locale: Locale
  pageSize?: number
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

function ReviewCard({ review, guestLabel, locale }: { review: ReviewItem; guestLabel: string; locale: Locale }) {
  const name  = displayName(review.users, guestLabel)
  const inits = initials(review.users)
  const color = avatarColor(review.users)

  return (
    <article className="flex flex-col rounded-2xl border bg-background p-5">
      <div className="flex items-start justify-between gap-3">
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
        <span className="shrink-0 pt-0.5 text-xs text-muted-foreground">
          {formatDateLocalized(review.created_at, locale)}
        </span>
      </div>

      {review.comment && (
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
          {review.comment.trim()}
        </p>
      )}
    </article>
  )
}

export function ReviewList({
  venueId,
  reviews: initialReviews,
  avgRating,
  reviewCount,
  locale,
  pageSize = 6,
}: ReviewListProps) {
  const t = getDictionary(locale).reviews
  const [reviews, setReviews] = useState<ReviewItem[]>(initialReviews)
  const [isPending, startTransition] = useTransition()

  const hasMore = reviews.length < reviewCount

  function showMore() {
    startTransition(async () => {
      const next = await loadVenueReviews(venueId, reviews.length, pageSize)
      setReviews((prev) => {
        const seen = new Set(prev.map((r) => r.id))
        return [...prev, ...next.filter((r) => !seen.has(r.id))]
      })
    })
  }

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
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} guestLabel={t.guest} locale={locale} />
            ))}
          </div>

          {hasMore && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={showMore}
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition hover:bg-muted/50 disabled:opacity-60"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t.loadingMore}
                  </>
                ) : (
                  <>
                    {t.showMore}
                    <ChevronDown className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}
