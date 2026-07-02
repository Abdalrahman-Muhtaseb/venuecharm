'use client'

import type { ComponentType } from 'react'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  Users,
  BookOpen,
  BarChart2,
  Layers,
  Wrench,
} from 'lucide-react'
import { HostHeaderBar } from '@/components/layout/HostHeaderBar'
import type { Locale } from '@/lib/i18n'

interface HeaderEntry {
  match: RegExp
  title: { he: string; en: string }
  icon: ComponentType<{ className?: string }>
}

const ENTRIES: HeaderEntry[] = [
  { match: /^\/admin\/dashboard$/, title: { he: 'לוח בקרה', en: 'Dashboard' }, icon: LayoutDashboard },
  { match: /^\/admin\/users$/, title: { he: 'משתמשים', en: 'Users' }, icon: Users },
  { match: /^\/admin\/bookings$/, title: { he: 'הזמנות', en: 'Bookings' }, icon: BookOpen },
  { match: /^\/admin\/analytics$/, title: { he: 'אנליטיקה', en: 'Analytics' }, icon: BarChart2 },
  { match: /^\/admin\/amenities$/, title: { he: 'שירותים', en: 'Amenities' }, icon: Layers },
  { match: /^\/admin\/tools$/, title: { he: 'כלי פיתוח', en: 'Dev Tools' }, icon: Wrench },
  { match: /^\/admin\/venues$/, title: { he: 'נכסים', en: 'Venues' }, icon: Building2 },
  { match: /^\/admin\/users\/[^/]+$/, title: { he: 'פרטי משתמש', en: 'User Details' }, icon: Users },
  { match: /^\/admin\/bookings\/[^/]+$/, title: { he: 'פרטי הזמנה', en: 'Booking Details' }, icon: BookOpen },
  { match: /^\/admin\/[^/]+$/, title: { he: 'סקירת נכס', en: 'Venue Review' }, icon: Building2 },
]

export function AdminPanelHeaderBar({ locale }: { locale: Locale }) {
  const pathname = usePathname()
  const isHe = locale === 'he'
  const entry = ENTRIES.find((e) => e.match.test(pathname))
  const title = entry ? (isHe ? entry.title.he : entry.title.en) : 'Admin'

  const Icon = entry?.icon
  return (
    <HostHeaderBar
      title={title}
      icon={Icon ? <Icon className="h-[18px] w-[18px]" /> : undefined}
      locale={locale}
    />
  )
}
