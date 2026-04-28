'use client'

import { createVenue } from '@/actions/venues'
import { VenueMapPicker } from '@/components/venue/venue-map-picker'
import { PhotoUpload } from '@/components/venue/photo-upload'
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
    <form action={createVenue} className="mt-8 grid gap-4 md:grid-cols-2">
      <div className="space-y-2 md:col-span-2">
        <label htmlFor="title" className="text-sm font-medium text-slate-700">
          {t.venueForm.title}
        </label>
        <input
          id="title"
          name="title"
          required
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-violet-500"
        />
      </div>

      <div className="space-y-2 md:col-span-2">
        <label htmlFor="description" className="text-sm font-medium text-slate-700">
          {t.venueForm.description}
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-violet-500"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="address" className="text-sm font-medium text-slate-700">
          {t.venueForm.address}
        </label>
        <input
          id="address"
          name="address"
          required
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-violet-500"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="city" className="text-sm font-medium text-slate-700">
          {t.venueForm.city}
        </label>
        <input
          id="city"
          name="city"
          required
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-violet-500"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="capacity" className="text-sm font-medium text-slate-700">
          {t.venueForm.capacity}
        </label>
        <input
          id="capacity"
          name="capacity"
          type="number"
          min={1}
          required
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-violet-500"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="pricePerHour" className="text-sm font-medium text-slate-700">
          {t.venueForm.pricePerHour}
        </label>
        <input
          id="pricePerHour"
          name="pricePerHour"
          type="number"
          min={0}
          step="0.01"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-violet-500"
        />
      </div>

      <div className="space-y-2 md:col-span-2">
        <label htmlFor="pricePerDay" className="text-sm font-medium text-slate-700">
          {t.venueForm.pricePerDay}
        </label>
        <input
          id="pricePerDay"
          name="pricePerDay"
          type="number"
          min={0}
          step="0.01"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-violet-500"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="latitude" className="text-sm font-medium text-slate-700">
          {t.venueForm.latitude}
        </label>
        <input
          id="latitude"
          name="latitude"
          type="number"
          step="any"
          min={-90}
          max={90}
          placeholder={t.venueForm.latitudePlaceholder}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-violet-500"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="longitude" className="text-sm font-medium text-slate-700">
          {t.venueForm.longitude}
        </label>
        <input
          id="longitude"
          name="longitude"
          type="number"
          step="any"
          min={-180}
          max={180}
          placeholder={t.venueForm.longitudePlaceholder}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-violet-500"
        />
      </div>

      <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        {t.venueForm.coordinateHint}
      </div>

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
        <div className="md:col-span-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {t.venueForm.noMapsNotice}
        </div>
      )}

      <div className="md:col-span-2">
        <PhotoUpload onPhotosChange={setPhotoUrls} locale={locale} />
      </div>

      {/* Hidden input to store photo URLs */}
      <input type="hidden" name="photos" value={photoUrls.join(',')} />

      <div className="md:col-span-2 mt-2">
        <button
          type="submit"
          className="w-full rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white transition hover:bg-violet-700"
        >
          {t.venueForm.createListing}
        </button>
      </div>
    </form>
  )
}
