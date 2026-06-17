'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthUrl, isGoogleCalendarConfigured } from '@/lib/google-calendar'

/** Begin the Google Calendar OAuth flow — returns the consent URL to redirect to. */
export async function startCalendarConnect(): Promise<{ url: string }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  if (!isGoogleCalendarConfigured()) {
    throw new Error('Google Calendar is not configured.')
  }

  // state = host id; the callback requires a matching authenticated session.
  return { url: getAuthUrl(user.id) }
}

export async function disconnectCalendar(): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await createAdminClient()
    .from('host_calendar_connections')
    .delete()
    .eq('host_id', user.id)

  revalidatePath('/host/calendar')
}
