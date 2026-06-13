'use client'

import { Minus, Plus } from 'lucide-react'

interface GuestsPanelProps {
  isHe: boolean
  value: number
  onChange: (value: number) => void
}

export function GuestsPanel({ isHe, value, onChange }: GuestsPanelProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    if (raw === '') { onChange(0); return }
    const n = parseInt(raw, 10)
    if (!Number.isNaN(n)) onChange(Math.min(10000, Math.max(0, n)))
  }

  return (
    <div>
      <div className="mb-4">
        <p className="text-sm font-semibold text-foreground">{isHe ? 'אורחים' : 'Guests'}</p>
        <p className="text-xs text-muted-foreground">
          {isHe ? 'כמה משתתפים באירוע?' : 'How many attendees?'}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          disabled={value <= 0}
          aria-label={isHe ? 'הפחת אורח' : 'Decrease guests'}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-input text-muted-foreground transition-colors hover:border-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Minus className="h-4 w-4" aria-hidden="true" />
        </button>

        <input
          type="number"
          min="0"
          max="10000"
          value={value === 0 ? '' : String(value)}
          onChange={handleInputChange}
          placeholder="0"
          aria-label={isHe ? 'מספר אורחים' : 'Number of guests'}
          className="min-w-0 flex-1 rounded-xl border border-input bg-background px-3 py-2 text-center text-sm font-medium tabular-nums text-foreground outline-none focus:ring-2 focus:ring-ring [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />

        <button
          type="button"
          onClick={() => onChange(Math.min(10000, value + 1))}
          disabled={value >= 10000}
          aria-label={isHe ? 'הוסף אורח' : 'Increase guests'}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-input text-muted-foreground transition-colors hover:border-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {value > 0 && (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          {isHe ? `${value.toLocaleString()} אורחים לאירוע` : `${value.toLocaleString()} guests for your event`}
        </p>
      )}
    </div>
  )
}
