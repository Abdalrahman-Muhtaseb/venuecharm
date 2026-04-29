import Link from 'next/link'
import { cookies } from 'next/headers'
import { ArrowRight, MapPin, Shield, Zap, Globe } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { VenueGrid } from '@/components/venue/VenueGrid'
import { PublicNavbar } from '@/components/layout/PublicNavbar'
import { Footer } from '@/components/layout/Footer'
import { defaultLocale, getDictionary, isLocale, localeCookieName, type Locale } from '@/lib/i18n'

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

  const activeVenues = (venues ?? []).map((v) => ({ ...v, status: 'ACTIVE' }))

  const highlights = [
    { icon: Globe, label: t.home.highlights[0] },
    { icon: Zap, label: t.home.highlights[1] },
    { icon: Shield, label: t.home.highlights[2] },
    { icon: MapPin, label: t.home.highlights[3] },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <PublicNavbar locale={locale} />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-b from-primary/5 to-background px-6 py-20 text-center">
          <div className="mx-auto max-w-3xl">
            <span className="inline-flex rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
              {t.home.badge}
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-6xl">
              {t.home.title}
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              {t.home.description}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button size="lg" asChild>
                <Link href="/venues">
                  {locale === 'he' ? 'חיפוש מקומות' : 'Find venues'}
                  <ArrowRight className="ms-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/register">{locale === 'he' ? 'פרסם מקום' : 'List your space'}</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Highlights */}
        <section className="border-y bg-muted/30 px-6 py-8">
          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 md:grid-cols-4">
            {highlights.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 text-sm font-medium">
                <Icon className="h-5 w-5 shrink-0 text-primary" />
                {label}
              </div>
            ))}
          </div>
        </section>

        {/* Featured venues */}
        {activeVenues.length > 0 && (
          <section className="mx-auto max-w-7xl px-6 py-16">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-widest text-primary">
                  {locale === 'he' ? 'מקומות מומלצים' : 'Featured venues'}
                </p>
                <h2 className="mt-2 text-3xl font-bold">
                  {locale === 'he' ? 'גלה מקומות מדהימים' : 'Discover amazing spaces'}
                </h2>
              </div>
              <Button variant="outline" asChild>
                <Link href="/venues">
                  {locale === 'he' ? 'צפה בכולם' : 'View all'}
                  <ArrowRight className="ms-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <VenueGrid venues={activeVenues} locale={locale} />
          </section>
        )}

        {/* CTA */}
        <section className="bg-primary px-6 py-16 text-center text-primary-foreground">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold">
              {locale === 'he' ? 'יש לך מקום מיוחד?' : 'Have a unique space?'}
            </h2>
            <p className="mt-4 text-primary-foreground/80">
              {locale === 'he'
                ? 'הפוך כל מרחב לשטח מניב. הפרסום חינמי, אנחנו לוקחים עמלה רק על הזמנות שמתאשרות.'
                : 'Turn any space into a revenue stream. Listing is free — we only earn when you do.'}
            </p>
            <Button size="lg" variant="secondary" className="mt-8" asChild>
              <Link href="/register">
                {locale === 'he' ? 'התחל לפרסם' : 'Start listing'}
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer locale={locale} />
    </div>
  )
}
