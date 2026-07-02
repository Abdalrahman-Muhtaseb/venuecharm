import { describe, it, expect } from 'vitest'
import { buildDateRange } from '@/lib/availability-filter'

// buildDateRange clamps past days to today, so tests use far-future dates to
// stay deterministic regardless of when they run.
describe('buildDateRange', () => {
  it('returns a single day for a lone `from`', () => {
    const r = buildDateRange('2099-06-15')
    expect(r).not.toBeNull()
    expect(r!.days).toEqual(['2099-06-15'])
    expect(r!.startStr).toBe('2099-06-15')
    expect(r!.endStr).toBe('2099-06-15')
  })

  it('spans an inclusive from…to range', () => {
    const r = buildDateRange('2099-06-15', '2099-06-18')
    expect(r!.days).toEqual(['2099-06-15', '2099-06-16', '2099-06-17', '2099-06-18'])
  })

  it('expands ± flex days around `from`', () => {
    const r = buildDateRange('2099-06-15', null, 2)
    expect(r!.days).toEqual([
      '2099-06-13',
      '2099-06-14',
      '2099-06-15',
      '2099-06-16',
      '2099-06-17',
    ])
  })

  it('returns null for a missing/invalid `from`', () => {
    expect(buildDateRange(null)).toBeNull()
    expect(buildDateRange('')).toBeNull()
    expect(buildDateRange('not-a-date')).toBeNull()
  })

  it('returns null when the whole range is in the past', () => {
    expect(buildDateRange('2000-01-01', '2000-01-05')).toBeNull()
  })

  it('caps very large ranges at 60 days', () => {
    const r = buildDateRange('2099-01-01', '2099-12-31')
    expect(r!.days).toHaveLength(60)
    expect(r!.startStr).toBe('2099-01-01')
  })
})
