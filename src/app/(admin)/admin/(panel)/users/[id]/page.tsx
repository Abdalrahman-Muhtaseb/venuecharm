import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import {
  ChevronRight, Mail, Calendar, ShieldCheck, Building2, BookOpen,
  Star, Banknote, CreditCard, Users, Cake,
} from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { AdminUserActionsDropdown } from '@/components/admin/AdminUserActionsDropdown'
import { formatDateLocalized, formatCurrencyILS } from '@/lib/i18n'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────────────────────

type UserFull = {
  id: string
  email: string | null
  first_name: string | null
  last_name: string | null
  phone_number: string | null
  avatar_url: string | null
  role: string
  is_verified: boolean
  stripe_charges_enabled: boolean
  stripe_payouts_enabled: boolean
  stripe_details_submitted: boolean
  stripe_account_id: string | null
  bio: string | null
  birth_date: string | null
  created_at: string | null
}

type BookingFlat = {
  id: string
  start_at: string
  end_at: string
  total_price: number
  status: string
  venue_id: string
}

type ReviewFlat = {
  id: string
  rating: number
  comment: string | null
  created_at: string
  venue_id: string
}

type VenueRow = {
  id: string
  title: string
  city: string
  status: string
  photos: string[] | null
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function getDisplayName(u: UserFull) {
  if (u.first_name) return `${u.first_name} ${u.last_name ?? ''}`.trim()
  return u.email ?? 'Unknown user'
}

function getInitials(u: UserFull) {
  if (u.first_name) return `${u.first_name[0]}${u.last_name?.[0] ?? ''}`.toUpperCase()
  return (u.email?.[0] ?? '?').toUpperCase()
}

const ROLE_STYLE: Record<string, string> = {
  ADMIN:  'bg-primary/10 text-primary border-primary/20',
  HOST:   'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-800',
  RENTER: 'bg-muted text-muted-foreground border-border',
}

const STATUS_BADGE: Record<string, string> = {
  CONFIRMED: 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  COMPLETED: 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  PENDING_APPROVAL: 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  CANCELLED: 'border-muted-foreground/30 text-muted-foreground',
}

function KpiCard({
  icon: Icon, label, value, sub,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string; value: string | number; sub?: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-background p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold leading-tight tabular-nums">{value}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  )
}

function VenueStatusBadge({ status }: { status: string }) {
  if (status === 'PENDING_APPROVAL') {
    return <Badge variant="outline" className="text-xs whitespace-nowrap border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-400">Pending</Badge>
  }
  const map: Record<string, 'default' | 'destructive' | 'outline'> = { ACTIVE: 'default', SUSPENDED: 'destructive', DRAFT: 'outline' }
  const labels: Record<string, string> = { ACTIVE: 'Active', SUSPENDED: 'Suspended', DRAFT: 'Draft' }
  return <Badge variant={map[status] ?? 'outline'} className="text-xs whitespace-nowrap">{labels[status] ?? status}</Badge>
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function AdminUserDetailPage({ params }: { params: { id: string } }) {
  const db = createAdminClient()

  const { data: userRaw } = await db
    .from('users')
    .select('id, email, first_name, last_name, phone_number, avatar_url, role, is_verified, stripe_charges_enabled, stripe_payouts_enabled, stripe_details_submitted, stripe_account_id, bio, birth_date, created_at')
    .eq('id', params.id)
    .single()

  if (!userRaw) notFound()
  const u = userRaw as UserFull
  const isHost  = u.role === 'HOST'
  const isAdmin = u.role === 'ADMIN'

  const { data: authUser } = await db.auth.admin.getUserById(params.id)
  const bannedUntil = authUser?.user?.banned_until
  const isBanned = Boolean(bannedUntil && new Date(bannedUntil) > new Date())

  // Admins have no bookings/reviews/listings — skip those fetches entirely
  const [
    { data: bookingsRaw },
    { data: reviewsRaw },
    { data: venuesRaw },
  ] = isAdmin
    ? [{ data: [] }, { data: [] }, { data: [] }]
    : await Promise.all([
        db.from('bookings')
          .select('id, start_at, end_at, total_price, status, venue_id')
          .eq('renter_id', u.id)
          .order('created_at', { ascending: false })
          .limit(20),

        db.from('reviews')
          .select('id, rating, comment, created_at, venue_id')
          .eq('renter_id', u.id)
          .order('created_at', { ascending: false })
          .limit(50),

        isHost
          ? db.from('venues')
              .select('id, title, city, status, photos')
              .eq('host_id', u.id)
              .order('created_at', { ascending: false })
              .limit(100)
          : Promise.resolve({ data: [] }),
      ])

  const bookings = (bookingsRaw ?? []) as BookingFlat[]
  const reviews  = (reviewsRaw  ?? []) as ReviewFlat[]
  const venues   = (venuesRaw   ?? []) as VenueRow[]

  // Fetch venue titles for bookings + reviews in one go
  const venueIdSet = new Set<string>([
    ...bookings.map((b) => b.venue_id),
    ...reviews.map((r) => r.venue_id),
  ])
  const venueIds = [...venueIdSet]
  let venueTitleMap = new Map<string, { id: string; title: string; city: string }>()
  if (venueIds.length > 0) {
    const { data: venueLookup } = await db
      .from('venues')
      .select('id, title, city')
      .in('id', venueIds)
    for (const v of venueLookup ?? []) {
      venueTitleMap.set(v.id, v as { id: string; title: string; city: string })
    }
  }

  // Revenue for host
  let hostRevenue = 0
  let hostCompleted = 0
  if (isHost && venues.length > 0) {
    const hIds = venues.map((v) => v.id)
    const { data: revenueRaw } = await db
      .from('bookings')
      .select('total_price, status')
      .in('venue_id', hIds)
      .in('status', ['CONFIRMED', 'COMPLETED'])
    for (const b of revenueRaw ?? []) {
      hostRevenue += Number(b.total_price)
      if (b.status === 'COMPLETED') hostCompleted++
    }
  }

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/admin/users" className="hover:text-foreground">Users</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-foreground">{getDisplayName(u)}</span>
      </nav>

      {/* Header */}
      <div className="rounded-2xl border bg-background p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 shrink-0 text-lg">
              <AvatarImage src={u.avatar_url ?? undefined} />
              <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                {getInitials(u)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold">{getDisplayName(u)}</h1>
                <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-xs font-medium', ROLE_STYLE[u.role] ?? ROLE_STYLE.RENTER)}>
                  {u.role}
                </span>
                {u.is_verified ? (
                  <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-700 text-xs dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                    <ShieldCheck className="me-1 h-3 w-3" />Verified
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground text-xs">
                    Unverified
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {u.email && (
                  <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{u.email}</span>
                )}
                {u.created_at && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Joined {formatDateLocalized(u.created_at, 'en')}
                  </span>
                )}
                {u.birth_date && (
                  <span className="flex items-center gap-1.5">
                    <Cake className="h-3.5 w-3.5" />
                    {new Date(u.birth_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}
                  </span>
                )}
                {u.phone_number && (
                  <span className="flex items-center gap-1.5">
                    <span className="text-xs">📞</span>{u.phone_number}
                  </span>
                )}
              </div>
              {u.bio && (
                <p className="mt-1 max-w-prose text-sm text-muted-foreground line-clamp-2">{u.bio}</p>
              )}
            </div>
          </div>
          <AdminUserActionsDropdown userId={u.id} isVerified={u.is_verified} isBanned={isBanned} />
        </div>
      </div>

      {/* KPI row — hidden for admins */}
      {!isAdmin && (
        <div className={cn('grid gap-3', isHost ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5' : 'grid-cols-2 sm:grid-cols-4')}>
          <KpiCard icon={BookOpen} label="Bookings made"   value={bookings.length} />
          <KpiCard icon={Star}     label="Reviews written" value={reviews.length}
            sub={avgRating ? `avg ${avgRating} ★` : undefined} />
          {isHost && (
            <>
              <KpiCard icon={Building2} label="Venues"    value={venues.length} />
              <KpiCard icon={Users}     label="Completed" value={hostCompleted} sub="as host" />
              <KpiCard icon={Banknote}  label="Revenue"   value={hostRevenue > 0 ? formatCurrencyILS(hostRevenue, 'en') : '—'} />
            </>
          )}
        </div>
      )}

      {/* Body */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left — hidden entirely for admins */}
        <div className="space-y-6 lg:col-span-2">

          {/* Bookings, Reviews, Listings — hidden for admins */}
          {!isAdmin && <>
          <section>
            <h2 className="mb-3 text-sm font-semibold">Bookings as renter</h2>
            <div className="rounded-xl border bg-background">
              {bookings.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No bookings yet</p>
              ) : (
                <div className="divide-y">
                  {bookings.map((b) => {
                    const v = venueTitleMap.get(b.venue_id)
                    return (
                      <div key={b.id} className="flex items-center justify-between gap-4 px-4 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{v?.title ?? b.venue_id.slice(0, 8)}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateLocalized(b.start_at, 'en')} → {formatDateLocalized(b.end_at, 'en')}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <Badge variant="outline" className={cn('text-xs', STATUS_BADGE[b.status] ?? STATUS_BADGE.CANCELLED)}>
                            {b.status === 'PENDING_APPROVAL' ? 'PENDING' : b.status}
                          </Badge>
                          <span className="text-xs font-semibold tabular-nums">
                            {formatCurrencyILS(b.total_price, 'en')}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Reviews written */}
          <section>
            <h2 className="mb-3 text-sm font-semibold">
              Reviews written
              {reviews.length > 0 && <span className="ms-2 text-muted-foreground font-normal">({reviews.length})</span>}
            </h2>
            {reviews.length === 0 ? (
              <div className="rounded-xl border bg-background py-8 text-center text-sm text-muted-foreground">
                No reviews yet
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {reviews.map((r) => {
                  const v = venueTitleMap.get(r.venue_id)
                  return (
                    <div key={r.id} className="space-y-2 rounded-xl border bg-background p-4">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/venues/${r.venue_id}`}
                          className="truncate text-sm font-medium hover:text-primary hover:underline underline-offset-4"
                        >
                          {v?.title ?? r.venue_id.slice(0, 8)}
                        </Link>
                        <span className="flex shrink-0 items-center gap-0.5 text-sm font-semibold tabular-nums">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />{r.rating}
                        </span>
                      </div>
                      {r.comment && (
                        <p className="line-clamp-2 text-xs text-muted-foreground">{r.comment}</p>
                      )}
                      <p className="text-xs text-muted-foreground/60">{formatDateLocalized(r.created_at, 'en')}</p>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* Listings (hosts) */}
          {isHost && <>
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold">
                  Listings
                  {venues.length > 0 && <span className="ms-2 text-muted-foreground font-normal">({venues.length})</span>}
                </h2>
                <Link href="/admin/venues" className="text-xs text-primary hover:underline underline-offset-4">
                  View all in Venues →
                </Link>
              </div>
              <div className="rounded-xl border bg-background">
                {venues.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">No listings yet</p>
                ) : (
                  <div className="divide-y">
                    {venues.map((v) => (
                      <div key={v.id} className="flex items-center gap-3 px-4 py-3">
                        <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
                          {v.photos?.[0] ? (
                            <Image src={v.photos[0]} alt={v.title} fill className="object-cover" sizes="56px" />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <Building2 className="h-4 w-4 text-muted-foreground/40" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <Link href={`/admin/${v.id}`} className="truncate text-sm font-medium hover:text-primary hover:underline underline-offset-4">
                            {v.title}
                          </Link>
                          <p className="text-xs text-muted-foreground">{v.city}</p>
                        </div>
                        <VenueStatusBadge status={v.status} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </>}
          </>}
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Account info */}
          <div className="rounded-xl border bg-background p-4 space-y-3">
            <h3 className="text-sm font-semibold">Account</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">User ID</dt>
                <dd className="font-mono text-xs truncate text-end max-w-[140px]" title={u.id}>{u.id.slice(0, 12)}…</dd>
              </div>
              {u.email && (
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Email</dt>
                  <dd className="truncate text-end text-xs">{u.email}</dd>
                </div>
              )}
              {u.phone_number && (
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Phone</dt>
                  <dd>{u.phone_number}</dd>
                </div>
              )}
              {u.birth_date && (
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Birthday</dt>
                  <dd>{new Date(u.birth_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</dd>
                </div>
              )}
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Verified</dt>
                <dd className={u.is_verified ? 'text-emerald-600 font-medium' : 'text-muted-foreground'}>
                  {u.is_verified ? '✓ Verified' : 'Unverified'}
                </dd>
              </div>
              {u.created_at && (
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Joined</dt>
                  <dd className="text-muted-foreground">{formatDateLocalized(u.created_at, 'en')}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Stripe (hosts) */}
          {isHost && (
            <div className="rounded-xl border bg-background p-4 space-y-3">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Stripe Connect</h3>
              </div>
              <dl className="space-y-2 text-sm">
                {u.stripe_account_id && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground shrink-0">Account ID</dt>
                    <dd className="font-mono text-xs text-end truncate">{u.stripe_account_id}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Details submitted</dt>
                  <dd>{u.stripe_details_submitted ? '✓ Yes' : '—'}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Charges enabled</dt>
                  <dd className={u.stripe_charges_enabled ? 'text-emerald-600 font-medium' : ''}>
                    {u.stripe_charges_enabled ? '✓ Yes' : '—'}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Payouts enabled</dt>
                  <dd className={u.stripe_payouts_enabled ? 'text-emerald-600 font-medium' : ''}>
                    {u.stripe_payouts_enabled ? '✓ Yes' : '—'}
                  </dd>
                </div>
                {hostRevenue > 0 && (
                  <>
                    <div className="h-px bg-border" />
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Total earnings</dt>
                      <dd className="font-semibold tabular-nums">{formatCurrencyILS(hostRevenue, 'en')}</dd>
                    </div>
                  </>
                )}
              </dl>
            </div>
          )}

          {/* Quick actions */}
          <div className="rounded-xl border bg-background p-4">
            <h3 className="mb-3 text-sm font-semibold">Actions</h3>
            <AdminUserActionsDropdown userId={u.id} isVerified={u.is_verified} isBanned={isBanned} />
          </div>
        </div>
      </div>
    </div>
  )
}
