import { VenueCard, type VenueCardProps } from './VenueCard'

interface VenueGridProps {
  venues: Omit<VenueCardProps, 'locale' | 'highlighted'>[]
  locale: VenueCardProps['locale']
  showStatus?: boolean
  highlightedId?: string
  /** 'default' = up to 4 cols (homepage); 'compact' = up to 3 cols (search with map) */
  columns?: 'default' | 'compact'
}

export function VenueGrid({
  venues,
  locale,
  showStatus = false,
  highlightedId,
  columns = 'default',
}: VenueGridProps) {
  if (venues.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-16 text-center text-muted-foreground">
        <p className="font-medium">
          {locale === 'he' ? 'לא נמצאו מקומות' : 'No venues found'}
        </p>
        <p className="text-sm">
          {locale === 'he' ? 'נסה לשנות את הסינון' : 'Try adjusting your filters'}
        </p>
      </div>
    )
  }

  const gridClass =
    columns === 'compact'
      ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3'
      : 'grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'

  return (
    <div className={gridClass}>
      {venues.map((venue) => (
        <VenueCard
          key={venue.id}
          {...venue}
          locale={locale}
          showStatus={showStatus}
          highlighted={highlightedId === venue.id}
        />
      ))}
    </div>
  )
}
