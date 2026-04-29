'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Locale } from '@/lib/i18n'

interface SearchBarProps {
  locale: Locale
  initialQ?: string
  initialCapacity?: string
}

export function SearchBar({ locale, initialQ = '', initialCapacity = '' }: SearchBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [q, setQ] = useState(initialQ)
  const [capacity, setCapacity] = useState(initialCapacity)
  const isHe = locale === 'he'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (q.trim()) params.set('q', q.trim())
      else params.delete('q')
      if (capacity) params.set('capacity', capacity)
      else params.delete('capacity')
      // Clear cached coords when city text changes
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
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={isHe ? 'עיר, שכונה, או שם מקום...' : 'City, neighborhood, or venue name...'}
          className="ps-9"
        />
      </div>
      <Input
        type="number"
        min={1}
        value={capacity}
        onChange={(e) => setCapacity(e.target.value)}
        placeholder={isHe ? 'מס\' אורחים' : 'Guests'}
        className="w-full sm:w-32"
      />
      <Button type="submit" disabled={isPending} className="shrink-0">
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (isHe ? 'חיפוש' : 'Search')}
      </Button>
    </form>
  )
}
