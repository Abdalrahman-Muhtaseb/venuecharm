'use client'

import { useState } from 'react'
import { requestPasswordReset } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getDictionary, type Locale } from '@/lib/i18n'

interface ForgotPasswordFormProps {
  locale: Locale
  defaultEmail?: string
  /** Renders a "back to sign in" link when provided (e.g. modal view switch). */
  onBack?: () => void
}

/** Email-only form that triggers a captcha-exempt reset link. Always reports
 *  success (no account enumeration). Container supplies the title/description. */
export function ForgotPasswordForm({ locale, defaultEmail = '', onBack }: ForgotPasswordFormProps) {
  const t = getDictionary(locale).auth
  const [email, setEmail] = useState(defaultEmail)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const submit = async () => {
    setSending(true)
    await requestPasswordReset(email.trim())
    setSending(false)
    setSent(true)
  }

  return (
    <div className="flex flex-col gap-4">
      {sent ? (
        <p className="text-sm text-muted-foreground">{t.forgotSent}</p>
      ) : (
        <>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="forgot-email">{t.email}</Label>
            <Input
              id="forgot-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button type="button" onClick={submit} disabled={sending || !email.trim()} className="w-full">
            {sending ? t.forgotSending : t.forgotSend}
          </Button>
        </>
      )}
      {onBack && (
        <button type="button" onClick={onBack} className="text-center text-sm font-medium text-primary hover:underline">
          {t.backToLogin}
        </button>
      )}
    </div>
  )
}
