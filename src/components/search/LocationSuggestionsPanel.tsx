'use client'

import { Navigation, MapPin, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DestinationSuggestion {
  id: string
  kind: 'nearby' | 'city' | 'prediction'
  title: string
  subtitle?: string
  lat?: number
  lng?: number
  placeId?: string
}

const CITY_TILE_COLORS = [
  'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300',
  'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
]

function SuggestionIcon({ item, index }: { item: DestinationSuggestion; index: number }) {
  if (item.kind === 'nearby') {
    return (
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Navigation className="h-5 w-5" aria-hidden="true" />
      </span>
    )
  }
  if (item.kind === 'city') {
    return (
      <span
        className={cn(
          'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
          CITY_TILE_COLORS[index % CITY_TILE_COLORS.length],
        )}
      >
        <Building2 className="h-5 w-5" aria-hidden="true" />
      </span>
    )
  }
  return (
    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
      <MapPin className="h-5 w-5" aria-hidden="true" />
    </span>
  )
}

interface LocationSuggestionsPanelProps {
  items: DestinationSuggestion[]
  header: string
  emptyMessage: string
  listboxId: string
  highlightedIndex: number
  onSelect: (item: DestinationSuggestion) => void
  onHighlight: (index: number) => void
}

export function LocationSuggestionsPanel({
  items,
  header,
  emptyMessage,
  listboxId,
  highlightedIndex,
  onSelect,
  onHighlight,
}: LocationSuggestionsPanelProps) {
  return (
    <div>
      <p className="px-6 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {header}
      </p>

      {items.length === 0 ? (
        <p className="px-6 py-4 text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <ul role="listbox" id={listboxId} className="max-h-[55vh] overflow-y-auto px-3">
          {items.map((item, i) => (
            <li key={item.id} role="option" id={`${listboxId}-opt-${i}`} aria-selected={i === highlightedIndex}>
              <button
                type="button"
                tabIndex={-1}
                onClick={() => onSelect(item)}
                onMouseEnter={() => onHighlight(i)}
                className={cn(
                  'flex w-full items-center gap-4 rounded-2xl px-3 py-2.5 text-start transition-colors duration-150',
                  i === highlightedIndex && 'bg-muted',
                )}
              >
                <SuggestionIcon item={item} index={item.kind === 'city' ? i : 0} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-foreground">{item.title}</span>
                  {item.subtitle && (
                    <span className="block truncate text-xs text-muted-foreground">{item.subtitle}</span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
