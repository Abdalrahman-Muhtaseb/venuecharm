import { describe, it, expect } from 'vitest'
import {
  getDictionary,
  formatCurrencyILS,
  formatDateLocalized,
  formatDateTimeLocalized,
} from '@/lib/i18n'

function flattenKeys(obj: unknown, prefix = ''): string[] {
  if (obj === null || typeof obj !== 'object') return [prefix]
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
    flattenKeys(v, prefix ? `${prefix}.${k}` : k),
  )
}

describe('translation dictionaries', () => {
  it('he and en have identical key sets', () => {
    const he = flattenKeys(getDictionary('he')).sort()
    const en = flattenKeys(getDictionary('en')).sort()

    const missingInEn = he.filter((k) => !en.includes(k))
    const missingInHe = en.filter((k) => !he.includes(k))

    expect(missingInEn, `keys present in he but missing in en`).toEqual([])
    expect(missingInHe, `keys present in en but missing in he`).toEqual([])
  })

  it('no empty translation strings', () => {
    for (const locale of ['he', 'en'] as const) {
      const dict = getDictionary(locale)
      const emptyPaths = flattenKeys(dict).filter((path) => {
        const value = path.split('.').reduce<any>((acc, key) => acc?.[key], dict)
        return typeof value === 'string' && value.trim() === ''
      })
      expect(emptyPaths, `empty strings in ${locale}`).toEqual([])
    }
  })
})

describe('formatCurrencyILS', () => {
  it('renders whole-shekel ILS with the ₪ symbol (no decimals)', () => {
    for (const locale of ['he', 'en'] as const) {
      const out = formatCurrencyILS(1500, locale)
      expect(out).toContain('₪')
      expect(out.replace(/[^\d]/g, '')).toBe('1500')
    }
  })
})

describe('date formatters', () => {
  const iso = '2026-08-01T18:30:00Z'

  it('formatDateLocalized includes the year and no time', () => {
    const out = formatDateLocalized(iso, 'en')
    expect(out).toContain('2026')
    expect(out).not.toMatch(/\d{1,2}:\d{2}/)
  })

  it('formatDateTimeLocalized includes a HH:MM time component', () => {
    const out = formatDateTimeLocalized(iso, 'en')
    expect(out).toContain('2026')
    expect(out).toMatch(/\d{1,2}:\d{2}/)
  })

  it('accepts both string and Date inputs', () => {
    expect(formatDateLocalized(new Date(iso), 'he')).toContain('2026')
  })
})
