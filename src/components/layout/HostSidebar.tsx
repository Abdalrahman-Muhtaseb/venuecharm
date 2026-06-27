'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogoFull } from '@/components/ui/LogoIcon'
import {
  LayoutDashboard,
  Building2,
  CalendarDays,
  BookOpen,
  CreditCard,
  MessageCircle,
  Settings,
  Compass,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { useUnreadMessages } from '@/hooks/useUnreadMessages'
import type { Locale } from '@/lib/i18n'

interface HostSidebarProps {
  locale: Locale
}

const getLinks = (locale: Locale) => [
  {
    href: '/dashboard',
    label: locale === 'he' ? 'לוח בקרה' : 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/listings',
    label: locale === 'he' ? 'הנכסים שלי' : 'My listings',
    icon: Building2,
  },
  {
    href: '/host/bookings',
    label: locale === 'he' ? 'הזמנות' : 'Bookings',
    icon: BookOpen,
  },
  {
    href: '/messages',
    label: locale === 'he' ? 'הודעות' : 'Messages',
    icon: MessageCircle,
  },
  {
    href: '/host/calendar',
    label: locale === 'he' ? 'יומן זמינות' : 'Availability',
    icon: CalendarDays,
  },
  {
    href: '/host/payouts',
    label: locale === 'he' ? 'תשלומים' : 'Payouts',
    icon: CreditCard,
  },
  {
    href: '/profile',
    label: locale === 'he' ? 'הגדרות' : 'Settings',
    icon: Settings,
  },
]

export function HostSidebar({ locale }: HostSidebarProps) {
  const pathname = usePathname()
  const unread = useUnreadMessages()

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-e bg-background md:flex">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-primary">
          <LogoFull className="h-10 w-auto" />
        </Link>
      </div>

      {/* Mode switch — leave hosting, back to the main site */}
      <div className="border-b p-3">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
        >
          <Compass className="h-4 w-4 shrink-0" />
          <span className="flex-1">{locale === 'he' ? 'יציאה מאירוח' : 'Exit hosting'}</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {getLinks(locale).map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {href === '/messages' && unread > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="flex items-center justify-between border-t p-3">
        <p className="px-3 text-xs text-muted-foreground">
          {locale === 'he' ? 'מארח VenueCharm' : 'VenueCharm Host'}
        </p>
        <ThemeToggle isHe={locale === 'he'} />
      </div>
    </aside>
  )
}
