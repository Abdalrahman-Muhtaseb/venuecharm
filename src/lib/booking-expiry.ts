import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe, isStripeConfigured } from '@/lib/stripe'
import { sendBookingDeclinedToRenter } from '@/lib/email'
import { notify } from '@/lib/notifications'
import { defaultLocale } from '@/lib/i18n'

/**
 * How long a host has to accept/decline a request before it auto-expires.
 * Also the point at which Stripe auto-voids a manual-capture authorization, so
 * expiring here keeps our DB in sync with the released card hold.
 */
const HOST_RESPONSE_WINDOW_DAYS = 7

type PaymentRef = { stripe_payment_intent_id: string | null } | null

interface OverdueBooking {
  id: string
  start_at: string
  end_at: string
  renter_id: string
  users: { email: string | null; first_name: string | null } | { email: string | null; first_name: string | null }[] | null
  venues: { title: string | null } | { title: string | null }[] | null
  payments: PaymentRef | PaymentRef[]
}

function first<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

/**
 * Auto-declines PENDING bookings the host never answered: either the event start
 * time has already passed, or the request has waited longer than the response
 * window. This is the unattended equivalent of `declineBooking` — same outcome
 * (status REJECTED, held authorization released, renter emailed + notified).
 *
 * No money is ever captured while PENDING, so the Stripe authorization is simply
 * voided — there is no refund or cancellation-policy math to apply here.
 *
 * Idempotent: the status is claimed atomically, so a concurrent host
 * accept/decline wins the race and that booking is skipped.
 */
export async function expireOverdueBookings(): Promise<{ expired: number }> {
  const admin = createAdminClient()
  const now = new Date()
  const windowCutoff = new Date(now.getTime() - HOST_RESPONSE_WINDOW_DAYS * 24 * 60 * 60 * 1000)

  const { data, error } = await admin
    .from('bookings')
    .select(
      'id, start_at, end_at, renter_id, users:renter_id(email, first_name), venues(title), payments(stripe_payment_intent_id)',
    )
    .eq('status', 'PENDING')
    .or(`start_at.lte.${now.toISOString()},created_at.lte.${windowCutoff.toISOString()}`)

  if (error) throw new Error(error.message)

  const bookings = (data ?? []) as unknown as OverdueBooking[]
  let expired = 0

  for (const booking of bookings) {
    // Atomically claim the row — guards against a host accepting/declining at the
    // same moment (their update flips status away from PENDING, so 0 rows match).
    const { data: claimed, error: claimError } = await admin
      .from('bookings')
      .update({ status: 'REJECTED' })
      .eq('id', booking.id)
      .eq('status', 'PENDING')
      .select('id')

    if (claimError || !claimed || claimed.length === 0) continue
    expired += 1

    // Release the held authorization so the renter's money is freed.
    if (isStripeConfigured()) {
      const piId = first(booking.payments)?.stripe_payment_intent_id
      if (piId) {
        try {
          await stripe.paymentIntents.cancel(piId)
          await admin.from('payments').update({ status: 'REFUNDED' }).eq('booking_id', booking.id)
        } catch {
          // PI may already be cancelled or auto-voided by Stripe — nothing to do.
        }
      }
    }

    const renter = first(booking.users)
    const venue = first(booking.venues)
    if (renter?.email) {
      await sendBookingDeclinedToRenter({
        to: renter.email,
        recipientName: renter.first_name,
        venueTitle: venue?.title ?? '',
        startAt: booking.start_at,
        endAt: booking.end_at,
        bookingId: booking.id,
        locale: defaultLocale,
      })
    }

    await notify({
      userId: booking.renter_id,
      type: 'booking_declined',
      data: { venueTitle: venue?.title ?? undefined },
      link: `/bookings/${booking.id}`,
    })
  }

  return { expired }
}
