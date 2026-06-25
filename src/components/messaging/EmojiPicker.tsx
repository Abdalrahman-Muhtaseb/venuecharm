'use client'

import { useEffect, useRef, useState } from 'react'
import { Smile } from 'lucide-react'

const EMOJIS = [
  '😀', '😁', '😂', '🤣', '😊', '😍', '😘', '😎',
  '🤩', '🥳', '🙂', '😉', '😇', '🤔', '😅', '😴',
  '😢', '😭', '😡', '👍', '👎', '🙏', '👏', '🙌',
  '💪', '🔥', '✨', '🎉', '❤️', '🧡', '💛', '💚',
  '💙', '💜', '💯', '✅', '❌', '👋', '🤝', '📍',
  '📅', '🕐', '💰', '🏠', '🎂', '🍾', '🥂', '☕',
]

export function EmojiPicker({ onSelect, label }: { onSelect: (emoji: string) => void; label: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={label}
        aria-expanded={open}
        className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Smile className="h-5 w-5" aria-hidden="true" />
      </button>
      {open && (
        <div className="absolute bottom-12 start-0 z-50 grid max-h-56 w-72 grid-cols-8 gap-1 overflow-y-auto rounded-xl border bg-background p-2 shadow-xl">
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => { onSelect(e); setOpen(false) }}
              className="flex h-7 w-7 items-center justify-center rounded text-lg hover:bg-muted"
            >
              {e}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
