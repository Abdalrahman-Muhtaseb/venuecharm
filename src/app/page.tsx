import Link from 'next/link'

const highlights = [
  'Hebrew / RTL marketplace',
  'Supabase auth and realtime',
  'Stripe payments with manual capture',
  'PostGIS-powered venue search',
]

export default function HomePage() {
  return (
    <main className="min-h-screen px-6 py-10 text-slate-900">
      <section className="mx-auto flex max-w-6xl flex-col gap-10 rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm backdrop-blur md:p-12">
        <div className="max-w-3xl space-y-6">
          <span className="inline-flex rounded-full bg-violet-100 px-4 py-1 text-sm font-medium text-violet-700">
            VenueCharm — setup started
          </span>
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
            Marketplace setup is ready to grow.
          </h1>
          <p className="text-lg leading-8 text-slate-600 md:text-xl">
            This repository is now prepared for the first development phase: project scaffold,
            TypeScript, Tailwind, and the base RTL layout.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/register"
            className="rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white transition hover:bg-violet-700"
          >
            Create account
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-800 transition hover:bg-slate-50"
          >
            Sign in
          </Link>
          <Link
            href="/dashboard"
            className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-800 transition hover:bg-slate-50"
          >
            Dashboard
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {highlights.map((item) => (
            <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm font-medium text-slate-700">
              {item}
            </div>
          ))}
        </div>

        <div className="rounded-2xl bg-violet-600 p-6 text-white">
          <p className="text-sm uppercase tracking-[0.3em] text-violet-100">Next step</p>
          <p className="mt-3 text-lg">
            Install dependencies, then connect Supabase and create the initial database schema.
          </p>
        </div>
      </section>
    </main>
  )
}
