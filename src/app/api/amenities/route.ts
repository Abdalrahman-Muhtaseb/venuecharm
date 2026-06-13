import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DEFAULT_AMENITIES, type Amenity } from '@/lib/amenities'

export async function GET() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('amenities')
    .select('key, label_en, label_he, category, icon, sort_order, is_active')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  // Fall back to the static list if the table is missing/empty so the UI never
  // ends up with no amenities to show.
  const amenities: Amenity[] = !error && data && data.length > 0 ? (data as Amenity[]) : DEFAULT_AMENITIES
  return NextResponse.json({ amenities })
}
