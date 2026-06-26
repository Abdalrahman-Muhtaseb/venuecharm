'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { SlidersHorizontal } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FilterPanel, EMPTY_FILTERS, type FilterValues } from '@/components/search/FilterPanel'
import { createClient } from '@/lib/supabase/client'
import type { Locale } from '@/lib/i18n'

interface FilterDialogButtonProps {
  locale: Locale
}

function readFilters(sp: URLSearchParams): FilterValues {
  return {
    sort: sp.get('sort') ?? 'distance',
    eventType: sp.get('event_type') ?? '',
    priceMax: sp.get('price_max') ? parseInt(sp.get('price_max')!, 10) : null,
    amenities: sp.get('amenities')?.split(',').filter(Boolean) ?? [],
  }
}

export function FilterDialogButton({ locale }: FilterDialogButtonProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isHe = locale === 'he'

  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<FilterValues>(() => readFilters(searchParams))
  const [maxPrice, setMaxPrice] = useState(4000)

  // Highest active-venue hourly price drives the slider ceiling (rounded up to
  // the slider step) instead of a hardcoded max.
  useEffect(() => {
    let cancelled = false
    createClient()
      .from('venues')
      .select('price_per_hour')
      .eq('status', 'ACTIVE')
      .not('price_per_hour', 'is', null)
      .order('price_per_hour', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        const top = data?.[0]?.price_per_hour
        if (!cancelled && top) setMaxPrice(Math.max(50, Math.ceil(Number(top) / 50) * 50))
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Active filter count reflects what's actually applied (the URL), not the draft.
  const activeFilterCount =
    (searchParams.get('price_max') ? 1 : 0) +
    (searchParams.get('amenities')?.split(',').filter(Boolean).length ?? 0) +
    (searchParams.get('event_type') ? 1 : 0) +
    (searchParams.get('sort') && searchParams.get('sort') !== 'distance' ? 1 : 0)

  const onOpenChange = (next: boolean) => {
    if (next) setDraft(readFilters(searchParams)) // seed draft from the applied filters
    setOpen(next)
  }

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString())
    const set = (key: string, v: string | null) => (v ? params.set(key, v) : params.delete(key))
    set('sort', draft.sort && draft.sort !== 'distance' ? draft.sort : null)
    set('event_type', draft.eventType || null)
    set('price_max', draft.priceMax != null ? String(draft.priceMax) : null)
    set('amenities', draft.amenities.length ? draft.amenities.join(',') : null)
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={isHe ? 'פתח סינון' : 'Open filters'}
          className="relative flex h-10 items-center gap-2 rounded-full border border-input bg-background px-4 text-sm font-medium shadow-sm transition-shadow hover:shadow-md"
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          <span>{isHe ? 'סינון' : 'Filters'}</span>
          {activeFilterCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-[11px] font-bold text-background">
              {activeFilterCount}
            </span>
          )}
        </button>
      </DialogTrigger>

      <DialogContent className="flex max-h-[85dvh] flex-col gap-0 p-0 sm:max-w-2xl">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle className="text-center text-base font-semibold">
            {isHe ? 'סינון' : 'Filters'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <FilterPanel
            locale={locale}
            maxPrice={maxPrice}
            hideClear
            value={draft}
            onChange={setDraft}
          />
        </div>

        <DialogFooter className="flex-row items-center justify-between border-t px-6 py-4">
          <button
            type="button"
            onClick={() => setDraft(EMPTY_FILTERS)}
            className="text-sm font-semibold underline underline-offset-2 transition-opacity hover:opacity-70"
          >
            {isHe ? 'נקה הכל' : 'Clear all'}
          </button>
          <Button size="sm" className="rounded-lg px-5" onClick={applyFilters}>
            {isHe ? 'הצג תוצאות' : 'Show results'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
