'use client'

import { updateVenue } from '@/actions/venues'
import { VenueMapPicker } from '@/components/venue/venue-map-picker'
import { PhotoUpload } from '@/components/venue/photo-upload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { getDictionary, type Locale } from '@/lib/i18n'
import { useState } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'

interface VenueEditFormProps {
  hasPublicGoogleMapsKey: boolean
  locale: Locale
  venue: {
    id: string
    title: string
    description: string | null
    address: string
    city: string
    capacity: number
    price_per_hour: number | null
    price_per_day: number | null
    photos: string[]
  }
}

export function VenueEditForm({ hasPublicGoogleMapsKey, locale, venue }: VenueEditFormProps) {
  const [existingPhotos, setExistingPhotos] = useState<string[]>(venue.photos ?? [])
  const [newPhotoUrls, setNewPhotoUrls] = useState<string[]>([])
  const t = getDictionary(locale)

  const allPhotos = [...existingPhotos, ...newPhotoUrls]

  const removeExisting = (url: string) =>
    setExistingPhotos((prev) => prev.filter((p) => p !== url))

  return (
    <form action={updateVenue} className="mt-6 grid gap-5 md:grid-cols-2">
      {/* Hidden venue id */}
      <input type="hidden" name="venueId" value={venue.id} />
      <input type="hidden" name="photos" value={allPhotos.join(',')} />

      <div className="flex flex-col gap-2 md:col-span-2">
        <Label htmlFor="title">{t.venueForm.title}</Label>
        <Input id="title" name="title" required defaultValue={venue.title} />
      </div>

      <div className="flex flex-col gap-2 md:col-span-2">
        <Label htmlFor="description">{t.venueForm.description}</Label>
        <Textarea id="description" name="description" rows={4} defaultValue={venue.description ?? ''} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="address">{t.venueForm.address}</Label>
        <Input id="address" name="address" required defaultValue={venue.address} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="city">{t.venueForm.city}</Label>
        <Input id="city" name="city" required defaultValue={venue.city} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="capacity">{t.venueForm.capacity}</Label>
        <Input id="capacity" name="capacity" type="number" min={1} required defaultValue={venue.capacity} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="pricePerHour">{t.venueForm.pricePerHour}</Label>
        <Input
          id="pricePerHour"
          name="pricePerHour"
          type="number"
          min={0}
          step="0.01"
          defaultValue={venue.price_per_hour ?? ''}
        />
      </div>

      <div className="flex flex-col gap-2 md:col-span-2">
        <Label htmlFor="pricePerDay">{t.venueForm.pricePerDay}</Label>
        <Input
          id="pricePerDay"
          name="pricePerDay"
          type="number"
          min={0}
          step="0.01"
          defaultValue={venue.price_per_day ?? ''}
        />
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

      <p className="md:col-span-2 rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        {t.venueForm.coordinateHint}
      </p>

      {hasPublicGoogleMapsKey && (
        <div className="md:col-span-2">
          <VenueMapPicker
            addressInputId="address"
            cityInputId="city"
            latitudeInputName="latitude"
            longitudeInputName="longitude"
            locale={locale}
          />
        </div>
      )}

      {/* Existing photos */}
      {existingPhotos.length > 0 && (
        <div className="md:col-span-2 flex flex-col gap-2">
          <Label>{locale === 'he' ? 'תמונות קיימות' : 'Current photos'}</Label>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {existingPhotos.map((url) => (
              <div key={url} className="relative">
                <Image
                  src={url}
                  alt="Venue photo"
                  width={120}
                  height={80}
                  className="h-20 w-full rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeExisting(url)}
                  className="absolute right-1 top-1 rounded-full bg-destructive p-0.5 text-destructive-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload new photos */}
      <div className="md:col-span-2">
        <PhotoUpload
          onPhotosChange={setNewPhotoUrls}
          locale={locale}
          maxFiles={Math.max(1, 10 - existingPhotos.length)}
        />
      </div>

      <div className="md:col-span-2">
        <Button type="submit" className="w-full">
          {locale === 'he' ? 'שמור שינויים' : 'Save changes'}
        </Button>
      </div>
    </form>
  )
}
