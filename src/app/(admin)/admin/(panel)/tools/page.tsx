import {
  Building2, Users, CalendarDays, Star, CheckCircle2, XCircle,
  CreditCard, Mail, Calendar, Map, Zap, Globe,
} from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { SeedDataPanel } from '@/components/admin/SeedDataPanel'
import { DangerZonePanel } from '@/components/admin/DangerZonePanel'
import { BackfillPaymentsPanel } from '@/components/admin/BackfillPaymentsPanel'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

// ── Tiny server-only components ───────────────────────────────────────────────

function EnvPill({
  label, ok, href,
}: {
  label: string; ok: boolean; href?: string
}) {
  const inner = (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
      ok
        ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
        : 'border-muted-foreground/20 bg-muted text-muted-foreground',
    )}>
      {ok
        ? <CheckCircle2 className="h-3 w-3" />
        : <XCircle className="h-3 w-3" />}
      {label}
    </span>
  )
  return href && ok ? <a href={href} target="_blank" rel="noopener noreferrer">{inner}</a> : inner
}

function StatCard({
  icon: Icon, iconCls, label, value, sub,
}: {
  icon: React.ElementType; iconCls: string; label: string; value: number | string; sub?: string
}) {
  return (
    <div className="rounded-xl border bg-background p-4">
      <div className="mb-2 flex items-center gap-2">
        <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg', iconCls)}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className="text-2xl font-bold tabular-nums leading-none">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

function ServiceRow({
  icon: Icon, label, status, detail,
}: {
  icon: React.ElementType; label: string; status: 'ok' | 'missing'; detail?: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <div className="flex items-center gap-2.5">
        <Icon className={cn('h-4 w-4', status === 'ok' ? 'text-emerald-600' : 'text-muted-foreground/50')} />
        <span className="text-sm font-medium">{label}</span>
        {detail && <span className="text-xs text-muted-foreground">{detail}</span>}
      </div>
      <span className={cn(
        'rounded-full px-2.5 py-0.5 text-xs font-medium',
        status === 'ok'
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
          : 'bg-muted text-muted-foreground',
      )}>
        {status === 'ok' ? 'Configured' : 'Not set'}
      </span>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AdminToolsPage() {
  const db = createAdminClient()

  const [
    { count: totalVenues },
    { count: activeVenues },
    { count: testVenues },
    { count: totalUsers },
    { count: totalBookings },
    { count: totalReviews },
    { count: testUsersCount },
  ] = await Promise.all([
    db.from('venues').select('*', { count: 'exact', head: true }),
    db.from('venues').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
    db.from('venues').select('*', { count: 'exact', head: true }).ilike('title', '[TEST]%'),
    db.from('users').select('*', { count: 'exact', head: true }),
    db.from('bookings').select('*', { count: 'exact', head: true }),
    db.from('reviews').select('*', { count: 'exact', head: true }),
    db.from('users').select('*', { count: 'exact', head: true })
      .in('email', ['host.test@venuecharm.com', 'renter1.test@venuecharm.com', 'renter2.test@venuecharm.com']),
  ])

  // Environment
  const stripeKey     = process.env.STRIPE_SECRET_KEY ?? ''
  const isStripeTest  = stripeKey.startsWith('sk_test_')
  const hasStripe     = stripeKey.length > 0
  const hasResend     = !!process.env.RESEND_API_KEY
  const hasGoogleCal  = !!process.env.GOOGLE_CALENDAR_CLIENT_ID
  const hasMaps       = !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const hasCloudinary = !!process.env.CLOUDINARY_API_KEY
  const appUrl        = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const isLocalhost   = appUrl.includes('localhost')

  return (
    <div className="max-w-3xl space-y-7">

      {/* ── Banner ─────────────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/5 via-background to-violet-500/5 p-5">
        <div className="mb-3 flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <h1 className="text-base font-semibold">Demo Control Center</h1>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          Seed realistic data, reset the platform state, and verify service integrations —
          all designed for live demonstrations and academic review.
        </p>
        <div className="flex flex-wrap gap-2">
          <EnvPill label={isLocalhost ? 'Localhost' : 'Production'} ok={true} href={appUrl} />
          <EnvPill
            label={isStripeTest ? 'Stripe Test Mode' : hasStripe ? 'Stripe Live' : 'Stripe not set'}
            ok={hasStripe}
          />
          <EnvPill label="Database" ok={true} />
          {!isLocalhost && <EnvPill label="venuecharm.com" ok={true} href={appUrl} />}
        </div>
      </div>

      {/* ── Live system snapshot ───────────────────────────────────────────── */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Live system snapshot
        </h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          <StatCard icon={Building2} iconCls="bg-sky-100 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400"
            label="Total venues"  value={totalVenues  ?? 0} sub={`${activeVenues ?? 0} active`} />
          <StatCard icon={Users}    iconCls="bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400"
            label="Users"         value={totalUsers   ?? 0} />
          <StatCard icon={CalendarDays} iconCls="bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400"
            label="Bookings"      value={totalBookings ?? 0} />
          <StatCard icon={Star}    iconCls="bg-orange-100 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400"
            label="Reviews"       value={totalReviews  ?? 0} />
          <StatCard icon={Building2} iconCls="bg-muted text-muted-foreground"
            label="[TEST] venues" value={testVenues   ?? 0} sub="seeded" />
        </div>
      </section>

      {/* ── Integrations ───────────────────────────────────────────────────── */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Service integrations
        </h2>
        <div className="divide-y rounded-xl border bg-background px-4">
          <ServiceRow icon={CreditCard} label="Stripe Connect"
            status={hasStripe ? 'ok' : 'missing'}
            detail={hasStripe ? (isStripeTest ? '— test mode' : '— live mode') : undefined} />
          <ServiceRow icon={Mail}     label="Resend (email)"        status={hasResend     ? 'ok' : 'missing'} />
          <ServiceRow icon={Calendar} label="Google Calendar API"   status={hasGoogleCal  ? 'ok' : 'missing'} />
          <ServiceRow icon={Map}      label="Google Maps API"       status={hasMaps       ? 'ok' : 'missing'} />
          <ServiceRow icon={Globe}    label="Cloudinary (images)"   status={hasCloudinary ? 'ok' : 'missing'} />
        </div>
      </section>

      {/* ── Seed data ──────────────────────────────────────────────────────── */}
      <section>
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Demo preparation
        </h2>
        <p className="mb-3 text-xs text-muted-foreground">
          Seed realistic Israeli venues and test accounts to populate the demo environment.
        </p>
        <SeedDataPanel
          testVenueCount={testVenues ?? 0}
          testUserCount={testUsersCount ?? 0}
        />
      </section>

      {/* ── Stripe utilities ────────────────────────────────────────────────── */}
      <section>
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Payment utilities
        </h2>
        <p className="mb-3 text-xs text-muted-foreground">
          Sync Stripe payment data with the database for accurate reporting.
        </p>
        <BackfillPaymentsPanel />
      </section>

      {/* ── Danger zone ────────────────────────────────────────────────────── */}
      <section>
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-destructive">
          Reset &amp; Cleanup
        </h2>
        <p className="mb-3 text-xs text-muted-foreground">
          Destructive actions for resetting the demo environment. All require confirmation.
        </p>
        <DangerZonePanel />
      </section>
    </div>
  )
}
