import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { ConnectOnboardingCard } from '@/components/stripe/ConnectOnboardingCard'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  defaultLocale,
  formatCurrencyILS,
  formatDateLocalized,
  getDictionary,
  isLocale,
  localeCookieName,
  type Locale,
} from '@/lib/i18n'

type PayoutRow = {
  id: string
  booking_id: string
  host_payout_amount: number | null
  refund_amount: number | null
  created_at: string
  status: string
}

export default async function HostPayoutsPage() {
  const locale: Locale = isLocale(cookies().get(localeCookieName)?.value)
    ? (cookies().get(localeCookieName)!.value as Locale)
    : defaultLocale

  const t = getDictionary(locale).stripeConnect
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled, stripe_details_submitted')
    .eq('id', user.id)
    .single()

  const state: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETE' = !profile?.stripe_account_id
    ? 'NOT_STARTED'
    : profile.stripe_charges_enabled
    ? 'COMPLETE'
    : 'IN_PROGRESS'

  let payouts: PayoutRow[] = []
  if (state === 'COMPLETE') {
    const { data: hostVenues } = await supabase.from('venues').select('id').eq('host_id', user.id)
    const venueIds = (hostVenues ?? []).map((v) => v.id)

    if (venueIds.length > 0) {
      const { data: bookings } = await supabase
        .from('bookings')
        .select('id')
        .in('venue_id', venueIds)
        .in('status', ['CONFIRMED', 'COMPLETED', 'CANCELLED'])

      const bookingIds = (bookings ?? []).map((b) => b.id)
      if (bookingIds.length > 0) {
        const { data: paymentRows } = await supabase
          .from('payments')
          .select('id, booking_id, host_payout_amount, refund_amount, created_at, status')
          .in('booking_id', bookingIds)
          .order('created_at', { ascending: false })
        payouts = (paymentRows ?? []) as PayoutRow[]
      }
    }
  }

  return (
    <div>
      <div className="mb-6">
        <p className="text-sm font-medium uppercase tracking-widest text-primary">
          {locale === 'he' ? 'תשלומים' : 'Payouts'}
        </p>
        <h1 className="mt-1 text-3xl font-bold">{t.title}</h1>
      </div>

      <ConnectOnboardingCard
        locale={locale}
        state={state}
        chargesEnabled={Boolean(profile?.stripe_charges_enabled)}
        payoutsEnabled={Boolean(profile?.stripe_payouts_enabled)}
        detailsSubmitted={Boolean(profile?.stripe_details_submitted)}
      />

      {state === 'COMPLETE' && (
        <div className="mt-8">
          <h2 className="mb-3 text-xl font-semibold">{t.payoutsHistory}</h2>
          {payouts.length === 0 ? (
            <div className="rounded-xl border border-dashed py-10 text-center text-muted-foreground">
              {t.noPayouts}
            </div>
          ) : (
            <div className="rounded-xl border bg-background">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.date}</TableHead>
                    <TableHead>{t.bookingId}</TableHead>
                    <TableHead>{t.amount}</TableHead>
                    <TableHead>{locale === 'he' ? 'סטטוס' : 'Status'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payouts.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-muted-foreground">
                        {formatDateLocalized(p.created_at, locale)}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {p.booking_id.slice(0, 8)}…
                      </TableCell>
                      <TableCell className="font-semibold text-primary">
                        {p.host_payout_amount
                          ? formatCurrencyILS(Number(p.host_payout_amount), locale)
                          : '—'}
                      </TableCell>
                      <TableCell>{p.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
