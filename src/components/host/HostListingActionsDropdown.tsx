'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Eye, Pencil, Send, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { requestVenueApproval, deleteVenue } from '@/actions/venues'
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

export function HostListingActionsDropdown({ venueId, status, locale }: Props) {
  const [dialog, setDialog] = useState<'delete' | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const isHe = locale === 'he'
  const isDraft = status === 'DRAFT'

  function handleApproval() {
    startTransition(async () => {
      try {
        await requestVenueApproval(venueId)
        toast.success(isHe ? 'הנכס נשלח לאישור' : 'Listing submitted for approval')
        router.refresh()
      } catch {
        toast.error(isHe ? 'שגיאה בשליחה לאישור' : 'Failed to submit for approval')
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteVenue(venueId)
        toast.success(isHe ? 'הנכס הוסר' : 'Listing removed')
        router.refresh()
      } catch {
        toast.error(isHe ? 'שגיאה בהסרת הנכס' : 'Failed to remove listing')
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
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem asChild>
            <Link href={`/host/listings/${venueId}`}>
              <Eye className="me-2 h-4 w-4" />
              {isHe ? 'פרטים' : 'Details'}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/host/listings/${venueId}/edit`}>
              <Pencil className="me-2 h-4 w-4" />
              {isHe ? 'עריכה' : 'Edit'}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {isDraft ? (
            <DropdownMenuItem
              className="text-emerald-600 focus:bg-emerald-50 focus:text-emerald-700 dark:focus:bg-emerald-950/30"
              onSelect={handleApproval}
              disabled={isPending}
            >
              {isPending
                ? <Loader2 className="me-2 h-4 w-4 animate-spin" />
                : <Send className="me-2 h-4 w-4" />}
              {isHe ? 'שלח לאישור' : 'Submit for approval'}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              onSelect={() => setDialog('delete')}
            >
              <Trash2 className="me-2 h-4 w-4" />
              {isHe ? 'הסר' : 'Remove'}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={dialog === 'delete'} onOpenChange={(o) => !o && setDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isHe ? 'הסרת נכס?' : 'Remove listing?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {isHe
                ? 'הנכס יועבר לסטטוס טיוטה ולא יופיע בחיפוש. ניתן לשחזרו בהמשך.'
                : 'The listing will be set to Draft and hidden from search. You can restore it later.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>
              {isHe ? 'ביטול' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : isHe ? 'הסר' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
