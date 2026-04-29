import { cookies } from 'next/headers'
import { VenueCreationForm } from '@/components/venue/venue-creation-form'
import { defaultLocale, getDictionary, isLocale, localeCookieName, type Locale } from '@/lib/i18n'

export default function NewListingPage() {
  const locale: Locale = isLocale(cookies().get(localeCookieName)?.value)
    ? (cookies().get(localeCookieName)!.value as Locale)
    : defaultLocale
  const t = getDictionary(locale)
  const hasPublicGoogleMapsKey = Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <p className="text-sm font-medium uppercase tracking-widest text-primary">
          {locale === 'he' ? 'נכסים' : 'Listings'}
        </p>
        <h1 className="mt-1 text-3xl font-bold">{t.dashboard.createVenue}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.venueForm.coordinateHint}</p>
      </div>

      <VenueCreationForm hasPublicGoogleMapsKey={hasPublicGoogleMapsKey} locale={locale} />
    </div>
  )
}
