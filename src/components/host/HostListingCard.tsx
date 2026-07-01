import Link from 'next/link'
import Image from 'next/image'
import { Building2, Eye, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DeleteVenueButton } from '@/components/venue/delete-venue-button'
import { RequestApprovalButton } from '@/components/venue/request-approval-button'
import { formatCurrencyILS, getDictionary, type Locale } from '@/lib/i18n'

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  ACTIVE: 'default',
  PENDING_APPROVAL: 'secondary',
  DRAFT: 'outline',
  SUSPENDED: 'destructive',
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
  event_types: string[] | null
}

export function HostListingCard({ v, locale }: { v: HostListingCardRow; locale: Locale }) {
  const isHe = locale === 'he'
  const eventTypeLabels = getDictionary(locale).rfp.eventTypeOptions as Record<string, string>
  const types = v.event_types ?? []

  return (
    <div className="overflow-hidden rounded-xl border bg-background">
      <div className="relative h-36 w-full bg-muted">
        {v.photos?.[0] ? (
          <Image
            src={v.photos[0]}
            alt={v.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Building2 className="h-7 w-7 text-muted-foreground/40" aria-hidden="true" />
          </div>
        )}
        <Badge variant={statusVariant[v.status] ?? 'outline'} className="absolute start-2 top-2">
          {v.status.replace('_', ' ')}
        </Badge>
      </div>

      <div className="flex flex-col gap-1 p-4">
        <p className="truncate font-medium">{v.title}</p>
        <p className="text-sm text-muted-foreground">
          {v.city} · {isHe ? `עד ${v.capacity} אורחים` : `Up to ${v.capacity} guests`}
        </p>
        {types.length > 0 && (
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="font-normal">{eventTypeLabels[types[0]] ?? types[0]}</Badge>
            {types.length > 1 && <span className="text-xs text-muted-foreground">+{types.length - 1}</span>}
          </div>
        )}
        {(v.price_per_hour || v.price_per_day) ? (
          <div className="mt-1 flex items-center justify-evenly gap-2 text-sm font-semibold text-primary tabular-nums">
            {v.price_per_hour != null && (
              <span>{formatCurrencyILS(Number(v.price_per_hour), locale)} {isHe ? '/ שעה' : '/ hr'}</span>
            )}
            {v.price_per_day != null && (
              <span>{formatCurrencyILS(Number(v.price_per_day), locale)} {isHe ? '/ יום' : '/ day'}</span>
            )}
          </div>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">—</p>
        )}

        <div className="mt-3 flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/venues/${v.id}`} target="_blank" rel="noopener noreferrer" aria-label={isHe ? 'תצוגה מקדימה' : 'Preview'}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="flex-1">
            <Link href={`/host/listings/${v.id}/edit`}>{isHe ? 'עריכה' : 'Edit'}</Link>
          </Button>
          {v.status === 'DRAFT' ? (
            <RequestApprovalButton venueId={v.id} locale={locale} icon={<Send className="h-4 w-4" />} />
          ) : (
            <DeleteVenueButton venueId={v.id} locale={locale} />
          )}
        </div>
      </div>
    </div>
  )
}
