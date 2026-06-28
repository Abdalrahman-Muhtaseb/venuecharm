'use client'

import { useEffect, useRef } from 'react'
import { useTheme } from 'next-themes'

declare global {
  interface Window {
    hcaptcha?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string
      reset: (id?: string) => void
      remove: (id: string) => void
    }
  }
}

const SCRIPT_ID = 'hcaptcha-api-script'
const SITE_KEY = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY

/**
 * hCaptcha widget. Renders only when NEXT_PUBLIC_HCAPTCHA_SITE_KEY is set, so the
 * app runs normally in dev without keys; once the key is present AND captcha is
 * enabled in the Supabase Auth dashboard, the token is required server-side.
 *
 * `key` should change when the parent form switches (login ⇄ signup) so the
 * widget remounts cleanly.
 */
export function HCaptchaWidget({
  onVerify,
  onExpire,
}: {
  onVerify: (token: string) => void
  onExpire?: () => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    if (!SITE_KEY) return
    let cancelled = false

    if (!document.getElementById(SCRIPT_ID)) {
      const script = document.createElement('script')
      script.id = SCRIPT_ID
      script.src = 'https://js.hcaptcha.com/1/api.js?render=explicit'
      script.async = true
      script.defer = true
      document.head.appendChild(script)
    }

    const render = () => {
      if (cancelled || !containerRef.current || !window.hcaptcha) return
      if (widgetIdRef.current !== null) return
      widgetIdRef.current = window.hcaptcha.render(containerRef.current, {
        sitekey: SITE_KEY,
        theme: resolvedTheme === 'dark' ? 'dark' : 'light',
        callback: (token: string) => onVerify(token),
        'expired-callback': () => onExpire?.(),
      })
    }

    const poll = setInterval(() => {
      if (window.hcaptcha) {
        clearInterval(poll)
        render()
      }
    }, 150)

    return () => {
      cancelled = true
      clearInterval(poll)
      if (widgetIdRef.current !== null && window.hcaptcha) {
        try {
          window.hcaptcha.remove(widgetIdRef.current)
        } catch {
          /* widget already gone */
        }
        widgetIdRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!SITE_KEY) return null
  return <div ref={containerRef} className="flex justify-center" />
}
