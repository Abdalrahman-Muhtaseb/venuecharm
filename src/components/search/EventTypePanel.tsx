'use client'

import { eventTypes } from '@/types/event-types'
import { getDictionary, type Locale } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const OPTIONS = eventTypes.filter((et) => et !== 'OTHER')

interface EventTypePanelProps {
  locale: Locale
  value: string
  onChange: (value: string) => void
}

export function EventTypePanel({ locale, value, onChange }: EventTypePanelProps) {
  const isHe = locale === 'he'
  const labels = getDictionary(locale).rfp.eventTypeOptions

  const chip = (active: boolean) =>
    cn(
      'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
      active
        ? 'border-primary bg-primary text-primary-foreground'
        : 'border-input bg-background text-muted-foreground hover:border-foreground/60 hover:text-foreground',
    )

  return (
    <div>
      <div className="mb-3">
        <p className="text-sm font-semibold text-foreground">{isHe ? 'סוג האירוע' : 'Type of event'}</p>
        <p className="text-xs text-muted-foreground">
          {isHe ? 'מה אתה מתכנן?' : 'What are you planning?'}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => onChange('')} className={chip(value === '')}>
          {isHe ? 'הכל' : 'Any'}
        </button>
        {OPTIONS.map((et) => (
          <button key={et} type="button" onClick={() => onChange(et)} className={chip(value === et)}>
            {labels[et as keyof typeof labels] ?? et}
          </button>
        ))}
      </div>
    </div>
  )
}
