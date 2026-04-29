import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { Toaster } from '@/components/ui/sonner'
import { defaultLocale, getDirection, isLocale, localeCookieName } from '@/lib/i18n'
import './globals.css'

export const metadata: Metadata = {
  title: 'VenueCharm',
  description: 'VenueCharm marketplace for event venues in Israel.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies()
  const persistedLocale = cookieStore.get(localeCookieName)?.value
  const locale = isLocale(persistedLocale) ? persistedLocale : defaultLocale
  const direction = getDirection(locale)

  return (
    <html lang={locale} dir={direction} suppressHydrationWarning>
      <body>
        {children}
        <Toaster richColors position={direction === 'rtl' ? 'bottom-left' : 'bottom-right'} />
      </body>
    </html>
  )
}
