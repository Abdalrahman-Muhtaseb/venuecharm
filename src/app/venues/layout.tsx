import { cookies } from 'next/headers'
import { PublicNavbar } from '@/components/layout/PublicNavbar'
import { Footer } from '@/components/layout/Footer'
import { defaultLocale, isLocale, localeCookieName, type Locale } from '@/lib/i18n'

export default function VenuesLayout({ children }: { children: React.ReactNode }) {
  const locale: Locale = isLocale(cookies().get(localeCookieName)?.value)
    ? (cookies().get(localeCookieName)!.value as Locale)
    : defaultLocale

  return (
    <div className="flex min-h-screen flex-col">
      <PublicNavbar locale={locale} />
      <main className="flex-1">{children}</main>
      <Footer locale={locale} />
    </div>
  )
}
