'use client'

import Link from 'next/link'
import { Suspense } from 'react'
import {
  Menu,
  MessageCircle,
  LayoutDashboard,
  ShieldCheck,
  CalendarCheck,
  Sparkles,
  Heart,
  User,
  LifeBuoy,
  LogOut,
  Sun,
  Moon,
  Building2,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { LogoFull } from '@/components/ui/LogoIcon'
import { usePathname, useRouter } from 'next/navigation'
import { useCurrentUser } from '@/components/auth/UserProvider'
import { useUnreadMessages } from '@/hooks/useUnreadMessages'
import { NotificationBell } from '@/components/layout/NotificationBell'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { SearchBarAutocomplete } from '@/components/search/SearchBarAutocomplete'
import { FilterDialogButton } from '@/components/search/FilterDialogButton'
import { useAuthModal } from '@/components/auth/AuthModalProvider'
import { becomeHost } from '@/actions/auth'
import { localeCookieName, locales, type Locale } from '@/lib/i18n'

interface PublicNavbarProps {
  locale: Locale
}

function SearchRow({ locale, showFilters }: { locale: Locale; showFilters: boolean }) {
  return (
    <>
      <div className="min-w-0 flex-1">
        <SearchBarAutocomplete locale={locale} compact />
      </div>
      {showFilters && <FilterDialogButton locale={locale} />}
    </>
  )
}

function SearchRowSkeleton({ showFilters }: { showFilters: boolean }) {
  return (
    <>
      <div className="h-12 min-w-0 flex-1 animate-pulse rounded-full bg-muted" />
      {showFilters && <div className="h-10 w-24 shrink-0 animate-pulse rounded-full bg-muted" />}
    </>
  )
}

export function PublicNavbar({ locale }: PublicNavbarProps) {
  const user = useCurrentUser()
  const pathname = usePathname()
  const router = useRouter()
  const unread = useUnreadMessages()
  const { openLogin } = useAuthModal()
  const { resolvedTheme, setTheme } = useTheme()
  const isHe = locale === 'he'

  const changeLocale = (next: Locale) => {
    document.cookie = `${localeCookieName}=${next}; path=/; max-age=31536000`
    router.refresh()
  }
  const isVenuePage = pathname === '/venues'
  // Homepage hero owns the search pill, so the navbar shows it only on /venues
  const showSearch = isVenuePage

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? '?'
  const isHost  = user?.role === 'HOST'
  const isAdmin = user?.role === 'ADMIN'
  const showBecomeHost = !isHost && !isAdmin

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">

      {/* ── Main row ── */}
      <div
        className={`flex items-center justify-between gap-4 px-4 sm:px-6 ${
          showSearch ? 'h-16 md:h-20' : 'h-16'
        }`}
      >

        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2 font-bold text-primary">
          <LogoFull className="h-11 w-auto" />
        </Link>

        {/* ── Search pill — inside the header (homepage + venues page, md+) ── */}
        {showSearch && (
          <div className="hidden min-w-0 flex-1 items-center justify-center md:flex">
            <div className="flex w-full max-w-3xl items-center gap-3">
              <Suspense fallback={<SearchRowSkeleton showFilters={isVenuePage} />}>
                <SearchRow locale={locale} showFilters={isVenuePage} />
              </Suspense>
            </div>
          </div>
        )}

        {/* Right cluster */}
        <div className="flex shrink-0 items-center gap-2">

          {/* Become a host — hidden on mobile (in hamburger) */}
          {showBecomeHost && (
            user ? (
              <form action={becomeHost} className="hidden sm:flex">
                <Button type="submit" variant="outline" size="sm">
                  {isHe ? 'פרסם מקום' : 'Become a host'}
                </Button>
              </form>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:flex"
                onClick={() => openLogin(pathname)}
              >
                {isHe ? 'פרסם מקום' : 'Become a host'}
              </Button>
            )
          )}

          {/* Notifications */}
          {user && <NotificationBell locale={locale} />}

          {/* Avatar → /profile  OR  Sign in + Join */}
          {user ? (
            <Link
              href="/profile"
              aria-label={isHe ? 'הפרופיל שלי' : 'My profile'}
              className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Avatar className="h-9 w-9">
                <AvatarImage src={user.avatar_url ?? undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button size="sm" onClick={() => openLogin(pathname)}>
                {isHe ? 'התחברות' : 'Log in'}
              </Button>
            </div>
          )}

          {/* Hamburger ── far right */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                aria-label={isHe ? 'תפריט' : 'Menu'}
                className="rounded-full"
              >
                <Menu className="h-4 w-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              {user ? (
                <>
                  {/* Mode switch — hosting / traveling */}
                  {(isHost || isAdmin) && (
                    <>
                      {isAdmin && (
                        <DropdownMenuItem asChild>
                          <Link href="/admin">
                            <ShieldCheck className="me-2 h-4 w-4" />
                            {isHe ? 'פאנל ניהול' : 'Admin panel'}
                          </Link>
                        </DropdownMenuItem>
                      )}
                      {isHost && (
                        <DropdownMenuItem asChild>
                          <Link href="/dashboard">
                            <LayoutDashboard className="me-2 h-4 w-4" />
                            {isHe ? 'מעבר לאירוח' : 'Switch to hosting'}
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                    </>
                  )}

                  {/* Become a host (renters only, mobile) */}
                  {showBecomeHost && (
                    <DropdownMenuItem asChild className="sm:hidden">
                      <form action={becomeHost} className="w-full">
                        <button type="submit" className="flex w-full items-center text-start">
                          <Building2 className="me-2 h-4 w-4" />
                          {isHe ? 'פרסם מקום' : 'Become a host'}
                        </button>
                      </form>
                    </DropdownMenuItem>
                  )}

                  {/* Traveling — available to everyone who is signed in */}
                  <DropdownMenuItem asChild>
                    <Link href="/bookings">
                      <CalendarCheck className="me-2 h-4 w-4" />
                      {isHe ? 'ההזמנות שלי' : 'My bookings'}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/rfp">
                      <Sparkles className="me-2 h-4 w-4" />
                      {isHe ? 'התאמה חכמה' : 'Smart matching'}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/favorites">
                      <Heart className="me-2 h-4 w-4" />
                      {isHe ? 'המועדפים שלי' : 'My favourites'}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/messages">
                      <MessageCircle className="me-2 h-4 w-4" />
                      <span className="flex-1">{isHe ? 'הודעות' : 'Messages'}</span>
                      {unread > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
                          {unread > 9 ? '9+' : unread}
                        </span>
                      )}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <User className="me-2 h-4 w-4" />
                      {isHe ? 'הפרופיל שלי' : 'My profile'}
                    </Link>
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={() => openLogin(pathname)}>
                    <User className="me-2 h-4 w-4" />
                    {isHe ? 'התחברות' : 'Log in'}
                  </DropdownMenuItem>
                  {showBecomeHost && (
                    <DropdownMenuItem onClick={() => openLogin(pathname)}>
                      <Building2 className="me-2 h-4 w-4" />
                      {isHe ? 'פרסם מקום' : 'Become a host'}
                    </DropdownMenuItem>
                  )}
                </>
              )}

              {/* ── Help ── */}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/help">
                  <LifeBuoy className="me-2 h-4 w-4" />
                  {isHe ? 'מרכז עזרה' : 'Help center'}
                </Link>
              </DropdownMenuItem>

              {/* ── Appearance ── */}
              <DropdownMenuSeparator />
              <div className="flex items-center gap-1 px-1 py-1">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium transition ${
                    resolvedTheme !== 'dark'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <Sun className="h-4 w-4" aria-hidden="true" />
                  {isHe ? 'בהיר' : 'Light'}
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium transition ${
                    resolvedTheme === 'dark'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <Moon className="h-4 w-4" aria-hidden="true" />
                  {isHe ? 'כהה' : 'Dark'}
                </button>
              </div>

              {/* ── Language toggle ── */}
              <div className="flex items-center gap-1 px-1 py-1">
                {locales.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => changeLocale(l)}
                    className={`flex-1 rounded-md px-2 py-1.5 text-sm font-medium transition ${
                      locale === l
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {l === 'he' ? 'עברית' : 'English'}
                  </button>
                ))}
              </div>

              {user && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <form action="/api/auth/signout" method="post" className="w-full">
                      <button type="submit" className="flex w-full items-center text-start text-destructive">
                        <LogOut className="me-2 h-4 w-4" />
                        {isHe ? 'התנתקות' : 'Sign out'}
                      </button>
                    </form>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </div>

      {/* ── Search row below header (homepage + venues page, mobile only) ── */}
      {showSearch && (
        <div className="border-t px-4 pb-3 pt-2 md:hidden">
          <div className="flex items-center gap-3">
            <Suspense fallback={<SearchRowSkeleton showFilters={isVenuePage} />}>
              <SearchRow locale={locale} showFilters={isVenuePage} />
            </Suspense>
          </div>
        </div>
      )}

    </header>
  )
}
