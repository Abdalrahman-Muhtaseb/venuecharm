import Link from 'next/link'
import { CalendarDays, User } from 'lucide-react'
import { formatCurrencyILS, formatDateTimeLocalized, type Locale } from '@/lib/i18n'

const statusColor: Record<string, string> = {
  PENDING:   'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  CONFIRMED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  CANCELLED: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  COMPLETED: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  REJECTED:  'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
}

export interface HostBookingCardRow {
  id: string
  start_at: string
  total_price: number
  status: string
  venueTitle: string
  renterName: string
}

export function HostBookingCard({ b, locale }: { b: HostBookingCardRow; locale: Locale }) {
  return (
    <Link
      href={`/host/bookings/${b.id}`}
      className="flex flex-col gap-2 rounded-xl border bg-background p-4 transition hover:bg-muted/30"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="truncate font-medium">{b.venueTitle}</p>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor[b.status] ?? ''}`}>
          {b.status.replace('_', ' ')}
        </span>
      </div>
      <p className="flex items-center gap-1.5 truncate text-sm text-muted-foreground">
        <User className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        {b.renterName}
      </p>
      <div className="mt-1 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {formatDateTimeLocalized(b.start_at, locale)}
        </span>
        <span className="font-semibold text-primary">{formatCurrencyILS(Number(b.total_price), locale)}</span>
      </div>
    </Link>
  )
}
