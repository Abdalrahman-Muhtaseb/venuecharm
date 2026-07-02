import Link from 'next/link'
import { Suspense } from 'react'
import { Users, ShieldCheck, Building2, User, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AdminUserActionsDropdown } from '@/components/admin/AdminUserActionsDropdown'
import { AdminUsersSearchBar } from '@/components/admin/AdminUsersSearchBar'
import { InviteAdminDialog } from '@/components/admin/InviteAdminDialog'
import { VenuePagination } from '@/components/search/VenuePagination'
import { formatDateLocalized } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 20

// ── Sort ───────────────────────────────────────────────────────────────────────

const USER_SORTS = [
  'role_asc', 'role_desc',
  'verified_asc', 'verified_desc',
  'joined_asc', 'joined_desc',
] as const
type UserSort = (typeof USER_SORTS)[number]

function parseSort(v?: string): UserSort {
  return (USER_SORTS as readonly string[]).includes(v ?? '') ? (v as UserSort) : 'role_asc'
}

function applySort(query: any, sort: UserSort) {
  switch (sort) {
    case 'role_asc':      return query.order('role', { ascending: true }).order('created_at', { ascending: false })
    case 'role_desc':     return query.order('role', { ascending: false }).order('created_at', { ascending: false })
    case 'verified_asc':  return query.order('is_verified', { ascending: true }).order('role', { ascending: true })
    case 'verified_desc': return query.order('is_verified', { ascending: false }).order('role', { ascending: true })
    case 'joined_asc':    return query.order('created_at', { ascending: true })
    case 'joined_desc':   return query.order('created_at', { ascending: false })
  }
}

// ── Types ──────────────────────────────────────────────────────────────────────

type UserRow = {
  id: string
  email: string | null
  first_name: string | null
  last_name: string | null
  role: string
  is_verified: boolean
  stripe_charges_enabled: boolean
  created_at: string | null
}

type RoleCounts = { ADMIN: number; HOST: number; RENTER: number; total: number }

// ── Small components ───────────────────────────────────────────────────────────

function getInitials(u: UserRow) {
  if (u.first_name) return `${u.first_name[0]}${u.last_name?.[0] ?? ''}`.toUpperCase()
  return (u.email?.[0] ?? '?').toUpperCase()
}

function getDisplayName(u: UserRow) {
  if (u.first_name) return `${u.first_name} ${u.last_name ?? ''}`.trim()
  return u.email ?? '—'
}

const ROLE_BADGE: Record<string, string> = {
  ADMIN:  'bg-primary/10 text-primary border-primary/20',
  HOST:   'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-800',
  RENTER: 'bg-muted text-muted-foreground border-border',
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-xs font-medium', ROLE_BADGE[role] ?? ROLE_BADGE.RENTER)}>
      {role}
    </span>
  )
}

function SortHead({
  col, label, sort, baseParams, className,
}: {
  col: string; label: string; sort: UserSort; baseParams: Record<string, string>; className?: string
}) {
  const isAsc = sort === `${col}_asc`
  const isDesc = sort === `${col}_desc`
  const isActive = isAsc || isDesc
  const next = isAsc ? `${col}_desc` : `${col}_asc`
  const params = new URLSearchParams(baseParams)
  params.set('sort', next)
  params.delete('page')
  const Icon = !isActive ? ChevronsUpDown : isAsc ? ChevronUp : ChevronDown
  return (
    <TableHead className={className}>
      <Link
        href={`?${params.toString()}`}
        className="inline-flex items-center gap-1 rounded-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2"
      >
        {label}
        <Icon className={cn('h-3.5 w-3.5 shrink-0', isActive ? 'text-foreground' : 'text-muted-foreground/40')} />
      </Link>
    </TableHead>
  )
}

function StatCard({
  label, count, icon: Icon, role, activeRole, href,
}: {
  label: string; count: number
  icon: React.ComponentType<{ className?: string }>
  role: string | null; activeRole: string | null; href: string
}) {
  const isActive = role === activeRole
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-xl border p-4 transition-all hover:shadow-sm',
        isActive ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/20' : 'bg-background hover:bg-muted/40',
      )}
    >
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', isActive ? 'bg-primary/10' : 'bg-muted')}>
        <Icon className={cn('h-5 w-5', isActive ? 'text-primary' : 'text-muted-foreground')} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold tabular-nums leading-none">{count}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
      </div>
    </Link>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { q?: string; role?: string; page?: string; sort?: string }
}) {
  const db     = createAdminClient()
  const q      = (searchParams.q ?? '').trim()
  const role   = searchParams.role ?? null
  const sort   = parseSort(searchParams.sort)
  const page   = Math.max(1, Number(searchParams.page) || 1)
  const offset = (page - 1) * PAGE_SIZE
  const term   = q.replace(/[%,()]/g, '')

  // Unfiltered role counts for stat cards
  const { data: allRoles } = await db.from('users').select('role')
  const roleCounts: RoleCounts = { ADMIN: 0, HOST: 0, RENTER: 0, total: 0 }
  for (const u of allRoles ?? []) {
    const r = u.role as keyof Omit<RoleCounts, 'total'>
    if (r in roleCounts) roleCounts[r]++
    roleCounts.total++
  }

  // Apply search + role filter to a fresh query each time (avoids builder mutation)
  function withFilters(base: any) {
    let q2 = base
    if (term) q2 = q2.or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%`)
    if (role) q2 = q2.eq('role', role)
    return q2
  }

  const [{ count: filteredCount }, { data: usersRaw }, { data: authData }] = await Promise.all([
    withFilters(db.from('users').select('*', { count: 'exact', head: true })),
    applySort(
      withFilters(
        db.from('users').select(
          'id, email, first_name, last_name, role, is_verified, stripe_charges_enabled, created_at',
        ),
      ),
      sort,
    ).range(offset, offset + PAGE_SIZE - 1),
    db.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ])

  const now = new Date()
  const bannedSet = new Set<string>(
    (authData?.users ?? [])
      .filter((u) => u.banned_until && new Date(u.banned_until) > now)
      .map((u) => u.id),
  )

  const users      = (usersRaw ?? []) as UserRow[]
  const totalPages = Math.max(1, Math.ceil((filteredCount ?? 0) / PAGE_SIZE))

  function roleHref(r: string | null) {
    const p = new URLSearchParams()
    if (q)    p.set('q', q)
    if (r)    p.set('role', r)
    if (sort !== 'role_asc') p.set('sort', sort)
    return `/admin/users?${p.toString()}`
  }

  // baseParams for sort links (preserve q + role filter, not page)
  const baseParams: Record<string, string> = {}
  if (q)    baseParams.q    = q
  if (role) baseParams.role = role

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="All users"  count={roleCounts.total} icon={Users}       role={null}     activeRole={role} href={roleHref(null)} />
        <StatCard label="Admins"     count={roleCounts.ADMIN} icon={ShieldCheck} role="ADMIN"    activeRole={role} href={roleHref('ADMIN')} />
        <StatCard label="Hosts"      count={roleCounts.HOST}  icon={Building2}   role="HOST"     activeRole={role} href={roleHref('HOST')} />
        <StatCard label="Renters"    count={roleCounts.RENTER} icon={User}       role="RENTER"   activeRole={role} href={roleHref('RENTER')} />
      </div>

      {/* Search + invite */}
      <div className="flex flex-wrap items-center gap-3">
        <Suspense>
          <AdminUsersSearchBar />
        </Suspense>
        <div className="ms-auto">
          <InviteAdminDialog />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <SortHead col="role"     label="Role"     sort={sort} baseParams={baseParams} />
              <SortHead col="verified" label="Verified" sort={sort} baseParams={baseParams} />
              <TableHead>Stripe</TableHead>
              <SortHead col="joined"   label="Joined"   sort={sort} baseParams={baseParams} />
              <TableHead className="w-12 text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                      {getInitials(u)}
                    </AvatarFallback>
                  </Avatar>
                </TableCell>

                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/users/${u.id}`} className="hover:text-primary hover:underline underline-offset-4">
                      {getDisplayName(u)}
                    </Link>
                    {bannedSet.has(u.id) && (
                      <Badge variant="destructive" className="px-1.5 py-0 text-[10px]">Banned</Badge>
                    )}
                  </div>
                </TableCell>

                <TableCell className="max-w-[180px] truncate text-sm text-muted-foreground">
                  {u.email ?? '—'}
                </TableCell>

                <TableCell>
                  <RoleBadge role={u.role} />
                </TableCell>

                <TableCell>
                  {u.is_verified ? (
                    <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-700 text-xs dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground text-xs">
                      Unverified
                    </Badge>
                  )}
                </TableCell>

                <TableCell>
                  {u.role === 'HOST' ? (
                    <Badge variant={u.stripe_charges_enabled ? 'default' : 'outline'} className="text-xs whitespace-nowrap">
                      {u.stripe_charges_enabled ? 'Connected' : 'Not connected'}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>

                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  {u.created_at ? formatDateLocalized(u.created_at, 'en') : '—'}
                </TableCell>

                <TableCell className="text-center">
                  <AdminUserActionsDropdown
                    userId={u.id}
                    isVerified={u.is_verified}
                    isBanned={bannedSet.has(u.id)}
                  />
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                  No users found{q ? ` for "${q}"` : ''}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <VenuePagination currentPage={page} totalPages={totalPages} locale="en" />
    </div>
  )
}
