import { signUp } from '@/actions/auth'
import { cookies } from 'next/headers'
import { defaultLocale, getDictionary, isLocale, localeCookieName } from '@/lib/i18n'

export default function RegisterPage() {
  const persistedLocale = cookies().get(localeCookieName)?.value
  const locale = isLocale(persistedLocale) ? persistedLocale : defaultLocale
  const t = getDictionary(locale)

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6 py-12">
      <section className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold text-slate-900">{t.auth.registerTitle}</h1>
          <p className="text-sm text-slate-600">{t.auth.registerDescription}</p>
        </div>

        <form action={signUp} className="mt-8 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="email">
              {t.auth.email}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-violet-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="password">
              {t.auth.password}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-violet-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="role">
              {t.auth.accountType}
            </label>
            <select
              id="role"
              name="role"
              defaultValue="RENTER"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-violet-500"
            >
              <option value="RENTER">{t.auth.renter}</option>
              <option value="HOST">{t.auth.host}</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-violet-600 px-4 py-3 font-semibold text-white transition hover:bg-violet-700"
          >
            {t.auth.createAccount}
          </button>
        </form>
      </section>
    </main>
  )
}
