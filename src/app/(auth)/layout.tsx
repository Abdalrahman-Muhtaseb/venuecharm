import { cookies } from 'next/headers'
import { AuthShell } from '@/components/layout/AuthShell'
import { defaultLocale, isLocale, localeCookieName } from '@/lib/i18n'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const locale = isLocale(cookies().get(localeCookieName)?.value)
    ? (cookies().get(localeCookieName)!.value as 'he' | 'en')
    : defaultLocale

  return <AuthShell locale={locale}>{children}</AuthShell>
}
