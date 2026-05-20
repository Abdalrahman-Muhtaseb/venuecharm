import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { ArrowLeft, MapPin, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { VenuePhotoGallery } from '@/components/venue/VenuePhotoGallery'
import { VenueAmenityList } from '@/components/venue/VenueAmenityList'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { AdminActionButtons } from '@/components/admin/AdminActionButtons'
import {
  defaultLocale,
  formatCurrencyILS,
  formatDateLocalized,
  getDictionary,
  isLocale,
  localeCookieName,
  type Locale,
} from '@/lib/i18n'

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  ACTIVE: 'default',
  PENDING_APPROVAL: 'secondary',
  DRAFT: 'outline',
  SUSPENDED: 'destructive',
}

type HostProfile = { first_name: string | null; last_name: string | null; email: string }

function getHostLabel(u: HostProfile | HostProfile[] | null): string {
  if (!u) return '—'
  const p = Array.isArray(u) ? u[0] : u
  if (!p) return '—'
  const name = p.first_name ? `${p.first_name} ${p.last_name ?? ''}`.trim() : null
  return name ? `${name} · ${p.email}` : p.email
}

export default async function AdminVenueDetail({ params }: { params: { id: string } }) {
  const locale: Locale = isLocale(cookies().get(localeCookieName)?.value)
    ? (cookies().get(localeCookieName)!.value as Locale)
    : defaultLocale

  const t = getDictionary(locale).admin
  const isHe = locale === 'he'
  const supabase = createClient()

  const { data: venue, error } = await supabase
    .from('venues')
    .select('id, title, description, address, city, capacity, price_per_hour, price_per_day, photos, amenities, status, created_at, users:host_id(first_name, last_name, email)')
    .eq('id', params.id)
    .single()

  if (error || !venue) notFound()

  const hostInfo = venue.users as unknown as HostProfile | HostProfile[] | null

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <Link href="/admin" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          {t.backToQueue}
        </Link>
        <Badge variant={statusVariant[venue.status] ?? 'outline'}>{venue.status.replace('_', ' ')}</Badge>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold md:text-4xl">{venue.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-4 text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-4 w-4 shrink-0" />
            {venue.address}, {venue.city}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4 shrink-0" />
            {venue.capacity}
          </span>
          <span>{t.host}: {getHostLabel(hostInfo)}</span>
          <span>{t.submitted}: {formatDateLocalized(venue.created_at, locale)}</span>
        </div>
      </div>

      <div className="mb-6">
        <AdminActionButtons venueId={venue.id} status={venue.status} locale={locale} />
      </div>

      <VenuePhotoGallery photos={venue.photos ?? []} title={venue.title} locale={locale} />

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-2">{isHe ? 'תיאור' : 'Description'}</h2>
            <p className="whitespace-pre-line text-muted-foreground">{venue.description || '—'}</p>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-semibold mb-2">{isHe ? 'שירותים' : 'Amenities'}</h2>
            <VenueAmenityList amenities={(venue.amenities as string[]) ?? []} locale={locale} />
          </section>
        </div>

        <aside className="space-y-3 rounded-xl border bg-background p-5">
          <h3 className="text-lg font-semibold">{isHe ? 'תמחור' : 'Pricing'}</h3>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{isHe ? 'לשעה' : 'Per hour'}</span>
            <span className="font-medium">
              {venue.price_per_hour ? formatCurrencyILS(Number(venue.price_per_hour), locale) : '—'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{isHe ? 'ליום' : 'Per day'}</span>
            <span className="font-medium">
              {venue.price_per_day ? formatCurrencyILS(Number(venue.price_per_day), locale) : '—'}
            </span>
          </div>
        </aside>
      </div>
    </div>
  )
}
