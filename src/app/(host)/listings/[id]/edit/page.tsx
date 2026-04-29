import { notFound, redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { VenueEditForm } from '@/components/venue/venue-edit-form'
import { defaultLocale, isLocale, localeCookieName, type Locale } from '@/lib/i18n'

export default async function EditListingPage({ params }: { params: { id: string } }) {
  const locale: Locale = isLocale(cookies().get(localeCookieName)?.value)
    ? (cookies().get(localeCookieName)!.value as Locale)
    : defaultLocale

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: venue } = await supabase
    .from('venues')
    .select('id, title, description, address, city, capacity, price_per_hour, price_per_day, photos, host_id')
    .eq('id', params.id)
    .single()

  if (!venue || venue.host_id !== user.id) notFound()

  const hasPublicGoogleMapsKey = Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/listings"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {locale === 'he' ? 'חזרה לנכסים' : 'Back to listings'}
        </Link>
      </div>

      <div className="mb-2">
        <p className="text-sm font-medium uppercase tracking-widest text-primary">
          {locale === 'he' ? 'עריכת נכס' : 'Edit listing'}
        </p>
        <h1 className="mt-1 text-3xl font-bold">{venue.title}</h1>
      </div>

      <VenueEditForm
        hasPublicGoogleMapsKey={hasPublicGoogleMapsKey}
        locale={locale}
        venue={{
          ...venue,
          photos: venue.photos ?? [],
        }}
      />
    </div>
  )
}
