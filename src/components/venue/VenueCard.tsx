'use client'

import { useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { MapPin, Star, Heart, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { formatCurrencyILS, type Locale } from '@/lib/i18n'
import { toggleFavorite } from '@/actions/favorites'
import { cn } from '@/lib/utils'
import { BLUR_DATA_URL } from '@/lib/image'

export interface VenueCardProps {
  id: string
  title: string
  city: string
  address?: string
  capacity: number
  price_per_hour: number | null
  price_per_day: number | null
  photos: string[] | null
  status?: string
  showStatus?: boolean
  locale: Locale
  highlighted?: boolean
  avg_rating?: number | null
  review_count?: number | null
  match_score?: number | null
  priority?: boolean
  isFavorited?: boolean
  onHover?: () => void
  onHoverEnd?: () => void
}

const statusStyles: Record<string, string> = {
  ACTIVE: 'bg-emerald-500/90 text-white',
  PENDING_APPROVAL: 'bg-amber-500/90 text-white',
  DRAFT: 'bg-slate-500/90 text-white',
  SUSPENDED: 'bg-rose-500/90 text-white',
}

export function VenueCard({
  id,
  title,
  city,
  capacity,
  price_per_hour,
  price_per_day,
  photos,
  status,
  showStatus = false,
  locale,
  highlighted = false,
  avg_rating,
  review_count,
  match_score,
  priority = false,
  isFavorited = false,
  onHover,
  onHoverEnd,
}: VenueCardProps) {
  const [photoIndex, setPhotoIndex] = useState(0)
  const [favorited, setFavorited] = useState(isFavorited)
  const [, startFavTransition] = useTransition()
  const router = useRouter()
  const touchStartX = useRef<number | null>(null)
  const swipedRef = useRef(false)

  const onToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const prev = favorited
    setFavorited(!prev) // optimistic
    startFavTransition(async () => {
      try {
        const res = await toggleFavorite(id)
        setFavorited(res.favorited)
      } catch (err) {
        setFavorited(prev) // revert on failure
        if (err instanceof Error && err.message.includes('UNAUTHENTICATED')) {
          router.push('/login')
        }
      }
    })
  }
  const fmtHour = price_per_hour != null ? formatCurrencyILS(Number(price_per_hour), locale) : null
  const fmtDay  = price_per_day  != null ? formatCurrencyILS(Number(price_per_day),  locale) : null
  const isHe = locale === 'he'
  const photoList = photos ?? []
  const photoCount = photoList.length

  const DOT_COUNT = Math.min(photoCount, 5)
  const activeDot =
    photoCount <= 5
      ? photoIndex
      : Math.round((photoIndex / (photoCount - 1)) * (DOT_COUNT - 1))

  const goPrev = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setPhotoIndex((i) => (i - 1 + photoCount) % photoCount)
  }

  const goNext = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setPhotoIndex((i) => (i + 1) % photoCount)
  }

  // Touch swipe (mobile): swipe left → next photo, swipe right → previous.
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    swipedRef.current = false
  }
  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current != null && Math.abs(e.touches[0].clientX - touchStartX.current) > 10) {
      swipedRef.current = true
    }
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (photoCount > 1 && Math.abs(dx) > 40) {
      setPhotoIndex((i) => (dx < 0 ? i + 1 : i - 1 + photoCount) % photoCount)
    }
    touchStartX.current = null
  }

  const priceLabel = fmtHour ?? fmtDay
  const priceUnit  = fmtHour
    ? (isHe ? '/ שעה' : '/ hr')
    : (isHe ? '/ יום' : '/ day')

  return (
    <Link
      href={`/venues/${id}`}
      id={`venue-card-${id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col"
      onMouseEnter={onHover}
      onMouseLeave={onHoverEnd}
      onClick={(e) => {
        if (swipedRef.current) {
          e.preventDefault()
          swipedRef.current = false
        }
      }}
    >
      {/* ── Image ── */}
      <div
        className={`relative h-56 w-full touch-pan-y overflow-hidden rounded-2xl bg-muted ${
          highlighted ? 'ring-2 ring-primary ring-offset-2' : ''
        }`}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {photoCount > 0 ? (
          <Image
            src={photoList[photoIndex]}
            alt={`${title} — ${isHe ? 'תמונה' : 'photo'} ${photoIndex + 1}`}
            fill
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={priority && photoIndex === 0}
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <MapPin className="h-8 w-8 text-muted-foreground/30" aria-hidden="true" />
          </div>
        )}

        {/* Rating badge — top-end of image */}
        {avg_rating != null && (
          <div className="absolute end-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 shadow-sm backdrop-blur-sm">
            <Star className="h-3 w-3 fill-amber-400 stroke-amber-400" aria-hidden="true" />
            <span className="text-xs font-semibold text-gray-900">
              {avg_rating.toFixed(1)}
              {review_count != null && review_count > 0 && (
                <span className="font-normal text-gray-500"> ({review_count})</span>
              )}
            </span>
          </div>
        )}

        {/* Match badge — top-start (best-match search) */}
        {match_score != null && !showStatus && (
          <div className="absolute start-3 top-3 flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-sm font-semibold text-primary-foreground shadow-md">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {isHe ? `${match_score}% התאמה` : `${match_score}% match`}
          </div>
        )}

        {/* Status badge — top-start (host / admin views) */}
        {showStatus && status && status !== 'ACTIVE' && (
          <div
            className={`absolute start-2 top-2 rounded-md px-2 py-0.5 text-xs font-semibold ${
              statusStyles[status] ?? 'bg-muted/90 text-foreground'
            }`}
          >
            {status.replace('_', ' ')}
          </div>
        )}

        {/* Prev arrow — bg-white with always-dark icon so it's visible in dark mode */}
        {photoCount > 1 && photoIndex > 0 && (
          <button
            type="button"
            onClick={goPrev}
            aria-label={isHe ? 'תמונה קודמת' : 'Previous photo'}
            className="absolute start-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md opacity-0 transition-opacity group-hover:opacity-100 hover:scale-110 active:scale-95"
          >
            <ChevronLeft className="h-4 w-4 text-gray-900" aria-hidden="true" />
          </button>
        )}

        {/* Next arrow */}
        {photoCount > 1 && photoIndex < photoCount - 1 && (
          <button
            type="button"
            onClick={goNext}
            aria-label={isHe ? 'תמונה הבאה' : 'Next photo'}
            className="absolute end-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md opacity-0 transition-opacity group-hover:opacity-100 hover:scale-110 active:scale-95"
          >
            <ChevronRight className="h-4 w-4 text-gray-900" aria-hidden="true" />
          </button>
        )}

        {/* Photo dots */}
        {photoCount > 1 && (
          <div
            className="absolute bottom-2.5 left-1/2 flex -translate-x-1/2 items-center gap-1"
            aria-hidden="true"
          >
            {Array.from({ length: DOT_COUNT }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  i === activeDot ? 'w-3 bg-white' : 'w-1.5 bg-white/60'
                }`}
              />
            ))}
          </div>
        )}

        {/* Heart — bottom-end of image */}
        <button
          type="button"
          aria-label={isHe ? 'שמור למועדפים' : 'Save to favourites'}
          aria-pressed={favorited}
          onClick={onToggleFavorite}
          className="absolute bottom-3 end-3 flex h-8 w-8 items-center justify-center rounded-full transition-transform hover:scale-110 active:scale-95"
        >
          <Heart
            className={cn(
              'h-5 w-5 transition-colors drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]',
              favorited ? 'fill-rose-500 text-rose-500' : 'fill-black/20 text-white',
            )}
            aria-hidden="true"
          />
        </button>
      </div>

      {/* ── Info ── */}
      <div className="mt-2.5 flex flex-1 flex-col gap-0.5">
        {/* Title (left) + price (right) on same row */}
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="line-clamp-1 flex-1 text-sm font-semibold text-foreground">{title}</h3>
          {priceLabel && (
            <p className="shrink-0 whitespace-nowrap text-sm">
              <span className="font-semibold">{priceLabel}</span>
              <span className="text-muted-foreground">{' '}{priceUnit}</span>
            </p>
          )}
        </div>

        {/* City • capacity on one line */}
        <p className="text-sm text-muted-foreground">
          {city}
          {' • '}
          {isHe ? `עד ${capacity} אורחים` : `Up to ${capacity} guests`}
        </p>
      </div>
    </Link>
  )
}
