'use client'

import Link from 'next/link'
import { useEffect, useState, useTransition } from 'react'
import { CalendarIcon, Clock, CalendarDays, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { requestBooking } from '@/actions/bookings'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PriceBreakdown } from '@/components/booking/PriceBreakdown'
import { useBookingDate } from '@/components/booking/BookingDateContext'
import {
  expandBookings,
  minToTime,
  takenRangesForDate,
  timeToMin,
  ymd,
  type SlotBlock,
  type SlotBooking,
} from '@/lib/availability-slots'
import { cn } from '@/lib/utils'
import { formatCurrencyILS, type Locale } from '@/lib/i18n'

interface BookingWidgetProps {
  venueId: string
  pricePerHour: number | null
  pricePerDay: number | null
  isOwner: boolean
  isActive: boolean
  blockedDates: string[]
  bookingRanges: { start: string; end: string }[]
  /** Host-blocked hourly slots */
  blocks?: SlotBlock[]
  /** Daily operating-hours window, 'HH:MM' */
  opening?: string
  closing?: string
  /** Turnaround buffer (minutes) padded around existing bookings */
  bufferMin?: number
  locale: Locale
}

function toISO(date: Date, time: string): string {
  const [h, m] = time.split(':').map(Number)
  const d = new Date(date)
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

export function BookingWidget({
  venueId,
  pricePerHour,
  pricePerDay,
  isOwner,
  isActive,
  blockedDates,
  bookingRanges,
  blocks = [],
  opening = '06:00',
  closing = '24:00',
  bufferMin = 0,
  locale,
}: BookingWidgetProps) {
  const isHe = locale === 'he'
  const fmt = (v: number) => formatCurrencyILS(v, locale)

  const [isPending, startTransition] = useTransition()
  const [mode, setMode] = useState<'hourly' | 'fullday'>(pricePerHour ? 'hourly' : 'fullday')
  // Selected date is shared with the availability views when the provider is
  // present (venue detail page); otherwise fall back to local state.
  const bookingDate = useBookingDate()
  const [localDate, setLocalDate] = useState<Date | undefined>()
  const selectedDate = bookingDate ? bookingDate.selectedDate : localDate
  const setSelectedDate = bookingDate ? bookingDate.setSelectedDate : setLocalDate
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')

  // A renter selecting week-grid slots prefills the date + start/checkout times.
  const slotStart = bookingDate?.selectedStart
  const slotEnd = bookingDate?.selectedEnd
  const fullDay = bookingDate?.fullDay
  useEffect(() => {
    if (fullDay) {
      // Whole-day pick: use the flat day rate when the venue has one, else
      // fall back to an opening→closing hourly booking.
      if (pricePerDay) {
        setMode('fullday')
      } else if (pricePerHour) {
        setMode('hourly')
        setStartTime(opening)
        setEndTime(closing)
      }
      return
    }
    if (!slotStart) return
    if (pricePerHour) setMode('hourly')
    setStartTime(slotStart)
    setEndTime(slotEnd ?? '')
  }, [fullDay, slotStart, slotEnd, pricePerHour, pricePerDay, opening, closing])

  // Bookings as minute ranges per local day (times preserved by toISO round-trip).
  const bookingSlots: SlotBooking[] = bookingRanges.map(({ start, end }) => {
    const s = new Date(start)
    const e = new Date(end)
    const sameDay = s.toDateString() === e.toDateString()
    return {
      date: ymd(s),
      startMin: s.getHours() * 60 + s.getMinutes(),
      endMin: sameDay ? e.getHours() * 60 + e.getMinutes() : 1440,
    }
  })

  const todayMid = new Date()
  todayMid.setHours(0, 0, 0, 0)
  const blockedDaySet = new Set(blockedDates)
  const bookedDaySet = new Set(bookingSlots.map((b) => b.date))
  const blockSlotDaySet = new Set(blocks.map((b) => b.date))

  // Hourly mode: only whole-day blocks/past are unbookable (partial days stay open).
  // Full-day mode: any booking or host block on a day makes the whole day unbookable.
  const isDateDisabled = (date: Date) => {
    if (date < todayMid) return true
    const key = ymd(date)
    if (blockedDaySet.has(key)) return true
    if (mode === 'fullday' && (bookedDaySet.has(key) || blockSlotDaySet.has(key))) return true
    return false
  }

  const openingMin = timeToMin(opening)
  const closingMin = timeToMin(closing)
  const nowMin = (() => {
    const n = new Date()
    return n.getHours() * 60 + n.getMinutes()
  })()
  const isSelectedDateToday = selectedDate
    ? selectedDate.toDateString() === new Date().toDateString()
    : false

  const taken = selectedDate
    ? takenRangesForDate(ymd(selectedDate), expandBookings(bookingSlots, bufferMin), blocks)
    : []
  const inTaken = (m: number) => taken.some((r) => r.start <= m && m < r.end)

  const startMins: number[] = []
  for (let m = openingMin; m + 30 <= closingMin; m += 30) startMins.push(m)
  const availableStartSlots = startMins
    .filter((m) => !inTaken(m) && (!isSelectedDateToday || m > nowMin))
    .map(minToTime)

  const startMinSel = startTime ? timeToMin(startTime) : null
  const endBoundary =
    startMinSel == null
      ? closingMin
      : taken.reduce((b, r) => (r.start > startMinSel && r.start < b ? r.start : b), closingMin)
  const endTimeSlots: string[] = []
  if (startMinSel != null) {
    for (let m = startMinSel + 30; m <= endBoundary; m += 30) endTimeSlots.push(minToTime(m))
  }

  let subtotal = 0
  let startAt = ''
  let endAt = ''
  if (selectedDate) {
    if (mode === 'hourly' && startTime && endTime && pricePerHour) {
      const [sh, sm] = startTime.split(':').map(Number)
      const [eh, em] = endTime.split(':').map(Number)
      const hours = (eh * 60 + em - sh * 60 - sm) / 60
      subtotal = hours > 0 ? hours * pricePerHour : 0
      startAt = toISO(selectedDate, startTime)
      endAt = toISO(selectedDate, endTime)
    } else if (mode === 'fullday' && pricePerDay) {
      subtotal = pricePerDay
      startAt = toISO(selectedDate, '00:00')
      endAt = toISO(selectedDate, '23:59')
    }
  }

  const hours = startTime && endTime
    ? (() => {
        const [sh, sm] = startTime.split(':').map(Number)
        const [eh, em] = endTime.split(':').map(Number)
        return (eh * 60 + em - sh * 60 - sm) / 60
      })()
    : 0

  const canSubmit = Boolean(selectedDate && subtotal > 0 && startAt && endAt)

  const handleSubmit = () => {
    if (!canSubmit) return
    startTransition(async () => {
      const fd = new FormData()
      fd.set('venueId', venueId)
      fd.set('startAt', startAt)
      fd.set('endAt', endAt)
      fd.set('totalPrice', String(subtotal))
      fd.set('notes', '')
      try {
        await requestBooking(fd)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : ''
        if (msg.includes('NEXT_REDIRECT')) throw err
        toast.error(msg || (isHe ? 'שגיאה ביצירת הזמנה' : 'Failed to create booking'))
      }
    })
  }

  const datePicker = (
    <div className="flex flex-col gap-2">
      <Label>{isHe ? 'תאריך' : 'Date'}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn('justify-start text-start font-normal', !selectedDate && 'text-muted-foreground')}
          >
            <CalendarIcon className="me-2 h-4 w-4" />
            {selectedDate ? format(selectedDate, 'PPP') : (isHe ? 'בחר תאריך' : 'Pick a date')}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              setSelectedDate(date)
              setStartTime('')
              setEndTime('')
            }}
            disabled={isDateDisabled}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )

  return (
    <Card className="sticky top-24">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-baseline justify-between gap-2 text-lg">
          <span>{isHe ? 'הזמנת מקום' : 'Book this venue'}</span>
        </CardTitle>
        <div className="mt-1 flex flex-col gap-1 text-sm">
          {pricePerHour != null && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-4 w-4" />
                {isHe ? 'לשעה' : 'Per hour'}
              </span>
              <span className="font-semibold text-primary">{fmt(Number(pricePerHour))}</span>
            </div>
          )}
          {pricePerDay != null && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                {isHe ? 'ליום' : 'Per day'}
              </span>
              <span className="font-semibold text-primary">{fmt(Number(pricePerDay))}</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {isOwner ? (
          <Button variant="outline" asChild>
            <Link href={`/host/listings/${venueId}/edit`}>{isHe ? 'עריכת נכס' : 'Edit listing'}</Link>
          </Button>
        ) : !isActive ? (
          <Button disabled className="w-full">{isHe ? 'לא זמין להזמנה' : 'Not available'}</Button>
        ) : (
          <>
            <Tabs value={mode} onValueChange={(v) => setMode(v as 'hourly' | 'fullday')}>
              {pricePerHour != null && pricePerDay != null && (
                <TabsList className="w-full">
                  <TabsTrigger value="hourly" className="flex-1">
                    <Clock className="me-2 h-4 w-4" />
                    {isHe ? 'לפי שעה' : 'Hourly'}
                  </TabsTrigger>
                  <TabsTrigger value="fullday" className="flex-1">
                    <CalendarDays className="me-2 h-4 w-4" />
                    {isHe ? 'יום שלם' : 'Full day'}
                  </TabsTrigger>
                </TabsList>
              )}

              <TabsContent value="hourly" className="mt-4 flex flex-col gap-4">
                {datePicker}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-2">
                    <Label>{isHe ? 'שעת התחלה' : 'Start time'}</Label>
                    <Select value={startTime} onValueChange={(v) => { setStartTime(v); setEndTime('') }}>
                      <SelectTrigger><SelectValue placeholder={isHe ? 'בחר שעה' : 'Select'} /></SelectTrigger>
                      <SelectContent>
                        {availableStartSlots.map((slot) => (
                          <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>{isHe ? 'שעת סיום' : 'End time'}</Label>
                    <Select value={endTime} onValueChange={setEndTime} disabled={!startTime}>
                      <SelectTrigger><SelectValue placeholder={isHe ? 'בחר שעה' : 'Select'} /></SelectTrigger>
                      <SelectContent>
                        {endTimeSlots.map((slot) => (
                          <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {startTime && endTime && (
                  <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                    {hours > 0
                      ? isHe ? `${hours} שעות` : `${hours} hour${hours !== 1 ? 's' : ''}`
                      : isHe ? 'שעת הסיום חייבת להיות אחרי שעת ההתחלה' : 'End time must be after start time'}
                  </p>
                )}
              </TabsContent>

              <TabsContent value="fullday" className="mt-4 flex flex-col gap-4">
                {datePicker}
              </TabsContent>
            </Tabs>

            {subtotal > 0 ? (
              <>
                <Separator />
                <PriceBreakdown subtotal={subtotal} locale={locale} />
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                {isHe
                  ? 'בחר תאריך ושעות כדי לראות את המחיר הסופי. עמלת שירות של 15% מתווספת.'
                  : 'Pick a date and time to see your final price. A 15% service fee is added.'}
              </p>
            )}

            <Button size="lg" className="w-full" disabled={!canSubmit || isPending} onClick={handleSubmit}>
              {isPending
                ? <><Loader2 className="me-2 h-4 w-4 animate-spin" />{isHe ? 'שולח...' : 'Sending...'}</>
                : isHe ? 'המשך לתשלום' : 'Continue to payment'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
