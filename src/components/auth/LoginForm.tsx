'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getAuthMethod, signInWithGoogle } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { GoogleIcon } from '@/components/ui/GoogleIcon'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'
import { HCaptchaWidget } from '@/components/auth/HCaptchaWidget'
import { getDictionary, type Locale } from '@/lib/i18n'
import { isSafeRedirectPath } from '@/lib/utils'

function isRedirectError(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false
  const e = err as { digest?: unknown }
  return typeof e.digest === 'string' && e.digest.startsWith('NEXT_REDIRECT')
}

interface LoginFormProps {
  locale: Locale
  redirectTo?: string
  /** Seed a form-level error (e.g. an expired email-verification link). */
  initialError?: string
  /** Modal passes this to close on success; absent on the standalone page. */
  onSuccess?: () => void
  /** Modal passes this to switch to the signup view; absent renders a /register link. */
  onSwitchToSignup?: () => void
  /** Modal passes this to switch to its forgot-password view; absent opens a local dialog. */
  onForgot?: () => void
}

export function LoginForm({ locale, redirectTo = '', initialError = '', onSuccess, onSwitchToSignup, onForgot }: LoginFormProps) {
  const t = getDictionary(locale).auth
  const isHe = locale === 'he'
  const router = useRouter()
  const [supabase] = useState(() => createClient())

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [captchaToken, setCaptchaToken] = useState('')
  const [fieldErr, setFieldErr] = useState<{ email?: string; password?: string }>({})
  const [error, setError] = useState(initialError)
  const [pending, setPending] = useState(false)
  const [googlePending, setGooglePending] = useState(false)

  // Forgot password: in the modal, AuthModal swaps to its own "forgot" view via
  // onForgot. Standalone (/login page), open a self-contained dialog instead.
  const [forgotDialogOpen, setForgotDialogOpen] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const fe: typeof fieldErr = {}
    if (!email.trim()) fe.email = t.errRequired
    if (!password) fe.password = t.errRequired
    setFieldErr(fe)
    if (Object.keys(fe).length > 0) return

    setPending(true)
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
      ...(captchaToken ? { options: { captchaToken } } : {}),
    })

    if (signInError) {
      setPending(false)
      window.hcaptcha?.reset?.()
      const method = await getAuthMethod(email.trim())
      if (method === 'google') setError(t.errGoogleAccount)
      else if (/invalid login credentials/i.test(signInError.message)) setError(t.errInvalidCredentials)
      else if (/captcha/i.test(signInError.message)) setError(t.errCaptcha)
      else setError(signInError.message || t.errGeneric)
      return
    }

    // Success — onAuthStateChange updates the navbar instantly. Close the modal
    // (if any), then route. Decide the onboarding nudge from the profile.
    onSuccess?.()
    let target = isSafeRedirectPath(redirectTo) ? redirectTo : ''
    if (!target) {
      const uid = signInData.user?.id
      const { data: profile } = uid
        ? await supabase.from('users').select('first_name').eq('id', uid).maybeSingle()
        : { data: null }
      target = profile?.first_name ? '/' : '/onboarding'
    }
    router.refresh()
    router.push(target)
  }

  const handleGoogle = async () => {
    setGooglePending(true)
    setError('')
    try {
      await signInWithGoogle(redirectTo || undefined)
    } catch (err) {
      if (isRedirectError(err)) {
        onSuccess?.()
        throw err
      }
      setGooglePending(false)
      setError(err instanceof Error ? err.message : t.errGeneric)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Button type="button" variant="outline" className="w-full" onClick={handleGoogle} disabled={googlePending}>
        <GoogleIcon className="me-2 h-4 w-4" />
        {googlePending ? (isHe ? 'מתחבר...' : 'Redirecting...') : t.continueWithGoogle}
      </Button>

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">{isHe ? 'או' : 'or'}</span>
        <Separator className="flex-1" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="login-email">{t.email}</Label>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!fieldErr.email}
          />
          {fieldErr.email && <p className="text-xs text-destructive">{fieldErr.email}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="login-password">{t.password}</Label>
          <PasswordInput
            id="login-password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!fieldErr.password}
            showLabel={t.showPassword}
            hideLabel={t.hidePassword}
          />
          {fieldErr.password && <p className="text-xs text-destructive">{fieldErr.password}</p>}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => (onForgot ? onForgot() : setForgotDialogOpen(true))}
              className="text-xs font-medium text-primary hover:underline"
            >
              {t.forgotPassword}
            </button>
          </div>
        </div>

        <HCaptchaWidget onVerify={setCaptchaToken} onExpire={() => setCaptchaToken('')} />

        {error && <p className="text-sm font-medium text-destructive">{error}</p>}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : t.signIn}
        </Button>
      </form>

      {/* Standalone (/login page) only — in the modal, AuthModal owns the forgot view. */}
      <Dialog open={forgotDialogOpen} onOpenChange={setForgotDialogOpen}>
        <DialogContent className="custom-scrollbar max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.forgotTitle}</DialogTitle>
            <DialogDescription>{t.forgotBody}</DialogDescription>
          </DialogHeader>
          <ForgotPasswordForm locale={locale} defaultEmail={email} />
        </DialogContent>
      </Dialog>

      <p className="text-center text-sm text-muted-foreground">
        {t.noAccount}{' '}
        {onSwitchToSignup ? (
          <button type="button" onClick={onSwitchToSignup} className="font-medium text-primary hover:underline">
            {t.createAccount}
          </button>
        ) : (
          <Link href="/register" className="font-medium text-primary hover:underline">
            {t.createAccount}
          </Link>
        )}
      </p>
    </div>
  )
}
