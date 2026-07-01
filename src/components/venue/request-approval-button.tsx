'use client'

import { useTransition, type ReactNode } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { requestVenueApproval } from '@/actions/venues'
import { Button } from '@/components/ui/button'
import type { Locale } from '@/lib/i18n'

interface RequestApprovalButtonProps {
  venueId: string
  locale: Locale
  className?: string
  /** Icon-only mode (matches the other outline icon-only action buttons) — omit for the labelled button. */
  icon?: ReactNode
}

export function RequestApprovalButton({ venueId, locale, className, icon }: RequestApprovalButtonProps) {
  const [isPending, startTransition] = useTransition()
  const isHe = locale === 'he'
  const label = isHe ? 'בקש אישור' : 'Request approval'

  const handleClick = () => {
    startTransition(async () => {
      try {
        await requestVenueApproval(venueId)
        toast.success(isHe ? 'הנכס נשלח לאישור' : 'Listing submitted for approval')
      } catch {
        toast.error(isHe ? 'שגיאה בשליחת הנכס לאישור' : 'Failed to submit listing for approval')
      }
    })
  }

  if (icon) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={isPending}
        aria-label={label}
        className={className}
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      </Button>
    )
  }

  return (
    <Button type="button" size="sm" onClick={handleClick} disabled={isPending} className={className}>
      {isPending ? <Loader2 className="me-1.5 h-3.5 w-3.5 animate-spin" /> : <Send className="me-1.5 h-3.5 w-3.5" />}
      {label}
    </Button>
  )
}
