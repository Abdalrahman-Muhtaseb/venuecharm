'use client'

import { useState } from 'react'
import { Share2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Locale } from '@/lib/i18n'

interface ShareVenueButtonProps {
  title: string
  locale: Locale
}

export function ShareVenueButton({ title, locale }: ShareVenueButtonProps) {
  const isHe = locale === 'he'
  const [pending, setPending] = useState(false)

  const onClick = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    if (!url) return
    setPending(true)
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title, url })
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(url)
        toast.success(isHe ? 'הקישור הועתק' : 'Link copied')
      }
    } catch {
      // user dismissed the native share sheet, or share/clipboard unavailable — ignore
    } finally {
      setPending(false)
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-full border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-muted disabled:opacity-60"
    >
      <Share2 className="h-4 w-4" aria-hidden="true" />
      {isHe ? 'שיתוף' : 'Share'}
    </button>
  )
}
