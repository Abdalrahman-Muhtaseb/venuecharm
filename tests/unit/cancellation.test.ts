import { describe, it, expect } from 'vitest'
import { computeDeadline, refundPercent, describeRefund } from '@/lib/cancellation'

// refundPercent returns a FRACTION (1.0 / 0.5 / 0.0), not a percentage.
const start = new Date('2026-08-01T18:00:00Z')

const daysBefore = (n: number) => new Date(start.getTime() - n * 24 * 3_600_000)
const hoursBefore = (n: number) => new Date(start.getTime() - n * 3_600_000)

describe('refundPercent — FLEXIBLE', () => {
  it('full refund at exactly 24h before start', () => {
    expect(refundPercent('FLEXIBLE', hoursBefore(24), start)).toBe(1.0)
  })
  it('no refund just inside 24h', () => {
    expect(refundPercent('FLEXIBLE', hoursBefore(23), start)).toBe(0.0)
  })
  it('no refund after start', () => {
    expect(refundPercent('FLEXIBLE', hoursBefore(-1), start)).toBe(0.0)
  })
})

describe('refundPercent — MODERATE', () => {
  it('full refund at exactly 7 days out', () => {
    expect(refundPercent('MODERATE', daysBefore(7), start)).toBe(1.0)
  })
  it('half refund between 24h and 7 days', () => {
    expect(refundPercent('MODERATE', daysBefore(3), start)).toBe(0.5)
  })
  it('half refund at exactly 24h', () => {
    expect(refundPercent('MODERATE', hoursBefore(24), start)).toBe(0.5)
  })
  it('no refund just inside 24h', () => {
    expect(refundPercent('MODERATE', hoursBefore(23), start)).toBe(0.0)
  })
})

describe('refundPercent — STRICT', () => {
  it('half refund at exactly 7 days out', () => {
    expect(refundPercent('STRICT', daysBefore(7), start)).toBe(0.5)
  })
  it('no refund inside 7 days', () => {
    expect(refundPercent('STRICT', daysBefore(6), start)).toBe(0.0)
  })
})

describe('describeRefund', () => {
  it('maps fractions to labels', () => {
    expect(describeRefund('FLEXIBLE', hoursBefore(48), start)).toBe('full')
    expect(describeRefund('MODERATE', daysBefore(3), start)).toBe('partial')
    expect(describeRefund('STRICT', daysBefore(1), start)).toBe('none')
  })
})

describe('computeDeadline', () => {
  it('FLEXIBLE / MODERATE deadline is 24h before start', () => {
    expect(computeDeadline('FLEXIBLE', start).getTime()).toBe(hoursBefore(24).getTime())
    expect(computeDeadline('MODERATE', start).getTime()).toBe(hoursBefore(24).getTime())
  })
  it('STRICT deadline is 7 days before start', () => {
    expect(computeDeadline('STRICT', start).getTime()).toBe(daysBefore(7).getTime())
  })
  it('does not mutate the input date', () => {
    const input = new Date(start)
    computeDeadline('STRICT', input)
    expect(input.getTime()).toBe(start.getTime())
  })
})
