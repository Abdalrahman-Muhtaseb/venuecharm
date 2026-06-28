import { cookies } from 'next/headers'
import { defaultLocale, getDictionary, isLocale, localeCookieName } from '@/lib/i18n'
import { isSafeRedirectPath } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage({
  searchParams,
}: {
  searchParams: { redirect?: string; error?: string }
}) {
  const locale = isLocale(cookies().get(localeCookieName)?.value)
    ? (cookies().get(localeCookieName)!.value as 'he' | 'en')
    : defaultLocale
  const t = getDictionary(locale)
  const redirectTo = isSafeRedirectPath(searchParams.redirect) ? searchParams.redirect! : ''
  const initialError = searchParams.error === 'verification' ? t.auth.verifyFailed : ''

  return (
    <Card className="w-full max-w-md shadow-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t.auth.loginTitle}</CardTitle>
        <CardDescription>{t.auth.loginDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm locale={locale} redirectTo={redirectTo} initialError={initialError} />
      </CardContent>
    </Card>
  )
}
