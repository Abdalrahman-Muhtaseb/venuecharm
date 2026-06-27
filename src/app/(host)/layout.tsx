import Link from 'next/link'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { Compass } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { HostSidebar } from '@/components/layout/HostSidebar'
import { LogoFull } from '@/components/ui/LogoIcon'
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

  const isHe = locale === 'he'

  return (
    <div className="flex min-h-screen">
      <HostSidebar locale={locale} />
      <div className="flex flex-1 flex-col">
        {/* Mobile header — the sidebar is desktop-only, so give mobile hosts a
            logo home link + a way back to the traveler experience. */}
        <header className="flex h-14 items-center justify-between border-b px-4 md:hidden">
          <Link href="/" className="flex items-center font-bold text-primary">
            <LogoFull className="h-8 w-auto" />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-sm font-medium text-primary"
          >
            <Compass className="h-4 w-4" aria-hidden="true" />
            {isHe ? 'יציאה מאירוח' : 'Exit hosting'}
          </Link>
        </header>
        <main className="flex-1 overflow-auto p-6 md:p-8">{children}</main>
      </div>
    </div>
  )
}
