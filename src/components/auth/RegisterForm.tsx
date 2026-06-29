'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, MailCheck } from 'lucide-react'
import { signUp, signInWithGoogle, type AuthErrorCode } from '@/actions/auth'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { GoogleIcon } from '@/components/ui/GoogleIcon'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { HCaptchaWidget } from '@/components/auth/HCaptchaWidget'
import { getDictionary, type Locale } from '@/lib/i18n'
import { isSafeRedirectPath } from '@/lib/utils'

function isRedirectError(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false
  const e = err as { digest?: unknown }
  return typeof e.digest === 'string' && e.digest.startsWith('NEXT_REDIRECT')
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

interface FieldErrors {
  firstName?: string
  lastName?: string
  email?: string
  password?: string
  confirm?: string
}

interface RegisterFormProps {
  locale: Locale
  redirectTo?: string
  onSuccess?: () => void
  onSwitchToLogin?: () => void
}

export function RegisterForm({ locale, redirectTo = '', onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const t = getDictionary(locale).auth
  const isHe = locale === 'he'
  const router = useRouter()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [captchaToken, setCaptchaToken] = useState('')
  const [fieldErr, setFieldErr] = useState<FieldErrors>({})
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [googlePending, setGooglePending] = useState(false)
  const [sentTo, setSentTo] = useState('')

  const applyError = (code: AuthErrorCode, message?: string) => {
    switch (code) {
      case 'first_name': setFieldErr((f) => ({ ...f, firstName: t.errFirstName })); break
      case 'last_name': setFieldErr((f) => ({ ...f, lastName: t.errLastName })); break
      case 'invalid_email': setFieldErr((f) => ({ ...f, email: t.errEmailInvalid })); break
      case 'weak_password': setFieldErr((f) => ({ ...f, password: t.errPasswordShort })); break
      case 'passwords_mismatch': setFieldErr((f) => ({ ...f, confirm: t.errPasswordMismatch })); break
      case 'email_exists': setError(t.errEmailExists); break
      case 'google_account': setError(t.errGoogleAccount); break
      case 'captcha': setError(t.errCaptcha); break
      case 'rate_limit': setError(t.errRateLimit); break
      case 'email_send': setError(t.errEmailSend); break
      default: setError(message || t.errGeneric)
    }
  }

  const validate = (): boolean => {
    const fe: FieldErrors = {}
    if (!firstName.trim()) fe.firstName = t.errFirstName
    if (!lastName.trim()) fe.lastName = t.errLastName
    if (!EMAIL_RE.test(email.trim())) fe.email = t.errEmailInvalid
    if (password.length < 8) fe.password = t.errPasswordShort
    if (confirm !== password) fe.confirm = t.errPasswordMismatch
    setFieldErr(fe)
    return Object.keys(fe).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!validate()) return

    setPending(true)
    const fd = new FormData()
    fd.set('firstName', firstName.trim())
    fd.set('lastName', lastName.trim())
    fd.set('email', email.trim())
    fd.set('password', password)
    fd.set('confirmPassword', confirm)
    fd.set('captchaToken', captchaToken)

    try {
      const res = await signUp(fd)
      setPending(false)
      if ('error' in res) {
        applyError(res.error, res.message)
        window.hcaptcha?.reset?.()
        setCaptchaToken('')
        return
      }
      if ('needsVerification' in res) {
        setSentTo(res.email)
        return
      }
      onSuccess?.()
      router.refresh()
      router.push(res.redirectTo)
    } catch (err) {
      setPending(false)
      if (isRedirectError(err)) {
        onSuccess?.()
        throw err
      }
      setError(t.errGeneric)
    }
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

  // While waiting on the "check your inbox" panel, pick up the verification
  // happening in another tab (the user clicking the emailed link). Supabase
  // broadcasts auth changes across tabs, so this tab's SIGNED_IN fires too —
  // no manual refresh needed, same pattern as UserProvider's global listener.
  useEffect(() => {
    if (!sentTo) return
    const supabase = createClient()
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event !== 'SIGNED_IN') return
      onSuccess?.()
      router.refresh()
      router.push(isSafeRedirectPath(redirectTo) ? redirectTo : '/')
    })
    return () => sub.subscription.unsubscribe()
  }, [sentTo, redirectTo, onSuccess, router])

  // ── "Check your inbox" panel (email confirmation pending) ──────────────────
  if (sentTo) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MailCheck className="h-6 w-6" />
        </span>
        <h3 className="text-lg font-semibold">{t.verifySentTitle}</h3>
        <p className="text-sm text-muted-foreground">
          {t.verifySentBody} <span className="font-medium text-foreground">{sentTo}</span>
        </p>
        <p className="text-xs text-muted-foreground">{t.verifySentHint}</p>
        {onSwitchToLogin ? (
          <Button type="button" variant="outline" className="mt-2" onClick={onSwitchToLogin}>
            {t.backToLogin}
          </Button>
        ) : (
          <Button asChild variant="outline" className="mt-2">
            <Link href="/login">{t.backToLogin}</Link>
          </Button>
        )}
      </div>
    )
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
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reg-first">{t.firstName}</Label>
            <Input
              id="reg-first"
              autoComplete="given-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              aria-invalid={!!fieldErr.firstName}
            />
            {fieldErr.firstName && <p className="text-xs text-destructive">{fieldErr.firstName}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reg-last">{t.lastName}</Label>
            <Input
              id="reg-last"
              autoComplete="family-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              aria-invalid={!!fieldErr.lastName}
            />
            {fieldErr.lastName && <p className="text-xs text-destructive">{fieldErr.lastName}</p>}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="reg-email">{t.email}</Label>
          <Input
            id="reg-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!fieldErr.email}
          />
          {fieldErr.email && <p className="text-xs text-destructive">{fieldErr.email}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="reg-password">{t.password}</Label>
          <PasswordInput
            id="reg-password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!fieldErr.password}
            showLabel={t.showPassword}
            hideLabel={t.hidePassword}
          />
          {fieldErr.password && <p className="text-xs text-destructive">{fieldErr.password}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="reg-confirm">{t.confirmPassword}</Label>
          <PasswordInput
            id="reg-confirm"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            aria-invalid={!!fieldErr.confirm}
            showLabel={t.showPassword}
            hideLabel={t.hidePassword}
          />
          {fieldErr.confirm && <p className="text-xs text-destructive">{fieldErr.confirm}</p>}
        </div>

        <HCaptchaWidget onVerify={setCaptchaToken} onExpire={() => setCaptchaToken('')} />

        {error && <p className="text-sm font-medium text-destructive">{error}</p>}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : t.createAccount}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {t.haveAccount}{' '}
        {onSwitchToLogin ? (
          <button type="button" onClick={onSwitchToLogin} className="font-medium text-primary hover:underline">
            {t.signIn}
          </button>
        ) : (
          <Link href="/login" className="font-medium text-primary hover:underline">
            {t.signIn}
          </Link>
        )}
      </p>
    </div>
  )
}
