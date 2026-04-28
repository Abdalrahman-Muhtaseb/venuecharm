import { signOut } from '@/actions/auth'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  defaultLocale,
  formatCurrencyILS,
  getDictionary,
  isLocale,
  localeCookieName,
  type Locale,
} from '@/lib/i18n'

export default async function DashboardPage() {
  const persistedLocale = cookies().get(localeCookieName)?.value
  const locale: Locale = isLocale(persistedLocale) ? persistedLocale : defaultLocale
  const t = getDictionary(locale)
  const supabase = createClient()
  const { data } = await supabase.auth.getUser()
  const user = data.user

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('email, role, first_name, last_name')
    .eq('id', user.id)
    .single()

  const isHost = profile?.role === 'HOST'

  const { data: venues } = isHost
    ? await supabase
        .from('venues')
        .select('id, title, city, address, status, capacity, price_per_hour, price_per_day, photos, created_at')
        .order('created_at', { ascending: false })
    : { data: [] as Array<{
        id: string
        title: string
        city: string
        address: string
        status: 'DRAFT' | 'PENDING_APPROVAL' | 'ACTIVE' | 'SUSPENDED'
        capacity: number
        price_per_hour: number | null
        price_per_day: number | null
        photos: string[] | null
        created_at: string
      }> }

  const hostVenues = venues ?? []

  const formatPrice = (value: number | null) => {
    if (value === null || value === undefined) return 'N/A'
    return formatCurrencyILS(Number(value), locale)
  }

  const statusStyles: Record<string, string> = {
    ACTIVE: 'bg-emerald-100 text-emerald-800',
    PENDING_APPROVAL: 'bg-amber-100 text-amber-800',
    DRAFT: 'bg-slate-100 text-slate-700',
    SUSPENDED: 'bg-rose-100 text-rose-800',
  }

  return (
    <main className="min-h-screen px-6 py-10 text-slate-900">
      <section className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm md:p-10">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-violet-600">Dashboard</p>
        <h1 className="mt-3 text-3xl font-bold">{t.dashboard.welcome}</h1>
        <p className="mt-3 text-slate-600">
          {t.dashboard.signedInAs}
          {profile?.email ?? user.email}.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Role</p>
            <p className="mt-2 text-lg font-semibold">{profile?.role ?? t.auth.renter}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="text-sm text-slate-500">{t.dashboard.status}</p>
            <p className="mt-2 text-lg font-semibold">{t.dashboard.authenticated}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="text-sm text-slate-500">{t.dashboard.nextStep}</p>
            <p className="mt-2 text-lg font-semibold">{t.dashboard.nextStepValue}</p>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <Link
            href="/profile"
            className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-800 transition hover:bg-slate-50"
          >
            {t.common.myProfile}
          </Link>
          <Link
            href="/venues/new"
            className="inline-flex rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white transition hover:bg-violet-700"
          >
            {t.dashboard.createVenue}
          </Link>
        </div>

        {isHost ? (
          <section className="mt-10">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-2xl font-bold text-slate-900">{t.dashboard.yourVenues}</h2>
              <p className="text-sm text-slate-500">
                {hostVenues.length} {hostVenues.length === 1 ? t.dashboard.listingSingular : t.dashboard.listingCount}
              </p>
            </div>

            {hostVenues.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-slate-600">
                {t.dashboard.noVenues}
              </div>
            ) : (
              <div className="grid gap-4">
                {hostVenues.map((venue) => (
                  <Link key={venue.id} href={`/venues/${venue.id}`}>
                    <article className="rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md hover:border-violet-300">
                      {/* Photo Section */}
                      {venue.photos && venue.photos.length > 0 ? (
                        <div className="relative h-32 w-full overflow-hidden rounded-t-2xl bg-slate-200">
                          <Image
                            src={venue.photos[0]}
                            alt={venue.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-32 w-full rounded-t-2xl bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                          <p className="text-sm text-slate-500">{t.dashboard.noPhoto}</p>
                        </div>
                      )}

                      {/* Info Section */}
                      <div className="p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-slate-900">{venue.title}</h3>
                            <p className="mt-1 text-sm text-slate-600">
                              {venue.address}, {venue.city}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[venue.status] ?? 'bg-slate-100 text-slate-700'}`}
                          >
                            {venue.status.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="mt-4 grid gap-3 text-sm text-slate-700 md:grid-cols-3">
                          <p>{t.dashboard.capacity}: {venue.capacity}</p>
                          <p>{t.dashboard.perHour}: {formatPrice(venue.price_per_hour)}</p>
                          <p>{t.dashboard.perDay}: {formatPrice(venue.price_per_day)}</p>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            )}
          </section>
        ) : null}

        <form action={signOut} className="mt-8">
          <button
            type="submit"
            className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-800 transition hover:bg-slate-50"
          >
            {t.common.signOut}
          </button>
        </form>
      </section>
    </main>
  )
}
