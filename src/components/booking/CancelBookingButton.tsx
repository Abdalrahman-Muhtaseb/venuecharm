'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { cancelOwnBooking } from '@/actions/bookings'
import { Button } from '@/components/ui/button'
import { getDictionary, type Locale } from '@/lib/i18n'

interface CancelBookingButtonProps {
  bookingId: string
  locale: Locale
}

export function CancelBookingButton({ bookingId, locale }: CancelBookingButtonProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const t = getDictionary(locale).renterBookings

  const handle = () => {
    startTransition(async () => {
      try {
        await cancelOwnBooking(bookingId)
        toast.success(t.cancelled)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t.cancelFailed)
      }
    })
  }

  return (
    <Button
      variant="outline"
      onClick={handle}
      disabled={isPending}
      className="border-destructive text-destructive hover:bg-destructive/10"
    >
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="me-2 h-4 w-4" />}
      {t.cancelRequest}
    </Button>
  )
}
