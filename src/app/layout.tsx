import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { AuthModalProvider } from '@/components/auth/AuthModalProvider'
import { UserProvider, type CurrentUser } from '@/components/auth/UserProvider'
import { createClient } from '@/lib/supabase/server'
import { defaultLocale, getDirection, isLocale, localeCookieName } from '@/lib/i18n'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  title: 'VenueCharm',
  description: 'VenueCharm marketplace for event venues in Israel.',
}

async function getInitialUser(): Promise<CurrentUser | null> {
  const supabase = createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) return null
  const { data: profile } = await supabase
    .from('users')
    .select('email, avatar_url, role, first_name, last_name')
    .eq('id', data.user.id)
    .single()
  return {
    id: data.user.id,
    email: profile?.email ?? data.user.email ?? '',
    avatar_url: profile?.avatar_url,
    role: profile?.role,
    first_name: profile?.first_name,
    last_name: profile?.last_name,
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies()
  const persistedLocale = cookieStore.get(localeCookieName)?.value
  const locale = isLocale(persistedLocale) ? persistedLocale : defaultLocale
  const direction = getDirection(locale)
  const initialUser = await getInitialUser()

  return (
    <html lang={locale} dir={direction} suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <UserProvider initialUser={initialUser}>
            <AuthModalProvider locale={locale}>
              {children}
            </AuthModalProvider>
          </UserProvider>
          <Toaster richColors position={direction === 'rtl' ? 'bottom-left' : 'bottom-right'} />
        </ThemeProvider>
      </body>
    </html>
  )
}
