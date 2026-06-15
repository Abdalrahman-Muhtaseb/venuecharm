'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Live count of inbound unread messages for the signed-in user.
 * RLS scopes the `messages` SELECT to the user's own conversations, so a plain
 * count over not-mine + unread rows is already correct. Re-counts on any
 * Realtime change to `messages` (new inbound message, or read receipts).
 */
export function useUnreadMessages(): number {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const supabase = createClient()
    let userId: string | null = null
    let channel: ReturnType<typeof supabase.channel> | null = null
    let cancelled = false

    const refresh = async () => {
      if (!userId) return
      const { count: c } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('is_read', false)
        .neq('sender_id', userId)
      if (!cancelled) setCount(c ?? 0)
    }

    supabase.auth.getUser().then(({ data }) => {
      if (cancelled || !data.user) return
      userId = data.user.id
      refresh()
      channel = supabase
        .channel('unread-messages')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => refresh())
        .subscribe()
    })

    return () => {
      cancelled = true
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  return count
}
