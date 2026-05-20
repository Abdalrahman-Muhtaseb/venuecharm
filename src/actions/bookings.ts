'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { stripe, isStripeConfigured, toChargeAmount } from '@/lib/stripe'

export async function requestBooking(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const venueId    = String(formData.get('venueId'))
  const startAt    = String(formData.get('startAt'))
  const endAt      = String(formData.get('endAt'))
  const totalPrice = parseFloat(String(formData.get('totalPrice')))
  const notes      = String(formData.get('notes') ?? '')

  if (!venueId || !startAt || !endAt || isNaN(totalPrice)) {
    throw new Error('Missing required booking fields.')
  }

  // Insert the booking row — DB EXCLUDE constraint prevents overlap
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      venue_id:    venueId,
      renter_id:   user.id,
      start_at:    startAt,
      end_at:      endAt,
      total_price: totalPrice,
      notes:       notes || null,
      status:      'PENDING',
    })
    .select('id')
    .single()

  if (bookingError) {
    if (bookingError.message.includes('conflicting key') || bookingError.code === '23P01') {
      throw new Error('This time slot is already booked. Please choose a different time.')
    }
    throw new Error(bookingError.message)
  }

  // Create Stripe PaymentIntent if configured
  if (isStripeConfigured()) {
    try {
      const pi = await stripe.paymentIntents.create({
        amount:         toChargeAmount(totalPrice),
        currency:       'ils',
        capture_method: 'manual',
        metadata:       { bookingId: booking.id, renterId: user.id },
      })

      await supabase.from('payments').insert({
        booking_id:               booking.id,
        renter_id:                user.id,
        amount:                   totalPrice,
        currency:                 'ILS',
        stripe_payment_intent_id: pi.id,
        status:                   'PENDING',
      })
    } catch {
      // PI creation failed — booking still exists; checkout shows placeholder
    }
  }

  redirect(`/venues/${venueId}/checkout?bookingId=${booking.id}`)
}

export async function acceptBooking(bookingId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')

  // Verify host ownership via venues join
  const { data: booking } = await supabase
    .from('bookings')
    .select('id, venue_id, status, venues(host_id)')
    .eq('id', bookingId)
    .single()

  const venueData = booking?.venues as unknown as { host_id: string } | { host_id: string }[] | null
  const venueHostId = Array.isArray(venueData) ? venueData[0]?.host_id : venueData?.host_id

  if (!booking || venueHostId !== user.id) throw new Error('Not authorised.')
  if (booking.status !== 'PENDING') throw new Error('Booking is not pending.')

  const { error } = await supabase
    .from('bookings')
    .update({ status: 'CONFIRMED' })
    .eq('id', bookingId)

  if (error) throw new Error(error.message)

  // Capture Stripe PaymentIntent if it exists
  if (isStripeConfigured()) {
    const { data: payment } = await supabase
      .from('payments')
      .select('stripe_payment_intent_id')
      .eq('booking_id', bookingId)
      .single()

    if (payment?.stripe_payment_intent_id) {
      try {
        await stripe.paymentIntents.capture(payment.stripe_payment_intent_id)
        await supabase
          .from('payments')
          .update({ status: 'CAPTURED' })
          .eq('booking_id', bookingId)
      } catch {
        // PI may not be in capturable state yet; webhook will handle
      }
    }
  }

  revalidatePath('/host/bookings')
  revalidatePath(`/host/bookings/${bookingId}`)
  revalidatePath('/bookings')
  revalidatePath(`/bookings/${bookingId}`)
}

export async function declineBooking(bookingId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, venue_id, status, venues(host_id)')
    .eq('id', bookingId)
    .single()

  const venueData2 = booking?.venues as unknown as { host_id: string } | { host_id: string }[] | null
  const venueHostId = Array.isArray(venueData2) ? venueData2[0]?.host_id : venueData2?.host_id

  if (!booking || venueHostId !== user.id) throw new Error('Not authorised.')
  if (booking.status !== 'PENDING') throw new Error('Booking is not pending.')

  const { error } = await supabase
    .from('bookings')
    .update({ status: 'REJECTED' })
    .eq('id', bookingId)

  if (error) throw new Error(error.message)

  // Cancel Stripe PaymentIntent if it exists
  if (isStripeConfigured()) {
    const { data: payment } = await supabase
      .from('payments')
      .select('stripe_payment_intent_id')
      .eq('booking_id', bookingId)
      .single()

    if (payment?.stripe_payment_intent_id) {
      try {
        await stripe.paymentIntents.cancel(payment.stripe_payment_intent_id)
        await supabase
          .from('payments')
          .update({ status: 'REFUNDED' })
          .eq('booking_id', bookingId)
      } catch {
        // PI may already be cancelled
      }
    }
  }

  revalidatePath('/host/bookings')
  revalidatePath(`/host/bookings/${bookingId}`)
  revalidatePath('/bookings')
  revalidatePath(`/bookings/${bookingId}`)
}

export async function cancelOwnBooking(bookingId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, renter_id, status')
    .eq('id', bookingId)
    .single()

  if (!booking || booking.renter_id !== user.id) throw new Error('Not authorised.')
  if (booking.status !== 'PENDING') throw new Error('Only pending requests can be cancelled.')

  const { error } = await supabase
    .from('bookings')
    .update({ status: 'CANCELLED' })
    .eq('id', bookingId)

  if (error) throw new Error(error.message)

  if (isStripeConfigured()) {
    const { data: payment } = await supabase
      .from('payments')
      .select('stripe_payment_intent_id')
      .eq('booking_id', bookingId)
      .single()

    if (payment?.stripe_payment_intent_id) {
      try {
        await stripe.paymentIntents.cancel(payment.stripe_payment_intent_id)
        await supabase
          .from('payments')
          .update({ status: 'REFUNDED' })
          .eq('booking_id', bookingId)
      } catch {
        // PI may already be cancelled
      }
    }
  }

  revalidatePath('/bookings')
  revalidatePath(`/bookings/${bookingId}`)
  revalidatePath('/host/bookings')
}
