import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { LanguageSwitcher } from '@/components/language-switcher'
import { defaultLocale, getDirection, isLocale, localeCookieName } from '@/lib/i18n'
import './globals.css'

export const metadata: Metadata = {
  title: 'VenueCharm',
  description: 'VenueCharm marketplace for event venues in Israel.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = cookies()
  const persistedLocale = cookieStore.get(localeCookieName)?.value
  const locale = isLocale(persistedLocale) ? persistedLocale : defaultLocale
  const direction = getDirection(locale)

  return (
    <html lang={locale} dir={direction} suppressHydrationWarning>
      <body>
        <div className="fixed end-4 top-4 z-50">
          <LanguageSwitcher currentLocale={locale} />
        </div>
        {children}
      </body>
    </html>
  )
}
