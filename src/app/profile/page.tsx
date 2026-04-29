import Link from 'next/link'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { ArrowLeft } from 'lucide-react'
import { defaultLocale, getDictionary, isLocale, localeCookieName, type Locale } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/server'
import { PublicNavbar } from '@/components/layout/PublicNavbar'
import { Footer } from '@/components/layout/Footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import ProfileForm from '@/components/profile/profile-form'

export default async function ProfilePage() {
  const locale: Locale = isLocale(cookies().get(localeCookieName)?.value)
    ? (cookies().get(localeCookieName)!.value as Locale)
    : defaultLocale
  const t = getDictionary(locale)
  const supabase = createClient()

  const { data: authData } = await supabase.auth.getUser()
  if (!authData.user) redirect('/login')

  const { data: profile, error } = await supabase
    .from('users')
    .select('id, email, first_name, last_name, phone_number, avatar_url, role, is_verified, created_at')
    .eq('id', authData.user.id)
    .single()

  if (error || !profile) redirect('/login')

  const backHref = profile.role === 'HOST' ? '/dashboard' : '/'

  return (
    <div className="flex min-h-screen flex-col">
      <PublicNavbar locale={locale} />
      <main className="flex-1 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 flex items-center gap-3">
            <Link href={backHref} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              {t.profile.backToDashboard}
            </Link>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>{t.profile.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <ProfileForm locale={locale} user={profile} />
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer locale={locale} />
    </div>
  )
}
