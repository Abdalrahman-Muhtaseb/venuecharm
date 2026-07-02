'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { List, LayoutGrid } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Locale } from '@/lib/i18n'

type DataView = 'table' | 'card'

interface ViewSwitcherProps {
  /** localStorage key the preference is remembered under — keep distinct per page. */
  storageKey: string
  locale: Locale
  table: ReactNode
  card: ReactNode
  /** Extra controls rendered on the left side of the toolbar row (e.g. search bar, add button). */
  toolbar?: ReactNode
  /** Rendered only while the card view is active, positioned beside the view toggle on the right.
   *  Use this for sort controls that substitute for the table's clickable column headers. */
  cardOnlyControl?: ReactNode
}

/** Table/card toggle backed by local state (not the URL) so switching is instant —
 *  both layouts render from data the server already fetched, no refetch needed.
 *  The choice is remembered in localStorage so it survives pagination/reloads. */
export function ViewSwitcher({
  storageKey,
  locale,
  table,
  card,
  toolbar,
  cardOnlyControl,
}: ViewSwitcherProps) {
  const [view, setView] = useState<DataView>('table')

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey)
    if (stored === 'table' || stored === 'card') setView(stored)
  }, [storageKey])

  const choose = (next: DataView) => {
    setView(next)
    window.localStorage.setItem(storageKey, next)
  }

  const isHe = locale === 'he'
  const btnClass = (active: boolean) =>
    cn(
      'flex h-8 w-8 items-center justify-center rounded-md transition-colors',
      active
        ? 'bg-background text-foreground shadow-sm'
        : 'text-muted-foreground hover:text-foreground',
    )

  return (
    <div>
      {/* Toolbar row */}
      <div
        className={cn(
          'mb-4 flex flex-wrap items-center gap-3',
          toolbar ? 'justify-between' : 'justify-end',
        )}
      >
        {/* Left: search / action buttons */}
        {toolbar && (
          <div className="flex flex-wrap items-center gap-2">{toolbar}</div>
        )}

        {/* Right: optional card-only sort control + view toggle */}
        <div className="flex items-center gap-2">
          {view === 'card' && cardOnlyControl}
          <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-1">
            <button
              type="button"
              aria-label={isHe ? 'תצוגת טבלה' : 'Table view'}
              aria-pressed={view === 'table'}
              onClick={() => choose('table')}
              className={btnClass(view === 'table')}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label={isHe ? 'תצוגת כרטיסים' : 'Card view'}
              aria-pressed={view === 'card'}
              onClick={() => choose('card')}
              className={btnClass(view === 'card')}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {view === 'card' ? card : table}
    </div>
  )
}
