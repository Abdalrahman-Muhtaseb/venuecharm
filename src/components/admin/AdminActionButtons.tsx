'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { approveVenue, suspendVenue } from '@/actions/venues'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { getDictionary, type Locale } from '@/lib/i18n'

interface AdminActionButtonsProps {
  venueId: string
  status: string
  locale: Locale
  size?: 'sm' | 'default'
  /** When true renders icon-only square buttons (for table rows and cards). */
  iconOnly?: boolean
}

export function AdminActionButtons({
  venueId,
  status,
  locale,
  size = 'default',
  iconOnly = false,
}: AdminActionButtonsProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const t = getDictionary(locale).admin
  const isHe = locale === 'he'

  const execute = (action: 'approve' | 'suspend') => {
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

  if (!canApprove && !canSuspend) return null

  const squareCls = iconOnly ? 'h-8 w-8 p-0' : ''

  return (
    <div className="flex flex-wrap gap-2">
      {canApprove && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              disabled={isPending}
              size={size}
              className={`bg-emerald-600 hover:bg-emerald-700 ${squareCls}`}
              title={isHe ? 'אישור נכס' : 'Approve venue'}
              aria-label={isHe ? 'אישור נכס' : 'Approve venue'}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className={iconOnly ? 'h-4 w-4' : 'me-2 h-4 w-4'} />
                  {!iconOnly && t.approve}
                </>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {isHe ? 'לאשר את הנכס?' : 'Approve venue?'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {isHe
                  ? 'הנכס יאושר ויהפוך גלוי לציבור מיד.'
                  : 'This venue will be approved and immediately visible to the public.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{isHe ? 'ביטול' : 'Cancel'}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => execute('approve')}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isHe ? 'אישור' : 'Approve'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {canSuspend && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              disabled={isPending}
              size={size}
              className={`border-destructive text-destructive hover:bg-destructive/10 ${squareCls}`}
              title={isHe ? 'השעיית נכס' : 'Suspend venue'}
              aria-label={isHe ? 'השעיית נכס' : 'Suspend venue'}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <XCircle className={iconOnly ? 'h-4 w-4' : 'me-2 h-4 w-4'} />
                  {!iconOnly && t.suspend}
                </>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {isHe ? 'להשעות את הנכס?' : 'Suspend venue?'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {isHe
                  ? 'הנכס יוסר מתוצאות החיפוש. ניתן לשחזרו בכל עת.'
                  : 'This venue will be removed from search results. You can restore it at any time.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{isHe ? 'ביטול' : 'Cancel'}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => execute('suspend')}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                {isHe ? 'השעיה' : 'Suspend'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
