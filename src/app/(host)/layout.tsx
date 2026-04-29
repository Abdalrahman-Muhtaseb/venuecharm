import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { HostSidebar } from '@/components/layout/HostSidebar'
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

  return (
    <div className="flex min-h-screen">
      <HostSidebar locale={locale} />
      <div className="flex flex-1 flex-col">
        <main className="flex-1 overflow-auto p-6 md:p-8">{children}</main>
      </div>
    </div>
  )
}
