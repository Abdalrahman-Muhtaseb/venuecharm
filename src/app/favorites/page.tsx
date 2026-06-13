import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { Heart } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { VenueGrid } from '@/components/venue/VenueGrid'
import { buildRatingsMap } from '@/lib/ratings'
import { defaultLocale, isLocale, localeCookieName, type Locale } from '@/lib/i18n'

type VenueRel = {
  id: string
  title: string
  city: string
  address: string | null
  capacity: number
  price_per_hour: number | null
  price_per_day: number | null
  photos: string[] | null
  status: string
}

export default async function FavoritesPage() {
  const locale: Locale = isLocale(cookies().get(localeCookieName)?.value)
    ? (cookies().get(localeCookieName)!.value as Locale)
    : defaultLocale
  const isHe = locale === 'he'

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('favorites')
    .select('venue_id, created_at, venues(id, title, city, address, capacity, price_per_hour, price_per_day, photos, status)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const venues = ((data ?? []) as { venues: VenueRel | VenueRel[] | null }[])
    .map((row) => (Array.isArray(row.venues) ? row.venues[0] : row.venues))
    .filter((v): v is VenueRel => v != null && v.status === 'ACTIVE')

  const venueIds = venues.map((v) => v.id)
  const { data: ratingRows } = venueIds.length > 0
    ? await supabase.from('reviews').select('venue_id, rating').in('venue_id', venueIds)
    : { data: [] }
  const ratingsMap = buildRatingsMap(ratingRows ?? [])

  const venueList = venues.map((v) => ({
    id: v.id,
    title: v.title,
    city: v.city,
    address: v.address ?? undefined,
    capacity: v.capacity,
    price_per_hour: v.price_per_hour,
    price_per_day: v.price_per_day,
    photos: v.photos,
    avg_rating: ratingsMap.get(v.id)?.avg_rating ?? null,
    review_count: ratingsMap.get(v.id)?.review_count ?? null,
  }))

  const favoritedIds = new Set(venueIds)

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <Heart className="h-6 w-6 fill-rose-500 text-rose-500" aria-hidden="true" />
        <h1 className="text-2xl font-bold">{isHe ? 'המועדפים שלי' : 'My favourites'}</h1>
      </div>

      {venueList.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Heart className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
          </div>
          <div>
            <p className="text-base font-semibold">
              {isHe ? 'עדיין לא שמרת מקומות' : 'No saved venues yet'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {isHe
                ? 'לחץ על הלב בכל מקום כדי לשמור אותו לכאן'
                : 'Tap the heart on any venue to save it here'}
            </p>
          </div>
          <Link
            href="/venues"
            className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            {isHe ? 'עיון במקומות' : 'Browse venues'}
          </Link>
        </div>
      ) : (
        <VenueGrid venues={venueList} locale={locale} favoritedIds={favoritedIds} />
      )}
    </div>
  )
}
