import { cookies } from 'next/headers'
import { AdminPanelHeaderBar } from '@/components/admin/AdminPanelHeaderBar'
import { defaultLocale, isLocale, localeCookieName, type Locale } from '@/lib/i18n'

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const locale: Locale = isLocale(cookies().get(localeCookieName)?.value)
    ? (cookies().get(localeCookieName)!.value as Locale)
    : defaultLocale

  return (
    <div className="flex h-full flex-col">
      <AdminPanelHeaderBar locale={locale} />
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      </div>
    </div>
  )
}
