'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Locale } from '@/lib/i18n'

// Mirrors the search bar's empty-location submit: device position if granted,
// otherwise Tel Aviv — so "View more" lands on a populated, located results page.
const TEL_AVIV = { lat: 32.0853, lng: 34.7818 }

export function ViewMoreButton({ locale, label }: { locale: Locale; label: string }) {
  const router = useRouter()
  const isHe = locale === 'he'
  const [pending, setPending] = useState(false)

  const go = (lat: number, lng: number, q: string) => {
    const params = new URLSearchParams({ lat: String(lat), lng: String(lng), radius: '30', q })
    router.push(`/venues?${params.toString()}`)
  }

  const onClick = () => {
    setPending(true)
    const fallback = () => go(TEL_AVIV.lat, TEL_AVIV.lng, isHe ? 'תל אביב' : 'Tel Aviv, Israel')
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => go(pos.coords.latitude, pos.coords.longitude, isHe ? 'בקרבת מקום' : 'Nearby'),
        fallback,
        { timeout: 8000, maximumAge: 300000 },
      )
    } else {
      fallback()
    }
  }

  return (
    <Button variant="outline" onClick={onClick} disabled={pending}>
      {label}
      <ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" aria-hidden="true" />
    </Button>
  )
}
