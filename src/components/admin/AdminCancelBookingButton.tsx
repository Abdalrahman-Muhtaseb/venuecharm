'use client'

import { useTransition } from 'react'
import { adminCancelBooking } from '@/actions/admin'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function AdminCancelBookingButton({ bookingId, status }: { bookingId: string; status: string }) {
  const [pending, start] = useTransition()
  const canCancel = status === 'PENDING_APPROVAL' || status === 'CONFIRMED'

  if (!canCancel) return <span className="text-xs text-muted-foreground">—</span>

  return (
    <Button
      variant="destructive"
      size="sm"
      className="h-7 text-xs"
      disabled={pending}
      onClick={() =>
        start(async () => {
          try {
            await adminCancelBooking(bookingId)
            toast.success('Booking cancelled')
          } catch {
            toast.error('Failed to cancel')
          }
        })
      }
    >
      Cancel
    </Button>
  )
}
