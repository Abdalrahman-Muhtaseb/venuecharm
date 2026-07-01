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
  /** Extra controls rendered on the same row, before the toggle (e.g. status tabs). */
  toolbar?: ReactNode
  /** Rendered only while the card view is active — e.g. a sort dropdown that
   *  substitutes for the table's clickable column headers. */
  cardOnlyControl?: ReactNode
}

/** Table/card toggle backed by local state (not the URL) so switching is instant —
 *  both layouts render from data the server already fetched, no refetch needed.
 *  The choice is remembered in localStorage so it survives pagination/reloads. */
export function ViewSwitcher({ storageKey, locale, table, card, toolbar, cardOnlyControl }: ViewSwitcherProps) {
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
  const itemClass = (active: boolean) =>
    cn(
      'flex h-9 w-9 items-center justify-center rounded-md transition-colors',
      active ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
    )

  return (
    <div>
      <div className={cn('mb-4 flex flex-wrap items-center gap-3', toolbar ? 'justify-between' : 'justify-end')}>
        <div className="flex flex-wrap items-center gap-2">
          {toolbar}
          {view === 'card' && cardOnlyControl}
        </div>
        <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-1">
          <button
            type="button"
            aria-label={isHe ? 'תצוגת טבלה' : 'Table view'}
            aria-pressed={view === 'table'}
            onClick={() => choose('table')}
            className={itemClass(view === 'table')}
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label={isHe ? 'תצוגת כרטיסים' : 'Card view'}
            aria-pressed={view === 'card'}
            onClick={() => choose('card')}
            className={itemClass(view === 'card')}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>
      {view === 'card' ? card : table}
    </div>
  )
}
