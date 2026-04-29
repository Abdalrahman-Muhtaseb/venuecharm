'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function setAvailability(venueId: string, date: string, isAvailable: boolean) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')

  // Verify host owns this venue
  const { data: venue } = await supabase
    .from('venues')
    .select('host_id')
    .eq('id', venueId)
    .single()

  if (!venue || venue.host_id !== user.id) throw new Error('Not authorised.')

  const { error } = await supabase
    .from('availability')
    .upsert({ venue_id: venueId, date, is_available: isAvailable }, { onConflict: 'venue_id,date' })

  if (error) throw new Error(error.message)

  revalidatePath('/host/calendar')
}
