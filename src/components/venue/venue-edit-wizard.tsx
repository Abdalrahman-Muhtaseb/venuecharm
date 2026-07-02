'use client'

import { useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Building2, MapPin, Users, CreditCard, Camera, Star,
  ChevronLeft, ChevronRight, Check, Loader2, X, ArrowLeft,
} from 'lucide-react'
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
import { cn } from '@/lib/utils'

// ── Step config ────────────────────────────────────────────────────
const STEPS = [
  {
    id: 'basics',    icon: Building2, gradient: 'from-violet-500 to-primary',
    title: (isHe: boolean) => isHe ? 'הספייס שלך'      : 'Your space',
    sub:   (isHe: boolean) => isHe ? 'שם ותיאור המקום' : 'Name and description',
  },
  {
    id: 'type',      icon: Star,     gradient: 'from-pink-500 to-rose-500',
    title: (isHe: boolean) => isHe ? 'סוג האירועים'                     : 'Event types',
    sub:   (isHe: boolean) => isHe ? 'לאיזה סוג אירועים המקום מתאים?'  : 'What events suit this space?',
  },
  {
    id: 'location',  icon: MapPin,   gradient: 'from-emerald-500 to-teal-500',
    title: (isHe: boolean) => isHe ? 'מיקום'        : 'Location',
    sub:   (isHe: boolean) => isHe ? 'היכן נמצא המקום?' : 'Where is your venue?',
  },
  {
    id: 'capacity',  icon: Users,    gradient: 'from-amber-500 to-orange-500',
    title: (isHe: boolean) => isHe ? 'קיבולת ושירותים'      : 'Capacity & amenities',
    sub:   (isHe: boolean) => isHe ? 'כמה אורחים ומה כלול?' : "How many guests and what's included?",
  },
  {
    id: 'pricing',   icon: CreditCard, gradient: 'from-blue-500 to-indigo-500',
    title: (isHe: boolean) => isHe ? 'תמחור'           : 'Pricing',
    sub:   (isHe: boolean) => isHe ? 'מחירים ושעות פעילות' : 'Prices and operating hours',
  },
  {
    id: 'photos',    icon: Camera,   gradient: 'from-purple-500 to-violet-600',
    title: (isHe: boolean) => isHe ? 'תמונות וכללים'  : 'Photos & rules',
    sub:   (isHe: boolean) => isHe ? 'תמונות וכללי המקום' : 'Photos and venue rules',
  },
]

// ── Weekday picker ────────────────────────────────────────────────
const DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAYS_HE = ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ש'"]

function WeekdayPicker({ isHe, selected, onChange }: {
  isHe: boolean; selected: number[]; onChange: (d: number[]) => void
}) {
  const labels = isHe ? DAYS_HE : DAYS_EN
  const toggle = (d: number) =>
    onChange(selected.includes(d) ? selected.filter((x) => x !== d) : [...selected, d])
  return (
    <div className="flex flex-wrap gap-2">
      {labels.map((label, i) => (
        <button key={i} type="button" onClick={() => toggle(i)}
          className={cn(
            'min-w-[3rem] rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
            selected.includes(i)
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-background text-muted-foreground hover:border-primary/60',
          )}>
          {label}
        </button>
      ))}
    </div>
  )
}

// ── Props ──────────────────────────────────────────────────────────
export interface VenueEditWizardProps {
  hasPublicGoogleMapsKey: boolean
  locale: Locale
  initialLat?: number | null
  initialLng?: number | null
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
    event_types: string[]
    cancellation_policy?: CancellationPolicy
    rules?: string | null
    opening_time?: string | null
    closing_time?: string | null
    buffer_minutes?: number | null
    default_available_days?: number[] | null
  }
}

// ── Wizard ─────────────────────────────────────────────────────────
export function VenueEditWizard({ hasPublicGoogleMapsKey, locale, venue, initialLat, initialLng }: VenueEditWizardProps) {
  const t = getDictionary(locale)
  const isHe = locale === 'he'
  const router = useRouter()

  const [step, setStep] = useState(0)
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState(false)

  // Mutable wizard data — pre-populated from the existing venue
  const [data, setData] = useState({
    title:       venue.title,
    description: venue.description ?? '',
    eventTypes:  venue.event_types ?? [],
    address:     venue.address,
    city:        venue.city,
    latitude:    '',
    longitude:   '',
    capacity:    String(venue.capacity),
    amenities:   venue.amenities ?? [],
    existingPhotos: venue.photos ?? [],
    newPhotos:   [] as string[],
    rules:       venue.rules ?? '',
    defaultDays: venue.default_available_days ?? [0, 1, 2, 3, 4, 5, 6],
  })

  const up = (patch: Partial<typeof data>) => setData((d) => ({ ...d, ...patch }))

  // Refs for the location step (filled by VenueMapPicker via DOM)
  const addressRef = useRef<HTMLInputElement>(null)
  const cityRef    = useRef<HTMLInputElement>(null)

  const formRef = useRef<HTMLDivElement>(null)

  const totalSteps = STEPS.length
  const pct = Math.round(((step + 1) / totalSteps) * 100)
  const cfg = STEPS[step]

  const canAdvance = () => {
    if (step === 0) return data.title.trim().length > 0
    if (step === 2) return data.address.trim() && data.city.trim()
    if (step === 3) return data.capacity.trim() && Number(data.capacity) > 0
    return true
  }

  const next = () => {
    if (step === 2) {
      // Sync location from DOM refs (VenueMapPicker fills them)
      up({
        address:   addressRef.current?.value ?? data.address,
        city:      cityRef.current?.value    ?? data.city,
      })
    }
    if (step < totalSteps - 1) setStep((s) => s + 1)
  }

  const prev = () => { if (step > 0) setStep((s) => s - 1) }

  const submit = () => {
    startTransition(async () => {
      try {
        const fd = new FormData()
        fd.append('venueId', venue.id)
        fd.append('title', data.title)
        fd.append('description', data.description)
        fd.append('address', data.address)
        fd.append('city', data.city)
        if (data.latitude)  fd.append('latitude',  data.latitude)
        if (data.longitude) fd.append('longitude', data.longitude)
        fd.append('capacity', data.capacity || '1')
        fd.append('eventTypes', data.eventTypes.join(','))
        fd.append('amenities',  data.amenities.join(','))
        fd.append('rules', data.rules)
        fd.append('photos', [...data.existingPhotos, ...data.newPhotos].join(','))
        fd.append('defaultDays', data.defaultDays.join(','))
        // Grab ReservationModePicker + CancellationPolicyPicker hidden inputs
        formRef.current?.querySelectorAll<HTMLInputElement | HTMLSelectElement>(
          'input[name]:not([name="photos"]):not([name="amenities"]):not([name="eventTypes"]), select[name]',
        ).forEach((el) => {
          if (el.name && el.value != null) fd.append(el.name, el.value)
        })
        await updateVenue(fd)
        setDone(true)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : (isHe ? 'שגיאה בעדכון הנכס' : 'Failed to update listing'))
      }
    })
  }

  // ── Success screen ──────────────────────────────────────────────
  if (done) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-20 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30">
          <Check className="h-10 w-10" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">{isHe ? 'הנכס עודכן בהצלחה!' : 'Listing updated!'}</h2>
          <p className="mt-2 text-muted-foreground">
            {isHe ? 'השינויים נשמרו.' : 'Your changes have been saved.'}
          </p>
        </div>
        <Button onClick={() => router.push('/host/listings')}>
          {isHe ? 'חזרה לנכסים שלי' : 'Back to my listings'}
        </Button>
      </div>
    )
  }

  // ── Wizard UI ───────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-2xl">
      {/* Back link */}
      <button
        type="button"
        onClick={() => router.push('/host/listings')}
        className="mb-6 flex w-fit items-center gap-1.5 rounded-sm text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        {isHe ? 'חזרה לנכסים' : 'Back to listings'}
      </button>

      {/* Step indicator */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between gap-1">
          {STEPS.map((s, i) => {
            const Icon = s.icon
            const isDone   = i < step
            const isActive = i === step
            return (
              <div key={s.id} className="flex flex-1 flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={() => i < step && setStep(i)}
                  disabled={i > step}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all',
                    isDone   && 'border-primary bg-primary text-white cursor-pointer',
                    isActive && 'border-primary bg-primary/10 text-primary scale-110',
                    !isDone && !isActive && 'border-border text-muted-foreground',
                  )}
                >
                  {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </button>
                <span className={cn(
                  'hidden text-[10px] font-medium sm:block',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                )}>
                  {s.title(isHe)}
                </span>
              </div>
            )
          })}
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-violet-500 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-2 text-right text-xs text-muted-foreground">
          {isHe ? `שלב ${step + 1} מתוך ${totalSteps}` : `Step ${step + 1} of ${totalSteps}`}
        </p>
      </div>

      {/* Step card */}
      <div className="overflow-hidden rounded-2xl border bg-background shadow-sm">
        <div className={`bg-gradient-to-r ${cfg.gradient} p-6`}>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm text-white">
              <cfg.icon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{cfg.title(isHe)}</h2>
              <p className="text-sm text-white/80">{cfg.sub(isHe)}</p>
            </div>
          </div>
        </div>

        <div ref={formRef} className="p-6 sm:p-8">
          {/* Step 1: Basics */}
          {step === 0 && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="e-title" className="font-medium">
                  {isHe ? 'שם המקום' : 'Venue name'} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="e-title"
                  value={data.title}
                  onChange={(e) => up({ title: e.target.value })}
                  className="text-base"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="e-desc" className="font-medium">{t.venueForm.description}</Label>
                <Textarea
                  id="e-desc"
                  value={data.description}
                  onChange={(e) => up({ description: e.target.value })}
                  rows={5}
                  className="resize-none"
                />
              </div>
            </div>
          )}

          {/* Step 2: Event types */}
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">{t.venueForm.venueTypeHint}</p>
              <EventTypesPicker locale={locale} selected={data.eventTypes} onChange={(v) => up({ eventTypes: v })} />
            </div>
          )}

          {/* Step 3: Location */}
          {step === 2 && (
            <div className="flex flex-col gap-5">
              {hasPublicGoogleMapsKey ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    {isHe
                      ? 'לחץ על המפה לעדכון המיקום — הכתובת תמולא אוטומטית.'
                      : 'Click the map to update the pin — address fills in automatically.'}
                  </p>
                  <VenueMapPicker
                    addressInputId="e-address"
                    cityInputId="e-city"
                    latitudeInputName="latitude"
                    longitudeInputName="longitude"
                    locale={locale}
                    initialLatitude={initialLat ?? undefined}
                    initialLongitude={initialLng ?? undefined}
                    onLocationResolved={(address, city, lat, lng) => {
                      up({ address, city, latitude: String(lat), longitude: String(lng) })
                    }}
                  />
                </>
              ) : (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                  {isHe ? 'Google Maps לא מוגדר — ניתן לעדכן כתובת ידנית.' : 'Google Maps not configured — update address manually.'}
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="e-address" className="font-medium">
                    {t.venueForm.address} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="e-address"
                    ref={addressRef}
                    value={data.address}
                    onChange={(e) => up({ address: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="e-city" className="font-medium">
                    {t.venueForm.city} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="e-city"
                    ref={cityRef}
                    value={data.city}
                    onChange={(e) => up({ city: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Capacity & amenities */}
          {step === 3 && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2 sm:max-w-[180px]">
                <Label htmlFor="e-capacity" className="font-medium">
                  {t.venueForm.capacity} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="e-capacity"
                  type="number"
                  min={1}
                  value={data.capacity}
                  onChange={(e) => up({ capacity: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-3">
                <p className="font-medium">{isHe ? 'שירותים ומתקנים' : 'Amenities'}</p>
                <AmenitiesPicker locale={locale} selected={data.amenities} onChange={(v) => up({ amenities: v })} />
              </div>
            </div>
          )}

          {/* Step 5: Pricing, schedule & open days */}
          {step === 4 && (
            <div className="flex flex-col gap-6">
              <ReservationModePicker
                locale={locale}
                defaultPricePerHour={venue.price_per_hour}
                defaultPricePerDay={venue.price_per_day}
                defaultOpening={venue.opening_time}
                defaultClosing={venue.closing_time}
                defaultBuffer={venue.buffer_minutes}
              />
              <div className="flex flex-col gap-3">
                <div>
                  <p className="font-medium">{isHe ? 'ימי פתיחה קבועים' : 'Regular open days'}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {isHe
                      ? 'הימים שבהם המקום זמין בדרך כלל — מחוץ להם הלוח יסומן כחסום אוטומטית.'
                      : 'Days the venue is normally open — other days are auto-blocked on the availability calendar.'}
                  </p>
                </div>
                <WeekdayPicker isHe={isHe} selected={data.defaultDays} onChange={(v) => up({ defaultDays: v })} />
              </div>
              <CancellationPolicyPicker locale={locale} defaultValue={venue.cancellation_policy ?? 'MODERATE'} />
            </div>
          )}

          {/* Step 6: Photos & rules */}
          {step === 5 && (
            <div className="flex flex-col gap-6">
              {/* Existing photos */}
              {data.existingPhotos.length > 0 && (
                <div className="flex flex-col gap-3">
                  <p className="font-medium">{isHe ? 'תמונות קיימות' : 'Current photos'}</p>
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                    {data.existingPhotos.map((url) => (
                      <div key={url} className="group relative overflow-hidden rounded-xl">
                        <Image
                          src={url}
                          alt="Venue photo"
                          width={120}
                          height={80}
                          className="h-20 w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => up({ existingPhotos: data.existingPhotos.filter((p) => p !== url) })}
                          className="absolute end-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload new photos */}
              <PhotoUpload
                onPhotosChange={(urls) => up({ newPhotos: urls })}
                locale={locale}
                maxFiles={Math.max(1, 10 - data.existingPhotos.length)}
              />

              {/* Venue rules */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="e-rules" className="font-medium">{t.venueForm.rules}</Label>
                <p className="text-sm text-muted-foreground">{t.venueForm.rulesHint}</p>
                <Textarea
                  id="e-rules"
                  value={data.rules}
                  onChange={(e) => up({ rules: e.target.value })}
                  rows={4}
                  className="resize-none"
                  placeholder={t.venueForm.rulesPlaceholder}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between gap-3">
        <Button type="button" variant="outline" onClick={prev} disabled={step === 0 || isPending} className="gap-2">
          <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
          {isHe ? 'חזרה' : 'Back'}
        </Button>

        <p className="text-sm text-muted-foreground">{step + 1} / {totalSteps}</p>

        {step < totalSteps - 1 ? (
          <Button type="button" onClick={next} disabled={!canAdvance()} className="gap-2">
            {isHe ? 'המשך' : 'Continue'}
            <ChevronRight className="h-4 w-4 rtl:rotate-180" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={submit}
            disabled={isPending}
            className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-600/90 hover:to-teal-600/90"
          >
            {isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" />{isHe ? 'שומר...' : 'Saving...'}</>
            ) : (
              <><Check className="h-4 w-4" />{isHe ? 'שמור שינויים' : 'Save changes'}</>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
