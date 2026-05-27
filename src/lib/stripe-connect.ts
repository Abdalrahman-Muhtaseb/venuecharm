import { stripe, COMMISSION_RATE } from './stripe'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export async function createConnectAccount(email: string, userId: string) {
  return stripe.accounts.create({
    type: 'express',
    country: 'US',
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    business_type: 'individual',
    metadata: { userId },
  })
}

export async function createOnboardingLink(accountId: string) {
  return stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${APP_URL}/api/stripe/connect/refresh`,
    return_url: `${APP_URL}/api/stripe/connect/return`,
    type: 'account_onboarding',
  })
}

export async function fetchConnectStatus(accountId: string) {
  const account = await stripe.accounts.retrieve(accountId)
  return {
    charges_enabled: account.charges_enabled,
    payouts_enabled: account.payouts_enabled,
    details_submitted: account.details_submitted,
  }
}

export interface ChargeSplit {
  grossAgorot: number
  hostPayoutAgorot: number
  applicationFee: number
}

export function splitChargeAmount(baseILS: number, commissionRate = COMMISSION_RATE): ChargeSplit {
  const grossAgorot = Math.round(baseILS * (1 + commissionRate) * 100)
  const hostPayoutAgorot = Math.round(baseILS * 100)
  const applicationFee = grossAgorot - hostPayoutAgorot
  return { grossAgorot, hostPayoutAgorot, applicationFee }
}
