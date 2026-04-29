import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrencyILS, type Locale } from '@/lib/i18n'

export interface VenueCardProps {
  id: string
  title: string
  city: string
  address?: string
  capacity: number
  price_per_hour: number | null
  price_per_day: number | null
  photos: string[] | null
  status?: string
  showStatus?: boolean
  locale: Locale
  highlighted?: boolean
}

const statusStyles: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-800',
  PENDING_APPROVAL: 'bg-amber-100 text-amber-800',
  DRAFT: 'bg-slate-100 text-slate-700',
  SUSPENDED: 'bg-rose-100 text-rose-800',
}

export function VenueCard({
  id,
  title,
  city,
  capacity,
  price_per_hour,
  price_per_day,
  photos,
  status,
  showStatus = false,
  locale,
  highlighted = false,
}: VenueCardProps) {
  const formatPrice = (v: number | null) =>
    v == null ? null : formatCurrencyILS(Number(v), locale)

  return (
    <Link href={`/venues/${id}`}>
      <Card
        className={`group h-full overflow-hidden transition hover:shadow-md ${
          highlighted ? 'ring-2 ring-primary' : ''
        }`}
      >
        {/* Photo */}
        {photos && photos.length > 0 ? (
          <div className="relative h-44 w-full overflow-hidden bg-muted">
            <Image
              src={photos[0]}
              alt={title}
              fill
              className="object-cover transition group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />
          </div>
        ) : (
          <div className="flex h-44 w-full items-center justify-center bg-muted">
            <span className="text-sm text-muted-foreground">
              {locale === 'he' ? 'אין תמונה' : 'No photo'}
            </span>
          </div>
        )}

        <CardContent className="p-4">
          {showStatus && status && (
            <span
              className={`mb-2 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${statusStyles[status] ?? 'bg-muted text-muted-foreground'}`}
            >
              {status.replace('_', ' ')}
            </span>
          )}

          <h3 className="line-clamp-2 font-semibold leading-snug">{title}</h3>

          <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span>{city}</span>
          </div>

          <div className="mt-3 flex items-center justify-between border-t pt-3">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              <span>{capacity}</span>
            </div>
            <div className="text-end">
              {formatPrice(price_per_hour) && (
                <p className="text-sm font-semibold text-primary">
                  {formatPrice(price_per_hour)}
                  <span className="text-xs font-normal text-muted-foreground">
                    {locale === 'he' ? '/שעה' : '/hr'}
                  </span>
                </p>
              )}
              {formatPrice(price_per_day) && (
                <p className="text-xs text-muted-foreground">
                  {formatPrice(price_per_day)}
                  <span>{locale === 'he' ? '/יום' : '/day'}</span>
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
