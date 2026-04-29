'use client'

import { useState, useTransition } from 'react'
import { CalendarIcon, Clock, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { requestBooking } from '@/actions/bookings'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PriceBreakdown } from '@/components/booking/PriceBreakdown'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { Locale } from '@/lib/i18n'

interface BookingFormProps {
  venueId: string
  pricePerHour: number | null
  pricePerDay: number | null
  blockedDates: string[]
  bookingRanges: { start: string; end: string }[]
  locale: Locale
}

// 06:00 → 23:30 in 30-min steps
const TIME_SLOTS = Array.from({ length: 36 }, (_, i) => {
  const totalMinutes = 6 * 60 + i * 30
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
})

function toISO(date: Date, time: string): string {
  const [h, m] = time.split(':').map(Number)
  const d = new Date(date)
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

function parseDateStr(iso: string) {
  const [y, mo, d] = iso.split('T')[0].split('-').map(Number)
  return new Date(y, mo - 1, d)
}

export function BookingForm({
  venueId,
  pricePerHour,
  pricePerDay,
  blockedDates,
  bookingRanges,
  locale,
}: BookingFormProps) {
  const [isPending, startTransition] = useTransition()
  const [mode, setMode] = useState<'hourly' | 'fullday'>(pricePerHour ? 'hourly' : 'fullday')
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [notes, setNotes] = useState('')
  const isHe = locale === 'he'

  const blocked = blockedDates.map(parseDateStr)
  const booked  = bookingRanges.flatMap(({ start, end }) => {
    const dates: Date[] = []
    const s = parseDateStr(start)
    const e = parseDateStr(end)
    const c = new Date(s)
    while (c <= e) { dates.push(new Date(c)); c.setDate(c.getDate() + 1) }
    return dates
  })
  const disabledDates = [...blocked, ...booked, { before: new Date() }]

  // Compute derived values
  let subtotal = 0
  let startAt = ''
  let endAt = ''

  if (selectedDate) {
    if (mode === 'hourly' && startTime && endTime && pricePerHour) {
      const [sh, sm] = startTime.split(':').map(Number)
      const [eh, em] = endTime.split(':').map(Number)
      const hours = (eh * 60 + em - sh * 60 - sm) / 60
      subtotal = hours > 0 ? hours * pricePerHour : 0
      startAt  = toISO(selectedDate, startTime)
      endAt    = toISO(selectedDate, endTime)
    } else if (mode === 'fullday' && pricePerDay) {
      subtotal = pricePerDay
      startAt  = toISO(selectedDate, '00:00')
      endAt    = toISO(selectedDate, '23:59')
    }
  }

  const endTimeSlots = startTime
    ? TIME_SLOTS.filter((t) => t > startTime)
    : TIME_SLOTS

  const canSubmit = Boolean(selectedDate && subtotal > 0 && startAt && endAt)

  const handleSubmit = () => {
    if (!canSubmit) return
    startTransition(async () => {
      const fd = new FormData()
      fd.set('venueId', venueId)
      fd.set('startAt', startAt)
      fd.set('endAt', endAt)
      fd.set('totalPrice', String(subtotal))
      fd.set('notes', notes)
      try {
        await requestBooking(fd)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : ''
        // Let Next.js redirect errors pass through
        if (msg.includes('NEXT_REDIRECT')) throw err
        toast.error(msg || (isHe ? 'שגיאה ביצירת הזמנה' : 'Failed to create booking'))
      }
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <Tabs value={mode} onValueChange={(v) => setMode(v as 'hourly' | 'fullday')}>
        <TabsList className="w-full">
          {pricePerHour && (
            <TabsTrigger value="hourly" className="flex-1">
              <Clock className="me-2 h-4 w-4" />
              {isHe ? 'לפי שעה' : 'Hourly'}
            </TabsTrigger>
          )}
          {pricePerDay && (
            <TabsTrigger value="fullday" className="flex-1">
              <CalendarIcon className="me-2 h-4 w-4" />
              {isHe ? 'יום שלם' : 'Full day'}
            </TabsTrigger>
          )}
        </TabsList>

        {/* ── Hourly ─────────────────────────── */}
        <TabsContent value="hourly" className="mt-4 flex flex-col gap-4">
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
                  onSelect={setSelectedDate}
                  disabled={disabledDates}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label>{isHe ? 'שעת התחלה' : 'Start time'}</Label>
              <Select value={startTime} onValueChange={(v) => { setStartTime(v); setEndTime('') }}>
                <SelectTrigger><SelectValue placeholder={isHe ? 'בחר שעה' : 'Select'} /></SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.slice(0, -1).map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label>{isHe ? 'שעת סיום' : 'End time'}</Label>
              <Select value={endTime} onValueChange={setEndTime} disabled={!startTime}>
                <SelectTrigger><SelectValue placeholder={isHe ? 'בחר שעה' : 'Select'} /></SelectTrigger>
                <SelectContent>
                  {endTimeSlots.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {startTime && endTime && (
            <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
              {(() => {
                const [sh, sm] = startTime.split(':').map(Number)
                const [eh, em] = endTime.split(':').map(Number)
                const h = (eh * 60 + em - sh * 60 - sm) / 60
                return h > 0
                  ? isHe ? `${h} שעות` : `${h} hour${h !== 1 ? 's' : ''}`
                  : isHe ? 'שעת הסיום חייבת להיות אחרי שעת ההתחלה' : 'End time must be after start time'
              })()}
            </p>
          )}
        </TabsContent>

        {/* ── Full day ───────────────────────── */}
        <TabsContent value="fullday" className="mt-4 flex flex-col gap-4">
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
                  onSelect={setSelectedDate}
                  disabled={disabledDates}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </TabsContent>
      </Tabs>

      {/* Notes */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">
          {isHe ? 'הודעה למארח (אופציונלי)' : 'Message to host (optional)'}
        </Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={isHe ? 'תאר את האירוע שלך...' : 'Describe your event...'}
          rows={3}
        />
      </div>

      {/* Price breakdown */}
      {subtotal > 0 && (
        <>
          <Separator />
          <PriceBreakdown subtotal={subtotal} locale={locale} />
        </>
      )}

      <Button
        size="lg"
        className="w-full"
        disabled={!canSubmit || isPending}
        onClick={handleSubmit}
      >
        {isPending
          ? <><Loader2 className="me-2 h-4 w-4 animate-spin" />{isHe ? 'שולח...' : 'Sending...'}</>
          : isHe ? 'המשך לתשלום' : 'Continue to payment'
        }
      </Button>
    </div>
  )
}
