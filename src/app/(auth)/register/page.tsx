import { signUp } from '@/actions/auth'

export default function RegisterPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6 py-12">
      <section className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold text-slate-900">Create account</h1>
          <p className="text-sm text-slate-600">Join as a host or renter.</p>
        </div>

        <form action={signUp} className="mt-8 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="email">
              Email
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
              Password
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
              Account type
            </label>
            <select
              id="role"
              name="role"
              defaultValue="RENTER"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-violet-500"
            >
              <option value="RENTER">Renter</option>
              <option value="HOST">Host</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-violet-600 px-4 py-3 font-semibold text-white transition hover:bg-violet-700"
          >
            Create account
          </button>
        </form>
      </section>
    </main>
  )
}
