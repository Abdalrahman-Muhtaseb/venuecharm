import { cookies } from 'next/headers'
import { HostPanelHeaderBar } from '@/components/layout/HostPanelHeaderBar'
import { defaultLocale, isLocale, localeCookieName, type Locale } from '@/lib/i18n'

/**
 * Sticky page-title header + padded, scrollable container for the standard host
 * pages (dashboard, listings, bookings, calendar, payouts, onboarding, notifications).
 * The host shell's <main> is unpadded/full-height so full-bleed pages like
 * /host/messages can fill it; this route group adds the page chrome back for
 * everything else.
 */
export default function HostPanelLayout({ children }: { children: React.ReactNode }) {
  const locale: Locale = isLocale(cookies().get(localeCookieName)?.value)
    ? (cookies().get(localeCookieName)!.value as Locale)
    : defaultLocale

  return (
    <div className="flex h-full flex-col">
      <HostPanelHeaderBar locale={locale} />
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      </div>
    </div>
  )
}
