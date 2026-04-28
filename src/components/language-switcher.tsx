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
    <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 p-1 shadow-sm backdrop-blur">
      {locales.map((locale) => (
        <button
          key={locale}
          type="button"
          onClick={() => handleChange(locale)}
          className={`rounded-full px-3 py-1 text-sm font-semibold transition ${
            currentLocale === locale
              ? 'bg-violet-600 text-white'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          {locale === 'he' ? 'עברית' : 'English'}
        </button>
      ))}
    </div>
  )
}
