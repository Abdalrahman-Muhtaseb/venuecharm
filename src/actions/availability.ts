'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

async function requireVenueHost(venueId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')

  const { data: venue } = await supabase
    .from('venues')
    .select('host_id')
    .eq('id', venueId)
    .single()

  if (!venue || venue.host_id !== user.id) throw new Error('Not authorised.')
  return supabase
}

export async function setAvailability(venueId: string, date: string, isAvailable: boolean) {
  const supabase = await requireVenueHost(venueId)

  const { error } = await supabase
    .from('availability')
    .upsert({ venue_id: venueId, date, is_available: isAvailable }, { onConflict: 'venue_id,date' })

  if (error) throw new Error(error.message)

  revalidatePath('/host/calendar')
  revalidatePath(`/host/listings/${venueId}/edit`)
}

/** Block a single hourly slot on a date (host only). */
export async function blockTimeSlot(venueId: string, date: string, startTime: string, endTime: string) {
  const supabase = await requireVenueHost(venueId)

  const { error } = await supabase
    .from('availability_blocks')
    .upsert(
      { venue_id: venueId, date, start_time: startTime, end_time: endTime },
      { onConflict: 'venue_id,date,start_time' },
    )

  if (error) throw new Error(error.message)

  revalidatePath('/host/calendar')
  revalidatePath(`/venues/${venueId}`)
}

/** Free a previously blocked hourly slot (host only). */
export async function unblockTimeSlot(venueId: string, date: string, startTime: string) {
  const supabase = await requireVenueHost(venueId)

  const { error } = await supabase
    .from('availability_blocks')
    .delete()
    .eq('venue_id', venueId)
    .eq('date', date)
    .eq('start_time', startTime)

  if (error) throw new Error(error.message)

  revalidatePath('/host/calendar')
  revalidatePath(`/venues/${venueId}`)
}
