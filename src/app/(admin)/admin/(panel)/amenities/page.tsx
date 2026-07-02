import { createAdminClient } from '@/lib/supabase/admin'
import { AmenitiesManager } from '@/components/admin/AmenitiesManager'
import type { Amenity } from '@/lib/amenities'

export const dynamic = 'force-dynamic'

type AmenityRow = Amenity & { id: string }

export default async function AdminAmenitiesPage() {
  const db = createAdminClient()
  const { data } = await db
    .from('amenities')
    .select('id, key, label_en, label_he, category, icon, sort_order, is_active')
    .order('sort_order', { ascending: true })

  const amenities = (data ?? []) as AmenityRow[]

  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">
        Manage the amenity catalog used in listing forms and search filters.
        Import a CSV to bulk-add or update amenities — existing keys are updated, new keys are inserted.
      </p>
      <AmenitiesManager initialAmenities={amenities} />
    </div>
  )
}
