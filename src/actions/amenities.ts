'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

async function requireAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  if (!profile || profile.role !== 'ADMIN') throw new Error('Unauthorized')
}

export interface AmenityInput {
  key: string
  label_en: string
  label_he: string
  category: string
  icon: string
  sort_order: number
  is_active: boolean
}

function clean(input: AmenityInput) {
  return {
    key: input.key.trim(),
    label_en: input.label_en.trim(),
    label_he: input.label_he.trim(),
    category: input.category.trim() || 'Other',
    icon: input.icon.trim() || 'CheckCircle2',
    sort_order: Number.isFinite(input.sort_order) ? Math.trunc(input.sort_order) : 0,
    is_active: !!input.is_active,
  }
}

function revalidate() {
  revalidatePath('/admin/amenities')
  revalidatePath('/venues')
}

export async function createAmenity(input: AmenityInput) {
  await requireAdmin()
  const row = clean(input)
  if (!row.key || !row.label_en || !row.label_he) throw new Error('Key and both labels are required.')
  const { error } = await createAdminClient().from('amenities').insert(row)
  if (error) {
    if (error.code === '23505') throw new Error('An amenity with that key already exists.')
    throw new Error(error.message)
  }
  revalidate()
}

export async function updateAmenity(id: string, input: AmenityInput) {
  await requireAdmin()
  const row = clean(input)
  if (!row.key || !row.label_en || !row.label_he) throw new Error('Key and both labels are required.')
  const { error } = await createAdminClient().from('amenities').update(row).eq('id', id)
  if (error) {
    if (error.code === '23505') throw new Error('An amenity with that key already exists.')
    throw new Error(error.message)
  }
  revalidate()
}

export async function setAmenityActive(id: string, isActive: boolean) {
  await requireAdmin()
  const { error } = await createAdminClient()
    .from('amenities')
    .update({ is_active: isActive })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidate()
}

export async function deleteAmenity(id: string) {
  await requireAdmin()
  const { error } = await createAdminClient().from('amenities').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidate()
}
