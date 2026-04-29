'use client'

import { useState } from 'react'
import { SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react'
import { FilterPanel } from '@/components/search/FilterPanel'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Locale } from '@/lib/i18n'

interface FilterSidebarProps {
  locale: Locale
}

export function FilterSidebar({ locale }: FilterSidebarProps) {
  const [open, setOpen] = useState(true)
  const isHe = locale === 'he'

  return (
    <aside className={cn('hidden shrink-0 lg:flex lg:flex-col', open ? 'me-5 w-52' : 'me-2 w-8')}>
      {/* Toggle button */}
      <div className="mb-4 flex items-center">
        {open && (
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {isHe ? 'סינון' : 'Filters'}
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="ms-auto h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Collapse filters' : 'Expand filters'}
        >
          {open
            ? (isHe ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />)
            : (isHe ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)
          }
        </Button>
      </div>

      {/* Panel — hidden when collapsed, no layout reflow */}
      <div
        className={cn(
          'sticky top-36 overflow-hidden transition-all duration-200',
          open ? 'opacity-100' : 'pointer-events-none w-0 opacity-0',
        )}
      >
        <FilterPanel locale={locale} />
      </div>
    </aside>
  )
}
