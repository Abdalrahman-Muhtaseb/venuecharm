'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleFavorite(venueId: string): Promise<{ favorited: boolean }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('UNAUTHENTICATED')

  const { data: existing } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('venue_id', venueId)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase.from('favorites').delete().eq('id', existing.id)
    if (error) throw new Error(error.message)
    revalidatePath('/favorites')
    return { favorited: false }
  }

  const { error } = await supabase
    .from('favorites')
    .insert({ user_id: user.id, venue_id: venueId })
  if (error) throw new Error(error.message)
  revalidatePath('/favorites')
  return { favorited: true }
}

export async function getFavoriteVenueIds(): Promise<string[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data } = await supabase
    .from('favorites')
    .select('venue_id')
    .eq('user_id', user.id)
  return (data ?? []).map((r) => r.venue_id as string)
}
