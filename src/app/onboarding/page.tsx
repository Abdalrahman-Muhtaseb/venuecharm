import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { PublicNavbar } from '@/components/layout/PublicNavbar'
import { Footer } from '@/components/layout/Footer'
import { BrandBackground } from '@/components/layout/BrandBackground'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { OnboardingForm } from '@/components/auth/OnboardingForm'
import { defaultLocale, isLocale, localeCookieName, type Locale } from '@/lib/i18n'

export default async function OnboardingPage() {
  const locale: Locale = isLocale(cookies().get(localeCookieName)?.value)
    ? (cookies().get(localeCookieName)!.value as Locale)
    : defaultLocale
  const isHe = locale === 'he'

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('first_name, last_name, phone_number')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex min-h-screen flex-col">
      <PublicNavbar locale={locale} />
      <main className="relative flex flex-1 items-center justify-center px-4 py-12">
        <BrandBackground />
        <Card className="w-full max-w-md shadow-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{isHe ? 'ספר/י לנו עליך' : 'About you'}</CardTitle>
            <CardDescription>
              {isHe
                ? 'עוד כמה פרטים כדי להשלים את ההרשמה'
                : 'A few details to finish setting up your account'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OnboardingForm
              locale={locale}
              defaults={{
                firstName: profile?.first_name ?? '',
                lastName: profile?.last_name ?? '',
                phone: profile?.phone_number ?? '',
              }}
            />
          </CardContent>
        </Card>
      </main>
      <Footer locale={locale} />
    </div>
  )
}
