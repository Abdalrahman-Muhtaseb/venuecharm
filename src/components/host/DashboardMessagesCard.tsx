'use client'

import Link from 'next/link'
import { MessageCircle, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useUnreadMessages } from '@/hooks/useUnreadMessages'
import type { Locale } from '@/lib/i18n'

/**
 * Messages shortcut card on the host dashboard.
 * Uses the same useUnreadMessages() Realtime hook as the sidebar badge so
 * both update at exactly the same time — no router.refresh() lag.
 */
export function DashboardMessagesCard({ locale }: { locale: Locale }) {
  const isHe = locale === 'he'
  const unread = useUnreadMessages()

  return (
    <Link
      href="/host/messages"
      className="group flex items-center gap-3 rounded-xl border bg-background p-4 transition-all hover:border-primary/30 hover:shadow-sm"
    >
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${unread ? 'bg-primary/10' : 'bg-muted'}`}>
        <MessageCircle className={`h-5 w-5 ${unread ? 'text-primary' : 'text-muted-foreground'}`} aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium">{isHe ? 'הודעות' : 'Messages'}</p>
          {unread > 0 && (
            <Badge className="h-5 rounded-full px-1.5 text-xs">{unread}</Badge>
          )}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {unread
            ? `${unread} ${isHe ? 'הודעות חדשות' : 'unread'}`
            : isHe ? 'אין הודעות חדשות' : 'No new messages'}
        </p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
    </Link>
  )
}
