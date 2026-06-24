'use client'

import { eventTypes } from '@/types/event-types'
import { getDictionary, type Locale } from '@/lib/i18n'

interface EventTypesPickerProps {
  locale: Locale
  selected: string[]
  onChange: (eventTypes: string[]) => void
}

// "OTHER" is an RFP-side fallback, not something a host would advertise.
const SELECTABLE = eventTypes.filter((t) => t !== 'OTHER')

export function EventTypesPicker({ locale, selected, onChange }: EventTypesPickerProps) {
  const labels = getDictionary(locale).rfp.eventTypeOptions

  const toggle = (key: string) =>
    onChange(selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key])

  return (
    <div className="flex flex-wrap gap-2">
      {SELECTABLE.map((type) => {
        const active = selected.includes(type)
        return (
          <button
            key={type}
            type="button"
            aria-pressed={active}
            onClick={() => toggle(type)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              active
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background hover:border-primary/60 hover:bg-muted/50'
            }`}
          >
            {labels[type]}
          </button>
        )
      })}
    </div>
  )
}
