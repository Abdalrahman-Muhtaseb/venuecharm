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
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Amenities</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage the amenities available in the listing form and search filters.
        </p>
      </div>
      <AmenitiesManager initialAmenities={amenities} />
    </div>
  )
}
