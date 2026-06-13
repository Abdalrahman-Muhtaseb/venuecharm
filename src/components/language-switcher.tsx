'use client'

import { localeCookieName, locales, type Locale } from '@/lib/i18n'
import { useRouter } from 'next/navigation'

type LanguageSwitcherProps = {
  currentLocale: Locale
}

export function LanguageSwitcher({ currentLocale }: LanguageSwitcherProps) {
  const router = useRouter()

  const handleChange = (nextLocale: Locale) => {
    document.cookie = `${localeCookieName}=${nextLocale}; path=/; max-age=31536000`
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2 rounded-full border bg-background/90 p-1 shadow-sm backdrop-blur">
      {locales.map((locale) => (
        <button
          key={locale}
          type="button"
          onClick={() => handleChange(locale)}
          className={`rounded-full px-3 py-1 text-sm font-semibold transition ${
            currentLocale === locale
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          {locale === 'he' ? 'עברית' : 'English'}
        </button>
      ))}
    </div>
  )
}
