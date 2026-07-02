import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import {
  ArrowLeft, MapPin, Users, Star, CalendarDays, Clock,
  Timer, ExternalLink, Mail, Phone, CreditCard, Banknote,
  BookOpen, ShieldAlert, CheckCircle2, XCircle, CalendarCheck2,
  ChevronRight, Building2,
} from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { VenuePhotoGallery } from '@/components/venue/VenuePhotoGallery'
import { AdminActionButtons } from '@/components/admin/AdminActionButtons'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { amenityIcon, amenityLabel, DEFAULT_AMENITIES, AMENITY_CATEGORIES, type Amenity } from '@/lib/amenities'
import {
  defaultLocale,
  formatCurrencyILS,
  formatDateLocalized,
  isLocale,
  localeCookieName,
  type Locale,
} from '@/lib/i18n'
import { cn } from '@/lib/utils'

// ── Types ────────────────────────────────────────────────────────────────────

type HostProfile = {
  first_name: string | null
  last_name: string | null
  email: string
  avatar_url: string | null
  phone_number: string | null
  stripe_charges_enabled: boolean | null
  stripe_payouts_enabled: boolean | null
  stripe_details_submitted: boolean | null
}

type VenueRow = {
  id: string
  title: string
  description: string | null
  address: string
  city: string
  capacity: number
  price_per_hour: number | null
  price_per_day: number | null
  photos: string[] | null
  amenities: unknown
  status: string
  created_at: string
  event_types: unknown
  rules: string | null
  cancellation_policy: string | null
  opening_time: string | null
  closing_time: string | null
  buffer_minutes: number | null
  default_available_days: number[] | null
  google_calendar_id: string | null
  users: HostProfile | HostProfile[] | null
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getHost(u: VenueRow['users']): HostProfile | null {
  if (!u) return null
  return Array.isArray(u) ? (u[0] ?? null) : u
}

function hostName(h: HostProfile | null): string {
  if (!h) return '—'
  return [h.first_name, h.last_name].filter(Boolean).join(' ').trim() || h.email
}

function fmtTime(t: string | null): string {
  if (!t) return '—'
  return t.slice(0, 5) // HH:MM from HH:MM:SS
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  ACTIVE:           { label: 'Active',    className: 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' },
  PENDING_APPROVAL: { label: 'Pending',   className: 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-400' },
  DRAFT:            { label: 'Draft',     className: 'border-slate-300 bg-slate-50 text-slate-600 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-400' },
  SUSPENDED:        { label: 'Suspended', className: 'border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-950/40 dark:text-red-400' },
}

const CANCELLATION_CONFIG: Record<string, { color: string; label: string; desc: string }> = {
  FLEXIBLE: {
    color: 'text-emerald-700 dark:text-emerald-400',
    label: 'Flexible',
    desc: 'Full refund if cancelled 24+ hours before the event. No refund within 24 hours.',
  },
  MODERATE: {
    color: 'text-amber-700 dark:text-amber-400',
    label: 'Moderate',
    desc: 'Full refund if cancelled 7+ days before. 50% refund if cancelled 24+ hours before. No refund within 24 hours.',
  },
  STRICT: {
    color: 'text-red-700 dark:text-red-400',
    label: 'Strict',
    desc: '50% refund if cancelled 7+ days before. No refund within 7 days of the event.',
  },
}

const DAY_LABELS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAY_LABELS_HE = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']

// ── Sub-components ───────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
      {children}
    </h3>
  )
}

function SidebarRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-end">{value}</span>
    </div>
  )
}

function SidebarCard({
  title,
  icon,
  children,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border bg-background">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-sm font-semibold">{title}</span>
      </div>
      <div className="space-y-3 px-4 py-4">{children}</div>
    </div>
  )
}

// ── Page ────────────────────────────────────────────────────────────────────

export default async function AdminVenueDetail({ params }: { params: { id: string } }) {
  const locale: Locale = isLocale(cookies().get(localeCookieName)?.value)
    ? (cookies().get(localeCookieName)!.value as Locale)
    : defaultLocale
  const isHe = locale === 'he'

  const db = createAdminClient()

  const [
    { data: venueRaw, error },
    { count: totalBookings },
    { count: completedBookings },
    { data: revenueRows },
    { data: reviewRows },
    { data: catalogRows },
  ] = await Promise.all([
    db
      .from('venues')
      .select(
        `id, title, description, address, city, capacity,
         price_per_hour, price_per_day, photos, amenities, status, created_at,
         event_types, rules, cancellation_policy,
         opening_time, closing_time, buffer_minutes, default_available_days,
         google_calendar_id,
         users:host_id(first_name, last_name, email, avatar_url, phone_number,
                       stripe_charges_enabled, stripe_payouts_enabled, stripe_details_submitted)`,
      )
      .eq('id', params.id)
      .single(),
    db.from('bookings').select('*', { count: 'exact', head: true }).eq('venue_id', params.id),
    db
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('venue_id', params.id)
      .eq('status', 'COMPLETED'),
    db
      .from('bookings')
      .select('total_price')
      .eq('venue_id', params.id)
      .in('status', ['CONFIRMED', 'COMPLETED']),
    db.from('reviews').select('rating').eq('venue_id', params.id),
    db.from('amenities').select('*').order('sort_order'),
  ])

  if (error || !venueRaw) notFound()

  const venue = venueRaw as unknown as VenueRow
  const host  = getHost(venue.users)

  const reviews       = (reviewRows ?? []) as { rating: number }[]
  const avgRating     = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null
  const totalRevenue  = (revenueRows ?? []).reduce((s: number, r: { total_price: number }) => s + Number(r.total_price), 0)

  const catalog: Amenity[] = (catalogRows ?? []).length > 0 ? (catalogRows as Amenity[]) : DEFAULT_AMENITIES
  const catalogMap  = new Map(catalog.map((a) => [a.key, a]))

  const amenityKeys  = Array.isArray(venue.amenities) ? (venue.amenities as string[]) : []
  const eventTypes   = Array.isArray(venue.event_types) ? (venue.event_types as string[]) : []
  const openDays     = Array.isArray(venue.default_available_days) ? (venue.default_available_days as number[]) : [0,1,2,3,4,5,6]

  // Group amenities by category
  const byCategory = new Map<string, string[]>()
  for (const key of amenityKeys) {
    const cat = catalogMap.get(key)?.category ?? 'Other'
    if (!byCategory.has(cat)) byCategory.set(cat, [])
    byCategory.get(cat)!.push(key)
  }
  const categoryOrder = AMENITY_CATEGORIES.filter((c) => byCategory.has(c))
  if (byCategory.has('Other') && !categoryOrder.includes('Other')) categoryOrder.push('Other' as never)

  const statusCfg = STATUS_CONFIG[venue.status] ?? { label: venue.status, className: '' }
  const cancelCfg = venue.cancellation_policy ? CANCELLATION_CONFIG[venue.cancellation_policy] : null

  const dayLabels = isHe ? DAY_LABELS_HE : DAY_LABELS_EN

  const stripeStatus = (() => {
    if (!host) return null
    if (host.stripe_charges_enabled) return { label: isHe ? 'מאפשר תשלומים' : 'Payments enabled', color: 'text-emerald-600 dark:text-emerald-400' }
    if (host.stripe_details_submitted) return { label: isHe ? 'בבדיקה' : 'Pending verification', color: 'text-amber-600 dark:text-amber-400' }
    return { label: isHe ? 'לא מחובר' : 'Not connected', color: 'text-red-600 dark:text-red-400' }
  })()

  return (
    <div className="space-y-6 pb-12">

      {/* ── Breadcrumb ──────────────────────────────────────────────────────── */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/admin/venues" className="flex items-center gap-1 hover:text-foreground transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          {isHe ? 'נכסים' : 'Venues'}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate text-foreground font-medium">{venue.title}</span>
      </nav>

      {/* ── Photo gallery ───────────────────────────────────────────────────── */}
      <VenuePhotoGallery photos={venue.photos ?? []} title={venue.title} locale={locale} />

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold md:text-3xl">{venue.title}</h1>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {venue.address}, {venue.city}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 shrink-0" />
                {venue.capacity} {isHe ? 'משתתפים' : 'guests'}
              </span>
              {avgRating !== null && (
                <span className="flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />
                  {avgRating.toFixed(1)}
                  <span className="text-muted-foreground/70">({reviews.length})</span>
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                {isHe ? 'נוצר' : 'Listed'} {formatDateLocalized(venue.created_at, locale)}
              </span>
            </div>
          </div>

          {/* Status badge + public link */}
          <div className="flex shrink-0 items-center gap-2">
            {venue.status === 'ACTIVE' && (
              <Link
                href={`/venues/${venue.id}`}
                target="_blank"
                className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {isHe ? 'צפייה ציבורית' : 'View public'}
              </Link>
            )}
            <Badge
              variant="outline"
              className={cn('px-3 py-1 text-xs font-semibold', statusCfg.className)}
            >
              {statusCfg.label}
            </Badge>
          </div>
        </div>

        {/* Event type chips */}
        {eventTypes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {eventTypes.map((t) => (
              <Badge key={t} variant="secondary" className="rounded-full px-3 py-1 text-xs font-normal">
                {t}
              </Badge>
            ))}
          </div>
        )}

        {/* Admin action bar */}
        <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50/60 px-5 py-3.5 dark:border-amber-800/40 dark:bg-amber-950/20">
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                {isHe ? 'סקירת מנהל' : 'Admin review'}
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                {isHe
                  ? 'בדוק את כל הפרטים לפני אישור או השעיה'
                  : 'Review all details before approving or suspending this venue'}
              </p>
            </div>
          </div>
          <AdminActionButtons venueId={venue.id} status={venue.status} locale={locale} />
        </div>
      </div>

      {/* ── Main grid ───────────────────────────────────────────────────────── */}
      <div className="grid gap-8 lg:grid-cols-3">

        {/* Left column */}
        <div className="space-y-8 lg:col-span-2">

          {/* Description */}
          <section className="space-y-3">
            <SectionHeading>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              {isHe ? 'תיאור' : 'Description'}
            </SectionHeading>
            {venue.description ? (
              <p className="whitespace-pre-line leading-relaxed text-muted-foreground">
                {venue.description}
              </p>
            ) : (
              <p className="italic text-muted-foreground/60">{isHe ? 'אין תיאור' : 'No description provided'}</p>
            )}
          </section>

          <Separator />

          {/* Amenities */}
          {amenityKeys.length > 0 && (
            <>
              <section className="space-y-4">
                <SectionHeading>
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  {isHe ? 'מתקנים' : 'Amenities'}
                  <span className="ms-1 rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
                    {amenityKeys.length}
                  </span>
                </SectionHeading>

                <div className="space-y-5">
                  {categoryOrder.map((cat) => {
                    const keys = byCategory.get(cat) ?? []
                    return (
                      <div key={cat}>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                          {cat}
                        </p>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {keys.map((key) => {
                            const a = catalogMap.get(key)
                            const Icon = amenityIcon(a?.icon)
                            const label = a ? amenityLabel(a, isHe) : key
                            return (
                              <div
                                key={key}
                                className="flex items-center gap-2.5 rounded-lg border bg-muted/30 px-3 py-2.5 text-sm"
                              >
                                <Icon className="h-4 w-4 shrink-0 text-primary" />
                                <span className="truncate">{label}</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>

              <Separator />
            </>
          )}

          {/* Venue rules */}
          {venue.rules && (
            <>
              <section className="space-y-3">
                <SectionHeading>
                  <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                  {isHe ? 'כללי המקום' : 'Venue rules'}
                </SectionHeading>
                <p className="whitespace-pre-line leading-relaxed text-muted-foreground">
                  {venue.rules}
                </p>
              </section>

              <Separator />
            </>
          )}

          {/* Operating hours */}
          <section className="space-y-4">
            <SectionHeading>
              <Clock className="h-4 w-4 text-muted-foreground" />
              {isHe ? 'שעות פעילות' : 'Operating hours'}
            </SectionHeading>

            <div className="space-y-4 rounded-xl border bg-muted/20 p-4">
              {/* Time range */}
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-muted-foreground">{isHe ? 'שעות' : 'Hours'}</span>
                <span className="font-semibold tabular-nums">
                  {fmtTime(venue.opening_time)} – {fmtTime(venue.closing_time)}
                </span>
              </div>

              {/* Buffer */}
              {(venue.buffer_minutes ?? 0) > 0 && (
                <div className="flex items-center gap-3 text-sm">
                  <Timer className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-muted-foreground">{isHe ? 'זמן מאגר' : 'Turnaround buffer'}</span>
                  <span className="font-semibold">
                    {venue.buffer_minutes} {isHe ? 'דקות' : 'min'}
                  </span>
                </div>
              )}

              {/* Days of week */}
              <div className="flex items-center gap-3 text-sm">
                <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-muted-foreground">{isHe ? 'ימים' : 'Days'}</span>
                <div className="flex gap-1.5">
                  {[0,1,2,3,4,5,6].map((d) => {
                    const isOpen = openDays.includes(d)
                    return (
                      <span
                        key={d}
                        className={cn(
                          'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold',
                          isOpen
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground/50',
                        )}
                      >
                        {dayLabels[d]}
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* Cancellation policy */}
          <section className="space-y-3">
            <SectionHeading>
              <XCircle className="h-4 w-4 text-muted-foreground" />
              {isHe ? 'מדיניות ביטול' : 'Cancellation policy'}
            </SectionHeading>

            {cancelCfg ? (
              <div className="flex items-start gap-3 rounded-xl border bg-muted/20 p-4">
                <ShieldAlert className={cn('mt-0.5 h-5 w-5 shrink-0', cancelCfg.color)} />
                <div>
                  <p className={cn('font-semibold', cancelCfg.color)}>{cancelCfg.label}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{cancelCfg.desc}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm italic text-muted-foreground/60">{isHe ? 'לא הוגדרה' : 'Not set'}</p>
            )}
          </section>
        </div>

        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">

          {/* Pricing */}
          <SidebarCard
            title={isHe ? 'תמחור' : 'Pricing'}
            icon={<Banknote className="h-4 w-4" />}
          >
            <SidebarRow
              label={isHe ? 'לשעה' : 'Per hour'}
              value={
                venue.price_per_hour
                  ? formatCurrencyILS(Number(venue.price_per_hour), locale)
                  : <span className="text-muted-foreground font-normal">—</span>
              }
            />
            <SidebarRow
              label={isHe ? 'ליום' : 'Per day'}
              value={
                venue.price_per_day
                  ? formatCurrencyILS(Number(venue.price_per_day), locale)
                  : <span className="text-muted-foreground font-normal">—</span>
              }
            />
          </SidebarCard>

          {/* Host */}
          <SidebarCard
            title={isHe ? 'מארח' : 'Host'}
            icon={<Building2 className="h-4 w-4" />}
          >
            {host ? (
              <div className="space-y-3">
                {/* Avatar + name */}
                <div className="flex items-center gap-3">
                  {host.avatar_url ? (
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={host.avatar_url}
                        alt={hostName(host)}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {(host.first_name?.[0] ?? host.email[0]).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{hostName(host)}</p>
                  </div>
                </div>

                <Separator />

                {/* Contact */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{host.email}</span>
                  </div>
                  {host.phone_number && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      <span>{host.phone_number}</span>
                    </div>
                  )}
                </div>

                {stripeStatus && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <CreditCard className="h-3.5 w-3.5" />
                        {isHe ? 'Stripe' : 'Stripe'}
                      </span>
                      <span className={cn('font-medium', stripeStatus.color)}>
                        {stripeStatus.label}
                      </span>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">—</p>
            )}
          </SidebarCard>

          {/* Activity */}
          <SidebarCard
            title={isHe ? 'פעילות' : 'Activity'}
            icon={<CalendarCheck2 className="h-4 w-4" />}
          >
            <SidebarRow
              label={isHe ? 'סה״כ הזמנות' : 'Total bookings'}
              value={totalBookings ?? 0}
            />
            <SidebarRow
              label={isHe ? 'הזמנות שהושלמו' : 'Completed'}
              value={completedBookings ?? 0}
            />
            <SidebarRow
              label={isHe ? 'הכנסות' : 'Revenue'}
              value={
                totalRevenue > 0
                  ? <span className="text-primary">{formatCurrencyILS(totalRevenue, locale)}</span>
                  : <span className="text-muted-foreground font-normal">—</span>
              }
            />
            <SidebarRow
              label={isHe ? 'ביקורות' : 'Reviews'}
              value={reviews.length}
            />
            {avgRating !== null && (
              <SidebarRow
                label={isHe ? 'דירוג ממוצע' : 'Avg rating'}
                value={
                  <span className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {avgRating.toFixed(1)}
                  </span>
                }
              />
            )}
          </SidebarCard>

          {/* Metadata */}
          <SidebarCard
            title={isHe ? 'מידע כללי' : 'Listing info'}
            icon={<CalendarDays className="h-4 w-4" />}
          >
            <SidebarRow
              label={isHe ? 'נוצר' : 'Created'}
              value={formatDateLocalized(venue.created_at, locale)}
            />
            <SidebarRow
              label={isHe ? 'מדיניות ביטול' : 'Cancellation'}
              value={
                cancelCfg
                  ? <span className={cancelCfg.color}>{cancelCfg.label}</span>
                  : <span className="text-muted-foreground font-normal">—</span>
              }
            />
            <SidebarRow
              label={isHe ? 'קיבולת' : 'Capacity'}
              value={`${venue.capacity} ${isHe ? 'אנשים' : 'people'}`}
            />
            <SidebarRow
              label={isHe ? 'יומן Google' : 'Google Calendar'}
              value={
                venue.google_calendar_id ? (
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {isHe ? 'מחובר' : 'Connected'}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <XCircle className="h-3.5 w-3.5" />
                    {isHe ? 'לא מחובר' : 'Not connected'}
                  </span>
                )
              }
            />
          </SidebarCard>
        </div>
      </div>
    </div>
  )
}
