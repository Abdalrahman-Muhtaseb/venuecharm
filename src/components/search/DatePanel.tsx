'use client'

import { useState } from 'react'
import { he as heLocale } from 'date-fns/locale'
import type { DateRange } from 'react-day-picker'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'

export const FLEX_OPTIONS = [
  { label: 'Exact dates', labelHe: 'תאריכים מדויקים', value: 0 },
  { label: '±1 day',      labelHe: '±יום',              value: 1 },
  { label: '±2 days',     labelHe: '±2 ימים',           value: 2 },
  { label: '±3 days',     labelHe: '±3 ימים',           value: 3 },
  { label: '±7 days',     labelHe: '±שבוע',             value: 7 },
  { label: '±14 days',    labelHe: '±שבועיים',          value: 14 },
] as const

export interface DatePanelProps {
  isHe: boolean
  dateFrom?: Date
  dateTo?: Date
  flex: number
  onSelect: (from: Date | undefined, to: Date | undefined, flex: number) => void
  onClear: () => void
}

export function DatePanel({ isHe, dateFrom, dateTo, flex, onSelect, onClear }: DatePanelProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [localFlex, setLocalFlex] = useState(flex)
  const [range, setRange] = useState<DateRange | undefined>(
    dateFrom ? { from: dateFrom, to: dateTo } : undefined,
  )
  const [singleDate, setSingleDate] = useState<Date | undefined>(dateFrom)

  const handleFlexChange = (newFlex: number) => {
    setLocalFlex(newFlex)
    if (newFlex === 0) {
      // Back to exact dates — seed the range from the single date so the
      // selection carries over (and the range calendar shows it highlighted).
      const from = range?.from ?? singleDate
      const r = from ? { from, to: range?.to } : undefined
      setRange(r)
      onSelect(r?.from, r?.to, 0)
    } else {
      // Flexible window — keep a single anchor date and sync local state so the
      // single-date calendar actually shows it selected (previously it didn't).
      const anchor = singleDate ?? range?.from
      setSingleDate(anchor)
      onSelect(anchor, undefined, newFlex)
    }
  }

  const handleRangeSelect = (r: DateRange | undefined) => {
    setRange(r)
    onSelect(r?.from, r?.to, 0)
  }

  const handleSingleSelect = (d: Date | undefined) => {
    setSingleDate(d)
    onSelect(d, undefined, localFlex)
  }

  const handleClear = () => {
    setRange(undefined)
    setSingleDate(undefined)
    onClear()
  }

  const isExact = localFlex === 0
  const hasValue = isExact ? Boolean(range?.from) : Boolean(singleDate)

  return (
    <div className="flex flex-col">
      {isExact ? (
        <Calendar
          mode="range"
          selected={range}
          onSelect={handleRangeSelect}
          defaultMonth={range?.from ?? today}
          disabled={{ before: today }}
          locale={isHe ? heLocale : undefined}
          dir={isHe ? 'rtl' : 'ltr'}
          className="mx-auto [--cell-size:2.5rem]"
        />
      ) : (
        <>
          <p className="mb-2 text-center text-xs text-muted-foreground">
            {isHe
              ? 'בחר תאריך — נחפש גם בתאריכים קרובים'
              : "Pick a date — we'll search nearby dates too"}
          </p>
          <Calendar
            mode="single"
            selected={singleDate}
            onSelect={handleSingleSelect}
            defaultMonth={singleDate ?? today}
            disabled={{ before: today }}
            locale={isHe ? heLocale : undefined}
            dir={isHe ? 'rtl' : 'ltr'}
            className="mx-auto [--cell-size:2.5rem]"
          />
        </>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t px-3 pt-3">
        {/* Flex option pills */}
        <div className="flex flex-wrap gap-1.5">
          {FLEX_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleFlexChange(opt.value)}
              className={cn(
                'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors duration-150',
                localFlex === opt.value
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-input bg-background text-muted-foreground hover:border-foreground/60 hover:text-foreground',
              )}
            >
              {isHe ? opt.labelHe : opt.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={handleClear}
          disabled={!hasValue}
          className="shrink-0 rounded-lg px-2 py-1 text-sm font-semibold underline underline-offset-2 transition-opacity hover:opacity-70 disabled:opacity-40"
        >
          {isHe ? 'נקה' : 'Clear'}
        </button>
      </div>
    </div>
  )
}
