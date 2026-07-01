import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { Plus, Eye, Pencil, Send, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DeleteVenueButton } from '@/components/venue/delete-venue-button'
import { RequestApprovalButton } from '@/components/venue/request-approval-button'
import { HostListingCard } from '@/components/host/HostListingCard'
import { ViewSwitcher } from '@/components/host/ViewSwitcher'
import { ListingsFilterBar } from '@/components/host/ListingsFilterBar'
import { ListingsSortSelect } from '@/components/host/ListingsSortSelect'
import { VenuePagination } from '@/components/search/VenuePagination'
import {
  applyListingSearch,
  applyListingSort,
  nextSortFor,
  parseListingSort,
  type ListingSort,
  type SortableField,
} from '@/lib/host-listing-filters'
import { cn } from '@/lib/utils'
import { defaultLocale, formatCurrencyILS, getDictionary, isLocale, localeCookieName, type Locale } from '@/lib/i18n'

const PAGE_SIZE = 12

type ListingRow = {
  id: string
  title: string
  city: string
  capacity: number
  price_per_hour: number | null
  price_per_day: number | null
  status: string
  photos: string[] | null
  event_types: string[] | null
  created_at: string
}

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  ACTIVE: 'default',
  PENDING_APPROVAL: 'secondary',
  DRAFT: 'outline',
  SUSPENDED: 'destructive',
}

function SortableHead({
  field, label, sort, q,
}: { field: SortableField; label: string; sort: ListingSort; q: string }) {
  const next = nextSortFor(field, sort)
  const params = new URLSearchParams()
  if (q) params.set('q', q)
  params.set('sort', next)
  const isActive = sort === `${field}_asc` || sort === `${field}_desc`
  const Icon = !isActive ? ChevronsUpDown : sort === `${field}_asc` ? ChevronUp : ChevronDown

  return (
    <TableHead className="text-center">
      <Link
        href={`?${params.toString()}`}
        className="inline-flex items-center justify-center gap-1 rounded-sm outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {label}
        <Icon className={cn('h-3.5 w-3.5', isActive ? 'text-foreground' : 'text-muted-foreground/40')} />
      </Link>
    </TableHead>
  )
}

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: { page?: string; q?: string; sort?: string }
}) {
  const locale: Locale = isLocale(cookies().get(localeCookieName)?.value)
    ? (cookies().get(localeCookieName)!.value as Locale)
    : defaultLocale
  const isHe = locale === 'he'
  const eventTypeLabels = getDictionary(locale).rfp.eventTypeOptions

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const q = searchParams.q ?? ''
  const sort = parseListingSort(searchParams.sort)
  const currentPage = Math.max(1, Number(searchParams.page) || 1)
  const offset = (currentPage - 1) * PAGE_SIZE

  const [{ count: totalCount }, { count }, { data: venues }] = await Promise.all([
    supabase.from('venues').select('id', { count: 'exact', head: true }).eq('host_id', user.id),
    applyListingSearch(
      supabase.from('venues').select('id', { count: 'exact', head: true }).eq('host_id', user.id),
      q,
    ),
    applyListingSort(
      applyListingSearch(
        supabase
          .from('venues')
          .select('id, title, city, capacity, price_per_hour, price_per_day, status, photos, event_types, created_at')
          .eq('host_id', user.id),
        q,
      ),
      sort,
    ).range(offset, offset + PAGE_SIZE - 1),
  ])

  if ((totalCount ?? 0) === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed py-20 text-center">
        <p className="font-medium text-muted-foreground">
          {isHe ? 'עדיין אין נכסים' : 'No listings yet'}
        </p>
        <Button asChild>
          <Link href="/host/listings/new">
            <Plus className="me-2 h-4 w-4" />
            {isHe ? 'פרסם את המקום הראשון' : 'Create your first listing'}
          </Link>
        </Button>
      </div>
    )
  }

  const rows = (venues ?? []) as ListingRow[]
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE))

  const toolbarNode = (
    <div className="flex flex-wrap items-center gap-2">
      <Button asChild size="sm">
        <Link href="/host/listings/new">
          <Plus className="me-1.5 h-4 w-4" />
          {isHe ? 'הוסף נכס' : 'Add listing'}
        </Link>
      </Button>
      <ListingsFilterBar locale={locale} />
    </div>
  )

  if ((count ?? 0) === 0) {
    return (
      <div>
        {toolbarNode}
        <div className="mt-4 rounded-2xl border border-dashed py-16 text-center text-muted-foreground">
          {isHe ? `אין תוצאות עבור “${q}”` : `No listings match “${q}”`}
        </div>
      </div>
    )
  }

  const typeChip = (v: ListingRow) => {
    const types = v.event_types ?? []
    if (types.length === 0) return <span className="text-muted-foreground">—</span>
    return (
      <span className="inline-flex items-center gap-1">
        <Badge variant="outline" className="font-normal">{(eventTypeLabels as Record<string, string>)[types[0]] ?? types[0]}</Badge>
        {types.length > 1 && <span className="text-xs text-muted-foreground">+{types.length - 1}</span>}
      </span>
    )
  }

  const pricingCell = (v: ListingRow) => {
    if (!v.price_per_hour && !v.price_per_day) return <span className="text-muted-foreground">—</span>
    return (
      <div className="flex flex-col items-center gap-0.5 tabular-nums">
        {v.price_per_hour != null && (
          <span>{formatCurrencyILS(Number(v.price_per_hour), locale)}{isHe ? '/שעה' : '/hr'}</span>
        )}
        {v.price_per_day != null && (
          <span>{formatCurrencyILS(Number(v.price_per_day), locale)}{isHe ? '/יום' : '/day'}</span>
        )}
      </div>
    )
  }

  const tableNode = (
    <div className="rounded-xl border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16 text-center">{isHe ? 'תמונה' : 'Photo'}</TableHead>
            <SortableHead field="name" label={isHe ? 'שם המקום' : 'Venue'} sort={sort} q={q} />
            <SortableHead field="city" label={isHe ? 'עיר' : 'City'} sort={sort} q={q} />
            <SortableHead field="capacity" label={isHe ? 'קיבולת' : 'Capacity'} sort={sort} q={q} />
            <TableHead className="text-center">{isHe ? 'סוג' : 'Type'}</TableHead>
            <SortableHead field="price" label={isHe ? 'תמחור' : 'Pricing'} sort={sort} q={q} />
            <SortableHead field="status" label={isHe ? 'סטטוס' : 'Status'} sort={sort} q={q} />
            <TableHead className="text-center">{isHe ? 'פעולות' : 'Actions'}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((v) => (
            <TableRow key={v.id}>
              <TableCell>
                {v.photos?.[0] ? (
                  <div className="relative mx-auto h-10 w-14 overflow-hidden rounded-md bg-muted">
                    <Image src={v.photos[0]} alt={v.title} fill className="object-cover" sizes="56px" />
                  </div>
                ) : (
                  <div className="mx-auto h-10 w-14 rounded-md bg-muted" />
                )}
              </TableCell>
              <TableCell className="text-center font-medium max-w-[200px] truncate">{v.title}</TableCell>
              <TableCell className="text-center text-muted-foreground">{v.city}</TableCell>
              <TableCell className="text-center">{v.capacity}</TableCell>
              <TableCell className="text-center">{typeChip(v)}</TableCell>
              <TableCell className="text-center">{pricingCell(v)}</TableCell>
              <TableCell className="text-center">
                <Badge variant={statusVariant[v.status] ?? 'outline'}>
                  {v.status.replace('_', ' ')}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-center gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/venues/${v.id}`} target="_blank" rel="noopener noreferrer" aria-label={isHe ? 'תצוגה מקדימה' : 'Preview'}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/host/listings/${v.id}/edit`} aria-label={isHe ? 'עריכה' : 'Edit'}>
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </Button>
                  {v.status === 'DRAFT' ? (
                    <RequestApprovalButton venueId={v.id} locale={locale} icon={<Send className="h-4 w-4" />} />
                  ) : (
                    <DeleteVenueButton venueId={v.id} locale={locale} />
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )

  const cardNode = (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {rows.map((v) => (
        <HostListingCard key={v.id} v={v} locale={locale} />
      ))}
    </div>
  )

  return (
    <div>
      <ViewSwitcher
        storageKey="host-listings-view"
        locale={locale}
        toolbar={toolbarNode}
        cardOnlyControl={<ListingsSortSelect locale={locale} sort={sort} />}
        table={tableNode}
        card={cardNode}
      />
      <VenuePagination currentPage={currentPage} totalPages={totalPages} locale={locale} />
    </div>
  )
}
