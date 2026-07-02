'use client'

import { useRouter } from 'next/navigation'
import { localeCookieName, locales, type Locale } from '@/lib/i18n'
import { cn } from '@/lib/utils'

export function LangToggle({ locale }: { locale: Locale }) {
  const router = useRouter()

  function changeLocale(next: Locale) {
    document.cookie = `${localeCookieName}=${next}; path=/; max-age=31536000`
    router.refresh()
  }

  return (
    <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-0.5">
      {locales.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => changeLocale(l)}
          className={cn(
            'flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors',
            locale === l
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {l === 'he' ? 'עברית' : 'English'}
        </button>
      ))}
    </div>
  )
}
