'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { NotificationRow } from '@/lib/notification-copy'

const PAGE_SIZE = 20

interface UseNotifications {
  items: NotificationRow[]
  unread: number
  loading: boolean
  /** Optimistically flip every row to read (server action persists it). */
  markAllReadLocal: () => void
}

/**
 * Live notification feed for the signed-in user. RLS scopes the `notifications`
 * SELECT to the user's own rows, so a plain query is already correct. Re-fetches
 * the recent slice on any Realtime change to `notifications` (new row, read flip).
 * Mirrors the proven useUnreadMessages pattern.
 */
export function useNotifications(): UseNotifications {
  const [items, setItems] = useState<NotificationRow[]>([])
  const [loading, setLoading] = useState(true)
  const userId = useRef<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    let channel: ReturnType<typeof supabase.channel> | null = null
    let cancelled = false

    const refresh = async () => {
      if (!userId.current) return
      const { data } = await supabase
        .from('notifications')
        .select('id, type, data, link, is_read, created_at')
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE)
      if (!cancelled) {
        setItems((data ?? []) as NotificationRow[])
        setLoading(false)
      }
    }

    supabase.auth.getUser().then(({ data }) => {
      if (cancelled || !data.user) {
        setLoading(false)
        return
      }
      userId.current = data.user.id
      refresh()
      channel = supabase
        .channel(`notifications-feed-${Math.random().toString(36).slice(2)}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => refresh())
        .subscribe()
    })

    return () => {
      cancelled = true
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  const markAllReadLocal = useCallback(() => {
    setItems((prev) => prev.map((n) => (n.is_read ? n : { ...n, is_read: true })))
  }, [])

  const unread = items.reduce((acc, n) => acc + (n.is_read ? 0 : 1), 0)

  return { items, unread, loading, markAllReadLocal }
}
