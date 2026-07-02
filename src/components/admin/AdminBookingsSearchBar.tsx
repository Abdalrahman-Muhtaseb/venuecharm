'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

export function AdminBookingsSearchBar() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(searchParams.get('q') ?? '')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setValue(searchParams.get('q') ?? '')
  }, [searchParams])

  function onChange(v: string) {
    setValue(v)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (v.trim()) params.set('q', v.trim())
      else params.delete('q')
      params.delete('page')
      router.replace(`${pathname}?${params.toString()}`)
    }, 300)
  }

  return (
    <div className="relative w-full sm:w-80">
      <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search venue or renter…"
        className="ps-9"
      />
    </div>
  )
}
