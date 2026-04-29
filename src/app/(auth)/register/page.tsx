import { signUp } from '@/actions/auth'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Building2, Users } from 'lucide-react'
import { defaultLocale, getDictionary, isLocale, localeCookieName } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

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
        <form action={signUp} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">{t.auth.email}</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">{t.auth.password}</Label>
            <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
          </div>

          {/* Visual role selector */}
          <div className="flex flex-col gap-2">
            <Label>{t.auth.accountType}</Label>
            <div className="grid grid-cols-2 gap-3">
              <label className="group cursor-pointer">
                <input type="radio" name="role" value="RENTER" defaultChecked className="peer sr-only" />
                <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-border p-4 text-center transition peer-checked:border-primary peer-checked:bg-primary/5 group-hover:bg-muted">
                  <Users className="h-6 w-6 text-muted-foreground peer-checked:text-primary group-has-[input:checked]:text-primary" />
                  <span className="text-sm font-medium">{t.auth.renter}</span>
                  <span className="text-xs text-muted-foreground">
                    {locale === 'he' ? 'אני מחפש/ת מקום' : 'I want to find venues'}
                  </span>
                </div>
              </label>
              <label className="group cursor-pointer">
                <input type="radio" name="role" value="HOST" className="peer sr-only" />
                <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-border p-4 text-center transition peer-checked:border-primary peer-checked:bg-primary/5 group-hover:bg-muted">
                  <Building2 className="h-6 w-6 text-muted-foreground" />
                  <span className="text-sm font-medium">{t.auth.host}</span>
                  <span className="text-xs text-muted-foreground">
                    {locale === 'he' ? 'אני רוצה לפרסם מקום' : 'I want to list a space'}
                  </span>
                </div>
              </label>
            </div>
          </div>

          <Button type="submit" className="w-full">
            {t.auth.createAccount}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          {locale === 'he' ? 'כבר יש לך חשבון?' : 'Already have an account?'}{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            {t.auth.signIn}
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
