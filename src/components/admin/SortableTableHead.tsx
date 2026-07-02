import Link from 'next/link'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { TableHead } from '@/components/ui/table'
import { nextSortFor, type ListingSort, type SortableField } from '@/lib/host-listing-filters'
import { cn } from '@/lib/utils'

interface SortableTableHeadProps {
  field: SortableField
  label: string
  sort: ListingSort
  /**
   * Current search params to preserve in the sort link (except `sort` and `page`
   * which are managed here). Pass every active URL param as key→value pairs.
   * Example: { q: 'search term', status: 'ACTIVE,DRAFT' }
   */
  baseParams: Record<string, string>
  className?: string
}

export function SortableTableHead({
  field,
  label,
  sort,
  baseParams,
  className,
}: SortableTableHeadProps) {
  const next = nextSortFor(field, sort)
  const params = new URLSearchParams(baseParams)
  params.set('sort', next)
  params.delete('page')

  const isActive = sort === `${field}_asc` || sort === `${field}_desc`
  const Icon = !isActive
    ? ChevronsUpDown
    : sort === `${field}_asc`
    ? ChevronUp
    : ChevronDown

  return (
    <TableHead className={cn('text-center', className)}>
      <Link
        href={`?${params.toString()}`}
        className="inline-flex items-center gap-1 rounded-sm outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {label}
        <Icon
          className={cn(
            'h-3.5 w-3.5',
            isActive ? 'text-foreground' : 'text-muted-foreground/40',
          )}
        />
      </Link>
    </TableHead>
  )
}
