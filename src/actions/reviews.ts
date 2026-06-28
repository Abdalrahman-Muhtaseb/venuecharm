'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { notify } from '@/lib/notifications'

export async function submitReview(
  bookingId: string,
  venueId: string,
  rating: number,
  comment: string,
) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  if (rating < 1 || rating > 5) throw new Error('Rating must be between 1 and 5.')

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, renter_id, status, end_at')
    .eq('id', bookingId)
    .single()

  if (!booking || booking.renter_id !== user.id) throw new Error('Booking not found.')
  const isOver = new Date(booking.end_at) < new Date()
  const canReview = booking.status === 'COMPLETED' || (booking.status === 'CONFIRMED' && isOver)
  if (!canReview) throw new Error('You can only review completed bookings.')

  const { error } = await supabase.from('reviews').insert({
    booking_id: bookingId,
    venue_id: venueId,
    reviewer_id: user.id,
    rating,
    comment: comment.trim() || null,
  })

  if (error) {
    if (error.code === '23505') throw new Error('You already reviewed this booking.')
    throw new Error(error.message)
  }

  // Notify the host that their venue received a review (fire-and-forget)
  const { data: venue } = await supabase
    .from('venues')
    .select('host_id, title')
    .eq('id', venueId)
    .single()
  const { data: reviewer } = await supabase
    .from('users')
    .select('first_name')
    .eq('id', user.id)
    .single()
  if (venue?.host_id) {
    await notify({
      userId: venue.host_id,
      type: 'review',
      data: { venueTitle: venue.title, actorName: reviewer?.first_name, rating },
      link: `/venues/${venueId}`,
    })
  }

  revalidatePath(`/bookings/${bookingId}`)
  revalidatePath(`/venues/${venueId}`)
}
