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
import { getDictionary, type Locale } from '@/lib/i18n'

export type AuthView = 'login' | 'signup'

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
  const isLogin = view === 'login'
  const close = () => onOpenChange(false)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden sm:max-w-md">
        <BrandBackground className="z-0" />
        <DialogHeader className="relative z-10 text-center">
          <DialogTitle className="text-2xl">{isLogin ? t.loginTitle : t.registerTitle}</DialogTitle>
          <DialogDescription>
            {isLogin ? t.loginDescription : t.registerDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="relative z-10">
          {isLogin ? (
            <LoginForm
              locale={locale}
              redirectTo={redirectTo}
              onSuccess={close}
              onSwitchToSignup={() => setView('signup')}
            />
          ) : (
            <RegisterForm
              locale={locale}
              redirectTo={redirectTo}
              onSuccess={close}
              onSwitchToLogin={() => setView('login')}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
