import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { AdminSidebar, AdminMobileNav } from '@/components/admin/AdminSidebar'
import { defaultLocale, isLocale, localeCookieName, type Locale } from '@/lib/i18n'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'ADMIN') redirect('/')

  const locale: Locale = isLocale(cookies().get(localeCookieName)?.value)
    ? (cookies().get(localeCookieName)!.value as Locale)
    : defaultLocale

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar locale={locale} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AdminMobileNav locale={locale} />
        <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  )
}
