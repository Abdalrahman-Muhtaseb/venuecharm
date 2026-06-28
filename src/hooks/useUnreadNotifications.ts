'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Live count of unread notifications for the signed-in user. RLS scopes the
 * `notifications` SELECT to the user's own rows, so a plain count is correct.
 * Re-counts on any Realtime change. Mirrors useUnreadMessages.
 */
export function useUnreadNotifications(): number {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const supabase = createClient()
    let userId: string | null = null
    let channel: ReturnType<typeof supabase.channel> | null = null
    let cancelled = false

    const refresh = async () => {
      if (!userId) return
      const { count: c } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('is_read', false)
      if (!cancelled) setCount(c ?? 0)
    }

    supabase.auth.getUser().then(({ data }) => {
      if (cancelled || !data.user) return
      userId = data.user.id
      refresh()
      channel = supabase
        .channel(`unread-notifications-${Math.random().toString(36).slice(2)}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => refresh())
        .subscribe()
    })

    return () => {
      cancelled = true
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  return count
}
