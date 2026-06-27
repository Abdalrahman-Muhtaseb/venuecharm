import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { MessageThread } from '@/components/messaging/MessageThread'
import {
  defaultLocale,
  getDictionary,
  isLocale,
  localeCookieName,
  type Locale,
} from '@/lib/i18n'

type UserRow = { first_name: string | null; last_name: string | null; email: string }

function displayName(u: UserRow | null, fallback: string): string {
  if (!u) return fallback
  const name = `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim()
  return name || u.email || fallback
}

export default async function NewMessagePage({
  searchParams,
}: {
  searchParams: { venue?: string }
}) {
  const locale: Locale = isLocale(cookies().get(localeCookieName)?.value)
    ? (cookies().get(localeCookieName)!.value as Locale)
    : defaultLocale
  const t = getDictionary(locale).messages

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const venueId = searchParams.venue
  if (!venueId) redirect('/messages')

  const { data: venue } = await supabase
    .from('venues')
    .select('id, title, host_id')
    .eq('id', venueId)
    .single()

  // Can't compose to a missing venue or to your own listing.
  if (!venue || venue.host_id === user.id) redirect('/messages')

  // Resume instead of composing if a thread already exists.
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('renter_id', user.id)
    .eq('host_id', venue.host_id)
    .eq('venue_id', venue.id)
    .is('booking_id', null)
    .maybeSingle()

  if (existing) redirect(`/messages/${existing.id}`)

  // Host name is a cross-user read → admin client (read-only, server-only).
  const { data: hostRow } = await createAdminClient()
    .from('users')
    .select('first_name, last_name, email')
    .eq('id', venue.host_id)
    .single()

  return (
    <MessageThread
      currentUserId={user.id}
      initialMessages={[]}
      otherName={displayName(hostRow as UserRow | null, t.unknownUser)}
      venueTitle={venue.title}
      locale={locale}
      draftVenueId={venue.id}
    />
  )
}
