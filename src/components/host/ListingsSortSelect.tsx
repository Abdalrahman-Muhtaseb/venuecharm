'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Locale } from '@/lib/i18n'
import type { ListingSort } from '@/lib/host-listing-filters'

/** Card view has no clickable column headers, so it gets this dropdown
 *  instead — same sort options the table's headers offer. */
export function ListingsSortSelect({ locale, sort }: { locale: Locale; sort: ListingSort }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isHe = locale === 'he'

  function onSortChange(next: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', next)
    params.delete('page')
    router.replace(`${pathname}?${params.toString()}`)
  }

  return (
    <Select value={sort} onValueChange={onSortChange}>
      <SelectTrigger className="w-auto min-w-[180px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="newest">{isHe ? 'החדשים ביותר' : 'Newest'}</SelectItem>
        <SelectItem value="oldest">{isHe ? 'הישנים ביותר' : 'Oldest'}</SelectItem>
        <SelectItem value="name_asc">{isHe ? 'שם: א׳-ת׳' : 'Venue: A–Z'}</SelectItem>
        <SelectItem value="name_desc">{isHe ? 'שם: ת׳-א׳' : 'Venue: Z–A'}</SelectItem>
        <SelectItem value="city_asc">{isHe ? 'עיר: א׳-ת׳' : 'City: A–Z'}</SelectItem>
        <SelectItem value="city_desc">{isHe ? 'עיר: ת׳-א׳' : 'City: Z–A'}</SelectItem>
        <SelectItem value="capacity_asc">{isHe ? 'קיבולת: נמוך לגבוה' : 'Capacity: low to high'}</SelectItem>
        <SelectItem value="capacity_desc">{isHe ? 'קיבולת: גבוה לנמוך' : 'Capacity: high to low'}</SelectItem>
        <SelectItem value="price_asc">{isHe ? 'תמחור: נמוך לגבוה' : 'Pricing: low to high'}</SelectItem>
        <SelectItem value="price_desc">{isHe ? 'תמחור: גבוה לנמוך' : 'Pricing: high to low'}</SelectItem>
        <SelectItem value="status_asc">{isHe ? 'סטטוס: א׳-ת׳' : 'Status: A–Z'}</SelectItem>
        <SelectItem value="status_desc">{isHe ? 'סטטוס: ת׳-א׳' : 'Status: Z–A'}</SelectItem>
      </SelectContent>
    </Select>
  )
}
