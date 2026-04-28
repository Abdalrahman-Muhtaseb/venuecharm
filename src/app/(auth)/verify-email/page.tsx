import Link from 'next/link'
import { cookies } from 'next/headers'
import { defaultLocale, getDictionary, isLocale, localeCookieName } from '@/lib/i18n'

export default function VerifyEmailPage() {
  const persistedLocale = cookies().get(localeCookieName)?.value
  const locale = isLocale(persistedLocale) ? persistedLocale : defaultLocale
  const t = getDictionary(locale)

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6 py-12">
      <section className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-sm text-center">
        <h1 className="text-3xl font-bold text-slate-900">{t.auth.verifyTitle}</h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          {t.auth.verifyDescription}
        </p>
        <Link
          href="/login"
          className="mt-8 inline-flex rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white transition hover:bg-violet-700"
        >
          {t.auth.goToLogin}
        </Link>
      </section>
    </main>
  )
}
