'use client'

import { useRouter } from 'next/navigation'
import { Bell, CalendarCheck, MessageCircle, Star, CheckCheck } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import {
  notificationCopy,
  type NotificationRow,
  type NotificationType,
} from '@/lib/notification-copy'
import { markAllNotificationsRead, markNotificationRead } from '@/actions/notifications'
import { formatDateTimeLocalized, type Locale } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const ICONS: Record<NotificationType, typeof Bell> = {
  booking_requested: CalendarCheck,
  booking_accepted: CalendarCheck,
  booking_declined: CalendarCheck,
  booking_cancelled: CalendarCheck,
  message: MessageCircle,
  review: Star,
}

export function NotificationsPanel({ locale }: { locale: Locale }) {
  const router = useRouter()
  const { items, unread, loading, markAllReadLocal } = useNotifications()
  const he = locale === 'he'

  const openItem = (n: NotificationRow) => {
    if (!n.is_read) markNotificationRead(n.id)
    if (n.link) router.push(n.link)
  }

  const markAll = () => {
    markAllReadLocal()
    markAllNotificationsRead()
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{he ? 'התראות' : 'Notifications'}</h1>
        {unread > 0 && (
          <button
            type="button"
            onClick={markAll}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <CheckCheck className="h-4 w-4" />
            {he ? 'סמן הכול כנקרא' : 'Mark all read'}
          </button>
        )}
      </div>

      {loading ? (
        <p className="py-16 text-center text-sm text-muted-foreground">{he ? 'טוען…' : 'Loading…'}</p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed py-16 text-center">
          <Bell className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
          <p className="text-muted-foreground">{he ? 'אין התראות עדיין' : 'No notifications yet'}</p>
        </div>
      ) : (
        <ul className="divide-y rounded-2xl border">
          {items.map((n) => {
            const { title, body } = notificationCopy(n, locale)
            const Icon = ICONS[n.type] ?? Bell
            return (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => openItem(n)}
                  className={cn(
                    'flex w-full items-start gap-3 px-4 py-3.5 text-start transition-colors hover:bg-muted/60',
                    !n.is_read && 'bg-primary/5',
                  )}
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{title}</span>
                    <span className="block text-sm text-muted-foreground">{body}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground/80">
                      {formatDateTimeLocalized(n.created_at, locale)}
                    </span>
                  </span>
                  {!n.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
