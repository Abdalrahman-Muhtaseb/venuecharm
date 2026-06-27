'use client'

import { updateVenue } from '@/actions/venues'
import { VenueMapPicker } from '@/components/venue/venue-map-picker'
import { PhotoUpload } from '@/components/venue/photo-upload'
import { CancellationPolicyPicker } from '@/components/venue/CancellationPolicyPicker'
import { AmenitiesPicker } from '@/components/venue/AmenitiesPicker'
import { EventTypesPicker } from '@/components/venue/EventTypesPicker'
import { ReservationModePicker } from '@/components/venue/ReservationModePicker'
import type { CancellationPolicy } from '@/types/venue'
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
    amenities: string[]
    event_types?: string[]
    cancellation_policy?: CancellationPolicy
    rules?: string | null
    opening_time?: string | null
    closing_time?: string | null
    buffer_minutes?: number | null
  }
}

export function VenueEditForm({ hasPublicGoogleMapsKey, locale, venue }: VenueEditFormProps) {
  const [existingPhotos, setExistingPhotos] = useState<string[]>(venue.photos ?? [])
  const [newPhotoUrls, setNewPhotoUrls] = useState<string[]>([])
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(venue.amenities ?? [])
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>(venue.event_types ?? [])
  const t = getDictionary(locale)
  const isHe = locale === 'he'

  const allPhotos = [...existingPhotos, ...newPhotoUrls]
  const removeExisting = (url: string) => setExistingPhotos((prev) => prev.filter((p) => p !== url))

  return (
    <form action={updateVenue} className="mt-6 space-y-8">
      <input type="hidden" name="venueId" value={venue.id} />
      <input type="hidden" name="photos" value={allPhotos.join(',')} />
      <input type="hidden" name="amenities" value={selectedAmenities.join(',')} />
      <input type="hidden" name="eventTypes" value={selectedEventTypes.join(',')} />

      {/* Basic info */}
      <section className="space-y-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="title">{t.venueForm.title}</Label>
          <Input id="title" name="title" required defaultValue={venue.title} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="description">{t.venueForm.description}</Label>
          <Textarea id="description" name="description" rows={4} defaultValue={venue.description ?? ''} />
        </div>
      </section>

      {/* Location */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold">{isHe ? 'מיקום' : 'Location'}</h2>
        {hasPublicGoogleMapsKey ? (
          <>
            <p className="text-sm text-muted-foreground">
              {isHe
                ? 'לחץ על המפה כדי לעדכן את מיקום המקום — הכתובת והעיר יתעדכנו אוטומטית.'
                : 'Click the map to update the venue location — address and city will update automatically.'}
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
            <Input id="address" name="address" required defaultValue={venue.address} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="city">{t.venueForm.city}</Label>
            <Input id="city" name="city" required defaultValue={venue.city} />
          </div>
        </div>
      </section>

      {/* Details */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold">{isHe ? 'פרטים' : 'Details'}</h2>
        <div className="flex flex-col gap-2 sm:max-w-xs">
          <Label htmlFor="capacity">{t.venueForm.capacity}</Label>
          <Input id="capacity" name="capacity" type="number" min={1} required defaultValue={venue.capacity} />
        </div>
      </section>

      {/* Reservation system */}
      <ReservationModePicker
        locale={locale}
        defaultPricePerHour={venue.price_per_hour}
        defaultPricePerDay={venue.price_per_day}
        defaultOpening={venue.opening_time}
        defaultClosing={venue.closing_time}
        defaultBuffer={venue.buffer_minutes}
      />

      {/* Venue type */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">{t.venueForm.venueType}</h2>
        <p className="text-sm text-muted-foreground">{t.venueForm.venueTypeHint}</p>
        <EventTypesPicker locale={locale} selected={selectedEventTypes} onChange={setSelectedEventTypes} />
      </section>

      {/* Amenities */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">{isHe ? 'שירותים ומתקנים' : 'Amenities'}</h2>
        <p className="text-sm text-muted-foreground">
          {isHe ? 'בחר את השירותים הזמינים במקום.' : 'Select the amenities available at this venue.'}
        </p>
        <AmenitiesPicker locale={locale} selected={selectedAmenities} onChange={setSelectedAmenities} />
      </section>

      {/* Cancellation policy */}
      <div>
        <CancellationPolicyPicker locale={locale} defaultValue={venue.cancellation_policy ?? 'MODERATE'} />
      </div>

      {/* House rules */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">{t.venueForm.rules}</h2>
        <p className="text-sm text-muted-foreground">{t.venueForm.rulesHint}</p>
        <Textarea name="rules" rows={4} placeholder={t.venueForm.rulesPlaceholder} defaultValue={venue.rules ?? ''} />
      </section>

      {/* Existing photos */}
      {existingPhotos.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold">{isHe ? 'תמונות קיימות' : 'Current photos'}</h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
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
                  className="absolute end-1 top-1 rounded-full bg-destructive p-0.5 text-destructive-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Upload new photos */}
      <div>
        <PhotoUpload
          onPhotosChange={setNewPhotoUrls}
          locale={locale}
          maxFiles={Math.max(1, 10 - existingPhotos.length)}
        />
      </div>

      <Button type="submit" className="w-full">
        {isHe ? 'שמור שינויים' : 'Save changes'}
      </Button>
    </form>
  )
}
