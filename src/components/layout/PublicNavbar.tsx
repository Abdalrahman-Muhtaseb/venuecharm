'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Menu, MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LanguageSwitcher } from '@/components/language-switcher'
import type { Locale } from '@/lib/i18n'

interface PublicNavbarProps {
  locale: Locale
}

export function PublicNavbar({ locale }: PublicNavbarProps) {
  const [user, setUser] = useState<{ email: string; avatar_url?: string; role?: string } | null>(null)
  const [open, setOpen] = useState(false)

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
  const isHost = user?.role === 'HOST'

  const navLinks = (
    <>
      <Link
        href="/venues"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        onClick={() => setOpen(false)}
      >
        {locale === 'he' ? 'חיפוש מקומות' : 'Find Venues'}
      </Link>
      <Link
        href="/how-it-works"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        onClick={() => setOpen(false)}
      >
        {locale === 'he' ? 'איך זה עובד' : 'How it works'}
      </Link>
      {!isHost && (
        <Link
          href="/register"
          className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
          onClick={() => setOpen(false)}
        >
          {locale === 'he' ? 'פרסם מקום' : 'Become a host'}
        </Link>
      )}
    </>
  )

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-primary">
          <MapPin className="h-5 w-5" />
          <span className="text-lg">VenueCharm</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">{navLinks}</nav>

        {/* Desktop right side */}
        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher currentLocale={locale} />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {isHost ? (
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">{locale === 'he' ? 'לוח מארח' : 'Host dashboard'}</Link>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem asChild>
                    <Link href="/profile">{locale === 'he' ? 'הפרופיל שלי' : 'My profile'}</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <form action="/api/auth/signout" method="post">
                    <button type="submit" className="w-full text-start text-destructive">
                      {locale === 'he' ? 'התנתקות' : 'Sign out'}
                    </button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">{locale === 'he' ? 'התחברות' : 'Sign in'}</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">{locale === 'he' ? 'הצטרפות' : 'Join'}</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <LanguageSwitcher currentLocale={locale} />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="flex flex-col gap-6 pt-10">
              <Link href="/" className="flex items-center gap-2 font-bold text-primary" onClick={() => setOpen(false)}>
                <MapPin className="h-5 w-5" />
                <span>VenueCharm</span>
              </Link>
              <nav className="flex flex-col gap-4">{navLinks}</nav>
              {user ? (
                <div className="mt-auto border-t pt-4">
                  <p className="mb-3 text-sm text-muted-foreground">{user.email}</p>
                  {isHost ? (
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/dashboard" onClick={() => setOpen(false)}>
                        {locale === 'he' ? 'לוח מארח' : 'Host dashboard'}
                      </Link>
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/profile" onClick={() => setOpen(false)}>
                        {locale === 'he' ? 'הפרופיל שלי' : 'My profile'}
                      </Link>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="mt-auto flex flex-col gap-2 border-t pt-4">
                  <Button variant="outline" asChild>
                    <Link href="/login" onClick={() => setOpen(false)}>{locale === 'he' ? 'התחברות' : 'Sign in'}</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/register" onClick={() => setOpen(false)}>{locale === 'he' ? 'הצטרפות' : 'Join'}</Link>
                  </Button>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
