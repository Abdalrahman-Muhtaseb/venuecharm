'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

interface BookingDateApi {
  selectedDate: Date | undefined
  setSelectedDate: (d: Date | undefined) => void
  /** Optional HH:MM start/end, set when a renter selects week-grid slots. */
  selectedStart: string | undefined
  selectedEnd: string | undefined
  setSelectedStart: (t: string | undefined) => void
  /** True when the renter picked a whole day (price resolves to the day rate). */
  fullDay: boolean
  /** Set a date + start (no end yet) — a single slot click. */
  selectSlot: (date: Date, start: string) => void
  /** Set a date + start + end — a slot range. */
  selectRange: (date: Date, start: string, end: string) => void
  /** Select an entire day (whole-day booking). */
  selectFullDay: (date: Date) => void
}

const BookingDateContext = createContext<BookingDateApi | null>(null)

/** Shared selected date/time so the availability views and the booking widget stay
 *  in sync on the venue detail page. Returns null when used outside the provider. */
export function useBookingDate(): BookingDateApi | null {
  return useContext(BookingDateContext)
}

export function BookingDateProvider({ children }: { children: ReactNode }) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedStart, setSelectedStart] = useState<string | undefined>(undefined)
  const [selectedEnd, setSelectedEnd] = useState<string | undefined>(undefined)
  const [fullDay, setFullDay] = useState(false)

  const selectSlot = (date: Date, start: string) => {
    setSelectedDate(date)
    setSelectedStart(start)
    setSelectedEnd(undefined)
    setFullDay(false)
  }

  const selectRange = (date: Date, start: string, end: string) => {
    setSelectedDate(date)
    setSelectedStart(start)
    setSelectedEnd(end)
    setFullDay(false)
  }

  const selectFullDay = (date: Date) => {
    setSelectedDate(date)
    setSelectedStart(undefined)
    setSelectedEnd(undefined)
    setFullDay(true)
  }

  return (
    <BookingDateContext.Provider
      value={{
        selectedDate,
        setSelectedDate,
        selectedStart,
        selectedEnd,
        setSelectedStart,
        fullDay,
        selectSlot,
        selectRange,
        selectFullDay,
      }}
    >
      {children}
    </BookingDateContext.Provider>
  )
}
