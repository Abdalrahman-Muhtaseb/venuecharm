export const LISTING_SORTS = [
  'newest', 'oldest',
  'name_asc', 'name_desc',
  'city_asc', 'city_desc',
  'capacity_asc', 'capacity_desc',
  'price_asc', 'price_desc',
  'status_asc', 'status_desc',
] as const
export type ListingSort = (typeof LISTING_SORTS)[number]

/** Sortable table columns — each maps to a `${field}_asc` / `${field}_desc` sort value. */
export const SORTABLE_FIELDS = ['name', 'city', 'capacity', 'price', 'status'] as const
export type SortableField = (typeof SORTABLE_FIELDS)[number]

export function parseListingSort(value: string | undefined): ListingSort {
  return (LISTING_SORTS as readonly string[]).includes(value ?? '') ? (value as ListingSort) : 'newest'
}

/** Toggles a column's direction: not-yet-active → ascending, active-ascending → descending, else back to ascending. */
export function nextSortFor(field: SortableField, current: ListingSort): ListingSort {
  return current === `${field}_asc` ? `${field}_desc` : `${field}_asc`
}

/** Strips PostgREST filter-syntax characters so user input can't break the `.or()` clause. */
export function sanitizeSearchTerm(q: string): string {
  return q.replace(/[%,()]/g, '').trim()
}

export function applyListingSearch(query: any, q: string) {
  const term = sanitizeSearchTerm(q)
  if (!term) return query
  return query.or(`title.ilike.%${term}%,city.ilike.%${term}%`)
}

export function applyListingSort(query: any, sort: ListingSort) {
  switch (sort) {
    case 'oldest':
      return query.order('created_at', { ascending: true })
    case 'name_asc':
      return query.order('title', { ascending: true })
    case 'name_desc':
      return query.order('title', { ascending: false })
    case 'city_asc':
      return query.order('city', { ascending: true })
    case 'city_desc':
      return query.order('city', { ascending: false })
    case 'capacity_asc':
      return query.order('capacity', { ascending: true })
    case 'capacity_desc':
      return query.order('capacity', { ascending: false })
    case 'price_asc':
      return query.order('price_per_hour', { ascending: true, nullsFirst: false })
    case 'price_desc':
      return query.order('price_per_hour', { ascending: false, nullsFirst: false })
    case 'status_asc':
      return query.order('status', { ascending: true })
    case 'status_desc':
      return query.order('status', { ascending: false })
    default:
      return query.order('created_at', { ascending: false })
  }
}
