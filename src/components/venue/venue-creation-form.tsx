'use client'

import { createVenue } from '@/actions/venues'
import { VenueMapPicker } from '@/components/venue/venue-map-picker'
import { PhotoUpload } from '@/components/venue/photo-upload'
import { CancellationPolicyPicker } from '@/components/venue/CancellationPolicyPicker'
import { AmenitiesPicker } from '@/components/venue/AmenitiesPicker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { getDictionary, type Locale } from '@/lib/i18n'
import { useState } from 'react'

type VenueFormProps = {
  hasPublicGoogleMapsKey: boolean
  locale: Locale
}

const DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAYS_HE = ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ש'"]

function WeekdayPicker({
  isHe,
  selected,
  onChange,
}: {
  isHe: boolean
  selected: number[]
  onChange: (days: number[]) => void
}) {
  const days = isHe ? DAYS_HE : DAYS_EN
  const toggle = (d: number) =>
    onChange(selected.includes(d) ? selected.filter((x) => x !== d) : [...selected, d])
  return (
    <div className="flex flex-wrap gap-2">
      {days.map((label, i) => (
        <button
          key={i}
          type="button"
          onClick={() => toggle(i)}
          className={`min-w-[3.25rem] rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
            selected.includes(i)
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-background text-muted-foreground hover:border-primary/60'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export function VenueCreationForm({ hasPublicGoogleMapsKey, locale }: VenueFormProps) {
  const [photoUrls, setPhotoUrls] = useState<string[]>([])
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6])
  const t = getDictionary(locale)
  const isHe = locale === 'he'

  return (
    <form action={createVenue} className="mt-6 space-y-8">
      {/* Basic info */}
      <section className="space-y-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="title">{t.venueForm.title}</Label>
          <Input id="title" name="title" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="description">{t.venueForm.description}</Label>
          <Textarea id="description" name="description" rows={4} />
        </div>
      </section>

      {/* Location */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold">{isHe ? 'מיקום' : 'Location'}</h2>
        {hasPublicGoogleMapsKey ? (
          <>
            <p className="text-sm text-muted-foreground">
              {isHe
                ? 'לחץ על המפה כדי לקבוע את מיקום המקום — הכתובת והעיר ימולאו אוטומטית.'
                : 'Click the map to pin the venue location — address and city will fill in automatically.'}
            </p>
            <VenueMapPicker
              addressInputId="address"
              cityInputId="city"
              latitudeInputName="latitude"
              longitudeInputName="longitude"
              locale={locale}
            />
          </>
        ) : (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {isHe
              ? 'Google Maps לא מוגדר — הכתובת תיאתר אוטומטית לפי שם העיר.'
              : 'Google Maps is not configured — address will be geocoded from city name automatically.'}
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="address">{t.venueForm.address}</Label>
            <Input id="address" name="address" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="city">{t.venueForm.city}</Label>
            <Input id="city" name="city" required />
          </div>
        </div>
      </section>

      {/* Details & pricing */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold">{isHe ? 'פרטים ומחירים' : 'Details & Pricing'}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="capacity">{t.venueForm.capacity}</Label>
            <Input id="capacity" name="capacity" type="number" min={1} required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="pricePerHour">{t.venueForm.pricePerHour}</Label>
            <Input id="pricePerHour" name="pricePerHour" type="number" min={0} step="0.01" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="pricePerDay">{t.venueForm.pricePerDay}</Label>
            <Input id="pricePerDay" name="pricePerDay" type="number" min={0} step="0.01" />
          </div>
        </div>
      </section>

      {/* Amenities */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">{isHe ? 'שירותים ומתקנים' : 'Amenities'}</h2>
        <p className="text-sm text-muted-foreground">
          {isHe ? 'בחר את השירותים הזמינים במקום.' : 'Select the amenities available at this venue.'}
        </p>
        <AmenitiesPicker locale={locale} selected={selectedAmenities} onChange={setSelectedAmenities} />
        <input type="hidden" name="amenities" value={selectedAmenities.join(',')} />
      </section>

      {/* Default availability */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">{isHe ? 'זמינות ברירת מחדל' : 'Default Availability'}</h2>
        <p className="text-sm text-muted-foreground">
          {isHe
            ? 'בחר את ימי השבוע שבהם המקום זמין. ה-90 הימים הקרובים יסומנו אוטומטית.'
            : 'Select which weekdays the venue is available. The next 90 days will be pre-filled.'}
        </p>
        <WeekdayPicker isHe={isHe} selected={selectedDays} onChange={setSelectedDays} />
        <input type="hidden" name="defaultDays" value={selectedDays.join(',')} />
      </section>

      {/* Cancellation policy */}
      <div>
        <CancellationPolicyPicker locale={locale} />
      </div>

      {/* Photos */}
      <div>
        <PhotoUpload onPhotosChange={setPhotoUrls} locale={locale} />
      </div>
      <input type="hidden" name="photos" value={photoUrls.join(',')} />

      <Button type="submit" className="w-full">
        {t.venueForm.createListing}
      </Button>
    </form>
  )
}
