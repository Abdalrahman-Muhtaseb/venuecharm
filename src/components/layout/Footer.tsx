import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { LanguageSwitcher } from '@/components/language-switcher'
import type { Locale } from '@/lib/i18n'

interface FooterProps {
  locale: Locale
}

export function Footer({ locale }: FooterProps) {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <Link href="/" className="flex items-center gap-2 font-bold text-primary">
              <MapPin className="h-5 w-5" />
              <span>VenueCharm</span>
            </Link>
            <p className="max-w-xs text-sm text-muted-foreground">
              {locale === 'he'
                ? 'הפלטפורמה החכמה לאיתור והזמנת מקומות לאירועים בישראל.'
                : 'The smart platform for finding and booking event venues in Israel.'}
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-8">
            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold">{locale === 'he' ? 'פלטפורמה' : 'Platform'}</p>
              <nav className="flex flex-col gap-2">
                <Link href="/venues" className="text-sm text-muted-foreground hover:text-foreground">
                  {locale === 'he' ? 'חיפוש מקומות' : 'Find venues'}
                </Link>
                <Link href="/how-it-works" className="text-sm text-muted-foreground hover:text-foreground">
                  {locale === 'he' ? 'איך זה עובד' : 'How it works'}
                </Link>
                <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground">
                  {locale === 'he' ? 'עמלות ותמחור' : 'Pricing'}
                </Link>
              </nav>
            </div>

            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold">{locale === 'he' ? 'מארחים' : 'Hosts'}</p>
              <nav className="flex flex-col gap-2">
                <Link href="/register" className="text-sm text-muted-foreground hover:text-foreground">
                  {locale === 'he' ? 'פרסם מקום' : 'List your space'}
                </Link>
                <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
                  {locale === 'he' ? 'לוח מארח' : 'Host dashboard'}
                </Link>
              </nav>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-4 border-t pt-6 md:flex-row md:items-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} VenueCharm.{' '}
            {locale === 'he' ? 'כל הזכויות שמורות.' : 'All rights reserved.'}
          </p>
          <LanguageSwitcher currentLocale={locale} />
        </div>
      </div>
    </footer>
  )
}
