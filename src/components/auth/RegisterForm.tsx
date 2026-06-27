'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { signUp, signInWithGoogle } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { GoogleIcon } from '@/components/ui/GoogleIcon'
import type { Locale } from '@/lib/i18n'

interface RegisterFormProps {
  locale: Locale
  t: {
    email: string
    password: string
    createAccount: string
    continueWithGoogle: string
    signIn: string
  }
}

export function RegisterForm({ locale, t }: RegisterFormProps) {
  const [googlePending, startGoogle] = useTransition()
  const isHe = locale === 'he'

  const handleGoogle = () => {
    startGoogle(async () => {
      await signInWithGoogle()
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <form action={signUp} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">{t.email}</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">{t.password}</Label>
          <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
        </div>
        <Button type="submit" className="w-full">{t.createAccount}</Button>
      </form>

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">{isHe ? 'או' : 'or'}</span>
        <Separator className="flex-1" />
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleGoogle}
        disabled={googlePending}
      >
        <GoogleIcon className="me-2 h-4 w-4" />
        {googlePending
          ? (isHe ? 'מתחבר...' : 'Redirecting...')
          : t.continueWithGoogle}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {isHe ? 'כבר יש לך חשבון?' : 'Already have an account?'}{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          {t.signIn}
        </Link>
      </p>
    </div>
  )
}
