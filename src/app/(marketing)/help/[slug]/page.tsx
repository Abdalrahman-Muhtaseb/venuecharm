import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { ArrowLeft } from 'lucide-react'
import { getHelpArticle } from '@/lib/help-content'
import { defaultLocale, isLocale, localeCookieName, type Locale } from '@/lib/i18n'

export default function HelpArticlePage({ params }: { params: { slug: string } }) {
  const locale: Locale = isLocale(cookies().get(localeCookieName)?.value)
    ? (cookies().get(localeCookieName)!.value as Locale)
    : defaultLocale
  const isHe = locale === 'he'

  const article = getHelpArticle(params.slug)
  if (!article) notFound()

  const Icon = article.icon

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Link
        href="/help"
        className="mb-8 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
        {isHe ? 'חזרה למרכז העזרה' : 'Back to help center'}
      </Link>

      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
          <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
        </div>
        <h1 className="text-3xl font-bold">{article.title[locale]}</h1>
      </div>
      <p className="mt-4 text-lg text-muted-foreground">{article.summary[locale]}</p>

      <div className="mt-10 flex flex-col gap-8">
        {article.sections.map((s, i) => (
          <section key={i}>
            <h2 className="text-xl font-semibold">{s.heading[locale]}</h2>
            <p className="mt-2 leading-7 text-muted-foreground">{s.body[locale]}</p>
          </section>
        ))}
      </div>
    </div>
  )
}
