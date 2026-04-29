import Link from 'next/link'
import { cookies } from 'next/headers'
import { MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { defaultLocale, isLocale, localeCookieName } from '@/lib/i18n'

export default function NotFound() {
  const locale = isLocale(cookies().get(localeCookieName)?.value)
    ? (cookies().get(localeCookieName)!.value as 'he' | 'en')
    : defaultLocale

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <MapPin className="h-8 w-8 text-primary" />
      </div>
      <div>
        <h1 className="text-6xl font-bold text-primary">404</h1>
        <p className="mt-3 text-xl font-semibold">
          {locale === 'he' ? 'הדף לא נמצא' : 'Page not found'}
        </p>
        <p className="mt-2 text-muted-foreground">
          {locale === 'he'
            ? 'הדף שחיפשת לא קיים או הוסר.'
            : "The page you're looking for doesn't exist or has been removed."}
        </p>
      </div>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/">{locale === 'he' ? 'חזרה לדף הבית' : 'Go home'}</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/venues">{locale === 'he' ? 'חיפוש מקומות' : 'Find venues'}</Link>
        </Button>
      </div>
    </div>
  )
}
