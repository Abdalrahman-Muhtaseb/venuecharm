import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'sk_test_placeholder', {
  apiVersion: '2024-06-20',
})

export const COMMISSION_RATE = parseFloat(process.env.PLATFORM_COMMISSION_RATE ?? '0.15')

/** Total amount the renter pays = base × (1 + commission). Returns agorot (cents). */
export function toChargeAmount(baseILS: number): number {
  return Math.round(baseILS * (1 + COMMISSION_RATE) * 100)
}

export function isStripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('placeholder'),
  )
}
