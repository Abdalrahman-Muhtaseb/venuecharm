import { signIn, signInWithGoogle } from '@/actions/auth'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { defaultLocale, getDictionary, isLocale, localeCookieName } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export default function LoginPage() {
  const locale = isLocale(cookies().get(localeCookieName)?.value)
    ? (cookies().get(localeCookieName)!.value as 'he' | 'en')
    : defaultLocale
  const t = getDictionary(locale)

  return (
    <Card className="w-full max-w-md shadow-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t.auth.loginTitle}</CardTitle>
        <CardDescription>{t.auth.loginDescription}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form action={signIn} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">{t.auth.email}</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">{t.auth.password}</Label>
            <Input id="password" name="password" type="password" required autoComplete="current-password" />
          </div>
          <Button type="submit" className="w-full">
            {t.auth.signIn}
          </Button>
        </form>

        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">{locale === 'he' ? 'או' : 'or'}</span>
          <Separator className="flex-1" />
        </div>

        <form action={signInWithGoogle}>
          <Button type="submit" variant="outline" className="w-full">
            {t.auth.continueWithGoogle}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {locale === 'he' ? 'אין לך חשבון?' : "Don't have an account?"}{' '}
          <Link href="/register" className="font-medium text-primary hover:underline">
            {t.auth.createAccount}
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
