import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  Clock, CheckCircle2, CheckCheck, XCircle, Ban,
  Building2, User, ArrowLeft, Receipt, CreditCard, ArrowRightLeft,
  RotateCcw, MessageSquareQuote,
} from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { AdminCancelBookingButton } from '@/components/admin/AdminCancelBookingButton'
import { formatDateLocalized, formatDateTimeLocalized, formatCurrencyILS } from '@/lib/i18n'
import { cn } from '@/lib/utils'

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, {
  label: string; badgeCls: string; icon: React.ElementType; iconCls: string
}> = {
  PENDING_APPROVAL: {
    label: 'Pending Approval',
    badgeCls: 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
    icon: Clock, iconCls: 'text-amber-500',
  },
  CONFIRMED: {
    label: 'Confirmed',
    badgeCls: 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
    icon: CheckCircle2, iconCls: 'text-emerald-500',
  },
  COMPLETED: {
    label: 'Completed',
    badgeCls: 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
    icon: CheckCheck, iconCls: 'text-blue-500',
  },
  CANCELLED: {
    label: 'Cancelled',
    badgeCls: 'border-muted-foreground/30 text-muted-foreground',
    icon: XCircle, iconCls: 'text-muted-foreground',
  },
  REJECTED: {
    label: 'Rejected by Host',
    badgeCls: 'border-destructive/30 bg-destructive/5 text-destructive',
    icon: Ban, iconCls: 'text-destructive',
  },
}

// ── Status timeline ───────────────────────────────────────────────────────────

type TimelineStep = { key: string; label: string; done: boolean; active: boolean; branch?: 'cancel' | 'reject' }

function buildTimeline(status: string): TimelineStep[] {
  const mainPath = ['PENDING_APPROVAL', 'CONFIRMED', 'COMPLETED']
  const isCancelled = status === 'CANCELLED'
  const isRejected  = status === 'REJECTED'
  const isTerminal  = isCancelled || isRejected

  const steps: TimelineStep[] = mainPath.map((key, i) => {
    const currentIdx = mainPath.indexOf(status)
    return {
      key,
      label: key === 'PENDING_APPROVAL' ? 'Requested'
           : key === 'CONFIRMED'        ? 'Confirmed'
           : 'Completed',
      done:   currentIdx > i || (status === key),
      active: status === key && !isTerminal,
    }
  })

  if (isTerminal) {
    steps.push({
      key: status,
      label: isCancelled ? 'Cancelled' : 'Rejected',
      done: true,
      active: true,
      branch: isCancelled ? 'cancel' : 'reject',
    })
  }

  return steps
}

function StatusTimeline({ status }: { status: string }) {
  const steps = buildTimeline(status)
  const isTerminal = status === 'CANCELLED' || status === 'REJECTED'

  return (
    <div className="rounded-xl border bg-background p-5">
      <h2 className="mb-5 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Status timeline
      </h2>
      <ol className="flex items-start gap-0">
        {steps.map((step, i) => {
          const isLast     = i === steps.length - 1
          const isBranch   = !!step.branch
          const isCancel   = step.branch === 'cancel'
          const isReject   = step.branch === 'reject'
          const dotActive  = step.done || step.active

          const dotCls = isBranch
            ? isCancel
              ? 'border-2 border-muted-foreground bg-muted-foreground/20 text-muted-foreground'
              : 'border-2 border-destructive bg-destructive/10 text-destructive'
            : step.active
            ? 'border-2 border-primary bg-primary text-primary-foreground shadow-md shadow-primary/30'
            : step.done
            ? 'border-2 border-primary/50 bg-primary/10 text-primary'
            : 'border-2 border-muted-foreground/20 bg-muted text-muted-foreground/40'

          const labelCls = step.active
            ? 'text-foreground font-semibold'
            : step.done
            ? 'text-muted-foreground'
            : 'text-muted-foreground/50'

          const lineCls = step.done && !isLast && !isBranch
            ? 'bg-primary/30'
            : 'bg-muted-foreground/15'

          const StepIcon = step.done
            ? isBranch
              ? isCancel ? XCircle : Ban
              : step.active
              ? (STATUS_CFG[status]?.icon ?? CheckCheck)
              : CheckCheck
            : STATUS_CFG[step.key]?.icon ?? Clock

          return (
            <li key={step.key} className={cn('flex flex-1 flex-col items-center', isLast && 'flex-none')}>
              <div className="flex w-full items-center">
                {/* connector before */}
                {i > 0 && !isBranch && (
                  <div className={cn('h-0.5 flex-1', lineCls)} />
                )}
                {isBranch && (
                  <div className="h-0.5 flex-1 border-t-2 border-dashed border-muted-foreground/20" />
                )}

                {/* dot */}
                <div className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all',
                  dotCls,
                )}>
                  <StepIcon className="h-4 w-4" />
                </div>

                {/* connector after */}
                {!isLast && (
                  <div className={cn('h-0.5 flex-1', i < steps.length - 2 && step.done ? lineCls : 'bg-muted-foreground/15')} />
                )}
              </div>
              <p className={cn('mt-2 max-w-[80px] text-center text-xs leading-tight', labelCls)}>
                {step.label}
              </p>
            </li>
          )
        })}
      </ol>

      {isTerminal && (
        <p className="mt-4 text-center text-xs text-muted-foreground">
          {status === 'CANCELLED'
            ? 'This booking was cancelled by the renter or an admin.'
            : 'The host declined this booking request.'}
        </p>
      )}
    </div>
  )
}

// ── Info card ─────────────────────────────────────────────────────────────────

function InfoCard({
  icon: Icon, iconCls, title, children,
}: {
  icon: React.ElementType; iconCls: string; title: string; children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border bg-background p-4">
      <div className="mb-3 flex items-center gap-2">
        <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg bg-muted', iconCls)}>
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-sm font-semibold">{title}</p>
      </div>
      <div className="space-y-1.5 text-sm">{children}</div>
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  if (!value) return null
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className={cn('text-end text-xs', mono ? 'font-mono text-[11px] break-all' : '')}>{value}</span>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AdminBookingDetailPage({ params }: { params: { id: string } }) {
  const db = createAdminClient()

  const [{ data: booking }, { data: paymentRows }] = await Promise.all([
    db.from('bookings').select(`
      id, venue_id, renter_id, start_at, end_at, total_price, status,
      notes, created_at, cancelled_at, cancellation_deadline
    `).eq('id', params.id).single(),
    db.from('payments').select(`
      id, amount, currency, stripe_payment_intent_id, status,
      platform_fee_amount, host_payout_amount,
      stripe_transfer_id, stripe_refund_id, refund_amount
    `).eq('booking_id', params.id).limit(1),
  ])

  if (!booking) notFound()

  const payment = paymentRows?.[0] ?? null

  const [{ data: venue }, { data: renter }] = await Promise.all([
    db.from('venues').select('id, title, city, address, host_id').eq('id', booking.venue_id).single(),
    db.from('users').select('id, first_name, last_name, email, phone_number').eq('id', booking.renter_id).single(),
  ])

  const { data: host } = venue?.host_id
    ? await db.from('users').select('id, first_name, last_name, email').eq('id', venue.host_id).single()
    : { data: null }

  const cfg = STATUS_CFG[booking.status] ?? STATUS_CFG.CANCELLED

  // Financial calculations
  const base         = booking.total_price
  const platformFee  = payment?.platform_fee_amount ?? Math.round(base * 0.15)
  const hostPayout   = payment?.host_payout_amount  ?? Math.round(base * 0.85)
  const refundAmount = payment?.refund_amount ?? null

  return (
    <div className="space-y-5">

      {/* ── Back + title row ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/admin/bookings"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          All bookings
        </Link>

        <div className="flex items-center gap-2">
          <span className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium',
            cfg.badgeCls,
          )}>
            <cfg.icon className={cn('h-3 w-3', cfg.iconCls)} />
            {cfg.label}
          </span>
          <AdminCancelBookingButton bookingId={booking.id} status={booking.status} />
        </div>
      </div>

      {/* ── Status timeline ────────────────────────────────────────────────── */}
      <StatusTimeline status={booking.status} />

      {/* ── Main grid ─────────────────────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-3">

        {/* Venue */}
        <InfoCard icon={Building2} iconCls="text-primary" title="Venue">
          <Row label="Name"    value={venue?.title} />
          <Row label="City"    value={venue?.city} />
          <Row label="Address" value={venue?.address} />
          {venue?.id && (
            <Link
              href={`/venues/${venue.id}`}
              target="_blank"
              className="mt-2 inline-block text-xs text-primary underline-offset-4 hover:underline"
            >
              View listing →
            </Link>
          )}
        </InfoCard>

        {/* Renter */}
        <InfoCard icon={User} iconCls="text-blue-500" title="Renter">
          <Row
            label="Name"
            value={renter
              ? [renter.first_name, renter.last_name].filter(Boolean).join(' ') || '—'
              : '—'}
          />
          <Row label="Email"  value={renter?.email} />
          <Row label="Phone"  value={renter?.phone_number} />
          {renter?.id && (
            <Link
              href={`/admin/users/${renter.id}`}
              className="mt-2 inline-block text-xs text-primary underline-offset-4 hover:underline"
            >
              View profile →
            </Link>
          )}
        </InfoCard>

        {/* Host */}
        <InfoCard icon={Building2} iconCls="text-emerald-600" title="Host">
          <Row
            label="Name"
            value={host
              ? [host.first_name, host.last_name].filter(Boolean).join(' ') || '—'
              : '—'}
          />
          <Row label="Email" value={host?.email} />
          {host?.id && (
            <Link
              href={`/admin/users/${host.id}`}
              className="mt-2 inline-block text-xs text-primary underline-offset-4 hover:underline"
            >
              View profile →
            </Link>
          )}
        </InfoCard>
      </div>

      {/* ── Booking dates ──────────────────────────────────────────────────── */}
      <div className="rounded-xl border bg-background p-4">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Event details</h2>
        <div className="grid gap-3 sm:grid-cols-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Check-in</p>
            <p className="font-medium">{formatDateTimeLocalized(booking.start_at, 'en')}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Check-out</p>
            <p className="font-medium">{formatDateTimeLocalized(booking.end_at, 'en')}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Booking created</p>
            <p className="font-medium">{formatDateTimeLocalized(booking.created_at, 'en')}</p>
          </div>
          {booking.cancelled_at && (
            <div>
              <p className="text-xs text-muted-foreground">Cancelled at</p>
              <p className="font-medium text-muted-foreground">{formatDateTimeLocalized(booking.cancelled_at, 'en')}</p>
            </div>
          )}
          {booking.cancellation_deadline && (
            <div>
              <p className="text-xs text-muted-foreground">Cancellation deadline</p>
              <p className="font-medium">{formatDateLocalized(booking.cancellation_deadline, 'en')}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Financial receipt ──────────────────────────────────────────────── */}
      <div className="rounded-xl border bg-background p-4">
        <div className="mb-3 flex items-center gap-2">
          <Receipt className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Financial receipt</h2>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Base price</span>
            <span className="font-medium">{formatCurrencyILS(base, 'en')}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Platform fee (15%)</span>
            <span>−{formatCurrencyILS(platformFee, 'en')}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Host payout (85%)</span>
            <span className="text-emerald-600">{formatCurrencyILS(hostPayout, 'en')}</span>
          </div>

          {refundAmount != null && refundAmount > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Refund issued</span>
              <span className="text-blue-600 flex items-center gap-1">
                <RotateCcw className="h-3 w-3" />
                {formatCurrencyILS(refundAmount, 'en')}
              </span>
            </div>
          )}

          <div className="mt-3 flex justify-between border-t pt-3 font-semibold">
            <span>Total charged</span>
            <span>{formatCurrencyILS(payment?.amount ?? base, 'en')}</span>
          </div>
        </div>

        {/* Stripe IDs */}
        {(payment?.stripe_payment_intent_id || payment?.stripe_transfer_id || payment?.stripe_refund_id) && (
          <div className="mt-4 space-y-1.5 border-t pt-4">
            {payment?.stripe_payment_intent_id && (
              <div className="flex items-center justify-between gap-4 text-xs">
                <span className="flex items-center gap-1 text-muted-foreground shrink-0">
                  <CreditCard className="h-3 w-3" /> Payment intent
                </span>
                <span className="font-mono text-[11px] break-all text-end">{payment.stripe_payment_intent_id}</span>
              </div>
            )}
            {payment?.stripe_transfer_id && (
              <div className="flex items-center justify-between gap-4 text-xs">
                <span className="flex items-center gap-1 text-muted-foreground shrink-0">
                  <ArrowRightLeft className="h-3 w-3" /> Transfer ID
                </span>
                <span className="font-mono text-[11px] break-all text-end">{payment.stripe_transfer_id}</span>
              </div>
            )}
            {payment?.stripe_refund_id && (
              <div className="flex items-center justify-between gap-4 text-xs">
                <span className="flex items-center gap-1 text-muted-foreground shrink-0">
                  <RotateCcw className="h-3 w-3" /> Refund ID
                </span>
                <span className="font-mono text-[11px] break-all text-end">{payment.stripe_refund_id}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Renter notes ───────────────────────────────────────────────────── */}
      {booking.notes && (
        <div className="rounded-xl border bg-muted/30 p-4">
          <div className="mb-2 flex items-center gap-2">
            <MessageSquareQuote className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Renter&apos;s notes</h2>
          </div>
          <blockquote className="border-s-2 border-primary/40 ps-3 text-sm italic text-muted-foreground whitespace-pre-wrap">
            {booking.notes}
          </blockquote>
        </div>
      )}

      {/* ── Booking ID ────────────────────────────────────────────────────── */}
      <p className="text-center font-mono text-[11px] text-muted-foreground/50">
        Booking ID: {booking.id}
      </p>
    </div>
  )
}
