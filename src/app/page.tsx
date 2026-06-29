import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { MapPin, Shield, Zap, CheckCircle, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { VenueGrid } from '@/components/venue/VenueGrid'
import { PublicNavbar } from '@/components/layout/PublicNavbar'
import { Footer } from '@/components/layout/Footer'
import { BrandBackground } from '@/components/layout/BrandBackground'
import { SearchBarAutocomplete } from '@/components/search/SearchBarAutocomplete'
import { HeroCollage } from '@/components/home/HeroCollage'
import { ViewMoreButton } from '@/components/home/ViewMoreButton'
import { HostCtaButton } from '@/components/home/HostCtaButton'
import { defaultLocale, getDictionary, isLocale, localeCookieName, type Locale } from '@/lib/i18n'
import { buildRatingsMap } from '@/lib/ratings'
import { approxCount } from '@/lib/utils'
import { getFavoriteVenueIds } from '@/actions/favorites'

const FALLBACK_HERO_PHOTOS = [
  'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=900&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?q=80&w=900&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=900&auto=format&fit=crop',
]

export default async function HomePage() {
  const locale: Locale = isLocale(cookies().get(localeCookieName)?.value)
    ? (cookies().get(localeCookieName)!.value as Locale)
    : defaultLocale
  const t = getDictionary(locale)

  const supabase = createClient()

  const { data: venues } = await supabase
    .from('venues')
    .select('id, title, city, address, capacity, price_per_hour, price_per_day, photos')
    .eq('status', 'ACTIVE')
    .limit(8)

  const { count: venueCount } = await supabase
    .from('venues')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'ACTIVE')

  // Overall completed bookings across all users. Must use the admin client —
  // the regular client is RLS-scoped to the viewer's own bookings, so it would
  // count per-user (or zero when logged out) instead of the platform total.
  const { count: bookingCount } = await createAdminClient()
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'COMPLETED')

  const venueList = venues ?? []
  const venueIds = venueList.map((v) => v.id)
  const { data: ratingRows } = venueIds.length > 0
    ? await supabase.from('reviews').select('venue_id, rating').in('venue_id', venueIds)
    : { data: [] }
  const ratingsMap = buildRatingsMap(ratingRows ?? [])
  const favoritedIds = new Set(await getFavoriteVenueIds())

  const activeVenues = venueList.map((v) => ({
    ...v,
    status: 'ACTIVE',
    avg_rating: ratingsMap.get(v.id)?.avg_rating ?? null,
    review_count: ratingsMap.get(v.id)?.review_count ?? null,
  }))

  const valueProps = [
    { icon: CheckCircle, title: t.home.highlights[0], desc: t.home.highlightDescs[0] },
    { icon: Shield,      title: t.home.highlights[1], desc: t.home.highlightDescs[1] },
    { icon: Zap,         title: t.home.highlights[2], desc: t.home.highlightDescs[2] },
    { icon: MapPin,      title: t.home.highlights[3], desc: t.home.highlightDescs[3] },
    { icon: Sparkles,    title: t.home.highlights[4], desc: t.home.highlightDescs[4] },
  ]

  const steps = [
    { num: '01', title: t.home.step1Title, desc: t.home.step1Desc },
    { num: '02', title: t.home.step2Title, desc: t.home.step2Desc },
    { num: '03', title: t.home.step3Title, desc: t.home.step3Desc },
  ]

  const stats = [
    { value: approxCount(venueCount ?? 0), label: t.home.statsVenuesLabel },
    { value: approxCount(bookingCount ?? 0), label: t.home.statsBookingsLabel },
  ]

  const heroPhotos = activeVenues
    .map((v) => v.photos?.[0])
    .filter((p): p is string => Boolean(p))
  const heroPool = [...new Set([...heroPhotos, ...FALLBACK_HERO_PHOTOS])].slice(0, 6)

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        {locale === 'he' ? 'דלג לתוכן הראשי' : 'Skip to main content'}
      </a>

      <PublicNavbar locale={locale} />

      <main id="main-content" className="flex-1">
        {/* ── Hero ──────────────────────────────────────────────────────── */}
        {/* No `overflow-hidden` here: it would clip the search bar's dropdown
            panels. BrandBackground self-clips its own blobs. */}
        <section className="relative px-6 pb-20 pt-12 lg:pt-16">
          <BrandBackground />

          <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-16">

            {/* ── Left: copy + search ── */}
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                {t.home.badge}
              </span>

              <h1 className="mt-6 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl xl:text-6xl">
                {t.home.title}
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
                {t.home.description}
              </p>

              <div className="mt-8 max-w-2xl">
                <Suspense
                  fallback={<div className="h-14 animate-pulse rounded-full bg-muted md:h-16" />}
                >
                  <SearchBarAutocomplete locale={locale} />
                </Suspense>
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-10">
                {stats.map(({ value, label }) => (
                  <div key={label}>
                    <p className="text-3xl font-bold tabular-nums">{value.toLocaleString()}+</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Right: rotating photo collage ── */}
            <HeroCollage photos={heroPool} />

          </div>
        </section>

        {/* ── Featured Venues ───────────────────────────────────────────── */}
        {activeVenues.length > 0 && (
          <section className="bg-muted/20 px-6 py-16">
            <div className="mx-auto max-w-7xl">
              <div className="mb-8 flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-widest text-primary">
                    {t.home.featuredTitle}
                  </p>
                  <h2 className="mt-2 text-3xl font-bold">{t.home.featuredSubtitle}</h2>
                </div>
                <ViewMoreButton locale={locale} label={t.home.viewAll} />
              </div>
              <VenueGrid venues={activeVenues} locale={locale} favoritedIds={favoritedIds} />
            </div>
          </section>
        )}

        {/* ── Value Props ───────────────────────────────────────────────── */}
        <section className="border-y bg-muted/30 px-6 py-10">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {valueProps.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="flex flex-col gap-3 rounded-xl bg-background p-5 shadow-sm"
              >
                <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                <p className="font-semibold">{title}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── How It Works ──────────────────────────────────────────────── */}
        <section className="px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <div className="mb-12 text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-primary">
                {t.home.howItWorksTitle}
              </p>
              <h2 className="mt-2 text-3xl font-bold">{t.home.howItWorksSubtitle}</h2>
            </div>

            <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
              {steps.map(({ num, title, desc }) => (
                <div key={num} className="flex flex-col gap-4">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-xl font-bold text-primary"
                    aria-hidden="true"
                  >
                    {num}
                  </div>
                  <h3 className="text-xl font-bold">{title}</h3>
                  <p className="leading-relaxed text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Host CTA ──────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-primary px-6 py-20 text-center text-primary-foreground">
          <div
            className="pointer-events-none absolute -start-20 -top-20 h-64 w-64 rounded-full bg-white/5 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-10 -end-10 h-48 w-48 rounded-full bg-white/5 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold sm:text-4xl">{t.home.ctaTitle}</h2>
            <p className="mt-4 text-lg text-primary-foreground/80">{t.home.ctaBody}</p>
            <HostCtaButton label={t.home.ctaCta} />
          </div>
        </section>
      </main>

      <Footer locale={locale} />
    </div>
  )
}
