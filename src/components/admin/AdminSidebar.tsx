'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogoFull } from '@/components/ui/LogoIcon'
import {
  LayoutDashboard,
  Building2,
  Users,
  BookOpen,
  BarChart2,
  Layers,
  Wrench,
  Compass,
  LogOut,
  Menu,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { useCurrentUser } from '@/components/auth/UserProvider'
import type { Locale } from '@/lib/i18n'
import { LangToggle } from '@/components/layout/LangToggle'

interface AdminNavProps {
  locale: Locale
}

const getLinks = (locale: Locale) => [
  { href: '/admin/dashboard', label: locale === 'he' ? 'לוח בקרה' : 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/venues', label: locale === 'he' ? 'נכסים' : 'Venues', icon: Building2, exact: true },
  { href: '/admin/users', label: locale === 'he' ? 'משתמשים' : 'Users', icon: Users, exact: false },
  { href: '/admin/bookings', label: locale === 'he' ? 'הזמנות' : 'Bookings', icon: BookOpen, exact: false },
  { href: '/admin/analytics', label: locale === 'he' ? 'אנליטיקה' : 'Analytics', icon: BarChart2, exact: false },
  { href: '/admin/amenities', label: locale === 'he' ? 'שירותים' : 'Amenities', icon: Layers, exact: false },
  { href: '/admin/tools', label: locale === 'he' ? 'כלי פיתוח' : 'Dev Tools', icon: Wrench, exact: false },
]

function NavLinks({ locale, onNavigate }: { locale: Locale; onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
      {getLinks(locale).map(({ href, label, icon: Icon, exact }) => {
        const active = exact
          ? pathname === href
          : pathname === href || pathname.startsWith(href + '/')
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
          </Link>
        )
      })}
    </nav>
  )
}

function ExitAdmin({ locale, onNavigate }: { locale: Locale; onNavigate?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onNavigate}
      className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
    >
      <Compass className="h-4 w-4 shrink-0" />
      <span className="flex-1">{locale === 'he' ? 'חזרה לאתר' : 'Back to site'}</span>
    </Link>
  )
}

function AdminProfileLink({ locale, onNavigate }: { locale: Locale; onNavigate?: () => void }) {
  const user = useCurrentUser()
  const isHe = locale === 'he'
  const displayName =
    [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim() ||
    user?.email?.split('@')[0] ||
    (isHe ? 'הפרופיל שלי' : 'My profile')
  const initials = user?.first_name
    ? `${user.first_name[0]}${user.last_name?.[0] ?? ''}`.toUpperCase()
    : (user?.email?.[0] ?? '?').toUpperCase()

  return (
    <Link
      href="/profile"
      onClick={onNavigate}
      className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
    >
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={user?.avatar_url ?? undefined} />
        <AvatarFallback className="bg-primary text-xs text-primary-foreground">{initials}</AvatarFallback>
      </Avatar>
      <span className="truncate">{displayName}</span>
    </Link>
  )
}

function SignOutButton({ locale }: { locale: Locale }) {
  const isHe = locale === 'he'
  return (
    <form action="/api/auth/signout" method="post">
      <button
        type="submit"
        aria-label={isHe ? 'התנתקות' : 'Sign out'}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </form>
  )
}

function SidebarBody({ locale, onNavigate }: { locale: Locale; onNavigate?: () => void }) {
  const isHe = locale === 'he'
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between border-b px-4">
        <Link href="/" onClick={onNavigate} className="flex items-center gap-2 font-bold text-primary">
          <LogoFull className="h-9 w-auto" />
        </Link>
        <Badge variant="secondary" className="text-xs font-semibold">
          {isHe ? 'מנהל' : 'Admin'}
        </Badge>
      </div>

      <NavLinks locale={locale} onNavigate={onNavigate} />

      <div className="space-y-2 border-t p-3">
        <LangToggle locale={locale} />
        <ExitAdmin locale={locale} onNavigate={onNavigate} />
        <div className="flex items-center gap-1">
          <AdminProfileLink locale={locale} onNavigate={onNavigate} />
          <SignOutButton locale={locale} />
        </div>
      </div>
    </div>
  )
}

export function AdminSidebar({ locale }: AdminNavProps) {
  return (
    <aside className="hidden h-full w-60 shrink-0 flex-col border-e bg-background md:flex">
      <SidebarBody locale={locale} />
    </aside>
  )
}

export function AdminMobileNav({ locale }: AdminNavProps) {
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
          <SheetTitle className="sr-only">{isHe ? 'תפריט ניהול' : 'Admin menu'}</SheetTitle>
          <SidebarBody locale={locale} onNavigate={close} />
        </SheetContent>
      </Sheet>
    </header>
  )
}
