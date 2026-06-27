import Link from 'next/link'
import { cookies } from 'next/headers'
import { LifeBuoy } from 'lucide-react'
import { BrandBackground } from '@/components/layout/BrandBackground'
import { helpArticles } from '@/lib/help-content'
import { defaultLocale, isLocale, localeCookieName, type Locale } from '@/lib/i18n'

export default function HelpHubPage() {
  const locale: Locale = isLocale(cookies().get(localeCookieName)?.value)
    ? (cookies().get(localeCookieName)!.value as Locale)
    : defaultLocale
  const isHe = locale === 'he'

  return (
    <div className="relative">
      <BrandBackground />
      <div className="mx-auto max-w-5xl px-6 py-20">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <LifeBuoy className="h-7 w-7 text-primary" aria-hidden="true" />
          </div>
          <h1 className="text-4xl font-bold">{isHe ? 'מרכז העזרה' : 'Help center'}</h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            {isHe
              ? 'מדריכים קצרים שיעזרו לכם להזמין, לארח ולהפיק את המרב מ-VenueCharm.'
              : 'Short guides to help you book, host, and get the most out of VenueCharm.'}
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2">
          {helpArticles.map(({ slug, icon: Icon, title, summary }) => (
            <Link
              key={slug}
              href={`/help/${slug}`}
              className="group flex gap-4 rounded-2xl border bg-background p-5 shadow-sm transition hover:border-primary/50 hover:shadow-md"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-semibold group-hover:text-primary">{title[locale]}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{summary[locale]}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
