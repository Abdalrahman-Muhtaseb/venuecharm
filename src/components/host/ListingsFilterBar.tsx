'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { Locale } from '@/lib/i18n'

export function ListingsFilterBar({
  locale,
  placeholder,
  className,
}: {
  locale: Locale
  placeholder?: string
  className?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [q, setQ] = useState(searchParams.get('q') ?? '')
  const isHe = locale === 'he'

  const resolvedPlaceholder =
    placeholder ?? (isHe ? 'חיפוש לפי שם או עיר' : 'Search by name or city')

  // Debounced search — typing shouldn't fire a request per keystroke.
  useEffect(() => {
    const handle = setTimeout(() => {
      const current = searchParams.get('q') ?? ''
      if (q === current) return
      const params = new URLSearchParams(searchParams.toString())
      if (q) params.set('q', q)
      else params.delete('q')
      params.delete('page')
      router.replace(`${pathname}?${params.toString()}`)
    }, 350)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  return (
    <div className={cn('relative min-w-[200px] w-full sm:w-64', className)}>
      <Search
        className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={resolvedPlaceholder}
        className="ps-9"
      />
    </div>
  )
}
