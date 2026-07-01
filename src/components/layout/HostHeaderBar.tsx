'use client'

import type { ReactNode } from 'react'
import { NotificationBell } from '@/components/layout/NotificationBell'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import type { Locale } from '@/lib/i18n'

interface HostHeaderBarProps {
  title: string
  /** A pre-rendered icon element, e.g. `<MessageCircle className="h-[18px] w-[18px]" />` —
   *  component *types* can't cross the server/client boundary as props, only elements. */
  icon?: ReactNode
  action?: ReactNode
  locale: Locale
}

/** Sticky top bar shared by every host page: icon + title on the start side,
 *  the page's primary action plus notifications/theme on the end side. */
export function HostHeaderBar({ title, icon, action, locale }: HostHeaderBarProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b bg-background px-4 sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        {icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            {icon}
          </span>
        )}
        <h1 className="truncate text-xl font-bold tracking-tight">{title}</h1>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {action}
        <NotificationBell locale={locale} basePath="/host/notifications" />
        <ThemeToggle isHe={locale === 'he'} />
      </div>
    </header>
  )
}
