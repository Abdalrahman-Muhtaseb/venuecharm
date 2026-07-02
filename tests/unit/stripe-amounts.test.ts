import { describe, it, expect } from 'vitest'
import { toChargeAmount } from '@/lib/stripe'
import { splitChargeAmount } from '@/lib/stripe-connect'

// COMMISSION_RATE defaults to 0.15. Commission is added ON TOP of the base:
// the renter pays base × 1.15; the host receives the full base; the platform
// keeps the 15% difference. All amounts are in agorot (ILS cents).

describe('toChargeAmount', () => {
  it('adds 15% commission and converts ILS to agorot', () => {
    // 1000 ILS × 1.15 = 1150 ILS = 115000 agorot
    expect(toChargeAmount(1000)).toBe(115_000)
  })
  it('rounds to the nearest agora', () => {
    // 99.99 × 1.15 = 114.9885 ILS → 11499 agorot (rounded)
    expect(toChargeAmount(99.99)).toBe(11_499)
  })
  it('handles zero', () => {
    expect(toChargeAmount(0)).toBe(0)
  })
})

describe('splitChargeAmount', () => {
  it('gross = base + commission, payout = base, fee = difference', () => {
    const { grossAgorot, hostPayoutAgorot, applicationFee } = splitChargeAmount(1000)
    expect(grossAgorot).toBe(115_000)
    expect(hostPayoutAgorot).toBe(100_000)
    expect(applicationFee).toBe(15_000)
  })

  it('gross always matches toChargeAmount for the same base', () => {
    for (const base of [0, 1, 99.99, 250, 1000, 12_345.67]) {
      expect(splitChargeAmount(base).grossAgorot).toBe(toChargeAmount(base))
    }
  })

  it('fee + payout reconcile exactly to gross (no lost agorot)', () => {
    for (const base of [0, 99.99, 250.5, 1000, 12_345.67]) {
      const { grossAgorot, hostPayoutAgorot, applicationFee } = splitChargeAmount(base)
      expect(hostPayoutAgorot + applicationFee).toBe(grossAgorot)
    }
  })

  it('respects a custom commission rate', () => {
    const { grossAgorot, hostPayoutAgorot, applicationFee } = splitChargeAmount(1000, 0.2)
    expect(grossAgorot).toBe(120_000)
    expect(hostPayoutAgorot).toBe(100_000)
    expect(applicationFee).toBe(20_000)
  })
})
