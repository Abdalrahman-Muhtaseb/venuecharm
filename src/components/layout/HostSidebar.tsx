'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  CalendarDays,
  BookOpen,
  Settings,
  MapPin,
} from 'lucide-react'
import { cn } from '@/lib/utils'
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
    href: '/host/calendar',
    label: locale === 'he' ? 'יומן זמינות' : 'Availability',
    icon: CalendarDays,
  },
  {
    href: '/profile',
    label: locale === 'he' ? 'הגדרות' : 'Settings',
    icon: Settings,
  },
]

export function HostSidebar({ locale }: HostSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-e bg-background md:flex">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-primary">
          <MapPin className="h-5 w-5" />
          <span>VenueCharm</span>
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
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t p-3">
        <p className="px-3 text-xs text-muted-foreground">
          {locale === 'he' ? 'מארח VenueCharm' : 'VenueCharm Host'}
        </p>
      </div>
    </aside>
  )
}
