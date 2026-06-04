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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { TriangleAlert } from 'lucide-react'

type ActionKey = 'reset_venues' | 'cancel_pending' | 'delete_test' | 'delete_bookings'

const ACTIONS: { key: ActionKey; label: string; description: string; confirm: string }[] = [
  {
    key: 'reset_venues',
    label: 'Reset all venues to Pending',
    description: 'Sets every non-DRAFT venue back to PENDING_APPROVAL. Useful to re-run the approval flow during demos.',
    confirm: 'This will reset ALL venue statuses. Hosts may not expect their venues to disappear from the public listing.',
  },
  {
    key: 'cancel_pending',
    label: 'Cancel all pending bookings',
    description: 'Cancels every PENDING booking. No Stripe refunds are issued — suitable for test/dev data only.',
    confirm: 'This will cancel ALL pending bookings. Only use on test data.',
  },
  {
    key: 'delete_test',
    label: 'Delete [TEST] venues',
    description: 'Deletes all venues whose title starts with [TEST]. Safe to run after seeding.',
    confirm: 'All venues with [TEST] in their title will be permanently deleted.',
  },
  {
    key: 'delete_bookings',
    label: 'Delete ALL bookings',
    description: 'Permanently deletes every booking record. No Stripe cancellation — use only in development.',
    confirm: 'This permanently deletes EVERY booking in the database. This cannot be undone.',
  },
]

async function runAction(key: ActionKey) {
  switch (key) {
    case 'reset_venues':      return adminResetVenuesToPending()
    case 'cancel_pending':    return adminCancelAllPendingBookings()
    case 'delete_test':       return adminDeleteTestVenues()
    case 'delete_bookings':   return adminDeleteAllBookings()
  }
}

function DangerAction({ action }: { action: typeof ACTIONS[number] }) {
  const [open, setOpen] = useState(false)
  const [pending, start] = useTransition()

  function handleConfirm() {
    start(async () => {
      try {
        await runAction(action.key)
        toast.success(`Done: ${action.label}`)
        setOpen(false)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Action failed')
      }
    })
  }

  return (
    <>
      <div className="flex items-start justify-between gap-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-destructive">{action.label}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{action.description}</p>
        </div>
        <Button variant="destructive" size="sm" className="shrink-0" onClick={() => setOpen(true)}>
          Run
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <TriangleAlert className="h-5 w-5" />
              Confirm destructive action
            </DialogTitle>
            <DialogDescription className="pt-1">{action.confirm}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" disabled={pending} onClick={handleConfirm}>
              {pending ? 'Running...' : 'Yes, proceed'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function DangerZonePanel() {
  return (
    <div className="space-y-3">
      {ACTIONS.map((a) => (
        <DangerAction key={a.key} action={a} />
      ))}
    </div>
  )
}
