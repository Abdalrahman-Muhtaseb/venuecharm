import { headers } from 'next/headers'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const body = await request.text()
  const sig  = headers().get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return new Response('Webhook signature missing', { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return new Response('Webhook signature verification failed', { status: 400 })
  }

  const supabase = createAdminClient()

  switch (event.type) {
    case 'payment_intent.amount_capturable_updated': {
      // Card authorized — funds on hold, waiting for host to accept
      const pi = event.data.object as Stripe.PaymentIntent
      await supabase
        .from('payments')
        .update({ status: 'AUTHORIZED' })
        .eq('stripe_payment_intent_id', pi.id)
      break
    }

    case 'payment_intent.succeeded': {
      // Funds captured — booking confirmed
      const pi = event.data.object as Stripe.PaymentIntent
      await supabase
        .from('payments')
        .update({ status: 'CAPTURED' })
        .eq('stripe_payment_intent_id', pi.id)
      break
    }

    case 'payment_intent.payment_failed': {
      const pi = event.data.object as Stripe.PaymentIntent
      await supabase
        .from('payments')
        .update({ status: 'FAILED' })
        .eq('stripe_payment_intent_id', pi.id)
      // Also mark the booking as cancelled
      if (pi.metadata.bookingId) {
        await supabase
          .from('bookings')
          .update({ status: 'CANCELLED' })
          .eq('id', pi.metadata.bookingId)
      }
      break
    }

    case 'payment_intent.canceled': {
      const pi = event.data.object as Stripe.PaymentIntent
      await supabase
        .from('payments')
        .update({ status: 'REFUNDED' })
        .eq('stripe_payment_intent_id', pi.id)
      break
    }

    case 'account.updated': {
      const account = event.data.object as Stripe.Account
      await supabase
        .from('users')
        .update({
          stripe_charges_enabled:   account.charges_enabled,
          stripe_payouts_enabled:   account.payouts_enabled,
          stripe_details_submitted: account.details_submitted,
        })
        .eq('stripe_account_id', account.id)
      break
    }

    case 'charge.refunded': {
      const charge = event.data.object as Stripe.Charge
      if (charge.payment_intent) {
        await supabase
          .from('payments')
          .update({
            status: charge.amount_refunded === charge.amount ? 'REFUNDED' : 'CAPTURED',
            refund_amount: charge.amount_refunded / 100,
          })
          .eq('stripe_payment_intent_id', charge.payment_intent as string)
      }
      break
    }

    case 'transfer.created': {
      const transfer = event.data.object as Stripe.Transfer
      const sourceTransaction = transfer.source_transaction as Stripe.Charge | string | null
      const pi = typeof sourceTransaction === 'object' && sourceTransaction !== null
        ? (sourceTransaction.payment_intent as string | null)
        : null
      if (pi) {
        await supabase
          .from('payments')
          .update({ stripe_transfer_id: transfer.id })
          .eq('stripe_payment_intent_id', pi)
      }
      break
    }
  }

  return new Response('OK', { status: 200 })
}
