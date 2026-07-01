'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'
import { notify } from '@/lib/notifications'

/** First name of the message sender, for the recipient's notification. */
async function senderName(supabase: SupabaseClient, userId: string): Promise<string | null> {
  const { data } = await supabase.from('users').select('first_name').eq('id', userId).single()
  return data?.first_name ?? null
}

/**
 * Thread path for a participant. A participant viewing as the HOST side of a
 * conversation lives in the host portal (/host/messages); the renter side uses
 * the shared inbox (/messages). Based on position in the conversation, not the
 * user's global role (a host can be the renter on someone else's venue).
 */
function threadLink(conversationId: string, hostSide: boolean): string {
  return `${hostSide ? '/host/messages' : '/messages'}/${conversationId}`
}

async function requireUser() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, user }
}

async function findOrCreateConversation(
  supabase: SupabaseClient,
  args: { venueId: string; bookingId?: string | null; renterId: string; hostId: string },
): Promise<string> {
  const { venueId, bookingId, renterId, hostId } = args

  let lookup = supabase
    .from('conversations')
    .select('id')
    .eq('renter_id', renterId)
    .eq('host_id', hostId)

  lookup = bookingId
    ? lookup.eq('booking_id', bookingId)
    : lookup.eq('venue_id', venueId).is('booking_id', null)

  const { data: existing } = await lookup.maybeSingle()
  if (existing) return existing.id

  const { data: created, error } = await supabase
    .from('conversations')
    .insert({
      venue_id: venueId,
      booking_id: bookingId ?? null,
      renter_id: renterId,
      host_id: hostId,
    })
    .select('id')
    .single()

  if (error || !created) throw new Error(error?.message ?? 'Could not start conversation.')
  return created.id
}

/**
 * Renter contacts a host about a venue (pre-booking inquiry). We do NOT create a
 * conversation here — that only happens once the first message is actually sent
 * (see `sendFirstMessage`), so an accidental click never leaves an empty thread
 * in either inbox. Resume an existing thread if one already exists.
 */
export async function startVenueConversation(venueId: string) {
  const { supabase, user } = await requireUser()

  const { data: venue } = await supabase
    .from('venues')
    .select('id, host_id')
    .eq('id', venueId)
    .single()

  if (!venue) throw new Error('Venue not found.')
  if (venue.host_id === user.id) throw new Error('You cannot message your own venue.')

  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('renter_id', user.id)
    .eq('host_id', venue.host_id)
    .eq('venue_id', venue.id)
    .is('booking_id', null)
    .maybeSingle()

  if (existing) redirect(`/messages/${existing.id}`)
  redirect(`/messages/new?venue=${venue.id}`)
}

/**
 * Create the venue conversation lazily and post the first message in one go, then
 * open the real thread. Called from the draft composer (`/messages/new`).
 */
export async function sendFirstMessage(venueId: string, content: string) {
  const { supabase, user } = await requireUser()

  const text = content.trim()
  if (!text) throw new Error('Message cannot be empty.')
  if (text.length > 2000) throw new Error('Message is too long.')

  const { data: venue } = await supabase
    .from('venues')
    .select('id, host_id')
    .eq('id', venueId)
    .single()

  if (!venue) throw new Error('Venue not found.')
  if (venue.host_id === user.id) throw new Error('You cannot message your own venue.')

  const id = await findOrCreateConversation(supabase, {
    venueId: venue.id,
    renterId: user.id,
    hostId: venue.host_id,
  })

  const { error } = await supabase
    .from('messages')
    .insert({ conversation_id: id, sender_id: user.id, content: text })

  if (error) throw new Error(error.message)

  // Recipient is the host → deep-link them into the host portal inbox.
  await notify({
    userId: venue.host_id,
    type: 'message',
    data: { actorName: await senderName(supabase, user.id) },
    link: threadLink(id, true),
  })

  revalidatePath('/messages')
  redirect(`/messages/${id}`)
}

/** Either party opens (or resumes) the conversation tied to a booking. */
export async function startBookingConversation(bookingId: string) {
  const { supabase, user } = await requireUser()

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, renter_id, venue_id, venues(host_id)')
    .eq('id', bookingId)
    .single()

  if (!booking) throw new Error('Booking not found.')

  const venue = Array.isArray(booking.venues) ? booking.venues[0] : booking.venues
  const hostId = (venue as { host_id: string } | null)?.host_id
  if (!hostId) throw new Error('Venue not found.')

  if (user.id !== booking.renter_id && user.id !== hostId) {
    throw new Error('You are not part of this booking.')
  }

  const id = await findOrCreateConversation(supabase, {
    venueId: booking.venue_id,
    bookingId: booking.id,
    renterId: booking.renter_id,
    hostId,
  })

  // Keep each party in their own context: the host opens it inside the portal.
  redirect(threadLink(id, user.id === hostId))
}

export async function sendMessage(conversationId: string, content: string) {
  const { supabase, user } = await requireUser()

  const text = content.trim()
  if (!text) throw new Error('Message cannot be empty.')
  if (text.length > 2000) throw new Error('Message is too long.')

  // RLS also enforces participation; this gives a clearer error.
  const { data: convo } = await supabase
    .from('conversations')
    .select('id, renter_id, host_id')
    .eq('id', conversationId)
    .single()

  if (!convo || (convo.renter_id !== user.id && convo.host_id !== user.id)) {
    throw new Error('You are not part of this conversation.')
  }

  const { data: inserted, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: text,
    })
    .select('id, sender_id, content, created_at')
    .single()

  if (error || !inserted) throw new Error(error?.message ?? 'Could not send message.')

  const recipientId = convo.renter_id === user.id ? convo.host_id : convo.renter_id
  const link = threadLink(conversationId, recipientId === convo.host_id)

  // Only notify once per conversation per unread session — if the recipient
  // already has an unread message notification for this thread, skip it so
  // rapid-fire messages don't flood their notification panel.
  const { count: existingUnread } = await createAdminClient()
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', recipientId)
    .eq('type', 'message')
    .eq('is_read', false)
    .eq('link', link)

  if (!existingUnread) {
    await notify({
      userId: recipientId,
      type: 'message',
      data: { actorName: await senderName(supabase, user.id) },
      link,
    })
  }

  revalidatePath('/messages')
  return inserted as { id: string; sender_id: string; content: string; created_at: string }
}

/** Mark every inbound (not-mine) message in a conversation as read. */
export async function markConversationRead(conversationId: string) {
  const { supabase, user } = await requireUser()

  await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('conversation_id', conversationId)
    .neq('sender_id', user.id)
    .eq('is_read', false)

  revalidatePath('/messages')
}
