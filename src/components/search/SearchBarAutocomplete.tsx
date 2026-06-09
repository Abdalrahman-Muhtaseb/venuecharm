'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Search, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Locale } from '@/lib/i18n'

declare global {
  interface Window {
    google?: { maps: any }
  }
}

interface SearchBarAutocompleteProps {
  locale: Locale
  initialQ?: string
  initialCapacity?: string
}

export function SearchBarAutocomplete({
  locale,
  initialQ = '',
  initialCapacity = '',
}: SearchBarAutocompleteProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [q, setQ] = useState(initialQ)
  const [capacity, setCapacity] = useState(initialCapacity)
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<any>(null)
  const capacityRef = useRef(capacity)
  const searchParamsRef = useRef(searchParams)
  const isHe = locale === 'he'

  useEffect(() => { capacityRef.current = capacity }, [capacity])
  useEffect(() => { searchParamsRef.current = searchParams }, [searchParams])

  useEffect(() => {
    if (!inputRef.current || !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) return

    const tryAttach = (): boolean => {
      if (!window.google?.maps?.places?.Autocomplete) return false
      if (autocompleteRef.current) return true

      const ac = new window.google.maps.places.Autocomplete(inputRef.current!, {
        componentRestrictions: { country: 'il' },
        types: ['geocode'],
        fields: ['geometry', 'name'],
      })

      ac.addListener('place_changed', () => {
        const place = ac.getPlace()
        if (!place?.geometry?.location) return
        const lat: number = place.geometry.location.lat()
        const lng: number = place.geometry.location.lng()
        const name: string = place.name ?? ''
        setQ(name)

        startTransition(() => {
          const params = new URLSearchParams(searchParamsRef.current.toString())
          params.set('lat', String(lat))
          params.set('lng', String(lng))
          params.set('radius', '30')
          if (name) params.set('q', name)
          else params.delete('q')
          if (capacityRef.current) params.set('capacity', capacityRef.current)
          else params.delete('capacity')
          router.push(`${pathname}?${params.toString()}`)
        })
      })

      autocompleteRef.current = ac
      return true
    }

    if (tryAttach()) return

    const interval = setInterval(() => {
      if (tryAttach()) clearInterval(interval)
    }, 200)

    return () => clearInterval(interval)
  }, [pathname, router])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (q.trim()) params.set('q', q.trim())
      else params.delete('q')
      if (capacity) params.set('capacity', capacity)
      else params.delete('capacity')
      params.delete('lat')
      params.delete('lng')
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={isHe ? 'עיר, שכונה, או שם מקום...' : 'City, neighborhood, or venue name...'}
          className="ps-9"
          autoComplete="off"
        />
      </div>
      <Input
        type="number"
        min={1}
        value={capacity}
        onChange={(e) => setCapacity(e.target.value)}
        placeholder={isHe ? "מס' אורחים" : 'Guests'}
        className="w-full sm:w-32"
      />
      <Button type="submit" disabled={isPending} className="shrink-0">
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (isHe ? 'חיפוש' : 'Search')}
      </Button>
    </form>
  )
}
