'use client'

import { useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ArrowUpDown, ChevronUp, ChevronDown, ChevronsUpDown, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { Locale } from '@/lib/i18n'
import type { ListingSort } from '@/lib/host-listing-filters'

type FixedOpt = { type: 'fixed'; value: ListingSort; label: { en: string; he: string } }
type FieldOpt = { type: 'field'; field: string;      label: { en: string; he: string } }
type SortOpt  = FixedOpt | FieldOpt

const SORT_OPTIONS: SortOpt[] = [
  { type: 'fixed', value: 'newest',    label: { en: 'Newest',    he: 'חדשים ביותר' } },
  { type: 'fixed', value: 'oldest',    label: { en: 'Oldest',    he: 'ישנים ביותר' } },
  { type: 'field', field: 'name',      label: { en: 'Venue',     he: 'שם המקום'    } },
  { type: 'field', field: 'host',      label: { en: 'Host',      he: 'מארח'        } },
  { type: 'field', field: 'city',      label: { en: 'City',      he: 'עיר'         } },
  { type: 'field', field: 'completed', label: { en: 'Completed', he: 'הושלמו'      } },
  { type: 'field', field: 'revenue',   label: { en: 'Revenue',   he: 'הכנסות'      } },
  { type: 'field', field: 'rating',    label: { en: 'Rating',    he: 'דירוג'       } },
  { type: 'field', field: 'status',    label: { en: 'Status',    he: 'סטטוס'       } },
]

export function AdminVenuesSortModal({ locale, sort }: { locale: Locale; sort: ListingSort }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isHe = locale === 'he'

  function applySort(next: ListingSort) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', next)
    params.delete('page')
    router.replace(`${pathname}?${params.toString()}`)
    setOpen(false)
  }

  const isFixedSort = sort === 'newest' || sort === 'oldest'
  const activeField = isFixedSort ? null : sort.replace(/_(?:asc|desc)$/, '')
  const activeDir   = sort.endsWith('_asc') ? 'asc' : sort.endsWith('_desc') ? 'desc' : null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <ArrowUpDown className="h-4 w-4" />
          <span className="text-sm">{isHe ? 'מיון' : 'Sort'}</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-xs p-4">
        <DialogHeader className="pb-1">
          <DialogTitle className="text-base">{isHe ? 'מיון לפי' : 'Sort by'}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-0.5">
          {SORT_OPTIONS.map((opt) => {
            const label = opt.label[isHe ? 'he' : 'en']

            if (opt.type === 'fixed') {
              const isActive = sort === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => applySort(opt.value)}
                  className={cn(
                    'flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors',
                    isActive
                      ? 'bg-primary/10 font-medium text-primary'
                      : 'text-foreground hover:bg-muted',
                  )}
                >
                  <span>{label}</span>
                  {isActive && <Check className="h-4 w-4 shrink-0 text-primary" />}
                </button>
              )
            }

            const isActive  = activeField === opt.field
            const isAsc     = isActive && activeDir === 'asc'
            const isDesc    = isActive && activeDir === 'desc'
            const nextSort  = (isActive
              ? `${opt.field}_${isAsc ? 'desc' : 'asc'}`
              : `${opt.field}_asc`) as ListingSort

            return (
              <div
                key={opt.field}
                className={cn(
                  'flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors',
                  isActive ? 'bg-primary/10' : 'hover:bg-muted',
                )}
              >
                {/* Label — click to activate (asc) or flip direction if already active */}
                <button
                  type="button"
                  onClick={() => applySort(nextSort)}
                  className={cn(
                    'flex-1 text-start font-medium',
                    isActive ? 'text-primary' : 'text-foreground',
                  )}
                >
                  {label}
                </button>

                {/* Direction chevron — same action as the label click */}
                <button
                  type="button"
                  onClick={() => applySort(nextSort)}
                  aria-label={isAsc ? 'Sort descending' : 'Sort ascending'}
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors',
                    isActive
                      ? 'text-primary hover:bg-primary/20'
                      : 'text-muted-foreground/40 hover:bg-muted hover:text-muted-foreground',
                  )}
                >
                  {isAsc  ? <ChevronUp   className="h-4 w-4" /> :
                   isDesc ? <ChevronDown className="h-4 w-4" /> :
                            <ChevronsUpDown className="h-4 w-4" />}
                </button>
              </div>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
