import Link from 'next/link'
import { cookies } from 'next/headers'
import { defaultLocale, getDictionary, isLocale, localeCookieName } from '@/lib/i18n'

export default function HomePage() {
  const persistedLocale = cookies().get(localeCookieName)?.value
  const locale = isLocale(persistedLocale) ? persistedLocale : defaultLocale
  const t = getDictionary(locale)

  return (
    <main className="min-h-screen px-6 py-10 text-slate-900">
      <section className="mx-auto flex max-w-6xl flex-col gap-10 rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm backdrop-blur md:p-12">
        <div className="max-w-3xl space-y-6">
          <span className="inline-flex rounded-full bg-violet-100 px-4 py-1 text-sm font-medium text-violet-700">
            {t.home.badge}
          </span>
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
            {t.home.title}
          </h1>
          <p className="text-lg leading-8 text-slate-600 md:text-xl">
            {t.home.description}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/register"
            className="rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white transition hover:bg-violet-700"
          >
            {t.home.createAccount}
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-800 transition hover:bg-slate-50"
          >
            {t.home.signIn}
          </Link>
          <Link
            href="/dashboard"
            className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-800 transition hover:bg-slate-50"
          >
            {t.home.dashboard}
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {t.home.highlights.map((item) => (
            <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm font-medium text-slate-700">
              {item}
            </div>
          ))}
        </div>

        <div className="rounded-2xl bg-violet-600 p-6 text-white">
          <p className="text-sm uppercase tracking-[0.3em] text-violet-100">{t.home.nextStepTitle}</p>
          <p className="mt-3 text-lg">
            {t.home.nextStepBody}
          </p>
        </div>
      </section>
    </main>
  )
}
