import { cookies } from 'next/headers'
import { NotificationsPanel } from '@/components/layout/NotificationsPanel'
import { defaultLocale, isLocale, localeCookieName, type Locale } from '@/lib/i18n'

export const dynamic = 'force-dynamic'

export default function HostNotificationsPage() {
  const locale: Locale = isLocale(cookies().get(localeCookieName)?.value)
    ? (cookies().get(localeCookieName)!.value as Locale)
    : defaultLocale

  return <NotificationsPanel locale={locale} hideHeading />
}
