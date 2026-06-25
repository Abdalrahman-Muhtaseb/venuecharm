'use client'

import { useEffect, useId, useRef, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { getDictionary, type Locale } from '@/lib/i18n'
import {
  LocationSuggestionsPanel,
  type DestinationSuggestion,
} from '@/components/search/LocationSuggestionsPanel'
import { DatePanel, FLEX_OPTIONS } from '@/components/search/DatePanel'
import { GuestsPanel } from '@/components/search/GuestsPanel'
import { EventTypePanel } from '@/components/search/EventTypePanel'

declare global {
  interface Window {
    google?: { maps: any }
  }
}

const GOOGLE_MAPS_SCRIPT_ID = 'venuecharm-google-maps-script'
// Default search center when the user searches with no location and geolocation is unavailable
const TEL_AVIV = { lat: 32.0853, lng: 34.7818 }

type Segment = 'where' | 'when' | 'why' | 'who'

function useGoogleMaps(): boolean {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (window.google?.maps?.places) {
      setReady(true)
      return
    }
    if (!document.getElementById(GOOGLE_MAPS_SCRIPT_ID)) {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      if (!apiKey) return
      const script = document.createElement('script')
      script.id = GOOGLE_MAPS_SCRIPT_ID
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker,places`
      script.async = true
      script.defer = true
      document.body.appendChild(script)
    }
    const poll = setInterval(() => {
      if (window.google?.maps?.places) {
        setReady(true)
        clearInterval(poll)
      }
    }, 250)
    return () => clearInterval(poll)
  }, [])

  return ready
}

function suggestedDestinations(isHe: boolean): DestinationSuggestion[] {
  return [
    {
      id: 'nearby',
      kind: 'nearby',
      title: isHe ? 'בקרבת מקום' : 'Nearby',
      subtitle: isHe ? 'גלה מה נמצא סביבך' : "Find what's around you",
    },
    {
      id: 'jerusalem',
      kind: 'city',
      title: isHe ? 'ירושלים' : 'Jerusalem, Israel',
      subtitle: isHe ? 'עיר הבירה ההיסטורית' : 'The historic capital',
      lat: 31.7683,
      lng: 35.2137,
    },
    {
      id: 'tel-aviv',
      kind: 'city',
      title: isHe ? 'תל אביב' : 'Tel Aviv, Israel',
      subtitle: isHe ? 'חיי עיר ליד הים' : 'City life by the beach',
      lat: 32.0853,
      lng: 34.7818,
    },
    {
      id: 'haifa',
      kind: 'city',
      title: isHe ? 'חיפה' : 'Haifa, Israel',
      subtitle: isHe ? 'נוף הכרמל והמפרץ' : 'Carmel and bay views',
      lat: 32.794,
      lng: 34.9896,
    },
    {
      id: 'beer-sheva',
      kind: 'city',
      title: isHe ? 'באר שבע' : 'Beer Sheva, Israel',
      subtitle: isHe ? 'בירת הנגב' : 'Capital of the Negev',
      lat: 31.253,
      lng: 34.7915,
    },
    {
      id: 'tiberias',
      kind: 'city',
      title: isHe ? 'טבריה' : 'Tiberias, Israel',
      subtitle: isHe ? 'על שפת הכנרת' : 'On the Sea of Galilee',
      lat: 32.7959,
      lng: 35.53,
    },
    {
      id: 'eilat',
      kind: 'city',
      title: isHe ? 'אילת' : 'Eilat, Israel',
      subtitle: isHe ? 'חופשה על ים סוף' : 'Red Sea getaway',
      lat: 29.5577,
      lng: 34.9519,
    },
  ]
}

function parseDate(s: string): Date | undefined {
  if (!s) return undefined
  const d = new Date(`${s}T00:00:00`)
  return Number.isNaN(d.getTime()) ? undefined : d
}

interface SearchBarAutocompleteProps {
  locale: Locale
  /** Compact variant for the results-page navbar: shorter, no per-segment labels. */
  compact?: boolean
}

export function SearchBarAutocomplete({ locale, compact = false }: SearchBarAutocompleteProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const mapsReady = useGoogleMaps()
  const isHe = locale === 'he'
  const eventTypeLabels = getDictionary(locale).rfp.eventTypeOptions

  const urlQ         = searchParams.get('q')          ?? ''
  const urlCapacity  = searchParams.get('capacity')   ?? ''
  const urlEventType = searchParams.get('event_type') ?? ''
  // support both new params (date_from/date_to/flex) and the legacy `date` param
  const urlDateFrom = searchParams.get('date_from')  ?? searchParams.get('date') ?? ''
  const urlDateTo   = searchParams.get('date_to')    ?? ''
  const urlFlex     = parseInt(searchParams.get('flex') ?? '0', 10) || 0

  const [q,         setQ]         = useState(urlQ)
  const [capacity,  setCapacity]  = useState(urlCapacity)
  const [eventType, setEventType] = useState(urlEventType)
  const [dateFrom,  setDateFrom]  = useState<Date | undefined>(() => parseDate(urlDateFrom))
  const [dateTo,    setDateTo]    = useState<Date | undefined>(() => parseDate(urlDateTo))
  const [flex,      setFlex]      = useState(urlFlex)

  // When the user pans/zooms the map, reflect that in the Where field. Cleared
  // when the user focuses the field (to type fresh) or on a real URL navigation.
  const mapAreaLabel = isHe ? 'אזור המפה' : 'Map area'
  const qIsMapAreaRef = useRef(false)

  useEffect(() => {
    const onMapSearch = () => { qIsMapAreaRef.current = true; setQ(mapAreaLabel) }
    window.addEventListener('venuecharm:mapsearch', onMapSearch)
    return () => window.removeEventListener('venuecharm:mapsearch', onMapSearch)
  }, [mapAreaLabel])

  useEffect(() => { qIsMapAreaRef.current = false; setQ(urlQ) },      [urlQ])
  useEffect(() => { setCapacity(urlCapacity) },                       [urlCapacity])
  useEffect(() => { setEventType(urlEventType) },                     [urlEventType])
  useEffect(() => { setDateFrom(parseDate(urlDateFrom)) },            [urlDateFrom])
  useEffect(() => { setDateTo(parseDate(urlDateTo)) },                [urlDateTo])
  useEffect(() => { setFlex(urlFlex) },                               [urlFlex])

  const [active,      setActive]      = useState<Segment | null>(null)
  const [predictions, setPredictions] = useState<DestinationSuggestion[]>([])
  const [highlighted, setHighlighted] = useState(-1)

  const formRef          = useRef<HTMLFormElement>(null)
  const prevActiveRef    = useRef<Segment | null>(null)
  const inputRef         = useRef<HTMLInputElement>(null)
  const serviceRef       = useRef<any>(null)
  const capacityRef      = useRef(capacity)
  const eventTypeRef     = useRef(eventType)
  const dateFromRef      = useRef(dateFrom)
  const dateToRef        = useRef(dateTo)
  const flexRef          = useRef(flex)
  const searchParamsRef  = useRef(searchParams)
  const selectedPlaceRef = useRef<string | null>(searchParams.get('lat') ? urlQ || null : null)
  const selectedLatRef   = useRef<number | null>(searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : null)
  const selectedLngRef   = useRef<number | null>(searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : null)
  // User's device location — requested silently on mount, used as fallback when Where is empty
  const userLatRef = useRef<number | null>(null)
  const userLngRef = useRef<number | null>(null)
  const listboxId        = useId()

  // Silently request the user's position on mount so it's ready if they search without a location
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        userLatRef.current = pos.coords.latitude
        userLngRef.current = pos.coords.longitude
      },
      () => {},
      { timeout: 8000, maximumAge: 300000 },
    )
  }, [])

  useEffect(() => { capacityRef.current     = capacity },     [capacity])
  useEffect(() => { eventTypeRef.current    = eventType },    [eventType])
  useEffect(() => { dateFromRef.current     = dateFrom },     [dateFrom])
  useEffect(() => { dateToRef.current       = dateTo },       [dateTo])
  useEffect(() => { flexRef.current         = flex },         [flex])
  useEffect(() => { searchParamsRef.current = searchParams }, [searchParams])

  useEffect(() => {
    if (!active) return
    const onPointerDown = (e: PointerEvent) => {
      if (formRef.current && !formRef.current.contains(e.target as Node)) setActive(null)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [active])

  // Scroll the form to the top of the viewport when first activated.
  // Skipped if the form is already near the top (e.g. sticky navbar on /venues).
  useEffect(() => {
    if (active !== null && prevActiveRef.current === null && formRef.current) {
      const rect = formRef.current.getBoundingClientRect()
      const NAVBAR_HEIGHT = 88
      if (rect.top > NAVBAR_HEIGHT + 24) {
        window.scrollTo({
          top: window.scrollY + rect.top - NAVBAR_HEIGHT - 24,
          behavior: 'smooth',
        })
      }
    }
    prevActiveRef.current = active
  }, [active])

  useEffect(() => {
    if (active !== 'where') return
    const text = q.trim()
    if (!text || !mapsReady) {
      setPredictions([])
      setHighlighted(-1)
      return
    }
    const timer = setTimeout(() => {
      if (!serviceRef.current) {
        serviceRef.current = new window.google!.maps.places.AutocompleteService()
      }
      serviceRef.current.getPlacePredictions(
        { input: text, componentRestrictions: { country: 'il' }, types: ['geocode'] },
        (results: any[] | null) => {
          setHighlighted(-1)
          setPredictions(
            (results ?? []).slice(0, 6).map((p) => ({
              id: p.place_id,
              kind: 'prediction' as const,
              placeId: p.place_id,
              title: p.structured_formatting?.main_text ?? p.description,
              subtitle: p.structured_formatting?.secondary_text,
            })),
          )
        },
      )
    }, 250)
    return () => clearTimeout(timer)
  }, [q, active, mapsReady])

  const suggestions = q.trim() ? predictions : suggestedDestinations(isHe)

  const buildDateParams = (params: URLSearchParams) => {
    const df = dateFromRef.current
    const dt = dateToRef.current
    const fl = flexRef.current
    if (df) {
      params.set('date_from', format(df, 'yyyy-MM-dd'))
      if (dt && fl === 0) params.set('date_to', format(dt, 'yyyy-MM-dd'))
      else params.delete('date_to')
      if (fl > 0) params.set('flex', String(fl))
      else params.delete('flex')
    } else {
      params.delete('date_from')
      params.delete('date_to')
      params.delete('flex')
    }
    params.delete('date') // remove legacy param
  }

  const savePlace = (lat: number, lng: number, name: string) => {
    selectedLatRef.current   = lat
    selectedLngRef.current   = lng
    selectedPlaceRef.current = name
    setQ(name)
    setPredictions([])
    setHighlighted(-1)
    setActive(null)
  }

  const handleSelect = (item: DestinationSuggestion) => {
    if (item.kind === 'nearby') {
      navigator.geolocation?.getCurrentPosition(
        (pos) => savePlace(pos.coords.latitude, pos.coords.longitude, item.title),
        () => setActive(null),
      )
      return
    }
    if (item.kind === 'city' && item.lat != null && item.lng != null) {
      savePlace(item.lat, item.lng, item.title)
      return
    }
    if (item.kind === 'prediction' && item.placeId && window.google?.maps) {
      new window.google.maps.Geocoder().geocode(
        { placeId: item.placeId },
        (results: any[] | null, status: string) => {
          const loc = results?.[0]?.geometry?.location
          if (status === 'OK' && loc) savePlace(loc.lat(), loc.lng(), item.title)
        },
      )
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setActive(null)
    startTransition(() => {
      const params = new URLSearchParams(searchParamsRef.current.toString())
      const text = q.trim()
      if (text) params.set('q', text)
      else params.delete('q')
      if (capacity) params.set('capacity', capacity)
      else params.delete('capacity')
      if (eventTypeRef.current) params.set('event_type', eventTypeRef.current)
      else params.delete('event_type')
      buildDateParams(params)
      if (text && text === selectedPlaceRef.current && selectedLatRef.current != null && selectedLngRef.current != null) {
        // Explicit place selected from suggestions
        params.set('lat', String(selectedLatRef.current))
        params.set('lng', String(selectedLngRef.current))
        params.set('radius', '30')
      } else if (!text) {
        // No location typed — use the device position if we have it, otherwise
        // default to Tel Aviv. Reflect the chosen area back into the Where field.
        const hasGeo = userLatRef.current != null && userLngRef.current != null
        const lat = hasGeo ? userLatRef.current! : TEL_AVIV.lat
        const lng = hasGeo ? userLngRef.current! : TEL_AVIV.lng
        const label = hasGeo
          ? (isHe ? 'בקרבת מקום' : 'Nearby')
          : (isHe ? 'תל אביב' : 'Tel Aviv, Israel')
        params.set('lat', String(lat))
        params.set('lng', String(lng))
        params.set('radius', '30')
        params.set('q', label)
      } else {
        params.delete('lat')
        params.delete('lng')
        params.delete('radius')
      }
      params.delete('page')
      router.push(`/venues?${params.toString()}`)
    })
  }

  const handleWhereKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Enter' && highlighted >= 0 && suggestions[highlighted]) {
      e.preventDefault()
      handleSelect(suggestions[highlighted])
    }
  }

  const handleDateSelect = (from: Date | undefined, to: Date | undefined, newFlex: number) => {
    setDateFrom(from)
    setDateTo(to)
    setFlex(newFlex)
  }

  const handleDateClear = () => {
    setDateFrom(undefined)
    setDateTo(undefined)
    setFlex(0)
  }

  const guests = capacity ? parseInt(capacity, 10) || 0 : 0

  const whenLabel = (() => {
    if (!dateFrom) return null
    const base = format(dateFrom, 'd MMM')
    if (dateTo && flex === 0) return `${base} – ${format(dateTo, 'd MMM')}`
    if (flex > 0) {
      const opt = FLEX_OPTIONS.find((o) => o.value === flex)
      return `${base} ${isHe ? opt?.labelHe : opt?.label}`
    }
    return base
  })()

  const segmentClass = (segment: Segment) =>
    cn(
      'flex h-full flex-col justify-center rounded-full text-start transition-colors duration-200',
      active === segment
        ? 'bg-background shadow-[0_6px_20px_rgba(0,0,0,0.18)]'
        : active
          ? 'hover:bg-muted-foreground/10'
          : 'hover:bg-muted',
    )

  return (
    <form
      ref={formRef}
      role="search"
      onSubmit={handleSubmit}
      onKeyDown={(e) => { if (e.key === 'Escape') setActive(null) }}
      className={cn(
        'relative flex items-center rounded-full border transition-[background-color,box-shadow] duration-200',
        compact ? 'h-12' : 'h-14 md:h-16',
        active
          ? 'border-transparent bg-muted'
          : 'border-input bg-background shadow-md hover:shadow-lg',
      )}
    >
      {/* ── Where ── */}
      <div
        onClick={() => { setActive('where'); inputRef.current?.focus() }}
        className={cn(segmentClass('where'), 'min-w-0 flex-[1.5] cursor-text gap-0.5 ps-6 pe-4 md:ps-8')}
      >
        {!compact && (
          <label
            htmlFor={`${listboxId}-input`}
            className="cursor-text text-xs font-semibold text-foreground"
          >
            {isHe ? 'לאן' : 'Where'}
          </label>
        )}
        <input
          id={`${listboxId}-input`}
          ref={inputRef}
          role="combobox"
          aria-expanded={active === 'where'}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={highlighted >= 0 ? `${listboxId}-opt-${highlighted}` : undefined}
          value={q}
          onChange={(e) => { qIsMapAreaRef.current = false; setQ(e.target.value); setHighlighted(-1) }}
          onFocus={() => {
            setActive('where')
            if (qIsMapAreaRef.current) { qIsMapAreaRef.current = false; setQ('') }
          }}
          onKeyDown={handleWhereKeyDown}
          placeholder={isHe ? 'חיפוש יעדים' : 'Search destinations'}
          autoComplete="off"
          className="w-full truncate border-0 bg-transparent p-0 text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>

      {/* Divider */}
      <div
        aria-hidden="true"
        className={cn(
          'h-8 w-px shrink-0 bg-border/70 transition-opacity duration-200',
          (active === 'where' || active === 'when') && 'opacity-0',
        )}
      />

      {/* ── When (desktop only) ── */}
      <button
        type="button"
        onClick={() => setActive(active === 'when' ? null : 'when')}
        aria-haspopup="dialog"
        aria-expanded={active === 'when'}
        className={cn(segmentClass('when'), 'hidden w-32 shrink-0 gap-0.5 px-4 sm:flex')}
      >
        {!compact && <span className="text-xs font-semibold text-foreground">{isHe ? 'מתי' : 'When'}</span>}
        <span className={cn('truncate text-sm', whenLabel ? 'font-medium text-foreground' : 'text-muted-foreground')}>
          {whenLabel ?? (isHe ? 'הוסף תאריך' : 'Add dates')}
        </span>
      </button>

      {/* Divider */}
      <div
        aria-hidden="true"
        className={cn(
          'hidden h-8 w-px shrink-0 bg-border/70 transition-opacity duration-200 sm:block',
          (active === 'when' || active === 'why') && 'opacity-0',
        )}
      />

      {/* ── Why (event type, desktop only) ── */}
      <button
        type="button"
        onClick={() => setActive(active === 'why' ? null : 'why')}
        aria-haspopup="dialog"
        aria-expanded={active === 'why'}
        className={cn(segmentClass('why'), 'hidden w-32 shrink-0 gap-0.5 px-4 sm:flex')}
      >
        {!compact && <span className="text-xs font-semibold text-foreground">{isHe ? 'למה' : 'Why'}</span>}
        <span className={cn('truncate text-sm', eventType ? 'font-medium text-foreground' : 'text-muted-foreground')}>
          {eventType
            ? (eventTypeLabels[eventType as keyof typeof eventTypeLabels] ?? eventType)
            : (isHe ? 'סוג אירוע' : 'Event type')}
        </span>
      </button>

      {/* Divider */}
      <div
        aria-hidden="true"
        className={cn(
          'hidden h-8 w-px shrink-0 bg-border/70 transition-opacity duration-200 sm:block',
          (active === 'why' || active === 'who') && 'opacity-0',
        )}
      />

      {/* ── Who ── */}
      <button
        type="button"
        onClick={() => setActive(active === 'who' ? null : 'who')}
        aria-haspopup="dialog"
        aria-expanded={active === 'who'}
        className={cn(segmentClass('who'), 'w-36 shrink-0 gap-0.5 ps-5 pe-14 sm:w-40 sm:ps-6 sm:pe-16')}
      >
        {!compact && <span className="text-xs font-semibold text-foreground">{isHe ? 'מי' : 'Who'}</span>}
        <span className={cn('truncate text-sm', guests > 0 ? 'font-medium text-foreground' : 'text-muted-foreground')}>
          {guests > 0
            ? isHe ? `${guests.toLocaleString()} אורחים` : `${guests.toLocaleString()} guests`
            : isHe ? 'הוסף אורחים' : 'Add guests'}
        </span>
      </button>

      {/* ── Search button — fixed size, no expansion ── */}
      <button
        type="submit"
        disabled={isPending}
        aria-label={isHe ? 'חיפוש' : 'Search'}
        className={cn(
          'absolute top-1/2 flex -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90 active:scale-95 disabled:opacity-60',
          compact ? 'end-1.5 h-9 w-9' : 'end-2 h-10 w-10 md:h-12 md:w-12',
        )}
      >
        {isPending
          ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
          : <Search className="h-4 w-4 shrink-0" aria-hidden="true" />}
      </button>

      {/* ── Panels ── */}
      {active === 'where' && (
        <div className="absolute start-0 top-[calc(100%+0.75rem)] z-50 w-[min(26rem,calc(100vw-2rem))] animate-in fade-in-0 slide-in-from-top-2 rounded-3xl border bg-background py-5 shadow-2xl duration-200">
          <LocationSuggestionsPanel
            items={suggestions}
            header={
              q.trim()
                ? isHe ? 'תוצאות' : 'Results'
                : isHe ? 'יעדים מוצעים' : 'Suggested destinations'
            }
            emptyMessage={
              mapsReady
                ? isHe ? 'לא נמצאו יעדים' : 'No destinations found'
                : isHe ? 'טוען הצעות...' : 'Loading suggestions...'
            }
            listboxId={listboxId}
            highlightedIndex={highlighted}
            onSelect={handleSelect}
            onHighlight={setHighlighted}
          />
        </div>
      )}

      {active === 'when' && (
        <div className="absolute left-1/2 top-[calc(100%+0.75rem)] z-50 -translate-x-1/2">
          <div className="animate-in fade-in-0 slide-in-from-top-2 w-[min(26rem,calc(100vw-2rem))] rounded-3xl border bg-background p-4 shadow-2xl duration-200">
            <DatePanel
              isHe={isHe}
              dateFrom={dateFrom}
              dateTo={dateTo}
              flex={flex}
              onSelect={handleDateSelect}
              onClear={handleDateClear}
            />
          </div>
        </div>
      )}

      {active === 'why' && (
        <div className="absolute left-1/2 top-[calc(100%+0.75rem)] z-50 -translate-x-1/2 w-[min(24rem,calc(100vw-2rem))] animate-in fade-in-0 slide-in-from-top-2 rounded-3xl border bg-background p-6 shadow-2xl duration-200">
          <EventTypePanel
            locale={locale}
            value={eventType}
            onChange={(v) => { setEventType(v); setActive(null) }}
          />
        </div>
      )}

      {active === 'who' && (
        <div className="absolute end-0 top-[calc(100%+0.75rem)] z-50 w-80 animate-in fade-in-0 slide-in-from-top-2 rounded-3xl border bg-background p-6 shadow-2xl duration-200">
          <GuestsPanel
            isHe={isHe}
            value={guests}
            onChange={(n) => setCapacity(n > 0 ? String(n) : '')}
          />
        </div>
      )}
    </form>
  )
}
