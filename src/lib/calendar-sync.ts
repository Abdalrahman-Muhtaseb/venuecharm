import { createAdminClient } from '@/lib/supabase/admin'
import {
  isGoogleCalendarConfigured,
  createEvent,
  deleteEvent,
} from '@/lib/google-calendar'

/**
 * Fire-and-forget calendar sync, called from the booking actions. Every path is
 * wrapped so a Calendar/API failure can NEVER bubble into the booking flow.
 * Reads happen via the service-role admin client (the connection row holds a
 * refresh-token secret and is unreadable by the API roles).
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

type VenueShape = { host_id: string; title: string; address: string | null; city: string | null }
type RenterShape = { first_name: string | null; last_name: string | null }

function one<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null
  return Array.isArray(v) ? (v[0] ?? null) : v
}

/** Create (once) the host's calendar event for a freshly CONFIRMED booking. */
export async function syncConfirmedBooking(bookingId: string): Promise<void> {
  try {
    if (!isGoogleCalendarConfigured()) return
    const admin = createAdminClient()

    const { data: booking } = await admin
      .from('bookings')
      .select(
        'id, start_at, end_at, google_event_id, venues(host_id, title, address, city), users:renter_id(first_name, last_name)',
      )
      .eq('id', bookingId)
      .single()

    if (!booking || booking.google_event_id) return // missing or already synced
    const venue = one<VenueShape>(booking.venues as unknown as VenueShape | VenueShape[] | null)
    if (!venue) return

    const { data: conn } = await admin
      .from('host_calendar_connections')
      .select('refresh_token, calendar_id, sync_enabled')
      .eq('host_id', venue.host_id)
      .maybeSingle()

    if (!conn || conn.sync_enabled === false || !conn.refresh_token) return

    const renter = one<RenterShape>(booking.users as unknown as RenterShape | RenterShape[] | null)
    const guest = [renter?.first_name, renter?.last_name].filter(Boolean).join(' ').trim()
    const location = [venue.address, venue.city].filter(Boolean).join(', ')

    const eventId = await createEvent(conn.refresh_token, conn.calendar_id ?? 'primary', {
      summary: guest ? `${venue.title} — ${guest}` : venue.title,
      description: `VenueCharm booking${guest ? `\nGuest: ${guest}` : ''}\n${APP_URL}/host/bookings/${bookingId}`,
      location: location || undefined,
      start: booking.start_at,
      end: booking.end_at,
    })

    if (eventId) {
      await admin
        .from('bookings')
        .update({ google_event_id: eventId })
        .eq('id', bookingId)
      await admin
        .from('host_calendar_connections')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('host_id', venue.host_id)
    }
  } catch (e) {
    console.error('calendar sync (confirm) failed:', e)
  }
}

/** Remove the calendar event when a booking is declined or cancelled. */
export async function removeBookingEvent(bookingId: string): Promise<void> {
  try {
    if (!isGoogleCalendarConfigured()) return
    const admin = createAdminClient()

    const { data: booking } = await admin
      .from('bookings')
      .select('google_event_id, venues(host_id)')
      .eq('id', bookingId)
      .single()

    if (!booking?.google_event_id) return
    const venue = one<{ host_id: string }>(
      booking.venues as unknown as { host_id: string } | { host_id: string }[] | null,
    )
    if (!venue) return

    const { data: conn } = await admin
      .from('host_calendar_connections')
      .select('refresh_token, calendar_id')
      .eq('host_id', venue.host_id)
      .maybeSingle()

    if (conn?.refresh_token) {
      await deleteEvent(conn.refresh_token, conn.calendar_id ?? 'primary', booking.google_event_id)
    }

    await admin.from('bookings').update({ google_event_id: null }).eq('id', bookingId)
  } catch (e) {
    console.error('calendar sync (remove) failed:', e)
  }
}
