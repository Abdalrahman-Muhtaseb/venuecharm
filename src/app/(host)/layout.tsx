import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { HostSidebar, HostMobileNav } from '@/components/layout/HostSidebar'
import { defaultLocale, isLocale, localeCookieName, type Locale } from '@/lib/i18n'

export default async function HostLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'HOST') redirect('/profile')

  const locale: Locale = isLocale(cookies().get(localeCookieName)?.value)
    ? (cookies().get(localeCookieName)!.value as Locale)
    : defaultLocale

  // Full-height app shell: the sidebar stays fixed in place (desktop) while only
  // the content area scrolls. On mobile the sidebar collapses into a hamburger.
  return (
    <div className="flex h-screen overflow-hidden">
      <HostSidebar locale={locale} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <HostMobileNav locale={locale} />
        <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  )
}
