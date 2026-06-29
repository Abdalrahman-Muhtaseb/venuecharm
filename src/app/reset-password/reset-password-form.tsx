'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { getDictionary, type Locale } from '@/lib/i18n'

type Status = 'verifying' | 'ready' | 'invalid' | 'saving' | 'done'

export function ResetPasswordForm({ locale }: { locale: Locale }) {
  const t = getDictionary(locale).auth
  const [supabase] = useState(() => createClient())

  const [status, setStatus] = useState<Status>('verifying')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')

  // The recovery link arrives either as `?code=` (PKCE) or as a `#access_token`
  // hash (implicit — what the admin generateLink flow produces). The browser SDK
  // auto-processes the hash and fires PASSWORD_RECOVERY/SIGNED_IN; for `?code=` we
  // exchange explicitly. A short fallback marks the link invalid only if nothing
  // resolves, so we never flash "invalid" while the hash is still being parsed.
  useEffect(() => {
    let resolved = false
    const markReady = () => { resolved = true; setStatus('ready') }

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') markReady()
    })

    const url = new URL(window.location.href)
    if (url.searchParams.get('error_description') || url.searchParams.get('error')) {
      setStatus('invalid')
    } else {
      const code = url.searchParams.get('code')
      if (code) {
        supabase.auth.exchangeCodeForSession(code).then(({ error: exErr }) => {
          if (!exErr) markReady()
          else if (!resolved) setStatus('invalid')
        })
      } else {
        supabase.auth.getSession().then(({ data }) => { if (data.session) markReady() })
        const timer = setTimeout(() => { if (!resolved) setStatus('invalid') }, 2500)
        return () => { clearTimeout(timer); sub.subscription.unsubscribe() }
      }
    }

    return () => sub.subscription.unsubscribe()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError(t.errPasswordShort); return }
    if (password !== confirm) { setError(t.errPasswordMismatch); return }

    setStatus('saving')
    const { error: upErr } = await supabase.auth.updateUser({ password })
    if (upErr) {
      setError(upErr.message || t.errGeneric)
      setStatus('ready')
      return
    }
    // Stay on the page — the recovery session is one-time, so we confirm success
    // and let the user close the tab rather than navigating them elsewhere.
    setStatus('done')
  }

  if (status === 'verifying') {
    return (
      <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        <span className="text-sm">{t.resetVerifying}</span>
      </div>
    )
  }

  if (status === 'invalid') {
    return (
      <div className="flex flex-col gap-4 text-center">
        <div>
          <p className="font-semibold">{t.resetInvalidTitle}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t.resetInvalidBody}</p>
        </div>
        <Button asChild variant="outline" className="w-full">
          <Link href="/login">{t.backToLogin}</Link>
        </Button>
      </div>
    )
  }

  if (status === 'done') {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <CheckCircle2 className="h-12 w-12 text-emerald-500" aria-hidden="true" />
        <p className="font-semibold text-emerald-600">{t.resetSuccess}</p>
        <p className="text-sm text-muted-foreground">{t.resetCloseHint}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reset-password">{t.resetNewPassword}</Label>
        <PasswordInput
          id="reset-password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          showLabel={t.showPassword}
          hideLabel={t.hidePassword}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reset-confirm">{t.confirmPassword}</Label>
        <PasswordInput
          id="reset-confirm"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          showLabel={t.showPassword}
          hideLabel={t.hidePassword}
        />
      </div>

      {error && <p className="text-sm font-medium text-destructive">{error}</p>}

      <Button type="submit" className="w-full" disabled={status === 'saving'}>
        {status === 'saving'
          ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          : t.resetSubmit}
      </Button>
    </form>
  )
}
