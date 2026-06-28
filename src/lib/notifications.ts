import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import type { NotificationType, NotificationData } from '@/lib/notification-copy'

interface NotifyInput {
  userId: string
  type: NotificationType
  data?: NotificationData
  /** In-app path the bell item links to, e.g. `/host/bookings/<id>`. */
  link?: string
}

/**
 * Insert one notification for a recipient. Fire-and-forget: any failure is logged
 * and swallowed so it never blocks the booking / message / review flow that
 * triggered it (same contract as the email senders in src/lib/email.ts).
 *
 * Uses the service-role admin client because the recipient is almost always a
 * DIFFERENT user than the actor (user_id != auth.uid()), which RLS would block.
 */
export async function notify({ userId, type, data = {}, link }: NotifyInput): Promise<void> {
  if (!userId) return
  try {
    const admin = createAdminClient()
    const { error } = await admin.from('notifications').insert({
      user_id: userId,
      type,
      data,
      link: link ?? null,
    })
    if (error) console.error('notify: insert failed', error.message)
  } catch (err) {
    console.error('notify: unexpected error', err)
  }
}
