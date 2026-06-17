'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarCheck2, CalendarPlus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { startCalendarConnect, disconnectCalendar } from '@/actions/google-calendar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getDictionary, type Locale } from '@/lib/i18n'

interface HostCalendarConnectCardProps {
  locale: Locale
  configured: boolean
  connected: boolean
}

export function HostCalendarConnectCard({ locale, configured, connected }: HostCalendarConnectCardProps) {
  const t = getDictionary(locale).calendarSync
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleConnect = () => {
    startTransition(async () => {
      try {
        toast(t.connecting)
        const { url } = await startCalendarConnect()
        window.location.href = url
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t.failed)
      }
    })
  }

  const handleDisconnect = () => {
    startTransition(async () => {
      try {
        await disconnectCalendar()
        toast.success(t.disconnected)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t.failed)
      }
    })
  }

  const description = !configured
    ? t.explainNotConfigured
    : connected
    ? t.explainConnected
    : t.explainNotConnected

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          {connected ? (
            <CalendarCheck2 className="h-6 w-6 shrink-0 text-emerald-600" />
          ) : (
            <CalendarPlus className="h-6 w-6 shrink-0 text-primary" />
          )}
          <div>
            <CardTitle className="flex items-center gap-2">
              {t.title}
              {configured && (
                <Badge
                  variant="secondary"
                  className={
                    connected
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100'
                      : ''
                  }
                >
                  {connected ? t.connected : t.notConnected}
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      {configured && (
        <CardContent>
          {connected ? (
            <Button variant="outline" onClick={handleDisconnect} disabled={isPending}>
              {isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {t.disconnect}
            </Button>
          ) : (
            <Button onClick={handleConnect} disabled={isPending}>
              {isPending ? (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              ) : (
                <CalendarPlus className="me-2 h-4 w-4" />
              )}
              {t.connect}
            </Button>
          )}
        </CardContent>
      )}
    </Card>
  )
}
