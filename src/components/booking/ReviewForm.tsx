'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Star, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { submitReview } from '@/actions/reviews'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { getDictionary, type Locale } from '@/lib/i18n'

interface ReviewFormProps {
  bookingId: string
  venueId: string
  locale: Locale
}

export function ReviewForm({ bookingId, venueId, locale }: ReviewFormProps) {
  const t = getDictionary(locale).reviews
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handle = () => {
    if (rating === 0) return
    startTransition(async () => {
      try {
        await submitReview(bookingId, venueId, rating, comment)
        toast.success(t.submitted)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t.submitted)
      }
    })
  }

  const displayed = hovered || rating

  return (
    <section className="rounded-xl border bg-background p-5 space-y-4">
      <h3 className="text-base font-semibold">{t.rateYourExperience}</h3>

      <div className="flex gap-1" onMouseLeave={() => setHovered(0)}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHovered(star)}
            className="p-0.5 transition-transform hover:scale-110 focus-visible:outline-none"
            aria-label={`${star} stars`}
          >
            <Star
              className={`h-7 w-7 transition-colors ${
                star <= displayed
                  ? 'fill-amber-400 stroke-amber-400'
                  : 'stroke-muted-foreground fill-transparent'
              }`}
            />
          </button>
        ))}
      </div>

      <Textarea
        placeholder={t.commentPlaceholder}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        disabled={isPending}
      />

      <Button onClick={handle} disabled={isPending || rating === 0} className="w-full">
        {isPending ? (
          <><Loader2 className="me-2 h-4 w-4 animate-spin" />{t.submitting}</>
        ) : (
          t.submit
        )}
      </Button>
    </section>
  )
}
