import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { AuthModalProvider } from '@/components/auth/AuthModalProvider'
import { defaultLocale, getDirection, isLocale, localeCookieName } from '@/lib/i18n'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
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
        <ThemeProvider>
          <AuthModalProvider locale={locale}>
            {children}
          </AuthModalProvider>
          <Toaster richColors position={direction === 'rtl' ? 'bottom-left' : 'bottom-right'} />
        </ThemeProvider>
      </body>
    </html>
  )
}
