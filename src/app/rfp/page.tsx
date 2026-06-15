import Link from 'next/link'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { Sparkles, Plus, Users, Wallet, CalendarDays } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { EventType } from '@/types/rfp'
import {
  defaultLocale,
  formatCurrencyILS,
  formatDateLocalized,
  getDictionary,
  isLocale,
  localeCookieName,
  translate,
  type Locale,
} from '@/lib/i18n'

export default async function RfpListPage() {
  const locale: Locale = isLocale(cookies().get(localeCookieName)?.value)
    ? (cookies().get(localeCookieName)!.value as Locale)
    : defaultLocale
  const t = getDictionary(locale).rfp

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: rfps } = await supabase
    .from('rfps')
    .select('id, event_type, event_date, capacity, budget, created_at')
    .eq('renter_id', user.id)
    .order('created_at', { ascending: false })

  const list = rfps ?? []
  const ids = list.map((r) => r.id)

  const counts = new Map<string, number>()
  if (ids.length) {
    const { data: matchRows } = await supabase.from('rfp_matches').select('rfp_id').in('rfp_id', ids)
    for (const m of matchRows ?? []) counts.set(m.rfp_id, (counts.get(m.rfp_id) ?? 0) + 1)
  }

  const eventLabel = (key: string) =>
    t.eventTypeOptions[key as EventType] ?? t.eventTypeOptions.OTHER

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold md:text-4xl">
            <Sparkles className="h-7 w-7 text-primary" />
            {t.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t.subtitle}</p>
        </div>
        <Button asChild className="shrink-0">
          <Link href="/rfp/new">
            <Plus className="me-2 h-4 w-4" />
            {t.newRequest}
          </Link>
        </Button>
      </div>

      {list.length === 0 ? (
        <div className="mt-10 flex flex-col items-center justify-center rounded-xl border bg-muted/20 px-6 py-16 text-center">
          <Sparkles className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">{t.empty}</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">{t.emptyHint}</p>
          <Button asChild className="mt-5">
            <Link href="/rfp/new">
              <Plus className="me-2 h-4 w-4" />
              {t.newRequest}
            </Link>
          </Button>
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {list.map((r) => {
            const count = counts.get(r.id) ?? 0
            return (
              <li key={r.id}>
                <Link
                  href={`/rfp/${r.id}`}
                  className="flex flex-col gap-3 rounded-xl border bg-background p-5 transition hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-lg font-semibold">{eventLabel(r.event_type)}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Users className="h-4 w-4" />
                        {r.capacity} {t.guests}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Wallet className="h-4 w-4" />
                        {formatCurrencyILS(Number(r.budget), locale)}
                      </span>
                      {r.event_date && (
                        <span className="flex items-center gap-1.5">
                          <CalendarDays className="h-4 w-4" />
                          {formatDateLocalized(r.event_date, locale)}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary" className="shrink-0 self-start sm:self-center">
                    {translate(t.matchCount, { count })}
                  </Badge>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
