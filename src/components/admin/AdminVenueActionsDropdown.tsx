'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, FileSearch, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { approveVenue, suspendVenue } from '@/actions/venues'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { Locale } from '@/lib/i18n'

interface Props {
  venueId: string
  status: string
  locale: Locale
}

export function AdminVenueActionsDropdown({ venueId, status, locale }: Props) {
  const [dialog, setDialog] = useState<'approve' | 'suspend' | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const isHe = locale === 'he'

  const canApprove = status === 'PENDING_APPROVAL' || status === 'SUSPENDED'
  const canSuspend = status === 'ACTIVE' || status === 'PENDING_APPROVAL'

  function execute(action: 'approve' | 'suspend') {
    startTransition(async () => {
      try {
        if (action === 'approve') {
          await approveVenue(venueId)
          toast.success(isHe ? 'הנכס אושר' : 'Venue approved')
        } else {
          await suspendVenue(venueId)
          toast.success(isHe ? 'הנכס הושעה' : 'Venue suspended')
        }
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : isHe ? 'הפעולה נכשלה' : 'Action failed')
      } finally {
        setDialog(null)
      }
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 data-[state=open]:bg-muted">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">{isHe ? 'פעולות' : 'Actions'}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem asChild>
            <Link href={`/admin/${venueId}`}>
              <FileSearch className="me-2 h-4 w-4" />
              {isHe ? 'סקירה' : 'Review'}
            </Link>
          </DropdownMenuItem>
          {(canApprove || canSuspend) && <DropdownMenuSeparator />}
          {canApprove && (
            <DropdownMenuItem
              className="text-emerald-600 focus:bg-emerald-50 focus:text-emerald-700 dark:focus:bg-emerald-950/30"
              onSelect={() => setDialog('approve')}
            >
              <CheckCircle2 className="me-2 h-4 w-4" />
              {isHe ? 'אישור' : 'Approve'}
            </DropdownMenuItem>
          )}
          {canSuspend && (
            <DropdownMenuItem
              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              onSelect={() => setDialog('suspend')}
            >
              <XCircle className="me-2 h-4 w-4" />
              {isHe ? 'השעיה' : 'Suspend'}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={dialog === 'approve'} onOpenChange={(o) => !o && setDialog(null)}>
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
            <AlertDialogCancel disabled={isPending}>
              {isHe ? 'ביטול' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => execute('approve')}
              disabled={isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isHe ? (
                'אישור'
              ) : (
                'Approve'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={dialog === 'suspend'} onOpenChange={(o) => !o && setDialog(null)}>
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
            <AlertDialogCancel disabled={isPending}>
              {isHe ? 'ביטול' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => execute('suspend')}
              disabled={isPending}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isHe ? (
                'השעיה'
              ) : (
                'Suspend'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
