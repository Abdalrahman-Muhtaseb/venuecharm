'use client'

import { createVenue } from '@/actions/venues'
import { VenueMapPicker } from '@/components/venue/venue-map-picker'
import { PhotoUpload } from '@/components/venue/photo-upload'
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

export function VenueCreationForm({ hasPublicGoogleMapsKey, locale }: VenueFormProps) {
  const [photoUrls, setPhotoUrls] = useState<string[]>([])
  const t = getDictionary(locale)

  return (
    <form action={createVenue} className="mt-6 grid gap-5 md:grid-cols-2">
      <div className="flex flex-col gap-2 md:col-span-2">
        <Label htmlFor="title">{t.venueForm.title}</Label>
        <Input id="title" name="title" required />
      </div>

      <div className="flex flex-col gap-2 md:col-span-2">
        <Label htmlFor="description">{t.venueForm.description}</Label>
        <Textarea id="description" name="description" rows={4} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="address">{t.venueForm.address}</Label>
        <Input id="address" name="address" required />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="city">{t.venueForm.city}</Label>
        <Input id="city" name="city" required />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="capacity">{t.venueForm.capacity}</Label>
        <Input id="capacity" name="capacity" type="number" min={1} required />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="pricePerHour">{t.venueForm.pricePerHour}</Label>
        <Input id="pricePerHour" name="pricePerHour" type="number" min={0} step="0.01" />
      </div>

      <div className="flex flex-col gap-2 md:col-span-2">
        <Label htmlFor="pricePerDay">{t.venueForm.pricePerDay}</Label>
        <Input id="pricePerDay" name="pricePerDay" type="number" min={0} step="0.01" />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="latitude">{t.venueForm.latitude}</Label>
        <Input
          id="latitude"
          name="latitude"
          type="number"
          step="any"
          min={-90}
          max={90}
          placeholder={t.venueForm.latitudePlaceholder}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="longitude">{t.venueForm.longitude}</Label>
        <Input
          id="longitude"
          name="longitude"
          type="number"
          step="any"
          min={-180}
          max={180}
          placeholder={t.venueForm.longitudePlaceholder}
        />
      </div>

      <p className="md:col-span-2 text-sm text-muted-foreground rounded-lg border bg-muted/40 px-4 py-3">
        {t.venueForm.coordinateHint}
      </p>

      {hasPublicGoogleMapsKey ? (
        <div className="md:col-span-2">
          <VenueMapPicker
            addressInputId="address"
            cityInputId="city"
            latitudeInputName="latitude"
            longitudeInputName="longitude"
            locale={locale}
          />
        </div>
      ) : (
        <p className="md:col-span-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {t.venueForm.noMapsNotice}
        </p>
      )}

      <div className="md:col-span-2">
        <PhotoUpload onPhotosChange={setPhotoUrls} locale={locale} />
      </div>

      <input type="hidden" name="photos" value={photoUrls.join(',')} />

      <div className="md:col-span-2">
        <Button type="submit" className="w-full">
          {t.venueForm.createListing}
        </Button>
      </div>
    </form>
  )
}
