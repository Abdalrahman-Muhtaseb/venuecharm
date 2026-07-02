'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ensureUserProfile } from '@/actions/auth'

/**
 * Handles the Supabase implicit (hash) auth flow.
 *
 * When an invite link's redirect_to URL isn't in Supabase's allowlist, Supabase
 * falls back to the site URL with the token in the hash (#access_token=…). The
 * browser client parses this hash automatically on init, possibly firing
 * INITIAL_SESSION before our listener attaches. We handle both paths:
 * 1. getSession() — catches the case where hash was already processed
 * 2. onAuthStateChange — catches SIGNED_IN / INITIAL_SESSION if fired after mount
 */
export function HashSessionRedirect() {
  const router = useRouter()
  const handled = useRef(false)

  useEffect(() => {
    if (!window.location.hash.includes('access_token=')) return

    const supabase = createClient()

    async function finish(userId: string, role: string | undefined) {
      if (handled.current) return
      handled.current = true

      window.history.replaceState(
        null,
        '',
        window.location.pathname + window.location.search,
      )
      try {
        await ensureUserProfile()
      } catch {
        // best-effort — user is authenticated even if row creation fails
      }
      router.replace(role === 'ADMIN' ? '/admin' : '/')
    }

    // Path 1: hash was already processed by the time useEffect runs
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        finish(session.user.id, session.user.user_metadata?.role as string | undefined)
      }
    })

    // Path 2: hash is processed asynchronously after mount
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
        finish(session.user.id, session.user.user_metadata?.role as string | undefined)
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  return null
}
