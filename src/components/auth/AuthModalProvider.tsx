'use client'

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { AuthModal, type AuthView } from '@/components/auth/AuthModal'
import type { Locale } from '@/lib/i18n'

interface AuthModalApi {
  openLogin: (redirectTo?: string) => void
  openSignup: (redirectTo?: string) => void
}

const AuthModalContext = createContext<AuthModalApi | null>(null)

export function useAuthModal(): AuthModalApi {
  const ctx = useContext(AuthModalContext)
  if (!ctx) throw new Error('useAuthModal must be used within an AuthModalProvider')
  return ctx
}

export function AuthModalProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<AuthView>('login')
  const [redirectTo, setRedirectTo] = useState('')
  const pathname = usePathname()

  // Safety net: close on any route change (covers redirects to a different path
  // even if the redirect error never reaches the modal's own handler).
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  const openLogin = useCallback((r?: string) => {
    setRedirectTo(r ?? '')
    setView('login')
    setOpen(true)
  }, [])

  const openSignup = useCallback((r?: string) => {
    setRedirectTo(r ?? '')
    setView('signup')
    setOpen(true)
  }, [])

  return (
    <AuthModalContext.Provider value={{ openLogin, openSignup }}>
      {children}
      <AuthModal
        locale={locale}
        open={open}
        onOpenChange={setOpen}
        view={view}
        setView={setView}
        redirectTo={redirectTo}
      />
    </AuthModalContext.Provider>
  )
}
