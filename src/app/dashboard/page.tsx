import { signOut } from '@/actions/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data } = await supabase.auth.getUser()
  const user = data.user

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('email, role, first_name, last_name')
    .eq('id', user.id)
    .single()

  return (
    <main className="min-h-screen px-6 py-10 text-slate-900">
      <section className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm md:p-10">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-violet-600">Dashboard</p>
        <h1 className="mt-3 text-3xl font-bold">Welcome back</h1>
        <p className="mt-3 text-slate-600">
          Signed in as {profile?.email ?? user.email}.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Role</p>
            <p className="mt-2 text-lg font-semibold">{profile?.role ?? 'RENTER'}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Status</p>
            <p className="mt-2 text-lg font-semibold">Authenticated</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Next step</p>
            <p className="mt-2 text-lg font-semibold">Build venue listings</p>
          </div>
        </div>

        <form action={signOut} className="mt-8">
          <button
            type="submit"
            className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-800 transition hover:bg-slate-50"
          >
            Sign out
          </button>
        </form>
      </section>
    </main>
  )
}
