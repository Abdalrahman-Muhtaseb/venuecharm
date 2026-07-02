'use client'

import { useState, useTransition } from 'react'
import {
  adminResetVenuesToPending,
  adminCancelAllPendingBookings,
  adminDeleteTestVenues,
  adminDeleteAllBookings,
} from '@/actions/admin'
import { Button } from '@/components/ui/button'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { TriangleAlert, RotateCcw, Ban, Trash2, Database } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

type ActionKey = 'reset_venues' | 'cancel_pending' | 'delete_test' | 'delete_bookings'

const ACTIONS: {
  key: ActionKey
  label: string
  description: string
  confirm: string
  icon: React.ElementType
  severity: 'warn' | 'danger'
}[] = [
  {
    key: 'reset_venues',
    label: 'Reset all venues to Pending',
    description: 'Sets every non-DRAFT venue back to PENDING_APPROVAL. Useful to demo the full admin approval flow from scratch.',
    confirm: 'This will set ALL venue statuses to PENDING_APPROVAL. Venues will disappear from the public listing until re-approved.',
    icon: RotateCcw,
    severity: 'warn',
  },
  {
    key: 'cancel_pending',
    label: 'Cancel all pending bookings',
    description: 'Cancels every PENDING_APPROVAL booking. No Stripe refunds are issued — safe to use on test data only.',
    confirm: 'This will cancel ALL pending bookings. Only use on test/demo data — no Stripe refunds are triggered.',
    icon: Ban,
    severity: 'warn',
  },
  {
    key: 'delete_test',
    label: 'Delete [TEST] venues',
    description: 'Permanently deletes all venues whose title starts with [TEST]. The inverse of "Seed test venues."',
    confirm: 'All venues with [TEST] in their title will be permanently deleted from the database.',
    icon: Trash2,
    severity: 'warn',
  },
  {
    key: 'delete_bookings',
    label: 'Delete ALL bookings',
    description: 'Permanently deletes every booking record in the database. No Stripe cancellation. Use only in development.',
    confirm: 'This permanently deletes EVERY booking in the database. This cannot be undone. No Stripe cancellations are issued.',
    icon: Database,
    severity: 'danger',
  },
]

async function runAction(key: ActionKey) {
  switch (key) {
    case 'reset_venues':    return adminResetVenuesToPending()
    case 'cancel_pending':  return adminCancelAllPendingBookings()
    case 'delete_test':     return adminDeleteTestVenues()
    case 'delete_bookings': return adminDeleteAllBookings()
  }
}

function DangerAction({ action }: { action: typeof ACTIONS[number] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, start] = useTransition()
  const Icon = action.icon
  const isDanger = action.severity === 'danger'

  function handleConfirm() {
    start(async () => {
      try {
        await runAction(action.key)
        toast.success(`Done: ${action.label}`)
        setOpen(false)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Action failed')
      }
    })
  }

  return (
    <>
      <div className={cn(
        'flex items-start justify-between gap-4 rounded-xl border p-4 transition-colors',
        isDanger
          ? 'border-destructive/30 bg-destructive/5 hover:bg-destructive/8'
          : 'border-amber-200/60 bg-amber-50/50 hover:bg-amber-50 dark:border-amber-800/30 dark:bg-amber-950/20',
      )}>
        <div className="flex min-w-0 items-start gap-3">
          <div className={cn(
            'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
            isDanger ? 'bg-destructive/10 text-destructive' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
          )}>
            <Icon className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <p className={cn(
              'text-sm font-medium',
              isDanger ? 'text-destructive' : 'text-amber-800 dark:text-amber-300',
            )}>
              {action.label}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{action.description}</p>
          </div>
        </div>
        <Button
          variant={isDanger ? 'destructive' : 'outline'}
          size="sm"
          className={cn(
            'shrink-0',
            !isDanger && 'border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300',
          )}
          onClick={() => setOpen(true)}
        >
          Run
        </Button>
      </div>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className={cn('flex items-center gap-2', isDanger ? 'text-destructive' : 'text-amber-700')}>
              <TriangleAlert className="h-5 w-5" />
              Confirm — {action.label}
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-1 text-sm">
              {action.confirm}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={pending}
              className={cn(
                isDanger
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  : 'bg-amber-600 text-white hover:bg-amber-700',
              )}
            >
              {pending ? 'Running…' : 'Yes, proceed'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export function DangerZonePanel() {
  return (
    <div className="space-y-2.5">
      {ACTIONS.map((a) => (
        <DangerAction key={a.key} action={a} />
      ))}
    </div>
  )
}
