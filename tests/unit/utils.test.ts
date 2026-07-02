import { describe, it, expect } from 'vitest'
import { isSafeRedirectPath, approxCount } from '@/lib/utils'

describe('isSafeRedirectPath — open-redirect guard', () => {
  it('accepts same-origin relative paths', () => {
    expect(isSafeRedirectPath('/venues')).toBe(true)
    expect(isSafeRedirectPath('/host/dashboard?tab=x')).toBe(true)
  })

  it('rejects protocol-relative URLs', () => {
    expect(isSafeRedirectPath('//evil.com')).toBe(false)
  })

  it('rejects absolute URLs with a scheme', () => {
    expect(isSafeRedirectPath('https://evil.com')).toBe(false)
    expect(isSafeRedirectPath('/redirect?next=https://evil.com')).toBe(false)
  })

  it('rejects non-slash paths and empty/nullish input', () => {
    expect(isSafeRedirectPath('venues')).toBe(false)
    expect(isSafeRedirectPath('')).toBe(false)
    expect(isSafeRedirectPath(undefined)).toBe(false)
    expect(isSafeRedirectPath(null)).toBe(false)
  })
})

describe('approxCount', () => {
  it('leaves values under 10 exact', () => {
    expect(approxCount(0)).toBe(0)
    expect(approxCount(9)).toBe(9)
  })
  it('rounds down to the nearest 10 under 100', () => {
    expect(approxCount(37)).toBe(30)
    expect(approxCount(99)).toBe(90)
  })
  it('rounds down to the nearest 100 at/above 100', () => {
    expect(approxCount(150)).toBe(100)
    expect(approxCount(1234)).toBe(1200)
  })
})
