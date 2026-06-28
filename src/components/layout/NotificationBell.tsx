'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, CalendarCheck, MessageCircle, Star, CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useNotifications } from '@/hooks/useNotifications'
import {
  notificationCopy,
  type NotificationRow,
  type NotificationType,
} from '@/lib/notification-copy'
import { markAllNotificationsRead, markNotificationRead } from '@/actions/notifications'
import type { Locale } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const ICONS: Record<NotificationType, typeof Bell> = {
  booking_requested: CalendarCheck,
  booking_accepted: CalendarCheck,
  booking_declined: CalendarCheck,
  booking_cancelled: CalendarCheck,
  message: MessageCircle,
  review: Star,
}

function relativeTime(iso: string, locale: Locale): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.round(diff / 60000)
  const he = locale === 'he'
  if (min < 1) return he ? 'עכשיו' : 'now'
  if (min < 60) return he ? `לפני ${min} ד׳` : `${min}m ago`
  const hr = Math.round(min / 60)
  if (hr < 24) return he ? `לפני ${hr} ש׳` : `${hr}h ago`
  const d = Math.round(hr / 24)
  if (d < 7) return he ? `לפני ${d} ימים` : `${d}d ago`
  const w = Math.round(d / 7)
  return he ? `לפני ${w} שב׳` : `${w}w ago`
}

export function NotificationBell({ locale }: { locale: Locale }) {
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative rounded-full"
          aria-label={he ? 'התראות' : 'Notifications'}
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          {unread > 0 && (
            <span
              className="absolute -end-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground"
              aria-label={he ? `${unread} התראות חדשות` : `${unread} unread notifications`}
            >
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0" sideOffset={8}>
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-sm font-semibold">{he ? 'התראות' : 'Notifications'}</span>
          {unread > 0 && (
            <button
              type="button"
              onClick={markAll}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              {he ? 'סמן הכול כנקרא' : 'Mark all read'}
            </button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              {he ? 'טוען…' : 'Loading…'}
            </p>
          ) : items.length === 0 ? (
            <div className="px-3 py-10 text-center">
              <Bell className="mx-auto mb-2 h-6 w-6 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                {he ? 'אין התראות עדיין' : 'No notifications yet'}
              </p>
            </div>
          ) : (
            items.map((n) => {
              const { title, body } = notificationCopy(n, locale)
              const Icon = ICONS[n.type] ?? Bell
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => openItem(n)}
                  className={cn(
                    'flex w-full items-start gap-3 px-3 py-2.5 text-start transition-colors hover:bg-muted/60',
                    !n.is_read && 'bg-primary/5',
                  )}
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">{title}</span>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {relativeTime(n.created_at, locale)}
                      </span>
                    </span>
                    <span className="line-clamp-2 text-xs text-muted-foreground">{body}</span>
                  </span>
                  {!n.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                </button>
              )
            })
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t">
            <Link
              href="/notifications"
              className="block px-3 py-2.5 text-center text-sm font-medium text-primary transition-colors hover:bg-muted/60"
            >
              {he ? 'הצג את כל ההתראות' : 'See all notifications'}
            </Link>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
