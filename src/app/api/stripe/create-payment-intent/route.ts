import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, isStripeConfigured } from '@/lib/stripe'
import { splitChargeAmount } from '@/lib/stripe-connect'

export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) {
    return Response.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

  const { bookingId } = await request.json() as { bookingId: string }

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, total_price, renter_id, venues(users:host_id(stripe_account_id, stripe_charges_enabled))')
    .eq('id', bookingId)
    .eq('renter_id', user.id)
    .single()

  if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 })

  const venue = Array.isArray(booking.venues) ? booking.venues[0] : booking.venues
  const hostNode = venue?.users
  const host = Array.isArray(hostNode) ? hostNode[0] : hostNode

  const totalPrice = Number(booking.total_price)
  const { grossAgorot, hostPayoutAgorot, applicationFee } = splitChargeAmount(totalPrice)

  const piParams: Parameters<typeof stripe.paymentIntents.create>[0] = {
    amount:         grossAgorot,
    currency:       'ils',
    capture_method: 'manual',
    metadata:       { bookingId: booking.id, renterId: user.id },
  }

  if (host?.stripe_charges_enabled && host?.stripe_account_id) {
    piParams.application_fee_amount = applicationFee
    piParams.transfer_data = { destination: host.stripe_account_id }
  }

  const pi = await stripe.paymentIntents.create(piParams)

  await supabase.from('payments').upsert(
    {
      booking_id:               booking.id,
      renter_id:                user.id,
      amount:                   booking.total_price,
      currency:                 'ILS',
      stripe_payment_intent_id: pi.id,
      status:                   'PENDING',
      platform_fee_amount:      applicationFee / 100,
      host_payout_amount:       hostPayoutAgorot / 100,
    },
    { onConflict: 'booking_id' },
  )

  return Response.json({ clientSecret: pi.client_secret })
}
