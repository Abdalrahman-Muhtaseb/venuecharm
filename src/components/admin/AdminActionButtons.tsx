'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { approveVenue, suspendVenue } from '@/actions/venues'
import { Button } from '@/components/ui/button'
import { getDictionary, type Locale } from '@/lib/i18n'

interface AdminActionButtonsProps {
  venueId: string
  status: string
  locale: Locale
  size?: 'sm' | 'default'
}

export function AdminActionButtons({ venueId, status, locale, size = 'default' }: AdminActionButtonsProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const t = getDictionary(locale).admin

  const handle = (action: 'approve' | 'suspend') => {
    startTransition(async () => {
      try {
        if (action === 'approve') {
          await approveVenue(venueId)
          toast.success(t.approved)
        } else {
          await suspendVenue(venueId)
          toast.success(t.suspendedToast)
        }
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t.actionFailed)
      }
    })
  }

  const canApprove = status === 'PENDING_APPROVAL' || status === 'SUSPENDED'
  const canSuspend = status === 'ACTIVE' || status === 'PENDING_APPROVAL'

  return (
    <div className="flex flex-wrap gap-2">
      {canApprove && (
        <Button
          onClick={() => handle('approve')}
          disabled={isPending}
          size={size}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="me-2 h-4 w-4" />}
          {t.approve}
        </Button>
      )}
      {canSuspend && (
        <Button
          variant="outline"
          onClick={() => handle('suspend')}
          disabled={isPending}
          size={size}
          className="border-destructive text-destructive hover:bg-destructive/10"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="me-2 h-4 w-4" />}
          {t.suspend}
        </Button>
      )}
    </div>
  )
}
