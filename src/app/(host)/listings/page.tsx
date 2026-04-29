import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DeleteVenueButton } from '@/components/venue/delete-venue-button'
import { defaultLocale, formatCurrencyILS, isLocale, localeCookieName, type Locale } from '@/lib/i18n'

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  ACTIVE: 'default',
  PENDING_APPROVAL: 'secondary',
  DRAFT: 'outline',
  SUSPENDED: 'destructive',
}

export default async function ListingsPage() {
  const locale: Locale = isLocale(cookies().get(localeCookieName)?.value)
    ? (cookies().get(localeCookieName)!.value as Locale)
    : defaultLocale

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: venues } = await supabase
    .from('venues')
    .select('id, title, city, capacity, price_per_hour, price_per_day, status, photos, created_at')
    .eq('host_id', user.id)
    .order('created_at', { ascending: false })

  const rows = venues ?? []
  const isHe = locale === 'he'

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-primary">
            {isHe ? 'ניהול נכסים' : 'Manage listings'}
          </p>
          <h1 className="mt-1 text-3xl font-bold">
            {isHe ? 'הנכסים שלי' : 'My listings'}
          </h1>
        </div>
        <Button asChild>
          <Link href="/listings/new">
            <Plus className="me-2 h-4 w-4" />
            {isHe ? 'הוסף נכס' : 'Add listing'}
          </Link>
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed py-20 text-center">
          <p className="font-medium text-muted-foreground">
            {isHe ? 'עדיין אין נכסים' : 'No listings yet'}
          </p>
          <Button asChild>
            <Link href="/listings/new">
              <Plus className="me-2 h-4 w-4" />
              {isHe ? 'פרסם את המקום הראשון' : 'Create your first listing'}
            </Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">{isHe ? 'תמונה' : 'Photo'}</TableHead>
                <TableHead>{isHe ? 'שם המקום' : 'Venue'}</TableHead>
                <TableHead>{isHe ? 'עיר' : 'City'}</TableHead>
                <TableHead>{isHe ? 'קיבולת' : 'Capacity'}</TableHead>
                <TableHead>{isHe ? 'מחיר/שעה' : 'Price/hr'}</TableHead>
                <TableHead>{isHe ? 'סטטוס' : 'Status'}</TableHead>
                <TableHead className="text-end">{isHe ? 'פעולות' : 'Actions'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((v) => (
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
                  <TableCell className="font-medium max-w-[200px] truncate">{v.title}</TableCell>
                  <TableCell className="text-muted-foreground">{v.city}</TableCell>
                  <TableCell>{v.capacity}</TableCell>
                  <TableCell>
                    {v.price_per_hour
                      ? formatCurrencyILS(Number(v.price_per_hour), locale)
                      : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[v.status] ?? 'outline'}>
                      {v.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/listings/${v.id}/edit`}>
                          {isHe ? 'עריכה' : 'Edit'}
                        </Link>
                      </Button>
                      <DeleteVenueButton venueId={v.id} locale={locale} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
