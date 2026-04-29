import Link from 'next/link'
import { cookies } from 'next/headers'
import { MailCheck } from 'lucide-react'
import { defaultLocale, getDictionary, isLocale, localeCookieName } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function VerifyEmailPage() {
  const locale = isLocale(cookies().get(localeCookieName)?.value)
    ? (cookies().get(localeCookieName)!.value as 'he' | 'en')
    : defaultLocale
  const t = getDictionary(locale)

  return (
    <Card className="w-full max-w-md shadow-sm text-center">
      <CardHeader className="items-center">
        <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <MailCheck className="h-7 w-7 text-primary" />
        </div>
        <CardTitle className="text-2xl">{t.auth.verifyTitle}</CardTitle>
        <CardDescription className="leading-7">{t.auth.verifyDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild className="w-full">
          <Link href="/login">{t.auth.goToLogin}</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
