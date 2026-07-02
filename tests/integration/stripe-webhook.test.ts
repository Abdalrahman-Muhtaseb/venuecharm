import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import {
  hasTestDb,
  admin,
  createUser,
  makeVenue,
  makeBooking,
  makePayment,
  setStripeAccount,
  cleanupAll,
} from '../helpers/supabase'

// The webhook handler reads the signature via next/headers, not the Request.
// Mock it so each test can supply its own signature header.
let currentSig: string | null = null
vi.mock('next/headers', () => ({
  headers: () => ({ get: (k: string) => (k === 'stripe-signature' ? currentSig : null) }),
}))

const PRIMARY = 'whsec_test_primary_secret'
const CONNECT = 'whsec_test_connect_secret'

// Signature verification and generateTestHeaderString are pure crypto — no
// Stripe network and no real API key needed.
import { stripe } from '@/lib/stripe'
import { POST } from '@/app/api/stripe/webhook/route'

function post(event: Record<string, unknown>, secret: string | null) {
  const payload = JSON.stringify(event)
  currentSig =
    secret === null
      ? null
      : stripe.webhooks.generateTestHeaderString({ payload, secret })
  return POST(new Request('http://localhost/api/stripe/webhook', { method: 'POST', body: payload }))
}

describe.skipIf(!hasTestDb)('Stripe webhook handler', () => {
  beforeAll(() => {
    process.env.STRIPE_WEBHOOK_SECRET = PRIMARY
    process.env.STRIPE_WEBHOOK_SECRET_CONNECT = CONNECT
  })
  afterAll(cleanupAll)

  describe('signature verification', () => {
    it('rejects a missing signature with 400', async () => {
      const res = await post({ id: 'evt_1', type: 'payment_intent.succeeded', data: { object: {} } }, null)
      expect(res.status).toBe(400)
    })

    it('rejects a payload signed with an unknown secret with 400', async () => {
      const res = await post(
        { id: 'evt_2', type: 'payment_intent.succeeded', data: { object: { id: 'pi_x' } } },
        'whsec_totally_wrong',
      )
      expect(res.status).toBe(400)
    })

    it('accepts a payload signed with the primary (account) secret', async () => {
      const res = await post(
        { id: 'evt_3', type: 'payment_intent.succeeded', data: { object: { id: 'pi_none' } } },
        PRIMARY,
      )
      expect(res.status).toBe(200)
    })

    it('accepts a payload signed with the connect secret', async () => {
      const res = await post(
        { id: 'evt_4', type: 'account.updated', data: { object: { id: 'acct_none', charges_enabled: true, payouts_enabled: true, details_submitted: true } } },
        CONNECT,
      )
      expect(res.status).toBe(200)
    })
  })

  describe('DB side-effects', () => {
    it('amount_capturable_updated → payment AUTHORIZED', async () => {
      const host = await createUser('HOST')
      const renter = await createUser('RENTER')
      const venue = await makeVenue(host.id)
      const booking = await makeBooking(venue, renter.id)
      const bookingId = (booking as { id: string }).id
      const { stripePaymentIntentId } = await makePayment(bookingId, renter.id, { status: 'PENDING' })

      const res = await post(
        {
          id: 'evt_auth',
          type: 'payment_intent.amount_capturable_updated',
          data: { object: { id: stripePaymentIntentId } },
        },
        PRIMARY,
      )
      expect(res.status).toBe(200)

      const { data } = await admin()
        .from('payments')
        .select('status')
        .eq('stripe_payment_intent_id', stripePaymentIntentId)
        .single()
      expect(data?.status).toBe('AUTHORIZED')
    })

    it('payment_intent.succeeded → payment CAPTURED', async () => {
      const host = await createUser('HOST')
      const renter = await createUser('RENTER')
      const venue = await makeVenue(host.id)
      const booking = await makeBooking(venue, renter.id)
      const bookingId = (booking as { id: string }).id
      const { stripePaymentIntentId } = await makePayment(bookingId, renter.id, { status: 'AUTHORIZED' })

      await post(
        { id: 'evt_ok', type: 'payment_intent.succeeded', data: { object: { id: stripePaymentIntentId } } },
        PRIMARY,
      )

      const { data } = await admin()
        .from('payments')
        .select('status')
        .eq('stripe_payment_intent_id', stripePaymentIntentId)
        .single()
      expect(data?.status).toBe('CAPTURED')
    })

    it('account.updated → user Stripe flags synced', async () => {
      const host = await createUser('HOST')
      const accountId = `acct_test_${host.id.slice(0, 8)}`
      await setStripeAccount(host.id, accountId)

      const res = await post(
        {
          id: 'evt_acct',
          type: 'account.updated',
          data: { object: { id: accountId, charges_enabled: true, payouts_enabled: true, details_submitted: true } },
        },
        CONNECT,
      )
      expect(res.status).toBe(200)

      const { data } = await admin()
        .from('users')
        .select('stripe_charges_enabled, stripe_payouts_enabled, stripe_details_submitted')
        .eq('id', host.id)
        .single()
      expect(data?.stripe_charges_enabled).toBe(true)
      expect(data?.stripe_payouts_enabled).toBe(true)
      expect(data?.stripe_details_submitted).toBe(true)
    })
  })
})
