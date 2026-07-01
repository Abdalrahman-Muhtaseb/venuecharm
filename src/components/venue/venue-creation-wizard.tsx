'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Building2, MapPin, Users, CreditCard, Camera, Star,
  ChevronLeft, ChevronRight, Check, Loader2,
} from 'lucide-react'
import { createVenue } from '@/actions/venues'
import { VenueMapPicker } from '@/components/venue/venue-map-picker'
import { PhotoUpload } from '@/components/venue/photo-upload'
import { CancellationPolicyPicker } from '@/components/venue/CancellationPolicyPicker'
import { AmenitiesPicker } from '@/components/venue/AmenitiesPicker'
import { EventTypesPicker } from '@/components/venue/EventTypesPicker'
import { ReservationModePicker } from '@/components/venue/ReservationModePicker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { getDictionary, type Locale } from '@/lib/i18n'
import { cn } from '@/lib/utils'

// ── Days picker ───────────────────────────────────────────────────
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

// ── Step config ───────────────────────────────────────────────────
interface StepConfig {
  id: string
  icon: typeof Building2
  gradient: string
  title: (isHe: boolean) => string
  sub: (isHe: boolean) => string
}

const STEPS: StepConfig[] = [
  {
    id: 'basics',
    icon: Building2,
    gradient: 'from-violet-500 to-primary',
    title: (isHe) => isHe ? 'הספייס שלך' : 'Your space',
    sub: (isHe) => isHe ? 'תן שם ותיאור למקום שלך' : 'Give your venue a name and description',
  },
  {
    id: 'type',
    icon: Star,
    gradient: 'from-pink-500 to-rose-500',
    title: (isHe) => isHe ? 'סוג האירועים' : 'Event types',
    sub: (isHe) => isHe ? 'לאיזה סוג אירועים המקום מתאים?' : 'What kind of events does this space suit?',
  },
  {
    id: 'location',
    icon: MapPin,
    gradient: 'from-emerald-500 to-teal-500',
    title: (isHe) => isHe ? 'מיקום' : 'Location',
    sub: (isHe) => isHe ? 'היכן נמצא המקום?' : 'Where is your venue located?',
  },
  {
    id: 'capacity',
    icon: Users,
    gradient: 'from-amber-500 to-orange-500',
    title: (isHe) => isHe ? 'קיבולת ושירותים' : 'Capacity & amenities',
    sub: (isHe) => isHe ? 'כמה אורחים ומה כלול?' : 'How many guests and what’s included?',
  },
  {
    id: 'pricing',
    icon: CreditCard,
    gradient: 'from-blue-500 to-indigo-500',
    title: (isHe) => isHe ? 'תמחור ולוח זמנים' : 'Pricing & schedule',
    sub: (isHe) => isHe ? 'קבע מחירים ושעות פעילות' : 'Set your prices and operating hours',
  },
  {
    id: 'photos',
    icon: Camera,
    gradient: 'from-purple-500 to-violet-600',
    title: (isHe) => isHe ? 'תמונות וכללים' : 'Photos & rules',
    sub: (isHe) => isHe ? 'הוסף תמונות וכללי הבית' : 'Add photos and house rules',
  },
]

// ── Wizard state ──────────────────────────────────────────────────
interface WizardData {
  title: string
  description: string
  eventTypes: string[]
  address: string
  city: string
  latitude: string
  longitude: string
  capacity: string
  amenities: string[]
  photos: string[]
  rules: string
  defaultDays: number[]
}

const DEFAULT_DATA: WizardData = {
  title: '', description: '', eventTypes: [],
  address: '', city: '', latitude: '', longitude: '',
  capacity: '', amenities: [],
  photos: [], rules: '',
  defaultDays: [0, 1, 2, 3, 4, 5, 6],
}

// ── Main component ────────────────────────────────────────────────
interface VenueCreationWizardProps {
  hasPublicGoogleMapsKey: boolean
  locale: Locale
}

export function VenueCreationWizard({ hasPublicGoogleMapsKey, locale }: VenueCreationWizardProps) {
  const t = getDictionary(locale)
  const isHe = locale === 'he'
  const router = useRouter()

  const [step, setStep] = useState(0) // 0-5
  const [data, setData] = useState<WizardData>(DEFAULT_DATA)
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState(false)

  // Refs for location inputs filled by VenueMapPicker via DOM
  const addressRef = useRef<HTMLInputElement>(null)
  const cityRef    = useRef<HTMLInputElement>(null)
  const latRef     = useRef<HTMLInputElement>(null)
  const lngRef     = useRef<HTMLInputElement>(null)

  const totalSteps = STEPS.length
  const pct = Math.round(((step + 1) / totalSteps) * 100)
  const cfg = STEPS[step]

  const up = <T,>(patch: Partial<WizardData>) => setData((d) => ({ ...d, ...patch }))

  const syncLocation = () => {
    // Pull address / city / coords from DOM inputs (filled by VenueMapPicker)
    up({
      address: addressRef.current?.value ?? data.address,
      city:    cityRef.current?.value    ?? data.city,
      latitude:  latRef.current?.value  ?? data.latitude,
      longitude: lngRef.current?.value  ?? data.longitude,
    })
  }

  const canAdvance = () => {
    if (step === 0) return data.title.trim().length > 0
    if (step === 2) return data.address.trim() && data.city.trim()
    if (step === 3) return data.capacity.trim() && Number(data.capacity) > 0
    return true
  }

  const next = () => {
    if (step === 2) syncLocation() // pull from DOM before advancing
    if (step < totalSteps - 1) setStep((s) => s + 1)
  }

  const prev = () => {
    if (step > 0) setStep((s) => s - 1)
  }

  const submit = () => {
    syncLocation()
    startTransition(async () => {
      try {
        const fd = new FormData()
        fd.append('title', data.title)
        fd.append('description', data.description)
        fd.append('address', data.address)
        fd.append('city', data.city)
        if (data.latitude) fd.append('latitude', data.latitude)
        if (data.longitude) fd.append('longitude', data.longitude)
        fd.append('capacity', data.capacity || '1')
        fd.append('eventTypes', data.eventTypes.join(','))
        fd.append('amenities', data.amenities.join(','))
        fd.append('photos', data.photos.join(','))
        fd.append('rules', data.rules)
        fd.append('defaultDays', data.defaultDays.join(','))
        // ReservationModePicker + CancellationPolicyPicker use hidden inputs in the form;
        // those are rendered on step 5 (pricing). We read them via formRef.
        formRef.current?.querySelectorAll<HTMLInputElement>('input[type="hidden"], input[type="number"], input[type="time"], select').forEach((el) => {
          if (el.name && el.value != null) fd.append(el.name, el.value)
        })
        await createVenue(fd)
        setDone(true)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t.venueForm.createListing)
      }
    })
  }

  const formRef = useRef<HTMLDivElement>(null)

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-20 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-violet-600 text-white shadow-lg shadow-primary/30">
          <Check className="h-10 w-10" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">{isHe ? 'הנכס נשלח לאישור!' : 'Listing submitted!'}</h2>
          <p className="mt-2 text-muted-foreground">
            {isHe ? 'צוות VenueCharm יסקור את הנכס ויאשר אותו בקרוב.' : 'VenueCharm will review and approve your listing shortly.'}
          </p>
        </div>
        <Button onClick={() => router.push('/host/listings')}>
          {isHe ? 'חזרה לנכסים שלי' : 'Go to my listings'}
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* ── Progress header ───────────────────────────────────────── */}
      <div className="mb-8">
        {/* Step pills */}
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

        {/* Progress bar */}
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

      {/* ── Step card ─────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border bg-background shadow-sm">
        {/* Card header with gradient */}
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

        {/* Card content */}
        <div ref={formRef} className="p-6 sm:p-8">
          {/* ── Step 1: Basics ──────────────────────────────────── */}
          {step === 0 && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="w-title" className="font-medium">
                  {isHe ? 'שם המקום' : 'Venue name'} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="w-title"
                  value={data.title}
                  onChange={(e) => up({ title: e.target.value })}
                  placeholder={isHe ? 'לדוג׳: אולם האירועים של תל אביב' : 'e.g. Tel Aviv Events Hall'}
                  className="text-base"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="w-desc" className="font-medium">{t.venueForm.description}</Label>
                <Textarea
                  id="w-desc"
                  value={data.description}
                  onChange={(e) => up({ description: e.target.value })}
                  placeholder={isHe
                    ? 'תאר את המקום, האווירה שלו, ומה הופך אותו למיוחד...'
                    : 'Describe the space, its atmosphere, and what makes it special...'}
                  rows={5}
                  className="resize-none"
                />
              </div>
            </div>
          )}

          {/* ── Step 2: Event types ──────────────────────────────── */}
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">{t.venueForm.venueTypeHint}</p>
              <EventTypesPicker locale={locale} selected={data.eventTypes} onChange={(v) => up({ eventTypes: v })} />
              {data.eventTypes.length === 0 && (
                <p className="text-xs text-muted-foreground">{isHe ? 'ניתן לדלג — ניתן לעדכן לאחר מכן' : 'Optional — you can update this later'}</p>
              )}
            </div>
          )}

          {/* ── Step 3: Location ─────────────────────────────────── */}
          {step === 2 && (
            <div className="flex flex-col gap-5">
              {hasPublicGoogleMapsKey ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    {isHe
                      ? 'לחץ על המפה לסימון המיקום — הכתובת תמולא אוטומטית.'
                      : 'Click the map to pin your venue — address fills in automatically.'}
                  </p>
                  <VenueMapPicker
                    addressInputId="w-address"
                    cityInputId="w-city"
                    latitudeInputName="latitude"
                    longitudeInputName="longitude"
                    locale={locale}
                    onLocationResolved={(address, city, lat, lng) => {
                      up({ address, city, latitude: String(lat), longitude: String(lng) })
                    }}
                  />
                  {/* hidden lat/lng inputs for map picker */}
                  <input ref={latRef}  type="hidden" name="latitude"  defaultValue={data.latitude}  />
                  <input ref={lngRef}  type="hidden" name="longitude" defaultValue={data.longitude} />
                </>
              ) : (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                  {isHe ? 'Google Maps לא מוגדר — ניתן להזין כתובת ידנית.' : 'Google Maps not configured — enter address manually.'}
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="w-address" className="font-medium">
                    {t.venueForm.address} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="w-address"
                    ref={addressRef}
                    defaultValue={data.address}
                    placeholder={isHe ? 'רחוב ומספר' : 'Street and number'}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="w-city" className="font-medium">
                    {t.venueForm.city} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="w-city"
                    ref={cityRef}
                    defaultValue={data.city}
                    placeholder={isHe ? 'עיר' : 'City'}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 4: Capacity & amenities ─────────────────────── */}
          {step === 3 && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2 sm:max-w-[180px]">
                <Label htmlFor="w-capacity" className="font-medium">
                  {t.venueForm.capacity} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="w-capacity"
                  type="number"
                  min={1}
                  value={data.capacity}
                  onChange={(e) => up({ capacity: e.target.value })}
                  placeholder="50"
                />
              </div>
              <div className="flex flex-col gap-3">
                <div>
                  <p className="font-medium">{isHe ? 'שירותים ומתקנים' : 'Amenities'}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {isHe ? 'בחר מה כלול במקום.' : "Select what's available at this venue."}
                  </p>
                </div>
                <AmenitiesPicker locale={locale} selected={data.amenities} onChange={(v) => up({ amenities: v })} />
              </div>
            </div>
          )}

          {/* ── Step 5: Pricing & schedule ───────────────────────── */}
          {step === 4 && (
            <div className="flex flex-col gap-6">
              <ReservationModePicker locale={locale} />
              <div className="flex flex-col gap-3">
                <div>
                  <p className="font-medium">{isHe ? 'זמינות ברירת מחדל' : 'Default availability'}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {isHe ? 'בחר ימים שבהם המקום זמין כברירת מחדל.' : 'Which weekdays is the venue available by default?'}
                  </p>
                </div>
                <WeekdayPicker isHe={isHe} selected={data.defaultDays} onChange={(v) => up({ defaultDays: v })} />
                <input type="hidden" name="defaultDays" value={data.defaultDays.join(',')} />
              </div>
              <CancellationPolicyPicker locale={locale} />
            </div>
          )}

          {/* ── Step 6: Photos & rules ───────────────────────────── */}
          {step === 5 && (
            <div className="flex flex-col gap-6">
              <PhotoUpload onPhotosChange={(urls) => up({ photos: urls })} locale={locale} />
              <div className="flex flex-col gap-2">
                <Label htmlFor="w-rules" className="font-medium">{t.venueForm.rules}</Label>
                <p className="text-sm text-muted-foreground">{t.venueForm.rulesHint}</p>
                <Textarea
                  id="w-rules"
                  value={data.rules}
                  onChange={(e) => up({ rules: e.target.value })}
                  rows={4}
                  placeholder={t.venueForm.rulesPlaceholder}
                  className="resize-none"
                />
              </div>

              {/* Review summary */}
              <div className="rounded-xl border bg-muted/30 p-4 text-sm">
                <p className="mb-2 font-medium">{isHe ? 'סיכום הנכס' : 'Listing summary'}</p>
                <ul className="grid gap-1 text-muted-foreground sm:grid-cols-2">
                  <li>📍 {data.city || '—'}</li>
                  <li>👥 {data.capacity || '—'} {isHe ? 'אורחים' : 'guests'}</li>
                  <li>🎉 {data.eventTypes.length} {isHe ? 'סוגי אירועים' : 'event types'}</li>
                  <li>✨ {data.amenities.length} {isHe ? 'שירותים' : 'amenities'}</li>
                  <li>📸 {data.photos.length} {isHe ? 'תמונות' : 'photos'}</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Navigation ────────────────────────────────────────────── */}
      <div className="mt-6 flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={prev}
          disabled={step === 0 || isPending}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
          {isHe ? 'חזרה' : 'Back'}
        </Button>

        <p className="text-sm text-muted-foreground">
          {step + 1} / {totalSteps}
        </p>

        {step < totalSteps - 1 ? (
          <Button
            type="button"
            onClick={next}
            disabled={!canAdvance()}
            className="gap-2"
          >
            {isHe ? 'המשך' : 'Continue'}
            <ChevronRight className="h-4 w-4 rtl:rotate-180" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={submit}
            disabled={isPending}
            className="gap-2 bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90"
          >
            {isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" />{isHe ? 'מפרסם...' : 'Publishing...'}</>
            ) : (
              <><Check className="h-4 w-4" />{t.venueForm.createListing}</>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
