import Link from 'next/link'
import Image from 'next/image'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { defaultLocale, getDictionary, isLocale, localeCookieName, formatCurrencyILS, type Locale } from '@/lib/i18n'

export default async function HomePage() {
  const persistedLocale = cookies().get(localeCookieName)?.value
  const locale: Locale = isLocale(persistedLocale) ? persistedLocale : defaultLocale
  const t = getDictionary(locale)

  // Fetch active venues
  const supabase = createClient()
  const { data: venues } = await supabase
    .from('venues')
    .select('id, title, city, address, capacity, price_per_hour, price_per_day, photos')
    .eq('status', 'ACTIVE')
    .limit(12)

  const activeVenues = venues ?? []

  const formatPrice = (value: number | null) => {
    if (value === null || value === undefined) return 'N/A'
    return formatCurrencyILS(Number(value), locale)
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white px-6 py-10 text-slate-900">
      <section className="mx-auto flex max-w-6xl flex-col gap-10 rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm backdrop-blur md:p-12">
        <div className="max-w-3xl space-y-6">
          <span className="inline-flex rounded-full bg-violet-100 px-4 py-1 text-sm font-medium text-violet-700">
            {t.home.badge}
          </span>
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
            {t.home.title}
          </h1>
          <p className="text-lg leading-8 text-slate-600 md:text-xl">
            {t.home.description}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/register"
            className="rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white transition hover:bg-violet-700"
          >
            {t.home.createAccount}
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-800 transition hover:bg-slate-50"
          >
            {t.home.signIn}
          </Link>
          <Link
            href="/dashboard"
            className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-800 transition hover:bg-slate-50"
          >
            {t.home.dashboard}
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {t.home.highlights.map((item) => (
            <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm font-medium text-slate-700">
              {item}
            </div>
          ))}
        </div>

        <div className="rounded-2xl bg-violet-600 p-6 text-white">
          <p className="text-sm uppercase tracking-[0.3em] text-violet-100">{t.home.nextStepTitle}</p>
          <p className="mt-3 text-lg">
            {t.home.nextStepBody}
          </p>
        </div>
      </section>

      {/* Venues Section */}
      {activeVenues.length > 0 && (
        <section className="mx-auto mt-16 max-w-6xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.25em] text-violet-600">Featured Venues</p>
              <h2 className="mt-2 text-3xl font-bold md:text-4xl">Discover Amazing Venues</h2>
            </div>
            <Link
              href="/dashboard"
              className="rounded-xl border border-violet-300 px-5 py-3 font-semibold text-violet-600 transition hover:bg-violet-50"
            >
              Explore More
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {activeVenues.map((venue) => (
              <Link key={venue.id} href={`/venues/${venue.id}`}>
                <article className="group h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-lg hover:border-violet-300">
                  {/* Photo Section */}
                  {venue.photos && venue.photos.length > 0 ? (
                    <div className="relative h-40 w-full overflow-hidden bg-slate-200">
                      <Image
                        src={venue.photos[0]}
                        alt={venue.title}
                        fill
                        className="object-cover transition group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="h-40 w-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                      <p className="text-sm text-slate-500">No photo</p>
                    </div>
                  )}

                  {/* Info Section */}
                  <div className="p-5">
                    <h3 className="text-base font-semibold text-slate-900 line-clamp-2">{venue.title}</h3>
                    <p className="mt-2 text-sm text-slate-600">
                      📍 {venue.city}
                    </p>

                    <div className="mt-4 space-y-2 border-t border-slate-200 pt-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Capacity</span>
                        <span className="font-semibold text-slate-900">{venue.capacity} guests</span>
                      </div>
                      {venue.price_per_hour && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Per Hour</span>
                          <span className="font-semibold text-violet-600">{formatPrice(venue.price_per_hour)}</span>
                        </div>
                      )}
                      {venue.price_per_day && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Per Day</span>
                          <span className="font-semibold text-violet-600">{formatPrice(venue.price_per_day)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
