'use client'

import Link from 'next/link'
import { Suspense, useEffect, useState } from 'react'
import { Menu, MapPin } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
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
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import type { Locale } from '@/lib/i18n'

interface PublicNavbarProps {
  locale: Locale
}

function SearchRow({ locale, showFilters }: { locale: Locale; showFilters: boolean }) {
  return (
    <>
      <div className="min-w-0 flex-1">
        <SearchBarAutocomplete locale={locale} />
      </div>
      {showFilters && <FilterDialogButton locale={locale} />}
    </>
  )
}

function SearchRowSkeleton({ showFilters }: { showFilters: boolean }) {
  return (
    <>
      <div className="h-14 min-w-0 flex-1 animate-pulse rounded-full bg-muted md:h-16" />
      {showFilters && <div className="h-10 w-24 shrink-0 animate-pulse rounded-full bg-muted" />}
    </>
  )
}

export function PublicNavbar({ locale }: PublicNavbarProps) {
  const [user, setUser] = useState<{ email: string; avatar_url?: string; role?: string } | null>(null)
  const pathname = usePathname()
  const isHe = locale === 'he'
  const isVenuePage = pathname === '/venues'
  // Homepage hero owns the search pill, so the navbar shows it only on /venues
  const showSearch = isVenuePage

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      const { data: profile } = await supabase
        .from('users')
        .select('email, avatar_url, role')
        .eq('id', data.user.id)
        .single()
      if (profile) setUser(profile)
    })
  }, [])

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? '?'
  const isHost  = user?.role === 'HOST'
  const isAdmin = user?.role === 'ADMIN'
  const showBecomeHost = !isHost && !isAdmin

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">

      {/* ── Main row ── */}
      <div
        className={`mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 ${
          showSearch ? 'h-16 md:h-20' : 'h-16'
        }`}
      >

        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2 font-bold text-primary">
          <MapPin className="h-5 w-5" />
          <span className="text-lg">VenueCharm</span>
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

          <ThemeToggle isHe={isHe} />

          {/* Become a host — hidden on mobile (in hamburger) */}
          {showBecomeHost && (
            <Button variant="outline" size="sm" asChild className="hidden sm:flex">
              <Link href={user ? '/host/listings/new' : '/register'}>
                {isHe ? 'פרסם מקום' : 'Become a host'}
              </Link>
            </Button>
          )}

          {/* Avatar → /profile  OR  Sign in + Join */}
          {user ? (
            <Link
              href="/profile"
              aria-label={isHe ? 'הפרופיל שלי' : 'My profile'}
              className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Avatar className="h-9 w-9">
                <AvatarImage src={user.avatar_url} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">{isHe ? 'התחברות' : 'Sign in'}</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">{isHe ? 'הצטרפות' : 'Join'}</Link>
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
            <DropdownMenuContent align="end" className="w-52">
              {user ? (
                <>
                  {showBecomeHost && (
                    <DropdownMenuItem asChild className="sm:hidden">
                      <Link href="/host/listings/new">
                        {isHe ? 'פרסם מקום' : 'Become a host'}
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin">{isHe ? 'פאנל ניהול' : 'Admin panel'}</Link>
                    </DropdownMenuItem>
                  )}
                  {isHost && (
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard">{isHe ? 'לוח מארח' : 'Host dashboard'}</Link>
                    </DropdownMenuItem>
                  )}
                  {!isHost && !isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/bookings">{isHe ? 'ההזמנות שלי' : 'My bookings'}</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/favorites">{isHe ? 'המועדפים שלי' : 'My favourites'}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <form action="/api/auth/signout" method="post" className="w-full">
                      <button type="submit" className="w-full text-start text-destructive">
                        {isHe ? 'התנתקות' : 'Sign out'}
                      </button>
                    </form>
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/login">{isHe ? 'התחברות' : 'Sign in'}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/register">{isHe ? 'הצטרפות' : 'Join'}</Link>
                  </DropdownMenuItem>
                  {showBecomeHost && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/register">{isHe ? 'פרסם מקום' : 'Become a host'}</Link>
                      </DropdownMenuItem>
                    </>
                  )}
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
