import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { LanguageSwitcher } from '@/components/language-switcher'
import type { Locale } from '@/lib/i18n'

interface AuthShellProps {
  locale: Locale
  children: React.ReactNode
}

export function AuthShell({ locale, children }: AuthShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-16 items-center justify-between border-b bg-background px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-primary">
          <MapPin className="h-5 w-5" />
          <span>VenueCharm</span>
        </Link>
        <LanguageSwitcher currentLocale={locale} />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        {children}
      </main>
    </div>
  )
}
