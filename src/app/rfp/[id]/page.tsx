import Link from 'next/link'
import Image from 'next/image'
import { notFound, redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { ArrowLeft, Users, Wallet, CalendarDays, MapPin, Check, X, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { DeleteRfpButton } from '@/components/rfp/DeleteRfpButton'
import { estimatedCost, matchedAmenities } from '@/lib/rfp-matching'
import type { EventType } from '@/types/rfp'
import {
  defaultLocale,
  formatCurrencyILS,
  formatDateLocalized,
  getDictionary,
  isLocale,
  localeCookieName,
  translate,
  type Locale,
} from '@/lib/i18n'

type VenueShape = {
  id: string
  title: string
  city: string
  capacity: number
  price_per_hour: number | null
  price_per_day: number | null
  amenities: string[] | null
  photos: string[] | null
}

function getVenue(v: VenueShape | VenueShape[] | null): VenueShape | null {
  if (!v) return null
  return Array.isArray(v) ? v[0] ?? null : v
}

function scoreColor(score: number): string {
  if (score >= 75) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
  if (score >= 50) return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
  return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
}

export default async function RfpResultsPage({ params }: { params: { id: string } }) {
  const locale: Locale = isLocale(cookies().get(localeCookieName)?.value)
    ? (cookies().get(localeCookieName)!.value as Locale)
    : defaultLocale
  const t = getDictionary(locale).rfp
  const isHe = locale === 'he'

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // RLS restricts SELECT to the owner — a non-owner / missing id returns null.
  const { data: rfp } = await supabase
    .from('rfps')
    .select('id, event_type, event_date, capacity, budget, description, amenities, created_at')
    .eq('id', params.id)
    .single()

  if (!rfp) notFound()

  const wanted: string[] = Array.isArray(rfp.amenities) ? (rfp.amenities as string[]) : []
  const budget = Number(rfp.budget)
  const eventLabel = t.eventTypeOptions[rfp.event_type as EventType] ?? t.eventTypeOptions.OTHER

  const { data: matchRows } = await supabase
    .from('rfp_matches')
    .select('score, venues(id, title, city, capacity, price_per_hour, price_per_day, amenities, photos)')
    .eq('rfp_id', rfp.id)
    .order('score', { ascending: false })

  let amenityLabels = new Map<string, string>()
  if (wanted.length) {
    const { data: cat } = await supabase
      .from('amenities')
      .select('key, label_en, label_he')
      .in('key', wanted)
    amenityLabels = new Map((cat ?? []).map((a) => [a.key, isHe ? a.label_he : a.label_en]))
  }

  const matches = (matchRows ?? [])
    .map((m) => ({
      score: m.score as number,
      venue: getVenue(m.venues as unknown as VenueShape | VenueShape[] | null),
    }))
    .filter((m): m is { score: number; venue: VenueShape } => m.venue !== null)

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <Link
          href="/rfp"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {t.backToList}
        </Link>
        <DeleteRfpButton rfpId={rfp.id} locale={locale} />
      </div>

      {/* Request summary */}
      <section className="rounded-xl border bg-muted/20 p-5">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold md:text-3xl">{eventLabel}</h1>
          <span className="text-xs text-muted-foreground">
            {t.createdOn} {formatDateLocalized(rfp.created_at, locale)}
          </span>
        </div>
        <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
          {t.requestSummary}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-primary" />
            {rfp.capacity} {t.guests}
          </span>
          <span className="flex items-center gap-1.5">
            <Wallet className="h-4 w-4 text-primary" />
            {formatCurrencyILS(budget, locale)}
          </span>
          {rfp.event_date && (
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-primary" />
              {formatDateLocalized(rfp.event_date, locale)}
            </span>
          )}
        </div>
        {wanted.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {wanted.map((k) => (
              <Badge key={k} variant="outline">
                {amenityLabels.get(k) ?? k}
              </Badge>
            ))}
          </div>
        )}
        {rfp.description && (
          <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{rfp.description}</p>
        )}
      </section>

      {/* Matches */}
      <div className="mt-8 mb-4 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">{t.matchesTitle}</h2>
        <Badge variant="secondary">{translate(t.matchCount, { count: matches.length })}</Badge>
      </div>

      {matches.length === 0 ? (
        <p className="rounded-xl border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          {t.noMatches}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {matches.map(({ score, venue }) => {
            const fits = venue.capacity >= rfp.capacity
            const cost = estimatedCost(venue)
            const within = cost != null && cost <= budget
            const matched = matchedAmenities(wanted, venue.amenities)
            const dayPrice = venue.price_per_day != null ? Number(venue.price_per_day) : null
            const hourPrice = venue.price_per_hour != null ? Number(venue.price_per_hour) : null

            return (
              <li key={venue.id}>
                <Link
                  href={`/venues/${venue.id}`}
                  target="_blank"
                  className="flex gap-4 rounded-xl border bg-background p-4 transition hover:bg-muted/30"
                >
                  {venue.photos?.[0] ? (
                    <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-md bg-muted">
                      <Image src={venue.photos[0]} alt={venue.title} fill className="object-cover" sizes="128px" />
                    </div>
                  ) : (
                    <div className="h-24 w-32 shrink-0 rounded-md bg-muted" />
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-lg font-semibold">{venue.title}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          {venue.city} · {venue.capacity} {t.guests}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-sm font-bold ${scoreColor(score)}`}>
                        {score}% {t.match}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                      <span className={`flex items-center gap-1 ${fits ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {fits ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                        {fits ? t.fits : t.tooSmall}
                      </span>
                      {cost != null && (
                        <span className={`flex items-center gap-1 ${within ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {within ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                          {within ? t.withinBudget : t.overBudget}
                        </span>
                      )}
                      {wanted.length > 0 && (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          {translate(t.amenitiesMatched, { matched, total: wanted.length })}
                        </span>
                      )}
                      {(dayPrice ?? hourPrice) != null && (
                        <span className="ms-auto font-medium text-foreground">
                          {dayPrice != null
                            ? `${formatCurrencyILS(dayPrice, locale)} / ${isHe ? 'יום' : 'day'}`
                            : `${formatCurrencyILS(hourPrice as number, locale)} / ${isHe ? 'שעה' : 'hr'}`}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
