import type { CancellationPolicy } from '@/types/venue'

export function computeDeadline(policy: CancellationPolicy, startAt: Date): Date {
  const d = new Date(startAt)
  switch (policy) {
    case 'FLEXIBLE':
      d.setHours(d.getHours() - 24)
      break
    case 'MODERATE':
      d.setHours(d.getHours() - 24)
      break
    case 'STRICT':
      d.setDate(d.getDate() - 7)
      break
  }
  return d
}

export function refundPercent(
  policy: CancellationPolicy,
  cancelledAt: Date,
  startAt: Date,
): number {
  const hoursUntilStart = (startAt.getTime() - cancelledAt.getTime()) / 3_600_000
  const daysUntilStart = hoursUntilStart / 24

  switch (policy) {
    case 'FLEXIBLE':
      return hoursUntilStart >= 24 ? 1.0 : 0.0
    case 'MODERATE':
      if (daysUntilStart >= 7) return 1.0
      if (hoursUntilStart >= 24) return 0.5
      return 0.0
    case 'STRICT':
      if (daysUntilStart >= 7) return 0.5
      return 0.0
  }
}

export function describeRefund(
  policy: CancellationPolicy,
  cancelledAt: Date,
  startAt: Date,
): 'full' | 'partial' | 'none' {
  const pct = refundPercent(policy, cancelledAt, startAt)
  if (pct >= 1) return 'full'
  if (pct > 0) return 'partial'
  return 'none'
}
