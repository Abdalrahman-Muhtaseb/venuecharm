'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'
import { stripe, isStripeConfigured, toChargeAmount } from '@/lib/stripe'
import { splitChargeAmount } from '@/lib/stripe-connect'
import { computeDeadline, refundPercent } from '@/lib/cancellation'
import type { CancellationPolicy } from '@/types/venue'

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

  // Fetch venue + host stripe info up front
  const { data: venue } = await supabase
    .from('venues')
    .select('host_id, cancellation_policy, status, users:host_id(stripe_account_id, stripe_charges_enabled)')
    .eq('id', venueId)
    .single()

  if (!venue || venue.status !== 'ACTIVE') {
    throw new Error('Venue is not currently bookable.')
  }

  const host = Array.isArray(venue.users) ? venue.users[0] : venue.users
  const policy = (venue.cancellation_policy as CancellationPolicy) ?? 'MODERATE'
  const cancellationDeadline = computeDeadline(policy, new Date(startAt))

  // Insert the booking row — DB EXCLUDE constraint prevents overlap
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      venue_id:              venueId,
      renter_id:             user.id,
      start_at:              startAt,
      end_at:                endAt,
      total_price:           totalPrice,
      notes:                 notes || null,
      status:                'PENDING',
      cancellation_deadline: cancellationDeadline.toISOString(),
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
      const { grossAgorot, hostPayoutAgorot, applicationFee } = splitChargeAmount(totalPrice)

      const piParams: Parameters<typeof stripe.paymentIntents.create>[0] = {
        amount:         grossAgorot,
        currency:       'ils',
        capture_method: 'manual',
        metadata:       { bookingId: booking.id, renterId: user.id },
      }

      // Destination charge — money flows to host's Connect account on capture
      if (host?.stripe_charges_enabled && host?.stripe_account_id) {
        piParams.application_fee_amount = applicationFee
        piParams.transfer_data = { destination: host.stripe_account_id }
      }

      const pi = await stripe.paymentIntents.create(piParams)

      await supabase.from('payments').insert({
        booking_id:               booking.id,
        renter_id:                user.id,
        amount:                   totalPrice,
        currency:                 'ILS',
        stripe_payment_intent_id: pi.id,
        status:                   'PENDING',
        platform_fee_amount:      applicationFee / 100,
        host_payout_amount:       hostPayoutAgorot / 100,
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

  // Ensure host is fully onboarded before capturing (and transferring) funds
  const { data: hostProfile } = await supabase
    .from('users')
    .select('stripe_charges_enabled')
    .eq('id', user.id)
    .single()
  if (isStripeConfigured() && !hostProfile?.stripe_charges_enabled) {
    throw new Error('Complete Stripe payout setup before accepting bookings.')
  }

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
    .select('id, renter_id, status, start_at, total_price, venues(cancellation_policy)')
    .eq('id', bookingId)
    .single()

  if (!booking || booking.renter_id !== user.id) throw new Error('Not authorised.')
  if (booking.status !== 'PENDING' && booking.status !== 'CONFIRMED') {
    throw new Error('This booking cannot be cancelled.')
  }

  const venueShape = Array.isArray(booking.venues) ? booking.venues[0] : booking.venues
  const policy = ((venueShape as { cancellation_policy?: CancellationPolicy } | null)?.cancellation_policy ?? 'MODERATE') as CancellationPolicy
  const now = new Date()

  if (booking.status === 'PENDING') {
    // Host hasn't accepted yet — just cancel the held PaymentIntent
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
  } else {
    // CONFIRMED — funds captured + transferred. Issue refund based on policy.
    const pct = refundPercent(policy, now, new Date(booking.start_at))
    const grossAgorot = toChargeAmount(Number(booking.total_price))
    const refundAmountAgorot = Math.round(grossAgorot * pct)

    if (refundAmountAgorot > 0 && isStripeConfigured()) {
      const { data: payment } = await supabase
        .from('payments')
        .select('stripe_payment_intent_id, stripe_transfer_id')
        .eq('booking_id', bookingId)
        .single()

      if (payment?.stripe_payment_intent_id) {
        try {
          const refundParams: Stripe.RefundCreateParams = {
            payment_intent: payment.stripe_payment_intent_id,
            amount:         refundAmountAgorot,
          }

          // Only reverse the transfer if one actually exists (Connect charges only)
          if (payment.stripe_transfer_id) {
            refundParams.refund_application_fee = true
            refundParams.reverse_transfer = true
          }

          const refund = await stripe.refunds.create(refundParams)

          await supabase
            .from('payments')
            .update({
              status:           refundAmountAgorot === grossAgorot ? 'REFUNDED' : 'CAPTURED',
              stripe_refund_id: refund.id,
              refund_amount:    refundAmountAgorot / 100,
            })
            .eq('booking_id', bookingId)
        } catch (err) {
          throw new Error(err instanceof Error ? err.message : 'Refund failed')
        }
      }
    }
  }

  await supabase
    .from('bookings')
    .update({ status: 'CANCELLED', cancelled_at: now.toISOString() })
    .eq('id', bookingId)

  revalidatePath('/bookings')
  revalidatePath(`/bookings/${bookingId}`)
  revalidatePath('/host/bookings')
}
