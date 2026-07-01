'use client'

import { CalendarCheck2, CalendarPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { HostCalendarConnectCard } from '@/components/booking/HostCalendarConnectCard'
import type { Locale } from '@/lib/i18n'

interface CalendarSyncDialogProps {
  locale: Locale
  configured: boolean
  connected: boolean
}

/** Compact toolbar trigger that opens a modal with the full calendar-sync card. */
export function CalendarSyncDialog({ locale, configured, connected }: CalendarSyncDialogProps) {
  const isHe = locale === 'he'

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          {connected
            ? <CalendarCheck2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            : <CalendarPlus className="h-4 w-4" aria-hidden="true" />}
          <span className="hidden sm:inline">Google Calendar</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg overflow-hidden p-0">
        <DialogTitle className="sr-only">
          {isHe ? 'סנכרון לוח שנה של Google' : 'Google Calendar sync'}
        </DialogTitle>
        <HostCalendarConnectCard
          locale={locale}
          configured={configured}
          connected={connected}
        />
      </DialogContent>
    </Dialog>
  )
}
