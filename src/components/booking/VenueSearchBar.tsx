'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import type { Locale } from '@/lib/i18n'

export function VenueSearchBar({ locale, initialQ = '' }: { locale: Locale; initialQ?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [q, setQ] = useState(initialQ)
  const isHe = locale === 'he'

  useEffect(() => {
    const handle = setTimeout(() => {
      const current = searchParams.get('q') ?? ''
      if (q === current) return
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      router.replace(`${pathname}${params.toString() ? `?${params.toString()}` : ''}`)
    }, 350)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  return (
    <div className="relative flex-1 min-w-[200px] max-w-sm">
      <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={isHe ? 'חיפוש לפי שם או עיר' : 'Search by name or city'}
        className="ps-9"
      />
    </div>
  )
}
