import Link from 'next/link'
import Image from 'next/image'
import { Building2, MapPin, CheckCircle2, Banknote, BarChart2, Star } from 'lucide-react'
import { HostListingActionsDropdown } from '@/components/host/HostListingActionsDropdown'
import { Badge } from '@/components/ui/badge'
import { formatCurrencyILS, type Locale } from '@/lib/i18n'

function StatusBadge({ status }: { status: string }) {
  if (status === 'PENDING_APPROVAL') {
    return (
      <Badge
        variant="outline"
        className="whitespace-nowrap border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
      >
        Pending
      </Badge>
    )
  }
  const variantMap: Record<string, 'default' | 'destructive' | 'outline'> = {
    ACTIVE: 'default', SUSPENDED: 'destructive', DRAFT: 'outline',
  }
  const labelMap: Record<string, string> = {
    ACTIVE: 'Active', SUSPENDED: 'Suspended', DRAFT: 'Draft',
  }
  return (
    <Badge variant={variantMap[status] ?? 'outline'} className="whitespace-nowrap">
      {labelMap[status] ?? status}
    </Badge>
  )
}

export interface HostListingCardRow {
  id: string
  title: string
  city: string
  capacity: number
  price_per_hour: number | null
  price_per_day: number | null
  status: string
  photos: string[] | null
}

export function HostListingCard({
  v,
  locale,
  completed = 0,
  revenue,
  rating,
}: {
  v: HostListingCardRow
  locale: Locale
  completed?: number
  revenue?: number
  rating?: { avg_rating: number; review_count: number }
}) {
  const isHe = locale === 'he'

  const rows: { icon: React.ReactNode; label: string; value: React.ReactNode }[] = [
    {
      icon: <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />,
      label: isHe ? 'עיר' : 'City',
      value: <span className="text-foreground">{v.city}</span>,
    },
    {
      icon: <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />,
      label: isHe ? 'הושלמו' : 'Completed',
      value: (
        <span className="font-medium tabular-nums text-foreground">
          {completed > 0 ? completed : <span className="text-muted-foreground">—</span>}
        </span>
      ),
    },
    {
      icon: <Banknote className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />,
      label: isHe ? 'הכנסות' : 'Revenue',
      value:
        revenue != null && revenue > 0 ? (
          <span className="font-semibold tabular-nums text-primary">
            {formatCurrencyILS(revenue, locale)}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      icon: <BarChart2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />,
      label: isHe ? 'דירוג' : 'Rating',
      value: rating ? (
        <span className="inline-flex items-center gap-1 font-medium tabular-nums">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          {rating.avg_rating.toFixed(1)}
          <span className="text-xs text-muted-foreground">({rating.review_count})</span>
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
    },
  ]

  return (
    <div className="overflow-hidden rounded-xl border bg-background">
      {/* Photo */}
      <Link href={`/host/listings/${v.id}`} className="block">
        <div className="relative h-36 w-full bg-muted">
          {v.photos?.[0] ? (
            <Image
              src={v.photos[0]}
              alt={v.title}
              fill
              className="object-cover transition-opacity hover:opacity-90"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Building2 className="h-7 w-7 text-muted-foreground/40" aria-hidden="true" />
            </div>
          )}
        </div>
      </Link>

      {/* Body */}
      <div className="flex flex-col gap-3 p-4">
        {/* Title + actions */}
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/host/listings/${v.id}`}
            className="truncate font-semibold leading-tight text-primary underline-offset-4 hover:underline"
          >
            {v.title}
          </Link>
          <HostListingActionsDropdown venueId={v.id} status={v.status} locale={locale} />
        </div>

        {/* Divider */}
        <div className="h-px bg-border" />

        {/* Data rows */}
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-xs">
          {rows.map(({ icon, label, value }) => (
            <>
              <dt key={`${label}-dt`} className="flex items-center gap-1.5 text-muted-foreground">
                {icon}
                {label}
              </dt>
              <dd key={`${label}-dd`} className="flex items-center justify-end text-end">
                {value}
              </dd>
            </>
          ))}
        </dl>

        {/* Status */}
        <div className="flex items-center justify-between pt-0.5">
          <span className="text-xs text-muted-foreground">{isHe ? 'סטטוס' : 'Status'}</span>
          <StatusBadge status={v.status} />
        </div>
      </div>
    </div>
  )
}
