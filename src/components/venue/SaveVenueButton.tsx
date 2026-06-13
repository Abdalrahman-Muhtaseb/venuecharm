'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Heart } from 'lucide-react'
import { toggleFavorite } from '@/actions/favorites'
import { cn } from '@/lib/utils'
import type { Locale } from '@/lib/i18n'

interface SaveVenueButtonProps {
  venueId: string
  initialFavorited: boolean
  locale: Locale
}

export function SaveVenueButton({ venueId, initialFavorited, locale }: SaveVenueButtonProps) {
  const isHe = locale === 'he'
  const [favorited, setFavorited] = useState(initialFavorited)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const onClick = () => {
    const prev = favorited
    setFavorited(!prev)
    startTransition(async () => {
      try {
        const res = await toggleFavorite(venueId)
        setFavorited(res.favorited)
      } catch (err) {
        setFavorited(prev)
        if (err instanceof Error && err.message.includes('UNAUTHENTICATED')) {
          router.push('/login')
        }
      }
    })
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={favorited}
      className="inline-flex items-center gap-2 rounded-full border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-muted disabled:opacity-60"
    >
      <Heart
        className={cn('h-4 w-4 transition-colors', favorited ? 'fill-rose-500 text-rose-500' : 'text-foreground')}
        aria-hidden="true"
      />
      {favorited
        ? (isHe ? 'נשמר' : 'Saved')
        : (isHe ? 'שמירה' : 'Save')}
    </button>
  )
}
