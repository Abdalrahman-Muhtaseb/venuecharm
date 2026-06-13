'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { SlidersHorizontal } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FilterPanel } from '@/components/search/FilterPanel'
import type { Locale } from '@/lib/i18n'

interface FilterDialogButtonProps {
  locale: Locale
  resultCount?: number
}

export function FilterDialogButton({ locale, resultCount = 0 }: FilterDialogButtonProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isHe = locale === 'he'

  // Compute active filter count directly from URL params
  const activeFilterCount =
    (searchParams.get('price_max') ? 1 : 0) +
    (searchParams.get('amenities')?.split(',').filter(Boolean).length ?? 0) +
    (searchParams.get('sort') && searchParams.get('sort') !== 'distance' ? 1 : 0)

  const clearAll = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('price_max')
    params.delete('amenities')
    params.delete('sort')
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <Dialog>
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

      <DialogContent className="flex max-h-[85dvh] flex-col gap-0 p-0 sm:max-w-md">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle className="text-center text-base font-semibold">
            {isHe ? 'סינון' : 'Filters'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <FilterPanel locale={locale} hideClear />
        </div>

        <DialogFooter className="flex-row items-center justify-between border-t px-6 py-4">
          <button
            type="button"
            onClick={clearAll}
            className="text-sm font-semibold underline underline-offset-2 transition-opacity hover:opacity-70"
          >
            {isHe ? 'נקה הכל' : 'Clear all'}
          </button>
          <DialogClose asChild>
            <Button size="sm" className="rounded-lg px-5">
              {resultCount > 0
                ? isHe
                  ? `הצג ${resultCount.toLocaleString()} מקומות`
                  : `Show ${resultCount.toLocaleString()} venues`
                : isHe ? 'הצג תוצאות' : 'Show results'}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
