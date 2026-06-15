import { notFound, redirect } from 'next/navigation'
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

export default async function MessageThreadPage({ params }: { params: { id: string } }) {
  const locale: Locale = isLocale(cookies().get(localeCookieName)?.value)
    ? (cookies().get(localeCookieName)!.value as Locale)
    : defaultLocale
  const t = getDictionary(locale).messages

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // RLS restricts SELECT to participants — non-participants get null.
  const { data: convo } = await supabase
    .from('conversations')
    .select('id, venue_id, booking_id, renter_id, host_id')
    .eq('id', params.id)
    .single()

  if (!convo || (convo.renter_id !== user.id && convo.host_id !== user.id)) notFound()

  const otherId = convo.renter_id === user.id ? convo.host_id : convo.renter_id

  const admin = createAdminClient()
  const [otherRes, venueRes, messagesRes] = await Promise.all([
    admin.from('users').select('first_name, last_name, email').eq('id', otherId).single(),
    convo.venue_id
      ? admin.from('venues').select('title').eq('id', convo.venue_id).single()
      : Promise.resolve({ data: null as { title: string } | null }),
    supabase
      .from('messages')
      .select('id, sender_id, content, created_at')
      .eq('conversation_id', convo.id)
      .order('created_at', { ascending: true }),
  ])

  const otherName = displayName(otherRes.data as UserRow | null, t.unknownUser)
  const venueTitle = venueRes.data?.title ?? null

  return (
    <MessageThread
      conversationId={convo.id}
      currentUserId={user.id}
      initialMessages={messagesRes.data ?? []}
      otherName={otherName}
      venueTitle={venueTitle}
      locale={locale}
    />
  )
}
