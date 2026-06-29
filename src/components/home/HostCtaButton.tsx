'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useCurrentUser } from '@/components/auth/UserProvider'
import { useAuthModal } from '@/components/auth/AuthModalProvider'
import { becomeHost } from '@/actions/auth'

const CLASS = 'mt-8 h-12 px-8 text-base'

/**
 * Homepage "Start listing" CTA. Routes by role like the navbar's Become-a-host:
 *   logged out → open the login modal · RENTER → becomeHost (→ /host/onboarding)
 *   HOST → host dashboard · ADMIN → admin panel.
 */
export function HostCtaButton({ label }: { label: string }) {
  const user = useCurrentUser()
  const router = useRouter()
  const pathname = usePathname()
  const { openLogin } = useAuthModal()

  if (!user) {
    return (
      <Button size="lg" variant="secondary" className={CLASS} onClick={() => openLogin(pathname)}>
        {label}
      </Button>
    )
  }

  if (user.role === 'HOST') {
    return (
      <Button size="lg" variant="secondary" className={CLASS} onClick={() => router.push('/dashboard')}>
        {label}
      </Button>
    )
  }

  if (user.role === 'ADMIN') {
    return (
      <Button size="lg" variant="secondary" className={CLASS} onClick={() => router.push('/admin')}>
        {label}
      </Button>
    )
  }

  // RENTER → upgrade to host
  return (
    <form action={becomeHost}>
      <Button type="submit" size="lg" variant="secondary" className={CLASS}>
        {label}
      </Button>
    </form>
  )
}
