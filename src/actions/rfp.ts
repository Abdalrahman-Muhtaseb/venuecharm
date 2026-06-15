'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createRfpSchema } from '@/types/rfp'
import { rankVenues, type RfpCriteria, type ScorableVenue } from '@/lib/rfp-matching'

const MAX_MATCHES = 20

/** Score every ACTIVE venue against the criteria and persist the top matches. */
async function generateMatches(
  supabase: SupabaseClient,
  rfpId: string,
  criteria: RfpCriteria,
) {
  const { data: venues } = await supabase
    .from('venues')
    .select('id, capacity, price_per_hour, price_per_day, amenities')
    .eq('status', 'ACTIVE')

  const scorable: ScorableVenue[] = (venues ?? []).map((v) => ({
    id: v.id as string,
    capacity: Number(v.capacity),
    price_per_hour: v.price_per_hour != null ? Number(v.price_per_hour) : null,
    price_per_day: v.price_per_day != null ? Number(v.price_per_day) : null,
    amenities: Array.isArray(v.amenities) ? (v.amenities as string[]) : [],
  }))

  const ranked = rankVenues(criteria, scorable, MAX_MATCHES)

  // Always rebuild from scratch so re-runs stay consistent.
  await supabase.from('rfp_matches').delete().eq('rfp_id', rfpId)
  if (ranked.length === 0) return

  const { error } = await supabase
    .from('rfp_matches')
    .insert(ranked.map((r) => ({ rfp_id: rfpId, venue_id: r.venueId, score: r.score })))

  if (error) throw new Error(error.message)
}

export async function createRfp(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const parsed = createRfpSchema.parse({
    eventType: (formData.get('eventType') as string) || 'OTHER',
    eventDate: formData.get('eventDate') || undefined,
    capacity: formData.get('capacity'),
    budget: formData.get('budget'),
    description: formData.get('description') || undefined,
  })

  const amenitiesStr = formData.get('amenities')
  const amenities =
    typeof amenitiesStr === 'string' && amenitiesStr.trim()
      ? amenitiesStr.split(',').filter(Boolean)
      : []

  const { data: rfp, error } = await supabase
    .from('rfps')
    .insert({
      renter_id: user.id,
      event_type: parsed.eventType,
      event_date: parsed.eventDate ?? null,
      capacity: parsed.capacity,
      budget: parsed.budget,
      description: parsed.description ?? null,
      amenities,
    })
    .select('id')
    .single()

  if (error || !rfp) throw new Error(error?.message ?? 'Could not create request.')

  await generateMatches(supabase, rfp.id, {
    capacity: parsed.capacity,
    budget: parsed.budget,
    amenities,
  })

  revalidatePath('/rfp')
  redirect(`/rfp/${rfp.id}`)
}

export async function deleteRfp(rfpId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('rfps')
    .delete()
    .eq('id', rfpId)
    .eq('renter_id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/rfp')
}
