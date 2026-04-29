'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { acceptBooking, declineBooking } from '@/actions/bookings'
import { Button } from '@/components/ui/button'
import type { Locale } from '@/lib/i18n'

interface BookingActionButtonsProps {
  bookingId: string
  locale: Locale
}

export function BookingActionButtons({ bookingId, locale }: BookingActionButtonsProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const isHe = locale === 'he'

  const handle = (action: 'accept' | 'decline') => {
    startTransition(async () => {
      try {
        if (action === 'accept') {
          await acceptBooking(bookingId)
          toast.success(isHe ? 'ההזמנה אושרה' : 'Booking accepted')
        } else {
          await declineBooking(bookingId)
          toast.success(isHe ? 'ההזמנה נדחתה' : 'Booking declined')
        }
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : (isHe ? 'שגיאה' : 'Action failed'))
      }
    })
  }

  return (
    <div className="flex gap-3">
      <Button
        onClick={() => handle('accept')}
        disabled={isPending}
        className="flex-1 bg-emerald-600 hover:bg-emerald-700"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="me-2 h-4 w-4" />}
        {isHe ? 'אשר הזמנה' : 'Accept'}
      </Button>
      <Button
        variant="outline"
        onClick={() => handle('decline')}
        disabled={isPending}
        className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="me-2 h-4 w-4" />}
        {isHe ? 'דחה' : 'Decline'}
      </Button>
    </div>
  )
}
