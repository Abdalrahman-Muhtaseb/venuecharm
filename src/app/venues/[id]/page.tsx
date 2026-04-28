import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MapPin, Users, Clock, Calendar } from 'lucide-react'
import {
  defaultLocale,
  formatCurrencyILS,
  formatDateLocalized,
  getDictionary,
  isLocale,
  localeCookieName,
  translate,
} from '@/lib/i18n'

type VenueDetailPageProps = {
  params: {
    id: string
  }
}

const statusStyles: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-800',
  PENDING_APPROVAL: 'bg-amber-100 text-amber-800',
  DRAFT: 'bg-slate-100 text-slate-700',
  SUSPENDED: 'bg-rose-100 text-rose-800',
}

export default async function VenueDetailPage({ params }: VenueDetailPageProps) {
  const persistedLocale = cookies().get(localeCookieName)?.value
  const locale = isLocale(persistedLocale) ? persistedLocale : defaultLocale
  const t = getDictionary(locale)
  const supabase = createClient()

  const { data: venue, error } = await supabase
    .from('venues')
    .select(
      'id, title, description, address, city, capacity, price_per_hour, price_per_day, photos, status, created_at, host_id',
    )
    .eq('id', params.id)
    .single()

  if (error || !venue) {
    notFound()
  }

  // Check if current user is the host
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isOwner = user?.id === venue.host_id

  // Only show venue if it's active OR if current user is the host
  if (venue.status !== 'ACTIVE' && !isOwner) {
    notFound()
  }

  const formatPrice = (value: number | null) => {
    if (value === null || value === undefined) return 'N/A'
    return formatCurrencyILS(Number(value), locale)
  }

  const formattedDate = formatDateLocalized(venue.created_at, locale)

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header with back button */}
      <div className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <Link href="/dashboard" className="text-sm font-medium text-violet-600 hover:text-violet-700">
            ← {t.venueDetail.backToDashboard}
          </Link>
        </div>
      </div>

      {/* Photo Gallery */}
      {venue.photos && venue.photos.length > 0 ? (
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Main photo (larger) */}
            <div className="md:col-span-2">
              <div className="relative h-96 w-full overflow-hidden rounded-2xl bg-slate-200">
                <Image
                  src={venue.photos[0]}
                  alt={venue.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>

            {/* Thumbnail grid */}
            <div className="grid grid-cols-2 gap-4">
              {venue.photos.slice(0, 4).map((photo: string, idx: number) => (
                <div key={idx} className="relative h-20 w-full overflow-hidden rounded-lg bg-slate-200 md:h-24">
                  <Image
                    src={photo}
                    alt={`${venue.title} photo ${idx + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
              {venue.photos.length > 4 && (
                <div className="relative h-20 w-full overflow-hidden rounded-lg bg-slate-300 flex items-center justify-center md:h-24">
                  <p className="text-sm font-semibold text-slate-700">
                    {translate(t.venueDetail.morePhotos, { count: venue.photos.length - 4 })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="h-96 w-full rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
            <p className="text-lg text-slate-500">{t.venueDetail.noPhotos}</p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="mx-auto max-w-6xl px-6 py-8 grid gap-8 md:grid-cols-3">
        {/* Main content */}
        <div className="md:col-span-2">
          <section className="rounded-2xl bg-white border border-slate-200 p-8 shadow-sm">
            {/* Title and Status */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-4xl font-bold text-slate-900">{venue.title}</h1>
                <div className="mt-2 flex items-center gap-2 text-slate-600">
                  <MapPin className="h-5 w-5" />
                  <span>
                    {venue.address}, {venue.city}
                  </span>
                </div>
              </div>
              <span
                className={`rounded-full px-4 py-2 text-sm font-semibold ${statusStyles[venue.status] ?? 'bg-slate-100 text-slate-700'}`}
              >
                {venue.status.replace('_', ' ')}
              </span>
            </div>

            {/* Description */}
            {venue.description && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold text-slate-900">{t.venueDetail.about}</h2>
                <p className="mt-4 text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {venue.description}
                </p>
              </div>
            )}

            {/* Key Details */}
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-violet-600" />
                  <div>
                    <p className="text-sm text-slate-600">{t.dashboard.capacity}</p>
                    <p className="text-lg font-semibold text-slate-900">{venue.capacity} guests</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-violet-600" />
                  <div>
                    <p className="text-sm text-slate-600">{t.venueDetail.listed}</p>
                    <p className="text-lg font-semibold text-slate-900">{formattedDate}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-slate-900">{t.venueDetail.pricing}</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {venue.price_per_hour !== null && (
                  <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-violet-50 to-white p-6">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-violet-600" />
                      <div>
                        <p className="text-sm text-slate-600">{t.venueDetail.perHour}</p>
                        <p className="text-2xl font-bold text-violet-600">
                          {formatPrice(venue.price_per_hour)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {venue.price_per_day !== null && (
                  <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-violet-50 to-white p-6">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-violet-600" />
                      <div>
                        <p className="text-sm text-slate-600">{t.venueDetail.perDay}</p>
                        <p className="text-2xl font-bold text-violet-600">
                          {formatPrice(venue.price_per_day)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="md:col-span-1">
          <section className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm sticky top-6">
            <h3 className="text-lg font-semibold text-slate-900">{t.venueDetail.quickInfo}</h3>

            <div className="mt-6 space-y-4">
              <div>
                <p className="text-sm text-slate-600">{t.venueDetail.location}</p>
                <p className="mt-1 font-medium text-slate-900">
                  {venue.city}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-600">{t.venueDetail.guestCapacity}</p>
                <p className="mt-1 font-medium text-slate-900">
                  Up to {venue.capacity} people
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-600">{t.dashboard.status}</p>
                <p className="mt-1 inline-block rounded-full px-3 py-1 text-xs font-semibold bg-emerald-100 text-emerald-800">
                  {venue.status.replace('_', ' ')}
                </p>
              </div>
            </div>

            {isOwner && (
              <div className="mt-8 space-y-3">
                <button
                  className="w-full rounded-xl bg-violet-600 px-4 py-2 font-semibold text-white transition hover:bg-violet-700"
                >
                  {t.venueDetail.editVenue}
                </button>
                <button
                  className="w-full rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-800 transition hover:bg-slate-50"
                >
                  {t.venueDetail.deleteVenue}
                </button>
              </div>
            )}

            {!isOwner && venue.status === 'ACTIVE' && (
              <button className="mt-8 w-full rounded-xl bg-violet-600 px-4 py-3 font-semibold text-white transition hover:bg-violet-700">
                {t.venueDetail.bookNow}
              </button>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
