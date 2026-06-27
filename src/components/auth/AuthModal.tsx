'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Loader2 } from 'lucide-react'
import { signIn, signUp, signInWithGoogle } from '@/actions/auth'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { GoogleIcon } from '@/components/ui/GoogleIcon'
import { BrandBackground } from '@/components/layout/BrandBackground'
import { getDictionary, type Locale } from '@/lib/i18n'

export type AuthView = 'login' | 'signup'

// A successful server-action redirect surfaces as an error whose marker lives in
// `digest` (e.g. "NEXT_REDIRECT;push;/;..."), not always in `message`.
function isRedirectError(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false
  const e = err as { digest?: unknown; message?: unknown }
  return (
    (typeof e.digest === 'string' && e.digest.startsWith('NEXT_REDIRECT')) ||
    (typeof e.message === 'string' && e.message.includes('NEXT_REDIRECT'))
  )
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : label}
    </Button>
  )
}

interface AuthModalProps {
  locale: Locale
  open: boolean
  onOpenChange: (open: boolean) => void
  view: AuthView
  setView: (view: AuthView) => void
  redirectTo: string
}

export function AuthModal({ locale, open, onOpenChange, view, setView, redirectTo }: AuthModalProps) {
  const t = getDictionary(locale).auth
  const isHe = locale === 'he'
  const [error, setError] = useState('')
  const [googlePending, setGooglePending] = useState(false)
  const isLogin = view === 'login'

  // Server actions redirect on success (NEXT_REDIRECT must be re-thrown so the
  // navigation happens); any other error is shown inline.
  const submit = (action: (fd: FormData) => Promise<unknown>) => async (formData: FormData) => {
    setError('')
    try {
      await action(formData)
    } catch (err) {
      // Success redirects throw NEXT_REDIRECT. The modal lives in the root
      // layout (it survives client navigation), so close it before re-throwing,
      // otherwise it lingers over the destination page.
      if (isRedirectError(err)) {
        onOpenChange(false)
        throw err
      }
      setError(err instanceof Error ? err.message : (isHe ? 'משהו השתבש' : 'Something went wrong'))
    }
  }

  const onGoogle = async () => {
    setGooglePending(true)
    setError('')
    try {
      await signInWithGoogle(redirectTo || undefined)
    } catch (err) {
      if (isRedirectError(err)) {
        onOpenChange(false)
        throw err
      }
      setGooglePending(false)
      setError(err instanceof Error ? err.message : (isHe ? 'משהו השתבש' : 'Something went wrong'))
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) setError('')
      }}
    >
      <DialogContent className="overflow-hidden sm:max-w-md">
        <BrandBackground className="z-0" />
        <DialogHeader className="relative z-10 text-center">
          <DialogTitle className="text-2xl">{isLogin ? t.loginTitle : t.registerTitle}</DialogTitle>
          <DialogDescription>
            {isLogin ? t.loginDescription : t.registerDescription}
          </DialogDescription>
        </DialogHeader>

        <form action={submit(isLogin ? signIn : signUp)} className="relative z-10 flex flex-col gap-4">
          {isLogin && <input type="hidden" name="redirectTo" value={redirectTo} />}
          <div className="flex flex-col gap-2">
            <Label htmlFor="auth-email">{t.email}</Label>
            <Input id="auth-email" name="email" type="email" required autoComplete="email" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="auth-password">{t.password}</Label>
            <Input
              id="auth-password"
              name="password"
              type="password"
              required
              minLength={isLogin ? undefined : 8}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <SubmitButton label={isLogin ? t.signIn : t.createAccount} />
        </form>

        <div className="relative z-10 flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">{isHe ? 'או' : 'or'}</span>
          <Separator className="flex-1" />
        </div>

        <Button type="button" variant="outline" className="relative z-10 w-full" onClick={onGoogle} disabled={googlePending}>
          <GoogleIcon className="me-2 h-4 w-4" />
          {googlePending ? (isHe ? 'מתחבר...' : 'Redirecting...') : t.continueWithGoogle}
        </Button>

        <p className="relative z-10 text-center text-sm text-muted-foreground">
          {isLogin ? (
            <>
              {isHe ? 'אין לך חשבון?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => { setError(''); setView('signup') }}
                className="font-medium text-primary hover:underline"
              >
                {t.createAccount}
              </button>
            </>
          ) : (
            <>
              {isHe ? 'כבר יש לך חשבון?' : 'Already have an account?'}{' '}
              <button
                type="button"
                onClick={() => { setError(''); setView('login') }}
                className="font-medium text-primary hover:underline"
              >
                {t.signIn}
              </button>
            </>
          )}
        </p>
      </DialogContent>
    </Dialog>
  )
}
