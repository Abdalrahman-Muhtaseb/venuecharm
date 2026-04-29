'use client'

import { useState, useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { deleteVenue } from '@/actions/venues'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { Locale } from '@/lib/i18n'

interface DeleteVenueButtonProps {
  venueId: string
  locale: Locale
}

export function DeleteVenueButton({ venueId, locale }: DeleteVenueButtonProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const isHe = locale === 'he'

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteVenue(venueId)
        toast.success(isHe ? 'הנכס הוסר' : 'Listing removed')
        setOpen(false)
      } catch {
        toast.error(isHe ? 'שגיאה בהסרת הנכס' : 'Failed to remove listing')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isHe ? 'הסרת נכס' : 'Remove listing'}</DialogTitle>
          <DialogDescription>
            {isHe
              ? 'הנכס יועבר לסטטוס טיוטה ולא יופיע בחיפוש. ניתן לשחזרו בהמשך.'
              : 'The listing will be set to Draft and hidden from search. You can restore it later.'}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            {isHe ? 'ביטול' : 'Cancel'}
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending ? (isHe ? 'מסיר...' : 'Removing...') : (isHe ? 'הסר' : 'Remove')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
