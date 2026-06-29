import { cookies } from 'next/headers'
import { AuthShell } from '@/components/layout/AuthShell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ResetPasswordForm } from './reset-password-form'
import { defaultLocale, getDictionary, isLocale, localeCookieName, type Locale } from '@/lib/i18n'

export const dynamic = 'force-dynamic'

export default function ResetPasswordPage() {
  const locale: Locale = isLocale(cookies().get(localeCookieName)?.value)
    ? (cookies().get(localeCookieName)!.value as Locale)
    : defaultLocale
  const t = getDictionary(locale).auth

  return (
    <AuthShell locale={locale}>
      <Card className="w-full max-w-md shadow-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t.resetTitle}</CardTitle>
          <CardDescription>{t.resetSubtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <ResetPasswordForm locale={locale} />
        </CardContent>
      </Card>
    </AuthShell>
  )
}
