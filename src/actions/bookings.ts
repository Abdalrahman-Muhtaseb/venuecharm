'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Stripe from 'stripe'
import { stripe, isStripeConfigured, toChargeAmount } from '@/lib/stripe'
import { splitChargeAmount } from '@/lib/stripe-connect'
import { computeDeadline, refundPercent } from '@/lib/cancellation'
import type { CancellationPolicy } from '@/types/venue'
import {
  getEmailLocale,
  sendBookingRequestedToRenter,
  sendBookingRequestedToHost,
  sendBookingAcceptedToRenter,
  sendBookingDeclinedToRenter,
  sendBookingCancelledToHost,
} from '@/lib/email'
import { syncConfirmedBooking, removeBookingEvent } from '@/lib/calendar-sync'

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
    .select('title, host_id, cancellation_policy, status, buffer_minutes, users:host_id(stripe_account_id, stripe_charges_enabled, email, first_name)')
    .eq('id', venueId)
    .single()

  if (!venue || venue.status !== 'ACTIVE') {
    throw new Error('Venue is not currently bookable.')
  }

  // Enforce the host's turnaround buffer: no other booking may fall within the
  // buffer window around this one. Use the admin client — RLS hides other
  // renters' bookings from the regular client. (DB EXCLUDE still blocks exact overlaps.)
  const bufferMin = Number(venue.buffer_minutes ?? 0)
  if (bufferMin > 0) {
    const winStart = new Date(new Date(startAt).getTime() - bufferMin * 60_000).toISOString()
    const winEnd = new Date(new Date(endAt).getTime() + bufferMin * 60_000).toISOString()
    const { data: clashes } = await createAdminClient()
      .from('bookings')
      .select('id')
      .eq('venue_id', venueId)
      .in('status', ['PENDING', 'CONFIRMED'])
      .lt('start_at', winEnd)
      .gt('end_at', winStart)
    if (clashes && clashes.length > 0) {
      throw new Error('This time is too close to another booking — please allow for the venue’s turnaround time.')
    }
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

  // Notify both parties (fire-and-forget — never blocks the checkout redirect)
  const { data: renter } = await supabase
    .from('users')
    .select('first_name')
    .eq('id', user.id)
    .single()

  const locale = getEmailLocale()
  const emailBase = {
    venueTitle: venue.title,
    startAt,
    endAt,
    totalPrice,
    bookingId: booking.id,
    locale,
  }

  await Promise.all([
    user.email
      ? sendBookingRequestedToRenter({ ...emailBase, to: user.email, recipientName: renter?.first_name })
      : null,
    host?.email
      ? sendBookingRequestedToHost({
          ...emailBase,
          to: host.email,
          recipientName: host.first_name,
          counterpartName: renter?.first_name,
        })
      : null,
  ])

  redirect(`/venues/${venueId}/checkout?bookingId=${booking.id}`)
}

export async function acceptBooking(bookingId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')

  // Verify host ownership via venues join
  const { data: booking } = await supabase
    .from('bookings')
    .select('id, venue_id, status, start_at, end_at, total_price, users:renter_id(email, first_name), venues(host_id, title)')
    .eq('id', bookingId)
    .single()

  const venueData = booking?.venues as unknown as { host_id: string; title: string } | { host_id: string; title: string }[] | null
  const venueShape = Array.isArray(venueData) ? venueData[0] : venueData
  const venueHostId = venueShape?.host_id

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

  const renter = Array.isArray(booking.users) ? booking.users[0] : booking.users
  if (renter?.email) {
    await sendBookingAcceptedToRenter({
      to: renter.email,
      recipientName: renter.first_name,
      venueTitle: venueShape?.title ?? '',
      startAt: booking.start_at,
      endAt: booking.end_at,
      totalPrice: Number(booking.total_price),
      bookingId,
      locale: getEmailLocale(),
    })
  }

  // Push the confirmed booking to the host's Google Calendar (fire-and-forget).
  await syncConfirmedBooking(bookingId)

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
    .select('id, venue_id, status, start_at, end_at, users:renter_id(email, first_name), venues(host_id, title)')
    .eq('id', bookingId)
    .single()

  const venueData2 = booking?.venues as unknown as { host_id: string; title: string } | { host_id: string; title: string }[] | null
  const venueShape2 = Array.isArray(venueData2) ? venueData2[0] : venueData2
  const venueHostId = venueShape2?.host_id

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

  const declinedRenter = Array.isArray(booking.users) ? booking.users[0] : booking.users
  if (declinedRenter?.email) {
    await sendBookingDeclinedToRenter({
      to: declinedRenter.email,
      recipientName: declinedRenter.first_name,
      venueTitle: venueShape2?.title ?? '',
      startAt: booking.start_at,
      endAt: booking.end_at,
      bookingId,
      locale: getEmailLocale(),
    })
  }

  // Remove any synced calendar event (declined bookings were never confirmed,
  // so this is usually a no-op — kept for safety).
  await removeBookingEvent(bookingId)

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
    .select('id, renter_id, status, start_at, end_at, total_price, renter:renter_id(first_name), venues(cancellation_policy, title, host_id, users:host_id(email, first_name))')
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

  // Notify the host that the renter cancelled
  const host = Array.isArray((venueShape as { users?: unknown })?.users)
    ? (venueShape as { users: { email?: string; first_name?: string }[] }).users[0]
    : (venueShape as { users?: { email?: string; first_name?: string } } | null)?.users
  const cancellingRenter = Array.isArray(booking.renter) ? booking.renter[0] : booking.renter
  if (host?.email) {
    await sendBookingCancelledToHost({
      to: host.email,
      recipientName: host.first_name,
      counterpartName: cancellingRenter?.first_name,
      venueTitle: (venueShape as { title?: string } | null)?.title ?? '',
      startAt: booking.start_at,
      endAt: booking.end_at,
      bookingId,
      locale: getEmailLocale(),
    })
  }

  // Remove the booking's event from the host's Google Calendar (fire-and-forget).
  await removeBookingEvent(bookingId)

  revalidatePath('/bookings')
  revalidatePath(`/bookings/${bookingId}`)
  revalidatePath('/host/bookings')
}
