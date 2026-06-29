'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { BrandBackground } from '@/components/layout/BrandBackground'
import { LoginForm } from '@/components/auth/LoginForm'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'
import { getDictionary, type Locale } from '@/lib/i18n'

export type AuthView = 'login' | 'signup' | 'forgot'

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
  const close = () => onOpenChange(false)

  const title = view === 'login' ? t.loginTitle : view === 'signup' ? t.registerTitle : t.forgotTitle
  const description =
    view === 'login' ? t.loginDescription : view === 'signup' ? t.registerDescription : t.forgotBody

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="custom-scrollbar max-h-[90vh] overflow-y-auto sm:max-w-md">
        <BrandBackground className="z-0" />
        <DialogHeader className="relative z-10 text-center">
          <DialogTitle className="text-2xl">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="relative z-10">
          {view === 'login' && (
            <LoginForm
              locale={locale}
              redirectTo={redirectTo}
              onSuccess={close}
              onSwitchToSignup={() => setView('signup')}
              onForgot={() => setView('forgot')}
            />
          )}
          {view === 'signup' && (
            <RegisterForm
              locale={locale}
              redirectTo={redirectTo}
              onSuccess={close}
              onSwitchToLogin={() => setView('login')}
            />
          )}
          {view === 'forgot' && (
            <ForgotPasswordForm locale={locale} onBack={() => setView('login')} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
