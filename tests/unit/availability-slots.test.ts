import { describe, it, expect } from 'vitest'
import {
  ymd,
  timeToMin,
  minToTime,
  hourlySlots,
  startOfWeek,
  weekDays,
  slotState,
  expandBookings,
  takenRangesForDate,
  type SlotBooking,
  type SlotBlock,
} from '@/lib/availability-slots'

describe('time conversions', () => {
  it('timeToMin parses HH:MM and 24:00', () => {
    expect(timeToMin('08:00')).toBe(480)
    expect(timeToMin('01:30')).toBe(90)
    expect(timeToMin('24:00')).toBe(1440)
  })
  it('minToTime is the inverse', () => {
    expect(minToTime(480)).toBe('08:00')
    expect(minToTime(90)).toBe('01:30')
    expect(minToTime(1440)).toBe('24:00')
  })
})

describe('hourlySlots', () => {
  it('lists inclusive hourly starts within [opening, closing)', () => {
    const slots = hourlySlots('08:00', '23:00')
    expect(slots).toHaveLength(15)
    expect(slots[0]).toBe('08:00')
    expect(slots[slots.length - 1]).toBe('22:00')
  })
})

describe('startOfWeek / weekDays', () => {
  it('startOfWeek lands on a Sunday at or before the date', () => {
    const s = startOfWeek(new Date(2099, 5, 17)) // arbitrary date
    expect(s.getDay()).toBe(0)
    expect(s.getTime()).toBeLessThanOrEqual(new Date(2099, 5, 17).getTime())
  })
  it('weekDays returns 7 consecutive days from the start', () => {
    const s = startOfWeek(new Date(2099, 5, 17))
    const days = weekDays(s)
    expect(days).toHaveLength(7)
    expect(days[0].getDay()).toBe(0)
    expect(days[6].getDay()).toBe(6)
  })
})

describe('slotState', () => {
  const futureDay = new Date(2099, 0, 1)
  const dayKey = ymd(futureDay) // '2099-01-01'
  const nowMs = futureDay.getTime() // midnight → 10:00 slot is in the future

  it('returns "past" when the slot has fully elapsed', () => {
    const pastDay = new Date(2020, 0, 1)
    const state = slotState(ymd(pastDay), 600, {
      bookings: [],
      blocks: [],
      nowMs: new Date(2020, 0, 2).getTime(),
      dayDate: pastDay,
    })
    expect(state).toBe('past')
  })

  it('returns "booked" when a booking overlaps', () => {
    const bookings: SlotBooking[] = [{ date: dayKey, startMin: 600, endMin: 720 }]
    expect(slotState(dayKey, 600, { bookings, blocks: [], nowMs, dayDate: futureDay })).toBe('booked')
  })

  it('returns "blocked" for a host-blocked slot', () => {
    const blocks: SlotBlock[] = [{ date: dayKey, startMin: 600 }]
    expect(slotState(dayKey, 600, { bookings: [], blocks, nowMs, dayDate: futureDay })).toBe('blocked')
  })

  it('returns "free" otherwise', () => {
    expect(slotState(dayKey, 600, { bookings: [], blocks: [], nowMs, dayDate: futureDay })).toBe('free')
  })
})

describe('expandBookings', () => {
  it('pads each booking by the buffer, clamped to [0, 1440]', () => {
    const bookings: SlotBooking[] = [{ date: 'd', startMin: 600, endMin: 720 }]
    expect(expandBookings(bookings, 60)).toEqual([{ date: 'd', startMin: 540, endMin: 780 }])
  })
  it('clamps at the day boundaries', () => {
    const bookings: SlotBooking[] = [{ date: 'd', startMin: 30, endMin: 1420 }]
    expect(expandBookings(bookings, 60)).toEqual([{ date: 'd', startMin: 0, endMin: 1440 }])
  })
  it('is a no-op with zero buffer', () => {
    const bookings: SlotBooking[] = [{ date: 'd', startMin: 600, endMin: 720 }]
    expect(expandBookings(bookings, 0)).toBe(bookings)
  })
})

describe('takenRangesForDate', () => {
  it('combines bookings and blocks (blocks are 1h) sorted by start', () => {
    const bookings: SlotBooking[] = [{ date: 'd', startMin: 720, endMin: 780 }]
    const blocks: SlotBlock[] = [{ date: 'd', startMin: 600 }]
    expect(takenRangesForDate('d', bookings, blocks)).toEqual([
      { start: 600, end: 660 },
      { start: 720, end: 780 },
    ])
  })
  it('ignores ranges on other dates', () => {
    const bookings: SlotBooking[] = [{ date: 'other', startMin: 600, endMin: 660 }]
    expect(takenRangesForDate('d', bookings, [])).toEqual([])
  })
})
