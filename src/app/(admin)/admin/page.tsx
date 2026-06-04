import Link from 'next/link'
import Image from 'next/image'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AdminActionButtons } from '@/components/admin/AdminActionButtons'
import {
  defaultLocale,
  formatDateLocalized,
  getDictionary,
  isLocale,
  localeCookieName,
  type Locale,
} from '@/lib/i18n'

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  ACTIVE: 'default',
  PENDING_APPROVAL: 'secondary',
  DRAFT: 'outline',
  SUSPENDED: 'destructive',
}

type VenueRow = {
  id: string
  title: string
  city: string
  capacity: number
  status: string
  photos: string[] | null
  created_at: string
  users: { first_name: string | null; last_name: string | null; email: string } | { first_name: string | null; last_name: string | null; email: string }[] | null
}

function getHostName(u: VenueRow['users']): string {
  if (!u) return '—'
  const profile = Array.isArray(u) ? u[0] : u
  if (!profile) return '—'
  return profile.first_name ? `${profile.first_name} ${profile.last_name ?? ''}`.trim() : profile.email
}

export default async function AdminQueuePage() {
  const locale: Locale = isLocale(cookies().get(localeCookieName)?.value)
    ? (cookies().get(localeCookieName)!.value as Locale)
    : defaultLocale

  const t = getDictionary(locale).admin

  const { data } = await createAdminClient()
    .from('venues')
    .select('id, title, city, capacity, status, photos, created_at, users:host_id(first_name, last_name, email)')
    .in('status', ['PENDING_APPROVAL', 'ACTIVE', 'SUSPENDED'])
    .order('created_at', { ascending: false })

  const rows = ((data ?? []) as unknown[]) as VenueRow[]
  const pending = rows.filter((r) => r.status === 'PENDING_APPROVAL')
  const active = rows.filter((r) => r.status === 'ACTIVE')
  const suspended = rows.filter((r) => r.status === 'SUSPENDED')

  function Queue({ items }: { items: VenueRow[] }) {
    if (items.length === 0) {
      return (
        <div className="rounded-xl border border-dashed py-12 text-center text-muted-foreground">
          {t.empty}
        </div>
      )
    }
    return (
      <div className="rounded-xl border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">{t.photo}</TableHead>
              <TableHead>{t.venue}</TableHead>
              <TableHead>{t.host}</TableHead>
              <TableHead>{t.city}</TableHead>
              <TableHead>{t.capacity}</TableHead>
              <TableHead>{t.submitted}</TableHead>
              <TableHead>{t.status}</TableHead>
              <TableHead className="text-end">{t.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((v) => (
              <TableRow key={v.id}>
                <TableCell>
                  {v.photos?.[0] ? (
                    <div className="relative h-10 w-14 overflow-hidden rounded-md bg-muted">
                      <Image src={v.photos[0]} alt={v.title} fill className="object-cover" sizes="56px" />
                    </div>
                  ) : (
                    <div className="h-10 w-14 rounded-md bg-muted" />
                  )}
                </TableCell>
                <TableCell className="font-medium max-w-[220px] truncate">{v.title}</TableCell>
                <TableCell className="text-muted-foreground">{getHostName(v.users)}</TableCell>
                <TableCell className="text-muted-foreground">{v.city}</TableCell>
                <TableCell>{v.capacity}</TableCell>
                <TableCell className="text-muted-foreground">{formatDateLocalized(v.created_at, locale)}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[v.status] ?? 'outline'}>
                    {v.status.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/${v.id}`}>{t.review}</Link>
                    </Button>
                    <AdminActionButtons venueId={v.id} status={v.status} locale={locale} size="sm" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <p className="text-sm font-medium uppercase tracking-widest text-primary">{t.kicker}</p>
        <h1 className="mt-1 text-3xl font-bold">{t.title}</h1>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            {t.pending}
            {pending.length > 0 && (
              <Badge className="ms-2 h-5 rounded-full px-1.5 text-xs">{pending.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="active">{t.active}</TabsTrigger>
          <TabsTrigger value="suspended">{t.suspended}</TabsTrigger>
        </TabsList>

        <TabsContent value="pending"   className="mt-4"><Queue items={pending}   /></TabsContent>
        <TabsContent value="active"    className="mt-4"><Queue items={active}    /></TabsContent>
        <TabsContent value="suspended" className="mt-4"><Queue items={suspended} /></TabsContent>
      </Tabs>
    </div>
  )
}
