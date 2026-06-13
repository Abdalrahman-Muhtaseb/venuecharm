import { VenueCard, type VenueCardProps } from './VenueCard'

interface VenueGridProps {
  venues: Omit<VenueCardProps, 'locale' | 'highlighted' | 'priority' | 'onHover' | 'onHoverEnd'>[]
  locale: VenueCardProps['locale']
  showStatus?: boolean
  highlightedId?: string
  /** 'default' = up to 4 cols (homepage); 'compact' = up to 3 cols (search with map) */
  columns?: 'default' | 'compact'
  /** How many cards at the top of the list should eagerly load their image (above fold) */
  priorityCount?: number
  /** IDs of venues the current user has saved to favourites */
  favoritedIds?: Set<string>
  onCardHover?: (id: string | null) => void
}

export function VenueGrid({
  venues,
  locale,
  showStatus = false,
  highlightedId,
  columns = 'default',
  priorityCount = 4,
  favoritedIds,
  onCardHover,
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
      ? 'grid grid-cols-1 gap-4 sm:grid-cols-2'
      : 'grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'

  return (
    <div className={gridClass}>
      {venues.map((venue, index) => (
        <VenueCard
          key={venue.id}
          {...venue}
          locale={locale}
          showStatus={showStatus}
          highlighted={highlightedId === venue.id}
          priority={index < priorityCount}
          isFavorited={favoritedIds?.has(venue.id)}
          onHover={onCardHover ? () => onCardHover(venue.id) : undefined}
          onHoverEnd={onCardHover ? () => onCardHover(null) : undefined}
        />
      ))}
    </div>
  )
}
