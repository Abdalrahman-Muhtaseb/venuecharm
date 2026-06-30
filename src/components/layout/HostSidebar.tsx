'use client'

import { useState } from 'react'
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
  Bell,
  Settings,
  Compass,
  Menu,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { useUnreadMessages } from '@/hooks/useUnreadMessages'
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications'
import type { Locale } from '@/lib/i18n'

interface HostNavProps {
  locale: Locale
}

const getLinks = (locale: Locale) => [
  { href: '/host/dashboard', label: locale === 'he' ? 'לוח בקרה' : 'Dashboard', icon: LayoutDashboard },
  { href: '/host/listings', label: locale === 'he' ? 'הנכסים שלי' : 'My listings', icon: Building2 },
  { href: '/host/bookings', label: locale === 'he' ? 'הזמנות' : 'Bookings', icon: BookOpen },
  { href: '/host/messages', label: locale === 'he' ? 'הודעות' : 'Messages', icon: MessageCircle },
  { href: '/host/notifications', label: locale === 'he' ? 'התראות' : 'Notifications', icon: Bell },
  { href: '/host/calendar', label: locale === 'he' ? 'יומן זמינות' : 'Availability', icon: CalendarDays },
  { href: '/host/payouts', label: locale === 'he' ? 'תשלומים' : 'Payouts', icon: CreditCard },
  { href: '/profile', label: locale === 'he' ? 'הגדרות' : 'Settings', icon: Settings },
]

function NavLinks({ locale, onNavigate }: { locale: Locale; onNavigate?: () => void }) {
  const pathname = usePathname()
  const unread = useUnreadMessages()
  const notifUnread = useUnreadNotifications()

  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
      {getLinks(locale).map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + '/')
        const badge =
          href === '/host/messages' ? unread : href === '/host/notifications' ? notifUnread : 0
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              active
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="flex-1">{label}</span>
            {badge > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
                {badge > 9 ? '9+' : badge}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}

function ExitHosting({ locale, onNavigate }: { locale: Locale; onNavigate?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onNavigate}
      className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
    >
      <Compass className="h-4 w-4 shrink-0" />
      <span className="flex-1">{locale === 'he' ? 'יציאה מאירוח' : 'Exit hosting'}</span>
    </Link>
  )
}

/** Logo → nav → (bottom) exit hosting + footer. Shared by desktop + mobile. */
function SidebarBody({ locale, onNavigate }: { locale: Locale; onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/" onClick={onNavigate} className="flex items-center gap-2 font-bold text-primary">
          <LogoFull className="h-9 w-auto" />
        </Link>
      </div>

      <NavLinks locale={locale} onNavigate={onNavigate} />

      {/* Bottom — exit hosting + appearance */}
      <div className="space-y-3 border-t p-3">
        <ExitHosting locale={locale} onNavigate={onNavigate} />
        <div className="flex items-center justify-between">
          <p className="px-1 text-xs text-muted-foreground">
            {locale === 'he' ? 'מארח VenueCharm' : 'VenueCharm Host'}
          </p>
          <ThemeToggle isHe={locale === 'he'} />
        </div>
      </div>
    </div>
  )
}

/** Desktop: fixed, full-height sidebar that never scrolls out of view. */
export function HostSidebar({ locale }: HostNavProps) {
  return (
    <aside className="hidden h-full w-60 shrink-0 flex-col border-e bg-background md:flex">
      <SidebarBody locale={locale} />
    </aside>
  )
}

/** Mobile: top bar with a hamburger that opens the nav in a slide-over drawer. */
export function HostMobileNav({ locale }: HostNavProps) {
  const [open, setOpen] = useState(false)
  const isHe = locale === 'he'
  const close = () => setOpen(false)

  return (
    <header className="flex h-14 items-center justify-between border-b px-4 md:hidden">
      <Link href="/" className="flex items-center font-bold text-primary">
        <LogoFull className="h-8 w-auto" />
      </Link>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          aria-label={isHe ? 'תפריט' : 'Menu'}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border"
        >
          <Menu className="h-4 w-4" aria-hidden="true" />
        </SheetTrigger>
        <SheetContent side={isHe ? 'right' : 'left'} className="w-72 p-0">
          <SheetTitle className="sr-only">{isHe ? 'תפריט אירוח' : 'Hosting menu'}</SheetTitle>
          <SidebarBody locale={locale} onNavigate={close} />
        </SheetContent>
      </Sheet>
    </header>
  )
}
