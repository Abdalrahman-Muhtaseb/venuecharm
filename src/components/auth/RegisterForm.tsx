'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Building2, Users } from 'lucide-react'
import { signUp, signUpWithGoogle } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import type { Locale } from '@/lib/i18n'

interface RegisterFormProps {
  locale: Locale
  t: {
    email: string
    password: string
    accountType: string
    renter: string
    host: string
    createAccount: string
    continueWithGoogle: string
    signIn: string
  }
}

export function RegisterForm({ locale, t }: RegisterFormProps) {
  const [role, setRole] = useState<'RENTER' | 'HOST'>('RENTER')
  const [googlePending, startGoogle] = useTransition()
  const isHe = locale === 'he'

  const handleGoogle = () => {
    startGoogle(async () => {
      await signUpWithGoogle(role)
    })
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Role selector — shared by both sign-up methods */}
      <div className="flex flex-col gap-2">
        <Label>{t.accountType}</Label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setRole('RENTER')}
            className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition ${
              role === 'RENTER'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:bg-muted'
            }`}
          >
            <Users className={`h-6 w-6 ${role === 'RENTER' ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className="text-sm font-medium">{t.renter}</span>
            <span className="text-xs text-muted-foreground">
              {isHe ? 'אני מחפש/ת מקום' : 'I want to find venues'}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setRole('HOST')}
            className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition ${
              role === 'HOST'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:bg-muted'
            }`}
          >
            <Building2 className={`h-6 w-6 ${role === 'HOST' ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className="text-sm font-medium">{t.host}</span>
            <span className="text-xs text-muted-foreground">
              {isHe ? 'אני רוצה לפרסם מקום' : 'I want to list a space'}
            </span>
          </button>
        </div>
      </div>

      {/* Email / password */}
      <form action={signUp} className="flex flex-col gap-4">
        <input type="hidden" name="role" value={role} />
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

      {/* Google */}
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleGoogle}
        disabled={googlePending}
      >
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
