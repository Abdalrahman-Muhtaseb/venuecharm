import { cookies } from 'next/headers'
import { defaultLocale, getDictionary, isLocale, localeCookieName } from '@/lib/i18n'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RegisterForm } from '@/components/auth/RegisterForm'

export default function RegisterPage() {
  const locale = isLocale(cookies().get(localeCookieName)?.value)
    ? (cookies().get(localeCookieName)!.value as 'he' | 'en')
    : defaultLocale
  const t = getDictionary(locale)

  return (
    <Card className="w-full max-w-md shadow-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t.auth.registerTitle}</CardTitle>
        <CardDescription>{t.auth.registerDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <RegisterForm locale={locale} t={t.auth} />
      </CardContent>
    </Card>
  )
}
