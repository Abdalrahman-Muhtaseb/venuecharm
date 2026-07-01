'use client'

import type { ComponentType } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Plus, LayoutDashboard, Building2, BookOpen, CalendarDays, CreditCard, Sparkles, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HostHeaderBar } from '@/components/layout/HostHeaderBar'
import type { Locale } from '@/lib/i18n'

interface HeaderEntry {
  match: RegExp
  title: { he: string; en: string }
  icon: ComponentType<{ className?: string }>
  action?: { he: string; en: string; href: string }
}

const ADD_LISTING_ACTION = { he: 'הוסף נכס', en: 'Add listing', href: '/host/listings/new' }

/** Ordered by specificity — first match wins. Most panel titles/actions are
 *  static per route, so a pathname lookup avoids per-page header wiring. */
const ENTRIES: HeaderEntry[] = [
  { match: /^\/host\/dashboard$/, title: { he: 'לוח בקרה', en: 'Dashboard' }, icon: LayoutDashboard, action: ADD_LISTING_ACTION },
  { match: /^\/host\/listings\/new$/, title: { he: 'נכס חדש', en: 'New listing' }, icon: Building2 },
  { match: /^\/host\/listings\/[^/]+\/edit$/, title: { he: 'עריכת נכס', en: 'Edit listing' }, icon: Building2 },
  { match: /^\/host\/listings$/, title: { he: 'הנכסים שלי', en: 'My listings' }, icon: Building2 },
  { match: /^\/host\/bookings\/[^/]+$/, title: { he: 'פרטי הזמנה', en: 'Booking details' }, icon: BookOpen },
  { match: /^\/host\/bookings$/, title: { he: 'הזמנות', en: 'Bookings' }, icon: BookOpen },
  { match: /^\/host\/calendar$/, title: { he: 'יומן זמינות', en: 'Availability calendar' }, icon: CalendarDays },
  { match: /^\/host\/payouts$/, title: { he: 'תשלומים', en: 'Payouts' }, icon: CreditCard },
  { match: /^\/host\/onboarding$/, title: { he: 'הפיכה למארח', en: 'Become a host' }, icon: Sparkles },
  { match: /^\/host\/notifications$/, title: { he: 'התראות', en: 'Notifications' }, icon: Bell },
]

export function HostPanelHeaderBar({ locale }: { locale: Locale }) {
  const pathname = usePathname()
  const isHe = locale === 'he'
  const entry = ENTRIES.find((e) => e.match.test(pathname))
  const title = entry ? (isHe ? entry.title.he : entry.title.en) : ''

  const action = entry?.action && (
    <Button asChild size="sm">
      <Link href={entry.action.href}>
        <Plus className="h-4 w-4 sm:me-2" />
        <span className="hidden sm:inline">{isHe ? entry.action.he : entry.action.en}</span>
      </Link>
    </Button>
  )

  const Icon = entry?.icon
  return (
    <HostHeaderBar
      title={title}
      icon={Icon ? <Icon className="h-[18px] w-[18px]" /> : undefined}
      action={action}
      locale={locale}
    />
  )
}
