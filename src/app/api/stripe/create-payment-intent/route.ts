import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, toChargeAmount, isStripeConfigured } from '@/lib/stripe'

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
    .select('id, total_price, renter_id')
    .eq('id', bookingId)
    .eq('renter_id', user.id)
    .single()

  if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 })

  const pi = await stripe.paymentIntents.create({
    amount:         toChargeAmount(Number(booking.total_price)),
    currency:       'ils',
    capture_method: 'manual',
    metadata:       { bookingId: booking.id, renterId: user.id },
  })

  await supabase.from('payments').upsert(
    {
      booking_id:               booking.id,
      renter_id:                user.id,
      amount:                   booking.total_price,
      currency:                 'ILS',
      stripe_payment_intent_id: pi.id,
      status:                   'PENDING',
    },
    { onConflict: 'booking_id' },
  )

  return Response.json({ clientSecret: pi.client_secret })
}
