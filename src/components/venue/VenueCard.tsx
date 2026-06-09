import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Users, Star } from 'lucide-react'
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
  avg_rating?: number | null
  review_count?: number | null
}

const statusStyles: Record<string, string> = {
  ACTIVE: 'bg-emerald-500/90 text-white',
  PENDING_APPROVAL: 'bg-amber-500/90 text-white',
  DRAFT: 'bg-slate-500/90 text-white',
  SUSPENDED: 'bg-rose-500/90 text-white',
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
  avg_rating,
  review_count,
}: VenueCardProps) {
  const fmtHour = price_per_hour != null ? formatCurrencyILS(Number(price_per_hour), locale) : null
  const fmtDay  = price_per_day  != null ? formatCurrencyILS(Number(price_per_day),  locale) : null

  return (
    <Link
      href={`/venues/${id}`}
      id={`venue-card-${id}`}
      className={`group flex flex-col overflow-hidden rounded-2xl border bg-background transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
        highlighted ? 'ring-2 ring-primary shadow-md' : 'hover:border-primary/30'
      }`}
    >
      {/* Photo */}
      <div className="relative h-48 w-full overflow-hidden bg-muted">
        {photos && photos.length > 0 ? (
          <Image
            src={photos[0]}
            alt={title}
            fill
            className="object-cover transition duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <span className="text-sm text-muted-foreground">
              {locale === 'he' ? 'אין תמונה' : 'No photo'}
            </span>
          </div>
        )}

        {/* Price badge overlay */}
        {fmtHour && (
          <div className="absolute bottom-2 end-2 rounded-lg bg-background/95 px-2 py-1 shadow-sm backdrop-blur-sm">
            <span className="text-sm font-bold text-primary">{fmtHour}</span>
            <span className="text-xs text-muted-foreground">{locale === 'he' ? '/שעה' : '/hr'}</span>
          </div>
        )}

        {/* Status badge */}
        {showStatus && status && status !== 'ACTIVE' && (
          <div className={`absolute start-2 top-2 rounded-md px-2 py-0.5 text-xs font-semibold ${statusStyles[status] ?? 'bg-muted/90 text-foreground'}`}>
            {status.replace('_', ' ')}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="line-clamp-2 font-semibold leading-snug tracking-tight">{title}</h3>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{city}</span>
          </div>
          {avg_rating != null && (
            <div className="flex shrink-0 items-center gap-0.5 text-sm">
              <Star className="h-3.5 w-3.5 fill-amber-400 stroke-amber-400" />
              <span className="font-medium">{avg_rating.toFixed(1)}</span>
              {review_count != null && (
                <span className="text-xs text-muted-foreground">({review_count})</span>
              )}
            </div>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between pt-3">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="h-3.5 w-3.5 shrink-0" />
            <span>
              {locale === 'he' ? `עד ${capacity}` : `Up to ${capacity}`}
            </span>
          </div>

          {!fmtHour && fmtDay && (
            <div className="text-end">
              <span className="text-sm font-semibold text-primary">{fmtDay}</span>
              <span className="text-xs text-muted-foreground">{locale === 'he' ? '/יום' : '/day'}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
