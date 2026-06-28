'use server'

import { createClient } from '@/lib/supabase/server'

async function requireUser() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')
  return { supabase, user }
}

/** Mark every unread notification for the current user as read. */
export async function markAllNotificationsRead() {
  const { supabase, user } = await requireUser()
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false)
}

/** Mark a single notification as read (RLS scopes the write to the owner). */
export async function markNotificationRead(notificationId: string) {
  const { supabase, user } = await requireUser()
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', user.id)
}
